# DEV-MVP-02 — Uso funcional desde un cliente MCP

Fecha: 2026-11-09 (America/Mexico_City). Base: `7a3d6dd6c189feb85d8097792ef1f0c2915e5c65`.

Esta guía documenta la composición histórica de host privado que usó el ensayo. Para instalar el candidato actualizado con 20 herramientas, comenzar por la [guía de continuidad](../CONTINUIDAD_MVP.md). Las llamadas operativas siguientes corresponden al SHA indicado.

Este flujo utiliza las 18 herramientas existentes sobre MCP Stdio. Se extienden de forma aditiva los argumentos de `qap_auth_add` y `qap_plan`; no se cambia el transporte ni se incorpora una interfaz web. Los ejemplos son plantillas, no instrucciones ya autorizadas para Lendus.

## Preparación administrativa del host

El usuario debe proporcionar antes de navegar: URL exacta de staging; aplicación y entorno; módulos y rutas dentro del alcance; roles y perfiles nominales; cuenta de pruebas y método de acceso autorizado; marcador verificable de sesión; URLs GET permitidas para discovery e IPs/red pública autorizadas; orígenes permitidos para ejecutar; operaciones permitidas, datos de prueba y reglas de negocio con resultados esperados. También debe designar al revisor y la ubicación privada del host con ACL y retención de sus claves y respaldos.

Nunca se deducen credenciales, permisos, categorías no aplicables ni reglas desde el DOM. No se ha accedido a Lendus en esta entrega.

Requiere Node con `node:sqlite` (validado con 24.15.0), dependencias y navegador Chromium compatibles. Desde la raíz del repositorio, en un checkout normal:

```powershell
pnpm install
pnpm build
```

Para dependencias ya instaladas, el arnés `node scripts/dev-mvp02-build.mjs` ejecuta los scripts `tsup` exactos de los diez paquetes en orden. Fue el build verificado en este worktree: el wrapper pnpm 12 intentó reinstalar los enlaces locales y falló; no se alteraron lockfiles.

Crear una carpeta de proyecto y otra carpeta privada del host fuera del proyecto. El proceso MCP necesita lectura/escritura en ambas; la clave y las decisiones no deben entregarse como argumentos de herramientas ni almacenarse en Git. En Windows `mode: 0600` no configura una ACL: el operador configura la ACL antes de atestiguarla.

Guardar un archivo de configuración administrativo, sustituyendo **todos** los marcadores con información confirmada:

```json
{
  "protection": "host_private_directory_and_managed_key",
  "projectRoot": "<RUTA_ABSOLUTA_CANONICA_PROYECTO>",
  "applicationId": "<ID_APLICACION>",
  "applicationName": "<NOMBRE_APLICACION>",
  "environmentId": "<ID_ENTORNO>",
  "environmentName": "<NOMBRE_ENTORNO>",
  "baseUrl": "<URL_BASE_CONFIRMADA>",
  "safeDomains": ["<HOST_CONFIRMADO>"],
  "modules": [{
    "plannedName": "<MODULO>", "moduleId": "<ID_CANONICO>",
    "moduleKey": "<CLAVE_CANONICA>", "title": "<TITULO>", "criticality": "medium"
  }],
  "discoveryAuthorization": {
    "read_only_acknowledged": true,
    "navigation_urls": ["<URL_GET_EXACTA_AUTORIZADA>"],
    "authorizedProfiles": ["<PERFIL_AUTORIZADO>"],
    "allow_public_network": true
  },
  "testAuthorization": {
    "allowedOrigins": ["<ORIGEN_HTTP_O_HTTPS_EXACTO>"],
    "authorizedProfiles": ["<PERFIL_AUTORIZADO>"]
  }
}
```

`allow_public_network: true` solo corresponde si se autoriza esa red. Para una red privada, usar `allowed_ips` explícitas; ninguna opción sustituye la lista exacta de URLs. El consentimiento de discovery reconoce que un GET puede producir efectos en servidor. `criticality` se ajusta al alcance declarado.

```powershell
node scripts/qap-provision-host.mjs C:/ruta/settings.json C:/ruta/host-privado
```

El comando no navega ni aprueba requisitos. Provisiona Knowledge, borradores y cierre SQLite; genera claves aleatorias, un buzón firmado de revisión y `client-config.json`. Rechaza sobrescribir un host existente. Los módulos se registran como identidades declaradas por el host, no como reglas de negocio aprobadas. Para reutilizar conocimiento previo, conservar el host existente y su manifiesto; no volver a provisionarlo ni sustituir su SQLite.

Importar el contenido de `client-config.json` en un cliente compatible con MCP Stdio. Contiene rutas absolutas y variables de entorno privadas: `QAP_MCP_HOST_CONFIG_PATH`, claves de revisión/borradores/cierre y `QAP_SESSION_KEY`. Esta última permite recuperar sesiones cifradas tras reiniciar. El archivo y `secrets.json` son secretos. Reiniciar el cliente y comprobar `tools/list`: 18 herramientas, incluidos `qap_plan`, `qap_test` y `qap_report`.

## Una sesión dirigida por un QA

Cada llamada incluye `targetPath` absoluto. El agente presenta una pregunta cada vez y sigue `siguiente_accion`; un `blocked` se resuelve por la capacidad indicada, sin forzar estados.

1. `qap_status` y `qap_init` cuando corresponda.
2. `qap_context_set`: objetivo, roles, flujos críticos, fuente de verdad y URL confirmada. Confirmar el resumen con `confirmar_resumen: "confirmo_todo"`.
3. `qap_session_plan`: módulos y decisión explícita `auth`. Ejemplo del cuerpo de autenticación: `{"required":true,"source":"user","roles":["<ROL>"],"profile":"<PERFIL>"}`. Es normal permanecer bloqueado en SCOPING hasta verificar los perfiles.
4. `qap_auth_add`: perfil, entorno, rol, `method: "handoff"`, ruta de login y `post_login_condition: {"type":"selector_present","value":"<SELECTOR_DE_SESION_CONFIRMADO>"}`. El QA completa el acceso en el navegador existente. El timeout puede configurarse hasta 120000 ms. No proporcionar contraseñas de producción por chat. `storageState` existe para sesiones explícitamente aprobadas; el fixture técnico obtiene el suyo de un login HTTP real mediante Playwright.
5. `qap_discover`: `name`, `path` y `profile` explícito. El host debe haber autorizado el perfil y cada URL. La captura conserva procedencia `auth_profile_id`, entorno y evidencia; no persiste cookies en Knowledge ni acredita requisitos. `acquisition_persistence` y `association_status` describen operaciones distintas.
6. `qap_rules_set` con `module` y `canonical_interview: {"action":"next"}`. Devuelve pregunta, evidencia y versión. Las observaciones motivan preguntas; las identidades de campos y acciones todavía requieren especificación humana.
7. Responder mediante `canonical_interview` con `action: "propose"`, `question_id`, `version`, `expected_revision` y `proposal` con título, descripción sustantiva, categoría y `acceptance_criteria` explícitos. No usar `confirmed` para promover hipótesis DOM.
8. Solicitar `action: "review"` con pregunta y versión. Si devuelve `human_review_not_authorized`, presentar al revisor el `review_request_digest`. La propuesta permanece pendiente hasta la decisión independiente del host.

### Revisión independiente

El operador, fuera de los argumentos MCP, ejecuta:

```powershell
node scripts/qap-host-review.mjs C:/ruta/host-privado/reviews <review_request_digest> C:/ruta/host-privado/secrets.json
```

El CLI muestra la solicitud completa: texto/categoría/criterios para requisitos, pasos y reglas para casos, o cobertura/motivos para cierre. Solicita identidad, decisión explícita y transcripción del digest presentado. No hay opción de aprobar por `user_confirmed`, `source`, un booleano JSON o una respuesta técnica PASS. Las decisiones se firman con HMAC del host, son válidas diez minutos para su consumo y no se reutilizan para otro snapshot. Repetir la operación MCP pendiente dentro de ese plazo. Un recibo de aprobación de casos consumido conserva validez tras reiniciar mientras el contenido y el contexto sigan vigentes; una decisión posterior de rechazo lo revoca.

El host es la frontera de confianza. El buzón no protege frente a un proceso con acceso a la clave del host. Configurar cuentas/ACL separadas cuando se necesite esa separación; no dar al agente de aplicación control de los secretos del revisor.

### Casos, aprobación y ejecución

`qap_plan` conserva su planificación normal y añade `case_workflow`:

```json
{"targetPath":"<PROYECTO>","module":"<MODULO>","case_workflow":{"action":"generate"}}
```

Devuelve requisitos acreditados que necesitan un oráculo ejecutable en `blocked_cases`. La generación es asistida: no inventa selectores ni convierte criterios en acciones automáticamente. El QA/agente propone pasos explícitos; el host revisa después el conjunto exacto:

```json
{
  "targetPath":"<PROYECTO>","module":"<MODULO>",
  "case_workflow":{"action":"generate","proposals":[{
    "requirement_id":"<ID_REQUISITO_CONFIRMADO>","expected_revision":1,
    "name":"<NOMBRE_CASO>","steps":[
      {"type":"navigate","url":"<URL_AUTORIZADA>"},
      {"type":"assert","selector":"<SELECTOR_CONFIRMADO>","assertion_type":"equals","expected":"<RESULTADO_ESPERADO_CONFIRMADO>"}
    ]
  }]}
}
```

La operación usa `CaseGenerator`, valida `TCCase`, conserva UUID y `source_rule_id` y guarda YAML `TC-<uuid>.yaml`. Una repetición idéntica es idempotente; una colisión con un archivo editado se bloquea con `case_edit_preserved`. No se ejecuta el fallback genérico de `CaseGenerator` para fabricar un oráculo. BVA/RBAC conservan sus generadores y compuertas certificados.

Solicitar `qap_plan` con `case_workflow: {"action":"review"}`. Revisar casos y reglas en el CLI, aprobar o rechazar explícitamente y repetir. La aprobación vincula los pasos completos, las revisiones de reglas, el módulo, el entorno y el contexto de sesión. Se aplica a todos los casos del módulo canónico: eliminar tags o editar un YAML no evita la compuerta.

Después usar `qap_plan` con módulo/entorno, sin `case_workflow`, y `qap_test` con módulo/entorno/perfil aprobado. El plan guarda huella y orden DAG; `qap_test` verifica el snapshot, la identidad y la aprobación antes de llamar al Runner real. Una sesión expirada se renueva mediante `qap_auth_add`; no se cambia a identidad anónima implícitamente.

`qap_report` con `executionId` y `format: "all"` genera HTML, Markdown, JUnit y JSON. La ejecución queda en `.qa/executions/<id>.json`; `<id>.trace.json` relaciona aprobación, regla/revisión, casos y ejecución. `traceability_file` devuelve esa ruta. Los resultados y pasos apuntan a las capturas físicas; el historial del módulo se conserva. Después de reiniciar se puede consultar el mismo `executionId`.

### Revisión y cierre

Consultar `qap_module_close` con `canonical_closure: {"action":"evaluate"}`. El esquema histórico también pide `module`, `action: "close"` y `user_confirmed: true`; esos campos no sustituyen al gateway canónico. Revisar las brechas y su aplicabilidad real. `declare_non_applicable` o `accept_gaps` requieren motivos y autorización independiente; no se excluyen categorías para conseguir un cierre verde.

Solicitar `canonical_closure: {"action":"close"}` y aprobar la solicitud exacta en el CLI. Solo entonces se persiste/projecta el estado canónico. Finalmente `qap_session_close` genera el reporte de sesión y pasa a WRAP_UP. Un PASS técnico no acepta el producto; un cierre de especificación tampoco convierte resultados de ejecución en conformidad humana.

## Límites y primera sesión con Lendus

Discovery autenticado es una captura **estática con cookies**, sin ejecutar JavaScript ni consumir tokens de localStorage. `script_session_not_supported` bloquea ese último caso. Una SPA puede dar cobertura parcial; si el marcador solo aparece tras hidratar, no se acreditará como sesión estática válida. La compatibilidad de Lendus con este modo sigue sin comprobarse y es un bloqueo para cualquier tramo que lo requiera. No se certifica soporte de cualquier SSO/SPA.

La reportería del Runner conserva resultados y evidencia física; no se añadió la indexación automática `RunRecord` del visor SQLite v3. La cobertura canónica de cierre continúa separada de la conformidad de ejecución.

Para empezar con Lendus, el usuario proporciona el contexto y permisos enumerados al inicio y una tarea acotada de QA. Se provisiona/configura el host con esos datos; el usuario inicia sesión, revisa hallazgos y confirma reglas y resultados esperados, revisa los casos y autoriza la ejecución. Después recibe reportes/evidencias y decide la aceptación y el cierre. Si staging necesita un modo de discovery no soportado, se registra ese bloqueo antes de proceder. Esta entrega no ejecuta ninguno de esos pasos sobre Lendus.
