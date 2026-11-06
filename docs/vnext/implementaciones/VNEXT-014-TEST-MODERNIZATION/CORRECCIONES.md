# Correcciones por familia

## Lote 1 — lifecycle

- `packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts`: siete identidades existentes modernizadas, conservando fullName y garantía canónica; cinco eran FAIL y dos PASS en el baseline. Se retiran mocks del adapter sustituido, acceso privado a `_requestHandlers`, modificación global de `process.cwd`, escritura de YAML a mano y supresión global de reglas ESLint.
- `packages/mcp/src/__tests__/fixtures/lifecycle-canonical.ts`: composición real por MCP SDK/InMemoryTransport, servidor HTTP local, crawler real de Chrome, Application/Environment y bindings revisados, Knowledge SQLite, drafts/closure cifrados, inboxes separados y aprobación explícita sobre cada digest. Cleanup registra recursos desde el comienzo, cierra clientes/servidores/HTTP/stores y elimina solo su raíz temporal verificada. Cada llamada valida schema de lifecycle.
- Tres pruebas nuevas: aplicabilidad/categorías/razones y autoridad; aprobación de cierre obsoleta tras revisión; ausencia de escritura sin consentimiento Discovery.
- `MATRIZ_55.md` y `evidencia/matriz-55.json`: las 55 identidades originales y los IDs históricos 9–63. Cinco contrastadas en este lote; otras 50 pendientes y activas. Cero retiros y cero consolidaciones por supuesta duplicidad.
- Código productivo, Vitest/configuración, límites, timeouts, VNEXT-015 y archivo personal: sin cambios de esta intervención.

Implementación publicada: `9a7ce20b4bd3a07518351397a1eab40ce84f2e84`. Su commit de evidencia es posterior y se distingue del código probado. El resultado MCP serial y el diferencial por identidad están en RESULTADOS.md.

## Intentos conservados

El baseline dentro del sandbox no pudo cargar tests (EPERM/rename del caché de Vite); se repitió físicamente fuera del sandbox. Los primeros focales documentan errores del nuevo arnés: comparación de array que incluía dos bindings, conteo de solicitudes del gateway (consulta pendiente y consulta autorizada), propiedad `valid` del validador y doble inicialización con un origen distinto. Se corrigieron los oráculos/setup; los intentos fallidos permanecen en evidencia y no se reportan como defectos del producto.

## Siguiente lote

Lote 2, `p3-verification.test.ts`, cinco identidades TM-06..TM-10 (históricos 14..18). Ejecutar antes de editar, contrastar DiscoveryHandler/crawler, asociar a módulos con autorización, comprobar idempotencia física y no promoción; luego MCP serial y publicación antes del Lote 3. No reconstruir rules.yaml ni aprobar automáticamente autoridad.
