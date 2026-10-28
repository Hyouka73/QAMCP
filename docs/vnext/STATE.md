# QAMCP vNext — Continuidad Codex

Actualizado: 2026-10-28. Agente principal único.

## Estado y alcance

VNEXT-001, VNEXT-002 y **VNEXT-003 terminadas** por autorización expresa.
Detener aquí. VNEXT-004 y posteriores requieren nueva autorización.
Leer este archivo y el WBS antes de elegir trabajo ante «continúa».

## Rama y commits

- Rama exclusiva: `feat/qap-vnext-architecture`. No editar/integrar develop ni main.
- Base VNEXT-003 verificada: `077e81922f3599104de5d8f98a75126336ccaf10`.
- Commit de entrega: resolver con `git log -1 --format=%H -- docs/vnext/STATE.md`.
- Cambio previo del usuario en `packages/playwright-runner/.qa/cache/sessions/admin-user.json`
  conservado y excluido de esta entrega. No reutilizar bases personales/Reporter para pruebas.

## Decisiones vigentes

- Dependencias `shared ← engine ← knowledge`; puerto IKnowledgeStore v1 sin cambios.
- SqliteKnowledgeAdapter exportado en Knowledge; ruta explícita, uso optativo,
  constructor/cierre fuera del puerto. No sustituye FileSystemStorage ni consumidores legacy.
- SQLite físico v1: scopes, revisiones JSON, enlaces con FK a revisiones, migraciones.
  WAL/FK/FULL, BEGIN IMMEDIATE, CAS, rollback total, hechos append-only y DAG validados.
- Triggers preservan historia y sellan enlaces al confirmar. Cursores ligados a archivo,
  consulta/proyecto/versión; cada commit local los invalida. Referencias históricas persistidas.
- Solo inicialización vacía v0→v1. Marca QAPK, user_version, checksum/catálogo e integrity/FK
  checks; rechazar versiones/esquemas ajenos sin adoptarlos ni cambiar su journal.
- No promoción automática de reglas; referencias externas de perfiles/sesiones, sin secretos
  conocidos ni binarios de evidencia. Redacción de texto/URLs/codificados sigue en ingesta.
- DatabaseSync bloquea el hilo. Validación local antes de lock; DAG sobre entidades actuales;
  no hay benchmark de grandes proyectos, certificación E2E ni pruebas de corte de energía.

## Resultados comprobados

- Shared: 145/145; Engine: 168/168 (24 contratos en memoria); Knowledge: 210/210
  (172 legacy + 24 contratos SQLite + 14 físicos). Total relevante: **523/523**.
- 38/38 SQLite en Windows x64 (NT 10.0.26200.0) con Node 24.15.0 / SQLite 3.51.3,
  Node 22.13.1 / SQLite 3.47.2 y Node 24.22.1 / SQLite 3.53.4. Linux/macOS no probados.
  Node 22.13.1 funciona sin flag y emite ExperimentalWarning. No afirmar todos los minors 22.
- pnpm build: 10 paquetes pasan. ESLint de archivos de esta entrega sin errores/avisos;
  tsc del proyecto de tests físicos sin errores. tsc completos Engine/Knowledge conservan
  36/4 diagnósticos respectivamente, idénticos a fuentes base en copia aislada.
- pnpm test global no pasa: Auth (2 suites, Chromium ausente/teardown) y Playwright Adapter
  (3 archivos, 17 fallos) reproducidos en fuentes base. Hubo 1 fallo de tiempo route-scanner
  al escanear 2000 archivos bajo carga global; sus 16 tests pasan aislados en la base y
  las regresiones relevantes actuales pasan completas. No declarar suite global/E2E verde.
- TEMP/TMP apuntaron a `node_modules/.tmp-vnext` para evitar EPERM del caché SSR.

## Archivos y continuidad

Implementación: `packages/knowledge/src/storage/{sqlite-knowledge-adapter,
knowledge-sqlite-schema,knowledge-commit-planner,knowledge-shape}.ts` y reexport.
Tests físicos: `packages/knowledge/test/` (tsconfig propio para reutilizar suite Engine).
Suite compartida: `packages/engine/src/__tests__/knowledge-store.contract.ts`;
la invocación `.test.ts` sigue verificando el doble, sin cambiar expectativas.
`.qamcp/` excluido de Git. [Decisiones, DDL, comandos, errores y límites](VNEXT-003_SQLITE_ADAPTER.md).

VNEXT-004 dispone de persistencia física y esquema versionado como base, pero **no iniciada**.
Requiere autorización y migración explícita para cualquier cambio DDL/FTS.
No se hicieron bóveda, nuevos handlers, crawler, PostgreSQL, migración YAML ni publicación npm.
