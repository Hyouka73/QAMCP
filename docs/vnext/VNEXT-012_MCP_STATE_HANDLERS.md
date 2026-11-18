# VNEXT-012 — Handlers de información y estado

Fecha: 2026-10-30. Base: def1b015147d300b0f27552fa6d4b432b4b0d183.

## Inventario previo a implementación

- qap_status: targetPath opcional; devuelve inicialización, preflight, fase,
  entrevista siguiente, estadísticas, hallazgos y advertencias. Lee context.yaml,
  environments.yaml, índices, perfiles (sin sesiones), ejecuciones, lifecycle,
  reglas, vistas/selectores, candidatos y reportes. Inspecciona documentos y URLs
  locales y disponibilidad de binarios de navegador, sin lanzar navegador.
  Escribe scan.json durante ONBOARDING; se retirará esa escritura de estado.
- qap_clean: targetPath y force (default público true, implementación lo ignora).
  Borra locks sin comprobar vigencia y .qa recursivamente; devuelve éxito incluso
  sin inicialización. Un consumidor de prueba exige ausencia física de .qa.
  Incompatible con D-007: se bloqueará el reseteo general con explicación explícita.
  No existe selector público de caché segura ni inventario fiable de locks caducados.
- qap_context_set: objetivo/procedencia, roles, flujos, fuente de verdad,
  URL/entornos, confirmación y correcciones (también aliases accion/campos).
  Merge incremental con protección de source user; correcciones reemplazan listas;
  confirmación cambia procedencia legacy a user. Fuente documental puede inferir
  propuestas. Lee/escribe context.yaml, environments.yaml y cola de correcciones;
  actualiza lifecycle con transición ONBOARDING→SCOPING e historial de fase.
  No tiene equivalencia completa con ApplicationContext/EnvironmentPolicy/RBAC.

## Decisión de convivencia

Modelos coexistentes: YAML conserva negocio/onboarding. Knowledge se resuelve solo
por inyección explícita de store abierto + ruta real + application_id + entorno.
El host conserva apertura/cierre; los handlers no descubren ni crean bases.
No se proyectan objetivos, roles o flujos como requisitos, permisos o escenarios.
No hay dual-write YAML/SQLite ni promesa de transacción distribuida.

## Arquitectura y propiedad

**Completada con limitaciones.** Agente principal único. Exclusivamente VNEXT-012,
sin descubrimiento declarativo, Advisor, cambios del puerto v1 o del esquema físico.

`tool-catalog.ts` contiene el único catálogo de producción, trasladado sin cambios
de nombres, descripciones, inputSchema ni orden. `createMcpServer()` reserva los
15 nombres legacy restantes, registra StatusHandler, CleanHandler y ContextHandler,
añade las extensiones explícitas y sella el dispatcher. Una extensión no puede
registrar otra vez ninguno de los 18 nombres. Se conserva el mismo Server y prompts.

Las tres implementaciones funcionales se retiraron del switch. Los handlers
implementan IMcpToolHandler; no importan server.ts ni reenvían al switch. El servidor
inyecta la comprobación local del navegador y el helper de vistas a status; los
helpers compartidos de navegador, corrección y workspace viven en state-runtime.ts.
La ruta declarativa retorna directamente, incluso ante error, sin fallback legacy.
El catálogo MCP normal sigue teniendo 18 herramientas, en el orden histórico.

## Resolución de proyecto, identidad y almacenamiento

StateDependencies / ProjectKnowledgeBinding se exportan como tipos desde MCP:

```ts
const server = createMcpServer({
  projectRoots: [realProjectRoot],
  knowledgeBindings: [{
    projectRoot: realProjectRoot,
    applicationId: configuredApplicationId,
    environmentId: configuredEnvironmentId,
    store: alreadyOpenedKnowledgeStore,
  }],
});
```

El host configura y abre el store deliberadamente y lo cierra al finalizar su vida
útil. MCP toma copias de las vinculaciones/raíces; no abre ni cierra el store, no
busca extensiones de archivos y nunca llama al constructor SQLite desde status.
El tipo de almacenamiento se expresa por el puerto, no se deduce de targetPath.
ApplicationContext y EnvironmentPolicy deben existir en el application_id indicado.
Una ruta sin vínculo devuelve `unbound`; vínculo ambiguo, ID inválido, store cerrado
o fallo de acceso devuelve `unavailable`; entidades/política incompatibles devuelven
`incompatible`. Un mismo application_id no se admite para dos proyectos distintos
dentro de la configuración. No se inventan IDs ni se enumeran otras aplicaciones.
La configuración es una frontera de confianza del host, no autenticación/RBAC.

Por defecto, solo cwd y sus descendientes se autorizan para escritura; proyectos
externos requieren projectRoots explícito. Status puede inspeccionar otra ruta
absoluta existente en modo lectura. Se comparan rutas reales completas y se
rechazan targets que resuelven a otra ruta por symlink/junction. Se inspeccionan
los enlaces de .qa sin seguirlos y se rechazan hardlinks para operaciones de
escritura. Hasta 20.000 entradas bajo .qa; las rutas derivadas de módulos/sesiones
se validan como segmentos. Documentos deben permanecer dentro del proyecto y estar
acotados. No se escribe fuera de .qa. No se ofrece defensa completa contra TOCTOU
de otro proceso malicioso con la misma cuenta: para ese escenario se requiere
aislamiento del SO. Linux/macOS no certificados en esta entrega.

## Estado informativo y procedencia

Status conserva onboarding, fases, preguntas, preflight, stats legacy, hallazgos y
advertencias. Contexto legacy incompatible se declara con context_state y una
advertencia fija. Se retira la escritura de scan.json; FileSystemStorage deriva
lifecycle ausente sin escribir. La comprobación de navegador solo busca binarios,
sin abrir páginas ni adquirir datos. Se conserva la directiva de instalación.

La sección knowledge presenta identidad/revisiones de aplicación y entorno, estado
y cantidades realmente recuperadas de módulos, observaciones, inferencias y
evidencias. Una página por clase, máximo 100: complete=false indica truncamiento;
un fallo de consulta conserva las otras clases y devuelve available=null, nunca
cero como prueba de ausencia. state=partial distingue ese inventario incompleto.
Las lecturas del puerto son consistentes individualmente; no se promete snapshot
transversal ante concurrencia. coverage siempre indica inventario parcial.
No se deducen tests aprobados ni requisitos confirmados a partir de observaciones
o inferencias. Las cantidades legacy permanecen separadas de Knowledge.

provenance distingue IKnowledgeStore, archivos legacy, inspección del workspace y
preflight temporal. El inventario no certifica cobertura funcional completa.
SQLite puede actualizar marcas de lectura en SHM: preservar conocimiento no
significa que cada byte de SHM sea inmutable durante una consulta.

## Limpieza y diferencia observable frente al contrato histórico

Se conservan inputSchema, descripción y default force=true para poder comparar el
contrato histórico exactamente. **La semántica de éxito del reseteo NO es compatible.**
Toda solicitud de qap_clean representa un borrado general indistinguible de memoria
persistente y devuelve isError=true, status=blocked y el código fijo
persistent_memory_reset_not_authorized, con removed=[] y explicación. No devuelve
éxito falso, ni usa force como autorización destructiva. Rutas inválidas se rechazan
antes. Los errores nuevos no reflejan rutas o argumentos privados.

No existe una operación selectiva pública de caché en este contrato. No se elimina
ningún archivo: tampoco cachés, locks supuestamente caducados, estados de navegador,
configuración legacy o sesiones. No hay autoridad suficiente para probar la
propiedad/caducidad de esos recursos y distinguir activos o compartidos. Se preservan
SQLite/WAL/SHM, observaciones, inferencias, requisitos, evidencias, archivos personales,
bóvedas, perfiles y sesiones. No se añade delete/clearAll al puerto.

El test histórico server.test.ts que exige éxito y desaparición física de .qa
permanece intacto y falla deliberadamente por esta incompatibilidad autorizada.
La nueva suite verifica físicamente la preservación, no solo la respuesta JSON.

## Contexto, autoridad y modelos coexistentes

ContextHandler conserva el algoritmo de merge, fuentes user/prd/inferred, protección
contra downgrade de user, confirmación explícita del resumen, correcciones secuenciales,
reemplazo de listas corregidas, extracción documental heurística y transición de fase.
También admite listas por coma en las respuestas de corrección, con validación acotada.
Los campos históricos ignorados framework/app_type/project_name/auth y path de flujos
se admiten con tipos y límites, sin inventar un mapeo persistente para ellos.

Knowledge se consulta realmente para verificar aplicación/entorno. Una URL propuesta
que difiere de EnvironmentPolicy, o una discrepancia con base_url legacy existente,
bloquea antes de escribir YAML. No se modifica la política de entorno a partir de
una URL, ni se autorizan redes. Solo se acepta una URL HTTP(S) sin credenciales,
query o fragmento. environments como mapa no está implementado; se rechaza
expresamente en lugar del no-op silencioso histórico.

No hay proyección canónica automática: objetivos y flujos no tienen equivalencia
autoritativa con requisitos/escenarios; roles declarados no representan permisos ni
autenticación comprobados. No se vuelca context.yaml en metadata. ApplicationContext,
EnvironmentPolicy y RolePermissionScope permanecen intactos, con sus revisiones e
historia. Una confirmación user modifica únicamente la procedencia legacy, sin
promociones epistemológicas canónicas ni conversión de manually_edited a certeza 1.

No se ofrece creación de ApplicationContext por este handler. Su creación es
configuración deliberada del host. El contexto YAML puede crearse dentro de un
proyecto .qa inicializado; YAML corrupto no se reemplaza por defaults.

## Validación, concurrencia, publicación parcial y recuperación

Cada handler valida sus argumentos antes de ejecutar. Se acotan rutas, número de
roles/flujos, estructuras, tamaño total (64.000 caracteres JSON) y cadenas. Se
rechazan claves desconocidas, credenciales anidadas, URLs sensibles y referencias
documentales externas/ascendentes. source_of_truth permite solo sus campos conocidos.
No se registran args, contenido de YAML, excepciones ni stacks. Los fallos nuevos
usan códigos cerrados/sanitizados y nunca mensajes internos.
El texto libre de negocio permanece en YAML y en su historial privado; el contrato
de éxito de context_set sigue devolviendo ese contexto. No hay detector universal
de secretos en prosa. Metadata canario ya existente en Knowledge no se expone ni
genera revisiones nuevas al consultar o actualizar el contexto legacy.

Dentro de una instancia de ContextHandler las llamadas al mismo proyecto se
serializan; proyectos diferentes no comparten cola. Un lock exclusivo wx del
proyecto impide dos escritores cooperativos de distintas instancias. No se retiran
locks activos ni se adivina su caducidad. context_locked comunica el conflicto.
Las tres representaciones legacy se capturan al tomar el lock y se comparan antes
de publicar (CAS por contenido); un cambio externo produce legacy_conflict, sin
sobrescribirlo. Herramientas legacy ajenas no cooperativas siguen siendo un límite:
no se promete CAS atómico frente a una escritura ajena entre comparación y rename.

Se preparan context.yaml, environments.yaml y onboarding_corrections.json en RAM;
se valida contexto antes de escribirlos. El diario inmutable context-history/UUID.json
contiene before/after y hashes anteriores, dentro de la frontera privada legacy.
Se hace fsync del diario y de cada temporal antes del rename. Un marcador .committed
registra la finalización del lote de archivos. No es una transacción multiarchivo,
ni un protocolo distribuido; tampoco se promete durabilidad de directorios ante
corte eléctrico en todos los sistemas operativos.

Un fallo intermedio produce status=partial, persistence=partial y
legacy_publication_incomplete, sin ocultar los archivos ya publicados. Un diario sin
marcador bloquea la siguiente actualización con legacy_recovery_required. Su revisión
y recuperación son deliberadas: detener escritores, conservar copia del diario y
archivos, comparar cada ruta permitida con before/after, elegir restaurar o completar,
y resolver el diario solo tras verificar el resultado. **No hay replay/rollback
automático ni comando de recuperación nuevo**; no usar el diario como script ni
sobrescribir una tercera versión concurrente. Es una limitación explícita.

Después del lote YAML se actualiza lifecycle mediante su mecanismo existente. Si
falla, se devuelve partial/legacy_lifecycle_incomplete con persistence=committed;
una nueva llamada reevalúa la compuerta sobre el contexto confirmado. El historial
de contexto no crece para una actualización idéntica. Cancelación previa impide
ejecución; antes de publicar y entre archivos se comprueba AbortSignal. Un aborto
intermedio tiene las mismas garantías parciales que cualquier interrupción.

No se emiten commits canónicos desde context_set; por tanto, no se altera ni elude
expected_revision de IKnowledgeStore. CAS numérico, transacciones/rollback, historial
inmutable y referencias son garantías del adaptador existente, verificadas físicamente
con dos conexiones. No se atribuyen a una nueva transacción YAML/SQLite inexistente.

## Verificación y deuda comparable

Windows, Node 24.15.0; SDK MCP instalado 1.30.0. Directorios exclusivamente sintéticos
bajo node_modules/.tmp-vnext. Ninguna sesión personal utilizada.

- Suite MCP completa: **203/204** en 15 archivos. Único fallo: aserción histórica de
  borrado general en server.test.ts:425. No se cambió ni omitió esa prueba.
- Pruebas nuevas: **21/21**, llamadas reales Client/Server/InMemoryTransport a las
  tres herramientas; espías de propietarios comprueban una ejecución, duplicados,
  reservas, ausencia de fallback y snapshot histórico de 18 tools/prompts.
- Knowledge completo: **258/258** en 25 archivos. Engine **168/168** en 11;
  Shared **146/146** en 16. No se ejecutó ni certificó la suite global del monorepo.
- Diez builds aprobados; MCP y CLI recompilados tras los últimos ajustes.
- ESLint de todos los archivos de entrega: cero errores/warnings, sin supresiones
  nuevas ni cambios en eslint.config.mjs.
- TypeScript amplio: **48→48** diagnósticos heredados, cero añadidos y cero en archivos
  nuevos. Comparación CompilerHost con server/index originales de def1b01 en memoria,
  normalizando solo orden textual de uniones. No se afirma typecheck amplio verde.

ESLint server.ts con --no-inline-config:

| Regla @typescript-eslint/… | VNEXT-011 | VNEXT-012 |
| --- | ---: | ---: |
| no-base-to-string | 34 | 33 |
| no-explicit-any | 81 | 63 |
| no-unnecessary-type-assertion | 14 | 12 |
| no-unsafe-argument | 43 | 29 |
| no-unsafe-assignment | 203 | 155 |
| no-unsafe-call | 25 | 17 |
| no-unsafe-member-access | 381 | 298 |
| no-unsafe-return | 10 | 9 |
| require-await | 7 | 6 |
| **Total** | **798** | **622** |

Pruebas físicas: SQLite, WAL/SHM y archivos protegidos sobreviven a clean; aislamiento
de dos aplicaciones/proyectos; dos conexiones, conflicto CAS, historia, pin de
referencias, rollback SQL con trigger sintético, reapertura, integrity_check y
foreign_key_check. Canarios en argumentos, URL, YAML, carpetas protegidas, errores
y claves prohibidas no aparecen en errores/logs ni se copian a SQLite. Se simula
EACCES durante rename para verificar publicación parcial y rechazo de replay;
no se certifica una matriz de ACL del SO. Junction externo comprobado fuera del
sandbox (dentro devolvió EPERM). Navegador ausente verificado con dependencia local
de prueba; integración legacy de navegador real ejecutada en la suite completa.

Reproducción desde la raíz (binarios instalados, sin descarga):

```powershell
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
packages/mcp/node_modules/.bin/vitest.cmd run packages/mcp/src/__tests__ --fileParallelism=false
packages/knowledge/node_modules/.bin/vitest.cmd run packages/knowledge/test packages/knowledge/src/__tests__ --fileParallelism=false
packages/engine/node_modules/.bin/vitest.cmd run packages/engine/src/__tests__ --fileParallelism=false
packages/shared/node_modules/.bin/vitest.cmd run packages/shared/src/__tests__ --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit -p packages/mcp/tsconfig.json
node node_modules/eslint/bin/eslint.js packages/mcp/src/handlers packages/mcp/src/tool-catalog.ts packages/mcp/src/server.ts packages/mcp/src/index.ts packages/mcp/src/__tests__/state-handlers.test.ts
node node_modules/eslint/bin/eslint.js packages/mcp/src/server.ts --no-inline-config
```

El primer comando conserva el fallo de limpieza descrito; tsc amplio y lint sin
supresiones también terminan con error por deuda declarada. HTTP/junctions requieren
permisos del entorno de pruebas. Builds: CLI local tsup desde cada paquete, orden
shared/auth/engine/knowledge/playwright-adapter/git-adapter/playwright-runner/reporter/mcp/cli.
Logs y comparación temporal en node_modules/vnext012-*, excluidos de Git.

## Publicación y continuidad

Publicación exclusiva en feat/qap-vnext-architecture, sin force, merge, rebase,
publicación npm ni cambios en develop/main. Entrega: git log --oneline def1b01..HEAD.
La sesión protegida permanece fuera de staging y conserva hash Git de contenido
28e1b8dbec7ccf194440cc4158ec6072c9b9ade4. HEAD remoto base verificado con ls-remote.
Commit y HEAD remoto final se informan al entregar.

VNEXT-013 queda pendiente de autorización. Dispatcher y propiedad por herramienta
están preparados para otra migración explícita; ninguna adquisición black-box se
conecta en esta entrega. Detener después de publicar VNEXT-012.
