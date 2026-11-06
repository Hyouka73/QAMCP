# Contratos vigentes y equivalencia del Lote 1

## Reconciliación R3 — diferencias contractuales explícitas

**Verificación:** R3 es implementación y diseño de aserciones, no evidencia física nueva. El único resultado independiente posterior a R1 es R2 (24/24 en `92579eb`). No se transfieren PASS a R3.

| Identidad | Contrato antiguo | Contrato canónico y comprobación R3 | Resto / equivalencia |
| --- | --- | --- | --- |
| TM-34 | Bloqueo por diferencia literal de categoría pregunta/requisito | `canonical_interview` permite categoría formal explícita distinta de la categoría didáctica, pero no escribe sin host; rechaza ID/módulo/categoría inválida. | B: autoridad preservada, literal antiguo incompatible. Sin PASS R3. |
| TM-35/38 | Borrador `user_text`, regla `user_confirmed` y cobertura | Snapshot de propuesta `pending_review` y restore SQLite; Knowledge guarda requisito `developer_interview` confirmado, recibo independiente y categorías no aplicables revisadas; `specification_coverage=complete` no implica `execution_coverage` ejecutada. | B: no se crea `rules.yaml`; R3 no físico. |
| TM-41..43 | Campo `extraccion_vacia` para página sin controles | `DiscoveryHandler` presenta `counts.controls/forms/views`, `limitations`, `next_safe_action` y observaciones; HTML pasivo válido puede tener cero controles pero extracción `completed` y evidencia útil. | B parcial: aviso literal no contractual, si se exigiera requiere decisión explícita. |
| TM-44 | Nombre acentuado → slug y archivos `pending_questions` | R3 prueba nombre humano `Operación`, clave canónica `operacion`, plan/ruta/binding autorizados, draft, requisito revisado y recuperación tras restart; conserva negativo fuera del plan. | B parcial: el directorio legacy fue sustituido por SQLite canónico; positivo R3 sin PASS físico. |
| TM-48 | `module-view.schema.json` rechaza contexto inválido | Se valida identidad y autorización por separado: binding/revisión canónicos, allowlist de URL exacta, fase/módulo y prohibición de argumentos de credenciales; R3 prueba negativos y cero escrituras. | B parcial: faltan negativos de revisión Environment obsoleta y otros contextos host incompatibles. |
| TM-46 | `qap_plan`/`qap_test` devuelven `en_desarrollo` | Implementaciones existentes: generación DAG de casos, fingerprint y `plan.json`, preflight de integridad, ejecución Playwright autorizada, evidencia persistida. Test R3 incluye éxito y plan obsoleto. | B: positivo ejecutable, NO PASS físico ni E2E completo del host. |
| TM-52 | Discovery promueve `planned→observed` | Discovery conserva lifecycle y agrega observaciones/relaciones revisables; compuertas de fase, módulo y URL no se degradan. | B: transición automática retirada por seguridad. |
| TM-53 | Legacy sin contexto de negocio deriva WORKING y permite Discovery | Lectura `qap_status` derivada se conserva sin modificar legado; una identidad legacy no da por sí misma autorización de adquisición o binding canónico. | A+B parcial; validar readback y bloqueo R3. |
| TM-54 | Onboarding → SCOPING → WORKING → Discovery con `entrevista_vista` | `qap_init`, `qap_context_ingest`, `qap_context_set`, `qap_session_plan`, `qap_discover` real; la entrevista canónica es separada. | B: fases reales sin aprobación implícita. |
| TM-55 | `qap_rules_set` guarda reglas YAML y transiciona observed/interviewing | `canonical_interview` + gateway host + requisito SQLite + cobertura/aplicabilidad + cierre aprobado. Lifecycle cambia solo por acciones explícitas de cierre. | B: revisión independiente, no reglas inferidas. |
| TM-50 | `session_saved` con login autenticado | Modo `fresh_anonymous_static` nunca carga `storageState` del cliente; `authentication_not_supported` es rechazo, no login exitoso. | C: positivo ausente; no se elimina el test legacy. |

Las once identidades de autenticación están clasificadas individualmente en `PENDIENTES.md` (TM-13..19, TM-27, TM-30..32). A/B son garantías o sustituciones parciales, no certificados de login. C requiere decisión de producto y contrato host; no se construye navegador autenticado indirectamente por tests. TM-23 conserva negativo seguro sin fingir sus campos `auth_required/session_invalid/razon/directorio_objetivo` retirados. Las cuatro acciones visibles de la pregunta canónica son `propose`, `correct`, `defer` y `review`; `next`/`resume` son comandos, no opciones de la pregunta.


Intervención autorizada por el responsable el 2026-11-06. Base remota y local comprobada: `794dc0d2fe1fb85dd1f9fb0c211b9b35346ac747`, rama única `feat/qap-vnext-architecture`. Esta autorización permite sustituir representaciones legacy demostrablemente reemplazadas; no autoriza suprimir garantías ni certificar VNEXT-014 con gateways sintéticos.

## Fuentes contrastadas

- `AGENTS.md`, `docs/vnext/STATE.md`, backlog/WBS 04 y microtareas/compuertas 08.
- `VNEXT-014-CIERRE-CONTROLADO/{RESULTADOS_RESCATE,MATRIZ_63_RESCATE,RECONCILIACION_HISTORICA}.md` y `auditorias/VNEXT-014-CIERRE-CODEX/MATRIZ_63.md`. Se mantienen intactos.
- `packages/mcp/src/handlers/{discovery.handler,module-observation-bridge,canonical-interview-service,canonical-coverage-service,canonical-closure-service,status.handler,canonical-session-report}.ts` y enrutamiento `server.ts`.
- Pruebas canónicas existentes: `discovery-handler.test.ts`, `canonical-interview.test.ts`, `canonical-coverage.test.ts`. La composición nueva reutiliza sus puertos oficiales y SQLite físico; no crea un pipeline alternativo.

## Separación de autoridad

Discovery exige Application/Environment persistidos, revisiones vigentes, binding inequívoco declarado por el host, consentimiento de navegación exacto e IP autorizada. Su aislamiento es `fresh_anonymous_static`. La adquisición persiste observaciones/evidencias; la asociación persiste relaciones. Ninguna crea requisitos confirmados ni modifica automáticamente el lifecycle legacy.

La entrevista usa `canonical_interview`: `next`, `propose`, `correct`, `review`, `defer`, `resume`. El texto libre produce un borrador cifrado. Una bandeja independiente del host debe autorizar el digest exacto presentado para persistir un requisito `confirmed` y su recibo. `source=user`, `status=confirmed`, categorías legacy y `user_confirmed=true` enviados por MCP no sustituyen esa autoridad.

El cierre usa `canonical_closure`: evaluación, aplicabilidad, aceptación de brechas, cierre o waiver. Requiere cobertura vigente, gateway separado y decisiones durables correlacionadas; el test comprueba el estado físico y recibos, no solamente `status`. La especificación completa no implica ejecución de pruebas. Las categorías formales son `functional`, `business_rule`, `security`, `ui`, `ux`, `regression`, `performance`; las categorías de entrevista son preguntas y sugerencias, sin mapeo automático de autoridad.

## Acta de sustitución de representaciones lifecycle

| Histórico | Contrato canónico comprobado | Garantía preservada y evidencia ejecutable |
| --- | --- | --- |
| E0a: `entrevista_vista`, `view=default`, misma `pregunta`/`cobertura` embebida | Status recomienda `trabajo/qap_rules_set` con `canonical_interview.next`; el servicio devuelve la pregunta vigente. La cobertura está en `canonical_closure.evaluate`. | E0a ejecuta Discovery real, confirma un requisito mediante host, abre actor, sigue la guía y compara pregunta íntegra y digest; status no altera autoridad, lifecycle ni solicita aprobación. No se inventa una vista nominal ausente del modelo agregado. |
| E1: re-discover agrega hipótesis YAML y fuerza `consolidated→interviewing` con historial | La observación no modifica el conocimiento normativo. Una corrección revisada del requisito cambia su revisión/digest; si faltan criterios, vuelve a bloquearse el cierre. | E1 conserva requisitos e historial ante re-discovery; después revisa una corrección real, comprueba revisión 2 y brecha física, bloqueo y reanudación. Dos tests E1 adicionales comprueban categorías/motivos y que una aprobación de cierre del digest anterior no sirve. |
| E1: `proposito` irrenunciable y `category_waivers` del cliente | `proposito` es una categoría de pregunta, inválida como categoría formal de aplicabilidad; una declaración formal requiere motivo sustantivo y host independiente. | Negativo focal rechaza categoría legacy, razón corta y autoridad inexistente; compara snapshot durable/lifecycle sin escritura. No se declara equivalencia por traducción mecánica de categorías. |
| E2: `consolidated` + booleano cierran; repetir terminal devuelve bloqueo | El gateway autoriza cobertura y cierre canónicos; repetir terminal devuelve la decisión original idempotente. | E2 conserva desconocido, autoridad insuficiente, precondiciones, razón corta, cierre A, waiver B y continuidad. Repetición y acción divergente conservan autoridad/recibos sin duplicados. Se sustituye el texto del error terminal por inmutabilidad física. |
| E3: formato de reporte legacy | Reporte documental canónico: decisiones, requisitos actuales, aplicabilidad y brechas; no certifica ejecución ni consentimiento humano auténtico. | E3 reabre stores antes de cerrar sesión; verifica ambos estados, motivos y decisiones en el archivo, advertencia de ejecución, guardas WRAP_UP, rechazo de replan de closed, nueva sesión e historial prefijo intacto. |
| Criterio 9: adapter mock, reglas YAML elevadas por etiquetas | MCP SDK + HTTP/crawler + Knowledge/drafts/closure SQLite + dos inboxes sintéticos independientes. | Recorrido positivo completo; borrador sobrevive reinicio del servidor/stores; requisito requiere host; A closed/B waived; readback desde otra conexión; reporte/WRAP_UP/replan y pregunta del módulo nuevo. Schema tras cada llamada, incluidas las negativas. |

Estas sustituciones se apoyan en contratos productivos ya existentes y en la instrucción expresa de modernizar la suite. No se implementó autenticación, no se restauró `rules.yaml`, no se cambió producto ni se convirtió una inferencia del DOM en un hecho confirmado. Los fullNames históricos se mantienen como claves de trazabilidad; el nombre legacy de E1 no describe la transición automática del contrato nuevo.

## Límites de esta entrega

Los inboxes solo ejercitan la frontera del gateway: no representan aprobación de una persona real. La atestación `host_private_directory_and_managed_key` pertenece al fixture temporal; no certifica la administración de claves del host desplegado. PRAGMA y reapertura prueban los archivos de la ejecución; no hay transacción ACID común entre Knowledge, drafts, closure y filesystem. La estabilidad global/E01 y los lotes 2–7 permanecen separados.

## Acta aditiva — P3 y P4.2 (código publicado, NO certificado)

| ID | Representación retirada | Garantía vigente conservada | Prueba canónica |
| --- | --- | --- | --- |
| TM-06 | status/entrevista_vista legacy | Discovery produce adquisición/identidad/asociación, cuentas sanitizadas y fresh_anonymous_static; la pregunta se solicita separadamente a canonical_interview.next. | `p3-canonical-discovery.test.ts T6` |
| TM-07 | rules.yaml como fuente de verdad | Cada adquisición conserva observaciones de ejecución únicas; el re-discovery no reescribe requisito confirmado, historial ni crea rules.yaml. | `p3-canonical-discovery.test.ts T7` |
| TM-08 | mock PlaywrightAdapter y decision ficticia | Error de lanzamiento de Chromium debe terminar sin adquirir/guardar hechos ni inventar reglas; estado no completado. | `p3-canonical-discovery.test.ts T9` |
| TM-09 | status/entrevista_vista legacy | Status sugiere Discovery para planned; canonical_interview.next durante especificación abierta; luego siguiente módulo tras cierre durable. | `p3-canonical-discovery.test.ts T14` |
| TM-10 | status/entrevista_vista legacy | Onboarding y plan → Discovery → entrevista canónica → revisión → cobertura → cierre aprobado → siguiente módulo. | `p3-canonical-discovery.test.ts T15` |
| TM-11 | entrevista_vista embebida en Discovery | Preguntas de onboarding/decisión estructuradas, entrevista canónica en question, sin campos top-level aplanados. | `p4-2-canonical-contract.test.ts Criterio 4.4` |
| TM-12 | entrevista_vista embebida en Discovery | Validador Pregunta para onboarding/WRAP_UP; canonical_interview.next ofrece Question con opciones y revisión; cierre host. | `p4-2-canonical-contract.test.ts Criterio 6` |

Estas pruebas están segregadas en módulos nuevos porque los archivos P3/P4.2 históricos **hoistan** mocks del adapter y handlers privados; mezclarlos con un crawler real falsearía la comprobación. El nuevo arnés usa `createLifecycleFixture`, MCP SDK, SQLite y un gateway sintético independiente. El fixture acepta exclusivamente un executable_path explícito para verificar falla real de lanzamiento de navegador sin cambiar configuración productiva. La adquisición repetida no se declara idempotente como operación completa: cada ejecución puede agregar evidencias/observaciones nuevas; las invariantes son no duplicación de identidad dentro de una lectura, inmutabilidad de requisitos y ausencia de promoción automática.

**No extrapolar:** hasta ejecutar Vitest estas garantías son objetivos ejecutables escritos, no resultados físicos; no acreditan consentimiento humano auténtico. Las pruebas históricas que ya aprobaban permanecen intactas en sus módulos originales.

## Integridad P4.5-A / P4.5-A2 — equivalencia parcial

Se trasladan 22 garantías (TM-20..TM-26, 28–29, 33–45) a entrevistas con `canonical_interview`, cobertura mediante `canonical_closure.evaluate` y decisiones por gateway separado. El flujo `from_option` y categorías `rules.yaml` no son una autorización duradera; los enunciados requieren texto sustantivo y revisión del host. `accept_gaps` es una decisión identificada por IDs/digest de brechas y recibo físico, **no un bypass que cierre automáticamente** un módulo con cobertura incompleta. La adquisición de una página sin controles no autoriza inventar confirmaciones, auth_wall ni falsos resultados de pruebas.

Se conserva el servicio compartido `isSubstantiveRuleText` para los umbrales léxicos. El fixture opcional de HTML comprueba respuestas sin controles y con controles manteniendo el mismo entorno seguro. Los tests de login/302/guard SPA que exigen `page_kind` y `auth_wall` permanecen sin modernizar; no se sustituye su garantía por `authentication_not_supported` sin prueba de equivalencia. Todos los ensayos nuevos requieren verificación física para reclamar PASS.

## Acta aditiva server MCP (TM-47, TM-48, TM-49, TM-51)

La validación de archivos `module-view.schema.json` dejó de estar en el camino de Discovery productivo. Se sustituyó por pruebas de la adquisición/anclaje canónico, negativa sin autorización, fallo real de lanzamiento del navegador, y vista sin controles. Solo la adquisición autorizada puede persistir observaciones, sin promoverlas a requisitos. `server-canonical-discovery.test.ts` conserva los cuatro nombres de prueba históricos en un módulo aislado de los mocks legacy. **Sin ejecución física, la sustitución no es PASS**. TM-50 autenticación sigue pendiente porque almacenamiento de sesión autenticada no es equivalente a `fresh_anonymous_static`.
