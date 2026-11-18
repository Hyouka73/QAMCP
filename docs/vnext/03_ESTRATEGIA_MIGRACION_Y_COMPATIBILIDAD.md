# QAMCP vNext — Estrategia de Migración y Compatibilidad

- **Documento:** `03_ESTRATEGIA_MIGRACION_Y_COMPATIBILIDAD.md`
- **Rama:** `feat/qap-vnext-architecture`
- **Autor / Rol:** Principal Software Architect y Teamwork Lead
- **Fecha:** Octubre 2026 (Revisión Arquitectónica Profunda — Etapa 0 Corregida)
- **Estado:** Propuesta Técnica y Plan de Transición Actualizado (Autorización Condicionada VNEXT-001)
- **Referencias:** `docs/vnext/REQUISITOS_Y_DECISIONES.md`, Decisiones D-001 a D-015.

---

## 1. Principio Rector: Transición Suave y Riesgo Cero

La evolución hacia QAMCP vNext no debe ser una ruptura abrupta ("big bang") que invalide el trabajo previamente realizado ni que rompa la compatibilidad con clientes MCP o proyectos que ya cuentan con conocimiento en formato plano `.qa/`.

Se establecen tres garantías fundamentales de migración:

1. **Invarianza de Datos (No-Destructividad):** Ningún archivo de conocimiento existente en disco (`.qa/definitions/`, `.qa/modules/`, `context.yaml`, `rules.yaml`) será eliminado ni sobrescrito destructivamente durante la migración.
2. **Compatibilidad Estricta de la Capa Externa MCP:** Las herramientas `qap_*` mantendrán sus firmas y esquemas de parámetros JSON-RPC para evitar romper la integración con clientes activos (Claude Desktop, Cursor, Antigravity, scripts de CI).
3. **Aislamiento Operativo respecto a `develop`:** Todo el desarrollo se mantiene confinado en `feat/qap-vnext-architecture`, evitando colisiones con los desarrollos activos de Diego.

---

## 2. Estrategia de Persistencia Dual y Adaptador Puente

Para permitir que el sistema funcione tanto con proyectos que aún utilizan el esquema de archivos planos como con el nuevo motor de base de datos relacional indexada, se implementa el **Patrón Adaptador** sobre el puerto `IKnowledgeStore`.

```mermaid
flowchart TD
    A["Cliente / Caso de Uso (QA Advisor, Discovery, Runner)"] --> B["Puerto: IKnowledgeStore"]
    B --> C{"Selector de Motor"}
    C -->|QAP_STORAGE_ENGINE='sqlite' (vNext Defecto)| D["SqliteKnowledgeAdapter (node:sqlite WAL)"]
    C -->|QAP_STORAGE_ENGINE='legacy'| E["LegacyFileSystemAdapter (.qa/ *.yaml, *.json)"]
    C -->|QAP_STORAGE_ENGINE='postgres' (Self-Hosted Opcional)| F["PostgresKnowledgeAdapter (pg Pool)"]
    D -.->|Migración Unidireccional Automática| E
```

### 2.1 Ingesta Transparente de Proyectos Existentes

Cuando QAMCP vNext se inicializa sobre un repositorio o proyecto que ya contiene una estructura `.qa/` tradicional:

1. El sistema detecta la presencia de `.qa/definitions/` o `.qa/modules/`.
2. Si el archivo local `.qamcp/knowledge.sqlite` no existe aún, se activa automáticamente el pipeline de **Ingesta y Sincronización Inicial**:
   - Lee y valida mediante esquemas AJV los archivos `context.yaml`, `rules.yaml`, `selectors.json`, `prereqs.yaml`.
   - Inserta las entidades en las tablas relacionales de SQLite preservando su procedencia (`source: 'legacy_filesystem_import'`).
   - **Corrección Arquitectónica Obligatoria (D-012):** Las reglas marcadas con `manually_edited: true` (`UpdateGuard`) **NO se promueven ciegamente a certeza absoluta (`confidence: 1.0`)**. Se registran con procedencia `source: 'legacy_manual_edit'`, prioridad superior a inferencias automáticas no revisadas, pero con un nivel de confianza calibrado (ej. 0.85-0.90) y sujetas a revisión (`pending_review`) ante evidencia contradictoria observada en la aplicación actual o cambios estructurales.
   - Crea los índices de búsqueda FTS5.
3. El proceso se completa en milisegundos en la primera ejecución, permitiendo una experiencia de usuario inmediata.
4. Los archivos originales permanecen intactos en disco.

---

## 3. Compatibilidad de la Capa MCP (Transición desde `server.ts`)

La sustitución del monolito procedural `packages/mcp/src/server.ts` (6,091 líneas) se ejecutará mediante una estrategia de **Fachada Modular**:

### 3.1 Mapeo de Herramientas Existentes a Handlers vNext

| Tool MCP | Estado en v2.1 | Estrategia vNext | Handler Destino |
|:---|:---|:---|:---|
| `qap_status` | Funcional (lee filesystem) | Mantener interfaz; consultar SQLite | `handlers/status.handler.ts` |
| `qap_init` | Funcional (crea carpetas) | Mantener interfaz; inicializar DB local | `handlers/init.handler.ts` |
| `qap_clean` | Funcional (borra residuos) | Mantener interfaz; limpiar DB/cache | `handlers/clean.handler.ts` |
| `qap_auth_add` / `qap_auth_list` | Usa `keytar` | Migrar a Bóveda Criptográfica Escalonada | `handlers/auth.handler.ts` |
| `qap_context_set` / `ingest` | Escribe en YAML | Escribir en DB con respaldo exportable | `handlers/context.handler.ts` |
| `qap_discover` | Parcial / heurístico | Conectar a Discovery Black-Box | `handlers/discovery.handler.ts` |
| `qap_plan` | **Mock simulado** | **Conectar al Autonomous Planner real** | `handlers/plan.handler.ts` |
| `qap_test` | **Mock simulado** | **Conectar al PlaywrightRunner real** | `handlers/test.handler.ts` |
| `qap_validate` | Valida esquemas | Validar contra schemas + integridad DB | `handlers/validate.handler.ts` |
| `qap_report` | Genera HTML/JUnit | Consultar telemetría de DB unificada | `handlers/report.handler.ts` |
| `qap_prune` | Pausada en backlog | Integrar algoritmo de poda de historial | `handlers/prune.handler.ts` |
| `qap_rules_set` | Escribe en YAML | Guardar con control de certeza | `handlers/rules.handler.ts` |
| `qap_module_close` | Escribe en YAML/lifecycle | Transición atómica de estado en DB | `handlers/lifecycle.handler.ts` |
| **`qap_advisor`** | *Nueva herramienta vNext* | **Asesor interactivo de estrategias (D-008)** | `handlers/advisor.handler.ts` |

---

## 4. Análisis de Riesgos y Coordinación con Diego (`develop`)

### 4.1 Estado Actual del Trabajo de Diego en `develop`

La inspección de los commits recientes de Diego en `develop` evidencia actividad intensa en:
- `b9d5b50` / `c585a19`: Tareas S75-015 y S75-016 (Comandos `qap update` y `qap rollback` con validación de hashes SHA-256 y copias de seguridad de módulos en `.qa/backups/`).
- `c875a68` / `850a284`: Tarea S75-006B (Construcción de `PlaywrightRunner` implementando `IRunner` con inyección de `storageState` y comando `qap test`).
- `1550fb6` / `56a3377`: Tareas S75-005A y S75-008 (Herramientas MCP de entrevista y detección de brechas, registradas directamente dentro de `server.ts`).
- `fe5b120`: Tarea S75-002 (`GitAdapter` y pruebas basadas en diferencias de código).

### 4.2 Puntos Críticos de Conflicto Potencial

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PUNTOS DE CONFLICTO CON DIEGO                        │
├──────────────────────┬─────────────────────────────────────────────────┤
│ 1. packages/mcp/     │ Diego edita el switch en server.ts;             │
│    src/server.ts     │ vNext lo descompone en handlers. Riesgo de      │
│                      │ colisión masiva en merge de Git.                │
├──────────────────────┼─────────────────────────────────────────────────┤
│ 2. packages/knowledge│ Diego construyó LockManager y ModuleBackup-     │
│    /src/storage/     │ Manager asumiendo archivos planos en .qa/.      │
│                      │ vNext migra la memoria principal a SQLite.      │
├──────────────────────┼─────────────────────────────────────────────────┤
│ 3. packages/cli/     │ Diego agregó lógica en update.ts y rollback.ts  │
│    src/commands/     │ fuertemente acoplada a las clases del storage   │
│                      │ de archivos.                                    │
└──────────────────────┴─────────────────────────────────────────────────┘
```

### 4.3 Protocolo de Mitigación y Reglas de Coexistencia

Para garantizar cero interferencias y una integración pacífica posterior:

1. **Aislamiento Estricto de Rama:**
   - QAMCP vNext se desarrolla **exclusivamente** en `feat/qap-vnext-architecture`.
   - Está prohibido hacer push directo o cherry-pick hacia `develop` o `main` hasta la culminación y aprobación formal de la etapa de arquitectura.
2. **Preservación de Contratos Compartidos:**
   - La interfaz pública de `LockManager`, `ModuleBackupManager` y `GitAdapter` no debe ser eliminada.
   - En el paquete `@qap/knowledge`, se preservan las clases que Diego consume, marcándolas internamente con redirección o compatibilidad hacia el almacenamiento unificado.
3. **Estrategia para `server.ts`:**
   - En `feat/qap-vnext-architecture`, el archivo `packages/mcp/src/server.ts` se mantendrá temporalmente como un despachador que delega a los nuevos handlers en lugar de borrarlo de un solo golpe. De este modo, si Diego añade una nueva tool a `server.ts` en `develop`, el conflicto de merge será trivial de resolver incorporando su handler correspondiente.
4. **Ventana Formal de Integración (Merge Day):**
   - Una vez concluida la implementación de la primera fase de vNext, se coordinará una sesión de sincronización con Diego para:
     a) Recompilar y validar que los 512 tests unitarios de `develop` continúan en verde.
     b) Integrar las mejoras de `PlaywrightRunner` y `storageState` de Diego dentro del nuevo ejecutor autónomo.
     c) Migrar el comando `qap rollback` de Diego para que opere tanto sobre backups de archivos planos como sobre transacciones de snapshot en SQLite.
