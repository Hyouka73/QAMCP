# **ET-03 — Informe de evaluación tecnológica independiente de QAP**

**Navegadores, automatización y ejecución**

| Identificación                                         | Valor                                                    |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Destinatario                                           | Orquestador Principal de QAP                             |
| Especialidad                                           | ET-03                                                    |
| Repositorio                                            | Hyouka73/QAMCP                                           |
| Rama exclusiva                                         | `develop`                                                |
| SHA del encargo                                        | `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029`               |
| SHA base normativo y de código fijado por los encargos | `1a81e86c9b17a95a04e40237eff5fb99215bae5a`               |
| Fecha de investigación                                 | 26 de noviembre de 2026                                  |
| Naturaleza                                             | Evaluación tecnológica documental                        |
| Dictamen                                               | **CONDICIONADO — Candidatos tecnológicos identificados** |
| Implementación y experimentación                       | No autorizadas ni realizadas                             |

## **1. Resumen ejecutivo**

### **1.1. Dictamen tecnológico**

Recomiendo **conservar Playwright como candidato principal de automatización, reconstruir selectivamente la arquitectura de Discovery y ejecución de QAP, y desacoplar los contratos funcionales del proveedor de navegación**.

No recomiendo conservar indiscriminadamente el runner actual. Tampoco recomiendo sustituir Playwright exclusivamente por razones de peso, consumo de memoria o preferencia tecnológica.

La investigación identifica problemas importantes de QAP que no son limitaciones intrínsecas de Playwright, sino consecuencias de cómo QAP utiliza sus capacidades.

Entre ellos:

- Dependencias de Playwright fragmentadas entre versiones estables y una versión alpha transitiva.
- Reutilización de contextos de navegador incompatible con el aislamiento exigido.
- Discovery insuficiente para aplicaciones empresariales complejas.
- Selección de navegadores mediante alternativas que pueden modificar silenciosamente la configuración efectiva.
- Esperas técnicas que no acreditan efectos funcionales.
- Dependencias de mecanismos exclusivos de Chromium en determinadas fronteras de seguridad.
- Captura multimedia cuya protección preventiva no está acreditada.
- Ausencia de una acreditación integral de concurrencia, recuperación y consumo de recursos.

Cambiar Playwright por Selenium o Puppeteer no resuelve automáticamente ninguno de los problemas anteriores.

### **1.2. Composición tecnológica recomendada**

| Componente                | Candidato principal                            | Respaldo condicionado                                                |
| ------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| Automatización general    | Playwright Core estable                        | Selenium WebDriver/BiDi                                              |
| Navegador general         | Chromium completo aprovisionado bajo demanda   | Chrome o Edge con identidad y políticas verificadas                  |
| Ejecución ligera          | Chromium Headless Shell                        | Chromium completo en headless                                        |
| Compatibilidad Firefox    | Firefox distribuido por Playwright             | Firefox stock mediante Selenium o Puppeteer BiDi                     |
| Compatibilidad WebKit     | WebKit distribuido por Playwright              | Backend específico para Safari real cuando se requiera esa identidad |
| Discovery                 | Extractor híbrido DOM/ARIA/red/interacción     | Implementación equivalente mediante WebDriver/BiDi                   |
| Scheduler                 | Supervisor local gobernado por núcleo QAP      | Procesos aislados con admisión más conservadora                      |
| Captura multimedia        | Arquitectura C de AR-27                        | Arquitectura A de AR-27                                              |
| Accesibilidad             | axe-core local y procedimientos humanos        | Evaluador equivalente con reglas y licencia verificadas              |
| Pruebas API               | Transporte HTTP autorizado y contrato canónico | Adaptadores específicos calificados                                  |
| Motor de navegador propio | No recomendado                                 | Reconsiderar únicamente ante evidencia material                      |

Las alternativas no son intercambiables automáticamente. Cada una deberá demostrar que satisface las mismas obligaciones en la configuración correspondiente.

### **1.3. Conclusión principal**

**QAP necesita independizarse de Playwright en sus contratos arquitectónicos, pero no necesariamente reemplazar Playwright como tecnología.**

La inversión principal debe dirigirse a la veracidad funcional, autoridad, persistencia de efectos, Discovery profundo, administración de recursos, evidencia y recuperación.

Construir un navegador propio o adoptar otro framework general antes de resolver estos fundamentos probablemente trasladaría los problemas actuales a una infraestructura diferente, con un costo adicional de reconstrucción.

## **2. Fuentes, metodología y límites de la investigación**

### **2.1. Encargos vinculantes**

Se recuperaron íntegramente los dos encargos desde el SHA indicado:

- [Encargo común de evaluación tecnológica](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com).
- [Encargo especializado ET-03](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-03.md?utm_source=chatgpt.com).

El encargo común establece un SHA base normativo y de código diferente del SHA de publicación de los encargos. Se respetó esta distinción al consultar el repositorio.

### **2.2. Fuentes internas principales**

| Referencia | Documento                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01        | [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                          |
| Q02        | [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                     |
| Q03        | [Manifiesto normativo consolidado](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com) |
| Q04        | [Manifiesto AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-ac01.md?utm_source=chatgpt.com)                                  |
| Q05        | [Matriz de aceptación AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-aceptacion-ac01.md?utm_source=chatgpt.com)                 |
| Q06        | [Catálogo delta AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/catalogo-delta-ac01.md?utm_source=chatgpt.com)                          |
| Q07        | [Contratos AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/contratos-ac01.md?utm_source=chatgpt.com)                                    |
| Q08        | [Acta de ratificación DE](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                      |
| Q09        | [Acta de ratificación AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/acta-ratificacion-ac01.md?utm_source=chatgpt.com)                 |
| Q10        | [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                                 |
| Q11        | [Resolución final AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/resolucion-final-ac01.md?utm_source=chatgpt.com)                      |
| Q12        | [Matriz de responsables ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com)                  |
| Q13        | [Contravalidación CV06](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/contravalidacion-chatgpt-high-av06.md?utm_source=chatgpt.com)          |
| Q14        | [Matriz de compatibilidad AV-06](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/matriz-av06.md?utm_source=chatgpt.com)                        |
| Q15        | [Protocolos AV-06](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/protocolos-av06.md?utm_source=chatgpt.com)                                  |
| Q16        | [Fe de correcciones AR-27](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/fe-correcciones-ar27.md?utm_source=chatgpt.com)                     |

### **2.3. Clasificación de evidencias**

| Clasificación            | Significado                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Documentado**          | Capacidad respaldada por fuente primaria del proveedor.                                |
| **Verificado en código** | Comportamiento identificado directamente en el código o configuración fijados por SHA. |
| **Antecedente**          | Resultado o análisis histórico del expediente, no reproducido actualmente.             |
| **Condicionado**         | Ruta tecnológica plausible que necesita acreditar garantías adicionales.               |
| **Indeterminado**        | Evidencia documental insuficiente.                                                     |
| **No soportado**         | La tecnología o modalidad no proporciona la capacidad requerida.                       |

Ninguna clasificación documental equivale a un PASS instalado de QAP.

### **2.4. Limitación material**

Aunque se recuperaron íntegramente ambos encargos y se consultaron los documentos principales, manifiestos, contratos, código y dependencias, parte del expediente extenso se inspeccionó mediante secciones relevantes y extracción selectiva.

No afirmo haber completado una lectura íntegra e independiente de cada fuente histórica fijada en los manifiestos, cada prueba del repositorio ni cada subobligación de las matrices AV-08 y AC-01. Tampoco se verificaron todos los binarios, avisos de seguridad o artefactos de distribución.

En consecuencia, el informe permite formular recomendaciones tecnológicas condicionadas, pero **no acredita el cumplimiento íntegro del procedimiento documental exigido por el encargo común**. El Orquestador deberá conservar esta reserva al integrar sus conclusiones.

## **3. Preservación normativa y mapa de responsabilidad**

### **3.1. Universo normativo**

La inspección de la matriz de responsables ET permitió cotejar nominalmente los siguientes conteos:

Universo normativo total

# **123**

110 REQ + 2 POL + 11 ampliaciones

Cláusulas AC-01

# **65**

Preservadas

Requisitos primarios ET-03

# **23**

Cláusulas primarias ET-03

# **20**

Los 57 registros maestros conservan sus estados:

# **57 registros**

Sin promoción de estados

Validados documentalmente

6

Validación experimental pendiente

17

Pendientes

26

Bloqueantes

8

Este cotejo es nominal y no sustituye la revisión semántica ni la calificación por subobligaciones.

### **3.2. Decisiones empresariales preservadas**

| Decisión                | Restricción aplicable                                     |
| ----------------------- | --------------------------------------------------------- |
| D01–D21                 | Vigentes íntegramente                                     |
| DE-01 A                 | Retención inteligente y protección de evidencia           |
| DE-02 B                 | Captura privada bajo autorización y garantías específicas |
| DE-03 B                 | Calidad integrada, métricas y vetos no compensables       |
| DE-04 A, respaldo B     | Piloto empresarial G6.5 antes de GA                       |
| DE-05 B                 | Accesibilidad AUT y QAP como capacidades diferenciadas    |
| AC-DE-01–07             | B/A/B/A/A/A/A                                             |
| Inteligencia inicial    | HOST + DETERMINISTIC                                      |
| Distribución            | Profesional, local, sin compra o suscripción obligatoria  |
| Persistencia            | SQLite local y autoridad canónica                         |
| Producción y referencia | Lectura acreditada por efecto                             |
| Conformidad instalada   | 100 % de obligaciones y celdas aplicables                 |

No se propone modificar ninguna decisión empresarial.

### **3.3. Filtros eliminatorios**

Una tecnología será inadmisible para una capacidad determinada cuando:

1. Requiera conceder autoridad adicional al HOST.
2. No permita conservar los contratos de aislamiento, custodia o veracidad.
3. Requiera una suscripción obligatoria para el funcionamiento profesional local.
4. Produzca falsos PASS funcionales.
5. Exija reducir silenciosamente la cobertura normativa.
6. No permita una distribución legal y mantenible.
7. Sustituya la modalidad o navegador solicitado sin autorización.
8. Requiera eliminar garantías para obtener mejor rendimiento.

El costo o rendimiento favorable no compensará estos incumplimientos.

## **4. Inventario tecnológico real de QAP**

### **4.1. Dependencias declaradas y resueltas**

El [package.json raíz](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/package.json?utm_source=chatgpt.com), los manifiestos de paquetes y el [pnpm-lock.yaml](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/pnpm-lock.yaml?utm_source=chatgpt.com) muestran:

| Consumidor                   | Dependencia declarada        | Versión resuelta        |
| ---------------------------- | ---------------------------- | ----------------------- |
| Raíz                         | `playwright-core ^1.63.0`    | 1.63.0                  |
| CLI                          | Playwright Core              | 1.63.0                  |
| Auth                         | `playwright-core ^1.62.1`    | 1.62.1                  |
| MCP                          | Playwright Core              | 1.62.1                  |
| Adapter                      | `playwright-core ^1.49.0`    | 1.62.1                  |
| Runner                       | `playwright-core ^1.62.1`    | 1.62.1                  |
| Adapter                      | `@playwright/mcp ^0.0.80`    | 0.0.80                  |
| Transitiva de Playwright MCP | Playwright y Playwright Core | 1.63.0-alpha-2026-08-31 |

**Hallazgo ET03-H01 — Fragmentación de versiones.**

QAP no consume una única revisión de Playwright. Existe una posibilidad material de divergencia entre el navegador aprovisionado y el esperado por el consumidor efectivo.

Esto afecta:

- Diagnóstico e instalación.
- Compatibilidad de APIs.
- Revisiones de Firefox y WebKit.
- Captura multimedia.
- Dependencias nativas.
- Reproducibilidad.
- Seguridad y actualización.
- Tamaño de cachés.

La dependencia alpha existe en el lockfile. Su presencia no demuestra por sí misma que se encuentre cargada o alcanzable durante una ejecución concreta.

### **4.2. Versiones reales de los motores**

Se contrastaron los manifiestos upstream de Playwright 1.62.1, 1.63.0 y 1.65.0.

| Playwright | Chromium / Chrome for Testing | Firefox | WebKit | FFmpeg, revisión |
| ---------- | ----------------------------- | ------- | ------ | ---------------- |
| 1.62.1     | 151.0.7922.34                 | 153.0   | 26.5   | 1011             |
| 1.63.0     | 153.0.8010.12                 | 155.0   | 26.6   | 1011             |
| 1.65.0     | 158.0.8127.18                 | 159.0   | 27.2   | 1013             |

| Playwright | Rev. Chromium y Shell | Rev. Firefox | Rev. WebKit |
| ---------- | --------------------- | ------------ | ----------- |
| 1.62.1     | 1234                  | 1538         | 2336        |
| 1.63.0     | 1243                  | 1543         | 2359        |
| 1.65.0     | 1254                  | 1572         | 2388        |

Fuentes primarias:

- [Manifiesto Playwright 1.62.1](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json?utm_source=chatgpt.com).
- [Manifiesto Playwright 1.63.0](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/browsers.json?utm_source=chatgpt.com).
- [Manifiesto Playwright 1.65.0](https://github.com/microsoft/playwright/blob/v1.65.0/packages/playwright-core/browsers.json?utm_source=chatgpt.com).

Playwright 1.65.0 figura como versión estable publicada el 5 de noviembre en la página de releases consultada. Constituye una referencia contemporánea para evaluación, no una selección definitiva.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



**Advertencia:** las revisiones pueden presentar overrides por plataforma. Por ejemplo, el manifiesto 1.65.0 conserva la revisión WebKit 2251 para macOS 14. Por tanto, no puede atribuirse WebKit 27.2 indiscriminadamente a todos los equipos que utilicen dicha biblioteca.

### **4.3. Código relevante inspeccionado**

| Evidencia de código                                                                                                                                                                       | Observación                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [crawler/dom.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-adapter/src/crawler/dom.ts?utm_source=chatgpt.com#L13)               | Diccionario reducido de etiquetas, extracción estructural limitada y localizadores ordinales.          |
| [crawler/browser.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-adapter/src/crawler/browser.ts?utm_source=chatgpt.com)           | Chromium, headless obligatorio en esa entrada y alternativas Chrome/Edge/distribución incluida.        |
| [crawler/service.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-adapter/src/crawler/service.ts?utm_source=chatgpt.com#L153)      | Proxy, interceptación de recursos, bloqueo de service workers, restricciones de páginas y cancelación. |
| [adapter.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-adapter/src/adapter.ts?utm_source=chatgpt.com#L211)                      | Selección sucesiva de Chrome, Edge y Chromium.                                                         |
| [runner.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/runner.ts?utm_source=chatgpt.com#L354)                         | Import dinámico de Chromium, lanzamiento y configuración de contexto.                                  |
| [lifecycle.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/lifecycle.ts?utm_source=chatgpt.com)                        | Componente de ciclo de vida con contextos separados, limpieza y gestión de señales.                    |
| [wait-for.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/actions/wait-for.ts?utm_source=chatgpt.com)                  | Esperas por visibilidad o tiempo fijo.                                                                 |
| [scoped-browser.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/auth/src/scoped-browser.ts?utm_source=chatgpt.com)                           | Interceptación de solicitudes, WebSocket y CDP Fetch dependiente de Chromium.                          |
| [evidence-artifacts.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/evidence-artifacts.ts?utm_source=chatgpt.com#L882) | Persistencia local adicional mediante DDL y mecanismos de captura.                                     |
| [playwright-detector.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/cli/src/utils/playwright-detector.ts?utm_source=chatgpt.com)            | Detección de dependencias declaradas en package.json. No acredita instalación funcional.               |

### **4.4. Inventario de pruebas existentes**

El árbol del repositorio contiene pruebas relevantes, entre ellas:

| Familia                    | Pruebas identificadas                                                           |
| -------------------------- | ------------------------------------------------------------------------------- |
| Discovery                  | `blackbox-crawler.test.ts`, `active-probes.test.ts`, `network-observer.test.ts` |
| Reconocimiento             | `reconnaissance.test.ts`, `auth-classification.test.ts`                         |
| Ejecución                  | `runner.test.ts`, `runner-safety-honesty.test.ts`                               |
| Aislamiento y recuperación | `lifecycle.test.ts`, `cancellation-drain.test.ts`                               |
| Evidencia                  | `capture-flow.test.ts`, `publication-crash.test.ts`                             |
| Oráculos                   | `generated-oracle-integration.test.ts`                                          |
| Concurrencia y resistencia | `adversarial-stress.test.ts`                                                    |
| Integración Chromium       | `flow-ab-chromium.test.ts`, `provisional-chromium.test.ts`                      |

Se confirma su existencia en el árbol, no su resultado actual ni su cobertura completa. No se ejecutaron.

## **5. Evaluación comparativa de tecnologías**

### **5.1. Playwright Core**

**Referencia candidata:** rama estable 1.65.x, con revisión exacta pendiente de calificación.

Playwright proporciona una combinación especialmente adecuada para QAP: automatización de diferentes motores, contextos independientes, localizadores semánticos, interacción con frames, observación de red y mecanismos de captura.

No obstante, estas capacidades requieren integración correcta y no constituyen una frontera de autoridad por sí mismas.

| Dimensión                           | Evaluación                                      |
| ----------------------------------- | ----------------------------------------------- |
| DOM y localizadores semánticos      | Documentado                                     |
| Contextos independientes            | Documentado                                     |
| Chromium, Firefox y WebKit          | Documentado                                     |
| Chrome y Edge                       | Documentado, condicionado por canal y políticas |
| Captura PNG/WebM                    | Documentado; privacidad pendiente               |
| Ejecución visible/headless          | Documentado por distribución                    |
| Instalación bajo demanda            | Documentado                                     |
| Integración con QAP existente       | Favorable                                       |
| Seguridad por efecto                | Requiere arquitectura QAP                       |
| Testigos funcionales independientes | Requiere arquitectura QAP                       |
| Consumo real                        | Indeterminado                                   |
| Licencia de biblioteca              | Apache-2.0; distribución completa por verificar |

Los contextos no persistentes y las APIs de red son capacidades documentadas. Sin embargo, existen límites de interceptación relacionados con Service Workers.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright+1



**Ventajas específicas para QAP:**

- Permite conservar una parte importante del conocimiento técnico existente.
- Reduce el trabajo de reconstrucción de acciones, localizadores y adaptadores.
- Evita mantener inmediatamente varios frameworks de automatización.
- Ofrece una ruta para cubrir motores distintos de Chromium.
- Facilita el aprovisionamiento selectivo.

**Riesgos:**

- Acoplamiento a revisiones particulares de los navegadores.
- Diferencias entre motores modificados por Playwright y navegadores comerciales reales.
- Dependencia de componentes nativos.
- Consumo de recursos todavía no caracterizado.
- APIs de seguridad específicas de Chromium que no deben extrapolarse.
- Captura nativa sin garantía inherente de exclusión preventiva.

**Dictamen:** APTO COMO CANDIDATO PRINCIPAL, condicionado a reconstrucción selectiva y calificación.

### **5.2. Puppeteer**

**Referencia contemporánea:** Puppeteer y Puppeteer Core 25.19.0, publicados el 25 de noviembre de 2026. La release incluye Chrome 158.0.8127.36.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Puppeteer constituye una alternativa técnicamente válida para automatización de Chrome y Firefox, utilizando CDP o WebDriver BiDi según la configuración.

| Dimensión                   | Evaluación                                    |
| --------------------------- | --------------------------------------------- |
| Automatización Chromium     | Favorable                                     |
| Firefox                     | Documentado mediante BiDi                     |
| WebKit                      | No soportado como backend equivalente         |
| Observación de red          | Documentada, dependiente del protocolo        |
| Captura multimedia          | Condicionada a implementación y configuración |
| Integración TypeScript      | Favorable                                     |
| Migración desde QAP actual  | Costo medio-alto estimado                     |
| Consumo frente a Playwright | Indeterminado                                 |
| Licencia de biblioteca      | Apache-2.0                                    |

Fuentes: [navegadores soportados](https://pptr.dev/supported-browsers?utm_source=chatgpt.com), [WebDriver BiDi](https://pptr.dev/webdriver-bidi?utm_source=chatgpt.com) y [licencia](https://github.com/puppeteer/puppeteer/blob/main/LICENSE?utm_source=chatgpt.com).

Puppeteer soporta automatización BiDi para Chrome y Firefox, pero eso no garantiza equivalencia completa de capacidades entre protocolos ni motores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://pptr.dev\&sz=32)

Puppeteer+1



#### **¿Sería más ligero?**

Potencialmente podría reducir determinadas dependencias de biblioteca o simplificar un perfil exclusivamente Chromium.

Sin embargo, si ambos frameworks ejecutan el mismo navegador, la sustitución no elimina el costo del motor, sus renderizadores, GPU, perfiles, cachés o procesos auxiliares.

No existe evidencia suficiente para afirmar que migrar QAP a Puppeteer reduciría significativamente su RAM, latencia o almacenamiento.

**Dictamen:** CONDICIONADO como respaldo localizado para Chromium/Firefox. No recomendable como sustitución general exclusiva debido a la cobertura de WebKit.

### **5.3. Selenium WebDriver y WebDriver BiDi**

**Referencia contemporánea:** Selenium 4.54, anunciado el 23 de noviembre de 2026.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.selenium.dev\&sz=32)

Selenium



Selenium ofrece una estrategia diferente: automatización basada en protocolos estandarizados y control de navegadores mediante sus respectivos mecanismos de WebDriver.

| Dimensión                    | Evaluación                        |
| ---------------------------- | --------------------------------- |
| Chrome y Edge                | Documentado                       |
| Firefox stock                | Documentado                       |
| Safari real                  | Documentado mediante SafariDriver |
| Automatización bidireccional | Evolución activa                  |
| Compatibilidad empresarial   | Favorable como candidato          |
| Gestión de drivers           | Selenium Manager                  |
| Aislamiento y captura        | Requiere integración específica   |
| Integración con QAP          | Reconstrucción mayor              |
| Licencia de biblioteca       | Apache-2.0                        |

WebDriver BiDi pretende proporcionar comunicación bidireccional estandarizada. Su disponibilidad documental no garantiza que todos los comandos y eventos tengan soporte equivalente en los diferentes navegadores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.selenium.dev\&sz=32)

Selenium+1



Selenium Manager facilita la gestión de navegadores y drivers, pero QAP deberá controlar su comportamiento de red, caché, versiones, telemetría y actualización.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.selenium.dev\&sz=32)

Selenium



#### **Valor estratégico para QAP**

Selenium es especialmente relevante cuando la obligación consiste en evaluar el navegador comercial real, no simplemente otro navegador basado en el mismo motor.

El ejemplo más importante es Safari.

Playwright WebKit no acredita automáticamente el comportamiento de Safari. SafariDriver proporciona una vía específica, aunque Apple documenta restricciones de automatización que incluyen una protección de la ventana frente a interacciones humanas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.apple.com\&sz=32)

Apple Developer Documentation+1



Esto genera una incompatibilidad potencial con escenarios híbridos que requieren interacción humana sobre la misma ventana automatizada.

No debe suponerse que Selenium exige Java para el cliente JavaScript local. Una infraestructura Grid o componentes Java adicionales representan decisiones separadas y no constituyen requisitos para la composición propuesta.

**Dictamen:** APTO COMO CANDIDATO DE RESPALDO ESTRATÉGICO, condicionado por navegador, modalidad, seguridad, multimedia y costo de integración.

### **5.4. Chrome DevTools Protocol directo**

CDP resulta útil como mecanismo especializado de instrumentación Chromium.

Puede complementar:

- Observación avanzada.
- Diagnóstico.
- Identificación de procesos.
- Instrumentación de red.
- Captura de cuadros.
- Inspección de estados específicos.

No recomiendo construir el backend general de QAP directamente sobre CDP.

| Beneficio                               | Riesgo                                       |
| --------------------------------------- | -------------------------------------------- |
| Acceso detallado a Chromium             | Dependencia de un proveedor y sus revisiones |
| Control especializado                   | Mayor mantenimiento de infraestructura       |
| Posible reducción de determinadas capas | Necesidad de reconstruir abstracciones       |
| Instrumentación avanzada                | No proporciona equivalencia con WebKit       |

Incluso Playwright advierte que su conexión mediante CDP tiene menor fidelidad que su protocolo propio de conexión.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



**Dictamen:** componente complementario condicionado. No candidato principal de automatización multiplataforma.

### **5.5. WebdriverIO y herramientas similares**

WebdriverIO, Cypress, Robot Framework y otras plataformas pueden aportar capacidades profesionales de automatización.

No se identificó evidencia suficiente para justificar introducir otra capa general sobre los contratos soberanos de ejecución que QAP necesita mantener.

En particular, QAP debe controlar directamente:

- Admisión.
- Autoridad.
- Planes congelados.
- Reconciliación.
- Publicación.
- Evidencia.
- Estados funcionales.
- Continuidad entre consumidores.

Adoptar un framework adicional que también gobierne estos conceptos podría crear dos autoridades de ejecución.

Estas herramientas pueden considerarse posteriormente como productores externos o adaptadores específicos, conforme a AC-01, sin convertirse necesariamente en el núcleo de QAP.

**Dictamen:** no seleccionadas para la composición principal. Evaluación específica futura cuando una obligación o integración lo justifique.

### **5.6. Motor propio o navegador embebido**

Construir un navegador propio capaz de interpretar aplicaciones empresariales modernas implicaría resolver una superficie considerable de compatibilidad.

Un navegador embebido mediante WebView, Electron, CEF u otra tecnología tampoco constituye automáticamente un sustituto de un navegador real calificado.

| Alternativa                      | Problema principal                                          |
| -------------------------------- | ----------------------------------------------------------- |
| Motor HTML/JavaScript propio     | Compatibilidad, seguridad y mantenimiento desproporcionados |
| WebView del sistema              | Dependencia de proveedor y diferencias por SO               |
| Electron/CEF                     | Continúa incorporando un motor Chromium                     |
| Simulador DOM sin navegador      | Carece de fidelidad de renderizado e interacción real       |
| Navegador exclusivamente textual | No acredita obligaciones visuales ni funcionales completas  |

Un parser HTML o simulador DOM podría ser útil como componente auxiliar para análisis estático, nunca como prueba sustitutiva del AUT real.

**Dictamen:** SIN RUTA DOCUMENTAL SUFICIENTE como sustitución general. Descartado de la composición recomendada actual.

## **6. Comparación tecnológica consolidada**

| Capacidad                       | Playwright               | Puppeteer    | Selenium/BiDi          | CDP directo    |
| ------------------------------- | ------------------------ | ------------ | ---------------------- | -------------- |
| Chromium                        | Documentado              | Documentado  | Documentado            | Documentado    |
| Firefox                         | Documentado              | Documentado  | Documentado            | No             |
| WebKit distribuido              | Documentado              | No           | No equivalente directo | No             |
| Safari real                     | No equivalente           | No           | Documentado            | No             |
| Localizadores semánticos        | Favorable                | Condicionado | Condicionado           | Reconstrucción |
| Contextos de sesión             | Documentado              | Documentado  | Depende del backend    | Reconstrucción |
| Observación de red              | Documentado              | Documentado  | Depende de BiDi        | Documentado    |
| Captura multimedia              | Favorable como candidato | Condicionada | Condicionada           | Condicionada   |
| Autorización por efecto         | Requiere QAP             | Requiere QAP | Requiere QAP           | Requiere QAP   |
| Reconciliación                  | Requiere QAP             | Requiere QAP | Requiere QAP           | Requiere QAP   |
| Reutilización del código actual | Alta                     | Media        | Baja                   | Baja           |
| Consumo comparativo real        | Sin medir                | Sin medir    | Sin medir              | Sin medir      |

La reutilización de código y el esfuerzo de integración son estimaciones cualitativas basadas en la arquitectura observada, no mediciones.

No se asigna puntuación global ponderada. Las garantías obligatorias se evalúan primero; el costo relativo solo permite comparar alternativas que puedan satisfacerlas.

## **7. Navegadores y estrategia de aprovisionamiento**

### **7.1. Chromium completo frente a Headless Shell**

Chromium Headless Shell y Chromium completo no deben considerarse configuraciones equivalentes.

Playwright distribuye un binario independiente para el modo Shell y permite utilizar el navegador completo en el modo headless moderno. Google también distingue ambas modalidades.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright+1



### **Composición candidata de navegación**

**Núcleo soberano QAP**

Autoridad · admisión · contratos · testigos

**Puerto de automatización**

Identidad efectiva y capacidades negociadas

**Playwright Core**

Candidato principal

Chromium completo

Headless Shell

Chrome / Edge

Firefox / WebKit

**Backend alternativo**

Activación por necesidad acreditada

Selenium / BiDi

Firefox stock

SafariDriver

Puppeteer localizado

Un único contrato funcional. Los backends no poseen autoridad independiente ni publican resultados definitivos directamente.

### **7.2. Recomendación por modalidad**

| Modalidad                  | Candidato                         | Condición                                              |
| -------------------------- | --------------------------------- | ------------------------------------------------------ |
| Ejecución visible          | Chromium completo                 | Navegador real, ventana y fidelidad verificadas        |
| Headless de alta fidelidad | Chromium completo                 | Canal y configuración efectiva congelados              |
| Discovery ligero           | Headless Shell                    | Sin pérdida de cobertura requerida                     |
| Regresión Chrome           | Chrome estable o CfT según perfil | No sustituir identidad comercial por motor equivalente |
| Regresión Edge             | Edge estable                      | Políticas y disponibilidad por plataforma              |
| Firefox                    | Distribución Playwright o stock   | Registrar identidad exacta                             |
| WebKit                     | Distribución Playwright           | No declarar certificación Safari                       |
| Safari                     | SafariDriver                      | macOS y capacidades efectivas                          |

### **7.3. Instalación bajo demanda**

Recomiendo evaluar un aprovisionador por capacidades, evitando descargar todos los navegadores, códecs y dependencias especializadas durante la instalación inicial.

El flujo documental candidato sería:

1. Resolver la capacidad solicitada y el perfil autorizado.
2. Identificar el artefacto exacto compatible con SO y CPU.
3. Verificar procedencia, integridad, licencia y dependencias.
4. Aprovisionar mediante staging confinado y cuota autorizada.
5. Ejecutar el doctor funcional en la futura fase autorizada.
6. Promover atómicamente la generación calificada.
7. Habilitar únicamente las capacidades verificadas.

No recomiendo utilizar versiones flotantes mediante `npx` durante la operación ordinaria.

Tampoco recomiendo instalar Chrome o Edge globalmente de manera automática. La documentación de Playwright señala que sus mecanismos de instalación de navegadores comerciales pueden sobrescribir la instalación global existente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



### **7.4. Uso de navegadores previamente instalados**

Es una ruta viable para evitar determinadas descargas adicionales, pero debe cumplir:

- Perfil dedicado a QAP.
- Ausencia de acceso al perfil personal del propietario.
- Identidad comprobada del ejecutable.
- Compatibilidad de protocolo.
- Políticas organizativas registradas.
- Protección de secretos.
- Ausencia de extensiones no autorizadas.
- Actualización y rollback controlados cuando sea posible.
- Calificación por cada versión efectiva.

Un navegador de sistema actualizado automáticamente no es equivalente a un artefacto congelado.

## **8. Matriz multiplataforma**

La siguiente matriz conserva como punto de partida las celdas documentadas por AV-06. Las diferencias de versiones y distribuciones deben volver a verificarse para el candidato exacto finalmente evaluado.

**Leyenda:**

- P: ruta de Playwright documentada.
- S: navegador de sistema candidato.
- E: ruta mediante emulación pendiente.
- I: indeterminado o requiere confirmación del proveedor.
- —: no aplicable a esa distribución.

Cada celda representa **visible / headless**.

| Plataforma          | Shell | Chromium completo | Chrome | Edge  | Firefox PW | WebKit PW |
| ------------------- | ----- | ----------------- | ------ | ----- | ---------- | --------- |
| Windows 11 x64      | — / P | P / P             | S / S  | S / S | P / P      | P / P     |
| Windows 11 ARM64    | — / E | E / E             | S / S  | S / S | E / E      | E / E     |
| macOS Intel x64     | — / P | P / P             | S / S  | S / S | P / P      | P / P     |
| macOS ARM64         | — / P | P / P             | S / S  | S / S | P / P      | P / P     |
| Ubuntu/Debian x64   | — / P | P / P             | S / S  | S / S | P / P      | P / P     |
| Ubuntu/Debian ARM64 | — / P | P / P             | S / S  | I / I | P / P      | P / P     |

Fuente histórica: [matriz AV-06 fijada](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/matriz-av06.md?utm_source=chatgpt.com).

La documentación contemporánea de Playwright conserva soporte para Windows, macOS y determinadas distribuciones Linux, incluyendo arquitecturas x64 y ARM64 en Linux.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



### **Reservas materiales por plataforma**

| Plataforma         | Condición adicional                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Windows ARM64      | Distinguir arquitectura nativa de Node, navegador y helpers. No acreditar por emulación no evaluada. |
| macOS Intel        | Verificar continuidad de soporte upstream y disponibilidad de dependencias.                          |
| macOS ARM64        | Verificar binarios nativos, permisos y protección efectiva de artefactos.                            |
| macOS 14           | Registrar overrides concretos de WebKit.                                                             |
| Linux ARM64        | Confirmar artefactos exactos y disponibilidad del canal Edge.                                        |
| Linux visible      | Requiere entorno gráfico y permisos adecuados.                                                       |
| Safari             | Backend específico macOS; no asumir headless o interacción híbrida equivalente.                      |
| WSL y contenedores | Configuraciones independientes, no acreditadas por Windows o Linux nativo.                           |

**Estado instalado de todas las celdas: pendiente.**

La matriz no acredita que QAP pueda actualmente ejecutar todas estas configuraciones.

## **9. Discovery: reconstrucción tecnológica recomendada**

### **9.1. Hallazgo ET03-H02 — Extracción insuficiente para QA empresarial**

La implementación de `crawler/dom.ts` protege información mediante una extracción restringida, pero limita notablemente la comprensión semántica de la aplicación.

Entre las características verificadas:

- Diccionario reducido de etiquetas.
- Localizadores estructurales ordinales.
- Conteo de encabezados sin interpretación suficiente.
- Ausencia de un modelo profundo de tablas dentro de ese extractor.
- Extracción centrada en el documento evaluado.

Esto puede producir inventarios aparentemente correctos que no representan adecuadamente el funcionamiento empresarial.

Por ejemplo, dos formularios con controles estructuralmente similares pueden tener implicaciones empresariales diferentes.

### **9.2. Extractor híbrido**

Recomiendo combinar fuentes complementarias:

| Fuente                   | Aporte                                  | Limitación                            |
| ------------------------ | --------------------------------------- | ------------------------------------- |
| DOM                      | Estructura, controles y atributos       | No acredita reglas de negocio         |
| ARIA                     | Roles, nombres y semántica accesible    | Puede ser incompleta o incorrecta     |
| Estado visual            | Layout, geometría y elementos visibles  | No demuestra persistencia             |
| Red autorizada           | Correlación entre vistas y endpoints    | Una solicitud no acredita una regla   |
| Interacción autorizada   | Transiciones y comportamiento observado | Requiere política por efecto          |
| Testigos independientes  | Acreditación funcional                  | Depende de disponibilidad y autoridad |
| Documentación versionada | Expectativas y reglas                   | Puede estar desactualizada            |

La arquitectura debe conservar la procedencia de cada observación.

Una inferencia derivada de DOM no puede ascender automáticamente a regla empresarial acreditada.

### **9.3. Identidad de estados y transiciones**

La URL no basta para identificar un estado de una SPA.

La identidad candidata debe considerar, según la capacidad y política aplicables:

- Aplicación e instancia.
- Build observado.
- Perfil y tenant efectivos.
- Ruta.
- Estado semántico.
- Locale.
- Configuración relevante.
- Filtros.
- Dialog o wizard activo.
- Revisión de observación.
- Frontera de cobertura.

Estos elementos deben poder representarse sin persistir secretos ni datos privados innecesarios.

### **9.4. Tratamiento de interfaces complejas**

| Morfología              | Comportamiento requerido                                           |
| ----------------------- | ------------------------------------------------------------------ |
| Tabla virtualizada      | Distinguir filas visibles, población y ventanas recorridas.        |
| Paginación              | Registrar páginas esperadas, visitadas y no evaluadas.             |
| Filtros                 | Verificar cambio funcional y no solo modificación del DOM.         |
| Wizard                  | Registrar estados intermedios, variables y continuidad autorizada. |
| Modal                   | Identificar apertura, controles, foco y cierre.                    |
| SPA con URL constante   | Diferenciar estados y transiciones.                                |
| Shadow DOM abierto      | Inspección autorizada.                                             |
| Shadow DOM cerrado      | Límite explícito y alternativa funcional cuando exista.            |
| Iframe del mismo origen | Identidad y cobertura por frame.                                   |
| Iframe cross-origin     | Autoridad independiente y límites documentados.                    |
| Popups                  | Admisión y política propia.                                        |
| Descargas               | Identidad, custodia, tipo y procedencia verificables.              |

### **9.5. Localizadores y drift**

Recomiendo una estrategia de localización semántica por evidencia, no una sustitución automática de selectores basada en semejanza.

La reparación deberá conservar:

- Intención original.
- Control funcional esperado.
- Estado previo.
- Acción y efecto.
- Expectativa congelada.
- Testigo requerido.

Un botón visualmente parecido que realiza otra operación no constituye una reparación válida.

**Dictamen:** APTO COMO CANDIDATO para extractor híbrido sobre Playwright. CONDICIONADO hasta EXP-02 y calificación ciega.

## **10. Fidelidad frente a seguridad**

### **10.1. Hallazgo ET03-H03 — Discovery restringido y ejecución fiel**

QAP dispone actualmente de mecanismos restrictivos que limitan recursos, WebSockets, Service Workers y determinadas transiciones.

Estas medidas pueden resultar apropiadas para reconocimiento restringido. No deben utilizarse indiscriminadamente cuando la obligación consiste en acreditar el comportamiento real del AUT.

Playwright reconoce limitaciones de interceptación cuando intervienen Service Workers y documenta su bloqueo como solución para determinados casos de observabilidad.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



El bloqueo modifica la configuración efectiva. En aplicaciones que dependen de Service Workers podría alterar el comportamiento.

### **10.2. Separación de perfiles operativos**

| Perfil                     | Finalidad                          | Límite                                                 |
| -------------------------- | ---------------------------------- | ------------------------------------------------------ |
| Reconocimiento restringido | Inventario inicial de bajo riesgo  | No acredita fidelidad completa                         |
| Discovery fiel autorizado  | Observación de funcionamiento real | Recursos legítimos permitidos                          |
| Ejecución funcional QA     | Acciones y efectos autorizados     | Grants y testigos específicos                          |
| Producción/referencia      | Lectura acreditada                 | No mutaciones por conveniencia                         |
| Manual/híbrido             | Continuidad profesional guiada     | No atribuir al runtime acciones externas no observadas |

Estos perfiles son configuraciones de ejecución, no nuevos modos de inteligencia.

### **10.3. Reglas de fidelidad**

No se deberá mejorar el rendimiento eliminando silenciosamente:

- JavaScript.
- CSS.
- Imágenes.
- Fuentes.
- Hidratación.
- Solicitudes legítimas.
- Estado necesario para el flujo.

Podrá bloquearse un recurso expresamente no autorizado. Si su ausencia impide evaluar el AUT correctamente, deberá registrarse la brecha correspondiente.

La conclusión correcta ante una imposibilidad de observar un comportamiento bajo la autoridad disponible puede ser BLOCKED o INDETERMINATE, conforme al contrato normativo aplicable.

No debe generarse un PASS ficticio para evitar registrar una limitación.

## **11. Ejecución funcional y testigos**

### **11.1. Hallazgo ET03-H04 — Aislamiento de sesiones insuficiente**

El runner crea un contexto y una página que se reutilizan durante la ejecución del plan.

Aunque existe `RunnerLifecycle`, su mera presencia no garantiza que el recorrido canónico utilice contextos aislados por caso.

Recomiendo separar:

| Nivel              | Responsabilidad                                         |
| ------------------ | ------------------------------------------------------- |
| Proceso navegador  | Reutilización solo bajo garantías calificadas           |
| Contexto           | Aislamiento por caso o ámbito explícitamente autorizado |
| Página             | Superficie funcional del caso                           |
| Flujo E2E          | Continuidad declarada y gobernada                       |
| Identidad y sesión | Control de Auth y política efectiva                     |

La reutilización de un proceso con contextos independientes es una hipótesis de optimización válida. No representa una frontera de seguridad frente a código local hostil.

Cuando la amenaza o riesgo lo requiera, deberán utilizarse procesos o principales de ejecución separados.

### **11.2. Hallazgo ET03-H05 — Esperas técnicas insuficientes**

El archivo `wait-for.ts` implementa fundamentalmente espera por visibilidad o tiempo.

Esto no satisface por sí mismo AC01-16.04.

Recomiendo separar cinco categorías de espera:

| Categoría                  | Ejemplo                           |
| -------------------------- | --------------------------------- |
| Disponibilidad técnica     | El navegador responde             |
| Preparación de interacción | El control está habilitado        |
| Transición                 | Se alcanza un nuevo estado        |
| Convergencia funcional     | Se confirma el efecto esperado    |
| Reconciliación             | Se resuelve un resultado incierto |

Cada espera debe tener presupuesto, criterio y causa de expiración.

### **11.3. Niveles de testigos**

Se preserva AR-09 y la jerarquía N0–N3. Las siguientes observaciones no sustituyen el contrato completo de oráculos:

| Observación                                    | Acreditación posible                    |
| ---------------------------------------------- | --------------------------------------- |
| Un botón aparece                               | Visibilidad                             |
| Un botón recibe un clic                        | Interacción técnica                     |
| HTTP 201                                       | Respuesta del transporte/contrato       |
| Mensaje de éxito                               | Observación de interfaz                 |
| Consulta posterior autorizada y correlacionada | Posible testigo de persistencia         |
| Testigo independiente del efecto conjunto      | Acreditación según el oráculo aplicable |

Un clic exitoso, mensaje de confirmación o código HTTP no basta para acreditar una mutación empresarial.

QAP deberá preservar los seis veredictos establecidos en AR-52, los cuatro ejes correspondientes y las reglas de proyección de CI.

### **11.4. Reintentos y reconciliación**

La tecnología de automatización no debe tener autoridad para decidir por sí misma un nuevo envío mutativo.

**Intención y autorización persistidas**

**Despacho del efecto**

**Testigo suficiente**

Registrar efecto y resultado acreditado.

**Resultado incierto**

Mantener barrera y reconciliar.

**Continuidad gobernada**

No reenviar un efecto incierto sin garantía acreditada.

Ante un corte posterior al despacho, cerrar el navegador no demuestra que el efecto no haya ocurrido.

La cancelación técnica y la terminalidad empresarial son dimensiones distintas.

## **12. Scheduler, recursos y concurrencia**

### **12.1. Hallazgo ET03-H06 — Scheduler soberano obligatorio**

No recomiendo delegar la totalidad de la planificación de concurrencia a Playwright Test, Selenium Grid, un HOST o un pool genérico.

Estas tecnologías pueden administrar mecanismos locales de ejecución, pero QAP debe conservar la admisión y las barreras de negocio.

La composición candidata comprende:

| Componente         | Responsabilidad                                   |
| ------------------ | ------------------------------------------------- |
| Scheduler canónico | Decide admisión, dependencias y prioridades       |
| Supervisor local   | Controla identidad y árbol de procesos            |
| Worker             | Ejecuta operaciones admitidas                     |
| Browser manager    | Gestiona contextos, procesos y reciclaje          |
| Resource observer  | Mide capacidad y presión efectiva                 |
| Effect barrier     | Conserva incertidumbre y conflictos empresariales |
| Evidence broker    | Admite y controla productores de medios           |

### **12.2. Estrategia de concurrencia**

Se preserva CV06-03.

| Estado                | Comportamiento                                             |
| --------------------- | ---------------------------------------------------------- |
| W=0                   | No admitir trabajos nuevos si no existe reserva suficiente |
| W=1                   | Referencia y fallback temporal                             |
| W>1                   | Seleccionable cuando se acredite viabilidad                |
| Presión de recursos   | Reducir admisión y aplicar backpressure                    |
| Trabajo incompatible  | Mantener espera gobernada                                  |
| Trabajo independiente | Permitir progreso cuando sea elegible                      |

No se propone un límite permanente de workers.

El valor W representa capacidad admitida según obligaciones, recursos y conflictos, no simplemente el número de pestañas abiertas.

### **12.3. Estrategias de aislamiento comparables**

| Estrategia                                  | Costo relativo esperado  | Riesgo                                         |
| ------------------------------------------- | ------------------------ | ---------------------------------------------- |
| Proceso nuevo por unidad                    | Mayor arranque           | Menor aprovechamiento de procesos              |
| Proceso reutilizado con contextos separados | Menor arranque potencial | Contaminación si se usa incorrectamente        |
| Reciclaje tras drenaje                      | Intermedio               | Complejidad de lifecycle                       |
| Procesos segregados por riesgo              | Mayor consumo potencial  | Complejidad operativa                          |
| Navegadores permanentemente abiertos        | Consumo ocioso           | Incompatible como estrategia general de reposo |

Estas diferencias representan hipótesis razonadas. EXP-03 deberá establecer cuáles son efectivamente favorables.

### **12.4. Alternancia entre aplicaciones**

La alternancia A→B→C→A y entre cuatro o más aplicaciones deberá conservar conocimiento sin exigir que todos los navegadores permanezcan abiertos.

Para conseguirlo, ET-03 depende de ET-02 y ET-01:

- Los checkpoints serán durables.
- La reapertura resolverá la identidad efectiva.
- Los permisos se revalidarán.
- Las sesiones se recuperarán mediante mecanismos autorizados.
- Los efectos inciertos conservarán sus barreras.
- El conocimiento no dependerá de una pestaña abierta.

### **12.5. Wizards vivos**

Un wizard que no pueda reconstruirse inmediatamente puede necesitar una reserva temporal de recursos.

Debe existir distinción entre:

- Wizard vivo con estado no recuperable.
- Checkpoint recuperable.
- Sesión manual pausada.
- Efecto empresarial incierto.

No se mantendrá capacidad indefinidamente por comodidad.

La duración de las reservas deberá justificarse mediante EXP-03.

## **13. Concurrencia funcional compuesta del AUT**

### **13.1. Interpretación de AC-DE-06 A**

La concurrencia funcional empresarial no equivale a ejecutar muchos tests al mismo tiempo.

Una prueba profesional puede necesitar dos actores que intenten operar sobre el mismo recurso para verificar que la aplicación conserva una invariante de negocio.

El scheduler debe admitir explícitamente una unidad compuesta como titular de la reserva de conflicto correspondiente.

**Unidad compuesta autorizada**

Reserva exclusiva frente a tareas incompatibles locales

**Actor A**

Identidad · intención · grant

**Actor B**

Identidad · intención · grant

**Recurso empresarial dedicado**

Solapamiento efectivo acreditado por testigo

**Reconciliación conjunta**

Subefectos · terminalidad · invariante · cleanup

### **13.2. Requisitos técnicos**

La composición debe registrar por participante:

| Campo conceptual     | Finalidad                            |
| -------------------- | ------------------------------------ |
| Identidad efectiva   | Separación de actores                |
| Grant                | Autoridad por operación y efecto     |
| Correlación          | Vinculación de despacho y resultado  |
| Intención persistida | Recuperación                         |
| Subefecto            | Reconciliación individual            |
| Fence                | Protección de coordinación gobernada |
| Ventana              | Terminalidad y efectos tardíos       |
| Idempotencia         | Reintento seguro cuando proceda      |

Una barrera local de lanzamiento no demuestra por sí sola concurrencia efectiva dentro del AUT.

### **13.3. Controles obligatorios de EXP-05b**

| Control                        | Resultado exigido                  |
| ------------------------------ | ---------------------------------- |
| Dos actores y recurso dedicado | Solapamiento verificable           |
| AUT sano                       | Invariante conjunta acreditada     |
| Mutante de doble reserva       | Detección del defecto              |
| Falta de solapamiento          | No acreditar concurrencia          |
| Contaminación externa          | Bloqueo o ausencia de acreditación |
| Pérdida de ACK                 | Reconciliación                     |
| Efecto tardío                  | Conservación de barrera            |
| Revocación de un participante  | Detener nuevos despachos afectados |
| Tercero incompatible           | Impedir admisión                   |
| Rama independiente             | Permitir progreso autorizado       |
| Reinicio del ejecutor          | Recuperar estado sin duplicación   |

QAP no podrá prometer exclusión global entre instalaciones independientes.

**Dictamen:** CONDICIONADO. Ninguna biblioteca de automatización evaluada proporciona por sí sola este contrato.

## **14. Modalidades manual y híbrida**

AC-DE-01 B exige operación profesional sin dependencia obligatoria de IA.

Por tanto, el executor deberá admitir pasos manuales y automáticos dentro del mismo contrato canónico.

La modalidad híbrida no podrá convertirse en un recorrido alternativo que publique resultados con menor rigor.

### **14.1. Contrato de continuidad**

| Situación                     | Comportamiento                         |
| ----------------------------- | -------------------------------------- |
| Paso manual pendiente         | Mantener estado de trabajo             |
| Observación humana registrada | Preservar procedencia                  |
| Paso automático posterior     | Revalidar entradas y dependencias      |
| Pausa prolongada              | Liberar capacidad cuando corresponda   |
| Efecto externo incierto       | Mantener barrera durable               |
| Reanudación                   | Verificar revisión, autoridad y estado |
| Evidencia humana insuficiente | No acreditar automáticamente           |

Fixture vinculante de referencia: tres pasos automáticos, uno humano y dos automáticos, con pausa y reanudación sin repetir indebidamente la preparación.

### **14.2. Incompatibilidad potencial**

Algunos mecanismos de automatización impiden o restringen la intervención humana directa en la ventana controlada.

Esto es particularmente relevante para SafariDriver.

ET-04 y ET-03 deberán verificar si el escenario híbrido requiere:

- La misma ventana.
- El mismo contexto de sesión.
- Transferencia de control.
- Una sesión separada con reconciliación.

No se puede resolver esta incompatibilidad documentalmente mediante una afirmación genérica de soporte manual.

## **15. Captura multimedia y privacidad**

### **15.1. Hallazgo ET03-H07 — El proveedor de captura no garantiza privacidad**

El runner utiliza mecanismos de grabación y enmascaramiento del DOM.

Sin embargo, un enmascaramiento aplicado durante o después de una transición sensible no garantiza que un cuadro anterior no haya capturado información prohibida.

El expediente histórico de AR-27 ya identifica un caso de transición SPA hacia MFA en el cual apareció un canario sensible en el medio.

Este antecedente no se reprodujo en esta investigación. Se conserva como evidencia histórica de riesgo.

### **15.2. Alternativas vinculantes**

| Arquitectura                               | Composición                                                    | Dictamen                           |
| ------------------------------------------ | -------------------------------------------------------------- | ---------------------------------- |
| C                                          | Grabador nativo con ubicación protegida, sellado y publicación | Principal condicionada             |
| A                                          | Cuadros por callback, cola acotada y codificador protegido     | Respaldo condicionado              |
| Captura sin protección y borrado posterior | Archivo ordinario seguido de eliminación                       | Inadmisible                        |
| Grabación de imagen fija o vacía           | Artefacto sin evidencia temporal útil                          | Inadmisible como acreditación      |
| Supresión universal                        | Desactivar toda captura                                        | No satisface cobertura obligatoria |

Playwright documenta la API de Screencast desde 1.59 y capacidades de captura y grabación que han evolucionado en versiones posteriores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright+1



La existencia de una API de cuadros no acredita control preventivo sobre todas las transiciones sensibles.

### **15.3. Frontera de admisión**

| Superficie                             | Política                                    |
| -------------------------------------- | ------------------------------------------- |
| Login, MFA y SSO                       | Captura desactivada preventivamente         |
| Renovación de sesión conocida          | Detener captura antes de transición         |
| Superficie admitida y verificada       | Captura conforme al modo autorizado         |
| Transición sensible sin barrera previa | Supresión anticipada del intervalo afectado |
| Aparición genuinamente imprevisible    | Incidente, suspensión y reconciliación      |

Un canario prohibido capturado constituye fallo aunque posteriormente se elimine el archivo.

### **15.4. Dependencia crítica con ET-05 y ET-06**

ET-03 debe proporcionar productores capaces de operar dentro de una frontera cuya seguridad pueda acreditarse.

No corresponde a ET-03 elegir definitivamente:

- Construcción criptográfica.
- KEK y DEK.
- Formato protegido.
- Biblioteca Streaming AEAD.
- Visor.
- Protocolo de lectura posicionada.
- Política de almacenamiento.

La composición deberá integrar estas decisiones sin introducir copias adicionales desprotegidas.

### **15.5. Riesgo de costos ocultos**

La captura puede incorporar procesos adicionales:

- Grabador del proveedor.
- Codificador.
- Multiplexor.
- Broker de custodia.
- Runtime criptográfico.
- Visor.
- Almacenamiento temporal protegido.

Si ET-06 selecciona una biblioteca que requiera otro runtime, por ejemplo una implementación Java de Streaming AEAD, dicho runtime deberá incluirse en EXP-03.

No puede contabilizarse únicamente la RAM de Node y Chromium.

**Dictamen AR-27:** CONDICIONADO. No se identifica todavía una configuración acreditada que cubra todas las celdas obligatorias.

EXP-06a conserva su condición previa de cierre G0 y apertura G1.

## **16. Accesibilidad**

### **16.1. Candidato tecnológico**

Recomiendo axe-core como candidato inicial para evaluación automatizada local.

Su licencia es Mozilla Public License 2.0, que deberá evaluarse respecto a las modificaciones, distribución y avisos correspondientes.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



La tecnología debe complementarse con:

- Navegación por teclado.
- Orden y visibilidad del foco.
- Semántica.
- Comprobaciones de contraste.
- Reflow.
- Estados dinámicos.
- Tecnologías de asistencia representativas.
- Evaluación humana.

W3C establece que la evaluación de conformidad requiere una combinación de comprobaciones automatizadas y humanas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

W3C



### **16.2. Estados de cobertura**

Se conservan los estados AC01-19.06:

| Estado           | Interpretación                                      |
| ---------------- | --------------------------------------------------- |
| EVALUADA         | Comprobación realizada bajo su contrato             |
| PENDIENTE_MANUAL | Evaluación humana requerida                         |
| NO_APLICA        | Inaplicabilidad acreditada                          |
| NO_EVALUABLE     | Instrumentación o condiciones insuficientes         |
| BLOQUEADA        | Impedimento de autoridad u otra condición aplicable |

Estos estados no constituyen nuevos veredictos funcionales.

### **16.3. Separación de obligaciones**

| Objeto                     | Responsable de coordinación |
| -------------------------- | --------------------------- |
| Accesibilidad del AUT      | ET-03                       |
| Accesibilidad de la UI QAP | ET-04                       |
| Visor y reportes           | ET-04/05                    |
| Autoridad y egress         | ET-06                       |
| Resultados canónicos       | ET-01                       |

DE-05 B se mantiene: controles pertinentes automáticos en campañas previamente clasificadas como críticas, y opt-in en las restantes.

No se declara conformidad WCAG integral por ejecutar un scanner.

## **17. Internacionalización, APIs y calidad no funcional**

### **17.1. Internacionalización — REQ-QA-001**

El backend deberá registrar la configuración efectiva de:

- Idioma.
- Locale.
- Zona horaria.
- Moneda.
- Variante funcional.
- Fuentes y renderizado aplicables.

Cambiar la opción `locale` de un contexto no garantiza que el AUT haya cambiado efectivamente su idioma empresarial.

Deberán verificarse traducciones, truncamientos, representación de fechas, monedas y equivalencias de valores mediante testigos adecuados.

Los códigos de resultado permanecerán independientes del idioma.

### **17.2. APIs — REQ-QA-002 y AR-17**

La observación de red puede identificar candidatos a operaciones empresariales.

No concede permiso para reproducirlos.

Se recomienda un puerto de transporte autorizado compartido con ET-07 que conserve:

| Elemento           | Garantía                     |
| ------------------ | ---------------------------- |
| Método y destino   | Autoridad por efecto         |
| Esquema versionado | Conformidad contractual      |
| Payload            | Validación y restricciones   |
| Identidad          | Perfil y tenant efectivos    |
| Respuesta          | Evidencia técnica            |
| Testigo posterior  | Efecto funcional             |
| Correlación        | Reconciliación y procedencia |

UTCP/OpenAPI debe mantenerse en lanzamiento según AR-17.

Su adopción por caso y la biblioteca concreta requieren coordinación con ET-07.

### **17.3. API negativa autorizada**

Se debe distinguir entre:

- Solicitud inválida al plano de control de QAP, que no debe despacharse.
- Payload negativo deliberadamente autorizado contra el AUT.

Un caso negativo válido puede enviar al AUT datos que incumplen una regla empresarial prevista.

Ello no autoriza destinos arbitrarios, fuga de secretos ni relajación de la política de transporte.

### **17.4. Evaluación no funcional acotada**

QAP debe preservar los perfiles profesionales ratificados en AC-DE-05 A.

| Atributo              | Capacidad candidata                                         |
| --------------------- | ----------------------------------------------------------- |
| Seguridad funcional   | Casos autorizados de autenticación, sesión, roles y efectos |
| Rendimiento sintético | Medición contextualizada de operaciones                     |
| Resiliencia           | Interrupción autorizada y reconciliación                    |
| Compatibilidad        | Matriz por configuración real                               |
| Accesibilidad         | Automatización y evaluación humana                          |

No recomiendo construir motores universales de carga, escaneo de seguridad o APM.

### **17.5. Medición temporal**

REQ-QA-004.2 exige distinguir el rendimiento del AUT del consumo de QAP.

Una medición deberá registrar inicio y fin, reloj, entorno, estado, carga, estimador, muestra, instrumentación, incertidumbre y criterio acreditado.

El estado saturado del equipo puede impedir una conclusión válida sobre el AUT.

No se establecerán SLA universales ni percentiles con muestras insuficientes.

## **18. Matriz de trazabilidad de los 23 requisitos primarios**

Las referencias siguientes conservan los identificadores de Q02 y Q12. Se presentan a nivel de capacidad, no como sustitución del desglose normativo de subobligaciones.

| Requisito     | Capacidad y solución candidata              | Calificación futura |
| ------------- | ------------------------------------------- | ------------------- |
| REQ-DIS-001.1 | Bucle autónomo por lotes gobernados         | E3/E4, EXP-02       |
| REQ-DIS-001.2 | Frontera uniforme y cobertura explícita     | E4/E8               |
| REQ-DIS-001.3 | DOM/ARIA, tablas, SPA y estados             | EXP-02              |
| REQ-DIS-001.4 | Observación de red autorizada               | EXP-02/E5           |
| REQ-DIS-001.5 | Diferencias por rol, tenant y configuración | EXP-02/E8           |
| REQ-DIS-001.6 | Grafos de navegación y negocio separados    | E4                  |
| REQ-DIS-001.7 | Checkpoints e invalidación localizada       | EXP-02/E2           |
| REQ-DIS-001.8 | Worker independiente del HOST               | E3/E7               |
| REQ-RUN-001.1 | Contextos aislados y continuidad explícita  | EXP-03/E3           |
| REQ-RUN-001.2 | Integridad y revisión antes del despacho    | E1/E4/E5            |
| REQ-RUN-001.3 | Cuatro ejes de resultado preservados        | E1/E5/E7            |
| REQ-RUN-001.4 | Reconciliación y reintentos gobernados      | EXP-05b/E5          |
| REQ-RUN-001.5 | Cancelación, presión y concurrencia         | EXP-03/E3/E5        |
| REQ-RUN-001.6 | Publicación canónica recuperable            | E2/E6               |
| REQ-QA-001    | Locale y comprobaciones lingüísticas        | E4/E5/E8            |
| REQ-QA-002    | Observación y contrato API                  | EXP-05a/b           |
| REQ-QA-003    | Accesibilidad versionada                    | EXP-06c/E6/E8       |
| REQ-RUN-002.1 | Fidelidad y preferencias efectivas          | EXP-02/04           |
| REQ-OPT-001   | Recursos, alternancia y concurrencia        | EXP-03              |
| REQ-OPT-002   | Compactación sin pérdida normativa          | EXP-01b/02/03       |
| REQ-E2E-001   | Flujo multimódulo y multirol                | EXP-05b/E5/E8       |
| REQ-QA-004.1  | Perfil no funcional acotado                 | E4/E5/E8            |
| REQ-QA-004.2  | Medición temporal contextualizada           | E5/E8               |

Estado global de las filas: CONDICIONADO. No se declara ningún requisito acreditado mediante este informe.

## **19. Matriz de las 20 cláusulas AC-01 primarias**

| Cláusula   | Garantía                       | Implicación tecnológica                       |
| ---------- | ------------------------------ | --------------------------------------------- |
| AC01-07.01 | Ejecución híbrida              | DAG común y barrera durable                   |
| AC01-16.01 | Identidad del build            | Configuración efectiva verificada             |
| AC01-16.02 | Regresión explicable           | Dependencias e invalidación conservadora      |
| AC01-16.03 | Cuarentena gobernada           | Histórico y retest independientes             |
| AC01-16.04 | Esperas semánticas             | Cinco categorías y presupuesto                |
| AC01-16.05 | Drift y reparación             | Equivalencia funcional acreditada             |
| AC01-16.06 | Métricas operativas            | Telemetría contextual y denominador           |
| AC01-19.01 | Perfil no funcional            | Modalidad, criterio y autoridad               |
| AC01-19.02 | Seguridad funcional            | Controles positivos y negativos con efectos   |
| AC01-19.03 | Evaluación temporal            | Instrumentación y muestra suficiente          |
| AC01-19.04 | Resiliencia                    | Fallo real/simulado y reconciliación          |
| AC01-19.05 | Compatibilidad                 | Celdas independientes por configuración       |
| AC01-19.06 | Accesibilidad                  | Scanner y evaluación humana                   |
| AC01-19.07 | Seguridad del producto         | Frontera y entradas no confiables             |
| AC01-21.01 | API negativa                   | Separación control QAP/payload AUT            |
| AC01-21.02 | Unidad concurrente             | Reserva exclusiva y solapamiento              |
| AC01-21.03 | Reconciliación concurrente     | Subefectos y barrera durable                  |
| AC01-22.01 | Eventos y async                | Correlación, orden y terminalidad             |
| AC01-22.02 | Operación masiva parcial       | Resultado por elemento y testigo              |
| AC01-22.03 | Comparación de configuraciones | Procedencia, vigencia y lectura de referencia |

No se contabilizan nuevamente las cláusulas pertenecientes primariamente a otros especialistas.

El Orquestador deberá verificar la unión de las 65 cláusulas y las 123 entradas, evitando duplicar denominadores por responsabilidades cruzadas.

## **20. Registros maestros y dependencias probatorias**

| Registro | Garantía preservada       | Contribución ET-03                    |
| -------- | ------------------------- | ------------------------------------- |
| AR-05    | Campaña autónoma          | Ejecutor independiente y admisión     |
| AR-09    | Testigos causales         | Observación y verificación por efecto |
| AR-10    | Reconciliación y limpieza | Barreras y continuidad                |
| AR-13    | Fuentes documentales      | Descargas y procedencia               |
| AR-16    | Fidelidad                 | Identidad efectiva y modos            |
| AR-17    | UTCP/OpenAPI              | Transporte autorizado                 |
| AR-27    | Privacidad multimedia     | Productores C/A                       |
| AR-29    | Recursos y concurrencia   | Supervisor y scheduler                |
| AR-35    | Accesibilidad             | Evaluación local y humana             |
| AR-43    | E2E                       | Continuidad multirol y multimódulo    |
| AR-53    | Reglas, RBAC y cálculo    | Acciones y testigos suficientes       |

También resultan directamente relevantes AR-36, AR-37, AR-39 y AR-49 por Discovery, instalación, multimedia y optimización.

Los estados registrados permanecen intactos.

No se altera AR-52 ni se sustituyen los requisitos de AR-20, AR-24, AR-40, AR-41 o AR-30.

## **21. Economía de ingeniería**

### **21.1. Costo relativo de las alternativas**

| Actividad                     | Playwright adaptado | Puppeteer  | Selenium/BiDi             | Motor propio |
| ----------------------------- | ------------------- | ---------- | ------------------------- | ------------ |
| Reconstrucción de contratos   | Alta                | Alta       | Alta                      | Alta         |
| Reutilización del adapter     | Alta                | Media      | Baja                      | Muy baja     |
| Reutilización del runner      | Parcial             | Baja-media | Baja                      | Muy baja     |
| Instrumentación semántica     | Media               | Media-alta | Alta                      | Muy alta     |
| Multinavegador                | Favorable           | Limitada   | Favorable con diferencias | Muy costosa  |
| Mantenimiento inicial         | Medio               | Medio-alto | Alto                      | Muy alto     |
| Reconstrucción total estimada | Media-alta          | Alta       | Alta                      | Muy alta     |

Estas categorías son comparaciones cualitativas del trabajo técnico. No representan horas, presupuesto monetario ni estimaciones aprobadas.

La reconstrucción de los contratos soberanos es necesaria con cualquier backend.

### **21.2. Consumo real**

No se dispone de benchmarks comparables de QAP para establecer diferencias absolutas de RAM, CPU o energía.

El consumo deberá descomponerse en:

### **Modelo de costo completo de ejecución**

**Biblioteca y runtime**

Node, backend y dependencias

**Navegador**

Proceso principal, renderizadores, GPU y servicios

**Captura**

Cuadros, codificador, colas y temporales

**Custodia**

Criptografía, broker y almacenamiento

**Operación QAP**

Núcleo, SQLite, supervisor, parsers y visor

**HOST**

Consumo atribuible y contexto del agente

No sumar RSS de procesos como si toda su memoria fuese privada ni omitir procesos auxiliares.

### **21.3. Descarga, instalación y memoria activa**

Son métricas distintas:

| Métrica       | Qué debe medir                                |
| ------------- | --------------------------------------------- |
| Descarga      | Bytes efectivamente transferidos              |
| Instalación   | Espacio ocupado por artefactos y dependencias |
| Staging       | Espacio temporal durante aprovisionamiento    |
| Reposo        | Procesos y recursos sin trabajos admitidos    |
| Actividad     | Árbol completo durante el perfil              |
| Actualización | Coexistencia temporal de generaciones         |
| Recuperación  | Recursos consumidos tras fallo o interrupción |

No se asignan cifras de megabytes o gigabytes sin mediciones.

### **21.4. Equipos modestos**

La estrategia más prometedora para reducir exigencias iniciales consiste en:

- Aprovisionamiento selectivo.
- Cero navegadores de QAP innecesarios en reposo.
- Discovery incremental.
- Reutilización calificada.
- Reciclaje de procesos.
- Concurrencia adaptativa.
- Colas de evidencia acotadas.
- Separación de capacidades opcionales.

No puede establecerse todavía un mínimo de RAM, CPU o almacenamiento.

Ese mínimo debe derivarse de EXP-03, no de los requisitos del fabricante del navegador aislado.

## **22. Licencias, seguridad y mantenimiento**

### **22.1. Inventario preliminar de licencias**

| Componente  | Régimen general                            | Reserva                                   |
| ----------- | ------------------------------------------ | ----------------------------------------- |
| Playwright  | Apache-2.0                                 | Avisos y componentes distribuidos         |
| Puppeteer   | Apache-2.0                                 | Artefactos de navegador separados         |
| Selenium    | Apache-2.0                                 | Drivers, Manager y dependencias           |
| Chromium    | BSD y múltiples licencias de terceros      | SBOM por build                            |
| Firefox     | MPL-2.0 y componentes adicionales          | Distribución modificada y avisos          |
| WebKit      | Licencias múltiples por componente         | Identificar build y obligaciones          |
| Chrome/Edge | Condiciones del proveedor                  | No asumir redistribución libre            |
| axe-core    | MPL-2.0                                    | Cumplimiento por archivos cubiertos       |
| FFmpeg      | Dependiente de configuración y componentes | Verificar LGPL/GPL y build exacto         |
| QAP propio  | ISC declarado en package.json              | Titularidad y decisión MIT/ISC pendientes |

Referencias de licencias: [Playwright](https://github.com/microsoft/playwright/blob/main/LICENSE?utm_source=chatgpt.com), [Puppeteer](https://github.com/puppeteer/puppeteer/blob/main/LICENSE?utm_source=chatgpt.com), [Selenium](https://github.com/SeleniumHQ/selenium/blob/trunk/LICENSE?utm_source=chatgpt.com), [axe-core](https://github.com/dequelabs/axe-core/blob/develop/LICENSE?utm_source=chatgpt.com), [FFmpeg](https://ffmpeg.org/legal.html?utm_source=chatgpt.com).

Esta tabla es una evaluación preliminar. No se completó la inspección jurídica de todos los artefactos binarios redistribuibles.

### **22.2. SBOM**

El inventario deberá distinguir:

1. Dependencia declarada.
2. Dependencia resuelta.
3. Componente empaquetado.
4. Artefacto instalado.
5. Componente cargado.
6. Capacidad alcanzable.
7. Configuración calificada.

La presencia de Playwright MCP alpha en el lockfile no permite concluir automáticamente exposición a una vulnerabilidad.

Tampoco permite ignorarla.

### **22.3. Evaluación de advisories**

Se consultaron las páginas oficiales de avisos de:

- [Playwright](https://github.com/microsoft/playwright/security/advisories?utm_source=chatgpt.com).
- [Puppeteer](https://github.com/puppeteer/puppeteer/security/advisories?utm_source=chatgpt.com).
- [Selenium](https://github.com/SeleniumHQ/selenium/security/advisories?utm_source=chatgpt.com).

No se completó el cotejo exhaustivo GHSA/CVE/OSV de todos los componentes directos, transitivos y binarios efectivos.

Por tanto, no se emite declaración de ausencia de vulnerabilidades ni se atribuyen CVE específicos sin comprobar el rango afectado y la alcanzabilidad.

### **22.4. Estrategia de mantenimiento**

Recomiendo que el Orquestador establezca como condición de selección:

| Evento                        | Respuesta                                                |
| ----------------------------- | -------------------------------------------------------- |
| Nueva versión estable         | Evaluación de compatibilidad                             |
| Vulnerabilidad aplicable      | Triage, mitigación y actualización priorizada            |
| Cambio de navegador comercial | Invalidar calificación afectada                          |
| Fin de soporte SO/CPU         | Evaluar alternativa sin reducción tácita                 |
| Actualización fallida         | Rollback recuperable cuando siga siendo seguro           |
| Artefacto sin procedencia     | Bloquear aprovisionamiento                               |
| Alpha no necesaria            | Retirada después de verificar sustitución y consumidores |

Las versiones fijadas históricamente no deben congelarse indefinidamente por reproducibilidad a costa de seguridad.

### **22.5. Amenazas y frontera**

| Amenaza                     | Control requerido                                    |
| --------------------------- | ---------------------------------------------------- |
| AUT hostil                  | Sandbox y fronteras efectivas                        |
| HOST comprometido           | Comandos declarativos sin autoridad independiente    |
| Escape de red               | Política por destino y efecto, pruebas adversariales |
| Perfil personal reutilizado | Perfiles dedicados                                   |
| Debugging remoto expuesto   | Acceso confinado y autenticado                       |
| Secretos en parámetros      | Referencias opacas y broker                          |
| Temporal multimedia         | Protección desde primera escritura                   |
| Binario sustituido          | Identidad, procedencia y verificación                |
| Proceso huérfano            | Supervisor y reconciliación                          |
| Resultado falsificado       | Publicación canónica y testigos                      |

La ruta que utiliza CDP Fetch en Auth debe tener un equivalente calificado para otros motores. Una interceptación implementada exclusivamente para Chromium no puede considerarse automáticamente una garantía multiplataforma.

## **23. Contratos de coordinación entre especialidades**

Los siguientes nombres son propuestas conceptuales para coordinar interfaces. No constituyen DTO definitivos ni instrucciones de implementación.

### **ET-01 — Núcleo y runtime**

| Contrato              | Responsabilidad                                |
| --------------------- | ---------------------------------------------- |
| ExecutionAdmission    | Autoridad, dependencias, presupuesto y reserva |
| BrowserBackendPort    | Operaciones normalizadas y capacidades         |
| ExecutionCancellation | Cancelación técnica y límites                  |
| EffectBarrier         | Terminalidad y reconciliación                  |
| ExecutionResult       | Resultado canónico                             |

**Dependencia crítica:** el runtime elegido debe poder supervisar Playwright Core o el backend alternativo sin introducir un segundo núcleo.

Si ET-01 selecciona un lenguaje distinto de TypeScript para el núcleo, un worker Node separado puede ser candidato, pero requerirá IPC autenticado, costo medido y compatibilidad de proceso.

### **ET-02 — Persistencia y memoria**

| Contrato            | Responsabilidad                 |
| ------------------- | ------------------------------- |
| DiscoveryCheckpoint | Frontera durable de observación |
| AttemptJournal      | Intenciones y subefectos        |
| ResourceReservation | Admisión y reservas             |
| EvidenceReference   | Identidad del artefacto         |
| RecoveryState       | Reanudación idempotente         |

**Invariante:** los workers no deberán implementar un segundo escritor SQLite ni DDL independiente para resultados definitivos.

### **ET-04 — Interfaz gráfica**

| Contrato              | Responsabilidad                         |
| --------------------- | --------------------------------------- |
| ManualStep            | Progreso y observación humana           |
| BrowserControlHandoff | Transferencia autorizada de control     |
| EffectivePreferences  | Configuración visible/headless y perfil |
| CoverageProjection    | Estados de cobertura                    |
| RuntimeStatus         | Progreso y bloqueos                     |

La GUI no podrá acceder directamente a sesiones de navegador, bases protegidas o credenciales.

### **ET-05 — Documentos, reportes y multimedia**

| Contrato           | Responsabilidad                  |
| ------------------ | -------------------------------- |
| WitnessObservation | Observación tipada y procedencia |
| CaptureProducer    | Producción de PNG/cuadros/video  |
| EvidenceGeneration | Identidad y sincronía            |
| DownloadArtifact   | Adquisición de documentos AUT    |
| MediaAvailability  | Disponibilidad y limitaciones    |

ET-03 no determina el veredicto final a partir de una captura o descarga.

### **ET-06 — Seguridad y distribución**

| Contrato            | Responsabilidad                        |
| ------------------- | -------------------------------------- |
| BrowserIdentity     | Binario y revisión efectiva            |
| SessionCapability   | Acceso autorizado sin secretos al HOST |
| NetworkPolicy       | Destinos y efectos permitidos          |
| CaptureAdmission    | Admisión previa del productor          |
| RuntimeConfinement  | Protección de procesos y temporales    |
| ProvisionedArtifact | Procedencia y generación               |

Es la dependencia más crítica para seleccionar backends adicionales.

### **ET-07 — MCP, agentes, APIs y CI/CD**

| Contrato               | Responsabilidad               |
| ---------------------- | ----------------------------- |
| CampaignIntent         | Intención del consumidor      |
| AuthorizedAPIOperation | Operación contractual         |
| ExternalContribution   | Resultado externo normalizado |
| CapabilityDeclaration  | Capacidades disponibles       |
| CanonicalProjection    | Paridad y códigos             |

MCP, CLI, CI y GUI deberán consumir las mismas operaciones canónicas cuando sean funcionalmente equivalentes.

## **24. Incompatibilidades potenciales entre especialidades**

| ID       | Conflicto                                    | Consecuencia                            | Resolución propuesta                         |
| -------- | -------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| ET03-C01 | Núcleo no Node y Playwright Core             | Runtime adicional                       | Worker local supervisado y medición completa |
| ET03-C02 | Varios escritores SQLite                     | Inconsistencia de resultados            | Autoridad de persistencia única              |
| ET03-C03 | UI embebida utilizada como AUT               | Pérdida de fidelidad                    | Separar superficie QAP y navegador evaluado  |
| ET03-C04 | Auth basado exclusivamente en CDP            | Firefox/WebKit sin frontera equivalente | Calificación específica por backend          |
| ET03-C05 | Criptografía con runtime adicional           | Costos ocultos de memoria y arranque    | Incorporar árbol completo en EXP-03          |
| ET03-C06 | Captura nativa fuera del confinamiento       | Violación de AR-27                      | C condicionada; evaluar A                    |
| ET03-C07 | HOST con automatización directa              | Bypass de políticas QAP                 | Puerto declarativo canónico                  |
| ET03-C08 | GUI híbrida y SafariDriver                   | Restricciones de interacción humana     | Prueba de handoff por modalidad              |
| ET03-C09 | Métricas calculadas desde reportes parciales | Falsa cobertura                         | Denominadores canónicos                      |
| ET03-C10 | Autoactualización comercial                  | Drift de configuración calificada       | Invalidación y revalidación                  |
| ET03-C11 | Optimización por bloqueo de recursos         | Menor fidelidad                         | Separar reconocimiento y ejecución fiel      |
| ET03-C12 | Scheduler de framework autónomo              | Admisión duplicada                      | Núcleo QAP como única autoridad              |

El Orquestador deberá resolver estas incompatibilidades mediante una composición integrada, no seleccionar siete stacks independientemente.

## **25. Reconstrucción selectiva recomendada**

| Componente existente              | Recomendación                     | Justificación                            |
| --------------------------------- | --------------------------------- | ---------------------------------------- |
| Playwright Core                   | Conservar como candidato          | Amplia capacidad y reutilización         |
| Versiones múltiples               | Consolidar tras calificación      | Reducir divergencia de artefactos        |
| Playwright MCP transitivo         | Revisar y retirar si procede      | Alpha y posible duplicación de capacidad |
| Acciones básicas                  | Adaptar                           | Reutilización condicionada al contrato   |
| Localizadores                     | Reconstruir estrategia            | Semántica, drift e identidad             |
| Crawler DOM                       | Reconstruir selectivamente        | Profundidad empresarial insuficiente     |
| Observador de red                 | Adaptar                           | Correlación y límites de autoridad       |
| Runner general                    | Reconstruir coordinación          | Contextos, efectos, recursos             |
| Lifecycle                         | Reutilizar conceptos y pruebas    | Integración efectiva pendiente           |
| Captura nativa                    | Evaluar bajo C                    | Custodia y prevención                    |
| Persistencia directa de evidencia | Sustituir autoridad               | Escritor único                           |
| Detección por package.json        | Complementar con doctor funcional | Presencia no equivale a capacidad        |
| Tests históricos                  | Preservar y clasificar            | No eliminar pruebas para aprobar         |
| Scheduler                         | Reconstrucción arquitectónica     | Admisión soberana                        |

No recomiendo reemplazar todos los archivos o paquetes por el hecho de que la arquitectura objetivo sea distinta.

El criterio deberá ser preservar mecanismos acreditables y sustituir los que sean incompatibles con las garantías normativas.

## **26. Plan de calificación documental futura**

Esta sección define criterios probatorios asociados a experimentos existentes. **No constituye WBS, autorización experimental ni inicio de compuertas.**

### **26.1. EXP-02 — Discovery y fidelidad**

| Elemento         | Criterio                                                  |
| ---------------- | --------------------------------------------------------- |
| Fase prevista    | G2/E4                                                     |
| Fixture          | SPA empresarial sintética con roles, estados y escalas    |
| Variables        | Extractor, motor, modo, locale y política                 |
| Control positivo | Hidratación y efecto funcional correctos                  |
| Control negativo | Mutante visualmente sano sin efecto                       |
| Evidencia        | Inventario independiente, rutas, estados y transiciones   |
| Métricas         | Precisión, recall, cobertura, recursos                    |
| Rechazo          | Falso PASS, pérdida de cobertura o violación de autoridad |
| Respaldo         | Backend alternativo con fixture y autoridad equivalentes  |
| Costo relativo   | Alto                                                      |

No utilizar el corpus ciego de G6 como fixture de desarrollo o selección.

### **26.2. EXP-03 — Scheduler y hardware**

| Elemento         | Criterio                                               |
| ---------------- | ------------------------------------------------------ |
| Fases previstas  | G3 y repetición G5                                     |
| Variables        | W=1/2/4 cuando sean admitidos, aislamiento y reciclaje |
| Fixture          | Alternancia de aplicaciones, roles y perfiles de carga |
| Control positivo | Trabajo independiente progresa bajo reserva            |
| Control negativo | Presión, revocación, caída y espacio insuficiente      |
| Evidencia        | Árbol de procesos y métricas por etapa                 |
| Rechazo          | Cruces de identidad, huérfanos, pérdida de evidencia   |
| Respaldo         | Admisión conservadora temporal                         |
| Costo relativo   | Alto                                                   |

W=1 no debe convertirse en una reducción permanente de la obligación W>1.

### **26.3. EXP-04a y EXP-04b — Aprovisionamiento**

| Elemento         | Criterio                                                         |
| ---------------- | ---------------------------------------------------------------- |
| Fases previstas  | G1 y G5                                                          |
| Fixture          | Instalaciones limpias por SO/CPU                                 |
| Variables        | Motor, canal, modalidad y origen                                 |
| Control positivo | Apertura real, autenticación, SPA e interacción                  |
| Control negativo | Binario alterado, cache corrupta, versión incompatible           |
| Evidencia        | Doctor funcional, SBOM y revisión efectiva                       |
| Rechazo          | Fallback silencioso, instalación no autorizada, incompatibilidad |
| Respaldo         | Artefacto equivalente calificado                                 |
| Costo relativo   | Alto                                                             |

### **26.4. EXP-05a y EXP-05b — Efectos y concurrencia**

| Elemento         | Criterio                                                           |
| ---------------- | ------------------------------------------------------------------ |
| Fixture          | Flujos sintéticos con testigos independientes                      |
| Variables        | UI/API, roles, interrupciones y concurrencia                       |
| Control positivo | Efectos acreditados y exactamente una operación cuando corresponda |
| Control negativo | Respuesta exitosa falsa, mutación indebida y pérdida de ACK        |
| Evidencia        | Intenciones, subefectos, testigos y cleanup                        |
| Rechazo          | Reintentos ciegos, duplicación y falso PASS                        |
| Respaldo         | Transporte alternativo con misma garantía                          |
| Costo relativo   | Alto                                                               |

### **26.5. EXP-06a — Viabilidad multimedia**

| Elemento         | Criterio                                             |
| ---------------- | ---------------------------------------------------- |
| Compuerta        | Antes de cierre G0 y apertura G1                     |
| Brazos           | C y A                                                |
| Fixture          | Login, MFA, SPA, popup, iframe y transiciones        |
| Control positivo | Medio útil generado en superficie admitida           |
| Control negativo | Canario prohibido, temporal desprotegido             |
| Evidencia        | Productores, primer byte y primer cuadro             |
| Rechazo          | Cualquier captura prohibida o escritura no protegida |
| Respaldo         | A si C falla, con garantías idénticas                |
| Costo relativo   | Muy alto                                             |

Si ambas alternativas fracasan en una combinación obligatoria, se mantiene el bloqueo.

### **26.6. EXP-06c — Reproducción, accesibilidad y portabilidad**

| Elemento         | Criterio                                               |
| ---------------- | ------------------------------------------------------ |
| Fases            | G3/G5 y E6                                             |
| Fixture          | Movimiento, PNG por paso y escenarios accesibles       |
| Variables        | SO, motor, modo, códec y carga                         |
| Control positivo | WebM auténtico y reproducción posicionada              |
| Control negativo | Medio alterado, revocación, otro tenant, canario       |
| Evidencia        | Manifiesto, cuadros útiles, seek, foco y cobertura     |
| Rechazo          | Archivo vacío, divulgación, acreditación WCAG ficticia |
| Respaldo         | Productor o visor equivalente                          |
| Costo relativo   | Alto                                                   |

### **26.7. EXP-01b — Contexto y tokens**

La compactación del Discovery debe compararse contra un baseline competente bajo tareas y obligaciones equivalentes.

Contabilizar:

- Tokens observados y estimados por separado.
- Llamadas.
- Bytes.
- Latencia.
- Caché.
- Reintentos.
- Handoff.
- Abandonos.
- Cobertura y calidad.

No se declarará ahorro si depende de menor profundidad, menor cobertura o cierre prematuro.

### **26.8. EXP-08 — Integración de fronteras**

Debe preservarse la dependencia de EXP-08a antes de abrir G1.

La aportación de ET-03 consiste en verificar el transporte entre supervisor, worker, navegador y productores respecto a identidad, aislamiento, autoridad y ciclo de vida.

Las modalidades manual e híbrida se integrarán mediante los contratos de AC-01.

No se propone un experimento adicional independiente en este momento: las incertidumbres principales pueden incorporarse a los expedientes existentes.

## **27. Criterios de aceptación DE-03 B**

Se mantienen los pisos ratificados.

| Criterio                                      | Umbral vinculante  |
| --------------------------------------------- | ------------------ |
| Conformidad instalada                         | 100 %              |
| Precisión Discovery                           | ≥95 %              |
| Recall Discovery                              | ≥85 %              |
| Afirmaciones de efectos                       | ≥85 %              |
| Casos compuestos de efectos                   | ≥85 %              |
| Defectos desconocidos                         | ≥90 %              |
| Defectos críticos                             | 100 %              |
| E2E normativos                                | 100 %              |
| Falsos PASS                                   | 0                  |
| Falsos FAIL                                   | ≤2 %               |
| Falsos FAIL deterministas normativos          | 0                  |
| Abstención injustificada                      | ≤5 %               |
| Bloqueo injustificado                         | ≤5 %               |
| Incumplimiento conjunto                       | ≤5 %               |
| Denegaciones/abstenciones legítimas correctas | 100 %              |
| Violaciones de autoridad/custodia             | 0                  |
| Operaciones MCP normativas                    | 100 %              |
| Paridad de consumidores aplicables            | 100 %              |
| Adopción inicial y final                      | ≥90 % cada una     |
| Autonomía normativa                           | 100 %              |
| G6.5                                          | 100 % y cero vetos |

Las unidades, estratos, denominadores y condiciones detalladas del acta DE-03 continúan siendo vinculantes.

La precisión Discovery no puede compensar una violación de autoridad.

La eficiencia no puede compensar un falso PASS.

La facilidad de instalación no puede compensar una incapacidad obligatoria.

## **28. Registro de riesgos tecnológicos**

| ID       | Riesgo                                       | Impacto | Tratamiento                                      |
| -------- | -------------------------------------------- | ------- | ------------------------------------------------ |
| ET03-R01 | Fragmentación de Playwright                  | Alto    | Identidad y versión efectiva                     |
| ET03-R02 | Dependencia alpha                            | Alto    | Inventario, alcanzabilidad y retirada calificada |
| ET03-R03 | Fallback silencioso                          | Alto    | Configuración explícita                          |
| ET03-R04 | Discovery superficial                        | Crítico | Extractor híbrido y testigo                      |
| ET03-R05 | Cruce de sesiones                            | Crítico | Aislamiento por identidad                        |
| ET03-R06 | Falso PASS funcional                         | Crítico | Testigos independientes                          |
| ET03-R07 | Reintento mutativo ciego                     | Crítico | Barreras durables                                |
| ET03-R08 | Egress no autorizado                         | Crítico | Frontera por backend                             |
| ET03-R09 | Captura sensible                             | Crítico | EXP-06a y C/A                                    |
| ET03-R10 | Consumo excesivo                             | Alto    | EXP-03 y admisión adaptativa                     |
| ET03-R11 | ARM64 insuficientemente soportado            | Alto    | Verificación de artefactos por celda             |
| ET03-R12 | WebKit confundido con Safari                 | Alto    | Identidad diferenciada                           |
| ET03-R13 | Pérdida de compatibilidad por actualización  | Alto    | Recalificación                                   |
| ET03-R14 | Contaminación concurrente externa            | Crítico | Recurso dedicado y testigos                      |
| ET03-R15 | Telemetría no autorizada                     | Alto    | Política de egress                               |
| ET03-R16 | Licencia incompatible de binario             | Alto    | SBOM y revisión                                  |
| ET03-R17 | Ahorro ficticio de tokens                    | Alto    | Comparación pareada                              |
| ET03-R18 | Handoff manual no viable                     | Alto    | Calificación específica                          |
| ET03-R19 | Duplicación de autoridad                     | Crítico | Núcleo y publicación únicos                      |
| ET03-R20 | Escalado de recursos por runtimes auxiliares | Alto    | Medición completa                                |

La clasificación de impacto es cualitativa y se deriva de la consecuencia normativa potencial. No representa una evaluación probabilística de ocurrencia.

## **29. Decisiones resolubles documentalmente y pendientes**

### **29.1. Resolubles mediante arquitectura documental**

| Decisión                        | Recomendación                       |
| ------------------------------- | ----------------------------------- |
| Backend principal candidato     | Playwright Core estable             |
| Backend estratégico alternativo | Selenium WebDriver/BiDi             |
| Motor propio                    | No incluir en composición principal |
| Puppeteer                       | Respaldo localizado                 |
| Distribución de motores         | Aprovisionamiento modular           |
| Contrato de ejecución           | Independiente del proveedor         |
| Autoridad de admisión           | Núcleo QAP                          |
| Discovery                       | Híbrido y persistente               |
| Reintentos                      | Gobernados mediante reconciliación  |
| Accesibilidad                   | Automatizada y humana               |
| Grabación                       | C principal y A respaldo            |

### **29.2. Decisiones que requieren calificación experimental**

| Decisión                            | Expediente                 |
| ----------------------------------- | -------------------------- |
| Versión exacta de Playwright        | EXP-04 y pruebas asociadas |
| Navegador predeterminado por perfil | EXP-02/04                  |
| Viabilidad del Shell                | EXP-02                     |
| Estrategia de reutilización         | EXP-03                     |
| Hardware mínimo                     | EXP-03                     |
| Concurrencia máxima efectiva        | EXP-03                     |
| Presupuestos y reservas             | EXP-03                     |
| Firefox/WebKit y frontera de red    | EXP-04/06                  |
| Cobertura multimedia C/A            | EXP-06a/c                  |
| Estrategia Safari real              | EXP-04/08 según alcance    |
| Reducción efectiva de tokens        | EXP-01b                    |
| Calidad independiente               | E8/G6                      |
| Piloto representativo               | G6.5 autorizado            |

No recomiendo trasladar innecesariamente decisiones técnicas ordinarias al propietario.

Sin embargo, una imposibilidad acreditada de conservar el alcance obligatorio deberá elevarse expresamente, junto con sus consecuencias y alternativas.

## **30. Fuentes primarias externas**

Fecha común de consulta: **26 de noviembre de 2026**.

| Fuente               | Referencia                                                                                                                                   | Aplicación                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Microsoft Playwright | [Releases](https://github.com/microsoft/playwright/releases?utm_source=chatgpt.com)                                                          | Versiones publicadas                 |
| Microsoft Playwright | [Browsers](https://playwright.dev/docs/browsers?utm_source=chatgpt.com)                                                                      | Motores, canales y aprovisionamiento |
| Microsoft Playwright | [Installation](https://playwright.dev/docs/intro?utm_source=chatgpt.com)                                                                     | Plataformas                          |
| Microsoft Playwright | [BrowserContext](https://playwright.dev/docs/api/class-browsercontext?utm_source=chatgpt.com)                                                | Contextos y red                      |
| Microsoft Playwright | [BrowserType](https://playwright.dev/docs/api/class-browsertype?utm_source=chatgpt.com)                                                      | Conexión y lanzamiento               |
| Microsoft Playwright | [Network](https://playwright.dev/docs/network?utm_source=chatgpt.com)                                                                        | Observación e interceptación         |
| Microsoft Playwright | [Service Workers](https://playwright.dev/docs/service-workers?utm_source=chatgpt.com)                                                        | Límites de instrumentación           |
| Microsoft Playwright | [Screencast](https://playwright.dev/docs/api/class-screencast?utm_source=chatgpt.com)                                                        | Productores multimedia               |
| Puppeteer            | [Releases](https://github.com/puppeteer/puppeteer/releases?utm_source=chatgpt.com)                                                           | Versión 25.19.0                      |
| Puppeteer            | [Supported browsers](https://pptr.dev/supported-browsers?utm_source=chatgpt.com)                                                             | Compatibilidad                       |
| Puppeteer            | [System requirements](https://pptr.dev/guides/system-requirements?utm_source=chatgpt.com)                                                    | Runtime y plataformas                |
| Puppeteer            | [BiDi](https://pptr.dev/webdriver-bidi?utm_source=chatgpt.com)                                                                               | Chrome y Firefox                     |
| Selenium             | [Release 4.54](https://www.selenium.dev/blog/2026/selenium-4-54-released/?utm_source=chatgpt.com)                                            | Versión contemporánea                |
| Selenium             | [WebDriver BiDi](https://www.selenium.dev/documentation/webdriver/bidi/?utm_source=chatgpt.com)                                              | Automatización bidireccional         |
| Selenium             | [Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/?utm_source=chatgpt.com)                                          | Gestión de artefactos                |
| Google               | [Chrome Headless](https://developer.chrome.com/docs/automation-and-testing/headless?utm_source=chatgpt.com)                                  | Distinción Shell/completo            |
| Google               | [Chrome for Testing](https://developer.chrome.com/docs/automation-and-testing/download-test-binaries?utm_source=chatgpt.com)                 | Binarios de pruebas                  |
| Apple                | [Testing with WebDriver in Safari](https://developer.apple.com/documentation/webkit/testing-with-webdriver-in-safari?utm_source=chatgpt.com) | SafariDriver                         |
| Apple                | [Safari WebDriver](https://developer.apple.com/documentation/safari-developer-tools/webdriver/?utm_source=chatgpt.com)                       | Restricciones de sesión              |
| W3C                  | [WebDriver BiDi](https://www.w3.org/TR/webdriver-bidi/?utm_source=chatgpt.com)                                                               | Protocolo en evolución               |
| W3C                  | [WCAG 2.2](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)                                                                             | Accesibilidad                        |
| W3C                  | [Understanding Conformance](https://www.w3.org/WAI/WCAG22/Understanding/conformance?utm_source=chatgpt.com)                                  | Evaluación automatizada y humana     |
| Deque                | [axe-core](https://github.com/dequelabs/axe-core?utm_source=chatgpt.com)                                                                     | Evaluador local candidato            |

Las fuentes vivas deberán fijarse por revisión o release durante la selección exacta. Las capacidades documentadas no constituyen garantías probadas sobre QAP.

## **31. Dictamen final por capacidad**

| Capacidad                           | Dictamen                                         |
| ----------------------------------- | ------------------------------------------------ |
| Playwright como backend general     | APTO COMO CANDIDATO                              |
| Chromium completo                   | APTO COMO CANDIDATO                              |
| Headless Shell                      | CONDICIONADO                                     |
| Chrome/Edge de sistema              | CONDICIONADO                                     |
| Firefox distribuido por Playwright  | CONDICIONADO                                     |
| WebKit distribuido por Playwright   | CONDICIONADO                                     |
| Safari real mediante Selenium       | CONDICIONADO                                     |
| Puppeteer como respaldo localizado  | APTO COMO CANDIDATO                              |
| Discovery híbrido                   | APTO COMO CANDIDATO                              |
| Aislamiento profesional del runner  | CONDICIONADO                                     |
| Scheduler soberano                  | APTO COMO CANDIDATO                              |
| Concurrencia W>1                    | CONDICIONADO                                     |
| Concurrencia funcional compuesta    | CONDICIONADO                                     |
| Captura privada C                   | CONDICIONADO                                     |
| Captura privada A                   | CONDICIONADO                                     |
| Accesibilidad automatizada y humana | APTO COMO CANDIDATO                              |
| Compatibilidad integral instalada   | SIN RUTA DOCUMENTAL SUFICIENTE PARA ACREDITACIÓN |
| Hardware mínimo y rendimiento       | SIN RUTA DOCUMENTAL SUFICIENTE PARA FIJACIÓN     |
| Navegador propio como sustitución   | SIN RUTA DOCUMENTAL SUFICIENTE                   |

## **32. Recomendación formal al Orquestador Principal**

Recomiendo incorporar provisionalmente la siguiente decisión tecnológica candidata:

> QAP conservará Playwright Core estable como primera alternativa de automatización, subordinada a un puerto independiente del proveedor y a una autoridad canónica de ejecución.
>
> Chromium completo constituirá el candidato inicial de fidelidad general. Headless Shell se evaluará como optimización bajo equivalencia acreditada. Chrome, Edge, Firefox y WebKit conservarán identidades diferenciadas.
>
> Selenium WebDriver/BiDi será el respaldo estratégico para capacidades que requieran navegadores comerciales reales o que no puedan satisfacerse mediante Playwright. Puppeteer permanecerá como alternativa localizada.
>
> Se reconstruirán selectivamente Discovery, lifecycle, admisión, reconciliación, publicación y gestión de recursos, preservando mecanismos y pruebas reutilizables.
>
> La captura conservará C como arquitectura principal y A como respaldo, sin modificar AR-27. La selección definitiva quedará subordinada a las compuertas y garantías previamente ratificadas.

### **Conclusión independiente**

La ventaja competitiva de QAP no debería consistir en desarrollar otro navegador o framework genérico de automatización.

Debería consistir en transformar capacidades de navegación existentes en un sistema profesional que comprenda el alcance, conserve conocimiento, respete la autoridad, coordine pruebas complejas, verifique efectos reales y produzca evidencia reproducible con consumo gobernado.

Playwright es actualmente el candidato mejor posicionado entre las alternativas comparadas para la composición general, principalmente por su amplitud funcional y la posibilidad de reducir reconstrucción innecesaria.

No existe evidencia suficiente para seleccionarlo irreversiblemente, garantizar su rendimiento ni declarar resueltas las fronteras de seguridad, compatibilidad y privacidad.

**Dictamen general ET-03: CONDICIONADO, favorable a la integración de candidatos tecnológicos con reservas documentales y experimentales.**

Se deja constancia de que la inspección integral de todas las fuentes fijadas, pruebas, advisories y subobligaciones exigidas por el encargo común quedó incompleta. Esta limitación impide presentar el informe como un cierre exhaustivo definitivo de ET-03.

**Declaración de cumplimiento operativo:** no se modificó GitHub, no se instalaron dependencias, no se ejecutaron pruebas ni experimentos, no se accedió a sistemas empresariales, no se elaboró WBS y no se inició ninguna compuerta.

**Fin del informe ET-03.**
