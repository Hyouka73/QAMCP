# QAMCP vNext — Diagnóstico de Arquitectura Existente y Decisiones de Reutilización o Reemplazo

- **Documento:** `01_DIAGNOSTICO_Y_DECISIONES_REUTILIZACION.md`
- **Rama:** `feat/qap-vnext-architecture`
- **Autor / Rol:** Principal Software Architect y Teamwork Lead
- **Fecha:** Octubre 2026 (Revisión Arquitectónica Profunda — Etapa 0 Corregida)
- **Estado:** Propuesta Técnica y Dictamen de Arquitectura Actualizado (Autorización Condicionada VNEXT-001)
- **Referencias:** `docs/vnext/REQUISITOS_Y_DECISIONES.md`, Decisiones D-001 a D-015.

---

## 1. Resumen de Evaluación de la Arquitectura Actual (v2.1)

El análisis forense y la auditoría diagnóstica integral sobre el monorepo `Hyouka73/QAMCP` en su rama `develop` confirmaron que la plataforma cuenta con una base de código funcionalmente madura (68.4% de cumplimiento estricto del WBS original, con 512 pruebas unitarias pasando en 7 suites). 

Sin embargo, frente a los requerimientos de **QAMCP vNext** (autonomía operativa [D-001], no modificación del código bajo prueba [D-002], políticas por entorno [D-003], orquestación híbrida [D-004], memoria unificada local SQLite con self-hosted PostgreSQL opcional [D-005], descubrimiento black-box [D-006], aislamiento de sesiones [D-007], asesoría interactiva al desarrollador [D-008], distribución npx-first [D-009], separación epistemológica [D-011], migración crítica de `manually_edited` [D-012], dimensiones contextuales [D-013], admisión de resultados indeterminados [D-014] y distinción de archivos versionados vs locales [D-015]), la arquitectura actual presenta cuellos de botella y restricciones que impiden el funcionamiento autónomo de extremo a extremo.

### Principales Limitaciones Detectadas en Escenarios Operativos de QA

1. **Cuello de Botella del Almacenamiento Plano (YAML/JSON en Disco):**
   - `@qap/knowledge` depende de la lectura, serialización y parseo de múltiples archivos planos (`context.yaml`, `rules.yaml`, `prereqs.yaml`, `selectors.json`, `TC-*.yaml`).
   - En suites de prueba con múltiples módulos y vistas, la lectura secuencial de archivos en disco genera retrasos acumulados en la resolución de selectores y reglas de negocio, afectando la fluidez del ciclo de prueba.
   - Ausencia de capacidades de búsqueda léxica/FTS: `qap search` y las consultas MCP escanean directorios completos en O(N) buscando cadenas de texto en memoria.
2. **Sobrecarga de Contexto en el Protocolo MCP:**
   - Al carecer de un motor de consulta estructurado en la capa de conocimiento, el servidor MCP transfiere archivos JSON/YAML íntegros al cliente LLM (ej. transferir un diccionario `selectors.json` completo con decenas de selectores en lugar de resolver puntualmente el selector requerido para la acción inmediata). Esto degrada la ventana de contexto y aumenta los tiempos de respuesta del modelo.
3. **Monolito Procedural en el Servidor MCP (`server.ts` God-Object):**
   - `packages/mcp/src/server.ts` cuenta con **6,091 líneas de código**, estructuradas bajo un switch-case monolítico que gestiona 18 herramientas diferentes.
   - Tiene 9 reglas de ESLint suprimidas en su encabezado (`no-explicit-any`, `no-unsafe-assignment`, etc.), impidiendo la verificación formal de tipos en CI.
   - Varias herramientas clave de ejecución (`qap_plan`, `qap_test`) devuelven respuestas estáticas simuladas (`estado: 'en_desarrollo'`), rompiendo la promesa de una plataforma autónoma operable vía MCP.
4. **Fragilidad de Instalación por Dependencias Nativas (`keytar`):**
   - La inclusión de `keytar` en `@qap/auth` introduce una dependencia binaria C++ (`node-gyp`), requiriendo herramientas de compilación del sistema operativo (Python, Visual Studio Build Tools, libsecret-dev). Esto es incompatible con una distribución `npx` zero-config (D-009) en entornos limpios o contenedores CI.
5. **Acoplamiento al Código Fuente de la Aplicación:**
   - El diseño v2.1 presupone que QAMCP se ejecuta en la misma máquina y carpeta donde reside el código fuente del proyecto (`repo-map.json`, escaneo estático de código, adapters de git). Esto entra en conflicto directo con el requerimiento de descubrimiento black-box (D-006), donde QAMCP debe operar descubriendo la aplicación a través de la red/navegador sin acceso obligatorio a los repositorios fuente.

---

## 2. Matriz Detallada de Decisiones: Conservar, Modificar o Reemplazar

Conforme a la directiva D-010 y a la regla de no proteger código únicamente por costos hundidos, se detalla el dictamen por componente:

| Paquete / Componente | Estado Actual | Veredicto vNext | Justificación Técnica y Arquitectónica |
|:---|:---|:---:|:---|
| **`@qap/shared`** | Tipos TypeScript, esquemas AJV, interfaces base y utilitarios comunes. | **CONSERVAR Y EVOLUCIONAR** | Conservar utilitarios de validación y base de errores. Tratar las definiciones de entidades de conocimiento como un **modelo de dominio en validación empírica**, incorporando la separación epistemológica formal (observaciones, inferencias, requisitos esperados y verificaciones de conformidad), enriquecimiento contextual (aplicaciones, entornos, roles, permisos, prerrequisitos, sesiones, políticas de limpieza de navegador y evidencias multimodales) y admisión explícita de diagnósticos indeterminados (`indeterminate`). |
| **`@qap/knowledge` (Almacenamiento Plano)** | `file-storage.ts`, `proper-lockfile`, `definitions-loader.ts`. | **REEMPLAZAR** | El almacenamiento en archivos planos `.yaml`/`.json` dispersos en disco coordinados con `proper-lockfile` es el principal cuello de botella del sistema. Se reemplaza por un nuevo subsistema de persistencia basado en el puerto `IKnowledgeStore`, con implementación local en `node:sqlite` (SQLite WAL nativo) y soporte self-hosted opcional en PostgreSQL. |
| **`@qap/knowledge` (Grafos y Hashing)** | `dependency-graph.ts`, `cycle-detector.ts`, `semantic-hasher.ts`. | **CONSERVAR Y ADAPTAR** | Los algoritmos deterministas de grafos DAG (detección de ciclos, ordenamiento topológico de Kahn) y el generador de hashes semánticos SHA-256 son excelentes y cuentan con 100% de cobertura de pruebas. Se conservan sus algoritmos, adaptándolos para operar sobre las entidades de memoria unificada en lugar de parsear archivos planos. |
| **`@qap/knowledge` (Update Guard & Backups)** | `update-guard.ts`, `module-backup-manager.ts`. | **MODIFICAR** | Diseñados originalmente para proteger archivos YAML con el flag `manually_edited: true`. Se deben adaptar para proteger entidades de conocimiento en la base de datos relacional y gestionar backups transaccionales (snapshots SQLite y exportaciones JSON). **Corrección arquitectónica:** `manually_edited` no se convierte ciegamente en verdad absoluta (`confidence: 1.0`); se registra con procedencia `legacy_manual_edit`, alta precedencia inicial pero sujeto a revisión o marcado de `pending_review` ante cambios estructurales o contradicciones empíricas. |
| **`@qap/engine` (Lógica de Entrevista y Preguntas)** | `interview-engine.ts`, `onboarding-interview.ts`, `pregunta.ts`. | **CONSERVAR Y EXTENDER** | El protocolo de entrevistas interactivas y la máquina de estados de `pregunta.ts` (emisión protegida de una pregunta por turno) funcionan correctamente y tienen alta cobertura. Se conservan y se integran como el canal de diálogo interactivo del **QA Advisor** (D-008), desacoplándolos del filesystem plano. |
| **`@qap/engine` (Gap Report y Scoping Gate)** | `gap-report.ts`, `scoping-auth-gate.ts`, `engine.ts`. | **MODIFICAR** | Se conservan los principios de detección de brechas funcionales, pero se reconfiguran para alimentar el motor de asesoría QA, permitiendo calcular el blast radius y el impacto de cambios antes de la ejecución de pruebas. |
| **`@qap/auth` (Gestión de Credenciales)** | `auth-manager.ts`, `profiles-store.ts`, `session-store.ts`, dependencias `keytar`. | **REEVALUAR Y ESTRUCTURAR EN CAPAS (PENDIENTE DE VERIFICACIÓN)** | No sustituir ingenuamente `keytar` por una variable simple. Se adopta una **estrategia de bóveda criptográfica escalonada**: Tier 1 con Keychain del SO (Keytar opcional si está disponible), Tier 2 con AES-256-GCM + PBKDF2 y clave maestra provista en entorno para CI/contenedores, y Tier 3 efímero en memoria para ejecuciones npx puntuales. Separación estricta entre credenciales, sesiones de navegador y memoria de conocimiento (D-007). *No se implementa todavía: pendiente de validación empírica en Hito 1*. |
| **`@qap/playwright-adapter`** | `adapter.ts`, `screenshots.ts` con PII Masking. | **CONSERVAR Y EXTENDER** | Código de excelente calidad técnica y cobertura. El enmascaramiento de PII en capturas de pantalla es obligatorio para cumplimiento de privacidad. Se conserva íntegramente y se extiende para capturar eventos de red y telemetría de respuestas HTTP durante el descubrimiento black-box. |
| **`@qap/playwright-runner`** | `runner.ts`, `session-resolver.ts`, `actions/` (click, fill, wait-for, etc.), `interpolator.ts`. | **CONSERVAR Y EXTENDER** | Núcleo de ejecución de pruebas. Se conservan las acciones atómicas Playwright y la inyección de `storageState`. Se modifica `runner.ts` para soportar la orquestación autónoma híbrida (D-004), perfiles limpios y ejecución no destructiva en entornos protegidos (D-002, D-003). |
| **`@qap/reporter`** | `sqlite-client.ts`, `html-report.ts`, `junit-report.ts`, `telemetry-server.ts`. | **CONSERVAR Y MODIFICAR** | Ya utiliza `node:sqlite` para telemetría de ejecución. Se conserva y se unifica la infraestructura de base de datos relacional para telemetría y conocimiento. Se modifica `graph-builder.ts` para que consulte el grafo en SQLite en lugar de releer el filesystem. |
| **`@qap/git-adapter`** | `git-adapter.ts` (diff testing, commit tracking). | **CONSERVAR COMO EXTENSIÓN OPCIONAL** | Mantener como módulo desacoplado. De acuerdo con D-005 y D-006, Git deja de ser el medio primario de almacenamiento u origen obligatorio de datos; se utiliza únicamente cuando el proyecto evaluado dispone de repositorio local accesible para acelerar el cálculo de impactos (diff testing). |
| **`@qap/mcp` (`server.ts` Monolítico)** | Servidor MCP monolítico de 6,091 líneas con switch procedural y mocks. | **REEMPLAZAR** | Debe reemplazarse la implementación interna de `server.ts`. Se mantiene el protocolo MCP y la firma pública de las herramientas (`qap_*`) para garantizar compatibilidad con clientes existentes, pero el servidor se refactoriza a un despachador declarativo modular (`handlers/*.ts`), con tipado estricto, conexión al runner real (eliminando mocks de `qap_plan` y `qap_test`) y soporte stdio/SSE. |
| **`@hyouka73/qap-cli`** | CLI basado en cac/commander con prompts interactivos. | **MODIFICAR Y REORIENTAR A NPX** | Se debe reorientar el CLI para ser el paquete principal distribuible vía `npx` (`npx @hyouka73/qap-mcp`), con empaquetado zero-config mediante `tsup` (inlining de dependencias internas, sin dependencias nativas obligatorias). |

---

## 3. Justificación de los Reemplazos Críticos

### Reemplazo 1: Abandono del Filesystem Plano en favor de SQLite WAL / PostgreSQL

- **Criterio de rendimiento en escenarios reales de QA:** En una suite representativa de QA con 40 módulos y más de 200 entidades (casos, reglas, selectores), el tiempo de lectura secuencial y deserialización de archivos YAML genera pausas acumuladas perceptibles. La persistencia en SQLite con WAL (`node:sqlite` nativo) permite que la resolución de selectores, reglas de negocio y verificación de dependencias se complete en milisegundos, manteniendo la fluidez del navegador sin pausas de E/S.
- **Eficiencia en la entrega de contexto MCP:** Las herramientas MCP actuales leen documentos completos de disco. Una consulta SQLite indexada o FTS5 recupera exactamente los selectores o reglas del contexto inmediato, limitando la carga devuelta al LLM a la información indispensable y preservando la ventana de contexto.
- **Concurrencia segura:** El uso de `proper-lockfile` en Windows y entornos de CI presenta bloqueos ante procesos concurrentes. SQLite con WAL soporta múltiples lectores concurrentes y un escritor sin bloqueos de filesystem a nivel de archivo.
- **Cumplimiento de D-005:** Proporciona una ruta natural para soportar modo local con SQLite (`node:sqlite` nativo) y modo self-hosted opcional con PostgreSQL bajo la misma interfaz abstracta de almacenamiento.

### Reemplazo 2: Desmantelamiento del Monolito `server.ts` en `@qap/mcp`

- **Mantenibilidad y calidad de código:** Mantener un archivo de 6,091 líneas con 9 supresiones de reglas de TypeScript y un switch procedural de 5,000 líneas bloquea el desarrollo modular y la verificación estricta de tipos.
- **Completitud funcional:** Las herramientas `qap_plan` y `qap_test` en v2.1 devuelven respuestas estáticas simuladas (`en_desarrollo`). Una plataforma autónoma debe ser capaz de planificar y ejecutar pruebas reales directamente desde el protocolo MCP.
- **Arquitectura de reemplazo:** Arquitectura de *Tool Handlers* independientes (`packages/mcp/src/handlers/*.ts`) coordinados por un despachador declarativo con validación estricta de esquemas.

### Reevaluación de `keytar`: Estrategia Criptográfica Escalonada (Tiered Vault) — Pendiente de Verificación

Reemplazar `keytar` de forma simplista con una clave fija o derivada de un hash de máquina local es inseguro. Por otra parte, imponer `keytar` como dependencia obligatoria rompe la experiencia zero-config de `npx` en entornos sin compiladores C++ o sin servicio de keychain.

Se adopta una **arquitectura de bóveda escalonada** (diseño conceptual, pendiente de verificación empírica previa a implementación):
1. **Tier 1 (Almacén del Sistema Operativo - Opcional):** Si `keytar` está compilado y disponible en el entorno, se utiliza el Credential Manager de Windows, Keychain de macOS o Secret Service de Linux.
2. **Tier 2 (Bóveda Cifrada AES-256-GCM + PBKDF2):** Si no hay keychain del SO (entornos headless, CI/CD, Docker), las credenciales se cifran en `.qamcp/vault.enc` utilizando AES-256-GCM con clave derivada mediante PBKDF2 (100,000 iteraciones con salt criptográfico), autenticada mediante variable de entorno segura (`QAP_VAULT_PASSPHRASE`).
3. **Tier 3 (Memoria Efímera):** Para ejecuciones puntuales de exploración donde no se desea persistir secretos, las credenciales se reciben interactivamente en memoria durante la sesión y se destruyen al finalizar.

---

## 4. Estado de las Decisiones en este Documento

- **Decisiones confirmadas y adoptadas:** D-001 a D-015 (documentadas en `docs/vnext/REQUISITOS_Y_DECISIONES.md`).
- **Recomendaciones de arquitectura validadas:**
  1. Reemplazar el almacenamiento de archivos planos por `SqliteKnowledgeAdapter` como motor local predeterminado.
  2. Modularizar `server.ts` en handlers especializados con registro declarativo.
  3. Adoptar la estrategia de bóveda criptográfica escalonada en `@qap/auth` sujeta a verificación previa.
  4. Mantener la distribución `npx-first` como producto principal; el despliegue self-hosted con PostgreSQL se preserva como adaptador complementario y opcional.
  5. Mantener la separación epistemológica formal entre observaciones, inferencias, requisitos y conformidades en todo el modelo de datos.
