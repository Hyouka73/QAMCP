# Verificación física R1 — 2026-11-06

**VNEXT-014 NO-GO; verificación intermedia.** SHA probado: `8de5a2260bf7c936bbc2c12c81675dd0f6270a36`.

Windows x64, Node 24.15.0, pnpm 12.3.4, Vitest 4.1.11. Checkout inicialmente 6062dcb; remoto coincidía con objetivo y se avanzó mediante fast-forward. La única modificación previa era la sesión protegida admin-user.json: no se leyó ni modificó. Sin cambios productivos, tests, lockfile, workers ni presupuestos. No existe override 45000 en la suite A2. Fixtures sintéticos temporales; las pruebas positivas ejercitaron Chromium, loopback y SQLite físicos. No acreditan consentimiento humano real.

## Ejecución

Evidencia reproducible: [comandos, exit codes y tiempos](evidencia/r1-2026-11-06/manifest.json), [runner secuencial](evidencia/r1-2026-11-06/run.ps1). Cada JSON conserva nombres completos, duración y errores; cada log conserva diferencias y ubicación de aserciones. Se añadió reporter JSON sin cambiar selección ni ejecución. Build real `pnpm build`: exit 0, paquetes del workspace compilados; detalle completo en build-sandbox.log. Build no equivale a PASS de tests.

| Suite aislada | PASS | FAIL | SKIP | Exit | Tiempo comando s |
|---|---:|---:|---:|---:|---:|
| P3 |4|1|0|1|15.68|
| P4.2 |1|1|0|1|7.03|
| P4.5-A |9|0|0|0|9.64|
| P4.5-A2 |13|0|0|0|12.44|
| Server |4|0|0|0|8.10|
| Lifecycle |10|0|0|0|18.85|
| MCP serial |487|19|0|1|211.46|
| MCP paralelo |473|33|0|1|57.27|

Se ejecutaron realmente los 33 casos: **31 PASS, 2 FAIL**. Una corrida integral por modalidad, sin solaparlas ni repetirlas para mejorar cifras.

## Dos fallos modernizados

- TM-09 / T14: después de Discovery espera qap_rules_set/canonical_interview.next; recibe qap_discover. Falla en p3-canonical-discovery.test.ts:87. Discovery no promueve lifecycle; el caso T6 abre explícitamente la entrevista antes de consultar status. La expectativa requiere reconciliación con el contrato vigente, no una transición automática inventada. Además no configura prioridades high/medium/low: no acredita esa garantía.
- TM-12 / Criterio 6: espera question.version > 0; recibe 0 (línea 52). canonical-interview-service.ts:237 crea explícitamente versión 0. **FAIL por aserción incorrecta**; interrumpe el flujo antes del cierre.

No se demuestra un defecto productivo nuevo mediante estos dos fallos. Los 17 fallos restantes corresponden a identidades pendientes de modernizar; no deben reinterpretarse como 17 defectos productivos ni declararse resueltos. Sus capacidades legacy/autenticación requieren contraste y quedan sin certificar.

## Semántica y límites de certificación

31 PASS físicos no equivalen a 31 garantías históricas preservadas. No se emite un número final de garantías certificadas sin cerrar las siguientes brechas:

- TM-09: prioridades ausentes, además del FAIL.
- TM-23: PASS válido para authentication_not_supported y persistencia no intentada; no acredita auth_required/session_invalid ni todos los campos históricos.
- TM-33: comprueba categoría proposito de la pregunta pese a proposal.security; no verifica categoría del requisito finalmente revisado. Cobertura parcial.
- TM-35: borrador sobrevive restart, no crea requisito y texto insuficiente bloquea revisión: garantía canónica físicamente ejercitada.
- TM-38: confirmación y contenido exacto, sin ejecución ficticia; falta aserción específica de procedencia/recibo en esa identidad para equivalencia completa.
- TM-41/42/43: extracción real sin/con controles y cero promoción. No prueban advertencias reales; TM-43 incluso exige ausencia de extraccion_vacia. PASS parcial frente al nombre histórico.
- TM-44: normalización NFD unitaria y rechazo fuera del plan; no prueba el flujo positivo de módulo acentuado autorizado, directorio y preguntas persistidas.
- TM-48: rechazo por autorización ausente y recuperación autorizada; no introduce contexto inválido. No acredita invalidación de contexto.
- TM-22: accept_gaps persiste aceptación pero no cierra; sustitución documentada y coherente con autoridad vigente.
- TM-37: opciones canónicas propose/correct/defer/review y bloqueo sin host; no son las tres opciones históricas. No presentar ese bloqueo como confirmación positiva.

La evidencia de escrituras está en aserciones SQLite, consultas, reapertura, readback e integridad del fixture; los temporales se limpian. Los inboxes son sintéticos, no aprobaciones humanas auténticas.

## Regresión y E01

[Comparación por fullName](evidencia/r1-2026-11-06/comparison.json) contra VNEXT-014-E01/evidencia/final-serial.json: **31 FAIL→PASS, 19 FAIL persistentes, cero PASS→FAIL**. Total 506 conservado. Se trasladaron identidades a archivos canónicos, no se interpreta el cambio de ruta como caso nuevo.

Las cinco lifecycle históricas pasan aisladas y en serie. En paralelo E0a, E1 y E2 fallan; E3 pasa (~3797 ms) y Criterio 9 pasa (~4704 ms frente a ~2872 ms serial). También falla E0b. E0a registra ~16368 ms incluyendo el fallo/cleanup; no atribuir todo ese tiempo a Chromium. Los logs preservan timeouts de tests/hooks.

E01 permanece abierto: 14 FAIL adicionales en paralelo son compatibles con sensibilidad a carga; no se midió causalidad, CPU o apagado nativo en R1 ni se introdujo instrumentación. Se conserva la decisión de 5000/10000 ms. Ninguna afirmación de estabilidad global.

## Compuertas estáticas

Typecheck MCP existente `pnpm --filter @qap/mcp exec tsc --noEmit`: exit 1, 132 diagnósticos. Cuatro diagnósticos confirmados en el nuevo server-canonical-discovery.test.ts: Payload carece de observations (dos usos), evidence y acquisition_status. El build sí compila; el fallo de typecheck incluye tests.

ESLint existente: exit 1, 43 errores y 25 warnings globales. Los cinco archivos canónicos nuevos no tienen errores ESLint; A2 tiene dos warnings. Logs/JSON completos conservados. La atribución diferencial exhaustiva de los demás diagnósticos heredados/nuevos queda pendiente: no se declara cero altas globales.

## Siguiente intervención

ChatGPT debe corregir la aserción de versión inicial, reconciliar TM-09 con la apertura explícita de entrevista y agregar cobertura real de prioridades; completar los positivos/negativos semánticos enumerados; corregir el tipo Payload de las respuestas Discovery. Investigar E01 sin inflar presupuestos. Esta campaña no realiza esas correcciones.

Falta cerrar equivalencia semántica por identidad, diferencial estático completo, capacidades de las 17 pendientes, estabilidad y compuertas oficiales del orquestador. Ningún GO.

La primera consulta de red requirió escalación; un lanzamiento fue rechazado por límite de uso del servicio de revisión (no por inseguridad), y se ejecutó tras la instrucción de continuar. No se contó ese intento como corrida física.
