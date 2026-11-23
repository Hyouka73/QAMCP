# Resultados de Ejecución R2 · Hydrogen

- **Fecha:** 2026-11-23 (Ciudad de México)
- **Repositorio:** `Hyouka73/QAMCP`
- **Rama experimental:** `lab/qap-hydrogen-r2-2026-11-23`
- **Base congelada (R2.0):** commit `a78322f832fd69ccf58b7cb24f1571c8e1481e75`, árbol `3c6a83bcadcdcf9404a02da0610d7af2a3d2e52c`
- **Entorno:** Windows 11 Home x64, Node `24.15.0`, pnpm `12.3.4`, SQLite integrado `3.51.3`, Chromium `153.0.8010.12`, TypeScript `5.5.4`
- **Estado de compuertas:** **`G0 = NO-GO`**, **`G1 = SIN INICIAR`** (la revisión R3 es independiente; este documento no aprueba G0 ni inicia G1).

---

## Resumen de Dictámenes

| Etapa / Alcance | Dictamen | Evidencia principal |
| --- | --- | --- |
| **R2.0** Congelación de base y protocolo | **DEMOSTRADO** | `lab-r2/baseline/r2-0-freeze.json` |
| **R2.1** Reproducción diferencial de falso PASS heredado | **DEMOSTRADO** | `lab-r2/r2-1-reproduce-false-pass.mjs`, `lab-r2/evidence/r2-1/` |
| **R2.2** Evaluador de efecto, `RunSpec` y testigo `I2` | **DEMOSTRADO** | `packages/playwright-runner/src/effect-evaluator.ts`, `lab-r2/r2-2-verify-effect.mjs`, `lab-r2/evidence/r2-2/` |
| **R2.3** Controles técnicos `C01`–`C12` + positivo | **DEMOSTRADO** | `lab-r2/r2-3-controls-c01-c12.mjs`, `lab-r2/evidence/r2-3/` |
| **R2.4** Replay, integridad (1 byte) y 3 cortes externos | **DEMOSTRADO** | `lab-r2/r2-4-recovery-integrity.mjs`, `lab-r2/evidence/r2-4/` |
| **R2.5** Deuda TypeScript `@qap/mcp` (`144` → `0`) | **DEMOSTRADO** | `pnpm --filter @qap/mcp exec tsc --noEmit --pretty false` (exit 0), `pnpm build` (exit 0) |
| **R2.6 (I3)** Segundo dominio cálculo/conciliación | **DEMOSTRADO** | `lab-r2/r2-6-i3-e5-e2.mjs`, `lab-r2/evidence/r2-6/` |
| **R2.6 (E5)** Extracción primaria con vigencia y abstención | **DEMOSTRADO** | `lab-r2/fixtures/primary-policy-v1.md`, `lab-r2/r2-6-i3-e5-e2.mjs` |
| **R2.6 (E2)** Interfaz ciega sin respuestas reservadas | **NO_EJECUTADO** | Contrato de interfaz en `lab-r2/evidence/r2-6/r2-6-summary.json` |
| **E1 HOST** Cliente externo real | **NO_EJECUTADO** | No ejecutado en esta corrida automatizada R2 |
| **LENDUS CORE** | **BLOQUEADO** | Sin manual primario versionado ni acceso autorizado |

> **Nota sobre vectores históricos:** Los 12 vectores históricos y las 4 identidades originales de los falsos PASS previos no se encuentran en el repositorio (`docs/qap-recovery/00-estado-y-procedencia.md`). Los controles `C01`–`C12` acreditados en R2.3 corresponden a los 12 controles técnicos nuevos definidos en `docs/qap-recovery/handoff-codex-high.md`.

---

## Detalle por Etapa

### R2.0 — Congelación de Línea Base
- `packages/mcp/dist/build-meta.json` compilado sobre `a78322f832fd69ccf58b7cb24f1571c8e1481e75`: `buildFingerprint = 7e19678e5efbe48c3badcff7fb081d0cc94d2c0390e44d19731c255d896330e9`, `bundleSha256 = 2fb424fbf0a62ce3ac6aaba860ae29e05f15f1ac716caa61e3a75a3da8ac188e`.
- Diagnósticos iniciales de TypeScript en `@qap/mcp`: `144` (`7` fuera de rutas de test, `137` en tests/mocks).

### R2.1 — Reproducción del Falso PASS Heredado (sin parches)
Comando: `node lab-r2/r2-1-reproduce-false-pass.mjs`
- **Brazo `COMMIT`** (`att_48c321138ba14a57`): `POST /fixture-write -> 201`, testigo SQLite `readOnly` (`lab-r2/witness-sqlite.mjs`) antes de limpieza `count=1` (`["reservation-fixture"]`), después de limpieza `count=0`. Runner y reporte: `passed`.
- **Brazo `ROLLBACK`** (`att_d6f71d62c0fa4183`): `POST /fixture-write -> 201`, testigo SQLite `readOnly` antes de limpieza `count=0` (`[]`), después de limpieza `count=0`. Runner y reporte legado: **`passed` (falso PASS reproducido)**.
- Evidencias sanitizadas y manifiesto SHA-256: `lab-r2/evidence/r2-1/manifest.sha256.json`.

### R2.2 — Evaluador de Efecto, `RunSpec` y Testigo `I2`
- Se implementó `packages/playwright-runner/src/effect-evaluator.ts` (`RunSpec`, `computeRunSpecDigest`, `computeEffectEvidenceDigest`, `evaluateEffect`, `runSqliteReadOnlyWitness`).
- Se integró el testigo `I2` (proceso Node separado en SQLite `readOnly`) en `packages/playwright-runner/src/runner.ts` (precondición antes de armar escritura, post-escritura antes de limpieza, y post-limpieza) y `evaluateEffect` en `packages/mcp/src/handlers/test.handler.ts` antes de `stageProvisionalMcpFinalization`.
- `packages/mcp/src/handlers/report.handler.ts` valida `run_spec_digest`, `evidence_digest` y prohíbe reportar `passed` cuando `effect_evaluation.verdict !== 'PASS'`.
- Verificación diferencial (`node lab-r2/r2-2-verify-effect.mjs`):
  - `COMMIT`: `effect_verdict = PASS`, `report_result = passed` (`effect_verified`).
  - `ROLLBACK`: `effect_verdict = FAIL`, `report_result = failed` (`effect_missing_after_write`).

### R2.3 — Controles Técnicos `C01`–`C12`
Comando: `node lab-r2/r2-3-controls-c01-c12.mjs`
- **Resultado:** `13/13` controles aprobados (`POS` + `C01`–`C12`), **`0` falsos PASS**.
  - `C01` (201 + ROLLBACK): `FAIL` (`effect_missing_after_write`) — MCP E2E real.
  - `C02` (fila preexistente): `BLOCKED` (`precondition_not_clean`) — MCP E2E real.
  - `C03` (clave distinta): `FAIL` (`effect_key_or_value_mismatch`) — MCP E2E real.
  - `C04` (duplicación): `FAIL` (`effect_cardinality_mismatch`) — MCP E2E real.
  - `C05` (testigo `I1` no independiente): `INDETERMINATE` (`witness_not_independent`).
  - `C06` (`attempt_id` distinto): `BLOCKED` (`correlation_mismatch`).
  - `C07` (tenant distinto): `BLOCKED` (`scope_mismatch`).
  - `C08` (BD testigo inaccesible): `TECHNICAL_ERROR` (`witness_connection_error`) — MCP E2E real.
  - `C09` (fuente ausente): `INDETERMINATE` (`expectation_source_missing`) — MCP E2E real.
  - `C10` (artefacto alterado): `blocked` (`execution_digest_mismatch`) — MCP E2E real.
  - `C11` (cleanup 204 deja fila): `TECHNICAL_ERROR` (`cleanup_failed`) — MCP E2E real.
  - `C12` (fuera de ventana): `INDETERMINATE` (`effect_outside_observation_window`).
- Manifiesto SHA-256: `lab-r2/evidence/r2-3/manifest.sha256.json`.

### R2.4 — Replay, Integridad y Cortes Externos
Comando: `node lab-r2/r2-4-recovery-integrity.mjs`
- **Replay tras reinicio MCP:** `att_c0706dc8aa774fb2` → reinicio → `att_0e94b42ee6a84e97`. Mismo `run_spec_digest`, `0` peticiones GET de redescubrimiento.
- **Manipulación de 1 byte conservando nombre, tipo y tamaño:** rechazada en `qap_report` con `execution_digest_mismatch`.
- **Cortes externos OS (`SIGKILL` / `TerminateProcess`) en 3 checkpoints:**
  - `before_write`: `0` filas en SQLite, `0` escrituras duplicadas tras `qap_status`.
  - `after_201_before_witness`: `1` fila en SQLite, `0` escrituras duplicadas tras `qap_status`.
  - `after_observation_before_publish`: `0` filas en SQLite, `0` escrituras duplicadas tras `qap_status`.
- Manifiesto SHA-256: `lab-r2/evidence/r2-4/manifest.sha256.json`.

### R2.5 — Resolución de Deuda TypeScript en `@qap/mcp` (copia experimental)
- Se corrigieron las 7 causas raíz fuera de tests (`guidance.ts`, `context.handler.ts`, `conversational-case-workflow.ts`, `rule-resolution-handler.ts`, `status.handler.ts`, `host-composition.ts`, `scoped-password.ts`) y los 137 diagnósticos en tests/mocks (creando helpers tipados en `packages/mcp/src/__tests__/helpers/` sin relajar `strict` ni usar `any` generalizado).
- `pnpm --filter @qap/mcp exec tsc --noEmit --pretty false`: **exit 0 (`0` errores)**.
- `pnpm build`: **exit 0**.
- `node scripts/test-knowledge-smoke-stdio.mjs --verify-cli`: **exit 0**.
- Vitest: `report-handler.test.ts` (`13/13` passed), `guidance.test.ts` (`8/8` passed). Nota: suites heredadas que dependen de `qap_init` sin composición `host`/`autonomy` (ej. `p0-4-mcp-evidence-report.test.ts`) fallan por el contrato separado en `d4cfadf`.

### R2.6 — Segundo Dominio `I3`, Extracción `E5` e Interfaz Ciega `E2`
Comando: `node lab-r2/r2-6-i3-e5-e2.mjs`
- **I3 (cálculo/conciliación en centavos exactos `BigInt` + zona horaria `America/Mexico_City` y corte `18:00`):** el oráculo independiente `I3` coincide con el SUT sano y detecta al mutante (truncamiento flotante + omisión de corte).
- **E5 (extracción primaria `lab-r2/fixtures/primary-policy-v1.md`):** extracción válida con cita y SHA-256 (`EXTRACTED`), y abstención explícita (`ABSTAIN`) ante vigencia vencida (`outside_validity_window`) o fuentes en conflicto (`conflicting_primary_sources`).
- **E2:** interfaz preparada con separación de custodio y umbrales históricos (`80%` / `75%`), estado **`NO_EJECUTADO`**.
- Manifiesto SHA-256: `lab-r2/evidence/r2-6/manifest.sha256.json`.
