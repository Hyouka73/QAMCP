# VNEXT-010 — Sondas de observación activa no destructiva

Fecha: 2026-10-30. Rama exclusiva `feat/qap-vnext-architecture`.
Base: `e2bb35a10db9e22d996734715a3a4de40658ce61`. Agente principal único.
Implementación/pruebas: `ed1143a6d0fe5cfa4f81bc96d6bb2117e9f16432`;
documentación de cierre en el commit siguiente.
La autorización de esta entrega sustituye exclusivamente la prohibición anterior de
iniciar VNEXT-010. No incluye VNEXT-011, MCP, CLI, Advisor ni integración develop/main.

## 1. Arquitectura y decisión de reutilización

`ActiveObservationProbe` se exporta desde `@qap/playwright-adapter`, con contratos en
`src/probes/types.ts`, selección estructural y operaciones DOM en `dom.ts` y orquestación
en `service.ts`. No modifica Shared, Engine, Knowledge, IKnowledgeStore v1 ni SQLite.

Un `TrialObserver` interno reutiliza `NetworkTrafficObserver` de VNEXT-008. Se agregan
tres puntos protegidos mínimos: inspección posterior al sellado, capacidad nativa de
validación de formularios y decisión de registrar observaciones de red. El observador
pasivo mantiene su catálogo, CSP y persistencia por defecto. El crawler estático no cambia.

No se duplican lanzador Chromium, proxy deny-only, ReconScope, resolución DNS/IP,
transporte fijado con comprobación de peer/TLS, gateway MIME/CORS ni persistencia.
Se descartó construir un segundo gateway y un ejecutor de botones. El único subtipo
interno habilita el catálogo cerrado; la API de sondas no acepta callbacks de acciones,
código JavaScript, botones arbitrarios ni inyección de resultados.

## 2. API pública

```ts
const probes = new ActiveObservationProbe(knowledgeStore, {
  browser: { channel: 'chrome' }, // opcional; mismo lanzador aislado
  // resolver: dependencia privilegiada para fixtures de DNS, no datos de la aplicación
});
const result = await probes.run({
  application_id: applicationId,
  environment, // debe existir con la misma política en el store
  target_url: authorizedInitialUrl,
  isolation: 'fresh_anonymous_disposable',
  probe: 'protected_empty_submit',
  authorization: {
    read_only_acknowledged: true,
    nonproduction_disposable_acknowledged: true,
    empty_validation_only: true,
    form_selector: 'main > form:nth-of-type(1)',
    navigation_urls: [authorizedInitialUrl],
    script_urls: exactAuthorizedScriptUrls,
    presentation_urls: exactAuthorizedStylesheetUrls,
    api_read_urls: [],
    allowed_ips: explicitAuthorizedIps,
    allow_public_network: false,
  },
  limits: { trials: 2 },
  acquisition_limits: { max_requests: 8, max_bytes: 131072, settle_ms: 100 },
  signal: abortController.signal,
});
```

`ActiveProbeInput` incluye entorno, URL, sonda, consentimiento de recursos/formulario,
aislamiento, límites, CA TLS opcional y cancelación. Dependencias de prueba son las de
`CrawlerDependencies`: selección de Chromium limpio y resolver; nunca perfil o sesión.
`ActiveProbeResult` separa estado comparativo, ensayos, evidencia, observaciones,
persistencia y avisos. Los errores públicos usan códigos fijos de `ActiveProbeError`.

## 3. Catálogo cerrado y operaciones realmente observadas

1. `native_empty_validation`: llamada real a
   `HTMLFormElement.prototype.checkValidity.call(form)`. Registra retorno booleano,
   validez y campos inválidos, categorías de restricciones/ValidityState, eventos
   `invalid`, atributos semánticos y estructuras antes/después. Sus handlers también
   pueden ejecutar JavaScript; por eso se ejecuta después del sellado.
2. `protected_empty_submit`: llamada real a
   `HTMLFormElement.prototype.requestSubmit.call(form)`, sin rellenar datos, click
   arbitrario ni `force`. Rechaza previamente cualquier formulario válido. Para un
   formulario inválido normal se observan eventos `invalid`; con `novalidate` puede
   observarse el handler `submit`. La captura añade `preventDefault`, sin depender de
   ella como frontera de red. Sin eventos `invalid`/`submit` se devuelve inconcluso,
   sin observación de ejecución terminada.

Hallazgo real: el sandbox CSP anterior sin `allow-forms` impedía incluso que
`requestSubmit` produjera validación. Solo la sonda B habilita esa capacidad; conserva
`form-action 'none'`, red sellada y las demás restricciones. Una CSP original más
restrictiva no se elimina; la prueba correspondiente produce resultado indeterminado.

No hay pruebas de login, pagos, registros, borrados, aprobaciones ni modificación de
negocio. `destructive_actions_allowed: true` no amplía el catálogo.

## 4. Autorización y resolución del objetivo

Se exige `is_production === false`, consentimiento explícito de entorno desechable y
validación vacía. Se rechazan headers de entorno. Solo se permite una URL de navegación
y recursos GET exactos consentidos. APIs de adquisición deben ser una lista vacía.
El consentimiento GET no demuestra inocuidad semántica del recurso: corresponde al
responsable del entorno elegir fixtures/staging y documentos/scripts/CSS observacionales.

Selector autorizado de hasta 512 caracteres: rutas CSS de tags estructurales
`html/body/main/div/section/article/form`, combinador ` > ` y `:nth-of-type(1..999)`,
terminando en `form`. No IDs, valores, texto libre, queries XPath ni selectores de frames.
No se importan selectores históricos `unverified`. Se resuelve nuevamente en el DOM
principal, exigiendo un único formulario conectado, visible y fuera de hidden/inert.
La comprobación y operación suceden en el mismo turno JS, sin await entre ambas.

Se rechazan controles externos al formulario, tipos de control no soportados, password,
hidden, file, image, cualquier valor no vacío o checkbox/radio marcado. No se limpian
datos para conseguir autorización. Formularios ausentes, ambiguos, ocultos, de iframe o
shadow context, poblados, sin controles o sobre presupuesto no producen probe_result.

## 5. Frontera de red y cambio de fase

Adquisición: solo el transporte Node de VNEXT-006 recibe bytes de destinos exactos
autorizados. Validación de DNS completo, fijación IP, peer/puerto y TLS; sin routing
continue/fallback/fetch, cookies, credenciales, headers arbitrarios o redirects al browser.
El proxy Chromium nunca resuelve ni reenvía destinos. SW, WebSocket, workers, frames,
popups y descargas permanecen bloqueados. CSP mantiene `form-action 'none'`.

Al terminar la ventana de asentamiento se revoca el gateway permanentemente mediante
su cierre lógico, antes de cualquier await adicional de la fase activa, y se activa
`context.setOffline(true)`. Los requests encolados consultan el cierre antes de acquire.
La inspección activa solo comienza si la vista estaba asentada, no hay transportes
pendientes y la señal no está abortada. Si queda transporte pendiente se abstiene, cierra
el contexto y espera su finalización limitada por timeout; no inicia otro ensayo.

Durante la operación se deniega todo tráfico, incluso un GET previamente autorizado.
Offline/routing no son la única defensa: proxy deny-only, DNS bloqueado y flags WebRTC
de VNEXT-008 permanecen activos. El lanzador y su configuración TCP/UDP no se modifican.
Una navegación hostil puede destruir el contexto local pese a que el receptor no reciba
tráfico; en tal caso no se fabrica captura completa ni se declara consistencia.

## 6. Aislamiento y limpieza

Cada ensayo crea un observador de un solo uso, proxy, browser y contexto nuevos, JS
habilitado, permisos vacíos, SW bloqueados y descargas deshabilitadas. No storageState,
perfiles persistentes, cookies heredadas ni sesión de usuario. Escrituras de localStorage
y sessionStorage pueden suceder dentro del contexto desechable y desaparecen al cerrarlo;
no se afirma que la API de almacenamiento esté deshabilitada. La prueba comprueba que
no afectan los ensayos siguientes. No se usa el archivo de sesión protegido.

El finally de VNEXT-008 cierra contexto/browser, espera transportes y cierra proxy.
Fallo de limpieza impide nuevos ensayos y produce error fijo. Una cancelación cierra
el contexto en curso y se comprueba antes/después de leer autorización para impedir
iniciar ensayos nuevos. No se borra conocimiento QAMCP para limpiar el browser.

## 7. Reproducibilidad y resultados

Dos ensayos por defecto, tres máximo. Misma URL, selector explícito, operación y política;
browser/contexto nuevos. Compara exclusivamente estructuras seleccionadas: validez,
cantidad/orden/tipo de controles, categorías de restricciones/invalidación, estados
required/disabled/willValidate/aria-invalid/novalidate/visible, conteos estructurales,
eventos y cambios DOM. No se comparan sesiones, timestamps, IDs, tokens o textos.

- `consistent`: terminaron todos los ensayos pedidos, al menos dos, sin truncamiento y
  con salida estructural igual.
- `inconsistent`: ensayos comparables terminados con estructuras diferentes.
- `indeterminate`: un solo ensayo, captura insuficiente/truncada, adquisición pendiente,
  pérdida del contexto o validación suprimida.
- `blocked`: autorización/seguridad impidieron obtener una ejecución terminada.

Un ensayo terminado seguido de abstención conserva el hecho real y queda indeterminado.
No hay retries silenciosos. No se considera independencia repetir dentro del mismo contexto.

## 8. Evidencia, procedencia y privacidad

Una observación nueva por ensayo terminado: `ApplicationObservation.kind='probe_result'`,
`observed_by='active_probe'`, aplicación, entorno, sesión del contexto, fecha y
`probe_execution` con acción real, selector estructural seguro, salida seleccionada,
`reproducible` y número real de ensayos terminados. `reproducible` solo es true con
comparación `consistent`. Sin `payload` de valores.

Evidencia real `dom_snippet` en URN generada, con estructura JSON, sin HTML. `pii_masked`
identifica selección positiva de datos estructurales, no procesamiento de imágenes.
No se generan screenshots, HAR, mensajes completos de validación, cuerpos HTTP,
valores, texto de usuario, cookies, tokens, headers ni URLs de la aplicación en resultados.
La selección ocurre dentro de Chromium antes de cruzar IPC. Excepciones browser/SQLite
no se propagan con sus mensajes. Canarios de valores, atributos, pattern, mensajes,
scripts y almacenamiento no deben aparecer en salidas/evidencias/DB/WAL/SHM/logs.

## 9. Persistencia

Solo IKnowledgeStore v1. Aplicación y entorno previos obligatorios; se compara la
política completa y revisiones antes de ensayos, antes de interactuar y antes del commit.
UUIDs nuevos, expected_revision=0, historia append-only, referencias locales fijadas,
trace `source='active_observation_probe'`, `recorded_by='active_probe'`, unreviewed.
Un lote atómico de hasta seis writes: tres evidencias y tres observaciones. Un fallo
revierte todos los pares. `committed/failed/not_attempted` es independiente del resultado
observacional; los hechos devueltos sin commit no se presentan como persistidos.

El TrialObserver deshabilita la generación/persistencia automática de observaciones de
red del observador pasivo. No se atribuye a crawler evidencia generada por la interacción
para hacerla aceptable al motor de inferencias. Los contadores de adquisición/bloqueos
son diagnóstico limitado de cada ensayo; no son un HAR ni prueba de ejecución por sí solos.

## 10. Separación epistemológica

D-011 estricto: consistencia observacional no demuestra corrección funcional.
No ExpectedRequirement, ConformityAssessment, defectos confirmados, reglas de negocio
ni cambios de AgentInference/confidence_score. VNEXT-009 no admite esta procedencia
`active_probe`; su política de correlación/reproducibilidad futura queda pendiente.
No se falsea la procedencia ni se modifica ese motor.

## 11. Presupuestos

| Recurso | Default | Máximo |
| --- | ---: | ---: |
| Formularios por ensayo | 1 | 1 |
| Ensayos/contextos nuevos | 2 | 3 |
| Tiempo global de ejecución | 40 s | 60 s |
| Tiempo de ensayo | 15 s | 20 s |
| Ventana después de acción | 100 ms | 1000 ms |
| Controles | 100 | 200 |
| Nodos inspeccionados | 500 | 1000 |
| Eventos por categoría | 100 | 200 |
| Cambios DOM retenidos (conteo) | 500 | 1000 |
| Navegaciones por ensayo | 1 | 1 |
| Requests de adquisición por ensayo | 32 | 128 |
| Bytes recibidos/decoded/retenidos, cada uno por ensayo | 512 KiB | 1 MiB |
| Recursos autorizados (categorías combinadas) | hasta 32 | 32 |
| Eventos internos de red por ensayo | 100 | 128 |
| Settle de adquisición | 500 ms | 3000 ms |
| Timeout por request | 3000 ms | 10000 ms |

Topes acumulados de adquisición: <=384 requests y <=3 MiB por categoría para tres
ensayos; concurrencia uno por ensayo, cero retries y redirects. Retención de sondas:
<=3 pares de snapshots, <=200 controles por snapshot, categorías fijas y contadores.
MutationObserver deja de observar al saturar cambios. No se retienen MutationRecords,
nodos, mensajes ni valores fuera del contexto. No hay cota OS de RAM de Chromium ni
garantía de preempción de JS hostil que bloquee su renderer. Store/SQLite síncrono y
limpieza pueden superar el deadline: el puerto v1 no permite cancelar esas operaciones.

## 12. Pruebas reales y verificación

Resultado final: **completada con limitaciones**. Windows, Node **24.15.0**,
Chrome **156.0.8078.48**, SQLite físico con FTS5.

| Verificación ejecutada | Resultado |
| --- | --- |
| Sondas nuevas (dentro de Adapter) | 25/25 |
| Playwright Adapter completo, archivos secuenciales | 164/164, 7 archivos |
| VNEXT-006 / VNEXT-007 / VNEXT-008 (incluidas arriba) | 55 / 30 / 28 aprobadas |
| Shared completo | 146/146 |
| Engine completo | 168/168 |
| Knowledge completo, incluye VNEXT-009 | 258/258 |
| Builds de los diez paquetes | 10/10; Adapter recompilado tras cambios finales |
| TypeScript probes, network-observer, crawler y recon incluidos tests | sin diagnósticos |
| ESLint de probes, test nuevo, observer/service e index | sin diagnósticos |
| Diff autorizado, sesión protegida y logs finales sin canarios | verificados |

Total de suites focalizadas completas: **736/736**; no es certificación de suite global.
El primer recorrido completo de Adapter terminó con 134 aprobadas y un worker de
Vitest que salió inesperadamente antes de completar network-observer (162 casos
recopilados en ese momento). No se atribuye causa no demostrada. La suite aislada del
observador pasó 28/28; el recorrido completo final con los 25 casos nuevos pasó
164/164 sin errores de worker. No se cambiaron tests, aserciones o timeouts legacy.

La suite `active-probes.test.ts` usa Chrome real y SQLite físico temporal. Incluye:
HTML5 inválido; handlers invalid y submit/novalidate con cambios DOM; GET autorizado,
POST/DELETE/external/private/WS/WebRTC STUN/popup/frame/download; receptor TCP/UDP con
cero recepción; navegación que invalida captura; adquisición pendiente; formularios
válidos/poblados/sensibles/ocultos/ambiguos/contexto externo; dos contextos consistentes,
estructuras alternantes, un ensayo inconcluso; storage aislado; cancelación; presupuestos;
CSP original restrictiva; reapertura, referencias, historia, aislamiento, rollback físico,
contexto cambiado, privacidad y errores sanitizados. No basta un contador de bloqueo:
las pruebas positivas exigen eventos y cambios DOM reales y las negativas inspeccionan
los receptores. La prueba centinela de lanzador VNEXT-008 se conserva en la regresión.

Intento inicial bajo sandbox: loopback no accesible, por tanto no acredita ejecución.
Verificaciones reales se ejecutan mediante herramientas permitidas fuera de esa
restricción. No se debilita la frontera de la aplicación para hacer pasar pruebas.

## 13. Reproducción

Desde raíz, dependencias y Chrome instalados, Node con node:sqlite/FTS5:

```powershell
$env:TEMP = Join-Path (Get-Location) 'node_modules/.tmp-vnext'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
# Compilar los diez paquetes en orden topológico. Con pnpm operativo: pnpm build
# Alternativa offline usada: node <raíz>/node_modules/tsup/dist/cli-default.js
# desde cada paquete, src/index.ts --format esm --dts salvo CLI/MCP (su configuración).
foreach ($packageName in @('shared','engine','knowledge','playwright-adapter')) {
  Push-Location "packages/$packageName"
  node node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1
  if ($LASTEXITCODE -ne 0) { throw "Tests failed: $packageName" }
  Pop-Location
}
foreach ($check in @('probes','network-observer','crawler','recon')) {
  node node_modules/typescript/bin/tsc --noEmit -p "packages/playwright-adapter/test/tsconfig.$check.json"
  if ($LASTEXITCODE -ne 0) { throw "Typecheck failed: $check" }
}
node node_modules/eslint/bin/eslint.js packages/playwright-adapter/src/probes packages/playwright-adapter/src/__tests__/active-probes.test.ts packages/playwright-adapter/src/network-observer/service.ts packages/playwright-adapter/src/index.ts
```

Prueba solo sondas: desde paquete Adapter,
`node node_modules/vitest/vitest.mjs run src/__tests__/active-probes.test.ts --no-file-parallelism --maxWorkers=1`.
Logs de trabajo ignorados en `node_modules/.tmp-vnext/vnext010-*`; bases sintéticas
temporales cerradas y eliminadas por el arnés. No se incorpora base, caché ni log al commit.

## 14. Limitaciones y aceptación

Catálogo deliberadamente reducido: sin clicks reales de botón (requestSubmit es la
operación nativa real), formularios válidos enviados, datos prellenados, password,
hidden/file/image, frames/shadow DOM, autenticación, scripts inline/eval, API de carga,
URLs de recursos no enumeradas ni navegación SPA exhaustiva. La ventana no acredita
estado final de tareas asíncronas que sucedan después. No se certifica aislamiento OS,
resistencia a un navegador comprometido ni autenticidad frente a una aplicación que
sustituya maliciosamente los builtins DOM. GETs iniciales requieren consentimiento.

La identidad comparable es el selector estructural explícitamente autorizado bajo la
misma URL y contexto, no identidad de negocio garantizada a través de deployments.
Una misma estructura podría ocultar diferencias semánticas fuera de esta proyección.
Una captura incompleta puede perder una interacción iniciada: no se presenta como
ejecución terminada. Solo matriz Windows/Node/Chrome indicada en STATE comprobada.

Hereda ventana de relectura/commit sin CAS contextual y cancelación no interrumpible
de IKnowledgeStore; no se modifica v1 para resolverlas. No se certifica suite global.
Diagnósticos legacy globales de tipos/lint siguen en documentos VNEXT-006/009.

## 15. Publicación y continuidad

Sesión protegida excluida, hash de contenido previo
`28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`, sin lectura de credenciales ni uso de sesión.
Revisar commits con `git log --oneline e2bb35a..HEAD`, únicamente en
`feat/qap-vnext-architecture`; sin force push, merge/rebase de otras ramas ni npm.
HEAD remoto se comprueba tras push. WBS/STATE registran estado final sin reescribir
resultados históricos. VNEXT-011 continúa pendiente de autorización. Detener al publicar.
