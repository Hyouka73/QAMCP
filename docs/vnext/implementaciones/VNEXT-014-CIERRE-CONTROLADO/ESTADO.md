# VNEXT-014 — Estado de la reparación aislada

**Fecha:** 2026-11-05. **Repositorio:** Hyouka73/QAMCP.
**Rama:** `fix/vnext-014-cierre-controlado`.
**SHA base:** `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6` (HEAD de `feat/qap-vnext-architecture` comprobado antes de crear la rama).
**Decisión de rama:** la orden expresa del usuario de 2026-11-05 de crear una rama nueva prevalece para este lote sobre la política de rama única registrada previamente en el WBS. La rama original, `develop`, `staging` y `main` no se editan. La rama vNext original puede avanzar en paralelo y su nuevo HEAD no debe sobrescribirse.

## Estado observado y alcance

- La auditoría original y la convergencia previa informaron qap_plan/qap_test operativos en serie y reparaciones A01/A02/C01 publicadas. No se han reimplementado.
- Se halló por lectura de código una normalización excesiva en `CanonicalClosureService.persistWithKnowledgeFence`: excepciones no reconocidas de I/O o persistencia terminaban como `blocked/closure_consistency_conflict`. Se ajustó para propagar las inesperadas y conservar la respuesta bloqueada ante errores conocidos de consistencia y expiración.
- Se añadió regresión del error inesperado y se prepararon las ocho pruebas adversariales históricas para un `SqliteKnowledgeAdapter` físico, con conexiones separadas en las pruebas de concurrencia. Las dos pruebas de revisión obsoleta comprueban el bloqueo explícito y ausencia de recibos o aprobaciones.
- **Este entorno está conectado a GitHub, pero no dispone del checkout del repositorio ni de una ejecución local pnpm/Windows/Playwright.** Todo test/build/lint nuevo está **NO EJECUTADO**. Las correcciones publicadas no se califican como PASS hasta la auditoría física.
- Las 55 identidades MCP restantes no se han modificado ni reconciliado. E01 en paralelo, lint histórico, E2E completo y consentimiento humano auténtico siguen abiertos.

## Comp puertas pendientes

A. Integridad: ejecutar positivos y negativos A01/A02/C01 y la regresión nueva CF01 sobre SHA congelado.
B. Reconciliación: ejecutar las ocho identidades migradas, revisar por equivalencia las 55 restantes y reproducir E01/Windows en paralelo.
C. Cierre VNEXT-014: certificar flujo oficial y revisión humana auténtica, con readback de SQLite y filesystem.
D. Integración: **NO-GO** hasta aprobar A+B+C y los criterios del WBS vigente.

Fechas históricas preservadas: 16/11 certificación objetivo; 19/11 posible integración solo con GO; 20/11 MVP. Ninguna fecha convierte NO-GO en GO.

Consultar [matriz](MATRIZ_HALLAZGOS.md), [correcciones](CORRECCIONES.md), [resultados](RESULTADOS.md), [auditoría Codex](PROMPT_CODEX.md) y [dictamen](GO_NO_GO.md).
