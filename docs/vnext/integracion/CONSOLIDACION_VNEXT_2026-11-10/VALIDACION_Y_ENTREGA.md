# Validación del candidato consolidado de vNext

Fecha: 2026-11-10, America/Mexico_City.

**Integración técnica comprobada; no hay GO integral ni consolidación total de trabajos todavía inaccesibles de Antigravity.** La publicación solicitada se limita al trabajo existente verificado. No se desarrollaron funcionalidades después de la corrección de alcance.

Candidato de producto: merge `9be02fe`. El inventario y los informes R7 se guardaron en `501a098c68ea7aa62a07f3fe914dbef996025c26`. El SHA de entrega es el commit que contiene este informe (`git rev-parse HEAD`); los commits documentales posteriores conservan idéntico árbol de producto. Publicación en `feat/qap-vnext-architecture` mediante push normal, sin force; comprobación remota conservada en el recibo local de publicación.

## Resultados ejecutados

| Verificación | Resultado observado |
|---|---|
| Instalación `pnpm install --offline --frozen-lockfile` | PASS; dependencias desde caché, sin modificar lockfile |
| Monorepo `pnpm build` | PASS, diez paquetes; Node 24.15.0 / pnpm 12.3.4 |
| Knowledge completo | 581/581 PASS, 36 archivos; incluye VNEXT-015-04 y remediaciones DEV-MVP-01 |
| MCP completo | 506 PASS / 12 FAIL, 518 pruebas, 31 archivos |
| Comparación de fallos MCP | Exactamente las mismas 12 identidades de DEV-MVP-02; cuatro archivos de pruebas idénticos por objeto Git |
| Adapter completo | 166 PASS / 1 FAIL por timeout de rollback SQLite y EPERM durante cleanup; 167 pruebas |
| Repetición focal del fallo Adapter | 1/1 PASS, 24 pruebas no seleccionadas; no se cambió el test ni su timeout |
| Runner completo | 98/98 PASS, 17 archivos |
| Engine completo | 168/168 PASS, 11 archivos |
| Reporter completo | 51/51 PASS, 13 archivos |
| Vertical desde cliente MCP Stdio | PASS técnico, 36 llamadas, catálogo de 18 tools |
| Integridad de admin-user.json | 16/16 hashes sin cambios tras suites y vertical |

La corrida Adapter fallida se conserva íntegra. Se observó otra suite MCP concurrente y presión de memoria en el ejecutor; la repetición aislada pasó en 4 s. Eso no demuestra una causa única del timeout ni convierte la corrida completa en verde.

No se modificaron pruebas para obtener PASS. No se borraron fallos heredados. Las suites se ejecutaron con un worker y sin paralelismo entre archivos para limitar recursos. El script local de secuenciación encontró un error de codificación cp1252 al imprimir el resultado de Adapter; las suites posteriores se ejecutaron desde otro comando con salida UTF-8. Es un fallo del arnés de consola, no un resultado omitido de pruebas.

## Recorrido físico

Se ejecutó sin modificar `scripts/dev-mvp02-vertical.mjs`, sobre el candidato compilado:

```powershell
node scripts/dev-mvp02-vertical.mjs (Get-Location).Path C:/ruta/absoluta/nueva/evidencia
```

El arnés inicia una aplicación loopback que emite cookies mediante login real de fixture. Usa Client y StdioClientTransport del SDK y `packages/mcp/dist/server.js`. Ejecuta discovery autenticado estático, persiste observaciones y asociaciones, recupera la pregunta canónica, propone un requisito y comprueba que no puede confirmarse sin la revisión independiente. Las decisiones del CLI están marcadas `controlled-technical-operator-NOT-human-acceptance`.

Comprueba oráculos faltantes, generación idempotente de casos, ejecución sin aprobación bloqueada, invalidación de aprobación tras editar contenido y recuperación del recibo después de reiniciar. Ejecuta dos casos reales mediante Playwright: **uno PASS y un FAIL intencional**, cero not_run. La captura inspeccionada muestra realmente `Fixture ready`; el caso negativo esperaba un texto deliberadamente incorrecto. No es un fallo ocultado de la integración.

Persiste ejecución, relación regla/caso/aprobación, captura PNG, HTML, Markdown, JSON, JUnit e historial. Comprueba revocación de la sesión, bloqueo de discovery y recuperación de reportes por executionId. Recorre evaluación canónica, decisiones revisadas de aplicabilidad exclusivas del fixture, cierre de módulo y sesión; tras otro reinicio recupera reportes y estado **WRAP_UP**.

Ejecución: `exec_1794327888235_c9d99b576ed14a6c843880d408d125e1`. Las 36 respuestas, artefactos copiados y hashes están en [evidencia](evidencia/physical-artifacts.json). [Resultado](evidencia/result.json), [transcripción](evidencia/transcript.json), [reporte HTML](evidencia/execution.report.html), [captura](evidencia/screenshot-0.png).

## Instalación y cliente

En un checkout limpio de vNext: `pnpm install --frozen-lockfile`, `pnpm build`. Binario Stdio real: `node <ruta-absoluta>/packages/mcp/dist/server.js`. La preparación de un proyecto vacío, las identidades y autorizaciones del host y la revisión humana se explican en [DEV-MVP-02_CLIENTE_MCP.md](../../uso/DEV-MVP-02_CLIENTE_MCP.md). `scripts/qap-provision-host.mjs` genera el registro MCP con rutas absolutas para el cliente. Los archivos privados del host y sus claves no se versionan.

Discovery mantiene el contrato estático con cookies. SPA dependiente de JavaScript, localStorage autenticado y multitenant no se declaran resueltos. El experimento SPA quedó excluido y respaldado localmente. Este informe no convierte fixtures en aceptación humana; el responsable realizará su aceptación funcional en una conversación nueva.

## Conservación, publicación y pendientes

[Inventario completo y estado de los 16 checkouts](INVENTARIO_Y_RECONCILIACION.md). Sus ramas, HEAD detached, referencias, cambios locales, snapshots sustituidos y contribuciones accesibles de Antigravity quedan trazados en los JSON anexos. Los bundles privados se verificaron y permanecen fuera de Git. No se modifican develop/main, WBS histórico ni admin-user.json.

**Pendiente real:** el responsable aportará el informe adicional de reconciliación de Antigravity. No se inspeccionó otra computadora ni se presume conservado trabajo inaccesible. Ninguna rama o worktree se elimina en esta entrega. El checkout principal conserva su sesión previamente modificada y sus informes originales; audit-r4-r8 conserva sus fixtures sin guardar. El candidato de consolidación queda limpio tras guardar este informe.

**Dictamen:** publicación del candidato de integración técnicamente verificado, con 12 fallos MCP heredados declarados y un timeout Adapter reproducido como PASS focal. Consolidación total PENDIENTE de reconciliación externa. GO integral NO EMITIDO.
