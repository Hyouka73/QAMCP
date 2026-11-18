# DEV-MVP-01-R4 — auditoría independiente

Fecha: 2026-11-09 (America/Mexico_City). Alcance: corrección R4 y regresiones directamente relacionadas; no certifica el MVP integral.

**GO para integrar** `d49297a36f0340d46108553bb1e7989c66549eb1`. No se reprodujo un P0/P1 en este alcance.

## Procedimiento físico

- SHA y estado limpio comprobados en ambos worktrees originales (INT-03: `18199e0c036ab53c6d0f7af0a9f65740eb0aec89`). Ninguna suite ni build se ejecutó sobre ellos.
- Checkout aislado R4 creado mediante create_worktree: `C:/Users/Judirico/.codex/worktrees/r4-int03-independent/mvp01-bva-rbac`.
- Instalación offline frozen-lockfile; Node 24.15.0, pnpm 12.3.4.
- Los arneses externos se copiaron sin modificar, junto con su referencia R2. Una junction mantiene sus rutas relativas hacia el checkout aislado. Los SHA256 de originales y copias coinciden (`harness-hashes.json`).
- Revisión directa de diff R4, extracción/fusión de límites, materialización y validación de oráculos, procedencia RBAC, identidad y evidencia positiva de denegación.

## Resultados

| Comando / arnés | Resultado |
| --- | --- |
| exact-verification.mjs | 19/19: siete originales, cinco regresiones dirigidas, siete controles |
| browser-r3.mjs | 20/20 comprobaciones numéricas en Edge; implementación correcta 5/5 |
| reproduce.mjs | 9/9, incluida denegación ante HTTP 500 |
| Cinco suites focales BVA/RBAC | 179/179 |
| Knowledge completo | 528/528, 34 archivos |
| pnpm build | exit 0 |
| pnpm lint | exit 1: 64 errores, 23 advertencias heredados, fuera de los archivos modificados por R4 |
| pnpm exec tsc --noEmit | exit 2; línea base adicional capturada para comparación de integración |

`min=20,max=20` produce `19/error`, `20/success` (mínimo, nominal y máximo), `21/error`, con aserciones visibles. El arnés de navegador usa el executeAssert oficial del Runner: la implementación correcta pasa 5/5; el mutante con solo max=20 falla para 19. No se infiere éxito de la sola ausencia de error.

La comprobación browser-r3 imprime resultados pero su exit 0 por sí solo no certifica el mutante: se inspeccionó explícitamente `runnerPassed=false` para faulty-lost-minimum/19 y `true` para los cinco casos correctos.

## Límites del dictamen

GO del generador y corrección R4 no habilita automáticamente la ejecución canónica de BVA/RBAC. INT-03 impone bloqueos de autoridad/oráculo, interceptación y transición de sesión que deben conservarse en el consolidado. Lint global y typecheck no están verdes; sus diagnósticos deben clasificarse sin ocultarlos ni ampliar este trabajo a remediación general.

Evidencia cruda en `logs/r4-*.log` y `logs/r4-*.json`. No se modificó admin-user.json, no hubo push, publicación ni merge a develop.
