# Autorizaciones de QAP con Antigravity

## Hallazgos

QAP tiene tres controles distintos:

- Antigravity decide si permite invocar cada herramienta MCP. Su documentación indica que las herramientas MCP no configuradas quedan en modo Ask y permite reglas `mcp(servidor/herramienta)` y `mcp(servidor/*)`. No se debe usar `mcp(*)` para resolver prompts de QAP.
- QAP valida raíces autorizadas, origen, entorno, perfil y consentimiento de login/Discovery/ejecución mediante su authorizer local de Windows. `qap_status`, `qap_auth_list` y `qap_session_plan` no llaman a `InteractiveAccess.consent`.
- El login de la aplicación usa perfiles, credenciales del proveedor seguro y sesiones verificadas; su estado no acredita por sí mismo aprobación de casos funcionales.

El transcript abierto de Antigravity registra las interacciones 19 y 20, pero no captura las ventanas de aprobación. El registro de diagnóstico QAP muestra concesiones y reutilizaciones históricas y un diálogo de login; no contiene un evento correlacionado de forma concluyente con cada prompt de esas interacciones. Por tanto, un prompt por invocación de `qap_status`, `qap_auth_list` o `qap_session_plan` sería de la política MCP de Antigravity; una ventana con detalles de origen/perfil sería del authorizer QAP. La atribución de cada prompt concreto queda pendiente de telemetría correlacionada en la aceptación física.

La documentación pública actual de Antigravity describe la política MCP por herramienta, pero no documenta soporte para `elicitation/create` ni una herramienta MCP del servidor para abrir preguntas nativas al usuario. Eso no demuestra que el cliente sea incompatible. No se añadió un adaptador a ciegas: la compatibilidad debe confirmarse observando las capacidades del cliente durante initialize y una prueba real de elicitation. QAP conserva el diálogo local de Windows como mecanismo confiable para consentimientos sensibles.

## Cambio implementado

El authorizer QAP ahora cifra con AES-256-GCM las concesiones QA persistentes en el directorio host `.qap/workspaces`, usando la clave local de persistencia existente y un archivo independiente de los proyectos. Cada registro contiene el workspace canónico, aplicación, entorno/revisión, origen/base URL, perfil, huella de configuración, operaciones aprobadas y fechas. Los datos autenticados se descartan ante corrupción; las concesiones vencidas, revocadas o con contexto/huella distinta no se reutilizan. La vigencia por defecto es cuatro horas y el máximo aceptado es 30 días.

La aprobación de `login` no aprueba Discovery ni `qap_test`. Discovery necesita su propia aprobación legible de solo lectura. La autorización de `qap_test` siempre es independiente y no se persiste; la autorización funcional de casos y requisitos continúa en su gateway de revisión independiente. No se agregaron argumentos MCP capaces de emitir concesiones. Los eventos de concesión, reutilización y revocación usan el registro local existente sin guardar secretos.

La interfaz de Windows todavía no ofrece una opción visible entre «solo esta vez» y «recordar durante el periodo». Las aprobaciones de login/Discovery se recuerdan por el TTL configurado; `qap_test` es por llamada. Esta elección explícita de duración sigue pendiente.

El archivo cifrado se protege con la clave host ya existente. En esta instalación, `host-session.key` hereda una ACL NTFS que otorga control total a la cuenta actual, SYSTEM y Administrators. AES-GCM detecta manipulación y cifra el registro; una cuenta con control del directorio puede leer la clave y el archivo. Este mecanismo no es DPAPI ni Windows Credential Manager. Las credenciales de aplicación siguen en el proveedor seguro existente.

## Verificación y aceptación

Verificados en checkout local: build `@qap/mcp`; tests focales de alcance por operación y recuperación/revocación tras reiniciar el objeto host. La ejecución completa de `interactive-access.test.ts` conserva un fallo en el caso de login de navegador (`post_login_verification_failed`); requiere determinar si es fallo ambiental preexistente o regresión antes de publicar.

Antigravity ofrece allowlist por herramienta para no pedir aprobación de invocación repetidamente. Una política razonable para revisión del operador es permitir únicamente herramientas de lectura sin efectos externos, como `qap_status`, `qap_auth_list` y `qap_report`, usando `mcp(qap-vnext/herramienta)`. No permitir en bloque `qap_auth_add`, `qap_discover`, `qap_plan`, `qap_test` ni `mcp(qap-vnext/*)`; esas herramientas contienen operaciones sensibles o de escritura.

La aceptación limpia aún no se inició. Antes de empezar se debe copiar la bitácora actual completa (20 interacciones) a un archivo fechado, crear una bitácora nueva numerada desde 1 y usar un workspace aislado vacío; no ejecutar `qap_clean` sobre el workspace anterior. La ruta `C:/Users/Judirico/Documents/lendus-qap` está fuera del checkout autorizado para escritura en este entorno, por lo que no se archivó ni reemplazó aquí. El workspace aislado también requiere autorización legítima inicial.

Prompt breve para Gemini 3.8 Flash Low:

> Desde Antigravity valida físicamente la aceptación QAP en el workspace aislado nuevo. Empieza con «Quiero probar Lendus CORE». No uses ni limpies el workspace anterior; documenta desde Interacción 1 en la bitácora nueva y conserva cualquier rechazo o bloqueo. Comprueba consentimiento, reutilización tras nuevo chat y reinicio MCP, expiración/revocación y aislamiento por proyecto, perfil, origen y entorno. Usa únicamente staging y operaciones de lectura; no apruebes requisitos ni casos, no ejecutes escrituras y no declares PASS sin evidencia real. Confirma si Antigravity presenta approvals MCP por invocación y si soporta `elicitation/create`; distingue esas decisiones de las ventanas de autorización QAP. No introduzcas secretos en el chat.
