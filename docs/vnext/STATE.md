# QAMCP vNext — Continuidad Codex

Actualizado: 2026-10-28. Agente principal único.

## Objetivo y alcance

VNEXT-002 terminada: contrato formal de conocimiento y puerto IKnowledgeStore.
Detener aquí. VNEXT-003 y tareas posteriores requieren nueva autorización.
Ante «continúa», leer este archivo y el WBS antes de elegir trabajo autorizado.

## Rama y commits

- Rama exclusiva: `feat/qap-vnext-architecture`. No editar/integrar develop ni main.
- Base recibida y verificada: `ffb5031b525db0dcc2b95c61a00405e321ce5a8a` (VNEXT-001 previa).
- Implementación VNEXT-002: `c0a7901f4cd60384095d60af5584e57863f843b5`.
- Este archivo se agrega en un commit posterior de continuidad, sin cambios de código.
  Resolver ese commit con `git log -1 --format=%H -- docs/vnext/STATE.md`.

## Decisiones vigentes

- Puerto en Engine: knowledge ya depende de engine/shared; invertir esa dependencia crearía un ciclo.
- Reutilizar entidades canónicas shared; mantener IStorage y todos los componentes legacy.
- get/query/history + commit atómico, CAS por revisión, aislamiento por aplicación/proyecto,
  enlaces fijados a revisiones y hechos observacionales/evaluaciones append-only.
- Procedencia/contexto/revisión mediante KnowledgeTrace; revisión no confirma una regla.
- Sin SQLite/PostgreSQL, FTS, telemetría, snapshots ni bóveda implementados en esta tarea.
- Secretos fuera de la memoria: referencias externas; saneamiento de texto/URLs corresponde a ingesta.
- Detalle y límites: [VNEXT-002_KNOWLEDGE_STORE.md](VNEXT-002_KNOWLEDGE_STORE.md).

## Archivos de la entrega

- `packages/engine/src/knowledge-store.port.ts` y reexport en `ports.ts`.
- `packages/engine/src/__tests__/knowledge-store.contract.test.ts` y `mocks/knowledge-store.mock.ts`.
- `docs/vnext/VNEXT-002_KNOWLEDGE_STORE.md`, este STATE y actualización de requisitos, arquitectura y WBS.

## Resultados comprobados

- Shared: 145/145 tests, 15 archivos. Engine: 168/168, 11 archivos (24 contratos nuevos).
- Knowledge: 172/172, 20 archivos. Total relevante: 485 aprobadas, 0 fallidas.
- pnpm build: 10 paquetes compilados. ESLint de tres archivos nuevos: 0 errores/avisos.
- tsc de Engine incluyendo tests: 36 errores preexistentes en seis archivos legacy;
  mismos diagnósticos reproducidos con fuentes HEAD de la base en copia temporal.
- Pruebas en memoria únicamente: no prueban durabilidad física ni migraciones.
- TEMP/TMP deben apuntar a `node_modules/.tmp-vnext` en este sandbox para evitar EPERM de caché SSR.

## Bloqueos y siguiente tarea autorizable

Sin bloqueo de implementación para VNEXT-002. Cambio previo del usuario en
`packages/playwright-runner/.qa/cache/sessions/admin-user.json` conservado y excluido de los commits.

VNEXT-003: depende de VNEXT-002 y autorización expresa. Primero verificar matriz de runtime
Node/OS para SQLite; después DDL/migraciones/validación runtime, transacciones y pruebas
físicas de reapertura, durabilidad, rollback y concurrencia. No iniciada.
