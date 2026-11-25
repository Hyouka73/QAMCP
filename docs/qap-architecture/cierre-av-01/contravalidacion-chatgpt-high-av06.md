# **QAP · Contravalidación técnica independiente de AV-06**

**Fecha:** 25 de noviembre de 2026.\
**Función:** Contravalidador Técnico Independiente, desempeñando el rol asignado a Gemini Neon.\
**Destinatario:** Orquestador Principal de QAP.\
**Investigador principal:** Codex High.\
**Repositorio:** `Hyouka73/QAMCP`.\
**Rama:** `develop`.\
**SHA de referencia:** `053c5ab86589c44a416b8f69e21adddba5a0e2ca`.\
**Alcance:** AR-16, AR-29, AR-36, AR-37, AR-39 y AR-49.\
**Modalidad:** Investigación documental, inspección estática y contravalidación independiente.

## **1. Dictamen ejecutivo**

DICTAMEN INDEPENDIENTE

# **APROBABLE EN DISEÑO CON ENMIENDAS VINCULANTES Y RESERVAS**

El planteamiento principal de Codex High es técnicamente defendible. No recomiendo ratificarlo íntegramente en su redacción actual. Las correcciones de este informe deben prevalecer en los puntos incompatibles antes de considerar el cierre documental de AV-06.

Registros examinados

# **6/6**

Objeciones abordadas

# **8/8**

Experimentos nuevos ejecutados

# **0**

Decisiones del propietario ratificadas adicionalmente

# **0**

La investigación permite sostener las siguientes conclusiones:

- **Playwright debe permanecer como candidato principal**, detrás de un puerto semántico propio de QAP. No existe evidencia suficiente para justificar su sustitución generalizada.
- Chromium Headless Shell no debe seleccionarse exclusivamente por su presunta ligereza. Su idoneidad depende de fidelidad, funcionalidad, seguridad y evidencia.
- La concurrencia adaptativa constituye una capacidad obligatoria del producto. **W=1 es una referencia experimental y una modalidad temporal de operación segura, no el límite arquitectónico de QAP.**
- El Discovery actual aporta observaciones útiles, pero todavía no acredita el conocimiento profundo, funcional, incremental y persistente requerido.
- La instalación ligera requiere resolver las discrepancias reales entre versiones, consumidores, binarios, dependencias y mecanismos de bootstrap.
- La captura multimedia privada permanece condicionada a AR-27, EXP-06a, EXP-06c y DE-02. Ninguna capacidad de grabación del navegador sustituye la prevención.
- La accesibilidad debe estar disponible desde el lanzamiento, sin confundir resultados automatizados con una certificación integral WCAG.
- La optimización de tokens debe demostrarse mediante tareas equivalentes y telemetría comparable. No existe fundamento para garantizar actualmente un porcentaje de ahorro.

**No recomiendo declarar AV-06 experimentalmente validada ni seleccionar irreversiblemente sus componentes.** Sí existe fundamento para aceptar sus contratos corregidos como insumo de planificación, sujeto a la decisión del Orquestador.

### **1.1. Dictamen por registro**

| Registro | Dictamen de diseño                         | Estado principal conservado       |
| -------- | ------------------------------------------ | --------------------------------- |
| AR-16    | Favorable con enmiendas                    | VALIDACIÓN EXPERIMENTAL PENDIENTE |
| AR-29    | Favorable con enmiendas                    | VALIDACIÓN EXPERIMENTAL PENDIENTE |
| AR-36    | Favorable con enmiendas                    | VALIDACIÓN EXPERIMENTAL PENDIENTE |
| AR-37    | Favorable con reservas de viabilidad       | VALIDACIÓN EXPERIMENTAL PENDIENTE |
| AR-39    | Favorable condicionado a AR-27             | VALIDACIÓN EXPERIMENTAL PENDIENTE |
| AR-49    | Favorable como estrategia de investigación | PENDIENTE                         |

No se propone crear registros adicionales. Las obligaciones identificadas pueden incorporarse en los seis registros existentes y sus dependencias.

## **2. Verificación de procedencia y límites de la investigación**

### **2.1. Identidad del repositorio**

Se accedió directamente al repositorio mediante el conector de GitHub, con operaciones exclusivamente de lectura.

Se verificó:

| Elemento                                     | Identidad comprobada                        |
| -------------------------------------------- | ------------------------------------------- |
| HEAD de `develop`                            | `053c5ab86589c44a416b8f69e21adddba5a0e2ca`  |
| Árbol Git                                    | `9afacba8a1ba714d54bd068f0dea3c87192afb87`  |
| Publicación de Codex                         | `181829113a18f40c2683cea7fcb32daeb9017d34`  |
| Base auditada por Codex                      | `7ccb713fea6331ee571010b7a32b90ade43b98f6`  |
| Diferencia respecto de la base               | Dos commits posteriores, ninguno divergente |
| Archivos modificados entre ambas referencias | Siete archivos Markdown                     |

La comparación confirma que **el código auditado por Codex no cambió entre su base y el SHA del presente encargo**. Por ello, sus localizadores siguen siendo contrastables en la referencia solicitada.

Fuentes internas:

[Comparación exacta de commits](https://github.com/Hyouka73/QAMCP/compare/7ccb713fea6331ee571010b7a32b90ade43b98f6...053c5ab86589c44a416b8f69e21adddba5a0e2ca?utm_source=chatgpt.com) · [Encargo vinculante](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/encargo-contravalidacion-av06.md?utm_source=chatgpt.com) · [Informe principal](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/informe-av06.md?utm_source=chatgpt.com) · [Matriz candidata](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/matriz-av06.md?utm_source=chatgpt.com) · [Protocolos originales](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/protocolos-av06.md?utm_source=chatgpt.com).

### **2.2. Clasificación de evidencia**

Para evitar confundir disponibilidad documental con funcionamiento demostrado, este informe distingue:

| Clasificación | Significado                                                     |
| ------------- | --------------------------------------------------------------- |
| V-CODE        | Verificado directamente en código fijado por SHA.               |
| V-UPSTREAM    | Verificado en fuente primaria del proveedor fijada por versión. |
| V-DOC         | Verificado documentalmente, sin acreditar ejecución.            |
| HIST          | Antecedente histórico que conserva sus límites originales.      |
| PROP          | Contrato o alternativa técnica propuesta.                       |
| EXP           | Afirmación pendiente de validación experimental.                |
| IND           | Evidencia insuficiente o indeterminada.                         |

### **2.3. Limitaciones materiales**

Se verificaron independientemente los manifiestos, registros y metadatos de Playwright 1.62.1 y 1.63.0.

La dependencia alpha `1.63.0-alpha-2026-08-31` fue confirmada en el lock de QAP. Sin embargo, no fue posible recuperar su manifiesto `browsers.json` y su registry exactos desde el artefacto npm: la referencia Git consultada no existe y los accesos alternativos al paquete no devolvieron su contenido.

En consecuencia:

- Los valores alpha publicados por Codex se conservan como antecedentes documentales, no como datos independientemente verificados.
- La alpha no debe congelarse como dependencia de lanzamiento sin completar ese cotejo o resolver su eliminación mediante una alternativa acreditada.
- No se certifica ningún binario instalado, arquitectura ejecutada, consumo de recursos ni resultado multimedia.
- El cotejo del código fue focalizado en las rutas relevantes identificadas, no constituye una prueba exhaustiva de todos los caminos ejecutables del repositorio.

Estas limitaciones impiden una ratificación tecnológica definitiva, pero no invalidan las correcciones arquitectónicas que siguen.

## **3. Resolución de las ocho objeciones vinculantes**

| Objeción                           | Registros | Resolución                                                                                        |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| O1. Matriz y selección tecnológica | AR-16/37  | Aceptación condicionada; corregir clasificación por versión, arquitectura y distribución.         |
| O2. Fidelidad y autoridad          | AR-16/36  | Enmienda necesaria; separar observación restringida de ejecución funcional fiel.                  |
| O3. Concurrencia adaptativa        | AR-29     | Enmienda necesaria; admisión transaccional, reservas diferenciadas y escalado efectivo.           |
| O4. Discovery incremental          | AR-36     | Enmienda necesaria; identidad semántica, denominadores e invalidación conservadora.               |
| O5. Instalación y confianza        | AR-37     | Enmienda necesaria; aprovisionamiento verificable y eliminación de circularidad entre compuertas. |
| O6. Captura y portabilidad         | AR-39     | Enmienda necesaria; prevención anterior al primer cuadro y custodia integral.                     |
| O7. Accesibilidad                  | AR-39     | Aceptación condicionada; capacidad automatizada y manual, sin certificación indebida.             |
| O8. Optimización de tokens         | AR-49     | Enmienda necesaria; comparación contra agente competente y obligaciones equivalentes.             |

Las ocho objeciones reciben resolución contractual. Su resolución documental no significa que las capacidades correspondientes hayan superado sus experimentos.

## **4. O1 — AR-16/37: matriz real y selección tecnológica**

### **4.1. Versiones efectivamente resueltas**

La afirmación de Codex sobre coexistencia de múltiples versiones de Playwright es correcta.

El [lock de QAP, importadores, líneas 8–292](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/pnpm-lock.yaml?utm_source=chatgpt.com#L8-L292) confirma:

| Consumidor                                         | Playwright Core resuelto |
| -------------------------------------------------- | ------------------------ |
| Raíz del monorepo                                  | 1.63.0                   |
| CLI                                                | 1.63.0                   |
| Auth                                               | 1.62.1                   |
| MCP                                                | 1.62.1                   |
| Playwright Adapter                                 | 1.62.1                   |
| Playwright Runner                                  | 1.62.1                   |
| Dependencia transitiva de `@playwright/mcp@0.0.80` | 1.63.0-alpha-2026-08-31  |

La dependencia alpha se encuentra expresamente identificada en las [líneas 2361–2369](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/pnpm-lock.yaml?utm_source=chatgpt.com#L2361-L2369) y [3339–3342](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/pnpm-lock.yaml?utm_source=chatgpt.com#L3339-L3342).

**Hallazgo:** existen varias identidades de runtime potencialmente consumidas. La revisión instalada desde una entrada CLI no necesariamente coincide con la requerida por el runner.

Tampoco puede asumirse que una dependencia declarada en el lock sea efectivamente importada en todas las rutas del paquete distribuido. La resolución final depende del empaquetado y del punto de entrada.

### **4.2. Manifiestos de navegadores**

Los valores siguientes corresponden a los manifiestos de los proveedores, no a instalaciones comprobadas de QAP.

| Componente        | PW 1.62.1       | PW 1.63.0       | PW alpha                            |
| ----------------- | --------------- | --------------- | ----------------------------------- |
| Chromium          | 151.0.7922.34   | 153.0.8010.12   | 153.0.8010.12¹                      |
| Revisión Chromium | 1234            | 1243            | 1243¹                               |
| Revisión Shell    | 1234            | 1243            | 1243¹                               |
| Firefox           | 153.0           | 155.0           | 155.0¹                              |
| Revisión Firefox  | 1538            | 1543            | 1542¹                               |
| WebKit            | 26.5            | 26.6            | 26.5¹                               |
| Revisión WebKit   | 2336            | 2359            | 2358¹                               |
| Revisión FFmpeg   | 1011            | 1011            | 1011¹                               |
| Node declarado    | ≥20             | ≥20             | ≥20                                 |
| Verificación      | Fuente primaria | Fuente primaria | Parcial: lock y propuesta histórica |

¹ Valores publicados por Codex que no pudieron ser independientemente confirmados en el artefacto alpha.

Fuentes:

- [Playwright 1.62.1 — browsers.json](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json?utm_source=chatgpt.com), blob `25e42eae2b73a0a4211be65cacf51bb5b173ab8d`.
- [Playwright 1.63.0 — browsers.json](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/browsers.json?utm_source=chatgpt.com), blob `5ed62af55d77cc473d505172d51f66ad2849a670`.
- [Metadatos 1.62.1](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/package.json?utm_source=chatgpt.com) y [metadatos 1.63.0](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/package.json?utm_source=chatgpt.com).

### **4.3. Overrides y procedencia del binario**

Codex identifica correctamente la existencia de overrides, pero la matriz debe mantenerlos como parte de la identidad efectiva.

| Plataforma                                 | WebKit 1.62.1 | WebKit 1.63.0                                           |
| ------------------------------------------ | ------------- | ------------------------------------------------------- |
| macOS 14 Intel                             | 2251          | 2251                                                    |
| macOS 14 ARM64                             | 2251          | 2251                                                    |
| Ubuntu 20.04 x64/ARM64                     | Override 2092 | Sin distribución correspondiente en registry consultado |
| Plataformas con revisión general aplicable | 2336          | 2359                                                    |

Un override indica una revisión de artefacto distinta. No autoriza atribuir automáticamente al binario antiguo todas las características de la versión general anunciada.

Existe además una diferencia material en Linux ARM64:

- **1.62.1:** Chromium y Shell recurren a builds distribuidos por Playwright.
- **1.63.0:** el registry referencia artefactos ARM64 de Chrome for Testing.

Por tanto, compartir la denominación Chromium no implica compartir procedencia, binario, dependencia nativa o comportamiento.

Fuentes primarias: [registry 1.62.1](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/src/server/registry/index.ts?utm_source=chatgpt.com#L65-L214) y [registry 1.63.0](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/src/server/registry/index.ts?utm_source=chatgpt.com#L65-L198).

### **4.4. Comparación de tecnologías**

### **Playwright**

Candidato principal

Conservar y desacoplar del dominio QAP. No congelar todavía versión, motor ni modalidad predeterminada.

**Puppeteer**

Alternativa Chromium/Firefox

Adecuado para contrastes de CDP, BiDi, captura y huella de distribución.

**Selenium / WebDriver / BiDi**

Alternativa interoperable

Especialmente relevante para navegadores de proveedor y Safari real.

**CDP directo**

Complemento especializado

Evaluar para captura o inspección específica, no como reemplazo integral por defecto.

**Navegador propio**

No justificado

Introduce obligaciones de seguridad, parches, distribución y mantenimiento sin beneficio demostrado.

| Criterio                    | Playwright                              | Puppeteer                           | Selenium/BiDi                       |
| --------------------------- | --------------------------------------- | ----------------------------------- | ----------------------------------- |
| Interacción SPA             | Locators, autoespera                    | Locators y esperas                  | WebDriver y esperas explícitas      |
| Chromium                    | Sí                                      | Sí                                  | Sí, según driver                    |
| Firefox                     | Build adaptada                          | Firefox mediante BiDi               | Firefox mediante driver             |
| WebKit                      | Build adaptada                          | Sin oferta equivalente acreditada   | Safari real mediante `safaridriver` |
| Contextos y sesiones        | API integrada                           | API propia                          | Semántica por navegador/driver      |
| Interceptación              | API de Playwright                       | CDP/BiDi, según capacidad           | Según implementación BiDi           |
| PNG                         | Disponible                              | Disponible                          | Disponible                          |
| Grabación                   | APIs integradas candidatas              | Screencast y codificación candidata | Integración adicional según backend |
| Distribución                | Bibliotecas y artefactos seleccionables | Puppeteer Core y provisión externa  | Drivers, navegador y Manager        |
| Reutilización de QAP actual | Alta                                    | Adaptación relevante                | Adaptación relevante                |
| Licencia de biblioteca      | Apache-2.0                              | Apache-2.0                          | Apache-2.0                          |

La comparación describe capacidades de las tecnologías, no equivalencia experimental de sus resultados.

#### **Playwright**

Es la alternativa con menor discontinuidad respecto del código actual. Permite aprovechar los paquetes `playwright-adapter` y `playwright-runner` sin comprometer el diseño del dominio con una implementación concreta.

La principal reserva consiste en acreditar los perfiles fieles, las restricciones de red y captura, y las revisiones efectivamente consumidas.

#### **Puppeteer**

Se verificó independientemente el paquete candidato 25.18.1. Su metadata exige Node `>=22.12.0` y su archivo de revisiones identifica:

- Chrome y Chrome Headless Shell: `157.0.8103.78`.
- Firefox: `stable_160.0`.

Fuentes: [package.json 25.18.1](https://github.com/puppeteer/puppeteer/blob/puppeteer-v25.18.1/packages/puppeteer-core/package.json?utm_source=chatgpt.com) y [revisions.ts 25.18.1](https://github.com/puppeteer/puppeteer/blob/puppeteer-v25.18.1/packages/puppeteer-core/src/revisions.ts?utm_source=chatgpt.com).

Su utilidad como alternativa no demuestra menores consumos. Una comparación con navegadores de distintas versiones debe atribuir las diferencias al conjunto biblioteca/binario/protocolo, evitando atribuirlas únicamente a la biblioteca.

#### **Selenium y WebDriver BiDi**

El borrador W3C del 13 de noviembre de 2026 contempla operaciones de navegación, contextos, localización, capturas, eventos y screencast. No obstante, continúa siendo un Working Draft. La presencia de una operación en el protocolo no acredita su implementación uniforme.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

w3.org



Safari dispone de un driver de proveedor documentado por Apple. Es una alternativa de contraste cuando se necesita comprobar Safari real, no un nombre alternativo para WebKit de Playwright.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.apple.com\&sz=32)

Apple Developer Documentation+1



Selenium permanece como familia tecnológica viable. La versión concreta del binding, Manager y drivers deberá fijarse antes de cualquier prueba comparativa; no queda seleccionada mediante este informe.

#### **Resolución**

Se recomienda conservar **un puerto semántico de QAP y una implementación principal**, con adaptaciones alternativas delimitadas para contrastar brechas.

No se exige mantener simultáneamente dos backends integrales en producción.

Un cambio de tecnología solo se justifica si existe una brecha material que:

1. Afecte un requisito obligatorio.
2. No pueda resolverse razonablemente con el candidato principal.
3. Disponga de una alternativa demostrablemente viable.
4. Preserve autoridad, oráculos, evidencia, compatibilidad y mantenimiento.
5. Supere la comparación con testigos independientes.

### **4.5. Matriz corregida de plataformas**

Leyenda:

- **N:** artefacto de arquitectura nativa referenciado por el registry consultado; pendiente de ejecución QAP.
- **S:** canal de sistema documentado; pendiente de calificación.
- **E:** ruta candidata de emulación.
- **D:** disponibilidad o funcionamiento indeterminado.
- **—:** modalidad inaplicable.
- **Acreditado:** ninguna celda recibe esta clasificación en la presente auditoría.

Cada celda expresa **visible / headless**.

| Plataforma candidata | Shell | Chromium completo | Chrome | Edge  | Firefox PW | WebKit PW |
| -------------------- | ----- | ----------------- | ------ | ----- | ---------- | --------- |
| Windows 11 x64       | — / N | N / N             | S / S  | S / S | N / N      | N / N     |
| Windows 11 ARM64     | — / E | E / E             | S / S  | S / S | E / E      | E / E     |
| macOS 14 Intel       | — / N | N / N             | S / S  | S / S | N / N      | N / N²    |
| macOS 14 ARM64       | — / N | N / N             | S / S  | S / S | N / N      | N / N²    |
| macOS 15 Intel       | — / N | N / N             | S / S  | S / S | N / N      | N / N     |
| macOS 15 ARM64       | — / N | N / N             | S / S  | S / S | N / N      | N / N     |
| Ubuntu 24.04 x64     | — / N | N / N             | S / S  | S / S | N / N      | N / N     |
| Ubuntu 24.04 ARM64   | — / N | N / N             | S / S  | D / D | N / N      | N / N     |
| Debian 13 x64        | — / N | N / N             | S / S  | S / S | N / N      | N / N     |
| Debian 13 ARM64      | — / N | N / N             | S / S  | D / D | N / N      | N / N     |

² Aplican overrides por plataforma.

Esta matriz corresponde a las versiones estables examinadas. La alpha requiere expediente independiente.

#### **Windows ARM64**

Los registries inspeccionados referencian artefactos Windows x64, no una distribución nativa ARM64 equivalente de todos los motores.

Windows 11 ARM64 contempla emulación x64, pero ello no acredita automáticamente compatibilidad de QAP, sandbox, codecs o procesos auxiliares. Debe verificarse arquitectura nativa y efectiva de cada proceso, mediante mecanismos del SO que distingan emulación.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn



Chrome y Edge de sistema constituyen rutas candidatas independientes. Su disponibilidad no convierte a todos los motores de Playwright en nativos ARM64.

#### **Linux ARM64**

Google documenta paquetes ARM64 de Chrome para distribuciones compatibles. Debe comprobarse que el canal seleccionado por la biblioteca corresponde al binario realmente instalado.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.google.com\&sz=32)

Google Chrome Help



El índice oficial consultado de Microsoft Edge estable ARM64 contiene un archivo `Packages` de cero bytes. No existe fundamento en ese índice para acreditar una distribución estable ARM64. Se mantiene la duda por proveedor, sin declarar una imposibilidad permanente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://packages.microsoft.com\&sz=32)

packages.microsoft.com



#### **macOS Intel y Apple Silicon**

Deben mantenerse como arquitecturas distintas, incluyendo dependencias, codecs, firma, permisos y comportamiento gráfico.

macOS 14 presenta rutas explícitas en los registries auditados. Por ello, no existe fundamento para convertir macOS 15 unilateralmente en el mínimo obligatorio de QAP.

Los requisitos mínimos de Chrome y Edge tampoco equivalen automáticamente al piso de soporte de QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://support.google.com\&sz=32)

Google Chrome Help+1



### **4.6. Clasificación del alcance**

| Obligación                                                | Tratamiento                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Windows, macOS y Linux                                    | Obligatorios desde el primer lanzamiento por D14.                                         |
| Ejecución visible y segundo plano                         | Capacidades obligatorias por D15.                                                         |
| Chromium, Shell, Chrome, Edge, Firefox y WebKit           | Candidatos expresamente contemplados; conservar en evaluación.                            |
| Arquitecturas, versiones mínimas y combinaciones finas    | Pendientes de calificación y decisión correspondiente.                                    |
| Shell visible                                             | Inaplicable a esa distribución; no es una exclusión de la capacidad visible del producto. |
| Safari y Firefox stock                                    | Comparadores independientes cuando exista necesidad funcional.                            |
| WSL, contenedores, emulación y distribuciones adicionales | Perfiles diferenciados; no equivalentes a instalación nativa.                             |

No se autoriza reducir el alcance de D14 por elegir una matriz inicial de ensayo más pequeña.

### **4.7. Enmienda vinculante CV06-01**

Sustituir cualquier interpretación que permita congelar un backend o perfil por disponibilidad documental:

> QAP resolverá explícitamente la identidad efectiva del navegador por consumidor, versión de biblioteca, revisión de artefacto, proveedor, motor, distribución, canal, arquitectura del host y proceso, modalidad, dependencias y política. La acreditación corresponde a cada combinación aplicable y capacidad requerida. Una ruta emulada, un override o un canal actualizado por el proveedor constituyen configuraciones diferenciadas. Ninguna reducción de alcance obligatorio podrá aprobarse mediante fallback silencioso.

**Dictamen O1:** favorable con esta enmienda. Selección definitiva y verificación exacta de la alpha pendientes.

## **5. O2 — AR-16/36: fidelidad funcional y visual frente a autoridad**

### **5.1. Hallazgos directos del código**

| Localizador en SHA auditado                                                                                                                                                                        | Observación comprobada                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [adapter.ts L210–240](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-adapter/src/adapter.ts?utm_source=chatgpt.com#L210-L240)                 | Intenta Chrome, Edge y Chromium, en ese orden.                                              |
| [runner.ts L349–369](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-runner/src/runner.ts?utm_source=chatgpt.com#L349-L369)                    | Prefiere Chromium; prueba canales adicionales en determinados perfiles de lectura.          |
| [crawler/browser.ts L20–39](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-adapter/src/crawler/browser.ts?utm_source=chatgpt.com#L20-L39)     | Emplea Chromium headless, proxy denegatorio y flags propios.                                |
| [crawler/service.ts L160–215](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-adapter/src/crawler/service.ts?utm_source=chatgpt.com#L160-L215) | Bloquea service workers, WebSockets y popups; aplica restricciones a recursos e impone CSP. |
| [runner.ts L457–562](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-runner/src/runner.ts?utm_source=chatgpt.com#L457-L562)                    | Las opciones de contexto, red y restricciones dependen del perfil de ejecución.             |

El crawler puede construir una respuesta HTML con `cache-control: no-store`, CSP propia, restricciones de scripts, formularios y frames.

Esto es defendible para determinados perfiles de reconocimiento controlado. Sin embargo, **la página obtenida mediante ese perfil no representa necesariamente la aplicación ejecutada en su configuración funcional normal**.

La documentación versionada de Playwright confirma que habilitar routing desactiva la caché HTTP y que las solicitudes manejadas por service workers presentan limitaciones de interceptación.

Fuente: [BrowserContext 1.63.0, routing](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/api/class-browsercontext.md?utm_source=chatgpt.com#L1091) y [efecto sobre caché](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/api/class-browsercontext.md?utm_source=chatgpt.com#L1237).

### **5.2. Distinción necesaria de perfiles**

Se proponen tres perfiles semánticos, sujetos a los grants vigentes:

| Perfil                    | Finalidad                                                | Alcance de las afirmaciones                         |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `RESTRICTED_OBSERVATION`  | Inventario y reconocimiento controlado                   | Observaciones parciales; no equivalencia funcional. |
| `FAITHFUL_READ_ONLY`      | Lectura y comportamiento real acreditadamente no mutante | Fidelidad y acciones permitidas con testigo.        |
| `AUTHORIZED_QA_EXECUTION` | Pruebas funcionales y E2E autorizadas                    | Efectos y veredictos conforme a AV-04.              |

Estos identificadores son propuestas de contrato, no APIs existentes ni permisos nuevos.

Un perfil fiel no implica permitir cualquier solicitud. Un perfil de lectura tampoco implica que todo GET sea seguro ni que todo POST sea necesariamente una escritura empresarial. La autoridad debe determinarse por efecto, destino, principal y condiciones verificadas.

### **5.3. Visible no equivale a grabación**

La ejecución visible exige que el operador pueda observar la interfaz real del navegador durante la prueba.

Deben distinguirse:

| Capacidad           | Significado                                                     |
| ------------------- | --------------------------------------------------------------- |
| Visible             | Navegador real mostrado en una sesión gráfica.                  |
| Headless            | Ejecución sin ventana gráfica observable.                       |
| Screencast          | Cuadros del contenido capturable por el navegador.              |
| Grabación           | Producción y almacenamiento autorizado de evidencia multimedia. |
| Escritorio completo | Capacidad distinta, no acreditada por screenshots de página.    |

No se promete que una captura de página incluya barras del navegador, diálogos del SO, selectores nativos de archivos u otras ventanas del escritorio.

La observación en tiempo real puede existir sin grabación persistente. La grabación puede existir en headless, exclusivamente cuando la política la permita.

### **5.4. Preferencias y selección efectiva**

El contrato deberá representar separadamente:

```
execution_preferences:
  visibility: visible | background
  browser_preference: explicit | automatic
  requested_engine: reference
  requested_channel: reference
  resource_preference: efficiency | performance
  recording_preference: requested | not_requested
  preference_scope: authorized_project_application_environment_principal

effective_execution:
  runtime_identity: reference
  effective_browser: reference
  effective_mode: reference
  effective_profile: reference
  policy_revision: reference
  capability_manifest: reference
  deviations_from_preference: []
  operator_decision: reference_or_absent
```

La autorización de captura no forma parte de `recording_preference`; se obtiene de la autoridad independiente establecida en AV-02.

Las preferencias se guardan y recuperan por ámbito autorizado. No se repiten preguntas ya respondidas mientras sus condiciones permanezcan vigentes.

Un cambio material de motor, modalidad, sesión, fidelidad o evidencia se presenta antes de ejecutarse. Si no existe alternativa elegible, se bloquea la capacidad afectada.

### **5.5. Antecedente de los 759 GET**

Se conserva como **antecedente histórico no reproducido**.

La ausencia de un expediente causal localizado por SHA impide concluir independientemente:

- Qué solicitudes correspondían a recursos indispensables.
- Qué política específica produjo cada denegación.
- Qué parte de la aplicación dejó de hidratarse por ese motivo.
- Si coexistieron fallos del AUT u otras condiciones.

El código inspeccionado demuestra que las restricciones actuales pueden afectar recursos y comportamiento observable. No demuestra que sea la causa exacta de aquella incidencia.

No se requiere solicitar archivos adicionales al propietario para diseñar una prueba causal.

### **5.6. Preflight causal y funcional**

Se establecen cuatro variantes mínimas de una SPA controlada:

| Variante | Condición                                              | Resultado esperado                                           |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| F1       | Recursos autorizados disponibles y aplicación sana     | Hidratación y efecto funcional acreditados.                  |
| F2       | Recurso indispensable existente, denegado por política | Identificar bloqueo de política; no atribuir defecto al AUT. |
| F3       | Recurso indispensable autorizado, realmente ausente    | Identificar fallo de recurso o entorno mediante testigo.     |
| F4       | Recursos disponibles y mutante funcional               | Detectar incumplimiento del AUT aunque el DOM parezca sano.  |

La comparación incluye CSS, JavaScript, fuentes, imágenes, layout, hidratación, foco, navegación SPA, filtros, formularios, virtualización, frames, descargas y popups aplicables.

Debe registrarse cualquier alteración introducida por:

- Interceptación y proxy.
- Caché y service workers.
- CSP de prueba.
- Flags y sandbox.
- GPU y compositor.
- Fuentes, viewport, DPR, zoom y locale.

No se desactivarán indiscriminadamente service workers ni se ampliará autoridad para alcanzar equivalencia visual.

Si la aplicación necesita una capacidad incompatible con la política, se calificará como bloqueo o limitación del perfil, no como ejecución fiel.

### **5.7. Enmienda vinculante CV06-02**

> Toda entrada de runner, adapter y crawler resolverá una configuración efectiva acreditable y declarará la clase de afirmaciones que permite. Un reconocimiento restringido podrá producir conocimiento observacional, pero no acreditará fidelidad ni funcionalidad del AUT sin testigos adicionales. La comparación fiel utilizará recursos legítimos autorizados y condiciones equivalentes; cualquier modificación del comportamiento normal será registrada y evaluada. El éxito HTTP, la estabilización de URL, el evento `load` y la apariencia visual no constituyen por sí solos oráculos funcionales.

**Criterio de aceptación:** cero falsos PASS funcionales en los controles negativos y diferenciación acreditada de las cuatro variantes.

**Dictamen O2:** favorable con enmienda. EXP-02 y EXP-04 deberán verificar la convergencia semántica de las entradas efectivas.

## **6. O3 — AR-29: concurrencia adaptativa y administración de recursos**

### **6.1. Contravalidación del diseño original**

Se acepta la separación entre planificación propuesta por el HOST y admisión gobernada por el núcleo.

Se rechaza cualquier interpretación de EXP-03 que convierta una ejecución secuencial acreditada en cumplimiento completo de D16.

El [acta de decisiones, D16](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/acta-decisiones.md?utm_source=chatgpt.com#d16--recursos-y-concurrencia) exige eficiencia, control técnico de concurrencia, reutilización segura, limpieza y dimensionamiento mediante mediciones.

### **6.2. Estado del código**

[RunnerLifecycle L30–132](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-runner/src/lifecycle.ts?utm_source=chatgpt.com#L30-L132) contiene mecanismos aprovechables:

- Un navegador por instancia del lifecycle.
- Contextos identificados y administrados.
- Cierre explícito de contextos y navegador.
- Registro de señales SIGINT y SIGTERM.

Esto no acredita un supervisor independiente, limpieza después de cualquier caída, admisión global de campañas ni recuperación transaccional.

Además, capturar y descartar excepciones de cierre no demuestra que un proceso externo haya terminado correctamente.

Los contextos de navegador no constituyen por sí solos una frontera fuerte contra código hostil o un HOST capaz de acceder a recursos del mismo principal. Se conservan las fronteras de AV-02 y AV-05.

### **6.3. Arquitectura corregida**

Arquitectura conceptual: las aplicaciones representan tareas candidatas a admisión, no una promesa de tres workers simultáneos en cualquier equipo.

### **6.4. Admisión transaccional**

La admisión deberá reservar, en la misma transacción lógica de reclamo:

- Identidad de campaña, nodo, intento, revisión y generación.
- Autoridad efectiva y vigencia.
- Recursos incompatibles de negocio.
- Presupuesto de ejecución.
- Recursos locales previstos.
- Reserva necesaria para evidencia, cierre y reconciliación.

Las reservas de negocio deberán considerar la jerarquía aceptada en AV-04:

`destino → tenant → recurso → entidad → sesión`

También deben representar recursos globales, efectos indirectos, límites compartidos, colas y subefectos.

Una identidad desconocida no equivale a independencia. Se amplía al ancestro seguro o se bloquea.

Fuentes contractuales: [AV-03, enmiendas](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com) y [AV-04, enmiendas](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com).

### **6.5. Reserva frente a consumo observado**

El scheduler deberá mantener dos libros distintos.

| Libro             | Finalidad                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Reservas          | Compromisos conservadores de recursos para tareas admitidas, incluyendo crecimiento esperado y cierre. |
| Consumo observado | Medición efectiva de los procesos, recursos y presión global.                                          |

No se sumará indiscriminadamente consumo actual más reservas completas si parte del compromiso ya se encuentra materializado.

Para cada recurso se considerará:

\\[ L_r+U_r+C_r+H_r\leq B_r \\]

Donde:

- \\(L_r\\): carga ya observada dentro del perímetro definido.
- \\(U_r\\): compromiso reservado todavía no materializado.
- \\(C_r\\): coste incremental estimado de la nueva admisión.
- \\(H_r\\): margen de seguridad, crecimiento y cierre.
- \\(B_r\\): capacidad operativa elegible según política y presión observada.

La expresión es un invariante conceptual, no una fórmula calibrada de hardware. CPU, IO, memoria, disco y GPU requieren modelos específicos; no se presume intercambiabilidad.

### **6.6. W efectivo y escalado**

Definir separadamente:

| Variable       | Significado                                                          |
| -------------- | -------------------------------------------------------------------- |
| `W_requested`  | Paralelismo solicitado o propuesto.                                  |
| `W_policy_max` | Límite permitido por política o configuración.                       |
| `W_admitted`   | Unidades con reserva activa.                                         |
| `W_running`    | Unidades que ejecutan trabajo efectivo.                              |
| `W_pinned`     | Unidades que conservan recursos por necesidad de sesión viva.        |
| `W_effective`  | Concurrencia efectiva observada conforme a una definición publicada. |

Un contexto pinneado no equivale necesariamente a una tarea productiva, pero consume recursos reservados.

### **Comportamiento conceptual del scheduler**

Ejemplo ilustrativo del contrato. No representa mediciones ni hardware calificado.

Sin capacidadPresión altaCapacidad disponibleMayor capacidad

Unidades admisibles en el ejemplo

# **2**

Admisible

Admisible

En espera

En espera

Permitir concurrencia si reservas, autoridad y dependencias son compatibles.

**Regla normativa:** W=1 no es una garantía universal. Si ni siquiera existe capacidad suficiente para una unidad segura, W efectivo podrá ser cero.

Si W>1 resulta viable y acreditado, el producto deberá poder seleccionarlo y utilizarlo.

### **6.7. Fairness y crecimiento de tareas admitidas**

La corrección incorpora:

- Cuotas por campaña y por recurso compartido.
- Colas acotadas con backpressure.
- Aging de tareas elegibles para reducir starvation.
- Orden estable de adquisición de recursos.
- Priorización que no sustituya las barreras de autoridad.
- Histéresis para evitar oscilaciones continuas entre niveles de admisión.
- Reestimación durante la ejecución.
- Prohibición de iniciar fases adicionales no cubiertas por reserva suficiente.
- Capacidad protegida para cleanup, sellado y reconciliación.

Una tarea admitida cuyo coste crece no tendrá autorización implícita para consumir toda la memoria o almacenamiento restante.

Si aparece presión peligrosa se detienen nuevas admisiones. Las tareas en vuelo se drenan, suspenden o cancelan de acuerdo con su clase y estado de efecto.

No se admite abandonar efectos empresariales únicamente para reducir consumo local.

### **6.8. Wizards y alternancia entre aplicaciones**

Se distinguen dos conceptos:

**Checkpoint recuperable:** estado lógico durable que permite reanudar desde una frontera acreditada sin repetir efectos confirmados.

**Sesión viva:** estado en memoria del navegador cuya restauración no está demostrada.

Cuando un wizard necesite sesión viva, QAP podrá mantenerla temporalmente mediante pinning, lease acotado y reserva explícita.

El lease tendrá condiciones de renovación, presión, expiración, progreso y autoridad. No podrá renovarse indefinidamente por ausencia del HOST.

Al liberar una sesión viva:

1. Intentar alcanzar una frontera durable segura si está autorizado.
2. Confirmar el estado y efectos existentes.
3. Persistir conocimiento y progreso.
4. Cerrar recursos propios.
5. Reabrir desde checkpoint acreditado o bloquear la rama si no existe recuperación segura.

No se reconstruirá un wizard repitiendo mutaciones cuya ejecución ya pudo materializarse.

### **6.9. Enmienda vinculante CV06-03**

> La admisión será adaptativa, transaccional y gobernada por el núcleo. El HOST propone concurrencia sin poseer autoridad de admisión. W=1 es una referencia y un fallback temporal sujeto a viabilidad; W>1 deberá permanecer seleccionable cuando esté acreditado. No se fijará techo permanente sin fundamento experimental. Las reservas de capacidad local se distinguirán de las barreras de efectos empresariales y podrán liberarse por separado cuando persista incertidumbre remota. Los wizards vivos conservarán recursos mediante reservas acotadas, sin confundirse con checkpoints recuperables.

**Dictamen O3:** favorable con enmienda. El escalado y la selección de hardware quedan pendientes de EXP-03.

## **7. O4 — AR-36: Discovery profundo, incremental y persistente**

### **7.1. Verificación del extractor existente**

El archivo [crawler/dom.ts L5–72](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-adapter/src/crawler/dom.ts?utm_source=chatgpt.com#L5-L72) confirma:

- Extracción mediante `page.evaluate`.
- Inventario basado en `document.querySelectorAll`.
- Límites explícitos de elementos.
- Selectores estructurales `nth-of-type`.
- Estabilidad declarada como `unverified`.
- Proyección limitada de etiquetas y roles.
- Ausencia de recorrido general de todos los frames y árboles Shadow DOM dentro de esa función.

La extracción minimiza deliberadamente texto y atributos sensibles. Esto debe conservarse como propiedad de privacidad.

No se recomienda sustituirla por exportación indiscriminada de DOM completo o de nombres accesibles que puedan contener información privada.

La [persistencia Discovery L708–780](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/mcp/src/handlers/discovery.handler.ts?utm_source=chatgpt.com#L708-L780) confirma inventarios parciales, candidatos de módulos y revisiones de dossier.

El [servidor MCP L1530–1549](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/mcp/src/server.ts?utm_source=chatgpt.com#L1530-L1549) identifica rutas reanudables a partir de revisión, perfil y política.

Estas piezas acreditan mecanismos parciales de observación y recuperación. No acreditan profundidad completa, continuidad transaccional de cualquier frontera ni cobertura de todos los estados funcionales.

### **7.2. Extractores candidatos**

| Fuente                                   | Aporte                                          | Limitación                                                                |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| DOM saneado                              | Estructura, atributos, formularios y controles  | No incluye estados todavía no montados ni todos los árboles encapsulados. |
| ARIA y snapshots accesibles              | Roles, nombres, jerarquías y semántica expuesta | No demuestra efectos, reglas o todos los controles.                       |
| Localizadores Playwright                 | Identidad operativa candidata                   | Un selector único puede apuntar al control incorrecto.                    |
| Observador de red autorizado             | Recursos, solicitudes y relaciones observadas   | No acredita intención ni cumplimiento funcional.                          |
| Interacción controlada                   | Estados, transiciones y efectos                 | Requiere autoridad y oráculos.                                            |
| Documentación/API/repositorio autorizado | Expectativas, relaciones y reglas declaradas    | Pueden estar desactualizadas o no corresponder al AUT efectivo.           |

Playwright 1.62.1 documenta `Page.ariaSnapshot` y `Locator.ariaSnapshot` como representaciones YAML del árbol accesible. No equivalen a una representación completa del conocimiento empresarial.

Fuente: [ARIA snapshots 1.62.1, L421–449](https://github.com/microsoft/playwright/blob/v1.62.1/docs/src/aria-snapshots.md?utm_source=chatgpt.com#L421-L449).

### **7.3. Arquitectura recomendada de Discovery**

El híbrido es el candidato principal, no un extractor seleccionado experimentalmente.

No se propone utilizar todos los canales indiscriminadamente en cada página. La estrategia deberá expandir la observación cuando el contexto inicial no permita alcanzar las obligaciones de cobertura y calidad.

### **7.4. Contrato de conocimiento**

Cada elemento deberá distinguir:

```
knowledge_item:
  identity: stable_semantic_reference
  kind: unit | state | transition | control | relation | rule
  application_scope: reference
  aut_revision: reference_or_unknown
  policy_revision: reference
  effective_role: reference
  effective_profile: opaque_reference
  locale: reference
  frame_scope: reference
  state_scope: reference
  extractor_version: reference
  provenance: []
  observation_status: reference
  accreditation_status: reference
  locator_candidates: []
  evidence_refs: []
  dependencies: []
  invalidation_state: reference
```

Este modelo es semántico. No selecciona una tecnología de persistencia ni reemplaza el contrato de almacenamiento de AV-03.

Una relación inferida no adquiere autoridad por haber sido persistida. Una regla de negocio no se acredita por localizar un control con un texto relacionado.

Las inferencias requieren promoción mediante fuentes y testigos acordes con AV-01, AV-03 y AV-04.

### **7.5. Denominadores y cobertura**

El inventario independiente debe congelar antes del experimento:

- Elementos esperados.
- Clase y ámbito.
- Estado y perfil requerido.
- Aplicabilidad.
- Autoridad disponible.
- Testigo de referencia.

La cobertura deberá diferenciar:

| Estado                  | Interpretación                                                |
| ----------------------- | ------------------------------------------------------------- |
| Acreditado              | Observación o afirmación respaldada por evidencia suficiente. |
| Observado sin acreditar | Existe información, pero no satisface el nivel de prueba.     |
| Esperado no observado   | Debe permanecer visible como brecha.                          |
| Inaccesible acreditado  | Permiso denegado o impedimento confirmado.                    |
| Opaco por tecnología    | Existe límite de observación.                                 |
| No aplicable acreditado | Exclusión respaldada por evidencia y regla de aplicabilidad.  |
| Indeterminado           | No se conoce la existencia, alcance o aplicabilidad.          |

Se reportarán tanto el universo de obligaciones como el subconjunto evaluable bajo autoridad vigente.

No se excluirá una unidad del denominador únicamente porque el extractor no pueda acceder a ella.

El denominador congelado podrá evolucionar mediante revisiones auditables de descubrimientos legítimos, pero los resultados históricos conservarán el universo que les correspondía.

### **7.6. Identidad semántica y localizadores**

Un localizador debe probar más que unicidad.

La identidad incluye aplicación, revisión, estado, frame, raíz encapsulada, contexto funcional, rol, locale y expectativa.

Por ejemplo, dos botones denominados «Guardar» pueden ser únicos dentro de contenedores distintos y producir efectos diferentes.

Los localizadores alternativos podrán:

- Reemplazar un mecanismo técnico de localización.
- Conservar la misma intención funcional.
- Utilizar un testigo independiente de identidad y efecto.

No podrán cambiar silenciosamente el objetivo de la acción para conseguir un PASS.

La autorreparación que modifique intención, ámbito, efecto o expectativa requerirá revisión y nueva acreditación.

### **7.7. Casos de profundidad obligatorios**

El Discovery debe conservar cobertura explícita para:

| Caso                      | Comprobación necesaria                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| Tabla virtualizada        | Estados o ventanas lógicas, sin depender de filas montadas inicialmente. |
| Paginación                | Frontera de páginas y registros esperados.                               |
| Filtros                   | Cambio de estado y efecto mediante testigo.                              |
| Wizard                    | Estados intermedios, dependencias y checkpoint.                          |
| Ruta SPA con URL idéntica | Identidad de estado distinta de la URL.                                  |
| Diálogo dinámico          | Apertura, contenido, controles, foco y transición.                       |
| Shadow DOM abierto        | Recorrido y localización autorizados.                                    |
| Shadow DOM cerrado        | Límite declarado; alternativa funcional si existe.                       |
| Iframe cross-origin       | Autoridad independiente y cobertura por frame.                           |
| Cambio de rol             | Revalidación de permisos, sesión y alcance.                              |
| Cambio de idioma          | Identidad estable, traducciones y formatos acreditables.                 |

Un Shadow DOM cerrado no autoriza introducir modificaciones invasivas al AUT para abrirlo. Cuando no exista vía legítima de observación interna se utilizará una alternativa funcional autorizada o se registrará el límite.

### **7.8. Persistencia e invalidación**

La invalidación deberá operar según evidencia disponible:

| Situación                                               | Acción                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| Dependencia local conocida y verificable                | Invalidación localizada.                                       |
| Revisión alterada con dependencia parcialmente conocida | Ampliar a los componentes dependientes.                        |
| Drift global o procedencia insuficiente                 | Invalidación conservadora del ámbito afectado.                 |
| Cambio de principal, tenant o permiso                   | Reautorizar y bloquear reutilización incompatible.             |
| Cambio de locale                                        | Revalidar elementos lingüísticos y localizadores dependientes. |
| Revisión desconocida                                    | No garantizar vigencia; revalidar conforme a obligación.       |

El conocimiento histórico no se elimina por perder vigencia. Se conserva como antecedente, evitando su promoción automática al estado acreditado actual.

El checkpoint guardará frontera pendiente, observaciones, revisiones, deduplicación, cursor y presupuesto. El commit del progreso y la identidad de la revisión deben mantener consistencia ante interrupciones.

### **7.9. Enmienda vinculante CV06-04**

> Discovery será híbrido, incremental, autorizado y persistente. Sus representaciones distinguirán unidades, estados, transiciones, controles, relaciones y reglas, con procedencia, identidad contextual y acreditación independiente. Los denominadores se congelarán por clase y perfil e incluirán los elementos esperados no observados. Los localizadores alternativos solo conservarán validez si mantienen intención y testigo. La invalidación será localizada únicamente cuando la dependencia esté acreditada; en otro caso ampliará conservadoramente el ámbito. Ningún ahorro de extracción podrá sustituir cobertura obligatoria ni producir falsos PASS.

**Dictamen O4:** favorable con enmienda. Selección de extractor y calidad pendientes de EXP-02.

## **8. O5 — AR-37: instalación ligera y cadena de confianza**

### **8.1. Hallazgos del código**

Se confirman los principales hallazgos de Codex y se identifican consecuencias adicionales.

| Evidencia                                                                                                                                                                                                    | Consecuencia                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [playwright-detector.ts L14–48](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/cli/src/utils/playwright-detector.ts?utm_source=chatgpt.com#L14-L48)                | Examina dependencias declaradas en el proyecto. No acredita instalación efectiva ni disponibilidad funcional. |
| [state-runtime.ts L7–53](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/mcp/src/handlers/state-runtime.ts?utm_source=chatgpt.com#L7-L53)                           | Comprueba existencia de rutas de navegadores. No garantiza que el runner utilice el binario detectado.        |
| [register.ts L84–119](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/mcp/src/register.ts?utm_source=chatgpt.com#L84-L119)                                          | Registra mediante `npx -y @hyouka73/qap-cli` sin versión fijada, para Cursor y Claude Desktop.                |
| [AGENTS.md](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/AGENTS.md?utm_source=chatgpt.com)                                                                                | Documenta Node ≥18 y recomienda Node 20, además de mecanismos manuales de registro.                           |
| [CLI tsup.config.ts](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/cli/tsup.config.ts?utm_source=chatgpt.com)                                                     | Declara target `node18` y dependencias externas que requieren resolución efectiva.                            |
| [MCP tsup.config.ts L30–42](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/mcp/tsup.config.ts?utm_source=chatgpt.com#L30-L42)                                      | Declara target `node18`.                                                                                      |
| [SQLite Knowledge Adapter L35–66](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts?utm_source=chatgpt.com#L35-L66) | Requiere `node:sqlite` y comprueba `ENABLE_FTS5` mediante una base en memoria.                                |

### **8.2. Incompatibilidad documental de Node**

Un target de compilación `node18` no acredita compatibilidad funcional con Node 18.

Las versiones estables de Playwright examinadas requieren Node ≥20. El adaptador de conocimiento comprueba SQLite y FTS5 y contiene una referencia a Node ≥22.16.0 en su diagnóstico.

Tampoco debe asumirse que cualquier distribución de Node ≥22.16.0 satisfaga automáticamente las capacidades requeridas.

**Resolución:** el piso real deberá derivarse del conjunto completo de dependencias, APIs nativas, empaquetado, SQLite/FTS5, sandbox y bootstrap.

Node 24 LTS constituye un candidato razonable de investigación, no una selección definitiva. La documentación versionada de Node 24.15.0 permite identificar las APIs SQLite disponibles.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js v24.15.0 Documentation



El runtime y su distribución permanecen bajo AR-23 y AV-07.

### **8.3. Registro MCP por host**

Claude Desktop y Claude Code son productos diferentes. La existencia de configuración para uno no acredita la interoperabilidad del otro.

| Host           | Situación documental                               | Prueba necesaria                                                  |
| -------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Antigravity    | Registro y configuración documentados parcialmente | Bootstrap, sesión real, negociación y recorrido canónico.         |
| Codex          | Host obligatorio según D13                         | Registro, conexión, ejecución y recuperación.                     |
| Claude Code    | Host obligatorio según D13                         | Registro propio y funcionamiento independiente de Claude Desktop. |
| Gemini CLI     | Host obligatorio según D13                         | Bootstrap y paridad efectiva.                                     |
| Cursor         | Registro presente en código                        | Calificación si integra el alcance representativo.                |
| Claude Desktop | Registro presente en código                        | Calificación independiente de Claude Code.                        |

Se mantiene EXP-01a como contrato de interoperabilidad. No se duplica su auditoría ni se declara compatibilidad universal.

La instalación deberá producir una referencia verificable al paquete y entrypoint efectivos. Un comando no versionado que pueda resolver otra publicación o descargar componentes durante cada arranque no satisface por sí solo el contrato de distribución reproducible.

### **8.4. Catálogo de componentes**

Se propone un catálogo de provisión por capacidad.

| Componente                           | Condición de provisión                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| Núcleo QAP, CLI y MCP                | Bootstrap base.                                                 |
| Runtime y persistencia               | Necesarios para las capacidades contratadas.                    |
| Motor de navegador                   | Según modalidad y capacidad solicitada.                         |
| Chromium Headless Shell              | Solo si se selecciona y acredita su perfil.                     |
| Chromium completo                    | Visible o cuando la configuración lo requiera.                  |
| Chrome/Edge de sistema               | Utilización autorizada; no gestión unilateral de actualización. |
| Firefox/WebKit                       | Bajo demanda cuando la capacidad lo requiera.                   |
| Codificador y componentes multimedia | Según contrato de evidencia.                                    |
| OCR, parsers y modelos auxiliares    | Según capacidades documentales y frontera acreditada.           |
| Broker criptográfico o VM            | Según selección de AV-02/05/07.                                 |

La instalación ligera no significa eliminar componentes obligatorios.

Significa evitar instalarlos cuando la capacidad correspondiente todavía no se utiliza, salvo que formen parte de una dependencia indispensable o de un paquete offline preaprovisionado.

Playwright 1.63.0 documenta las opciones `--only-shell` y `--no-shell`, que permiten evitar determinadas descargas. Estas opciones constituyen mecanismos candidatos, no instrucciones autorizadas de instalación en esta auditoría.

Fuente: [documentación browsers 1.63.0](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/browsers.md?utm_source=chatgpt.com#L345-L441).

### **8.5. Manifiesto y autenticidad**

El manifiesto de aprovisionamiento deberá incluir:

```
component:
  logical_id: reference
  version: exact
  source: authorized_provider_reference
  distribution: exact_artifact
  platform: exact
  architecture: exact
  expected_digest: reference
  digest_algorithm: reference
  manifest_authentication: reference
  licensing_record: reference
  dependencies: []
  expected_capabilities: []
  installed_identity: reference_or_absent
  activation_generation: reference
```

Un digest protege contra alteraciones respecto de un valor esperado. No demuestra por sí mismo que dicho valor provenga de una autoridad confiable.

El mecanismo deberá establecer autenticidad del manifiesto mediante firma, raíz de confianza o canal acreditado equivalente, conservando procedencia, revisión y autorización.

No se afirma que todos los proveedores entreguen manifiestos firmados de forma equivalente. Cuando no exista una ruta aceptable, el componente quedará pendiente o bloqueado.

### **8.6. Aprovisionamiento transaccional y recuperación**

El proceso propuesto será:

1

**Resolución**

Determinar componente, versión, plataforma y procedencia autorizada.

2

**Reserva y lock**

Reservar cuota y adquirir exclusión por revisión y destino.

3

**Descarga protegida**

Usar staging propio y mantener TLS válido.

4

**Verificación**

Comprobar autenticidad, integridad y contenido del paquete.

5

**Validación funcional**

Verificar arranque, identidad y capacidad aplicable.

6
**Promoción**

Publicar referencia activa mediante mecanismo atómico acreditado.

7

**Reconciliación**

Conservar versión anterior compatible y limpiar únicamente objetos propios.

La promoción deberá comprobar la semántica real del sistema de archivos y volumen.

No se asumirá atomicidad de un movimiento entre volúmenes ni equivalencia entre renombrado, durabilidad y persistencia ante pérdida de energía.

La protección debe incluir:

- Archivos truncados o parcialmente descargados.
- Instaladores concurrentes.
- Locks caducados.
- Traversal de rutas.
- Symlinks y reparse points.
- Sustitución entre verificación y apertura.
- Cuotas y espacio insuficiente.
- Activación parcial.
- Rollback incompatible con migraciones.

La validación del destino y de la identidad del objeto deberá efectuarse mediante mecanismos efectivos de apertura y confinamiento, no exclusivamente mediante comparación textual de rutas.

### **8.7. Caché y navegadores corporativos**

QAP deberá administrar su propio espacio de caché con identidad, propietario, referencias activas, cuotas y limpieza gobernada.

No eliminará indiscriminadamente la caché compartida de Playwright ni los navegadores instalados por el usuario.

Chrome y Edge corporativos están sujetos a políticas de fabricante, administrador y organización. Playwright documenta expresamente que esas políticas pueden afectar red, extensiones y capacidades de automatización.

Fuente: [Playwright 1.63.0, políticas empresariales](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/browsers.md?utm_source=chatgpt.com#L578-L580).

Si un navegador administrado cambia de versión:

1. Detectar la modificación.
2. Invalidar la acreditación dependiente cuando corresponda.
3. Ejecutar la recalificación autorizada.
4. Utilizar una alternativa elegible o bloquear la capacidad.

QAP no desactivará políticas corporativas, sandbox, controles TLS o extensiones obligatorias para forzar la compatibilidad.

### **8.8. Offline**

Se distinguen tres situaciones:

| Modalidad                            | Contrato                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Instalación online                   | Descarga autorizada, autenticada y verificable.                            |
| Instalación offline preaprovisionada | Uso de un inventario completo, íntegro y compatible previamente adquirido. |
| Instalación offline desde cero       | Solo viable si existe un medio local con todos los componentes requeridos. |

El funcionamiento offline no implica que una aplicación empresarial remota pueda probarse sin conectividad.

Sí exige identificar qué capacidades locales funcionan sin egress, incluyendo almacenamiento, procesamiento autorizado, reportes y reproducción portable.

### **8.9. Coste de distribución**

EXP-04 deberá medir separadamente:

- Bytes de descarga inicial.
- Bytes incrementales por capacidad.
- Tamaño descomprimido.
- Duplicación de revisiones.
- Espacio temporal máximo.
- Huella acumulada.
- Tiempo de arranque y aprovisionamiento.
- Dependencias nativas y pasos que requieren privilegios.
- Coste de actualización, rollback y mantenimiento.

No se declarará una instalación ligera únicamente porque utiliza descargas diferidas.

Un broker, runtime auxiliar o VM puede incrementar materialmente la huella. Su coste debe incluirse sin desactivar fronteras de seguridad.

### **8.10. Enmienda vinculante CV06-05**

> QAP aprovisionará componentes por capacidad mediante catálogo versionado, procedencia autenticada, verificación de integridad, exclusión concurrente, confinamiento y promoción recuperable. El doctor acreditará identidad y funcionamiento efectivo, no mera presencia de paquetes. El bootstrap deberá distinguir los hosts D13 y fijar el artefacto consumido. La calificación preliminar de runtime y dependencias se realizará en G0 antes de congelarlos, el smoke del paquete en G1 y la distribución completa en G5. Esta secuencia no autoriza iniciar las compuertas ni convierte sus pruebas futuras en prerrequisitos circulares de planificación.

**Dictamen O5:** favorable condicionado a las enmiendas. AR-23, EXP-01a y las dependencias de AV-07 permanecen abiertas.

## **9. O6 — AR-39: evidencia multimedia, privacidad y portabilidad**

### **9.1. Verificación del código actual**

En [runner.ts L402–484](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/playwright-runner/src/runner.ts?utm_source=chatgpt.com#L402-L484) se observan:

- Directorios temporales de video.
- Activación de `recordVideo` según condiciones de ejecución.
- Tamaño de video configurado en 1280 × 720.
- Activación potencial de tracing con screenshots y snapshots.

Estas capacidades no acreditan custodia desde el primer byte, exclusión preventiva de secretos ni fidelidad en todas las modalidades.

La configuración de dimensiones tampoco garantiza por sí sola que el video preserve la geometría real del viewport.

En [template/index.html L12–19](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/reporter/src/template/index.html?utm_source=chatgpt.com#L12-L19) se identifican referencias externas a Google Fonts y Tailwind CDN.

Este hallazgo confirma una brecha para portabilidad offline en ese template. No implica afirmar que todos los reportes generados por el repositorio utilicen necesariamente esa misma ruta.

### **9.2. APIs versionadas de captura**

Se verificó que la documentación de `Screencast` es idéntica en los tags 1.62.1 y 1.63.0 examinados.

Blob de documentación: `ba9817177514e62333cdd7f418562530be3669b4`.

| Capacidad                          | 1.62.1 / 1.63.0                  | Interpretación                                                                    |
| ---------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `recordVideo`                      | Disponible                       | Grabación mediante contexto; requiere comprobar productores y archivos efectivos. |
| `page.screencast.start({path})`    | Documentado                      | Grabación nativa candidata.                                                       |
| `page.screencast.start({onFrame})` | Documentado                      | Entrega JPEG, timestamp y geometría del viewport.                                 |
| `size`                             | Documentado                      | Dimensiones máximas; puede quedar subordinado a un capturador activo.             |
| `quality`                          | Documentado                      | Calidad de imagen, no garantía de prevención.                                     |
| `fps`                              | No acreditado en estas versiones | No utilizar como capacidad presumida.                                             |
| `style`                            | No acreditado en estas versiones | No presumir exclusión preventiva.                                                 |

Fuentes: [Screencast 1.62.1](https://github.com/microsoft/playwright/blob/v1.62.1/docs/src/api/class-screencast.md?utm_source=chatgpt.com) y [Screencast 1.63.0](https://github.com/microsoft/playwright/blob/v1.63.0/docs/src/api/class-screencast.md?utm_source=chatgpt.com).

Las APIs de screencast fueron introducidas antes de las versiones examinadas, pero la disponibilidad declarada de una API no acredita su equivalencia por motor, canal y plataforma.

Debe comprobarse especialmente si otro productor activo modifica configuración, dimensiones o comportamiento.

### **9.3. Preservación de AR-27**

Rige la [Fe de correcciones AR-27](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/fe-correcciones-ar27.md?utm_source=chatgpt.com).

Se conserva sin modificar el orden de arquitecturas candidatas:

| Ruta | Función                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| C    | Captura nativa por página, almacenamiento confinado y cifrado desde el primer byte, sellado y publicación autenticada. |
| A    | Respaldo mediante `onFrame`, cola acotada, codificación controlada y salida protegida.                                 |

No se reintroduce un formato criptográfico propio. Se conserva la construcción revisada, la evaluación de Streaming AEAD y la selección pendiente conforme a EXP-06a.

La alternativa A puede proporcionar mayor control sobre determinados productores de archivos. No elimina por sí sola las superficies de captura prohibida, la existencia de temporales del navegador ni la necesidad de barreras previas.

### **9.4. Corrección material de supresión**

El informe principal de Codex indica que, si falta barrera previa, debe suprimirse el intervalo. Esta formulación necesita precisar el momento efectivo de la supresión.

**Debe prevalecer la supresión anterior a la admisión de la superficie sensible.**

**Secuencia compatible con prevención**

**Secuencia incompatible con prevención**

Eliminar después el intervalo capturado constituye contención. No convierte el resultado en prevención exitosa.

Si una transición conocida puede presentar MFA, SSO, login o contenido prohibido sin señal previa acreditada, se suprimirá desde antes del intervalo completo.

Cuando no pueda determinarse el comienzo seguro, se ampliará la supresión al caso, módulo, contexto o superficie correspondiente.

El riesgo de material sensible imprevisible dentro de negocio previamente admitido conserva tratamiento independiente bajo DE-02. No se contabilizará como prevención superada si llega a capturarse.

### **9.5. Custodia efectiva desde primera escritura**

La frontera incluye, entre otros:

| Superficie                 | Verificación                                  |
| -------------------------- | --------------------------------------------- |
| `artifactsDir`             | Ubicación efectiva del lado servidor.         |
| `recordVideo.dir`          | Directorio de producción inicial.             |
| `saveAs`                   | Destino y cualquier copia intermedia.         |
| Perfiles y caché           | Confinamiento e identidad del principal.      |
| FFmpeg y muxer             | Temporales y salidas efectivamente escritos.  |
| Descargas y parser         | Custodia previa a la escritura.               |
| Colas IPC                  | Protección de buffers y archivos de respaldo. |
| Swap, volcados y snapshots | Garantías y riesgo residual explícitos.       |

Un archivo cifrado después de completarse no demuestra que sus bytes previos estuvieran protegidos.

Debe verificarse el cifrado efectivo del volumen y la separación de principal conforme a los contratos aceptados. Son fronteras diferentes.

Se mantienen AAD, vinculación de identidad, generación, catálogo durable, sellado, lectura posicionada autenticada y manejo de claves establecidos en la fe de AR-27.

### **9.6. Capacidades por celda**

| Distribución      | Captura candidata                       | Reserva                                         |
| ----------------- | --------------------------------------- | ----------------------------------------------- |
| Chromium Shell    | C y, si procede, A                      | Fidelidad, geometría, presión y prevención.     |
| Chromium completo | C y A                                   | Probar visible y headless por separado.         |
| Chrome            | C/A según revisión efectiva             | Políticas, codecs, SSO, frames y actualización. |
| Edge              | C/A según revisión efectiva             | Pruebas independientes por canal.               |
| Firefox PW        | Captura nativa o alternativa compatible | No trasladar garantías específicas de Chromium. |
| WebKit PW         | Captura nativa o alternativa compatible | No trasladar garantías de otros motores.        |

Ninguna celda adquiere acreditación por pertenecer a la familia Chromium.

Una ruta candidata viable en Firefox o WebKit puede requerir una implementación equivalente de captura y confinamiento. Si no existe una vía acreditada para una capacidad obligatoria, se conserva el bloqueo y se eleva al propietario.

### **9.7. Evidencia genuina y verificable**

Los controles positivos deberán demostrar:

- WebM auténtico y decodificable.
- Movimiento real y cambios reconocibles.
- PNG genuino vinculado al paso.
- Dimensiones, escala y relación de aspecto registradas.
- Correspondencia temporal entre acciones, video y testigos.
- Reproducción, pausa, reanudación y búsqueda temporal.
- Funcionamiento bajo presión de recursos.
- Detección explícita de archivos dañados, ausentes o incompletos.

No se aceptará un video vacío, una imagen estática presentada como grabación funcional ni la supresión de todas las superficies como demostración de capacidad multimedia.

La prevención, la fidelidad, la autenticidad, la cobertura y la disponibilidad de evidencia constituyen ejes distintos.

### **9.8. Diferenciación de ausencia de evidencia**

| Situación                                | Tratamiento                                                  |
| ---------------------------------------- | ------------------------------------------------------------ |
| Medio no exigible por permiso o política | Registrar exclusión autorizada.                              |
| Medio obligatorio no generado            | Registrar incumplimiento de obligación.                      |
| Medio suprimido preventivamente          | Registrar alcance, motivo y pérdida de cobertura si procede. |
| Medio corrupto                           | Incidencia de integridad.                                    |
| Medio expirado o podado                  | Estado histórico y política aplicada.                        |
| Medio capturado prohibidamente           | Fallo de prevención, aunque sea contenido después.           |

El veredicto funcional no se reescribe automáticamente por falta o corrupción de evidencia.

La aceptación global de la ejecución sí podrá quedar vetada cuando exista incumplimiento de obligaciones de entrega o seguridad, conforme a AV-04.

### **9.9. Portabilidad y autenticidad**

Se conservan dos superficies distintas:

**Visor local autenticado:** requiere catálogo, autoridad, comprobación de integridad, rangos autorizados y revocación.

**Exportación portable saneada:** debe funcionar independientemente de los servicios de QAP y sin acceso externo, con recursos locales y ancla de autenticidad.

El manifiesto exportado deberá vincularse a una fuente de confianza externa al propio paquete. Un atacante capaz de modificar simultáneamente los archivos y su manifiesto no debe poder presentar la modificación como legítima.

Se verificarán:

- Rutas relativas confinadas.
- Alteraciones, adiciones y omisiones.
- Firma y ancla externa.
- Compatibilidad de nombres, Unicode y espacios.
- Traslado entre Windows, macOS y Linux.
- Ausencia de dependencias CDN.
- Apertura y reproducción sin red.
- HTML y referencias seguras frente a contenido no confiable.
- Conservación de identidad y resultado histórico.

La revocación impide nuevas operaciones y emisiones conforme a las barreras definidas. No recupera copias ya entregadas ni promete borrar contenido que abandonó el control de QAP.

### **9.10. Enmienda vinculante CV06-06**

> Las arquitecturas C y A conservarán los contratos de AR-27. Ningún productor podrá armarse antes de acreditar la exclusión preventiva de superficies prohibidas y custodia desde el primer byte. Cuando una transición sensible conocida carezca de barrera previa, deberá suprimirse la captura desde antes de admitir el intervalo completo. La captura posterior contenida constituye fallo de prevención. Se verificarán medios genuinos, sincronía, búsqueda, autenticidad y portabilidad por combinación efectiva. La ausencia legítima de captura, las obligaciones incumplidas y los límites tecnológicos permanecerán diferenciados.

**Dictamen O6:** favorable condicionado. EXP-06a conserva su carácter de compuerta y ninguna modalidad privada queda activada por este informe.

## **10. O7 — AR-39: accesibilidad como capacidad de lanzamiento**

### **10.1. Distinción de productos evaluados**

Deben mantenerse dos expedientes de accesibilidad:

| Expediente                       | Objeto                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Accesibilidad de QAP             | CLI cuando corresponda, interfaz, visor, reportes y navegación de evidencias. |
| Pruebas de accesibilidad del AUT | Estados críticos de las aplicaciones sometidas a pruebas funcionales.         |

La accesibilidad del visor no demuestra que QAP pueda auditar el AUT.

La disponibilidad de un scanner tampoco acredita la accesibilidad del propio producto.

El [catálogo REQ-QA-003](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com#req-qa-003) exige reglas versionadas, cobertura, exclusiones y comprobaciones manuales pendientes.

### **10.2. Evaluación de axe-core**

Se confirmó axe-core 4.14.1 como versión publicada y candidata.

- Licencia declarada: MPL-2.0.
- Reglas para distintos criterios WCAG.
- Resultados con violaciones, comprobaciones incompletas y no aplicabilidad.
- Evaluación sobre documentos y frames sujetos a condiciones de configuración.

La versión incluye correcciones capaces de modificar los hallazgos respecto de revisiones anteriores. Esto refuerza la necesidad de fijar motor y reglas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Fuentes primarias: [package.json v4.14.1](https://github.com/dequelabs/axe-core/blob/v4.14.1/package.json?utm_source=chatgpt.com), [README](https://github.com/dequelabs/axe-core/blob/v4.14.1/README.md?utm_source=chatgpt.com) y [API versionada](https://github.com/dequelabs/axe-core/blob/v4.14.1/doc/API.md?utm_source=chatgpt.com).

### **10.3. Frames, orígenes y Shadow DOM**

La documentación de axe-core establece condiciones explícitas para ejecutar el motor en frames y comunicar resultados entre orígenes.

El scanner no debe recibir autorización implícita para acceder a frames cross-origin.

Se prohíbe utilizar configuraciones globales permisivas, incluida `unsafe_all_origins`, como solución general a una brecha de cobertura.

Cada frame requiere:

- Autoridad efectiva.
- Identidad y procedencia.
- Reglas de inspección.
- Resultado o causa de ausencia.
- Saneamiento de datos y hallazgos.

El uso de scripts de auditoría deberá conservar la funcionalidad del AUT y no introducir egress no autorizado, persistencia invasiva ni modificaciones funcionales.

Las limitaciones de Shadow DOM deberán registrarse por estado y motor, sin declarar cobertura completa cuando no se obtuvo.

### **10.4. Capacidad de evaluación**

| Dimensión                  | Método candidato                                            | Reserva                                                     |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Nombres y roles accesibles | axe-core y aserciones semánticas                            | Requiere expectativas y contexto.                           |
| Contraste                  | Reglas automatizadas                                        | Estados y composiciones complejas pueden requerir revisión. |
| Navegación por teclado     | Secuencias de acciones y testigos                           | Debe comprobar comportamiento real.                         |
| Foco visible y orden       | Capturas y navegación efectiva                              | No se acredita solo por estructura DOM.                     |
| Diálogos                   | Semántica, entrada/salida de foco                           | Requiere estado dinámico.                                   |
| Zoom y reflow              | Comparación por geometría y contenido                       | No equivale a captura estática aislada.                     |
| Lector de pantalla         | Comprobación representativa manual o integración específica | No inferir funcionamiento por ausencia de violaciones.      |
| Traducción y locale        | Oráculos lingüísticos y estructura                          | No convertir inferencias del HOST en reglas acreditadas.    |

WCAG 2.2 constituye una referencia normativa versionada adecuada, pero la conformidad integral exige evaluar las obligaciones aplicables, no únicamente las comprobaciones automatizables.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

w3.org



### **10.5. Estados de comprobación**

Los resultados de accesibilidad deberán distinguir:

- Hallazgo acreditado.
- Comprobación satisfecha.
- Indeterminado.
- No evaluado.
- No aplicable acreditado.
- Comprobación manual pendiente.
- Exclusión autorizada.
- Obligación incumplida de cobertura.

La ausencia de hallazgos no equivale a ausencia de defectos.

Un scanner que omite un defecto sembrado no produce éxito del requisito correspondiente; produce una limitación de detección que debe permanecer visible.

### **10.6. Enmienda vinculante CV06-07**

> QAP incorporará desde el lanzamiento una capacidad acreditable de evaluación de accesibilidad y un visor cuya accesibilidad se verifique por separado. Los motores automatizados, reglas y procedimientos manuales estarán versionados y sujetos a autorización. Los resultados conservarán denominadores, estados no evaluados, limitaciones y comprobaciones pendientes. No se declarará conformidad WCAG integral por un scanner ni se convertirá la accesibilidad en obligación universal de cada campaña mientras DE-05 permanezca abierta.

**Dictamen O7:** favorable con enmienda. Se conserva la capacidad de lanzamiento y se transfiere a AV-08 la determinación de cobertura y aceptación final.

## **11. O8 — AR-49: optimización verificable de tokens**

### **11.1. Verificación del punto de partida**

La base contiene mecanismos parciales de recuperación y continuidad:

- Revisiones persistidas de Discovery.
- Selección de rutas reanudables.
- Proyección de información al HOST.
- Reanudación de determinadas tareas.

El código de [server.ts L1530–1549](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/packages/mcp/src/server.ts?utm_source=chatgpt.com#L1530-L1549) acredita la selección de un checkpoint compatible con ámbito y perfil en esa ruta concreta.

No demuestra ahorro medido de tokens frente a otro agente ni garantiza que todas las tareas puedan recuperarse sin nueva inferencia.

### **11.2. Estrategia técnica recomendada**

QAP debe separar razonamiento de ejecución y almacenamiento.

La ejecución determinista reduce la necesidad potencial de inferencia por paso; el beneficio real todavía debe medirse.

La estrategia propuesta combina:

- Contexto estructurado por ámbito.
- Referencias a conocimiento canónico.
- Paginación y recuperación selectiva.
- Deltas entre revisiones.
- Resúmenes con procedencia.
- Replay determinista de planes acreditados.
- Handoff sin repetir innecesariamente el onboarding.
- Expansión de contexto cuando resulte insuficiente.

No se propone desarrollar un modelo de lenguaje propio ni introducir dependencias de inferencia externa obligatorias.

Se mantienen HOST y DETERMINISTIC conforme a D03.

### **11.3. Baseline competente**

La principal corrección consiste en evitar comparar QAP contra un agente deliberadamente ineficiente.

Se establece un baseline razonable:

> Agente competente con acceso al contenido autorizado necesario para cumplir la misma tarea, empleando las capacidades normales del host, su contexto disponible y procedimientos razonables de recuperación y exploración.

Si el contenido completo no cabe en la ventana de contexto, se aplicará una alternativa realista:

- Paginación convencional.
- Búsqueda documental.
- Exploración por secciones.
- Reexploración selectiva.
- Procedimientos normalmente disponibles al agente.

No se obliga al brazo baseline a reenviar todo el inventario en cada paso si un agente competente no lo haría.

Tampoco se permite que el brazo optimizado omita obligaciones para aparentar ahorro.

### **11.4. Perímetros de medición**

| Métrica                       | Tratamiento                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| Tokens reales de entrada      | Registrar contador efectivo, si está disponible.              |
| Tokens reales de salida       | Registrar contador efectivo.                                  |
| Razonamiento                  | Registrar únicamente si la fuente lo expone.                  |
| Tokens en caché               | Separar su semántica y tratamiento de facturación.            |
| Tokens de herramientas        | Identificar si ya están incluidos en entrada o salida.        |
| Estimación de payload visible | Análisis separado con tokenizer fijado.                       |
| Bytes transmitidos            | Métrica independiente, no equivalente a tokens.               |
| Llamadas al HOST              | Métrica independiente.                                        |
| Latencia                      | Incluir tarea completa y recuperación.                        |
| Coste monetario               | Solo con tarifa oficial, modelo y modo de cobro verificables. |

No se sumarán categorías que ya se encuentren contenidas en otras métricas.

No se compararán directamente tokenizadores de familias distintas sin estratificación.

### **11.5. Ahorro válido**

Cuando exista telemetría comparable podrá calcularse:

\\[ S_T=\frac{T_B-T_Q}{T_B}\times100 \\]

Donde:

- \\(T_B\\): tokens totales observados del baseline para la tarea completa.
- \\(T_Q\\): tokens totales observados de QAP para una tarea equivalente.

La métrica solo será válida cuando el denominador sea positivo y ambos brazos mantengan obligaciones y resultados comparables.

Los totales incluyen los intentos, fallos, aclaraciones y reanudaciones correspondientes al episodio experimental.

Una ejecución incompleta no constituye evidencia favorable de ahorro. Los episodios fallidos se conservan y se informan por separado, además de cualquier agregado predeclarado.

### **11.6. Equivalencia de tareas**

Debe mantenerse:

| Variable      | Control                                   |
| ------------- | ----------------------------------------- |
| HOST          | Mismo cliente y build por estrato.        |
| Modelo        | Misma versión por comparación pareada.    |
| Tokenizer     | Misma identidad y semántica.              |
| Instrucciones | Equivalentes en obligaciones y políticas. |
| Permisos      | Idénticos y vigentes.                     |
| Fixture       | Misma revisión y condiciones iniciales.   |
| Tareas        | Mismos objetivos y oráculos.              |
| Cobertura     | Denominador congelado.                    |
| Presupuesto   | Comparable y predeclarado.                |
| Caché         | Controlada o reportada separadamente.     |

Cuando el handoff utilice modelos diferentes, se compararán tramos equivalentes por modelo y se conservará la composición del episodio.

No se fabricará un agregado único de tokens de diferentes tokenizadores como si fueran una unidad homogénea.

### **11.7. Ausencia de telemetría**

Existen tres posibles resultados:

| Disponibilidad                | Afirmación permitida                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Contadores reales comparables | Estimar ahorro observado con incertidumbre.                                        |
| Solo payload visible          | Estimar reducción del contenido visible, sin certificar ahorro real del proveedor. |
| Sin contadores suficientes    | Beneficio real de tokens indeterminado.                                            |

La ausencia de telemetría no significa ahorro cero ni autoriza atribuir un porcentaje.

Si una técnica reduce llamadas o bytes, podrá reconocerse esa mejora específica. No se convertirá automáticamente en ahorro de tokens.

### **11.8. Revocación y contexto obsoleto**

`ContextSnapshot` debe aplicar la autoridad vigente antes de emitir cada página o referencia.

Los cursores se vincularán a:

- Principal.
- Ámbito.
- Consulta.
- Perfil y política.
- Revisión.
- Generación de autoridad.

Una referencia persistida a un snapshot histórico no constituye permiso para recuperar su contenido tras revocación.

La expansión de contexto necesaria para completar una tarea debe estar permitida. Si no está autorizada, se conserva la incertidumbre y se evita producir afirmaciones acreditadas indebidamente.

### **11.9. Enmienda vinculante CV06-08**

> La optimización de tokens se evaluará mediante comparaciones pareadas contra un agente competente, bajo tareas y obligaciones equivalentes. Se contabilizará el episodio completo, incluidos fallos, intentos y reanudaciones. Tokens observados, estimaciones visibles, caché, razonamiento, bytes, llamadas y latencia permanecerán diferenciados. Ningún ahorro será certificado si depende de menor cobertura, relajación de autoridad, sobrecompresión o finalización prematura. Los porcentajes, presupuesto y umbrales de adopción continuarán pendientes de DE-03 y AV-08.

**Dictamen O8:** favorable como estrategia de investigación. AR-49 conserva el estado PENDIENTE.

# **12. Protocolos experimentales consolidados**

Los siguientes protocolos sustituyen los pasajes incompatibles de `protocolos-av06.md`.

Amplían los expedientes aceptados sin reemplazar AV-01–05, modificar criptografía, autorizar experimentos ni iniciar G0/G1.

## **12.1. Contrato común de registro experimental**

Todo experimento deberá congelar previamente:

```
experiment_manifest:
  experiment_id: reference
  protocol_revision: exact
  qap_commit: exact
  fixture_revision: exact
  fixture_seed: reference
  expected_obligations: reference
  independent_witnesses: []
  platform_identity: reference
  runtime_identity: reference
  browser_identity: reference
  effective_policy: reference
  authority_scope: reference
  workload_profile: reference
  experimental_arm: reference
  sampling_method: reference
  acceptance_rules: reference
  observability_limits: []
```

El resultado deberá conservar todos los intentos y sus estados, junto con:

- Obligaciones esperadas.
- Cobertura efectiva.
- Veredictos por afirmación.
- Incidencias técnicas.
- Estado de cleanup.
- Evidencia requerida y disponible.
- Recursos consumidos.
- Límites del observador.
- Dispersión e incertidumbre.
- Motivo de abandono o interrupción.
- Identidad de las fuentes utilizadas.

Los testigos no dependerán exclusivamente del mecanismo bajo evaluación.

Los umbrales de tolerancia, muestra y aceptación se predeclararán. No se ajustarán retrospectivamente para conseguir aprobación.

Los invariantes de seguridad y autenticidad no se convierten en tolerancias estadísticas.

## **13. EXP-02 consolidado — Discovery, fidelidad y extractores**

**Registros:** AR-16, AR-36 y contribución a AR-49.\
**Fase:** inicio de G2 y E4; integración posterior conforme al plan aceptado.\
**Finalidad:** seleccionar un método de Discovery capaz de satisfacer profundidad, fidelidad, persistencia y autoridad.

### **13.1. Brazos**

| Brazo | Método                                                     |
| ----- | ---------------------------------------------------------- |
| D1    | DOM estructural saneado.                                   |
| D2    | ARIA y snapshot accesible.                                 |
| D3    | Proyección semántica estructurada.                         |
| D4    | Observación de red autorizada.                             |
| D5    | Híbrido de las fuentes anteriores.                         |
| D6    | Híbrido con interacción controlada y testigos funcionales. |

Las fuentes individuales se evaluarán únicamente en las capacidades que razonablemente puedan ofrecer.

La selección del híbrido deberá identificar qué aportes incrementales justifican su coste.

Si existe una brecha material de Playwright, podrá agregarse un segundo backend con el mismo fixture, política, testigos y obligaciones.

### **13.2. Corpus**

El corpus controlado deberá incluir:

| Grupo                | Vectores mínimos                                                  |
| -------------------- | ----------------------------------------------------------------- |
| Fidelidad            | Recursos sanos, ausentes, denegados e hidratación mutante.        |
| Identidad            | Localizadores estables, duplicados y ambiguos.                    |
| Estados              | SPA same-document, wizard, diálogo y controles tardíos.           |
| Datos                | Tablas pequeñas, paginación, virtualización y escalas superiores. |
| Encapsulación        | Frames y Shadow DOM abierto/cerrado.                              |
| Autoridad            | Roles, tenants, permisos y recursos de terceros.                  |
| Internacionalización | Locale alterno, formatos y textos.                                |
| Continuidad          | Interrupción, duplicación, reanudación y handoff.                 |
| Drift                | Cambios conocidos, desconocidos y de alcance global.              |

Se conservarán los mínimos de alcance establecidos por AV-04 para los flujos que los requieran, incluyendo el fixture de tres módulos y dos roles.

### **13.3. Métricas**

Por clase y perfil se registrarán:

\\[ \text{Precisión}=\frac{TP}{TP+FP} \\]

\\[ \text{Recall}=\frac{TP}{TP+FN} \\]

Los denominadores vacíos se declararán explícitamente y no se convertirán automáticamente en resultados perfectos.

Además:

- Cobertura de unidades, estados y transiciones.
- Validez y ambigüedad de localizadores.
- Fidelidad visual y comportamiento.
- Falsos PASS y falsos negativos.
- Tiempo total.
- Coste de adquisición.
- Huella persistida.
- Payload.
- Tokens según telemetría.
- Trabajo recuperado y reexplorado.

### **13.4. Controles de aceptación**

| ID     | Control                       | Criterio                                                     |
| ------ | ----------------------------- | ------------------------------------------------------------ |
| E02-01 | SPA sana                      | Testigo funcional acredita comportamiento esperado.          |
| E02-02 | Mutante de hidratación        | No produce PASS funcional.                                   |
| E02-03 | Filtro sin efecto real        | Detectar contradicción con el testigo.                       |
| E02-04 | Recurso denegado              | Diagnóstico de autoridad, sin ampliación de permisos.        |
| E02-05 | Recurso ausente               | Diferenciarlo de denegación y mutante.                       |
| E02-06 | Selector ambiguo              | Abstención o desambiguación acreditada.                      |
| E02-07 | Identidad alterada            | No accionar otro objetivo bajo la intención anterior.        |
| E02-08 | Cambio de rol/tenant          | Cero reutilización incompatible.                             |
| E02-09 | Revocación durante Discovery  | Cese de operaciones afectadas y frontera persistida.         |
| E02-10 | Corte alrededor de checkpoint | Recuperación consistente, sin pérdida ni promoción indebida. |
| E02-11 | Drift parcialmente observable | Ampliación conservadora de invalidación.                     |
| E02-12 | Elemento esperado opaco       | Permanecer visible como brecha.                              |
| E02-13 | Cambio de locale              | Revalidación de identidad y contenido dependiente.           |
| E02-14 | Comparación de modalidades    | Diferencias explicadas por configuración y testigo.          |

### **13.5. Prueba mínima de selección**

Antes de fijar extractor y estrategia funcional se requiere, como mínimo:

- SPA sana y mutante.
- Recurso denegado y ausente.
- Localizador ambiguo.
- Dos roles.
- Dos escalas relevantes de datos.
- Reanudación con revisión modificada.

La prueba mínima permite selección provisional. No certifica por sí sola el corpus empresarial completo.

Los denominadores y las brechas se transfieren a AV-08, conservando sus compuertas de aceptación.

**Rechazo:** falso PASS, efecto no autorizado, pérdida de obligación, mezcla de identidades, localizador incorrecto o promoción de conocimiento sin testigo.

## **14. EXP-03 consolidado — Concurrencia, recursos y hardware**

**Registro principal:** AR-29.\
**Fases:** G3 y repetición instalada en G5.\
**Compuertas:** E3, E5 y E7.

### **14.1. Estrategias**

| Brazo | Estrategia                                                     |
| ----- | -------------------------------------------------------------- |
| C1    | Proceso nuevo por unidad elegible.                             |
| C2    | Reutilización de navegador dentro de una frontera acreditada.  |
| C3    | Contextos aislados según alcance, con contabilidad compartida. |
| C4    | Reciclaje por política, drenaje y reapertura.                  |

W=1 será referencia común.

W=2, W=4 y niveles adicionales se ensayarán cuando exista capacidad de admisión segura.

Ninguno de esos valores constituye por anticipado el techo de producto.

### **14.2. Perfiles de carga**

| Perfil                | Componentes                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Ligero                | Discovery y acciones permitidas, sin evidencia privada.                                               |
| Funcional             | SPA autenticada, interacción y evidencia autorizada.                                                  |
| Empresarial sintético | Navegación, persistencia, parsers/OCR autorizados, documentos, medios, repo, múltiples roles y visor. |
| Alternancia           | Aplicaciones A/B/C/A, con fronteras y preferencias distintas.                                         |

La comparación conservará obligaciones equivalentes dentro de cada perfil.

No se comparará un brazo sin captura contra otro con captura para atribuir toda la diferencia a eficiencia de concurrencia.

### **14.3. Instrumentación por plataforma**

| Recurso               | Windows                                         | macOS                              | Linux                                            |
| --------------------- | ----------------------------------------------- | ---------------------------------- | ------------------------------------------------ |
| Identidad de procesos | PID, tiempo de inicio, propietario y agrupación | PID, inicio y descendientes        | PID, inicio, propietario y cgroup cuando proceda |
| Memoria privada       | Private Bytes y contabilidad de commit          | Footprint y métricas nativas       | PSS, privada y cgroup                            |
| Memoria residente     | Working set, diferenciando privada/compartida   | RSS y footprint por separado       | RSS/PSS con semántica declarada                  |
| Presión global        | Memoria disponible, commit, paginación          | Presión, compresión y swap         | PSI, MemAvailable y swap                         |
| CPU                   | Contadores por proceso y sistema                | Observadores nativos               | Contabilidad por proceso/cgroup                  |
| Disco                 | IO, espacio, latencias y colas                  | IO, volumen y espacio              | IO, presión, espacio y eventos                   |
| GPU y auxiliares      | Inventario y telemetría disponible              | Inventario y telemetría disponible | Inventario y telemetría disponible               |

Referencias técnicas: [Windows Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects?utm_source=chatgpt.com) y [Linux PSI](https://www.kernel.org/doc/html/latest/accounting/psi.html?utm_source=chatgpt.com).

La selección exacta de observadores y herramientas queda pendiente de la plataforma y su versión.

PSS, footprint, commit privado y working set no son métricas intercambiables.

No se elaborará un agregado multiplataforma que las presente como si representaran la misma magnitud.

### **14.4. Perímetro del observador**

La instrumentación deberá incluir, cuando sean aplicables:

- Núcleo, ejecutor y supervisor.
- HOST atribuible.
- Browser, renderer y GPU.
- Códec y muxer.
- Brokers.
- Parsers, OCR y VM.
- Almacenamiento y procesos auxiliares.
- Visor y lectores concurrentes.
- Procesos propios residuales.

El coste del observador deberá medirse y declararse.

Cuando una VM o GPU impida atribución suficiente, no se tratará su consumo como cero.

Debe separarse el consumo de QAP de la presión global producida por otras aplicaciones.

### **14.5. Muestreo**

Se conserva como candidato un muestreo regular de un segundo para presión sostenida, complementado por eventos, marcas máximas y una ventana más fina calibrada para picos breves.

La periodicidad efectiva deberá medirse.

Cinco corridas por brazo pueden servir como exploración inicial de repetibilidad. No acreditan por sí solas percentiles extremos de campañas.

Se exigirá:

- Independencia adecuada de muestras.
- Estratificación por máquina y carga.
- Medianas, máximos y dispersión.
- Justificación del cálculo de percentiles.
- Declaración de incertidumbre.
- Conservación de resultados fallidos.

No se publicará p99 robusto de campañas a partir de cinco observaciones independientes.

### **14.6. Vectores adversariales**

| ID     | Vector                           | Criterio de aceptación                                 |
| ------ | -------------------------------- | ------------------------------------------------------ |
| E03-01 | Alternancia A/B/C/A              | Conservar conocimiento, autoridad y progreso.          |
| E03-02 | Wizard vivo                      | Pinning acotado, sin confusión con checkpoint.         |
| E03-03 | Wizard recuperable               | Reanudación segura sin repetir efectos.                |
| E03-04 | Dos tenants y roles              | Cero mezcla y exclusión según ámbito real.             |
| E03-05 | Recurso global compartido        | Exclusión compatible con jerarquía.                    |
| E03-06 | Dependencias de DAG              | Avance de ramas independientes y bloqueo justificado.  |
| E03-07 | Presión de memoria               | Backpressure y drenaje seguro.                         |
| E03-08 | Crecimiento simultáneo de tareas | Respeto de reservas y límites efectivos.               |
| E03-09 | Disco insuficiente               | Protección de cierre, evidencia y reconciliación.      |
| E03-10 | Pérdida del HOST                 | Persistencia y avance elegible según AV-03.            |
| E03-11 | Caída de navegador               | Limpieza, recuperación o bloqueo acreditado.           |
| E03-12 | Caída de ejecutor/supervisor     | Recuperación conforme a la clase real de fallo.        |
| E03-13 | Revocación y efecto incierto     | Sin nuevo despacho indebido ni repetición ciega.       |
| E03-14 | Proceso ajeno                    | No terminar ni modificar recursos de terceros.         |
| E03-15 | Competencia prolongada           | Medir fairness, aging y starvation.                    |
| E03-16 | Capacidad para W>1               | Seleccionar y utilizar concurrencia segura acreditada. |
| E03-17 | Capacidad insuficiente para W=1  | Detener nuevas admisiones de forma segura.             |

### **14.7. Utilidad y escalado**

Se registrarán:

- W efectivo.
- Throughput de resultados válidos.
- Tiempo hasta primer resultado válido.
- Duración total.
- Espera por autoridad, conflicto o recursos.
- Tiempo de alternancia.
- Latencia de reapertura.
- Picos y presión sostenida.
- Error y recuperación.
- Cobertura y evidencia.
- Tiempo de reconciliación.

Un mayor número de tareas terminadas no demuestra mayor utilidad si aumentan los falsos PASS, se omiten obligaciones o se pierde evidencia.

### **14.8. Dimensionamiento de hardware**

El hardware mínimo por perfil será la menor configuración efectivamente medida que cumpla las obligaciones aplicables con margen acreditado.

El hardware recomendado corresponderá a una configuración medida que satisfaga objetivos de latencia, carga y concurrencia aprobados.

No se establecen cantidades de RAM, CPU, GPU ni almacenamiento en este informe.

El dimensionamiento deberá identificar SO, arquitectura, workload, modalidad, navegador y fronteras auxiliares.

### **14.9. Corrección de circularidad**

Se elimina como condición previa general de planificación la frase:

> Para planificar sin certificar se exige al menos alternancia W=1 y saturación controlada.

Texto sustitutivo:

> La alternancia, saturación y capacidad adaptativa serán comprobaciones de selección e integración de EXP-03 en G3, repetidas sobre paquete en G5. La planificación documental podrá representar estos experimentos y dependencias sin ejecutarlos previamente. Solo una imposibilidad material demostrada de una ruta viable podrá bloquear la planificación afectada, identificando la prueba mínima necesaria para resolverla.

## **15. EXP-04 consolidado — Instalación, canales y modalidades**

**Registros:** AR-16 y AR-37.\
**Dependencias:** EXP-01a, AR-23 y AV-07.

### **15.1. Calificación preliminar G0**

Se añade una etapa previa al congelamiento de componentes, sin convertirla en un experimento nuevo independiente.

Su propósito es comprobar que existe una ruta técnicamente viable para runtime, bootstrap, navegadores, dependencias y fronteras obligatorias.

Incluye:

| Área         | Evidencia requerida                                                                  |
| ------------ | ------------------------------------------------------------------------------------ |
| Runtime      | Versión exacta y APIs requeridas.                                                    |
| Dependencias | Arquitecturas, bibliotecas y resolución efectiva.                                    |
| Alpha        | Manifiesto y registry exactos, procedencia y decisión de conservación o sustitución. |
| Seguridad    | Ruta viable de sandbox, custodia y supervisor.                                       |
| Distribución | Catálogo, procedencia y artefactos disponibles.                                      |
| Host         | Compatibilidad preliminar conforme a EXP-01a.                                        |

La etapa pertenece a la secuencia de calificación futura. No se autoriza su inicio mediante este informe.

### **15.2. EXP-04a — Smoke G1**

Para una combinación candidata viable por SO obligatorio, con arquitecturas y alcance explícitamente registrados:

1. Preparar imagen limpia y usuario estándar.
2. Identificar runtime y paquete exactos.
3. Instalar únicamente componentes necesarios.
4. Ejecutar doctor sobre el paquete.
5. Verificar registro y bootstrap del host aplicable.
6. Comprobar transporte Stdio conforme a EXP-01a.
7. Abrir navegador e identificar distribución y arquitectura.
8. Ejecutar autenticación autorizada sobre fixture.
9. Verificar SPA y acción funcional con testigo.
10. Producir reporte y evidencia permitida.
11. Verificar exportación saneada y cleanup.

Se incluyen modalidad visible y headless como celdas distintas cuando sean aplicables.

Este smoke no certifica todos los motores, arquitecturas o hosts.

### **15.3. EXP-04b — Distribución G5**

La repetición instalada deberá ampliar el alcance a todas las combinaciones obligatorias decididas.

| ID     | Vector                              | Criterio                                    |
| ------ | ----------------------------------- | ------------------------------------------- |
| E04-01 | Instalación limpia                  | Bootstrap funcional y reproducible.         |
| E04-02 | Runtime incorrecto                  | Diagnóstico y bloqueo apropiados.           |
| E04-03 | Binario existente pero incompatible | Doctor no declara capacidad válida.         |
| E04-04 | Revisiones coexistentes             | Resolución inequívoca por consumidor.       |
| E04-05 | Descarga interrumpida               | No promover paquete parcial.                |
| E04-06 | Artefacto alterado                  | Rechazo de integridad.                      |
| E04-07 | Manifiesto no auténtico             | Rechazo de procedencia.                     |
| E04-08 | Instaladores concurrentes           | Exclusión y reconciliación correctas.       |
| E04-09 | Symlink/reparse/traversal           | Cero escape de ámbito.                      |
| E04-10 | TLS inválido                        | Fallo cerrado, sin bypass.                  |
| E04-11 | Canal corporativo actualizado       | Recalificación o bloqueo.                   |
| E04-12 | Ausencia de display                 | No fingir ejecución visible.                |
| E04-13 | Dependencia SO ausente              | Diagnóstico verificable.                    |
| E04-14 | Offline preaprovisionado            | Uso íntegro sin descarga imprevista.        |
| E04-15 | Offline sin componentes             | Bloqueo explícito, sin capacidad fingida.   |
| E04-16 | Rollback                            | Compatibilidad con autoridad y migraciones. |
| E04-17 | Desinstalación                      | Preservar datos y recursos ajenos.          |
| E04-18 | Paridad MCP/CLI                     | Cumplimiento de E7.                         |
| E04-19 | Traslado de exportación             | Compatibilidad conforme a EXP-06c.          |

### **15.4. Criterios de selección**

Una alternativa se considera elegible si:

- Existe artefacto de procedencia verificable.
- Su arquitectura efectiva es conocida.
- Arranca con el runtime seleccionado.
- Preserva controles de seguridad.
- Satisface las capacidades obligatorias de la celda.
- Permite instalación, actualización y recuperación gobernadas.
- Su coste incremental y acumulado queda documentado.

El menor tamaño no prevalece sobre privacidad, fidelidad, funcionalidad o mantenimiento.

### **15.5. Rechazo**

No se certificará una distribución con:

- Dependencias ambiguas.
- Integridad o autenticidad insuficientes.
- Bootstrap incompatible.
- Fallback silencioso.
- Privilegios no autorizados.
- Evidencia o aislamiento incorrectos.
- Incapacidad para satisfacer una combinación obligatoria.

La brecha deberá elevarse al propietario cuando resolverla implique reducir alcance.

## **16. Suplemento consolidado EXP-06c — Multimedia, portabilidad y accesibilidad**

**Registro:** AR-39.\
**Fases:** G3 y G5.\
**Compuertas:** E6 y E7, sin modificar la secuencia previa de EXP-06a.

Se mantiene íntegro el expediente [protocolos-exp-06-ac.md](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/protocolos-exp-06-ac.md?utm_source=chatgpt.com).

Este suplemento amplía vectores de compatibilidad, no redefine la construcción criptográfica.

### **16.1. Multimedia por celda**

| ID      | Vector                          | Aceptación                                                             |
| ------- | ------------------------------- | ---------------------------------------------------------------------- |
| E06C-01 | WebM con movimiento verificable | Reproducción genuina y correspondencia con pasos.                      |
| E06C-02 | PNG por paso                    | Geometría y vinculación correctas.                                     |
| E06C-03 | Cambio de dimensiones           | Sin deformación silenciosa.                                            |
| E06C-04 | Seek                            | Búsqueda real mediante contenedor y datos autenticados.                |
| E06C-05 | Pausa/reanudación               | Comportamiento funcional y accesible.                                  |
| E06C-06 | Popup/iframe/OOPIF              | Cobertura o límite explícito, sin fuga.                                |
| E06C-07 | Primer cuadro prohibido         | Cero captura prohibida bajo la frontera preventiva.                    |
| E06C-08 | MFA conocido sin barrera        | Supresión anticipada del ámbito completo necesario.                    |
| E06C-09 | Material imprevisible           | Incidente y contención; fallo preventivo registrado cuando se capture. |
| E06C-10 | Códec lento y presión           | No perder silenciosamente obligaciones.                                |
| E06C-11 | Productores concurrentes        | Identidad y configuración efectiva de captura.                         |
| E06C-12 | Diferencia de motor/modalidad   | Calificación independiente.                                            |

Los puntos de seek al 10 %, 50 % y 90 % conservan su naturaleza de parámetros de ensayo, complementados por fronteras criptográficas y búsquedas próximas al final.

No constituyen tolerancias de rendimiento.

### **16.2. Custodia, lectura y exportación**

| ID      | Vector                           | Aceptación                                     |
| ------- | -------------------------------- | ---------------------------------------------- |
| E06C-13 | Primera escritura                | Custodia acreditada en todos los productores.  |
| E06C-14 | Corte durante publicación        | Cero exposición de objeto parcial.             |
| E06C-15 | Bytes alterados o truncados      | Detección e invalidación conforme al contrato. |
| E06C-16 | Rango válido                     | Respuesta 206 y semántica correcta.            |
| E06C-17 | Rango insatisfacible             | Respuesta 416 y diagnóstico.                   |
| E06C-18 | Sustitución de objeto/generación | Rechazo antes de emisión incompatible.         |
| E06C-19 | Revocación en stream             | Cese de nuevas emisiones conforme a barrera.   |
| E06C-20 | Export modificado                | Verificación contra ancla externa.             |
| E06C-21 | Export entre SO                  | Recursos relativos y reproducción compatible.  |
| E06C-22 | Export offline                   | Cero egress de la superficie controlada.       |
| E06C-23 | Poda, expiración o supresión     | Motivo y veredicto histórico conservados.      |

### **16.3. Accesibilidad de QAP**

| ID      | Vector                             | Aceptación                                           |
| ------- | ---------------------------------- | ---------------------------------------------------- |
| E06C-24 | Navegación por teclado             | Operación de vistas y controles aplicables.          |
| E06C-25 | Foco                               | Visibilidad, orden y ausencia de trampas.            |
| E06C-26 | Zoom/reflow                        | Contenido y acciones utilizables.                    |
| E06C-27 | Contraste y semántica              | Resultados respaldados por reglas y comprobaciones.  |
| E06C-28 | Reproducción y navegación temporal | Controles accesibles con diagnóstico.                |
| E06C-29 | Lector de pantalla                 | Muestra manual o integración específica documentada. |

### **16.4. Accesibilidad del AUT**

| ID      | Vector                                   | Aceptación                                          |
| ------- | ---------------------------------------- | --------------------------------------------------- |
| E06C-30 | Fixture sano                             | Registrar comprobaciones satisfechas y límites.     |
| E06C-31 | Defectos sembrados automatizables        | Detección conforme al conjunto de reglas declarado. |
| E06C-32 | Defectos que requieren evaluación manual | No presentarlos como satisfechos por el scanner.    |
| E06C-33 | Frame autorizado                         | Cobertura identificada.                             |
| E06C-34 | Frame no autorizado                      | Bloqueo de acceso y brecha explícita.               |
| E06C-35 | Estado dinámico                          | Reevaluación sobre estado correcto.                 |
| E06C-36 | Cambio de locale                         | Hallazgos y procedencia consistentes.               |
| E06C-37 | Auditoría con script local               | Cero efecto no autorizado y cero egress indebido.   |

### **16.5. Compuertas conservadas**

La prueba de medios positivos no sustituye EXP-06a.

La activación de `PRIVATE_AUTHORIZED` conserva:

- EXP-06a superado.
- Integración EXP-06c/E6 en G3.
- Repetición instalada G5.
- Cobertura obligatoria acreditada.
- Ratificación DE-02.
- Autorización efectiva durante las operaciones.

La supresión segura sigue siendo una respuesta válida ante falta de garantía, pero no constituye cumplimiento de una capacidad multimedia obligatoria.

## **17. Suplemento consolidado EXP-01b — Medición pareada del contexto**

**Registros relacionados:** AR-49, AR-36 y AR-29.\
**Fases:** G4 y repetición instalada G5.
Se preserva el [protocolo de adopción AV-03](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/protocolos-av03.md?utm_source=chatgpt.com#exp-01b--adopci%C3%B3n-y-tokens).

### **17.1. Separación factorial**

Se distinguen dos dimensiones experimentales.

| Adopción                              | Representación del contexto   |
| ------------------------------------- | ----------------------------- |
| MCP base                              | Baseline competente           |
| MCP + Skill                           | Paginación determinista       |
| MCP + Skill + hook informativo opt-in | Selección estructurada        |
| Brazo de adopción constante           | Delta con referencias         |
| Brazo de adopción constante           | Replay determinista aplicable |

La comparación de representación deberá mantener constante el mecanismo de adopción o controlar explícitamente su efecto.

No atribuir a compresión de contexto una mejora causada únicamente por instrucciones, hook o selección diferente de tareas.

### **17.2. Episodios obligatorios**

| ID      | Episodio                                           |
| ------- | -------------------------------------------------- |
| E01B-01 | Primera exploración de una aplicación.             |
| E01B-02 | Repetición con contexto warm.                      |
| E01B-03 | Reinicio con persistencia disponible.              |
| E01B-04 | Handoff a otro HOST autorizado.                    |
| E01B-05 | Alternancia A/B/C/A.                               |
| E01B-06 | Cambio de rol.                                     |
| E01B-07 | Cambio de idioma.                                  |
| E01B-08 | Drift localizado.                                  |
| E01B-09 | Drift de dependencia desconocida.                  |
| E01B-10 | Cancelación y reanudación.                         |
| E01B-11 | Revocación entre páginas.                          |
| E01B-12 | Snapshot obsoleto.                                 |
| E01B-13 | Sobrecompresión de un contexto indispensable.      |
| E01B-14 | Trabajo determinista elegible sin HOST.            |
| E01B-15 | Tarea legítima de desarrollo fuera de QA canónico. |

La comparación incluirá tres o más aplicaciones conforme al encargo y los expedientes relacionados.

Se conservarán los controles de no interferencia con pruebas unitarias legítimas y adopción por los hosts D13.

### **17.3. Aceptación**

Para seleccionar una técnica de contexto:

- Mantener obligaciones y cobertura.
- Conservar procedencia.
- Detectar insuficiencia y expandir contexto cuando proceda.
- Respetar revocación y aislamiento.
- Recuperar trabajo sin duplicar efectos.
- Demostrar reproducibilidad.
- Informar costes, fallos y límites.

Para certificar ahorro real de tokens se requerirá adicionalmente telemetría comparable y magnitud observada con incertidumbre.

Si solo se demuestra reducción de bytes, llamadas o payload visible, la afirmación se limitará a esas métricas.

El porcentaje de ahorro y los objetivos de adopción seguirán pendientes de DE-03 y AV-08.

# **18. Bloqueantes y compuertas consolidadas**

## **18.1. Clasificación normativa**

La aceptación de un diseño no debe confundirse con autorización para implementar o certificar.

| Clase                      | Significado                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| Planificación              | Impide formular una secuencia defendible o congelar la parte afectada del diseño. |
| Selección tecnológica      | Impide elegir irreversiblemente un componente o configuración.                    |
| Implementación/integración | Impide incorporar o activar una ruta sin sus condiciones previas.                 |
| Certificación              | Impide declarar satisfecha una capacidad o combinación.                           |
| Activación                 | Impide utilizar una modalidad concreta bajo condiciones operativas reales.        |

### **18.2. Matriz de bloqueantes**

| Elemento                  | Planificación                             | Selección                         | Implementación                                          | Certificación / activación      |
| ------------------------- | ----------------------------------------- | --------------------------------- | ------------------------------------------------------- | ------------------------------- |
| Playwright y alternativas | Puede planificarse puerto y pruebas       | EXP-02/04                         | Según configuración acreditada                          | Matriz G5                       |
| Alpha                     | Puede planificarse resolución             | Bloqueada su ratificación exacta  | No integrar una selección no verificada como definitiva | Identidad efectiva y paquete    |
| Arquitecturas/SO          | Conservar alcance D14                     | Pruebas de proveedor y viabilidad | Según rutas disponibles                                 | Celdas obligatorias acreditadas |
| Concurrencia              | Puede planificarse scheduler              | EXP-03 para defaults y hardware   | Integración gobernada G3                                | G3/G5/E3/E5/E7                  |
| Discovery                 | Puede planificarse el contrato            | EXP-02                            | G2 y dependencias                                       | E4 y criterios de AV-08         |
| Runtime y distribución    | Puede planificarse catálogo               | AR-23/AV-07 y calificación G0     | Smoke G1                                                | EXP-04b G5                      |
| Captura privada           | C y A permiten planificación condicionada | EXP-06a                           | Compuertas de AR-27                                     | EXP-06c/E6 G3/G5 y DE-02        |
| Accesibilidad             | Capacidad de lanzamiento preservada       | Reglas y motor por acreditar      | Integración aplicable                                   | G5/G6 y DE-05                   |
| Tokens                    | Puede planificarse medición               | EXP-01b/02                        | G4                                                      | Telemetría, DE-03 y AV-08       |

### **18.3. Ausencia de circularidad**

G0

**Calificación y condiciones previas**

Viabilidad de componentes y fronteras, EXP-06a cuando corresponda.

G1

**Paquete mínimo e interoperabilidad**

EXP-04a y EXP-01a conforme a sus condiciones.

G2

**Discovery y fidelidad**

EXP-02 y selección de extractor.

G3

**Integración**

EXP-03, concurrencia, medios y EXP-06c.

G4

**Planificación autónoma y contexto**

EXP-01b, adopción y optimización.

G5

**Distribución y matriz instalada**

EXP-04b y repetición de los experimentos aplicables.

G6

**Aceptación empresarial**

E8 y decisiones del propietario pendientes.

Representación exclusiva de dependencias AV-06. No modifica el plan maestro completo, no constituye WBS y no autoriza iniciar ninguna fase.

La planificación documental puede incorporar pruebas y criterios futuros sin exigir que todos ellos estén ejecutados previamente.

La selección irreversible, integración afectada, certificación y activación continúan subordinadas a las condiciones que correspondan.

# **19. Transferencias vinculantes a auditorías posteriores**

Las siguientes transferencias se formulan exclusivamente como insumos documentales. No se inicia AV-07 ni AV-08.

## **19.1. Transferencia a AV-07**

| Identificador de transferencia | Obligación                                                              |
| ------------------------------ | ----------------------------------------------------------------------- |
| T06-07-01                      | Resolver identidad efectiva de Playwright por consumidor y empaquetado. |
| T06-07-02                      | Verificar el artefacto alpha o justificar su sustitución.               |
| T06-07-03                      | Seleccionar runtime según SQLite/FTS5, dependencias nativas y hosts.    |
| T06-07-04                      | Resolver distribución por plataforma y arquitectura real.               |
| T06-07-05                      | Calificar procedencia, manifiestos, firma, integridad y actualización.  |
| T06-07-06                      | Acreditar caché, atomicidad, confinamiento y rollback.                  |
| T06-07-07                      | Inventariar licencias de bibliotecas, binarios, codecs y auxiliares.    |
| T06-07-08                      | Acreditar supervisor, identidad de procesos y cleanup por SO.           |
| T06-07-09                      | Resolver frontera de brokers, OCR, parsers y VM cuando corresponda.     |
| T06-07-10                      | Incluir coste incremental y acumulado de toda la distribución.          |
| T06-07-11                      | Acreditar registro efectivo por host D13 mediante EXP-01a.              |
| T06-07-12                      | Mantener alternativas viables para celdas obligatorias no cubiertas.    |

No se seleccionan licencias, runtime, sandbox ni componentes definitivos mediante estas transferencias.

## **19.2. Transferencia a AV-08**

| Identificador de transferencia | Obligación                                                             |
| ------------------------------ | ---------------------------------------------------------------------- |
| T06-08-01                      | Denominadores congelados por clase, aplicación, estado y perfil.       |
| T06-08-02                      | Cobertura funcional y visual mediante testigos independientes.         |
| T06-08-03                      | Calidad de Discovery y reglas de invalidación conservadora.            |
| T06-08-04                      | Cobertura real de accesibilidad automatizada y manual.                 |
| T06-08-05                      | Diferenciación de limitación tecnológica y obligación incumplida.      |
| T06-08-06                      | Métricas de utilidad de concurrencia y ausencia de degradación.        |
| T06-08-07                      | Expediente de tokens, costes, adopción e incertidumbre.                |
| T06-08-08                      | Validación de alternancia y continuidad entre tres o más aplicaciones. |
| T06-08-09                      | Aceptación de matriz y evidencia por configuración efectiva.           |
| T06-08-10                      | Conservación de E8 y decisiones abiertas del propietario.              |

# **20. Riesgos residuales**

| Riesgo                                            | Tratamiento                                    | Expediente    |
| ------------------------------------------------- | ---------------------------------------------- | ------------- |
| Coexistencia de revisiones incompatibles          | Resolución determinista por consumidor         | EXP-04        |
| Alpha sin artefacto independientemente verificado | Completar cotejo o sustituir con justificación | AV-07         |
| Actualización de navegador corporativo            | Detectar cambio y recalificar                  | EXP-04        |
| Windows ARM64 y auxiliares emulados               | Identificar cada arquitectura efectiva         | EXP-04        |
| Edge Linux ARM64                                  | Acreditar proveedor o alternativa autorizada   | EXP-04        |
| Alteración de fidelidad por routing/caché/SW      | Perfiles y testigos causales                   | EXP-02        |
| Drift no observable                               | Invalidación conservadora                      | EXP-02        |
| Localizador erróneo aparentemente válido          | Testigo semántico y funcional                  | EXP-02        |
| Estado vivo irrecuperable                         | Pinning acotado y abstención segura            | EXP-03        |
| Picos simultáneos de consumo                      | Reserva, presión e histéresis                  | EXP-03        |
| Inanición de campañas                             | Aging, fairness y telemetría                   | EXP-03        |
| Fallo de captura previo a detección               | Prevención, supresión anticipada y DE-02       | EXP-06a/c     |
| Copias de exportación fuera de control            | Custodia y límites honestos de revocación      | EXP-06c       |
| Falsos negativos de accesibilidad                 | Cobertura explícita y procedimientos manuales  | EXP-06c/AV-08 |
| Telemetría opaca de tokens                        | Evidencia indirecta sin porcentaje certificado | EXP-01b       |

Ninguno de estos riesgos permite relajar una obligación aceptada.

# **21. Preservación de decisiones y contratos anteriores**

Se confirma que las enmiendas propuestas mantienen:

| Expediente | Contrato preservado                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| AV-01      | Catálogo, requisitos del propietario, trazabilidad y alcance.                                                |
| AV-02      | Denegación por defecto, identidad, permisos por efecto, revocación, privacidad y autenticidad.               |
| AV-03      | Ejecutor independiente, reclamo durable, fencing, persistencia, MCP/CLI y separación HOST/DETERMINISTIC.     |
| AV-04      | DAG, oráculos, seis veredictos, subefectos, reconciliación, cleanup y aceptación independiente de evidencia. |
| AV-05      | Sandbox, procesamiento local, UTCP/OpenAPI, documentos, consultas autorizadas y reportes.                    |

Se conservan las decisiones D01–D21.

En particular:

- Primera versión local.
- HOST y DETERMINISTIC como modos iniciales.
- Escrituras automáticas únicamente bajo autorización efectiva de QA.
- Windows, macOS y Linux desde el primer lanzamiento.
- Elección de navegador y modalidad mediante preferencias persistentes.
- Concurrencia adaptativa y recursos gobernados.
- Captura privada controlada.
- WebM, PNG y evidencia por paso.
- Resumen histórico permanente hasta eliminación expresa.
- Detalle de ejecuciones durante 90 días.
- Exportación manual y archivo automático configurable.
- Conocimiento canónico vigente y casos activos sin caducidad automática.

Los detalles operativos de retención multimedia que permanecen abiertos no se ratifican.

**DE-01, DE-02, DE-03, DE-04 y DE-05 conservan sus aspectos pendientes.**

No se identifica contradicción material que justifique reabrir AV-01–05. Las brechas encontradas se resuelven mediante enmiendas dentro del alcance de AV-06 y aplicación de los contratos existentes.

# **22. Bloque de actualización documental del registro maestro**

Se propone el siguiente contenido para incorporación exclusiva por el Orquestador, después de revisar y decidir sobre esta contravalidación.

Nombre propuesto del informe para publicación:

`docs/qap-architecture/cierre-av-01/contravalidacion-neon-av06.md`

El nombre es una propuesta documental, no un archivo creado o publicado en GitHub.

```
## Contravalidación independiente AV-06

Fecha: 25 de noviembre de 2026.

Base de referencia:
053c5ab86589c44a416b8f69e21adddba5a0e2ca.

Árbol:
9afacba8a1ba714d54bd068f0dea3c87192afb87.

Se contravalidaron los seis registros de AV-06 y las ocho
objeciones vinculantes del Orquestador.

Dictamen independiente:
APROBABLE EN DISEÑO CON ENMIENDAS VINCULANTES Y RESERVAS.

La contravalidación conserva Playwright como candidato
principal detrás de un puerto semántico QAP. No selecciona
definitivamente runtime, motor, distribución, modalidad,
extractor, backend de captura ni hardware.

Las enmiendas CV06-01 a CV06-08 prevalecen sobre los
pasajes incompatibles del informe principal y sus protocolos
si el Orquestador decide aceptarlas.

Se consolidan EXP-02, EXP-03, EXP-04 y los suplementos
EXP-01b y EXP-06c sin sustituir los contratos AV-01–05.

W=1 es referencia experimental y fallback temporal
acreditado, no techo permanente de producto.

Se preservan las obligaciones de concurrencia adaptativa,
Discovery profundo e incremental, instalación bajo demanda,
fidelidad funcional y visual, evidencia multimedia,
privacidad, portabilidad, accesibilidad y optimización
verificable de tokens.

Limitación documental:
Se verificaron los manifiestos y registries de Playwright
1.62.1 y 1.63.0. La dependencia alpha fue confirmada en el
lock, pero queda pendiente verificar independientemente su
manifiesto y registry exactos o justificar su sustitución.

El antecedente de 759 GET conserva carácter histórico
no reproducido.

No se ejecutaron experimentos.

No se modifican los estados principales de los registros.

No se ratifican DE-01–05 en sus aspectos abiertos.

La decisión de cierre documental corresponde exclusivamente
al Orquestador.
```

## **22.1. Adendas a los seis registros existentes**

Estas adendas deben incorporarse bajo los registros correspondientes, sin crear una segunda entrada por AR ni duplicar sus estados principales.

```
### AR-16 — Adenda de contravalidación AV-06

Aplicar CV06-01 y CV06-02.
Conservar Playwright como candidato principal y alternativas
de contraste por brecha material.

Identificar distribución, revisión, arquitectura, canal,
modo y perfil efectivos. Separar observación restringida
de ejecución funcional fiel.

EXP-02, EXP-04 y EXP-06c condicionan selección, defaults
y acreditación por celda.

### AR-29 — Adenda de contravalidación AV-06

Aplicar CV06-03.
Admisión transaccional, reservas de recursos y efectos
diferenciadas, capacidad adaptativa, fairness, aging,
backpressure, histéresis y cleanup supervisado.

W=1 conserva carácter de referencia y fallback temporal.
W>1 deberá permanecer disponible cuando esté acreditado.
W=0 es válido ante insuficiencia de capacidad segura.

EXP-03 G3/G5 condiciona concurrencia y hardware.
No exigir sus pruebas de integración como prerrequisito
circular de planificación documental.

### AR-36 — Adenda de contravalidación AV-06

Aplicar CV06-04.
Discovery híbrido candidato, denominadores congelados,
identidad semántica contextual, localizadores con testigo,
checkpoint durable e invalidación conservadora.

EXP-02 G2/E4 condiciona selección y calidad.
Transferir denominadores y cobertura a AV-08.

### AR-37 — Adenda de contravalidación AV-06

Aplicar CV06-01 y CV06-05.
Provisión por capacidad, identidad efectiva, manifiesto
autenticado, integridad, caché gobernada, promoción
recuperable y doctor funcional.

Conservar dependencia de AR-23/AV-07 y EXP-01a.
Calificación preliminar en G0, smoke EXP-04a en G1 y
distribución EXP-04b en G5.

### AR-39 — Adenda de contravalidación AV-06

Aplicar CV06-06 y CV06-07.
Mantener C principal y A respaldo conforme a AR-27.
Prevención anterior al primer cuadro y custodia desde
primera escritura.

EXP-06c amplía vectores de compatibilidad, medios genuinos,
reproducción, portabilidad y accesibilidad por celda.
Separar evaluación de QAP y evaluación del AUT.
Conservar EXP-06a, DE-02 y DE-05.

### AR-49 — Adenda de contravalidación AV-06

Aplicar CV06-08.
Comparación pareada contra baseline competente, con
obligaciones equivalentes y contabilización completa
de intentos, fallos y recuperaciones.

EXP-01b/02/03 condicionan la evaluación.
No certificar porcentajes sin telemetría comparable.
Conservar DE-03 y AV-08.
```

## **22.2. Conteo consolidado**

## **57 registros conservados**

Validados

**6**

Validación experimental pendiente

**17**

Pendientes

**26**

Bloqueantes

**8**

Sin modificación de estados principales por la mera entrega documental de AV-06.

Se conserva el conteo del [registro maestro en el SHA de referencia](https://github.com/Hyouka73/QAMCP/blob/053c5ab86589c44a416b8f69e21adddba5a0e2ca/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com).

# **23. Decisión recomendada al Orquestador**

Recomiendo aceptar las invariantes y contratos corregidos de AV-06 con reservas y mantener los experimentos pendientes.

| Decisión                                                  | Recomendación                               |
| --------------------------------------------------------- | ------------------------------------------- |
| Aceptar íntegramente el informe original sin correcciones | No                                          |
| Aceptar diseño con CV06-01 a CV06-08                      | Sí, condicionado a revisión del Orquestador |
| Conservar Playwright como candidato principal             | Sí                                          |
| Seleccionar Playwright definitivamente                    | No todavía                                  |
| Establecer Chromium Shell como default universal          | No                                          |
| Eliminar Firefox/WebKit del alcance                       | No                                          |
| Limitar permanentemente concurrencia a W=1                | No                                          |
| Aprobar hardware mínimo o recomendado                     | No todavía                                  |
| Seleccionar extractor definitivo                          | No todavía                                  |
| Aprobar captura privada en producción                     | No                                          |
| Declarar certificación WCAG                               | No                                          |
| Garantizar porcentaje de ahorro de tokens                 | No                                          |
| Modificar estados principales de los AR                   | No                                          |
| Ratificar DE-01–05                                        | No                                          |
| Iniciar G0/G1 o implementación                            | No autorizado                               |
| Iniciar AV-07                                             | No autorizado por este informe              |

## **24. Dictamen final**

**AV-06: APROBABLE EN DISEÑO CON ENMIENDAS VINCULANTES Y RESERVAS.**

La dirección tecnológica de Codex High resulta razonable, especialmente la conservación de Playwright, la estrategia híbrida de Discovery, la instalación por capacidad y la medición pareada del contexto.

Las principales deficiencias se encuentran en la precisión contractual de las fronteras, la diferenciación de configuraciones efectivas, la concurrencia adaptativa, la invalidación conservadora y las garantías multimedia.

Las ocho objeciones han recibido tratamiento documental, aunque permanece incompleta la verificación independiente del artefacto alpha. También quedan pendientes todas las acreditaciones experimentales y los límites de plataforma expresamente identificados.

Esta contravalidación no constituye una aprobación global de AV-06. El Orquestador deberá decidir si acepta las enmiendas, considera suficientes las reservas documentales o requiere completar verificaciones adicionales antes del cierre.

**Declaración de cumplimiento:** acceso exclusivamente de lectura; cero modificaciones en GitHub, código, dependencias, CI o configuración; cero experimentos ejecutados; ninguna rama o worktree creada; sin acceso a sistemas empresariales; sin WBS; sin inicio de G0/G1 ni AV-07.

**Fin del informe de contravalidación independiente AV-06.**
