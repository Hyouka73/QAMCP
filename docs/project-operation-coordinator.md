# P0.3b-01A-R2-A-ENC — barrera de la etapa 1-A

El coordinador existente `acquireProjectOperation()` y el archivo del host
`project-operations.sqlite` son la barrera común de revocación y publicación
local. Esta etapa conserva los CAS de generación y las transacciones existentes.
No cierra D1-B, R4 ni la etapa 1 completa.

## Propiedad y dominio persistente

`ProjectOperationContext` es una prueba opaca registrada en un `WeakMap` privado.
Se verifica su identidad, dominio y vigencia antes de reutilizarla. La liberación
es idempotente e invalida la prueba antes de cerrar SQLite. Un objeto fabricado,
copiado, de otro dominio o ya liberado se rechaza.

`withProjectOperation()` propaga la propiedad mediante `AsyncLocalStorage`.
Las llamadas internas anidadas reutilizan el contexto y no abren otro lock.
El contexto no viaja por MCP ni se acepta desde argumentos de herramientas.
Los callbacks del host deben esperar todo su trabajo protegido antes de terminar.

ApplicationService guarda el dominio en `host_session_state`, bajo
`project_operation_domain:v1`. Las instancias y procesos que abren esa base leen
la misma vinculación antes de mutar y la verifican otra vez bajo el coordinador.
`projectOperationDirectory` configura explícitamente el dominio. La composición
del host, bootstrap y el helper administrativo vinculan el directorio real de
workspaces.

En uso independiente se registra inicialmente el directorio convencional del
host (`QAP_MCP_WORKSPACE_HOST_DIR`, o `QAP_MCP_HOST_DATA_DIR/workspaces`, o el
directorio predeterminado del usuario). La primera vinculación explícita toma
las barreras antigua y nueva antes de actualizar SQLite. Después se rechaza una
vinculación contradictoria con `project_operation_domain_mismatch`. Un escritor
que hubiera leído la vinculación anterior vuelve a comprobarla bajo la barrera.
No se sustituye el coordinador del workspace por un lock en el directorio de la
base de ApplicationService.

**Incompatibilidad explícita:** un callback público opaco de
`publishRootAuthorization()` no permite deducir dónde está su registro JSON.
Esa API exige un dominio explícitamente vinculado; sin él devuelve
`project_operation_domain_required` antes de invocar el callback. Un consumidor
con almacenamiento personalizado debe configurar `projectOperationDirectory`
o vincularlo con `bindProjectOperationDirectory()`. Un `PermissionAuthority`
independiente necesita también el dominio; la integración admitida es
`service.authority`. No se infiere otro lock a partir del path de su SQLite.

## APIs protegidas

- `PermissionAuthority.grant()`, `revokeGrant()` y `revokeProjectAccess()`.
- La actualización de expiración persistida que puede realizar `check()`.
- `completeRootDeletionCleanup()`, `recordRootAuthorizationGrant()`,
  `publishRootAuthorization()`, `revokeRootAuthorizationGrant()` y
  `clearResetTombstone()`.
- `createProject()`, `recoverDeletedProject()` y las fases locales de
  `confirmDelete()`, incluida la publicación de una nueva generación.
- `upsertProfile()`, `saveProfileSession()` y `expireProfileSession()`.
- `WorkspaceBootstrap.prepare()`: apertura/limpieza del almacenamiento Knowledge,
  commit inicial, scaffold `.qa`, identidad de ApplicationService, entorno y
  concesión inicial de acceso.
- La limpieza del registro de raíces por el servidor vuelve a comprobar la
  lápida dentro de la barrera; `acknowledgeProjectInitialization()` también
  participa. `ProjectReset` conserva su coordinador existente.

Bootstrap comprueba la lápida, el estado `deleting`, un reset pendiente y la
autoridad vigente dentro de su sección de publicación. Para una raíz con
historial exige la misma combinación de concesión publicada y entrada JSON que
ya exige el servidor. Una concesión de acceso revocada o expirada no se concede
de nuevo automáticamente al preparar un proyecto existente. Las reglas para
raíces sin historial no se amplían en esta etapa.

## Orden y esperas

El orden de publicación es coordinador del host → transacciones SQLite breves →
locks locales de Knowledge. La cola local de bootstrap solo programa trabajo;
no mantiene una transacción ni un mutex mientras espera admisión. La revisión
optimista inicial se comprueba después de adquirir la barrera y conserva los
conflictos de inicialización en revisión cero. Las preparaciones simultáneas de
una raíz ya inicializada con la misma URL comparten una sola publicación
protegida; así no repiten veinte veces el mismo I/O local.

El coordinador directo y bootstrap fallan sin espera si otro propietario los
ocupa. ApplicationService admite hasta 2.000 ms de contención para operaciones
locales breves; después lanza `ProjectOperationError`, con código recuperable y
`retryable: true`. Los adaptadores MCP convierten el conflicto en respuesta
bloqueada recuperable. El timeout se valida numéricamente antes de formar el
PRAGMA.

El servidor deja de conservar el lock durante toda una llamada MCP. Diálogos,
roots del cliente, navegador, red, drenaje de tareas y vault quedan fuera de la
sección protegida. `confirmDelete()` publica `deleting` bajo el coordinador,
libera antes del drenaje, vuelve a adquirir para snapshot/revocación, libera
antes del vault y vuelve a adquirir para la publicación final. Ninguna
transacción de ApplicationService queda abierta durante esas esperas.
Los usuarios concurrentes de los bindings del servidor se cuentan para cerrar
los handles cuando termina el último consumidor.

## Verificación y evidencia

La copia aislada `../../enc-stage1a-baseline` conserva el working tree previo,
incluido P1. Ambas versiones usan fuentes y artefactos propios de los paquetes;
las dependencias de terceros instaladas se reutilizan sin instalar paquetes.
El arnés de reproducción de la base está separado de su `dist` de producto.
No se modificaron expectativas de pruebas existentes.

La reproducción IPC pausa un `prepare()` real en su lectura Knowledge mientras
conserva la barrera. En la base la revocación confirma durante la pausa y una
preparación posterior vuelve a conceder acceso. En la versión modificada la
revocación responde `project_storage_busy`, el grant sigue activo durante la
pausa, el reintento revoca después de liberar y el siguiente bootstrap responde
`capability_access_revoked`.

Las nuevas pruebas usan mensajes IPC y la notificación `exit`, sin `sleep` para
probar orden. Comprueban los dos órdenes de adquisición, concesión y revocación
directas, revocación de raíz después de recuperación, reentrada sin deadlock,
contextos inválidos, escritor de generación atrasada, aislamiento A/B, muerte
del propietario y continuidad de B.

La corrida ampliada comparó 110 pruebas de base (65 PASS / 45 FAIL) con 117
pruebas modificadas (72 PASS / 45 FAIL): siete altas aprobadas, ninguna baja y
cero PASS→FAIL. Los 45 nombres fallidos coinciden. Build MCP ESM y DTS aprobado.
TypeScript completo conserva 142 diagnósticos en cada versión, sin diagnósticos
nuevos; su exit code sigue siendo 1 por los diagnósticos heredados.

Artefactos, comandos, resultados por identidad y fallos completos:
`../../enc-stage1a-evidence/`. El informe de entrega contiene los resultados de
la verificación focal final además de la corrida ampliada. Las corridas sin
tests ejecutados por restricciones de temporales se distinguen de los
resultados funcionales. No se investigó `NETWORK_FAILED`.

Se conservaron `.codex-test-temp` (bases, registros y restos de Stdio) y
`triage-p1-baseline` (fuentes, configuraciones y archivo de la comparación
anterior). No se leyó ni modificó `admin-user.json`, ni se hicieron commits,
pushes, merges o rebases.
