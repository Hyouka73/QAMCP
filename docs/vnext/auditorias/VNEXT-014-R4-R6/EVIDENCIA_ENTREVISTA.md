# Evidencia de entrevista y regresiones R4-R6

## Continuidad acreditada

`R4-R6-I01` pasó físicamente en el foco, en la suite de 43 pruebas y en el integral. Antes de next, status no propone canonical_interview y existen cero requisitos. Una vez iniciada la entrevista real, status recomienda qap_rules_set para catalog con canonical_interview.action=next, revisión humana independiente y coverage=not_certified. Dos consultas conservan el conteo; la llamada explícita recupera el mismo ID y versión. Relaciones, requisitos, lifecycle e inbox permanecen intactos; no aparece rules.yaml.

La sonda adicional comprueba todas las tablas de SQLite mediante conexión de solo lectura y hashes físicos de DB/WAL, además del lifecycle byte a byte. Repite status y next tanto en versión 0 como después de una propuesta explícita en versión 1. Resultado salida 0, cero requisitos y cero requests al gateway. Aquí el pending draft del servicio reside en memoria: no se configura el almacén opcional de borradores. No se afirma que una transacción explícita next sobre ese almacén durable sea físicamente una lectura. Sus regresiones existentes se ejecutaron en el integral.

Salida de la [sonda reproducible](SONDA_ENTREVISTA.md):

~~~json
{"step":"before_interview","pending":0,"invented":false,"sqlite_and_lifecycle_unchanged":true}
{"step":"opened","question_id":"interview:fcfcd1940116edf82ad4bdedc1b15fe99a2e24e05a46a775ab667cae278ee532","version":0,"pending":7,"next":{"tipo":"trabajo","tool":"qap_rules_set","module":"catalog","modulo":"catalog","canonical_interview":{"action":"next"},"descripcion":"El módulo 'catalog' tiene una pregunta canónica pendiente del host. Reanúdala mediante qap_rules_set con canonical_interview.action=next; la respuesta requiere revisión humana independiente antes de acreditar cobertura o cerrar."},"requirements":0,"gateway_requests":0,"sqlite_and_lifecycle_unchanged":true,"sqlite_sha256":{"main":"5b4c221da042dfef1b19a8c344e9efde6a31889757d735088810bf5f2863b944","-wal":"9df32825719c5a25067e2d7b172453e1f99f8d124c1f14fc9e244b7a612b60b7"},"lifecycle_sha256":"d76b37f9927b84f9243042d8141da68222117b0c6307531b0b58280c162e764e","rules_yaml":false}
{"step":"proposed","question_id":"interview:fcfcd1940116edf82ad4bdedc1b15fe99a2e24e05a46a775ab667cae278ee532","version":1,"pending":7,"next":{"tipo":"trabajo","tool":"qap_rules_set","module":"catalog","modulo":"catalog","canonical_interview":{"action":"next"},"descripcion":"El módulo 'catalog' tiene una pregunta canónica pendiente del host. Reanúdala mediante qap_rules_set con canonical_interview.action=next; la respuesta requiere revisión humana independiente antes de acreditar cobertura o cerrar."},"requirements":0,"gateway_requests":0,"sqlite_and_lifecycle_unchanged":true,"sqlite_sha256":{"main":"5b4c221da042dfef1b19a8c344e9efde6a31889757d735088810bf5f2863b944","-wal":"9df32825719c5a25067e2d7b172453e1f99f8d124c1f14fc9e244b7a612b60b7"},"lifecycle_sha256":"d76b37f9927b84f9243042d8141da68222117b0c6307531b0b58280c162e764e","rules_yaml":false}
~~~

Los IDs dependen del contexto/ruta aleatoria del fixture. La garantía es su igualdad dentro del recorrido, no entre ejecuciones distintas. SHM no se usa como criterio de inmutabilidad: contiene coordinación de lectores. Las tablas y DB/WAL comparados sí permanecen iguales.

## Cierre durable y 17 módulos

Coverage 37/37 en ejecución focal completa y en integral: R4-R3 conserva siete fixtures inconsistentes bloqueados; R4-R4 conserva el positivo y la guía ante inválidos; R4-R5-A02 conserva los tres escenarios 16 válidos, 17 válidos y último inválido, con inventario 16, recomendación correcta, WRAP_UP/reporte en válidos y bloqueo sin reporte en inválido. Crash Scenarios 2/3 y R4-R2-A01 conservan recuperación e idempotencia y primer cierre exitoso. Los títulos y tiempos están en LOGS.md.

## Discovery: incidencia intermitente conservada

Primera ejecución aislada: 58 PASS / 1 timeout; primera causa observable, la promesa de dispatcher/crawler no termina antes de los 30000 ms en la prueba de cancelación en vuelo. No hay traza que identifique la operación interna detenida. Las aserciones de respuesta/limpieza no se alcanzan en ese intento; no atribuir el timeout a una aserción de status.

~~~text
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ src/__tests__/discovery-handler.test.ts:311:3
    309|   });
    310|
    311|   it('propagates in-flight dispatcher cancellation to transport and wa…
       |   ^
    312|     const f = await fixture(); const abort = new AbortController();
    313|     Object.assign(f.authorization, { dependencies: { browser: { channe…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
~~~

Luego pasó en el integral y en la repetición completa aislada, sin modificar código, expectativas o timeout:

~~~text
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 863ms
 ✓ src/__tests__/discovery-handler.test.ts > VNEXT-013 real MCP black-box acquisition > propagates in-flight dispatcher cancellation to transport and waits for cleanup 790ms
~~~

La repetición completa dio 59/59. El mismo título y timeout ya estaban registrados en [R4-R3](../VNEXT-014-R4-R3/INFORME.md). Discovery y su test no cambiaron desde R4-R5. No se demuestra una regresión introducida por R4-R6 ni se da por resuelta la causa interna del comportamiento intermitente. Si vuelve a investigarse, instrumentar en una corrección posterior las etapas de cancelación, navegador, transporte y limpieza; esta auditoría no las modifica.

## Stdio

18 herramientas reales listadas, qap_init success sobre raíz sintética autorizada, directorio .qa creado y status ONBOARDING; salida 0 y centinela de éxito. La conexión de entrevista utiliza servidor MCP real por SDK/InMemoryTransport, no un mock del handler. El smoke Stdio independiente no certifica provisionamiento de gateways productivos ni interfaz humana real.
