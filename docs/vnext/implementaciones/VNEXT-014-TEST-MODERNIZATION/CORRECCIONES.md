# Correcciones por familia

## R3 — Semántica y Server MCP (2026-11-06; NO certificado)

- `c5d37b0`: corrige orden y separación de importaciones P3, dos warnings nuevos detectados por R2; requiere lint físico para acreditarlo.
- `0dcb85f`: TM-34 rechaza pregunta/módulo incorrecto y categoría formal inválida, distingue clasificación explícita security de falta de aprobación; TM-35 comprueba borrador durable; TM-38 especificación completa tras `declare_non_applicable`, sin ejecución ficticia; TM-41..43 distinguen controles de observaciones válidas y no inventan `extraccion_vacia`.
- `413af9f`: TM-48 añade pruebas de autorización, URL no consentida, ruta normalizada insegura, identidad no planificada y credenciales en argumentos, con invariantes de cero escritura.
- `ea9dcbd`: fixture admite `allowTestNavigation` explícito (por defecto false), limitado al HTTP loopback del test. No incorpora cookies ni acceso externo.
- `1ebdc0b`/`b40d997`: TM-46/52/54/55 migran a `server-canonical-operations.test.ts`; sus cuatro cuerpos anteriores se retiran únicamente tras crear sustitución con `fullName` idéntico. TM-46 usa prueba positiva `qap_plan` → `plan.json` → `qap_test` → ejecución persistida y negativa de plan modificado; no son stubs.
- `ab8d023`/`4d794fe`: TM-53 preserva lectura positiva de status legacy y bloquea Discovery sin contexto autorizado; se retira su cuerpo legacy duplicado. TM-50 continúa activo como capacidad de sesión autenticada ausente.
- Resultado de código **43/55** modernizadas (38 anteriores + 5 Server); **12** aún no sustituidas. Cambios sin ejecución Vitest/Chromium, TypeScript o ESLint en este entorno. Codex certificará el SHA final en una única campaña focal antes del MCP integral.
- Sin alteraciones en código productivo, config, workers, timeouts, dependencias, VNEXT-015, archivo protegido ni ramas ajenas. No se alteran datos de R1/R2.


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

## Lotes 2 y 3 — cambios publicados 2026-11-06

- P3 `df781fdb2bf8b54c279b3faac2dfd6edec785970`: mueve únicamente T6/T7/T9/T14/T15 a `p3-canonical-discovery.test.ts`, manteniendo literalmente los cinco fullNames bajo el mismo `describe`. La suite legacy conserva T3/T4/T5/T8/T10/T11/T12/T13. La prueba de fallo de navegador usa `executable_path` inexistente con la composición real. Reducción neta del archivo legacy: 11,908 caracteres. El fixture canónico extiende `restart` con override opcional exclusivo de navegador para el negativo. No cambia producción.
- P4.2 `95b33146b0228578ff48291fce646c2dc947c9c9`: mueve Criterio 4.4 y Criterio 6 a `p4-2-canonical-contract.test.ts`, conservando literalmente fullNames y `describe`. La suite legacy mantiene Criterio 4.1/4.2/4.3/4.5. Se diferencia pregunta estructurada del onboarding del protocolo `canonical_interview`; Discovery no genera entrevista con autoridad.
- Siete identidades migradas sin `skip`, `todo` ni retiro de negativos. La suite física, su duración bajo carga, TypeScript y lint diferencial **no se ejecutaron en esta intervención**, ya que el entorno conectado GitHub permite inspección/escritura, no ejecución local de pnpm/Chromium. No atribuirles los conteos antiguos de `RESULTADOS.md`.
- No se tocaron VNEXT-015, `develop`, `main`, credenciales/sesiones ni timeouts.

## Lotes 4 y 5 — Integridad modernizada, verificación pendiente

- `3d30973715fa8b9092ab55395f4e37685de6fb7b`: nueve tests históricos P4.5-A se trasladaron de `p4-5a-integrity.test.ts` a `p4-5a-canonical-integrity.test.ts` conservando sus fullNames. Tres tests originales se conservaron, incluido TM-27 de la compuerta de autenticación; los dos originales no fallidos no se tocaron. Nueva verificación: límites de sustantividad (incluidas constantes compartidas), no promoción del agente ni de etiquetas, persistencia SQLite/host de brechas, criterio de aceptación de 14/15 caracteres, flujo defer/resume y errores honestos antes de navegar.
- `a721a88f45294c61c8c8ddeef577a36bdfcfd8cd`: trece tests P4.5-A2 se trasladaron de `p4-5a2-integrity.test.ts` a `p4-5a2-canonical-integrity.test.ts` conservando fullName y jerarquía de describe. Los otros trece originales permanecen activos, incluidos TM-30..TM-32 de clasificación de autenticación. Los grupos históricos que quedaban sin casos fueron eliminados, no se hizo skip ni se degradaron tests a estados bloqueados falsamente positivos.
- El fixture oficial `createLifecycleFixture` admite HTML sintético opcional en el HTTP loopback para distinguir superficies con/sin controles sin modificar el crawler, el servidor MCP productivo ni su aislamiento. Conserva el HTML original por defecto.
- No se ha ejecutado vitest/TypeScript/lint sobre estos commits. Los tests añadidos son hipótesis verificables, no resultados físicos aprobados. No se tocaron rutas de VNEXT-015, E01, configuraciones de timeout o credenciales.

## Lote 7 parcial — server MCP (commit 7303351)

Movidos cuatro casos TM-47/TM-48/TM-49/TM-51 desde `server.test.ts` a `server-canonical-discovery.test.ts`. Las pruebas mantienen `describe` y nombres completos originales; se retiran de esos cuerpos los mocks/archivos `module-view` antiguos sin tocar implementación productiva. Se ejercen MCP real, SQLite, host autorizado/no autorizado, fallo Chromium y HTML pasivo. No se alteran las seis pruebas legacy restantes del archivo, configuración E01, timeout ni VNEXT-015. **No ejecutado físicamente**; reparar cualquier fallo real antes de certificar.

## Correcciones posteriores a verificación física R1 — 2026-11-06

R1 en 8de5a22: 31/33 focales, MCP 487/506 serial y 473/506 paralelo; ver VERIFICACION_FISICA_R1_2026-11-06.md.

**Cambios de tests, no ejecutados físicamente:**
- 1c8164e: prioridades high/medium/low en fixture, defaults intactos.
- 9aa9499: T14 reconcilia estado posterior a Discovery, entrevista explícita, prioridad y desempate de plan.
- a409601: pregunta inicial versión 0; incremento tras propuesta.
- 8980bbc: Payload incluye campos opcionales reales de Discovery para corregir diagnósticos de tipo.
- 7ed60e0: C3-a valida clasificación formal autorizada y readback de requisito.
- 3c4cf0a: C4-d exige procedencia y recibo durable de revisión humana sintética.
Sin cambios productivos, navegador, políticas, timeouts, workers, credenciales, VNEXT-015 ni merges. Requiere campaña focal independiente antes de atribuir PASS.

