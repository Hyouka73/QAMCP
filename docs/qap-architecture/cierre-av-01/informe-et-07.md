# **Informe ET-07 — Evaluación tecnológica de MCP, agentes, APIs, interoperabilidad y CI/CD**

**Destinatario:** Orquestador Principal de QAP\
**Especialidad:** ET-07\
**Fecha de investigación:** 26 de noviembre de 2026\
**Repositorio:** `Hyouka73/QAMCP`\
**Rama exclusiva:** `develop`\
**SHA del encargo:** `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029`\
**SHA normativo y de código fijado por los encargos:** `1a81e86c9b17a95a04e40237eff5fb99215bae5a`\
**Naturaleza:** Investigación tecnológica documental independiente.

Dictamen tecnológico ET-07

# **CONDICIONADO**

Existe una ruta tecnológica documentalmente viable para la interoperabilidad profesional de QAP. Se recomienda conservar los estándares ratificados, actualizar los componentes tecnológicos y reconstruir selectivamente las fronteras de integración que actualmente impiden garantizar autoridad, continuidad y veracidad.

Implementación autorizada

No



Experimentos ejecutados

Ninguno



Modificaciones del repositorio

Ninguna



Certificación instalada

Pendiente



## **1. Resumen ejecutivo**

La conclusión principal de ET-07 es que **QAP no necesita sustituir MCP, convertirse en un servidor remoto ni incorporar otro motor autónomo de agentes para satisfacer su arquitectura profesional v1**.

Sí necesita modificar sustancialmente la relación entre sus interfaces, los agentes externos, el ejecutor, los conectores y el resultado canónico.

La evolución reciente de MCP ofrece una oportunidad favorable: el SDK oficial TypeScript v2 ya pertenece a una línea estable que incorpora la especificación MCP `2026-07-28`, manteniendo mecanismos de compatibilidad con clientes de generaciones anteriores. No corresponde seguir evaluándolo como si fuera exclusivamente una tecnología experimental.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://blog.modelcontextprotocol.io\&sz=32)

Model Context Protocol Blog+2



Sin embargo, adoptar el SDK actualizado no resuelve automáticamente las deficiencias arquitectónicas de QAP.

### **1.1. Recomendación tecnológica consolidada**

| Componente             | Candidato principal                           | Respaldo                                            | Dictamen            |
| ---------------------- | --------------------------------------------- | --------------------------------------------------- | ------------------- |
| SDK MCP                | TypeScript SDK v2, perfil dual-era            | SDK v1 actualizado y parcheado                      | Condicionado        |
| Transporte MCP         | Stdio local                                   | Implementación Stdio alternativa con SDK oficial Go | Condicionado        |
| Integración de agentes | Adaptadores específicos de los cuatro hosts   | Configuración explícita asistida                    | Condicionado        |
| Autonomía              | HOST + DETERMINISTIC sobre núcleo único       | Otro transporte interno, misma semántica            | Apto como candidato |
| UTCP                   | SDK oficial con transporte gobernado          | Adaptador HTTP compatible independiente             | Condicionado        |
| OpenAPI                | Validación por dialecto y Ajv                 | Validador alternativo aislado                       | Condicionado        |
| Transporte API         | Broker HTTP local gobernado                   | Implementación equivalente aislada                  | Condicionado        |
| CI/CD                  | CLI determinista sin IA ni TTY                | Integraciones delgadas por proveedor                | Apto como candidato |
| JUnit                  | Proyección propia de AR-52                    | Serializador XML alternativo                        | Apto como candidato |
| Ingesta externa        | Adaptadores pasivos versionados               | Importación canónica explícita                      | Apto como candidato |
| Contratos externos     | Referencias y resultados consumidor-proveedor | Adaptadores específicos posteriores                 | Apto como candidato |
| Intercambio portable   | Paquete canónico y CSV estructurado           | Serializadores alternativos equivalentes            | Condicionado        |

Todos los dictámenes anteriores se refieren a **elegibilidad documental**, no a conformidad funcional de QAP.

### **1.2. Hallazgos principales**

| ID       | Hallazgo                                                                                                                                        | Impacto |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| ET07-H01 | El SDK MCP fijado actualmente pertenece a una línea anterior y presenta coincidencias con rangos afectados por avisos posteriores de seguridad. | Alto    |
| ET07-H02 | El registro MCP existente no cubre los cuatro hosts obligatorios ni demuestra actualización CAS segura.                                         | Alto    |
| ET07-H03 | El paquete MCP concentra responsabilidades de aplicación que deberían pertenecer al núcleo soberano.                                            | Alto    |
| ET07-H04 | El generador JUnit actual no implementa el contrato normativo AR-52 y AC01-17.02.                                                               | Crítico |
| ET07-H05 | MCP moderno cambia mecanismos de negociación y metadatos; no basta actualizar imports.                                                          | Alto    |
| ET07-H06 | UTCP y OpenAPI no constituyen mecanismos suficientes de autorización por sí mismos.                                                             | Crítico |
| ET07-H07 | La compatibilidad anunciada por los fabricantes de los hosts no acredita su comportamiento instalado.                                           | Alto    |
| ET07-H08 | No existe evidencia contemporánea suficiente para garantizar un porcentaje determinado de ahorro de tokens.                                     | Alto    |
| ET07-H09 | Los resultados de evaluadores externos requieren preservación semántica, no conversión directa a PASS.                                          | Crítico |
| ET07-H10 | El empaquetado y las estampas actuales no acreditan por sí solos la composición completa instalada.                                             | Alto    |

No se propone crear diez nuevos registros maestros AR. Estos identificadores corresponden exclusivamente a hallazgos tecnológicos de ET-07 y deben relacionarse con el registro existente.

## **2. Autoridad normativa, fuentes y límites de la investigación**

### **2.1. Encargos vinculantes**

Se recuperaron y leyeron íntegramente mediante el conector GitHub:

| Documento                                                                                                                                                                                                | Blob SHA                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Encargo tecnológico común](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com) | `01a510f95bb32870c5c2b18fd7c934c877aec5ea` |
| [Encargo especializado ET-07](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-07.md?utm_source=chatgpt.com)                | `abaff5e02d7f245b9c62c39a62564dd2c2c017d5` |

Ambos encargos fijan `1a81e86c9b17a95a04e40237eff5fb99215bae5a` como base normativa y de código.

Se ha respetado esta distinción al consultar los componentes de implementación.

### **2.2. Fuentes internas contrastadas**

Se recuperaron documentos y se examinaron las secciones pertinentes de las siguientes fuentes:

| Fuente                                                                                                                                                                                                     | Materia examinada                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                   | Autoridad, autonomía, interoperabilidad, veracidad |
| [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                              | Fichas IA, INT, AGT y XINST                        |
| [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)      | Precedencia y fuentes fijadas                      |
| [Manifiesto AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-ac01.md?utm_source=chatgpt.com)                           | Ampliación profesional                             |
| [Matriz de responsables ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com)           | Asignaciones primarias y cruzadas                  |
| [Matriz AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-aceptacion-ac01.md?utm_source=chatgpt.com)                        | Trazabilidad de requisitos                         |
| [Contratos AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/contratos-ac01.md?utm_source=chatgpt.com)                             | EXP-08, JUnit, ingesta externa                     |
| [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                             | AR-15, generaciones MCP                            |
| [Enmiendas AV-04](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com)                             | Resultado, efectos y puerto externo                |
| [Enmiendas AV-05](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av05.md?utm_source=chatgpt.com)                             | UTCP, OpenAPI y autoridad                          |
| [Protocolos AV-03](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/protocolos-av03.md?utm_source=chatgpt.com)                           | EXP-01a/b                                          |
| [Protocolos AV-05](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/protocolos-av05.md?utm_source=chatgpt.com)                           | EXP-05a/b                                          |
| [Dependencias y licencias AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/dependencias-licencias-av07.md?utm_source=chatgpt.com) | Versiones, licencias y composición                 |
| [Resolución final AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/resolucion-final-ac01.md?utm_source=chatgpt.com)               | Correcciones normativas                            |

**Limitación material de cobertura:** aunque los dos encargos se leyeron íntegramente, la recuperación y visualización de varias fuentes auxiliares estuvo limitada por el tamaño de sus contenidos. No se completó una lectura íntegra de las 41 fuentes del manifiesto original, de todas las contravalidaciones ni de todos los archivos de código y pruebas pertinentes.

Por ello, este informe no afirma cumplimiento íntegro del procedimiento documental común, ni constituye una auditoría exhaustiva de las dependencias transitivas. Las recomendaciones respaldadas por evidencia concreta son utilizables como candidaturas, pero permanece una reserva documental que el Orquestador debe considerar antes de cerrar ET-07.

### **2.3. Preservación de la línea base**

| Universo normativo    | Cantidad | Tratamiento         |
| --------------------- | -------- | ------------------- |
| Requisitos REQ        | 110      | Preservar           |
| Políticas POL         | 2        | Preservar           |
| Ampliaciones          | 11       | Preservar           |
| **Total de entradas** | **123**  | **Sin reducción**   |
| Cláusulas AC-01       | 65       | Preservar           |
| Registros maestros AR | 57       | Sin reclasificación |
| Decisiones D01–D21    | 21       | Vinculantes         |
| Decisiones DE         | 5        | Ratificadas         |
| Decisiones AC-DE      | 7        | Ratificadas         |

Se preservan las combinaciones ratificadas:

- DE-01–05: A / B / B / A con B como respaldo / B.
- AC-DE-01–07: B / A / B / A / A / A / A.

No se propone modificar ninguna decisión empresarial ni cerrar ningún AR.

Estados normativos existentes de los 57 AR

Validados

6

Validación experimental pendiente

17

Pendientes

26

Bloqueantes

8

Estados anteriores a ET-07. No representan progreso experimental obtenido en esta investigación.

## **3. Mapa de obligaciones de ET-07**

La matriz de responsables asigna directamente a esta especialidad **14 entradas normativas y 8 cláusulas AC-01**.

Los demás requisitos siguen vigentes y se consideran dependencias cruzadas cuando afectan a las interfaces estudiadas.

### **3.1. Entradas normativas primarias**

| ID            | Garantía tecnológica exigida               | Candidato o mecanismo               | Calificación |
| ------------- | ------------------------------------------ | ----------------------------------- | ------------ |
| REQ-IA-001.1  | Propuestas estructuradas y vigentes        | MCP + DTO canónico                  | E1           |
| REQ-IA-001.2  | Ejecución sin inferencia                   | CLI y ejecutor determinista         | E3/E7        |
| REQ-IA-001.3  | Validación única de propuestas             | Validador del núcleo                | E1/E4        |
| REQ-IA-001.4  | Colas y continuidad multi-host             | Ejecutor soberano y cola durable    | E3/E7        |
| REQ-IA-001.5  | Integridad común MCP/CLI                   | Sobre y verificador canónico        | E5/E7        |
| REQ-IA-001.6  | Proveedor opcional sin dependencia MANAGED | Puerto neutral                      | E1           |
| REQ-INT-001.1 | Núcleo único y paridad                     | Adaptadores delgados                | E7           |
| REQ-INT-001.2 | Instalación multiplataforma                | Runtime y lanzador versionados      | EXP-01a/E7   |
| REQ-INT-001.3 | Abstracción de persistencia y colas        | Puertos independientes              | E1/E2        |
| REQ-INT-001.4 | Conectores opt-in gobernados               | Registro y broker                   | EXP-05a/b    |
| REQ-XINST-001 | Referencias entre instancias sin mutación  | Identidad y transporte segregados   | E5/E8        |
| REQ-AGT-001   | Adopción profesional multi-host            | Registro MCP + Skill opcional       | EXP-01a/b    |
| REQ-AGT-002   | Contexto acotado y reutilizable            | ContextSnapshot paginado            | EXP-01b      |
| UTCP/OpenAPI  | Ambas capacidades de integración           | Descriptores y transporte gobernado | EXP-05a/b    |

### **3.2. Cláusulas AC-01 primarias**

| Cláusula   | Obligación                       | Criterio principal                              |
| ---------- | -------------------------------- | ----------------------------------------------- |
| AC01-11.01 | Paquetes portables               | Idempotencia, linaje y conflicto explícito      |
| AC01-11.02 | Biblioteca y CSV                 | Importación validada, vista previa y recibo     |
| AC01-17.01 | CI sin IA ni TTY                 | Autoridad efectiva y cero inferencias           |
| AC01-17.02 | AR-52 y JUnit                    | Cero éxitos falsos                              |
| AC01-18.01 | Ingesta de evaluaciones externas | Procedencia, identidad y normalización          |
| AC01-18.02 | Despacho externo gobernado       | Autoridad y calificación independiente          |
| AC01-23.01 | Perfiles de dependencia          | Real, sandbox, simulada, replay o no disponible |
| AC01-24.01 | Contratos consumidor-proveedor   | Versiones, compatibilidad y efecto separados    |

### **3.3. Registros maestros relacionados**

Especial atención a AR-05, AR-08, AR-09, AR-10, AR-11, AR-12, AR-15, AR-17, AR-24, AR-28, AR-30, AR-31, AR-40, AR-41, AR-42, AR-43, AR-44, AR-45, AR-46, AR-47, AR-48 y AR-52.

Su asociación con ET-07 no altera propietarios, precedencias ni estados.

## **4. Inventario tecnológico real de QAP**

### **4.1. Dependencias declaradas y resueltas**

Se contrastaron los manifests de los paquetes MCP y CLI, el lockfile del monorepo y las referencias de AV-07.

| Componente                  | Versión declarada o resuelta | Observación                      |
| --------------------------- | ---------------------------- | -------------------------------- |
| `@qap/monorepo`             | 2.1.0                        | Monorepo pnpm                    |
| `@qap/mcp`                  | 2.1.3                        | Entrada MCP independiente        |
| `@hyouka73/qap-cli`         | 2.1.3                        | Entrada CLI                      |
| `@modelcontextprotocol/sdk` | 1.30.0 y 1.30.1              | Ambas resoluciones presentes     |
| TypeScript                  | \~5.5.4                      | Compilación y tipos              |
| Zod                         | 4.6.5                        | Resolución asociada al SDK       |
| Ajv                         | 8.20.0                       | Validación                       |
| Ajv                         | 6.15.0                       | Resolución adicional en lockfile |
| Ajv Formats                 | 3.0.1                        | Validación de formatos           |
| Commander                   | ^15.0.0                      | CLI                              |
| `@inquirer/prompts`         | ^8.6.0                       | Interacción de terminal          |
| YAML                        | ^2.9.0                       | Documentos y configuración       |
| Playwright Core             | 1.62.1 / 1.63.0              | Diferencias entre consumidores   |
| tsup                        | ^8.5.1                       | Empaquetado                      |
| keytar                      | ^7.9.0                       | Dependencia opcional del CLI     |

**Evidencias primarias:**

- [Manifest MCP](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/package.json?utm_source=chatgpt.com).
- [Manifest CLI](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/cli/package.json?utm_source=chatgpt.com).
- [Lockfile pnpm](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/pnpm-lock.yaml?utm_source=chatgpt.com).
- [Configuración de compilación MCP](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/tsup.config.ts?utm_source=chatgpt.com).

La coexistencia de diferentes versiones no demuestra por sí sola un defecto funcional. Sí obliga a identificar qué dependencia resuelve cada consumidor y qué código termina efectivamente distribuido.

### **4.2. Componentes reutilizables**

| Componente existente                    | Evaluación                                                  | Tratamiento candidato             |
| --------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `ToolDispatcher`                        | Registro sellado, validación y errores públicos controlados | Conservar y adaptar               |
| Catálogo de herramientas                | Base útil para exposición MCP                               | Adaptar                           |
| Transporte Stdio                        | Adecuado para ejecución local                               | Conservar concepto                |
| Commander                               | Infraestructura CLI reutilizable                            | Conservar                         |
| Gestión centralizada de errores CLI     | Base para errores de invocación                             | Adaptar                           |
| Pruebas MCP de autorización             | Activos útiles de regresión                                 | Preservar y revisar               |
| Serialización XML                       | Mecanismo básico reutilizable                               | Adaptar                           |
| Registro MCP actual                     | Cobertura y garantías insuficientes                         | Reconstrucción selectiva          |
| Servicios de aplicación alojados en MCP | Acoplamiento incompatible con adaptadores delgados          | Extraer gradualmente hacia núcleo |
| Generación de resultado por consumidor  | Riesgo de divergencia                                       | Sustituir por proyección común    |

### **4.3. Evidencia de acoplamiento MCP**

El archivo [server.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/server.ts?utm_source=chatgpt.com) contiene 6,224 líneas en el contenido recuperado y combina:

- Implementación del servidor MCP.
- Importación de servicios de autorización.
- Acceso a conocimiento y persistencia.
- Servicios de Discovery, planificación, pruebas y reportes.
- Gestión de operaciones de proyecto.
- Interacción con mecanismos de autenticación.
- Registro y despacho de herramientas.

El tamaño del archivo no constituye por sí mismo una infracción arquitectónica. La evidencia relevante es la concentración de responsabilidades de aplicación dentro de la interfaz MCP.

Por su parte, [dispatcher.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/dispatcher.ts?utm_source=chatgpt.com) ya ofrece mecanismos aprovechables: validación de invocaciones, registro sellado, cancelación y normalización de excepciones.

**Recomendación:** conservar estos mecanismos donde satisfagan el contrato objetivo, pero impedir que el dispatcher MCP constituya una autoridad independiente del núcleo.

### **4.4. Deficiencia concreta del registro de agentes**

La implementación de [register.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/register.ts?utm_source=chatgpt.com) y [commands/mcp.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/cli/src/commands/mcp.ts?utm_source=chatgpt.com) permite registrar Cursor y Claude Desktop.

Esto no acredita:

- Antigravity.
- Codex.
- Claude Code.
- Gemini CLI.
- Preservación concurrente de configuración ajena.
- Desregistro simétrico con identidad de propiedad.
- Compatibilidad por ámbito de configuración.

AV-07 también identifica el uso de lanzamiento no fijado, reescritura completa del objeto de configuración y exposición excesiva en dry-run.

**Dictamen:** el mecanismo actual no es admisible como registrador profesional definitivo sin adaptación sustancial.

## **5. Evaluación tecnológica de MCP**

### **5.1. Estado contemporáneo del protocolo**

La revisión estable contemporánea identificada es MCP `2026-07-28`.

El proyecto anunció además en noviembre de 2026 una transición hacia ciclos regulares de publicación semestrales. Esta evolución favorece una política explícita de compatibilidad y mantenimiento, en lugar de adoptar automáticamente cada revisión publicada.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://blog.modelcontextprotocol.io\&sz=32)

Model Context Protocol Blog+1



Fuentes primarias:

- [Especificación MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28?utm_source=chatgpt.com).
- [SDK oficial TypeScript](https://github.com/modelcontextprotocol/typescript-sdk?utm_source=chatgpt.com).
- [Compatibilidad entre generaciones](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions?utm_source=chatgpt.com).
- [Publicaciones del SDK](https://github.com/modelcontextprotocol/typescript-sdk/releases?utm_source=chatgpt.com).

### **5.2. Comparación de generaciones**

| Capacidad              | Era anterior                     | Era 2026-07-28                              | Consecuencia QAP                      |
| ---------------------- | -------------------------------- | ------------------------------------------- | ------------------------------------- |
| Negociación            | `initialize`                     | `server/discover` y metadatos por solicitud | Adaptación del transporte             |
| Estado del protocolo   | Asociado a sesión                | Núcleo del protocolo sin estado de sesión   | Persistencia propia imprescindible    |
| Capacidades            | Negociación inicial              | Mecanismos modernos por solicitud           | No asumir capacidades uniformes       |
| Listados               | Contrato anterior                | Metadatos y semántica moderna de caché      | Catálogo estable y versionado         |
| Entrada intermedia     | Solicitudes del servidor         | MRTR y mecanismos modernos                  | No convertirlos en autoridad          |
| Resultado estructurado | Restricciones de la era anterior | Representación ampliada                     | Proyección por perfil                 |
| Transporte local       | Stdio                            | Stdio                                       | Mantener                              |
| Sampling y roots       | Disponibles según cliente        | Deprecados en la revisión moderna           | No establecer dependencia obligatoria |

El SDK TypeScript v2 documenta modos legacy, automático y fijación estricta de versión. En determinadas condiciones, la negociación automática de Stdio utiliza un proceso hermano desechable para el sondeo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ts.sdk.modelcontextprotocol.io\&sz=32)

MCP TypeScript SDK+1



**Consecuencia crítica:** un proceso MCP iniciado para descubrir capacidades no debe iniciar una campaña, abrir indebidamente el almacén privado ni adquirir autoridad operacional.

### **5.3. Alternativas de SDK**

| Criterio                        | TypeScript v1        | TypeScript v2   | SDK oficial Go         | Implementación propia |
| ------------------------------- | -------------------- | --------------- | ---------------------- | --------------------- |
| Reutilización del código actual | Alta                 | Media-alta      | Baja                   | Media                 |
| Protocolo moderno               | Limitado frente a v2 | Documentado     | Documentado            | Por desarrollar       |
| Compatibilidad legacy           | Documentada          | Documentada     | Dependiente del perfil | Por desarrollar       |
| Integración con Node            | Directa              | Directa         | IPC adicional          | Directa si TypeScript |
| Reconstrucción                  | Baja-media           | Media           | Alta                   | Alta                  |
| Mantenimiento de protocolo      | Upstream temporal    | Upstream activo | Upstream activo        | QAP                   |
| Riesgo de divergencia           | Medio                | Medio           | Medio-alto             | Alto                  |
| Recomendación                   | Respaldo transitorio | Principal       | Respaldo estructural   | No preferido          |

El SDK Go oficial también implementa MCP `2026-07-28`. Por tanto, constituye una alternativa tecnológica real y no una propuesta hipotética sin implementación upstream.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



No obstante, introducir Go exclusivamente para reemplazar el adaptador MCP aumentaría el número de composiciones, binarios y contratos de IPC que QAP tendría que mantener.

### **5.4. Versiones candidatas**

| Tecnología          | Referencia candidata                                       | Estado                                                 |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| TypeScript MCP v1   | 1.32.2, o parche posterior elegible                        | Identificada en AV-07; requiere cotejo de distribución |
| TypeScript MCP v2   | Línea 2.x estable, servidor 2.4.0 como referencia de AV-07 | Requiere fijación por paquete                          |
| SDK Go              | Release estable compatible con 2026-07-28                  | Versión exacta pendiente de fijar                      |
| Node.js             | 24 LTS, referencia 24.22.3                                 | Candidato principal                                    |
| Node.js alternativo | 26 LTS                                                     | Respaldo sujeto a composición                          |

La consulta directa de determinados metadatos npm versionados no estuvo disponible durante esta investigación. Por ello, no se afirma que las versiones de referencia internas constituyan los últimos parches publicados al 26 de noviembre.

Node 24 y 26 figuran en la matriz oficial como líneas LTS. Node 18 y Node 20 figuran fuera de soporte, circunstancia relevante para la configuración histórica de compilación.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js Releases+1



### **5.5. Riesgo temporal del SDK v1**

El repositorio oficial anuncia mantenimiento de v1 durante al menos seis meses después de la publicación de v2, fechada el 27 de julio de 2026.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Esto no demuestra que v1 quede necesariamente abandonado al cumplirse exactamente ese plazo. Sí implica que no debe constituir el único fundamento de una arquitectura con expectativas profesionales de mantenimiento prolongado.

**Decisión candidata ET07-T01:**

- Principal: TypeScript SDK v2 con compatibilidad dual acreditada.
- Respaldo inmediato: v1 parcheado.
- Respaldo estructural: SDK Go como adaptador aislado.
- Descartar una implementación completa propia del protocolo salvo que se demuestre una necesidad insatisfecha por los SDK oficiales.

## **6. Arquitectura de interoperabilidad propuesta**

La siguiente composición es conceptual. No constituye una selección de procesos, ABI o frameworks definitivos.

Los HOST proponen y consultan. El núcleo autoriza, admite y acredita. Ninguna interfaz externa constituye una segunda autoridad.

### **6.1. Contrato de las interfaces**

Toda entrada MCP, CLI, CI o UI equivalente deberá traducirse al mismo contrato de aplicación.

Campos conceptuales necesarios:

| Campo              | Finalidad                                          |
| ------------------ | -------------------------------------------------- |
| `schemaVersion`    | Compatibilidad del DTO                             |
| `requestId`        | Correlación                                        |
| `operationId`      | Identidad lógica de operación                      |
| `scopeIdentity`    | Aplicación, instancia, entorno y tenant            |
| `expectedRevision` | Control de concurrencia                            |
| `principalRef`     | Identidad efectiva                                 |
| `grantRef`         | Referencia opaca, nunca autorización autodeclarada |
| `correlationId`    | Asociación con intentos y efectos                  |
| `deadline`         | Control temporal                                   |
| `payload`          | Parámetros tipados                                 |
| `proposalRevision` | Vigencia de propuesta cuando corresponda           |

Estos nombres son ilustrativos. ET-01 debe consolidarlos con los contratos existentes, no incorporarlos como una segunda taxonomía.

La validación debe distinguir tres niveles:

1. Validez sintáctica y de esquema.
2. Validez semántica y vigencia.
3. Autoridad efectiva sobre la acción.

Superar el primer nivel no permite omitir los restantes.

### **6.2. Herramientas, recursos y prompts MCP**

| Superficie       | Función adecuada                    | Función prohibida                        |
| ---------------- | ----------------------------------- | ---------------------------------------- |
| Tools            | Consultas y comandos tipados        | Concederse permisos                      |
| Resources        | Contexto autorizado y documentación | Exponer archivos arbitrarios             |
| Prompts          | Orientar el flujo profesional       | Sustituir la política                    |
| Instructions     | Explicar el catálogo y límites      | Considerarse control de seguridad        |
| Skills           | Mejorar adopción                    | Obligar todas las tareas a pasar por QAP |
| Hooks            | Orientación informativa opt-in      | Bloquear desarrollo legítimo             |
| Roots            | Contexto potencial del cliente      | Autoridad efectiva de almacenamiento     |
| Elicitation/MRTR | Interacción opcional cuando proceda | Dependencia del ciclo ordinario          |
| Sampling         | Capacidad de ciertos perfiles       | Proveedor obligatorio de razonamiento    |

El servidor no debe anunciar capacidades que no estén implementadas ni depender de que todos los clientes consuman resources o prompts.

Las consultas imprescindibles tienen que disponer de representación mediante herramientas canónicas cuando el perfil del HOST no soporte otra superficie.

### **6.3.&#x20;**`structuredContent`**&#x20;y fallback JSON**

Se recomienda utilizar un DTO JSON canónico independiente de la generación del protocolo.

El adaptador proyectaría dicho DTO a:

- `structuredContent`, cuando el perfil aplicable lo admita.
- Contenido textual JSON compatible.
- Recursos autorizados o referencias paginadas cuando procedan.

Los dos primeros deben conservar equivalencia semántica. No deben producir dos resultados distintos ni duplicar indiscriminadamente reportes voluminosos.

La matriz de capacidades futura debe incluir:

| Vector                           | Control                                   |
| -------------------------------- | ----------------------------------------- |
| Resultado pequeño                | Estructurado y textual equivalentes       |
| Resultado paginado               | Continuidad y omisiones explícitas        |
| Error funcional                  | No confundir con fallo RPC                |
| Error de invocación              | No convertir en resultado de campaña      |
| Cliente sin soporte estructurado | JSON legible y completo dentro del límite |
| Resultado demasiado grande       | Paginación, no truncamiento silencioso    |
| Datos no autorizados             | Ausentes de todas las representaciones    |

## **7. Compatibilidad con los cuatro agentes obligatorios**

### **7.1. Matriz documental por HOST**

| HOST                    | Transporte documentado | Configuración                  | Era MCP efectiva | Build calificada |
| ----------------------- | ---------------------- | ------------------------------ | ---------------- | ---------------- |
| Antigravity App         | Stdio / HTTP           | `mcp_config.json`              | Indeterminada    | Ninguna          |
| Antigravity IDE         | Stdio / HTTP           | Configuración MCP propia       | Indeterminada    | Ninguna          |
| Antigravity CLI (`agy`) | Stdio / HTTP           | Global o workspace             | Indeterminada    | Ninguna          |
| Codex CLI               | Stdio / HTTP           | TOML y comandos MCP            | Indeterminada    | Ninguna          |
| Claude Code             | Stdio / HTTP           | Local, user o project          | Indeterminada    | Ninguna          |
| Gemini CLI              | Stdio / HTTP           | `settings.json` y comandos MCP | Indeterminada    | Ninguna          |

Fuentes oficiales consultadas:

| HOST            | Fuente primaria                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| Antigravity CLI | [Documentación MCP](https://antigravity.google/docs/cli/mcp/?utm_source=chatgpt.com)                              |
| Antigravity IDE | [Documentación MCP IDE](https://antigravity.google/docs/ide/mcp?utm_source=chatgpt.com)                           |
| Codex           | [Configuración MCP](https://learn.chatgpt.com/docs/extend/mcp?utm_source=chatgpt.com)                             |
| Claude Code     | [Documentación MCP](https://code.claude.com/docs/en/mcp?utm_source=chatgpt.com)                                   |
| Gemini CLI      | [Documentación MCP](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html?utm_source=chatgpt.com) |

La documentación de los cuatro fabricantes contempla el lanzamiento de servidores MCP locales mediante Stdio.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://antigravity.google\&sz=32)

Google Antigravity Docs+3



**No se ha verificado una build instalada de ninguno de los cuatro hosts.** No corresponde asignarles una versión MCP negociada, soporte estructurado efectivo o comportamiento de cancelación sin evidencia experimental.

### **7.2. Antigravity**

Debe distinguirse entre App, IDE, CLI y SDK.

La documentación oficial de Antigravity describe configuraciones MCP por superficie y caché local de esquemas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://antigravity.google\&sz=32)

Google Antigravity Docs



Existe una diferencia material entre referencias internas de QAP y ejemplos contemporáneos de configuración global de Antigravity CLI. Algunas fuentes internas mencionan `~/.gemini/config/`, mientras que el codelab oficial consultado muestra `~/.gemini/antigravity-cli/`.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://codelabs.developers.google.com\&sz=32)

codelabs.developers.google.com



Esto no demuestra necesariamente que una de las rutas sea universalmente incorrecta: pueden corresponder a diferentes builds, modalidades o niveles de configuración.

**Recomendación:** no codificar una ruta universal basada únicamente en el nombre comercial. El adaptador debe detectar la superficie, versión y ámbito efectivo o utilizar mecanismos oficialmente soportados.

### **7.3. Codex**

Codex documenta configuración MCP mediante `config.toml`, además de ámbitos de proyecto confiables cuando corresponda.

Consideraciones específicas:

- Preservar entradas TOML ajenas.
- Evitar inyección de argumentos o variables.
- No asumir que un proyecto no confiable puede instalar extensiones.
- Verificar nombres efectivos de herramientas.
- Separar las reglas del agente de los permisos QAP.

### **7.4. Claude Code**

Claude Code ofrece diferentes ámbitos de configuración, incluyendo configuraciones locales, de usuario y de proyecto.

El registrador actual de Claude Desktop no satisface esta obligación.

Se requiere calificar independientemente:

- Registro.
- Aprobaciones del HOST.
- Ámbito de configuración.
- Desregistro.
- Invocación de herramientas.
- Comportamiento ante desconexión.

### **7.5. Gemini CLI**

Gemini CLI contempla registros MCP, comandos de administración y mecanismos de configuración por ámbito.

La estrategia candidata es utilizar comandos oficiales cuando proporcionen garantías suficientes de modificación localizada. En caso contrario, aplicar actualización controlada del documento de configuración.

Ni Gemini web ni Antigravity sustituyen la evidencia específica de Gemini CLI.

### **7.6. Registro y desregistro CAS**

Contrato recomendado:

- Registrar una entrada propia bajo identidad reconocible.
- Leer únicamente la configuración necesaria para el ámbito autorizado.
- Conservar revisión o digest previo.
- Detectar colisión de nombre, modificaciones concurrentes y precedencias.
- Rechazar sobrescrituras no autorizadas.
- Actualizar mediante mecanismo atómico o transaccional acreditado.
- Verificar el resultado.
- Retirar exclusivamente la entrada todavía reconocida como propia.

La segunda instalación debe converger sin cambios innecesarios.

El dry-run debe presentar solamente una descripción saneada de las modificaciones propuestas. No puede imprimir configuraciones completas, secretos o variables de servidores ajenos.

**Dictamen ET07-T02:** adaptadores específicos por HOST, compartiendo una biblioteca de registro y ownership. No un registrador universal basado en sobrescribir archivos JSON/TOML.

## **8. Continuidad autónoma, HOST y DETERMINISTIC**

### **8.1. El problema fundamental**

La conexión MCP pertenece al HOST. La campaña debe pertenecer a QAP.

Si el proceso que recibe herramientas también posee exclusivamente la ejecución y su persistencia, cerrar el HOST puede afectar la continuidad de trabajos que deberían permanecer admitidos.

La especificación MCP moderna no resuelve esta garantía de aplicación por sí sola.

### **8.2. Contrato de continuidad**

QAP debe distinguir:

| Situación                     | Comportamiento necesario                    |
| ----------------------------- | ------------------------------------------- |
| HOST desconectado             | Preservar campaña y estado                  |
| Trabajo determinista admitido | Continuar cuando siga autorizado y elegible |
| Razonamiento pendiente        | Suspender ese nodo de forma durable         |
| Segundo HOST autorizado       | Reclamar trabajo de razonamiento pendiente  |
| Permiso revocado              | Bloquear nuevos efectos                     |
| Efecto ya despachado          | Reconciliar según autoridad                 |
| Propuesta obsoleta            | Rechazar por revisión                       |
| Ejecutor interrumpido         | Recuperar sin repetir efectos ciegamente    |
| Reinicio de equipo            | Recuperar según contrato durable            |

No se requiere un modelo propio para esta continuidad. La cola de razonamiento puede permanecer pendiente hasta que exista un HOST elegible.

### **8.3. Alternativas de interoperabilidad entre agentes**

| Alternativa                       | Utilidad para QAP                              | Decisión                         |
| --------------------------------- | ---------------------------------------------- | -------------------------------- |
| MCP + ContextSnapshot             | Handoff y operación interoperable              | Principal                        |
| CLI + paquete portable            | Operación sin cliente MCP                      | Respaldo operacional             |
| Protocolo adicional agente-agente | Coordinación futura entre agentes heterogéneos | Diferir                          |
| Framework de agentes embebido     | Orquestación interna con modelo propio         | No necesario v1                  |
| Servicio MANAGED                  | Razonamiento gestionado                        | Diferido por decisión ratificada |

La incorporación de A2A u otro protocolo agente-agente no resulta documentalmente necesaria para satisfacer el handoff local actual. No se evaluaron exhaustivamente sus versiones contemporáneas porque no sustituyen ninguna obligación primaria pendiente de ET-07.

### **8.4. ContextSnapshot**

La memoria transferida entre HOST debe incluir como mínimo:

- Identidad y revisión del ámbito autorizado.
- Campaña, cobertura y obligaciones.
- Hallazgos relevantes y procedencia.
- Bloqueos.
- Propuestas pendientes.
- Siguiente acción.
- Referencias paginadas.
- Omisiones y motivos.
- Restricciones de autoridad.

No debe incluir secretos, sesiones reutilizables exportadas, credenciales o grants transferidos como autoridad.

**Dictamen ET07-T03:** apto como candidato. La dificultad principal es la implementación de persistencia y autoridad, no la disponibilidad de un nuevo protocolo de agentes.

## **9. UTCP y OpenAPI**

### **9.1. Distinción de responsabilidades**

MCP, UTCP y OpenAPI son complementarios en QAP.

| Tecnología | Responsabilidad                                                 |
| ---------- | --------------------------------------------------------------- |
| MCP        | Comunicación entre HOST y QAP                                   |
| UTCP       | Descripción e invocación interoperable de herramientas externas |
| OpenAPI    | Descripción estructurada de contratos HTTP                      |
| Broker QAP | Autorización y control del transporte efectivo                  |
| Núcleo QAP | Intención, ejecución, reconciliación y acreditación             |

UTCP está diseñado para describir herramientas que pueden invocarse mediante protocolos nativos. Su implementación TypeScript oficial dispone de plugins y declara licencia MPL-2.0.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



Esta flexibilidad constituye una ventaja de integración, pero también un riesgo si QAP permite a los descriptores activar libremente transportes o plugins.

### **9.2. Candidatos UTCP**

| Criterio                        | SDK oficial TypeScript          | Adaptador HTTP QAP             | SDK Go/Rust                |
| ------------------------------- | ------------------------------- | ------------------------------ | -------------------------- |
| Fidelidad a upstream            | Alta candidata                  | Debe demostrarse               | Alta candidata             |
| Reutilización TypeScript        | Alta                            | Alta                           | Baja                       |
| Control del transporte          | Condicionado a sustitución real | Directamente diseñable         | Condicionado               |
| Riesgo de plugins no gobernados | Alto sin aislamiento            | Menor superficie prevista      | Dependiente de composición |
| Integración                     | Media                           | Media-alta                     | Alta                       |
| Mantenimiento de estándar       | Compartido con upstream         | Responsabilidad QAP            | Compartido                 |
| Licencia                        | MPL-2.0                         | Licencia propia y dependencias | Según SDK                  |
| Dictamen                        | Principal condicionado          | Respaldo independiente         | Alternativa secundaria     |

AV-07 identifica como referencias `@utcp/sdk` 1.2.0 y `@utcp/http` 1.1.14. Los metadatos npm directos no pudieron volver a verificarse en esta investigación, por lo que esas versiones conservan carácter de referencias internas.

La organización UTCP dispone también de implementaciones oficiales en Go y Rust.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



### **9.3. Restricción no compensable**

No se admite el SDK UTCP como ejecutor autónomo si conserva la capacidad de:

- Elegir destinos sin autorización del núcleo.
- Cargar plugins arbitrarios.
- Resolver variables ambientales indiscriminadamente.
- Ejecutar comandos locales.
- Activar Code Mode arbitrario.
- Descargar referencias sin broker.
- Reintentar operaciones mutativas independientemente de QAP.

Si el transporte no puede sustituirse efectivamente, el SDK puede emplearse como componente pasivo de interpretación y validación, manteniendo un ejecutor HTTP gobernado separado.

### **9.4. OpenAPI contemporáneo**

La versión publicada más reciente identificada es OpenAPI `3.2.1`.

QAP debe cubrir las familias ratificadas 3.0, 3.1 y 3.2. La existencia de una versión nueva no permite retirar compatibilidad con contratos empresariales anteriores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://spec.openapis.org\&sz=32)

spec.openapis.org+2



| Familia     | Referencia    | Consideración                      |
| ----------- | ------------- | ---------------------------------- |
| OpenAPI 3.0 | 3.0.4         | Schema Object con semántica propia |
| OpenAPI 3.1 | 3.1.2         | Alineación con JSON Schema 2020-12 |
| OpenAPI 3.2 | 3.2.0 / 3.2.1 | Dialecto y capacidades ampliadas   |

### **9.5. Diferencias que no pueden normalizarse superficialmente**

| Elemento              | OpenAPI 3.0                          | OpenAPI 3.1/3.2                        |
| --------------------- | ------------------------------------ | -------------------------------------- |
| Nulos                 | `nullable` bajo reglas propias       | Tipos y esquemas JSON Schema           |
| Límites exclusivos    | Semántica booleana heredada          | Límites numéricos JSON Schema          |
| Boolean schemas       | No equivalentes a la familia moderna | Admitidos                              |
| `$ref`                | Reglas particulares según objeto     | Semántica JSON Schema en Schema Object |
| Dialecto              | Específico de OAS 3.0                | Determinado por dialecto y `$schema`   |
| Referencias dinámicas | Sin equivalencia general             | Según vocabularios aplicables          |

Un conversor que produzca un objeto JSON aparentemente válido no acredita que se haya preservado el significado original.

### **9.6. Validadores candidatos**

| Alternativa                 | Ventajas                                             | Límites                                                     |
| --------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Ajv por dialecto + capa OAS | Reutiliza dependencia existente y validación moderna | Requiere reglas OAS específicas                             |
| Swagger Parser              | Parser y validación con trayectoria de uso           | Documentación consultada no acredita cobertura completa 3.2 |
| libopenapi                  | Declara soporte para OAS 3.0, 3.1 y 3.2              | Introduce Go y composición adicional                        |
| Zod generado                | Tipado de contratos internos                         | No acredita equivalencia completa con dialectos OAS         |
| Validador propio integral   | Control de implementación                            | Costo y riesgo semántico elevados                           |

Ajv documenta múltiples versiones de JSON Schema, con diferencias de compatibilidad entre generaciones. Swagger Parser anuncia soporte para Swagger 2.0 y OpenAPI 3.0; libopenapi declara cobertura de las tres familias objeto de QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ajv.js.org\&sz=32)

Ajv JSON schema validator+2



**Recomendación:**

Ajv 8.x como componente candidato de validación, acompañado de interpretación específica de OAS y resolución de referencias gobernada.

libopenapi constituye un respaldo razonable para examinar si la solución TypeScript resulta insuficiente, especialmente si ET-01 o ET-06 ya requieren un componente auxiliar Go aislado.

### **9.7. Autenticación AND/OR**

QAP debe preservar las reglas de Security Requirement Object:

- Alternativas de seguridad en la colección: OR.
- Esquemas de seguridad requeridos dentro de una alternativa: AND.
- Overrides y opcionalidad: interpretación conforme a la versión.
- Ausencia de autenticación declarada: no equivale a autorización QAP.

Un documento que declara autenticación opcional no permite que QAP omita sus propias restricciones de identidad, finalidad o destino.

Debe verificarse además la serialización de parámetros, headers, cookies, cuerpos, multipart, media types, encoding, style y explode.

**Dictamen ET07-T04:** condicionado a EXP-05a. No existe evidencia suficiente para afirmar hoy que un único paquete de terceros satisface íntegramente las tres familias OAS.

## **10. Broker de operaciones externas y seguridad efectiva**

### **10.1. Puerto común**

Se preserva `IExternalOperationPort`, conforme a AV-04 y AV-05.

El contrato debe transportar, según corresponda:

| Plano          | Información                                        |
| -------------- | -------------------------------------------------- |
| Descriptor     | Protocolo, operación, versión, digest              |
| Destino        | Instancia y destino efectivos                      |
| Identidad      | Principal y referencia opaca de credencial         |
| Autoridad      | Finalidad, grants, revisión y época                |
| Datos          | Esquemas de entrada y salida                       |
| Intención      | Identidad lógica y correlación                     |
| Efectos        | Subefectos posibles y observados                   |
| Idempotencia   | Clave, payload, participantes y ventana acreditada |
| Reconciliación | Consultas y testigos autorizados                   |
| Limpieza       | Estrategia y condiciones                           |
| Límites        | Tiempo, tamaño, presupuesto y recursos             |

Este puerto debe ser independiente de la biblioteca HTTP concreta.

### **10.2. Estado por subefecto**

El protocolo de transporte no puede reducir un resultado a éxito o excepción.

| Observación                    | Significado admisible                             |
| ------------------------------ | ------------------------------------------------- |
| No despachado acreditado       | Puede considerarse nueva admisión según autoridad |
| Posible despacho               | Requiere reconciliación                           |
| Aceptación remota              | No acredita persistencia                          |
| Efecto parcial                 | Registrar subefectos                              |
| Efecto confirmado              | Requiere testigo suficiente                       |
| Denegación terminal acreditada | Aplicar contrato de expectativa                   |
| Efecto desconocido             | Conservar incertidumbre                           |

Un timeout, cancelación, conexión cerrada o respuesta HTTP 500 no permite afirmar automáticamente que la operación no produjo efectos.

### **10.3. SSRF y control del destino**

El broker debe verificar el destino efectivo de cada operación y cada salto permitido.

Amenazas pertinentes:

| Amenaza                  | Control candidato                           |
| ------------------------ | ------------------------------------------- |
| URL hostil en descriptor | Validación e identidad de destino           |
| Redirección              | Nueva evaluación de autorización            |
| DNS rebinding            | Vinculación de resolución y conexión        |
| Redes privadas           | Autorización explícita por destino          |
| Loopback o metadata      | Denegación salvo política expresa aplicable |
| Referencias remotas      | Resolución mediante broker                  |
| Proxy ambiental          | Configuración gobernada                     |
| Credenciales cruzadas    | Segregación de pools e identidad            |
| Payload excesivo         | Cuotas y cancelación                        |
| TLS incorrecto           | Verificación de identidad y política CA     |

No se recomienda bloquear absolutamente todas las redes privadas porque DE-04 contempla conectividad privada autorizada. La solución debe distinguir acceso privado concedido de acceso arbitrario no autorizado.

### **10.4. Operaciones negativas autorizadas**

QAP necesita poder comprobar respuestas negativas bajo condiciones controladas.

Debe distinguir:

- Operación legítimamente denegada por política QAP, que no se despacha.
- Operación negativa autorizada del plan QA, cuyo efecto esperado puede ser una denegación del AUT.
- Operación sin expectativa suficiente, que no puede acreditarse.
- Operación que devuelve una denegación pero produjo un efecto lateral.

Esto requiere una autorización externa al descriptor y una expectativa acreditada.

Un OpenAPI válido o un UTCP manual válido no constituye permiso para realizar pruebas negativas.

### **10.5. Alternativas de transporte**

| Alternativa                                   | Evaluación                                  |
| --------------------------------------------- | ------------------------------------------- |
| HTTP cliente sobre runtime Node               | Principal si se acredita control efectivo   |
| Cliente HTTP independiente con pool explícito | Respaldo TypeScript                         |
| Componente HTTP aislado en Go/Rust            | Respaldo de frontera                        |
| Plugins UTCP con transporte libre             | No admisible sin gobernanza                 |
| CLI arbitraria para llamar APIs               | No admisible como bypass                    |
| Browser/UI autorizado                         | Alternativa por caso, no sustitución de D08 |

## **11. Seguridad, vulnerabilidades y licencias**

### **11.1. Avisos contemporáneos del SDK MCP**

Se localizaron avisos oficiales relevantes para las versiones examinadas.

| Advisory            | Problema                                             | Relación con QAP                         |
| ------------------- | ---------------------------------------------------- | ---------------------------------------- |
| GHSA-6prh-2h8m-c8cw | Redirecciones HTTP y reenvío de información sensible | Coincidencia de rango v1                 |
| GHSA-46jr-4wx8-v453 | Agotamiento de memoria en validación HTTP            | Coincidencia de rango v1                 |
| GHSA-f897-62hf-6gxq | Límites insuficientes de cuerpo y lotes RPC          | Coincidencia con al menos parte del lock |
| GHSA-6qxp-vccf-f47h | Selección insegura de servidor OAuth                 | Coincidencia con rangos históricos       |

El aviso GHSA-46jr-4wx8-v453 identifica versiones v1 anteriores a 1.32.0 y versiones de servidor v2 anteriores a 2.3.0. Indica asimismo que los servidores exclusivamente Stdio no están afectados por ese vector HTTP específico.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



El aviso de redirecciones incluye la familia v1 hasta 1.31.0 en las rutas afectadas de cliente HTTP/OAuth.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



El aviso de límites insuficientes identifica, entre otros rangos, v1 hasta 1.30.0.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Fuentes:

- [GHSA-6prh-2h8m-c8cw](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6prh-2h8m-c8cw?utm_source=chatgpt.com).
- [GHSA-46jr-4wx8-v453](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-46jr-4wx8-v453?utm_source=chatgpt.com).
- [GHSA-f897-62hf-6gxq](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-f897-62hf-6gxq?utm_source=chatgpt.com).
- [GHSA-6qxp-vccf-f47h](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-6qxp-vccf-f47h?utm_source=chatgpt.com).

### **11.2. Interpretación correcta**

La existencia de una versión afectada en el lockfile no demuestra automáticamente:

- Que el código vulnerable esté embebido.
- Que se encuentre instalado.
- Que sea alcanzable.
- Que un servidor QAP exclusivamente Stdio sea explotable mediante un vector HTTP.

Tampoco debe utilizarse la ausencia de reachability demostrada como justificación para mantener indefinidamente dependencias antiguas.

La actualización de dependencias constituye una candidatura de endurecimiento, no una certificación.

### **11.3. Advisory UTCP**

La base oficial de advisories documenta CVE-2026-45366, relacionado con SSRF en la implementación HTTP de UTCP y URLs controladas mediante documentos OpenAPI.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Fuente: [GHSA-r8j5-8747-88cm](https://github.com/advisories/GHSA-r8j5-8747-88cm?utm_source=chatgpt.com).

Este caso refuerza la necesidad de que QAP conserve autoridad independiente sobre el destino efectivo.

Una biblioteca actualizada puede corregir un defecto específico sin satisfacer toda la política de egress de QAP.

### **11.4. Licencias**

| Componente        | Licencia o situación documental                              | Obligación                            |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| MCP TypeScript v1 | MIT en inventario AV-07                                      | Avisos y texto aplicable              |
| MCP TypeScript v2 | Transición Apache-2.0 con código histórico MIT               | Revisar composición exacta            |
| MCP Go SDK        | Apache-2.0 para nuevas contribuciones y código MIT existente | Conservar condiciones aplicables      |
| UTCP TypeScript   | MPL-2.0                                                      | Cumplimiento sobre archivos cubiertos |
| Ajv               | MIT según inventario AV-07                                   | Avisos                                |
| Swagger Parser    | MIT                                                          | Avisos                                |
| Commander         | MIT según inventario AV-07                                   | Avisos                                |
| QAP               | ISC declarado; decisión propia pendiente                     | Resolución del titular                |

La transición de licencia de los SDK MCP obliga a revisar los archivos y artefactos concretos, no únicamente el campo `license` de npm.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



UTCP introduce consideraciones adicionales de distribución relacionadas con MPL-2.0. No implica automáticamente que todo QAP deba adoptar dicha licencia, pero sí exige analizar la distribución y las modificaciones de archivos cubiertos.

No se ha completado una revisión legal exhaustiva de las dependencias transitivas ni de las condiciones de cada artefacto candidato.

### **11.5. Política de actualización**

Recomendación transversal para ET-06:

- SBOM por composición instalada.
- Identificación de dependencias directas, transitivas y embebidas.
- Verificación de artefactos y procedencia.
- Evaluación de advisory por versión y alcance.
- Actualización controlada.
- Revalidación de contratos afectados.
- Rollback compatible con estado y revocaciones.
- Ausencia de descargas flotantes durante la operación ordinaria.

## **12. CI/CD profesional sin IA**

### **12.1. Candidato principal**

CLI determinista sobre el mismo núcleo de aplicación utilizado por MCP y UI.

La ejecución CI debe poder completar una campaña congelada:

- Sin HOST de razonamiento.
- Sin inferencia.
- Sin TTY.
- Sin diálogo obligatorio.
- Sin API de modelo.
- Sin secretos suministrados como argumentos.
- Sin aprobación interactiva rutinaria de cada caso.

La autorización se establece mediante el perfil CI y la autoridad efectiva aplicable.

### **12.2. Compatibilidad con proveedores**

| Proveedor       | Integración candidata                | Dependencia obligatoria          |
| --------------- | ------------------------------------ | -------------------------------- |
| GitHub Actions  | Ejecución CLI y artefactos           | No                               |
| GitLab CI       | Ejecución CLI y JUnit derivado       | No                               |
| Jenkins         | Ejecución CLI y publicación          | No                               |
| Azure Pipelines | Ejecución CLI y resultados derivados | No                               |
| Runner local    | CLI nativa                           | Sí, como ruta autónoma aplicable |

Estas son rutas conceptuales de integración, no una certificación contemporánea de todos los proveedores.

No se requiere crear un plugin especializado para cada proveedor desde el primer lanzamiento.

### **12.3. Seguridad CI**

GitHub documenta riesgos específicos de ejecución de contenido no confiable de pull requests, permisos excesivos y uso de acciones sin fijación inmutable.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.github.com\&sz=32)

GitHub Docs+1



QAP debe preservar:

| Vector                    | Restricción                          |
| ------------------------- | ------------------------------------ |
| PR no confiable           | Sin acceso a secretos empresariales  |
| Variables manipuladas     | No amplían grants                    |
| Configuración de proyecto | No constituye autoridad autónoma     |
| Script importado          | No ejecución implícita               |
| Runner compartido         | Aislamiento de estado y credenciales |
| Revocación                | Impide nuevos despachos              |
| Artefacto de CI           | Saneado y autorizado                 |
| Cambio de build           | Revalidación de identidad            |
| Resultado editado         | Verificación negativa                |

La autoridad de CI no puede derivarse únicamente de que una ejecución tenga lugar en un pipeline corporativo.

### **12.4. Identidad de ejecución**

Se requiere preservar la relación entre:

- Identidad solicitante.
- Identidad efectiva del ejecutor.
- Identidad del código.
- Revisión de campaña.
- Entorno y destino.
- Autorización.
- Artefactos generados.

Un pipeline exitoso no acredita automáticamente que las pruebas correspondan al build, aplicación o tenant pretendidos.

## **13. AR-52 y proyección JUnit**

### **13.1. Hallazgo material en el código actual**

El archivo [junit-report.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/src/generators/junit-report.ts?utm_source=chatgpt.com) fue recuperado íntegramente.

Su implementación:

- Representa `failed` mediante `failure`.
- Representa `skipped` y `not_run` mediante `skipped`.
- Para los demás resultados emite un testcase sin elemento de fallo.
- Utiliza contadores procedentes del resumen histórico.
- No incorpora la guardia canónica AC01-17.02.

El código contiene un escape XML aprovechable, pero su contrato de resultado es insuficiente para la arquitectura ratificada.

**ET07-H04 queda respaldado directamente por evidencia de código.**

No se afirma haber reproducido experimentalmente un falso PASS en el SHA examinado.

### **13.2. Ejes y veredictos que deben preservarse**

AR-52 mantiene cuatro ejes:

| Eje                  | Significado                              |
| -------------------- | ---------------------------------------- |
| `technical_status`   | Resultado mecánico                       |
| `functional_verdict` | Acreditación funcional                   |
| `cleanup_status`     | Estado de residuos y limpieza            |
| `evidence_health`    | Integridad y disponibilidad de evidencia |

Los seis veredictos normativos se mantienen sin ampliación:

PASS, FAIL, INDETERMINATE, BLOCKED, SKIPPED y ERROR.

### **13.3. Tabla canónica de código de campaña**

La precedencia siguiente se conserva de AV-04, sin trasladar su cálculo al renderer XML.

| Condición canónica, en orden                 | Código |
| -------------------------------------------- | ------ |
| Campaña abierta                              | Nulo   |
| I: fallo de integridad aplicable             | 18     |
| F junto con T/R/U/O                          | 11     |
| F: contradicción funcional acreditada        | 10     |
| T: impedimento técnico exigible              | 12     |
| R: residuo incompatible o pendiente          | 13     |
| U: incertidumbre o impedimento exigible      | 14     |
| O: omisión, corte o insuficiencia de alcance | 15     |
| A: aceptación canónica                       | 0      |
| S: terminación correspondiente a SKIPPED     | 16     |
| Resto terminal                               | 17     |

Esta tabla es una reproducción abreviada del orden de decisión. La definición completa de flags, agregaciones y aplicabilidad permanece en [AV-04 §1](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com).

Una consulta, diagnóstico o ACK durable puede tener un resultado de invocación diferente. No se interpreta como código terminal de campaña.

### **13.4. Proyección JUnit obligatoria**

| Resultado canónico              | XML derivado                                |
| ------------------------------- | ------------------------------------------- |
| PASS funcional acreditado       | Testcase exitoso                            |
| PASS exclusivamente estructural | Skipped con motivo o error según obligación |
| FAIL                            | `failure`                                   |
| ERROR                           | `error`                                     |
| BLOCKED                         | `error`, tipo `QAP_BLOCKED`                 |
| INDETERMINATE                   | `error`, tipo `QAP_INDETERMINATE`           |
| SKIPPED                         | `skipped`                                   |
| Campaña abierta                 | Sin JUnit final acreditable                 |

Además debe existir `QAP_CANONICAL_GATE`, claramente separado del universo de pruebas AUT.

Su representación exitosa exige simultáneamente:

- Sobre canónico terminal.
- Verificación satisfactoria.
- Código canónico 0.
- PASS funcional con obligaciones cumplidas.
- Ausencia de vetos.
- Ausencia de residuos incompatibles.
- Evidencia exigida suficiente.

Si el sobre no puede verificarse, no se deben inventar resultados individuales para completar el XML.

### **Ejemplo conceptual de proyección**

PASS válido

Solo estructura

FAIL + residuo

Manipulado

Campaña abierta

Código de campaña

## **0**

Testcase funcional: éxito. Guardia: éxito.

Demostración documental de casos conceptuales, no ejecución del agregador QAP.

### **13.5. Por qué XML no basta**

GitLab documenta expresamente que sus reportes unitarios JUnit no determinan por sí mismos el estado del job.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.gitlab.com\&sz=32)

GitLab Docs



Esto demuestra una razón práctica para mantener el código de salida y verificación canónica independientes del renderer.

La visualización verde de un proveedor CI no puede constituir el oráculo de QAP.

### **13.6. Alternativas de implementación**

| Alternativa                         | Evaluación                                       |
| ----------------------------------- | ------------------------------------------------ |
| Adaptar generador actual            | Menor reconstrucción si se sustituye el contrato |
| Serializador XML especializado      | Alternativa válida con límites                   |
| Reporter de otro framework          | Riesgo de pérdida de semántica                   |
| Adoptar JUnit como modelo principal | Incompatible con AR-52                           |

**Dictamen ET07-T05:** apto como candidato el mecanismo de proyección propia; incompatible el uso del generador histórico como acreditación suficiente.

## **14. Ingesta de resultados externos**

### **14.1. Principio**

QAP debe interoperar con otras herramientas sin convertirse en un motor universal de pruebas.

La incorporación de resultados externos satisface una necesidad profesional importante: reunir evidencia unitaria, funcional, contractual, de rendimiento y de seguridad conservando sus límites.

### **14.2. Formatos candidatos**

| Familia                | Candidatos de formato                    | Tratamiento                     |
| ---------------------- | ---------------------------------------- | ------------------------------- |
| Unitaria y funcional   | JUnit XML, JSON versionado               | Adaptación pasiva               |
| Automatización externa | Resultados estructurados de herramientas | Adaptación pasiva               |
| Contratos              | Pact y resultados de verificación        | Referencia consumidor-proveedor |
| Rendimiento            | k6 JSON y formatos específicos           | Normalización de métricas       |
| Seguridad estática     | SARIF 2.1.0                              | Hallazgos y procedencia         |
| Dependencias           | SPDX / CycloneDX                         | Inventario y evidencia          |
| Seguridad dinámica     | Reportes específicos versionados         | Hallazgos contextualizados      |
| Formato desconocido    | Adjunto pasivo                           | Sin acreditación automática     |

No se propone un formato universal que pierda información para representar todas las familias.

SARIF 2.1.0 dispone de especificación OASIS. k6 documenta tanto métricas agregadas como resultados temporales exportables. Pact distingue contratos definidos por consumidores de verificaciones realizadas sobre proveedores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.oasis-open.org\&sz=32)

docs.oasis-open.org+2



Las versiones contemporáneas exactas de cada herramienta productora, así como la cobertura completa de SPDX y CycloneDX, permanecen pendientes de calificación por adaptador.

### **14.3. Contrato común**

Cada contribución evaluable debe preservar:

| Campo semántico            | Finalidad                        |
| -------------------------- | -------------------------------- |
| Productor y versión        | Identificar origen               |
| Adaptador y versión        | Reproducir interpretación        |
| Artefacto y digest         | Integridad                       |
| Corrida y caso externo     | Identidad                        |
| Vínculo canónico           | Correspondencia explícita        |
| Build esperado y observado | Evitar atribución incorrecta     |
| Instancia y alcance        | Segregación                      |
| Fecha y ventana            | Frescura                         |
| Modalidad                  | Real, simulada u otra            |
| Resultado bruto            | No destruir significado original |
| Normalización              | Facilitar consulta               |
| Cobertura y exclusiones    | Evitar conclusiones excesivas    |
| Limitaciones               | Abstención                       |
| Autoridad de custodia      | Protección                       |
| Expectativa y testigo      | Posible evaluación posterior     |

Los datos desconocidos no se transforman en cero, verdadero o ausencia de defecto.

### **14.4. Clasificación de aportes**

| Aporte externo                                  | Posible valor                  |
| ----------------------------------------------- | ------------------------------ |
| Adjunto sin mapeo                               | Contextual                     |
| Resultado estructurado con procedencia          | Diagnóstico                    |
| Resultado con identidad y expectativa           | Candidato evaluable            |
| Testigo con autoridad y suficiencia acreditadas | Contribución a una afirmación  |
| Firma válida sin correspondencia funcional      | Integridad, no verdad          |
| JUnit externo verde                             | No acredita efecto empresarial |

La importación debe preservar los intentos QAP y los resultados externos como entidades distinguibles.

### **14.5. Rendimiento**

Un reporte de carga no acredita un SLO si omite:

- Población y tamaño de muestra.
- Perfil de carga.
- Unidad.
- Método de medición.
- Entorno.
- Ventana.
- Criterio de aceptación.
- Cobertura.
- Condiciones y errores.

Los percentiles no deben combinarse arbitrariamente entre corridas o poblaciones.

### **14.6. Seguridad**

Una alerta SARIF o un hallazgo SCA puede constituir información relevante, pero no debe convertirse automáticamente en vulnerabilidad corroborada.

De forma equivalente, cero alertas no acredita seguridad completa.

La ingesta de un reporte de pentest tampoco autoriza iniciar una nueva evaluación activa.

### **14.7. Despacho externo**

Si se habilita un evaluador externo activo, debe calificarse por separado conforme a AC01-18.02.

El importador no debe poseer por defecto capacidad de ejecutar evaluadores, descargar herramientas o contactar servicios.

**Dictamen ET07-T06:** apto como candidato para ingesta pasiva y perfiles versionados; condicionado cualquier despacho activo.

## **15. Contratos consumidor-proveedor y perfiles de dependencia**

### **15.1. Comparación**

| Alternativa                  | Utilidad                                | Recomendación              |
| ---------------------------- | --------------------------------------- | -------------------------- |
| OpenAPI                      | Contrato de interfaz HTTP               | Obligatorio como capacidad |
| Pact                         | Expectativas consumidor-proveedor       | Ingesta y referencia       |
| Broker Pact                  | Gestión especializada de verificaciones | Opcional posterior         |
| Comparador de esquema propio | Validación estática                     | Complementario             |
| Motor multiprotocolo propio  | Amplia ejecución contractual            | No necesario en v1         |

Pact permite relacionar expectativas de consumidor con verificaciones de proveedor. Sus versiones y resultados deben conservarse explícitamente para evitar atribuir verificaciones de una revisión a otra.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.pact.io\&sz=32)

Pact Docs+1



### **15.2. Perfil de dependencia**

| Modalidad       | Qué permite afirmar                             |
| --------------- | ----------------------------------------------- |
| Real autorizada | Comportamiento observado en esa dependencia     |
| Sandbox         | Comportamiento en sandbox                       |
| Simulada        | Comportamiento frente al doble                  |
| Replay          | Comportamiento respecto al registro reproducido |
| No disponible   | Limitación explícita                            |

Una simulación exitosa no constituye evidencia suficiente de integración real.

Ante caída de una dependencia, QAP no debe cambiar silenciosamente a un doble y conservar el mismo alcance acreditado.

**Dictamen:** mantener perfiles e ingesta pasiva en v1. No imponer un broker central ni un motor contractual universal.

## **16. Intercambio portable y CSV**

### **16.1. Paquete canónico candidato**

La composición principal debe compartir el sistema de persistencia y custodia de ET-02 y ET-05.

El intercambio debe ser local, con identidad, revisión, procedencia, esquema y manifiesto verificable.

| Elemento            | Política                          |
| ------------------- | --------------------------------- |
| Casos y recetas     | Exportables según autorización    |
| Relaciones y linaje | Preservados                       |
| Resultados          | Preservación de significado       |
| Credenciales        | Excluidas                         |
| Sesiones            | Excluidas                         |
| Grants              | No transferibles como autoridad   |
| Evidencia privada   | Solo bajo autorización específica |
| Conflictos          | Explícitos                        |
| Duplicados          | Idempotencia verificable          |

El intercambio A→B→A debe conservar identidad y procedencia, sin crear falsas exclusiones globales.

### **16.2. Comparación de mecanismos**

| Candidato                            | Ventajas                   | Riesgos                            |
| ------------------------------------ | -------------------------- | ---------------------------------- |
| Manifiesto JSON + archivos asociados | Transparencia y validación | Gestión de múltiples archivos      |
| Contenedor ZIP gobernado             | Portabilidad               | Traversal, expansión y enlaces     |
| CSV estructurado                     | Interoperabilidad práctica | Ambigüedad de tipos                |
| Base SQLite exportada directamente   | Conservación física        | Acoplamiento, secretos y migración |
| Formato binario propio               | Control                    | Costo y dependencia de QAP         |

La selección de un formato de contenedor concreto debe coordinarse con ET-02 y ET-06.

No se recomienda exportar directamente la base de datos interna como mecanismo ordinario de intercambio profesional.

### **16.3. CSV**

Los requisitos relevantes incluyen:

- Identificadores textuales sin pérdida de ceros iniciales.
- Codificación declarada.
- Columnas versionadas.
- Vista previa.
- Validación de tipos.
- Recibo de filas aceptadas y rechazadas.
- Protección contra inyección de fórmulas en exportación.
- Ausencia de ejecución de contenido importado.
- Conflictos visibles.

No se debe convertir automáticamente el contenido de una celda en instrucción ejecutable.

## **17. Economía de ingeniería y consumo de recursos**

### **17.1. Comparación cualitativa**

No existen mediciones comparables obtenidas por esta investigación para la carga de trabajo concreta de QAP.

Los costos siguientes son estimaciones relativas de complejidad, no benchmarks ni presupuestos financieros.

| Componente                   | Integración          | Mantenimiento | Costo de reconstrucción |
| ---------------------------- | -------------------- | ------------- | ----------------------- |
| MCP v1 actualizado           | Bajo-medio           | Medio-alto    | Bajo                    |
| MCP v2                       | Medio                | Medio         | Medio                   |
| SDK Go adicional             | Alto                 | Alto          | Alto                    |
| UTCP SDK gobernado           | Medio                | Medio         | Medio                   |
| UTCP HTTP propio compatible  | Medio-alto           | Alto          | Medio-alto              |
| Ajv por dialecto             | Medio-alto           | Medio         | Medio                   |
| Validador Go auxiliar        | Alto                 | Medio-alto    | Alto                    |
| CLI canónica                 | Medio                | Bajo-medio    | Medio                   |
| Adaptadores externos pasivos | Variable por familia | Medio         | Medio                   |
| Broker universal propio      | Alto                 | Alto          | Alto                    |

La estimación supone una arquitectura que conserve un núcleo único y reutilice TypeScript cuando sea compatible con ET-01.

Si ET-01 recomienda otro runtime para el núcleo, estos costos deben recalcularse por composición.

### **17.2. Recursos que deben medirse**

| Dimensión   | Medición futura                      |
| ----------- | ------------------------------------ |
| Instalador  | Bytes descargados                    |
| Instalación | Bytes instalados efectivos           |
| Arranque    | Frío y caliente                      |
| MCP         | Latencia de negociación e invocación |
| Procesos    | Árbol completo                       |
| Memoria     | RSS y picos por escenario            |
| CPU         | Carga activa y en espera             |
| Disco       | Escrituras, caché y artefactos       |
| Red         | Egress autorizado y volumen          |
| Continuidad | Costo de recuperar trabajo           |
| Energía     | Cuando exista instrumento fiable     |
| Handoff     | Tiempo y contexto transferido        |

No se debe medir exclusivamente el proceso Node principal ignorando navegador, procesos auxiliares, renderers o VM.

### **17.3. Equipos modestos**

La composición TypeScript sobre un runtime compartido constituye una hipótesis razonable de menor complejidad distributiva que añadir varios runtimes independientes.

Sin embargo, esto no demuestra menor RAM, CPU o tiempo de arranque en QAP.

La ejecución auxiliar en un lenguaje compilado podría resultar favorable para ciertas operaciones, pero requiere medición pareada incluyendo IPC, binarios, memoria y aislamiento.

No se establece una configuración mínima de hardware sin EXP.

## **18. Economía de tokens y adopción de QAP**

### **18.1. Objetivo**

QAP debe reducir razonamiento redundante sin reducir pruebas, autoridad, testigos o cobertura.

Los mecanismos con mayor potencial documental son:

| Mecanismo                        | Beneficio esperado                         |
| -------------------------------- | ------------------------------------------ |
| ContextSnapshot                  | Evitar reconstrucción completa de contexto |
| Inventario persistente           | Reutilización de Discovery                 |
| Paginación                       | Limitar payloads                           |
| Propuestas estructuradas         | Reducir instrucciones ambiguas             |
| DETERMINISTIC                    | Eliminar inferencia por paso repetible     |
| Handoff                          | Evitar onboarding redundante               |
| Catálogo de herramientas acotado | Reducir contexto irrelevante               |
| Recetas congeladas               | Reutilizar trabajo acreditado              |

Estos beneficios son hipótesis a calificar, no porcentajes demostrados.

### **18.2. Diseño de medición**

EXP-01b debe comparar, como mínimo:

| Brazo | Configuración                         |
| ----- | ------------------------------------- |
| A     | Baseline competente pareada           |
| B     | MCP QAP                               |
| C     | MCP + Skill                           |
| D     | MCP + Skill + hook informativo opt-in |

Los brazos deben emplear el mismo HOST, modelo, fixture, política, objetivo y criterio de cobertura.

### **18.3. Métricas**

| Métrica                | Tratamiento                         |
| ---------------------- | ----------------------------------- |
| Tokens de entrada      | Medición real si disponible         |
| Tokens de salida       | Medición real si disponible         |
| Tokens de razonamiento | Separados si disponibles            |
| Caché                  | Identificar alcance y solapamientos |
| Tokens de herramientas | Contabilizar cuando sea posible     |
| Llamadas               | Contador observable                 |
| Reintentos             | Incluir                             |
| Fallos y abandonos     | Incluir                             |
| Bytes de contexto      | Métrica diferente                   |
| Latencia               | Medir                               |
| Costo monetario        | Solo con información comparable     |

Cuando el HOST no exponga telemetría de tokens, se debe informar dato ausente o estimación claramente identificada.

No se debe inferir consumo real del proveedor a partir del tamaño de un JSON.

### **18.4. Fórmula de comparación**

Cuando exista medición homogénea:

\\[ Ahorro = 1-\frac{T\_{QAP}}{T\_{baseline}} \\]

La comparación solo es admisible con equivalencia acreditada del resultado y cobertura.

El ahorro obtenido omitiendo operaciones requeridas, pruebas negativas o testigos no constituye eficiencia válida.

### **18.5. Adopción de agentes**

Deben medirse por separado:

- Primera acción QA dirigida a QAP.
- Uso del flujo canónico completo.
- Acreditación final por QAP.
- Desvíos a scripts alternativos.
- Continuidad entre hosts.
- Interferencia con tareas legítimas de desarrollo.

**Objeción a una política de bloqueo universal:** obligar que todo agente utilice QAP para cualquier prueba o comando sería incompatible con las tareas unitarias y de desarrollo legítimas preservadas por los encargos.

QAP debe orientar y acreditar las tareas correspondientes a su ámbito, no secuestrar la operación general del HOST.

## **19. Compatibilidad multiplataforma e instalación**

### **19.1. Matriz de composición**

| Plataforma | CPU   | MCP Node/Stdio                  | CLI          | UTCP/OAS     | Estado instalado |
| ---------- | ----- | ------------------------------- | ------------ | ------------ | ---------------- |
| Windows    | x64   | Candidato                       | Candidato    | Candidato    | Pendiente        |
| Windows    | ARM64 | Condicionado a composición      | Condicionado | Condicionado | Pendiente        |
| macOS      | ARM64 | Candidato                       | Candidato    | Candidato    | Pendiente        |
| macOS      | x64   | Condicionado a soporte efectivo | Condicionado | Condicionado | Pendiente        |
| Linux      | x64   | Candidato                       | Candidato    | Candidato    | Pendiente        |
| Linux      | ARM64 | Condicionado a composición      | Condicionado | Condicionado | Pendiente        |

Estas filas representan celdas tecnológicas que deben contrastarse con la matriz obligatoria vigente de AV-06. No constituyen una redefinición de las arquitecturas o builds exigidas.

La disponibilidad de Node para una plataforma no acredita automáticamente:

- Disponibilidad de cada HOST.
- Compatibilidad del instalador.
- ABI de dependencias nativas.
- Bóveda.
- Navegadores.
- Aislamiento.
- Multimedia.
- Soporte de la UI.

### **19.2. Empaquetado**

Se recomienda un lanzador local versionado, cuya ejecución ordinaria no dependa de descargar la última versión de npm.

El paquete debe poder operar fuera del monorepo.

La configuración de compilación MCP actualmente declara `target: 'node18'`. Esto no implica que QAP completo sea ejecutable sobre Node 18, especialmente por dependencias y funcionalidades de runtime posteriores.

La recomendación es alinear:

- `engines`.
- Target de compilación.
- Tipos Node.
- SDK.
- Dependencias nativas.
- Runtime distribuido.
- Soporte efectivo por plataforma.

### **19.3. Integridad del paquete**

El mecanismo actual de compilación MCP incorpora revisión Git, fingerprint de fuentes y digest de archivos JavaScript.

Es una base útil, pero no acredita por sí mismo:

- Lockfile completo.
- Assets.
- Binarios nativos.
- Herramientas auxiliares.
- Variantes instaladas.
- Dependencias externas.
- Procedencia del runtime.

ET-06 deberá determinar la composición completa del paquete y su identidad verificable.

## **20. Interdependencias con las demás especialidades**

| Perfil | Contrato que requiere coordinación   | Riesgo principal                  |
| ------ | ------------------------------------ | --------------------------------- |
| ET-01  | Núcleo, runtime, ABI y DTO           | Dos autoridades o dos núcleos     |
| ET-02  | Persistencia, cola y ContextSnapshot | Doble escritor o fuga de contexto |
| ET-03  | Ejecución, testigos y subefectos     | Bypass del broker o falsos PASS   |
| ET-04  | UI operacional y paridad             | Segundo contrato de comandos      |
| ET-05  | Sobre, reportes y custodia           | Divergencia semántica JUnit       |
| ET-06  | Secretos, aislamiento y distribución | Autoridad falsa o egress indebido |

### **20.1. ET-01: núcleo y runtime**

Candidato de integración:

- Runtime Node 24 LTS como hipótesis principal compartida.
- SDK MCP v2 como adaptador.
- DTO independientes del SDK.
- `IExternalOperationPort`.
- Validador único de propuestas.

Si ET-01 selecciona un núcleo compilado en otro lenguaje, ET-07 debe revisar si el adaptador TypeScript permanece separado por IPC o si resulta preferible el SDK oficial correspondiente al nuevo runtime.

No debe introducirse una segunda lógica de aplicación para conservar el SDK.

### **20.2. ET-02: persistencia**

Contratos críticos:

- Cola durable.
- CAS de revisiones.
- Fencing.
- Identidad de operación.
- ContextSnapshot.
- Dedupe de importación.
- Registro de subefectos.

MCP no debe consultar tablas directamente como bypass del servicio de aplicación.

### **20.3. ET-03: ejecución**

El broker API y el ejecutor de navegador deben compartir:

- Autoridad por efecto.
- Identidad y correlación.
- Intención durable.
- Testigos.
- Reconciliación.
- Limpieza.
- Presupuesto.

No se permite que el transporte HTTP posea una política distinta de mutaciones que la utilizada por la ejecución UI.

### **20.4. ET-04: interfaz gráfica**

La UI debe invocar operaciones equivalentes mediante la misma autoridad semántica.

La interfaz MCP no debe ser un requisito para que un usuario humano pueda operar QAP. Tampoco debe ser necesario iniciar un HOST de IA para consultar, ejecutar o gestionar pruebas deterministas.

### **20.5. ET-05: reportes**

Se requiere coordinación del contrato de:

- Sobre canónico.
- Identidad del intento.
- Evidencia.
- Proyección JUnit.
- Reportes PDF/XLSX propios.
- Referencias externas.

Los renderers reciben resultados; no recalculan la verdad funcional con criterios independientes.

### **20.6. ET-06: seguridad**

Contratos necesarios:

- Lanzador autorizado.
- Registro CAS de configuración.
- Frontera IPC.
- Bóveda y referencias opacas.
- Custodia.
- Control de egress.
- Verificación del paquete.
- Identidad de principal CI.

Si ET-06 demuestra que la frontera efectiva no puede sostenerse en una composición propuesta, dicha composición queda bloqueada, independientemente de su comodidad de integración.

## **21. Matriz de calificación experimental futura**

No se propone ejecutar pruebas en esta fase.

Se reutilizan los experimentos y compuertas existentes, incorporando los vectores tecnológicos específicos de ET-07 sin crear un programa experimental paralelo.

| Protocolo | Garantía ET-07                     | Evidencia futura                  | Fallback                   |
| --------- | ---------------------------------- | --------------------------------- | -------------------------- |
| EXP-01a   | Cuatro HOST y perfiles MCP         | Tráfico y builds exactas          | Legacy/dual alternativo    |
| EXP-01b   | Adopción y tokens                  | Corridas pareadas                 | Revisar catálogo/Skill     |
| EXP-05a   | UTCP/OAS y broker                  | Vectores por protocolo y dialecto | Adaptador independiente    |
| EXP-05b   | Efectos, idempotencia y referencia | Testigos y subefectos             | Transporte equivalente     |
| EXP-07    | Autoridad y secretos               | Controles positivos y negativos   | Broker alternativo         |
| EXP-08a   | Frontera UI/CLI/MCP/CI             | Identidad y acceso efectivo       | IPC alternativo            |
| EXP-08b/c | Capacidades integradas aplicables  | Paridad y continuidad             | Conforme al contrato AC-01 |
| E1        | Contratos y resultados             | Fixtures de DTO                   | Corregir adaptador         |
| E5        | Efectos y acreditación             | Testigo independiente             | Bloqueo localizado         |
| E7        | Paridad instalada                  | MCP/CLI/UI/CI                     | Corregir composición       |
| E8        | Generalización independiente       | Corpus ciego                      | Sin reducción de alcance   |

### **21.1. EXP-01a: vectores obligatorios**

| Vector      | Control sano           | Control negativo                   |
| ----------- | ---------------------- | ---------------------------------- |
| Negociación | Perfil compatible      | Versión incompatible               |
| Catálogo    | Herramientas correctas | Esquema inválido                   |
| Probes      | Sin efectos            | Proceso hermano no activa ejecutor |
| Registro    | Instalación nueva      | Alias ocupado                      |
| CAS         | Cambio localizado      | Edición concurrente                |
| Desregistro | Retiro propio          | Entrada modificada por tercero     |
| Invocación  | Operación autorizada   | Operación denegada                 |
| Desconexión | Continuidad            | Duplicación de ejecutor            |
| Output      | JSON-RPC correcto      | Contaminación stdout               |
| Handoff     | Reanudación válida     | Propuesta obsoleta                 |

Criterios: todas las celdas obligatorias aplicables, sin sustituir compatibilidad MCP por CLI.

### **21.2. EXP-05a: vectores de protocolos**

| Familia     | Vectores                                               |
| ----------- | ------------------------------------------------------ |
| UTCP        | Namespace, argumentos, templates, auth, nulos, errores |
| OpenAPI 3.0 | Nullable, enum, allOf, refs y límites                  |
| OpenAPI 3.1 | Dialectos, `$id`, anchors y esquemas booleanos         |
| OpenAPI 3.2 | Dialecto aplicable y semántica propia                  |
| HTTP        | Serialización y media types                            |
| Seguridad   | Redirect, DNS, proxy y TLS                             |
| Cuotas      | Tamaño, profundidad y tiempo                           |
| Plugins     | Exclusión de mecanismos no gobernados                  |

La calificación deberá comparar los bytes y la semántica con receptores y oráculos independientes.

### **21.3. EXP-05b: efectos**

Controles imprescindibles:

| Escenario                          | Garantía                   |
| ---------------------------------- | -------------------------- |
| Alta autorizada                    | Efecto acreditado          |
| Respuesta exitosa sin persistencia | No falso PASS              |
| Timeout después de despacho        | Incertidumbre              |
| Commit tardío                      | Reconciliación             |
| Efecto parcial                     | Libro por subefecto        |
| Idempotencia válida                | Sin duplicación            |
| Clave vencida                      | No retry automático        |
| Referencia real                    | Cero mutaciones prohibidas |
| Revocación                         | Cero nuevos efectos        |
| Limpieza fallida                   | Residuo preservado         |

### **21.4. E7: CI, paridad e ingesta**

Debe cubrir:

- Los seis veredictos.
- Cuatro ejes de AR-52.
- PASS estructural.
- FAIL con residuo.
- Campaña vacía.
- Campaña abierta.
- Evidencia insuficiente.
- Sobre manipulado.
- JUnit editado.
- Resultado externo sin identidad.
- Resultado externo de otro build.
- Contrato consumidor-proveedor obsoleto.
- Intercambio duplicado y conflicto.

### **21.5. Experimentos adicionales**

No se identifica, con la evidencia revisada, una necesidad suficientemente justificada de crear un nuevo EXP independiente.

Los vectores tecnológicos propuestos encuentran cobertura razonable en EXP-01, EXP-05, EXP-07, EXP-08 y E1/E5/E7/E8.

El Orquestador deberá comprobar esta correspondencia contra los protocolos completos antes de integrarla. No corresponde declarar una garantía cubierta únicamente por similitud nominal de un experimento.

## **22. Registro de decisiones tecnológicas candidatas**

| ID       | Decisión candidata  | Principal                     | Respaldo                                  | Condición   |
| -------- | ------------------- | ----------------------------- | ----------------------------------------- | ----------- |
| ET07-T01 | SDK MCP             | TypeScript v2                 | v1 parcheado / Go                         | EXP-01a     |
| ET07-T02 | Registro de HOST    | Adaptadores CAS               | Configuración explícita asistida          | Cuatro HOST |
| ET07-T03 | Continuidad         | Cola y DTO comunes            | IPC alternativo                           | E3/E7       |
| ET07-T04 | UTCP/OpenAPI        | SDK gobernado + Ajv           | HTTP compatible / validador alternativo   | EXP-05a/b   |
| ET07-T05 | CI y JUnit          | CLI + sobre AR-52             | Renderer equivalente                      | E1/E7       |
| ET07-T06 | Resultados externos | Adaptadores pasivos           | Importación canónica                      | E5/E7       |
| ET07-T07 | Intercambio         | Manifiesto y paquete portable | Contenedor alternativo                    | E2/E6/E7    |
| ET07-T08 | Adopción            | MCP + Skill opcional          | Orientación específica por HOST           | EXP-01b     |
| ET07-T09 | Transporte          | Stdio                         | Implementación Stdio alternativa          | EXP-01a     |
| ET07-T10 | Runtime             | Node 24 LTS                   | Node 26 LTS u otra composición acreditada | ET-01/06    |

No son decisiones tecnológicas ratificadas. Son propuestas de evaluación integrable.

## **23. Riesgos residuales y decisiones pendientes**

| Riesgo                                     | Impacto | Resolución                      |
| ------------------------------------------ | ------- | ------------------------------- |
| Incompatibilidad de un HOST obligatorio    | Alto    | EXP-01a                         |
| SDK v1 con mantenimiento insuficiente      | Alto    | Política de actualización       |
| Protocolo moderno mal adaptado             | Alto    | Pruebas dual-era                |
| Registro que modifica configuración ajena  | Alto    | CAS y fixtures                  |
| Resolución OpenAPI incompleta              | Alto    | EXP-05a por dialecto            |
| Plugin UTCP que elude el broker            | Crítico | Descartar o aislar              |
| Retry interno no gobernado                 | Crítico | Contrato de transporte          |
| JUnit que presenta falso éxito             | Crítico | Guardia y AR-52                 |
| Resultados externos promovidos sin oráculo | Crítico | Contrato de ingesta             |
| Telemetría de tokens ausente               | Alto    | Medición explícita o abstención |
| Dependencias no inventariadas              | Alto    | SBOM por composición            |
| Incompatibilidad de ABI o aislamiento      | Alto    | Coordinación ET-01/06           |

### **23.1. Decisiones resolubles documentalmente**

Pueden sostenerse documentalmente como recomendaciones candidatas:

- Conservar MCP como interfaz principal de agentes.
- Mantener Stdio como transporte local preferente.
- No introducir MANAGED obligatorio.
- No adoptar JUnit como sobre de verdad.
- Utilizar DTO canónico.
- Mantener UTCP y OpenAPI complementarios.
- Gobernar el transporte efectivo.
- Incorporar resultados externos pasivamente.
- Evitar un motor universal de evaluadores.
- Mantener CLI determinista sin IA.

### **23.2. Decisiones que requieren evidencia futura**

No deben congelarse todavía:

- SDK MCP exacto y conjunto de paquetes.
- Builds y generaciones efectivas de los cuatro HOST.
- Runtime completo distribuido.
- Frontera efectiva del ejecutor.
- Plugin o adaptador UTCP.
- Validador completo para cada familia OAS.
- Biblioteca HTTP y política efectiva de conexión.
- Serializador y contenedor portable.
- Umbrales de recursos.
- Medición real de tokens.
- Parámetros de mantenimiento y actualización.

### **23.3. Objeciones localizadas**

**ET07-O01 — Registro MCP existente.** No satisface la cobertura exigida ni ofrece evidencia suficiente de CAS, ownership y preservación de configuración ajena.

**ET07-O02 — Resultado JUnit existente.** No puede acreditarse como implementación de AC01-17.02.

**ET07-O03 — Dependencias MCP históricas.** No deben congelarse los rangos 1.30.0/1.30.1 como composición definitiva sin revisión de seguridad y compatibilidad.

**ET07-O04 — Cobertura documental incompleta de esta investigación.** La inspección realizada no permite afirmar que se cotejaron íntegramente todas las fuentes normativas, imports, pruebas, licencias y dependencias transitivas exigidas por el encargo común.

Las cuatro objeciones son localizadas y no justifican reabrir unilateralmente las decisiones empresariales.

## **24. Composición principal y de respaldo**

### **24.1. Composición principal recomendada**

| Capa                    | Tecnología candidata                |
| ----------------------- | ----------------------------------- |
| Runtime                 | Node 24 LTS                         |
| Lenguaje de integración | TypeScript                          |
| MCP                     | SDK oficial v2 dual-era             |
| Transporte HOST         | Stdio                               |
| CLI                     | Commander adaptado                  |
| Contratos               | DTO común versionado                |
| Validación              | Ajv y reglas específicas            |
| UTCP                    | SDK oficial con gobernanza efectiva |
| OpenAPI                 | Interpretación nativa por dialecto  |
| HTTP                    | Broker local gobernado              |
| CI                      | CLI determinista                    |
| JUnit                   | Proyección propia de AR-52          |
| Ingesta                 | Adaptadores pasivos                 |
| Memoria                 | SQLite mediante puerto ET-02        |
| Autoridad               | Núcleo soberano ET-01/06            |

### **24.2. Composición de respaldo**

| Capa               | Alternativa condicionada                |
| ------------------ | --------------------------------------- |
| Runtime            | Node 26 LTS                             |
| MCP inmediato      | SDK v1 actualizado                      |
| MCP estructural    | SDK Go aislado                          |
| UTCP               | Adaptador HTTP compatible independiente |
| OpenAPI            | Validador alternativo aislado           |
| Transporte interno | IPC equivalente calificado              |
| JUnit              | Serializador alternativo                |
| CI                 | Adaptadores delgados por proveedor      |

El respaldo no autoriza instalar simultáneamente todos estos componentes.

Debe elegirse una composición coherente, evitando multiplicación de runtimes y dependencias sin beneficio acreditado.

## **25. Dictamen final al Orquestador Principal**

| Capacidad                                    | Dictamen documental            |
| -------------------------------------------- | ------------------------------ |
| MCP como estándar de interoperabilidad       | APTO COMO CANDIDATO            |
| SDK TypeScript v2                            | CONDICIONADO                   |
| SDK v1 actualizado como respaldo             | CONDICIONADO                   |
| Compatibilidad instalada de cuatro HOST      | SIN RUTA PROBATORIA COMPLETADA |
| Registro/desregistro CAS                     | CONDICIONADO                   |
| HOST + DETERMINISTIC                         | APTO COMO CANDIDATO            |
| Handoff sin inferencia obligatoria           | APTO COMO CANDIDATO            |
| UTCP gobernado                               | CONDICIONADO                   |
| OpenAPI 3.0/3.1/3.2                          | CONDICIONADO                   |
| Broker de operaciones externas               | CONDICIONADO                   |
| CI sin IA ni TTY                             | APTO COMO CANDIDATO            |
| JUnit histórico como acreditación suficiente | INCOMPATIBLE                   |
| JUnit derivado de AR-52                      | APTO COMO CANDIDATO            |
| Ingesta pasiva de resultados externos        | APTO COMO CANDIDATO            |
| Despacho activo de evaluadores               | CONDICIONADO                   |
| Ahorro cuantificado de tokens                | SIN EVIDENCIA SUFICIENTE       |
| Intercambio portable                         | CONDICIONADO                   |
| Certificación instalada                      | NO ACREDITADA                  |

### **Conclusión independiente**

La ruta con mejor equilibrio documental identificado consiste en **conservar los estándares actuales de QAP, modernizar MCP, reconstruir selectivamente los límites de autoridad y concentrar toda la semántica de ejecución y acreditación en un núcleo único**.

La arquitectura no obtiene una ventaja suficiente por introducir, desde el primer lanzamiento, un framework adicional de agentes, un broker universal, un motor contractual propio, un proveedor obligatorio de modelos o un servicio colaborativo remoto.

El riesgo más importante no reside en la elección entre TypeScript y otro lenguaje, sino en permitir que diferentes adaptadores calculen resultados, concedan autoridad o despachen efectos de manera independiente.

Se recomienda integrar ET07-T01–T10 como candidaturas sujetas a coordinación con ET-01–06 y a los experimentos existentes.

**Reserva documental final:** este informe proporciona hallazgos verificables y una composición candidata suficientemente fundamentada para discusión del Orquestador. No se presenta como cumplimiento exhaustivo del encargo común, porque quedaron fuentes normativas auxiliares, pruebas, dependencias transitivas, metadatos de paquetes y versiones efectivas de HOST sin inspección completa.

Se mantienen las 123 entradas normativas, las 65 cláusulas AC-01, los 57 registros maestros, las decisiones ratificadas, la conformidad instalada del 100 % y todos los vetos no compensables.

No se ha modificado GitHub, instalado software, compilado código, ejecutado experimentos, elaborado WBS, iniciado G0/G1 ni accedido a sistemas empresariales.

**Estado de entrega ET-07: CONDICIONADO — investigación documental entregada con reservas explícitas, sin selección tecnológica irreversible.**

*Fin del informe ET-07.*
