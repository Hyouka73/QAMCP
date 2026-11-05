**Auditoría independiente de reparación. Fecha local: 2026-11-05 (America/Mexico_City). HEAD probado: 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c.**

# Comparación MCP por identidad exacta

Baseline independiente: **423 PASS / 63 FAIL / 486** sobre e71818ac6fdaa1847e300a67bd4540fbfbd514c5. Actual serial: **432 PASS / 63 FAIL / 495**, 24 archivos. Se utiliza el JSON físico conservado de la auditoría anterior y el nuevo outputFile solicitado; no se deduce la lista de los totales.

| Transición | Cantidad |
| --- | ---: |
| PASS → PASS | 423 |
| FAIL → FAIL | 63 |
| FAIL → PASS | 0 |
| PASS → FAIL | 0 |
| Nuevas PASS | 9 |
| Nuevas FAIL | 0 |
| Desaparecidas | 0 |

Identidad = ruta relativa completa + fullName literal. Tres fullName parametrizados de dispatcher.test.ts aparecen 6, 6 y 3 veces con el mismo nombre, todos PASS en ambos JSON. Para no perder 12 ejecuciones, se conserva **multiplicidad/ocurrencia** por identidad; no se renombra ningún test ni se afirma poder distinguir parámetros que el reporter no incluye. Una comparación con Map simple daría erróneamente 411 PASS conservados.

## Disposición de las 63 fallas

Las 63 identidades exactas continúan FAIL. Son 55 históricas y ocho fixtures Memory sin fence; no hay 63 regresiones recientes. El dictamen no descarta las garantías posteriores que no se alcanzan por la primera compuerta. No se editaron sus expectativas ni se migraron fixtures en esta auditoría.

| Familia | Cantidad | Decisión de auditoría |
| --- | ---: | --- |
| Memory sin withWriteFence | 8 | Rechazo seguro del adaptador incapaz. Positivos incompatibles deben migrarse a SQLite físico sin no-op fence y mantener negativo sin fence; bloquean equivalencia de QA de 014, no cálculo DAG aislado |
| E0a/E1/E2/E3/Criterio9 | 5 | Garantías de integración reales siguen sin certificación por estas identidades; no basta sustituir success por blocked. Bloquean cierre integral y merge |
| Presentación/preguntas | 3 | Reconciliar contrato visible preservando preguntas/módulo/versiones; no certificadas las aserciones posteriores |
| Entrevista/cobertura legacy | 19 | Primera compuerta incompatible; conservar garantías al migrar por equivalencia funcional |
| Rutas protegidas/SDK | 19 | Diferenciar bloqueo de seguridad correcto de garantía funcional aún sin ejecutar |
| Autenticación implícita | 9 | Expectativas antiguas; no restaurar privilegios implícitos para hacerlas verdes; acordar y probar contrato opt-in |

La clasificación y el primer error exacto se vuelven a conservar abajo desde el inventario anterior, cotejado con las identidades actuales. Es una disposición de trabajo, no aceptación humana de una excepción del WBS. Los nuevos positivos físicos de A01/A02 no transforman esos FAIL en PASS. Las nuevas pruebas son cuatro A01, cuatro A02 y una A03; Scenario 4 histórico permanece PASS serial y focal, sin cambio de expectativas.

## Inventario íntegro (495 ejecuciones)

Las rutas siguientes son relativas al repositorio; se conserva fullName sin normalización. #occ solo diferencia duplicados del reporter.

| Ruta | fullName exacto | #occ | Baseline | Actual |
| --- | --- | ---: | --- | --- |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 1: Epistemic Bypass Stress-Testing 1.1: Rejects status confirmed when provenance is active_probe | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 1: Epistemic Bypass Stress-Testing 1.2: Rejects status confirmed when provenance is crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 1: Epistemic Bypass Stress-Testing 1.3: Rejects status confirmed when provenance is network_intercept or observed_telemetry | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 1: Epistemic Bypass Stress-Testing 1.4: Epistemic spoofing via source instead of provenance is caught | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 1: Epistemic Bypass Stress-Testing 1.5: Invariant R1: legacy_manual_edit without verification_evidence cannot confirm | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 1: Epistemic Bypass Stress-Testing 1.6: Knowledge store and coverage engine strictly prevent observational requirements from confirming | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.1: Rejects all forbidden authorization keys in wire command arguments | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.2: Rejects forbidden keys even when combined with waive or accept_gaps | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.3: Rejects unexpected fields in canonical closure commands | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.4: Substantive reason enforcement rejects non-substantive explanations (< 15 chars) | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.5: Host gateway bypass rejection: closes block if gateway is missing | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.6: Host gateway tampered digest rejection: blocks if decision digest does not match request digest | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.7: Host gateway expired decision rejection: blocks if review decision timestamp expired | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.7b: Host gateway malformed date parsing: blocks on NaN/invalid timestamp avoiding fail-open | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 2: Wire Authorization Injection Stress-Testing 2.8: Host gateway rejected decision: blocks if reviewer rejects | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.1: Aborts and rolls back if module revision mutates during human review window | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.2: Aborts if module is deactivated during review | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.3: Prevents approvalId reuse across closure attempts | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 4: Dual-Store Crash Recovery Stress-Testing 4.1: Recovers automatically without second human approval when process crashed after SQLite commit | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 4: Dual-Store Crash Recovery Stress-Testing 4.2: Recovers waived module crash state accurately | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 4: Dual-Store Crash Recovery Stress-Testing 4.3: Corrupt database or wrong AES key strictly rejects without RAM fallback | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.1: Legacy qap_module_close rejects canonical module with canonical_closure_required | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.2: Legacy qap_module_close waive also blocked for canonical modules | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.3: qap_session_close blocks advance to WRAP_UP when canonical module is unclosed | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.4: Canonical closure unlocks qap_session_close | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 6: False Execution Attestation Stress-Testing 6.1: Invariant validator rejects execution_coverage status !== not_executed | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 6: False Execution Attestation Stress-Testing 6.2: Rejects non-zero passed counts even if status is not_executed | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 6: False Execution Attestation Stress-Testing 6.3: Invariant validator rejects individual category waiver (Amendment 6) | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 6: False Execution Attestation Stress-Testing 6.4: CanonicalCoverageService evaluate strictly emits not_executed and 0 counts | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.1: Physical SQLite concurrent transactions handle race conditions without history corruption | 1 | passed | passed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt | 1 | failed | failed |
| packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts | Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity | 1 | failed | failed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 1: Canonical Coverage & Epistemic Boundaries (R1) blocks evaluation when module is unbound or lifecycle context has drifted | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 1: Canonical Coverage & Epistemic Boundaries (R1) strictly enforces Invariant D-011 and R1: excludes observational requirements from confirmed coverage | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 1: Canonical Coverage & Epistemic Boundaries (R1) tripartite coverage separation: execution coverage is strictly not_executed with 0 passed | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 1: Canonical Coverage & Epistemic Boundaries (R1) zero coverage from crawler observations or DOM elements alone | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) declares categories non-applicable and satisfies category status without category waivers (Amendment 6) | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) enforces Amendment 5: accepted gaps bind receipt and transition to status accepted | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 2: Reproducible Gap Inventory & Non-Applicability (R2) identifies reproducible gaps with stable IDs and formal absence types | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: a direct filesystem mutation before closure transaction fails the fingerprint guard | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A01: the official lifecycle writer waits until authorization persistence releases the lock | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A02: changing cwd never moves the active SQLite writer fence | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A05: approves an existing gap with the real host approval receipt | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R10-A05: never requests approval for missing or duplicate gap IDs | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R11-A01: case-aliased official writers wait through durable authorization in all four actions | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R12-A04: authorization expiring after callback rolls back all four SQLite commits | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R12-A06: exact accepted gap replay returns prior receipt without a new decision | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R8-A01: deferred non-applicability review retains request identity and persists actual host decision time | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R8-A01: host approval is rejected if knowledge mutates while awaiting the gateway | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R8-A01: stale approval cannot authorize changed reason or canonical requirement revision | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: an updated pending requirement changes the coverage digest | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: both close and waive reject concurrent Knowledge writes before durable commit | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: delayed fence acquisition does not consume an expired decision | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: missing fencing capability blocks even valid host decisions | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) R4-R9-A02: writing a requirement after final validation cannot persist an obsolete approval | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) blocks client injection of authorization fields (approvalId / signature) on MCP wire | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) blocks closure when host gateway is absent or returns null (pending) | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 3: Host Review Gateway & Trust Boundary (R3) rejects decisions with invalid request digest or expired authorization | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 4: Durable Persistence & Concurrency (R4) Amendment 3: Persists relation receipt in IKnowledgeStore with ZERO module.revision mutation | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 4: Durable Persistence & Concurrency (R4) SqliteModuleClosureStore encrypts all data with AES-256-GCM without plaintext leaks | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 4: Durable Persistence & Concurrency (R4) zero SQLite locks held during asynchronous host review gateway evaluation | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R2-A01: first session close uses recovered waiver metadata for the gate and physical report | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'already waived without approval' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'blank reason' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'closed without approval' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'duplicated approval' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'mismatched approval digest' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'missing approval' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R3: inconsistent durable closure 'short reason' cannot create receipt or reach WRAP_UP | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R4-A01 positive: a legitimately authorized durable waiver still recommends session close | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 16 bound modules, last invalid=false, preview stays capped but guidance checks all | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 17 bound modules, last invalid=false, preview stays capped but guidance checks all | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) R4-R5-A02: 17 bound modules, last invalid=true, preview stays capped but guidance checks all | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A01 serializes concurrent phase writer before close | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A01 serializes concurrent planned writer before close | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A01 serializes concurrent planned-process writer before close | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A01 serializes concurrent session writer before close | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A02 refuses changed canonical receipt revision | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A02 refuses changed canonical receipt source | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A02 refuses changed canonical receipt source-process | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) RES-CODEX-A02 refuses changed canonical receipt target | 1 | absent | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: controlled A closed + B waived produces distinct canonical report sections | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) VNEXT-014 rescue: session report prefers durable canonical authorization, not legacy rules or synthetic execution | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) enforces Amendment 4: blocks canonical module called without canonical_closure | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) qap_module_close routes canonical_closure cleanly through MCP SDK client | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) qap_session_close blocks transition to WRAP_UP when canonical modules remain unclosed | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 5: MCP Integration & Lifecycle Guards (R4 / F8) qap_status reports honest canonical coverage and closure indicators without false 100% | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 6: Historical Regressions & Defensive Invariants (R01–R60) R02 / R60: Re-evaluating coverage is strictly read-only and never implicitly advances lifecycle | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 6: Historical Regressions & Defensive Invariants (R01–R60) R03: Canonical closure route catches errors cleanly and operates on SQLite/host gateway without ENOENT | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 6: Historical Regressions & Defensive Invariants (R01–R60) R11 / R27 / R31: Closing with gaps requires substantive justifications and formal host decisions | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix Suite 6: Historical Regressions & Defensive Invariants (R01–R60) Security Invariant: Protected file packages/playwright-runner/.qa/cache/sessions/admin-user.json is never inspected or touched | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix The 4 Crash Recovery Scenarios (spawnSync Hard Exits) Scenario 1: Crash before persisting decision leaves storage completely clean and recoverable | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix The 4 Crash Recovery Scenarios (spawnSync Hard Exits) Scenario 2: Crash after closureStore commits decision but before IKnowledgeStore or lifecycle.json updates recovers via self-healing reconciler | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix The 4 Crash Recovery Scenarios (spawnSync Hard Exits) Scenario 3: Crash after IKnowledgeStore receipt commit returns idempotent response on retry | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-coverage.test.ts | VNEXT-013-R5 Comprehensive Physical Test Matrix The 4 Crash Recovery Scenarios (spawnSync Hard Exits) Scenario 4: Two concurrent closures cleanly serialize and prevent double consumption of decision | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization HTML required, HTTP 200, AgentInference and reviewed traces confer no requirement authority | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization MCP cannot forge authority with from_option | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization MCP cannot forge authority with gateway | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization MCP cannot forge authority with source | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization MCP cannot forge authority with status | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization MCP cannot forge authority with trace | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization MCP cannot forge authority with verified_by | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization R4-R6-I01: qap_status resumes a real pending canonical question without YAML, approval or state mutation | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization R4-R7-I01: proposal correction, independent host review and real canonical coverage | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization a second connection changing a requirement while the host reviews causes a CAS conflict | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization absence allows general business questions; unspecified formal category stays pending | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization approval for another project cannot confirm even with the same module, question category and statement | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization associated aggregate evidence, partial=false, never invents fields or trusts DOM instructions | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization associated aggregate evidence, partial=true, never invents fields or trusts DOM instructions | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks confirmation with gateway none and never reflects unsafe error text | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks confirmation with gateway null and never reflects unsafe error text | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks confirmation with gateway throw and never reflects unsafe error text | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks unsafe context ambiguous | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks unsafe context foreign-project | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks unsafe context inactive | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks unsafe context missing | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks unsafe context revision | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization blocks unsafe context session | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization context changes while host review runs: cannot commit approved old context | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization correction invalidates exact-text approval, renews review, uses CAS and preserves physical history | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization host decision defer does not create a canonical requirement | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization host decision reject does not create a canonical requirement | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization one approval cannot authorize another question, even when the host mistakenly reuses its ID | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization pending version, idempotent draft retries, defer/resume, unknown questions and cross-module replies | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization physical approval receipt prevents reuse for another question after restarting the host | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization real MCP + host inbox + physical SQLite: present, propose, approve, persist, read status, retry, reopen | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: approval | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: decision | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: digest | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: expired | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: future | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: long-expiry | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: reviewer | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: revoked | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization rejects invalid host decision: statement | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization restart recovers confirmed records without duplicating them; pending drafts require fresh review | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization separate SQLite connections CAS, rollback trigger, safe errors, no duplicate/orphan requirement | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization short free answers remain non-authoritative drafts and need a substantive corrected statement | 1 | passed | passed |
| packages/mcp/src/__tests__/canonical-interview.test.ts | R3 canonical interview and independent host authorization untrusted proposal is never reflected in questions, logs or SQLite without human authority | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition R1: existing reviewed legacy context still accepts rules without promoting agent text or canonical observations | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition R1: explicit waiver remains an honest exit without claiming discovery or test coverage | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition R1: onboarding to anonymous discovery preserves planned state and explicitly blocks the legacy interview | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition R1: stale consolidated state cannot manufacture rules or close a module without view context | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition R1: stale observed state cannot manufacture rules or close a module without view context | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition R3: unauthorized disposable root is a scoped block, not a fabricated browser outage | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks auth without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks cookies without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks credentials without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks missing binding, stale authorization and incompatible environment | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks profile without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks profileId without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks session without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition blocks storageState without navigation or credential reflection | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition delegates browser denial and budgets to the real crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition delegates bytes denial and budgets to the real crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition delegates dns denial and budgets to the real crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition delegates page denial and budgets to the real crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition delegates private denial and budgets to the real crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition delegates redirect denial and budgets to the real crawler | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition distinguishes static completion from a script dependent shell (false) | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition distinguishes static completion from a script dependent shell (true) | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition keeps host configuration isolated from later caller mutations | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition keeps project bindings and physical stores isolated between server instances | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition navigates a real MPA, returns actual counts, commits once and reopens physical SQLite | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition owns exactly one route, preserves order, rejects collisions, and never falls back | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition propagates in-flight dispatcher cancellation to transport and waits for cleanup | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target  / | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target /#fragment | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target /%2e/ | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target //127.0.0.1/ | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target /?token=secret | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target /a/../ | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target /a\b | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target /unknown | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects ambiguous or unauthorized target http://user:secret@127.0.0.1/ | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition rejects an already cancelled dispatcher invocation before crawler start | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition reports atomic persistence failure without fabricated persisted findings | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition requires explicit read-only host acknowledgement and rejects authenticated plans/terminal modules | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition retains phase gate ONBOARDING without lifecycle writes | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition retains phase gate SCOPING without lifecycle writes | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition retains phase gate WRAP_UP without lifecycle writes | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013 real MCP black-box acquisition sanitizes host failures and emits no secret-bearing console logs | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge R4: real crawler to canonical interview, independent review, secure waiver and WRAP_UP through MCP | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge detects context changed at the edge commit boundary without deleting already acquired facts | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge isolates same planned names across physical projects and rejects another project receipt | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge persists real MCP/Chrome/MPA associations, reopens SQLite, projects status, and preserves epistemic planes | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge recovers after physical association rollback without reacquisition or history changes; rejects shortened and mixed receipts | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: ambiguous | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: application | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: environment | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: id-key-conflict | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: inactive | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: missing | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: revision | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: unplanned | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: wrong-id | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge rejects unsafe identity: wrong-key | 1 | passed | passed |
| packages/mcp/src/__tests__/discovery-handler.test.ts | VNEXT-013-R2 canonical execution scope bridge two physical connections race with CAS; retry is idempotent and context changes block recovery | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports applies a handler validator through MCP before execution | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports demonstrates that low-level SDK does not validate inputSchema | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports isolates registries and preserves unknown-tool legacy errors | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports lists and invokes an injected declarative tool exactly once | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports preserves 16 definitions, order, prompts and legacy rules schema; adds explicit canonical interview operations | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports rejects legacy collisions and duplicate injected names at startup | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports runs informative legacy status on an empty disposable fixture | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher-integration.test.ts | real MCP client/server via linked transports sanitizes declarative exceptions through the real SDK | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution allows omitted arguments without inventing domain defaults | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution awaits async execution, passes context and isolates input mutation | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution does exact lookup, including prototype-looking names | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution does not invoke handlers with an already cancelled context | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution preserves intentional MCP error results | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution prevents registry mutation from inside an executing handler | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution rejects malformed invocations without execution | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution rejects malformed invocations without execution | 2 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution rejects malformed invocations without execution | 3 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution rejects malformed invocations without execution | 4 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution rejects malformed invocations without execution | 5 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution rejects malformed invocations without execution | 6 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution returns fixed structured errors even if exception message is modified | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution sanitizes invalid results and validator exceptions | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution sanitizes thrown exceptions | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution sanitizes thrown exceptions | 2 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution sanitizes thrown exceptions | 3 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher execution supports specific validators before execution | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration accepts valid name A1 | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration accepts valid name qap-status | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration accepts valid name qap.status | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration accepts valid name qap_status | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration captures metadata and callbacks independently of caller mutation | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration preserves explicit insertion order and isolates instances | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects duplicates and legacy collisions without executing handlers | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects invalid name " " | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects invalid name "" | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects invalid name "../path" | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects invalid name "a b" | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects invalid name "a/b" | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects invalid name "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects malformed contracts | 1 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects malformed contracts | 2 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects malformed contracts | 3 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects malformed contracts | 4 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects malformed contracts | 5 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration rejects malformed contracts | 6 | passed | passed |
| packages/mcp/src/__tests__/dispatcher.test.ts | ToolDispatcher registration requires sealing and rejects registration during execution | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state SQLite rolls back a writer process that exits before COMMIT | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state blocks restored draft in changed application | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state blocks restored draft in changed environment | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state blocks restored draft in changed inactive | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state blocks restored draft in changed project | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state blocks restored draft in changed revision | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state blocks restored draft in changed session | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state does not create on read, adopt foreign schemas, accept wrong keys or destroy damaged state | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state persists host defer and prevents old decision replay | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state persists host reject and prevents old decision replay | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state reconciles canonical commit followed by failed draft commit without a second approval | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state recovers exact drafts, corrections, defer/resume and history across closed connections | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state reopened proposal has no authority with absent gateway decision | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state reopened proposal has no authority with altered gateway decision | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state reopened proposal has no authority with expired gateway decision | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state reopened proposal has no authority with revoked gateway decision | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state reopened proposal has no authority with unavailable gateway decision | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state retains consumed reject IDs across restart and requires fresh review for reactivation | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state rolls back failed physical writes and reports unknown status when storage closes | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state terminates Node processes between real MCP SDK operations and reopens both physical stores | 1 | passed | passed |
| packages/mcp/src/__tests__/durable-interview.test.ts | R4 encrypted durable interview state two independent connections serialize writers, detect stale versions and preserve the winner | 1 | passed | passed |
| packages/mcp/src/__tests__/e0-investigation.test.ts | E0 / B10 Pruebas de regresión sin impresión E0a: escaneo respeta targetPath y emite advertencia de subcarpeta si no hay docs | 1 | passed | passed |
| packages/mcp/src/__tests__/e0-investigation.test.ts | E0 / B10 Pruebas de regresión sin impresión E0b: qap_context_ingest no degrada source_of_truth ni contamina notes, registra ingest.analyzed_by | 1 | passed | passed |
| packages/mcp/src/__tests__/e0-investigation.test.ts | E0 / B10 Pruebas de regresión sin impresión E0c: sin evidencia detectedService es undefined y baseUrl no se inventa | 1 | passed | passed |
| packages/mcp/src/__tests__/e0-investigation.test.ts | E0 / B10 Pruebas de regresión sin impresión E0d / B10: objetivo largo se trunca a máx 280 con elipsis sin cortar palabras en preguntas, pero se guarda completo en context | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) ONBOARDING: debe entregar la siguiente pregunta pendiente en orden canónico | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) ONBOARDING: debe generar tipo "entrevista" con UNA pregunta estructurada pendiente y sin opciones top-level | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) SCOPING: debe generar tipo "decision" requiriendo qap_session_plan y proponiendo sugerencias en pregunta.opciones | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) WORKING: debe dirigir a qap_session_close con tipo decision si todos los módulos están listos | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) WORKING: debe indicar el siguiente módulo en estado planned con tool qap_discover | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) WORKING: debe priorizar módulo en interviewing con tipo entrevista_vista y tool qap_rules_set | 1 | passed | passed |
| packages/mcp/src/__tests__/guidance.test.ts | Módulo de Guía Conversacional por Fase (E6 - P4.2) WRAP_UP: debe ofrecer decisión con opciones de Knowledge Graph y nueva sesión | 1 | passed | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition RES-CODEX-A03 rejects empty existing Knowledge without provisioning or migration | 1 | absent | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition fails closed when canonical modules have no durable closure store | 1 | passed | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition keeps legacy-only startup when no manifest is configured | 1 | passed | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition only wires explicitly host-approved pinned Discovery consent; rejects missing acknowledgement | 1 | passed | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition opens existing canonical stores, resolves host-declared revisions and does not forge gateways | 1 | passed | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition rejects an explicitly configured nonexistent manifest rather than falling back | 1 | passed | passed |
| packages/mcp/src/__tests__/host-composition.test.ts | VNEXT-014 host-owned Stdio composition rejects missing keys and stale pinned revisions without silently adopting a store | 1 | passed | passed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | 1 | failed | failed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | 1 | failed | failed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E0b: contrato estricto de opciones y preguntas en todo el flujo | 1 | passed | passed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E0c: qap_report sin ejecuciones responde blocked y no escribe archivos; ninguna siguiente_accion recomienda qap_report sin ejecuciones | 1 | passed | passed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers | 1 | failed | failed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones | 1 | failed | failed |
| packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts | Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | 1 | failed | failed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T10: qap_rules_set bloqueado (contrato blocked) en: fase distinta de WORKING, módulo no registrado, módulo planned, módulo waived | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T11: Primera llamada exitosa: observed -> interviewing; ids R-001, R-002... secuenciales por módulo | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T12: No-downgrade: regla source user confirmed no se sobrescribe con source dom/prd; waivers solo source user y reason no vacío; lote con regla inválida se rechaza completo | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T13: Dos llamadas concurrentes a qap_rules_set sin pérdida de actualización | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | 1 | failed | failed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | 1 | failed | failed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T3: Toda respuesta con siguiente_accion NO contiene "botones interactivos en modal" ni prohibición de listas | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T4: qap_status WORKING con módulo planned: sin pregunta de confirmación, sin "Ver otros módulos", sin botón de una sola opción, stats.modules refleja estado | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T5: lifecycle.json valida contra lifecycle-state.schema.json tras CADA mutación del flujo e2e | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | 1 | failed | failed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | 1 | failed | failed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T8: rules.yaml con manually_edited: true: discover no inserta reglas y declara el bloqueo canónico | 1 | passed | passed |
| packages/mcp/src/__tests__/p3-verification.test.ts | P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.1: qap_init en workspace con README devuelve pregunta fuente_de_verdad con ese README como opcion | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.2: qap_status a mitad de ONBOARDING devuelve la misma pregunta que ya estaba pendiente (reanudación) | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.3: Progresión canónica fuente_de_verdad -> objetivo -> roles -> flujos_criticos -> SCOPING | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.5: Test de inyección: package.json description y nombre de archivo con instrucciones aparecen sanitizados | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts | P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones B5: el detector nunca lee .env ni .env.local; SECRET_KEY=abc123 y credenciales nunca aparecen en scan ni salidas | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones B6: ninguna siguiente_accion tipo trabajo apunta a herramientas que exigen confirmación (qap_module_close, qap_session_close); constante <= 600 caracteres | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones B7: flujo corregir resumen realiza preguntas abiertas una por una citando propuesta, asigna source user, y permite confirmación final | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones B8: advierte si targetPath parece una subcarpeta de un repo con .git sin escanear fuera | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones B9: sanitizeDomString preserva "/", "_" y vocales acentuadas pero sanitiza caracteres de control e inyecciones HTML | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones Criterio 2 & B1: con el fixture de A1, ninguna pregunta de objetivo, roles o flujos es abierta si hay propuesta; critical_flows nunca contiene rutas; tarjeta no ofrece Confirmo todo con URL sin definir | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-1-b-block.test.ts | P4.3.1 Bloque B - Verificación y Cobertura de Correcciones Criterio 3 & B4: la ingesta no modifica notes de source_of_truth y escribe ingest.analyzed_by | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 3: Contrato MCP P4.3 3.1: qap_context_set con "PRD_diff.md" escrito libre ingiere en la misma llamada y la siguiente acción NO es abierta | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 3: Contrato MCP P4.3 3.2: con documento sin objetivo extraíble la siguiente_accion es trabajo | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 3: Contrato MCP P4.3 3.3: propuesta del agente se guarda como inferred con evidence y no avanza la fase | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 3: Contrato MCP P4.3 3.4: la ingesta no degrada source user | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 3: Contrato MCP P4.3 3.5: confirmación única (confirmo todo / corregir con seguimiento) y render_texto presente y consistente | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 4: Extracción determinista sobre PRD en español con pipeline de etapas reporta literal el resultado de la extracción heurística parsePrdContent | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 5: Flujo E2E ONBOARDING determinista flujo completo ONBOARDING sin ingest por iniciativa propia; falla si se emite pregunta abierta con dato existente | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-3-investigate-before-ask.test.ts | P4.3 Suite: Investigar antes de preguntar, Auto-ingesta, Confirmación única y Payload autosuficiente Criterio 5: Flujo E2E ONBOARDING determinista valida respuestas y payloads de regresión P4.3 | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 10. qap_auth_add con handoff: probado con doble de prueba que sustituye SOLO la ventana humana (resto real) | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 11. Test de no filtración: contraseña centinela NO aparece en respuestas, archivos .qa/, SQLite ni logs | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 12. qap_session_plan: reordena módulos de acceso al inicio del plan de forma determinista y persiste acceso: true | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 13. Validación integral de preguntas (C1 & C2): todas las preguntas de SCOPING y blocked son válidas, sin formato decision, sin "Deseas" y sin opciones únicas | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 14. Timeout de handoff (C4): qap_auth_add devuelve blocked con razon handoff_timeout y reintento idempotente | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 7. Secuencia de preguntas de SCOPING: 5 preguntas separadas y válidas sin mezclar módulos con auth | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 8. canExitScoping: compuerta falsa sin sesión verificada y verdadera con ella | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts | P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 9. qap_auth_add con verificación automática real contra el fixture HTTP local | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C7: compuerta de roles exige auth.roles no vacío y perfil verificado por cada rol para salir de SCOPING | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C8: tras "corregir", emite primero campos_a_corregir y luego pregunta abierta secuencial por campo | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a-integrity.test.ts | P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C2: Formatos de pregunta de roles según roles declarados C2-a: con 0 roles declarados genera formato abierta con ejemplo en el texto | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C2: Formatos de pregunta de roles según roles declarados C2-b: con 1 rol declarado genera formato una_opcion con 2 opciones y seguimiento abierto | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C2: Formatos de pregunta de roles según roles declarados C2-c: con 3 roles declarados genera formato multiple sin ninguna opción recomendada | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-c: cobertura completa nunca es true mientras exista una categoría diferida (deferred no cubre) | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C3-a: opciones de módulos en guidance usan normalizeSlug sin sustituir tildes por guiones bajos | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C3-b: qap_session_plan limpia módulos planned huérfanos que ya no pertenezcan al plan | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error | 1 | failed | failed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C6: Ciclo completo plan -> auth -> compuerta de SCOPING con adaptador real C6-a: plan bloqueado por perfil no verificado persiste, auth_add verifica y compuerta avanza a WORKING | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C9: Validación y filtrado riguroso de roles limpios C9-a: qap_init y qap_context_ingest descartan entradas de tabla Markdown y reportan roles_descartados | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C9: Validación y filtrado riguroso de roles limpios C9-b: los 4 lectores ignoran roles inválidos presentes en un context.yaml contaminado | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5a2-integrity.test.ts | P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C9: Validación y filtrado riguroso de roles limpios C9-c: roles legítimos con espacios, tildes, guiones y números son aceptados siempre | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C1: directivas contienen la indicación de preflight, exploracion y longitud <= 600 | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C1: qap_status y qap_init incluyen navegador_qap en proyecto inicializado | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C1: status/init conservan la frase histórica y discover declara persistencia canónica estática | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C4/C6: qap_context_ingest persiste module-candidates.json y qap_session_plan lo usa | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C4: qap_session_plan bloquea si candidato tiene ruta null con ejemplo generico fijo (/catalog) nunca derivado del nombre | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C5: qap_session_plan responde blocked (no error) si un id de candidato no existe | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C5: scoping con 3 y con 9 candidatos (máximo 7 por tarjeta + Otro módulo), sin recomendada en opciones y pasa guardia de emisión | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C6: qap_context_ingest sin candidatos cuando hay flujos criticos genera paso trabajo | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C6: qap_session_plan asigna high a los 3 primeros y medium al resto, con soporte retrocompatible para modules | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan C7: pregunta de alcance sin candidatos o sin front es byte a byte identica a la original | 1 | passed | passed |
| packages/mcp/src/__tests__/p4-5s1-browser-candidates.test.ts | P4.5-S1: Preflight browser, Module Candidates, and Session Plan D5: comando de instalacion consistente en preflight, qap_init, qap_status y checkPlaywrightBrowser | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) classifies historical plans without cases_fingerprint as unverifiable without deleting them (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) detects cyclic dependencies safely returning cycle information without unhandled crashes | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) detects duplicate case IDs across files and reports error before graph resolution | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) detects missing dependencies and returns structured error without crashing | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) detects modifications in YAML steps and dependencies post-plan generation (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) enforces authorized write mode and rejects directories with hardlinks in .qa (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) handles persistence write failure with sanitized error and no partial files (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) identifies and preserves manually edited cases with UpdateGuard | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) integrates completely with createMcpServer, exposes exactly 18 tools and dispatches qap_plan cleanly | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) never synthesizes fake test cases or relies on fallback defaultPlan | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) preserves manually edited test cases bit-for-bit on disk without modifying custom content (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) rejects invalid arguments (missing or malformed module) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) rejects symlinks and junctions inside project directory | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) rejects targetPath containing directory traversal escapes | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) rejects unauthorized external targetPath outside authorized projectRoots | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) resolves correct topological DAG order respecting dependencies and persists plan.json | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) returns blocked status if target module is not registered in .qa/modules/ | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) returns explicit cases: [] when cases exist but lack executable steps | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | PlanHandler Real Declarative Implementation (VNEXT-014-B) returns explicit cases: [] when module directory has no test cases | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.10: rejects plan with missing schema version (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.11: handles listTestCases failure as unverifiable and never as success (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.12: returns verified plan and cases snapshot for TOCTOU prevention (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.1: rejects truncated or altered matrix.cases even when test cases on disk are intact (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.2: rejects inverted DAG dependencies in matrix.cases (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.3: accepts valid alternate topological orders without arbitrary positional rejection (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.4: rejects environment mismatch between plan and requested environment (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.5: rejects module mismatch when plan belongs to another module (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.6: distinguishes corrupt JSON from missing plan and rejects missing matrix (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.7: rejects unknown or incompatible fingerprint and schema versions (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.8: rejects plan with missing cases_fingerprint_version (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/plan-handler.test.ts | R1 Deterministic Regressions — Plan Integrity & DAG Validation (VNEXT-014-C1) R1.9: rejects plan with missing checksum (FAIL BEFORE / PASS AFTER) | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R01: blocks reporting when no physical execution record exists | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R02: creates JSON from a persisted schema-valid execution unchanged | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R03: refuses inconsistent totals and does not create a report | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R04: latest selection respects module filter and real finished timestamps | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R05: blocks cross-module requests and path traversal identifiers | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R06: blocks screenshots pointing outside the approved evidence directory | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R07: renders all four formats from one persisted partial execution | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R08: rejects false PASS from a zero-case execution | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R09: rejects a contradictory partial status with no failed, skipped or blocked cases | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R10: rejects duplicate test identifiers without promoting ambiguous coverage | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R11: exposes exactly 18 tools and invokes the migrated report via MCP transport | 1 | passed | passed |
| packages/mcp/src/__tests__/report-handler.test.ts | VNEXT-014-D declarative ReportHandler — persisted evidence only D-R12: an initialized but empty executions directory returns a compatible blocked reason | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe ejecutar qap_init y crear el arbol .qa/ | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe generar reportes con qap_report y limpiar con qap_clean | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe operar sobre targetPath independiente de cwd y validar qap_server | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe registrar un perfil de autenticacion con qap_auth_add y listar con qap_auth_list | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe registrar y exponer la suite completa de 15 tools y prompts | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe ser idempotente en qap_init sin alterar context.yaml ni environments.yaml en segunda ejecución (Criterio 3) | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 debe validar y mostrar estado con directivas UX en qap_status | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_context_ingest: ingesta desde docPath y docContent, persistencia inferred, nunca avanza fase, rechazo de seguridad | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_context_set: dos llamadas concurrentes no pierden actualizaciones | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_context_set: merge parcial, no-downgrade de user, faltantes, transicion automatica con session.id y history | 1 | passed | passed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | 1 | failed | failed |
| packages/mcp/src/__tests__/server.test.ts | Suite MCP Server QAP v2.1 / v2.1.2 qap_session_plan: SCOPING define plan y auth, transiciona a WORKING, rechazo atomico, ampliacion en WORKING, bloqueada en ONBOARDING | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence blocks cleanup of uninitialized, external and junction projects without touching targets | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence clean blocks force=false and physically preserves every protected resource | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence clean blocks force=true and physically preserves every protected resource | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence clean blocks force=undefined and physically preserves every protected resource | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence detects concurrent legacy changes, active locks, aborts and unresolved journals | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence does not grow context history for an identical update and preserves it after reopening the server | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence isolates two projects explicitly bound to different applications in the same physical store | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence keeps corrupt YAML intact and reports sanitized errors | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence preserves incremental context, provenance, corrections and explicit confirmation without promoting canonical entities | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence preserves physical CAS, history, reference pins, rollback and integrity across two connections and reopen | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence preserves the browser installation directive without launching a browser | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence registers all three declarative owners exactly once and never falls back after failure | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence rejects cancellation before execution and preserves the fixture | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence rejects environment discrepancies before YAML writes and never copies legacy secrets to SQLite | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence reports a real multi-file publication failure and blocks replay while its recovery journal is unresolved | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence reports incomplete inventory without turning an unavailable query into zero modules | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence reports lifecycle failure after YAML publication instead of claiming global success | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence reports unavailable/ambiguous bindings without reopening or adopting a database | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence status inspects uninitialized and legacy projects without creating memory or scan files | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence status reports actual isolated SQLite inventory and leaves revisions unchanged | 1 | passed | passed |
| packages/mcp/src/__tests__/state-handlers.test.ts | VNEXT-012 real MCP and physical persistence validates nested inputs and sanitizes errors without logging canaries | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 10: supports cancellation and resource cleanup under AbortSignal (R4.10) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 11: persists execution results adhering to schema without automatic SQLite ConformityAssessment (R4.11) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 12: integrates cleanly via createMcpServer preserving exact 18 tools (R4.12) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 13: physical Playwright Chromium execution against isolated local HTTP fixture (Real PASS & FAIL) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 1: executes valid and authorized plan, persisting authentic result (R4.1) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 2: rejects missing, historical, corrupt, or obsolete plans without executing runner (R4.2) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 3: rejects environment mismatch, module mismatch, and missing module (R4.3) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 4: in-memory snapshot prevents TOCTOU tampering of YAML files after verification (R4.4) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 5: blocks unauthorized URLs, unconfigured host policy, and redirects (R4.5) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 6: classifies missing browser launch failure as infrastructure block (R4.6) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 7: rejects unauthorized profiles and disables implicit session recovery (R4.7) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 8: distinguishes real functional failure from infrastructure failure (R4.8) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | TestHandler & PlaywrightRunner Verification Suite — VNEXT-014-C2 (R4) Scenario 9: zero cases executed never returns fake PASS verdict (R4.9) | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-01: does not persist schema-invalid runner outputs | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-02: refuses traversal-capable execution IDs despite schema v1 accepting strings | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-03: failed execution persistence cannot be reported as success or recorded in history | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-04: history failure preserves saved evidence but returns an explicit partial error | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-05: rejects a schema-valid execution associated with a different module | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-06: rejects summary totals that disagree with executed cases | 1 | passed | passed |
| packages/mcp/src/__tests__/test-handler.test.ts | VNEXT-014-D preflight — execution evidence integrity D-07: a critical runner error persists not_run evidence without reporting MCP success | 1 | passed | passed |

## Primer error/disposición individual histórica preservada

| # | Archivo · fullName exacto | Primer error exacto | Clasificación | Causa / trabajo requerido |
| --- | --- | --- | --- | --- |
| 1 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.1: Aborts and rolls back if module revision mutates during human review window | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 2 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.2: Aborts if module is deactivated during review | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 3 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.3: Prevents approvalId reuse across closure attempts | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 4 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.4: Canonical closure unlocks qap_session_close | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 5 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 6 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock | AssertionError: expected 'blocked' to be 'waived' // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 7 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt | AssertionError: expected undefined to be true // Object.is equality | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 8 | adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity | Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting | Fixture incompatible + bloqueo legítimo de seguridad | El fixture usa MemoryKnowledgeStore sin withWriteFence; el flujo positivo se detiene sin consumir autoridad. Migrar positivos a SQLite físico y mantener negativo sin fence. No inferir que las aserciones posteriores ya pasaron. |
| 9 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 10 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers | AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…' | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 11 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones | AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated' | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 12 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\qap-v3-e2e-y81MEj\.qa\modules\auth\rules.yaml' | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 13 | lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Defecto de integración de pruebas / contrato antiguo | El fixture legacy no compone Knowledge/gateway canónicos o depende de contexto/rules.yaml que Discovery ya no produce. Migrar conservando la garantía funcional; no cambiar success por blocked como única aserción. |
| 14 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | TypeError: Cannot read properties of undefined (reading 'tipo') | Contrato ambiguo de presentación + fixture incompatible | Se esperan campos/guidance/razones del protocolo antiguo antes de satisfacer autoridad y contexto. Fijar contrato de presentación por ruta y retener negativos equivalentes, sin sustituir toda la garantía por el primer blocked. |
| 15 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | AssertionError: expected false to be true // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 16 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | TypeError: Cannot read properties of undefined (reading 'tipo') | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 17 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality | Contrato ambiguo de presentación + fixture incompatible | Se esperan campos/guidance/razones del protocolo antiguo antes de satisfacer autoridad y contexto. Fijar contrato de presentación por ruta y retener negativos equivalentes, sin sustituir toda la garantía por el primer blocked. |
| 18 | p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 19 | p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | Error: Tool qap_discover failed: { | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 20 | p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | Error: Tool qap_discover failed: { | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 21 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 22 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 23 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 24 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | AssertionError: expected undefined to be 'session_invalid' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 25 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 26 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 27 | p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 28 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 29 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 30 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 31 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 32 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | AssertionError: expected 'blocked' to be 'error' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 33 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\Documents\QAMCP\audit-r4-r10\node_modules\.tmp-rescate\qap-p45a-5jgnbu\.qa\modules\catalogo\rules.yaml' | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 34 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 35 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | TypeError: .toMatch() expects to receive a string, but got undefined | Contrato ambiguo de presentación + fixture incompatible | Se esperan campos/guidance/razones del protocolo antiguo antes de satisfacer autoridad y contexto. Fijar contrato de presentación por ruta y retener negativos equivalentes, sin sustituir toda la garantía por el primer blocked. |
| 36 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 37 | p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 38 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 39 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 40 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | AssertionError: expected undefined to be 'auth_required' // Object.is equality | Prueba obsoleta + bloqueo legítimo de seguridad | Expectativas de navegación autenticada/login/guard JS chocan con fresh_anonymous_static y rechazo de profile/credentials. Migrar al contrato explícito; no habilitar login implícito para dar verde. |
| 41 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 42 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 43 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 44 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 45 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 46 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | TypeError: Cannot read properties of undefined (reading 'id') | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 47 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | TypeError: Cannot read properties of undefined (reading 'id') | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 48 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error | AssertionError: expected 'blocked' to be 'error' // Object.is equality | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 49 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 50 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 51 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 52 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | AssertionError: expected false to be true // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 53 | p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | AssertionError: expected undefined to be defined | Fixture incompatible / contrato de entrevista antiguo | rules_set/module_close legacy carecen del contexto de vista revisado. Devuelven legacy_interview_unavailable antes de sustantividad/categoría/cobertura. La garantía posterior requiere escenario canónico equivalente. |
| 54 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 55 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 56 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | AssertionError: expected 'blocked' to be 'error' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 57 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 58 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 59 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | AssertionError: expected true to be falsy | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 60 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 61 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | AssertionError: expected 'blocked' to be 'success' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 62 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |
| 63 | server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | AssertionError: expected 'planned' to be 'observed' // Object.is equality | Fixture incompatible / prueba obsoleta | Discovery sin binding/autorización host o basado en el adaptador legacy bloquea antes de la garantía final. Reproducido knowledge_unbound. Separar adquisición canónica de YAML, preguntas y transición observed. |


## Primeros errores actuales de las 63 identidades

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.1: Aborts and rolls back if module revision mutates during human review window

~~~text
Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting
    at _Assertion.__VITEST_REJECTS__ (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1747:17)
    at _Assertion.propertyGetter (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)
    at Reflect.get (<anonymous>)
    at Object.proxyGetter [as get] (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:563:8
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.2: Aborts if module is deactivated during review

~~~text
Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting
    at _Assertion.__VITEST_REJECTS__ (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1747:17)
    at _Assertion.propertyGetter (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)
    at Reflect.get (<anonymous>)
    at Object.proxyGetter [as get] (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:616:8
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 3: Obsolete Revision Invalidation Stress-Testing 3.3: Prevents approvalId reuse across closure attempts

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:627:25
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 5: Legacy Closure Bypass Stress-Testing 5.4: Canonical closure unlocks qap_session_close

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:948:34
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.2: CanonicalClosureService serializes closure and second attempt is idempotent: true

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1165:27
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.3: Concurrent closure of distinct modules succeeds via bounded retry loop under SQLite CAS lock

~~~text
AssertionError: expected 'blocked' to be 'waived' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1209:33
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.4: Simultaneous closure requests for same module with divergent gateway decisions persist exactly one closure and canonical receipt

~~~text
AssertionError: expected undefined to be true // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1281:32
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/adversarial-r5-guarantees.test.ts · Adversarial Stress Audit — 7 Core Guarantees of R5 (§R2) Guarantee 7: CAS Concurrency Stress-Testing 7.5: Rejects write error recovery if existing receipt has tampered provenance or mismatched entity

~~~text
Error: promise resolved "{ status: 'blocked', …(2) }" instead of rejecting
    at _Assertion.__VITEST_REJECTS__ (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1747:17)
    at _Assertion.propertyGetter (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1570:27)
    at Reflect.get (<anonymous>)
    at Object.proxyGetter [as get] (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1659:22)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts:1373:10
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:537:30
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set

~~~text
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:140:52
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E1: regresión consolidated -> interviewing tras re-discover y política de waivers

~~~text
AssertionError: expected '{\n  "status": "blocked",\n  "code": …' to contain 'La categoría \'proposito\' no se pued…'
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:252:32
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E2: qap_module_close validaciones, compuertas y transiciones

~~~text
AssertionError: expected 'Falta el contexto de vista requerido …' to contain 'consolidated'
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:339:43
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/lifecycle-v3-e2e.test.ts · Lifecycle V3 E2E & Verification Suite (E0 - E3) E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP

~~~text
Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\AppData\Local\Temp\qap-v3-e2e-Hytyly\.qa\modules\auth\rules.yaml'
    at Proxy.readFileSync (node:fs:441:20)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/lifecycle-v3-e2e.test.ts:407:28
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision

~~~text
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p3-verification.test.ts:633:50
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle

~~~text
AssertionError: expected 'trabajo' to be 'entrevista_vista' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p3-verification.test.ts:755:45
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan

~~~text
TypeError: Cannot read properties of undefined (reading 'tipo')
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p3-verification.test.ts:330:36
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas)

~~~text
AssertionError: expected false to be true // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p3-verification.test.ts:351:35
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p3-verification.test.ts · P3 Suite de Verificación MCP (T3 - T15) T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision

~~~text
TypeError: Cannot read properties of undefined (reading 'tipo')
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p3-verification.test.ts:434:36
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada

~~~text
Error: Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
  "module_identity_status": "not_resolved",
  "coverage": "partial"
}
    at callTool (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts:95:13)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts:202:20
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-2-pregunta-contract.test.ts · P4.2 Suite: Contrato Canónico de Pregunta y Verificación E2E (Criterio 4 y Criterio 6) Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida

~~~text
Error: Tool qap_discover failed: {
  "status": "blocked",
  "code": "knowledge_unbound",
  "persistence": "not_attempted",
  "next_safe_action": "Revisar la configuración explícita del host.",
  "acquisition_status": "blocked",
  "acquisition_persistence": "not_attempted",
  "association_status": "not_attempted",
  "module_identity_status": "not_resolved",
  "coverage": "partial"
}
    at callTool (C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts:95:13)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-2-pregunta-contract.test.ts:292:23
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:175:26
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c)

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:854:26
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:206:26
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:228:26
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil

~~~text
AssertionError: expected undefined to be 'session_invalid' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:294:26
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:366:27
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-4-auth-lifecycle.test.ts · P4.4: Ciclo de Vida E2E de Autenticación con Playwright Real (MCP) 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts:392:27
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C1: campos honestos en bloqueos previos a navegar y navegación real

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:670:22
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:716:33
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred)

~~~text
AssertionError: expected 'blocked' to be 'error' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:451:41
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí)

~~~text
Error: ENOENT: no such file or directory, open 'C:\Users\Judirico\AppData\Local\Temp\qap-p45a-IIts8Z\.qa\modules\catalogo\rules.yaml'
    at Proxy.readFileSync (node:fs:441:20)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:535:28
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro

~~~text
AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:597:30
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4)

~~~text
TypeError: .toMatch() expects to receive a string, but got undefined
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1293:10)
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1156:15)
    at Proxy.methodWrapper (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:640:43
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:295:37
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:175:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:210:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a-integrity.test.ts · P4.5-A Suite de Integridad de Conocimiento (Criterios 2, 3, 4, C7, C9a) Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro

~~~text
AssertionError: expected 'Falta el contexto de vista requerido …' to be 'cobertura_insuficiente' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a-integrity.test.ts:245:35
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:732:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:754:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C10: Detección y advertencia de extracción vacía C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:770:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success)

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:127:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:144:30
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C1: Clasificación honesta con adaptador real C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login

~~~text
AssertionError: expected undefined to be 'auth_required' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:161:30
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:289:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Integridad de categoría en from_option y regla de cobertura completa C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked

~~~text
AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1319:15)
    at Proxy.<anonymous> (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:1156:15)
    at Proxy.methodWrapper (file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:1700:25)
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:334:30
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD

~~~text
AssertionError: expected false to be true // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:837:34
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C3: Transliteración NFD de slugs y prevención de módulos fuera del plan C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml

~~~text
AssertionError: expected undefined to be defined
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:877:17
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:385:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:416:31
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:450:40
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre

~~~text
TypeError: Cannot read properties of undefined (reading 'id')
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:482:58
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre

~~~text
TypeError: Cannot read properties of undefined (reading 'id')
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:526:58
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/p4-5a2-integrity.test.ts · P4.5-A.2 Suite de Integridad y Verificación (C1, C2, C3, C4, C6, C9, C10) C4: Flujo de respuestas cortas como borrador y propuesta de enunciado C4-f: propuesta_enunciado corta o genérica es rechazada con status error

~~~text
AssertionError: expected 'blocked' to be 'error' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/p4-5a2-integrity.test.ts:562:36
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada

~~~text
AssertionError: expected 'blocked' to be 'success' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:1411:56
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover

~~~text
AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:1445:33
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:784:25
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:848:25
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:912:25
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 debe descubrir modulos y responder en desarrollo para qap_plan y qap_test

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:267:36
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4)

~~~text
AssertionError: expected true to be falsy
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:637:36
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4)

~~~text
AssertionError: expected 'blocked' to be 'error' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:724:27
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed

~~~text
AssertionError: expected undefined to be 'ONBOARDING' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:1261:58
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

### src/__tests__/server.test.ts · Suite MCP Server QAP v2.1 / v2.1.2 qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance

~~~text
AssertionError: expected 'planned' to be 'observed' // Object.is equality
    at C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/src/__tests__/server.test.ts:1604:46
    at file:///C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/node_modules/.pnpm/@vitest+runner@4.1.11/node_modules/@vitest/runner/dist/chunk-artifact.js:1903:20
~~~

Las diferencias de paralelismo se documentan con sus identidades exactas en [RESULTADOS_TESTS](RESULTADOS_TESTS.md); no contaminan la comparación serial ni se ocultan detrás del baseline de 63.
