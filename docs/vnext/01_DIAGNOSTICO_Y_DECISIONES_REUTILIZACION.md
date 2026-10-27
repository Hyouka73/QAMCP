# QAMCP vNext — Diagnóstico de Arquitectura Existente y Decisiones de Reutilización o Reemplazo

- **Documento:** `01_DIAGNOSTICO_Y_DECISIONES_REUTILIZACION.md`
- **Rama:** `feat/qap-vnext-architecture`
- **Autor / Rol:** Principal Software Architect y Teamwork Lead
- **Fecha:** Octubre 2026
- **Estado:** Propuesta Técnica y Dictamen de Arquitectura (Etapa 0)
- **Referencias:** `docs/vnext/REQUISITOS_Y_DECISIONES.md`, `reports/diagnostic_audit_2026/00_RESUMEN_EJECUTIVO.md` a `04_PLAN_INTERVENCION_Y_WBS.md`.

---

## 1. Resumen de Evaluación de la Arquitectura Actual (v2.1)

El análisis forense y la auditoría diagnóstica previa realizada sobre el monorepo `Hyouka73/QAMCP` en su rama `develop` confirmaron que la plataforma cuenta con una base de ingeniería madura (68.4% de cumplimiento estricto del WBS original, con 512 pruebas unitarias pasando en 7 suites). No obstante, para cumplir los objetivos estratégicos de **QAMCP vNext** (autonomía máxima [D-001], no modificación del código bajo prueba [D-002], políticas por entorno [D-003], orquestación híbrida [D-004], memoria unificada local SQLite y self-hosted PostgreSQL [D-005], descubrimiento black-box [D-006], aislamiento de sesiones [D-007], asesoría interactiva al desarrollador [D-008] y distribución npx-first [D-009]), la arquitectura actual presenta cuellos de botella estructurales severos.

### Principales Limitaciones Detectadas

1. **Cuello de Botella del Almacenamiento Plano (YAML/JSON en Disco):**
   - `@qap/knowledge` depende de la lectura y parseo recursivo de archivos planos (`context.yaml`, `rules.yaml`, `prereqs.yaml`, `selectors.json`, `TC-*.yaml`).
   - El benchmark empírico demostró que el parseo de YAML es **234.29 veces más lento** que JSON nativo (1,288.6 µs frente a 5.5 µs por operación).
   - La latencia de disco para 200 operaciones en Windows/POSIX asciende a **303.86 ms en YAML plano** frente a **1.69 ms en SQLite WAL** (una penalización de 179x).
   - Ausencia de capacidades de búsqueda léxica/FTS: `qap search` y las consultas MCP escanean directorios completos en O(N).
2. **Sobrecarga Crítica de Contexto y Tokens en el Protocolo MCP:**
   - Al carecer de un motor de consulta estructurado en la capa de conocimiento, el servidor MCP transfiere archivos JSON/YAML íntegros al cliente LLM (ej. transferir `selectors.json` consume ~1,850 tokens, mientras que una consulta SQLite indexada consume ~110 tokens, representando un desperdicio del 94% de la ventana de contexto).
3. **Monolito Procedural en el Servidor MCP (`server.ts` God-Object):**
   - `packages/mcp/src/server.ts` cuenta con **6,091 líneas de código**, estructuradas bajo un switch-case monolítico que gestiona 18 herramientas diferentes.
   - Tiene 9 reglas de ESLint suprimidas en su encabezado (`no-explicit-any`, `no-unsafe-assignment`, etc.), impidiendo la verificación formal de tipos.
   - Varias herramientas clave de ejecución (`qap_plan`, `qap_test`) devuelven respuestas estáticas simuladas (`estado: 'en_desarrollo'`), rompiendo la promesa de una plataforma autónoma operable vía MCP.
4. **Dependencias Nativas Problemáticas para Distribución `npx`:**
   - La inclusión de `keytar` en `@qap/auth` introduce una dependencia nativa de compilación C++ (`node-gyp`), requiriendo herramientas de compilación del sistema operativo (Python, Visual Studio Build Tools, libsecret-dev). Esto es incompatible con una distribución `npx` zero-config (D-009).
5. **Acoplamiento Fuerte a Repositorios Locales de Código:**
   - El diseño v2.1 presupone que QAMCP se ejecuta en la misma máquina y carpeta donde reside el código fuente del proyecto (`repo-map.json`, escaneo estático de código, adapters de git). Esto entra en conflicto directo con el requerimiento de descubrimiento black-box (D-006), donde QAMCP debe operar descubriendo la aplicación a través de la red/navegador sin acceso forzoso a los repositorios fuente.

---

## 2. Matriz Detallada de Decisiones: Conservar, Modificar o Reemplazar

Conforme a la directiva D-010 y a la regla de no proteger código únicamente por costos hundidos, se detalla el dictamen por componente:

| Paquete / Componente | Estado Actual | Veredicto vNext | Justificación Técnica y Arquitectónica |
|:---|:---|:---:|:---|
| **`@qap/shared`** | Tipos TypeScript, esquemas AJV, interfaces base y utilitarios comunes. | **CONSERVAR Y MODIFICAR** | La arquitectura de contratos de `@qap/shared` es sólida y reutilizable. Se deben conservar las definiciones de errores, logs y esquemas base. Se deben **modificar** los esquemas para dar soporte a las nuevas entidades de conocimiento unificado (estados de certeza: `observed`, `inferred`, `confirmed`, `pending_review`), metadatos de procedencia, modelos del QA Advisor y estructuras de políticas por entorno. |
| **`@qap/knowledge` (Almacenamiento Plano)** | `file-storage.ts`, `proper-lockfile`, `definitions-loader.ts`. | **REEMPLAZAR** | El almacenamiento en archivos planos `.yaml`/`.json` dispersos en disco coordinados con `proper-lockfile` es el principal cuello de botella de latencia y tokens del sistema. Se reemplaza por un nuevo subsistema de almacenamiento basado en contratos `IKnowledgeStore`, con implementación local en `node:sqlite` (SQLite WAL nativo) y soporte self-hosted en PostgreSQL. |
| **`@qap/knowledge` (Grafos y Hashing)** | `dependency-graph.ts`, `cycle-detector.ts`, `semantic-hasher.ts`. | **CONSERVAR Y MODIFICAR** | Los algoritmos deterministas de grafos DAG (detección de ciclos, ordenamiento topológico de Kahn) y el generador de hashes semánticos SHA-256 son excelentes y cuentan con 100% de cobertura de pruebas. Se conservan sus algoritmos, pero se **modifican sus adaptadores** para operar sobre las entidades relacionales de la memoria SQLite en memoria/disco en lugar de parsear archivos planos. |
| **`@qap/knowledge` (Update Guard & Backups)** | `update-guard.ts`, `module-backup-manager.ts`. | **MODIFICAR** | Diseñados originalmente para proteger archivos YAML con el flag `manually_edited: true`. Se deben adaptar para proteger entidades de conocimiento en la base de datos relacional y gestionar backups transaccionales (snapshots SQLite y exportaciones JSON) en lugar de copias físicas de archivos en `.qa/backups/`. |
| **`@qap/engine` (Lógica de Entrevista y Preguntas)** | `interview-engine.ts`, `onboarding-interview.ts`, `pregunta.ts`. | **CONSERVAR Y MODIFICAR** | El protocolo de entrevistas interactivas y la máquina de estados de `pregunta.ts` (emisión protegida de una pregunta por turno) funcionan correctamente y tienen alta cobertura. Se conservan, pero se **desacoplan del filesystem plano** (`lifecycle.json`, `views/default`) para interactuar directamente con el nuevo motor de memoria y estados de certeza. |
| **`@qap/engine` (Gap Report y Scoping Gate)** | `gap-report.ts`, `scoping-auth-gate.ts`, `engine.ts`. | **MODIFICAR** | Se conservan los principios de detección de brechas funcionales, pero se reconfiguran para alimentar el nuevo **QA Advisor** (D-008), permitiendo evaluar la cobertura de pruebas requerida ante cambios funcionales o nuevas rutas descubiertas. |
| **`@qap/auth` (Gestión de Credenciales)** | `auth-manager.ts`, `profiles-store.ts`, `session-store.ts`, dependencias `keytar`. | **MODIFICAR** | Eliminar la dependencia obligatoria de `keytar`. Implementar un mecanismo de almacenamiento de credenciales seguro y portable basado en `node:crypto` (cifrado simétrico AES-256-GCM con clave derivada de variable de entorno o contraseña maestra local). Mantener separación estricta entre credenciales, sesiones de navegador (cookies/localStorage) y el conocimiento del sistema (D-007). |
| **`@qap/playwright-adapter`** | `adapter.ts`, `screenshots.ts` con PII Masking. | **CONSERVAR Y EXTENDER** | Código de excelente calidad técnica y cobertura. El enmascaramiento de PII en capturas de pantalla es obligatorio para cumplimiento de privacidad. Se conserva íntegramente y se extiende para capturar eventos de red y telemetría de respuestas HTTP durante el descubrimiento black-box. |
| **`@qap/playwright-runner`** | `runner.ts`, `session-resolver.ts`, `actions/` (click, fill, wait-for, etc.), `interpolator.ts`. | **CONSERVAR Y MODIFICAR** | Núcleo de ejecución de pruebas. Se conservan las acciones atómicas Playwright y la interpolación de variables. Se modifica `runner.ts` para eliminar la dependencia de `LockManager` sobre disco plano y soportar la orquestación autónoma híbrida (D-004), inyección de perfiles limpios y ejecución no destructiva en entornos de producción (D-002, D-003). |
| **`@qap/reporter`** | `sqlite-client.ts`, `html-report.ts`, `junit-report.ts`, `telemetry-server.ts`. | **CONSERVAR Y MODIFICAR** | Ya utiliza `node:sqlite` para telemetría de ejecución. Se conserva y se **unifica la capa de persistencia** para que el Knowledge Engine y el Reporter compartan la infraestructura de base de datos relacional. Se modifica `graph-builder.ts` para que consulte el grafo en SQLite en microsegundos en lugar de releer el filesystem. |
| **`@qap/git-adapter`** | `git-adapter.ts` (diff testing, commit tracking). | **CONSERVAR COMO EXTENSIÓN OPCIONAL** | Mantener como módulo desacoplado. De acuerdo con D-005 y D-006, Git deja de ser el medio primario de almacenamiento u origen obligatorio de datos; se utiliza únicamente cuando el proyecto evaluado dispone de repositorio local accesible para acelerar el cálculo de impactos (diff testing). |
| **`@qap/mcp` (`server.ts` Monolítico)** | Servidor MCP monolítico de 6,091 líneas con switch procedural y mocks. | **REEMPLAZAR** | Debe reemplazarse la implementación interna de `server.ts`. Se mantiene el protocolo MCP y la firma pública de las herramientas (`qap_*`) para garantizar compatibilidad con clientes existentes, pero el servidor se refactoriza a un despachador declarativo modular (`handlers/*.ts`), con tipado estricto, conexión al runner real (eliminando mocks de `qap_plan` y `qap_test`) y soporte stdio/SSE. |
| **`@hyouka73/qap-cli`** | CLI basado en cac/commander con prompts interactivos. | **MODIFICAR Y REORIENTAR A NPX** | Se debe reorientar el CLI para ser el paquete principal distribuible vía `npx` (`npx @hyouka73/qap-mcp`), con empaquetado zero-config mediante `tsup` (inlining de dependencias internas, sin dependencias nativas externas). |

---

## 3. Justificación de los Reemplazos Críticos

### Reemplazo 1: Abandono del Filesystem Plano en favor de SQLite WAL / PostgreSQL

- **Motivo de rendimiento:** El microbenchmark empírico de la auditoría previa confirmó que la lectura de entidades mediante SQLite WAL es **179 veces más rápida** que leer archivos YAML (1.69 ms vs 303.86 ms). La escritura transaccional es **109 veces más rápida** (1.37 ms vs 149.71 ms).
- **Motivo de consumo de tokens:** Las herramientas MCP actuales leen documentos completos de disco. Una consulta SQLite indexada o FTS5 recupera exactamente los atributos o selectores requeridos, reduciendo el consumo de tokens en un **94.05%** (de 1,850 tokens a 110 tokens en consultas típicas).
- **Motivo de consistencia y concurrencia:** El uso de `proper-lockfile` en Windows y entornos de integración continua (CI) presenta fallos de colisión bajo procesos concurrentes (retries: 0 en la implementación actual). SQLite con WAL (`Write-Ahead Logging`) soporta múltiples lectores concurrentes y un escritor sin bloqueos de filesystem a nivel de archivo.
- **Cumplimiento de D-005:** Proporciona una ruta natural para soportar modo local con SQLite (`node:sqlite` nativo) y modo self-hosted multi-tenant con PostgreSQL bajo la misma interfaz abstracta de almacenamiento.

### Reemplazo 2: Desmantelamiento del Monolito `server.ts` en `@qap/mcp`

- **Motivo de mantenibilidad y calidad:** Mantener un archivo de 6,091 líneas con 9 supresiones de reglas de TypeScript y un switch procedural de 5,000 líneas bloquea cualquier esfuerzo de desarrollo concurrente entre múltiples agentes o ingenieros. Cualquier cambio en una herramienta genera conflictos de merge masivos.
- **Motivo de completitud funcional:** Las herramientas `qap_plan` y `qap_test` en v2.1 devuelven respuestas estáticas quemadas (`en_desarrollo`). Una plataforma autónoma debe ser capaz de planificar y ejecutar pruebas reales directamente desde el protocolo MCP.
- **Arquitectura de reemplazo:** Arquitectura de *Tool Handlers* independientes:
  ```
  packages/mcp/src/
  ├── server.ts                 # Bootstrap liviano (<150 líneas): registro y transporte
  ├── registry.ts               # Registro declarativo de herramientas y esquemas
  └── handlers/
      ├── status-handler.ts
      ├── discovery-handler.ts
      ├── advisor-handler.ts
      ├── test-handler.ts
      └── ...
  ```

### Reemplazo 3: Eliminación de `keytar` como Dependencia Obligatoria

- **Motivo de distribución zero-config (D-009):** `keytar` requiere enlace con bibliotecas nativas de C++ del sistema operativo. Si un usuario o pipeline ejecuta `npx @hyouka73/qap-mcp` en una máquina sin Visual C++ Redistributable / Python (Windows) o sin `libsecret-1-dev` (Linux Docker/CI), la instalación o ejecución de `npx` falla de inmediato.
- **Solución vNext:** Utilizar criptografía simétrica estándar del módulo nativo `node:crypto` (AES-256-GCM con PBKDF2), garantizando portabilidad absoluta en 100% de las plataformas sin necesidad de compilación nativa. Si `keytar` está disponible opcionalmente, puede conectarse como provider secundario sin ser un requisito bloqueante.

---

## 4. Estado de las Decisiones en este Documento

- **Decisiones confirmadas y adoptadas:** D-001 a D-010 (documentadas en `docs/vnext/REQUISITOS_Y_DECISIONES.md`).
- **Recomendaciones de arquitectura de este diagnóstico:**
  1. Reemplazar `file-storage.ts` por `SqliteKnowledgeAdapter` como motor predeterminado.
  2. Modularizar `server.ts` en handlers especializados para permitir trabajo concurrente de agentes.
  3. Reemplazar `keytar` por `node:crypto` AES-256-GCM en `@qap/auth`.
  4. Consolidar el bundle de distribución npx mediante `tsup` con dependencias internas embebidas.
- **Decisiones pendientes de validación con el responsable de producto:**
  1. Definición exacta de las credenciales maestras para el cifrado AES-256-GCM en modo headless/CI.
  2. Política final de exportación de snapshots (formato JSON unificado vs paquete zip/sqlite).
