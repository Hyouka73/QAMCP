# QAMCP vNext — Backlog Preliminar y WBS Desglosado

- **Documento:** `04_BACKLOG_Y_WBS_PRELIMINAR.md`
- **Rama:** `feat/qap-vnext-architecture`
- **Autor / Rol:** Principal Software Architect y Teamwork Lead
- **Fecha:** Octubre 2026 (Revisión Arquitectónica Profunda)
- **Estado:** Plan de Trabajo Desglosado en Micro-Tareas Actualizado (Etapa 0)
- **Referencias:** D-010 (Evolución documentada por etapas), D-001 a D-009.

---

## 1. Estructura General y Dependencias Reales entre Hitos

Conforme a la directiva **D-010** y la revisión de dependencias reales, el desarrollo no puede lanzarse en pistas completamente paralelas desde el día 1, ya que los paquetes comparten contratos de dominio e infraestructura de persistencia.

El trabajo se organiza en **6 Hitos Secuenciales**, habilitando el paralelismo únicamente dentro de cada hito cuando los contratos aguas arriba han sido estabilizados y verificados:

```mermaid
flowchart TD
    H0["Hito 0: Fundación de Contratos de Dominio<br/>(VNEXT-001)"] --> H1["Hito 1: Persistencia Local SQLite & Bóveda<br/>(VNEXT-002, VNEXT-003, VNEXT-004, VNEXT-018)"]
    H1 --> H2["Hito 2: Adquisición de Conocimiento Black-Box<br/>(VNEXT-006, VNEXT-007, VNEXT-008, VNEXT-009, VNEXT-010)"]
    H1 --> H3["Hito 3: Desacoplamiento Modular MCP<br/>(VNEXT-011, VNEXT-012, VNEXT-013, VNEXT-014)"]
    H2 --> H4["Hito 4: QA Advisor & Diagnóstico Autónomo<br/>(VNEXT-015, VNEXT-016, VNEXT-017)"]
    H3 --> H4
    H4 --> H5["Hito 5: Distribución npx-First y Empaquetado<br/>(VNEXT-019, VNEXT-020)"]
    H5 --> H6["Hito 6: Certificación E2E e Integración con Diego<br/>(VNEXT-021, VNEXT-022, VNEXT-023, VNEXT-024)"]
```

---

## 2. Catálogo Detallado de Micro-Tareas (WBS)

### Hito 0: Fundación de Contratos de Dominio

#### `VNEXT-001` — Definición del Modelo de Dominio y Contratos de Conocimiento en Validación Empírica
- **Paquetes afectados:** `@qap/shared`.
- **Dependencias:** Ninguna (Fundacional).
- **Riesgo:** Bajo.
- **Alcance:** Definir las interfaces TypeScript del modelo de dominio evolutivo: `CertaintyState`, `KnowledgeProvenance`, `Module`, `View`, `ActionTarget`, `BusinessRule`, `FlowScenario`, `DependencyEdge` y `Defect`. Este modelo no se fija definitivamente hasta validar su capacidad de representar funcionalidades, reglas y cambios en aplicaciones descubiertas sin código fuente.
- **Mecanismo de verificación:** `pnpm --filter @qap/shared test`. Validación de tipado estricto y serialización sin errores.
- **Criterios de aceptación:**
  - Tipos exportados formalmente en `@qap/shared`.
  - Soporta la representación explícita de evidencia multimodal (capturas, fragmentos HTTP, estados de certeza).
  - Cero dependencias binarias nativas.

---

### Hito 1: Persistencia Local SQLite y Bóveda Criptográfica

#### `VNEXT-002` — Contrato Formal `IKnowledgeStore` y Puerto de Persistencia
- **Paquetes afectados:** `@qap/knowledge`, `@qap/shared`.
- **Dependencias:** `VNEXT-001`.
- **Riesgo:** Bajo.
- **Alcance:** Crear la interfaz formal `IKnowledgeStore` en `@qap/knowledge/src/ports/knowledge-store.port.ts`, especificando métodos atómicos de lectura, escritura, transacciones, búsqueda léxica y telemetría.
- **Mecanismo de verificación:** Pruebas de contrato utilizando una implementación mock en memoria (`InMemoryKnowledgeStore.spec.ts`).
- **Criterios de aceptación:**
  - Cubre el 100% de operaciones CRUD de entidades, búsqueda de selectores, cálculo de dependencias y registro de ejecuciones.
  - Firma agnóstica del motor (sin referencias a SQL ni filesystem en la interfaz pública).

#### `VNEXT-003` — Adaptador de Persistencia SQLite Local (`SqliteKnowledgeAdapter`)
- **Paquetes afectados:** `@qap/knowledge`.
- **Dependencias:** `VNEXT-002`.
- **Riesgo:** Medio.
- **Alcance:** Implementar `SqliteKnowledgeAdapter` utilizando el módulo nativo `node:sqlite` (`DatabaseSync`). Configurar modo WAL, foreign keys y transacciones atómicas. Crear DDL de tablas y esquema de migraciones.
- **Mecanismo de verificación:** Suite de pruebas unitarias y de estrés en disco (`sqlite-knowledge-adapter.test.ts`): inserción, actualización, eliminación en cascada y verificación de integridad.
- **Criterios de aceptación:**
  - Operación exitosa en base de datos física (`.qamcp/knowledge.sqlite`) y en memoria (`:memory:`).
  - Cero dependencias nativas de npm (usa exclusivamente `node:sqlite`).
  - Resistencia a bloqueos y manejo de errores con rollbacks transaccionales garantizados.

#### `VNEXT-004` — Motor de Búsqueda FTS5 de Selectores y Atributos UI
- **Paquetes afectados:** `@qap/knowledge`.
- **Dependencias:** `VNEXT-003`.
- **Riesgo:** Bajo.
- **Alcance:** Crear tabla virtual FTS5 (`action_targets_fts`) y métodos de consulta parametrizada por coincidencia léxica, atributo o etiqueta de accesibilidad.
- **Mecanismo de verificación:** Escenario de prueba reproducible: consulta de selectores sobre un catálogo sintético de 200 elementos de UI simulando una aplicación empresarial compleja.
- **Criterios de aceptación:**
  - La resolución de selectores de una vista se completa sin retrasos perceptibles en la ejecución (< 50 ms por consulta).
  - El payload devuelto contiene únicamente los elementos coincidentes solicitados, evitando volcados masivos.

#### `VNEXT-018` — Bóveda Criptográfica Escalonada de Credenciales (Tiered Vault)
- **Paquetes afectados:** `@qap/auth`.
- **Dependencias:** `VNEXT-001`.
- **Riesgo:** Medio.
- **Alcance:** Implementar `TieredCredentialVault` que gestiona secretos bajo tres niveles: Tier 1 (Keychain del SO vía keytar si está disponible), Tier 2 (Cifrado AES-256-GCM + PBKDF2 en `.qamcp/vault.enc` autenticado con `QAP_VAULT_PASSPHRASE`), y Tier 3 (Memoria efímera para sesiones ad-hoc npx).
- **Mecanismo de verificación:** Tests unitarios evaluando el almacenamiento y recuperación en los tres niveles.
- **Criterios de aceptación:**
  - El sistema arranca y opera limpiamente sin fallar cuando `keytar` no está instalado en el sistema operativo.
  - Ninguna credencial en texto plano se escribe en base de datos ni en logs de telemetría (D-007).

---

### Hito 2: Adquisición de Conocimiento Black-Box First

#### `VNEXT-006` — Módulo de Reconocimiento Pasivo HTTP y Detección de Stack
- **Paquetes afectados:** `@qap/playwright-adapter`, `@qap/knowledge`.
- **Dependencias:** `VNEXT-001`, `VNEXT-003`.
- **Riesgo:** Bajo.
- **Alcance:** Implementar `ReconnaissanceService` para inspeccionar headers de seguridad, certificados SSL, tecnologías de frontend (React, Angular, Vue, Next.js), rutas robots.txt y sitemap sin mutaciones en el servidor.
- **Mecanismo de verificación:** Test unitario simulando respuestas HTTP diversas.
- **Criterios de aceptación:**
  - Identifica correctamente tecnologías y genera entidad de entorno en memoria con `status: 'observed'`.

#### `VNEXT-007` — Crawler Black-Box Dirigido con Playwright
- **Paquetes afectados:** `@qap/playwright-adapter`.
- **Dependencias:** `VNEXT-006`.
- **Riesgo:** Medio.
- **Alcance:** Construir `BlackBoxCrawler` capaz de navegar la aplicación en modo incógnito/perfil limpio, mapear rutas accesibles, menús laterales, enlaces, formularios y botones interactivos sin ejecutar mutaciones destructivas.
- **Mecanismo de verificación:** Test contra servidor web local mockeado con formularios, tablas y navegación SPA.
- **Criterios de aceptación:**
  - Extrae árbol de vistas y selectores deterministas sin lanzar excepciones no controladas.
  - Respeta políticas de entorno (`safe_domains`, `destructive_allowed: false`).

#### `VNEXT-008` — Interceptor de Tráfico de Red y Extracción de Endpoints
- **Paquetes afectados:** `@qap/playwright-adapter`.
- **Dependencias:** `VNEXT-007`.
- **Riesgo:** Bajo.
- **Alcance:** Capturar llamadas XHR/Fetch generadas por la UI durante la navegación pasiva, extrayendo endpoints, métodos HTTP, query params y códigos de respuesta típicos.
- **Mecanismo de verificación:** Test con llamadas Fetch interceptadas y parseadas a entidades de API en memoria.
- **Criterios de aceptación:**
  - Asocia automáticamente endpoints detectados a la vista activa correspondiente.
  - Enmascara tokens de autorización o passwords presentes en payloads.

#### `VNEXT-009` — Motor de Inferencia de Hipótesis y Asignación de Certeza
- **Paquetes afectados:** `@qap/knowledge`.
- **Dependencias:** `VNEXT-007`, `VNEXT-008`.
- **Riesgo:** Medio.
- **Alcance:** Algoritmo que procesa los datos extraídos por el crawler y genera entidades de Módulos, Vistas y Reglas con `certainty_state: 'inferred'`, calculando `confidence_score` empírico.
- **Mecanismo de verificación:** Test verificando la asignación coherente de scores (ej. 0.6 para elemento DOM visible, 0.85 si se correlaciona con endpoint de red).
- **Criterios de aceptación:**
  - Cada hipótesis queda vinculada a su evidencia técnica (procedencia, selector, captura o respuesta HTTP).

#### `VNEXT-010` — Sondas de Validación Activa No Destructiva
- **Paquetes afectados:** `@qap/playwright-adapter`, `@qap/knowledge`.
- **Dependencias:** `VNEXT-009`.
- **Riesgo:** Medio.
- **Alcance:** Ejecutor de sondas seguras (ej. presionar botón de envío con formulario vacío para disparar validaciones de campos requeridos; ingresar datos sintéticos inocuos en inputs de búsqueda).
- **Mecanismo de verificación:** Test funcional contra un formulario mock de login y registro.
- **Criterios de aceptación:**
  - Promueve hipótesis a `confidence_score >= 0.9` al corroborar mensajes de error esperados.
  - Aborta inmediatamente si detecta que la acción podría ser destructiva (D-003).

---

### Hito 3: Desacoplamiento Modular del Servidor MCP

#### `VNEXT-011` — Arquitectura de Handlers Declarativos para MCP
- **Paquetes afectados:** `@qap/mcp`.
- **Dependencias:** `VNEXT-001`, `VNEXT-002`.
- **Riesgo:** Medio.
- **Alcance:** Crear infraestructura de despachador declarativo (`src/dispatcher.ts`) e interfaz `IMcpToolHandler`. Eliminar supresión de reglas ESLint en `@qap/mcp`.
- **Mecanismo de verificación:** Test de registro y despacho de herramientas mockeando el SDK de MCP.
- **Criterios de aceptación:**
  - Reemplaza el switch-case monolítico por un mapa desacoplado de handlers.
  - Validación de esquemas de entrada y salida mediante tipos fuertemente tipados.

#### `VNEXT-012` — Migración de Handlers de Información y Estado (`status`, `clean`, `context`)
- **Paquetes afectados:** `@qap/mcp`.
- **Dependencias:** `VNEXT-011`, `VNEXT-003`.
- **Riesgo:** Bajo.
- **Alcance:** Implementar `status.handler.ts`, `clean.handler.ts` y `context.handler.ts` conectándolos directamente al nuevo `IKnowledgeStore`.
- **Mecanismo de verificación:** Replicar y pasar los tests existentes de ciclo de vida del servidor MCP (`p4-4-auth-lifecycle.test.ts`, etc.).
- **Criterios de aceptación:**
  - Respuestas compatibles 100% con los clientes actuales de MCP.

#### `VNEXT-013` — Handler de Descubrimiento Autónomo (`discovery.handler.ts`)
- **Paquetes afectados:** `@qap/mcp`.
- **Dependencias:** `VNEXT-011`, `VNEXT-009`.
- **Riesgo:** Medio.
- **Alcance:** Conectar la tool `qap_discover` con el crawler black-box, permitiendo al cliente MCP ordenar la exploración de una URL y devolver el resumen estructurado de hallazgos.
- **Mecanismo de verificación:** Test de integración MCP Stdio ejecutando descubrimiento sobre un servidor local de prueba.
- **Criterios de aceptación:**
  - La herramienta devuelve módulos y vistas descubiertas con sus niveles de confianza y advertencias de validación pendiente.

#### `VNEXT-014` — Conexión Real de `qap_plan` y `qap_test` (Eliminación de Mocks)
- **Paquetes afectados:** `@qap/mcp`, `@qap/playwright-runner`.
- **Dependencias:** `VNEXT-011`, `VNEXT-003`.
- **Riesgo:** Alto.
- **Alcance:** Eliminar las respuestas estáticas mockeadas (`estado: 'en_desarrollo'`). Conectar `qap_plan` con el planificador DAG y `qap_test` con `PlaywrightRunner`.
- **Mecanismo de verificación:** Ejecución E2E de una prueba real a través de una llamada JSON-RPC a `qap_test`.
- **Criterios de aceptación:**
  - `qap_test` ejecuta el navegador de forma autónoma, devuelve telemetría real (duración, pasos aprobados, capturas de error) y persiste el resultado en la base de datos.

---

### Hito 4: QA Advisor y Diagnóstico Autónomo

#### `VNEXT-015` — Motor de Cálculo de Impacto y Blast Radius
- **Paquetes afectados:** `@qap/engine`, `@qap/knowledge`.
- **Dependencias:** `VNEXT-003`, `VNEXT-009`.
- **Riesgo:** Medio.
- **Alcance:** Construir `ImpactAnalyzer` que, dado un cambio en una vista o módulo, recorra el DAG de dependencias para calcular el conjunto mínimo de pruebas afectadas aguas arriba y aguas abajo.
- **Mecanismo de verificación:** Test con grafo de 20 nodos y dependencias complejas verificando el ordenamiento topológico y aislamiento de componentes no impactados.
- **Criterios de aceptación:**
  - Retorna lista priorizada de flujos a ejecutar con justificación de impacto.

#### `VNEXT-016` — Implementación del Asesor Interactivo de QA (`qap_advisor`)
- **Paquetes afectados:** `@qap/engine`, `@qap/mcp`.
- **Dependencias:** `VNEXT-015`.
- **Riesgo:** Medio.
- **Alcance:** Construir el servicio de consultoría técnica interactiva (D-008) y exponer la tool `qap_advisor`. Analiza solicitudes del desarrollador, presenta el blast radius, sugiere alcances (funcional, límites, seguridad, regresión) y formula preguntas estructuradas cuando sea necesario.
- **Mecanismo de verificación:** Evaluación en suite de prueba para tres casos de uso: cambio menor de UI, nuevo endpoint de API y auditoría de regresión completa.
- **Criterios de aceptación:**
  - Guía al desarrollador mediante opciones claras sin generar muros de texto ni preguntas superfluas.

#### `VNEXT-017` — Clasificador Autónomo de Anomalías y Defectos
- **Paquetes afectados:** `@qap/engine`.
- **Dependencias:** `VNEXT-014`.
- **Riesgo:** Medio.
- **Alcance:** Motor de diagnóstico que analiza capturas de fallo, logs de red y mensajes de consola Playwright para clasificar el incidente en: `product_bug`, `environment_error`, `automation_flakiness` o `blocked_flow`.
- **Mecanismo de verificación:** Test con 4 tipos de fallos reproducidos artificialmente (error 500, error de timeout de red, selector no visible temporal, prerrequisito fallido).
- **Criterios de aceptación:**
  - Clasificación correcta al 100% en los 4 casos de prueba canónicos.
  - Generación de informe de reproducción con evidencia estructurada.

---

### Hito 5: Distribución `npx-First` y Portabilidad Cero-Config

#### `VNEXT-019` — Configuración de Empaquetado `tsup` Standalone
- **Paquetes afectados:** `@hyouka73/qap-cli`, `@qap/mcp`.
- **Dependencias:** `VNEXT-014`, `VNEXT-018`.
- **Riesgo:** Medio.
- **Alcance:** Configurar script de bundle con `tsup` que empaquete `@qap/*` dentro de un único artefacto ejecutable `dist/entrypoint.js`, listo para publicarse en npm.
- **Mecanismo de verificación:** Ejecución de `node dist/entrypoint.js --version` en un entorno sin carpetas de monorepo ni `node_modules` de desarrollo.
- **Criterios de aceptación:**
  - Bundle autocontenido sin resolución fallida de paquetes internos `workspace:*`.
  - Peso del bundle comprimido menor a 10 MB.

#### `VNEXT-020` — Comando de Inicialización y Auto-Configuración MCP
- **Paquetes afectados:** `@hyouka73/qap-cli`.
- **Dependencias:** `VNEXT-019`.
- **Riesgo:** Bajo.
- **Alcance:** Implementar `qap mcp register` / `npx @hyouka73/qap-mcp --register` para autodetectar clientes instalados (Claude Desktop, Cursor, Antigravity) y registrar la configuración MCP con cero intervención manual.
- **Mecanismo de verificación:** Test simulando archivos de configuración de Claude y Cursor.
- **Criterios de aceptación:**
  - Actualización limpia del JSON del cliente sin corromper configuraciones preexistentes.

---

### Hito 6: Certificación E2E e Integración con Diego

#### `VNEXT-021` — Suite de Pruebas E2E de Aceptación Black-Box
- **Paquetes afectados:** Monorepo completo.
- **Dependencias:** `VNEXT-014`, `VNEXT-016`, `VNEXT-020`.
- **Riesgo:** Medio.
- **Alcance:** Prueba integral de ciclo completo: descubrimiento de una app web local de prueba -> inferencia de hipótesis -> asesoría QA -> ejecución de test autónomo -> reporte de defecto clasificado.
- **Mecanismo de verificación:** Ejecución desatendida del flujo completo vía protocolo MCP.
- **Criterios de aceptación:**
  - Flujo completado de inicio a fin sin intervención manual obligatoria en rutas estándar.

#### `VNEXT-022` — Documentación Técnica de vNext y Manual de Migración
- **Paquetes afectados:** `docs/vnext/`.
- **Dependencias:** `VNEXT-021`.
- **Riesgo:** Bajo.
- **Alcance:** Guía de uso de la CLI, manual de integración para agentes LLM, especificación de contratos de bases de datos y manual de contribución para desarrolladores.
- **Criterios de aceptación:** Documentación exhaustiva en Markdown validada.

#### `VNEXT-023` — Sincronización y Validación Cruzada con `develop` (Diego)
- **Paquetes afectados:** Todos los paquetes compartidos.
- **Dependencias:** `VNEXT-021`.
- **Riesgo:** Alto.
- **Alcance:** Sesión de integración coordinada con Diego para fusionar avances de `develop` (rollback con SHA-256, inyección de storageState en PlaywrightRunner) asegurando que los 512 tests históricos continúen verdes.
- **Criterios de aceptación:** Cero regresiones en la suite unitaria de `develop`.

#### `VNEXT-024` — Verificación de Release y Despliegue Piloto en NPM
- **Paquetes afectados:** `@hyouka73/qap-cli`, `@qap/mcp`.
- **Dependencias:** `VNEXT-023`.
- **Riesgo:** Medio.
- **Alcance:** Ejecución de `pnpm release:check`, validación de tags y prueba de ejecución limpia mediante `npx` en una máquina virtual limpia.
- **Criterios de aceptación:** `npx @hyouka73/qap-mcp --help` y handshake MCP responden en menos de 1 segundo.
