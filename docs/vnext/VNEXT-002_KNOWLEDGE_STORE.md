# VNEXT-002 — Puerto formal de conocimiento

Fecha: 2026-10-28. Alcance autorizado: contrato y pruebas; sin adaptador físico.

## Decisión de ubicación

Dependencias verificadas en manifests e imports: `engine → shared`; `knowledge → engine, shared`.
`FileSystemStorage`, `HistoryManager`, `IndexManager` y bootstrap consumen `IStorage` del
Engine; `document-detector` también importa una función de Engine en runtime. Situar el
nuevo puerto en knowledge obligaría a añadir `engine → knowledge`, cerrando un ciclo real.

El puerto pertenece al consumidor: `packages/engine/src/knowledge-store.port.ts`, exportado
por `ports.ts` y por la entrada pública de `@qap/engine`. Shared sigue siendo el paquete
de entidades canónicas sin dependencia de Engine. Alternativa: shared evitaría el ciclo,
pero mezclaría el contrato operativo del consumidor con los tipos de dominio sin necesidad.
No se reestructuraron paquetes ni se modificó `IStorage` o sus consumidores legacy.

## Contrato operativo y correspondencia con VNEXT-001

`KnowledgeEntities` reutiliza ApplicationContext, EnvironmentPolicy, RolePermissionScope,
los cuatro planos epistemológicos, DomainModule, DomainView, ActionTarget, FlowScenario y
MultimodalEvidenceRef. No duplica sus campos. Las reglas de negocio son requisitos con
`category: business_rule`; una hipótesis de regla sigue siendo AgentInference.

La propuesta anterior contenía nombres inexistentes en VNEXT-001 (DependencyDAG,
TestRun, TestStepExecution, DefectStatus, KnowledgeSnapshot y filtros sin definir). No se
convirtieron en promesas vacías. La única entidad auxiliar nueva es KnowledgeRelation,
una arista tipada entre referencias: VNEXT-001 no define una arista genérica canónica.
Las dependencias de módulos y prerrequisitos de flujos conservan su representación actual.

La API usa `get`, `query`, `history` y `commit`, con `kind` como discriminante tipado.
`query` permite filtrar enlaces salientes, incluidos los implícitos de las entidades
(por ejemplo inferencias por observación y evaluaciones por requisito). No ofrece todavía
búsqueda libre, filtrado arbitrario, telemetría ni planificación de pruebas.

| Operación | Semántica obligatoria |
| --- | --- |
| get | Aplicación + tipo + ID; última revisión o revisión explícita; ausente = null |
| query | Últimas revisiones ordenadas por ID; filtro opcional por referencia |
| history | Revisiones completas, ascendentes e inmutables, con procedencia |
| commit | Transacción serializable de 1–100 escrituras; todas o ninguna |

Cada aplicación es una frontera de proyecto. IDs iguales en aplicaciones distintas no
comparten información. Todas las referencias, incluso las de evaluaciones/evidencias que
carecen de application_id canónico, se resuelven dentro del alcance explícito. Esto no
implementa autorización multiusuario ni aislamiento multi-tenant de PostgreSQL.

## Concurrencia, historia y consistencia

- Creación: expected_revision = 0. Actualización: revisión actual exacta. Los conflictos
  rechazan todo el lote; no hay upsert ciego ni borrado. Un solo cambio por tipo/ID por lote.
- Observaciones y evaluaciones son hechos append-only: corregir mediante un nuevo ID y
  una relación. Las demás entidades generan una revisión nueva, incluso al revisar/retirar.
- KnowledgeTrace agrega procedencia, autor, fecha, motivo, revisión y contexto/evidencias
  a entidades que carecen de esos campos comunes. `reviewed` no significa requisito confirmado.
- `record.references` conserva las revisiones resueltas al confirmar la transacción. Una
  evaluación histórica sigue apuntando al requisito que evaluó aunque este cambie después.
- Se validan referencias contra el estado final del lote: se pueden crear padres e hijos
  juntos. Claves de módulo únicas, IDs/claves de dependencia sin ambigüedad, DAG de módulos,
  flujos precedentes y relaciones depends_on sin ciclos. Superseded_by debe resolver localmente.
- Páginas de 1–100 elementos (50 por defecto). Cursor opaco ligado a alcance/consulta/versión;
  cualquier commit en esa aplicación lo invalida. El cliente reinicia la consulta ante INVALID_CURSOR.
  Se eligió invalidación explícita para evitar prometer snapshots prolongados sin un adaptador.
- Errores tipados: INVALID_DATA, CONFLICT, REFERENCE_NOT_FOUND, INVALID_CURSOR,
  SCHEMA_MISMATCH y UNAVAILABLE. No incluir datos sensibles en mensajes.

## Invariantes y secretos

Se conservan los validadores canónicos de VNEXT-001: reproducibilidad no confirma requisitos;
legacy_manual_edit no implica certeza absoluta; indeterminate exige justificación. El
validador de requisitos exige confidence/confidence_score aunque ambos sean opcionales en
la interfaz canónica; los fixtures respetan esa restricción real sin cambiar shared.

El contrato requiere entrada JSON válida y saneada. Claves de credenciales y headers
sensibles conocidos se rechazan recursivamente; solo se conservan identificadores externos
de perfiles y sesiones. Evidencia multimodal debe declarar PII enmascarada. Ni la interfaz
ni el doble detectan secretos ocultos en texto, URLs, contenido codificado o binarios;
la ingesta debe redactarlos antes. `pii_masked: true` es una declaración del productor,
no una prueba de que se haya inspeccionado la evidencia. No se implementó una bóveda.

## Evolución y capacidades futuras

`contract_version: 1` identifica esta API, no una versión física de base de datos. Cambios
incompatibles requieren revisar/versionar el contrato. Inicialización, cierre, inspección
y migración del esquema físico pertenecen al adaptador/composición, fuera del puerto.
El adaptador debe rechazar un esquema incompatible con SCHEMA_MISMATCH antes de operar.

VNEXT-003 debe definir DDL, validación de formas de entrada no confiables, migraciones,
durabilidad, bloqueo/transacciones reales y manejo de fallos del driver. Debe ejecutar la
suite contractual contra bases temporales y añadir pruebas de reapertura, rollback físico,
concurrencia entre conexiones y compatibilidad de esquema. El doble solo verifica los
escenarios contractuales y usa validadores existentes más comprobaciones de forma mínimas;
no sustituye un esquema runtime completo de cada entidad.

FTS corresponde a VNEXT-004; bóveda a VNEXT-005. Telemetría y snapshots import/export
requieren contratos posteriores. JSON, IDs y revisiones mantienen neutralidad de driver,
pero no constituyen una implementación de exportación, sincronización o PostgreSQL.

## Verificación reproducible

En PowerShell desde la raíz del monorepo (el TEMP predeterminado del sandbox produjo EPERM
al renombrar caché SSR antes de ejecutar tests):

```powershell
New-Item -ItemType Directory -Force node_modules/.tmp-vnext | Out-Null
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
pnpm --filter @qap/shared --filter @qap/engine --filter @qap/knowledge test
pnpm build
pnpm exec eslint packages/engine/src/knowledge-store.port.ts packages/engine/src/__tests__/knowledge-store.contract.test.ts packages/engine/src/__tests__/mocks/knowledge-store.mock.ts
```

Resultados ejecutados: shared 145/145 (15 archivos), engine 168/168 (11 archivos,
incluye 24 nuevos contratos), knowledge 172/172 (20 archivos): **485 aprobadas, 0 fallidas**.
Compilación de los 10 paquetes exitosa. ESLint de los tres archivos nuevos: 0 errores/avisos.
No se afirma haber vuelto a ejecutar las 801 pruebas históricas del informe anterior.

Chequeo adicional `pnpm exec tsc --project packages/engine/tsconfig.json --noEmit`:
36 errores en seis archivos de tests legacy. Se copiaron los fuentes Engine de HEAD
ffb5031 a un directorio temporal ignorado, se resolvieron los mismos tipos shared/Vitest y
se repitió tsc: los diagnósticos fueron idénticos, normalizando únicamente la ruta temporal.
No hay errores TypeScript en los archivos nuevos. No se alteraron tests legacy para ocultarlos.

La suite prueba el doble en memoria; **no demuestra persistencia física**. El caché de sesión
del runner tenía un cambio previo y se excluye de esta entrega.
