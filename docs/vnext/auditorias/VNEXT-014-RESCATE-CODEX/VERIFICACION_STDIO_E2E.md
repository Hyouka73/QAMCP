**Auditoría independiente de aceptación. Fecha: 2026-11-05.** Repositorio Hyouka73/QAMCP, rama exclusiva feat/qap-vnext-architecture. **Snapshot exacto probado: e71818ac6fdaa1847e300a67bd4540fbfbd514c5.** Último commit productivo: 4be066c794c1e83fa0b3e1b89d269094f7b7f68e. Base anterior al rescate: f36e5ba60470c2443690d78a4b68bad966891b69. El SHA de esta publicación documental se verifica en GitHub al terminar y no sustituye el del snapshot probado. VNEXT-014 NO-GO; VNEXT-015 no iniciado.

# Entradas reales, Discovery y recorrido integrado

## Rutas soportadas comprobadas

| Entrada | Resultado físico | Frontera de autorización |
| --- | --- | --- |
| node packages/mcp/dist/server.js sin manifiesto | Legacy, 18 herramientas; no módulos canónicos; Discovery knowledge_unbound | No inventa binding, stores ni gateway |
| CLI qap mcp --project ROOT sin manifiesto | Mismo comportamiento | No confundir arranque con autorización |
| Servidor directo con QAP_MCP_HOST_CONFIG_PATH | Abre Knowledge+InterviewDraft+Closure existentes, 18 herramientas, status canónico y Discovery real con política explícita | Entrevista/cierre que requieren aprobación bloquean sin gateway |
| CLI mcp --project ROOT con manifiesto | Misma composición canónica y Discovery | closure_review_gateway_required sin gateway humano |
| Host programático startMcpServer(options) en proceso Stdio | Recorrido mecánico completo con SQLite real e inbox independiente de las tools | El gateway de fixture prueba integración; no consentimiento humano auténtico |

Manifiesto v1 no puede cargar funciones de gateway. Se comprobó literalmente que ambos gateways de loadHostComposition son undefined. La ruta estándar soporta adquisición y consulta canónicas, pero no completar aprobaciones humanas por sí sola. Un host de aplicación legítimo debe inyectar ese servicio y aportar evidencia humana auténtica fuera de MCP.

Ambas entradas estándar rechazan manifiesto ausente/malformado, llaves faltantes/inválidas, clave incorrecta con snapshot cifrado existente, revisión de módulo obsoleta, store inexistente, raíz relativa y acuse falso. La sonda adicional rechaza Knowledge corrupto, draft ausente, closure vacío, hardlink de manifiesto, junction raíz, scope ajeno, acuse ausente, entorno obsoleto y URL no exacta. La anomalía del Knowledge vacío se registra en A03: se modifica antes de rechazar, aunque no se crea una aprobación. No se certifica protección frente a sustitución privilegiada del archivo después del preflight.

Las tres instancias de almacén lanzan error al usarse después de composition.close. Servidor directo y CLI reciben EOF físico y salen naturalmente con exit0/signal null. El código cierra recursos de composición al desconectar/fallar; las pruebas anteriores y reapertura física no demostraron fugas en esos caminos. No se promete sanitización ante kill ni verificación universal de ACL. En el host programático el dueño de options debe cerrar sus recursos: startMcpServer(options) no asume esa propiedad; el arnés lo hace al exit.

## Catálogo preservado

qap_auth_add, qap_auth_list, qap_clean, qap_context_ingest, qap_context_set, qap_discover, qap_init, qap_module_close, qap_plan, qap_prune, qap_report, qap_rules_set, qap_server, qap_session_close, qap_session_plan, qap_status, qap_test, qap_validate. **18 nombres**, comprobados por tools/list de ambas entradas.

Se ejecutó el script original scripts/test-mcp-stdio.mjs sin cambiarlo. Para respetar la sesión personal se ejecutó con cwd desechable y junction packages al build real. Ese script omite targetPath y anuncia «100%»; su exit0 se usa solamente como prueba de conectividad legacy. Los arneses de auditoría sí pasan targetPath absoluto en cada tool y examinan los resultados, no ese mensaje promocional.

## Discovery: autorización y límites

Servidor directo y CLI, política exacta del manifiesto, web HTTP 127.0.0.1 autorizada: adquisición completed, asociación confirmed, dos observaciones reales por entrada; readback conserva cero requisitos. URL distinta devuelve url_not_authorized. profile devuelve authentication_not_supported. /redirect autorizado responde 302 a /forbidden no autorizado: petición del servidor solo a /redirect, /forbidden nunca alcanzado. Módulo terminal devuelve module_restricted. EOF termina ambos procesos correctamente.

Discovery59/59 adicionalmente ejecuta los negativos de autorización ausente, acuse falso, revisión obsoleta, IP privada/fuera del conjunto, DNS/red pública sin permiso, navegación autenticada no soportada, módulo cerrado, cancelación previa y durante ejecución con cleanup. Son pruebas del crawler/handler reales existentes, sin modificar expectativas; no se certifica SSRF general ni JS de aplicación ni navegación autenticada. allowed_ips vacío no se considera permiso público y la política restrictiva no se convierte en consentimiento implícito.

Observaciones/códigos HTTP/controles DOM quedan como evidencia de adquisición; no se transforman automáticamente en ExpectedRequirement confirmado ni en resultado funcional PASS. La sonda comprueba que la primera review de cada propuesta devuelve human_review_not_authorized y Knowledge no se llena por Discovery.

## Recorrido físico con host de fixture independiente

Web local desechable, Chromium real, Stdio SDK y tres bases físicas provisionadas para el fixture. El inbox vive fuera de las tools: cada comando review/cierre primero bloquea; solo la decisión correlacionada insertada después por el arnés host permite continuar. Esto simula la frontera técnica de revisión. **No hay prueba de consentimiento humano auténtico.**

| Paso | Resultado |
| --- | --- |
| qap_init | success, ONBOARDING |
| qap_context_set | success, SCOPING, contexto sintético explícito |
| qap_session_plan A/B | success, WORKING |
| Discovery autorizado | Chromium navega a web local; adquisición/observaciones durables, asociación confirmed a A |
| Entrevista y propuesta | Siete preguntas estructurales; siete propuestas con categoría/criterios de aceptación |
| Revisión de cada propuesta | Primer intento blocked sin decisión; segunda llamada, tras decisión de fixture exacta en inbox, confirmed |
| ExpectedRequirement | Siete confirmados por servicio de entrevista, siete recibos de revisión y readback físico; no copia automática del DOM |
| Cobertura y aceptación de brecha | Brecha real gap:host:performance:unknown_applicability después del primer requisito; accept_gaps aprobado por inbox, receipt durable; replay exacto idempotent sin segunda decisión |
| Aplicabilidad | performance no aplicable, solicitud/gateway/digest independientes |
| A closed | Cobertura actual satisface precondiciones, gateway independiente de fixture y recibo real |
| B waived | Motivo exacto aprobado por fixture y recibo correspondiente |
| Requisito pendiente | Se añade una hipótesis observacional draft **después del cierre** para verificar que el reporte distingue inventario actual de cobertura aprobada; no es revisión ni requisito confirmado |
| Reporte físico | Dos secciones, 7 confirmados actuales +1 pendiente, brecha aceptada con receipt, aplicabilidad, waiver, IDs/digests; ejecución no certificada |
| qap_session_close | success, WRAP_UP |
| Replanificar A cerrado | error legítimo: módulo closed no se puede reabrir; lote rechazado |
| Nueva sesión | Host incorpora binding explícito para módulo C nuevo; qap_session_plan C success, WORKING, ID de sesión nuevo |
| Persistencia | 8 requisitos (7 confirmados+1 draft), 11 relaciones y snapshot cifrado de autoridad intactos entre fin de sesión y replanificación; lifecycle conserva A closed/B waived e historial anterior y añade transiciones de nueva sesión |

El primer pase mecánico sin brecha/draft también pasó; el arnés ampliado definitivo es el publicado aquí. No hubo qap_test funcional en este recorrido: el reporte afirma cobertura de ejecución no certificada. TestHandler y Runner se ejecutaron en sus propias suites, con fuentes reales de ejecución; no se mezclan esos resultados con la aplicación del fixture de entrevista. No se certifica un MVP funcional de usuario ni se concede GO completo por esta cadena automatizada.

## Reporte, integridad y recuperación

La proyección excluye las reglas legacy de módulos vinculados y conserva reporte legacy para módulos no vinculados; report-handler12/12 y reporter47/47 pasan. Requisitos actuales se etiquetan explícitamente como inventario al generar el reporte, no snapshot al momento del cierre. Una aceptación vieja permanece durable en la proyección aunque el inventario cambie; no se afirma que una nueva revisión esté cubierta por aquella aceptación. Replay con cambio de requisitos/sesión/binding bloquea en las sondas específicas.

Los casos negativos de aprobación/waiver/binding y fallos de escritura están en HALLAZGOS. **A01 y A02 impiden certificar consistencia concurrente del reporte y transición**, pese al positivo secuencial. El reporte no es transacción común con Knowledge, Closure y filesystem. Un archivo persistido antes de un fallo de transición no equivale por sí solo a sesión cerrada.

### Resultado Stdio estándar y EOF

~~~text
{"scenario":"standard-stdio-manifest-discovery","entry":"server","acquisition":"completed","association":"confirmed","observations":2,"differentUrl":"url_not_authorized","authenticated":"authentication_not_supported","redirectStatus":"blocked","redirectLimitations":["STATIC_MODE_NO_APPLICATION_JAVASCRIPT","NO_GENERAL_BROWSER_SSRF_CERTIFICATION","EXTERNAL_RESOURCES_FRAMES_DOWNLOADS_BLOCKED","ROUTE_REFERENCES_ARE_OPAQUE_PER_EXECUTION","GET_SAFETY_REQUIRES_CALLER_CONSENT","DOMAIN_IDENTITIES_DEFERRED"],"requests":["/redirect"],"terminal":"module_restricted"}
{"scenario":"physical-eof","entry":"server","code":0,"signal":null}
{"scenario":"standard-stdio-manifest-discovery","entry":"cli","acquisition":"completed","association":"confirmed","observations":2,"differentUrl":"url_not_authorized","authenticated":"authentication_not_supported","redirectStatus":"blocked","redirectLimitations":["STATIC_MODE_NO_APPLICATION_JAVASCRIPT","NO_GENERAL_BROWSER_SSRF_CERTIFICATION","EXTERNAL_RESOURCES_FRAMES_DOWNLOADS_BLOCKED","ROUTE_REFERENCES_ARE_OPAQUE_PER_EXECUTION","GET_SAFETY_REQUIRES_CALLER_CONSENT","DOMAIN_IDENTITIES_DEFERRED"],"requests":["/redirect"],"terminal":"module_restricted"}
{"scenario":"physical-eof","entry":"cli","code":0,"signal":null}

~~~

### Resultado de manifiestos en ambas entradas

~~~text
{"scenario":"runtime","node":"v24.15.0","chromium":"153.0.8010.12","executable":"C:\\Users\\Judirico\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe","platform":"win32"}
{"scenario":"FTS5-CREATE-INSERT-MATCH","sqlite":"3.51.3","status":"PASS"}
{"scenario":"no-manifest","entry":"server","connected":true,"tools":["qap_status","qap_init","qap_clean","qap_auth_add","qap_auth_list","qap_context_set","qap_context_ingest","qap_session_plan","qap_discover","qap_plan","qap_validate","qap_test","qap_report","qap_server","qap_prune","qap_rules_set","qap_module_close","qap_session_close"],"canonical":0,"discovery":"knowledge_unbound","closure":"knowledge_unbound"}
{"scenario":"valid","entry":"server","connected":true,"tools":["qap_status","qap_init","qap_clean","qap_auth_add","qap_auth_list","qap_context_set","qap_context_ingest","qap_session_plan","qap_discover","qap_plan","qap_validate","qap_test","qap_report","qap_server","qap_prune","qap_rules_set","qap_module_close","qap_session_close"],"canonical":1,"discovery":"discovery_authorization_required","closure":"closure_review_gateway_required"}
{"scenario":"missing-manifest","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":": Host configuration requires an existing canonical absolute manifest\n    at existingFile (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:895:11)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1001:16)\n    at startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:74)\n    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9769:3\n    at ModuleJob.run (node:internal/modules/esm/module_job:437:25)\n    at async node:internal/modules/esm/loader:639:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)\n"}
{"scenario":"malformed","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)\n    at JSON.parse (<anonymous>)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1002:24)\n    at startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:74)\n    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9769:3\n    at ModuleJob.run (node:internal/modules/esm/module_job:437:25)\n    at async node:internal/modules/esm/loader:639:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)\n"}
{"scenario":"missing-key","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] Error: Missing or invalid host-managed 32-byte key.\n    at secret (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:906:11)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1034:24)\n    at async startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:68)\n"}
{"scenario":"invalid-key","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] Error: Missing or invalid host-managed 32-byte key.\n    at secret (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:906:11)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1052:26)\n    at async startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:68)\n"}
{"scenario":"wrong-key","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] ClosureStoreError: Module closure store: corrupt\n    at SqliteModuleClosureStore.check (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:805:63)\n    at SqliteModuleClosureStore.read (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:840:31)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1064:26)\n    at async startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:68) {\n  code: 'corrupt'\n}\n"}
{"scenario":"stale-module","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] Error: Host module binding does not match pinned canonical revisions.\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1024:15)\n    at async startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:68)\n"}
{"scenario":"missing-store","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] Error: Host configuration requires an existing canonical absolute moduleClosure.dbPath\n    at existingFile (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:895:11)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1056:17)\n    at async startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:68)\n"}
{"scenario":"relative-root","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] Error: Project root must be an existing canonical absolute directory.\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1006:11)\n    at startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:74)\n    at file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9769:3\n    at ModuleJob.run (node:internal/modules/esm/module_job:437:25)\n    at async node:internal/modules/esm/loader:639:26\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)\n"}
{"scenario":"bad-ack","entry":"server","connected":false,"error":"MCP error -32000: Connection closed","stderr":"[QAP MCP Server Fatal] Error: Explicit pinned read-only Discovery authorization required.\n    at discoveryPolicy (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:941:11)\n    at loadHostComposition (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:1080:13)\n    at async startMcpServer (file:///C:/Users/Judirico/Documents/QAMCP/audit-r4-r10/packages/mcp/dist/chunk-ACC5QC3M.js:9755:68)\n"}
{"scenario":"no-manifest","entry":"cli","connected":true,"tools":["qap_status","qap_init","qap_clean","qap_auth_add","qap_auth_list","qap_context_set","qap_context_ingest","qap_session_plan","qap_discover","qap_plan","qap_validate","qap_test","qap_report","qap_server","qap_prune","qap_rules_set","qap_module_close","qap_session_close"],"canonical":0,"discovery":"knowledge_unbound","closure":"knowledge_unbound"}
{"scenario":"valid","entry":"cli","connected":true,"tools":["qap_status","qap_init","qap_clean","qap_auth_add","qap_auth_list","qap_context_set","qap_context_ingest","qap_session_plan","qap_discover","qap_plan","qap_validate","qap_test","qap_report","qap_server","qap_prune","qap_rules_set","qap_module_close","qap_session_close"],"canonical":1,"discovery":"discovery_authorization_required","closure":"closure_review_gateway_required"}
{"scenario":"missing-manifest","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Host configuration requires an existing canonical absolute manifest\n"}
{"scenario":"malformed","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Expected property name or '}' in JSON at position 1 (line 1 column 2)\n"}
{"scenario":"missing-key","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Missing or invalid host-managed 32-byte key.\n"}
{"scenario":"invalid-key","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Missing or invalid host-managed 32-byte key.\n"}
{"scenario":"wrong-key","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Module closure store: corrupt\n"}
{"scenario":"stale-module","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Host module binding does not match pinned canonical revisions.\n"}
{"scenario":"missing-store","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Host configuration requires an existing canonical absolute moduleClosure.dbPath\n"}
{"scenario":"relative-root","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Project root must be an existing canonical absolute directory.\n"}
{"scenario":"bad-ack","entry":"cli","connected":false,"error":"MCP error -32000: Connection closed","stderr":"qap: error: Explicit pinned read-only Discovery authorization required.\n"}
{"scenario":"composition-close-resources","closedStores":3,"gatewaysInvented":false,"missingPrivilegedDbNotCreated":true}

~~~

### Registro del recorrido ampliado definitivo

~~~text
{"tool":"qap_init","status":"success","message":"✔ Proyecto inicializado con éxito en .qa/","phase":"ONBOARDING"}
{"tool":"qap_context_set","status":"success","phase":"SCOPING"}
{"tool":"qap_session_plan","status":"success","phase":"WORKING"}
{"tool":"qap_discover","status":"partial","code":"execution_scope_only","coverage":"partial","association":"confirmed"}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_module_close","action":"accept_gaps","status":"blocked","code":"closure_review_pending","reason":"La revisión humana de cierre del host no ha emitido una autorización o está pendiente."}
{"tool":"qap_module_close","action":"accept_gaps","status":"gaps_accepted"}
{"tool":"qap_module_close","action":"accept_gaps","status":"gaps_accepted"}
{"scenario":"actual-gap-accepted-and-replayed","gap":"gap:host:performance:unknown_applicability","idempotent":true}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"next","status":"interviewing","coverage":"not_certified","association":"available"}
{"tool":"qap_rules_set","action":"propose","status":"pending_review","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"blocked","code":"human_review_not_authorized","coverage":"not_certified"}
{"tool":"qap_rules_set","action":"review","status":"confirmed","coverage":"not_certified"}
{"tool":"qap_module_close","action":"declare_non_applicable","status":"blocked","code":"closure_review_pending","reason":"La revisión humana de cierre del host no ha emitido una autorización o está pendiente."}
{"tool":"qap_module_close","action":"declare_non_applicable","status":"declared_non_applicable"}
{"tool":"qap_module_close","action":"close","status":"blocked","code":"closure_review_pending","reason":"La revisión humana de cierre del host no ha emitido una autorización o está pendiente."}
{"tool":"qap_module_close","action":"close","status":"closed"}
{"tool":"qap_module_close","action":"waive","status":"blocked","code":"closure_review_pending","reason":"La revisión humana de cierre del host no ha emitido una autorización o está pendiente."}
{"tool":"qap_module_close","action":"waive","status":"waived"}
{"tool":"qap_session_close","status":"success","message":"✔ Sesión 'session_754ccb9a' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.","phase":"WRAP_UP"}
{"scenario":"physical-report","path":"C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-host-VhTkoZ\\.qa\\project\\sessions\\session_754ccb9a.report.md","canonical":{"modulos_cerrados":1,"modulos_waived":1,"requisitos_confirmados_actuales":7,"cobertura_ejecucion":"not_certified_by_session_report","aprobacion_humana_autentica":"requires_independent_host_evidence"},"containsTwoModules":true,"actualQapTestPerformed":false}
{"tool":"qap_session_plan","status":"error","error":"El módulo 'host' ya se encuentra cerrado formalmente (closed) en una sesión previa y no puede ser reabierto. Lote rechazado por completo."}
{"scenario":"replan-same-closed-module","status":"error","legitimateTerminalGuard":true}
{"tool":"qap_session_plan","status":"success","phase":"WORKING"}
{"scenario":"new-session-replan","status":"success","lifecycle":{"_version":"1","phase":"WORKING","session":{"id":"2b34a247-0736-4849-a9c2-49d3e41b7d9d","started_at":"2026-11-05T19:36:26.872Z","auth":{"required":false,"source":"user"},"plan":[{"module":"module-c","path":"/c","priority":"high","status":"planned","flujos":[]}]},"modules":{"host":{"state":"closed","updated_at":"2026-11-05T19:36:22.191Z"},"module-b":{"state":"waived","updated_at":"2026-11-05T19:36:25.281Z","waived_reason":"Controlled fixture independent waiver for module B without claiming human consent"},"module-c":{"state":"planned","updated_at":"2026-11-05T19:36:26.872Z"}},"history":[{"from":"NONE","to":"ONBOARDING","at":"2026-11-05T19:36:21.907Z","reason":"Inicialización de ciclo de vida con qap_init"},{"from":"ONBOARDING","to":"SCOPING","at":"2026-11-05T19:36:22.172Z","reason":"Compuerta de salida de ONBOARDING superada exitosamente"},{"from":"SCOPING","to":"WORKING","at":"2026-11-05T19:36:22.191Z","reason":"Compuerta de salida de SCOPING superada exitosamente"},{"from":"module-b:planned","to":"module-b:waived","at":"2026-11-05T19:36:25.281Z","module":"module-b","reason":"Controlled fixture independent waiver for module B without claiming human consent"},{"from":"WORKING","to":"WRAP_UP","at":"2026-11-05T19:36:25.344Z","reason":"Sesión cerrada exitosamente: todos los módulos del plan finalizados"},{"from":"WRAP_UP","to":"SCOPING","at":"2026-11-05T19:36:26.872Z","reason":"Inicio de nueva sesión de trabajo desde WRAP_UP"},{"from":"SCOPING","to":"WORKING","at":"2026-11-05T19:36:26.872Z","reason":"Compuerta de salida de SCOPING superada exitosamente en nueva sesión"}]},"requirements":8,"relations":11,"durableAuthorityAndHistoryUnchanged":true,"humanGateCertified":false}
{"scenario":"cleanup","httpHits":["/"],"stderr":"[QAP MCP Server] Servidor iniciado correctamente en transporte Stdio.\n"}

~~~

### Archivo físico generado (fixture, no autorización real)

~~~text
# Reporte de cierre canónico de sesión

Fuente de autoridad: registros durables de cierre y aprobaciones correlacionadas del host.
Los requisitos listados son el inventario vigente al generar este reporte; no se afirma que el inventario sea idéntico al del momento de la aprobación.
**Cobertura de especificación:** inventario y decisiones canónicas, no ejecución de pruebas.
**Cobertura de revisión:** se registran decisiones del gateway; los fixtures automatizados no acreditan consentimiento humano auténtico.
**Cobertura de ejecución:** no certificada por este reporte. Los resultados de qap_test requieren sus propias evidencias físicas.

## Módulo: host

- Estado canónico autorizado: **closed**
- Decisión: 29ca2bd9-64fe-4775-b773-ac397f1351c9
- Revisor registrado: CONTROLLED\_FIXTURE\_NOT\_REAL\_HUMAN (2026-11-05T19:36:25.020Z)
- Digest de autorización: be33bc7d4e326a0c565d299b6623f9cbd56cbc317b590f6309a959fadb81e032
- Digest de cobertura al cierre: 4a6b6b7e98b237c4978ddbbb27e2269577cbfeea8ce6cf67b80917d9a8b7db14

### Requisitos confirmados (inventario actual)

- requirement:19950f3fc7aa3d46df2e20c879d62e2ddeb5f847cc829cf77a8d219048165d4e (rev. 1, regression): Consultar el expediente con garantía regression
- requirement:20ccbe462debb22e107b8311ff1a7409cb982e5b73672ab712ccb15fe5bc4be9 (rev. 1, ui): Consultar el expediente con garantía ui
- requirement:302b4e04569ccd2582c05c92dd605f6e2ce660588ddc76e407d7c74824573ce2 (rev. 1, functional): Consultar el expediente con garantía functional
- requirement:af69ffb57f68f0dda5b5c3b8e9a7be757fdf1faecdfbc95fc643437361e03367 (rev. 1, security): Consultar el expediente con garantía security
- requirement:d0fbcee0edde34fc61e178d2f4705efe673bb45b7f6cca50dd3cb6164737fc04 (rev. 1, performance): Consultar el expediente con garantía performance
- requirement:f86a47f89445a13cfcd5b2c27cdd704f223e7d9b745d254185577025aebd7d4b (rev. 1, business\_rule): Consultar el expediente con garantía business\_rule
- requirement:fd9fb49888579bb6ee5a7af609efad07ce161c92ab388dc4eab7388e5ebf6ffe (rev. 1, ux): Consultar el expediente con garantía ux
- Requisitos pendientes o no acreditables actualmente: 1

### Brechas aceptadas durables

- gap:host:performance:unknown\_applicability (performance): Controlled fixture accepts the real initial performance specification gap; recibo: d2ac8a41-692e-475d-bf51-cd1c76735071

### Aplicabilidad

- performance: no aplicable; motivo: Controlled scope excludes performance assurance from this synthetic session; decisión: dec\_performance\_924700fad59dffab

## Módulo: module-b

- Estado canónico autorizado: **waived**
- Decisión: 79d464f7-c0b8-45f3-86a1-166975f8d86a
- Revisor registrado: CONTROLLED\_FIXTURE\_NOT\_REAL\_HUMAN (2026-11-05T19:36:25.156Z)
- Digest de autorización: e392661196904c3461ad971abdddb2173bb9f71ed5b196304d6b837a7a2c4409
- Digest de cobertura al cierre: 169ea29346b2cf321042c60e4e330a29dd76ce2d6b9e36486d1422853ab6a6af
- Motivo de waiver: Controlled fixture independent waiver for module B without claiming human consent

### Requisitos confirmados (inventario actual)

- Ninguno registrado como confirmado actualmente.
- Requisitos pendientes o no acreditables actualmente: 0

### Brechas aceptadas durables

- No hay brechas aceptadas registradas en esta proyección.

### Aplicabilidad

- Sin decisiones explícitas durables de aplicabilidad.


~~~

## Arneses externos reproducibles

Los helpers setup/prepare están en HALLAZGOS. Crear los archivos siguientes fuera de Git; program-host.mjs se coloca en packages/mcp/node_modules/.audit-rescate para resolver dependencias. Ningún gateway de este arnés se suministra por argumentos de tool ni forma parte de la composición estándar. Las llaves aleatorias del fixture no se imprimen ni publican.

~~~javascript
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {writeFileSync,readFileSync,mkdirSync,existsSync,realpathSync,linkSync,symlinkSync,statSync} from 'node:fs';import {join} from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {provision,loadHostComposition} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/host.mjs';
const repo='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10',req=createRequire(repo+'/package.json');const load=async id=>import(pathToFileURL(req.resolve(id)));const {Client}=await load('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=await load('@modelcontextprotocol/sdk/client/stdio.js'),pw=await load('playwright-core');const chromium=pw.chromium??pw.default.chromium;
const emit=x=>console.log(JSON.stringify(x));
const browser=await chromium.launch({headless:true});emit({scenario:'runtime',node:process.version,chromium:browser.version(),executable:chromium.executablePath(),platform:process.platform});await browser.close();
const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(':memory:');db.exec('CREATE VIRTUAL TABLE audit_fts USING fts5(body)');db.prepare('INSERT INTO audit_fts VALUES (?)').run('rescate acceptance');assert.equal(db.prepare('SELECT count(*) n FROM audit_fts WHERE body MATCH ?').get('rescate').n,1);emit({scenario:'FTS5-CREATE-INSERT-MATCH',sqlite:db.prepare('select sqlite_version() v').get().v,status:'PASS'});db.close();
const f=await provision();writeFileSync('../rescate-evidence/host-root.txt',f.root);const lifecycle=join(f.root,'.qa/project/lifecycle.json');writeFileSync(lifecycle,JSON.stringify({_version:'1',phase:'WORKING',modules:{host:{state:'planned',updated_at:new Date().toISOString()}},session:{id:'rescue-host',started_at:new Date().toISOString(),plan:[{module:'host',path:'/'}],auth:{required:false}},history:[]}));
const seeded=await loadHostComposition(f.env);await seeded.options.knowledgeBindings[0].moduleClosureStore.transaction(f.scope,async snap=>{snap.acceptedGaps.host=[];});seeded.close();
const valid=JSON.stringify(f.manifest),originalKey=f.env.QAP_MCP_CLOSURE_KEY_HEX;
const mutations=[['no-manifest',()=>({})],['valid',()=>f.env],['missing-manifest',()=>({...f.env,QAP_MCP_HOST_CONFIG_PATH:join(f.root,'missing.json')})],['malformed',()=>{writeFileSync(f.manifestPath,'{');return f.env;}],['missing-key',()=>({QAP_MCP_HOST_CONFIG_PATH:f.manifestPath})],['invalid-key',()=>({...f.env,QAP_MCP_CLOSURE_KEY_HEX:'bad'})],['wrong-key',()=>({...f.env,QAP_MCP_CLOSURE_KEY_HEX:'01'.repeat(32)})],['stale-module',()=>{const m=JSON.parse(valid);m.moduleBindings[0].moduleRevision=2;writeFileSync(f.manifestPath,JSON.stringify(m));return f.env;}],['missing-store',()=>{const m=JSON.parse(valid);m.moduleClosure.dbPath=join(f.root,'does-not-exist.sqlite');writeFileSync(f.manifestPath,JSON.stringify(m));return f.env;}],['relative-root',()=>{const m=JSON.parse(valid);m.projectRoot='.';writeFileSync(f.manifestPath,JSON.stringify(m));return f.env;}],['bad-ack',()=>{const m=JSON.parse(valid);m.discoveryAuthorization={read_only_acknowledged:false,environmentRevision:1,navigation_urls:['https://example.invalid/']};writeFileSync(f.manifestPath,JSON.stringify(m));return f.env;}]];
for(const entry of ['server','cli'])for(const [scenario,mutate] of mutations){writeFileSync(f.manifestPath,valid);const env={...process.env,...mutate()};if(scenario==='no-manifest')delete env.QAP_MCP_HOST_CONFIG_PATH;let stderr='';const transport=new StdioClientTransport({command:process.execPath,args:entry==='server'?[repo+'/packages/mcp/dist/server.js']:[repo+'/packages/cli/dist/entrypoint.js','mcp','--project',f.root],cwd:f.root,env,stderr:'pipe'});transport.stderr?.on('data',b=>stderr+=b.toString());const client=new Client({name:'rescue-auditor',version:'1'});let connected=false;try{await client.connect(transport);connected=true;const tools=await client.listTools();assert.equal(tools.tools.length,18);const call=async(name,args={})=>{const r=await client.callTool({name,arguments:{targetPath:f.root,...args}});return JSON.parse(r.content[0].text);};const status=await call('qap_status');const discover=await call('qap_discover',{name:'host',path:'/'});const closure=await call('qap_module_close',{module:'host',canonical_closure:{action:'waive',reason:'Controlled integration probe without genuine human consent'}});emit({scenario,entry,connected,tools:tools.tools.map(x=>x.name),canonical:status.canonical_modules?.length,discovery:discover.code,closure:closure.code??closure.status});assert.ok(['no-manifest','valid'].includes(scenario));}catch(e){if(connected||['no-manifest','valid'].includes(scenario))throw e;emit({scenario,entry,connected,error:e.message,stderr:stderr.slice(-750)});}finally{await client.close();}}
writeFileSync(f.manifestPath,valid);assert.equal(existsSync(join(f.root,'does-not-exist.sqlite')),false);
const composed=await loadHostComposition(f.env);const bound=composed.options.knowledgeBindings[0];composed.close();let closed=0;for(const store of [bound.store,bound.interviewDraftStore,bound.moduleClosureStore])try{if(store===bound.store)await store.query('app-host','module');else store.read(f.scope);}catch{closed++;}assert.equal(closed,3);emit({scenario:'composition-close-resources',closedStores:closed,gatewaysInvented:!!bound.humanReviewGateway||!!bound.moduleClosureReviewGateway,missingPrivilegedDbNotCreated:true});


~~~

~~~javascript
import {readFileSync,writeFileSync,mkdtempSync,symlinkSync} from 'node:fs';import {join} from 'node:path';import {spawnSync} from 'node:child_process';const repo='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10',out='C:/Users/Judirico/Documents/QAMCP/rescate-evidence';const root=mkdtempSync(join(out,'stdio-script-'));symlinkSync(repo+'/packages',join(root,'packages'),'junction');const env={...process.env};delete env.QAP_MCP_HOST_CONFIG_PATH;const r=spawnSync(process.execPath,['--input-type=module','-e',`process.chdir(${JSON.stringify(root)});await import(${JSON.stringify('file:///'+repo+'/scripts/test-mcp-stdio.mjs')});`],{env,encoding:'utf8',timeout:30000});writeFileSync(out+'/stdio-script.log',r.stdout+r.stderr);console.log(JSON.stringify({scenario:'unmodified-scripts-test-mcp-stdio',exit:r.status,root,reportedSuccess:r.stdout.includes('FUNCIONANDO AL 100%'),stderr:r.stderr.slice(-300)}));

~~~

~~~javascript
import {provision,loadHostComposition} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/host.mjs';import {FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {createServer} from 'node:http';import {writeFileSync} from 'node:fs';import {join} from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const repo='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10',req=createRequire(repo+'/package.json'),load=async id=>import(pathToFileURL(req.resolve(id)));const {Client}=await load('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=await load('@modelcontextprotocol/sdk/client/stdio.js');const emit=x=>console.log(JSON.stringify(x));
let hits=[];const http=createServer((r,s)=>{hits.push(r.url);if(r.url==='/redirect'){s.writeHead(302,{location:'/forbidden'});s.end();}else {s.setHeader('content-type','text/html');s.end('<html><body><input required name="audit"></body></html>');}});await new Promise(r=>http.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+http.address().port;
try{for(const entry of ['server','cli']){const f=await provision(),comp=await loadHostComposition(f.env),b=comp.options.knowledgeBindings[0],e=await b.store.get('app-host','environment','local');await b.store.commit('app-host',[{kind:'environment',expected_revision:1,entity:{...e.entity,base_url:origin,safe_domains:['127.0.0.1']},trace:e.trace}]);comp.close();f.manifest.moduleBindings[0].environmentRevision=2;f.manifest.discoveryAuthorization={read_only_acknowledged:true,environmentRevision:2,navigation_urls:[origin+'/',origin+'/redirect'],allowed_ips:['127.0.0.1'],allow_public_network:false,limits:{max_pages:1,max_requests:5}};writeFileSync(f.manifestPath,JSON.stringify(f.manifest));writeFileSync(join(f.root,'.qa/project/lifecycle.json'),JSON.stringify({_version:'1',phase:'WORKING',modules:{host:{state:'planned',updated_at:new Date().toISOString()}},session:{id:'s',started_at:new Date().toISOString(),plan:[{module:'host',path:'/'}],auth:{required:false}},history:[]}));const args=entry==='server'?[repo+'/packages/mcp/dist/server.js']:[repo+'/packages/cli/dist/entrypoint.js','mcp','--project',f.root],client=new Client({name:'real-stdio-discovery',version:'1'}),transport=new StdioClientTransport({command:process.execPath,args,cwd:f.root,env:{...process.env,...f.env},stderr:'pipe'});await client.connect(transport);const call=async extra=>{const r=await client.callTool({name:'qap_discover',arguments:{targetPath:f.root,name:'host',path:'/',...extra}});return JSON.parse(r.content[0].text);};
 const first=await call({});assert.equal(first.association_status,'confirmed');assert.ok(first.observations>0);const different=await call({path:'/different'});assert.equal(different.code,'url_not_authorized');const auth=await call({profile:'not-supported'});assert.equal(auth.code,'authentication_not_supported');hits=[];const redirect=await call({path:'/redirect'});assert.ok(!hits.includes('/forbidden'));await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(s=>{s.modules.host.state='closed';return s;});const terminal=await call({});assert.equal(terminal.code,'module_restricted');emit({scenario:'standard-stdio-manifest-discovery',entry,acquisition:first.status,association:first.association_status,observations:first.observations,differentUrl:different.code,authenticated:auth.code,redirectStatus:redirect.status,redirectLimitations:redirect.limitations,requests:hits,terminal:terminal.code});await client.close();const read=await loadHostComposition(f.env);assert.equal((await read.options.knowledgeBindings[0].store.query('app-host','requirement')).items.length,0);read.close();
 const child=spawn(process.execPath,args,{cwd:f.root,env:{...process.env,...f.env},stdio:['pipe','pipe','pipe']});child.stdout.resume();child.stderr.resume();child.stdin.end();const exited=await Promise.race([new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal}))),new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),5000))]);if(exited.timeout)child.kill();assert.equal(exited.code,0);emit({scenario:'physical-eof',entry,...exited});}}
finally{http.closeAllConnections();await new Promise(r=>http.close(r));}

~~~

### program-host.mjs, no versionado
~~~javascript
import {loadHostComposition} from './host.mjs';import {startMcpServer} from '../../dist/index.js';import {readFileSync,writeFileSync} from 'node:fs';
const composed=await loadHostComposition(),cfg=process.env.AUDIT_INBOX;
const review=async(kind,request)=>{writeFileSync(cfg+'.request',JSON.stringify({kind,request}));const inbox=JSON.parse(readFileSync(cfg,'utf8'));return inbox[request.requestDigest]??null;};
const options={...composed.options,knowledgeBindings:composed.options.knowledgeBindings.map(b=>({...b,humanReviewGateway:{review:r=>review('interview',r)},moduleClosureReviewGateway:{reviewClosure:r=>review('closure',r)}}))};
await startMcpServer(options);process.on('exit',()=>composed.close());

~~~

~~~javascript
import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {readFileSync,writeFileSync,existsSync,unlinkSync,realpathSync} from 'node:fs';import {createServer} from 'node:http';import {join} from 'node:path';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
import {CanonicalCoverageService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/fixture.mjs';
import {provision,loadHostComposition} from '../audit-r4-r10/packages/mcp/node_modules/.audit-rescate/host.mjs';
const repo='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10',req=createRequire(repo+'/package.json'),load=async id=>import(pathToFileURL(req.resolve(id)));const {Client}=await load('@modelcontextprotocol/sdk/client/index.js'),{StdioClientTransport}=await load('@modelcontextprotocol/sdk/client/stdio.js');
const emit=x=>console.log(JSON.stringify(x));let hits=[];const http=createServer((req,res)=>{hits.push(req.url);res.setHeader('content-type','text/html');if(req.url==='/redirect'){res.writeHead(302,{location:'/forbidden'});res.end();}else res.end('<html><body><a href="/other">Other</a><form><input required name="record"><button>Search</button></form></body></html>');});await new Promise(r=>http.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+http.address().port;
const f=await provision();if(existsSync(join(f.root,'.qa/project/lifecycle.json')))unlinkSync(join(f.root,'.qa/project/lifecycle.json'));const composed=await loadHostComposition(f.env),bound=composed.options.knowledgeBindings[0],store=bound.store;const env=await store.get('app-host','environment','local');const trace={source:'audit_synthetic',recorded_by:'fixture',recorded_at:new Date().toISOString(),reason:'Controlled mechanics only, not genuine human consent',review:'unreviewed',evidence_refs:[]};await store.commit('app-host',[{kind:'environment',expected_revision:env.revision,entity:{...env.entity,base_url:origin,safe_domains:['127.0.0.1']},trace},{kind:'module',expected_revision:0,trace,entity:{id:'mod-b',application_id:'app-host',key:'module-b',title:'Module B fixture',certainty:'confirmed',criticality:'medium',dependencies:[],created_at:trace.recorded_at,updated_at:trace.recorded_at,is_active:true}}]);composed.close();
f.manifest.moduleBindings[0].environmentRevision=2;f.manifest.moduleBindings.push({...f.manifest.moduleBindings[0],plannedName:'module-b',moduleId:'mod-b',moduleKey:'module-b'});f.manifest.discoveryAuthorization={read_only_acknowledged:true,environmentRevision:2,navigation_urls:[origin+'/',origin+'/redirect'],allowed_ips:['127.0.0.1'],allow_public_network:false,limits:{max_pages:1,max_requests:5,max_depth:1}};writeFileSync(f.manifestPath,JSON.stringify(f.manifest));const inbox=join(f.root,'controlled-inbox.json');writeFileSync(inbox,'{}');
let client=new Client({name:'rescue-controlled-integrated-audit',version:'1'}),transport=new StdioClientTransport({command:process.execPath,args:[repo+'/packages/mcp/node_modules/.audit-rescate/program-host.mjs'],cwd:f.root,env:{...process.env,...f.env,AUDIT_INBOX:inbox},stderr:'pipe'});let stderr='';transport.stderr?.on('data',b=>stderr+=b);const call=async(name,args={})=>{const r=await client.callTool({name,arguments:{targetPath:f.root,...args}});let p;try{p=JSON.parse(r.content[0].text);}catch{throw Error(r.content[0].text);}emit({tool:name,action:args.canonical_interview?.action??args.canonical_closure?.action,status:p.status,code:p.code,error:p.error,reason:p.razon,message:p.message,phase:p.fase,coverage:p.coverage,association:p.association_status});return p;};
const approve=()=>{const {kind,request:r}=JSON.parse(readFileSync(inbox+'.request','utf8')),dec={requestDigest:r.requestDigest,approvalId:randomUUID(),decision:kind==='interview'?'confirm':'approve',reviewer:'CONTROLLED_FIXTURE_NOT_REAL_HUMAN',decidedAt:new Date(Date.now()-50).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),...(kind==='interview'?{presentedStatementDigest:r.statementDigest}:{})};const data=JSON.parse(readFileSync(inbox));data[r.requestDigest]=dec;writeFileSync(inbox,JSON.stringify(data));};
try{await client.connect(transport);assert.equal((await client.listTools()).tools.length,18);
assert.equal((await call('qap_init',{baseUrl:origin,projectName:'rescue-audit-disposable'})).status,'success');
assert.equal((await call('qap_context_set',{objective:'Consultar expediente sintético en entorno aislado',roles:[{name:'visitante'}],critical_flows:[{name:'Consultar catálogo sintético'}],source_of_truth:{type:'none',declared:true}})).status,'success');
assert.equal((await call('qap_session_plan',{modules:[{module:'host',path:'/',priority:'high'},{module:'module-b',path:'/b',priority:'low'}],auth:{required:false}})).status,'success');
const disc=await call('qap_discover',{name:'host',path:'/'});assert.equal(disc.association_status,'confirmed');assert.equal(disc.persistence,'committed');
const opened=await call('qap_rules_set',{module:'host',canonical_interview:{action:'next'}});assert.ok(opened.question);
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
for(const [i,category] of categories.entries()){const q=i===0?opened:(await call('qap_rules_set',{module:'host',canonical_interview:{action:'next'}}));assert.ok(q.question,'seven structural interview questions required');const id=q.question.id;assert.equal((await call('qap_rules_set',{module:'host',canonical_interview:{action:'propose',question_id:id,version:q.question.version,expected_revision:0,proposal:{title:'Consultar el expediente con garantía '+category,description:'El módulo permite consultar expedientes sintéticos y valida la política '+category,category,acceptance_criteria:['La consulta sintética responde según el contrato '+category]}}})).status,'pending_review');const args={module:'host',canonical_interview:{action:'review',question_id:id,version:q.question.version+1}};assert.equal((await call('qap_rules_set',args)).status,'blocked');approve();assert.equal((await call('qap_rules_set',args)).status,'confirmed');if(i===0){const gc=await loadHostComposition(f.env),gb=gc.options.knowledgeBindings[0],coverage=await new CanonicalCoverageService(gb.store,{projectRoot:gb.projectRoot,applicationId:gb.applicationId,environmentId:gb.environmentId,moduleBindings:gb.moduleBindings},gb.moduleClosureStore).evaluate('host');gc.close();const gap=coverage.assessment.gaps.find(g=>g.category==='performance'&&g.status==='unaddressed');assert.ok(gap);const cmd={action:'accept_gaps',accepted_gaps:[{gap_id:gap.id,reason:'Controlled fixture accepts the real initial performance specification gap'}]};assert.equal((await call('qap_module_close',{module:'host',canonical_closure:cmd})).code,'closure_review_pending');approve();assert.equal((await call('qap_module_close',{module:'host',canonical_closure:cmd})).status,'gaps_accepted');const again=await call('qap_module_close',{module:'host',canonical_closure:cmd});assert.equal(again.idempotent,true);emit({scenario:'actual-gap-accepted-and-replayed',gap:gap.id,idempotent:true});}}
const reviewClosure=async command=>{let r=await call('qap_module_close',{module:command.module??'host',canonical_closure:command.command??command});assert.equal(r.status,'blocked');assert.equal(r.code,'closure_review_pending');approve();return call('qap_module_close',{module:command.module??'host',canonical_closure:command.command??command});};
assert.equal((await reviewClosure({action:'declare_non_applicable',decisions:[{category:'performance',reason:'Controlled scope excludes performance assurance from this synthetic session'}]})).status,'declared_non_applicable');
assert.equal((await reviewClosure({action:'close'})).status,'closed');assert.equal((await reviewClosure({module:'module-b',command:{action:'waive',reason:'Controlled fixture independent waiver for module B without claiming human consent'}})).status,'waived');
const pendingHost=await loadHostComposition(f.env),pb=pendingHost.options.knowledgeBindings[0];await pb.store.commit('app-host',[{kind:'requirement',expected_revision:0,trace,entity:{id:'pending-after-closure',application_id:'app-host',module_key:'host',title:'Hipótesis pendiente posterior al cierre de fixture',description:'Dato pendiente que no representa aprobación ni resultado funcional',category:'functional',validation_status:'draft',provenance:'observed_telemetry',confidence:0.5,created_at:trace.recorded_at,is_active:true}}]);pendingHost.close();
const terminal=await call('qap_session_close');assert.equal(terminal.status,'success');assert.equal(terminal.fase,'WRAP_UP');const report=readFileSync(terminal.report_path,'utf8');assert.ok(report.includes('closed')&&report.includes('waived')&&report.includes('no certificada'));emit({scenario:'physical-report',path:terminal.report_path,canonical:terminal.cierre_canonico,containsTwoModules:report.includes('Módulo: host')&&report.includes('Módulo: module-b'),actualQapTestPerformed:false});writeFileSync('../rescate-evidence/integrated-report.md',report);
const before=await loadHostComposition(f.env);const snapshot=before.options.knowledgeBindings[0].moduleClosureStore.read(f.scope),requirements=await before.options.knowledgeBindings[0].store.query('app-host','requirement'),relations=await before.options.knowledgeBindings[0].store.query('app-host','relation');before.close();
const replan=await call('qap_session_plan',{modules:[{module:'host',path:'/',priority:'high'},{module:'module-b',path:'/b',priority:'low'}],auth:{required:false}});assert.equal(replan.status,'error');assert.ok(replan.error.includes('ya se encuentra cerrado'));emit({scenario:'replan-same-closed-module',status:replan.status,legitimateTerminalGuard:true});
await client.close();const updater=await loadHostComposition(f.env);await updater.options.knowledgeBindings[0].store.commit('app-host',[{kind:'module',expected_revision:0,trace,entity:{id:'mod-c',application_id:'app-host',key:'module-c',title:'New canonical module C fixture',certainty:'confirmed',criticality:'medium',dependencies:[],created_at:trace.recorded_at,updated_at:trace.recorded_at,is_active:true}}]);updater.close();f.manifest.moduleBindings.push({...f.manifest.moduleBindings[0],plannedName:'module-c',moduleId:'mod-c',moduleKey:'module-c'});writeFileSync(f.manifestPath,JSON.stringify(f.manifest));client=new Client({name:'rescue-new-session',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:[repo+'/packages/mcp/node_modules/.audit-rescate/program-host.mjs'],cwd:f.root,env:{...process.env,...f.env,AUDIT_INBOX:inbox},stderr:'pipe'}));const replanned=await call('qap_session_plan',{modules:[{module:'module-c',path:'/c',priority:'high'}],auth:{required:false}});assert.equal(replanned.status,'success');const after=await loadHostComposition(f.env);assert.deepEqual(after.options.knowledgeBindings[0].moduleClosureStore.read(f.scope),snapshot);assert.deepEqual(await after.options.knowledgeBindings[0].store.query('app-host','requirement'),requirements);assert.deepEqual(await after.options.knowledgeBindings[0].store.query('app-host','relation'),relations);after.close();emit({scenario:'new-session-replan',status:replanned.status,lifecycle:JSON.parse(readFileSync(join(f.root,'.qa/project/lifecycle.json'))),requirements:requirements.items.length,relations:relations.items.length,durableAuthorityAndHistoryUnchanged:true,humanGateCertified:false});
}finally{await client.close();http.closeAllConnections();await new Promise(r=>http.close(r));emit({scenario:'cleanup',httpHits:hits,stderr:stderr.slice(-500)});}




~~~
