# DEV-MVP-02 — Flujo funcional del MVP

Base exacta: `7a3d6dd6c189feb85d8097792ef1f0c2915e5c65`. Informe de partida leído: `docs/vnext/integracion/INT-03_R5_ESTABILIZACION_2026-11-09.md`. Implementación iniciada el 9 y validada en la continuación del 10 de noviembre de 2026, America/Mexico_City. El SHA de entrega es el commit que contiene este informe: `git rev-parse HEAD`.

**Resultado: recorrido técnico funcional acreditado para una aplicación protegida compatible con captura estática de cookies. No se declara GO integral del MVP ni aceptación humana o aceptación de Lendus.**

## Entrega funcional

| Tramo | Implementación y frontera de autoridad |
|---|---|
| Auth → discovery | `qap_auth_add` conserva aplicación/entorno y permite un marcador explícito `selector_present`, verificado físicamente. El handoff existente abre navegador visible, con timeout configurable hasta dos minutos. `qap_discover` restaura `SessionStore` solo para perfiles nominales autorizados por el host. |
| Adquisición autenticada | Modo explícito `fresh_authenticated_static`. Cookies filtradas por dominio/ruta/expiración/HTTPS; GETs exactos, DNS/IP y redirects conservan las protecciones existentes. El navegador sigue aislado, sin JavaScript y sin transporte HTTP directo a la aplicación. Se revalida el marcador y se registra `auth_profile_id` en evidencia/observación. No se persisten cookies en Knowledge. |
| Discovery → entrevista | El puente acepta procedencia autenticada coherente con su evidencia, conserva las revisiones canónicas y asocia observaciones al módulo. Se utiliza la entrevista canónica existente mediante `qap_rules_set.canonical_interview`; no se fabrican vistas legacy ni se promueve planned → observed. |
| Confirmación | `HostReviewQueue` implementa los gateways existentes de entrevista y cierre. Una solicitud firmada por el host se presenta mediante `scripts/qap-host-review.mjs`; decisión explícita, identidad y digest exacto. Los argumentos MCP no conceden autoridad. Los borradores y cierres siguen usando los SQLite canónicos existentes. |
| Casos | `qap_plan.case_workflow` añade `generate` y `review` al tool existente. Reutiliza `CaseGenerator` y `SchemaValidator`, lee requisitos confirmados con revisión esperada, identifica oráculos faltantes y conserva `source_rule_id`. La generación es asistida por propuestas explícitas de pasos/selector/resultado; no traduce texto de negocio en acciones inventadas. |
| Persistencia y edición | Identidad UUID, archivos `TC-<uuid>.yaml`, lectura por UUID o nombre de archivo con la API pública de almacenamiento. Generación repetida idéntica e idempotente; colisiones con contenido editado o archivo preexistente por UUID se bloquean. |
| Aprobación y ejecución | Un recibo HMAC durable vincula contenido completo de los casos, requisitos/revisiones y contexto de módulo/entorno/sesión. `qap_test` exige ese recibo para todos los casos de un proyecto canónico, además del plan vigente y de la identidad autorizada. Quitar tags no evita la compuerta. Cambiar el contenido o contexto invalida la aprobación. |
| Runner/reportes | Se conserva Runner real, snapshot de casos, capturas, resultados, historial y cuatro formatos de reporte. `<execution_id>.trace.json` vincula regla/revisión, caso, aprobación y ejecución; los resultados relacionan pasos y evidencia. `qap_report.traceability_file` devuelve el archivo de trazabilidad. Un fallo de persistencia de esa relación se declara parcial y no provoca reejecución implícita. |
| Cierre y recuperación | Los comandos `canonical_closure` existentes exigen evaluación, decisiones independientes sobre aplicabilidad/brechas y cierre aprobado. `qap_session_close` termina en WRAP_UP. Reabrir el proceso recupera reportes, contexto y cierre durable. Un PASS técnico no genera aceptación ni `ConformityAssessment.pass`. |

No hay herramientas MCP nuevas: siguen siendo 18. Se añadieron argumentos opcionales a dos esquemas y metadatos de respuesta. Se mantienen Stdio, contratos de Knowledge, tipos de requisitos y estados del ciclo canónico. La revisión por terminal es un adaptador administrativo de los gateways existentes, sin interfaz web nueva.

## Evidencia vertical reproducible

```powershell
node scripts/dev-mvp02-build.mjs
node scripts/dev-mvp02-vertical.mjs (Get-Location).Path C:/ruta/absoluta/nueva/evidencia
```

El directorio de evidencia debe ser nuevo. El build usa los scripts reales `tsup` de cada paquete con las dependencias instaladas. El wrapper de pnpm 12 intentó reinstalar los enlaces locales y falló; no se modificaron lockfiles ni se descargaron paquetes. Todos los paquetes se compilaron en este worktree, incluidos sus DTS cuando el script de paquete los genera.

La corrida de entrega usa `Client` y `StdioClientTransport` del SDK instalado y ejecuta `packages/mcp/dist/server.js`. Levanta una aplicación HTTP loopback que exige una cookie emitida por un login real a través de un contexto Playwright. No sustituye Runner, crawler, persistencia, reporter ni herramientas por mocks. La provisión de identidades y las decisiones del operador son datos controlados del fixture; no se presentan como credenciales reales o consentimiento humano.

Secuencia observada y conservada en `evidencia/DEV-MVP-02/transcript.json` y en el arnés:

1. Inicio MCP y catálogo real de 18 tools.
2. Inicialización/contexto/plan autenticado; SCOPING se mantiene hasta verificar el perfil con `qap_auth_add`.
3. Perfil no autorizado rechazado; perfil verificado adquiere la zona protegida y asocia observaciones persistidas.
4. Pregunta canónica y propuesta sustantiva de regla con criterio esperado.
5. Revisión inicialmente bloqueada; el CLI real de revisión se ejecuta en otro proceso y consume una decisión del **operador técnico controlado**, marcada `NOT-human-acceptance`; después se confirma el requisito mediante la herramienta canónica.
6. Generación sin oráculo enumera el caso bloqueado; con propuestas explícitas produce dos YAML mediante `CaseGenerator`. Una repetición conserva IDs.
7. Ejecución sin aprobación bloqueada. El host revisa y consume la aprobación exacta. Editar un caso impide regenerarlo encima e invalida la aprobación, incluso tras volver a planificar.
8. Restauración del contenido original, reinicio MCP y ejecución física con el recibo recuperado: dos casos, uno PASS y un FAIL deliberado, cero not_run. Se conserva físicamente la captura del fallo. El Runner actual no incorpora al resultado los pasos exitosos ni la captura solicitada por el caso correcto; no se acredita esa relación como persistida.
9. `qap_report(format=all)` produce HTML, Markdown, JUnit y JSON. La relación de regla/caso/aprobación/ejecución se conserva en el sidecar.
10. Revocación remota de sesión comprobada con HTTP real: discovery queda bloqueado y dirige al QA a revisar permisos/renovar mediante qap_auth_add. Reinicio y recuperación de reportes por executionId, con `evidence_source=persisted_execution`.
11. Cierre de sesión inicialmente bloqueado; evaluación canónica, declaración revisada de seis categorías fuera del alcance **exclusivamente del fixture**, y revisión independiente del cierre. El módulo queda closed y la sesión WRAP_UP. El FAIL intencional continúa como FAIL en la ejecución y los reportes.
12. Otro reinicio recupera historial, reportes y estado WRAP_UP. Se conservan capturas y registro físico de ejecución.

La autorización de cierre evalúa especificación/revisión. No acredita haber probado requisitos que el evaluador canónico todavía clasifica `not_executed`, ni convierte el fixture en aceptación humana. Para una persona real el mismo CLI espera sus respuestas en terminal; en la demostración son entradas explícitas del operador de prueba automatizado.

## Verificación y regresiones

| Comprobación | Resultado |
|---|---|
| Build de los diez paquetes por sus scripts reales | PASS; `dev-mvp02-build-delivery.log` |
| MCP completo | 506 PASS / los mismos 12 FAIL heredados, 518 pruebas, 31 archivos |
| Regresiones focales finales de PlanHandler, TestHandler y revisión | 58/58 |
| Adapter completo, incluidas dos regresiones autenticadas con Chromium | 167/167 |
| Almacenamiento, incluido UUID ↔ TC-* | 36/36 |
| Provisión administrativa independiente | PASS, sin navegación |
| MCP typecheck | 116 diagnósticos; no se certifica como verde ni se excluyen pruebas. Los archivos nuevos del flujo no agregan diagnósticos. |
| Adapter typecheck | Tres diagnósticos en tests existentes (rootDir y contextos incompletos); producto compila. |
| Lint de archivos TypeScript modificados | Cero errores y cero advertencias; log final conservado. |
| Prueba vertical Stdio compilada | PASS técnico, con resultado funcional mixto deliberado y evidencia física |

Los cuatro archivos que contienen los doce fallos heredados no fueron modificados: `p4-4-auth-lifecycle.test.ts`, `p4-5a2-integrity.test.ts`, `p4-5a-integrity.test.ts` y `server.test.ts`. Los cambios de expectativas se limitan a esquemas extendidos/diagnósticos canónicos y a que un YAML sin regla/aprobación ya no puede ejecutar en un proyecto canónico. No se borraron los fallos históricos ni se reescribieron sus aserciones para ponerlos en verde.

No se modificaron generadores BVA/RBAC, su bloqueo de ejecución ni `admin-user.json`; no se reabrió su auditoría R4. El worktree R5 se comprobó sin cambios. Se trabajó en `C:/Users/Judirico/.codex/worktrees/dev-mvp-02/QAMCP`, separado de R4/R5. No hubo push ni merge oficial.

## Bloqueos y alcance pendiente

| Clase | Estado real |
|---|---|
| Compatibilidad crítica por aplicación | Discovery autenticado admite cookies y DOM estático. Sesiones que requieren localStorage se bloquean; SPA/SSO dependientes de JavaScript pueden no aportar un marcador estático válido. La compatibilidad de Lendus está pendiente y sería bloqueante si necesita ese modo. No se afirma discovery universal. |
| Aceptación humana | Pendiente. El recorrido técnico del gateway está probado con decisiones de fixture. El usuario aún debe revisar y aprobar sus reglas/casos/cierre reales. |
| Mapeo ejecutable | La generación exige pasos y oráculos explícitos revisables. No se añadió inferencia automática de selectores/oráculos ni se libera BVA/RBAC bloqueado. |
| Deuda heredada | Persisten los doce FAIL MCP descritos en R5 y los diagnósticos históricos. Las capacidades P0 nuevas se acreditan por el recorrido autorizado actual, sin restaurar escrituras legacy ni relajar scope para satisfacer esos tests. |
| Reporter v3 / visor SQLite | Sigue pendiente el puente automático a `RunRecord` e índice del visor. Los reportes filesystem y su recuperación funcionan. Si el visor se exige para aceptación, ese puente sigue siendo bloqueo de ese requisito. |
| Operación del host | El operador debe configurar ACL, claves y revisor independiente. El HMAC protege frente a edición sin clave, no frente a quien controla el host o sus secretos. No hay aprobación por defecto. |

## Inicio de Lendus

La guía ejecutable de configuración, provisión, registro del cliente y llamadas reales está en `../uso/DEV-MVP-02_CLIENTE_MCP.md`. Incluye exactamente qué debe aportar el usuario, sin asumir URL, credenciales ni permisos. `scripts/qap-provision-host.mjs` prepara un host nuevo y rechaza sobrescribir conocimiento previo; `scripts/qap-host-review.mjs` permite revisión humana concreta.

No se ejecutó ninguna acción sobre Lendus. La aptitud de este alcance para su primera sesión depende de confirmar el contexto y la compatibilidad de autenticación/discovery; no se garantiza por las suites técnicas ni por la fecha objetivo del 16 de noviembre.

## Archivos de evidencia

`evidencia/DEV-MVP-02/` contiene catálogo, transcripción, resultado, solicitudes presentadas por el CLI, ejecución, trazabilidad, capturas PNG, cuatro reportes, historial, reporte canónico de cierre y logs de verificación. `physical-artifacts.json` apunta al fixture físico íntegro y `SHA256SUMS.json` permite comprobar las copias versionadas. No se incluyen claves del host ni cookies de sesión.
