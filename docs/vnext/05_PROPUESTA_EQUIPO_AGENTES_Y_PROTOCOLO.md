# QAMCP vNext — Propuesta de Organización de Agentes, Responsabilidades y Protocolo de Entrega

- **Documento:** `05_PROPUESTA_EQUIPO_AGENTES_Y_PROTOCOLO.md`
- **Rama:** `feat/qap-vnext-architecture`
- **Autor / Rol:** Principal Software Architect y Teamwork Lead
- **Fecha:** Octubre 2026
- **Estado:** Especificación Operativa del Equipo Multi-Agente (Etapa 0)
- **Referencias:** D-010 en `docs/vnext/REQUISITOS_Y_DECISIONES.md`, `.agents/`, `AGENTS.md`.

---

## 1. Análisis Forense de `AGENTS.md` y `.agents/`

Conforme a la instrucción directiva ("Analiza `AGENTS.md` y `.agents/`. **No los borres todavía**. Determina su función, su vigencia y cómo debe organizarse la configuración de agentes"), se emite el siguiente dictamen:

### 1.1 Diagnóstico de `AGENTS.md`
- **Función actual:** Es una guía instructiva paso a paso diseñada para que una IA clone el monorepo en local, instale dependencias de desarrollo (`node >= 18`, `pnpm >= 8`), ejecute `pnpm build`, corra un script de prueba y configure manualmente clientes MCP con la ruta física absoluta de su máquina local.
- **Vigencia:**
  - **OBSOLETO** para el usuario final y para agentes cliente una vez que se alcance la distribución `npx-first` (D-009). Ningún usuario externo debe tener que clonar y compilar código TypeScript solo para operar el servidor MCP.
  - **VIGENTE** de forma transitoria para desarrolladores internos del monorepo (como Diego o contribuidores humanos) mientras se mantenga el monorepo en fase activa.
- **Destino propuesto para vNext:**
  - Conservar el archivo sin modificaciones destructivas durante la Etapa 0.
  - En la Fase 5, crear un nuevo `AGENTS.md` orientado a clientes que interactúan con el paquete publicado vía `npx`, y mover las directivas internas de desarrollo a `docs/dev/CONTRIBUTING_AGENT.md`.

### 1.2 Diagnóstico del Directorio `.agents/`
- **Contenido actual:**
  - `rules/`: Reglas históricas de sprints anteriores (`sprint5-fix-agent.md`, `qap-v3-agent.md`, `graph-demo-agent.md`). Son artefactos archivados de ciclos pasados.
  - `skills/`: Habilidades de diseño UI (`minimalist-clean-ui`) y arquitectónicas (`qap-v3-architect`).
  - `teamwork/`: Evidencia y bitácoras de la auditoría anterior (`lead_auditor_1`, `challenger_1`, `executive_synthesizer_1`).
  - `workflows/`: Procedimientos legacy en formato Markdown.
- **Vigencia:** La mayoría de las reglas y workflows están desfasados respecto a las decisiones de vNext (D-001 a D-010).
- **Destino propuesto para vNext:**
  - **Preservar intacto** durante la Etapa 0.
  - Para la fase de implementación, estructurar `.agents/` bajo el estándar moderno de especialización modular por roles de vNext, archivando las carpetas de sprints obsoletos en `.agents/archive/`.

---

## 2. Organización del Equipo Multi-Agente para la Implementación

Para asegurar un desarrollo eficiente, desacoplado y sin cuellos de botella humanos, se define un equipo de **especialistas autónomos coordinados** bajo una jerarquía clara:

```mermaid
flowchart TD
    Lead["Principal Software Architect & Teamwork Lead<br/>(Gobernanza, Integración y Decisiones)"]
    
    subgraph Pistas Paralelas de Implementación
        A1["Agente 1: Memory & Storage Specialist<br/>(Pista A: @qap/shared & @qap/knowledge)"]
        A2["Agente 2: Black-Box Crawler Specialist<br/>(Pista B: @qap/playwright-adapter)"]
        A3["Agente 3: MCP Handlers Specialist<br/>(Pista C: @qap/mcp Modular)"]
        A4["Agente 4: QA Advisor & Engine Specialist<br/>(Pista D: @qap/engine & DAG)"]
        A5["Agente 5: Distribution & CLI Specialist<br/>(Pista E: @hyouka73/qap-cli & tsup)"]
    end
    
    Challenger["Empirical Challenger & Verification Sentinel<br/>(Auditor Adversarial Independiente)"]
    
    Lead --> A1 & A2 & A3 & A4 & A5
    A1 & A2 & A3 & A4 & A5 -.->|Entrega de PR / Tarea| Challenger
    Challenger -->|Veredicto de Certificación (Approve/Reject)| Lead
```

### 2.1 Definición de Roles y Responsabilidades

| Rol / Especialista | Paquetes Bajo su Custodia | Responsabilidad Principal |
|:---|:---|:---|
| **Principal Architect & Teamwork Lead** | Monorepo global y `docs/vnext/` | Asigna tareas, supervisa contratos compartidos, arbitra divergencias y coordina ventanas de merge con Diego. |
| **Agente 1: Memory & Storage Specialist** | `@qap/shared`, `@qap/knowledge` | Implementa tipos unificados, puerto `IKnowledgeStore`, `SqliteKnowledgeAdapter` (`node:sqlite` WAL) y tabla virtual FTS5. |
| **Agente 2: Black-Box Crawler Specialist** | `@qap/playwright-adapter` | Desarrolla reconocimiento pasivo HTTP, crawler Playwright sin mutaciones, interceptor de red y sondas no destructivas. |
| **Agente 3: MCP Handlers Specialist** | `@qap/mcp` | Refactoriza `server.ts` hacia despachador declarativo con tool handlers desacoplados y conecta `qap_plan`/`qap_test` reales. |
| **Agente 4: QA Advisor & Engine Specialist** | `@qap/engine` | Implementa motor de cálculo de impacto en DAG, servicio consultor `QAAdvisor` y clasificador formal de defectos. |
| **Agente 5: Distribution & CLI Specialist** | `@hyouka73/qap-cli`, `@qap/auth` | Desarrolla bóveda criptográfica portable AES-256 (sin `keytar`), bundle standalone con `tsup` y comando de auto-registro MCP. |
| **Empirical Challenger (Sentinel)** | Validación y Suites de Test | Agente adversarial que clona el código de cada tarea en sandbox, ejecuta pruebas de estrés, verifica cobertura y emite veredicto técnico objetivo. |

---

## 3. Matriz de Independencia y Paralelismo

Para acelerar la entrega sin riesgos de colisión, se identifican las tareas que pueden desarrollarse de forma concurrente:

```
┌────────────────────────────────────────────────────────────────────────┐
│               MAPA DE PISTAS CONCURRENTES (FASE 1 A 5)                 │
├────────────────────────────────────────────────────────────────────────┤
│ PISTA A (Almacenamiento):   VNEXT-001 ──► VNEXT-002 ──► VNEXT-003     │
│                             (Tipos)       (Puerto)      (SQLite WAL)   │
├────────────────────────────────────────────────────────────────────────┤
│ PISTA B (Discovery):        VNEXT-006 ──► VNEXT-007 ──► VNEXT-008     │
│                             (Recon HTTP)  (Crawler DOM) (Red/XHR)      │
├────────────────────────────────────────────────────────────────────────┤
│ PISTA C (MCP Handlers):     VNEXT-011 ──► VNEXT-012                   │
│                             (Dispatcher)  (Status/Clean Handlers)     │
├────────────────────────────────────────────────────────────────────────┤
│ PISTA E (Criptografía):     VNEXT-018                                  │
│                             (Bóveda AES-256 sin keytar)                │
└────────────────────────────────────────────────────────────────────────┘
```

- **Pistas 100% Desacopladas:** La Pista A (`@qap/knowledge`), la Pista B (`@qap/playwright-adapter`), la Pista C (`@qap/mcp`) y la Pista E (`@qap/auth`) operan en directorios de paquetes disjuntos, compartiendo únicamente los contratos inmutables de `@qap/shared`. Pueden ser ejecutadas por 4 agentes en paralelo sin conflictos de Git.
- **Puntos de Convergencia:** La Fase 4 (QA Advisor) requiere la madurez previa de la Pista A (almacenamiento) y Pista B (datos descubiertos).

---

## 4. Protocolo Riguroso de Entrega y Aceptación (Handoff Protocol)

Para evitar que se introduzcan defectos o tareas rotas ("stale dist" como ocurrió en Sprint 7.5), se adopta un protocolo formal de 5 pasos por cada micro-tarea:

```
┌─────────────┐
│ 1. Briefing │ El Teamwork Lead emite la ficha técnica de la tarea (WBS ID,
│             │ paquetes afectados, contratos y criterios de aceptación).
└──────┬──────┘
       ▼
┌─────────────┐
│ 2. Sandbox  │ El especialista implementa la solución exclusivamente en su
│  Desarrollo │ paquete asignado junto con su suite de pruebas unitarias.
└──────┬──────┘
       ▼
┌─────────────┐
│ 3. Build &  │ El especialista ejecuta la compilación y comprueba que sus
│  Self-Test  │ pruebas unitarias pasan al 100% en verde localmente.
└──────┬──────┘
       ▼
┌─────────────┐
│ 4. Escrutinio│ El Empirical Challenger toma el commit de forma independiente:
│ Adversarial │ - Recompila el monorepo desde cero (`pnpm build`).
│             │ - Corre la suite de pruebas del paquete y suites adyacentes.
│             │ - Verifica no-destructividad y ausencia de errores de tipos.
└──────┬──────┘
       ▼
┌─────────────┐
│ 5. Dictamen │ Si el Challenger emite APPROVE, el Teamwork Lead valida la
│ e Integración│ integración. Si emite REJECT, la tarea regresa al paso 2.
└─────────────┘
```

### Reglas No Negociables de Gobernanza
1. **Regla "No Pass, No Merge":** Ninguna tarea se considera completada si no cuenta con sus pruebas unitarias automatizadas pasando en verde y certificadas por el Challenger.
2. **Recompilación Continua:** Cada PR o tarea completada debe ejecutar `pnpm run -r build` antes de darse por concluida, erradicando definitivamente el problema de binarios desactualizados en `dist/`.
3. **No Modificación de Ramas Base:** Todo el trabajo del equipo multi-agente se realiza en ramas de feature derivadas de `feat/qap-vnext-architecture`, sin tocar `develop` ni `main`.
