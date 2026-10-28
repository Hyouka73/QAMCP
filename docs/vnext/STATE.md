# QAMCP vNext — Continuidad Codex

Actualizado: 2026-10-28. Agente principal único.

## Estado y alcance

**VNEXT-001 a VNEXT-004 terminadas** por autorización expresa.
Detener aquí. VNEXT-005 y posteriores requieren nueva autorización.
Leer este archivo y el WBS antes de elegir trabajo ante «continúa».

## Rama y commits

- Rama exclusiva: `feat/qap-vnext-architecture`. No editar/integrar develop ni main.
- Base VNEXT-004 verificada: `74df4bd71ed344bd12a6766f7648dfe88fd06805`.
- Commits de entrega: `git log --oneline 74df4bd..HEAD` en esta rama.
- Cambio previo del usuario en `packages/playwright-runner/.qa/cache/sessions/admin-user.json`
  conservado y excluido de la entrega. No usar bases personales/Reporter para pruebas.

## Decisiones vigentes

- Dependencias `shared ← engine ← knowledge`; IKnowledgeStore v1 sin cambios.
- Puerto complementario IActionTargetSearch en Engine; SqliteKnowledgeAdapter implementa
  búsqueda FTS5 optativa. No reemplaza FileSystemStorage ni añade herramientas MCP.
- Esquema v2: DDL/checksum v1 congelados, migración explícita v1→v2 con backfill de últimos
  ActionTargets, proyección STRICT/FK y FTS5 de etiqueta/selector/alternativas/tipo.
- Triggers indexan dentro de la transacción de revisiones. WAL/FK/FULL, CAS y rollback total;
  historia/enlaces/procedencia se conservan. Lectores solo observan datos confirmados.
- Consultas literales Unicode OR parametrizadas, máximo 2048 unidades UTF-16/64 palabras;
  límite 1..100. Solo revisión actual, activa por defecto. Filtros reales por aplicación,
  vista, módulo (vista fijada), entorno y rol. BM25 ponderado; sin semántica profunda.
- Apertura comprueba capacidad FTS5, marca QAPK, versiones/checksums/catálogo, integridad/FK,
  FTS/contenido externo y concordancia de proyección. Rechaza bases ajenas/futuras/drift.
  Sin FTS5: UNAVAILABLE antes de migrar; v1 poblada permanece idéntica byte por byte.
- Cursores de IKnowledgeStore v1 conservan formato/clave/versiones durante la migración;
  commits posteriores siguen invalidándolos por aplicación. Búsqueda no usa cursor.
- Credenciales conocidas siguen rechazadas; solo cuatro campos textuales se indexan.
  Secretos ocultos en texto/URLs/selectores requieren redacción en ingesta.
- DatabaseSync bloquea el hilo; worker pendiente de composición del consumidor. Prosa OR
  puede añadir ruido; CSS/XPath son texto tokenizado, sin stemming/sinónimos/embeddings.

## Resultados comprobados

- Shared 145/145; Engine 168/168; Knowledge 234/234. **547/547 relevantes**.
- 62/62 físicas/búsqueda/capacidad en Node 24.15.0 (SQLite 3.51.3) y 24.22.1 (3.53.4).
- Node 22.13.1/SQLite 3.47.2 instalado **no tiene FTS5**: v2 no compatible. Prueba de rechazo
  y preservación de v1: 1/1. VNEXT-003 funcionaba allí; no extrapolar esa compatibilidad a v2.
- pnpm build: 10 paquetes pasan. ESLint de entrega y tsc de tests físicos sin diagnósticos.
- pnpm test global no pasa: Auth 2 suites fallidas (Chromium ausente/teardown), 8 tests pasan,
  5 omitidos; Playwright Adapter 3 archivos fallidos, 17 fallos/4 pasan/5 omitidos.
  Reproducidos en fuentes base aisladas; hashes iguales al HEAD autorizado. No se corrigieron.
  route-scanner no repitió su fallo sensible a carga; no se declara resuelto ni E2E verde.
- Catálogo reproducible 1200 objetivos: medianas locales 2.815/3.976/5.814/0.286 ms para
  crédito/interés/CSS/sin resultados (Node 24.15.0). No son garantías de producción.
- TEMP/TMP locales: node_modules/.tmp-vnext. Logs temporales vnext004-*.log.

## Archivos y continuidad

Contrato: `packages/engine/src/action-target-search.port.ts`, reexportado por Engine.
Implementación: `packages/knowledge/src/storage/{knowledge-sqlite-schema,sqlite-knowledge-adapter}.ts`.
Tests: `packages/knowledge/test/{action-target-search,sqlite-fts-capability,sqlite-knowledge-adapter}.test.ts`
y fixture v1 congelado. Suite contractual anterior conservada, 24 expectativas SQLite.

[Diseño, migración, comandos, resultados y límites VNEXT-004](VNEXT-004_FTS5_SEARCH.md).
[Antecedente VNEXT-003](VNEXT-003_SQLITE_ADAPTER.md).

VNEXT-005 no iniciada; conserva autorización pendiente. No se hicieron bóveda, crawler,
Advisor, nuevos handlers, PostgreSQL, migración YAML, publicación npm ni integración develop.
