# Auditoría independiente Codex — R7-01 / VNEXT-014-E01

Fecha: 2026-11-07 (America/Mexico_City).
Rama inspeccionada: `feat/qap-vnext-architecture`.
Commit auditado: `f555f9dc2d17a2933210cc49db7dbe3bdda646f0`.

**Dictamen del ejecutor: EJECUTOR_NO_APTO — PREPARADO / RESERVA NO ACREDITADA.**
**Dictamen de la entrega R7: no aceptada como compuerta de autorización; requiere correcciones.**
**E01 no ejecutada, no autorizada y no resuelta.**

## Verificaciones independientes

Desde la raíz real `C:/Users/Judirico/Documents/QAMCP/QAMCP`:

- `node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs`: 35 pruebas, 35 PASS, 0 fallos, 0 omitidas, salida 0.
- `node docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json`: salida 0, `valid: true`, `VALIDADOR_PASS`, `EJECUTOR_NO_APTO`, razón `PREPARADO / RESERVA NO ACREDITADA`, duración observada 60000 ms y gap máximo 850 ms.
- `git status --porcelain=v1`, antes de escribir este informe: únicamente ` M packages/playwright-runner/.qa/cache/sessions/admin-user.json`. Es un cambio preexistente fuera de stage. No se leyó su contenido ni se alteró el archivo.
- `git diff --cached --name-only`: vacío.
- `git diff HEAD^ HEAD --name-only`: los nueve archivos del commit de entrega están exclusivamente en `r7/`. No hay cambios de producto, Vitest, workers o timeouts en ese commit. Esta comprobación se limita al commit de entrega y al estado local inspeccionado.
- Los manifiestos existentes `preflight-manifest.json` y `preflight-test-01-manifest.json` declaran `accredited: false`, `provenance: none`, `type: unreserved_shared`, `evidence_doc: null`; ambos devuelven `VALIDADOR_PASS / EJECUTOR_NO_APTO`. `test-bg-01-manifest.json` se rechaza por ventana de aproximadamente 3.7 segundos.

No se recibió evidencia independiente de asignación dedicada. Los valores de CPU/RAM de esos manifiestos no acreditan reserva. No se ejecutó una nueva captura Baseline ni Background: no existe el prerrequisito documental para considerar aptitud, y los scripts presentan los defectos siguientes. La revisión dinámica se limitó al runner nativo, CLI y llamadas al validador con objetos en memoria.

## Hallazgos bloqueantes

### R7-A01 — P1: la acreditación es autodeclarada

`check-preflight.mjs:355-366` considera acreditada cualquier reserva con booleano true, procedencia/tipo permitidos y una cadena documental no vacía; `:546-556` emite `EJECUTOR_APTO`. No hay una entrada independiente de aprobación del auditor ni verificación documental. Cambiar únicamente cuatro campos del fixture sintético a true, cloud_dedicated_host, dedicated_host y `file:///NO-EXISTE/recibo.json` produce `valid: true`, `EJECUTOR_APTO`, sin errores. No se trata de evidencia real ni de un dictamen de Codex.

Corrección necesaria: separar la validez de la declaración de reserva de su acreditación independiente, y mantener NO APTO hasta disponer de una decisión auditable externa al manifiesto. Verificar emisor, alcance CPU/RAM, vigencia y vínculo con el ejecutor; la existencia de una cadena o incluso de un archivo no prueba reserva.

### R7-A02 — P1: PASS por omisión en telemetría y esquema

`check-preflight.mjs:437-514` acepta `samples: []`, `sample_count: 0` y conserva como duración el número declarado. También acepta todas las muestras reducidas exclusivamente a started_at/finished_at, sin CPU, RAM, paginación, disco ni grupos. Ambos casos devuelven `VALIDADOR_PASS`, en contradicción con el esquema y la prohibición de PASS por omisión.

La validación manual no implementa todo Draft-07: no exige propiedades internas de estadísticas, métricas y grupos ni controla todas las propiedades adicionales. Tampoco verifica toda la consistencia de ventana/cadencia, muestras superpuestas o timestamps futuros. Una primera muestra null seguida de una muestra válida lanza TypeError al consultar prev.started_at (`:476`), en lugar de devolver rechazo estructurado.

Corrección necesaria: validar íntegramente el esquema y las restricciones semánticas, exigir cantidad mínima y cuatro grupos únicos, calcular duración desde muestras válidas y rechazar toda ausencia o inconsistencia. Agregar regresiones adversariales.

### R7-A03 — P1: no se aplican los presupuestos de interferencia

`check-preflight.mjs:378-391` comprueba que los cuatro límites sean números, pero no aplica los límites a las muestras. Un fixture con CPU 100%, RAM disponible 1 MB, cola de disco 173, pages_input_per_sec 275938 y 25% de CPU por grupo continúa obteniendo `VALIDADOR_PASS` sin errores. La reserva acreditada por autodeclaración puede combinarse con este defecto para obtener APTO bajo saturación.

Corrección necesaria: fijar los presupuestos aprobados fuera del control del manifiesto, validar sus rangos y comprobar cada muestra, calculando CPU externa según los procesos autorizados para la fase de captura. No inventar mínimos nuevos de RAM.

### R7-A04 — P1: se sustituyen observaciones faltantes por valores canónicos

`preflight.ps1:224-244` usa versiones canónicas ante resultados ausentes o errores de lectura de Chromium; `:262-267` sustituye SHA/rama ausentes; `:317-322` escribe el hash canónico cuando el bundle dist no existe. CPU/disco ausentes se convierten en cero (`:413-414`). Esto produce evidencia de conformidad sin observación real.

Corrección necesaria: fallar de forma cerrada ante consultas, comandos o archivos ausentes; comprobar códigos de salida nativos. Registrar falta de evidencia y no rellenar con el valor esperado. El script tampoco debe emitir APTO por switches de entrada sin la decisión independiente y todos los controles del validador.

### R7-A05 — P1: integridad Git eludible y opción CLI ignorada

`check-preflight.mjs:278-286` amplía la whitelist normativa con rutas suministradas por el propio manifiesto. Declarar clean_working_tree false, dirty_files con `packages/mcp/src/server.ts` y añadir esa misma ruta a allowed_untracked_or_modified produce PASS. El esquema publicado ni siquiera permite dirty_files/modified_files con additionalProperties false, pero la implementación los acepta.

La CLI (`:585-598`) no interpreta `--expected-sha`: ejecutar el comando documentado con cuarenta ceros conserva PASS. Tampoco exige un SHA aprobado por defecto. `preflight.ps1:278-279` oculta modificaciones de todo r7 al calcular limpieza, pese a que el contrato sólo admite la sesión local como excepción.

Corrección necesaria: whitelist fija y externa al manifiesto, SHA aprobado obligatorio en la operación de autorización, parser CLI que aplique las opciones documentadas y rechazo de opciones desconocidas; registrar fielmente las modificaciones.

### R7-A06 — P2: contrato y comparación de toolchain incoherentes

La sección 4.3 exige versiones exactas, pero el esquema y el diccionario permiten rangos de Node/pnpm; el validador aplica v24.x.x y 12.x.x y sólo compara Chromium si se aporta una opción. El fixture con Node v24.0.1, pnpm 12.0.1 y Chromium 0.0.0.0 obtiene PASS. También divergen los mínimos de capacidad entre la sección 4.1 y el esquema, mientras la sección 2.2 prohíbe inventar mínimos arbitrarios.

Corrección necesaria: resolver normativamente esas contradicciones y aplicar una única política aprobada en contrato, esquema, script, CLI y pruebas. No se propone un umbral de RAM alternativo.

### R7-A07 — P2: el confinamiento de rutas no cubre todas las escrituras

`preflight.ps1:185` usa StartsWith(scriptDir) sin separador de directorio, por lo que también admite prefijos hermanos como r7-externo. Los parámetros internos SentinelFile/PidFile no pasan por la misma validación y se usan posteriormente para escribir o borrar archivos. Hallazgo de inspección estática: no se escribieron archivos fuera de r7 para demostrarlo.

Corrección necesaria: resolver y validar todas las rutas finales contra el directorio exacto, incluyendo PID/centinela y enlaces/reparse points, antes de cualquier escritura o eliminación.

## Reproducción mínima en memoria

En PowerShell, desde la raíz del repositorio, sin modificar los fixtures:

```powershell
@'
import fs from 'node:fs';
import {validatePreflightManifest as validate} from './docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.mjs';
const base=JSON.parse(fs.readFileSync('./docs/vnext/implementaciones/VNEXT-014-E01/r7/manifest-ejemplo.json','utf8'));
const cases={
  autodeclaracion:m=>Object.assign(m.resource_reservation,{accredited:true,provenance:'cloud_dedicated_host',type:'dedicated_host',evidence_doc:'file:///NO-EXISTE/recibo.json'}),
  vacio:m=>{m.telemetry_window.samples=[];m.telemetry_window.sample_count=0;},
  sinMetricas:m=>{m.telemetry_window.samples=m.telemetry_window.samples.map(({started_at,finished_at})=>({started_at,finished_at}));},
  saturado:m=>{for(const s of m.telemetry_window.samples){s.cpu_percent=100;s.available_mb=1;s.disk_queue=173;s.pages_input_per_sec=275938;for(const g of s.groups)g.cpu_percent_logical_capacity=25;}},
  versiones:m=>Object.assign(m.toolchain,{node_version:'v24.0.1',pnpm_version:'12.0.1',chromium_version:'0.0.0.0'}),
  whitelist:m=>Object.assign(m.git,{clean_working_tree:false,dirty_files:['packages/mcp/src/server.ts'],allowed_untracked_or_modified:['packages/mcp/src/server.ts']})
};
for(const [name,mutate] of Object.entries(cases)){
  const m=structuredClone(base);mutate(m);const r=validate(m);
  console.log(JSON.stringify({name,valid:r.valid,executor_status:r.executor_status,errors:r.errors}));
}
'@ | node --input-type=module
```

Resultado observado: los seis casos devuelven valid true y errors vacío; autodeclaracion devuelve EJECUTOR_APTO, los otros EJECUTOR_NO_APTO. Son resultados defectuosos de la herramienta, no autorizaciones del auditor.

## Disposición

Se ratifica exclusivamente el bloqueo del ejecutor por ausencia de reserva acreditada. Los 35 PASS y el fixture conforme no bastan para aceptar la infraestructura: las reproducciones descubren huecos relevantes fuera de la cobertura existente. Requiere corregir las compuertas, ampliar las regresiones y repetir la auditoría antes de evaluar un ejecutor dedicado documentalmente acreditado.

Esta auditoría sólo añade este informe dentro de r7. No modifica los entregables auditados ni código, configuración, presupuestos, sesiones o índice Git; no crea commits ni ejecuta E01.
