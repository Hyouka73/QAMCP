# AV-07 · Precedencia normativa y compatibilidad legacy

[Informe](informe-av07.md) · [Acta D01–D21](../acta-decisiones.md) · [Catálogo](../catalogo-requisitos.md) · [Fuentes recuperadas](fuentes-recuperadas/README.md) · [Trazabilidad](../trazabilidad.md).

## Orden aplicable

1. Decisiones del propietario y autorizaciones efectivas por operación y destino, con D01–D21 para alcance de producto. La precedencia documental nunca concede un permiso. Las partes abiertas de DE-01–05 siguen abiertas.
2. Fichas completas, ampliaciones y deltas aditivos del [catálogo](../catalogo-requisitos.md). La etiqueta histórica de clase no reduce el alcance ni las garantías del acta.
3. Invariantes y contratos enmendados aceptados AV-01–06, aplicados a su materia y con sus compuertas. [AV-01](dictamen-av01.md) · [AV-02](decision-orquestador-av02-encargo-av03.md) y [fe AR-27](fe-correcciones-ar27.md) · [AV-03](decision-orquestador-av03-encargo-av04.md) · [AV-04](decision-orquestador-av04-encargo-av05.md) · [AV-05](decision-orquestador-av05-encargo-av06.md) · [AV-06](decision-orquestador-av06-encargo-av07.md) y CV06-01–08. La tabla AR-52 de AV-04 prevalece para aceptación y salida. Para documentos y API aplica AV-05, para fidelidad/recursos aplica AV-06, preservando la autoridad, la prevención de captura y contratos AV-01–05.
4. Plan, protocolos y expedientes de prueba bajo sus decisiones vigentes. El plan maestro es antecedente para conflictos, incluida la separación vinculante G0 de EXP-01a y G6/G6.5. Este expediente AV-07 contiene propuestas a contravalidar.
5. Código, contratos históricos, skills, README, esquemas de hecho, datos y tags prueban rutas o comportamientos de su época. Conservarlos con su SHA, procedencia y contexto. Registrar contradicción material antes de transferir; el texto archivado no concede excepción.

## Conflicto por consumidor y tratamiento propuesto

| Consumidor y evidencia | Divergencia | Fuente vigente y tratamiento |
| --- | --- | --- |
| HOST operador lee [AGENTS.md](../../../AGENTS.md), README raíz, instrucciones emitidas por `scripts/sync-mcp-schemas.mjs`, guidance y server. | Node 18/20, arranque desde dist directo, registro y smoke manual; roots/cwd como señal, perfil o configuración de workspace legacy; comandos internos de escritura. | D02, D05, D13, D14, D20, AV-02/03. Publicar guía solo de endpoint/versiones resueltos, registro por host preservando terceros, roots como selección, autoridad por principal/operación/destino. Retirar instrucciones de invocación bypass del pack. Tools validan incluso si una skill externa vuelve a sugerir comando obsoleto. |
| Skill local `qap-v3-architect`, ciclo de conocimiento, FileStorage y SQLite, reporter y `qap reindex`. La skill local orientó la lectura y su copia no es fuente remota del SHA. | YAML/JSON como autoridad, `run.json` primero y SQLite reconstruido desde archivos. | D05, AV-03 AR-12/46. Fuente/versiones y ediciones manuales preservadas. SQLite autoridad runtime; JSON Git/import/export/proyección según rol. Reindex de vistas desde verdad confirmada, nunca alterar autoridad desde `run.json` sin import autorizado. |
| Skill y schemas legacy de resultados, bloqueador reporter, runner y proyecciones. | `blocked` solo derivado por fallos previos; agregados `passed/failed/partial` o HTTP/selección vacía como éxito. | D12, AV-04. Veredicto `BLOCKED` también por política o dependencia, estado abierto sin terminal. Adaptador conserva etiqueta histórica y no fabrica testigos. E1/E7 con controles por eje y de alcance. |
| Runner, CLI prune, reporter y docs de runtime. | TTL 7/14/30 y borrado por cuota con distintas autoridades. | D19, AV-02 AR-25 y AV-05 AR-50. Resumen permanente hasta eliminación expresa, detalle 90d, conocimiento/casos activos y fijados bajo protección, historial y eventos de poda. DE-01 regula aspectos abiertos de cuota/retención. |
| Visor HTTP, HTML de reportes, scripts, assets y captura histórica AS-04. | Autoridad de archivo/ruta, recursos remotos, caché, política por descarte posterior. | D18/D20, AR-24/27, AV-05/06. Catalogar por intento/permiso con reproducción local, HTML portable offline, proteger primer cuadro/temporal. Tres modos y cuatro permisos separados, revocación y DE-02. |
| Perfiles y secretos por `qap auth`, `providers.ts`, config env, script provisionador y manifest deshabilitado. | Keytar/env, reglas de detección y fallback, configuración dependiente de plataforma. | D07/D09/D20, AV-02/03/05. Broker, KEK, perfiles separados, alta por canal fuera de banda y CI autorizado. Expiración/revocación, fallo cerrado ante pérdida de sesión requerida. |
| CLI, MCP antiguo, host scripts y wrappers de CI. | Salida 0 por consulta interpretada como resultado; escrituras desde interfaces y catálogo legacy. | AR-52, E7; consultar/ACK/ejecutar tienen operaciones propias y mismo sobre versionado. Ejecutar solamente vía núcleo, bloquear antiguas rutas mutativas tras corte y probar cada entrada. |
| Documentos vNext, cita de MVP, matices de proveedores y localización. | Alcance MVP, claims de compatibilidad, ausencia de SO o ruta de ejecución, instrucciones o nombres acoplados a un HOST. | D01–D21, AV-03/05/06, especialmente D11–D18. D17 preserva claves y locale verificables, esquemas de semántica por versión y matriz D13–16. Reemplazar documentación de operación por capacidades acreditadas, estados bloqueados y provisión bajo demanda. |

## Códigos y datos de proyectos

Los cuatro ejes vigentes son `technical_status`, `functional_verdict`, `cleanup_status` y `evidence_health`. Seis veredictos `PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR` sobre afirmación y alcance. Mantener veredicto y aceptación actual/histórica por separado. El sobre AR-52 v2.0 aplica, en orden, abierto sin código; I 18; F y T/R/U/O 11; F 10; T 12; R 13; U 14; O 15; A 0; S 16; resto terminal 17. Invocación, consulta, diagnóstico y ACK son clases distintas (ACK durable 20), y el código de campaña es dato tipado MCP. Usar literal y reglas de invocación de la tabla original para implementación y pruebas. CI verifica sobre, versión, ID, perfil, terminalidad y código. Validar wrappers PowerShell, cmd, POSIX y CI con pipes/redirección, señales, sin TTY y stdout/stderr independientes. Las conversiones de legacy conservan versión, ejes desconocidos y hechos originales. [Tabla original](enmiendas-av04.md#1--ar-0852--modelo-y-tabla-total) · [Protocolos de paridad](protocolos-av04.md).

Captura preserva `VERIFIED_STRICT`, `PRIVATE_AUTHORIZED`, `MANDATORY_SUPPRESSION`, autorización renovable y revocable hasta 30 días en ámbito privado y separación de capturar/acceder/conservar/exportar. Preferencia persistida no es permiso. Prevención/supresión antes de superficie prohibida y primer cuadro; poda autorizada y desaparición ilegítima conservan estados distintos. [Acta D18–D20](../acta-decisiones.md#d18--captura-multimedia-privada-controlada).

[DE-01](registro-maestro.md#alias-de-01) retención/volumen, [DE-02](registro-maestro.md#alias-de-02) activación privada y riesgo residual, [DE-03](registro-maestro.md#alias-de-03) métricas y aceptación, [DE-04](registro-maestro.md#alias-de-04) autorización empresarial/por destino y [DE-05](registro-maestro.md#alias-de-05) cobertura obligatoria de REQ-QA-003 y política de uso por campaña. Seguir referenciando los aspectos ratificados en los actos que les dieron origen. Esta publicación no ratifica ninguna.

## Cobertura de 92 elementos y 11 ampliaciones

Cotejo por encabezados del catálogo y las filas de políticas separadas: 82 IDs recuperados, 5 incorporados indicados por propietario, 3 IDs con promoción documentada, 2 filas adicionales de política. La suma da 92 elementos, 90 fichas REQ y 2 políticas, según el inventario vigente, con las 11 ampliaciones enlazadas a IDs ya existentes. Las clases individuales están en [matriz semántica](matriz-semantica.md). Se usa la clasificación vigente sin reclasificar.

| Fichas por agrupación actual | Conteo | Destino y trazabilidad primaria |
| --- | ---: | --- |
| MEM | 15 | Repositorio/ediciones y proyecto, recreación FTS y retención E1/E2. D02/D05/D07/D19/D20. |
| DIS | 8 | Discovery híbrido, E4/E8. D04/D05/D07/D09/D15/D21. |
| DOC | 4 | Ingesta/perfiles, E4/E8. D05/D10–D12. |
| IA | 6 | HOST/ejecutor, E1/E3/E7. D03–D05/D13/D17. |
| PLN | 6 | Planificador y repositorio, E1/E4/E5. D04–D06/D12/D16. |
| CAS | 5 | Casos/elegibilidad y ejecución, E4/E5/E8. D04–D07/D12/D21. |
| ORA | 7 | Testigo/evaluador, E1/E5/E8. D06/D07/D11/D12/D17/D21. |
| RUN | 6 | Ejecutor y publicación, E1/E3/E5/E6. D03/D06/D07/D12/D15/D16/D18. |
| DAT | 4 | DataPlan/API externa, E1/E4/E5. D06–D09/D12. |
| CAM | 5 | Orquestación y memoria, E3/E4. D03–D06/D13/D16. |
| REP | 4 | Custodia/visor, E2/E5–E8. D05/D11/D12/D18–D21. |
| REG | 3 | Defectos y regresión, E5/E8. D03/D05/D12/D21. |
| SEG | 5 | Política, identidad y bóveda, E2/E4/E5/E6. D02/D07/D09/D12/D18/D20. |
| INT | 4 | MCP/CLI y distribución, E1–E3/E7/E8. D02/D03/D08/D10/D13/D14/D20. |
| XINST-001, QA-001–003, AGT-001 | 5 | Fichas añadidas. Referencia, controles, adopción y alcance D07–D16/D21 según ficha. |
| AUTREP-001, RUN-002.1, SEG-002.3 | 3 | D11 comprobación del AUT, D14–D16 fidelidad, D18–D20 captura privada. |
| POL-CAP-001, POL-RET-001 | 2 | Acta D18–D20 y políticas adicionales, E2/E6/E7. |

[Ampliaciones exactas](../catalogo-requisitos.md#ampliaciones-de-la-línea-base): AGT-002 contexto, ONB-001 instalación, OPT-001 recursos, OPT-002 compactación, E2E-001 DAG, UTCP/OpenAPI absorbido en DAT-001.2 e INT-001.4, M1 DTO/visor, M2 export/PNG, M3 WebM, M4 reproducción/Range y M5 pruebas de pantalla/portabilidad. Cada fila conserva sus IDs, aceptación y E/EXP del catálogo. Durante implementación generar una vista verificable ID → contrato versionado → consumidor → artefacto de prueba, con verificación de los 92 elementos y 11 filas y rechazo de omisiones/colisiones. Esta vista no sustituye las fichas ni altera la historia. MANAGED y backend PostgreSQL concurrente se mantienen diferidos conforme a AV-03. Retirar instrucciones legacy de la distribución activa previa verificación E1/E2/E7 y mantener evidencia e importadores autorizados de lectura.
