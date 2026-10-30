# VNEXT-013-R4 — Estado durable de entrevistas canónicas

Fecha: 2026-10-30. Base verificada local/remota:
`6568a161d94494cf189775257362b57612e9f9fa`.
Rama exclusiva: `feat/qap-vnext-architecture`. Un agente principal.

**Estado: completada con limitaciones.** Persistencia opt-in del host, separada del
conocimiento canónico. No incluye UI humana de producción, cobertura ni cierre
canónicos; no inicia ni declara lista VNEXT-014. Los cierres R1/R2/R3 no cambian.

## 1. Problema de continuidad

R3 conservaba preguntas, propuestas y decisiones no confirmadas exclusivamente en
Maps. R4 conserva esos Maps como caché de trabajo, pero, en modo durable, cada
operación los reemplaza por el snapshot físicamente vigente bajo exclusión SQLite.
Una instancia nueva recupera el mismo texto, digest, pregunta, estado y versión.
No reconstruye respuestas desde observaciones, nombres, heurísticas o historial YAML.

## 2. Modelo de persistencia

`InterviewDraftSnapshot` contiene proyecto real, aplicación, entorno, preguntas y
pares UUID/digest de decisiones consumidas. Cada pregunta conserva nombre
planificado, binding canónico completo con IDs/key/revisiones, fingerprint de
sesión/plan/lifecycle, ID determinista, categoría, texto de pregunta, motivo,
referencias de evidencia, estado, versión, issuedAt/modifiedAt, requirementId,
expectedRevision, propuesta exacta y proposalDigest. El historial conserva snapshots
completos cifrados por generación. Sucesivas generaciones permiten reconstruir
modificaciones y decisiones; no son requisitos ni autorizaciones humanas.

## 3. Contrato del almacenamiento

`IInterviewDraftStore` es un puerto interno exportado por MCP, con lectura tipada
de snapshot y `transaction(scope, callback)`. La transacción debe adquirir una
reserva exclusiva transversal **antes** de leer y mantenerla hasta publicar o
revertir el snapshot. Scope diferente falla, sin buscar preguntas por ID aislado.
El callback es código confiable del host; nunca se expone como argumento MCP.

`ProjectKnowledgeBinding.interviewDraftStore` recibe una instancia ya abierta.
MCP no descubre rutas, abre bases, crea archivos, migra esquemas ni cierra stores.
Sin instancia se conserva el modo efímero compatible de R3, identificado como
`not_configured_host_memory_until_restart`; no se anuncia durabilidad.
Una instancia configurada pero fallida bloquea operaciones: no cae a RAM.

## 4. Backend elegido

`SqliteInterviewDraftStore` usa `node:sqlite`, backend ya disponible en el host
Node 24 probado. Base separada, esquema propio v1: `interview_meta` y
`interview_history`. No cambia IKnowledgeStore v1, KnowledgeCommitPlanner ni
el esquema canónico. No fabrica ExpectedRequirement, observaciones o relaciones
para guardar conversación. Los recibos canónicos R3 conservan su uso contractual.

Se elige un snapshot por ámbito para serializar también la pregunta activa y los
UUID de decisiones. Es más conservador y costoso que filas independientes por
pregunta, pero evita carreras de selección entre preguntas y módulos.

## 5. Inicialización y versionado

Configuración privilegiada del host, nunca parámetros de qap_rules_set:

```ts
const drafts = new SqliteInterviewDraftStore({
  path: explicitPrivateAbsolutePath,
  projectRoot: realProjectRoot,
  applicationId, environmentId,
  key: keyFromProtectedHostProvider, // 32 bytes aleatorios; conservar fuera de SQLite
  protection: 'host_private_directory_and_managed_key',
  initialize: true, // solamente en el aprovisionamiento explícito inicial
});
// En reinicios: misma ruta, ámbito y clave; omitir initialize.
const server = createMcpServer({ projectRoots: [realProjectRoot], knowledgeBindings: [{
  projectRoot: realProjectRoot, applicationId, environmentId, store,
  moduleBindings, humanReviewGateway, interviewDraftStore: drafts,
}] });
```

El host crea previamente el directorio privado. `initialize: true` usa creación
exclusiva `wx`, incluso rechaza un archivo vacío existente. Sin initialize, ruta
ausente => `not_initialized`, sin crear archivo. Esquema desconocido =>
`incompatible`; autenticación de ciphertext/clave incorrecta => `corrupt` sin
destruirlo; errores de acceso => `unavailable`. No hay migración automática.
Error de escritura => `draft_write_failed`; conflicto => `draft_conflict`.
Un fallo de inicialización puede dejar el archivo nuevo vacío o incompleto:
el host debe inspeccionar esa ruta explícita; no se reutiliza automáticamente.

## 6. Aislamiento

Una base pertenece a un único proyecto por ruta real completa, aplicación y
entorno; el digest de ese ámbito se almacena en metadatos. El snapshot cifrado
conserva las identidades y las autentica contra el ámbito. No correlaciona por
basename o nombre de módulo. Se rechazan file symlinks, hardlinks y padres cuya
ruta real difiere de la explícita. No es defensa contra carreras de filesystem
de la misma cuenta privilegiada ni contra un host malicioso.

Dentro del ámbito, fingerprint e ID de pregunta incluyen contexto de sesión,
plan, módulo y revisiones. La restauración usa el binding **vigente** del host y
ModuleObservationBridge, incluyendo módulo activo, plan y evidencia asociada.
Una pregunta extranjera no acredita pertenencia por aportar su question_id.

## 7. Preguntas y estados

Se conservan proposal, pending_review, corrected, deferred, rejected y confirmed.
El requisito previamente confirmado sigue vigente mientras existe una corrección
pendiente; status lo separa con `confirmed_with_pending_correction`.
Rechazar/aplazar nunca crea requisitos. El rechazo sobrevive al reinicio y requiere
`correct` explícito para reactivarse, incluso si se vuelve a proponer el mismo texto;
la reactivación exige una nueva versión y nueva decisión independiente.

En modo durable defer, resume de una aplazada y reject/defer del gateway incrementan
la versión. El cliente debe utilizar la versión devuelta. R3 no incrementaba en
esas transiciones: esta diferencia deliberada impide comandos de estado antiguos.
Una confirmación conserva la versión del enunciado para reconocer su recibo original.
Reintentar una propuesta idéntica en estado pendiente con versión vigente no incrementa.
`resume` durable también recupera metadatos de una propuesta ya pendiente/corregida.
Nunca devuelve el texto libre de esa propuesta por MCP.

## 8. Concurrencia y versiones

`BEGIN IMMEDIATE`, busy_timeout=0, lectura bajo reserva, generación única y commit
constituyen la exclusión equivalente a CAS. Dos conexiones no pueden leer para
modificar simultáneamente el mismo snapshot: una obtiene conflicto inmediato y
debe releer/reintentar deliberadamente. Se vuelve a comprobar la versión de la
pregunta y la revisión canónica dentro de esa operación serializada. Se preserva
el CAS de requisito/recibo de R3; nunca hay upsert ciego ni doble incremento perdido.

La reserva abarca toda la operación, incluso la consulta asíncrona al gateway.
Un adaptador de producción debe consultar una bandeja de decisiones ya obtenidas
y devolver null si faltan, evitando esperar una interacción humana larga bajo lock.
SQLite síncrono bloquea brevemente el hilo; no hay worker ni plazo duro del gateway.
La cola local también serializa status contra operaciones de su propia instancia.

## 9. Recuperación

Se autentica el snapshot, comprueban identidades/digests/estados/versiones y se
revalida el módulo mediante el puente R2. No se reejecuta crawler ni se restaura
sesión de navegador. Contextos antiguos permanecen físicamente en el historial y
se bloquean; no se eliminan ni se reutilizan en una sesión nueva.
Status enumera metadatos de preguntas obsoletas, sin propuestas, hasta cien.
Bindings cuyo módulo sale del plan ahora también se muestran como bloqueados/obsoletos,
en lugar de omitir silenciosamente su proyección canónica.

## 10. Fallos parciales

No existe atomicidad entre las dos bases. Orden: reserva de borradores → revisión
vigente → gateway → commit canónico requisito+recibo → commit de borrador.
Si falla el último paso, la operación informa error de persistencia de borrador;
el requisito puede haber quedado físicamente confirmado.

Al recuperar, se reconstruye el request exacto desde el borrador y se comprueban
revisión expected+1, module_key, procedencia, digest, mecanismo human_review y
recibo original apuntando al requisito/revisión. Solo entonces se reconoce confirmed,
sin volver a consumir una aprobación. Status cuenta `reconciled_confirmations`.
El retry informa `physical_commit: confirmed`, `recovered_confirmation` y
`previous_response_delivery: unknown`: preparar o devolver un resultado desde el
servicio no demuestra que el cliente recibió la respuesta MCP.

Rollback de escritura preserva el snapshot previo; SQLite recupera transacciones
sin COMMIT al terminar un proceso. No se borra historia canónica para ocultar fallos.
La ventana transversal contexto/filesystem/commit de IKnowledgeStore v1 permanece;
un cambio detectado tras commit no se anuncia como confirmación vigente.

## 11. Seguridad de información en reposo

Las propuestas **sí se guardan en SQLite**, cifradas con AES-256-GCM, nonce aleatorio
de 12 bytes, tag de 16, AAD de ámbito+generación y clave explícita de 32 bytes.
SQLite, WAL y journals reciben exclusivamente ciphertext de snapshots. Metadatos
de esquema, digest de ámbito y generaciones no están cifrados. La clave no se
guarda en la base, argumentos MCP, logs ni recibos; su copia interna se limpia al cerrar.

La política obligatoria del host es: directorio privado con ACL limitada a la cuenta
del servicio/administrador; clave de un proveedor protegido accesible solo al host;
backups cifrados con acceso equivalente; retención revisada como máximo cada 30 días
y al terminar el proyecto, sin borrado automático de decisiones pendientes. El
literal `protection` es atestación privilegiada de haber configurado estas medidas,
no inspección automática ni certificación de ACL Windows. Sin esa atestación o clave
válida se rechaza configurar el backend durable. No hay clave predeterminada.

Máximo 1024 preguntas y 4096 generaciones, después `retention_limit`; no poda
silenciosa ni borrado de contexto obsoleto. Antes del límite, el operador revisa
la retención. La eliminación requiere autorización explícita del propietario y
una acción administrativa del host: detener todas las instancias, cerrar conexiones,
identificar esta ruta y sus WAL/SHM/backups, eliminar esos archivos exactos y retirar
su clave del proveedor y copias autorizadas. MCP/clean no ofrecen ese permiso.
La eliminación lógica no certifica sobrescritura de SSD; destruir todas las copias
de la clave es necesario para borrado criptográfico. Reaprovisionar exige otra acción
explícita; conservar unicidad global de aprobaciones sigue siendo responsabilidad
del gateway. No se certifica antirollback frente a restaurar ciphertext histórico.

Los únicos textos libres admitidos son título/descripción/criterios del borrador,
sin cookies, storageState, perfiles ni objetos de credenciales o tokens del gateway.
El host debe redactar secretos antes de introducir texto libre: no existe detector
universal de credenciales incrustadas en prosa. El requisito **aprobado** se guarda
según el modelo canónico R3; este cifrado no cambia la política de Knowledge.

## 12. Frontera humana

IHumanReviewGateway permanece separado de argumentos MCP. Un borrador durable no
es aprobación durable. No se persisten objetos de decisión, tokens ni permisos
reutilizables: solo el registro UUID/digest consumido y el estado resultante.
Antes de una confirmación nueva se vuelve a consultar el gateway y validar alcance,
decisión, digest, caducidad y disponibilidad/revocación. Corregir o reactivar cambia
el request, invalidando la decisión anterior. Los UUID consumidos de reject/defer
también se recuperan, evitando su reutilización para otro request tras reinicio.
Sigue siendo atestación del host, no autenticación criptográfica ni UI productiva.

## 13. Persistencia canónica

ExpectedRequirement confirmado y KnowledgeRelation de autorización se guardan
atómicamente con el planner y CAS de Knowledge. Sus revisiones y recibos originales
no se sustituyen al recuperar. Drafts no es una nueva fuente de autoridad; no hay
ConformityAssessment, promoción de observaciones ni relaciones de conversación.

## 14. Integración MCP

Misma herramienta qap_rules_set y ruta canonical_interview; next/propose/correct/
review/defer/resume adquieren persistencia opt-in. Conserva 18 herramientas,
cuatro declarativas/catorce legacy, sin fallback ni migración masiva de server.ts.
Las respuestas mantienen metadatos/digests, sin expandirlas con contenido sensible.
La configuración del store/key/protection queda exclusivamente en API del host.

## 15. Integración status

Lee almacenamiento real en cada consulta, incluso con proceso nuevo. Distingue
active_questions, deferred_questions, pending_proposals, corrected_proposals,
rejected_proposals, confirmed_requirements, draft_requirements, canonical_requirements,
confirmed_with_pending_correction, contexto obsoleto, recuperación y truncación.
Almacenamiento inaccesible devuelve unavailable y contadores unknown; no ceros
ficticios. Requisitos se consultan en página máxima de cien; proyección y lista
obsoleta acotadas anuncian truncated. Coverage continúa not_certified.

## 16. Pruebas físicas y reproducción

`durable-interview.test.ts`: 21 pruebas nuevas. Incluye seis procesos Node sucesivos
con SDK Client/Server/InMemoryTransport reales, conexión de Knowledge y Drafts
cerrada entre procesos: emitir → proponer → status → resume/review → confirmar por
decisión externa de fixture → retry sin gateway autorizado. Verifica texto exacto
solo desde el host, digest, contexto, versión, estado, requisito y recibo físicos.
La prueba importa dist/index.js; compilar MCP antes de ejecutar.

También verifica corrección/defer/resume/reject durables, dos conexiones con
conflicto de escritores/versiones, retry de propuesta idéntica, trigger de fallo
con rollback, exit(23) de un escritor antes de COMMIT, integrity_check, fallo de
borrador posterior al commit canónico y reconciliación sin segunda aprobación.
Seguridad: proyecto/app/entorno/sesión/módulo/revisión diferentes, ausencia/fallo/
revocación/expiración del gateway, digest alterado, clave incorrecta, ciphertext
corrupto, esquema ajeno, ruta ausente y uso único de rechazo después de reiniciar.
Canarios sintéticos pendientes ausentes de DB/WAL/SHM en claro y respuestas MCP;
sin cambios de lifecycle ni .qa/modules ficticios. R3 conserva sus 42 pruebas,
incluidas evidencia/observaciones, manipulación MCP y recibos canónicos.

Reproducción PowerShell desde packages/mcp (fixtures legacy deben quedar en su cwd):

```powershell
New-Item -ItemType Directory -Force node_modules/.tmp-vnext | Out-Null
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
..\..\node_modules\.bin\tsup.cmd
.\node_modules\.bin\vitest.cmd run --no-file-parallelism
```

HTTP/Chromium de discovery y suites legacy requieren ejecución local permitida;
el sandbox puede producir NETWORK_FAILED. Los binarios locales evitan que el
wrapper pnpm 12 intente verificar paquetes descargados durante la comprobación.
No se cambiaron dependencias ni lockfile.

Resultados finales (Windows, Node 24.15.0, SQLite 3.51.3):

| Verificación | Base R3 | R4 |
| --- | ---: | ---: |
| MCP completo, 18 archivos | 245/303 | **266/324**, 58 fallos |
| Nuevas R4 | — | **21/21** |
| Entrevista R3 | 42/42 | **42/42** |
| Discovery | 57/57 | **57/57** |
| Dispatcher + SDK | 46/46 | **46/46** |
| State handlers | 21/21 | **21/21** |
| Knowledge | 258/258 | **258/258** |
| Engine | 168/168 | **168/168** |
| Shared | 146/146 | **146/146** |
| Crawler | 30/30 | **30/30** |
| Builds | 10/10 | **10/10**, MCP/CLI finales recompilados |
| TypeScript amplio MCP | 47 | **47**, cero firmas añadidas/retiradas |
| ESLint server sin inline config | 513 | **513**, cuatro warnings conservados |

ESLint normal de todos los archivos afectados/nuevos, incluido server.ts: cero
errores/warnings. Sin supresiones nuevas ni cambios de configuración. TypeScript
se comparó con fuentes de la base mediante CompilerHost, normalizando solo
coordenadas y orden; sin diagnósticos nuevos en los archivos de entrega.

La primera suite con TEMP en la raíz del monorepo produjo 242/324: fixtures
legacy fuera del cwd autorizado del paquete añadieron 24 fallos. Corregir el
directorio temporal produjo 265/324 con un timeout adicional (5562 ms) del caso
legacy P4.2 Criterio 4.3 bajo ejecución paralela. La ejecución secuencial reprodujo
**266/324**, mismos 58 casos históricos, sin cambiar su código, aserciones o timeouts.
Knowledge dentro del sandbox produjo 255/258 por tres NETWORK_FAILED de sus
fixtures HTTP; fuera del sandbox pasó 258/258. El intento inicial de entrevista
R4 excedió los cinco segundos predeterminados al lanzar procesos Node separados;
esa prueba nueva declara treinta segundos para sus seis procesos (sin modificar
timeouts históricos). No se extrapolan estos resultados a suite global verde.

La correspondencia automática por archivo+título contra las 58 filas de R3 dio
58 coincidencias, cero casos adicionales, **21 A/32 B/5 D**. Los logs de ejecución
R4 revisados no contienen los canarios de propuesta ni error de almacenamiento.
Logs, informes JSON, bases, WAL/SHM, fixtures generados y dist permanecen fuera del
commit. La sesión protegida se conserva excluida; no se inspecciona su contenido
ni se calcula su hash. Entrega identificable con `git log --oneline 6568a16..HEAD`.

## 17. Compatibilidad

Sin dual-write YAML/SQLite, migración automática de borradores R3 inexistentes,
credenciales restauradas, reglas legacy modificadas ni cambios de lifecycle.
La única diferencia de versión MCP está explicitada en §7. No aumenta herramientas
ni certifica inventario completo por agotar preguntas.

## 18. Fallos históricos pendientes

Se conserva el inventario R01–R60 de R1 y la correspondencia individual de R3.
R08/R17 ya estaban recuperados; no son avances R4. Los 21 A y cinco D continúan
necesitando reconciliación/alcance independiente. Los 32 B siguen pendientes en
sus pruebas originales, sin sustituir aserciones por blocked ni reclamar cobertura.

Las nuevas garantías durables refuerzan parcialmente R01/R13 (status), R12
(concurrencia), R14/R34/R38/R40/R42/R44/R50 (recuperación, versiones y correcciones),
y R11/R29/R30/R39/R43/R45 (frontera/integridad). No equivalen a aprobar esos casos.
R02–R05/R27/R31/R60 continúan esperando contratos de cobertura/cierre; los demás
casos conservan la justificación individual de R3, sin repetir una auditoría general.

## 19. Limitaciones

Solo Windows/Node 24.15.0/SQLite 3.51.3 probados. No certificación de otros SO,
antirollback, backups/ACL ajenos, recuperación de clave perdida, worker, límite
duro de gateway o atomicidad transversal con lifecycle. Snapshot completo aumenta
espacio y bloquea escritores de todos los módulos del ámbito durante review.
Retención avanzada/rotación de clave requieren intervención confiable separada;
no hay purga ni migración automática. UI/identidad humana real sigue pendiente.
No se certifica suite global ni preparación productiva por un gateway de fixture.

## 20. Recomendación de continuidad

La continuidad de entrevistas puede usarse con backend/key/protección explícitos
del host. Antes de diseño productivo hacen falta operación de claves/retención y
UI humana reales; cobertura y cierre requieren diseño contractual independiente.
No iniciar VNEXT-014 ni presentarla como lista por esta entrega. Publicar lo
comprobado exclusivamente en la rama autorizada y detenerse.
