**Auditoría independiente de reparación. Fecha local: 2026-11-05 (America/Mexico_City). HEAD probado: 8f091626825ceb2fa3f1abdfb0732f0f3dad8e9c.**

# Verificación física focal

Los gateways, requisitos y decisiones son fixtures sintéticos rotulados; no representan revisión humana auténtica. Los arneses se construyeron desde los helpers del HEAD auditado, en node_modules, sin cambiar los tests ejecutados. Las intercalaciones delegan a lecturas reales y a FileSystemStorage.updateLifecycleState o SqliteKnowledgeAdapter.commit. No se falsificaron respuestas get/query. Los escenarios multiproceso importan los mismos adaptadores construidos desde el código auditado.

## A01 — lifecycle, fase y recuperación

| Escenario | Resultado físico |
| --- | --- |
| planned durante inventario | blocked/session_context_changed, planned conservado, WORKING, sin reporte |
| planned por otro Node | Igual; child exit 0 antes de continuar la lectura real |
| session.id concurrente | blocked/session_context_changed, conserva sesión concurrente y WORKING, sin reporte |
| phase → SCOPING concurrente | blocked/session_context_changed, SCOPING físico, sin éxito WRAP_UP ni reporte |
| transition.success=false | blocked/session_transition_rejected, WORKING, sin reporte |
| Error físico al publicar reporte | Destino es directorio real; rename devuelve EPERM en Windows; WORKING y sin archivo autoritativo |
| Excepción justo antes de commit | Reporte existe físicamente; WORKING; retry WRAP_UP, misma aprobación/recibo/historia |
| Hard exit 83 entre reporte y commit | Proceso Node termina dentro del callback de commit tras comprobar archivo; WORKING físico y reporte durable |
| Retry tras hard exit | Espera política stale de producción 10 s (sin modificar timeout); WRAP_UP, una aprobación, un recibo e historia de Closure intacta |
| Cierre normal | success/WRAP_UP físico, recibo auténtico, reporte separa ejecución no certificada |
| Retry después de WRAP_UP | blocked por fase; sin nueva aprobación ni duplicación. No se afirma respuesta success idempotente de session_close |

El rechazo de transición se fuerza únicamente en una copia del bundle externo de auditoría reemplazando su llamada transitionProject por success:false. Filesystem, SQLite y handler restante siguen reales. Es inyección explícita de una rama de error; no se afirma que esa transición imposible se produzca naturalmente tras los gates válidos. El cambio de fase concurrente sí usa un escritor oficial real y bloquea antes de la transición.

**Frontera inspeccionada:** commitLifecycleStateWithFence comparte el lock físico de updateLifecycleState; toma el lifecycle vigente, compara la serialización completa (sesión/plan/módulos/fase/historial), vuelve a evaluar canExitWorking y mantiene el lock al entrar en withWriteFence Knowledge. sessionReport vuelve a leer Closure y recibos bajo ese orden. Se compara la proyección completa y se comprueba transition.success, phase WRAP_UP y readback íntegro posterior al commit. commit es síncrono, temporal+rename y de un uso. Reconcile queda fuera de la frontera final y no reentra al lock durante finalización.

**Contención ensayada durante la segunda query requirement (reproyección final):** un hijo oficial lifecycle no completa antes de liberar el lock y su mutator observa WRAP_UP; el hijo Knowledge, preabierto antes del fence, intenta CAS durante el fence y recibe UNAVAILABLE. El recibo queda en revisión 1 con fuente auténtica, el cierre termina sin deadlock. El primer arnés esperaba CONFLICT y falló por observar UNAVAILABLE; se conservó el log y se corrigió solo la aserción externa. No fue un defecto de integridad ni una prueba productiva editada.

**Incumplimiento nuevo RES-REPAIR-C01 (P2):** otro proceso oficial toma withWriteFence antes del cierre. El servidor no consigue adquirir su fence y devuelve RPC -32603, Knowledge store: CONFLICT. No devuelve status=blocked/code específico. WORKING, ninguna publicación, aprobación/recibo/historia intactos; al liberar el hijo, retry produce WRAP_UP. El return de commitLifecycleStateWithFence sin await sale del try antes del rechazo asíncrono; el catch del handler no normaliza ese error. Esto falla un invariante de respuesta solicitado, aunque el bypass P1 quede cerrado.

No se certifica ACID entre dos SQLite y filesystem. Un reporte puede quedar publicado con lifecycle WORKING después de crash; la recuperación ensayada es por retry. No se certifican power loss, pausas arbitrarias del SO, POSIX, otros volúmenes ni escritores raw fuera del protocolo oficial. Ningún éxito observado quedó con WORKING/SCOPING físico.

## A02 — recibos y revisiones

Las mutaciones se intercalan en la segunda lectura física del recibo: la conciliación ya leyó el auténtico y la generación del reporte vuelve a leer el CAS modificado. Se verifica la última fila de knowledge_revisions mediante una conexión DatabaseSync readOnly independiente, además de las APIs. Los digests y procedencia reales de esas filas quedan en la evidencia embebida. Para cada CAS aceptado se ejecutan además reconcile y sessionReport directamente, y ambos rechazan con su error canónico correspondiente.

| Caso | Knowledge | Validación canónica / publicación |
| --- | --- | --- |
| trace.source falso | CAS aceptado, receipt revisión 2 | Rechazo; WORKING, sin reporte |
| source falso por otro Node | CAS aceptado en proceso independiente | Igual |
| target apunta a módulo existente | CAS aceptado | Igual |
| solo revisión del recibo cambia | CAS aceptado, contenido idéntico, revisión 2 | Igual; contrato exige revisión original 1 |
| source.revision=999 / target.revision=999 inexistentes | REFERENCE_NOT_FOUND; CAS rechazado | Recibo original intacto; cierre válido success/WRAP_UP. No se atribuye ese bloqueo al validador canónico |
| source.revision=2 existente | Se crea revisión real 2 del módulo y CAS real del recibo | CAS aceptado; validador rechaza, WORKING, sin reporte |
| target.revision=2 existente | Se crea revisión real 2 de aplicación y CAS real del recibo | Igual |
| digest/trace.reason distinto | CAS aceptado | Rechazo, sin reporte |
| binding moduleRevision/applicationRevision distinto | Recibo físico permanece auténtico | Rechazo; sin publicación |
| Recibo físicamente ausente | Segundo Knowledge real con aplicación/entorno/módulo, sin ninguna relation | sessionReport directo rechaza; reconcile reconstruye exactamente un recibo desde autoridad durable válida; reporte posterior válido |
| Recibo auténtico | Revisión 1, ámbito/identidades/procedencia/digest/revisor/review correctos | Cierre normal PASS |
| Retry legítimo | Sin CAS adicional ni nuevo gateway | Una aprobación/recibo, historial Closure idéntico |

Ambos métodos llaman al mismo validCanonicalReceipt. Exige application_id, kind/id/revisión 1, id de relación, related_to, source módulo/revisión, target aplicación/revisión, trace.source exacto closed/waived, reason=requestDigest, recorded_by=mcp_host, review=reviewed y evidence_refs array. La autorización durable se comprueba separadamente; un recibo jamás sustituye una aprobación. La revisión 2 intencionalmente válida en Knowledge no es válida como recibo original de este contrato.

## A03 — existing-only

Se construye v1 con las DDL/checksum v1 congeladas del schema oficial; no es un v2 con solo user_version cambiado. El v2 válido tiene scope/bindings reales de provision. Se incluye un falso v2 con marca/versiones/migraciones plausibles pero esquema ajeno para ejercitar la validación completa posterior al preflight.

| Fixture | Resultado startup | Bytes/hash/esquema/PRAGMA/sidecars después |
| --- | --- | --- |
| empty | rejected — Host Knowledge must be provisioned at schema v2 before startup. | Idénticos; 0 bytes; user_version=0, application_id=0; WAL/SHM ausentes antes y después |
| v1 | rejected — Host Knowledge must be provisioned at schema v2 before startup. | Idénticos; 49152 bytes; user_version=1, application_id=1363234891; WAL/SHM ausentes antes y después |
| valid-v2 | accepted | Idénticos; 73728 bytes; user_version=2, application_id=1363234891; WAL/SHM ausentes antes y después |
| incompatible | rejected — Host Knowledge must be provisioned at schema v2 before startup. | Idénticos; 8192 bytes; user_version=9, application_id=7; WAL/SHM ausentes antes y después |
| fake-v2 | rejected — Incompatible knowledge schema | Idénticos; 8192 bytes; user_version=2, application_id=1363234891; WAL/SHM ausentes antes y después |

Los cinco snapshots resultaron íntegramente idénticos. Estos fixtures son almacenes cerrados antes de startup; no se atribuye a esto una certificación de reemplazo de SQLite abierto ni de WAL caliente. El v2 auténtico arranca y se cierra correctamente; vacío/v1/incompatible/falso-v2 no se inicializan ni migran.

### Capturas de SQLite antes/después

~~~json
[
  {
    "scenario": "empty",
    "result": "rejected",
    "error": "Host Knowledge must be provisioned at schema v2 before startup.",
    "unchanged": true,
    "before": {
      "content": {
        "size": 0,
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "sqlite": {
        "version": {
          "user_version": 0
        },
        "applicationId": {
          "application_id": 0
        },
        "schema": []
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    },
    "after": {
      "content": {
        "size": 0,
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "sqlite": {
        "version": {
          "user_version": 0
        },
        "applicationId": {
          "application_id": 0
        },
        "schema": []
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    }
  },
  {
    "scenario": "v1",
    "result": "rejected",
    "error": "Host Knowledge must be provisioned at schema v2 before startup.",
    "unchanged": true,
    "before": {
      "content": {
        "size": 49152,
        "sha256": "eea77dd085ea9393fc45e3249a69406bde8e60ad33318325469f6f7bf8bbb420"
      },
      "sqlite": {
        "version": {
          "user_version": 1
        },
        "applicationId": {
          "application_id": 1363234891
        },
        "schema": [
          {
            "name": "knowledge_links",
            "type": "table",
            "sql": "CREATE TABLE knowledge_links (\n    application_id TEXT NOT NULL, source_kind TEXT NOT NULL, source_id TEXT NOT NULL,\n    source_revision INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal >= 0),\n    target_kind TEXT NOT NULL, target_id TEXT NOT NULL, target_revision INTEGER NOT NULL,\n    PRIMARY KEY(application_id, source_kind, source_id, source_revision, ordinal),\n    FOREIGN KEY(application_id, source_kind, source_id, source_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED,\n    FOREIGN KEY(application_id, target_kind, target_id, target_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED\n  ) STRICT"
          },
          {
            "name": "knowledge_links_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_delete BEFORE DELETE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_links_sealed",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_sealed BEFORE INSERT ON knowledge_links BEGIN\n    SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM knowledge_revisions r JOIN knowledge_scopes s USING(application_id)\n      WHERE r.application_id = NEW.application_id AND r.kind = NEW.source_kind AND r.id = NEW.source_id\n      AND r.revision = NEW.source_revision AND r.commit_version = s.version + 1)\n      THEN RAISE(ABORT, 'sealed knowledge references') END;\n  END"
          },
          {
            "name": "knowledge_links_target",
            "type": "index",
            "sql": "CREATE INDEX knowledge_links_target ON knowledge_links(application_id, target_kind, target_id, target_revision)"
          },
          {
            "name": "knowledge_links_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_update BEFORE UPDATE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations",
            "type": "table",
            "sql": "CREATE TABLE knowledge_migrations (\n    version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL,\n    integrity_result TEXT NOT NULL CHECK(integrity_result = 'ok'), cursor_key TEXT NOT NULL\n  ) STRICT"
          },
          {
            "name": "knowledge_migrations_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_delete BEFORE DELETE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_update BEFORE UPDATE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revision_order",
            "type": "index",
            "sql": "CREATE INDEX knowledge_revision_order ON knowledge_revisions(application_id, kind, id_order, revision)"
          },
          {
            "name": "knowledge_revision_sequence",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revision_sequence BEFORE INSERT ON knowledge_revisions BEGIN\n    SELECT CASE WHEN NEW.commit_version != (SELECT version + 1 FROM knowledge_scopes WHERE application_id = NEW.application_id)\n      THEN RAISE(ABORT, 'invalid commit version') END;\n    SELECT CASE WHEN NEW.revision != (SELECT coalesce(max(revision), 0) + 1 FROM knowledge_revisions\n      WHERE application_id = NEW.application_id AND kind = NEW.kind AND id = NEW.id)\n      THEN RAISE(ABORT, 'invalid revision sequence') END;\n    SELECT CASE WHEN NEW.kind IN ('observation', 'assessment') AND NEW.revision != 1\n      THEN RAISE(ABORT, 'append only fact') END;\n  END"
          },
          {
            "name": "knowledge_revisions",
            "type": "table",
            "sql": "CREATE TABLE knowledge_revisions (\n    application_id TEXT NOT NULL REFERENCES knowledge_scopes(application_id),\n    kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision > 0),\n    id_order BLOB NOT NULL,\n    commit_version INTEGER NOT NULL CHECK(commit_version > 0),\n    entity_json TEXT NOT NULL CHECK(json_valid(entity_json)),\n    trace_json TEXT NOT NULL CHECK(json_valid(trace_json)),\n    PRIMARY KEY(application_id, kind, id, revision)\n  ) STRICT"
          },
          {
            "name": "knowledge_revisions_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_delete BEFORE DELETE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revisions_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_update BEFORE UPDATE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_scopes",
            "type": "table",
            "sql": "CREATE TABLE knowledge_scopes (\n    application_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version >= 0)\n  ) STRICT"
          },
          {
            "name": "sqlite_autoindex_knowledge_links_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_revisions_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_scopes_1",
            "type": "index",
            "sql": null
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    },
    "after": {
      "content": {
        "size": 49152,
        "sha256": "eea77dd085ea9393fc45e3249a69406bde8e60ad33318325469f6f7bf8bbb420"
      },
      "sqlite": {
        "version": {
          "user_version": 1
        },
        "applicationId": {
          "application_id": 1363234891
        },
        "schema": [
          {
            "name": "knowledge_links",
            "type": "table",
            "sql": "CREATE TABLE knowledge_links (\n    application_id TEXT NOT NULL, source_kind TEXT NOT NULL, source_id TEXT NOT NULL,\n    source_revision INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal >= 0),\n    target_kind TEXT NOT NULL, target_id TEXT NOT NULL, target_revision INTEGER NOT NULL,\n    PRIMARY KEY(application_id, source_kind, source_id, source_revision, ordinal),\n    FOREIGN KEY(application_id, source_kind, source_id, source_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED,\n    FOREIGN KEY(application_id, target_kind, target_id, target_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED\n  ) STRICT"
          },
          {
            "name": "knowledge_links_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_delete BEFORE DELETE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_links_sealed",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_sealed BEFORE INSERT ON knowledge_links BEGIN\n    SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM knowledge_revisions r JOIN knowledge_scopes s USING(application_id)\n      WHERE r.application_id = NEW.application_id AND r.kind = NEW.source_kind AND r.id = NEW.source_id\n      AND r.revision = NEW.source_revision AND r.commit_version = s.version + 1)\n      THEN RAISE(ABORT, 'sealed knowledge references') END;\n  END"
          },
          {
            "name": "knowledge_links_target",
            "type": "index",
            "sql": "CREATE INDEX knowledge_links_target ON knowledge_links(application_id, target_kind, target_id, target_revision)"
          },
          {
            "name": "knowledge_links_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_update BEFORE UPDATE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations",
            "type": "table",
            "sql": "CREATE TABLE knowledge_migrations (\n    version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL,\n    integrity_result TEXT NOT NULL CHECK(integrity_result = 'ok'), cursor_key TEXT NOT NULL\n  ) STRICT"
          },
          {
            "name": "knowledge_migrations_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_delete BEFORE DELETE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_update BEFORE UPDATE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revision_order",
            "type": "index",
            "sql": "CREATE INDEX knowledge_revision_order ON knowledge_revisions(application_id, kind, id_order, revision)"
          },
          {
            "name": "knowledge_revision_sequence",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revision_sequence BEFORE INSERT ON knowledge_revisions BEGIN\n    SELECT CASE WHEN NEW.commit_version != (SELECT version + 1 FROM knowledge_scopes WHERE application_id = NEW.application_id)\n      THEN RAISE(ABORT, 'invalid commit version') END;\n    SELECT CASE WHEN NEW.revision != (SELECT coalesce(max(revision), 0) + 1 FROM knowledge_revisions\n      WHERE application_id = NEW.application_id AND kind = NEW.kind AND id = NEW.id)\n      THEN RAISE(ABORT, 'invalid revision sequence') END;\n    SELECT CASE WHEN NEW.kind IN ('observation', 'assessment') AND NEW.revision != 1\n      THEN RAISE(ABORT, 'append only fact') END;\n  END"
          },
          {
            "name": "knowledge_revisions",
            "type": "table",
            "sql": "CREATE TABLE knowledge_revisions (\n    application_id TEXT NOT NULL REFERENCES knowledge_scopes(application_id),\n    kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision > 0),\n    id_order BLOB NOT NULL,\n    commit_version INTEGER NOT NULL CHECK(commit_version > 0),\n    entity_json TEXT NOT NULL CHECK(json_valid(entity_json)),\n    trace_json TEXT NOT NULL CHECK(json_valid(trace_json)),\n    PRIMARY KEY(application_id, kind, id, revision)\n  ) STRICT"
          },
          {
            "name": "knowledge_revisions_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_delete BEFORE DELETE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revisions_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_update BEFORE UPDATE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_scopes",
            "type": "table",
            "sql": "CREATE TABLE knowledge_scopes (\n    application_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version >= 0)\n  ) STRICT"
          },
          {
            "name": "sqlite_autoindex_knowledge_links_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_revisions_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_scopes_1",
            "type": "index",
            "sql": null
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    }
  },
  {
    "scenario": "valid-v2",
    "result": "accepted",
    "unchanged": true,
    "before": {
      "content": {
        "size": 73728,
        "sha256": "fb5b6c4bcfb25fbd0c52f9d1732b19fbe34dfb2930cb51bf7c9a310b93411ea3"
      },
      "sqlite": {
        "version": {
          "user_version": 2
        },
        "applicationId": {
          "application_id": 1363234891
        },
        "schema": [
          {
            "name": "action_target_revision_insert",
            "type": "trigger",
            "sql": "CREATE TRIGGER action_target_revision_insert AFTER INSERT ON knowledge_revisions\n    WHEN NEW.kind = 'action_target' BEGIN\n    DELETE FROM action_target_search WHERE application_id = NEW.application_id AND id = NEW.id;\n    INSERT INTO action_target_search(application_id, id, revision, accessibility_label, selector, fallback_selectors, element_type)\n    VALUES (NEW.application_id, NEW.id, NEW.revision,\n      coalesce(json_extract(NEW.entity_json, '$.accessibility_label'), ''),\n      json_extract(NEW.entity_json, '$.selector'),\n      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.entity_json, '$.fallback_selectors')), ''),\n      json_extract(NEW.entity_json, '$.element_type'));\n  END"
          },
          {
            "name": "action_target_search",
            "type": "table",
            "sql": "CREATE TABLE action_target_search (\n    rowid INTEGER PRIMARY KEY, application_id TEXT NOT NULL, id TEXT NOT NULL,\n    revision INTEGER NOT NULL, kind TEXT NOT NULL DEFAULT 'action_target' CHECK(kind = 'action_target'),\n    accessibility_label TEXT NOT NULL, selector TEXT NOT NULL,\n    fallback_selectors TEXT NOT NULL, element_type TEXT NOT NULL,\n    UNIQUE(application_id, id),\n    FOREIGN KEY(application_id, kind, id, revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision)\n  ) STRICT"
          },
          {
            "name": "action_target_search_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER action_target_search_delete AFTER DELETE ON action_target_search BEGIN\n    INSERT INTO action_targets_fts(action_targets_fts, rowid, accessibility_label, selector, fallback_selectors, element_type)\n    VALUES ('delete', OLD.rowid, OLD.accessibility_label, OLD.selector, OLD.fallback_selectors, OLD.element_type);\n  END"
          },
          {
            "name": "action_target_search_insert",
            "type": "trigger",
            "sql": "CREATE TRIGGER action_target_search_insert AFTER INSERT ON action_target_search BEGIN\n    INSERT INTO action_targets_fts(rowid, accessibility_label, selector, fallback_selectors, element_type)\n    VALUES (NEW.rowid, NEW.accessibility_label, NEW.selector, NEW.fallback_selectors, NEW.element_type);\n  END"
          },
          {
            "name": "action_targets_fts",
            "type": "table",
            "sql": "CREATE VIRTUAL TABLE action_targets_fts USING fts5(accessibility_label, selector, fallback_selectors, element_type, content='action_target_search', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2')"
          },
          {
            "name": "action_targets_fts_config",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID"
          },
          {
            "name": "action_targets_fts_data",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_data'(id INTEGER PRIMARY KEY, block BLOB)"
          },
          {
            "name": "action_targets_fts_docsize",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB)"
          },
          {
            "name": "action_targets_fts_idx",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID"
          },
          {
            "name": "knowledge_links",
            "type": "table",
            "sql": "CREATE TABLE knowledge_links (\n    application_id TEXT NOT NULL, source_kind TEXT NOT NULL, source_id TEXT NOT NULL,\n    source_revision INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal >= 0),\n    target_kind TEXT NOT NULL, target_id TEXT NOT NULL, target_revision INTEGER NOT NULL,\n    PRIMARY KEY(application_id, source_kind, source_id, source_revision, ordinal),\n    FOREIGN KEY(application_id, source_kind, source_id, source_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED,\n    FOREIGN KEY(application_id, target_kind, target_id, target_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED\n  ) STRICT"
          },
          {
            "name": "knowledge_links_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_delete BEFORE DELETE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_links_sealed",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_sealed BEFORE INSERT ON knowledge_links BEGIN\n    SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM knowledge_revisions r JOIN knowledge_scopes s USING(application_id)\n      WHERE r.application_id = NEW.application_id AND r.kind = NEW.source_kind AND r.id = NEW.source_id\n      AND r.revision = NEW.source_revision AND r.commit_version = s.version + 1)\n      THEN RAISE(ABORT, 'sealed knowledge references') END;\n  END"
          },
          {
            "name": "knowledge_links_target",
            "type": "index",
            "sql": "CREATE INDEX knowledge_links_target ON knowledge_links(application_id, target_kind, target_id, target_revision)"
          },
          {
            "name": "knowledge_links_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_update BEFORE UPDATE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations",
            "type": "table",
            "sql": "CREATE TABLE knowledge_migrations (\n    version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL,\n    integrity_result TEXT NOT NULL CHECK(integrity_result = 'ok'), cursor_key TEXT NOT NULL\n  ) STRICT"
          },
          {
            "name": "knowledge_migrations_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_delete BEFORE DELETE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_update BEFORE UPDATE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revision_order",
            "type": "index",
            "sql": "CREATE INDEX knowledge_revision_order ON knowledge_revisions(application_id, kind, id_order, revision)"
          },
          {
            "name": "knowledge_revision_sequence",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revision_sequence BEFORE INSERT ON knowledge_revisions BEGIN\n    SELECT CASE WHEN NEW.commit_version != (SELECT version + 1 FROM knowledge_scopes WHERE application_id = NEW.application_id)\n      THEN RAISE(ABORT, 'invalid commit version') END;\n    SELECT CASE WHEN NEW.revision != (SELECT coalesce(max(revision), 0) + 1 FROM knowledge_revisions\n      WHERE application_id = NEW.application_id AND kind = NEW.kind AND id = NEW.id)\n      THEN RAISE(ABORT, 'invalid revision sequence') END;\n    SELECT CASE WHEN NEW.kind IN ('observation', 'assessment') AND NEW.revision != 1\n      THEN RAISE(ABORT, 'append only fact') END;\n  END"
          },
          {
            "name": "knowledge_revisions",
            "type": "table",
            "sql": "CREATE TABLE knowledge_revisions (\n    application_id TEXT NOT NULL REFERENCES knowledge_scopes(application_id),\n    kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision > 0),\n    id_order BLOB NOT NULL,\n    commit_version INTEGER NOT NULL CHECK(commit_version > 0),\n    entity_json TEXT NOT NULL CHECK(json_valid(entity_json)),\n    trace_json TEXT NOT NULL CHECK(json_valid(trace_json)),\n    PRIMARY KEY(application_id, kind, id, revision)\n  ) STRICT"
          },
          {
            "name": "knowledge_revisions_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_delete BEFORE DELETE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revisions_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_update BEFORE UPDATE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_scopes",
            "type": "table",
            "sql": "CREATE TABLE knowledge_scopes (\n    application_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version >= 0)\n  ) STRICT"
          },
          {
            "name": "sqlite_autoindex_action_target_search_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_links_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_revisions_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_scopes_1",
            "type": "index",
            "sql": null
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": {
          "size": 0,
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "shm": {
          "size": 32768,
          "sha256": "fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb"
        }
      }
    },
    "after": {
      "content": {
        "size": 73728,
        "sha256": "fb5b6c4bcfb25fbd0c52f9d1732b19fbe34dfb2930cb51bf7c9a310b93411ea3"
      },
      "sqlite": {
        "version": {
          "user_version": 2
        },
        "applicationId": {
          "application_id": 1363234891
        },
        "schema": [
          {
            "name": "action_target_revision_insert",
            "type": "trigger",
            "sql": "CREATE TRIGGER action_target_revision_insert AFTER INSERT ON knowledge_revisions\n    WHEN NEW.kind = 'action_target' BEGIN\n    DELETE FROM action_target_search WHERE application_id = NEW.application_id AND id = NEW.id;\n    INSERT INTO action_target_search(application_id, id, revision, accessibility_label, selector, fallback_selectors, element_type)\n    VALUES (NEW.application_id, NEW.id, NEW.revision,\n      coalesce(json_extract(NEW.entity_json, '$.accessibility_label'), ''),\n      json_extract(NEW.entity_json, '$.selector'),\n      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.entity_json, '$.fallback_selectors')), ''),\n      json_extract(NEW.entity_json, '$.element_type'));\n  END"
          },
          {
            "name": "action_target_search",
            "type": "table",
            "sql": "CREATE TABLE action_target_search (\n    rowid INTEGER PRIMARY KEY, application_id TEXT NOT NULL, id TEXT NOT NULL,\n    revision INTEGER NOT NULL, kind TEXT NOT NULL DEFAULT 'action_target' CHECK(kind = 'action_target'),\n    accessibility_label TEXT NOT NULL, selector TEXT NOT NULL,\n    fallback_selectors TEXT NOT NULL, element_type TEXT NOT NULL,\n    UNIQUE(application_id, id),\n    FOREIGN KEY(application_id, kind, id, revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision)\n  ) STRICT"
          },
          {
            "name": "action_target_search_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER action_target_search_delete AFTER DELETE ON action_target_search BEGIN\n    INSERT INTO action_targets_fts(action_targets_fts, rowid, accessibility_label, selector, fallback_selectors, element_type)\n    VALUES ('delete', OLD.rowid, OLD.accessibility_label, OLD.selector, OLD.fallback_selectors, OLD.element_type);\n  END"
          },
          {
            "name": "action_target_search_insert",
            "type": "trigger",
            "sql": "CREATE TRIGGER action_target_search_insert AFTER INSERT ON action_target_search BEGIN\n    INSERT INTO action_targets_fts(rowid, accessibility_label, selector, fallback_selectors, element_type)\n    VALUES (NEW.rowid, NEW.accessibility_label, NEW.selector, NEW.fallback_selectors, NEW.element_type);\n  END"
          },
          {
            "name": "action_targets_fts",
            "type": "table",
            "sql": "CREATE VIRTUAL TABLE action_targets_fts USING fts5(accessibility_label, selector, fallback_selectors, element_type, content='action_target_search', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2')"
          },
          {
            "name": "action_targets_fts_config",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID"
          },
          {
            "name": "action_targets_fts_data",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_data'(id INTEGER PRIMARY KEY, block BLOB)"
          },
          {
            "name": "action_targets_fts_docsize",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB)"
          },
          {
            "name": "action_targets_fts_idx",
            "type": "table",
            "sql": "CREATE TABLE 'action_targets_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID"
          },
          {
            "name": "knowledge_links",
            "type": "table",
            "sql": "CREATE TABLE knowledge_links (\n    application_id TEXT NOT NULL, source_kind TEXT NOT NULL, source_id TEXT NOT NULL,\n    source_revision INTEGER NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal >= 0),\n    target_kind TEXT NOT NULL, target_id TEXT NOT NULL, target_revision INTEGER NOT NULL,\n    PRIMARY KEY(application_id, source_kind, source_id, source_revision, ordinal),\n    FOREIGN KEY(application_id, source_kind, source_id, source_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED,\n    FOREIGN KEY(application_id, target_kind, target_id, target_revision)\n      REFERENCES knowledge_revisions(application_id, kind, id, revision) DEFERRABLE INITIALLY DEFERRED\n  ) STRICT"
          },
          {
            "name": "knowledge_links_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_delete BEFORE DELETE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_links_sealed",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_sealed BEFORE INSERT ON knowledge_links BEGIN\n    SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM knowledge_revisions r JOIN knowledge_scopes s USING(application_id)\n      WHERE r.application_id = NEW.application_id AND r.kind = NEW.source_kind AND r.id = NEW.source_id\n      AND r.revision = NEW.source_revision AND r.commit_version = s.version + 1)\n      THEN RAISE(ABORT, 'sealed knowledge references') END;\n  END"
          },
          {
            "name": "knowledge_links_target",
            "type": "index",
            "sql": "CREATE INDEX knowledge_links_target ON knowledge_links(application_id, target_kind, target_id, target_revision)"
          },
          {
            "name": "knowledge_links_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_links_update BEFORE UPDATE ON knowledge_links\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations",
            "type": "table",
            "sql": "CREATE TABLE knowledge_migrations (\n    version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL,\n    integrity_result TEXT NOT NULL CHECK(integrity_result = 'ok'), cursor_key TEXT NOT NULL\n  ) STRICT"
          },
          {
            "name": "knowledge_migrations_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_delete BEFORE DELETE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_migrations_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_migrations_update BEFORE UPDATE ON knowledge_migrations\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revision_order",
            "type": "index",
            "sql": "CREATE INDEX knowledge_revision_order ON knowledge_revisions(application_id, kind, id_order, revision)"
          },
          {
            "name": "knowledge_revision_sequence",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revision_sequence BEFORE INSERT ON knowledge_revisions BEGIN\n    SELECT CASE WHEN NEW.commit_version != (SELECT version + 1 FROM knowledge_scopes WHERE application_id = NEW.application_id)\n      THEN RAISE(ABORT, 'invalid commit version') END;\n    SELECT CASE WHEN NEW.revision != (SELECT coalesce(max(revision), 0) + 1 FROM knowledge_revisions\n      WHERE application_id = NEW.application_id AND kind = NEW.kind AND id = NEW.id)\n      THEN RAISE(ABORT, 'invalid revision sequence') END;\n    SELECT CASE WHEN NEW.kind IN ('observation', 'assessment') AND NEW.revision != 1\n      THEN RAISE(ABORT, 'append only fact') END;\n  END"
          },
          {
            "name": "knowledge_revisions",
            "type": "table",
            "sql": "CREATE TABLE knowledge_revisions (\n    application_id TEXT NOT NULL REFERENCES knowledge_scopes(application_id),\n    kind TEXT NOT NULL, id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision > 0),\n    id_order BLOB NOT NULL,\n    commit_version INTEGER NOT NULL CHECK(commit_version > 0),\n    entity_json TEXT NOT NULL CHECK(json_valid(entity_json)),\n    trace_json TEXT NOT NULL CHECK(json_valid(trace_json)),\n    PRIMARY KEY(application_id, kind, id, revision)\n  ) STRICT"
          },
          {
            "name": "knowledge_revisions_delete",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_delete BEFORE DELETE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_revisions_update",
            "type": "trigger",
            "sql": "CREATE TRIGGER knowledge_revisions_update BEFORE UPDATE ON knowledge_revisions\n      BEGIN SELECT RAISE(ABORT, 'immutable knowledge'); END"
          },
          {
            "name": "knowledge_scopes",
            "type": "table",
            "sql": "CREATE TABLE knowledge_scopes (\n    application_id TEXT PRIMARY KEY, version INTEGER NOT NULL CHECK(version >= 0)\n  ) STRICT"
          },
          {
            "name": "sqlite_autoindex_action_target_search_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_links_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_revisions_1",
            "type": "index",
            "sql": null
          },
          {
            "name": "sqlite_autoindex_knowledge_scopes_1",
            "type": "index",
            "sql": null
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": {
          "size": 0,
          "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        },
        "shm": {
          "size": 32768,
          "sha256": "fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb"
        }
      }
    }
  },
  {
    "scenario": "incompatible",
    "result": "rejected",
    "error": "Host Knowledge must be provisioned at schema v2 before startup.",
    "unchanged": true,
    "before": {
      "content": {
        "size": 8192,
        "sha256": "a6991146e5f27ec0a82bb38a0fa37c72b29bafaa2ef7d88dc012248a5d53d6cd"
      },
      "sqlite": {
        "version": {
          "user_version": 9
        },
        "applicationId": {
          "application_id": 7
        },
        "schema": [
          {
            "name": "foreign_data",
            "type": "table",
            "sql": "CREATE TABLE foreign_data (value TEXT)"
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    },
    "after": {
      "content": {
        "size": 8192,
        "sha256": "a6991146e5f27ec0a82bb38a0fa37c72b29bafaa2ef7d88dc012248a5d53d6cd"
      },
      "sqlite": {
        "version": {
          "user_version": 9
        },
        "applicationId": {
          "application_id": 7
        },
        "schema": [
          {
            "name": "foreign_data",
            "type": "table",
            "sql": "CREATE TABLE foreign_data (value TEXT)"
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    }
  },
  {
    "scenario": "fake-v2",
    "result": "rejected",
    "error": "Incompatible knowledge schema",
    "unchanged": true,
    "before": {
      "content": {
        "size": 8192,
        "sha256": "b5b08cc5fce0d6accd93e61b52c6f4f3b2f37a72c7930e2da6f8d1de66cc52c7"
      },
      "sqlite": {
        "version": {
          "user_version": 2
        },
        "applicationId": {
          "application_id": 1363234891
        },
        "schema": [
          {
            "name": "knowledge_migrations",
            "type": "table",
            "sql": "CREATE TABLE knowledge_migrations (version INTEGER,integrity_result TEXT)"
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    },
    "after": {
      "content": {
        "size": 8192,
        "sha256": "b5b08cc5fce0d6accd93e61b52c6f4f3b2f37a72c7930e2da6f8d1de66cc52c7"
      },
      "sqlite": {
        "version": {
          "user_version": 2
        },
        "applicationId": {
          "application_id": 1363234891
        },
        "schema": [
          {
            "name": "knowledge_migrations",
            "type": "table",
            "sql": "CREATE TABLE knowledge_migrations (version INTEGER,integrity_result TEXT)"
          }
        ]
      },
      "sidecarsBefore": {
        "wal": null,
        "shm": null
      },
      "sidecarsAfterRead": {
        "wal": null,
        "shm": null
      }
    }
  }
]
~~~

## Resultados de las sondas externas

Las rutas temporales y los digests son de fixtures de auditoría; no se incluyen claves ni contenido de sesiones personales. Las filas físicas incluyen trace_json y entity_json para comprobar CAS y referencias.

~~~json
[
  {
    "scenario": "normal",
    "result": "PASS",
    "response": {
      "status": "success",
      "directorio_objetivo": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-VMcSCg",
      "message": "✔ Sesión 'session-r5' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.",
      "fase": "WRAP_UP",
      "session_id": "session-r5",
      "report_path": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-VMcSCg\\.qa\\project\\sessions\\session-r5.report.md",
      "reporte_brechas_path": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-VMcSCg\\.qa\\project\\sessions\\session-r5.report.md",
      "cobertura_alcance": {
        "origen": "legacy_only_not_canonical_coverage",
        "flujos": {
          "cubiertos": 0,
          "declarados": 0
        },
        "roles": {
          "con_perfil_verificado": 0,
          "declarados": 0
        },
        "resumen_texto": "Cobertura del alcance declarado: 0 de 0 flujos, 0 de 0 roles"
      },
      "brechas_detectadas": null,
      "cierre_canonico": {
        "modulos_cerrados": 0,
        "modulos_waived": 1,
        "requisitos_confirmados_actuales": 0,
        "cobertura_ejecucion": "not_certified_by_session_report",
        "aprobacion_humana_autentica": "requires_independent_host_evidence"
      },
      "siguiente_accion": {
        "tipo": "decision",
        "descripcion": "Sesión concluida. Reporte de brechas generado en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-VMcSCg\\.qa\\project\\sessions\\session-r5.report.md. Puedes revisar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).",
        "tool": "qap_server",
        "pregunta": {
          "id": "decision_post_cierre_sesion",
          "texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-VMcSCg\\.qa\\project\\sessions\\session-r5.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.",
          "formato": "una_opcion",
          "opciones": [
            {
              "id": "server",
              "etiqueta": "Revisar Knowledge Graph interactivo (qap_server)",
              "recomendada": true
            },
            {
              "id": "plan",
              "etiqueta": "Iniciar nueva sesión de pruebas (qap_session_plan)",
              "recomendada": false
            }
          ],
          "permite_otra": true,
          "registrar_con": {
            "tool": "qap_server",
            "campo": "action"
          },
          "render_texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-VMcSCg\\.qa\\project\\sessions\\session-r5.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.\n\n1. Revisar Knowledge Graph interactivo (qap_server) [Recomendada]\n2. Iniciar nueva sesión de pruebas (qap_session_plan)\n\n(Responde con el número de tu opción o escribe una respuesta libre)"
        }
      }
    },
    "physicalPhase": "WRAP_UP",
    "reportExists": true,
    "receiptReads": 3,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:34b4d590-d03e-466d-a1ea-75385d5cff4a",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:34b4d590-d03e-466d-a1ea-75385d5cff4a\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:13.083Z\",\"reason\":\"8355249dfb06a3f5aa18ea38d6f362f7e187b9383555f446c06d621ba7654bb3\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "normal-retry",
    "result": "PASS",
    "status": "blocked",
    "approvals": 1,
    "receipts": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "lifecycle-plan",
    "result": "PASS",
    "response": {
      "status": "blocked",
      "code": "session_context_changed",
      "fase": "WORKING",
      "razon": "La sesión, el plan o los módulos cambiaron antes del cierre; vuelve a consultar qap_status.",
      "desbloquear_con": {
        "tool": "qap_status"
      },
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 2,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:c6c9d203-4219-41f0-84c7-72fdf9b96304",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:c6c9d203-4219-41f0-84c7-72fdf9b96304\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:13.287Z\",\"reason\":\"04be3cdcd4a81400df7732911ecce671689feb083a64b38591ffa2805197b7bf\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "lifecycle-process",
    "result": "PASS",
    "response": {
      "status": "blocked",
      "code": "session_context_changed",
      "fase": "WORKING",
      "razon": "La sesión, el plan o los módulos cambiaron antes del cierre; vuelve a consultar qap_status.",
      "desbloquear_con": {
        "tool": "qap_status"
      },
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 2,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:7a041aea-7298-4de2-939f-0a1872db1e2b",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:7a041aea-7298-4de2-939f-0a1872db1e2b\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:13.433Z\",\"reason\":\"6ee0f4728e343d309f03ea318c1b48e26f022daf112bd59ebe044bf01a64050e\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "lifecycle-session",
    "result": "PASS",
    "response": {
      "status": "blocked",
      "code": "session_context_changed",
      "fase": "WORKING",
      "razon": "La sesión, el plan o los módulos cambiaron antes del cierre; vuelve a consultar qap_status.",
      "desbloquear_con": {
        "tool": "qap_status"
      },
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 2,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:8e138695-4db7-4dbb-a251-36c96ed95747",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:8e138695-4db7-4dbb-a251-36c96ed95747\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:15.279Z\",\"reason\":\"b4903dd7d82cb5fb80a8bac2bb87e68715d986963081ef5f611519858163de33\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "lifecycle-phase",
    "result": "PASS",
    "response": {
      "status": "blocked",
      "code": "session_context_changed",
      "fase": "SCOPING",
      "razon": "La sesión, el plan o los módulos cambiaron antes del cierre; vuelve a consultar qap_status.",
      "desbloquear_con": {
        "tool": "qap_status"
      },
      "isError": true
    },
    "physicalPhase": "SCOPING",
    "reportExists": false,
    "receiptReads": 2,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:9b588374-4a95-4aca-adc6-a3d775640e72",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:9b588374-4a95-4aca-adc6-a3d775640e72\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:15.445Z\",\"reason\":\"76160d0fa5d6f46abd85b41c1729e45f79bee2adc7ec9635f3c62abb7b08266e\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-source",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:ba735c89-11bd-4319-86b2-e114f776ba2a",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:ba735c89-11bd-4319-86b2-e114f776ba2a\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:15.591Z\",\"reason\":\"341241033451fc46049b7099c9d375488006dc70d904fecde0bd9b9b77df98ad\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:ba735c89-11bd-4319-86b2-e114f776ba2a",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:ba735c89-11bd-4319-86b2-e114f776ba2a\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"wrong-provenance\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:15.591Z\",\"reason\":\"341241033451fc46049b7099c9d375488006dc70d904fecde0bd9b9b77df98ad\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-process",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:f77c5cc2-76b8-4e54-8eee-128c1310aac8",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:f77c5cc2-76b8-4e54-8eee-128c1310aac8\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:15.716Z\",\"reason\":\"b60cc9036b601d32ff087689a65922c4c434cb9050fdc3213d7b8bf86ee29623\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:f77c5cc2-76b8-4e54-8eee-128c1310aac8",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:f77c5cc2-76b8-4e54-8eee-128c1310aac8\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"wrong-provenance-process\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:15.716Z\",\"reason\":\"b60cc9036b601d32ff087689a65922c4c434cb9050fdc3213d7b8bf86ee29623\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-target",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:c607212a-155e-4019-893f-96b632c02f75",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:c607212a-155e-4019-893f-96b632c02f75\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:17.411Z\",\"reason\":\"bf94019c229baa6cccd7f66d2d2036f16f336163f43d1beebf2b95f3d2db0e52\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:c607212a-155e-4019-893f-96b632c02f75",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:c607212a-155e-4019-893f-96b632c02f75\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:17.411Z\",\"reason\":\"bf94019c229baa6cccd7f66d2d2036f16f336163f43d1beebf2b95f3d2db0e52\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-revision",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:c3c0e5d9-5122-4da9-9bfc-14bde30b5cbe",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:c3c0e5d9-5122-4da9-9bfc-14bde30b5cbe\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:17.563Z\",\"reason\":\"cea4273baaa0b74cee1e4154ac77395fd2f21acff8b54ae4780d6cb1b7588058\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:c3c0e5d9-5122-4da9-9bfc-14bde30b5cbe",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:c3c0e5d9-5122-4da9-9bfc-14bde30b5cbe\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:17.563Z\",\"reason\":\"cea4273baaa0b74cee1e4154ac77395fd2f21acff8b54ae4780d6cb1b7588058\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-module-revision",
    "result": "PASS",
    "response": {
      "status": "success",
      "directorio_objetivo": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-7LgSvn",
      "message": "✔ Sesión 'session-r5' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.",
      "fase": "WRAP_UP",
      "session_id": "session-r5",
      "report_path": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-7LgSvn\\.qa\\project\\sessions\\session-r5.report.md",
      "reporte_brechas_path": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-7LgSvn\\.qa\\project\\sessions\\session-r5.report.md",
      "cobertura_alcance": {
        "origen": "legacy_only_not_canonical_coverage",
        "flujos": {
          "cubiertos": 0,
          "declarados": 0
        },
        "roles": {
          "con_perfil_verificado": 0,
          "declarados": 0
        },
        "resumen_texto": "Cobertura del alcance declarado: 0 de 0 flujos, 0 de 0 roles"
      },
      "brechas_detectadas": null,
      "cierre_canonico": {
        "modulos_cerrados": 0,
        "modulos_waived": 1,
        "requisitos_confirmados_actuales": 0,
        "cobertura_ejecucion": "not_certified_by_session_report",
        "aprobacion_humana_autentica": "requires_independent_host_evidence"
      },
      "siguiente_accion": {
        "tipo": "decision",
        "descripcion": "Sesión concluida. Reporte de brechas generado en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-7LgSvn\\.qa\\project\\sessions\\session-r5.report.md. Puedes revisar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).",
        "tool": "qap_server",
        "pregunta": {
          "id": "decision_post_cierre_sesion",
          "texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-7LgSvn\\.qa\\project\\sessions\\session-r5.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.",
          "formato": "una_opcion",
          "opciones": [
            {
              "id": "server",
              "etiqueta": "Revisar Knowledge Graph interactivo (qap_server)",
              "recomendada": true
            },
            {
              "id": "plan",
              "etiqueta": "Iniciar nueva sesión de pruebas (qap_session_plan)",
              "recomendada": false
            }
          ],
          "permite_otra": true,
          "registrar_con": {
            "tool": "qap_server",
            "campo": "action"
          },
          "render_texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-7LgSvn\\.qa\\project\\sessions\\session-r5.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.\n\n1. Revisar Knowledge Graph interactivo (qap_server) [Recomendada]\n2. Iniciar nueva sesión de pruebas (qap_session_plan)\n\n(Responde con el número de tu opción o escribe una respuesta libre)"
        }
      }
    },
    "physicalPhase": "WRAP_UP",
    "reportExists": true,
    "receiptReads": 3,
    "acceptedCAS": false,
    "knowledgeRejected": "REFERENCE_NOT_FOUND",
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:97e8d0b1-6638-49ea-a997-af3169367a7d",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:97e8d0b1-6638-49ea-a997-af3169367a7d\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:17.700Z\",\"reason\":\"9902c6486db2a1c148a724e3f360102d9505a6d032586534b7020c68c9d94503\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-application-revision",
    "result": "PASS",
    "response": {
      "status": "success",
      "directorio_objetivo": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-NzDgyv",
      "message": "✔ Sesión 'session-r5' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.",
      "fase": "WRAP_UP",
      "session_id": "session-r5",
      "report_path": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-NzDgyv\\.qa\\project\\sessions\\session-r5.report.md",
      "reporte_brechas_path": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-NzDgyv\\.qa\\project\\sessions\\session-r5.report.md",
      "cobertura_alcance": {
        "origen": "legacy_only_not_canonical_coverage",
        "flujos": {
          "cubiertos": 0,
          "declarados": 0
        },
        "roles": {
          "con_perfil_verificado": 0,
          "declarados": 0
        },
        "resumen_texto": "Cobertura del alcance declarado: 0 de 0 flujos, 0 de 0 roles"
      },
      "brechas_detectadas": null,
      "cierre_canonico": {
        "modulos_cerrados": 0,
        "modulos_waived": 1,
        "requisitos_confirmados_actuales": 0,
        "cobertura_ejecucion": "not_certified_by_session_report",
        "aprobacion_humana_autentica": "requires_independent_host_evidence"
      },
      "siguiente_accion": {
        "tipo": "decision",
        "descripcion": "Sesión concluida. Reporte de brechas generado en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-NzDgyv\\.qa\\project\\sessions\\session-r5.report.md. Puedes revisar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).",
        "tool": "qap_server",
        "pregunta": {
          "id": "decision_post_cierre_sesion",
          "texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-NzDgyv\\.qa\\project\\sessions\\session-r5.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.",
          "formato": "una_opcion",
          "opciones": [
            {
              "id": "server",
              "etiqueta": "Revisar Knowledge Graph interactivo (qap_server)",
              "recomendada": true
            },
            {
              "id": "plan",
              "etiqueta": "Iniciar nueva sesión de pruebas (qap_session_plan)",
              "recomendada": false
            }
          ],
          "permite_otra": true,
          "registrar_con": {
            "tool": "qap_server",
            "campo": "action"
          },
          "render_texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-NzDgyv\\.qa\\project\\sessions\\session-r5.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.\n\n1. Revisar Knowledge Graph interactivo (qap_server) [Recomendada]\n2. Iniciar nueva sesión de pruebas (qap_session_plan)\n\n(Responde con el número de tu opción o escribe una respuesta libre)"
        }
      }
    },
    "physicalPhase": "WRAP_UP",
    "reportExists": true,
    "receiptReads": 3,
    "acceptedCAS": false,
    "knowledgeRejected": "REFERENCE_NOT_FOUND",
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:6a4711db-0fb5-42bb-8f0f-1f553d6b694f",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:6a4711db-0fb5-42bb-8f0f-1f553d6b694f\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:17.857Z\",\"reason\":\"6e15ce0409e06b54b22fee561e39865c26899a9c69cc747bedce4a83699ea6a6\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-digest",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:61518437-d3c7-468e-875d-c8d3de7a0d88",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:61518437-d3c7-468e-875d-c8d3de7a0d88\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.001Z\",\"reason\":\"54b80b08939496906689f5c7a9725d6bb1d4a83d7e26b752c9af0ba1bb5909e0\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:61518437-d3c7-468e-875d-c8d3de7a0d88",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:61518437-d3c7-468e-875d-c8d3de7a0d88\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.001Z\",\"reason\":\"tampered-digest\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "binding-module-revision",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_authorization_or_binding_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 1,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:5841d5f7-93d5-4154-9c1e-11d01bc0ac3f",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:5841d5f7-93d5-4154-9c1e-11d01bc0ac3f\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.124Z\",\"reason\":\"af4c4833db6742bf56ee1534ffbc19b1c134f58a8cb256fe0d840d28be121e9e\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "binding-application-revision",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: closure_receipt_provenance_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 1,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:2da91b56-ebd8-4f7e-b6d4-6c69ebd6dda7",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:2da91b56-ebd8-4f7e-b6d4-6c69ebd6dda7\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.244Z\",\"reason\":\"6557bea10c371e9da2f7753f08c4f03a034ec1dda0036678dab26ffa633ffd17\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "missing-receipt",
    "result": "PASS",
    "physicalAbsent": true,
    "directReportRejected": true,
    "reconcileRecoveredOneReceipt": true
  },
  {
    "scenario": "no-approval",
    "result": "PASS",
    "response": {
      "status": "blocked",
      "code": "canonical_module_closure_required",
      "directorio_objetivo": "C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-UpISYb",
      "fase": "WORKING",
      "razon": "No se puede cerrar la sesión: los siguientes módulos canónicos no cuentan con cierre o renuncia válidamente autorizados: catalog.",
      "unclosed_modules": [
        "catalog"
      ],
      "desbloquear_con": {
        "tool": "qap_module_close",
        "descripcion": "Cierra o renuncia a los módulos canónicos con qap_module_close y canonical_closure."
      },
      "siguiente_accion": {
        "tipo": "trabajo",
        "descripcion": "Cierra los módulos canónicos pendientes (catalog) antes de concluir la sesión.",
        "tool": "qap_module_close"
      }
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 0,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:cc4ecce2-fb36-4832-b8d1-0e3b5901e5ab",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:cc4ecce2-fb36-4832-b8d1-0e3b5901e5ab\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.498Z\",\"reason\":\"815779fe5e9814dd20655bb0e7fcf085850105f3d148f20fdfa233a328564e38\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": false
  },
  {
    "scenario": "write-error",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "MCP error -32603: EPERM: operation not permitted, rename 'C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-9CGqBd\\.qa\\project\\sessions\\session-r5.report.md.efdba3f8-1304-4f7f-961c-6206e5bfbd64.tmp' -> 'C:\\Users\\Judirico\\AppData\\Local\\Temp\\qap-r5-9CGqBd\\.qa\\project\\sessions\\session-r5.report.md'"
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 3,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:6f48145d-7084-4b38-80d8-4c96d0031141",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:6f48145d-7084-4b38-80d8-4c96d0031141\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.613Z\",\"reason\":\"88a79e6c1aae8a9bb9d29fbbd4b0f8795aeca45572016eb6015dac18319e60d3\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "write-error-recovery",
    "result": "PASS",
    "phase": "WRAP_UP",
    "reviews": 1,
    "receipts": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "commit-error",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "MCP error -32603: AUDIT_PHYSICAL_COMMIT_INTERRUPTED"
    },
    "physicalPhase": "WORKING",
    "reportExists": true,
    "receiptReads": 3,
    "acceptedCAS": false,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:e47099ff-b12e-446c-bf23-96d5344b1e6d",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:e47099ff-b12e-446c-bf23-96d5344b1e6d\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:05:18.806Z\",\"reason\":\"bdccd53f0d1281d0ba923c5b0ba9813062b4d395b1174dc0b7b97cf4ae2e5878\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "commit-error-recovery",
    "result": "PASS",
    "phase": "WRAP_UP",
    "reviews": 1,
    "receipts": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-module-existing-revision",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:4c36be27-8c8d-4aa1-b314-f82f8ecba8d4",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:4c36be27-8c8d-4aa1-b314-f82f8ecba8d4\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:10:10.127Z\",\"reason\":\"e68b36b2061090b5079354ecb35df33a1e20505f91569b93eefed259721ba06a\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:4c36be27-8c8d-4aa1-b314-f82f8ecba8d4",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:4c36be27-8c8d-4aa1-b314-f82f8ecba8d4\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":2},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:10:10.127Z\",\"reason\":\"e68b36b2061090b5079354ecb35df33a1e20505f91569b93eefed259721ba06a\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "receipt-application-existing-revision",
    "result": "PASS",
    "response": {
      "status": "error",
      "message": "Error ejecutando qap_session_close: canonical_report_receipt_missing_or_invalid",
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportExists": false,
    "receiptReads": 4,
    "acceptedCAS": true,
    "physicalRows": [
      {
        "kind": "relation",
        "id": "waiver:468ce212-8fe9-4f0c-b0c5-d1a419766539",
        "revision": 1,
        "entity_json": "{\"id\":\"waiver:468ce212-8fe9-4f0c-b0c5-d1a419766539\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":1}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:10:10.413Z\",\"reason\":\"4b15be1c1038b5a9c56788920228dd4bb1cc0a2de30b0982278473e930c3108d\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      },
      {
        "kind": "relation",
        "id": "waiver:468ce212-8fe9-4f0c-b0c5-d1a419766539",
        "revision": 2,
        "entity_json": "{\"id\":\"waiver:468ce212-8fe9-4f0c-b0c5-d1a419766539\",\"predicate\":\"related_to\",\"source\":{\"kind\":\"module\",\"id\":\"mod-catalog\",\"revision\":1},\"target\":{\"kind\":\"application\",\"id\":\"app-r5\",\"revision\":2}}",
        "trace_json": "{\"source\":\"canonical_module_waiver_v1\",\"recorded_by\":\"mcp_host\",\"recorded_at\":\"2026-11-05T21:10:10.413Z\",\"reason\":\"4b15be1c1038b5a9c56788920228dd4bb1cc0a2de30b0982278473e930c3108d\",\"review\":\"reviewed\",\"evidence_refs\":[]}"
      }
    ],
    "reviews": 1,
    "historyUnchanged": true
  },
  {
    "scenario": "hard-exit-before-physical-lifecycle-commit",
    "exit": 83,
    "result": "PASS",
    "reportPublished": true,
    "physicalPhase": "WORKING",
    "approvalsUnchanged": true,
    "historyUnchanged": true
  },
  {
    "scenario": "hard-exit-retry",
    "result": "PASS",
    "phase": "WRAP_UP",
    "reviews": 1,
    "approvals": 1,
    "receipts": 1,
    "historyUnchanged": true,
    "productionStaleLockMs": 10000
  },
  {
    "scenario": "forced-transition-rejection",
    "result": "PASS",
    "response": {
      "status": "blocked",
      "code": "session_transition_rejected",
      "fase": "WORKING",
      "razon": "La transición a WRAP_UP fue rechazada; no se ha cerrado la sesión.",
      "desbloquear_con": {
        "tool": "qap_status"
      },
      "isError": true
    },
    "physicalPhase": "WORKING",
    "reportPublished": false,
    "method": "test-only external bundle seam returns success:false; real FS/SQLite and unchanged production source"
  },
  {
    "scenario": "final-fence-lifecycle",
    "result": "PASS",
    "childOutput": "READY\nOBSERVED_PHASE:WRAP_UP\nLIFECYCLE_COMPLETED",
    "physicalPhase": "WRAP_UP",
    "receiptRevision": 1,
    "noDeadlock": true
  },
  {
    "scenario": "final-fence-knowledge",
    "result": "PASS",
    "childOutput": "READY\nREJECTED:UNAVAILABLE",
    "physicalPhase": "WRAP_UP",
    "receiptRevision": 1,
    "noDeadlock": true
  },
  {
    "scenario": "external-official-knowledge-fence-conflict",
    "integrity": "PASS",
    "specificBlockedContract": "FAIL",
    "response": {
      "status": "error",
      "message": "MCP error -32603: Knowledge store: CONFLICT"
    },
    "physicalPhase": "WORKING",
    "reportPublished": false,
    "historyUnchanged": true
  },
  {
    "scenario": "external-fence-conflict-retry",
    "result": "PASS",
    "phase": "WRAP_UP",
    "approvals": 1,
    "receipts": 1
  }
]
~~~
