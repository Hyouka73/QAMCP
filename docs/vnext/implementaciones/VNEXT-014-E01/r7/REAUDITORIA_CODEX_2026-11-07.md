# Reauditoría independiente de la remediación R7

Fecha: 2026-11-07 (America/Mexico_City).
Rama y HEAD comprobados: `feat/qap-vnext-architecture`, `c34e1e51b153cb7006104cd0e698ad2a3e905083`.
Base de comparación: `f555f9dc2d17a2933210cc49db7dbe3bdda646f0`.

**Dictamen de entrega: no aceptada todavía como compuerta de autorización.**
**Dictamen operativo: EJECUTOR_NO_APTO — PREPARADO / RESERVA NO ACREDITADA. E01 no ejecutada, no autorizada y no resuelta.**

La suite entregada pasa sus 62 pruebas, pero las comprobaciones adversariales siguientes descubren requisitos pendientes. Este informe no modifica los entregables auditados ni concede aprobación de infraestructura. Los resultados APTO reproducidos son falsos positivos sintéticos de la herramienta, nunca decisiones de este auditor.

## Verificaciones independientes

| Comprobación | Resultado observado |
|---|---|
| `node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs` | 62 PASS, 0 FAIL, 0 skipped; exit 0 |
| CLI con `manifest-ejemplo.json` | VALIDADOR_PASS, EJECUTOR_NO_APTO, razón PREPARADO / RESERVA NO ACREDITADA; exit 0 |
| CLI con `--unknown-flag` | Rechazo explícito; exit 1 |
| CLI con `--expected-sha` seguido de 40 ceros | Discrepancia rechazada; exit 1 |
| CLI con `--expected-sha` sin valor | VALIDADOR_PASS; exit 0 (defecto) |
| CLI con `--max-gap=abc` | VALIDADOR_PASS; exit 0 (defecto) |
| Parseo AST de PowerShell | 0 errores sintácticos |
| Función de confinamiento extraída del AST, con rutas hermanas y PID/centinela externos | Rechazo correcto, sin escribir archivos |
| `git diff --name-status BASE ENTREGA` | Sólo cinco archivos, todos bajo r7 |
| Comparación de los cinco entregables del checkout contra ENTREGA | Sin diferencias locales |

Se inspeccionó README y la evidencia histórica en `C:/Users/Judirico/Documents/QAMCP/.agents/teamwork/worker_r7_agente3_codex/reproduction_evidence.md`. Esta última está fuera de la raíz Git real (`C:/Users/Judirico/Documents/QAMCP/QAMCP`), por lo que la ruta relativa del traspaso no funciona desde la raíz del repositorio. Es evidencia local complementaria, no un archivo incorporado por el commit. Su sección A04 reproduce un rechazo ya existente y A07 describe rutas del validador en vez del defecto de escritura PowerShell; no acredita reproducción dinámica completa de esos dos defectos originales.

## Estado de los siete hallazgos

| Hallazgo original | Cierre | Evidencia pendiente |
|---|---|---|
| R7-A01 | Parcial; P1 pendiente | Una bandera CLI sigue sustituyendo una decisión auditable vinculada al ejecutor y la evidencia |
| R7-A02 | Parcial; P1 pendiente | Esquema interno, tipos, rangos, agregados y consistencia temporal incompletos |
| R7-A03 | Parcial; P1 pendiente | CPU externa excluye todos los procesos Node/Chromium por nombre, sin identificar los autorizados |
| R7-A04 | Parcial; P1 pendiente | Fallo de git status tratado como limpio; contadores ausentes todavía pueden convertirse a cero |
| R7-A05 | Parcial; P1 pendiente | Contradicción clean/dirty ignorada; SHA esperado no obligatorio para APTO; argumentos CLI incompletos aceptados |
| R7-A06 | Cerrado para comparación canónica predeterminada | Node/pnpm/Chromium exactos y Chromium obligatorio por defecto. No representa aprobación de capacidad física |
| R7-A07 | Parcial; P2 pendiente | Se corrigen prefijos hermanos y parámetros internos, pero faltan enlaces/reparse points y resolución física final |

## Defectos pendientes

### R7-R01 / P1 — La compuerta de aprobación no contiene una decisión verificable

`check-preflight.mjs:415-475,775-786,866-867` confía en `auditorApproval === true`, expuesto como `--auditor-approval` a cualquier invocador. Para HTTP(S) sólo ejecuta `new URL`; no comprueba evidencia, emisor, executor_id, alcance CPU/RAM, vigencia ni un registro de decisión independiente. La ruta local comprueba existencia/tamaño, no contenido ni siquiera que sea un archivo regular legible. El booleano separa entradas del manifiesto, pero no acredita quién aprobó qué evidencia.

Reproducción en memoria: tomar el fixture, cambiar reserva a `accredited:true`, `provenance:'cloud_dedicated_host'`, `type:'dedicated_host'`, `evidence_doc:'https://no-evidence.invalid/reserva'`, y llamar con `{auditorApproval:true}`. Resultado observado: `valid:true`, `reservation_accredited:true`, `executor_status:'EJECUTOR_APTO'`, `errors:[]`. No se hizo solicitud de red. Tampoco se aportó `expectedCommitSha`; el fixture conserva `c161c0f995a8f9844f2ec09c041354d77a08fea0`, diferente del commit auditado.

Corrección: comprobar una decisión externa auditable vinculada al ejecutor, hash de evidencia, recursos, vigencia y SHA aprobado; mantener NO APTO si falta. Una bandera o un archivo arbitrario no deben sustituir esa decisión. Añadir regresiones con decisión ausente, ajena, caducada y SHA ausente/discrepante.

### R7-R02 / P1 — Continúa PASS por omisión y por tipos/rangos inválidos

`check-preflight.mjs:499-545,572-615,709-733` exige presencia de bloques pero no implementa íntegramente su esquema. Reproducciones separadas sobre copias del fixture, todas con `valid:true`, `errors:[]`:

- `cpu_stats = {}; mem_stats = {}; page_faults = {}`.
- `sample_count = 'sesenta'; interval_ms = -1; start_time = 'INVALID'; end_time = 'INVALID'; duration_ms = 999999`.
- En todas las muestras, `cpu_percent = 999` y `groups[0].count = 0.5`.
- Propiedad superior adicional `unapproved = true` y `resource_reservation.swap_policy = null`.

El contrato exige propiedades internas, enteros, CPU de 0 a 100 y additionalProperties false. Tampoco se contrastan íntegramente agregados con muestras ni los límites de ventana con las muestras. Calcular span desde extremos y rechazar muestras vacías no cierra estos requisitos.

Corrección: validación completa del esquema y de la consistencia semántica, con rechazo estructurado y regresiones de cada nivel anidado y relación temporal.

### R7-R03 / P1 — La atribución de CPU externa permite omitir carga ajena

`preflight.ps1:425-430` clasifica todos los procesos por nombre Node/Chrome; `check-preflight.mjs:693-698` aplica el presupuesto sólo a `other`. Un proceso Node ajeno a E01 queda exento aunque consuma el host. La remediación original exigía identificar procesos autorizados para la fase, no eximir todos los procesos del mismo runtime.

Reproducción: fijar por muestra CPU total=90, grupo node CPU=90 y other CPU=0. Resultado: `valid:true`, `errors:[]`. El ejemplo muestra el hueco de clasificación: esa carga podría corresponder íntegramente a otro trabajo Node y el manifiesto no permite distinguirlo.

Corrección: identificar explícitamente los PID/árboles autorizados y la fase baseline/ejecución, atribuir el resto a interferencia y comprobar coherencia con CPU total. Mantener el límite aprobado sin inventar umbrales alternativos.

### R7-R04 / P1 — Git status fallido se convierte en árbol limpio; contadores parciales no se rechazan

`preflight.ps1:318-335` no comprueba LASTEXITCODE para git status. Se extrajo `Get-HostGitState` del AST y se ejecutó con un doble de git: rev-parse devuelve SHA/rama válidos, status no devuelve salida y fija LASTEXITCODE=128. Resultado real:

```json
{"commit_sha":"c34e1e51b153cb7006104cd0e698ad2a3e905083","branch_name":"feat/qap-vnext-architecture","clean_working_tree":true,"dirty_files":[]}
```

No se modificó Git ni el host para esta prueba. Además, `preflight.ps1:404-406` sólo exige AvailableMBytes; `:473-476` convierte CommittedBytes/CommitLimit/PagesInputPersec/PagesOutputPersec a double sin comprobar presencia. En PowerShell convertir null a double produce 0. En `:434-439` siguen existiendo sumas ausentes sustituidas por 0. Inspección estática: no se capturó telemetría real ni se ejecutó E01.

Corrección: fallo explícito y registro de observación ausente ante cada comando fallido y contador requerido ausente. Distinguir un grupo realmente vacío de una consulta o métrica ausente.

### R7-R05 / P1 — Integridad Git inconsistente y CLI permisiva con valores faltantes

`check-preflight.mjs:308-327` sólo inspecciona dirty_files cuando clean_working_tree es false. Copiar el fixture y asignar `clean_working_tree:true`, `dirty_files:['packages/mcp/src/server.ts']` devuelve PASS sin errores. La contradicción no se rechaza. `:293` hace opcional el SHA esperado, incluso en la ruta APTO descrita en R01.

`check-preflight.mjs:826-859` consume valores sin validar presencia/formato. Las CLI reales con `--expected-sha` sin valor y `--max-gap=abc` salen 0. Undefined/NaN se sustituyen por defaults o desactivan la comparación. Esto contradice el parser fail-closed anunciado.

Corrección: comprobar siempre el inventario de cambios y sus contradicciones, exigir SHA externo en autorización y validar tipos, rangos, valores vacíos y argumentos obligatorios antes de evaluar un manifiesto.

### R7-R06 / P2 — Confinamiento léxico sin resolución de enlaces

`preflight.ps1:174-187` usa GetFullPath y comparación de prefijo con separador. Corrige r7-externo, pero GetFullPath normaliza texto sin resolver junctions, enlaces simbólicos o reparse points. Una ruta léxica r7/enlace/salida.json cuyo ancestro enlace redirige fuera de r7 pasa la comprobación; las escrituras y borrados posteriores operarían sobre otro destino.

Es un hallazgo de inspección estática. No se crearon enlaces ni se escribieron archivos fuera de r7. El test Node denominado PATH-CONFINEMENT-EVIDENCE sólo evalúa evidence_doc y no cubre este comportamiento de PowerShell.

Corrección: resolver y comprobar destino físico/ancestros existentes y rechazar reparse points que escapen; aplicar a salidas, PID y centinelas antes de escribir/borrar. Añadir pruebas aisladas que no afecten archivos ajenos.

## Reproducción Node de los falsos positivos

Desde la raíz Git real, sin modificar el fixture:

```powershell
@'
import fs from 'node:fs';
import {validatePreflightManifest as v} from './docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs';
const base=JSON.parse(fs.readFileSync('./docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json','utf8'));
const cases={
  aggregates:m=>{m.telemetry_window.cpu_stats={};m.telemetry_window.mem_stats={};m.telemetry_window.page_faults={};},
  metadata:m=>Object.assign(m.telemetry_window,{sample_count:'sesenta',interval_ms:-1,start_time:'INVALID',end_time:'INVALID',duration_ms:999999}),
  ranges:m=>{for(const s of m.telemetry_window.samples){s.cpu_percent=999;s.groups[0].count=0.5;}},
  additional:m=>{m.unapproved=true;m.resource_reservation.swap_policy=null;},
  gitContradiction:m=>{m.git.clean_working_tree=true;m.git.dirty_files=['packages/mcp/src/server.ts'];},
  externalNode:m=>{for(const s of m.telemetry_window.samples){s.cpu_percent=90;s.groups.find(g=>g.category==='node').cpu_percent_logical_capacity=90;s.groups.find(g=>g.category==='other').cpu_percent_logical_capacity=0;}}
};
for(const [name,mutate] of Object.entries(cases)){
  const m=structuredClone(base);mutate(m);const r=v(m);
  console.log(JSON.stringify({name,valid:r.valid,status:r.executor_status,errors:r.errors}));
}
const m=structuredClone(base);
Object.assign(m.resource_reservation,{accredited:true,provenance:'cloud_dedicated_host',type:'dedicated_host',evidence_doc:'https://no-evidence.invalid/reserva'});
console.log(JSON.stringify({name:'unverifiedApproval',...v(m,{auditorApproval:true})}));
'@ | node --input-type=module
```

## Confinamiento y límites del dictamen

El diff entre base y entrega modifica únicamente CONTRATO_EJECUTOR.md, README.md, check-preflight.mjs, check-preflight.test.mjs y preflight.ps1 dentro de r7. Esto confirma alcance del commit, no limpieza del árbol completo.

Estado inicial observado: sesión local `packages/playwright-runner/.qa/cache/sessions/admin-user.json` modificada sin stage y `r7/AUDITORIA_CODEX_2026-11-07.md` sin seguimiento. No se leyó el contenido de la sesión ni se alteró. La auditoría previa se preserva. La única adición de esta revisión es este informe; sin stage, commits, cambios de producto, cambios de configuración o ejecución E01.

No se acredita reserva física ni se certifica un host a partir del fixture sintético. Requiere remediar los pendientes y repetir la revisión antes de aceptar la compuerta y evaluar una autorización E01 con evidencia independiente.
