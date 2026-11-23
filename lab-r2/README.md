# QAP R2 · Laboratorio Experimental Hydrogen

- **Rama:** `lab/qap-hydrogen-r2-2026-11-23`
- **Base congelada:** `a78322f832fd69ccf58b7cb24f1571c8e1481e75` (`3c6a83bcadcdcf9404a02da0610d7af2a3d2e52c`)
- **Compuertas:** `G0 = NO-GO`, `G1 = SIN INICIAR`

## Distinción de controles
Los 12 vectores históricos y las 4 identidades originales de los falsos PASS previos **no están disponibles** en el expediente recuperado (`docs/qap-recovery/00-estado-y-procedencia.md`). Los controles `C01`–`C12` ejecutados en este laboratorio son **nuevos controles técnicos** definidos en `docs/qap-recovery/handoff-codex-high.md` para falsación de R2.

## Estructura
- `baseline/r2-0-freeze.json`: Precondiciones, versiones, hashes de bundle y configuración congelada.
- `witness-sqlite.mjs`: Proceso testigo independiente que abre SQLite en modo `readOnly`.
- `r2-1-reproduce-false-pass.mjs`: Reproducción diferencial del falso PASS heredado (brazo `COMMIT` vs brazo `ROLLBACK`) sobre MCP real sin parches.
- `evidence/`: Evidencias sanitizadas y manifiestos SHA-256 calculados tras la generación.
