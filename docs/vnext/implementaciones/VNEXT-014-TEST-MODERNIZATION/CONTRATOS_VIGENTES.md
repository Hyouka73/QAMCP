# Contratos vigentes y equivalencia del Lote 1

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
