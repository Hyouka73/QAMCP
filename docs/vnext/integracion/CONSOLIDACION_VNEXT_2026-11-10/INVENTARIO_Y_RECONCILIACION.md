# Consolidación local de vNext — 2026-11-10

Alcance corregido por el responsable: consolidar trabajo existente, conservar historial y documentación, compilar y verificar exclusivamente con fixtures técnicos. Sin desarrollo de capacidades nuevas ni aceptación empresarial. Sin cambios en develop, main o admin-user.json.

## Genealogía e integración

HEAD remoto verificado al inicio: `08a34bbdaffc1aee89b2fe1a26b08eab66c284d1`.

- `a64a90aa39374772fc756032b291688496e6a73c` (DEV-MVP-02) tiene por padre exacto `7a3d6dd6c189feb85d8097792ef1f0c2915e5c65` (INT-03-R5).
- R5 tiene por padre `df107c3117b23558c6988d5e2e38c2d6bc181945`, merge que conserva DEV-MVP-01-R4 `d49297a36f0340d46108553bb1e7989c66549eb1` y el candidato de QA `18199e0c036ab53c6d0f7af0a9f65740eb0aec89`.
- R4 conserva las remediaciones R3 `15eaabc`, R2 `c9d624c` y R1 `ea54a8b`, contribuciones accesibles atribuidas a Antigravity mediante sus informes y handoffs locales, sin atribuir acceso a otras computadoras.
- Base común de DEV-MVP-02 y vNext remoto: `dda870e4695a8a27db07ea32b81c1efbbf6ba39e`.
- Merge `90f7660d60c1a6c41bbab7953691bee25679d63e`: DEV-MVP-02 + `08a34bb`. Sin conflictos. Conserva íntegros el contrato operativo publicado y REQUISITOS_Y_DECISIONES.
- Merge `9be02fe`: integra la contribución existente VNEXT-015-04 (`0b8d8c78b2e76be170cc399ece8d063db3d3c501`, informe `7149c030eb814e759bc824b1106c8bf3d77e1d11`). Único conflicto en `packages/knowledge/src/index.ts`, resuelto conservando las exportaciones de Flow Impact, BVA y RBAC. No se cambiaron los algoritmos ni las pruebas.
- Se conservan como archivos exactos los dos informes R7 previos sin guardar del checkout principal. Su estado histórico NO-GO no se reescribe.
- Historial R7 de Antigravity: `f555f9d`, `c34e1e5`, `dda870e` ya ancestros del candidato. Handoff `worker_r7_integrator/handoff.md` identifica la entrega `f555f9dc2d17a2933210cc49db7dbe3bdda646f0`. Los informes y remediaciones posteriores se conservan, sin convertir el handoff en aceptación.

## Inventario y clasificación

Se inspeccionaron 15 worktrees registrados de un repositorio y un checkout Git independiente (`vnext014-reparacion-audit`), 16 checkouts QAMCP accesibles en total. Búsqueda local en Documents, Desktop, Downloads, .codex/worktrees y directorios scratch de Gemini; se excluyeron dependencias, caches y reparse points. No se inspeccionaron otras computadoras ni se afirma cobertura de discos o ubicaciones no enumeradas.

| Checkout | HEAD inicial | Conservación |
|---|---|---|
| `C:\Users\Judirico\Documents\QAMCP\audit-r4-r10` | `7cfdefca9482` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\Documents\QAMCP\audit-r4-r10-docs` | `0e5825cfd256` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\Documents\QAMCP\audit-r4-r8` | `4829a7d4af86` | CONSERVADO; HEAD ancestro del candidato; cambios locales retenidos sin borrado |
| `C:\Users\Judirico\Documents\QAMCP\audit-r4-r9` | `05c0253b90c1` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\Documents\QAMCP\QAMCP` | `dda870e4695a` | CONSERVADO; HEAD ancestro del candidato; cambios locales retenidos sin borrado |
| `C:\Users\Judirico\Documents\QAMCP\vnext014-conv` | `6f4f55c41d5e` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\Documents\QAMCP\vnext014-reparacion-audit` | `3fe4fec91843` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\Documents\QAMCP\worktrees\mvp01-bva-rbac` | `d49297a36f03` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\dev-mvp-02\QAMCP` | `a64a90aa3937` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\int-03-r5\QAMCP` | `7a3d6dd6c189` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\int01-mvp-lab\QAMCP` | `4d2b5ee81d7b` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\int03-mvp-fixes\QAMCP` | `e27544a98854` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\int03-qa-r1\QAMCP` | `18199e0c036a` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\int03-r4-consolidated\mvp01-bva-rbac` | `df107c3117b2` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\mvp-integral\QAMCP` | `90f7660d60c1` | CONSERVADO; HEAD ancestro del candidato |
| `C:\Users\Judirico\.codex\worktrees\vnext-015-04\QAMCP` | `7149c030eb81` | CONSERVADO; HEAD ancestro del candidato |

El estado indicado para VNEXT-015-04 corresponde a su conservación tras el merge `9be02fe`; el inventario JSON conserva la medición anterior al merge.

Las ramas locales `feat/qap-vnext-architecture` (`dda870e`) y `feat/qap-vnext-architecture-work` (`6f4f55c`) quedan conservadas; sus commits son ancestros del candidato. No se mueven referencias de checkouts ajenos con cambios locales. Las referencias locales de develop y main se inspeccionan de solo lectura.

El repositorio independiente conserva las ramas `audit/vnext014-reparacion` (`541c925`), `feat/qap-vnext-architecture` (`ed2955f`) y `fix/vnext-014-cierre-controlado` (`3fe4fec`), todas integradas por genealogía. No se reejecuta un merge de versiones antiguas.

## Snapshots sustituidos y respaldo

- `480eed8f` → `a64a90a`: mismo producto; la versión retenida añade evidencia y hashes.
- `eadb2f94` → `df107c3`: mismo producto; la versión retenida añade documentación/hashes de auditoría.
- `f967d777` → `7a3d6dd`: mismo producto; la versión retenida corrige la conservación de evidencias.
- `9044ceb8` → `6ce7472`: mismo producto; delta documental STATE/WBS. Se retiene la genealogía publicada sin reescribir tareas históricas.
- `63ddfa7` → `3fe4fec`: mismo producto y paquete de auditoría; dos líneas de representación documental difieren. Se conserva el commit publicado y el alternativo queda respaldado.
- `d22036f` → `8cacaa2`: snapshot anterior del visor/reportes, sustituido por la entrega publicada con saneamiento de fixtures. Se respalda sin restaurar datos antiguos ni reemplazar el template actual.
- `c5345e7`: backup histórico de S3-001, S2-005 y S2-006. El candidato conserva las entregas posteriores `5dd1568`, `720e84f`, `ae14c23` y la evolución de Auth/Engine. Se archiva el snapshot, sin restaurar interfaces antiguas sobre contratos vigentes.
- `b987d23` / `8aaaf53`: antiguo WIP e índice; el único delta del WIP respecto de su padre es admin-user.json. No se aplica, no se publica ni se altera ese archivo.
- `QAMCP-claude-respaldo.patch`: archivo de cero bytes; no contiene cambios recuperables.
- SPA iniciada antes de la corrección de alcance: EXPERIMENTAL EXCLUIDO; parche local SHA-256 `41c6a78ed3a98558704bb9b12d340fc289c9e215c3c4243aacad414f3f3c958a`. Los cinco archivos se restauraron a su versión integrada antes del build de consolidación.

Los commits no referenciados se conservaron bajo refs/archive locales y en bundles Git locales. Los bundles NO se publican: incluyen historial y snapshots privados. Las evidencias externas de auditoría se inventarían y conservan físicamente; no se borran residuos ni directorios con archivos sin guardar.

## Pendientes de comprobar

Informe adicional de reconciliación de Antigravity: NO DISPONIBLE. El responsable confirmó que la sesión es independiente y aportará el archivo. Las contribuciones accesibles se clasifican arriba; no se presume que constituyen todo su trabajo. Por ello no se declara consolidación total.

El checkout principal conserva admin-user.json modificado previamente y dos informes de auditoría sin guardar; audit-r4-r8 conserva sus fixtures y residuos sin guardar. No se elimina ningún checkout o rama mientras exista reconciliación pendiente.

## Validación

Resultados físicos, SHA final publicado y dictamen de integración se registrarán en el addendum de validación. La prueba vertical usa el arnés existente `scripts/dev-mvp02-vertical.mjs`, decisiones de operador técnico de fixture explícitamente marcadas NOT-human-acceptance, sin afirmar aceptación humana o empresarial.

La compatibilidad Discovery sigue siendo estática con cookies. No se incorpora el experimento SPA ni se declaran completadas brechas de producto de la especificación del 9 de noviembre.
