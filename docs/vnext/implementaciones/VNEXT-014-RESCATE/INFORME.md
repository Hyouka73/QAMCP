# VNEXT-014 — Rescate de implementación e integración

**Fecha:** 2026-11-05. **Rama:** `feat/qap-vnext-architecture` de `Hyouka73/QAMCP`.  
**HEAD al iniciar:** `f36e5ba60470c2443690d78a4b68bad966891b69` (integración documental previa).  
**Base de código auditada por Codex R4-R12:** `7ccf3db1a6f259f6a5c51521518bbb399a13fda2`.  
**Estado de entrega:** código y tests **publicados**, validación física pendiente, **VNEXT-014 NO-GO**. No iniciar VNEXT-015.

Este informe es **de implementación**, no una auditoría independiente. Los resultados PASS anteriores se mantienen atribuidos exclusivamente a R4-R12; **ningún build, test, lint ni E2E se ejecutó en esta intervención** (conector GitHub permite lectura/escritura de archivos, no ejecución del monorepo). El HEAD final de código se determina desde GitHub antes de probarlo y se distingue del HEAD documental generado al publicar este informe.

## Cambios y causa

### A — Host composition Stdio: implementado, certificación pendiente

**Causa confirmada:** `startMcpServer()` construía el servidor con `createMcpServer()` sin KnowledgeBindings, draft/closure stores ni políticas de Discovery; el consumidor real no alcanzaba los servicios canónicos sin composición inyectada en fixtures.

- `packages/mcp/src/host-composition.ts` crea una composición **opt-in explícita** desde `QAP_MCP_HOST_CONFIG_PATH`, variable del proceso host, no argumento de tool. Comprueba rutas absolutas reales, bases existentes, application/environment/module, revisiones y `provenance:host_declared`.
- Abre Knowledge SQLite con FTS5; abre `SqliteInterviewDraftStore` y `SqliteModuleClosureStore` cifrados solo si fueron provisionados antes por el host; exige llaves hex de 32 bytes gestionadas por variables de entorno externas y attestation de protección. No crea almacenes de privilegio ni autorizaciones por defecto. Limpia buffers temporales y cierra recursos al fallar o desconectar.
- Acepta política `discoveryAuthorization` **declarada por el host**: reconocimiento GET exacto, revisión actual del entorno, acuse explícito read-only, IP/public network explícitos y límites acotados; sin política, Discovery mantiene `discovery_authorization_required`.
- `packages/mcp/src/server.ts` invoca la composición al iniciar Stdio, sin cambiar `createMcpServer(options)` para hosts que suministran sus propios gateways.
- **Frontera deliberada:** el manifiesto NO puede ejecutar código de gateway ni aprobar entrevistas/cierres. El host de aplicación debe inyectar `humanReviewGateway` y `moduleClosureReviewGateway` implementados con revisión auténtica para esas acciones. `HOST_STDIO.md` describe provisión, seguridad y reproducción.
- **Fail-closed añadido:** si existe binding canónico de módulo pero no almacén durable de cierre, `qap_session_close` ahora bloquea con `canonical_closure_store_required` y no cae en cierre legacy.

### B — Reporte de sesión canónico: implementado, certificación pendiente

**Causa confirmada:** `qap_session_close` verificaba cierres canónicos, pero publicaba brechas calculadas desde `rules.yaml` legacy, que no es la fuente canónica.

- `CanonicalClosureService.sessionReport()` proyecta registros `closed`/`waived` con aprobación durable correlacionada, vínculo de módulo fijado y recibo `relation` correspondiente en Knowledge. Si faltan o están incoherentes, **lanza fallo**; no reporta un cierre ficticio.
- Incluye decisión, revisor, fecha, hashes de solicitud/cobertura, waiver autorizado, brechas aceptadas durables, decisiones de aplicabilidad e inventario **actual** de requisitos confirmados/pending de Knowledge. Excluye de confirmados las hipótesis observacionales y exige `validateExpectedRequirement`.
- `canonical-session-report.ts` genera sección Markdown separada. `qap_session_close` excluye módulos canónicos de la evaluación legacy y adjunta reporte legacy solo para módulos no vinculados. Nunca presenta ejecución funcional o cobertura de ejecución verificada sin evidence. La métrica legacy `brechas_detectadas` es `null` cuando existe cierre canónico, no una falsa cifra global.
- **Limitación:** la lista de requisitos procede de su estado actual, no de un snapshot histórico sellado en el cierre; la presentación lo dice explícitamente. La persistencia del reporte y transición del lifecycle siguen sin ACID común con Knowledge/Closure; se requiere comprobación física y recuperación de fallos parciales.

### C — Recorrido funcional: solamente pruebas estructurales añadidas

- `host-composition.test.ts` cubre opt-in, manifest inválido, claves/revisiones, política explícita de Discovery y el bloqueo de sesión sin closure store.
- `canonical-coverage.test.ts` incluye un reporte con requisito confirmado y evidencia observacional excluida y un **fixture controlado** de A `closed` + B `waived` + generación de archivo + `WRAP_UP`.
- **No se ejecutaron estas pruebas**. Los gateways de fixture son sintéticos y **NO son consentimiento humano auténtico**. No está demostrado aún el recorrido end-to-end completo de `qap_init`→contexto→plan→Discovery real→asociación→entrevista→gateway humano→persistencia→cobertura→aplicabilidad→A/B→reporte→`WRAP_UP`→nueva sesión. Falta demostrar nueva sesión/replanificación y recuperación multi-proceso con estas fuentes.

### D — 63 fallos MCP del baseline: pendiente

Inventario exacto R4-R12: [DIFERENCIAL_MCP](../../auditorias/VNEXT-014-R4-R12/DIFERENCIAL_MCP.md). Baseline **415 PASS, 63 FAIL de 478**, no extrapolar a este HEAD. No se alteraron las expectativas históricas para forzar verde. Sin ejecución no se puede reconciliar de forma legítima cada identidad.

- Ocho fixtures MemoryKnowledgeStore carecen de `withWriteFence`: los casos positivos que exigen cierre durable deben ejecutarse con **SQLite físico y fence real**, pero conservar casos negativos sin fence y garantías de rechazo. No implementar no-op fence.
- 55 identidades legacy requieren clasificación caso a caso en defectos productivos, obsolescencia de contrato, fixture, integración, ambiente, ambigüedad o bloqueo de seguridad, sin suprimir garantías. Prioridades E0a/E1/E2/E3/Criterio9. Los cambios en A/B/C **pueden afectar** resultados, pero no se declara ningún fallo arreglado sin corrida comparativa.
- Las pruebas nuevas deberán compararse por `suite file + fullName`, sin normalizar/renombrar identidades.

### E — A04-W01: pendiente por alcance y evidencia

El R4-R12 anterior mostró pérdida de `AsyncLocalStorage` por wrapper de cola/timer ajeno a la composición oficial. No se introdujo un mecanismo de concurrencia genérico o no validado. Codex debe comprobar si el wrapper forma parte de la ruta de producción soportada; si sí, elevar con reproducciones de guard after-INSERT/rollback. Si no, documentar límite, negativo y prueba de ruta oficial sin falsa promesa de soporte general.

## Archivos publicados

| Ruta | Operación |
| --- | --- |
| `packages/mcp/src/host-composition.ts` | nuevo, composición host y política |
| `packages/mcp/src/server.ts` | modificado, Stdio + fail-closed + reporte |
| `packages/mcp/src/handlers/canonical-closure-service.ts` | modificado, proyección durable |
| `packages/mcp/src/handlers/canonical-session-report.ts` | nuevo, renderer |
| `packages/mcp/src/__tests__/host-composition.test.ts` | nuevo, regresiones |
| `packages/mcp/src/__tests__/canonical-coverage.test.ts` | ampliado, reportes y A/B |
| `docs/vnext/implementaciones/VNEXT-014-RESCATE/HOST_STDIO.md` | nuevo, contrato operativo |
| `docs/vnext/implementaciones/VNEXT-014-RESCATE/INFORME.md` | nuevo, este informe |
| `docs/vnext/STATE.md` | continuidad del estado a publicar |
| `docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md` | tareas nuevas sin reabrir completadas |

## Commits de implementación (orden cronológico)

- `df138a891df9f573d3a613ae772472d4dc3c718e` host composition.
- `8c12d076373d521bc70f5a7fc96dc8799c4b8389` Stdio + bloqueo legacy.
- `510b18588efedae6990cfc749138ad199a7fc4b8` pruebas de composición.
- `bbd8401e2991e2abd48000f0143bd015dea564f0` proyección canónica.
- `f4265118845c8cebc1a9645d823f22f26d0849ac` reporte Markdown canónico.
- `c64f90969ef2edbe06afa537b1c9fec97b251cfd` integración de cierre/reporte.
- `2b9170f3361f1575f6fd8743f5955c4a0a6d15b7` prueba de proveniencia.
- `b369d81194eafc2360caddfa4d5e61ec02c54378` prueba A+B.
- `717cbfed3d2caa915002f740730fc09ac52516c2` corrección de typing del fixture.
- `38cc7fefbd0a47a1ac8ce39b138c60318ba1a716` recibo de relación obligatorio.
- `6d1285755dab819e12f93a6669385bfa6beac727` endurecimiento de rutas/claves.
- `e7e864a4bb1077fab1f9e73f8c2aa2f8229ee0cb` política host Discovery.
- `b989d117a524a4e698c971aa35aef6f54efb879a` prueba de Discovery explícito.
- `edd3514ea71c63978ec7475ed1c66daa189aae00` documentación Stdio.
- `4be066c794c1e83fa0b3e1b89d269094f7b7f68e` narrowing TS de política.

Los commits puramente documentales posteriores son trazabilidad adicional, no build de producción. El auditor fija primero el SHA **final real** de código publicado y no lo confunde con el SHA que resulte de su propio commit documental.

## Verificación exacta a ejecutar (Codex, sin editar producción)

Entorno: Node 24.15.0 o runtime compatible comprobado; SQLite `ENABLE_FTS5`, pnpm 12.3.4 de referencia R4-R12, lockfile sin mutación, Chromium instalado cuando sea necesario. Usar directorio limpio/detached para comparar línea base exacta con HEAD nuevo.

```bash
node -v
pnpm -v
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @qap/mcp exec vitest run src/__tests__/host-composition.test.ts src/__tests__/canonical-coverage.test.ts src/__tests__/discovery-handler.test.ts src/__tests__/canonical-interview.test.ts
pnpm --filter @qap/mcp exec vitest run src/__tests__/lifecycle-v3-e2e.test.ts src/__tests__/server.test.ts src/__tests__/report-handler.test.ts
pnpm --filter @qap/mcp test
pnpm test
pnpm lint
node scripts/test-mcp-stdio.mjs
```

Verificar igualmente subprocess Stdio con manifest/variables reales **de fixture**, host app/env/module existente, startup legacy, invalid config, cierre de recursos, auth ausente, omisión de autorización, waivers falsificados, invalidación de revisión, reporter físico y replanificación, más conmutaciones/recibos/concurrencia. Aislar y borrar fixtures temporales, mantener `git status` limpio; no tocar caches personales protegidas.

La auditoría compara 63 identidades exactas, baseline 55+8 y baseline lint, y entrega defectos con repro. Sus informes nuevos van exclusivamente a `docs/vnext/auditorias/VNEXT-014-RESCATE-CODEX/`; queda prohibido editar código/tests productivos, cambiar expectativas o falsificar aprobaciones.

## Riesgos y decisión

1. **P0:** el recorrido completo auténtico no está certificado; los gateways reales de host/consentimiento requieren integración y revisión independiente.
2. **P0/P1:** 63 fallos baseline no reconciliados, posible regresión aún desconocida de cambios sin build físico.
3. **P1:** falta prueba de gestión de fallos parciales entre reporte y lifecycle y de integridad de recibos en la nueva proyección.
4. **P2:** A04-W01 pendiente de decisión de contrato para wrappers.
5. **Ambiente:** Stdio/CLI, SQLite FTS5, Chromium, Windows/POSIX, permisos/ACL del manifest y store deben evaluarse físicamente.
6. **No-ACID:** Knowledge+Closure+filesystem conservan la separación de dominios histórica.

**Decisión: NO-GO para certificar VNEXT-014 y para merge completo a develop.** El trabajo puede ser auditado por Codex, pero no presentarse como MVP certificado hasta pasar las compuertas. Certificación VNEXT-014 prevista 16/11, merge **solo después de GO** hasta 19/11 y MVP 20/11; ninguna fecha habilita una certificación ficticia.
