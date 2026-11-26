# **ET-01 — Informe de evaluación tecnológica independiente de QAP**

**Especialidad:** Núcleo, lenguaje, runtime y reconstrucción selectiva.\
**Destinatario:** Orquestador Principal de QAP.\
**Fecha de investigación:** 26 de noviembre de 2026.\
**Repositorio:** `Hyouka73/QAMCP`.\
**Rama exclusiva:** `develop`.\
**SHA del encargo:** `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029`.\
**SHA normativo y de código establecido por los encargos:** `1a81e86c9b17a95a04e40237eff5fb99215bae5a`.\
**Modalidad:** Investigación documental independiente, exclusivamente de lectura.

Dictamen tecnológico ET-01

# **APTO COMO CANDIDATO CONDICIONADO**

**Núcleo principal:** TypeScript + Node.js 24 LTS, con reconstrucción selectiva de la arquitectura.

**Runtime de respaldo:** Node.js 26 LTS.

**Alternativa de núcleo:** .NET 10 LTS, condicionada a que aparezca un impedimento material no resoluble con Node.js.

**Componentes especializados:** Rust como candidato localizado, cuando proporcione una garantía técnica demostrable.

No constituye selección definitiva, certificación del producto, aprobación de implementación ni autorización para abrir G0/G1.

## **1. Resumen ejecutivo**

La investigación conduce a una conclusión fundamental: **QAP necesita reconstruir su arquitectura de autoridad y ejecución, pero no existe actualmente una justificación documental suficiente para reconstruir todo el producto en otro lenguaje.**

El problema principal identificado no es que TypeScript o Node.js sean intrínsecamente incapaces de satisfacer los requisitos. Es que la implementación existente distribuye responsabilidades críticas entre paquetes, consumidores, mecanismos de persistencia y rutas históricas que todavía no corresponden plenamente al núcleo soberano definido por la especificación consolidada.

Cambiar de lenguaje no resolvería automáticamente esos problemas.

La recomendación independiente es:

- Conservar TypeScript como lenguaje principal candidato.
- Evaluar Node.js 24 LTS y Node.js 26 LTS mediante artefactos oficiales verificables.
- Reconstruir selectivamente la autoridad, el scheduler durable, la admisión de efectos, la reconciliación y la producción de resultados.
- Extraer la lógica de aplicación que actualmente reside dentro de MCP.
- Convertir MCP, CLI, CI y UI en consumidores de una autoridad común.
- Mantener SQLite como decisión empresarial vigente, independientemente del driver seleccionado.
- Reemplazar dependencias abandonadas o innecesarias cuando exista una alternativa acreditable.
- Admitir componentes nativos especializados únicamente cuando resuelvan problemas concretos de aislamiento, sistema operativo, seguridad o rendimiento que justifiquen su costo.

**No recomiendo una reescritura completa en Rust, Go, Python o .NET como punto de partida.** Sí recomiendo diseñar contratos que permitan sustituir componentes e incluso reconsiderar el runtime sin reconstruir nuevamente el modelo funcional de QAP.

### **1.1. Hallazgos principales**

| ID       | Hallazgo                                                                                                         | Impacto |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| ET01-H01 | La autoridad de aplicación todavía reside parcialmente en MCP.                                                   | Crítico |
| ET01-H02 | Los targets históricos Node 18 contradicen dependencias y almacenamiento actuales.                               | Alto    |
| ET01-H03 | `tsup` ya no tiene mantenimiento activo declarado por su autor.                                                  | Alto    |
| ET01-H04 | Existen diferentes resoluciones de Playwright y del SDK MCP.                                                     | Alto    |
| ET01-H05 | SQLite síncrono exige separación del transporte sensible a latencia.                                             | Alto    |
| ET01-H06 | CLI conserva rutas históricas potencialmente incompatibles con autoridad única.                                  | Crítico |
| ET01-H07 | El adaptador Git conserva ejecución mediante shell e interpolación.                                              | Alto    |
| ET01-H08 | TypeScript estricto no sustituye validación de datos en runtime.                                                 | Alto    |
| ET01-H09 | `keytar` representa deuda de mantenimiento y distribución nativa.                                                | Alto    |
| ET01-H10 | No existe evidencia experimental suficiente para atribuir ventajas cuantitativas a una reescritura.              | Alto    |
| ET01-H11 | La comprobación de release actual no acredita integralmente los diez paquetes.                                   | Alto    |
| ET01-H12 | El modelo de permisos de Node.js no constituye por sí mismo una frontera de seguridad frente a código malicioso. | Crítico |

## **2. Integridad de la investigación y límites probatorios**

### **2.1. Encargos vinculantes**

Ambos encargos fueron recuperados íntegramente mediante el conector de GitHub, utilizando el SHA solicitado.

| Documento                                                                                                                                                                                                | Blob SHA verificado                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Encargo tecnológico común](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com) | `01a510f95bb32870c5c2b18fd7c934c877aec5ea` |
| [Encargo especializado ET-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-01.md?utm_source=chatgpt.com)                | `3830dba2bb807fc95657aceefcfa6c7cb313344d` |

Los encargos establecen explícitamente una base normativa y de código distinta del SHA en que fueron publicados. Por ello, la inspección técnica utiliza `1a81e86c9b17a95a04e40237eff5fb99215bae5a`, sin incorporar modificaciones posteriores como si pertenecieran a esa línea base.

### **2.2. Evidencias recuperadas**

Se inspeccionaron:

- Los dos encargos completos y la matriz de responsabilidad tecnológica.
- El árbol recursivo del repositorio, devuelto sin indicador de truncamiento.
- Los diez manifiestos de paquetes y el manifiesto raíz.
- Configuración TypeScript, workspace pnpm y configuraciones de empaquetado CLI/MCP.
- Las entradas iniciales del lockfile y las resoluciones documentadas en AV-07.
- Código seleccionado de autoridad, persistencia, orquestación, puertos, Git y comprobación de releases.
- Las matrices de aceptación, actas, manifiestos, contratos y enmiendas normativas pertinentes, mediante recuperación completa de documentos pequeños y extracción focalizada de documentos extensos.
- Fuentes primarias públicas de runtimes, lenguajes, herramientas y bibliotecas.

### **2.3. Reserva de exhaustividad**

No se completó una lectura íntegra verificable de cada uno de los documentos incorporados transitivamente por los manifiestos normativos, ni una inspección línea por línea de todos los archivos de código y del lockfile completo.

Tampoco se generó un SBOM nuevo ni se realizó un análisis exhaustivo de alcanzabilidad de todas las dependencias transitivas.

Algunas fuentes externas versionadas no fueron accesibles directamente durante la consulta.

Por tanto:

- Las observaciones directas se distinguen de los antecedentes documentales de AV-07.
- No se declara una nueva auditoría exhaustiva de vulnerabilidades.
- No se certifican los 123 requisitos, las 65 cláusulas ni los 57 registros maestros.
- Las recomendaciones son suficientes para orientar la comparación tecnológica, pero la cobertura documental pendiente debe verificarse antes de cerrar definitivamente ET-01.

Esta reserva impide presentar el informe como cumplimiento probatorio íntegro de todos los puntos del encargo común.

## **3. Invariantes normativos no negociables**

La selección tecnológica queda subordinada a las decisiones empresariales ya ratificadas.

# **123**

Entradas normativas

# **65**

Cláusulas AC-01

# **57**

Registros maestros

Se preserva la composición de 110 requisitos, 2 políticas y 11 ampliaciones, sin alterar estados ni denominadores.

### **3.1. Decisiones empresariales**

| Decisión | Opción ratificada | Implicación tecnológica                                                         |
| -------- | ----------------- | ------------------------------------------------------------------------------- |
| D01–D21  | Vigentes          | La tecnología se adapta al producto.                                            |
| DE-01    | A                 | Retención estructurada de 90 días, resumen permanente y conservación gobernada. |
| DE-02    | B                 | Captura privada autorizada con prevención y custodia efectiva.                  |
| DE-03    | B                 | Pisos integrados y vetos no compensables.                                       |
| DE-04    | A, B respaldo     | G6.5 antes de disponibilidad general.                                           |
| DE-05    | B                 | Accesibilidad obligatoria según alcance ratificado.                             |
| AC-DE-01 | B                 | UI operacional local y operación integral sin IA.                               |
| AC-DE-02 | A                 | Estrategia, riesgos, cobertura y entrega.                                       |
| AC-DE-03 | B                 | Consultas, publicaciones y reportes PDF/XLSX propios.                           |
| AC-DE-04 | A                 | Automatización reusable, CI e ingesta externa.                                  |
| AC-DE-05 | A                 | Calidad no funcional acotada.                                                   |
| AC-DE-06 | A                 | Calidad de datos y concurrencia funcional compuesta.                            |
| AC-DE-07 | A                 | Diferir integración especializada de IA sin MCP.                                |

Fuentes: [especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com), [acta DE](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com) y [acta AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/acta-ratificacion-ac01.md?utm_source=chatgpt.com).

### **3.2. Filtros tecnológicos eliminatorios**

Un candidato queda descartado o condicionado si no puede garantizar:

| Filtro            | Exigencia                                              |
| ----------------- | ------------------------------------------------------ |
| Autoridad         | Un único escritor soberano coordinado.                 |
| Operación         | Local, autónoma y utilizable sin IA.                   |
| Inteligencia      | HOST + DETERMINISTIC; MANAGED diferido.                |
| Persistencia      | SQLite local y durable.                                |
| Seguridad         | Permisos por efecto, identidad y alcance efectivo.     |
| Veracidad         | AR-52 íntegro y oráculos acreditados.                  |
| Privacidad        | Prevención de captura prohibida y custodia autorizada. |
| Portabilidad      | Windows, macOS y Linux según celdas obligatorias.      |
| Interoperabilidad | MCP, CLI, UI y CI sobre contratos comunes.             |
| Economía          | Sin suscripción, modelo API o compra obligatoria.      |
| Distribución      | Licencias y procedencia admisibles.                    |
| Aceptación        | 100 % de conformidad instalada y cero vetos.           |

No se utilizará una puntuación ponderada para compensar el incumplimiento de estos filtros.

## **4. Inventario tecnológico real de QAP**

### **4.1. Plataforma existente**

El repositorio constituye un monorepo de diez paquetes, basado principalmente en TypeScript, módulos ESM, pnpm y herramientas del ecosistema Node.js.

| Componente          | Identidad observada                       |
| ------------------- | ----------------------------------------- |
| Monorepo            | `@qap/monorepo` 2.1.0                     |
| TypeScript          | 5.5.4                                     |
| Target TS raíz      | ES2022                                    |
| Empaquetador        | tsup 8.5.1                                |
| Gestión de paquetes | pnpm                                      |
| Pruebas             | Vitest 4.1.11                             |
| Validación          | Ajv 8.20.0                                |
| Formatos Ajv        | 3.0.1                                     |
| YAML                | 2.9.0                                     |
| CLI                 | Commander 15.0.0                          |
| Prompts             | `@inquirer/prompts` 8.7.0 resuelto        |
| MCP SDK             | Resoluciones 1.30.0 y 1.30.1 documentadas |
| Automatización      | Playwright Core 1.62.1 y 1.63.0           |
| SQLite              | `node:sqlite`                             |
| Secretos nativos    | `keytar` 7.9.0, opcional                  |
| Bloqueo histórico   | `proper-lockfile` 4.1.2                   |
| Tipos Node          | 20.19.43 y 26.2.0                         |

Las versiones anteriores son identidades del repositorio y sus antecedentes fijados. **No representan una afirmación de que sean las versiones más recientes disponibles ni de que estén calificadas para producción.**

Fuentes: [package.json](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/package.json?utm_source=chatgpt.com), [lockfile](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/pnpm-lock.yaml?utm_source=chatgpt.com), [dependencias AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/dependencias-licencias-av07.md?utm_source=chatgpt.com).

### **4.2. Grafo actual de dependencias internas**

### **Grafo simplificado observado**

Representación conceptual de dependencias relevantes, no grafo exhaustivo de imports ni prueba de alcanzabilidad. Las dependencias exactas se establecen en los manifiestos.

El paquete `engine` depende fundamentalmente de `shared`, lo cual representa una base favorable para recuperar un dominio independiente.

Sin embargo, una parte sustancial de la autoridad operativa se encuentra en `mcp`, mientras otros paquetes conservan acceso directo a almacenamiento, mecanismos históricos de flujo y operaciones de ejecución.

**La separación por paquetes no equivale todavía a separación efectiva de autoridad.**

### **4.3. Evidencias directas de código**

| Archivo                                             | Observación                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `mcp/src/application/application-service.ts`        | Servicio de aplicación de 4,814 líneas, con almacenamiento, artefactos, autoridad y recuperación. |
| `mcp/src/application/app-service-store.ts`          | SQLite síncrono mediante carga de `node:sqlite`; transacciones y migraciones propias.             |
| `knowledge/src/storage/sqlite-knowledge-adapter.ts` | Implementación SQLite, carga diferida, transacciones, FTS5 y mecanismos de fencing.               |
| `engine/src/ports.ts`                               | Puertos para ejecución, almacenamiento, reportes, telemetría y flujos.                            |
| `engine/src/flow-orchestrator.ts`                   | Mecanismo de orquestación histórico con extensiones de flujo.                                     |
| `cli/tsup.config.ts`                                | Target `node18`, módulos internos embebidos y dependencias externas seleccionadas.                |
| `mcp/tsup.config.ts`                                | Target `node18` y huella de código incorporada durante build.                                     |
| `git-adapter/src/git-adapter.ts`                    | `execSync` con interpolación de rama y fallback a `HEAD~1`.                                       |
| `scripts/release-check.mjs`                         | Pruebas de un subconjunto de paquetes y comprobaciones de empaquetado.                            |

Enlaces de evidencia:

[Servicio de aplicación](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/application/application-service.ts?utm_source=chatgpt.com) · [SQLite de aplicación](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/application/app-service-store.ts?utm_source=chatgpt.com) · [SQLite de conocimiento](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts?utm_source=chatgpt.com) · [Puertos](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/engine/src/ports.ts?utm_source=chatgpt.com) · [Git adapter](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/git-adapter/src/git-adapter.ts?utm_source=chatgpt.com) · [Release check](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/scripts/release-check.mjs?utm_source=chatgpt.com).

## **5. Comparación de lenguajes y runtimes**

### **5.1. TypeScript + Node.js**

**Clasificación: candidato principal condicionado.**

La plataforma existente permite conservar contratos, estructuras de datos, validadores, pruebas, integración MCP y mecanismos de automatización, mientras se reconstruyen selectivamente las responsabilidades críticas.

Ventajas:

- Menor costo de migración semántica respecto de los demás candidatos.
- Integración directa con el ecosistema actual de Playwright y MCP.
- Disponibilidad de SQLite integrado.
- Ecosistema adecuado para procesamiento asíncrono y comunicaciones locales.
- Posibilidad de separar operaciones intensivas mediante workers y procesos especializados.
- Reutilización de esquemas y tipos entre consumidores, sin transferirles autoridad.

Limitaciones:

- Los tipos TypeScript desaparecen durante la ejecución.
- Las operaciones síncronas pueden bloquear el event loop.
- El recolector de basura puede introducir variabilidad temporal.
- Los módulos nativos requieren verificación de ABI, plataforma y dependencias externas.
- La amplitud del ecosistema npm aumenta el trabajo de control de la cadena de suministro.
- El modelo de permisos de Node.js no protege suficientemente frente a código deliberadamente malicioso. La documentación oficial reconoce esta limitación.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

  Node.js v26.9.0 Documentation+1



Ninguna de estas limitaciones justifica por sí sola sustituir Node.js. Sí obliga a establecer fronteras efectivas, límites de recursos y controles probatorios.

#### **Runtime candidato**

| Runtime             | Estado documental                                     | Recomendación                                  |
| ------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Node.js 18          | Histórico e incompatible con el almacenamiento actual | Retirar como objetivo                          |
| Node.js 22 LTS      | Rama mantenida                                        | Compatibilidad secundaria si resulta necesaria |
| Node.js 24.22.3 LTS | Release de referencia del 11/11/2026                  | Principal                                      |
| Node.js 26.13.1 LTS | Release de referencia del 11/11/2026                  | Respaldo y brazo comparativo                   |

Las dos versiones principales incorporan actualizaciones de seguridad y SQLite 3.54.1 según sus notas oficiales. Deben volver a verificarse antes de fijar el artefacto experimental.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js Releases+3



La preferencia inicial por Node 24 responde a su mayor tiempo de maduración como línea LTS y a su proximidad con las propuestas previas de QAP, no a una superioridad de rendimiento demostrada.

Node 26 podría convertirse en principal si presenta una combinación más favorable de soporte, ciclo de mantenimiento, dependencias y resultados instalados.

### **5.2. Rust**

**Clasificación: candidato especializado; reconstrucción integral no recomendada inicialmente.**

Versión documental de referencia: Rust 1.100.0, publicada el 12 de noviembre de 2026.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://blog.rust-lang.org\&sz=32)

Rust Blog



Rust ofrece mecanismos de seguridad de memoria, control de recursos y compilación nativa particularmente atractivos para componentes sensibles.

Aplicaciones potenciales en QAP:

- Supervisor de procesos.
- Broker de operaciones privilegiadas.
- Confinamiento y gestión de procesos descendientes.
- Procesamiento intensivo de artefactos.
- Componentes nativos sujetos a límites estrictos de memoria.
- IPC y lanzadores específicos de plataforma.

Sus ventajas no deben confundirse con garantías automáticas de seguridad. FFI, bloques `unsafe`, dependencias nativas, errores de autorización y fallos lógicos siguen siendo relevantes.

Como núcleo integral exigiría reconstruir los contratos actuales, seleccionar bindings SQLite, reevaluar bibliotecas documentales y mantener una integración de automatización que no dispone de Rust entre los lenguajes oficialmente soportados por Playwright.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://playwright.dev\&sz=32)

Playwright



No recomiendo imponer Rust como segundo lenguaje obligatorio.

Se admitiría un componente Rust únicamente cuando:

1. Exista una garantía material que resolver.
2. Su frontera esté definida mediante un contrato estable.
3. Su costo completo sea favorable frente a las alternativas.
4. Pueda distribuirse y calificarse en todas las celdas correspondientes.
5. No introduzca una segunda autoridad escritora.

La matriz oficial de plataformas Rust distingue niveles de soporte. Estos niveles deben comprobarse por target y no extrapolarse a todos los sistemas operativos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://doc.rust-lang.org\&sz=32)

The rustc book



### **5.3. .NET 10 LTS / C#**

**Clasificación: alternativa de núcleo condicionada.**

Versión documental de referencia: .NET 10.0.15, publicada el 10 de noviembre de 2026. La política oficial contempla soporte LTS hasta noviembre de 2028.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://dotnet.microsoft.com\&sz=32)

.NET



Ventajas relevantes:

- Tipado estático y modelos de dominio robustos.
- Buen soporte para aplicaciones empresariales.
- Programación asíncrona y herramientas de diagnóstico.
- Integración oficialmente soportada por Playwright.
- Tipos decimales adecuados para numerosos dominios financieros.
- Distribución autocontenida y alternativas de compilación nativa.

Limitaciones:

- Reconstrucción extensa de contratos, pruebas y módulos actuales.
- Necesidad de seleccionar y calificar nuevamente SDK, drivers y bindings.
- `decimal` no sustituye todas las necesidades de precisión arbitraria.
- Native AOT impone restricciones sobre reflexión, generación dinámica de código y compatibilidad de bibliotecas.
- La distribución autocontenida incorpora componentes del runtime y no elimina sus obligaciones de mantenimiento.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

  Microsoft Learn+1



.NET constituye, a juicio de ET-01, la alternativa de núcleo más equilibrada si Node.js resulta materialmente inadecuado. Esta posición es una recomendación de investigación, no una demostración comparativa de desempeño.

### **5.4. Go**

**Clasificación: candidato localizado; núcleo integral diferido.**

Go resulta atractivo para servicios locales, supervisores, CLI y procesos concurrentes de distribución relativamente sencilla.

Ventajas:

- Compilación a ejecutables nativos.
- Modelo explícito de concurrencia.
- Herramientas integradas de compilación y pruebas.
- Posibilidad de reducir dependencias de runtime en componentes autónomos.

Limitaciones:

- Reconstrucción de la mayor parte del código existente.
- Necesidad de seleccionar implementaciones SQLite y decimal.
- La utilización de CGO puede complicar la distribución multiplataforma.
- Go no figura entre los lenguajes oficialmente soportados por Playwright.
- Su ciclo de mantenimiento exige actualizar regularmente las versiones principales.

La política oficial mantiene una versión hasta que existan dos versiones principales posteriores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://go.dev\&sz=32)

The Go Programming Language



La versión exacta de Go para un eventual brazo experimental queda pendiente de verificación; no se fija una versión no comprobada.

### **5.5. Python**

**Clasificación: componente especializado opcional.**

Python 3.15 figura en fase de corrección de errores según el calendario oficial consultado.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://devguide.python.org\&sz=32)

devguide.python.org



Es un candidato razonable para capacidades documentales, OCR, análisis especializado y procesamiento de datos cuando ET-05 identifique bibliotecas con ventajas concretas.

Como núcleo soberano presenta inconvenientes:

- Reconstrucción extensa de la plataforma.
- Mayor necesidad de validación dinámica en las fronteras.
- Complejidad de distribución de wheels y dependencias nativas.
- Necesidad de gestionar un runtime adicional.
- Evaluación de concurrencia y consumo según implementación concreta.
- Riesgo de convertir QAP en un conjunto heterogéneo de scripts sin autoridad común.

Python no debe convertirse en una vía mediante la cual HOST genere y ejecute código libre para sustituir las capacidades propias de QAP.

### **5.6. Matriz comparativa**

### **Comparación cualitativa de adecuación inicial**

Valoración documental relativa a QAP. No representa benchmarks ni puntuaciones experimentales.

| **Criterio**                | TS/Node | Rust | .NET | Go | Python |
| --------------------------- | ------- | ---- | ---- | -- | ------ |
| Reutilización actual        |         |      |      |    |        |
| Integración navegador       |         |      |      |    |        |
| Integración MCP existente   |         |      |      |    |        |
| Distribución nativa         |         |      |      |    |        |
| Control de memoria          |         |      |      |    |        |
| Modelo de dominio tipado    |         |      |      |    |        |
| Costo relativo de migración |         |      |      |    |        |
| Componentes especializados  |         |      |      |    |        |

Favorable

Condicionado

Menos favorable

No se suman estas valoraciones ni se asignan pesos. Los filtros eliminatorios preceden a cualquier comparación económica.

### **5.7. Alternativas que no recomiendo como fundamento**

| Alternativa                                | Motivo                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Microservicios distribuidos                | Aumentan complejidad operativa sin una necesidad empresarial ratificada.     |
| Núcleo dependiente de Electron             | Acoplaría la autoridad al ciclo de vida de la interfaz gráfica.              |
| Motor universal de scripts                 | Contradice la ejecución declarativa gobernada.                               |
| Orquestador SaaS                           | Incumple la autonomía local y ausencia de dependencia comercial obligatoria. |
| Kubernetes obligatorio                     | Sobrecosto operativo y de instalación para el producto local.                |
| Múltiples núcleos por consumidor           | Introduce divergencia de autoridad y veracidad.                              |
| Runtime experimental como única plataforma | Riesgo innecesario sin calificación de instalación, SDK, ABI y persistencia. |

## **6. Arquitectura lógica candidata**

### **6.1. Composición principal**

Los consumidores solicitan operaciones. El ejecutor decide, persiste y acredita. Los adaptadores no producen veredictos soberanos.

La arquitectura propuesta es un monolito modular local con fronteras de proceso donde sean necesarias.

No exige un servicio remoto, una base de datos por dominio ni un proceso por cada componente.

### **6.2. Capas y responsabilidades**

| Capa         | Responsabilidad                                      | Prohibición                               |
| ------------ | ---------------------------------------------------- | ----------------------------------------- |
| Dominio      | Entidades, reglas, estados y semántica de resultados | Dependencia directa de MCP, UI o browser  |
| Aplicación   | Casos de uso y coordinación de operaciones           | Autorizar por conveniencia del consumidor |
| Autoridad    | Identidad, permisos, grants, revocación y alcance    | Confiar en etiquetas declaradas por HOST  |
| Scheduler    | Admisión, prioridad, dependencias y recuperación     | Colas exclusivamente en memoria           |
| DataPlan     | Preparación, efectos, relaciones y cleanup           | Efectos fuera de autorización             |
| Evaluador    | Afirmaciones, testigos y AR-52                       | Inferir PASS por transporte               |
| Persistencia | Transacciones, CAS, durabilidad e historial          | Escritores alternativos no coordinados    |
| Adaptadores  | Capacidades técnicas y observaciones                 | Declarar verdad funcional soberana        |
| Consumidores | Presentación, solicitudes y consultas                | Acceso directo al escritor                |

### **6.3. Cinco dominios profesionales**

La ampliación AC-01 debe integrarse sobre la autoridad única:

1. Conocimiento y bases de prueba.
2. Estrategia, planificación y organización profesional.
3. Ejecución manual, híbrida y determinista.
4. Evidencia, defectos, consultas y publicaciones.
5. Gobierno operativo e interoperabilidad.

Estos nombres representan una agrupación lógica propuesta por ET-01. No sustituyen las entidades y relaciones normativas de `contratos-ac01.md`.

Los cuatro planos epistémicos permanecen ortogonales a estos dominios. No se deben confundir cinco áreas funcionales con cinco fuentes de verdad.

## **7. Reconstrucción selectiva por paquete**

La evaluación no debe utilizar como objetivo un porcentaje de líneas reutilizadas.

La unidad de reutilización apropiada es una **garantía verificable**, acompañada de su contrato, dependencias y pruebas.

| Paquete              | Decisión candidata                 | Reconstrucción requerida                                                  |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `shared`             | Conservar y endurecer              | DTO, esquemas, tipos, normalización y compatibilidad.                     |
| `engine`             | Adaptar y reconstruir parcialmente | Dominio soberano, scheduler, estados, DataPlan y contratos.               |
| `knowledge`          | Adaptar                            | Puerto de persistencia, aislamiento, revisiones, recuperación y búsqueda. |
| `auth`               | Reconstruir frontera               | Broker, sesiones, grants, secretos y revocación.                          |
| `git-adapter`        | Endurecer y reducir                | Operaciones sin shell, referencias validadas y fallo explícito.           |
| `mcp`                | Reconstruir como adaptador fino    | Extraer aplicación y autoridad fuera del transporte.                      |
| `cli`                | Adaptar y retirar legacy           | Delegación canónica y códigos AR-52.                                      |
| `playwright-adapter` | Conservar mecanismos útiles        | Separar discovery, observación, egress y capacidades.                     |
| `playwright-runner`  | Reconstruir integración            | Despacho por efecto, testigos y reconciliación.                           |
| `reporter`           | Adaptar y ampliar                  | Proyecciones canónicas y formatos propios.                                |

### **7.1.&#x20;**`shared`

Debe convertirse en un conjunto de contratos reutilizables, sin incorporar dependencias específicas del transporte.

Conservar:

- Esquemas existentes aprovechables.
- Tipos generados.
- Enumeraciones y estructuras compartidas.
- Pruebas de validación.

Endurecer:

- Validación runtime.
- Versionado de DTO.
- Canonicalización.
- Tipos numéricos exactos.
- Identidad lógica y revisiones.
- Rechazo de campos desconocidos cuando corresponda.

La ausencia de errores TypeScript no acredita que un mensaje externo sea válido.

### **7.2.&#x20;**`engine`

Es la base candidata para recuperar el dominio, pero no debe asumirse que sus flujos históricos representan íntegramente la arquitectura vigente.

Deben evaluarse sus puertos, mecanismos de planificación y pruebas como unidades reutilizables.

La reconstrucción crítica incluye:

- Máquina de estados.
- Scheduling durable.
- Admisión por permisos.
- Presupuesto.
- Dependencias entre obligaciones.
- Veredictos por afirmación.
- Reconciliación.
- Cleanup.
- Continuidad sin HOST.

No se recomienda introducir un framework empresarial pesado como requisito previo.

### **7.3.&#x20;**`knowledge`

Conservar mecanismos de almacenamiento, índices, esquemas y análisis de impacto que puedan acreditarse.

El driver queda detrás de un puerto acordado con ET-02.

Los accesos SQLite actuales deberán reconciliarse con el modelo soberano. Tener varias conexiones no es necesariamente incorrecto; tener varias autoridades capaces de modificar el estado sin coordinación sí lo es.

### **7.4.&#x20;**`auth`

La existencia de perfiles y almacenamiento de sesiones es aprovechable.

Sin embargo, `keytar`, los mecanismos de handoff y las rutas históricas no deben considerarse automáticamente válidos para la nueva frontera de secretos.

Se requiere coordinación con ET-06 para:

- Protección de KEK.
- Identidad efectiva.
- Custodia de sesiones.
- Linux sin D-Bus.
- Proveedores CI explícitos.
- Revocación durable.
- Ausencia de exposición de secretos hacia HOST.

### **7.5.&#x20;**`git-adapter`

Hallazgo directo:

El código utiliza `execSync` con interpolación de una referencia Git y una ruta de recuperación mediante `HEAD~1`.

Se recomienda:

- Sustituir ejecución mediante shell por argumentos separados.
- Validar referencias.
- Resolver commits explícitos.
- Registrar alcance y procedencia.
- Rechazar fallos en lugar de cambiar silenciosamente la base.
- Mantener operaciones Git de lectura bajo autorización.

**AR-40 conserva su condición previa a G1.**

### **7.6.&#x20;**`mcp`

Es el paquete con mayor necesidad de redistribución arquitectónica.

El servicio de aplicación debe ser extraído de MCP como responsabilidad lógica, independientemente de que su organización física final implique un paquete nuevo o la evolución de `engine`.

MCP debe limitarse a:

- Negociar capacidades.
- Validar mensajes de transporte.
- Invocar comandos y consultas autorizadas.
- Presentar respuestas tipadas.
- Gestionar compatibilidad protocolaria.
- Mantener continuidad referenciada.

MCP no debe ser el dueño de la verdad, del estado de campaña ni del único camino operativo.

### **7.7.&#x20;**`cli`

La CLI es un consumidor profesional obligatorio y una vía de operación sin IA.

Debe compartir la semántica de resultados con MCP y CI.

Los escritores históricos deberán retirarse después de disponer de sus sustituciones canónicas, o permanecer explícitamente bloqueados si todavía no existe una ruta acreditable.

No se debe reactivar una operación deshabilitada solo porque sigue apareciendo en el código.

### **7.8.&#x20;**`playwright-adapter`**&#x20;y&#x20;**`playwright-runner`

La reutilización debe realizarse por mecanismos:

- Discovery.
- Localizadores.
- Gestión de páginas.
- Observación.
- Sesiones.
- Captura permitida.
- Ejecución controlada.

No se debe trasladar indiscriminadamente la semántica histórica de resultados.

Los runners deben devolver hechos y recibos al núcleo, no decidir PASS funcional por sí mismos.

La selección del navegador, motor y versión corresponde a la coordinación con ET-03.

### **7.9.&#x20;**`reporter`

Debe funcionar como consumidor de proyecciones canónicas saneadas.

La generación de Markdown, HTML, PDF, XLSX o JUnit no puede introducir nuevas interpretaciones del resultado.

El reporte propio de QAP y la validación de reportes emitidos por el AUT bajo D11 permanecen capacidades diferentes.

## **8. Contratos, tipos y validación**

### **8.1. Esquema de comandos candidato**

Se propone un contrato conceptual con los siguientes campos mínimos. No constituye una implementación ni un reemplazo de los DTO normativos.

| Campo               | Finalidad                              |
| ------------------- | -------------------------------------- |
| `schema_version`    | Compatibilidad del contrato            |
| `request_id`        | Identidad de solicitud                 |
| `operation_id`      | Operación declarada                    |
| `scope_ref`         | Referencia opaca al ámbito             |
| `expected_revision` | Control de concurrencia                |
| `authorization_ref` | Referencia que debe resolver el núcleo |
| `payload`           | Datos tipados de operación             |
| `idempotency_key`   | Correlación gobernada                  |
| `deadline`          | Límite autorizado                      |
| `context_digest`    | Contexto congelado                     |

El consumidor no puede convertir una referencia de autorización en un grant efectivo por sí mismo.

El núcleo debe resolver nuevamente identidad, alcance, revisión, vigencia y permisos.

### **8.2. Validadores candidatos**

| Tecnología                    | Decisión                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------- |
| JSON Schema                   | Contrato interoperable principal                                              |
| Ajv 8.x                       | Candidato principal condicionado                                              |
| Validadores standalone de Ajv | Preferibles para esquemas propios compilados previamente                      |
| Zod                           | Alternativa para fronteras específicas, sin segunda fuente normativa          |
| Validadores manuales          | Reservados a invariantes de dominio no expresables suficientemente en esquema |

Ajv advierte que los esquemas no confiables introducen riesgos de seguridad y que su compilación dinámica tiene implicaciones de CSP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ajv.js.org\&sz=32)

Ajv JSON schema validator



Consecuentemente:

- No compilar arbitrariamente esquemas entregados por HOST.
- No habilitar referencias remotas automáticas.
- Limitar profundidad, cardinalidad y tamaño.
- Verificar expresiones regulares.
- Separar validación de estructura y autorización.
- Precompilar esquemas propios cuando resulte apropiado.

La validación de JSON Schema no demuestra autorización, autenticidad ni veracidad funcional.

### **8.3. Versionado**

Cada contrato debe distinguir:

- Versión de esquema.
- Revisión de entidad.
- Versión semántica de operación.
- Versión de proyección.
- Versión del evaluador.
- Identidad del artefacto instalado.

Los lectores podrán tolerar únicamente las diferencias explícitamente compatibles.

Un resultado con versión desconocida no debe convertirse en PASS mediante un valor predeterminado.

### **8.4. Canonicalización**

La base normativa establece RFC 8785 para proyecciones semánticas aplicables.

Se conserva:

- Ordenación canónica.
- Rechazo de entradas no válidas.
- Serialización reproducible.
- Representación textual de decimales exactos cuando corresponda.
- Separación de digest semántico, evidencia y atestación.

RFC 8785 utiliza reglas deterministas de serialización JSON y ordenación de propiedades; esto no sustituye la necesidad de normalización semántica específica de QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.rfc-editor.org\&sz=32)

rfc-editor.org



**Un hash no demuestra por sí mismo procedencia auténtica, autorización o veracidad.**

## **9. Scheduler y ejecución durable**

### **9.1. Recomendación tecnológica**

Scheduler propio acotado al dominio QAP, sobre persistencia SQLite y transacciones gobernadas.

No recomiendo incorporar inicialmente un motor distribuido general de workflows.

El scheduler requerido debe resolver:

- DAG de dependencias.
- Priorización por riesgo.
- Colas durables.
- Presupuestos y cuotas.
- Carriles independientes.
- Espera humana y HOST.
- Reservas por recurso.
- Cancelación.
- Fencing.
- Revocación.
- Recuperación después de interrupciones.
- Reconciliación de efectos externos.

Se propone evaluar una implementación de máquina de estados explícita frente a una biblioteca de statecharts, como XState, únicamente como ayuda de modelado.

Una biblioteca de estados en memoria no sustituye el almacenamiento durable, el control transaccional ni la recuperación. La versión exacta y admisibilidad de XState no fueron verificadas en esta investigación.

### **9.2. Ciclo conceptual**

Secuencia conceptual. Los estados operativos no sustituyen los seis veredictos funcionales normativos.

### **9.3. Regla de recuperación**

La expiración de un lease no acredita que una operación externa no haya ocurrido.

Deben distinguirse:

| Situación                        | Tratamiento                                      |
| -------------------------------- | ------------------------------------------------ |
| No despacho probado              | Puede reevaluarse admisión                       |
| Posible despacho                 | Reconciliar antes de repetir                     |
| Efecto confirmado                | No repetir automáticamente                       |
| Efecto parcial                   | Gestionar subefectos                             |
| Respuesta perdida                | No asumir ausencia de efecto                     |
| Revocación posterior al despacho | Detener efectos nuevos y reconciliar lo anterior |
| Cleanup incierto                 | No certificar cierre satisfactorio               |

La semántica debe proceder de AV-03, AV-04 y AC-01, no de los valores predeterminados de una biblioteca de colas.

### **9.4. Transacciones y escritor soberano**

Una implementación Node.js con SQLite síncrono puede ser viable si las operaciones de escritura se coordinan desde una unidad dedicada.

Para evitar bloquear MCP o UI:

- Proceso o worker de escritura bajo autoridad única.
- Cola acotada.
- Consultas con cancelación y límites.
- Control de backpressure.
- Transacciones breves.
- Operaciones largas fuera de transacciones.
- Publicación y recuperación gobernadas.

SQLite documenta las implicaciones de durabilidad de `synchronous=FULL` en modo WAL.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://system.data.sqlite.org\&sz=32)

system.data.sqlite.org



La garantía efectiva depende también del sistema de archivos, VFS, almacenamiento, hardware y comportamiento ante fallos.

### **9.5. Concurrencia funcional compuesta**

AC-DE-06 A introduce una excepción específica que debe preservarse.

Una unidad compuesta puede reservar un recurso frente a trabajos incompatibles, mientras permite participantes autorizados en su interior.

No equivale a eliminar los locks ni a permitir mutaciones simultáneas arbitrarias.

El scheduler debe coordinar:

- Identidad individual de cada participante.
- Reserva externa de la unidad.
- Grants por acción.
- Intención persistida por subefecto.
- Evidencia de solapamiento real.
- Afirmación conjunta.
- Reconciliación y cleanup.

El solapamiento de dos promesas JavaScript no acredita concurrencia efectiva en el AUT.

## **10. DataPlan y TypedRuleOracle**

### **10.1. DataPlan**

DataPlan debe ser un contrato de preparación y gestión de efectos, no un generador libre de scripts.

Debe representar:

| Entidad         | Contenido necesario                      |
| --------------- | ---------------------------------------- |
| DatasetRevision | Definición, fuente y revisión            |
| FixtureRevision | Condiciones y estrategia de uso          |
| Materialización | Datos realmente preparados               |
| Reserva         | Identidad, recurso, modalidad y vigencia |
| EffectIntent    | Operación, alcance y propósito           |
| EffectReceipt   | Hechos y observaciones                   |
| CleanupPlan     | Estrategia autorizada                    |
| Reconciliation  | Estado acreditado o incertidumbre        |
| Dependency      | Relaciones y orden causal                |

Una semilla reproducible no acredita por sí sola que los datos hayan sido creados, permanezcan vigentes o correspondan al ámbito autorizado.

### **10.2. TypedRuleOracle**

Se recomienda un evaluador declarativo de AST propio, estrictamente acotado.

Tipos mínimos conforme al contrato:

| Tipo        | Representación candidata                      |
| ----------- | --------------------------------------------- |
| Booleano    | `boolean`                                     |
| Entero      | Entero seguro o representación textual exacta |
| Decimal     | Texto decimal tipado                          |
| Dinero      | Decimal, moneda y escala                      |
| Fecha civil | Fecha sin conversión automática a UTC         |
| Hora civil  | Hora y contexto explícito                     |
| Instante    | Marca temporal absoluta                       |
| Enumeración | Dominio cerrado                               |
| Colección   | Tipo y cardinalidad limitados                 |

Operaciones permitidas:

Comparaciones, lógica, aritmética, escala, redondeo, agregaciones limitadas, conversiones acreditadas y transiciones de estado.

Operaciones prohibidas:

- `eval`.
- JavaScript arbitrario.
- Acceso libre a archivos.
- Red.
- Secretos.
- Tiempo implícito.
- Recursión o consumo no acotado.
- Plugins de cálculo suministrados libremente por HOST.

### **10.3. Precisión decimal**

| Candidato                  | Ventaja                               | Limitación                                                      |
| -------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `decimal.js` 10.6.0        | Precisión configurable y licencia MIT | Configuración y redondeo deben fijarse por contrato             |
| Enteros escalados / BigInt | Exactitud en dominios de escala fija  | División, conversiones y escala requieren tratamiento explícito |
| `Number`                   | Bajo costo y disponibilidad           | Inadecuado para garantías decimales exactas generales           |
| `.NET decimal`             | Tipo decimal nativo                   | Precisión finita y cambio de plataforma                         |

`decimal.js` permite aritmética de precisión arbitraria configurable y utiliza reglas explícitas de precisión y redondeo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



**Recomendación:** evaluar `decimal.js` como candidato principal y enteros escalados como alternativa para dominios apropiados.

No se debe utilizar aritmética decimal como sustituto de la semántica Excel exigida por D11.

### **10.4. Tiempo y contexto regional**

Separar obligatoriamente:

- Fecha civil.
- Hora civil.
- Instante.
- Zona horaria.
- Calendario.
- Duración monotónica.
- Contexto regional congelado.

Temporal constituye una referencia apropiada para este modelo.

La especificación distingue `PlainDate`, `PlainTime`, `Instant` y `ZonedDateTime`.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tc39.es\&sz=32)

tc39.es+1



La disponibilidad nativa de todas las APIs requeridas deberá comprobarse en el runtime exacto. Si fuera necesaria una biblioteca o polyfill, deberá calificarse su versión, licencia y comportamiento.

Las pruebas deben incluir cambios de horario, fechas ambiguas, cortes de día, monedas, separadores y diferencias regionales.

## **11. Resultado canónico y AR-52**

AR-52 constituye un contrato soberano independiente del lenguaje.

Se preservan:

**technical_status**

Estado técnico

**functional_verdict**

Resultado funcional

**cleanup_status**

Estado de limpieza

**evidence_health**

Salud de evidencia

Los seis veredictos funcionales normativos permanecen intactos.

| Veredicto     | Interpretación general                             |
| ------------- | -------------------------------------------------- |
| PASS          | Afirmación acreditada                              |
| FAIL          | Incumplimiento acreditado                          |
| INDETERMINATE | Evidencia o resolución insuficiente                |
| BLOCKED       | Impedimento aplicable                              |
| SKIPPED       | Obligación no ejecutada bajo condición documentada |
| ERROR         | Fallo del mecanismo                                |

La interpretación completa de cada caso corresponde a la tabla normativa AV-04, no a este resumen.

### **11.1. Tabla de códigos**

Conservar la tabla total y su precedencia:

| Condición normativa | Código |
| ------------------- | ------ |
| Abierto             | Nulo   |
| I                   | 18     |
| F con T/R/U/O       | 11     |
| F                   | 10     |
| T                   | 12     |
| R                   | 13     |
| U                   | 14     |
| O                   | 15     |
| A                   | 0      |
| S                   | 16     |
| Resto terminal      | 17     |

Las letras representan las condiciones definidas por el contrato original.

Los ACK durables, las consultas, las invocaciones y los resultados de campaña mantienen sus clases diferenciadas. El código 20 no acredita finalización funcional.

### **11.2. Propiedades obligatorias**

El evaluador debe asegurar:

- Un ACK no genera PASS.
- Una respuesta HTTP satisfactoria no acredita un efecto persistente.
- Un retry no borra un FAIL anterior.
- Un retest es diferente de un retry.
- El estado de evidencia actual puede deteriorarse sin reescribir hechos históricos.
- Una obligación omitida permanece visible.
- La falta de limpieza no se transforma en cierre satisfactorio.
- La proyección JUnit es necesariamente parcial respecto del sobre canónico.

Fuente vinculante: [enmiendas AV-04, §1](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com).

## **12. Build, herramientas y distribución**

### **12.1. TypeScript**

El repositorio utiliza TypeScript 5.5.4.

TypeScript 6.0 ya dispone de documentación oficial e incorpora cambios de configuración y compatibilidad que deben evaluarse antes de actualizar.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.typescriptlang.org\&sz=32)

TypeScript 6.0



Recomiendo distinguir:

| Brazo            | Propósito                            |
| ---------------- | ------------------------------------ |
| TypeScript 5.5.4 | Control histórico                    |
| TypeScript 5.9   | Posible transición de compatibilidad |
| TypeScript 6.x   | Candidato actualizado                |

La versión definitiva se fija después de verificar soporte de herramientas, esquemas, diagnósticos, módulos y dependencias.

El target de emisión, los tipos Node, el runtime instalado y los engines declarados deben corresponder a una misma política de compatibilidad.

### **12.2.&#x20;**`tsup`

Se confirma un riesgo de mantenimiento importante.

El propio repositorio de `tsup` informa que ya no se mantiene activamente y recomienda considerar `tsdown`.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Esto modifica la recomendación respecto del stack histórico.

| Candidato                | Evaluación                                          |
| ------------------------ | --------------------------------------------------- |
| tsup 8.5.1               | Control de compatibilidad y transición              |
| tsdown                   | Principal para evaluación de sustitución            |
| esbuild + tsc            | Alternativa de composición explícita                |
| tsc sin bundling general | Alternativa si simplifica procedencia e instalación |

`tsdown` proporciona una guía oficial de migración desde tsup.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tsdown.dev\&sz=32)

The Elegant Bundler for Libraries



La migración no debe ejecutarse automáticamente mediante herramientas de conversión.

Es necesario preservar:

- Entradas CLI y MCP.
- Shebang.
- ESM.
- Resolución de módulos.
- Declaraciones TypeScript.
- Assets.
- Huellas y procedencia.
- Dependencias externas.
- Imports dinámicos.
- Comportamiento desde directorios arbitrarios.
- Compatibilidad de instalación limpia.

### **12.3. pnpm**

Conservar pnpm como candidato de desarrollo por su integración con el monorepo existente.

Requisitos:

- Fijar versión exacta del gestor.
- Lockfile reproducible.
- Instalación congelada.
- Scripts de build autorizados explícitamente.
- Inventario de paquetes con código nativo.
- Exclusión de dependencias de desarrollo en el artefacto final.
- Ausencia de compiladores obligatorios para el usuario profesional.

El workspace inspeccionado permite actualmente builds para `esbuild` y `keytar`. Esto constituye una configuración observada, no una acreditación suficiente de seguridad.

El gestor de paquetes no debe ser un requisito permanente para operar una instalación profesional de QAP.

### **12.4. Diagnósticos**

El diagnóstico debe cubrir los diez paquetes y sus consumidores.

Separar:

| Diagnóstico    | Objeto                                     |
| -------------- | ------------------------------------------ |
| Typecheck      | Compatibilidad y errores de tipos          |
| Lint           | Reglas estáticas                           |
| Tests propios  | Comportamiento interno                     |
| Contract tests | Fronteras y equivalencia                   |
| Build          | Producción del artefacto                   |
| Package tests  | Instalación y ejecución del artefacto real |
| Doctor         | Capacidades instaladas                     |
| Aceptación     | Garantías normativas                       |

El script de release existente no demuestra que todos estos niveles estén satisfechos.

Los antecedentes de 142 y 144 diagnósticos TypeScript corresponden a contextos históricos documentados en AV-07. No deben presentarse como el resultado actual de `develop`.

### **12.5. Distribución candidata**

**Principal:** paquete instalado con runtime Node oficial fijado, módulos y recursos necesarios, componentes nativos verificados y launcher apropiado por SO.

**Respaldo:** empaquetado mediante Single Executable Applications, cuando resulte compatible con assets, imports, addons y procedencia.

Node SEA permite incorporar addons como assets, pero determinadas modalidades requieren extraerlos antes de cargarlos. Esto introduce cuestiones de seguridad y archivos temporales que deben calificarse.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://r2.nodejs.org\&sz=32)

Node.js v24.22.3 Documentation



Un ejecutable único no es un objetivo normativo superior a la seguridad, trazabilidad o compatibilidad.

## **13. Seguridad, aislamiento y cadena de suministro**

### **13.1. Frontera de seguridad**

No debe confiarse en:

- Tipado estático.
- Separación por paquetes.
- Un proceso lanzado en modo detached.
- Puertos loopback.
- Identidad declarada por el cliente.
- Un token estático compartido.
- El modelo de permisos Node como aislamiento principal.

ET-06 deberá establecer la frontera efectiva correspondiente al modelo de amenazas ratificado.

ET-01 propone evaluar comunicaciones autenticadas sobre IPC local, con identidad, revisión, revocación y validación de operación.

### **13.2. Amenazas relevantes**

| Amenaza                      | Control necesario                                             |
| ---------------------------- | ------------------------------------------------------------- |
| HOST comprometido            | Autoridad y grants efectivos independientes                   |
| UI manipulada                | Comandos validados y autorización por operación               |
| Visor convertido en escritor | Separación efectiva de capacidades                            |
| Parser hostil                | Confinamiento OS y límites                                    |
| Dependencia comprometida     | Procedencia, revisión y reducción de privilegios              |
| Replay IPC                   | Identidad, nonce o mecanismo equivalente, revisión y vigencia |
| Escritura concurrente        | CAS, reservas y escritor coordinado                           |
| Reanudación insegura         | Revalidación de autoridad                                     |
| Inyección de comandos        | Argumentos separados y validación                             |
| Exposición de secretos       | Broker y referencias opacas                                   |
| Pérdida de energía           | Durabilidad y recuperación acreditadas                        |
| Consumo excesivo             | Cuotas, cancelación y backpressure                            |

### **13.3. ABI**

Node-API proporciona estabilidad ABI para su interfaz, pero esta garantía no se extiende automáticamente a las bibliotecas externas enlazadas por un addon.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js v22.23.5 Documentation



Cada componente nativo debe registrar:

- Arquitectura CPU.
- SO y versión mínima.
- Runtime.
- Nivel Node-API o ABI correspondiente.
- Dependencias dinámicas.
- Toolchain.
- Procedencia.
- Licencia.
- Digest y firma cuando corresponda.

No se acepta instalar una dependencia mediante compilación improvisada en el equipo del usuario como fallback general.

### **13.4. Vulnerabilidades**

El historial oficial de Node incluye releases de seguridad del 11 de noviembre de 2026.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Wednesday, November 11, 2026 Security Releases



Los candidatos Node 24.22.3 y 26.13.1 incorporan, entre otras correcciones documentadas, la de `CVE-2026-123863`.

Esto no demuestra ausencia de vulnerabilidades adicionales.

Para cada componente deberá verificarse:

| Campo          | Evidencia requerida                    |
| -------------- | -------------------------------------- |
| Identidad      | Nombre, versión y origen               |
| Advisory       | GHSA, CVE, OSV o aviso oficial         |
| Rango afectado | Coincidencia con artefacto             |
| Alcanzabilidad | Ruta de ejecución pertinente           |
| Privilegios    | Capacidades del componente             |
| Corrección     | Versión y mitigación                   |
| Distribución   | Artefacto realmente instalado          |
| Decisión       | Admitir, sustituir, excluir o bloquear |

La auditoría completa de advisories transitivos queda pendiente.

### **13.5. Licencias**

| Componente | Licencia principal de referencia | Observación                            |
| ---------- | -------------------------------- | -------------------------------------- |
| Node.js    | MIT y terceros                   | Revisar avisos del runtime distribuido |
| TypeScript | Apache-2.0                       | Conservar condiciones aplicables       |
| Rust       | MIT/Apache-2.0                   | Verificar crates y dependencias        |
| Go         | BSD-3-Clause                     | Revisar distribución y módulos         |
| .NET       | MIT y terceros                   | Revisar componentes efectivos          |
| Python     | PSF y terceros                   | Revisar intérprete y extensiones       |
| SQLite     | Dominio público                  | Auditar bindings y extensiones         |
| Ajv        | MIT                              | Revisar transitivas                    |
| decimal.js | MIT                              | Configuración y versión fijadas        |
| tsup       | MIT                              | Riesgo de mantenimiento                |
| Playwright | Apache-2.0                       | Motores con obligaciones adicionales   |
| keytar     | MIT                              | Deuda de mantenimiento nativo          |

Estas identificaciones corresponden a licencias principales de referencia, no a una revisión legal exhaustiva de todos los bytes distribuidos.

Permanece abierta la inconsistencia entre el campo ISC del manifiesto raíz y el archivo de licencia MIT consignado en AV-07.

La resolución requiere decisión expresa del titular. ET-01 no la modifica.

### **13.6. SBOM y actualizaciones**

Se recomienda generar posteriormente un SBOM por composición instalada, no únicamente a partir del lockfile.

La cadena debe permitir verificar:

```
Fuente fijada
    ↓
Dependencias resueltas
    ↓
Build y recursos incorporados
    ↓
Artefacto distribuido
    ↓
Instalación efectiva
    ↓
Componentes alcanzables
    ↓
Privilegios y datos accesibles
```

La política de actualización debe contemplar:

- Parches de seguridad.
- Compatibilidad de esquemas.
- Migraciones verificadas.
- Rollback autorizado.
- Preservación de revocaciones.
- Retirada de versiones inseguras.
- Calificación de las capacidades afectadas.

Un rollback no debe restaurar permisos previamente revocados.

## **14. Compatibilidad multiplataforma**

### **14.1. Celdas candidatas**

| Sistema    | CPU           | Ruta Node candidata               | Riesgo principal                              |
| ---------- | ------------- | --------------------------------- | --------------------------------------------- |
| Windows    | x64           | Distribución oficial              | ACL, procesos, addons y firma                 |
| Windows    | ARM64         | Build correspondiente             | Disponibilidad de nativos y navegadores       |
| macOS      | ARM64         | Distribución oficial              | Firma, notarización y Keychain                |
| macOS      | x64           | Build correspondiente             | Soporte efectivo y horizonte de mantenimiento |
| Linux      | x64           | Build compatible con distribución | glibc, librerías y sesiones                   |
| Linux      | ARM64         | Build correspondiente             | Binarios nativos y motores de automatización  |
| Linux musl | Según alcance | Condicionado a build calificado   | Compatibilidad ABI y dependencias             |

Esta tabla identifica familias de calificación, no modifica cuáles son obligatorias según CV06/CV07 y las matrices vigentes.

Las releases oficiales de Node proporcionan artefactos específicos de plataforma y checksums.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js 24.22.3 (LTS)+1



La disponibilidad del runtime no demuestra que todos los demás componentes funcionen en esa celda.

### **14.2. Instalación profesional**

La instalación debe evitar que el usuario tenga que gestionar manualmente:

- Versiones Node.
- pnpm.
- Compiladores.
- Bindings nativos.
- Variables de entorno secretas.
- Navegadores incompatibles.
- Dependencias de sistema no documentadas.

La descarga de capacidades bajo demanda es admisible únicamente si no se reduce el alcance obligatorio y se respetan las políticas de instalación, licencia y operación offline.

### **14.3. Doctor instalado**

El diagnóstico debe identificar, entre otras capacidades:

- Runtime efectivo.
- ABI.
- SQLite y FTS5.
- Identidad de navegadores.
- IPC.
- Broker de secretos.
- Acceso a almacenamiento.
- Permisos requeridos.
- Capacidad de recuperación.
- Disponibilidad de medios y documentos.

El doctor no debe declarar una capacidad operativa únicamente porque encuentra un ejecutable.

## **15. Rendimiento y economía de ingeniería**

### **15.1. Comparación de costos relativos**

### **Costo relativo previsto de reconstrucción**

Estimación cualitativa basada en el acoplamiento con el código existente; no representa horas, dinero ni mediciones.

**TypeScript / Node**

Reconstrucción selectiva

**Node + componente Rust**

Frontera nativa adicional

**.NET**

Reconstrucción amplia

**Go**

Reconstrucción amplia

**Rust integral**

Reconstrucción amplia y nuevos bindings

**Python integral**

Reconstrucción amplia y redistribución

Las longitudes representan únicamente una visualización ordinal aproximada del esfuerzo relativo, no puntuaciones obtenidas mediante un método experimental.

### **15.2. Consumo de recursos**

No existe evidencia comparable suficiente para afirmar que QAP utilizaría determinada cantidad de RAM o CPU con Rust, Go, Node.js o .NET.

En particular, el consumo del producto incluye:

- Núcleo.
- Browser y procesos descendientes.
- WebView o UI.
- SQLite.
- Parsers.
- OCR.
- Codecs.
- Brokers.
- Componentes especializados.
- Almacenamiento de evidencia.

Sustituir Node por un binario nativo podría disminuir el costo del núcleo y, sin embargo, producir un ahorro reducido en el producto completo si los navegadores y otros componentes dominan el consumo.

Esta hipótesis debe medirse, no asumirse.

### **15.3. Matriz de medición futura**

| Dimensión   | Variables                                           |
| ----------- | --------------------------------------------------- |
| Instalación | Bytes descargados, instalados y temporales          |
| Arranque    | Frío, caliente y bajo demanda                       |
| RAM         | Reposo, discovery, ejecución, parser y concurrencia |
| CPU         | Picos, uso acumulado y saturación                   |
| Disco       | WAL, evidencia, índices, cachés y limpieza          |
| IO          | Latencia y amplificación de escritura               |
| Transporte  | Latencia y tamaño de DTO                            |
| Throughput  | Obligaciones terminadas y verificadas               |
| Estabilidad | Procesos residuales y crecimiento sostenido         |
| Energía     | Consumo acumulado cuando sea medible                |
| Tokens      | Handoff, recuperación y repetición de contexto      |

Los candidatos deben compararse con el mismo fixture, hardware, alcance, número de procesos, calidad de evidencia y garantías de seguridad.

### **15.4. Ahorro de tokens**

El ahorro depende principalmente de la arquitectura de conocimiento y continuidad:

- Contexto limitado al ámbito.
- Snapshot versionado.
- Plan congelado.
- Resumen de estado.
- Handoff recuperable.
- Ejecución determinista sin inferencia por paso.
- Consultas paginadas.
- Reutilización de descubrimiento acreditado.

No depende directamente de que el núcleo esté escrito en Rust o TypeScript.

Los valores históricos de tokens permanecen hipótesis hasta EXP-01 y E3.

## **16. Trazabilidad normativa primaria de ET-01**

La matriz de responsabilidad asigna a ET-01 31 entradas normativas primarias, incluyendo las cinco ampliaciones M1–M5, además de tres cláusulas AC-01 de coordinación primaria.

Las restantes entradas conservan sus responsables correspondientes y son dependencias transversales, no nuevos elementos del denominador.

La tabla siguiente presenta garantías tecnológicas y criterios documentales de referencia. No sustituye el desglose completo de todas las fichas y celdas normativas.

### **16.1. Planificación**

| ID            | Garantía tecnológica                         | Calificación |
| ------------- | -------------------------------------------- | ------------ |
| REQ-PLN-001.1 | Plan versionado y snapshot reproducible      | E1/E4        |
| REQ-PLN-001.2 | Inventario parcial y brechas explícitas      | E4           |
| REQ-PLN-001.3 | Priorización reproducible por riesgo         | E4           |
| REQ-PLN-001.4 | DAG, roles y variables tipadas               | E4/E5/E8     |
| REQ-PLN-001.5 | Validación de revisión y autorización previa | E1/E4/E7     |
| REQ-PLN-001.6 | Fallo localizado y ramas independientes      | E3/E4/E5     |

Candidato: dominio TypeScript con planificación declarativa y persistencia de revisiones.

Estado: **condicionado**.

### **16.2. Casos y elegibilidad**

| ID            | Garantía tecnológica                          | Calificación |
| ------------- | --------------------------------------------- | ------------ |
| REQ-CAS-001.1 | Ejecución autónoma de casos elegibles         | E3/E4        |
| REQ-CAS-001.2 | Variantes y afirmaciones acreditadas          | E4/E5        |
| REQ-CAS-001.3 | Reparación sin cambiar intención ni historial | E4/E5        |
| REQ-CAS-001.4 | Ámbito, aplicabilidad y autorización          | E4/E5        |
| REQ-CAS-001.5 | Deduplicación e invalidación conservadora     | E4/E5        |

Candidato: `CaseIdentity`, `CaseRevision`, representaciones versionadas y evaluadores tipados.

Estado: **condicionado**.

### **16.3. Datos**

| ID            | Garantía tecnológica                         | Calificación     |
| ------------- | -------------------------------------------- | ---------------- |
| REQ-DAT-001.1 | Sintéticos trazables y clasificación         | E5               |
| REQ-DAT-001.2 | DataPlan, preparación y efectos              | E5/E8            |
| REQ-DAT-001.3 | Producción exclusivamente lectura acreditada | E2/E5/E8         |
| REQ-DAT-001.4 | Cleanup y compensación gobernada             | E5               |
| REQ-DAT-002.1 | Calidad de datos declarativa                 | E5/E8            |
| REQ-DAT-002.2 | Concurrencia funcional compuesta             | E1/E2/EXP-05b/E5 |

Candidato: DataPlan durable con intención, reservas y reconciliación por subefecto.

Estado: **condicionado**.

### **16.4. Campañas**

| ID            | Garantía tecnológica                        | Calificación |
| ------------- | ------------------------------------------- | ------------ |
| REQ-CAM-001.1 | Continuidad de extremo a extremo            | E3/E4/E5/E8  |
| REQ-CAM-001.2 | Fallo y bloqueo localizados                 | E3/E5        |
| REQ-CAM-001.3 | Presupuesto durable y estado parcial        | E3/E5        |
| REQ-CAM-001.4 | Recuperación y escritor único               | E2/E3        |
| REQ-CAM-001.5 | Cambio de modalidad preservando continuidad | E3/E4/E5     |

Candidato: scheduler durable coordinado con SQLite.

Estado: **condicionado**.

### **16.5. Regresión**

| ID            | Garantía tecnológica                       | Calificación |
| ------------- | ------------------------------------------ | ------------ |
| REQ-REG-001.1 | Selección por drift, riesgo y dependencias | E4/E5        |
| REQ-REG-001.2 | Inestabilidad e historial de resultados    | E5           |
| REQ-REG-001.3 | Reparación versionada preservando oráculo  | E4/E5        |

Candidato: grafo de dependencias, revisiones inmutables y series de intentos.

Estado: **condicionado**.

### **16.6. Onboarding y ampliaciones**

| ID          | Garantía tecnológica de ET-01              | Calificación |
| ----------- | ------------------------------------------ | ------------ |
| REQ-ONB-001 | Instalación, doctor y runtime reproducible | E1/E6/E7     |
| M1          | DTO y proyecciones semánticamente comunes  | E6/E7        |
| M2          | Export portátil y referencias gobernadas   | E6           |
| M3          | Medios vinculados a evidencia y custodia   | E6           |
| M4          | Acceso, autorización y reproducción        | E6/E7        |
| M5          | Compatibilidad y diagnóstico del paquete   | E6/E8        |

Las capacidades multimedia concretas requieren coordinación con ET-05 y ET-06; ET-01 responde por las interfaces y la preservación de autoridad, no por seleccionar unilateralmente codecs o visores.

### **16.7. Cláusulas AC-01 primarias**

| Cláusula   | Contrato tecnológico                                         | Criterio                                                                           |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| AC01-08.01 | Identidad funcional, revisión y representación diferenciadas | Manual a híbrida sin perder identidad, afirmaciones ni cobertura                   |
| AC01-15.01 | Parametrización tipada, explícita y versionada               | Cada combinación materializada es trazable; inválidos bloqueados antes de despacho |
| AC01-15.02 | Componentes reutilizables declarativos                       | Dependencias, expectativas y revisiones congeladas; sin scripting libre            |

Fuentes: [matriz ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com), [matriz AV-08](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/matriz-aceptacion-av08.md?utm_source=chatgpt.com), [matriz AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/matriz-aceptacion-ac01.md?utm_source=chatgpt.com) y [contrato delta](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/catalogo-delta-ac01.md?utm_source=chatgpt.com).

## **17. Registros maestros y reservas críticas**

| Registro | Tratamiento de ET-01                                                           |
| -------- | ------------------------------------------------------------------------------ |
| AR-26    | Baseline real de deuda, build y diagnóstico antes de acreditar reconstrucción. |
| AR-34    | Reconciliar arquitectura, dependencias y composición técnica.                  |
| AR-42    | Preservar continuidad y fronteras entre núcleo y consumidores.                 |
| AR-52    | Implementar tabla normativa exacta y paridad semántica.                        |
| AR-54    | Verificar condiciones de reconstrucción y componentes pertinentes.             |
| AR-57    | Preservar restricciones de integración y aceptación asociadas.                 |
| AR-24    | Visor de solo lectura y frontera efectiva.                                     |
| AR-40    | Seguridad del adaptador Git antes de G1.                                       |
| AR-41    | Mantener el corte y las condiciones de migración.                              |
| AR-20    | No liberar D11 sin calificación correspondiente.                               |
| AR-30    | Preservar G6.5 y aceptación final.                                             |

Estas son asociaciones de trabajo tecnológico, no transcripciones ni cierres de los registros maestros.

Los 57 estados permanecen exactamente como se encuentran en el expediente. Las reservas de ET-01 no constituyen una nueva clasificación administrativa de AR.

## **18. Coordinación obligatoria ET-02–ET-07**

### **18.1. ET-02 — Persistencia, memoria y consultas**

| Interfaz      | Propuesta                                                       |
| ------------- | --------------------------------------------------------------- |
| Driver SQLite | `node:sqlite` principal; `better-sqlite3` respaldo condicionado |
| Autoridad     | Escritor único coordinado                                       |
| Transacciones | CAS e intención durable                                         |
| Consultas     | Tipadas, acotadas y autorizadas                                 |
| FTS5          | Capacidad instalada demostrada                                  |
| Backup        | Coherencia, protección y restauración gobernada                 |

**Conflicto potencial:** seleccionar un driver o sistema de búsqueda que obligue a introducir un segundo escritor, servicio remoto o semántica incompatible de transacciones.

### **18.2. ET-03 — Navegadores y ejecución**

Contrato candidato `ExecutionCapabilityPort`.

El adaptador recibe operaciones autorizadas y devuelve observaciones, recibos y referencias de evidencia.

Playwright Core permanece candidato, sin congelar versión.

Si ET-03 selecciona otro motor, deberá conservar:

- Identidad y alcance.
- Control por efecto.
- Testigos.
- Reconocimiento de incertidumbre.
- Cancelación gobernada.
- Reconciliación.
- Cleanup.

Una incompatibilidad del SDK no autoriza debilitar estas garantías.

### **18.3. ET-04 — Interfaz operacional**

La UI debe operar sobre comandos y consultas del ejecutor soberano.

| Aspecto           | Restricción                                       |
| ----------------- | ------------------------------------------------- |
| Framework gráfico | Independiente del dominio                         |
| Estado visual     | Proyección, no verdad canónica                    |
| Operaciones       | Autenticadas y autorizadas                        |
| Visor AR-24       | Solo lectura                                      |
| Ciclo de vida     | Cerrar UI no cancela indiscriminadamente campañas |
| Offline           | Operación profesional local sin IA                |

Una eventual elección de Tauri no obliga a reescribir el núcleo en Rust.

Una eventual elección de Electron no obliga a utilizar su runtime embebido como autoridad soberana.

### **18.4. ET-05 — Documentos, reportes y evidencia**

Puertos candidatos:

| Puerto                   | Responsabilidad           |
| ------------------------ | ------------------------- |
| `DocumentExtractionPort` | Extracción estructurada   |
| `DocumentRenderPort`     | Representación controlada |
| `EvidenceCapturePort`    | Captura autorizada        |
| `EvidenceCustodyPort`    | Custodia y acceso         |
| `OracleWitnessPort`      | Hechos y procedencia      |
| `PublicationPort`        | Export desde proyección   |

Se admitirán componentes especializados en otros lenguajes si su capacidad concreta los justifica.

No deberán convertirse en escritores autónomos ni decidir veredictos funcionales.

### **18.5. ET-06 — Seguridad e instalación**

Coordinación crítica sobre:

- Supervisor.
- Identidad OS.
- IPC.
- Broker.
- KEK.
- Captura.
- Aislamiento.
- Firma.
- Distribución.
- Licencias.
- ABI.
- Revocación y custodia.

Si ET-06 identifica una limitación insalvable de Node.js para una frontera específica, primero deberá compararse un componente especializado frente a una reescritura general.

### **18.6. ET-07 — MCP, agentes, APIs y CI**

Los SDK y protocolos deben quedar en adaptadores.

El repositorio contiene SDK MCP v1 y AV-07 identifica candidatos posteriores v1/v2. Su estado contemporáneo completo no fue verificado independientemente en esta investigación, por lo que corresponde a ET-07 consolidarlo.

Los contratos soberanos no deben depender de que un HOST implemente:

- Elicitation.
- Roots.
- Determinada interfaz de diálogo.
- Un mecanismo opcional de transporte.
- Una versión específica de capacidades no obligatorias.

La ausencia de una capacidad del HOST no concede permiso ni justifica resultados inventados.

### **18.7. Composición compatible**

| Especialidad | Principal propuesta desde ET-01      | Respaldo                          |
| ------------ | ------------------------------------ | --------------------------------- |
| ET-01        | TypeScript + Node 24 LTS             | Node 26 LTS                       |
| ET-02        | SQLite integrado detrás de puerto    | Driver nativo calificado          |
| ET-03        | Adaptador de navegador independiente | Otro motor que preserve garantías |
| ET-04        | UI separada de autoridad             | Framework local alternativo       |
| ET-05        | Workers y parsers confinados         | Componentes especializados        |
| ET-06        | Broker y supervisor por SO           | Componente nativo localizado      |
| ET-07        | Adaptadores MCP/CLI/CI versionados   | SDK o transporte compatible       |

No se presenta esta composición como decisión tomada por los otros especialistas.

## **19. Calificación experimental futura**

No recomiendo crear una nueva campaña general de experimentos.

La mayoría de las incertidumbres identificadas puede incorporarse a los EXP y criterios E existentes, sin cambiar el DAG vigente.

### **19.1. Experimentos existentes**

| Experimento | Cuestión tecnológica de ET-01                                               |
| ----------- | --------------------------------------------------------------------------- |
| EXP-01a     | Compatibilidad HOST y MCP                                                   |
| EXP-01b     | Continuidad, contexto y costo de handoff                                    |
| EXP-02      | Persistencia, consultas y aislamiento                                       |
| EXP-03      | Retención, cuotas y recuperación                                            |
| EXP-04a/b   | Instalación y recursos de la composición                                    |
| EXP-05a     | Frontera de operaciones externas y autorización                             |
| EXP-05b     | Efectos, DataPlan y concurrencia                                            |
| EXP-06a     | Prevención y protección de captura                                          |
| EXP-06b     | Compatibilidad documental, decimal y D11                                    |
| EXP-06c     | Custodia, conservación y recuperación                                       |
| EXP-07      | KEK, secretos y brokers                                                     |
| EXP-08a     | Frontera de escritor, visor y consumidores                                  |
| EXP-08b/c   | Calificación posterior de la interfaz y sus garantías conforme al protocolo |

Esta correspondencia sintetiza la contribución de ET-01 y no altera los procedimientos exactos fijados por cada EXP.

### **19.2. Matriz de calificación tecnológica**

| Incertidumbre   | Fixture y controles                               | Criterio de éxito                                   | Respaldo                               |
| --------------- | ------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| Node 24 vs 26   | Misma composición, operaciones sanas y fallos     | Todas las garantías y celdas aplicables satisfechas | Otra LTS compatible                    |
| SQLite síncrono | Consultas, escritura, interrupciones y saturación | Durabilidad sin bloqueo operativo inadmisible       | Escritor dedicado o driver alternativo |
| IPC             | Comando autorizado y solicitudes manipuladas      | Positivo válido y negativos denegados               | IPC alternativo calificado             |
| Scheduler       | DAG, cancelación, reinicio y pérdida de ACK       | Continuidad sin duplicación de efectos              | Reconstrucción localizada              |
| Decimal         | Límites, escalas, división y monedas              | Resultado exacto según expectativa acreditada       | Enteros escalados                      |
| Tiempo          | Cambio de zona y fechas ambiguas                  | Identidad temporal preservada                       | Biblioteca temporal calificada         |
| Build           | Instalación limpia y resolución real              | Artefacto íntegro y reproducible                    | esbuild/tsc                            |
| Addons          | SO/CPU/ABI y ausencia de prebuild                 | Instalación gobernada y sin compilación improvisada | Broker o componente alternativo        |
| AR-52           | Resultados sanos, mutantes e incertidumbre        | Tabla normativa exacta                              | Corrección del evaluador               |
| Concurrencia    | Dos participantes, tercero incompatible y fallos  | Reserva externa y solapamiento acreditado           | Otra estrategia de coordinación        |

### **19.3. E1–E8**

| Evidencia | Contribución de ET-01                       |
| --------- | ------------------------------------------- |
| E1        | Contratos, fronteras y persistencia inicial |
| E2        | Durabilidad, revocación y recuperación      |
| E3        | Autonomía, continuidad y handoff            |
| E4        | Planificación, DAG y elegibilidad           |
| E5        | Efectos, testigos, oráculos y cleanup       |
| E6        | Evidencia, distribución y publicaciones     |
| E7        | Paridad de interfaces y capacidades         |
| E8        | Aceptación instalada integral               |

G6.5 conserva los criterios ratificados y las condiciones de independencia de evaluación.

EXP-06a y EXP-08a deberán satisfacer sus condiciones previas a G1. AR-24 y AR-40 permanecen en G0; AR-20, AR-41 y AR-30 conservan sus respectivas compuertas.

### **19.4. Pruebas de contratos y propiedades**

Vitest puede conservarse como candidato para pruebas propias del software.

Se recomienda evaluar `fast-check` para propiedades deterministas de los contratos. La herramienta documenta reproducción mediante semilla.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://fast-check.dev\&sz=32)

fast-check



Propiedades candidatas:

- Una operación denegada no produce despacho.
- Una revisión obsoleta no modifica autoridad.
- Un lease anterior no puede confirmar como vigente.
- La canonicalización es determinista.
- Una permutación de campos no altera el digest aplicable.
- Un retry no elimina un fallo acreditado.
- Una transición prohibida no se transforma en válida.
- Un importe exacto conserva su representación.
- Una proyección de reporte no inventa hechos.
- Un comando desconocido falla cerrado.
- Una reanudación no revive grants revocados.

Estas pruebas son pruebas del propio QAP. No deben confundirse con los casos que QAP ejecutará posteriormente contra aplicaciones empresariales.

No se considera necesario un nuevo EXP autónomo mientras estas propiedades puedan integrarse sin pérdida de cobertura en E1, E2, E5 y E7.

## **20. Riesgos y objeciones tecnológicas localizadas**

| ID       | Riesgo                                             | Severidad | Resolución requerida                  |
| -------- | -------------------------------------------------- | --------- | ------------------------------------- |
| ET01-R01 | Duplicación de autoridad durante extracción de MCP | Crítica   | Escritor único y frontera EXP-08      |
| ET01-R02 | Empaquetado incompatible con addons                | Alta      | Calificación por artefacto instalado  |
| ET01-R03 | Desactualización de tsup                           | Alta      | Sustitución calificada                |
| ET01-R04 | Incompatibilidad de versiones Playwright           | Alta      | Identidad única por composición       |
| ET01-R05 | Bloqueo del event loop                             | Alta      | Separación de operaciones síncronas   |
| ET01-R06 | Corrupción o pérdida de información histórica      | Crítica   | Migración y recuperación gobernadas   |
| ET01-R07 | Evaluación incorrecta de reglas monetarias         | Crítica   | Tipos y oráculos exactos              |
| ET01-R08 | Reintentos de efectos desconocidos                 | Crítica   | Reconciliación previa                 |
| ET01-R09 | Falsa seguridad por separación lógica              | Crítica   | Frontera OS efectiva                  |
| ET01-R10 | Proliferación innecesaria de lenguajes             | Alta      | Admisión por beneficio demostrado     |
| ET01-R11 | Licencias inconsistentes                           | Alta      | Resolución de titularidad y SBOM      |
| ET01-R12 | Supuesto ahorro de recursos no medido              | Media     | Comparación instalada                 |
| ET01-R13 | Diferencias semánticas MCP/CLI/CI                  | Crítica   | AR-52 y E7                            |
| ET01-R14 | Dependencias transitivas no revisadas              | Alta      | Auditoría de procedencia y advisories |

### **Objeción ET01-O01 — Autoridad alojada en MCP**

La reconstrucción del núcleo no puede limitarse a actualizar versiones o reorganizar nombres de carpetas.

Si MCP sigue siendo dueño de la lógica de aplicación, mientras CLI o UI pueden producir escrituras por otras rutas, la composición incumplirá la arquitectura ratificada.

Resolución candidata: extraer autoridad y casos de uso a un ejecutor independiente del transporte.

### **Objeción ET01-O02 — Empaquetado histórico**

La conservación indefinida de tsup presenta un riesgo documentado de mantenimiento.

Resolución candidata: compararlo con tsdown y con una cadena explícita esbuild/tsc.

No existe autorización para ejecutar esta migración todavía.

### **Objeción ET01-O03 — Seguridad basada exclusivamente en runtime**

Ninguna opción de lenguaje examinada acredita automáticamente las fronteras exigidas.

Rust no elimina errores de permisos; Node no proporciona aislamiento completo mediante su modelo de permisos; .NET y Go también requieren controles de identidad y proceso.

Resolución candidata: calificar la composición de seguridad completa con ET-06.

## **21. Registro de decisiones tecnológicas candidatas**

| ID candidato | Principal                               | Respaldo                                           | Estado                |
| ------------ | --------------------------------------- | -------------------------------------------------- | --------------------- |
| ET01-C01     | TypeScript                              | C#/.NET                                            | Condicionado          |
| ET01-C02     | Node 24 LTS                             | Node 26 LTS                                        | Condicionado          |
| ET01-C03     | TypeScript actualizado y estricto       | Línea intermedia compatible                        | Condicionado          |
| ET01-C04     | pnpm fijado                             | Cadena alternativa reproducible si fuera necesaria | Condicionado          |
| ET01-C05     | tsdown                                  | esbuild + tsc                                      | Condicionado          |
| ET01-C06     | `node:sqlite`                           | `better-sqlite3`                                   | Condicionado a ET-02  |
| ET01-C07     | Scheduler durable propio acotado        | Implementación alternativa sobre mismo contrato    | Condicionado          |
| ET01-C08     | JSON Schema + Ajv                       | Validador compatible acreditado                    | Condicionado          |
| ET01-C09     | AST declarativo tipado                  | Evaluador equivalente acotado                      | Condicionado          |
| ET01-C10     | decimal.js                              | Enteros escalados según dominio                    | Condicionado          |
| ET01-C11     | Modelo temporal compatible con Temporal | Biblioteca calificada                              | Condicionado          |
| ET01-C12     | IPC local autenticado                   | Transporte local alternativo                       | Condicionado a EXP-08 |
| ET01-C13     | Runtime instalado y fijado              | SEA calificado                                     | Condicionado          |
| ET01-C14     | Vitest y pruebas de propiedades         | Herramientas equivalentes                          | Condicionado          |
| ET01-C15     | Componentes Rust solo por necesidad     | Broker nativo por plataforma                       | Condicionado a ET-06  |

La selección de versiones exactas, salvo las referencias comparativas documentadas, permanece deliberadamente abierta.

## **22. Fuentes primarias y procedencia**

Fecha de consulta de fuentes públicas: **26 de noviembre de 2026**.

### **22.1. Expediente QAP**

| Fuente                                                                                                                                                                                                     | Alcance                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                   | Invariantes y alcance           |
| [Catálogo normativo](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                  | Requisitos                      |
| [Manifiesto original](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)       | Precedencia y fuentes           |
| [Manifiesto AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/manifiesto-ac01.md?utm_source=chatgpt.com)                           | Universo ampliado               |
| [Contratos AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/contratos-ac01.md?utm_source=chatgpt.com)                             | Fronteras e integración         |
| [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                             | Durabilidad e interoperabilidad |
| [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                             | Resultados, efectos y oráculos  |
| [Reconstrucción AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/matriz-reconstruccion-av07.md?utm_source=chatgpt.com)            | Reutilización de componentes    |
| [Dependencias y licencias AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/dependencias-licencias-av07.md?utm_source=chatgpt.com) | Identidades históricas          |
| [Compuertas AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/compuertas-av07.md?utm_source=chatgpt.com)                           | Protocolos y dependencias       |
| [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                          | Registros AR                    |
| [Resolución final AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/resolucion-final-ac01.md?utm_source=chatgpt.com)               | Estado documental y reservas    |

### **22.2. Tecnología externa**

| Fuente oficial                                                                                                          | Versión o referencia        |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| [Node.js Releases](https://nodejs.org/en/about/previous-releases?utm_source=chatgpt.com)                                | Calendario LTS vigente      |
| [Node.js 24.22.3](https://nodejs.org/en/blog/release/v24.22.3?utm_source=chatgpt.com)                                   | Release 11/11/2026          |
| [Node.js 26.13.1](https://nodejs.org/en/blog/release/v26.13.1?utm_source=chatgpt.com)                                   | Release 11/11/2026          |
| [Node-API](https://nodejs.org/api/n-api.html?utm_source=chatgpt.com)                                                    | ABI                         |
| [Node Permissions](https://nodejs.org/api/permissions.html?utm_source=chatgpt.com)                                      | Límites de seguridad        |
| [Node SEA](https://r2.nodejs.org/docs/latest-v24.x/api/single-executable-applications.html?utm_source=chatgpt.com)      | Distribución                |
| [TypeScript 6.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html?utm_source=chatgpt.com) | Compatibilidad              |
| [tsup](https://github.com/egoist/tsup?utm_source=chatgpt.com)                                                           | Estado de mantenimiento     |
| [tsdown](https://tsdown.dev/guide/migrate-from-tsup?utm_source=chatgpt.com)                                             | Sustitución candidata       |
| [Rust 1.100.0](https://blog.rust-lang.org/2026/11/12/Rust-1.100.0/?utm_source=chatgpt.com)                              | Release 12/11/2026          |
| [Rust Platform Support](https://doc.rust-lang.org/stable/rustc/platform-support.html?utm_source=chatgpt.com)            | Targets                     |
| [Go Release History](https://go.dev/doc/devel/release?utm_source=chatgpt.com)                                           | Política de soporte         |
| [.NET Support Policy](https://dotnet.microsoft.com/en-us/platform/support/policy?utm_source=chatgpt.com)                | .NET 10.0.15 LTS            |
| [.NET Native AOT](https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/?utm_source=chatgpt.com)           | Distribución y limitaciones |
| [Python Versions](https://devguide.python.org/versions/?utm_source=chatgpt.com)                                         | Python 3.15                 |
| [Playwright Supported Languages](https://playwright.dev/docs/languages?utm_source=chatgpt.com)                          | Compatibilidad de lenguajes |
| [Ajv Security](https://ajv.js.org/security.html?utm_source=chatgpt.com)                                                 | Validación segura           |
| [decimal.js](https://github.com/MikeMcl/decimal.js?utm_source=chatgpt.com)                                              | 10.6.0                      |
| [Temporal](https://tc39.es/proposal-temporal/?utm_source=chatgpt.com)                                                   | Modelo temporal             |
| [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html?utm_source=chatgpt.com)                                          | Canonicalización            |
| [fast-check](https://fast-check.dev/docs/introduction/why-property-based/?utm_source=chatgpt.com)                       | Pruebas de propiedades      |

La documentación versionada de SQLite correspondiente a Node 24.22.3 y el archivo `BUILDING.md` de esa revisión no pudieron abrirse directamente durante esta consulta. Sus condiciones específicas deberán verificarse antes de fijar el candidato por plataforma.

## **23. Dictamen final al Orquestador Principal**

**TypeScript + Node.js**

Apto como candidato

Con reconstrucción selectiva y sujeto a calificación integral.

**Runtime, SQLite e IPC**

Condicionados

Identidad instalada, durabilidad, seguridad y compatibilidad pendientes.

**.NET 10 LTS**

Respaldo

Alternativa de núcleo ante un impedimento material acreditado.

**Rust**

Especializado

Admisible para componentes concretos con beneficio técnico demostrado.

**Reescritura integral inmediata**

No recomendada

Sin justificación documental suficiente frente al costo y riesgo de reconstrucción.

### **23.1. Recomendación central**

QAP debe evolucionar hacia una arquitectura profesional local, durable, modular y soberana, conservando TypeScript y Node.js mientras sigan siendo capaces de satisfacer las garantías ratificadas.

No recomiendo conservar indiscriminadamente la implementación existente.

Tampoco recomiendo desechar mecanismos útiles simplemente porque proceden de una arquitectura anterior.

La reconstrucción debe concentrarse en aquello que determina la confiabilidad profesional del producto:

**Autoridad, permisos, identidad, persistencia, ejecución durable, efectos, oráculos, recuperación y veracidad de resultados.**

El lenguaje es una decisión instrumental subordinada a esas garantías.

### **23.2. Decisiones genuinamente pendientes**

El Orquestador deberá reconciliar:

1. La línea Node LTS y el driver SQLite.
2. La frontera de IPC y supervisor.
3. El reemplazo del empaquetador histórico.
4. La composición efectiva por SO y CPU.
5. La compatibilidad de SDK y navegador.
6. Los componentes nativos realmente necesarios.
7. La estrategia de precisión decimal y tiempo.
8. La titularidad y política de distribución MIT/ISC.
9. El resultado posterior de los protocolos experimentales autorizados.

No se identifica en esta investigación una necesidad material de reducir requisitos o reabrir decisiones empresariales por conveniencia tecnológica.

### **23.3. Reserva formal**

El informe aporta una recomendación tecnológica independiente sustentada en evidencia directa del repositorio y documentación primaria contemporánea.

No obstante, debido a la cobertura parcial de algunas fuentes normativas extensas, los imports transitivos, el lockfile completo y los avisos de seguridad, **no recomiendo cerrar administrativamente ET-01 como investigación exhaustiva íntegramente acreditada sin verificar esas reservas**.

La clasificación final por capacidad es:

| Capacidad                                    | Dictamen                                          |
| -------------------------------------------- | ------------------------------------------------- |
| Lenguaje principal                           | APTO COMO CANDIDATO                               |
| Runtime                                      | CONDICIONADO                                      |
| Reconstrucción selectiva                     | APTO COMO CANDIDATO                               |
| Scheduler durable                            | CONDICIONADO                                      |
| Frontera de autoridad                        | CONDICIONADO                                      |
| Contratos y oráculos                         | CONDICIONADO                                      |
| Distribución multiplataforma                 | CONDICIONADO                                      |
| Seguridad integral instalada                 | SIN RUTA DOCUMENTAL SUFICIENTE PARA CERTIFICACIÓN |
| Superioridad cuantitativa de una reescritura | SIN RUTA DOCUMENTAL SUFICIENTE                    |

### **23.4. Declaración de cumplimiento operativo**

Durante esta investigación:

- No se modificó GitHub.
- No se modificó código, dependencias ni configuración.
- No se instalaron herramientas.
- No se compiló QAP.
- No se ejecutaron pruebas ni benchmarks.
- No se realizaron experimentos.
- No se accedió a sistemas empresariales.
- No se elaboró un WBS.
- No se inició G0 ni G1.
- No se seleccionaron tecnologías irreversiblemente.
- No se alteraron las decisiones empresariales ni los estados de los registros maestros.

**Resultado: recomendación tecnológica candidata condicionada, entregada al Orquestador Principal para integración multidisciplinaria y verificación de las reservas documentales.**

**FIN DEL INFORME ET-01.**
