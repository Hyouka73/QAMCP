# Evidencia física R4-R12

Código exacto **7ccf3db1a6f259f6a5c51521518bbb399a13fda2**, Windows x64/Node24.15.0/SQLite3.51.3. Fixtures nuevas aisladas; ningún código/test/expectativa del repo editado. Gateways y confirmaciones de helper solo prueban contratos de servicio: no revisión humana ni integrado auténtico.

## A04:24 negativos y límite del puerto

Cuatro acciones×seis posiciones: durante gateway de fixture (human-review etiqueta etapa, no humano real), antes de transaction, tras callback con snapshot editado, tras INSERT físico, wrapper await/setImmediate y contención de ClosureSQLite por otro proceso. Todos bloquean y conservan snapshot/ciphertext/historial/relaciones/lifecycle. Readback con otro store, recuperación de fences y nueva autorización válida posterior.

Contención: proceso distinto sostiene BEGIN IMMEDIATE, otra conexión observa BUSY, wrapper espera liberación y entra ya vencido. No se describe busy_timeout=0 como espera automática. After-insert decora db.prepare solo de instancia temporal para ejecutar stmt.run real y demorar síncronamente antes del guard final; after-callback espera dentro del operation original. Sin fake transaction. Contexto ALS no contamina llamada ordinaria posterior.

**W01 P2:** setInterval preexistente despacha transaction sin ALS. Cuatro aprobaciones vencidas durables; accept_gaps luego devuelve replay idempotente. Misma cola con AsyncLocalStorage.snapshot bloquea4/4. Repro íntegro wrapper.mjs, sin disable ALS ni fake store. PASS directo/preservador de contexto no es garantía universal de wrappers admitidos por firma del puerto. No se afirma ese scheduler en producción directa. **D01 P3:** al entrar vencido devuelve consistency_conflict, sin persistencia, por Error genérico transformado a write_failed.

## A06: replay y negativos

25variantes (3positivas/22negativas) y proyección solo lectura. Brechas reales Coverage, propuesta/razón/digestbase exactos; gateway de fixture independiente. Una/dosbrechas, respuesta descartada, store nuevo/readback. idempotent:true solo con mismo orden/razón/selección y aprobación/receipt/digest verificables. Negativos comparan contra recursos después de la mutación deliberada de fixture, no certifican legítima autoridad alterada. ID nuevo no aceptado puede pedir review, nunca éxito con autoridad previa.

Dos procesos replay: ambos mismo receipt,gateway0. Carrera primera aceptación: uno gana, otro context_changed; una autoridad y retry idempotente. Kill después de COMMIT de aceptación antes de respuesta mientras fences seguían tomados: autoridad1/historia1, tras stale11s replay sin gateway ni cierre/relación Knowledge nuevos. Legitimate-history-after-expiry comprueba autoridad legítimamente consumida; W01 demuestra que ese presupuesto no puede deducirse de todo receipt persistido.

## Regresión y recuperación

64aliases (4acciones×session/plan/phase/state×entry/after-callback×mismo/otroproceso),40fingerprint,junction,excepción,ordenlocks. Escritores oficiales esperan y recuperan; rawFS fuera del contrato no se declara protegido. A03:waive+waive,close+waive,módulosdistintos,conexiones/procesos,recibos/procedencia alterados,aprobación ausente/duplicada/digestdistinto. Cierres R9 conservan ciphertext/autoridad/lifecycle, módulo histórico identificado en prepare-old separado del resto R12.

Seis kills terminales (2acciones×3ventanas) recuperan con una aprobación/recibo/generación, sin ACID común. Bit de ciphertext alterado rechaza read y servicio lanza corrupt, sin respuesta normalizada. FTS5 real,cwd estable,conexión/proceso excluidos y recuperables. Rename/unlink EBUSY: no se logró sustitución/desaparición, no certificar otros SO ni identidad universal dev/ino. No tiempo real ante pausa OS después de último check.

## Salidas completas finales

### runtime-identity

```text
{"scenario":"runtime","node":"v24.15.0","platform":"win32","sqlite":"3.51.3","FTS5":true}
{"scenario":"relative-cwd","samePhysicalFile":true,"otherConnectionAndProcessBlocked":true,"recovered":true,"noStrayFile":true}
{"scenario":"file-identity","phase":"before","replacement":false,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"before","replacement":true,"renamed":false,"callback":false,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":false,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}
{"scenario":"file-identity","phase":"inside","replacement":true,"renamed":false,"callback":true,"code":"EBUSY","pathExists":true}
```

### expiry

```text
{"scenario":"deadline","action":"declare_non_applicable","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"declare_non_applicable","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"accept_gaps","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"close","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"human-review","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"before-transaction","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"after-callback","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"after-insert","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":true,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"wrapper-setImmediate","code":"closure_review_expired","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline","action":"waive","stage":"process-contention","code":"closure_consistency_conflict","snapshotHistoryReceiptsLifecycleUnchanged":true,"insertRolledBack":false,"fencesAndNewAuthorizationRecovered":true}
{"scenario":"deadline-context","expiredRejected":true,"ordinaryCallUnaffected":true}
```

### wrapper

```text
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"declare_non_applicable","status":"declared_non_applicable","approvalCommittedAfterExpiry":true,"msPastDeadline":65,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"accept_gaps","status":"gaps_accepted","approvalCommittedAfterExpiry":true,"replayOfExpiredCommit":true,"msPastDeadline":83,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"close","status":"closed","approvalCommittedAfterExpiry":true,"msPastDeadline":68,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":false,"action":"waive","status":"waived","approvalCommittedAfterExpiry":true,"msPastDeadline":72,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"declare_non_applicable","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":64,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"accept_gaps","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":61,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"close","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":56,"actualSqliteStoreAndIndependentReadback":true}
{"scenario":"port-preexisting-timer-queue","boundByAsyncLocalStorageSnapshot":true,"action":"waive","status":"blocked","code":"closure_review_expired","approvalCommittedAfterExpiry":false,"msPastDeadline":65,"actualSqliteStoreAndIndependentReadback":true}
```

### replay

```text
{"scenario":"gap-replay","variant":"exact-one","status":"gaps_accepted","idempotent":true,"originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"3eb7a134-3ace-490e-b8a6-bb0909f22d42","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"exact-two","status":"gaps_accepted","idempotent":true,"originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"c4f90dfc-1eb9-4739-9edc-10c98defa1f6","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"response-loss","status":"gaps_accepted","idempotent":true,"originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"e66fb65a-c391-4016-87e0-0ae90791e5f7","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"reason","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"f417e16b-c869-45a5-ba08-9793027888d4","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"new-id","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"07a7f1f9-d573-4946-89f1-7694a34c7824","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"duplicate-id","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"9c950ff7-ed76-40ef-87b6-1a4b8470c243","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"subset","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"db0c3756-727c-4815-8a67-44ae97e7b0b4","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"reverse-order","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"1cd4132c-718d-47e4-847d-09a9d3faa3f3","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"extra-id","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"327d5133-23e2-433f-9fd4-c95b7330c4b2","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"requirement-revision","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"215d0c37-77d1-44b3-ad65-bf50bf8997da","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"new-requirement","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"0da997c9-0d57-4afa-9a55-04fae2178ea5","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"session","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"dda6b8a5-5e11-48c5-a75d-efb69e56917d","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"phase","status":"blocked","code":"context_changed","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"a6309525-3142-4688-9561-d7cd236bed7c","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"plan","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"ffb7d78e-e958-42f9-941f-8cdc36481b1e","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"state","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"67bfe9e7-db5b-494d-b977-654528c94f2c","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"binding","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"6a8e4db6-320d-418e-a8a6-92be7291514c","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"module","status":"blocked","code":"unbound","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"513b5de0-c46d-4065-80ca-5821d6b82513","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"approval-duplicate","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"bec992ea-ae51-4750-bc38-e54435d2ad2f","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"approval-missing","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"73e54462-64e0-427f-b107-b2922b6dedf3","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"approval-digest","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"759c9674-d0fb-47c0-8f6c-f65a59e7f921","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"receipt-other-module","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"657b4e3d-0128-41eb-bf14-5e52613b9f1b","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"receipt-closure","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"b4a418c1-b5c6-430f-99a4-e4a56dfe309c","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"receipt-unknown","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"08a43f67-d294-483f-a284-068ede9d9bae","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"gap-duplicate","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"df430de7-ce08-46cb-80d3-cfbf5415dba6","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-replay","variant":"gap-reason","status":"blocked","code":"closure_gap_selection_invalid","originalGatewayCalls":1,"retryGatewayCalls":0,"receipt":"cbc8a82c-cdbb-40fb-9b86-e809f85d41af","authoritySnapshotHistoryLifecycleUnchanged":true}
{"scenario":"gap-projection-only","unchanged":true}
```

### replay-process

```text
{"scenario":"gap-two-processes","mode":"replay","results":[{"type":"result","status":"gaps_accepted","idempotent":true,"decision_id":"7f89c03e-e48f-4d19-a359-cea1148de7d2","calls":0},{"type":"result","status":"gaps_accepted","idempotent":true,"decision_id":"7f89c03e-e48f-4d19-a359-cea1148de7d2","calls":0}]}
{"scenario":"gap-process-recovery","mode":"replay","oneApprovalAcceptedGapHistory":true,"zeroClosureAndKnowledgeReceipts":true,"retryIdempotent":true}
{"scenario":"gap-two-processes","mode":"race","results":[{"type":"result","status":"blocked","code":"closure_context_changed","calls":1},{"type":"result","status":"gaps_accepted","decision_id":"e0746ccd-521e-423f-a21c-4abb9c1b1c4d","calls":1}]}
{"scenario":"gap-process-recovery","mode":"race","oneApprovalAcceptedGapHistory":true,"zeroClosureAndKnowledgeReceipts":true,"retryIdempotent":true}
{"scenario":"gap-process-recovery","mode":"crash","oneApprovalAcceptedGapHistory":true,"zeroClosureAndKnowledgeReceipts":true,"retryIdempotent":true}
```

### integrity

```text
{"scenario":"legitimate-history-after-expiry","idempotent":true,"unchanged":true}
{"scenario":"ciphertext-integrity","serviceThrows":"corrupt","corruptReadRefused":true,"noFalseAuthority":true}
```

### locks

```text
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"declare_non_applicable","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"declared_non_applicable"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"accept_gaps","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"gaps_accepted"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"close","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"closed"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"session","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"plan","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"phase","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"entry","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"entry","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"after-callback","mode":"same-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"alias-matrix","action":"waive","kind":"state","stage":"after-callback","mode":"child-process","singleSharedLock":true,"unchangedBeforePhysicalCommit":true,"recovered":true,"status":"waived"}
{"scenario":"junction-root","sameLock":true,"recovered":true}
{"scenario":"lock-exception","unchanged":true,"recoveredThroughAlias":true}
```

### terminal

```text
{"scenario":"durable-winner","alteration":"valid","result":{"status":"waived","idempotent":true,"decision_id":"138e1add-e433-4316-811c-3763325310fa","request_digest":"6cb565b65d7a83429e6d892432f5ed1abbe6cf74561d6beb5e6e28ef1d7c8e3d","coverage_digest":"1d610f1ebe73a7be4b4ba26ea9101a48369ff194b18a4c2da4b9c6102e02e7b7"},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-source","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-reason","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"trace-review","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"entity-source","result":{"status":"blocked","code":"closure_context_changed","razon":"La sesión o el módulo cambiaron antes del consentimiento."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-missing","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-digest","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"durable-winner","alteration":"approval-duplicate","result":{"status":"blocked","code":"invalid_durable_closure","razon":"El cierre concurrente no conserva autorización canónica válida."},"secondAuthorizationConsumed":false,"noNewReceiptHistoryOrTransition":true}
{"scenario":"distinct-modules","results":[{"status":"closed","decision_id":"abff9662-33a5-4a71-9849-233a96c63fa8","request_digest":"62ac9e64cc986b31c9d3a3dd9d1dbed5b087f96d3f9f4f450b20bdf0aeedb6f7","coverage_digest":"3a9d4763979741740410acc8aee83c5e62d285181550818ab790ee677da2d2d0","assessment":{"module_key":"catalog","module_id":"mod-catalog","module_revision":1,"application_id":"app-r5","environment_id":"local","assessed_at":"2026-11-05T18:21:28.157Z","assessed_by":"canonical_coverage_service","coverage_digest":"3a9d4763979741740410acc8aee83c5e62d285181550818ab790ee677da2d2d0","specification_coverage":{"status":"complete","applicable_categories_count":7,"satisfied_categories_count":7,"confirmed_requirements_count":7,"pending_requirements_count":0,"total_gaps_count":0,"unaddressed_gaps_count":0,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"security","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ui","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ux","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"regression","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"performance","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"}]},"review_coverage":{"status":"pending_review","reviewed_questions_count":7,"pending_questions_count":0,"decisions_count":0,"host_decisions":[]},"execution_coverage":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"gaps":[],"applicability_decisions":[],"closure_verdict":"ready_for_closure","blocker_reasons":[]}},{"status":"closed","decision_id":"b0c7c262-695f-4448-a4c8-f36912420cf5","request_digest":"599e991def99a46246524e357025a9ba0c1d2f87920b991518b869f0ebd42105","coverage_digest":"9b17b63203e832f01fbe21425dcf9cd6a78e7c74eab07745b01e6f94f26c1bfd","assessment":{"module_key":"billing","module_id":"mod-billing","module_revision":1,"application_id":"app-r5","environment_id":"local","assessed_at":"2026-11-05T18:21:28.160Z","assessed_by":"canonical_coverage_service","coverage_digest":"9b17b63203e832f01fbe21425dcf9cd6a78e7c74eab07745b01e6f94f26c1bfd","specification_coverage":{"status":"complete","applicable_categories_count":7,"satisfied_categories_count":7,"confirmed_requirements_count":7,"pending_requirements_count":0,"total_gaps_count":0,"unaddressed_gaps_count":0,"accepted_gaps_count":0,"category_statuses":[{"category":"functional","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"business_rule","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"security","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ui","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"ux","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"regression","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"},{"category":"performance","applicability":"applicable","confirmed_count":1,"pending_count":0,"gap_ids":[],"status":"satisfied"}]},"review_coverage":{"status":"pending_review","reviewed_questions_count":7,"pending_questions_count":0,"decisions_count":0,"host_decisions":[]},"execution_coverage":{"status":"not_executed","executed_count":0,"passed_count":0,"failed_count":0,"indeterminate_count":0,"note":"La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."},"gaps":[],"applicability_decisions":[],"closure_verdict":"ready_for_closure","blocker_reasons":[]}}],"approvals":2,"closures":["billing","catalog"],"receipts":2}
{"scenario":"distinct-module-retry","module":"catalog","result":{"status":"closed","idempotent":true,"decision_id":"abff9662-33a5-4a71-9849-233a96c63fa8","request_digest":"62ac9e64cc986b31c9d3a3dd9d1dbed5b087f96d3f9f4f450b20bdf0aeedb6f7","coverage_digest":"3a9d4763979741740410acc8aee83c5e62d285181550818ab790ee677da2d2d0"}}
{"scenario":"distinct-module-retry","module":"billing","result":{"status":"closed","idempotent":true,"decision_id":"b0c7c262-695f-4448-a4c8-f36912420cf5","request_digest":"599e991def99a46246524e357025a9ba0c1d2f87920b991518b869f0ebd42105","coverage_digest":"9b17b63203e832f01fbe21425dcf9cd6a78e7c74eab07745b01e6f94f26c1bfd"}}
{"scenario":"lost-response","action":"close","result":{"status":"closed","idempotent":true,"decision_id":"b5140180-1ae7-423a-be5e-b0f42c3bea04","request_digest":"d58cee3438595a9e2b74cc13448dca4343ffa0ec142e535553ac923fc84cde99","coverage_digest":"55a217bdcf6bfca1fa403851968ccce1a52d06b483a5110a998f67dc6b04b4d6"},"sameApprovalReceiptHistory":true}
{"scenario":"lost-response","action":"waive","result":{"status":"waived","idempotent":true,"decision_id":"81278b8f-33c2-4b1d-b58b-f68ab0c1894e","request_digest":"de1f198109c3cdf3a2839dcce3369dd3309c13735f7264ada9af9d237c8a4e4d","coverage_digest":"b6893b0cc460ce8432c87b4da1d15d3a4cba6ea68a867564c010358806bcea7e"},"sameApprovalReceiptHistory":true}
```

### crash

```text
{"scenario":"physical-kill-readback","stage":"before-commit","action":"close","approvals":0,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-closure","action":"close","approvals":1,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-receipt","action":"close","approvals":1,"receipts":1,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"before-commit","action":"waive","approvals":0,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-closure","action":"waive","approvals":1,"receipts":0,"lifecycle":"planned"}
{"scenario":"physical-kill-readback","stage":"after-receipt","action":"waive","approvals":1,"receipts":1,"lifecycle":"planned"}
{"scenario":"physical-kill-recovered","stage":"before-commit","action":"close","status":"closed","idempotent":false,"gatewayCalls":1,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"after-closure","action":"close","status":"closed","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"after-receipt","action":"close","status":"closed","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"closed"}
{"scenario":"physical-kill-recovered","stage":"before-commit","action":"waive","status":"waived","idempotent":false,"gatewayCalls":1,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
{"scenario":"physical-kill-recovered","stage":"after-closure","action":"waive","status":"waived","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
{"scenario":"physical-kill-recovered","stage":"after-receipt","action":"waive","status":"waived","idempotent":true,"gatewayCalls":0,"oneApprovalReceiptHistory":true,"projectedState":"waived"}
```

### context

```text
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"declare_non_applicable","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"accept_gaps","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"close","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"session","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"session","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"plan","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"plan","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"state","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"state","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"phase","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"phase","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"binding","stage":"gateway","code":"closure_context_changed","writerBlocked":false,"zeroAuthorization":true}
{"scenario":"context-matrix","action":"waive","kind":"binding","stage":"transaction-entry","code":"closure_consistency_conflict","writerBlocked":true,"zeroAuthorization":true}
{"scenario":"lock-order","events":["gateway-no-lock","lifecycle-request","lifecycle-held","knowledge-request","knowledge-held","closure-request","closure-callback","knowledge-release","lifecycle-release"],"completedWithoutDeadlock":true}
{"scenario":"unlink-open-file","code":"EBUSY","disappearanceNotAchieved":true}
```

### extra

```text
{"scenario":"historical-r9","terminal":"closed","authorityPreserved":true,"noNewApprovalReceiptHistoryOrTransition":true,"readback":true}
{"scenario":"historical-r9","terminal":"waived","authorityPreserved":true,"noNewApprovalReceiptHistoryOrTransition":true,"readback":true}
{"scenario":"r9-pending-applicability","digestUnchanged":true,"status":"declared_non_applicable"}
{"scenario":"rollback","action":"declare_non_applicable","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"accept_gaps","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"close","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"rollback","action":"waive","code":"closure_consistency_conflict","allAuthorizationStateUnchanged":true,"bothFencesReleased":true}
{"scenario":"official-process-lifecycle","alias":false,"writerCompletedDuringFence":false,"sessionDuringFence":"session-r5","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":false,"writerRecovered":true}
{"scenario":"official-process-lifecycle","alias":true,"writerCompletedDuringFence":false,"sessionDuringFence":"session-r5","samePhysicalRoot":true}
{"scenario":"official-process-recovery","alias":true,"writerRecovered":true}
{"scenario":"fifo-queued-consumer","progressAfterRelease":true}
```

### process

```text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"waived"},{"type":"result","status":"waived","idempotent":true}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"waived"},{"type":"result","status":"waived","idempotent":true}],"singleApprovalClosureReceipt":true,"retry":"waived","idempotent":true}
{"scenario":"accept-approval-reuse","code":"closure_consistency_conflict","snapshotUnchanged":true,"approvals":1}
```

### process-mixed

```text
{"scenario":"two-process-results-before-readback","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}]}
{"scenario":"two-physical-closure-processes","results":[{"type":"result","status":"waived","idempotent":true},{"type":"result","status":"waived"}],"singleApprovalClosureReceipt":true,"retry":"waived","idempotent":true}
```


## Scripts íntegros

Ejecutar desde SHAexacto con TEMP/TMP=node_modules/.tmp-vnext, ver COMANDOS. Rutas locales deben adaptarse a otro host. prepare deriva bundle de helpers de fixture de ese SHA y paquetes compilados, sin editar tests. prepare-old usa git show R9 solo para compatibilidad histórica. No es código productivo nuevo.

### prepare.mjs

```javascript
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve('C:/Users/Judirico/Documents/QAMCP/audit-r4-r10');
const req=createRequire(root+'/package.json');const tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
let fixture=readFileSync(root+'/packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
fixture=fixture.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
fixture+="\nexport {withClosureCommitDeadline,ClosureStoreError} from '../handlers/module-closure-store.js';";
fixture+='\nexport {fixture,makeDecision,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter,FileSystemStorage};';
await build({stdin:{contents:fixture,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r12/fixture.mjs'});
const stdio=readFileSync(root+'/docs/vnext/auditorias/VNEXT-014-R4-R7/COMANDOS.md','utf8').split('```javascript')[1].split('```')[0];
writeFileSync(root+'/packages/mcp/node_modules/.audit-r12/stdio.mjs',stdio);
```

### prepare-old.mjs

```javascript
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/audit-r4-r10';const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const old=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-coverage-service.ts'],{cwd:root,encoding:'utf8'});
const closure=execFileSync('git',['show','09c9ce276c9c328026de4236dadf0a85d8e94d21:packages/mcp/src/handlers/canonical-closure-service.ts'],{cwd:root,encoding:'utf8'});
for(const [name,contents] of [['old-coverage',old],['old-closure',closure]])await build({stdin:{contents,resolveDir:root+'/packages/mcp/src/handlers',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'/packages/mcp/node_modules/.audit-r12/'+name+'.mjs',plugins:[{name:'exact-old-coverage',setup(b){b.onLoad({filter:/canonical-coverage-service\.ts$/},()=>({contents:old,loader:'ts',resolveDir:root+'/packages/mcp/src/handlers'}));}}]});
```

### util.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage,withClosureCommitDeadline} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
export {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,DatabaseSync,withClosureCommitDeadline};
export const emit=x=>console.log(JSON.stringify(x)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const reason='Razón sintética aislada para auditar autoridad de brecha real';
export const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
export const clean=f=>{f.closureStore.close();f.store.close();};
export const command=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
export const history=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) payload FROM closure_history ORDER BY generation').all();}finally{d.close();}};
export const capture=async f=>({snapshot:f.closureStore.read(f.context),history:history(f),relations:await f.store.query('app-r5','relation'),lifecycle:readFileSync(f.lifecyclePath,'utf8')});
export const unchanged=async(f,b)=>{assert.deepEqual(await capture(f),b);const other=f.openClosureStore();try{assert.deepEqual(other.read(f.context),b.snapshot);}finally{other.close();}};
```

### runtime-identity.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync,statSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const opts={confirmedReqs:categories.map(category=>({category,title:category}))};
const clean=f=>{f.closureStore.close();f.store.close();};
const reason='Aceptación sintética aislada de la brecha existente por el revisor de prueba';
const command=async(f,action)=> action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const history=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) AS payload FROM closure_history ORDER BY generation').all();}finally{d.close();}};
const unchanged=(f,b,h)=>{assert.deepEqual(f.closureStore.read(f.context),b);assert.deepEqual(history(f),h);const s=f.openClosureStore();assert.deepEqual(s.read(f.context),b);s.close();};
const writer=path=>{const r=spawnSync(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);d.exec('PRAGMA busy_timeout=0');try{d.exec('BEGIN IMMEDIATE;ROLLBACK');console.log('WRITABLE')}catch(e){console.log('BLOCKED:'+e.errcode)}finally{d.close()}`,path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const db=new DatabaseSync(':memory:');db.exec('CREATE VIRTUAL TABLE probe USING fts5(text);INSERT INTO probe VALUES (\'audit\')');assert.equal(db.prepare("SELECT count(*) AS n FROM probe WHERE probe MATCH 'audit'").get().n,1);emit({scenario:'runtime',node:process.version,platform:process.platform,sqlite:db.prepare('SELECT sqlite_version() AS v').get().v,FTS5:true});db.close();
// Relative path pins original file; second adapter and independent process excluded, then recover.
const cwd=process.cwd(),f=await fixture();let relative;
try{mkdirSync(join(f.root,'other'));process.chdir(f.root);relative=new SqliteKnowledgeAdapter('canonical.sqlite',{busy_timeout_ms:0});process.chdir(join(f.root,'other'));await relative.withWriteFence('app-r5',async()=>{assert.equal(writer(f.knowledgePath),'BLOCKED:5');const second=new DatabaseSync(f.knowledgePath);second.exec('PRAGMA busy_timeout=0');assert.throws(()=>second.exec('BEGIN IMMEDIATE'));second.close();});assert.equal(writer(f.knowledgePath),'WRITABLE');assert.equal(existsSync(join(f.root,'other','canonical.sqlite')),false);emit({scenario:'relative-cwd',samePhysicalFile:true,otherConnectionAndProcessBlocked:true,recovered:true,noStrayFile:true});}finally{relative?.close();process.chdir(cwd);clean(f);}
// Actual rename/replacement on this Windows host, both before acquisition and while held.
for(const phase of ['before','inside'])for(const replacement of [false,true]){const f=await fixture();const moved=f.knowledgePath+'.moved';let renamed=false,callback=false,code;try{const swap=()=>{renameSync(f.knowledgePath,moved);renamed=true;if(replacement){const d=new DatabaseSync(f.knowledgePath);d.exec('CREATE TABLE marker(n)');d.close();}};if(phase==='before'){try{swap();}catch(e){code=e.code;}if(renamed){try{await f.store.withWriteFence('app-r5',async()=>{callback=true;});}catch(e){code=e.code;}assert.equal(callback,false);assert.equal(existsSync(f.knowledgePath),replacement);}}else{await f.store.withWriteFence('app-r5',async()=>{callback=true;try{swap();}catch(e){code=e.code;}if(renamed&&replacement)assert.equal(writer(f.knowledgePath),'WRITABLE');});}emit({scenario:'file-identity',phase,replacement,renamed,callback,code,pathExists:existsSync(f.knowledgePath),identity:renamed?{original:statSync(moved).ino,replacement:replacement?statSync(f.knowledgePath).ino:null}:undefined});}finally{clean(f);}}
```

### expiry.mjs

```javascript
import {spawn} from 'node:child_process';import {once} from 'node:events';
import {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,DatabaseSync,withClosureCommitDeadline,emit,sleep,all,command,clean,capture,unchanged} from './util.mjs';
const busy=ms=>{const stop=Date.now()+ms;while(Date.now()<stop){}};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const stage of ['human-review','before-transaction','after-callback','after-insert','wrapper-setImmediate','process-contention']){
 const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=await capture(f),original=f.closureStore.transaction.bind(f.closureStore);let deadline,inserted=false,child,release,hit=false;
 const gateway={reviewClosure:async r=>{deadline=Date.now()+500;const d={...makeDecision(r),expiresAt:new Date(deadline).toISOString()};if(stage==='human-review')await sleep(540);return d;}};
 if(stage==='before-transaction')f.closureStore.transaction=async(s,op)=>{await sleep(Math.max(0,deadline-Date.now()+40));hit=true;return original(s,op);};
 if(stage==='after-callback'||stage==='wrapper-setImmediate')f.closureStore.transaction=(s,op)=>original(s,async snapshot=>{const result=await op(snapshot);assert.equal(snapshot.approvals.length,1);hit=true;if(stage==='wrapper-setImmediate')await new Promise(r=>setImmediate(r));await sleep(Math.max(0,deadline-Date.now()+40));return result;});
 if(stage==='after-insert'){const db=f.closureStore.db,p=db.prepare.bind(db);db.prepare=sql=>{const stmt=p(sql);if(sql.startsWith('INSERT INTO closure_history')){const run=stmt.run.bind(stmt);stmt.run=(...args)=>{const v=run(...args);inserted=true;busy(Math.max(0,deadline-Date.now()+40));return v;};}return stmt;};}
 if(stage==='process-contention')f.closureStore.transaction=async(s,op)=>{child=spawn(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);d.exec('BEGIN IMMEDIATE');console.log('HELD');process.on('message',()=>{d.exec('ROLLBACK');d.close();process.disconnect();});`,f.closureStorePath],{stdio:['ignore','pipe','pipe','ipc']});const ended=once(child,'exit');await new Promise((r,j)=>{child.stdout.on('data',b=>{if(b.toString().includes('HELD'))r();});child.on('error',j);});const probe=new DatabaseSync(f.closureStorePath);probe.exec('PRAGMA busy_timeout=0');assert.throws(()=>probe.exec('BEGIN IMMEDIATE'));probe.close();await sleep(Math.max(0,deadline-Date.now()+40));child.send('release');await ended;hit=true;return original(s,op);};
 try{const r=await new CanonicalClosureService(f.store,f.context,f.closureStore,gateway).execute('catalog',cmd);assert.equal(r.status,'blocked');assert.ok(['closure_review_expired','closure_consistency_conflict'].includes(r.code));await unchanged(f,before);if(stage==='after-insert')assert.equal(inserted,true);await new FileSystemStorage({rootDir:f.root.toUpperCase()}).withLifecycleFence(async()=>{});await f.store.withWriteFence('app-r5',async()=>{});f.closureStore.transaction=original;const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);assert.notEqual(retry.status,'blocked');emit({scenario:'deadline',action,stage,code:r.code,snapshotHistoryReceiptsLifecycleUnchanged:true,insertRolledBack:inserted,fencesAndNewAuthorizationRecovered:true});}finally{if(child?.exitCode===null)child.kill();clean(f);}
}
// Context does not bleed into ordinary store calls, and delayed port decorators inherit ALS.
{const f=await fixture();try{await assert.rejects(()=>withClosureCommitDeadline(Date.now()-1,()=>f.closureStore.transaction(f.context,async s=>s.approvals.push(['expired','x']))),e=>e.code==='authorization_expired');assert.equal(f.closureStore.read(f.context).approvals.length,0);await f.closureStore.transaction(f.context,async s=>s.approvals.push(['isolated-fixture','x']));assert.equal(f.closureStore.read(f.context).approvals.length,1);emit({scenario:'deadline-context',expiredRejected:true,ordinaryCallUnaffected:true});}finally{clean(f);}}
```

### wrapper.mjs

```javascript
import {AsyncLocalStorage} from 'node:async_hooks';
import {assert,fixture,makeDecision,CanonicalClosureService,emit,sleep,all,command,clean,capture,unchanged} from './util.mjs';
// Host timer preexists execute(). No private deadline API is disabled.
for(const bound of [false,true])for(const action of ['declare_non_applicable','accept_gaps','close','waive']){
 const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=await capture(f),original=f.closureStore.transaction.bind(f.closureStore);let deadline;const queue=[];
 const pump=setInterval(()=>{const job=queue.shift();if(job)job();},10);
 f.closureStore.transaction=(scope,op)=>{const resume=bound?AsyncLocalStorage.snapshot():fn=>fn();return new Promise((resolve,reject)=>queue.push(()=>resume(()=>original(scope,async snapshot=>{const r=await op(snapshot);await sleep(Math.max(0,deadline-Date.now()+40));return r;}).then(resolve,reject))));};
 try{const r=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async request=>{deadline=Date.now()+500;return {...makeDecision(request),expiresAt:new Date(deadline).toISOString()};}}).execute('catalog',cmd);const snapshot=f.closureStore.read(f.context);let replay;
 if(bound){assert.equal(r.status,'blocked');assert.equal(r.code,'closure_review_expired');await unchanged(f,before);}else{assert.equal(snapshot.approvals.length,1);assert.notEqual(r.status,'blocked');assert.ok(Date.now()>deadline);const other=f.openClosureStore();assert.deepEqual(other.read(f.context),snapshot);other.close();if(action==='accept_gaps'){replay=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not review');}}).execute('catalog',cmd);assert.equal(replay.idempotent,true);}}
 emit({scenario:'port-preexisting-timer-queue',boundByAsyncLocalStorageSnapshot:bound,action,status:r.status,code:r.code,approvalCommittedAfterExpiry:!bound,replayOfExpiredCommit:replay?.idempotent,msPastDeadline:Date.now()-deadline,actualSqliteStoreAndIndependentReadback:true});
 }finally{clearInterval(pump);clean(f);}
}
```

### replay.mjs

```javascript
import {assert,fixture,makeDecision,CanonicalClosureService,FileSystemStorage,emit,all,command,clean,capture,unchanged,reason} from './util.mjs';
const negative=['reason','new-id','duplicate-id','subset','reverse-order','extra-id','requirement-revision','new-requirement','session','phase','plan','state','binding','module','approval-duplicate','approval-missing','approval-digest','receipt-other-module','receipt-closure','receipt-unknown','gap-duplicate','gap-reason'];
for(const variant of ['exact-one','exact-two','response-loss',...negative]){
 let calls=0,request;const f=await fixture({observationalReqs:[{category:'security',title:'Isolated pending requirement'}]});
 try{const cmd=await command(f,'accept_gaps');const assessment=(await f.coverageService.evaluate('catalog')).assessment;
 if(['exact-two','subset','reverse-order','extra-id'].includes(variant))cmd.accepted_gaps.push({gap_id:assessment.gaps[1].id,reason:reason+' segunda'});
 const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{calls++;request=structuredClone(r);return makeDecision(r);}});
 const first=await svc.execute('catalog',cmd);assert.equal(first.status,'gaps_accepted');assert.deepEqual(request.acceptedGaps,cmd.accepted_gaps);assert.equal(request.coverageDigest,assessment.coverage_digest);
 let retry=structuredClone(cmd),ctx=structuredClone(f.context),module='catalog';
 if(variant==='reason')retry.accepted_gaps[0].reason+=' diferente';
 if(variant==='new-id')retry.accepted_gaps[0].gap_id='nonexistent';
 if(variant==='duplicate-id')retry.accepted_gaps.push({...retry.accepted_gaps[0]});
 if(variant==='subset')retry.accepted_gaps.pop();
 if(variant==='reverse-order')retry.accepted_gaps.reverse();
 if(variant==='extra-id')retry.accepted_gaps.push({gap_id:assessment.gaps[2].id,reason});
 if(variant==='requirement-revision'||variant==='new-requirement'){const r=await f.store.get('app-r5','requirement','req-obs-1');await f.store.commit('app-r5',[{kind:'requirement',expected_revision:variant==='new-requirement'?0:r.revision,trace:r.trace,entity:{...r.entity,id:variant==='new-requirement'?'req-new':r.id,title:'Revision changed'}}]);}
 if(['session','phase','plan','state'].includes(variant))await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(l=>{if(variant==='session')l.session.id='new-session';if(variant==='phase')l.phase='WRAP_UP';if(variant==='plan')l.session.plan[0].path='/different';if(variant==='state')l.modules.catalog.state='observed';return l;});
 if(variant==='binding'){const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,trace:m.trace,entity:{...m.entity,title:'Revised module'}}]);ctx.moduleBindings[0].moduleRevision++;}
 if(variant==='module')module='billing';
 if(variant.startsWith('approval')||variant.startsWith('receipt')||variant.startsWith('gap-'))await f.closureStore.transaction(f.context,async s=>{const row=s.acceptedGaps.catalog[0],id=row.acceptance_receipt;if(variant==='approval-duplicate')s.approvals.push([...s.approvals[0]]);if(variant==='approval-missing')s.approvals=[];if(variant==='approval-digest')s.approvals[0][1]='altered';if(variant==='receipt-other-module')s.acceptedGaps.billing=[{...row}];if(variant==='receipt-closure')s.closures.billing={decisionId:id};if(variant==='receipt-unknown')row.acceptance_receipt='no-approval';if(variant==='gap-duplicate')s.acceptedGaps.catalog.push({...row});if(variant==='gap-reason')row.reason+=' tampered';});
 const before=await capture(f);let retryCalls=0;const other=f.openClosureStore();try{const r=await new CanonicalClosureService(f.store,ctx,other,{reviewClosure:async()=>{retryCalls++;return null;}}).execute(module,retry);const positive=['exact-one','exact-two','response-loss'].includes(variant);if(positive){assert.equal(r.status,'gaps_accepted');assert.equal(r.idempotent,true);assert.equal(r.decision_id,first.decision_id);assert.equal(retryCalls,0);}else assert.equal(r.status,'blocked');await unchanged(f,before);assert.equal(calls,1);emit({scenario:'gap-replay',variant,status:r.status,code:r.code,idempotent:r.idempotent,originalGatewayCalls:calls,retryGatewayCalls:retryCalls,receipt:first.decision_id,authoritySnapshotHistoryLifecycleUnchanged:true});}finally{other.close();}
 }finally{clean(f);}
}
// Projection-only reconstruction cannot mutate the encrypted snapshot or evaluator readback.
{const f=await fixture();try{const cmd=await command(f,'accept_gaps');await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);const before=await capture(f),normal=await f.coverageService.evaluate('catalog'),base=await f.coverageService.evaluate('catalog',{excludeStoredAcceptedGapIds:[cmd.accepted_gaps[0].gap_id]});assert.equal(base.assessment.gaps.find(g=>g.id===cmd.accepted_gaps[0].gap_id).status,'unaddressed');assert.equal(normal.assessment.gaps.find(g=>g.id===cmd.accepted_gaps[0].gap_id).status,'accepted');await unchanged(f,before);emit({scenario:'gap-projection-only',unchanged:true});}finally{clean(f);}}
```

### replay-process.mjs

```javascript
import {spawn} from 'node:child_process';import {once} from 'node:events';
import {assert,fixture,makeDecision,CanonicalClosureService,emit,sleep,command,clean,capture,unchanged} from './util.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.path),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});let calls=0;const tx=s.transaction.bind(s);if(m.mode==='crash')s.transaction=async(scope,op)=>{const r=await tx(scope,op);process.send({type:'parked'});setInterval(()=>{},1000);await new Promise(()=>{});return r;};try{const result=await new CanonicalClosureService(k,m.ctx,s,{reviewClosure:async r=>{calls++;if(m.mode==='replay')throw Error('replay must not call gateway');if(m.mode==='race'){process.send({type:'ready'});await new Promise(r=>release=r);}return makeDecision(r);}}).execute('catalog',m.cmd);process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent,decision_id:result.decision_id,calls});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const start=(f,cmd,mode)=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});let readyResolve,doneResolve;const ready=new Promise(r=>readyResolve=r),result=new Promise((r,j)=>{doneResolve=r;child.on('error',j);child.on('exit',c=>{if(c)j(Error('exit '+c));});}),exit=once(child,'exit');child.on('message',m=>{if(['ready','parked'].includes(m.type))readyResolve(m);if(['result','error'].includes(m.type))doneResolve(m);});child.send({type:'start',mode,path:f.knowledgePath,ctx:f.context,cmd,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});return {child,ready,result,exit};};
for(const mode of ['replay','race','crash']){const f=await fixture(),cmd=await command(f,'accept_gaps');const jobs=[];try{
 if(mode==='replay')assert.equal((await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd)).status,'gaps_accepted');
 const before=mode==='replay'?await capture(f):null;
 if(mode==='crash'){const j=start(f,cmd,mode);jobs.push(j);await j.ready;j.child.kill();await j.exit;assert.equal(f.closureStore.read(f.context).approvals.length,1);await sleep(11000);}else{jobs.push(start(f,cmd,mode),start(f,cmd,mode));if(mode==='race'){await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));}const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exit));assert.ok(results.some(r=>r.status==='gaps_accepted'));if(mode==='replay'){assert.ok(results.every(r=>r.idempotent===true&&r.calls===0));await unchanged(f,before);}emit({scenario:'gap-two-processes',mode,results});}
 const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(snap.acceptedGaps.catalog.length,1);assert.equal(Object.keys(snap.closures).length,0);const b=await capture(f);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('unexpected gateway');}}).execute('catalog',cmd);assert.equal(retry.idempotent,true);await unchanged(f,b);assert.equal(b.history.length,1);emit({scenario:'gap-process-recovery',mode,oneApprovalAcceptedGapHistory:true,zeroClosureAndKnowledgeReceipts:b.relations.items.length===0,retryIdempotent:true});
 }finally{for(const j of jobs)if(j.child.exitCode===null)j.child.kill();clean(f);}}
```

### integrity.mjs

```javascript
import {assert,fixture,makeDecision,CanonicalClosureService,DatabaseSync,emit,sleep,command,clean,capture,unchanged} from './util.mjs';
// Once legitimately consumed, expiry does not revoke historical receipt authority.
{let deadline;const f=await fixture();try{const cmd=await command(f,'accept_gaps');const first=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{deadline=Date.now()+500;return {...makeDecision(r),expiresAt:new Date(deadline).toISOString()};}}).execute('catalog',cmd);assert.equal(first.status,'gaps_accepted');await sleep(Math.max(0,deadline-Date.now()+40));const before=await capture(f);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('no new review');}}).execute('catalog',cmd);assert.equal(retry.idempotent,true);await unchanged(f,before);emit({scenario:'legitimate-history-after-expiry',idempotent:true,unchanged:true});}finally{clean(f);}}
// Actual GCM ciphertext alteration is refused by a freshly opened adapter.
{const f=await fixture();try{const cmd=await command(f,'accept_gaps');await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',cmd);const db=new DatabaseSync(f.closureStorePath),row=db.prepare('SELECT generation,payload FROM closure_history ORDER BY generation DESC LIMIT 1').get(),p=Buffer.from(row.payload);p[p.length-1]^=1;db.prepare('UPDATE closure_history SET payload=? WHERE generation=?').run(p,row.generation);db.close();const other=f.openClosureStore();try{assert.throws(()=>other.read(f.context),e=>e.code==='corrupt');const svc=new CanonicalClosureService(f.store,f.context,other,{reviewClosure:async()=>{throw Error('must not review corrupt authority');}});await assert.rejects(()=>svc.execute('catalog',cmd),e=>e.code==='corrupt');emit({scenario:'ciphertext-integrity',serviceThrows:'corrupt',corruptReadRefused:true,noFalseAuthority:true});}finally{other.close();}}finally{clean(f);}}
```

### locks.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,symlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs',import.meta.url).href;
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),emit=x=>console.log(JSON.stringify(x));
const mutate=(s,kind)=>{if(kind==='session')s.session.id='alias-writer';if(kind==='plan')s.session.plan[0].path='/alias-writer';if(kind==='phase')s.phase='WRAP_UP';if(kind==='state')s.modules.catalog.state='observed';return s;};
const reason='Razón sintética de prueba aislada para verificar la exclusión oficial';
const cmd=async(f,a)=>a==='accept_gaps'?{action:a,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:a==='declare_non_applicable'?{action:a,decisions:[{category:'performance',reason}]}:a==='waive'?{action:a,reason}:{action:a};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const kind of ['session','plan','phase','state'])for(const stage of ['entry','after-callback'])for(const mode of ['same-process','child-process']){
 const f=await fixture(action==='accept_gaps'?{}:all),command=await cmd(f,action),orig=f.closureStore.transaction.bind(f.closureStore);let pending,child,done=false,heldLocks,atCommit;
 const start=async()=>{const alias=f.root.toUpperCase();assert.equal(statSync(alias).ino,statSync(f.root).ino);
  if(mode==='same-process')pending=new FileSystemStorage({rootDir:alias}).updateLifecycleState(s=>mutate(s,kind)).then(()=>{done=true;});
  else{child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('START');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{(${mutate.toString()})(s,process.argv[2]);return s;});console.log('DONE');`,alias,kind],{stdio:['ignore','pipe','pipe']});let err='';child.stderr.on('data',b=>err+=b);const exited=once(child,'exit');await new Promise((res,rej)=>{child.stdout.on('data',b=>{if(b.toString().includes('START'))res();});child.on('error',rej);});pending=exited.then(([c])=>{assert.equal(c,0,err);done=true;});}
  await sleep(110);assert.equal(done,false);heldLocks=readdirSync(f.root+'/.qa/cache/locks').filter(x=>x.endsWith('.lock'));assert.equal(heldLocks.length,1);
 };
 f.closureStore.transaction=async(scope,op)=>{if(stage==='entry')await start();return orig(scope,async s=>{const result=await op(s);if(stage==='after-callback')await start();atCommit=JSON.parse(readFileSync(f.lifecyclePath));assert.equal(atCommit.session.id,'session-r5');assert.equal(atCommit.session.plan[0].path,'/');assert.equal(atCommit.phase,'WORKING');assert.equal(atCommit.modules.catalog.state,'planned');return result;});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command);assert.equal(result.status,{declare_non_applicable:'declared_non_applicable',accept_gaps:'gaps_accepted',close:'closed',waive:'waived'}[action]);await pending;assert.equal(done,true);assert.equal(f.closureStore.read(f.context).approvals.length,1);const ro=f.openClosureStore();assert.equal(ro.read(f.context).approvals.length,1);ro.close();emit({scenario:'alias-matrix',action,kind,stage,mode,singleSharedLock:true,unchangedBeforePhysicalCommit:true,recovered:true,status:result.status});}finally{if(child?.exitCode===null)child.kill();f.closureStore.close();f.store.close();}
}
// The canonical lock survives an atomic lifecycle replacement and resolves a root junction.
{const f=await fixture(),alias=f.root+'-junction';try{symlinkSync(f.root,alias,'junction');let done=false,p;await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{p=new FileSystemStorage({rootDir:alias}).updateLifecycleState(s=>mutate(s,'session')).then(()=>{done=true;});await sleep(110);assert.equal(done,false);});await p;assert.equal(done,true);emit({scenario:'junction-root',sameLock:true,recovered:true});}finally{f.closureStore.close();f.store.close();}}
// Exceptions release the shared lock without changing lifecycle or consuming authority.
{const f=await fixture(),before=readFileSync(f.lifecyclePath,'utf8');try{await assert.rejects(new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{throw Error('external lock fault');}));assert.equal(readFileSync(f.lifecyclePath,'utf8'),before);await new FileSystemStorage({rootDir:f.root.toUpperCase()}).withLifecycleFence(async()=>{});assert.equal(f.closureStore.read(f.context).approvals.length,0);emit({scenario:'lock-exception',unchanged:true,recoveredThroughAlias:true});}finally{f.closureStore.close();f.store.close();}}
```

### terminal.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x)),reason='Razón sintética sustantiva aislada para verificar concurrencia';
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))};
const history=f=>{const d=new DatabaseSync(f.closureStorePath);try{return d.prepare('SELECT generation,hex(payload) payload FROM closure_history').all();}finally{d.close();}};
const close=f=>{f.closureStore.close();f.store.close();};
// Two real adapters and two closure connections, with the loser already past its initial read.
for(const alteration of ['valid','trace-source','trace-reason','trace-review','entity-source','approval-missing','approval-digest','approval-duplicate']){
 const f=await fixture(),k=new SqliteKnowledgeAdapter(f.knowledgePath),s=f.openClosureStore();let loserReady,allowLoser;const ready=new Promise(r=>{loserReady=r;}),gate=new Promise(r=>{allowLoser=r;});let calls=0;
 const winner=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});
 const loser=new CanonicalClosureService(k,f.context,s,{reviewClosure:async r=>{calls++;loserReady();await gate;return makeDecision(r);}});
 try{const pending=loser.execute('catalog',{action:'waive',reason});await ready;assert.equal((await winner.execute('catalog',{action:'waive',reason})).status,'waived');
  if(alteration.startsWith('trace')||alteration==='entity-source'){const snap=f.closureStore.read(f.context),id='waiver:'+snap.closures.catalog.decisionId,r=await f.store.get('app-r5','relation',id),trace={...r.trace},entity=structuredClone(r.entity);if(alteration==='trace-source')trace.source='external_untrusted';if(alteration==='trace-reason')trace.reason='changed-request';if(alteration==='trace-review')trace.review='unreviewed';if(alteration==='entity-source'){const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:0,trace:m.trace,entity:{...m.entity,id:'different-module',key:'different'}}]);entity.source.id='different-module';}await f.store.commit('app-r5',[{kind:'relation',expected_revision:r.revision,trace,entity}]);}
  if(alteration.startsWith('approval'))await f.closureStore.transaction(f.context,async snap=>{if(alteration==='approval-missing')snap.approvals=[];if(alteration==='approval-digest')snap.approvals[0][1]='changed-digest';if(alteration==='approval-duplicate')snap.approvals.push([...snap.approvals[0]]);});
  const before=f.closureStore.read(f.context),h=history(f),life=readFileSync(f.lifecyclePath,'utf8'),relations=await f.store.query('app-r5','relation');allowLoser();const result=await pending;
  assert.equal(result.status,alteration==='valid'?'waived':'blocked');if(alteration==='valid')assert.equal(result.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.deepEqual(await f.store.query('app-r5','relation'),relations);assert.equal(calls,1);
  emit({scenario:'durable-winner',alteration,result,secondAuthorizationConsumed:false,noNewReceiptHistoryOrTransition:true});
 }finally{allowLoser();k.close();s.close();close(f);}
}
// Closing two distinct modules: capture any global-snapshot conflict without hiding it.
{const f=await fixture(all),k=new SqliteKnowledgeAdapter(f.knowledgePath),s=f.openClosureStore();try{const m=await f.store.get('app-r5','module','mod-catalog');await f.store.commit('app-r5',[{kind:'module',expected_revision:0,trace:m.trace,entity:{...m.entity,id:'mod-billing',key:'billing',title:'Billing'}}]);for(const r of (await f.store.query('app-r5','requirement')).items)await f.store.commit('app-r5',[{kind:'requirement',expected_revision:0,trace:r.trace,entity:{...r.entity,id:r.id+'-billing',module_key:'billing'}}]);
 const {FileSystemStorage}=await import('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs');await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(l=>{l.modules.billing={...l.modules.catalog};l.session.plan.push({module:'billing',path:'/billing'});return l;});const ctx=structuredClone(f.context);ctx.moduleBindings.push({...ctx.moduleBindings[0],plannedName:'billing',moduleId:'mod-billing',moduleKey:'billing'});let n=0,release;const gate=new Promise(r=>{release=r;}),gateway={reviewClosure:async r=>{if(++n===2)release();await gate;return makeDecision(r);}};
 const a=new CanonicalClosureService(f.store,ctx,f.closureStore,gateway),b=new CanonicalClosureService(k,ctx,s,gateway);const results=await Promise.all([a.execute('catalog',{action:'close'}),b.execute('billing',{action:'close'})]);const snap=f.closureStore.read(ctx);emit({scenario:'distinct-modules',results,approvals:snap.approvals.length,closures:Object.keys(snap.closures),receipts:(await f.store.query('app-r5','relation')).items.length});
 for(const [i,svc] of [a,b].entries()){const name=i?'billing':'catalog',r=await svc.execute(name,{action:'close'});emit({scenario:'distinct-module-retry',module:name,result:r});}assert.equal(Object.keys(f.closureStore.read(ctx).closures).length,2);
 }finally{k.close();s.close();close(f);}}
// Exact retry after a lost response preserves durable ciphertext/history and relation revision.
for(const action of ['close','waive']){const f=await fixture(all);try{const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});await svc.execute('catalog',action==='waive'?{action,reason}:{action});const before=f.closureStore.read(f.context),h=history(f),rels=await f.store.query('app-r5','relation'),life=readFileSync(f.lifecyclePath,'utf8');const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('unexpected second gateway');}}).execute('catalog',action==='waive'?{action,reason}:{action});assert.equal(result.idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(history(f),h);assert.deepEqual(await f.store.query('app-r5','relation'),rels);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);emit({scenario:'lost-response',action,result,sameApprovalReceiptHistory:true});}finally{close(f);}}
```

### crash.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs',import.meta.url).href;
const all={confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))},reason='Renuncia sintética aislada aprobada por gateway de prueba de recuperación';
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
process.on('message',async m=>{const k=new SqliteKnowledgeAdapter(m.path),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});const park=async()=>{process.send({type:'parked'});setInterval(()=>{},1000);await new Promise(()=>{});};const tx=s.transaction.bind(s),commit=k.commit.bind(k);
if(m.stage==='before-commit')s.transaction=(scope,op)=>tx(scope,async snap=>{const result=await op(snap);await park();return result;});
if(m.stage==='after-closure')s.transaction=async(scope,op)=>{const result=await tx(scope,op);await park();return result;};
if(m.stage==='after-receipt')k.commit=async(app,writes)=>{const result=await commit(app,writes);if(writes.some(w=>w.kind==='relation'))await park();return result;};
try{await new CanonicalClosureService(k,m.ctx,s,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',m.action==='close'?{action:'close'}:{action:'waive',reason:m.reason});process.send({type:'unexpected-return'});}catch(e){process.send({type:'error',message:e.message});}});`;
const jobs=[];
try{for(const action of ['close','waive'])for(const stage of ['before-commit','after-closure','after-receipt']){const f=await fixture(all),child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});const exited=once(child,'exit');let stderr='';child.stderr.on('data',b=>stderr+=b);const parked=new Promise((resolve,reject)=>{child.on('error',reject);child.on('message',m=>m.type==='parked'?resolve():reject(Error(JSON.stringify(m))));child.on('exit',c=>{if(c)reject(Error(stderr));});});jobs.push({f,child,exited,parked,action,stage});child.send({path:f.knowledgePath,key:f.closureKey.toString('base64'),ctx:f.context,action,stage,reason,options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});}
 await Promise.all(jobs.map(j=>j.parked));for(const j of jobs)j.child.kill();await Promise.all(jobs.map(j=>j.exited));
 for(const {f,stage,action} of jobs){const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,stage==='before-commit'?0:1);const n=(await f.store.query('app-r5','relation')).items.length;assert.equal(n,stage==='after-receipt'?1:0);console.log(JSON.stringify({scenario:'physical-kill-readback',stage,action,approvals:snap.approvals.length,receipts:n,lifecycle:JSON.parse(readFileSync(f.lifecyclePath)).modules.catalog.state}));}
 await new Promise(r=>setTimeout(r,11000));
 for(const {f,stage,action} of jobs){let calls=0;const svc=new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{calls++;assert.equal(stage,'before-commit');return makeDecision(r);}}),command=action==='close'?{action}:{action,reason};const result=await svc.execute('catalog',command);assert.equal(result.status,action==='close'?'closed':'waived');assert.equal(calls,stage==='before-commit'?1:0);const snap=f.closureStore.read(f.context),relations=await f.store.query('app-r5','relation');assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal(relations.items.length,1);const db=new DatabaseSync(f.closureStorePath);const generations=db.prepare('SELECT count(*) n FROM closure_history').get().n;db.close();assert.equal(generations,1);const again=await svc.execute('catalog',command);assert.equal(again.idempotent,true);assert.equal(calls,stage==='before-commit'?1:0);console.log(JSON.stringify({scenario:'physical-kill-recovered',stage,action,status:result.status,idempotent:result.idempotent===true,gatewayCalls:calls,oneApprovalReceiptHistory:true,projectedState:JSON.parse(readFileSync(f.lifecyclePath)).modules.catalog.state}));}
}finally{for(const {child,f} of jobs){if(child.exitCode===null)child.kill();f.closureStore.close();f.store.close();}}
```

### context.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {fixture,makeDecision,CanonicalClosureService,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const categories=['functional','business_rule','security','ui','ux','regression','performance'],all={confirmedReqs:categories.map(category=>({category,title:category}))};
const reason='Razón sintética sustantiva y aislada para verificar el contrato';
const command=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const emit=x=>console.log(JSON.stringify(x));const clean=f=>{f.closureStore.close();f.store.close();};
const mutate=(s,kind)=>{if(kind==='session')s.session.id='new';if(kind==='plan')s.session.plan[0].path='/new';if(kind==='state')s.modules.catalog.state='observed';if(kind==='phase')s.phase='WRAP_UP';return s;};
for(const action of ['declare_non_applicable','accept_gaps','close','waive'])for(const kind of ['session','plan','state','phase','binding'])for(const stage of ['gateway','transaction-entry']){const f=await fixture(action==='accept_gaps'?{}:all),cmd=await command(f,action),before=f.closureStore.read(f.context),life=readFileSync(f.lifecyclePath,'utf8');let writerBlocked=false;const mutation=async()=>{if(kind==='binding'){const m=await f.store.get('app-r5','module','mod-catalog');try{await f.store.commit('app-r5',[{kind:'module',expected_revision:m.revision,entity:{...m.entity,title:'Changed binding revision'},trace:m.trace}]);}catch(e){assert.equal(e.code,'UNAVAILABLE');writerBlocked=true;throw e;}}else if(stage==='gateway')await new FileSystemStorage({rootDir:f.root}).updateLifecycleState(s=>mutate(s,kind));else writeFileSync(f.lifecyclePath,JSON.stringify(mutate(JSON.parse(readFileSync(f.lifecyclePath)),kind)));};const original=f.closureStore.transaction.bind(f.closureStore);if(stage==='transaction-entry')f.closureStore.transaction=async(scope,op)=>{await mutation();return original(scope,op);};try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{if(stage==='gateway')await mutation();return makeDecision(r);}}).execute('catalog',cmd);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.equal((await f.store.query('app-r5','relation')).items.length,0);if(kind==='binding'&&stage==='transaction-entry')assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);emit({scenario:'context-matrix',action,kind,stage,code:result.code,writerBlocked,zeroAuthorization:true});}finally{clean(f);}}
// Instrument lock order with original methods, without introducing recursive acquisition.
{const f=await fixture(all),events=[];const life=FileSystemStorage.prototype.withLifecycleFence,knowledge=f.store.withWriteFence.bind(f.store),tx=f.closureStore.transaction.bind(f.closureStore);let fsHeld=false,kHeld=false;
 FileSystemStorage.prototype.withLifecycleFence=function(op){events.push('lifecycle-request');return life.call(this,async()=>{fsHeld=true;events.push('lifecycle-held');try{return await op();}finally{fsHeld=false;events.push('lifecycle-release');}});};
 f.store.withWriteFence=(app,op)=>{assert.equal(fsHeld,true);events.push('knowledge-request');return knowledge(app,async()=>{kHeld=true;events.push('knowledge-held');try{return await op();}finally{kHeld=false;events.push('knowledge-release');}});};
 f.closureStore.transaction=(scope,op)=>{assert.equal(fsHeld,true);assert.equal(kHeld,true);events.push('closure-request');return tx(scope,async s=>{events.push('closure-callback');return op(s);});};
 try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{assert.equal(fsHeld,false);assert.equal(kHeld,false);events.push('gateway-no-lock');return makeDecision(r);}}).execute('catalog',await command(f,'close'));assert.equal(result.status,'closed');emit({scenario:'lock-order',events,completedWithoutDeadlock:true});}finally{FileSystemStorage.prototype.withLifecycleFence=life;clean(f);}}
// Actual disappearance attempt is prevented by this Windows SQLite open handle.
{const f=await fixture();try{let code;try{unlinkSync(f.knowledgePath);}catch(e){code=e.code;}assert.ok(code);emit({scenario:'unlink-open-file',code,disappearanceNotAchieved:true});}finally{clean(f);}}
```

### extra.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,statSync,realpathSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService,SqliteKnowledgeAdapter,FileSystemStorage} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
import {CanonicalClosureService as OldClosure} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/old-closure.mjs';
const emit=x=>console.log(JSON.stringify(x));const close=f=>{f.closureStore.close();f.store.close();};
const categories=['functional','business_rule','security','ui','ux','regression','performance'];
const all={confirmedReqs:categories.map(category=>({category,title:category}))};
const reason='Razón sintética sustantiva y aislada para verificar el contrato';
const cmd=async(f,action)=>action==='accept_gaps'?{action,accepted_gaps:[{gap_id:(await f.coverageService.evaluate('catalog')).assessment.gaps.find(g=>g.status==='unaddressed').id,reason}]}:action==='declare_non_applicable'?{action,decisions:[{category:'performance',reason}]}:action==='waive'?{action,reason}:{action};
const hist=f=>{const d=new DatabaseSync(f.closureStorePath,{readOnly:true});try{return d.prepare('SELECT generation,hex(payload) AS payload FROM closure_history').all();}finally{d.close();}};
// Persisted R9 closures retain their existing authority and exact ciphertext/history under R10.
for(const terminal of ['closed','waived']){const f=await fixture(all);try{const old=new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)});assert.equal((await old.execute('catalog',await cmd(f,terminal==='closed'?'close':'waive'))).status,terminal);const before=f.closureStore.read(f.context),h=hist(f),relations=await f.store.query('app-r5','relation'),life=readFileSync(f.lifecyclePath,'utf8');assert.equal((await f.closureService.status('catalog')).state,terminal);assert.equal((await f.closureService.execute('catalog',{action:'close'})).idempotent,true);assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(hist(f),h);assert.deepEqual(await f.store.query('app-r5','relation'),relations);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);const reopened=f.openClosureStore();assert.deepEqual(reopened.read(f.context),before);reopened.close();emit({scenario:'historical-r9',terminal,authorityPreserved:true,noNewApprovalReceiptHistoryOrTransition:true,readback:true});}finally{close(f);}}
// A pending exact R9 applicability request retains its digest and can be independently authorized in R10.
{const f=await fixture();try{let request;await new OldClosure(f.store,f.context,f.closureStore,{reviewClosure:async r=>{request=r;return null;}}).execute('catalog',await cmd(f,'declare_non_applicable'));const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>{assert.equal(r.requestDigest,request.requestDigest);return makeDecision(request);}}).execute('catalog',await cmd(f,'declare_non_applicable'));assert.equal(result.status,'declared_non_applicable');emit({scenario:'r9-pending-applicability',digestUnchanged:true,status:result.status});}finally{close(f);}}
// Failure after operation has edited snapshot physically rolls back history/receipts/lifecycle, fences recover.
for(const action of ['declare_non_applicable','accept_gaps','close','waive']){const f=await fixture(action==='accept_gaps'?{}:all),command=await cmd(f,action),other=new SqliteKnowledgeAdapter(f.knowledgePath,{busy_timeout_ms:0}),before=f.closureStore.read(f.context),h=hist(f),life=readFileSync(f.lifecyclePath,'utf8'),original=f.closureStore.transaction.bind(f.closureStore);f.closureStore.transaction=(scope,op)=>original(scope,async snap=>{await op(snap);throw Error('external fault before physical commit');});try{const result=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async r=>makeDecision(r)}).execute('catalog',command);assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);assert.deepEqual(hist(f),h);assert.equal(readFileSync(f.lifecyclePath,'utf8'),life);assert.equal((await f.store.query('app-r5','relation')).items.length,0);await other.withWriteFence('app-r5',async()=>{});await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{});emit({scenario:'rollback',action,code:result.code,allAuthorizationStateUnchanged:true,bothFencesReleased:true});}finally{other.close();close(f);}}
// A separate physical process uses only the official update API, canonical spelling vs Windows case alias.
for(const alias of [false,true]){const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs',import.meta.url).href;let child,done=false,err='',started;try{await new FileSystemStorage({rootDir:f.root}).withLifecycleFence(async()=>{const root=alias?f.root.toUpperCase():f.root;assert.equal(statSync(root).ino,statSync(f.root).ino);assert.equal(statSync(root).dev,statSync(f.root).dev);child=spawn(process.execPath,['--input-type=module','-e',`import {FileSystemStorage} from ${JSON.stringify(url)};console.log('STARTED');await new FileSystemStorage({rootDir:process.argv[1]}).updateLifecycleState(s=>{s.session.id='official-process';return s;});console.log('DONE');`,root],{stdio:['ignore','pipe','pipe']});started=new Promise((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('STARTED'))resolve();if(b.toString().includes('DONE'))done=true;});child.on('error',reject);});child.stderr.on('data',b=>{err+=b;});await started;await new Promise(r=>setTimeout(r,300));emit({scenario:'official-process-lifecycle',alias,writerCompletedDuringFence:done,sessionDuringFence:JSON.parse(readFileSync(f.lifecyclePath)).session.id,samePhysicalRoot:true});assert.equal(done,false);});if(!done)await once(child,'exit');assert.equal(JSON.parse(readFileSync(f.lifecyclePath)).session.id,'official-process');emit({scenario:'official-process-recovery',alias,writerRecovered:true});}finally{if(child?.exitCode===null)child.kill();close(f);}}
// FIFO is not a bounded reentrant lock: do not hold it while awaiting itself. Observe boundedly, release outer.
{const f=await fixture();let entered=false,nested;try{await f.store.withWriteFence('app-r5',async()=>{nested=f.store.withWriteFence('app-r5',async()=>{entered=true;});await new Promise(r=>setTimeout(r,50));assert.equal(entered,false);});await nested;assert.equal(entered,true);emit({scenario:'fifo-queued-consumer',progressAfterRelease:true});}finally{close(f);}}
```

### process.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture(),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(()=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.some(r=>r.status==='waived'));const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}
// Reusing one actual approval ID for another existing gap cannot consume authority twice.
{const f=await fixture({gateway:{reviewClosure:async r=>({...makeDecision(r),approvalId:'isolated-single-use-approval'})}});try{const assessment=(await f.coverageService.evaluate('catalog')).assessment;const command=g=>({action:'accept_gaps',accepted_gaps:[{gap_id:g.id,reason:'Razón sustantiva sintética exacta para aceptar esta brecha existente'}]});assert.equal((await f.closureService.execute('catalog',command(assessment.gaps[0]))).status,'gaps_accepted');const before=f.closureStore.read(f.context);const result=await f.closureService.execute('catalog',command(assessment.gaps[1]));assert.equal(result.status,'blocked');assert.deepEqual(f.closureStore.read(f.context),before);emit({scenario:'accept-approval-reuse',code:result.code,snapshotUnchanged:true,approvals:before.approvals.length});}finally{f.closureStore.close();f.store.close();}}
```

### process-mixed.mjs

```javascript
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fixture,makeDecision,CanonicalClosureService} from '../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs';
const emit=x=>console.log(JSON.stringify(x));
const f=await fixture({confirmedReqs:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,title:category}))}),url=new URL('../audit-r4-r10/packages/mcp/node_modules/.audit-r12/fixture.mjs',import.meta.url).href;
const code=`import {SqliteKnowledgeAdapter,SqliteModuleClosureStore,CanonicalClosureService,makeDecision} from ${JSON.stringify(url)};
let release;process.on('message',async m=>{if(m.type==='go'){release();return;}if(m.type!=='start')return;const k=new SqliteKnowledgeAdapter(m.knowledgePath),s=new SqliteModuleClosureStore({...m.options,key:Buffer.from(m.key,'base64')});try{const svc=new CanonicalClosureService(k,m.context,s,{reviewClosure:async r=>{process.send({type:'ready'});await new Promise(resolve=>{release=resolve;});return makeDecision(r);}});const result=await svc.execute('catalog',m.action==='close'?{action:'close'}:{action:'waive',reason:'Renuncia sintética aislada aprobada por gateway del proceso de prueba'});process.send({type:'result',status:result.status,code:result.code,idempotent:result.idempotent});}catch(e){process.send({type:'error',message:e.message});}finally{s.close();k.close();process.disconnect();}});`;
const children=[];
try{const jobs=[0,1].map(idx=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe','ipc']});children.push(child);let readyResolve,resultResolve;const ready=new Promise(r=>{readyResolve=r;}),result=new Promise((resolve,reject)=>{resultResolve=resolve;child.on('error',reject);child.on('exit',c=>{if(c)reject(Error('child exit '+c));});});child.on('message',m=>{if(m.type==='ready')readyResolve();if(m.type==='result')resultResolve(m);if(m.type==='error')resultResolve(m);});child.send({type:'start',action:idx===0?'close':'waive',knowledgePath:f.knowledgePath,context:f.context,key:f.closureKey.toString('base64'),options:{projectRoot:f.root,applicationId:'app-r5',environmentId:'local',path:f.closureStorePath,protection:'host_private_directory_and_managed_key'}});const exited=once(child,'exit');return {child,ready,result,exited};});await Promise.all(jobs.map(j=>j.ready));jobs.forEach(j=>j.child.send({type:'go'}));const results=await Promise.all(jobs.map(j=>j.result));await Promise.all(jobs.map(j=>j.exited));emit({scenario:'two-process-results-before-readback',results});assert.ok(results.every(r=>r.status==='waived'||r.status==='closed'));assert.equal(results[0].status,results[1].status);const snap=f.closureStore.read(f.context);assert.equal(snap.approvals.length,1);assert.equal(Object.keys(snap.closures).length,1);assert.equal((await f.store.query('app-r5','relation')).items.length,1);const retry=await new CanonicalClosureService(f.store,f.context,f.closureStore,{reviewClosure:async()=>{throw Error('must not request new approval');}}).execute('catalog',{action:'close'});assert.equal(retry.idempotent,true);emit({scenario:'two-physical-closure-processes',results,singleApprovalClosureReceipt:true,retry:retry.status,idempotent:retry.idempotent});}finally{for(const c of children)if(c.exitCode===null)c.kill();f.closureStore.close();f.store.close();}
```
