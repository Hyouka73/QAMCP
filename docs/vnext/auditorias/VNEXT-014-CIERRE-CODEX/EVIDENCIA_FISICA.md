**Auditoría independiente. Fecha: 2026-11-05, America/Mexico_City. Código probado: `76a338855f342a70acb184da5fbd7256dd980669`. Base correctiva: `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6`. Rama: `fix/vnext-014-cierre-controlado`.**

# Evidencia física independiente

## Entorno, aislamiento e inmutabilidad

```text
date=2026-11-05T17:24:37.5501194-06:00
os=Microsoft Windows 10.0.26200
arch=X64
node=v24.15.0
pnpm=12.3.4
sha=76a338855f342a70acb184da5fbd7256dd980669
branch=fix/vnext-014-cierre-controlado
status=
```

HEAD remoto inicial = `76a338855f342a70acb184da5fbd7256dd980669`; ancestry base→HEAD exit0. Clon reutilizado limpio en rama correctiva. La escritura de informes ocurre después de todas las pruebas y no altera el SHA de código ensayado. Los únicos archivos nuevos autorizados son los seis documentos de este directorio. Fuentes/tests/expectativas/lockfile sin diffs durante la auditoría.

SQLite físico Node: versión 3.51.3, FTS5 disponible. Smoke de navegador real (sin aplicación externa, documento sintético):

```json
{"playwright":"1.62.1","executable":"C:\\Users\\Judirico\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe","browser":"151.0.7922.34","realLaunch":true,"syntheticDocument":true}
```

El script Playwright CLI no está expuesto por este workspace vía pnpm exec playwright; se verificó el runtime real mediante playwright-core del Runner y sus tests, sin inferir ausencia del navegador de un comando no disponible.

## Reapertura real de SQLite

El auditor extrajo en memoria solo los helpers de fixture del HEAD y compiló un módulo externo en node_modules/.audit-cierre (ignorado); no escribió ni alteró tests. Para cada checkpoint cerró ambas conexiones, abrió cada archivo con DatabaseSync readOnly, ejecutó PRAGMA integrity_check y foreign_key_check, cerró esos handles, reabrió adapters oficiales con la clave efímera original del fixture y comparó snapshots/recibos. Nueve checkpoints × dos bases = **18 integrity_check ok**, cero violaciones FK. No se publica ninguna clave ni base.

| Checkpoint | Approvals | Recibos | Cierres | Lifecycle | Integridad y reopen |
| --- | --- | --- | --- | --- | --- |
| 3.1 | 0 | 0 | Ninguno | WORKING; catalog:planned | ok; snapshot/receipts idénticos |
| 3.2 | 0 | 0 | Ninguno | WORKING; catalog:planned | ok; snapshot/receipts idénticos |
| 3.3 | 1 | 1 | catalog:waived | WORKING; catalog:waived | ok; snapshot/receipts idénticos |
| 5.4 | 1 | 1 | catalog:waived | WRAP_UP; catalog:waived | ok; snapshot/receipts idénticos |
| 7.2-first | 1 | 1 | catalog:waived | WORKING; catalog:waived | ok; snapshot/receipts idénticos |
| 7.2 | 1 | 1 | catalog:waived | WORKING; catalog:waived | ok; snapshot/receipts idénticos |
| 7.3 | 2 | 2 | catalog:waived, billing:waived | WORKING; catalog:waived, billing:waived | ok; snapshot/receipts idénticos |
| 7.4 | 2 | 1 | catalog:closed | WORKING; catalog:closed | ok; snapshot/receipts idénticos |
| 7.5-isolation-only | 1 | 1 | catalog:waived | WORKING; catalog:planned | ok; snapshot/receipts idénticos |

7.4: una approval de aplicabilidad anterior y una terminal; el único receipt pertenece al ganador. 7.5-isolation-only tiene una approval del gateway sintético y un cierre durable, pero el único receipt es el falsificado, rechazado; lifecycle sigue planned y el retry vuelve a rechazar. No se atribuye autorización al atacante ni se declara atomicidad transversal.

### Lecturas y persistencia por escenario

**3.1**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-oSZXHl",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-oSZXHl\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-oSZXHl\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [],
  "closures": {},
  "receiptCount": 0,
  "receiptProvenance": [],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "planned",
      "updated_at": "2026-10-31T12:00:00.000Z"
    }
  },
  "response": {
    "status": "blocked",
    "code": "closure_context_changed",
    "razon": "La sesión o el módulo cambiaron antes del consentimiento."
  }
}
```

**3.2**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-dktQZS",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-dktQZS\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-dktQZS\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [],
  "closures": {},
  "receiptCount": 0,
  "receiptProvenance": [],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "planned",
      "updated_at": "2026-10-31T12:00:00.000Z"
    }
  },
  "response": {
    "status": "blocked",
    "code": "closure_context_changed",
    "razon": "La sesión o el módulo cambiaron antes del consentimiento."
  }
}
```

**3.3**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-p2LmYl",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-p2LmYl\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-p2LmYl\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "c1a51b80-640e-43c8-a793-f049fbbaec35",
      "0f3816b9342922ac1f2a45962aaa62e6ce874d3f6cdf4b0327bf6d3bee964ea7"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "waived",
      "decisionId": "c1a51b80-640e-43c8-a793-f049fbbaec35",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "0f3816b9342922ac1f2a45962aaa62e6ce874d3f6cdf4b0327bf6d3bee964ea7"
    }
  },
  "receiptCount": 1,
  "receiptProvenance": [
    {
      "id": "waiver:c1a51b80-640e-43c8-a793-f049fbbaec35",
      "revision": 1,
      "entity": {
        "id": "waiver:c1a51b80-640e-43c8-a793-f049fbbaec35",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-catalog",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.112Z",
        "reason": "0f3816b9342922ac1f2a45962aaa62e6ce874d3f6cdf4b0327bf6d3bee964ea7",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "waived",
      "updated_at": "2026-11-05T23:16:37.118Z",
      "waived_reason": "Renuncia sintética autorizada para auditoría física independiente."
    }
  }
}
```

**5.4**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "1aa5e455-4229-4db0-86e2-9bf8ce380393",
      "4ae76193942143f395b0bcdcdcad163849946fcc00292855f06c6c5590afe30d"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "waived",
      "decisionId": "1aa5e455-4229-4db0-86e2-9bf8ce380393",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "4ae76193942143f395b0bcdcdcad163849946fcc00292855f06c6c5590afe30d"
    }
  },
  "receiptCount": 1,
  "receiptProvenance": [
    {
      "id": "waiver:1aa5e455-4229-4db0-86e2-9bf8ce380393",
      "revision": 1,
      "entity": {
        "id": "waiver:1aa5e455-4229-4db0-86e2-9bf8ce380393",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-catalog",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.252Z",
        "reason": "4ae76193942143f395b0bcdcdcad163849946fcc00292855f06c6c5590afe30d",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WRAP_UP",
  "modules": {
    "catalog": {
      "state": "waived",
      "updated_at": "2026-11-05T23:16:37.257Z",
      "waived_reason": "Renuncia sintética autorizada para auditoría física independiente."
    }
  },
  "response": {
    "status": "success",
    "directorio_objetivo": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN",
    "message": "✔ Sesión 'session-adv' cerrada exitosamente. Proyecto transicionado a fase WRAP_UP.",
    "fase": "WRAP_UP",
    "session_id": "session-adv",
    "report_path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\project\\sessions\\session-adv.report.md",
    "reporte_brechas_path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\project\\sessions\\session-adv.report.md",
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
      "descripcion": "Sesión concluida. Reporte de brechas generado en C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\project\\sessions\\session-adv.report.md. Puedes revisar el Knowledge Graph (qap_server) o iniciar una nueva sesión (qap_session_plan).",
      "tool": "qap_server",
      "pregunta": {
        "id": "decision_post_cierre_sesion",
        "texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\project\\sessions\\session-adv.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.",
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
        "render_texto": "La sesión ha finalizado exitosamente. El reporte de brechas está disponible en C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-PHshuN\\.qa\\project\\sessions\\session-adv.report.md. Selecciona si explorar el Knowledge Graph con qap_server o iniciar una nueva sesión con qap_session_plan.\n\n1. Revisar Knowledge Graph interactivo (qap_server) [Recomendada]\n2. Iniciar nueva sesión de pruebas (qap_session_plan)\n\n(Responde con el número de tu opción o escribe una respuesta libre)"
      }
    }
  }
}
```

**7.2-first**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-uLrbtS",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-uLrbtS\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-uLrbtS\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
      "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "waived",
      "decisionId": "3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64"
    }
  },
  "receiptCount": 1,
  "receiptProvenance": [
    {
      "id": "waiver:3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
      "revision": 1,
      "entity": {
        "id": "waiver:3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-catalog",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.388Z",
        "reason": "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "waived",
      "updated_at": "2026-11-05T23:16:37.392Z",
      "waived_reason": "Renuncia sintética autorizada para auditoría física independiente."
    }
  }
}
```

**7.2**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-uLrbtS",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-uLrbtS\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-uLrbtS\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
      "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "waived",
      "decisionId": "3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64"
    }
  },
  "receiptCount": 1,
  "receiptProvenance": [
    {
      "id": "waiver:3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
      "revision": 1,
      "entity": {
        "id": "waiver:3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-catalog",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.388Z",
        "reason": "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "waived",
      "updated_at": "2026-11-05T23:16:37.392Z",
      "waived_reason": "Renuncia sintética autorizada para auditoría física independiente."
    }
  },
  "response": {
    "status": "waived",
    "idempotent": true,
    "decision_id": "3f6f3dc1-e564-4e58-9140-d8cdd47b44ca",
    "request_digest": "6610ec66419c8de66ade019076fc4c772103c25b408d2606010b1549f139eb64",
    "coverage_digest": "eba698c9827842e687a3811d796bf8886df7b1d21cbb11771e1947e70e16c448"
  }
}
```

**7.3**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-8qeqg2",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-8qeqg2\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-8qeqg2\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "0edca302-62a3-4621-983b-f6b7b873aae5",
      "fd75d9c4e5ce57df50bf7e7e2471b278fcf2313ecaf6b915f8806ad68513054b"
    ],
    [
      "b0a44e61-6f30-4205-ba29-82818eb31afb",
      "266523d6d923f15acdd6381a973ba81321f6880081daf37044c3a2ffdc305d7b"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "waived",
      "decisionId": "0edca302-62a3-4621-983b-f6b7b873aae5",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "fd75d9c4e5ce57df50bf7e7e2471b278fcf2313ecaf6b915f8806ad68513054b"
    },
    "billing": {
      "status": "waived",
      "decisionId": "b0a44e61-6f30-4205-ba29-82818eb31afb",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "266523d6d923f15acdd6381a973ba81321f6880081daf37044c3a2ffdc305d7b"
    }
  },
  "receiptCount": 2,
  "receiptProvenance": [
    {
      "id": "waiver:0edca302-62a3-4621-983b-f6b7b873aae5",
      "revision": 1,
      "entity": {
        "id": "waiver:0edca302-62a3-4621-983b-f6b7b873aae5",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-catalog",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.531Z",
        "reason": "fd75d9c4e5ce57df50bf7e7e2471b278fcf2313ecaf6b915f8806ad68513054b",
        "review": "reviewed",
        "evidence_refs": []
      }
    },
    {
      "id": "waiver:b0a44e61-6f30-4205-ba29-82818eb31afb",
      "revision": 1,
      "entity": {
        "id": "waiver:b0a44e61-6f30-4205-ba29-82818eb31afb",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-billing",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.601Z",
        "reason": "266523d6d923f15acdd6381a973ba81321f6880081daf37044c3a2ffdc305d7b",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "waived",
      "updated_at": "2026-11-05T23:16:37.535Z",
      "waived_reason": "Renuncia sintética autorizada para auditoría física independiente."
    },
    "billing": {
      "state": "waived",
      "updated_at": "2026-11-05T23:16:37.605Z",
      "waived_reason": "Renuncia sintética autorizada para auditoría física independiente."
    }
  },
  "responses": [
    {
      "status": "waived",
      "decision_id": "0edca302-62a3-4621-983b-f6b7b873aae5",
      "request_digest": "fd75d9c4e5ce57df50bf7e7e2471b278fcf2313ecaf6b915f8806ad68513054b",
      "coverage_digest": "3de4161f95d5503ca2d2d2681f6b6c37a4a536ad50288005c6947817e4319b30",
      "assessment": {
        "module_key": "catalog-key",
        "module_id": "module-catalog",
        "module_revision": 1,
        "application_id": "app-adv",
        "environment_id": "local",
        "assessed_at": "2026-11-05T23:16:37.504Z",
        "assessed_by": "canonical_coverage_service",
        "coverage_digest": "3de4161f95d5503ca2d2d2681f6b6c37a4a536ad50288005c6947817e4319b30",
        "specification_coverage": {
          "status": "incomplete",
          "applicable_categories_count": 0,
          "satisfied_categories_count": 0,
          "confirmed_requirements_count": 0,
          "pending_requirements_count": 0,
          "total_gaps_count": 7,
          "unaddressed_gaps_count": 7,
          "accepted_gaps_count": 0,
          "category_statuses": [
            {
              "category": "functional",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:functional:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "business_rule",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:business_rule:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "security",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:security:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "ui",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:ui:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "ux",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:ux:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "regression",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:regression:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "performance",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:catalog-key:performance:unknown_applicability"
              ],
              "status": "unknown"
            }
          ]
        },
        "review_coverage": {
          "status": "pending_review",
          "reviewed_questions_count": 0,
          "pending_questions_count": 0,
          "decisions_count": 0,
          "host_decisions": []
        },
        "execution_coverage": {
          "status": "not_executed",
          "executed_count": 0,
          "passed_count": 0,
          "failed_count": 0,
          "indeterminate_count": 0,
          "note": "La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."
        },
        "gaps": [
          {
            "id": "gap:catalog-key:functional:unknown_applicability",
            "module_key": "catalog-key",
            "category": "functional",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'functional' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          },
          {
            "id": "gap:catalog-key:business_rule:unknown_applicability",
            "module_key": "catalog-key",
            "category": "business_rule",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'business_rule' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          },
          {
            "id": "gap:catalog-key:security:unknown_applicability",
            "module_key": "catalog-key",
            "category": "security",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'security' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          },
          {
            "id": "gap:catalog-key:ui:unknown_applicability",
            "module_key": "catalog-key",
            "category": "ui",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'ui' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          },
          {
            "id": "gap:catalog-key:ux:unknown_applicability",
            "module_key": "catalog-key",
            "category": "ux",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'ux' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          },
          {
            "id": "gap:catalog-key:regression:unknown_applicability",
            "module_key": "catalog-key",
            "category": "regression",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'regression' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          },
          {
            "id": "gap:catalog-key:performance:unknown_applicability",
            "module_key": "catalog-key",
            "category": "performance",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'performance' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.504Z"
          }
        ],
        "applicability_decisions": [],
        "closure_verdict": "waived",
        "blocker_reasons": []
      }
    },
    {
      "status": "waived",
      "decision_id": "b0a44e61-6f30-4205-ba29-82818eb31afb",
      "request_digest": "266523d6d923f15acdd6381a973ba81321f6880081daf37044c3a2ffdc305d7b",
      "coverage_digest": "c7455f7fcf9f85cad3a244bce703c74a02c5ed7e62072bdc60b5317a47f6c3e1",
      "assessment": {
        "module_key": "billing-key",
        "module_id": "module-billing",
        "module_revision": 1,
        "application_id": "app-adv",
        "environment_id": "local",
        "assessed_at": "2026-11-05T23:16:37.508Z",
        "assessed_by": "canonical_coverage_service",
        "coverage_digest": "c7455f7fcf9f85cad3a244bce703c74a02c5ed7e62072bdc60b5317a47f6c3e1",
        "specification_coverage": {
          "status": "incomplete",
          "applicable_categories_count": 0,
          "satisfied_categories_count": 0,
          "confirmed_requirements_count": 0,
          "pending_requirements_count": 0,
          "total_gaps_count": 7,
          "unaddressed_gaps_count": 7,
          "accepted_gaps_count": 0,
          "category_statuses": [
            {
              "category": "functional",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:functional:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "business_rule",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:business_rule:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "security",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:security:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "ui",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:ui:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "ux",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:ux:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "regression",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:regression:unknown_applicability"
              ],
              "status": "unknown"
            },
            {
              "category": "performance",
              "applicability": "unknown",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [
                "gap:billing-key:performance:unknown_applicability"
              ],
              "status": "unknown"
            }
          ]
        },
        "review_coverage": {
          "status": "pending_review",
          "reviewed_questions_count": 0,
          "pending_questions_count": 0,
          "decisions_count": 0,
          "host_decisions": []
        },
        "execution_coverage": {
          "status": "not_executed",
          "executed_count": 0,
          "passed_count": 0,
          "failed_count": 0,
          "indeterminate_count": 0,
          "note": "La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."
        },
        "gaps": [
          {
            "id": "gap:billing-key:functional:unknown_applicability",
            "module_key": "billing-key",
            "category": "functional",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'functional' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          },
          {
            "id": "gap:billing-key:business_rule:unknown_applicability",
            "module_key": "billing-key",
            "category": "business_rule",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'business_rule' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          },
          {
            "id": "gap:billing-key:security:unknown_applicability",
            "module_key": "billing-key",
            "category": "security",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'security' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          },
          {
            "id": "gap:billing-key:ui:unknown_applicability",
            "module_key": "billing-key",
            "category": "ui",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'ui' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          },
          {
            "id": "gap:billing-key:ux:unknown_applicability",
            "module_key": "billing-key",
            "category": "ux",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'ux' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          },
          {
            "id": "gap:billing-key:regression:unknown_applicability",
            "module_key": "billing-key",
            "category": "regression",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'regression' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          },
          {
            "id": "gap:billing-key:performance:unknown_applicability",
            "module_key": "billing-key",
            "category": "performance",
            "absence_type": "unknown_applicability",
            "status": "unaddressed",
            "reason": "La aplicabilidad de la categoría 'performance' no ha sido declarada autoritativamente.",
            "related_requirement_ids": [],
            "provenance": "canonical_coverage_evaluator",
            "created_at": "2026-11-05T23:16:37.508Z"
          }
        ],
        "applicability_decisions": [],
        "closure_verdict": "waived",
        "blocker_reasons": []
      }
    }
  ],
  "baselineApprovals": 0
}
```

**7.4**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-Z74a3N",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-Z74a3N\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-Z74a3N\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "0b9f85d2-1f33-417a-ad7f-3b866e908555",
      "ebf50f671dd14da05ebae030ebf904a9079ac9b739e8b57a7b8f304222d4f1c9"
    ],
    [
      "66b30a44-5b76-4a46-ab05-520572f42316",
      "565e0e85a8db25f3d62f5f537f857a3d12a3a569e435fff27a178e441af2ecee"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "closed",
      "decisionId": "66b30a44-5b76-4a46-ab05-520572f42316",
      "reviewer": "security-adversary-lead",
      "moduleRevision": 1,
      "requestDigest": "565e0e85a8db25f3d62f5f537f857a3d12a3a569e435fff27a178e441af2ecee"
    }
  },
  "receiptCount": 1,
  "receiptProvenance": [
    {
      "id": "closure:66b30a44-5b76-4a46-ab05-520572f42316",
      "revision": 1,
      "entity": {
        "id": "closure:66b30a44-5b76-4a46-ab05-520572f42316",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-catalog",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_closure_v1",
        "recorded_by": "mcp_host",
        "recorded_at": "2026-11-05T23:16:37.752Z",
        "reason": "565e0e85a8db25f3d62f5f537f857a3d12a3a569e435fff27a178e441af2ecee",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "closed",
      "updated_at": "2026-10-31T12:00:00.000Z"
    }
  },
  "responses": [
    {
      "status": "closed",
      "decision_id": "66b30a44-5b76-4a46-ab05-520572f42316",
      "request_digest": "565e0e85a8db25f3d62f5f537f857a3d12a3a569e435fff27a178e441af2ecee",
      "coverage_digest": "052271a44030e93e6467406d27cfa57714fd8a48096b8fe57841af7fd59f2199",
      "assessment": {
        "module_key": "catalog-key",
        "module_id": "module-catalog",
        "module_revision": 1,
        "application_id": "app-adv",
        "environment_id": "local",
        "assessed_at": "2026-11-05T23:16:37.729Z",
        "assessed_by": "canonical_coverage_service",
        "coverage_digest": "052271a44030e93e6467406d27cfa57714fd8a48096b8fe57841af7fd59f2199",
        "specification_coverage": {
          "status": "complete",
          "applicable_categories_count": 0,
          "satisfied_categories_count": 0,
          "confirmed_requirements_count": 0,
          "pending_requirements_count": 0,
          "total_gaps_count": 0,
          "unaddressed_gaps_count": 0,
          "accepted_gaps_count": 0,
          "category_statuses": [
            {
              "category": "functional",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            },
            {
              "category": "business_rule",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            },
            {
              "category": "security",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            },
            {
              "category": "ui",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            },
            {
              "category": "ux",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            },
            {
              "category": "regression",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            },
            {
              "category": "performance",
              "applicability": "not_applicable",
              "confirmed_count": 0,
              "pending_count": 0,
              "gap_ids": [],
              "status": "not_applicable"
            }
          ]
        },
        "review_coverage": {
          "status": "reviewed",
          "reviewed_questions_count": 0,
          "pending_questions_count": 0,
          "decisions_count": 7,
          "host_decisions": [
            "dec_functional_5af29c503e50d0b9",
            "dec_business_rule_e1412dabecb1cb2f",
            "dec_security_456971acbc179c1d",
            "dec_ui_4f78c6a0ced106e8",
            "dec_ux_65a1dc99fd9896fa",
            "dec_regression_267234372d7a755e",
            "dec_performance_b194a6f8b241d20c"
          ]
        },
        "execution_coverage": {
          "status": "not_executed",
          "executed_count": 0,
          "passed_count": 0,
          "failed_count": 0,
          "indeterminate_count": 0,
          "note": "La cobertura de ejecución requiere ejecución con test runner (VNEXT-014). Cero certificación de ejecución en R5."
        },
        "gaps": [],
        "applicability_decisions": [
          {
            "category": "functional",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_functional_5af29c503e50d0b9",
            "decided_at": "2026-11-05T23:16:37.687Z"
          },
          {
            "category": "business_rule",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_business_rule_e1412dabecb1cb2f",
            "decided_at": "2026-11-05T23:16:37.687Z"
          },
          {
            "category": "security",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_security_456971acbc179c1d",
            "decided_at": "2026-11-05T23:16:37.687Z"
          },
          {
            "category": "ui",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_ui_4f78c6a0ced106e8",
            "decided_at": "2026-11-05T23:16:37.687Z"
          },
          {
            "category": "ux",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_ux_65a1dc99fd9896fa",
            "decided_at": "2026-11-05T23:16:37.687Z"
          },
          {
            "category": "regression",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_regression_267234372d7a755e",
            "decided_at": "2026-11-05T23:16:37.687Z"
          },
          {
            "category": "performance",
            "applicable": false,
            "reason": "No aplicable según decisión del responsable sintético.",
            "decided_by": "host_review_gateway",
            "decision_id": "dec_performance_b194a6f8b241d20c",
            "decided_at": "2026-11-05T23:16:37.687Z"
          }
        ],
        "closure_verdict": "ready_for_closure",
        "blocker_reasons": []
      }
    },
    {
      "status": "closed",
      "idempotent": true,
      "decision_id": "66b30a44-5b76-4a46-ab05-520572f42316",
      "request_digest": "565e0e85a8db25f3d62f5f537f857a3d12a3a569e435fff27a178e441af2ecee",
      "coverage_digest": "052271a44030e93e6467406d27cfa57714fd8a48096b8fe57841af7fd59f2199"
    }
  ],
  "baselineApprovals": 1
}
```

**7.5-isolation-only**

```json
{
  "root": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-7FdNwC",
  "checks": [
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-7FdNwC\\.qa\\private\\module-closure.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    },
    {
      "path": "C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\qap-adv-7FdNwC\\.qa\\private\\canonical.sqlite",
      "integrity": [
        {
          "integrity_check": "ok"
        }
      ],
      "fk": []
    }
  ],
  "approvals": [
    [
      "dec-tampered-receipt-test",
      "7fb587d929b37510a8de6c95bbd8c6108e2c1a05d2ef7b5c7a66d8bb5364d831"
    ]
  ],
  "closures": {
    "catalog": {
      "status": "waived",
      "decisionId": "dec-tampered-receipt-test",
      "reviewer": "synthetic-reviewer",
      "moduleRevision": 1,
      "requestDigest": "7fb587d929b37510a8de6c95bbd8c6108e2c1a05d2ef7b5c7a66d8bb5364d831"
    }
  },
  "receiptCount": 1,
  "receiptProvenance": [
    {
      "id": "waiver:dec-tampered-receipt-test",
      "revision": 1,
      "entity": {
        "id": "waiver:dec-tampered-receipt-test",
        "predicate": "related_to",
        "source": {
          "kind": "module",
          "id": "module-forged-attacker",
          "revision": 1
        },
        "target": {
          "kind": "application",
          "id": "app-adv",
          "revision": 1
        }
      },
      "trace": {
        "source": "canonical_module_waiver_v1",
        "recorded_by": "attacker",
        "recorded_at": "2026-11-05T23:16:37.879Z",
        "reason": "tampered-digest",
        "review": "reviewed",
        "evidence_refs": []
      }
    }
  ],
  "phase": "WORKING",
  "modules": {
    "catalog": {
      "state": "planned",
      "updated_at": "2026-10-31T12:00:00.000Z"
    }
  },
  "retryRejected": true
}
```

### Reporte físico 5.4

El RPC exigió success/WRAP_UP, archivo existente, módulo catalog, lifecycle WRAP_UP y un receipt. Contenido leído directamente del archivo, con gateway explícitamente sintético:

```markdown
# Reporte de cierre canónico de sesión

Fuente de autoridad: registros durables de cierre y aprobaciones correlacionadas del host.
Los requisitos listados son el inventario vigente al generar este reporte; no se afirma que el inventario sea idéntico al del momento de la aprobación.
**Cobertura de especificación:** inventario y decisiones canónicas, no ejecución de pruebas.
**Cobertura de revisión:** se registran decisiones del gateway; los fixtures automatizados no acreditan consentimiento humano auténtico.
**Cobertura de ejecución:** no certificada por este reporte. Los resultados de qap_test requieren sus propias evidencias físicas.

## Módulo: catalog

- Estado canónico autorizado: **waived**
- Decisión: 1aa5e455-4229-4db0-86e2-9bf8ce380393
- Revisor registrado: security-adversary-lead (2026-11-05T23:16:37.230Z)
- Digest de autorización: 4ae76193942143f395b0bcdcdcad163849946fcc00292855f06c6c5590afe30d
- Digest de cobertura al cierre: 74a9f9c19e9440c218a03a1ef9a1e174b74b152241bf3a1c02559e56b3006237
- Motivo de waiver: Renuncia sintética autorizada para auditoría física independiente.

### Requisitos confirmados (inventario actual)

- Ninguno registrado como confirmado actualmente.
- Requisitos pendientes o no acreditables actualmente: 0

### Brechas aceptadas durables

- No hay brechas aceptadas registradas en esta proyección.

### Aplicabilidad

- Sin decisiones explícitas durables de aplicabilidad.


```

### Autoridad y recuperación sin segunda aprobación

La sonda service-level reutiliza el mismo approvalId en catalog y billing: segundo módulo rechazado; tras reopen queda una approval y un receipt. Otra sonda interrumpe el write de Knowledge receipt después del commit Closure, cierra/reabre ambas SQLite y reintenta: snapshot Closure idéntico, receipt recuperado, lifecycle waived y **un solo llamado al gateway**. Es inyección controlada de fallo más persistencia real, no una nueva prueba de kill/energía. Las regresiones de kill y recuperación existentes también pasan en la suite actual.

```json
[
  {
    "scenario": "3.3 service-level replay of one approvalId across two modules",
    "rejected": "Module closure store: write_failed",
    "gatewayCalls": 2,
    "receiptCount": 1
  },
  {
    "scenario": "physical reopen after interruption between Closure commit and Knowledge receipt",
    "gatewayCalls": 1,
    "before": {
      "approvals": 1,
      "receipts": 0,
      "module": {
        "state": "planned",
        "updated_at": "2026-10-31T12:00:00.000Z"
      }
    },
    "after": {
      "approvals": 1,
      "receipts": 1,
      "module": {
        "state": "waived",
        "updated_at": "2026-11-05T23:23:11.160Z",
        "waived_reason": "Renuncia sintética autorizada para comprobar no reutilización de autoridad."
      }
    },
    "response": {
      "status": "waived",
      "idempotent": true,
      "decision_id": "607b24e8-066c-4f59-8344-1f32668e57e5",
      "request_digest": "94c2f50c3c61314820fb64a6ce3b5b7d0a027c8b4cade46e9127d713a496fabc",
      "coverage_digest": "d2b2f1aedd912e3cf628eb8f28e83d87ad645f159a336e729a8cb407f2b1c26b"
    }
  }
]
```

## Taxonomía CF01 y sanitización

Controles base = solo canonical-closure-service.ts desde el SHA base en overlay de lectura; fixtures y adapters coinciden con HEAD y no cambiaron productivamente entre base/HEAD salvo ese servicio. No se mezclan estos controles con el contador de suite del HEAD.

| Origen | Error inyectado/escenario | Resultado | Código | Writes nuevos |
| --- | --- | --- | --- | --- |
| base | CONFLICT | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | UNAVAILABLE | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | authorization_expired | {"status":"blocked","code":"closure_review_expired","razon":"La decisión expiró antes del commit durable en SQLite."} | closure_review_expired | 0 receipts; Closure intacto |
| base | closure_context_changed | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | closure_revision_conflict | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | lifecycle_context_missing | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | write_failed | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | conflict | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | unexpected | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | nested_commit | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| base | physical_drift | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| head | CONFLICT | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| head | UNAVAILABLE |  | UNAVAILABLE | 0 receipts; Closure intacto |
| head | authorization_expired | {"status":"blocked","code":"closure_review_expired","razon":"La decisión expiró antes del commit durable en SQLite."} | closure_review_expired | 0 receipts; Closure intacto |
| head | closure_context_changed | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| head | closure_revision_conflict | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| head | lifecycle_context_missing | {"status":"blocked","code":"closure_consistency_conflict","razon":"No fue posible garantizar el snapshot autorizado hasta el commit durable."} | closure_consistency_conflict | 0 receipts; Closure intacto |
| head | write_failed | REJECT: Module closure store: write_failed | write_failed | 0 receipts; Closure intacto |
| head | conflict | REJECT: Module closure store: conflict | conflict | 0 receipts; Closure intacto |
| head | unexpected | REJECT: synthetic_disk_error C:/synthetic/PRIVATE_PATH token=SYNTHETIC_CANARY_014 |  | 0 receipts; Closure intacto |
| head | nested_commit | REJECT: Knowledge store: UNAVAILABLE | UNAVAILABLE | 0 receipts; Closure intacto |
| head | physical_drift | REJECT: Module closure store: write_failed | write_failed | 0 receipts; Closure intacto |

Las señales de drift/contexto directas y KnowledgeStoreError.CONFLICT conservan blocked; authorization_expired conserva closure_review_expired. Errores inesperados se propagan. Los dos problemas reales de adapters son el drift envuelto en write_failed y el write reentrante que normaliza como UNAVAILABLE. La excepción de infraestructura con canary se filtró únicamente en el resultado MCP del HEAD:

```json
[
  {
    "version": "base",
    "kind": "mcp_sanitization",
    "response": {
      "content": [
        {
          "type": "text",
          "text": "{\n  \"status\": \"blocked\",\n  \"code\": \"closure_consistency_conflict\",\n  \"razon\": \"No fue posible garantizar el snapshot autorizado hasta el commit durable.\"\n}"
        }
      ],
      "isError": false
    },
    "canaryLeaked": false
  },
  {
    "version": "head",
    "kind": "mcp_sanitization",
    "response": {
      "content": [
        {
          "type": "text",
          "text": "Error ejecutando qap_module_close: synthetic_disk_error C:/synthetic/PRIVATE_PATH token=SYNTHETIC_CANARY_014"
        }
      ],
      "isError": true
    },
    "canaryLeaked": true
  }
]
```

## Windows, E01 y cleanup

Las corridas completas serial/A/B terminaron. A registra tres timeouts y un unhandled ECOMPROMISED, B no; cero EPERM rename observados. ReplaceGate solo coordina lectores cooperantes del mismo proceso; lectores externos y commitLifecycleStateWithFence síncrono conservan sus límites históricos. No se demuestra deadlock de BEGIN IMMEDIATE; C01 reproduce contención física y retry seguro, y 7.3/7.4 completan con handles independientes.

Sonda causal de cleanup, exclusivamente sobre root sintético:

```json
{"scenario":"Delete synthetic root before draining a held official module lock","root":"C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\cleanup-014-GJWucZ","compromised":{"code":"ECOMPROMISED","message":"ENOENT: no such file or directory, stat 'C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\cleanup-014-GJWucZ\\.qa\\cache\\locks\\orders.lock'","path":"C:\\Users\\Judirico\\Documents\\QAMCP\\cierre-evidence\\physical-temp\\cleanup-014-GJWucZ\\.qa\\cache\\locks\\orders.lock"},"result":"same ENOENT/ECOMPROMISED as parallel A; heartbeat after cleanup"}
```

Una consulta CIM inicial dentro del sandbox no tuvo acceso. La consulta posterior con capacidades de pruebas filtró únicamente procesos node/chrome/msedge cuya línea incluyera cierre-evidence o este clon; no encontró coincidencias al finalizar. Es una observación puntual, no una certificación de todos los handles del sistema. Se conservaron directorios físicos de sondas de auditoría para readback, sin eliminarlos ni borrar temporales ajenos.

## Recorrido oficial y límites de aceptación

Discovery59, Interview44, tests de host programático/Stdio, qap_plan/qap_test y Runner auténtico se ejecutaron en las MCP completas. Los casos de integración usan fixture web consentido, gateway sintético e inbox sintético, y comprueban adquisición, revisión mecánica, datos canónicos, cierres y reportes. 5.4 demuestra el segmento waiver→reporte→WRAP_UP físico. Los cinco E0a/E1/E2/E3/Criterio9 originales siguen FAIL; no se declara pasada su cadena completa por sumar segmentos verdes de otros tests.

**No ejecutados/certificados:** E2E autenticado real con cuenta humana, revisión humana auténtica de requisitos/cierre, cadena oficial entera en una única sesión con evidencia humana y nueva sesión posterior, revisión dual de integración. Los fixtures no acreditan consentimiento humano. No se pidió ni fabricó tal autorización durante esta auditoría.

Sin garantías nuevas para POSIX, otros volúmenes, writers raw que ignoran fences, wrappers no soportados de AsyncLocalStorage ni pérdida de energía entre Closure/Knowledge/filesystem. No se reejecutaron auditorías históricas completas no afectadas.

## Manifiesto de evidencia local

Archivos originales bajo `C:/Users/Judirico/Documents/QAMCP/cierre-evidence`. SHA-256 permite comprobar que los registros usados en estos documentos corresponden a las corridas. Los seis documentos publicados conservan todas las identidades y los extractos físicos necesarios; no se publican DB/keys/sesiones. Los archivos de scripts siguientes son herramientas externas del auditor, no cambios productivos ni nuevas expectativas de tests.

| Archivo | SHA-256 |
| --- | --- |
| run-audit.ps1 | a0da31d4769a2d86810b45d0d8fcfafe4e883062eea6a6d3aedcb771d8d7a2f6 |
| setup.mjs | dc852aacc9f51518d19502ff4fea880cd000d2bc27f532cc4d69f9b3e91402df |
| cf01-probes.mjs | 4fcf62e9ad54eeeaf3e57847585790fa737bf5364b39648ae36a8101e2d34f32 |
| physical.mjs | 05c1e0dcbf54cbf38426c463c1f3a5ca343e3d1b6e973868a9dde340001ab276 |
| authority-probes.mjs | cebd86348ce7511358e09733be4700a673facd7d20095833568cbc9e8d789141 |
| cleanup-cause.mjs | d26ebb1e6481d6ea1b47d095d3513a199902384ac7514efe8f2a2feb905aa6c4 |
| browser-smoke.mjs | 3b527bc9d9ccec020da098ad7ea371df720ac35465c159e2c7fe97937432042e |
| static-checks.mjs | ad17e9f15d34d05528a94eb161551d3122d80cc95bafae352301e8329cd91db7 |
| analyze.mjs | d9ca7f2395cdaab94ed03b28f0278568888cd02531a8d460f1d64b5610da8a39 |
| coverage.json | d8bab240436a8c06eb881b5492bd8619165ecf611e1540b9428dad2433760236 |
| adversarial.json | f88cb04a3b7323fbff0e4951ebcad6685423f8327b2de885d31b4e117326e239 |
| mcp-serial.json | 995403d77f6404736d16d1abeb4a1f180bb816a923d9807c97effc0b123b0531 |
| mcp-parallel-a.json | 7590e70bea4afcc7d8be63f34a4adf76abd69a92be647317e622736dab7c2d60 |
| mcp-parallel-b.json | 967d024bbdfb7ddaf92d36b116f4803cda03b94ab60714bdf4446dfc801d07ea |
| commands.jsonl | eeae6434e888258d450c3154c4f9b85d018dcb4852ea33ebd4b7a4fb43defc9d |
| build.log | e63481a34fa380a838807a8272f75f8bdc5fe03ca4eacaa5d53cb171ca6bb86d |
| engine.log | a09cf40e98106422dbf4917bd06db415b58848a4dac1c74f786352a32d10aa07 |
| knowledge.log | 06b0cf5c7216b1fc4e38dad7fa36e873e4f45e4d89e2cf296f7426b64e8f1302 |
| runner.log | 79f398d76c3bed55606bd6c2117184cd3bbc66cf7d8c6abe71ece19c76b3f8f6 |
| cli.log | 03c5a41663691947af4411d19f472b2bceebb472f639cdde8c9603227ad7a5cc |
| eslint.json | d793be2ec592daa2ce58a642f6c1a9ec8bb096e59d5c0e40920cd417977dca7a |
| tsc.log | a66860c3d80f033e8914cc17692514fbb0e11eaa28f61114e19c623418950503 |
| static-checks.json | b8aaa6ff0d0a47188dacfd4a94f6ae9ac19754f0a56d40d030ad43c1c0f02e0b |
| cf01-probes.log | 163e40038d989e44ac03aeddc80b04210428c055180e3d880ea7903c2eb870d8 |
| physical.log | 7bd7c1ba91c3e23f9d70b3a38813831d2c8a4920d79eda483ccc72181f31a73d |
| authority-probes.log | b5f547415d1aafcadb54f9c5182efb097a723b5c19900bcd1f259b713b5e268f |
| cleanup-cause.log | 5ab95acb5f37141c3f3aeaa07f5333f63c70791455dee22639abc1517e196751 |
| browser-smoke.log | 8627a0b786a8905cec4fdf6f29295d6d5085c65a84bed90b7bf009501488f714 |


## Arneses reproducibles

Guardar estos bloques como archivos fuera del checkout y ajustar únicamente las rutas raíz cuando cambie el entorno. setup genera helpers ignorados; no modifica fuentes. Primero instalar/build congelados; después ejecutar los comandos de RESULTADOS_TESTS. Para sondas: setup, cf01-probes, physical, authority-probes, cleanup-cause y browser-smoke. No interpretar los asserts de las sondas como modificación de los tests originales.

### run-audit.ps1

```powershell
param([string]$Mode = 'core')
$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Judirico\Documents\QAMCP\vnext014-reparacion-audit'
$evidence = 'C:\Users\Judirico\Documents\QAMCP\cierre-evidence'
Set-Location -LiteralPath $repo
function Invoke-Audit([string]$Name, [string[]]$Arguments) {
  $tempPath = Join-Path $evidence ('tmp-' + $Name)
  New-Item -ItemType Directory -Force -Path $tempPath | Out-Null
  $env:TEMP = $tempPath
  $env:TMP = $tempPath
  $started = [DateTime]::UtcNow
  & pnpm @Arguments *> (Join-Path $evidence ($Name + '.log'))
  $result = [ordered]@{name=$Name; command=('pnpm ' + ($Arguments -join ' ')); start=$started.ToString('o'); durationSeconds=([DateTime]::UtcNow-$started).TotalSeconds; exitCode=$LASTEXITCODE; temp=$tempPath}
  $result | ConvertTo-Json -Compress | Add-Content -LiteralPath (Join-Path $evidence 'commands.jsonl')
  Write-Output ($result | ConvertTo-Json -Compress)
}
if ($Mode -eq 'core') {
  Invoke-Audit 'build' @('run','build')
  Invoke-Audit 'coverage' @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/canonical-coverage.test.ts','--no-file-parallelism','--reporter=default','--reporter=json',('--outputFile=' + $evidence + '\coverage.json'))
  Invoke-Audit 'adversarial' @('--filter','@qap/mcp','exec','vitest','run','src/__tests__/adversarial-r5-guarantees.test.ts','--no-file-parallelism','--reporter=default','--reporter=json',('--outputFile=' + $evidence + '\adversarial.json'))
  Invoke-Audit 'mcp-serial' @('--filter','@qap/mcp','exec','vitest','run','--no-file-parallelism','--reporter=default','--reporter=json',('--outputFile=' + $evidence + '\mcp-serial.json'))
  Invoke-Audit 'mcp-parallel-a' @('--filter','@qap/mcp','exec','vitest','run','--reporter=default','--reporter=json',('--outputFile=' + $evidence + '\mcp-parallel-a.json'))
  Invoke-Audit 'mcp-parallel-b' @('--filter','@qap/mcp','exec','vitest','run','--reporter=default','--reporter=json',('--outputFile=' + $evidence + '\mcp-parallel-b.json'))
}
if ($Mode -eq 'other') {
  Invoke-Audit 'engine' @('--filter','@qap/engine','test')
  Invoke-Audit 'knowledge' @('--filter','@qap/knowledge','test')
  Invoke-Audit 'runner' @('--filter','@qap/playwright-runner','test')
  Invoke-Audit 'cli' @('--filter','@hyouka73/qap-cli','test')
}

```

### setup.mjs

```javascript
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const root='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit';
const out=root+'/packages/mcp/node_modules/.audit-cierre';
mkdirSync(out,{recursive:true});
const req=createRequire(root+'/package.json'),tr=createRequire(req.resolve('tsup/package.json'));
const {build}=await import(pathToFileURL(tr.resolve('esbuild')));
const service='packages/mcp/src/handlers/canonical-closure-service.ts';
const base=execFileSync('git',['show','e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6:'+service],{cwd:root,encoding:'utf8'});
let source=readFileSync(root+'/packages/mcp/src/__tests__/canonical-coverage.test.ts','utf8').split("describe('VNEXT-013-R5 Comprehensive Physical Test Matrix'")[0];
source=source.replace("import { afterEach, describe, expect, it, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
source+="\nexport {ClosureStoreError} from '../handlers/module-closure-store.js';";
source+='\nexport {fixture,makeDecision,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter,FileSystemStorage,createMcpServer,KnowledgeStoreError};';
for(const version of ['head','base']) await build({stdin:{contents:source,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:out+'/fixture-'+version+'.mjs',plugins:version==='base'?[{name:'baseline-source-only',setup(b){b.onLoad({filter:/canonical-closure-service\.ts$/},()=>({contents:base,loader:'ts'}));}}]:[]});
let adv=readFileSync(root+'/packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts','utf8').split("describe('Adversarial Stress Audit")[0];
adv=adv.replace("import { describe, expect, it, afterEach, vi } from 'vitest';","const afterEach=()=>{}; const vi={restoreAllMocks(){}};");
adv+='\nexport {createCanonicalFixture,MockReviewGateway,CanonicalClosureService,SqliteModuleClosureStore,SqliteKnowledgeAdapter,createMcpServer};';
await build({stdin:{contents:adv,resolveDir:root+'/packages/mcp/src/__tests__',loader:'ts'},bundle:true,packages:'external',platform:'node',format:'esm',outfile:out+'/adversarial.mjs'});
writeFileSync('C:/Users/Judirico/Documents/QAMCP/cierre-evidence/helpers.json',JSON.stringify({root,out,sha:'76a338855f342a70acb184da5fbd7256dd980669',method:'Fixture helper prefixes extracted in memory; original tests and production files unchanged. Base control overlays only canonical-closure-service.ts from exact base; not a full baseline suite.'},null,2));
console.log(out);

```

### cf01-probes.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit';
const require=createRequire(root+'/packages/mcp/package.json');
const {Client}=await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/client/index.js')));
const {InMemoryTransport}=await import(pathToFileURL(require.resolve('@modelcontextprotocol/sdk/inMemory.js')));
const outputs=[];
for(const version of ['base','head']) {
 const m=await import('../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-cierre/fixture-'+version+'.mjs');
 for(const kind of ['CONFLICT','UNAVAILABLE','authorization_expired','closure_context_changed','closure_revision_conflict','lifecycle_context_missing','write_failed','conflict','unexpected','nested_commit','physical_drift']) {
  const f=await m.fixture({confirmedReqs:[{category:'functional',title:'Consulta sintética'}]});
  const before=f.closureStore.read(f.context), life=readFileSync(f.lifecyclePath,'utf8');
  let attempts=0;
  const broken={read:s=>f.closureStore.read(s),close(){},transaction:async(s,op)=>{
    attempts++;
    if(kind==='nested_commit') {
      const r=await f.store.get('app-r5','requirement','req-conf-1');
      await f.store.commit('app-r5',[{kind:'requirement',expected_revision:r.revision,entity:{...r.entity,description:'Cambió bajo fence'},trace:r.trace}]);
      return f.closureStore.transaction(s,op);
    }
    if(kind==='physical_drift') {
      writeFileSync(f.lifecyclePath,JSON.stringify({...f.lifecycle,session:{...f.lifecycle.session,id:'drifted-session'}}));
      return f.closureStore.transaction(s,op);
    }
    if(['CONFLICT','UNAVAILABLE'].includes(kind)) throw new m.KnowledgeStoreError(kind);
    if(['authorization_expired','write_failed','conflict'].includes(kind)) throw new m.ClosureStoreError(kind);
    throw new Error(kind==='unexpected'?'synthetic_disk_error C:/synthetic/PRIVATE_PATH token=SYNTHETIC_CANARY_014':kind);
  }};
  const svc=new m.CanonicalClosureService(f.store,f.context,broken,{reviewClosure:async r=>m.makeDecision(r)});
  let outcome;try { outcome={resolved:await svc.execute('catalog',{action:'declare_non_applicable',decisions:[{category:'performance',reason:'Categoría excluida explícitamente por el responsable sintético.'}]})};}
  catch(e){outcome={rejected:e.message,code:e.code};}
  assert.deepEqual(f.closureStore.read(f.context),before);
  assert.equal((await f.store.query('app-r5','relation')).items.length,0);
  assert.equal((await f.store.get('app-r5','requirement','req-conf-1')).revision,1);
  outputs.push({version,kind,attempts,...outcome,closureUnchanged:true,receiptCount:0,lifecycleChanged:readFileSync(f.lifecyclePath,'utf8')!==life});
  f.closureStore.close();f.store.close();
 }
 // Exercise the actual SDK route for an infrastructure exception with a synthetic canary.
 const f=await m.fixture();
 const broken={read:s=>f.closureStore.read(s),close(){},transaction:async()=>{throw new Error('synthetic_disk_error C:/synthetic/PRIVATE_PATH token=SYNTHETIC_CANARY_014');}};
 const server=m.createMcpServer({projectRoots:[f.root],knowledgeBindings:[{...f.context,store:f.store,moduleClosureStore:broken,moduleClosureReviewGateway:{reviewClosure:async r=>m.makeDecision(r)}}]});
 const client=new Client({name:'cierre-audit',version:'1'}),[ct,st]=InMemoryTransport.createLinkedPair();
 await server.connect(st);await client.connect(ct);
 const response=await client.callTool({name:'qap_module_close',arguments:{targetPath:f.root,module:'catalog',canonical_closure:{action:'waive',reason:'Renuncia sintética para verificar sanitización de fallos internos.'}}});
 outputs.push({version,kind:'mcp_sanitization',response,canaryLeaked:JSON.stringify(response).includes('SYNTHETIC_CANARY_014')});
 await client.close();await server.close();f.closureStore.close();f.store.close();
}
console.log(JSON.stringify(outputs,null,2));

```

### physical.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import * as a from '../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-cierre/adversarial.mjs';
const req=createRequire('C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/package.json');
const {Client}=await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/client/index.js')));
const {InMemoryTransport}=await import(pathToFileURL(req.resolve('@modelcontextprotocol/sdk/inMemory.js')));
const reason='Renuncia sintética autorizada para auditoría física independiente.';
const results=[];
const reopened=async(f,label)=>{
 const before=f.closureStore.read(f.context), receipts=await f.store.query('app-adv','relation');
 f.closureStore.close();f.store.close();
 const checks=[];
 for(const path of [f.closureDbPath,f.knowledgeDbPath]) {
  const db=new DatabaseSync(path,{readOnly:true});
  const integrity=db.prepare('PRAGMA integrity_check').all();
  const fk=db.prepare('PRAGMA foreign_key_check').all();
  assert.equal(integrity.length,1);assert.equal(integrity[0].integrity_check,'ok');assert.equal(fk.length,0);
  checks.push({path,integrity,fk,tables:db.prepare("select name from sqlite_master where type='table'").all()});db.close();
 }
 f.closureStore=new a.SqliteModuleClosureStore({path:f.closureDbPath,key:f.closureKey,...f.context,protection:'host_private_directory_and_managed_key',initialize:false});
 f.store=new a.SqliteKnowledgeAdapter(f.knowledgeDbPath);
 f.service=new a.CanonicalClosureService(f.store,f.context,f.closureStore,f.gateway);
 const snapshot=f.closureStore.read(f.context),readback=await f.store.query('app-adv','relation');
 assert.deepEqual(snapshot,before);assert.deepEqual(readback.items,receipts.items);
 assert.equal(new Set(snapshot.approvals.map(v=>v[0])).size,snapshot.approvals.length);
 const lifecycle=JSON.parse(readFileSync(join(f.root,'.qa/project/lifecycle.json'),'utf8'));
 const entry={label,root:f.root,checks,snapshot,receiptCount:readback.items.length,receipts:readback.items,lifecycle};
 results.push(entry);return entry;
};
const finish=f=>{f.closureStore.close();f.store.close();};
for(const [label,active] of [['3.1',true],['3.2',false]]) {
 const gateway=new a.MockReviewGateway(),f=await a.createCanonicalFixture({gateway,physicalKnowledge:true});
 const original=gateway.reviewClosure.bind(gateway);
 gateway.reviewClosure=async r=>{const d=await original(r);const old=await f.store.get('app-adv','module','module-catalog');await f.store.commit('app-adv',[{kind:'module',expected_revision:1,entity:{...old.entity,is_active:active,title:'Mutación sintética durante revisión'},trace:old.trace}]);return d;};
 const response=await f.service.execute('catalog',{action:'waive',reason});
 assert.equal(response.code,'closure_context_changed');const e=await reopened(f,label);e.response=response;
 assert.equal(e.snapshot.approvals.length,0);assert.equal(e.receiptCount,0);assert.equal(e.lifecycle.modules.catalog.state,'planned');
 finish(f);
}
{
 const f=await a.createCanonicalFixture({physicalKnowledge:true});
 const first=await f.service.execute('catalog',{action:'waive',reason});assert.equal(first.status,'waived');
 await assert.rejects(f.closureStore.transaction(f.context,async s=>{if(s.approvals.some(v=>v[0]===first.decision_id))throw new Error('closure_decision_reused');s.approvals.push([first.decision_id,'forged-request-digest']);}));
 const e=await reopened(f,'3.3');assert.equal(e.snapshot.approvals.length,1);assert.equal(e.receiptCount,1);finish(f);
}
{
 const f=await a.createCanonicalFixture({physicalKnowledge:true});
 const server=a.createMcpServer({projectRoots:[f.root],knowledgeBindings:[{...f.context,store:f.store,moduleClosureStore:f.closureStore,moduleClosureReviewGateway:f.gateway}]});
 const client=new Client({name:'physical-audit',version:'1'}),[ct,st]=InMemoryTransport.createLinkedPair();await server.connect(st);await client.connect(ct);
 const closed=await client.callTool({name:'qap_module_close',arguments:{targetPath:f.root,module:'catalog',canonical_closure:{action:'waive',reason}}});assert.ok(!closed.isError);
 const response=await client.callTool({name:'qap_session_close',arguments:{targetPath:f.root}});assert.ok(!response.isError);const parsed=JSON.parse(response.content[0].text);assert.equal(parsed.fase,'WRAP_UP');assert.equal(parsed.status,'success');assert.ok(existsSync(parsed.report_path));
 const report=readFileSync(parsed.report_path,'utf8');assert.ok(report.includes('catalog'));
 await client.close();await server.close();const e=await reopened(f,'5.4');e.response=parsed;e.report=report;assert.equal(e.receiptCount,1);assert.equal(e.snapshot.approvals.length,1);assert.equal(e.lifecycle.phase,'WRAP_UP');finish(f);
}
{
 const f=await a.createCanonicalFixture({physicalKnowledge:true});
 const first=await f.service.execute('catalog',{action:'waive',reason});
 await reopened(f,'7.2-first');
 const second=await f.service.execute('catalog',{action:'waive',reason:'Segunda llamada sintética tras reapertura física completa.'});assert.equal(second.idempotent,true);assert.equal(second.decision_id,first.decision_id);
 const e=await reopened(f,'7.2');e.response=second;assert.equal(e.receiptCount,1);assert.equal(e.snapshot.approvals.length,1);finish(f);
}
for(const label of ['7.3','7.4']) {
 const f=await a.createCanonicalFixture({physicalKnowledge:true,extraModules:label==='7.3'});
 let baseline=0;
 if(label==='7.4') {await f.service.execute('catalog',{action:'declare_non_applicable',decisions:['functional','business_rule','security','ui','ux','regression','performance'].map(category=>({category,reason:'No aplicable según decisión del responsable sintético.'}))});baseline=f.closureStore.read(f.context).approvals.length;}
 const cs=new a.SqliteModuleClosureStore({...f.context,path:f.closureDbPath,key:f.closureKey,initialize:false,protection:'host_private_directory_and_managed_key'}),ks=new a.SqliteKnowledgeAdapter(f.knowledgeDbPath),svc=new a.CanonicalClosureService(ks,f.context,cs,f.gateway);
 const responses=await Promise.all([f.service.execute('catalog',label==='7.3'?{action:'waive',reason}:{action:'close'}),svc.execute(label==='7.3'?'billing':'catalog',{action:'waive',reason})]);
 cs.close();ks.close();const e=await reopened(f,label);e.responses=responses;e.baselineApprovals=baseline;
 assert.equal(e.receiptCount,label==='7.3'?2:1);assert.equal(e.snapshot.approvals.length-baseline,label==='7.3'?2:1);
 for(const v of Object.values(e.snapshot.closures))assert.ok(e.snapshot.approvals.some(x=>x[0]===v.decisionId));
 if(label==='7.4')assert.equal(responses.filter(x=>x.idempotent===true).length,1);finish(f);
}
{
 // This is a separate isolating probe. The original 7.5 remains FAIL/ERROR:
 // its `certainty: unconfirmed` is invalid for SQLite and is never edited.
 const gateway=new a.MockReviewGateway(),f=await a.createCanonicalFixture({gateway,physicalKnowledge:true});
 const approvalId='dec-tampered-receipt-test';gateway.reviewClosure=async r=>({approvalId,requestDigest:r.requestDigest,coverageDigest:r.coverageDigest,reviewer:'synthetic-reviewer',decidedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),decision:'approve'});
 const t=new Date().toISOString(),trace={source:'attacker',recorded_by:'attacker',recorded_at:t,reason:'synthetic-attacker',review:'unreviewed',evidence_refs:[]};
 const attacker={id:'module-forged-attacker',application_id:'app-adv',key:'forged',title:'Forged',certainty:'unconfirmed',criticality:'low',dependencies:[],created_at:t,updated_at:t,is_active:true};
 await assert.rejects(f.store.commit('app-adv',[{kind:'module',expected_revision:0,entity:attacker,trace}]),e=>e.code==='INVALID_DATA');
 await f.store.commit('app-adv',[{kind:'module',expected_revision:0,entity:{...attacker,certainty:'observed'},trace},{kind:'relation',expected_revision:0,entity:{id:'waiver:'+approvalId,predicate:'related_to',source:{kind:'module',id:attacker.id,revision:1},target:{kind:'application',id:'app-adv',revision:1}},trace:{...trace,source:'canonical_module_waiver_v1',review:'reviewed',reason:'tampered-digest'}}]);
 await assert.rejects(f.service.execute('catalog',{action:'waive',reason}),/closure_receipt_provenance_invalid/);
 const e=await reopened(f,'7.5-isolation-only');assert.equal(e.lifecycle.phase,'WORKING');assert.equal(e.lifecycle.modules.catalog.state,'planned');assert.equal(e.receipts[0].trace.recorded_by,'attacker');
 await assert.rejects(f.service.execute('catalog',{action:'waive',reason}),/closure_receipt_provenance_invalid/);
 e.retryRejected=true;e.originalTestStatus='ERROR before receipt setup';finish(f);
}
console.log(JSON.stringify(results,null,2));

```

### authority-probes.mjs

```javascript
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as a from '../vnext014-reparacion-audit/packages/mcp/node_modules/.audit-cierre/adversarial.mjs';
const reason='Renuncia sintética autorizada para comprobar no reutilización de autoridad.';
const output=[];
const reopen=f=>{f.closureStore.close();f.store.close();f.store=new a.SqliteKnowledgeAdapter(f.knowledgeDbPath);f.closureStore=new a.SqliteModuleClosureStore({...f.context,path:f.closureDbPath,key:f.closureKey,initialize:false,protection:'host_private_directory_and_managed_key'});f.service=new a.CanonicalClosureService(f.store,f.context,f.closureStore,f.gateway);};
{
 const g=new a.MockReviewGateway(),review=g.reviewClosure.bind(g);g.reviewClosure=async r=>({...await review(r),approvalId:'synthetic-reused-approval'});
 const f=await a.createCanonicalFixture({physicalKnowledge:true,extraModules:true,gateway:g});
 assert.equal((await f.service.execute('catalog',{action:'waive',reason})).status,'waived');
 let rejected;try{await f.service.execute('billing',{action:'waive',reason});}catch(e){rejected=e.message;}
 assert.ok(rejected);reopen(f);const snapshot=f.closureStore.read(f.context),receipts=await f.store.query('app-adv','relation');
 assert.equal(snapshot.approvals.length,1);assert.equal(receipts.items.length,1);assert.ok(!snapshot.closures.billing);
 output.push({scenario:'3.3 service-level replay of one approvalId across two modules',rejected,snapshot,receiptCount:receipts.items.length,gatewayCalls:g.requests.length});f.store.close();f.closureStore.close();
}
{
 const g=new a.MockReviewGateway(),f=await a.createCanonicalFixture({physicalKnowledge:true,gateway:g});
 const commit=f.store.commit.bind(f.store);f.store.commit=async(app,writes)=>{if(writes.some(w=>w.kind==='relation'))throw new Error('synthetic_receipt_write_interruption');return commit(app,writes);};
 await assert.rejects(f.service.execute('catalog',{action:'waive',reason}),/synthetic_receipt_write_interruption/);
 const before={snapshot:f.closureStore.read(f.context),receipts:(await f.store.query('app-adv','relation')).items.length,lifecycle:JSON.parse(readFileSync(f.root+'/.qa/project/lifecycle.json'))};
 assert.equal(before.receipts,0);assert.equal(before.lifecycle.modules.catalog.state,'planned');
 reopen(f);const response=await f.service.execute('catalog',{action:'waive',reason});
 const after={snapshot:f.closureStore.read(f.context),receipts:(await f.store.query('app-adv','relation')).items.length,lifecycle:JSON.parse(readFileSync(f.root+'/.qa/project/lifecycle.json'))};
 assert.equal(response.idempotent,true);assert.equal(g.requests.length,1);assert.equal(after.receipts,1);assert.deepEqual(after.snapshot,before.snapshot);assert.equal(after.lifecycle.modules.catalog.state,'waived');
 output.push({scenario:'physical reopen after interruption between Closure commit and Knowledge receipt',before,after,response,gatewayCalls:g.requests.length});f.store.close();f.closureStore.close();
}
console.log(JSON.stringify(output,null,2));

```

### cleanup-cause.mjs

```javascript
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/mcp/package.json');
const {LockManager}=require('@qap/knowledge');
const root=mkdtempSync(join(tmpdir(),'cleanup-014-'));
let compromised;
process.once('uncaughtException',e=>{compromised={code:e.code,message:e.message,path:e.path};});
const release=await new LockManager({rootDir:root}).acquireModuleLock('orders');
rmSync(root,{recursive:true,force:true});
await new Promise(r=>setTimeout(r,5500));
await release();
assert.equal(compromised?.code,'ECOMPROMISED');
console.log(JSON.stringify({scenario:'Delete synthetic root before draining a held official module lock',root,compromised,result:'same ENOENT/ECOMPROMISED as parallel A; heartbeat after cleanup'}));

```

### browser-smoke.mjs

```javascript
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit/packages/playwright-runner/package.json');
const {chromium}=require('playwright-core'),version=require('playwright-core/package.json').version;
const browser=await chromium.launch({headless:true});
try {const context=await browser.newContext();const page=await context.newPage();await page.setContent('<!doctype html><title>fixture autorizado</title><h1>Auditoría 014</h1>');assert.equal(await page.title(),'fixture autorizado');console.log(JSON.stringify({playwright:version,executable:chromium.executablePath(),browser:browser.version(),realLaunch:true,syntheticDocument:true}));await context.close();}finally{await browser.close();}

```

### static-checks.mjs

```javascript
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const root='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit',out='C:/Users/Judirico/Documents/QAMCP/cierre-evidence';
const require=createRequire(root+'/package.json');
const ts=require('typescript');
const {ESLint}=await import(pathToFileURL(require.resolve('eslint')));
const files=['packages/mcp/src/handlers/canonical-closure-service.ts','packages/mcp/src/__tests__/canonical-coverage.test.ts','packages/mcp/src/__tests__/adversarial-r5-guarantees.test.ts'];
const base=new Map(files.map(f=>[f,execFileSync('git',['show','e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6:'+f],{cwd:root,encoding:'utf8'})]));
const lint={};
const eslint=new ESLint({cwd:root});
for(const version of ['base','head']) {
 lint[version]=[];
 for(const f of files){const source=version==='base'?base.get(f):readFileSync(root+'/'+f,'utf8');const result=await eslint.lintText(source,{filePath:root+'/'+f});lint[version].push({file:f,errorCount:result[0].errorCount,warningCount:result[0].warningCount,messages:result[0].messages});}
}
const config=ts.readConfigFile(root+'/packages/mcp/tsconfig.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root+'/packages/mcp',undefined,root+'/packages/mcp/tsconfig.json');
const diagnostics={};
for(const version of ['base','head']) {
 const host=ts.createCompilerHost(parsed.options),read=host.readFile;
 host.readFile=path=>{const relative=path.replaceAll('\\','/').replace(root+'/','');return version==='base'&&base.has(relative)?base.get(relative):read(path);};
 const p=ts.createProgram(parsed.fileNames,parsed.options,host);
 diagnostics[version]=ts.getPreEmitDiagnostics(p).map(d=>({file:d.file?.fileName.replaceAll('\\','/').replace(root+'/',''),line:d.file&&d.start!==undefined?d.file.getLineAndCharacterOfPosition(d.start).line+1:undefined,code:d.code,category:d.category,message:ts.flattenDiagnosticMessageText(d.messageText,' ')}));
}
const counts=xs=>{const m=new Map();for(const d of xs){const k=JSON.stringify([d.file,d.code,d.message]);m.set(k,(m.get(k)??0)+1);}return m;};
const b=counts(diagnostics.base),h=counts(diagnostics.head),added=[],removed=[];
for(const key of new Set([...b.keys(),...h.keys()])){const delta=(h.get(key)??0)-(b.get(key)??0);if(delta>0)added.push({identity:JSON.parse(key),count:delta});if(delta<0)removed.push({identity:JSON.parse(key),count:-delta});}
const result={method:'Read-only in-memory baseline overlay of exactly three changed TypeScript files. TypeScript full MCP project diagnostics; ESLint three changed files under actual filenames. Not a baseline functional suite.',baseSHA:'e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6',headSHA:'76a338855f342a70acb184da5fbd7256dd980669',lint,diagnostics,added,removed};
writeFileSync(out+'/static-checks.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({lint,tsCounts:{base:diagnostics.base.length,head:diagnostics.head.length},added,removed},null,2));

```

### analyze.mjs

```javascript
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const repo='C:/Users/Judirico/Documents/QAMCP/vnext014-reparacion-audit',out='C:/Users/Judirico/Documents/QAMCP/cierre-evidence';
const read=n=>JSON.parse(readFileSync(out+'/'+n+'.json','utf8'));
const entries=j=>j.testResults.flatMap(f=>f.assertionResults.map(t=>({file:f.name.replaceAll('\\','/').split('/packages/mcp/').at(-1),fullName:t.fullName,status:t.status,duration:t.duration,errors:t.failureMessages??[]})));
const keyed=xs=>{const counts=new Map();return xs.map(x=>{const k=x.file+'\0'+x.fullName,occurrence=(counts.get(k)??0)+1;counts.set(k,occurrence);return {...x,occurrence,key:k+'\0'+occurrence};});};
const runs=Object.fromEntries(['coverage','adversarial','mcp-serial','mcp-parallel-a','mcp-parallel-b'].map(n=>[n,{summary:{total:read(n).numTotalTests,pass:read(n).numPassedTests,fail:read(n).numFailedTests},tests:keyed(entries(read(n)))}]));
const maps=Object.fromEntries(Object.entries(runs).map(([k,v])=>[k,new Map(v.tests.map(t=>[t.key,t]))]));
const lines=readFileSync(repo+'/docs/vnext/implementaciones/VNEXT-014-CIERRE-CONTROLADO/MATRIZ_HALLAZGOS.md','utf8').split(/\r?\n/).filter(l=>/^\| \d+ \|/.test(l));
const matrix=lines.map(l=>{const p=l.split(' | '),id=Number(p[0].replace('|','').trim()),[file,...name]=p[1].split(' · '),fullName=name.join(' · '),key='src/__tests__/'+file+'\0'+fullName+'\0'+1;const current=maps['mcp-serial'].get(key);if(!current)throw Error('Missing historical identity '+id+': '+key);return {id,file:'src/__tests__/'+file,fullName,historicalError:p[2],historicalClass:p[3],currentClass:current.status==='passed'?'FAIL → PASS; physical fixture equivalence':id===8?'FAIL → FAIL; distinct defect exposed (fixture INVALID_DATA)':'FAIL → FAIL; same first legacy contract/fixture blocker',serial:current.status,parallelA:maps['mcp-parallel-a'].get(key)?.status??'absent',parallelB:maps['mcp-parallel-b'].get(key)?.status??'absent',error:current.errors[0]??'',key};});
if(matrix.length!==63)throw Error('Expected exactly 63 historical rows');
const historical=new Set(matrix.map(x=>x.key));
const extras=runs['mcp-serial'].tests.filter(t=>t.status==='failed'&&!historical.has(t.key));
const parallelDiff=Object.fromEntries(['mcp-parallel-a','mcp-parallel-b'].map(n=>[n,runs[n].tests.filter(t=>maps['mcp-serial'].get(t.key)?.status!==t.status)]));
const old=JSON.parse(readFileSync('C:/Users/Judirico/Documents/QAMCP/rescate-evidence/mcp.json','utf8'));
const baseline=keyed(entries(old)),bm=new Map(baseline.map(t=>[t.key,t]));
const comparison={baselineSHA:'e71818ac6fdaa1847e300a67bd4540fbfbd514c5',counts:{},absent:baseline.filter(t=>!maps['mcp-serial'].has(t.key)),new:runs['mcp-serial'].tests.filter(t=>!bm.has(t.key))};
for(const t of runs['mcp-serial'].tests){const k=(bm.get(t.key)?.status??'absent')+' → '+t.status;comparison.counts[k]=(comparison.counts[k]??0)+1;}
const lint=read('eslint');
const lintSummary={errors:lint.reduce((n,f)=>n+f.errorCount,0),warnings:lint.reduce((n,f)=>n+f.warningCount,0),files:lint.filter(f=>f.messages.length).map(f=>({file:f.filePath.replaceAll('\\','/').split('/vnext014-reparacion-audit/').at(-1),messages:f.messages}))};
writeFileSync(out+'/analysis.json',JSON.stringify({runs,matrix,extras,parallelDiff,comparison,lintSummary},null,2));
console.log(JSON.stringify({counts:Object.fromEntries(Object.entries(runs).map(([k,v])=>[k,v.summary])),matrix:{pass:matrix.filter(t=>t.serial==='passed').length,fail:matrix.filter(t=>t.serial==='failed').length},extras:extras.map(t=>t.fullName),parallelDiff:Object.fromEntries(Object.entries(parallelDiff).map(([k,v])=>[k,v.map(t=>({name:t.fullName,duration:t.duration,error:t.errors[0]}))])),comparison:{counts:comparison.counts,absent:comparison.absent.length,new:comparison.new.length},lint:lintSummary},null,2));

```
