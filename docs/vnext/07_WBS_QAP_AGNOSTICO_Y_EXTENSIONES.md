# WBS propuesto — QAP agnóstico, extensiones opcionales y adopción operativa

**Fecha:** 2026-11-05 · **Estado:** PROPUESTA PARA REVISIÓN, NO AUTORIZADA PARA IMPLEMENTACIÓN.  
**Rama documental:** docs/qap-roadmap-agnostico-20261105, derivada de vNext 7ccf3db1a6f259f6a5c51521518bbb399a13fda2.  
**Complementa, no sustituye:** `04_BACKLOG_Y_WBS_PRELIMINAR.md` (VNEXT-001–023), `02_ARQUITECTURA_OBJETIVO_Y_CONTRATOS.md`, `REQUISITOS_Y_DECISIONES.md` y `06_AUDITORIA_CRUCE_DEVELOP_VNEXT.md`.

## 0. Problema que se busca resolver

QAP debe servir para ejecutar QA funcional y regresión de productos web, Android y futuras plataformas, aun **sin acceso al código fuente**. Debe ayudar a comprender, documentar y validar comportamiento, reproducir bugs, preparar datos autorizados, generar casos UI, seleccionar regresiones, conservar trazabilidad y permitir que un nuevo QA se incorpore sin depender del conocimiento oral del primero.

El caso motivador es un equipo con un QA y varios productos de entrega frecuente. La principal pérdida de tiempo es recrear clientes, solicitudes, préstamos, estados y pagos para reproducir defectos. Esos nombres pertenecen **solamente** a la extensión LENDUS, no al dominio de QAP.

**Objetivos de producto:**
- Conservar un catálogo de aplicaciones, entornos, roles, versiones, configuraciones, módulos, flujos y sus dependencias.
- Diferenciar siempre observación, hipótesis, requisito esperado confirmado, caso ejecutable y conformidad evidenciada; jamás inventar PASS.
- Poder operar con URL + perfil autorizado + reglas aportadas/revisadas; código, repositorio Git y OpenAPI son fuentes opcionales.
- Reutilizar escenarios de datos y casos con procedencia, versionado, aserciones y políticas de limpieza.
- Ofrecer planificación por riesgo, inventario de defectos, priorización y reportes **sin dependencia obligatoria de Jira/Xray**.
- Preparar una arquitectura de adaptadores: Playwright existente; ejecutor Android futuro; APIs HTTP/UTCP opcionales; pruebas manuales guiadas.
- Mantener QAP completamente agnóstico. LENDUS será plugin/paquete externo con implementación y credenciales privadas.

## 1. Fronteras y decisiones arquitectónicas propuestas

### ADR-QAP-016 — Núcleo agnóstico y puertos de extensión

`@qap/shared` define contratos versionados; `@qap/engine` coordina procesos, oráculos, riesgos, prerequisitos y transiciones; `@qap/knowledge` conserva entidades/historia; `@qap/mcp` y CLI son superficies de invocación; `@qap/playwright-runner` sigue siendo un ejecutor concreto.

Crear **puertos**, no dependencias del negocio: `IScenarioProvider`, `IToolProvider`, `ITestExecutor`, `ITestOracle`, `IIncidentStore` y `IEvidenceStore` (nombres propuestos, no interfaces implementadas). Un manifiesto de capability declara qué soporta cada adaptador, versión de contrato, plataformas, entornos autorizados, tipos de operación, límites, necesidad de aprobación y redacción.

No incluir conceptos financieros en tipos del núcleo: cliente bancario, producto crediticio, préstamo, tasa, cobranza o pago serán metadatos/extensiones de negocio. En QAP, `ApplicationUnderTest` y `ConfigurationProfile` nombran aplicaciones y variantes genéricas; no usar `Product` ambiguamente para un instrumento financiero.

### ADR-QAP-017 — Preparar datos no equivale a aprobar resultados

`ScenarioRecipe` contiene identidad y revisión, dependencias, parámetros sintéticos, preparación, verificaciones del estado inicial, contexto de entorno, procedimiento de limpieza, autorizaciones y referencias opacas. `FixtureRun` registra acciones ejecutadas, recursos creados, snapshots, resultado, reintentos, rollback/compensación y procedencia. Preparar fixture correctamente no acredita que la funcionalidad bajo prueba cumpla la regla de negocio.

Distinguir `not_prepared`, `ready`, `failed`, `blocked` e `indeterminate` en preparación; y `passed`, `failed`, `blocked`, `not_run` e `indeterminate` en evaluación, con mapeo explícito a contratos existentes, sin degradar semántica ni inventar estados en schemas actuales.

### ADR-QAP-018 — UTCP y otros protocolos serán opcionales

QAP debe funcionar sin UTCP instalado, sin API de preparación y sin OpenAPI. `IToolProvider` ofrece un contrato estable de herramientas autorizadas; implementaciones posibles: llamadas HTTP nativas permitidas por host, UTCP TypeScript (HTTP/OpenAPI y otros plugins permitidos), adaptador MCP cuando aplique, fixture manual guiado. **No reemplazar ni eliminar el servidor MCP de QAP**: UTCP es una opción de consumo de herramientas de la aplicación bajo prueba. No importar `@utcp/*` en el núcleo.

Descubrimiento de herramientas no implica permiso para ejecutarlas. Política por aplicación/entorno/rol/operación con denegación por defecto, aprobación humana para mutaciones, allowlist explícita de hosts, protección DNS/redirect/SSRF, límite de efectos, correlación de llamadas y manejo de secreto fuera de Knowledge. En modo producción, escritura bloqueada por defecto.

### ADR-QAP-019 — Ejecución multiplataforma y evidencia

Introducir un coordinador que resuelva un ejecutor registrado por plataforma y capabilities, preservando `PlaywrightRunner` y `qap_test`. Un adaptador ARTEMIS de Android será opcional, sujeto a contrato/versiones y capacidades disponibles; no exportar las dependencias de Android a consumidores puramente web. El mismo caso canónico puede tener realizaciones específicas de pasos por plataforma, no asumir que CSS es válido en Android.

Cada ejecución registra release/build/configuración, device/emulador, permisos, estado inicial, pasos, oráculos independientes y evidencias realmente capturadas con enmascaramiento. Texto de agente, captura o navegación lograda no constituye PASS sin aserción esperada confirmada.

### ADR-QAP-020 — Conservación de contribuciones develop

El generador BVA S81-001 se integra como generador de **candidatos**; su confianza no procede de reglas DOM inferidas ni del status de YAML legacy sin procedencia. `case_category` y `source_rule_id` se versionan con el contrato de casos canónico. Update/rollback y prune se preservan, pero solo se conectan a entidades/historial mediante mecanismos de migración verificados. Véase `06_AUDITORIA_CRUCE_DEVELOP_VNEXT.md`.

### ADR-QAP-021 — Multiusuario no se resuelve compartiendo una SQLite

El estado local actual es válido para un operador individual, pero no garantiza colaboración entre personas ni RBAC real. El modo colaborativo requerirá servicio/autorización, identificación de actor, control optimista de revisiones, auditoría y almacenamiento de evidencias respaldado; la elección SQLite/local versus un adaptador de servicio central se decidirá con pruebas de concurrencia, no por conveniencia.

## 2. Modelo lógico mínimo, agnóstico y trazable

Entidades deseadas (reutilizar las existentes donde corresponda, no duplicarlas): `ApplicationContext`, `EnvironmentPolicy`, `RolePermissionScope`, `DomainModule`, `FlowScenario`, `ApplicationObservation`, `AgentInference`, `ExpectedRequirement`, `ConformityAssessment`, `TestCase`, `TestPlan`, `ExecutionResult`, `MultimodalEvidenceRef`; agregar cuando falten `ConfigurationProfile`, `ScenarioRecipe`, `FixtureRun`, `Incident`, `ReleaseCandidate`, `ProviderManifest`, `ManualReviewDecision`.

Relaciones mínimas versionadas: aplicación→entorno/configuración→módulo→flujo; requisito confirmado con revisión→caso→ejecución→evidencia→evaluación; cambio/incidente→escenario de reproducción→causa probable y módulos afectados→casos de regresión; recurso creado→fixture→limpieza. Nunca atribuir un resultado a un requisito distinto por ID o revisión obsoletos. Conservar historial sin secretos ni PII sin tratar.

**Oráculo:** el ExpectedRequirement revisado, criterios de aceptación y configuración aprobada son autoridad; la observación del sistema no puede establecer por sí misma el resultado correcto.

## 3. WBS aditivo VNEXT-024–033 (propuesto, NO GO)

Estos IDs se reservan **solo en esta propuesta**, sin renumerar VNEXT-001–023 ni autorizar tareas posteriores a VNEXT-014. La implementación efectiva depende de sus compuertas.

| ID | Hito | Entrega verificable | Dependencias | Prioridad |
|---|---|---|---|---|
| VNEXT-024 | Catálogo multiproducto y configuraciones | Entidades revisables de aplicación, entorno, rol, módulo, flujo, build y configuración, aisladas por scope | VNEXT-001–004, VNEXT-013 | P0 funcional |
| VNEXT-025 | Intake de incidentes y reproducción guiada | Captura de contexto variable, entrevista de datos faltantes, pasos, evidencia, estado reproducido/no reproducido/blocked | 024, VNEXT-016/017 en lo aplicable | P0 funcional |
| VNEXT-026 | Recetas de escenarios y datos de prueba | DSL/contrato versionado de preparación, verificación, recursos opacos, reintentos y limpieza sin API obligatoria | 024, VNEXT-014 estable | P0 funcional |
| VNEXT-027 | Puerto de herramientas y adaptador UTCP opcional | `IToolProvider`, proveedor HTTP permitido, plugin UTCP aislado, descubrimiento separado de autorización, registros auditables | 026, bóveda VNEXT-005 | P1 |
| VNEXT-028 | Generador/revisor de casos funcionales UI y BVA | Casos candidatos desde requisitos confirmados, reglas de valores límite, selector y aserción fundamentados, protección de ediciones | 014, 024, aporte develop BVA | P0 funcional |
| VNEXT-029 | Registro de ejecutores y adaptador ARTEMIS | Playwright intacto + ejecutor Android opcional, misma integridad de resultados, dispositivos, artefactos y políticas | 014, 028 | P1 |
| VNEXT-030 | Regresión basada en impacto, riesgo y configuración | Selección y justificación reproducible de smoke/focal/regresión por cambio, dependencia, criticidad y configuración | VNEXT-015/016, 024, 028 | P0 funcional |
| VNEXT-031 | Operación de QA y liberaciones | Cola de cambios/incidentes, prioridad y severidad distintas, bloqueos, compuertas, reporte de riesgo y decisión humana | 025, 030, VNEXT-017 | P1 |
| VNEXT-032 | Colaboración y onboarding | Import/export durable, versionado, permisos, revisión/autorización, sincronización multiusuario y guía de aprendizaje | 024, 031 y diseño de persistencia | P1 |
| VNEXT-033 | Pilotos integrales y certificación cruzada | Web sin código, datos por API opcional, Android, defectos y reportes reales, compatibilidad develop↔vNext | 026–032 y VNEXT-020/022 | P0 de cierre |

### VNEXT-024 — criterios de aceptación

Registrar tres aplicaciones sintéticas (web, Android, híbrida) en al menos dos entornos y configuraciones sin colisiones de IDs, sin mezcla de reglas/casos/secretos. Import/export conserva historial y relaciones. Versiones de configuración explican qué casos son aplicables. No se exige código fuente.

### VNEXT-025 — criterios de aceptación

Entrada rica/mediana/escasa de un bug; los datos desconocidos quedan explícitos; QAP pide el mínimo faltante, no inventa reproducción. Genera registro vinculado a flujo/configuración, evidencia saneada y opciones de reproducción. Separar prioridad comercial, severidad técnica, frecuencia, impacto y confidence de diagnóstico. Escenario inaccesible produce BLOCKED/indeterminate y no falso FAIL/PASS.

### VNEXT-026 — criterios de aceptación

Preparar un escenario sintético genérico de 3 dependencias en staging: primera ejecución, segundo intento idéntico, fallo a mitad, reanudación y limpieza. Idempotencia o bloqueo seguro explícitos ante operación no idempotente. Una API ausente permite procedimiento manual; no bloquea el resto de QAP. No guardar tokens, contraseñas ni datos reales en el KnowledgeStore. Las recetas no prueban negocio por sí solas.

### VNEXT-027 — criterios de aceptación

Mismo contrato sobre proveedor simulado y UTCP opcional; sin dependencia UTCP el núcleo compila y ejecuta pruebas web/manuales. OpenAPI/UTCP solo expone operaciones previamente autorizadas. Rechazar hosts/redirects fuera de allowlist, mutación en producción, permiso insuficiente, credenciales faltantes y operación no declarada; comprobar que no se realizó la llamada. Verificar error/retry/timeout, correlación y redacción. Fijar versiones compatibles y validar avisos/licencias antes de empaquetar.

### VNEXT-028 — criterios de aceptación

Un requisito confirmado con revisión produce casos deterministas y editables; uno inferido solo produce propuestas pendientes de revisión. BVA solo opera sobre límites, tipos, unidades e inclusividad conocidos: no inventar ±10 ni selectores de éxito/error por defecto. Pruebas positivas/negativas reconocen comportamiento esperado. Cambios de requisito invalidan/regeneran candidatos, protegen casos manuales. Comparar schemas/typegen y `qap_plan`/`qap_test`/CLI, no asumir compatibilidad.

### VNEXT-029 — criterios de aceptación

Ejecutar caso web existente sin regresión y caso Android en emulador autorizado con estado inicial controlado, oráculo definido, captura/trace reales y resultado reproducible. Sin ARTEMIS el núcleo sigue funcionando. No contar instrucciones completadas como aserción aprobada; errores de ADB, permisos, crash de dispositivo y bloqueo de UI distinguen infra/blocked/test failure. La integración externa conserva configuración/estado del dispositivo y enmascara PII.

### VNEXT-030 — criterios de aceptación

Cambio sintético de regla o configuración afecta un grafo de flujos. QAP produce selección reproducible con explicación y evidencia, identifica lo que **no está cubierto**, exige revisión ante incertidumbre; no declarar "regresión completa" cuando faltan casos/oráculos. Combinar reglas, roles, configuración, integración y entorno. Determinismo del DAG y política de riesgo probados.

### VNEXT-031 — criterios de aceptación

Sin Jira/Xray es posible registrar solicitud, defecto, responsable, prioridad, evidencia, resultado, deuda, versión y riesgo aceptado. Reporte de release distingue PASS/FAIL/BLOCKED/not_run, porcentaje de cobertura sobre requisitos conocidos, y aprobación humana de riesgos; "sin bugs detectados" no equivale a release autorizado. API de exportación abierta, no requerir servicio externo de pago.

### VNEXT-032 — criterios de aceptación

Dos QA con permisos distintos crean/revisan casos sin pérdida de historial ni aprobación por sí mismos. Trazabilidad de actor, conflicto CAS y auditoría; acceso al perfil secreto estrictamente separado. Un QA nuevo puede instalar QAP, importar la guía, identificar un flujo, preparar fixture permitido y ejecutar smoke sin acompañamiento oral. Backup/restore real; no compartir archivo SQLite de manera ingenua.

### VNEXT-033 — criterios de aceptación

Piloto E2E de aplicación web agnóstica sin acceso al repositorio, con adquisición→revisión requisito→preparación→plan→ejecución→evidencia→diagnóstico→reporte. Piloto Android autorizado y piloto de extensión LENDUS **separados**, sin incluir código, URLs internas, credenciales ni modelos financieros privados en QAP. Cualquier paso no verificado queda BLOCKED, no se maquillan datos de pruebas.

## 4. Extensión LENDUS — producto independiente (no núcleo)

**Nombre lógico sugerido:** `qap-extension-lendus`, repositorio privado o paquete fuera del núcleo público. La instalación será opt-in y podrá fijarse a una versión del contrato público de QAP. QAP solo aporta puertos/SDK, nunca requiere esta extensión para correr tests ni compilar.

| ID de extensión | Entrega propuesta | Condición de seguridad |
|---|---|---|
| LENDUS-EXT-001 | Inventario autorizado de operaciones API staging y perfiles | Documentación saneada; no publicar endpoints/secretos internos |
| LENDUS-EXT-002 | Recetas para cliente/solicitud sintéticos y producto financiero de prueba | Roles, configuración y aislamiento por entorno |
| LENDUS-EXT-003 | Preparación de préstamo/estado y operaciones de pago de prueba | Confirmar qué APIs existen; mutaciones autorizadas; no asumir que hay desembolso por API |
| LENDUS-EXT-004 | Oráculos por producto/configuración y matrices de reglas | Validación por PM/negocio; cero reglas inventadas |
| LENDUS-EXT-005 | Regresiones web de LENDUS Core y Find | UI + datos/requerimientos propios; evidencia y cleanup |
| LENDUS-EXT-006 | Adaptación de flujos LENDUS Mobile a ARTEMIS | Android, dispositivos/emulador y staging aislados |
| LENDUS-EXT-007 | Playbook operativo y onboarding de QA para LENDUS | Roles, proceso de triage, fixtures aprobados y no divulgación |

**Flujo de referencia:** escoger receta aprobada → validar permiso de staging → crear cliente sintético por API disponible → crear solicitud/préstamo según soporte real → verificar estado inicial y asociar IDs opacos → ejecutar UI Playwright o Android ARTEMIS → comprobar resultados con oráculo aprobado → registrar defectos/evidencias → limpiar de forma idempotente. No existe aún certificación de que todas esas APIs/operaciones están disponibles.

**Reglas de exclusión:** ningún dato de cliente real, log sensible, producto financiero privado o credencial se añade al repositorio público; staging exclusivo; scripts de modificación de estados no se habilitan en producción; no compartir estado operacional entre tenants/clientes; cada receta indica límite y compensación.

## 5. Secuencia de ejecución y compuertas

**Fase 0 — Ahora:** auditar/estabilizar VNEXT-014; R4-R12 solo publicada, falta auditoría; mantener 55 fallos MCP históricos y ocho fixtures de memoria visibles hasta reconciliación. Revisar aportes develop sin sobreescribirlos. Escribir ADRs/contratos y probar integración en una rama temporal aislada. No iniciar VNEXT-015 por esta propuesta.

**Fase 1 — Núcleo útil:** concluir 014 y avanzar 015–017 conforme a su autorización; implementar 024, 025, 026 y 028 tras aprobar sus dependencias. Piloto web simple de reproducción, documentación y regresión. Migrar BVA y contratos develop con pruebas equivalentes.

**Fase 2 — Adaptadores opcionales:** implementar 027, 029 y primera extensión LENDUS privada con APIs realmente disponibles; pilotar Android en emulador. No bloquear funcionalidad web si falta UTCP/ARTEMIS.

**Fase 3 — Operación escalable:** implementar 030, 031, 032; completar certificación VNEXT-020/021 y piloto 033. Integración de develop con revisión conjunta y criterios de no regresión; desplegar opcionalmente almacenamiento colaborativo si se demuestra necesario.

Los números son IDs de WBS, **no fechas ni esfuerzo estimado**. Estimar después de auditoría de alcance, pruebas y disponibilidad del equipo.

## 6. Estrategia mínima de QA y éxito medible

El flujo de trabajo para un único QA, reproducible por futuros integrantes: intake del cambio/bug → completitud de contexto → riesgo e impacto → receta de datos → smoke focal → regresión seleccionada → evidencia/oráculos → defecto o aprobación informada → preservación del conocimiento.

Medir desde baseline real, sin inventar metas numéricas: mediana de tiempo para reproducir bug, porcentaje de tickets sin prerequisitos suficientes, tiempo de preparación de datos, proporción de regresiones repetibles, cobertura de flujos críticos con oráculo validado, tasa de flakiness, defectos escapados, tiempo de onboarding y riesgo aceptado. Separar ahorro por fixture de ahorro por automatización UI.

## 7. Política de compatibilidad y criterios transversales de GO

1. No sobrescribir main/develop ni usar merge o force-push sin revisión y autorización explícita.
2. Mantener las 18 herramientas MCP vigentes y sus contratos externos, salvo plan versionado y migración compatible.
3. Mantener resultados de prueba, recibos, historial, permisos y aprobaciones verdaderos; no ajustar tests para esconder fallos.
4. Probar build + tests legacy develop + tests vNext + integración en un branch dedicado, usando SHA y resultados reales.
5. Idempotencia, concurrency, rollback, crash recovery, readback entre procesos y protección de datos de prueba obligatorios para mutaciones.
6. Validar esquemas en ambas ubicaciones (`packages/shared/schemas` y `packages/shared/src/schemas`), generador TS y consumidores.
7. Licencias de UTCP/ARTEMIS y versiones deben comprobarse al integrarlos; no acoplar la instalación base a paquetes opcionales.
8. No probar contra clientes reales ni inferir reglas financieras correctas solo porque una UI o API responde HTTP 200.
9. La trazabilidad no depende de Jira ni Xray; exportación interoperable posible, pero no obligatoria.

## 8. Fuente y situación de los proyectos externos

UTCP: especificación [utcp-specification](https://github.com/universal-tool-calling-protocol/utcp-specification) y SDK [typescript-utcp](https://github.com/universal-tool-calling-protocol/typescript-utcp). Soporte modular por plugins; confirmar API/versión fijada en la fase VNEXT-027.  
ARTEMIS: [google/artemis](https://github.com/google/artemis), proyecto de automatización Android; revisar capabilities, permisos, lifecycle de emulador y política de evidencias en VNEXT-029.  
QAP: [WBS vigente](https://github.com/Hyouka73/QAMCP/blob/feat/qap-vnext-architecture/docs/vnext/04_BACKLOG_Y_WBS_PRELIMINAR.md), [ADR previos](https://github.com/Hyouka73/QAMCP/blob/feat/qap-vnext-architecture/docs/vnext/REQUISITOS_Y_DECISIONES.md), [cruce develop](06_AUDITORIA_CRUCE_DEVELOP_VNEXT.md).

## 9. Acciones documentales para aceptar esta propuesta

- Revisión de producto/QA: aprobar alcance agnóstico, modelo de incidente y separación LENDUS.
- Revisión de arquitectura: aprobar puertos, versionado de contratos, policies por entorno, compatibilidad legacy y estrategia multiusuario.
- Revisión con desarrollador develop: confirmar propiedad de BVA, schemas, prune y update, migración y suite requerida.
- Abrir PR **solo documental** desde esta rama hacia la rama que mantenga el WBS canónico cuando se decida la estrategia; no fusionar ramas de código por medio de esta propuesta.
- Si se aprueba, actualizar `04_BACKLOG_Y_WBS_PRELIMINAR.md` y `REQUISITOS_Y_DECISIONES.md` preservando las secciones históricas y autorizaciones anteriores. Hasta entonces, VNEXT-024–033 y LENDUS-EXT-001–007 quedan en estado `proposed/unapproved`.
