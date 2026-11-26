# **QAP — Informe independiente de evaluación tecnológica ET-06**

## **Seguridad, aislamiento, secretos, distribución e instalación**

| Identificación                        | Valor                                      |
| ------------------------------------- | ------------------------------------------ |
| Destinatario                          | Orquestador Principal de QAP               |
| Especialidad                          | ET-06                                      |
| Fecha                                 | 26 de noviembre de 2026                    |
| Repositorio                           | `Hyouka73/QAMCP`                           |
| Rama autorizada                       | `develop`                                  |
| SHA del encargo                       | `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029` |
| Base inmutable de código y evaluación | `1a81e86c9b17a95a04e40237eff5fb99215bae5a` |
| Modalidad                             | Investigación exclusivamente documental    |
| Selección tecnológica definitiva      | No autorizada                              |
| Dictamen general preliminar           | **CONDICIONADO**                           |

## **1. Resumen ejecutivo**

La recomendación tecnológica de ET-06 es conservar el carácter local y autónomo de QAP, pero reconstruir selectivamente sus fronteras de confianza, distribución y custodia de información.

**El problema fundamental de seguridad no se resuelve cambiando de lenguaje, utilizando un keyring moderno o incorporando un instalador profesional.** QAP necesita una separación efectiva entre los agentes que solicitan operaciones y los componentes que poseen la autoridad para ejecutarlas.

Un HOST con acceso a la terminal y los archivos del usuario no debe poder fabricar resultados auténticos, modificar autorizaciones, recuperar secretos, acceder directamente a evidencias privadas ni eludir las restricciones mediante otros consumidores de QAP.

La composición tecnológica recomendada es la siguiente:

| Componente          | Candidato principal                                   | Respaldo condicionado                                 |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Supervisor durable  | Servicios y mecanismos nativos por SO                 | Ejecutor confinado mediante virtualización local      |
| Aislamiento         | Principales diferenciados y restricciones del SO      | VM con dispositivos y comunicaciones mediados         |
| IPC                 | Named pipes, XPC y sockets Unix autenticados          | Transporte local mutuamente autenticado               |
| Secretos            | Broker de credenciales con KEK nativa                 | Proveedor cifrado con desbloqueo fuera de banda       |
| Biblioteca keyring  | `@napi-rs/keyring`, previa calificación               | Integración directa con APIs nativas                  |
| Custodia multimedia | Captura C protegida y Streaming AEAD                  | Captura A mediante frames y códec confinado           |
| Control de red      | Broker y restricciones de egress por proceso          | Red confinada de VM con mediación                     |
| Git                 | Adaptador endurecido sin shell                        | Biblioteca Git embebida y confinada                   |
| Distribución        | Runtime privado versionado y componentes bajo demanda | Runtime compartido acreditado                         |
| Actualizaciones     | Manifiestos firmados, slots y política antirrollback  | Actualización manual mediante paquetes firmados       |
| SBOM y procedencia  | SPDX o CycloneDX y atestaciones verificables          | Herramientas equivalentes con evidencia por artefacto |

Ninguna de estas alternativas constituye una selección irreversible.

### **1.1. Hallazgos principales**

| ID       | Hallazgo                                                                                | Evaluación                 |
| -------- | --------------------------------------------------------------------------------------- | -------------------------- |
| ET06-H01 | Secretos provisionados mediante archivos y variables de entorno                         | Crítica                    |
| ET06-H02 | Dependencia `keytar` archivada                                                          | Alta                       |
| ET06-H03 | Adaptador Git con ejecución mediante shell                                              | Alta                       |
| ET06-H04 | Visor con política de caché pública para determinados recursos                          | Crítica                    |
| ET06-H05 | Frontera efectiva entre HOST y ejecutor todavía no acreditada                           | Crítica                    |
| ET06-H06 | Custodia preventiva multimedia sin calificación completa                                | Crítica                    |
| ET06-H07 | Distribución independiente del monorepo pendiente de acreditación                       | Alta                       |
| ET06-H08 | Contradicción MIT/ISC en licencia propia                                                | Bloqueante para liberación |
| ET06-H09 | Dependencia transitiva Playwright alpha pendiente de retirada acreditada o verificación | Alta                       |
| ET06-H10 | Compatibilidad de seguridad por SO, CPU y modalidad pendiente                           | Alta                       |

Los identificadores ET06-H son referencias de investigación. No crean registros AR adicionales ni alteran los estados existentes.

### **1.2. Conservación normativa**

Se mantienen como restricciones no negociables:

Entradas normativas

# **123**

110 REQ + 2 POL + 11 ampliaciones

Cláusulas AC-01

# **65**

Sin reducción de alcance

Registros maestros

# **57**

Estados preservados

Conformidad instalada exigida

# **100 %**

Vetos admisibles

# **0**

Experimentos ejecutados en ET-06

# **0**

Se preservan D01–D21, DE-01–05 con la combinación A/B/B/A con B de respaldo/B, y AC-DE-01–07 con la combinación B/A/B/A/A/A/A.

La seguridad, privacidad, autoridad y veracidad son filtros eliminatorios. No pueden compensarse mediante menor consumo de memoria, facilidad de instalación, mejor experiencia gráfica o menor costo de desarrollo.

## **2. Identidad de las fuentes y alcance de inspección**

### **2.1. Encargos vinculantes**

Se recuperaron mediante el conector de GitHub los dos encargos íntegros fijados al SHA solicitado.

| Documento                                                                                                                                                                                                              | SHA del blob recuperado                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Encargo común de evaluación tecnológica](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com) | `01a510f95bb32870c5c2b18fd7c934c877aec5ea` |
| [Encargo especializado ET-06](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-06.md?utm_source=chatgpt.com)                              | `9e6e37bfd0e06ebc55790fe3fc342c2ba6409b97` |
| [Matriz de responsabilidades ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com)                  | `63864c07d2f436fc50a8cd5722d1440d580a5300` |

Existe una distinción relevante: el SHA proporcionado por el propietario identifica el expediente de investigación, mientras que el encargo establece `1a81e86c9b17a95a04e40237eff5fb99215bae5a` como base inmutable normativa y de código.

Se utiliza cada referencia para su finalidad, respetando adicionalmente los SHAs históricos fijados por los manifiestos normativos.

### **2.2. Fuentes internas recuperadas**

| Fuente                         | Inspección                                            |
| ------------------------------ | ----------------------------------------------------- |
| Especificación consolidada v1  | Contenido íntegro                                     |
| Catálogo de requisitos         | Recuperado; análisis focalizado en seguridad          |
| Manifiesto normativo original  | Recuperado; referencias pertinentes identificadas     |
| Manifiesto AC-01               | Recuperado                                            |
| Matriz de aceptación integrada | Recuperada; análisis de filas pertinentes             |
| Catálogo delta AC-01           | Recuperado; análisis de cláusulas pertinentes         |
| Contratos AC-01                | Recuperados; análisis de fronteras, UI, adjuntos y CI |
| Actas DE y AC-01               | Recuperadas                                           |
| Registro maestro               | Recuperado; análisis focalizado de registros ET-06    |
| Resolución final AC-01         | Recuperada                                            |
| Dictamen AV-02                 | Recuperado; análisis focalizado                       |
| Fe de correcciones AR-27       | Recuperada                                            |
| Protocolos EXP-06a/c           | Recuperados                                           |
| Dependencias y licencias AV-07 | Recuperado                                            |
| Contravalidaciones CV06 y CV07 | Recuperadas; análisis focalizado                      |
| Protocolos AV-05 y AV-06       | Recuperados                                           |

Referencias normativas principales:

- [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)
- [Catálogo vigente](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)
- [Manifiesto normativo](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com)
- [Contrato delta AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/catalogo-delta-ac01.md?utm_source=chatgpt.com)
- [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)

**Reserva de exhaustividad:** recuperar un documento no equivale a haber analizado individualmente todas sus cláusulas. Este informe distingue las fuentes examinadas íntegramente de las recuperadas para inspección focalizada. No acredita una contravalidación completa de las 123 entradas ni de las 65 cláusulas, ni el cierre de ningún requisito.

### **2.3. Clasificación de evidencias**

Para evitar confundir factibilidad tecnológica con seguridad demostrada, se utilizan cuatro categorías:

| Categoría     | Interpretación                                                                      |
| ------------- | ----------------------------------------------------------------------------------- |
| Documentado   | La fuente primaria acredita la existencia de un mecanismo o capacidad tecnológica.  |
| Condicionado  | Existe una ruta técnicamente plausible, pero depende de integración y calificación. |
| No soportado  | El candidato incumple una garantía o carece del mecanismo necesario.                |
| Indeterminado | La información disponible no permite establecer una conclusión suficiente.          |

Ningún candidato recibe un PASS de producto por disponer de documentación favorable.

## **3. Mapa de obligaciones de ET-06**

El recuento documental de la matriz de responsabilidades devuelve:

| Universo                    | Filas | Responsabilidad primaria ET-06          |
| --------------------------- | ----- | --------------------------------------- |
| Entradas normativas         | 123   | 6                                       |
| Cláusulas AC-01             | 65    | 2                                       |
| Total                       | 188   | 8                                       |
| Dependencias cruzadas ET-06 | 180   | No constituyen obligaciones adicionales |

También se identificaron los 57 encabezados AR en el registro maestro.

### **3.1. Obligaciones primarias**

| Identificador | Garantía                                            | Respuesta tecnológica candidata                             |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| REQ-SEG-001.1 | Motor único deny-by-default                         | Autoridad soberana y consumidores sin acceso directo        |
| REQ-SEG-001.2 | Alcance inalterable desde HOST, DOM o redirecciones | ScopeEnvelope congelado, broker y revalidación              |
| REQ-SEG-001.3 | Revocación durable y cancelación                    | Épocas, fencing, supervisor y control de despacho           |
| REQ-SEG-002.1 | Secretos fuera de MCP/chat                          | KEK nativa, referencias opacas y alta protegida             |
| REQ-SEG-002.2 | Prohibición de degradación a anónimo                | Vinculación obligatoria a identidad efectiva                |
| REQ-SEG-002.3 | Custodia privada de evidencias                      | Cuatro grants independientes y cifrado desde adquisición    |
| AC01-10.01    | Separación de ocho ejes de identidad y autoridad    | Modelo explícito de principales, roles, confianza y efectos |
| AC01-10.02    | Custodia de adjuntos humanos                        | Broker de ingreso, clasificación, digest y procedencia      |

### **3.2. Registros maestros afectados**

| AR    | Materia                         | Condición que debe preservarse                  |
| ----- | ------------------------------- | ----------------------------------------------- |
| AR-07 | Secretos y bóveda               | EXP-07, paridad multiplataforma y CI            |
| AR-14 | Identidad efectiva              | Acreditación por destino y tenant               |
| AR-22 | Parsers, dependencias y OpenAPI | Licencia, referencias confinadas y calificación |
| AR-24 | Visor                           | Bloqueante G0                                   |
| AR-27 | Multimedia privada              | EXP-06a/c                                       |
| AR-28 | Autenticidad                    | Frontera efectiva contra HOST y replay          |
| AR-31 | Autoridad y egress              | Operaciones acreditadas por semántica           |
| AR-32 | Permisos multimedia             | Cuatro grants independientes                    |
| AR-33 | Distribución                    | EXP-04a/b y paquete instalado                   |
| AR-40 | Git defensivo                   | Bloqueante G0                                   |
| AR-41 | Migración y corte               | Bloqueante hasta cumplir condiciones            |
| AR-47 | Revocación e identidad          | Sin degradación a anónimo                       |
| AR-51 | Licencias y procedencia         | SBOM, versiones y artefactos reales             |

ET-06 no modifica la propiedad normativa de estos registros ni declara su resolución.

## **4. Inventario tecnológico real de QAP**

### **4.1. Dependencias identificadas**

Inspección realizada sobre los diez manifiestos de paquetes, manifiesto raíz y lockfile del SHA base.

| Tecnología            | Identidad histórica identificada | Observación                    |
| --------------------- | -------------------------------- | ------------------------------ |
| TypeScript            | `~5.5.4`                         | Lenguaje actual                |
| tsup                  | `^8.5.1`                         | Empaquetado                    |
| Playwright Core       | `1.62.1`, `1.63.0`               | Múltiples resoluciones         |
| Playwright Core alpha | `1.63.0-alpha-2026-08-31`        | Dependencia transitiva         |
| Playwright MCP        | `0.0.80`                         | Puente declarado               |
| MCP SDK               | `1.30.0`, `1.30.1`               | Dos versiones resueltas        |
| keytar                | `7.9.0`                          | Opcional y carga dinámica      |
| node-addon-api        | `4.3.0`                          | Dependencia nativa             |
| prebuild-install      | `7.1.3`                          | Aprovisionamiento nativo       |
| Ajv                   | `8.20.0`, `6.15.0`               | Validación y transitivas       |
| YAML                  | `2.9.0`                          | Documentos y configuración     |
| proper-lockfile       | `4.1.2`                          | Coordinación histórica         |
| node:sqlite           | Integrado en runtime             | Dependiente de versión de Node |

Estas son identidades de la base histórica, no una recomendación de versiones vigentes ni una declaración de ausencia de vulnerabilidades.

Fuente: [pnpm-lock.yaml](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/pnpm-lock.yaml?utm_source=chatgpt.com), blob `3520bac21ed8135cf4772917235f735cbee7947d`.

### **4.2. Mecanismos de seguridad existentes**

| Archivo                                       | Capacidad observada                    | Decisión recomendada                      |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| `auth/src/providers.ts`                       | Puerto de proveedores, keytar diferido | Conservar abstracción; sustituir backend  |
| `auth/src/portable-vault.ts`                  | scrypt y AES-256-GCM                   | Adaptar custodia y migración              |
| `auth/src/secure-files.ts`                    | Archivos privados y escritura atómica  | Endurecer según SO                        |
| `auth/src/session-store.ts`                   | Sesiones cifradas                      | Reconstruir gestión de claves y autoridad |
| `mcp/src/application/permission-authority.ts` | Grants, expiración y revocación        | Trasladar al núcleo soberano              |
| `mcp/src/host-composition.ts`                 | Composición HOST                       | Retirar bypass                            |
| `git-adapter/src/git-adapter.ts`              | Consulta Git                           | Sustituir ejecución mediante shell        |
| `reporter/src/server/server.ts`               | Visor y recursos HTTP                  | Reconstruir frontera                      |
| `scripts/qap-provision-host.mjs`              | Aprovisionamiento                      | Sustituir provisión de secretos           |
| `scripts/release-check.mjs`                   | Validaciones parciales de release      | Ampliar cobertura instalada               |

### **4.3. Hallazgos comprobados directamente**

**ET06-H01 — Exposición potencial de secretos en canales prohibidos.**

El código base contiene tres mecanismos incompatibles con la garantía objetivo:

- `scripts/qap-provision-host.mjs`, líneas 18 y 43–45, genera claves y las incorpora a archivos de configuración y variables de entorno del cliente MCP.
- `session-store.ts`, líneas 31–36, contempla `QAP_SESSION_KEY` desde el entorno.
- `server.ts`, líneas 744–756, introduce campos de contraseña y credenciales en esquemas MCP bajo determinadas condiciones.

Fuentes: [aprovisionamiento](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/scripts/qap-provision-host.mjs?utm_source=chatgpt.com#L18), [sesiones](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/auth/src/session-store.ts?utm_source=chatgpt.com#L31), [esquemas MCP](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/server.ts?utm_source=chatgpt.com#L744).

Omitir una contraseña de la bitácora no acredita su ausencia de la conversación, transporte, configuración del HOST o memoria de sus procesos.

**Dictamen:** sustituir estas rutas tras disponer de mecanismos equivalentes calificados. No basta con ocultar los campos en la interfaz.

**ET06-H02 — Alta de secretos limitada a Windows.**

`local-secret-prompt.ts`, líneas 71–78, rechaza plataformas distintas de Windows y utiliza PowerShell para presentar el diálogo local.

La implementación aporta una base recuperable de interacción humana fuera del HOST, pero no acredita una solución multiplataforma ni la separación efectiva entre principales.

[Fuente directa](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/auth/src/local-secret-prompt.ts?utm_source=chatgpt.com#L71).

**ET06-H03 — Git mediante shell.**

`git-adapter.ts`, líneas 28–33, utiliza `execSync` para ejecutar consultas Git, incluyendo composición textual de la referencia.

[Fuente directa](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/git-adapter/src/git-adapter.ts?utm_source=chatgpt.com#L28).

Esto exige endurecimiento conforme AR-40. No se ha ejecutado una prueba de explotación.

**ET06-H04 — Visor incompatible con la frontera objetivo.**

El servidor contiene:

| Localizador    | Hallazgo                                         |
| -------------- | ------------------------------------------------ |
| Líneas 53–54   | Puerto y host local predeterminados              |
| Líneas 59–61   | CORS abierto y métodos que incluyen mutación     |
| Líneas 268–289 | Búsqueda de archivos sobre diversos directorios  |
| Líneas 292–306 | Comprobaciones parciales de publicación          |
| Línea 315      | `Cache-Control: public, max-age=3600`            |
| Línea 321      | Emisión mediante stream del archivo seleccionado |

[Fuente directa del visor](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/src/server/server.ts?utm_source=chatgpt.com).

Las comprobaciones de publicación son recuperables conceptualmente, pero no sustituyen autenticación, autorización por objeto, apertura confinada ni revocación.

**ET06-H05 — Riesgo de degradación de identidad.**

En `runner.ts`, líneas 325–342, existe una distinción entre fallo de perfil explícito y fallo de resolución implícita.

Ante determinados fallos implícitos, se registra una advertencia en lugar de bloquear inmediatamente el intento.

[Fuente directa](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/runner.ts?utm_source=chatgpt.com#L325).

Debe conservarse la garantía AR-47: una sesión requerida que deja de estar disponible no habilita otra identidad.

**ET06-H06 — Identidad de build insuficiente como procedencia de distribución.**

La configuración tsup de MCP genera metadatos de fingerprint de fuentes y digest de determinados archivos JavaScript. Los assets se copian posteriormente.

La configuración de CLI y MCP declara `target: node18`, mientras que la arquitectura emplea capacidades cuya disponibilidad depende del runtime efectivo.

Fuentes: [build MCP](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/tsup.config.ts?utm_source=chatgpt.com), [build CLI](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/cli/tsup.config.ts?utm_source=chatgpt.com).

**Un target de transpilación no constituye una matriz de compatibilidad ni una atestación del artefacto instalado.**

## **5. Modelo de amenazas y arquitectura de confianza**

### **5.1. Amenazas incluidas**

QAP debe contemplar, como mínimo:

| Principal o superficie        | Amenaza                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| HOST y herramientas de agente | Solicitudes fuera de alcance, manipulación local y fabricación de resultados |
| DOM y contenido AUT           | Instrucciones hostiles, redirecciones y efectos laterales                    |
| Parsers                       | Documentos maliciosos y agotamiento de recursos                              |
| Otros proyectos               | Acceso cruzado a identidades, sesiones y evidencias                          |
| Procesos del mismo usuario    | Lectura, sustitución o manipulación de recursos                              |
| Software legado               | Segundo escritor y despacho fuera de autoridad                               |
| CI                            | PR no confiable, manipulación de variables y exposición de secretos          |
| Actualizador                  | Sustitución de binarios, downgrade y paquetes comprometidos                  |
| Visor y UI                    | Escalamiento, replay y acceso directo indebido                               |
| Proveedores externos          | Importaciones falsas, dependencias vulnerables y procedencia insuficiente    |

### **5.2. Amenazas residuales**

No resulta razonable prometer mediante esta arquitectura protección absoluta frente a:

- Administrador o root hostil con control pleno del sistema.
- Kernel comprometido.
- Hipervisor comprometido.
- Acceso físico avanzado con el equipo desbloqueado.
- Copias externas previamente exportadas.
- Captura manual externa no mediada por QAP.

Estos límites deben declararse explícitamente. Sin embargo, no justifican excluir del modelo los procesos ordinarios del mismo usuario, puesto que AR-28 exige una separación efectiva frente al HOST.

### **5.3. Arquitectura lógica recomendada**

Arquitectura lógica candidata. Las fronteras representan autoridad y confinamiento, no una obligación de crear un proceso separado por cada caja.

La autoridad debe existir en un único núcleo lógico. Los mecanismos nativos específicos de plataforma no constituyen núcleos adicionales.

## **6. Evaluación del aislamiento por sistema operativo**

### **6.1. Windows**

#### **Candidato principal: Windows Service, principal diferenciado y broker interactivo**

Composición propuesta:

- Servicio durable bajo identidad dedicada de mínimo privilegio.
- DACL específicas para bases, claves, medios y canales IPC.
- Job Objects para contabilidad, cuotas y terminación del árbol.
- Restricted tokens o AppContainer para trabajadores compatibles.
- Broker gráfico dentro de la sesión interactiva.
- Named pipes con restricciones de acceso local y autenticación del interlocutor.

Microsoft documenta la gestión agrupada de procesos mediante Job Objects y el aislamiento de recursos mediante AppContainer. También distingue los servicios de la sesión interactiva, por lo que no debe ejecutarse directamente la interfaz gráfica desde un servicio privilegiado.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+3



#### **Comparación**

| Alternativa                         | Ventaja                        | Brecha                                     |
| ----------------------------------- | ------------------------------ | ------------------------------------------ |
| Proceso Node bajo el usuario actual | Simplicidad                    | Insuficiente frente al HOST                |
| Servicio + cuenta dedicada + broker | Frontera y continuidad nativas | Complejidad del instalador e IPC           |
| AppContainer                        | Menor acceso a recursos        | Compatibilidad de browsers y GUI pendiente |
| VM local                            | Aislamiento más amplio         | Mayor costo operativo y de recursos        |

**Recomendación:** servicio dedicado y confinamiento selectivo de trabajadores. AppContainer es una capacidad complementaria, no un sustituto universal del supervisor.

**Respaldo:** VM local, únicamente si la solución nativa no acredita una celda obligatoria.

No debe asumirse que Hyper-V está disponible en toda edición o configuración de Windows.

### **6.2. macOS**

#### **Candidato principal: launchd, App Sandbox y XPC**

Composición:

- Supervisor administrado por mecanismos nativos.
- Separación de principal para autoridad y recursos protegidos.
- XPC autenticado mediante identidad y requisitos de firma.
- Helpers confinados mediante entitlements mínimos.
- Broker interactivo separado.
- Keychain bajo identidad de código y usuario acreditados.

Apple documenta las restricciones de App Sandbox y APIs para exigir requisitos de firma a interlocutores XPC.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.apple.com\&sz=32)

Apple Developer Documentation+3



| Alternativa                        | Ventaja                  | Limitación                                      |
| ---------------------------------- | ------------------------ | ----------------------------------------------- |
| LaunchAgent bajo usuario ordinario | Instalación sencilla     | No demuestra protección frente al mismo usuario |
| Servicio separado + XPC            | Frontera más fuerte      | Firma, instalación y permisos                   |
| App Sandbox                        | Confinamiento de helpers | Entitlements y compatibilidad                   |
| VM                                 | Aislamiento adicional    | Huella y compatibilidad gráfica                 |

La firma de código debe complementar, no reemplazar, la autorización por operación.

**Recomendación:** combinación nativa de servicio, XPC, firma y App Sandbox cuando resulte compatible con los trabajadores.

### **6.3. Linux**

#### **Candidato principal: systemd, UID dedicado, cgroups v2 y namespaces**

Composición:

- Supervisor bajo cuenta de servicio.
- Cgroups para cuotas y contabilidad.
- Namespaces de montaje, proceso y red.
- Seccomp para reducir la superficie de llamadas al kernel.
- Capabilities mínimas.
- AppArmor o SELinux cuando corresponda.
- Socket Unix protegido y autenticado.
- Broker gráfico compatible con el compositor de la sesión.

La documentación de systemd permite identificar mecanismos de confinamiento y restricciones que dependen del kernel y de si se trata de una unidad de sistema o usuario. La documentación del kernel aclara que seccomp, por sí solo, no constituye un sandbox completo.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.freedesktop.org\&sz=32)

freedesktop.org+2



| Alternativa                   | Ventaja                             | Limitación                          |
| ----------------------------- | ----------------------------------- | ----------------------------------- |
| Proceso bajo mismo UID        | Simplicidad                         | No cumple frontera contra HOST      |
| systemd + UID + namespaces    | Controles integrados                | Diferencias de distro y políticas   |
| Bubblewrap/namespace launcher | Confinamiento de trabajadores       | Depende de configuración del kernel |
| Contenedor rootless           | Separación de filesystem y procesos | Kernel compartido, GUI y sockets    |
| VM                            | Frontera de kernel distinta         | RAM, almacenamiento y mantenimiento |

**Recomendación:** systemd para supervisión, con namespaces y restricciones adicionales para workers.

**Respaldo:** confinamiento alternativo de procesos o VM cuando no exista una combinación nativa equivalente.

No se recomienda convertir Docker en un requisito obligatorio del producto.

### **6.4. Matriz preliminar SO/CPU/modalidad**

| Celda               | Supervisor candidato  | GUI visible          | Headless         | Estado       |
| ------------------- | --------------------- | -------------------- | ---------------- | ------------ |
| Windows x64         | Service + Job Objects | Broker interactivo   | Worker confinado | Condicionado |
| Windows ARM64       | Service + Job Objects | Broker interactivo   | Worker ARM64     | Condicionado |
| macOS Intel         | launchd + XPC         | Broker de sesión     | Worker confinado | Condicionado |
| macOS Apple Silicon | launchd + XPC         | Broker de sesión     | Worker arm64     | Condicionado |
| Linux x64           | systemd + cgroups     | Wayland/X11 mediados | Namespaces       | Condicionado |
| Linux ARM64         | systemd + cgroups     | Wayland/X11 mediados | Namespaces       | Condicionado |

Las capacidades del SO no demuestran disponibilidad de todas las bibliotecas, browsers, codecs ni binarios nativos en esas celdas.

Las versiones mínimas exactas de SO, distros, libc y SDK deben establecerse cruzando ET-01, ET-03, ET-04 y ET-05.

### **6.5. Riesgo específico del escritorio visible**

Existe un conflicto tecnológico importante:

> Un navegador visible dentro de una sesión gráfica compartida puede resultar accesible a otros procesos de esa sesión, aun cuando su supervisor y almacenamiento se encuentren aislados.

En particular, X11, mecanismos de automatización de escritorio, depuración y captura de pantalla requieren evaluación separada.

No se debe:

- Activar acceso universal al servidor gráfico.
- Exponer indiscriminadamente el socket de control del navegador.
- Entregar el perfil autenticado al HOST.
- Afirmar aislamiento visual porque el navegador corre en otro proceso.
- Suprimir navegación visible para simplificar la seguridad.

**Objeción localizada ET06-O01:** si ninguna integración gráfica nativa satisface simultáneamente fidelidad y frontera efectiva, deberá calificarse una sesión gráfica aislada o una VM mediada. Si tampoco cumple, la celda queda bloqueada y se eleva al Orquestador.

## **7. IPC, autenticidad y revocación**

### **7.1. Comparación de transportes**

| Transporte                      | Ventaja                           | Riesgo                                    | Dictamen          |
| ------------------------------- | --------------------------------- | ----------------------------------------- | ----------------- |
| HTTP loopback sin autenticación | Fácil integración                 | Otros procesos y navegador pueden acceder | Descartado        |
| HTTP local autenticado          | Compatible con múltiples clientes | CSRF, bootstrap y robo de credenciales    | Condicionado      |
| Named pipes                     | Identidad y ACL de Windows        | Configuración incorrecta de permisos      | Principal Windows |
| XPC                             | Identidad nativa y firma          | Dependencia de APIs y versiones macOS     | Principal macOS   |
| Unix domain sockets             | Comunicación local y permisos     | Mismo UID y sustitución de endpoint       | Principal Linux   |
| TLS mutuo local                 | Protocolo común                   | Gestión de certificados y bootstrap       | Respaldo          |

### **7.2. Contrato mínimo de IPC**

Se propone un sobre común independiente del transporte.

```
interface TrustedCommandEnvelope {
  protocolVersion: string;
  requestId: string;
  callerReference: string;
  operation: string;
  scopeRevision: string;
  authorizationRevision: string;
  executionEpoch: string;
  replayProtection: string;
  payloadDigest: string;
}
```

Este fragmento define una interfaz conceptual; no constituye una especificación congelada ni código autorizado.

La identidad del solicitante debe derivarse de evidencia autenticada del canal y de la autoridad interna. No puede confiarse únicamente en el valor `callerReference` suministrado por un cliente.

Requisitos de aceptación:

- Autenticación de ambos extremos.
- Integridad del mensaje.
- Protección frente a replay.
- Esquemas versionados y límites de tamaño.
- Errores explícitos.
- Vinculación de la solicitud a identidad y autorización vigentes.
- Rechazo de comandos antiguos después de revocación.
- Persistencia de intención antes del despacho cuando corresponda.

### **7.3. Atestación de intentos**

| Mecanismo             | Evaluación                                                        |
| --------------------- | ----------------------------------------------------------------- |
| SHA-256 del resultado | Acredita integridad respecto de un digest confiable, no autoría   |
| HMAC                  | Autenticación útil si la clave permanece bajo principal protegido |
| Firma asimétrica      | Permite separación entre firmante y verificadores                 |
| TPM/Secure Enclave    | Endurecimiento opcional condicionado a hardware y APIs            |

Recomiendo una identidad de atestación exclusiva del ejecutor soberano, preferentemente mediante firma asimétrica cuando resulte compatible con la verificación y distribución requeridas.

La firma debe vincular intento, revisión congelada, identidad efectiva, alcance, build, testigos y ejes de resultado conforme AR-52.

**Una firma válida no transforma una observación incorrecta en un resultado funcional verdadero.**

### **7.4. Revocación y fencing**

La revocación requiere una operación durable que invalide nuevas admisiones y nuevos despachos.

El supervisor debe poder interrumpir trabajo en vuelo y conservar la incertidumbre de efectos previamente enviados.

No es admisible afirmar que:

- Matar un proceso revierte una transacción externa.
- Cancelar una petición demuestra que nunca llegó al AUT.
- Restaurar una copia antigua puede revivir autorizaciones.
- El fencing local garantiza por sí solo idempotencia remota.

Estas condiciones corresponden a AR-14, AR-28, AR-41, AR-47 y REQ-SEG-001.3.

## **8. Secretos y gestión criptográfica**

### **8.1. Comparación de proveedores**

| Candidato                  | Situación                           | Ventaja                                  | Riesgo                                           |
| -------------------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| keytar 7.9.0               | Actual en lock histórico            | Integración existente                    | Proyecto archivado                               |
| `@napi-rs/keyring`         | Alternativa candidata               | Abstracción multiplataforma N-API        | Dependencias nativas y semántica de persistencia |
| APIs nativas directas      | Alternativa candidata               | Mayor control sobre principal y custodia | Tres integraciones                               |
| Vault con contraseña       | Parcialmente existente              | Portabilidad y recuperación              | Desbloqueo y memoria                             |
| Gestor externo obligatorio | No admisible como requisito general | Administración centralizada              | Dependencia externa y posible costo obligatorio  |

El repositorio oficial de keytar se encuentra archivado. Por tanto, no recomiendo conservarlo como fundamento de una nueva arquitectura profesional.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



### **8.2. Observación sobre&#x20;**`@napi-rs/keyring`

AV-07 identifica `2.1.2` como referencia histórica del candidato. Esta versión no queda congelada por ET-06.

La documentación del mantenedor advierte que las variantes Linux pueden incorporar `libdbus` mediante enlace estático, con obligaciones de licencia diferentes a las del wrapper.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.npmjs.com\&sz=32)

npm+1



Por ello, el cambio de keytar a keyring no puede aprobarse únicamente mediante compatibilidad de API o licencia MIT declarada.

Debe calificarse:

| Capacidad                   | Windows              | macOS     | Linux                                   |
| --------------------------- | -------------------- | --------- | --------------------------------------- |
| Guardar KEK                 | Credenciales nativas | Keychain  | Secret Service u otro backend explícito |
| Recuperar tras reinicio     | Pendiente            | Pendiente | Pendiente                               |
| Separación de principal     | Pendiente            | Pendiente | Pendiente                               |
| Sesión sin interfaz gráfica | Pendiente            | Pendiente | Pendiente                               |
| Rotación                    | Pendiente            | Pendiente | Pendiente                               |
| Licencias transitivas       | Pendiente            | Pendiente | Atención especial a libdbus             |

En Linux, la existencia de un fallback basado en keyutils no acredita persistencia tras reinicio.

### **8.3. Proveedores nativos como respaldo**

Windows DPAPI ofrece protección vinculada normalmente al usuario y equipo que efectuó el cifrado. La documentación oficial señala estas condiciones y sus excepciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn



En macOS, debe utilizarse Keychain con identidad de código y acceso controlado.

En Linux, Secret Service constituye una interfaz candidata. La fuente consultada presenta la versión 0.2 como borrador publicado el 20 de noviembre de 2026; no debe asumirse que todas las implementaciones instaladas soportan esa revisión.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://specifications.freedesktop.org\&sz=32)

specifications.freedesktop.org



**Recomendación:** establecer un puerto `IKeyEncryptionProvider` y utilizar la variante nativa cuya persistencia, permisos y recuperación sean efectivamente acreditados.

### **8.4. Separación de claves**

Separación conceptual de dominios criptográficos. Las claves de atestación y autenticación de manifiestos no se reutilizan como claves de cifrado.

### **8.5. Vault existente**

La bóveda portable contiene elementos técnicamente recuperables:

- scrypt.
- AES-256-GCM.
- Nonces aleatorios.
- Autenticación de metadatos.
- Escritura privada y atómica.

[Fuente](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/auth/src/portable-vault.ts?utm_source=chatgpt.com).

Sin embargo, no recomiendo mantener su formato como fundamento inalterable de v1.

La integración debe establecer separación KEK/DEK, dominios, rotación, migración autenticada, recuperación y revocación durable.

La política de KDF vigente tampoco puede calificarse sin medir tiempo, memoria y comportamiento bajo presión.

### **8.6. CI desatendido**

El contexto CI necesita un mecanismo propio de adquisición fuera de banda.

| Mecanismo                     | Dictamen             |
| ----------------------------- | -------------------- |
| Secreto en argumento CLI      | No soportado         |
| Secreto dentro de payload MCP | No soportado         |
| Secreto en entorno heredado   | No soportado         |
| Descriptor o handle protegido | Candidato            |
| Archivo efímero con ACL       | Candidato            |
| Gestor corporativo autorizado | Integración opcional |

Si un proveedor CI únicamente ofrece inyección por variables de entorno, esa modalidad no satisface automáticamente el contrato de QAP.

El sistema debe diferenciar identidad solicitante, identidad ejecutora y procedencia del código ejecutado.

Un pull request no confiable no puede obtener secretos por modificar archivos de pipeline, parámetros o configuración del proyecto.

### **8.7. Contrato de credenciales**

Operaciones conceptuales:

| Operación    | Garantía                                       |
| ------------ | ---------------------------------------------- |
| Aprovisionar | Alta humana o CI fuera de banda                |
| Referenciar  | Identificador opaco                            |
| Resolver     | Únicamente principal autorizado                |
| Rotar        | Nueva generación y revocación de la anterior   |
| Revocar      | Bloqueo durable                                |
| Restaurar    | Sin recuperar permisos revocados               |
| Destruir     | Eliminación lógica y riesgo residual explícito |

El HOST puede conocer que existe una referencia utilizable. No debe recibir la KEK, DEK, contraseña, token ni estado de sesión reutilizable.

## **9. Broker de red, SSRF y autorización por efecto**

### **9.1. Comparación tecnológica**

| Alternativa                         | Capacidad                                | Limitación                                   |
| ----------------------------------- | ---------------------------------------- | -------------------------------------------- |
| Interceptación dentro de Playwright | Conocimiento del navegador               | Cobertura dependiente de motor y subsistemas |
| Cliente HTTP endurecido             | Adecuado para APIs                       | No gobierna tráfico autónomo de browsers     |
| Proxy local autenticado             | Control centralizado de parte del egress | Tráfico directo y protocolos alternos        |
| Restricción de red por SO           | Bloquea rutas alternativas               | No comprende semántica empresarial           |
| VM con red mediada                  | Frontera más amplia                      | Costos y limitaciones adicionales            |

Recomiendo combinar mediación semántica y confinamiento efectivo de red. Ninguna de estas capas es suficiente individualmente.

OWASP recomienda considerar resoluciones DNS, destinos autorizados y redirecciones en la prevención de SSRF.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://cheatsheetseries.owasp.org\&sz=32)

OWASP Cheat Sheet Series



### **9.2. Obligaciones del broker**

| Superficie               | Control requerido                                        |
| ------------------------ | -------------------------------------------------------- |
| URL                      | Normalización y política de esquema                      |
| DNS                      | Resolución, validación y vinculación al destino efectivo |
| IPv4/IPv6                | Evaluación coherente                                     |
| Redirección              | Nueva autorización en cada transición                    |
| TLS                      | Validación de identidad y CA acreditada                  |
| Proxy                    | Sin bypass del alcance                                   |
| WebSocket                | Política propia                                          |
| Descargas                | Destino y custodia controlados                           |
| Service workers          | Cobertura o bloqueo explícito                            |
| Subrecursos              | Política aplicable por origen y efecto                   |
| Acceso privado LAN       | Excepción estrecha y acreditada                          |
| Referencias documentales | Resolución únicamente mediante broker                    |

### **9.3. Semántica de lectura**

Un método HTTP no acredita por sí solo que una operación sea de lectura.

Un GET puede ocasionar efectos; una operación de consulta puede utilizar POST. La autoridad se determina por efecto acreditado, identidad y destino.

Por consiguiente:

- Producción y referencia continúan siendo exclusivamente de lectura acreditada.
- Los mecanismos de autenticación no quedan autorizados automáticamente por permitir observar un destino.
- La navegación privada adicional de DE-02 B no autoriza capturar ni conservar.
- Un navegador capaz de realizar una operación no implica que QAP tenga permiso de ejecutarla.

### **9.4. Riesgo de incompatibilidad**

Un proxy que termina TLS para observar indiscriminadamente contenido puede introducir nuevas claves, CA, datos sensibles y modificaciones de confianza.

No recomiendo exigir una CA MITM universal ni desactivar la validación TLS como solución predeterminada.

La visibilidad de operaciones que no pueda acreditarse mediante instrumentación y confinamiento debe producir bloqueo o abstención conforme al contrato normativo, no permisos implícitos.

## **10. Aislamiento de documentos y contenido hostil**

ET-05 es propietario primario de extracción, OCR, oráculos documentales y generación de reportes. ET-06 establece la frontera obligatoria de ejecución.

### **10.1. Comparación de aislamiento**

| Alternativa                | Evaluación                                                   |
| -------------------------- | ------------------------------------------------------------ |
| Parser dentro del núcleo   | Descartado como frontera frente a código hostil              |
| Worker JavaScript          | Útil para concurrencia; no suficiente como sandbox           |
| Subproceso bajo mismo UID  | Facilita terminación; protección insuficiente por sí sola    |
| Proceso restringido por SO | Principal                                                    |
| WASM                       | Candidato complementario sujeto a imports y runtime          |
| VM local                   | Respaldo para motores incompatibles con confinamiento nativo |

### **10.2. Garantías requeridas**

El worker documental no debe poder:

- Acceder directamente al vault.
- Leer otras aplicaciones o proyectos.
- Resolver URLs externas arbitrarias.
- Ejecutar macros o scripts sin autoridad.
- Escribir directamente en SQLite canónico.
- Lanzar procesos fuera de su perfil autorizado.
- Desbordar presupuestos de memoria, disco, CPU o tiempo.

El contrato deberá incluir límites sobre profundidad, tamaño descomprimido, páginas, hojas, objetos, referencias y trabajo total.

No recomiendo prohibir documentos complejos como sustituto de D11. Si el formato necesita motores adicionales, deben calificarse bajo las mismas garantías.

### **10.3. Documentos externos e instrucciones maliciosas**

Un documento puede aportar hechos, expectativas y reglas candidatas, pero no puede otorgar permisos.

Asimismo, ni los resultados de herramientas de seguridad importados ni un reporte firmado acreditan automáticamente un resultado verdadero.

Esta frontera afecta AC01-17, AC01-18, AC01-23 y AC01-24, además de AR-22 y AR-51.

## **11. Evidencia privada y custodia multimedia**

### **11.1. Conservación de la fe AR-27**

Se preserva la corrección normativa que distingue:

1. Prevención de adquisición de cuadros prohibidos.
2. Contención de los cuadros adquiridos bajo autorización.
3. Descarte y tratamiento de incidentes.

El antecedente AS-04 demuestra, dentro de su fixture histórico, el riesgo de capturar una superficie MFA durante una transición SPA.

La fe AR-27 también documenta rutas intermedias de escritura en Playwright 1.62.1 que no quedan protegidas simplemente por cifrar el archivo final.

Fuente: [Fe de correcciones AR-27](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/fe-correcciones-ar27.md?utm_source=chatgpt.com).

### **11.2. Alternativas de captura**

| Alternativa                          | Evaluación                                    |
| ------------------------------------ | --------------------------------------------- |
| Video estándar y cifrado posterior   | No satisface custodia desde primera escritura |
| C: capturador nativo protegido       | Principal condicionado                        |
| A: frames con codificación confinada | Respaldo condicionado                         |
| Video deshabilitado permanentemente  | No admisible como reducción de alcance        |

Cualquier alternativa debe demostrar exclusión preventiva de superficies prohibidas, fidelidad, evidencia temporal y reproducción autorizada.

Una captura eliminada después de contener MFA no acredita que la captura estuviera permitida.

### **11.3. Streaming AEAD**

| Tecnología                                             | Evaluación                           |
| ------------------------------------------------------ | ------------------------------------ |
| Formato criptográfico propio                           | Descartado                           |
| Tink Streaming AEAD                                    | Principal documental                 |
| Librería equivalente de cifrado segmentado autenticado | Respaldo sujeto a revisión           |
| AES-GCM aplicado al archivo terminado                  | Insuficiente para el ciclo requerido |

Google documenta Streaming AEAD para grandes archivos y flujos, así como sus construcciones y requisitos criptográficos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developers.google.com\&sz=32)

developers.google.com+2



Su adopción deberá considerar:

- Binding realmente disponible.
- Runtime adicional, si fuese necesario.
- Acceso autenticado por segmentos.
- Detección de truncamiento.
- Integridad del manifiesto.
- Asociación contextual.
- Recuperación tras interrupción.
- Consumo de memoria durante reproducción.

No he confirmado una integración Node específica que satisfaga todas las necesidades de QAP. Por ello, **Tink constituye una familia candidata, no una dependencia aprobada**.

### **11.4. Custodia desde el primer byte**

El contrato comprende la tubería completa.

La garantía abarca toda la tubería, incluidos buffers, codecs, temporales, perfiles de navegador, recuperación y exportaciones.

Debe examinarse adicionalmente:

| Superficie             | Riesgo residual                       |
| ---------------------- | ------------------------------------- |
| Swap/pagefile          | Copias de memoria                     |
| Crash dumps            | Persistencia de datos sensibles       |
| GPU                    | Buffers fuera de custodia directa     |
| Directorios temporales | Escritura previa al cifrado           |
| Backups                | Conservación de generaciones antiguas |
| SSD                    | Eliminación física no demostrable     |
| Exportaciones externas | Revocación posterior no garantizada   |

La eliminación lógica y criptográfica no puede presentarse como garantía de destrucción física de todas las copias.

### **11.5. Cuatro autorizaciones independientes**

| Grant     | Autoriza                              |
| --------- | ------------------------------------- |
| Capturar  | Adquisición bajo alcance vigente      |
| Acceder   | Consulta o reproducción               |
| Conservar | Persistencia conforme a política      |
| Exportar  | Transferencia expresamente autorizada |

No se modifica la vigencia máxima de captura de 30 días, su renovación o revocación, ni las políticas de retención ratificadas.

DE-02 B establece elegibilidad condicionada. No concede un permiso actual.

## **12. Visor histórico e interfaz operacional**

### **12.1. Separación de AR-24 y EXP-08**

El visor histórico debe permanecer exclusivamente de lectura.

La interfaz gráfica operacional puede solicitar comandos, pero como consumidor autenticado de la autoridad común.

| Capacidad                        | Visor histórico | UI operacional            |
| -------------------------------- | --------------- | ------------------------- |
| Consultar resultados autorizados | Sí              | Sí                        |
| Reproducir evidencia con grant   | Sí              | Sí                        |
| Crear casos                      | No              | Mediante núcleo           |
| Modificar asignaciones           | No              | Mediante núcleo           |
| Revocar permisos                 | No              | Bajo autoridad específica |
| Acceso directo a SQLite          | No              | No                        |
| Acceso directo al vault          | No              | No                        |
| Acceso indiscriminado a archivos | No              | No                        |
| Operar sin IA                    | Sí              | Sí                        |

### **12.2. Alternativas tecnológicas**

| Tecnología                   | Evaluación ET-06                               |
| ---------------------------- | ---------------------------------------------- |
| Servidor web local existente | Requiere reconstrucción de frontera            |
| UI web local autenticada     | Candidato condicionado                         |
| Electron                     | Candidato sujeto a aislamiento y configuración |
| Tauri/WebView                | Candidato sujeto a comandos, IPC y runtime     |
| UI nativa                    | Candidato de mayor costo multiplataforma       |

ET-06 no selecciona el framework gráfico. Esa decisión corresponde a ET-04 y al Orquestador.

Independientemente del framework, el frontend no debe poseer autoridad directa ni un canal general de ejecución de comandos del sistema.

### **12.3. Controles del visor**

La ruta recomendada es identificar los medios mediante referencias opacas vinculadas al catálogo.

No utilizar la ruta de un archivo suministrada por el cliente como autorización de lectura.

Debe verificarse:

- Sesión autenticada.
- Origen y Host.
- Autorización por artefacto.
- Estado COMMITTED.
- Confinamiento frente a symlinks y reparse points.
- Apertura segura sin carreras TOCTOU.
- MIME y rangos.
- Ausencia de caché reutilizable para datos privados.
- Revocación de nuevas emisiones.
- Saneamiento de HTML y contenido importado.
- Ausencia de recursos externos obligatorios.

**Dictamen AR-24: BLOQUEANTE G0 preservado.**

La existencia de una UI profesional no resuelve este registro por sí misma.

## **13. Git defensivo**

### **13.1. Comparación**

| Alternativa               | Ventaja                          | Limitación                                    |
| ------------------------- | -------------------------------- | --------------------------------------------- |
| Git mediante shell actual | Implementación mínima            | Interpretación de comandos y errores ambiguos |
| Git CLI endurecido        | Reutiliza comportamiento oficial | Configuración, helpers y versión instalada    |
| libgit2                   | API estructurada                 | Dependencia nativa y licencia                 |
| isomorphic-git            | Integración JavaScript           | Paridad funcional y seguridad por calificar   |

La documentación oficial de Git incluye mecanismos de configuración, helpers externos y controles de hooks que deben contemplarse al ejecutar operaciones sobre repositorios no confiables.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://git-scm.com\&sz=32)

git Documentation+1



### **13.2. Candidato recomendado**

Conservar el adaptador Git como puerto funcional, sustituyendo la ejecución mediante shell por invocación estructurada y confinada.

Requisitos:

- Referencias y paths validados.
- Sin shell.
- Sin hooks o helpers no autorizados.
- Sin red implícita.
- Sin configuración hostil que amplíe autoridad.
- Ejecutable de identidad conocida.
- Límites de recursos.
- Error explícito ante comando fallido.

Una consulta Git fallida no puede convertirse en una lista vacía de cambios.

**Respaldo:** biblioteca Git embebida que acredite equivalencia funcional y licencias.

AR-40 permanece bloqueante G0.

## **14. Distribución e instalación**

### **14.1. Alternativas principales**

| Modalidad                       | Instalación                 | Huella                     | Seguridad y mantenimiento            |
| ------------------------------- | --------------------------- | -------------------------- | ------------------------------------ |
| npm/npx con resolución dinámica | Cómoda inicialmente         | Variable                   | No suficientemente reproducible      |
| Runtime compartido acreditado   | Descarga inicial menor      | Depende del equipo         | Deriva y soporte externo             |
| Runtime privado autocontenido   | Mayor tamaño inicial        | Predecible por variante    | Control de versión y actualizaciones |
| Ejecutable único                | Ergonomía de distribución   | Depende de assets y addons | Limitaciones de empaquetado          |
| Contenedor/VM completa          | Mayor aislamiento potencial | Huella superior esperable  | Mantenimiento adicional              |

### **14.2. Recomendación**

Distribuir QAP mediante una instalación local versionada que incluya:

- Runtime controlado.
- Supervisor y launchers.
- Interfaces MCP/CLI.
- UI operacional.
- Mecanismo de aprovisionamiento.
- Manifiesto firmado.
- Capacidades descargables bajo demanda.

No incluir automáticamente todos los browsers, codecs, motores OCR y dependencias opcionales.

El producto debe diferenciar instalación base de capacidad instalada y capacidad calificada.

### **14.3. Runtime**

Node 24 LTS continúa siendo un candidato coherente con el expediente AV-07.

La documentación oficial consultada recomienda ramas LTS para aplicaciones productivas. Se recuperó también documentación SEA de Node `v24.20.0`, que acredita disponibilidad documental de esa tecnología en dicha versión, no la aprobación de esa revisión para QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js Releases+1



La modalidad SEA debe evaluarse frente a:

- Addons nativos.
- Carga dinámica.
- Workers.
- Assets.
- Procesos auxiliares.
- SQLite.
- Playwright.
- Firmas de código.

Por estos motivos, no recomiendo convertir un único ejecutable en requisito de diseño. Un paquete autocontenido con runtime privado y componentes externos controlados puede ser más mantenible.

### **14.4. Instaladores candidatos**

| SO      | Principal a evaluar                                           | Respaldo                                 |
| ------- | ------------------------------------------------------------- | ---------------------------------------- |
| Windows | MSI firmado o instalación equivalente compatible con servicio | MSIX si acredita todas las integraciones |
| macOS   | PKG/APP firmados y notarizados                                | Distribución firmada equivalente         |
| Linux   | DEB/RPM según distro acreditada                               | Archivo firmado con launcher y doctor    |

Microsoft documenta MSIX como formato de instalación con identidad de paquete y mecanismos de actualización. Esto no acredita automáticamente compatibilidad con los servicios, brokers y procesos gráficos requeridos por QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn



Apple documenta firmas de distribución, Hardened Runtime y notarización. La distribución macOS deberá contemplar estas condiciones para los componentes correspondientes.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.apple.com\&sz=32)

Apple Developer Documentation+1



No se exige que todas las plataformas compartan el mismo formato de instalador.

### **14.5. Privilegios y experiencia profesional**

Se recomienda separar:

- Privilegio necesario para registrar servicios y proteger directorios.
- Privilegio ordinario para operar QAP.
- Privilegios adicionales asociados a capacidades opcionales.

La operación diaria no debe requerir ejecutar QAP como administrador o root.

**Objeción ET06-O02:** si una política empresarial impide la instalación de un principal protegido, una instalación por usuario solo resulta admisible si acredita la misma frontera. De lo contrario, se declara no elegible esa configuración.

### **14.6. Registro de los cuatro HOST**

La instalación debe registrar de forma idempotente los consumidores requeridos:

| HOST        | Requisito         |
| ----------- | ----------------- |
| Antigravity | EXP-01a instalado |
| Codex       | EXP-01a instalado |
| Claude Code | EXP-01a instalado |
| Gemini CLI  | EXP-01a instalado |

No deben almacenarse claves en sus archivos de configuración.

Los launchers deberán referenciar una instalación de QAP con identidad verificable, no ejecutar paquetes flotantes.

CLI como alternativa no demuestra compatibilidad MCP de un HOST.

## **15. Actualizaciones, offline y rollback**

### **15.1. Composición candidata**

Recomiendo un mecanismo de actualización transaccional inspirado en TUF y basado en una implementación revisada cuando sea viable.

La especificación primaria consultada corresponde a TUF 1.0.37, modificada el 8 de octubre de 2026. Incluye separación de roles y protección contra distintas amenazas de actualización, como rollback y congelación.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://theupdateframework.github.io\&sz=32)

theupdateframework.github.io



### **15.2. Estados conceptuales**

El proceso de actualización no debe modificar directamente la instalación activa mientras una nueva variante permanece incompleta.

### **15.3. Antirrollback**

Es necesario distinguir dos tipos de reversión:

| Reversión         | Política                                                        |
| ----------------- | --------------------------------------------------------------- |
| Binarios          | Solo a versión todavía admitida y compatible                    |
| Autoridad y datos | Nunca restaurar permisos revocados ni perder nuevas operaciones |

Un paquete correctamente firmado puede seguir siendo inadmisible si su versión ha sido revocada.

La recuperación debe conservar revocaciones, tombstones, generaciones y efectos pendientes.

En caso de incompatibilidad irreversible de esquema, la recuperación hacia delante puede ser necesaria.

### **15.4. Operación offline**

QAP no debe necesitar un servicio remoto permanente para ejecutar campañas ya aprovisionadas.

La modalidad offline requiere:

- Paquetes verificables localmente.
- Caché identificada por digest.
- Raíces de confianza disponibles.
- Metadatos de compatibilidad.
- Política explícita ante información de revocación vencida.
- Actualización manual por paquetes firmados.
- Proxy y CA corporativos cuando exista conexión.

No recomiendo resolver la expiración de metadatos desactivando indiscriminadamente las verificaciones.

## **16. Supply chain, SBOM y procedencia**

### **16.1. Identidades que deben mantenerse diferenciadas**

| Identidad   | Qué acredita                 |
| ----------- | ---------------------------- |
| Declarada   | Manifest del proyecto        |
| Resuelta    | Lockfile                     |
| Descargada  | Artefacto obtenido           |
| Construida  | Salida de build              |
| Empaquetada | Componentes de distribución  |
| Instalada   | Archivos realmente presentes |
| Alcanzable  | Componentes utilizados       |
| Calificada  | Variante sometida a pruebas  |

La igualdad entre manifest y lockfile no acredita igualdad con el software instalado.

### **16.2. SBOM**

Fuentes primarias consultadas:

- SPDX 3.0, con documentación de versiones anteriores y relación con el estándar ISO/IEC 5962:2021.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://spdx.dev\&sz=32)

  SPDX

- CycloneDX 1.7, publicada el 21 de octubre de 2025 según su documentación oficial.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://cyclonedx.org\&sz=32)

  CycloneDX



Recomiendo CycloneDX o SPDX según compatibilidad de herramientas e interoperabilidad requerida.

El SBOM debe incorporar por variante:

| Familia      | Componentes                               |
| ------------ | ----------------------------------------- |
| Núcleo       | Dependencias JavaScript y runtime         |
| Nativos      | Addons, bibliotecas dinámicas y estáticas |
| Navegadores  | Binarios y componentes auxiliares         |
| UI           | WebView, Chromium u otros runtimes        |
| Multimedia   | Codecs y herramientas                     |
| Documentos   | Parsers, OCR y recálculo                  |
| Distribución | Instalador y updater                      |
| Controles    | Supervisor, brokers y auxiliares          |

No debe emitirse exclusivamente a partir del lockfile.

### **16.3. Procedencia**

La versión 1.2 de SLSA documenta un modelo aprobado de procedencia de build. GitHub también documenta mecanismos de atestación de binarios y SBOM.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://slsa.dev\&sz=32)

Build: Provenance+1



Recomiendo:

- Atestación vinculada a fuente y configuración de build.
- Digest de todos los componentes distribuidos.
- Identidad del constructor.
- Materiales utilizados.
- Versiones exactas de herramientas.
- Firma verificable.
- Política explícita de confianza del instalador.

No declaro que QAP satisfaga un nivel SLSA específico.

### **16.4. Componentes alpha**

El lockfile confirma la presencia de Playwright alpha a través de dependencias declaradas.

La documentación previa CV06/CV07 conserva la reserva sobre la verificación independiente de sus bytes y la necesidad de retirada acreditada o cotejo completo.

**Recomendación:** excluir esta dependencia de la composición de lanzamiento si EXP-04 y la verificación de consumidores demuestran que resulta innecesaria.

No se debe retirar únicamente porque su nombre incluya `alpha`, ni conservarla por comodidad del lockfile.

### **16.5. Avisos de seguridad**

Se consultaron los directorios primarios de avisos de Node, Playwright y MCP SDK.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+2



No se completó un cruce exhaustivo de todos los avisos, rangos afectados, dependencias transitivas y alcanzabilidad del artefacto instalado.

Por tanto:

- No se afirma que las versiones históricas estén libres de CVE.
- No se afirma que un candidato moderno sea seguro por ausencia de avisos visibles.
- No se asignan identificadores CVE o GHSA no contrastados.
- La calificación AR-51 permanece pendiente.

Cada hallazgo futuro deberá vincularse a versión, variante, exposición, corrección y política de admisión.

## **17. Licencias y cumplimiento normativo**

### **17.1. Contradicción de licencia propia**

Existe una contradicción comprobada:

| Fuente                                                                                                                                   | Declaración |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [LICENSE](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/LICENSE?utm_source=chatgpt.com)                | MIT         |
| [package.json raíz](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/package.json?utm_source=chatgpt.com) | ISC         |

El titular debe resolver esta diferencia.

ET-06 no elige la licencia ni interpreta la disponibilidad del repositorio como autorización para modificarla.

### **17.2. Matriz de riesgos legales**

| Componente  | Referencia de licencia                                | Reserva               |
| ----------- | ----------------------------------------------------- | --------------------- |
| QAP         | MIT/ISC contradictorias                               | Decisión del titular  |
| keytar      | MIT, según expediente                                 | Mantenimiento         |
| keyring     | Licencia del wrapper y transitivas                    | Variante Linux        |
| libdbus     | AFL-2.1 o GPL-2.0-or-later según documentación citada | Enlace estático       |
| Node        | Licencias del runtime y componentes incorporados      | Avisos por artefacto  |
| Playwright  | Licencia del proyecto y browsers separados            | Redistribución        |
| Git         | Condiciones según distribución                        | Empaquetado y avisos  |
| Tink        | Licencia de la implementación seleccionada            | Dependencias          |
| FFmpeg      | LGPL o GPL según configuración                        | Build exacto y codecs |
| Parsers/OCR | Dependientes del proveedor                            | ET-05                 |

FFmpeg establece explícitamente que incorporar partes opcionales GPL modifica las condiciones de licencia de FFmpeg. Su admisión exige conocer el build exacto.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ffmpeg.org\&sz=32)

ffmpeg.org



No debe asumirse que utilizar FFmpeg como ejecutable separado elimina automáticamente todas las obligaciones de redistribución.

### **17.3. Cumplimiento organizacional y privacidad**

La arquitectura propuesta permite establecer controles compatibles con buenas prácticas de:

- Desarrollo seguro.
- Gestión de vulnerabilidades.
- Mínimo privilegio.
- Protección de datos desde el diseño.
- Minimización y finalidad.
- Trazabilidad.
- Gestión de accesos.
- Conservación y eliminación gobernadas.
- Respuesta ante incidentes.

Referencias normativas pertinentes para una revisión posterior:

| Referencia           | Aplicación                          |
| -------------------- | ----------------------------------- |
| NIST SSDF SP 800-218 | Desarrollo y supply chain           |
| ISO/IEC 27001        | Gestión organizacional de seguridad |
| ISO/IEC 27002        | Controles                           |
| ISO/IEC 29100        | Privacidad                          |
| OWASP ASVS           | Seguridad de superficies aplicables |
| SPDX/CycloneDX       | Inventario y transparencia          |
| SLSA/TUF             | Procedencia y actualizaciones       |

No se completó una inspección normativa cláusula por cláusula de todos estos estándares. Una de las rutas consultadas del SSDF no estaba disponible.

QAP no debe anunciar certificación ISO, cumplimiento legal universal, conformidad regulatoria financiera o validación criptográfica formal por el mero uso de estas tecnologías.

### **17.4. Costo y dependencias comerciales**

La arquitectura no debe exigir al propietario ni a sus usuarios una suscripción, servidor remoto o adquisición comercial obligatoria.

Los certificados de firma, programas de distribución y mecanismos de notarización pueden generar costos operativos para el publicador. Deben registrarse separadamente de los costos que recaen sobre el usuario final.

No se han verificado precios concretos para esas actividades, por lo que no se asignan montos.

## **18. Economía de ingeniería y rendimiento**

Las comparaciones siguientes son estimaciones cualitativas derivadas del diseño y sus dependencias, no benchmarks.

### **18.1. Costo relativo de integración**

| Componente                   | Integración | Reconstrucción | Mantenimiento |
| ---------------------------- | ----------- | -------------- | ------------- |
| Puerto keyring               | Medio       | Bajo–medio     | Medio         |
| APIs nativas de credenciales | Alto        | Medio          | Alto          |
| Supervisor por SO            | Alto        | Alto           | Alto          |
| IPC común con adaptadores    | Alto        | Medio–alto     | Medio         |
| Broker de red                | Alto        | Alto           | Alto          |
| Confinamiento documental     | Medio–alto  | Medio          | Medio–alto    |
| Custodia multimedia          | Alto        | Alto           | Alto          |
| Git endurecido               | Bajo–medio  | Bajo           | Bajo–medio    |
| Visor protegido              | Medio–alto  | Alto           | Medio         |
| Instaladores por SO          | Medio–alto  | Medio          | Medio–alto    |
| Actualizaciones verificadas  | Alto        | Medio–alto     | Medio–alto    |
| VM generalizada              | Alto        | Alto           | Alto          |

### **18.2. Perímetro real de recursos**

El consumo debe incluir todo el árbol de QAP:

- Supervisor.
- Runtime del núcleo.
- Agentes IPC.
- Browser y procesos renderizadores.
- UI y WebView.
- Parsers.
- OCR.
- Codecs.
- Cifrado.
- Cachés.
- VM, si aplica.

No corresponde comparar la memoria del proceso Node contra la memoria de una VM completa y omitir los browsers y procesos auxiliares de la alternativa Node.

### **18.3. Hipótesis de consumo**

| Candidato             | Hipótesis documental                                       | Medición pendiente  |
| --------------------- | ---------------------------------------------------------- | ------------------- |
| Supervisor nativo     | Menor infraestructura adicional que VM completa            | RAM y CPU en reposo |
| Runtime privado       | Mayor instalación inicial que runtime compartido existente | Descarga y tamaño   |
| Worker aislado        | Sobrecosto por separación y comunicación                   | Arranque y latencia |
| Streaming AEAD        | Evita exigir archivo completo en memoria                   | Throughput y RAM    |
| VM                    | Duplica parte de la infraestructura del SO                 | Huella completa     |
| Browsers bajo demanda | Evita instalar capacidades no solicitadas                  | Ahorro por perfil   |

No existe evidencia pareada suficiente para asignar porcentajes de ahorro o especificaciones mínimas definitivas.

### **18.4. Instrumentación requerida**

| Métrica      | Perímetro                         |
| ------------ | --------------------------------- |
| Descarga     | Bytes transferidos                |
| Instalación  | Disco ocupado por variante        |
| RAM          | Árbol completo, pico y estable    |
| CPU          | Tiempo total y utilización        |
| I/O          | Lecturas, escrituras y temporales |
| Arranque     | Frío y caliente                   |
| Latencia IPC | Admisión, consulta y despacho     |
| Criptografía | Throughput y presión de memoria   |
| Recuperación | Tiempo y completitud              |
| Energía      | Cuando exista medición comparable |

La decisión de hardware mínimo pertenece a EXP-03 y los protocolos aplicables.

## **19. Contratos de coordinación con otras especialidades**

### **19.1. ET-01 — Núcleo, lenguaje y runtime**

| Contrato     | Exigencia ET-06                 |
| ------------ | ------------------------------- |
| Supervisor   | Independiente del HOST          |
| Runtime      | Rama mantenida y ABI acreditada |
| Autoridad    | Un núcleo lógico                |
| IPC          | Esquemas y autenticación        |
| Atestación   | Clave inaccesible al HOST       |
| Trabajadores | Restricciones efectivas del SO  |

**Conflicto potencial:** elegir un runtime únicamente por facilidad de empaquetado puede invalidar addons, aislamiento, browsers o criptografía.

Los adaptadores nativos podrán utilizar tecnologías distintas del núcleo si se conserva un contrato común y no se introduce una segunda autoridad.

### **19.2. ET-02 — Persistencia y memoria**

| Contrato         | Exigencia ET-06                          |
| ---------------- | ---------------------------------------- |
| SQLite           | Acceso exclusivo del escritor autorizado |
| WAL y temporales | Custodia equivalente                     |
| Backup           | Protección y recuperación coherente      |
| Revocaciones     | Monotonicidad                            |
| FTS              | Sin fuga entre scopes                    |
| Migración        | Exclusión efectiva del legado            |

**Conflicto potencial:** una DB situada en un workspace modificable por el HOST no acredita la frontera requerida, aunque sus transacciones sean correctas.

La elección de cifrado SQLite, si procede, deberá comprobar WAL, temporales, copias y gestión de claves. No se prescribe SQLCipher ni otro proveedor sin comparación de ET-02.

### **19.3. ET-03 — Navegadores**

| Contrato        | Exigencia ET-06             |
| --------------- | --------------------------- |
| Browser process | Identidad y aislamiento     |
| Perfiles        | No compartidos entre scopes |
| Egress          | Mediación y control por SO  |
| GUI             | Broker de sesión            |
| Descargas       | Custodia protegida          |
| Cancelación     | Supervisor y revocación     |

**Conflicto potencial:** Playwright, Puppeteer, Selenium u otro candidato pueden requerir capacidades de red o escritorio incompatibles con un perfil restrictivo.

No se resolverá mediante desactivar el sandbox del navegador ni ampliar indiscriminadamente los permisos.

### **19.4. ET-04 — UI profesional**

| Contrato            | Exigencia ET-06                 |
| ------------------- | ------------------------------- |
| Autenticación local | Identidad efectiva              |
| Comandos            | Mediante autoridad              |
| Consultas           | Proyecciones autorizadas        |
| Visor               | Solo lectura                    |
| Secretos            | Alta protegida y fuera del HOST |
| Adjuntos            | Broker de ingreso               |

**Conflicto potencial:** un frontend con acceso general a filesystem, shell, IPC privilegiado o SQLite incumpliría la frontera.

La elección de Electron, Tauri, UI web local o nativa no modifica esta condición.

### **19.5. ET-05 — Documentos, reportes y multimedia**

| Contrato       | Exigencia ET-06                   |
| -------------- | --------------------------------- |
| Parser         | Worker confinado                  |
| Referencias    | Broker autorizado                 |
| OCR            | Procesos y temporales gobernados  |
| Streaming AEAD | Custodia desde adquisición        |
| Códec          | Build exacto, licencias y límites |
| Exportación    | Derivado saneado y autorizado     |

**Conflicto potencial:** un parser o códec que dependa de archivos temporales en claro fuera de la frontera no podrá adoptarse sin resolver dicha brecha.

### **19.6. ET-07 — MCP, APIs, UTCP y CI/CD**

| Contrato      | Exigencia ET-06                           |
| ------------- | ----------------------------------------- |
| MCP           | Cliente sin secretos ni autoridad directa |
| UTCP          | Operaciones mediadas                      |
| OpenAPI       | Resolución gobernada                      |
| CI            | Identidad y secretos fuera de banda       |
| Importación   | Procedencia no equivalente a autoridad    |
| Registro HOST | Configuraciones sin claves                |

**Conflicto potencial:** SDK, herramientas o plugins que ejecuten operaciones directamente desde el agente pueden duplicar la autoridad.

Toda operación debe atravesar el núcleo y sus brokers conforme a la revisión autorizada.

### **19.7. Registro consolidado de interfaces**

| ID       | Interfaz                    | Dependencias   |
| -------- | --------------------------- | -------------- |
| ET06-I01 | `ISupervisorPort`           | ET-01/03/05    |
| ET06-I02 | `ITrustedCommandTransport`  | ET-01/04/07    |
| ET06-I03 | `IKeyEncryptionProvider`    | ET-01/02/05/07 |
| ET06-I04 | `ICredentialBroker`         | ET-03/04/07    |
| ET06-I05 | `INetworkAuthorityPort`     | ET-03/05/07    |
| ET06-I06 | `IProtectedArtifactStore`   | ET-02/04/05    |
| ET06-I07 | `IExecutionAttestationPort` | ET-01/02/03/07 |
| ET06-I08 | `IComponentProvisioner`     | Todas          |
| ET06-I09 | `ISandboxedWorkerPort`      | ET-01/03/05    |
| ET06-I10 | `IUpdateTrustPolicy`        | ET-01/02/07    |

Los nombres son propuestos para coordinación documental. No constituyen contratos normativos nuevos ni obligan a crear paquetes o servicios separados.

## **20. Matriz de garantías y calificación futura**

### **20.1. Experimentos reutilizados**

No se propone ejecutar experimentos ni abrir compuertas. Los siguientes criterios complementan los protocolos existentes y quedan sujetos a su autoridad normativa.

| Protocolo | Incertidumbre ET-06     | Criterio principal                                   |
| --------- | ----------------------- | ---------------------------------------------------- |
| EXP-01a   | HOST y distribución     | Cuatro hosts usando la interfaz instalada sin bypass |
| EXP-01b   | Handoff                 | Sin fuga ni recuperación de grants revocados         |
| EXP-02    | Discovery               | Sin ampliación de autoridad                          |
| EXP-03    | Recursos                | Árbol completo y límites bajo presión                |
| EXP-04a   | Instalación preliminar  | Paquete funcional y verificable                      |
| EXP-04b   | Distribución final      | Instalación limpia, reparación y actualización       |
| EXP-05a   | Protocolos              | Autenticación y referencias confinadas               |
| EXP-05b   | Efectos                 | Revocación y reconciliación                          |
| EXP-06a   | Captura                 | Prevención y custodia desde primer byte              |
| EXP-06b   | Parsers                 | Aislamiento y límites                                |
| EXP-06c   | Evidencias              | Reproducción y revocación                            |
| EXP-07    | Secretos                | Cero fuga y persistencia acreditada                  |
| EXP-08a   | Frontera UI             | Identidades y comandos efectivamente separados       |
| EXP-08b   | Vertical instalada      | Paridad y escritor único                             |
| EXP-08c   | Integración profesional | Sin bypass, con medios y adjuntos protegidos         |

### **20.2. Matriz de pruebas de seguridad**

| Garantía           | Control positivo              | Control negativo                | Evidencia requerida          |
| ------------------ | ----------------------------- | ------------------------------- | ---------------------------- |
| Principal separado | Operación autorizada completa | HOST intenta acceso directo     | Identidad y ACL efectivas    |
| IPC mutuo          | Cliente legítimo              | Cliente no autenticado/replay   | Decisión y rechazo           |
| Vault              | Recuperación autorizada       | Perfil ajeno o secreto revocado | Ausencia de canarios         |
| Revocación         | Operación vigente             | Revocar durante campaña         | Bloqueo y reconciliación     |
| Browser            | Sesión autorizada             | Cambio de identidad o destino   | Trazabilidad y resultado     |
| Parser             | Documento válido              | Documento hostil                | Confinamiento y cuota        |
| Multimedia         | Video permitido               | Superficie MFA o prohibida      | Exclusión previa y custodia  |
| Visor              | Reproducción autorizada       | Acceso ajeno o revocado         | Emisión controlada           |
| Git                | Consulta válida               | Referencia no autorizada        | Rechazo explícito            |
| Update             | Paquete válido                | Paquete alterado o revocado     | Estado instalado verificable |
| Corte              | Migración autorizada          | Escritor legado                 | Exclusión y reconciliación   |

Los controles positivos son obligatorios para evitar acreditar seguridad mediante denegación universal.

### **20.3. EXP-07: precisión propuesta**

Variables relevantes:

- SO/CPU.
- Backend de KEK.
- Sesión interactiva o CI.
- Reinicio del equipo.
- Rotación.
- Restauración.
- Proceso del mismo usuario.
- Perfil efectivo.
- Revocación durante operación.

Criterios:

- Cero secretos canario en canales prohibidos.
- Ningún acceso cruzado.
- Persistencia donde se exige.
- Recuperación sin revivir autoridad.
- Fallo cerrado ante backend indisponible.
- Ausencia de degradación silenciosa.

Fallback: proveedor nativo directo o almacenamiento cifrado con alta fuera de banda, sujeto a las mismas garantías.

### **20.4. EXP-06a: precisión propuesta**

La prueba debe observar la adquisición y custodia, no únicamente el archivo final.

Variables:

- Capturador C/A.
- Motor de navegador.
- Headless/visible.
- Transiciones SPA.
- Login/MFA/SSO.
- Geometría y cambios de viewport.
- Interrupción.
- Temporales.
- Capacidad de reproducción.

Criterio: no adquisición de cuadros prohibidos bajo las condiciones acreditadas, custodia íntegra de cuadros permitidos y supresión previa cuando no exista garantía.

Fallback: C/A según corresponda. Si ambas fallan, bloqueo de selección, no reducción de D18.

### **20.5. EXP-08a: precisión propuesta**

Debe evaluar al menos:

- Consulta legítima del visor.
- Comando legítimo de UI.
- Intento de mutación desde visor.
- Cliente ajeno.
- Replay.
- Manipulación de argumentos.
- Acceso directo a DB.
- Acceso directo al vault.
- Revocación.
- Identidad incorrecta.
- Inicio de segundo escritor.

Resultado exigido: fronteras efectivas para todas las celdas obligatorias, no solo separación de ventanas o puertos.

### **20.6. EXP-04a/b: precisión propuesta**

El paquete instalado debe someterse a escenarios de:

- Instalación limpia.
- Ausencia de runtime previo.
- Proxy.
- CA corporativa.
- Offline.
- Componente alterado.
- Interrupción de instalación.
- Actualización incompatible.
- Revocación de una versión.
- Rollback admisible.
- Desinstalación.
- Reinstalación sin pérdida silenciosa de datos.

No se propone un EXP adicional porque estas incertidumbres pueden incorporarse a los protocolos ya vigentes.

## **21. Preservación de compuertas y bloqueantes**

| Compuerta   | Condición ET-06                                         |
| ----------- | ------------------------------------------------------- |
| G0          | AR-24, AR-40 y factibilidades tempranas                 |
| Antes de G1 | EXP-06a y EXP-08a                                       |
| G1          | Supervisor, autoridad, IPC, EXP-07 y vertical instalada |
| G2          | Aislamiento documental y AR-20 por clase                |
| G3          | Evidencia, efectos, presión y revocación                |
| G4          | Continuidad y autonomía sin ampliar autoridad           |
| G5          | Distribución final, recuperación y ensayo de corte      |
| G6          | Evaluación ciega y vigencia de evidencias               |
| G6.5        | Piloto empresarial autorizado                           |
| GA          | Conformidad instalada, licencias y cero vetos           |

AR-41 no se considera resuelto mediante mover un puntero o deshabilitar una entrada de menú.

La exclusión del escritor legado debe abarcar tanto almacenamiento como capacidad de despacho, conforme CV07.

G6.5 permanece obligatorio y no otorga por sí mismo permiso para realizar el corte definitivo.

## **22. Matriz final de candidatos**

| Capacidad                    | Candidato                                  | Dictamen                       |
| ---------------------------- | ------------------------------------------ | ------------------------------ |
| Supervisor Windows           | Service + principal dedicado + Job Objects | CONDICIONADO                   |
| Supervisor macOS             | launchd + principal protegido + XPC        | CONDICIONADO                   |
| Supervisor Linux             | systemd + UID + cgroups                    | CONDICIONADO                   |
| Aislamiento de trabajadores  | Mecanismos nativos por SO                  | CONDICIONADO                   |
| VM de respaldo               | Hipervisor local compatible                | CONDICIONADO                   |
| Proveedor keytar existente   | keytar 7.9.0                               | NO RECOMENDADO                 |
| Proveedor keyring            | `@napi-rs/keyring`                         | CONDICIONADO                   |
| APIs nativas directas        | DPAPI/Keychain/Secret Service              | APTO COMO CANDIDATO            |
| IPC nativo                   | Named pipes/XPC/Unix sockets               | APTO COMO CANDIDATO            |
| Atestación protegida         | Firma bajo principal soberano              | APTO COMO CANDIDATO            |
| Egress                       | Broker + restricciones SO                  | CONDICIONADO                   |
| Aislamiento documental       | Workers confinados                         | APTO COMO CANDIDATO            |
| Git                          | CLI endurecida sin shell                   | APTO COMO CANDIDATO            |
| Visor                        | Servicio autenticado de lectura            | CONDICIONADO                   |
| Captura C                    | Nativa protegida                           | CONDICIONADO                   |
| Captura A                    | Frames y códec confinado                   | CONDICIONADO                   |
| Streaming AEAD               | Tink o implementación equivalente          | CONDICIONADO                   |
| Binding criptográfico exacto | Pendiente de ET-05/ET-01                   | SIN RUTA DOCUMENTAL SUFICIENTE |
| Runtime privado              | Node LTS según ET-01                       | APTO COMO CANDIDATO            |
| Instaladores                 | Nativos y firmados                         | CONDICIONADO                   |
| Actualizador                 | Implementación de confianza basada en TUF  | APTO COMO CANDIDATO            |
| SBOM                         | SPDX/CycloneDX                             | APTO COMO CANDIDATO            |
| Procedencia                  | SLSA/in-toto compatible                    | APTO COMO CANDIDATO            |

### **22.1. Composición principal integrada**

## **ET06-COMP-A**

Composición nativa modular

Núcleo

Runtime LTS privado y autoridad soberana

Aislamiento

Supervisor y restricciones nativas por SO

Identidad

IPC autenticado y principales diferenciados

Secretos

KEK nativa y referencias opacas

Red

Broker y confinamiento de egress

Evidencia

Captura C protegida y Streaming AEAD

Distribución

Instaladores firmados y componentes bajo demanda

Actualización

Slots, procedencia y política antirrollback

Esta composición intenta minimizar dependencias pesadas sin sacrificar la frontera de confianza.

### **22.2. Composición de respaldo**

## **ET06-COMP-B**

Confinamiento reforzado selectivamente

Núcleo

Misma autoridad y mismo contrato de resultados

Aislamiento

VM local solo para celdas o workers incompatibles

Secretos

Broker nativo o bóveda cifrada acreditada

Evidencia

Frames y códec confinado

Runtime

Compartido únicamente si acredita identidad y soporte

Actualización

Paquetes manuales firmados y política equivalente

El respaldo no introduce una segunda arquitectura funcional, un segundo escritor ni una reducción del producto.

## **23. Decisiones documentales frente a decisiones experimentales**

### **23.1. Puede resolverse documentalmente**

| Materia                                | Recomendación                             |
| -------------------------------------- | ----------------------------------------- |
| Secretos en payload MCP                | Inadmisibles                              |
| Secretos mediante entorno heredado     | Inadmisibles                              |
| Git mediante shell                     | Sustituir                                 |
| Visor con caché pública privada        | Inadmisible                               |
| Mismo UID como única frontera          | Insuficiente                              |
| keytar archivado como fundamento nuevo | No recomendado                            |
| Cifrado posterior como única custodia  | Insuficiente                              |
| Licencia propia contradictoria         | Elevar al titular                         |
| Versiones flotantes                    | Inadmisibles para distribución acreditada |
| Segundo escritor                       | Inadmisible                               |
| Compra o SaaS obligatorio              | Inadmisible                               |

### **23.2. Requiere calificación futura**

| Materia                   | Motivo                              |
| ------------------------- | ----------------------------------- |
| Backend exacto de keyring | Persistencia y separación           |
| API y versión de IPC      | Compatibilidad por SO               |
| Aislamiento gráfico       | Riesgos del escritorio compartido   |
| Browser por modalidad     | Fidelidad y restricciones           |
| Criptografía streaming    | Binding, custodia y rendimiento     |
| Codec exacto              | Licencias y tubería                 |
| Instalador por plataforma | Servicios, permisos y UX            |
| Runtime final             | ABI y compatibilidad instalada      |
| Matriz de hardware        | Mediciones reales                   |
| Rollback de datos         | Autoridad monotónica y recuperación |

## **24. Riesgos prioritarios para el Orquestador**

| Riesgo                                    | Consecuencia                       | Tratamiento                             |
| ----------------------------------------- | ---------------------------------- | --------------------------------------- |
| R06-01: frontera gráfica insuficiente     | Acceso del HOST a sesión protegida | Broker aislado o VM                     |
| R06-02: backend keyring no persistente    | Pérdida de continuidad             | Proveedor alternativo                   |
| R06-03: captura preventiva incompleta     | Fuga de datos                      | Bloqueo de selección                    |
| R06-04: dependencia nativa incompatible   | Celda sin instalación              | Variante acreditada                     |
| R06-05: licencias transitivas omitidas    | Distribución inadmisible           | SBOM por bytes                          |
| R06-06: actualización revocada            | Reintroducción de vulnerabilidad   | Antirrollback                           |
| R06-07: restauración de autoridad antigua | Permisos resucitados               | Generaciones monotónicas                |
| R06-08: bypass legado                     | Segundo escritor o despacho        | Exclusión efectiva                      |
| R06-09: parsers con acceso indirecto      | Fuga o agotamiento                 | Broker y cuotas                         |
| R06-10: falsa autenticidad                | Resultados fabricados              | Principal protegido y testigos          |
| R06-11: CI no confiable                   | Exposición de secretos             | Identidad y aprovisionamiento separados |
| R06-12: sobredimensionamiento             | Mala experiencia profesional       | EXP-03 completo                         |

### **Riesgo transversal**

El principal riesgo de integración de los siete especialistas consiste en seleccionar individualmente tecnologías favorables que resulten incompatibles al componerlas.

Por ejemplo:

- Un navegador seleccionado por rendimiento puede no admitir el perfil de aislamiento.
- Un framework gráfico puede exigir un proceso con acceso excesivo.
- Un códec puede introducir temporales sin custodia.
- Un keyring puede depender de una sesión gráfica no disponible en CI.
- Un runtime ligero puede carecer de bindings requeridos.

La composición completa debe evaluarse antes de congelar cualquiera de estos proveedores.

## **25. Fuentes primarias externas y vigencia**

Fecha de consulta: **26 de noviembre de 2026**.

| Fuente                                                                                                                                                                 | Revisión o identidad consultada | Materia            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------ |
| [Microsoft Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects?utm_source=chatgpt.com)                                                 | Documentación vigente           | Procesos y cuotas  |
| [Microsoft AppContainer](https://learn.microsoft.com/en-us/windows/win32/secauthz/appcontainer-isolation?utm_source=chatgpt.com)                                       | Documentación vigente           | Aislamiento        |
| [Microsoft Interactive Services](https://learn.microsoft.com/en-us/windows/desktop/services/interactive-services?utm_source=chatgpt.com)                               | Documentación vigente           | Sesiones           |
| [Named Pipe Security](https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights?utm_source=chatgpt.com)                                | Documentación vigente           | IPC                |
| [Microsoft DPAPI](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata?utm_source=chatgpt.com)                                          | CryptProtectData                | KEK                |
| [Microsoft MSIX](https://learn.microsoft.com/en-us/windows/msix/overview?utm_source=chatgpt.com)                                                                       | Documentación vigente           | Distribución       |
| [Apple App Sandbox](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox?utm_source=chatgpt.com)                                          | Documentación vigente           | Confinamiento      |
| [Apple XPC](https://developer.apple.com/documentation/xpc/xpc_connection_set_peer_code_signing_requirement?utm_source=chatgpt.com)                                     | API de requisito de firma       | IPC                |
| [Apple Code Signing](https://developer.apple.com/documentation/xcode/creating-distribution-signed-code-for-the-mac/?utm_source=chatgpt.com)                            | Documentación vigente           | Distribución       |
| [systemd.exec](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html?utm_source=chatgpt.com)                                                       | Manual latest consultado        | Servicios          |
| [Linux Seccomp](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html?utm_source=chatgpt.com)                                                       | Documentación del kernel        | Filtrado           |
| [Secret Service](https://specifications.freedesktop.org/secret-service/latest/?utm_source=chatgpt.com)                                                                 | 0.2 DRAFT                       | Secretos           |
| [keytar](https://github.com/atom/node-keytar?utm_source=chatgpt.com)                                                                                                   | Repositorio archivado           | Dependencia legacy |
| [keyring](https://www.npmjs.com/package/@napi-rs/keyring?utm_source=chatgpt.com)                                                                                       | Documentación del mantenedor    | Backend candidato  |
| [Tink Streaming AEAD](https://developers.google.com/tink/streaming-aead?utm_source=chatgpt.com)                                                                        | Documentación vigente           | Custodia           |
| [Tink Wire Format](https://developers.google.com/tink/wire-format?utm_source=chatgpt.com)                                                                              | Documentación vigente           | Formato            |
| [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html?utm_source=chatgpt.com)                            | Cheat Sheet vigente             | Egress             |
| [Git](https://git-scm.com/docs/git?utm_source=chatgpt.com)                                                                                                             | Documentación vigente           | Adaptador          |
| [Node Releases](https://nodejs.org/en/about/previous-releases?utm_source=chatgpt.com)                                                                                  | Tabla vigente                   | Runtime            |
| [Node SEA](https://nodejs.org/download/release/v24.20.0/docs/api/single-executable-applications.html?utm_source=chatgpt.com)                                           | v24.20.0                        | Empaquetado        |
| [TUF](https://theupdateframework.github.io/specification/latest/?utm_source=chatgpt.com)                                                                               | 1.0.37                          | Actualizaciones    |
| [SLSA](https://slsa.dev/spec/v1.2/build-provenance?utm_source=chatgpt.com)                                                                                             | 1.2                             | Procedencia        |
| [SPDX](https://spdx.dev/use/specifications/?utm_source=chatgpt.com)                                                                                                    | 3.0                             | SBOM               |
| [CycloneDX](https://cyclonedx.org/specification/overview/?utm_source=chatgpt.com)                                                                                      | 1.7                             | SBOM               |
| [FFmpeg Legal](https://ffmpeg.org/legal.html?utm_source=chatgpt.com)                                                                                                   | Condiciones oficiales           | Codecs             |
| [GitHub Artifact Attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations?utm_source=chatgpt.com) | Documentación vigente           | Atestaciones       |

Las referencias identificadas como documentación vigente no constituyen un pin exacto de versión de API, SDK o binario. Dichos pins deberán establecerse durante la selección y calificación autorizadas.

## **26. Limitaciones materiales del informe**

La investigación permitió verificar directamente ambos encargos, identificar las ocho obligaciones primarias ET-06, contar las 188 filas de asignación y los 57 registros maestros, e inspeccionar código y dependencias reales relevantes.

No obstante, permanecen las siguientes limitaciones:

1. No se completó la lectura semántica exhaustiva de la totalidad de las 123 entradas, 65 cláusulas y 41 fuentes originales incorporadas por el manifiesto.
2. No se auditó cada import estático o dinámico, prueba, binario y componente transitivo del repositorio.
3. No se verificaron los bytes de todos los artefactos nativos ni sus firmas.
4. No se completó un inventario contemporáneo exhaustivo de advisories por versión, variante y alcanzabilidad.
5. No se determinaron versiones mínimas definitivas de SO, CPU, libc, SDK y navegador.
6. No existe evidencia experimental nueva de rendimiento, aislamiento, persistencia, compatibilidad ni seguridad instalada.
7. La revisión de estándares y cumplimiento legal es orientativa, no una auditoría normativa completa.

Por estas razones, **el encargo común no puede declararse íntegramente satisfecho en su exigencia de exhaustividad**, aunque se entrega una evaluación tecnológica sustantiva, trazable y utilizable por el Orquestador.

Estas reservas no se convierten en supuestos favorables.

## **27. Dictamen independiente final**

Dictamen ET-06

# **CONDICIONADO**

La composición nativa modular se considera la ruta principal más defendible documentalmente para QAP v1, con virtualización selectiva como respaldo cuando las fronteras nativas no acrediten las garantías obligatorias.

No se acredita seguridad instalada, conformidad normativa completa ni selección tecnológica definitiva.

Cambios en GitHub

**0**

Experimentos ejecutados

**0**

Registros AR cerrados

**0**

Reducciones de alcance propuestas

**0**

### **Recomendación al Orquestador Principal**

Admitir ET06-COMP-A y ET06-COMP-B al registro de composiciones tecnológicas candidatas, conservando sus condiciones y reservas.

No recomendaría una reconstrucción integral de QAP únicamente por motivos de seguridad. Sí recomiendo reconstruir selectivamente los componentes que gobiernan autoridad, secretos, procesos, evidencia y distribución, preservando los mecanismos existentes cuya reutilización pueda acreditarse.

El objetivo debe ser que QAP resulte seguro por la arquitectura efectiva de sus fronteras, y no porque el HOST coopere voluntariamente, porque sus clientes respeten instrucciones o porque sus interfaces oculten operaciones peligrosas.

**Estado de entrega:** evaluación documental ET-06 presentada al Orquestador, condicionada por las reservas de exhaustividad y calificación declaradas.

No se autoriza implementación, WBS, instalación, experimentación, apertura G0/G1, acceso empresarial, migración ni selección irreversible.

**Fin del informe ET-06.**
