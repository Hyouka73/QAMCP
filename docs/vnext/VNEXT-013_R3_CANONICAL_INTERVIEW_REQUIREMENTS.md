# VNEXT-013-R3 — Entrevistas canónicas y confirmación de requisitos

Fecha: 2026-10-30. Base: `801fbc9333cbc4461f842e395700c24d5142d99b`.
Rama exclusiva: `feat/qap-vnext-architecture`. Un solo agente principal.

**Estado: completada con limitaciones.** Existe un recorrido MCP real de entrevista,
propuesta, revisión independiente del host, confirmación y lectura en SQLite.
El servidor por defecto no incorpora una interfaz humana ni autentica revisores:
sin un gateway confiable inyectado, la confirmación está bloqueada. No se certifica
la suite global ni se inicia VNEXT-014. Los cierres históricos R1/R2 permanecen intactos.

## 1. Arquitectura e identidad

`CanonicalInterviewService` recibe IKnowledgeStore v1, BridgeContext y un
IHumanReviewGateway opcional. El servidor construye una instancia por binding
inequívoco de proyecto con ruta real. La configuración procede del host, nunca de
argumentos MCP. Reutiliza ModuleObservationBridge.resolve/project y sus verificaciones:
aplicación, entorno, módulo activo, key inequívoca, revisiones, WORKING, sesión y plan.
No crea DomainModule/DomainView ni cambia el puerto o esquema SQLite.

Fingerprint y pregunta incluyen el contexto vigente. Los IDs deterministas usan
SHA-256 de fingerprint y categoría; no se vinculan observaciones por URL, títulos,
tiempo o HMAC entre ejecuciones. Un cambio de sesión/contexto invalida las propuestas.
El servicio limita su inventario pendiente a 1024 preguntas; no elimina memoria canónica.

## 2. Observaciones y evidencia

El puente recupera hechos/evidencias históricas y relaciones R2. Solo ejecuciones
con asociación completa aportan referencias que motivan preguntas observacionales.
Asociaciones incompletas, ausencia, truncación y errores nunca significan inventario
completo. Las preguntas generales de negocio pueden existir sin evidencia empírica.
La respuesta distingue evidence_scope partial, association_completeness y cobertura
not_certified. Un cambio que retire la asociación de una pregunta observacional
bloquea su respuesta/revisión; no se aprovecha una referencia antigua sin comprobarla.

La proyección solo aporta cantidades: por eso no hay preguntas sobre nombres de
campos, botones, selectores, acciones concretas o URLs. No se consulta texto DOM,
se ejecutan sus instrucciones ni se amplía la exposición de información sensible.
Las referencias de evidencia del requisito señalan el motivo de la pregunta,
**no su autoridad**. No se crea una relación supports ni ConformityAssessment.

## 3. Preguntas y comportamiento conversacional

Las categorías generales son propósito, actor, datos y sensibilidad (esta última
como una pregunta de especificación, nunca como detección empírica). Si existen
controles asociados se añade campo; formularios/navegación permiten acción y
formularios permiten error. Las plantillas son constantes y declaran su falta de
detalle. No se inventa una respuesta o requisito desde HTML required o HTTP 200.

Cada pregunta tiene ID, módulo, categoría, motivo, fuente, evidencia, fingerprint,
fecha, estado, versión, opciones estructuradas y posibilidad de respuesta libre.
Una sola pregunta se devuelve por interacción. next reanuda la primera sin resolver;
aplazar no la omite automáticamente. resume permite retomar su propuesta.
Las preguntas posteriores no aceptan respuestas antes de resolver la activa.
Una corrección explícita de una pregunta confirmada puede volver a activarla.
No se propone cerrar módulos; incluso agotar preguntas solo devuelve
reviewed_questions_only, sin declarar cobertura o completitud.

## 4. Propuestas, clasificación y correcciones

Estados no autoritativos: proposal, pending_review, corrected, deferred, rejected,
confirmed. Viven en memoria de la instancia del host, separados de ExpectedRequirement.
No se persisten respuestas arbitrarias del agente como si fueran declaraciones humanas.
Después de reiniciar, las propuestas pendientes deben volver a registrarse/revisarse;
las confirmadas se recuperan desde el store por ID determinista sin duplicarlas.

Las propuestas admiten respuestas breves pendientes; antes de confirmar se exige
un título y una descripción sustantivos. Tienen categoría formal opcional y
solo los criterios de aceptación expresamente aportados. Falta de categoría =>
classification_required, sin escritura. isSubstantiveRuleText se reutiliza como función
pura. No se fabrica ViewDiscoveryContext para usar generateNextInterviewBatch ni
se aplica computeCoverage YAML a requisitos canónicos. Los validadores de waivers,
el generador y la cobertura legacy permanecen intactos.

| Entrevista | Sugerencias revisables | Motivo |
| --- | --- | --- |
| proposito | functional | Resultado esperado de negocio |
| actor | functional, security | Capacidad o restricción explícita de acceso |
| campo | business_rule, ui | Validación de negocio o presentación explícita |
| accion | functional, business_rule | Efecto o precondición de una acción |
| error | business_rule, ux | Restricción o respuesta al usuario |
| dato | functional, business_rule | Conservación/transmisión o política de negocio |
| sensibilidad | security, ui | Protección o presentación, si el humano lo estipula |

Estas sugerencias no asignan categorías automáticamente. La propuesta puede seleccionar
cualquiera de las siete categorías canónicas; el host debe revisar esa clasificación
como parte del enunciado exacto. regression/performance no se infieren del DOM.

## 5. Frontera de revisión humana y contrato del host

Secuencia: propuesta MCP no confiable → pregunta existente del host → solicitud
HumanReviewRequest → presentación independiente al humano → respuesta explícita
registrada en el host → consulta del gateway → validación → commit canónico.

`humanReviewGateway` se inyecta en ProjectKnowledgeBinding al crear el servidor.
No existe un gateway aprobador predeterminado. review debe consultar una decisión
real obtenida fuera de MCP y devolver null si falta, está revocada o no está disponible.
El host debe presentar el texto completo, título, categoría y criterios, vincularlos
a la pregunta/contexto y declarar la identidad del revisor. No basta mostrar un hash.
El adaptador debe controlar su UI, identidad, acceso, revocación y unicidad entre
aplicaciones; un agente con acceso a esa API privilegiada rompería la premisa de confianza.

HumanReviewRequest vincula ruta real/proyecto, aplicación, entorno, módulo ID/key,
pregunta y su texto/categoría/evidencias, contexto, versión, digest del enunciado,
ID de requisito, revisión esperada y propuesta exacta. requestDigest abarca todos
estos campos con orden de propiedades normalizado. El gateway recibe una copia.
HumanReviewDecision declara requestDigest, presentedStatementDigest, UUID de aprobación,
confirm/reject/defer, reviewer, decidedAt y expiresAt. Se validan coincidencias exactas,
fecha no futura y expiración vigente, con una vigencia máxima de quince minutos.
No se persisten claves, respuestas de configuración, errores del proveedor ni tokens.

Esto es una **atestación del host**, no autenticación criptográfica del humano ni una
garantía frente a un host malicioso con acceso de escritura directa al store. El
puerto IKnowledgeStore sigue siendo privilegiado; no se pretende convertirlo en
un servicio público con autenticación/RBAC. Sin gateway: preguntas, propuestas y
aplazamiento funcionan; ningún ExpectedRequirement confirmado se escribe.

## 6. Uso único, idempotencia y revocación

Una aprobación confirmada deja una KnowledgeRelation existente de tipo related_to,
ID `human-review:<approvalId>`, módulo@revisión → requisito@revisión. Su trace usa
human_review_authorization_v1 y requestDigest; evidence_refs vacío distingue esta
autoridad de la evidencia observacional. Es un recibo de auditoría, no un requisito
paralelo. Se crea con CAS=0 en la misma transacción que el requisito.

Reutilizar su UUID para otro request en la misma aplicación se bloquea incluso tras
reiniciar. Reintentar la misma operación reconoce el registro confirmado sin nueva
escritura ni duplicación. El host debe preservar unicidad entre aplicaciones y las
decisiones no confirmadas: el aislamiento del puerto es por application_id.
Rechazar/aplazar no crea requisitos; su estado pendiente no es una auditoría durable.

Revocación/expiración se comprueban antes de cada nueva confirmación. Una aprobación
ya consumida constituye historia, no se borra ni desconfirma retroactivamente por
un retry posterior. Revocación posterior al commit requeriría otra decisión explícita
y una corrección/invalidación autorizada; no hay un monitor automático de revocaciones.

## 7. Persistencia, procedencia e invariantes

Se construye ExpectedRequirement de @qap/shared con ID estable, application_id,
module_key del módulo canónico, título, descripción, categoría explícita, confirmed,
developer_interview, verificador declarado, evidencia human_review con UUID/digest/fecha,
created_at y is_active. La procedencia significa que el humano aprobó el enunciado;
no atribuye al humano su redacción original. La confianza 0.8 es una política
conservadora fija, no una medición de verdad ni un aumento automático a 1.0.
Los criterios ausentes se omiten. Las correcciones conservan created_at y la historia
anterior, pero requieren una autorización nueva sobre todos los campos modificados.

validateExpectedRequirement y KnowledgeCommitPlanner validan D-011/D-012 y las
referencias físicas. No se usa observed_telemetry, verified_by o trace.review como
permiso para confirmar. Una propuesta corregida deja vigente el requisito anterior
hasta que se confirme la nueva revisión; rechazo de la propuesta no rechaza ese
requisito histórico. Los contadores distinguen rejected_proposals de requisitos.

## 8. Concurrencia, CAS e historia

La cola por instancia serializa cambios de propuestas; version rechaza respuestas
obsoletas. expected_revision se comprueba antes de revisión y en el commit SQLite.
Dos conexiones no hacen upsert: colisiones son conflicto o retry idempotente del
mismo enunciado. Requisito y recibo se revierten juntos ante error; no hay huérfanos.
Se comprueba contexto tras esperar al host, antes/después del commit y con relectura
del requisito. Las revisiones anteriores y sus aprobaciones permanecen consultables.

Persiste la ventana contractual de R2: IKnowledgeStore v1 no permite CAS transversal
de contexto solo leído ni de lifecycle filesystem. Un cambio concurrente después
de la comprobación y durante el commit puede dejar una revisión histórica y devolver
context_changed_after_commit; no se declara éxito vigente ni se borra historia.
Cerrar esa ventana o soportar invalidación automática requiere autorización contractual
independiente. No se garantiza atomicidad entre UI del host, filesystem y SQLite.

## 9. Integración MCP y legacy

qap_rules_set conserva un único propietario funcional en el switch; se añade una
ruta explícita `canonical_interview`, sin nueva herramienta pública. Tras esa entrada
no existe fallback legacy ni dual-write YAML/SQLite. No se trasladan unas 900 líneas
legacy en esta intervención: permanecen cuatro handlers declarativos y catorce
legacy, con las mismas 18 herramientas y orden.

```ts
// Misma llamada MCP pública. Argumentos de la ruta canónica son exclusivos.
{ module: 'catalog', canonical_interview: { action: 'next' } }
{ module: 'catalog', canonical_interview: { action: 'propose', question_id,
  version: 0, expected_revision: 0,
  proposal: { title, description, category: 'functional' } } }
{ module: 'catalog', canonical_interview: { action: 'review', question_id, version: 1 } }
// review solo consulta la decisión que el host obtuvo independientemente.
```

Cada llamada requiere targetPath autorizado. Otros campos MCP (source, status,
from_option, verified_by, trace, gateway) se rechazan en esta ruta. Una pregunta
inventada o de otro módulo/contexto no autoriza nada. Las respuestas no reflejan
el texto libre de propuestas; devuelven digest, estado y versión. El host confiable
sí recibe el texto completo para mostrárselo al humano y revisar su almacenamiento.

El algoritmo legacy se conserva con sus prerrequisitos válidos: manual edits,
no-downgrade, reglas, borradores, waivers y RMW existentes. Una confirmación YAML
legacy nunca escribe ExpectedRequirement. No se crean YAML ficticios para reactivar
tests que dependían de efectos retirados de discovery. Los 32 B originales siguen
pendientes como integración legacy; nuevas pruebas acreditan garantías canónicas
con un contrato diferente, sin declarar resuelto su cierre/cobertura.

## 10. Status y lifecycle

qap_status.canonical_modules incorpora interview: disponibilidad, asociación,
completitud acotada, preguntas pendientes, respuestas revisadas, propuestas pendientes,
requisitos draft/confirmed, propuestas rechazadas, revisiones, gateway y necesidad
de revisión. Conflictos se informan por operación; no se inventa un contador durable.
Inventario de requisitos limitado a cien por módulo, con truncated explícito.
Las preguntas/propuestas en memoria y el inventario persistido se identifican por
separado. No se mezclan con cobertura de reglas YAML.

WORKING y el estado planned pueden conservarse durante toda la entrevista. No se
asimila consolidated a validación canónica, se llama session_close, ni se recomienda
module_close por confirmar un requisito. Cobertura y cierre necesitan otro contrato.

## 11. Seguridad y privacidad

No navegación adicional, credenciales, perfiles, sesión personal, selectores nuevos,
texto DOM arbitrario o configuración sensible en esta ruta. Argumentos cerrados,
límites de longitud, caracteres de control rechazados, errores con códigos fijos y
sin logs de propuestas o gateway. Las preguntas usan exclusivamente plantillas.
Canarios en DOM, respuestas MCP, argumentos de autoridad y errores de host/SQLite
no llegan a respuestas, logs o escrituras sin aprobación. Texto explícitamente
aprobado se almacena como requisito; upstream debe redactar secretos antes de
aprobar. No se promete detección universal de PII o secretos en texto libre.
La identidad reviewer es una declaración autorizada del host y se persiste como
procedencia, sin reflejarla en respuestas MCP de confirmación.

No se lee ni utiliza la sesión protegida. Se excluye de staging. Bases, WAL/SHM,
informes y logs sintéticos quedan en node_modules/.tmp-vnext y node_modules/vnext013r3-*.

## 12. Pruebas y reproducción

canonical-interview.test.ts usa Client, Server real e InMemoryTransport, una bandeja
de revisión controlada exclusivamente por el host y SqliteKnowledgeAdapter físico.
La prueba integrada presenta una pregunta mediante MCP, registra propuesta, demuestra
bloqueo sin aprobación, registra la decisión por API del host, confirma por MCP y
lee el mismo store mediante status/reapertura. Nunca se simulan simultáneamente gateway
y store: la bandeja es un adaptador de fixture, SQLite es real. No constituye una
UI de revisión humana lista para un host de producción.

El fixture observacional se ingresa explícitamente con la estructura real del crawler
y se asocia por ModuleObservationBridge; no suplanta un discovery HTTP. El recorrido
real Chrome/MPA/HTTP/SQLite se conserva en las 57 pruebas de discovery y 30 del crawler.
Los nuevos casos incluyen ausencia, asociación parcial, identidad/contexto cambiado,
reanudación, corrección, clasificación pendiente, aprobación falsa/caducada/revocada,
gateway caído/ausente, rechazo/aplazamiento, replay, otro proyecto, reinicio, CAS
entre conexiones, trigger de rollback, historial y separación epistemológica.

Entorno verificado: Windows y Node 24.15.0. Sin certificación de otros SO/runtimes.
Comandos con binarios locales, sin descarga de dependencias:

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
node packages/mcp/node_modules/vitest/vitest.mjs run packages/mcp/src/__tests__ --fileParallelism=false
node packages/knowledge/node_modules/vitest/vitest.mjs run packages/knowledge/test packages/knowledge/src/__tests__ --fileParallelism=false
node packages/engine/node_modules/vitest/vitest.mjs run packages/engine/src/__tests__ --fileParallelism=false
node packages/shared/node_modules/vitest/vitest.mjs run packages/shared/src/__tests__ --fileParallelism=false
node packages/playwright-adapter/node_modules/vitest/vitest.mjs run packages/playwright-adapter/src/__tests__/blackbox-crawler.test.ts --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit -p packages/mcp/tsconfig.json
node node_modules/eslint/bin/eslint.js packages/mcp/src/server.ts --no-inline-config
```

Chrome y HTTP loopback necesitan permisos del entorno. Knowledge inicial restringido
fue 255/258: tres pruebas reconnaissance no adquirieron sus respuestas locales.
Repetición con permisos: 258/258. No se cambian aserciones ni seguridad para evitarlos.
MCP intermedio fue 241/300: 39 nuevas aprobadas, los 58 históricos y un fallo nuevo
de snapshot de catálogo. Se adaptó esa prueba para verificar la ampliación contractual
autorizada y comparar íntegramente el contrato legacy restante; no se modifica el fixture.
Los ajustes posteriores de recibo/reinicio están cubiertos por las 42 pruebas nuevas.

## 13. Resultados finales e inventario R01–R60

| Verificación | Base R2 | R3 final |
| --- | ---: | ---: |
| MCP completo | 203/261 | 245/303; 58 fallos |
| Nuevas R3 | — | 42/42 |
| Discovery | 57/57 | 57/57 |
| Dispatcher/SDK | 46/46 | 46/46 |
| State handlers | 21/21 | 21/21 |
| Knowledge | 258/258 | 258/258 |
| Engine | 168/168 | 168/168 |
| Shared | 146/146 | 146/146 |
| Crawler | 30/30 | 30/30 |
| Builds | 10/10 | 10/10 |
| ESLint server sin inline config | 513 | 513 |
| TypeScript amplio MCP | 47 | 47, firmas idénticas |

Lint de archivos nuevos/afectados y tests: cero diagnósticos. Sin supresiones,
reglas desactivadas ni cambios de configuración. Sin skips/todos nuevos. Diez builds
en orden de dependencias; MCP y CLI recompilados tras el ajuste final.

| Archivo MCP | Pasa/total |
| --- | ---: |
| canonical-interview.test.ts | 42/42 |
| discovery-handler.test.ts | 57/57 |
| dispatcher-integration.test.ts | 8/8 |
| dispatcher.test.ts | 38/38 |
| e0-investigation.test.ts | 4/4 |
| guidance.test.ts | 7/7 |
| lifecycle-v3-e2e.test.ts | 2/7 |
| p3-verification.test.ts | 5/13 |
| p4-2-pregunta-contract.test.ts | 4/6 |
| p4-3-1-b-block.test.ts | 7/7 |
| p4-3-investigate-before-ask.test.ts | 8/8 |
| p4-4-auth-lifecycle.test.ts | 8/15 |
| p4-5a-integrity.test.ts | 2/12 |
| p4-5a2-integrity.test.ts | 10/26 |
| p4-5s1-browser-candidates.test.ts | 11/11 |
| server.test.ts | 11/21 |
| state-handlers.test.ts | 21/21 |

Correspondencia individual con el inventario R1: **21 A, 32 B, 5 D**, cero fallos
nuevos o sin clasificar. R08/R17 siguen recuperados; no se renumeran casos.
Cada fila siguiente continúa pendiente en su prueba histórica. Una garantía
canónica equivalente o parcial no se contabiliza como recuperación de ese caso.

| Caso | Clase | Prueba histórica | Correspondencia / pendiente |
| --- | --- | --- | --- |
| R01 | B | lifecycle-v3-e2e.test.ts: E0a: qap_status en WORKING para módulo con cobertura incompleta devuelve module, view y preguntas no vacías idénticas a qap_rules_set | Status canónico y preguntas separadas; no se promete identidad del guidance legacy. |
| R02 | B | lifecycle-v3-e2e.test.ts: E1: regresión consolidated -> interviewing tras re-discover y política de waivers | No adelantar lifecycle. Waivers legacy intactos; cobertura canónica no certificada. |
| R03 | B | lifecycle-v3-e2e.test.ts: E2: qap_module_close validaciones, compuertas y transiciones | Cierre canónico no implementado; requisito confirmado no permite cerrar. |
| R04 | B | lifecycle-v3-e2e.test.ts: E3: canExitWorking, qap_session_close, reporte de brechas y nueva sesión desde WRAP_UP | Sin session_close automático ni cobertura/reporte canónicos. |
| R05 | B | lifecycle-v3-e2e.test.ts: Criterio 9: E2E completo: init -> onboarding -> scoping -> working -> discover A -> rules_set parcial -> status (reanuda) -> rules_set completa -> module_close A -> discover B -> module_close waive B -> session_close -> status WRAP_UP -> session_plan nueva sesión | Solo entrevista/revisión/requisitos; cadena de cierre completa pendiente. |
| R06 | A | p3-verification.test.ts: T6: qap_discover éxito: no contiene "Descubrir otro módulo", "pregunta_doc" ni "opciones_doc"; siguiente_accion tipo entrevista_vista (<= 5 preguntas) con tool qap_rules_set, categorias_aplicables y rutas_detectadas_fuera_del_plan | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R07 | A | p3-verification.test.ts: T7: rules.yaml tras discover: reglas inferred/dom con ids deterministas; re-discover idempotente (sin duplicados, reglas confirmadas intactas) | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R09 | A | p3-verification.test.ts: T9: Fallo de Playwright: no inserta reglas; siguiente_accion tipo decision | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R10 | B | p3-verification.test.ts: T11: Primera llamada exitosa: observed -> interviewing; ids R-001, R-002... secuenciales por módulo | IDs canónicos estables, sin transición observed/interviewing ni IDs R-xxx ficticios. |
| R11 | B | p3-verification.test.ts: T12: No-downgrade: regla source user confirmed no se sobrescribe con source dom/prd; waivers solo source user y reason no vacío; lote con regla inválida se rechaza completo | Ningún argumento MCP degrada o confirma; corrección con nueva aprobación y CAS. Waivers solo legacy. |
| R12 | B | p3-verification.test.ts: T13: Dos llamadas concurrentes a qap_rules_set sin pérdida de actualización | Dos conexiones SQLite, CAS y recibo atómico; sin pérdida de historia ni upsert. |
| R13 | B | p3-verification.test.ts: T14: qap_status WORKING: (a) observed con hipótesis reanuda entrevista; (b) interviewing incompleto reanuda; (c) planned elige high > medium > low luego orden; (d) todos completos tipo decision | Status cuenta propuestas/requisitos; prioridad/cierre legacy siguen independientes. |
| R14 | B | p3-verification.test.ts: T15: E2E: flujo de P2 hasta WORKING -> discover A -> rules_set parcial -> status (reanuda A) -> rules_set completa cobertura -> status (propone B) -> discover B; ninguna respuesta del flujo contiene texto del bucle | Reanudación MCP real de entrevista; cobertura y avance al siguiente módulo pendientes. |
| R15 | B | p4-2-pregunta-contract.test.ts: Criterio 4.4: Ninguna respuesta con siguiente_accion trae preguntas como cadenas ni pregunta aplanada | Pregunta canónica estructurada con opciones/registro; sin migración global de Pregunta legacy. |
| R16 | B | p4-2-pregunta-contract.test.ts: Criterio 6: E2E Completo donde TODA siguiente_accion de tipo entrevista, entrevista_vista o decision trae Pregunta válida | Nueva cadena MCP tipada; no certifica todo el E2E de onboarding/cierre legacy. |
| R18 | A | p4-4-auth-lifecycle.test.ts: 1. qap_discover protegido sin perfil: blocked auth_required y cero escrituras en disco | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R19 | A | p4-4-auth-lifecycle.test.ts: 2. qap_discover con redirección HTTP 302 a login: detecta auth_wall determinista y bloquea sin escribir | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R20 | A | p4-4-auth-lifecycle.test.ts: 3. qap_discover con login embebido en ruta no-acceso: bloquea como auth_required sin persistir | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R21 | D | p4-4-auth-lifecycle.test.ts: 4. qap_discover con sesión expirada: blocked session_invalid y desverifica el perfil | Autenticación/capacidad futura fuera de R3; requiere autorización independiente. |
| R22 | D | p4-4-auth-lifecycle.test.ts: 5. qap_discover con perfil verificado y storageState válido: devuelve app y transiciona a observed | Autenticación/capacidad futura fuera de R3; requiere autorización independiente. |
| R23 | A | p4-4-auth-lifecycle.test.ts: 6. qap_discover en módulo de acceso: selectors.json incluye auth_selectors y omite valores y atributos sensibles de password | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R24 | D | p4-4-auth-lifecycle.test.ts: 15. Guard de cliente asíncrono lento (~1200ms) en qap_discover: responde blocked auth_required y cero escrituras en .qa/modules (C3c) | Autenticación/capacidad futura fuera de R3; requiere autorización independiente. |
| R25 | B | p4-5a-integrity.test.ts: Criterio 2: regla redactada por agente sin user_text ni from_option se guarda como inferred/agent y no cuenta en cobertura | Texto del agente vive en memoria pendiente; no escribe ExpectedRequirement sin revisión. |
| R26 | B | p4-5a-integrity.test.ts: Criterio 3: una etiqueta de opción predefinida del motor NO cubre una categoría | Opciones MCP no conceden autoridad ni cobertura canónica. |
| R27 | B | p4-5a-integrity.test.ts: Criterio 4: un módulo con 2 reglas de 7 categorías no cierra sin accept_gaps, y cierra con él dejando registro | Requisitos por categoría no prueban cobertura ni habilitan cierre. |
| R28 | A | p4-5a-integrity.test.ts: C9a: blocked de qap_discover con auth_required incluye razon auth_required y directorio_objetivo, con claves alineadas a session_invalid | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R29 | B | p4-5a-integrity.test.ts: C4-a: from_option con pregunta_id inexistente, opcion_id inexistente o sin texto sustantivo (rechazo o degradación a agent/inferred) | Pregunta inventada/otro contexto y from_option falsificado bloqueados sin escritura. |
| R30 | B | p4-5a-integrity.test.ts: C4-b: límites de sustantividad (2 palabras o 19 caracteres no cubren; 3 palabras y 20 caracteres sí) | Respuesta breve pendiente; revisión exige título/descripción sustantivos y aprobación. |
| R31 | B | p4-5a-integrity.test.ts: C4-c: accept_gaps con razón de 14 caracteres bloquea y con 15 cierra y deja el registro | accept_gaps no incorporado a la ruta canónica; cierre sigue pendiente. |
| R32 | A | p4-5a-integrity.test.ts: C4-d: plan con auth.required true sin roles queda bloqueado con pregunta de roles y bloquea discover (V4) | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R33 | A | p4-5a-integrity.test.ts: C1: campos honestos en bloqueos previos a navegar y navegación real | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R34 | B | p4-5a-integrity.test.ts: C3: flujo real de preguntas de categoría, formato una_opcion, persistencia y respuestas user_text y deferred | Preguntas, respuesta libre, propuesta y defer/resume por MCP; sin YAML canónico. |
| R35 | A | p4-5a2-integrity.test.ts: C1-a: módulo de acceso pedido en login sin redirección NO se bloquea (page_kind login, success) | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R36 | A | p4-5a2-integrity.test.ts: C1-b: ruta protegida con redirección HTTP 302 a /login detecta auth_wall determinista y bloquea | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R37 | D | p4-5a2-integrity.test.ts: C1-c: ruta protegida con guard del lado del cliente detecta auth_wall con redirección al login | Autenticación/capacidad futura fuera de R3; requiere autorización independiente. |
| R38 | B | p4-5a2-integrity.test.ts: C3-a: la categoría de from_option se toma siempre de la pregunta pendiente persistida | Categoría de entrevista del registro interno; categoría formal explícita revisada por host. |
| R39 | B | p4-5a2-integrity.test.ts: C3-b: si la petición declara una categoría distinta a la de la pregunta pendiente se rechaza con blocked | No puede reescribirse la categoría de pregunta por args; categoría formal ligada al digest. |
| R40 | B | p4-5a2-integrity.test.ts: C4-a: respuesta corta se guarda como borrador (status inferred, source user_text, borrador true) y no cubre | Respuesta corta no autoritativa en memoria; sin cobertura ni requisito confirmado. |
| R41 | B | p4-5a2-integrity.test.ts: C4-b: derivación determinista en categoría actor que nombra roles emite Pregunta una_opcion directamente | Pregunta general de actor, sin inferir roles o permisos específicos. |
| R42 | B | p4-5a2-integrity.test.ts: C4-c: envío de propuesta_enunciado válida para un borrador emite Pregunta una_opcion con las 3 opciones | Propuesta versionada; revisión exacta por UI/adaptador del host, no aprobación MCP. |
| R43 | B | p4-5a2-integrity.test.ts: C4-d: resolver con "Es correcto" guarda regla confirmed user_confirmed con enunciado exacto y cubre | Confirmación requiere decisión independiente ligada al texto; no declara cobertura. |
| R44 | B | p4-5a2-integrity.test.ts: C4-e: resolver con "Lo defino después" guarda regla deferred y no cubre | Aplazamiento no escribe requisito ni omite preguntas obligatorias. |
| R45 | B | p4-5a2-integrity.test.ts: C4-f: propuesta_enunciado corta o genérica es rechazada con status error | Borrador breve permitido; confirmar texto no sustantivo bloqueado. |
| R46 | A | p4-5a2-integrity.test.ts: C10-a: página app/login sin elementos interactivos genera advertencia extraccion_vacia y trabajo | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R47 | A | p4-5a2-integrity.test.ts: C10-b: página con al menos un elemento interactivo no genera advertencia extraccion_vacia | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R48 | A | p4-5a2-integrity.test.ts: C10-c: la advertencia extraccion_vacia es agnóstica de la aplicación | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R49 | B | p4-5a2-integrity.test.ts: C1-c: módulo con tilde preserva nombre en lifecycle, crea directorio y normaliza pending_questions con transliteración NFD | Identidad canónica por binding/hash; no se crean directorios o YAML por nombre. |
| R50 | B | p4-5a2-integrity.test.ts: C2-seguimiento: selección de "Corregir" emite pregunta de seguimiento y no persiste regla espuria en rules.yaml | Corrección pendiente, nueva versión/aprobación; ninguna regla YAML espuria. |
| R51 | D | server.test.ts: debe descubrir modulos y responder en desarrollo para qap_plan y qap_test | Autenticación/capacidad futura fuera de R3; requiere autorización independiente. |
| R52 | A | server.test.ts: el contexto de vista generado por qap_discover debe validar contra module-view.schema.json (Criterio 4) | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R53 | A | server.test.ts: qap_discover con contexto de vista inválido no debe escribir archivos y debe retornar error (Criterio 4) | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R54 | A | server.test.ts: E0a: qap_discover valida contra module-view.schema.json en camino de fallo de Playwright | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R55 | A | server.test.ts: E0b: qap_discover valida contra module-view.schema.json en vista de autenticacion con session_saved true | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R56 | A | server.test.ts: E0c: qap_discover valida contra module-view.schema.json en vista con routes_found vacio | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R57 | A | server.test.ts: qap_discover: gating por fase y estado de modulo, actualizacion planned -> observed | Contrato retirado de discovery/precondiciones del host. No se restauran efectos legacy ni archivos ficticios. |
| R58 | B | server.test.ts: Criterio 7: Proyecto legacy sin campos de negocio valida contra el schema y qap_status responde con fase WORKING derivada | Status canónico aditivo; no migra onboarding/validación legacy. |
| R59 | B | server.test.ts: Criterio 8 (E2E): init -> status (entrevista) -> ingest -> context_set compuerta -> auto-SCOPING -> session_plan -> auto-WORKING -> discover | Plan/contexto existentes requeridos; no reimplementa el E2E onboarding legacy. |
| R60 | B | server.test.ts: qap_rules_set: actualiza reglas, transiciona observed -> interviewing, recalcula cobertura y actualiza guidance | Ruta MCP canónica real y status; sin transición/cobertura legacy automática. |

## 14. Dictamen y continuidad

Recorrido canónico funcional demostrado sobre MCP/SQLite con host autorizado; host
sin autorización bloqueado. No hay exposición pública de un permiso aprobador ni
autenticación criptográfica añadida. Quedan pendientes UI/adaptador de revisión real
del host, persistencia/reanudación de propuestas pendientes entre procesos, garantías
de concurrencia transversal de contexto, cierre y cobertura canónicos, y reconciliación
de consumidores legacy. VNEXT-014 no está iniciada ni se declara apta por la sola
presencia de requisitos confirmados. Publicar exclusivamente lo comprobado y detenerse.
