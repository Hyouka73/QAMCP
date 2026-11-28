# TR-WBS-01 · Trazabilidad normativa y probatoria

Versión 1.2 documental · enmiendas de [MCP-PRO-01 v1.2](mcp-pro-01-v1.2.md) conforme al [acta de ratificación](acta-ratificacion-mcp-pro-01-v1.2.md). [Versión 1.1](https://github.com/Hyouka73/QAMCP/blob/928f3d5504edb412b2c5b4216d607fc0d8ed1adf/docs/qap-architecture/cierre-av-01/trazabilidad-wbs-et.md). [Resolución y matriz RP-01](resolucion-rp-01.md). Base normativa y fuentes íntegras en los [manifiestos AV](manifiesto-normativo-consolidado.md) y [AC](manifiesto-ac01.md). [Base UX de planificación](../diseno-ux/README.md) · [PM-01](plan-maestro-reconstruccion-et.md) · [WBS-01](wbs-reconstruccion-et.md).

Cada fila identifica la subtarea responsable de integrar la obligación y, tras el punto y coma, cruces de construcción o prueba especialmente relevantes. Las salidas de la fuente gobiernan la aceptación por fase. Una subtarea principal de una fase posterior coordina la integración final y sus pruebas; las salidas anteriores se adjudican en las unidades del protocolo indicado. Los números E, fases y EXP son acumulativos donde aplica la fuente. El ET primario conserva la asignación histórica del expediente ET, diferente del dueño lógico de la entrega. Cada fila remite además a sus controles normativos o condiciones de calificación. Ninguna acción, criterio o variante se elimina por compactación.

## 123 entradas

| Entrada | ET primario original | Subtarea principal y cruces | Oráculo o criterio mínimo AV-08 | Precisiones y salidas AC-01 |
| --- | --- | --- | --- | --- |
| [REQ-MEM-001.1](../catalogo-requisitos.md#req-mem-0011) | ET-02 | G1-01.a | E1/E2 · Separar cuatro planos y rechazar entidad sin plano; consulta por plano desde los dos adaptadores. | AC01-12.01: G1/E1/E2 |
| [REQ-MEM-001.2](../catalogo-requisitos.md#req-mem-0012) | ET-02 | G2-03.a | E1/E2 · Repetir observación en ambos canales y conservar su clase hasta acreditar fuente/autoridad. | AV-08 |
| [REQ-MEM-001.3](../catalogo-requisitos.md#req-mem-0013) | ET-02 | G1-01.a | E2 · Revisar regla y caso, consultar revisiones anteriores y denegar modificación retrospectiva. | AC01-05.02: G1/E2,G2/E4; AC01-08.01: G2/E4,G3/E5; AC01-12.01: G1/E1/E2 |
| [REQ-MEM-001.4](../catalogo-requisitos.md#req-mem-0014) | ET-02 | G2-03.a | E2/E4 · Introducir drift incompatible y comprobar revisión pendiente con edición manual y linaje intactos. | AC01-05.02: G1/E2,G2/E4; AC01-06.02: G1/E1,G3/E5/E6,G5/E7 |
| [REQ-MEM-002.1](../catalogo-requisitos.md#req-mem-0021) | ET-02 | G1-01.a | E2/E7 · Dos ámbitos divergentes; validar aislamiento en consultas, llaves, FTS, reportes y exportación. | AC01-16.01: G2/E4,G3/E5; AC01-22.03: G3/E5,G6/E8 |
| [REQ-MEM-002.2](../catalogo-requisitos.md#req-mem-0022) | ET-02 | G0-02.b | E1/E2/E7 · Denegar alcance incompleto, ambiguo o cruzado por ambos adaptadores antes de IO. | AV-08 |
| [REQ-MEM-002.3](../catalogo-requisitos.md#req-mem-0023) | ET-02 | G1-02.a | E2/E3 · Cortar ejecutor y recuperar frontera, cola lista y razonamiento sin duplicación. | AV-08 |
| [REQ-MEM-002.4](../catalogo-requisitos.md#req-mem-0024) | ET-02 | G4-02.a | E2/E3 · Reanudar por otro HOST con consulta autorizada de cobertura y próxima tarea; negar alcance revocado. | AV-08 |
| [REQ-MEM-002.5](../catalogo-requisitos.md#req-mem-0025) | ET-02 | G2-03.c; G1-01.a, G1-06.b, G5-03.a | E2/E7 · Exportar conocimiento con procedencia y sin secretos/sesiones; revocar sesión y conservar conocimiento. | AC01-11.01: G1/E2,G5/E7 |
| [REQ-MEM-003.1](../catalogo-requisitos.md#req-mem-0031) | ET-02 | G2-03.a | E2/E4 · Sembrar conflicto de autoridad y verificar procedencia, estado y bloqueo del oráculo. | AC01-01.01: G2/E4,G6/E8 |
| [REQ-MEM-003.2](../catalogo-requisitos.md#req-mem-0032) | ET-02 | G2-03.a | E2/E4 · Cambiar fuente, invalidar solo dependencias vigentes y preservar revisiones independientes. | AC01-16.02: G2/E4,G4 |
| [REQ-MEM-003.3](../catalogo-requisitos.md#req-mem-0033) | ET-02 | G3-05.b | E2/E5 · Repetir firmas de fallo, enlazar intentos, detectar inestabilidad y conservar regla. | AC01-13.02: G3/E6,G5/E2/E6; AC01-14.01: G3/E5,G5/E7; AC01-14.02: G3/E5; AC01-16.03: G3/E5 |
| [REQ-MEM-003.4](../catalogo-requisitos.md#req-mem-0034) | ET-02 | G2-03.c; G1-01.a, G1-06.b, G5-03.a, G5-03.b | E2/E7 · Conciliar entidades y revisiones tras export/import bajo alcance y hashes; excluir sesiones y secretos. | AC01-11.01: G1/E2,G5/E7; AC01-11.02: G1/E2,G5/E6/E7; AC01-14.03: G5/E7 |
| [REQ-MEM-003.5](../catalogo-requisitos.md#req-mem-0035) | ET-02 | G2-03.a | E2/E6 · Comparar simulación/aplicación de poda con panel de candidatos y bytes, cero efectos de simulación y protección activa. | AV-08 |
| [REQ-MEM-003.6](../catalogo-requisitos.md#req-mem-0036) | ET-02 | G1-01.a | E1/E2/E7 · Ejercer puerto único y adaptador SQLite sin dependencias SQL/driver/transporte en dominio; negar segundo escritor y cruce de alcance. Verificar extensión futura por contrato. | AC01-05.04: G0/EXP-08,G1/E1/E2,G5/E6/E7; AC01-12.01: G1/E1/E2 |
| [REQ-DIS-001.1](../catalogo-requisitos.md#req-dis-0011) | ET-03 | G2-01.a | E3/E4/E8 · Ejercer intención y autorización inicial, continuar lotes autónomos y sellar READY o brechas con razones. | AV-08 |
| [REQ-DIS-001.2](../catalogo-requisitos.md#req-dis-0012) | ET-03 | G2-01.a | E3/E4 · Cortar Discovery inicial y focalizado; reconciliar frontera, vistos y brechas en reanudación. | AC01-01.01: G2/E4,G6/E8 |
| [REQ-DIS-001.3](../catalogo-requisitos.md#req-dis-0013) | ET-03 | G2-01.a | E4/E8 · Inventario independiente de controles, etiquetas, tablas, filtros, paginación y validaciones en SPA, incluidos estados de URL idéntica. | AV-08 |
| [REQ-DIS-001.4](../catalogo-requisitos.md#req-dis-0014) | ET-03 | G2-01.a | E4/E8 · Probar hydration con lecturas acreditadas asociadas a vista/revisión y cero mutaciones en exploración. | AV-08 |
| [REQ-DIS-001.5](../catalogo-requisitos.md#req-dis-0015) | ET-03 | G2-01.b; G3-01.d | E2/E4/E8 · Comparar dos roles/configuraciones y perfiles de igual rol con derechos distintos; distinguir 403 incierto de restricción de rol probada. | AV-08 |
| [REQ-DIS-001.6](../catalogo-requisitos.md#req-dis-0016) | ET-03 | G2-03.b; G2-01.b, G4-01.b | E4 · Correlacionar navegación observada con grafo y denegar promoción de arista de negocio sin fuente acreditada. | AV-08 |
| [REQ-DIS-001.7](../catalogo-requisitos.md#req-dis-0017) | ET-03 | G2-01.a | E3/E4 · Reanudar ámbito efectivo y reabrir solo el fragmento invalidado por drift. | AV-08 |
| [REQ-DIS-001.8](../catalogo-requisitos.md#req-dis-0018) | ET-03 | G1-02.a; G2-01.a | E3/E4 · Terminar árbol del HOST con lotes listos; completar observación autorizada y conservar pausas por razonamiento. | AV-08 |
| [REQ-DOC-001.1](../catalogo-requisitos.md#req-doc-0011) | ET-05 | G2-02.a | E4/E8 · Corpus D10 por formato y clase, con anotación independiente de estructura, texto, tablas, versión y localizadores. | AC01-01.01: G2/E4,G6/E8 |
| [REQ-DOC-001.2](../catalogo-requisitos.md#req-doc-0012) | ET-05 | G2-02.a | E4/E8 · Sembrar páginas escaneadas, regiones ilegibles y omisiones; medir por unidad esperada/emitida e impedir uso de insumo insuficiente. | AV-08 |
| [REQ-DOC-001.3](../catalogo-requisitos.md#req-doc-0013) | ET-05 | G2-03.c | E4 · Verificar los cuatro estados de conciliación, incluido documentado/no observado que sigue pendiente. | AV-08 |
| [REQ-DOC-001.4](../catalogo-requisitos.md#req-doc-0014) | ET-05 | G2-03.c | E4/E5 · Probar vigencia, alcance y primacía de fuente acreditada; bloquear contradicción material de autoridad no resuelta. | AC01-01.01: G2/E4,G6/E8 |
| [REQ-IA-001.1](../catalogo-requisitos.md#req-ia-0011) | ET-07 | G0-02.a | E1/E3 · Validar solicitud tipada y propuesta vigente; rechazar revisión vieja y cambios de autoridad. | AV-08 |
| [REQ-IA-001.2](../catalogo-requisitos.md#req-ia-0012) | ET-07 | G4-02.a | E3/E5 · Ejecutar replay/regresión congelados con cero inferencia, linaje intacto y cuenta verificable. | AC01-17.01: G1/E7/EXP-07,G5/E7 |
| [REQ-IA-001.3](../catalogo-requisitos.md#req-ia-0013) | ET-07 | G0-02.b | E1/E3/E4 · Denegar artefactos inválidos o sin autoridad en escenarios, diagnóstico, oráculos y reparaciones. | AC01-16.05: G2/E4,G3/E5 |
| [REQ-IA-001.4](../catalogo-requisitos.md#req-ia-0014) | ET-07 | G4-02.a; G1-02.a | E3 · Desconectar HOST, drenar cola y reclamar razonamiento con otro HOST compatible sin repetir trabajo. | AV-08 |
| [REQ-IA-001.5](../catalogo-requisitos.md#req-ia-0015) | ET-07 | G5-03.a | E5/E7 · Alterar un byte en copia controlada y comprobar rechazo uniforme en MCP y CLI. | AV-08 Cruce MCP-PRO-01 [C05.3](#c053). |
| [REQ-IA-001.6](../catalogo-requisitos.md#req-ia-0016) | ET-07 | G4-01.a | E1/E3 · Dobles de contrato y funcionamiento instalado HOST y DETERMINISTIC sin servicio MANAGED ni proveedor adicional. | AV-08 |
| [REQ-PLN-001.1](../catalogo-requisitos.md#req-pln-0011) | ET-01 | G4-01.a | E1/E4 · Vincular revisión de plan, ejecución, datos y caso con snapshot reproducible. | AV-08 |
| [REQ-PLN-001.2](../catalogo-requisitos.md#req-pln-0012) | ET-01 | G4-01.b | E4 · Ejercer inventario parcial y mostrar ramas ejecutables y brechas sin inventar reglas. | AV-08 |
| [REQ-PLN-001.3](../catalogo-requisitos.md#req-pln-0013) | ET-01 | G4-01.b; G4-01.a | E4 · Con presupuesto pareado reproducir prioridad por riesgo, impacto de drift e historial. | AV-08 |
| [REQ-PLN-001.4](../catalogo-requisitos.md#req-pln-0014) | ET-01 | G3-01.a; G3-01.c, G4-01.a | E4/E5/E8 · Ejecutar tres módulos y dos identidades con variables tipadas y rechazar ciclo sin abrir navegador. | AV-08 Cruce MCP-PRO-01 [C05.1](#c051). |
| [REQ-PLN-001.5](../catalogo-requisitos.md#req-pln-0015) | ET-01 | G0-02.b; G1-03.a | E1/E4/E7 · Rechazar cambio de revisión/huella/caducidad en ambos canales antes de efectos. | AC01-16.01: G2/E4,G3/E5 Cruce MCP-PRO-01 [C05.1](#c051). |
| [REQ-PLN-001.6](../catalogo-requisitos.md#req-pln-0016) | ET-01 | G4-01.a | E3/E4/E5 · Bloquear dependientes ante fallo y conservar ramas independientes y sus hechos. | AC01-02.02: G2/E4,G4 |
| [REQ-CAS-001.1](../catalogo-requisitos.md#req-cas-0011) | ET-01 | G4-01.a | E3/E4 · Ejecutar casos ordinarios elegibles automáticamente; declarar ámbito y causa de permisos/fuentes ausentes. | AV-08 |
| [REQ-CAS-001.2](../catalogo-requisitos.md#req-cas-0012) | ET-01 | G2-04.a; G3-02.a | E4/E5 · Cubrir positivos, negativos, límites, estados, RBAC y cálculo con oráculos acreditados. | AC01-01.02: G2/E4 |
| [REQ-CAS-001.3](../catalogo-requisitos.md#req-cas-0013) | ET-01 | G2-04.b | E4/E5 · Reparar localizador mediante revisión que preserve identidad, expectativa e intento. | AC01-05.02: G1/E2,G2/E4; AC01-08.01: G2/E4,G3/E5; AC01-15.01: G2/E4,G3/E5; AC01-16.05: G2/E4,G3/E5 |
| [REQ-CAS-001.4](../catalogo-requisitos.md#req-cas-0014) | ET-01 | G2-04.b; G3-01.d | E4/E5 · Variantes por ámbito, autorización y aplicabilidad acreditada; indeterminar expectativa sin fuente y evitar PASS funcional. | AV-08 |
| [REQ-CAS-001.5](../catalogo-requisitos.md#req-cas-0015) | ET-01 | G2-04.b | E4/E5 · Deduplicar equivalentes y marcar dependientes obsoletos al retirar regla, preservando intentos. | AV-08 |
| [REQ-ORA-001.1](../catalogo-requisitos.md#req-ora-0011) | ET-05 | G0-02.a; G3-02.a, G5-03.a | E5/E7 · Reproducir seis veredictos, cuatro ejes, reducciones, fases, códigos y semántica equivalente MCP/CLI. | AC01-06.02: G1/E1,G3/E5/E6,G5/E7 |
| [REQ-ORA-001.2](../catalogo-requisitos.md#req-ora-0012) | ET-05 | G3-02.a | E5/E8 · 201 seguido de rollback con testigo suficiente produce FAIL; testigo insuficiente sin PASS funcional. | AC01-01.01: G2/E4,G6/E8; AC01-22.01: G3/E5,G6/E8; AC01-22.02: G3/E5,G6/E8 |
| [REQ-ORA-001.3](../catalogo-requisitos.md#req-ora-0013) | ET-05 | G3-02.a | E5/E8 · Recarga limpia, observaciones secundarias y conciliación con causalidad e independencia; rechazar canal de causa común. | AC01-01.01: G2/E4,G6/E8; AC01-22.01: G3/E5,G6/E8 |
| [REQ-ORA-001.4](../catalogo-requisitos.md#req-ora-0014) | ET-05 | G3-02.a | E5/E8 · Conciliar centavo y redondeos por regla de negocio exacta, escala y tolerancia acreditadas. | AC01-01.01: G2/E4,G6/E8; AC01-20.03: G2/E4,G3/E5 |
| [REQ-ORA-001.5](../catalogo-requisitos.md#req-ora-0015) | ET-05 | G3-02.a | E5/E8 · Comparar inicial/final de denegación y detectar efecto oculto con testigo independiente. | AC01-01.01: G2/E4,G6/E8; AC01-06.02: G1/E1,G3/E5/E6,G5/E7; AC01-19.02: G3/E5,G6/E8; AC01-23.01: G3/E5,G5/E7 |
| [REQ-ORA-001.6](../catalogo-requisitos.md#req-ora-0016) | ET-05 | G3-01.b | E5 · Separar eventualidad, expiración contractual y error de adquisición, con reloj y presupuesto congelados. | AC01-01.01: G2/E4,G6/E8; AC01-16.04: G3/E3/E5; AC01-22.01: G3/E5,G6/E8; AC01-22.02: G3/E5,G6/E8 |
| [REQ-ORA-001.7](../catalogo-requisitos.md#req-ora-0017) | ET-05 | G3-02.a | E5/E7 · Persistir por afirmación nivel, fuente, alcance, vigencia y dependencia incluso si hay conflicto o insuficiencia. | AC01-01.01: G2/E4,G6/E8; AC01-20.03: G2/E4,G3/E5 |
| [REQ-RUN-001.1](../catalogo-requisitos.md#req-run-0011) | ET-03 | G3-01.a | E3/E5 · Aislar cookies/storage y permitir continuidad autorizada solo dentro del flujo e identidad acreditados. | AV-08 |
| [REQ-RUN-001.2](../catalogo-requisitos.md#req-run-0012) | ET-03 | G0-02.b | E1/E5/E7 · Rechazar snapshot vencido, alterado o de otro contexto antes de iniciar navegador o efecto. | AC01-16.01: G2/E4,G3/E5 Cruce MCP-PRO-01 [C05.1](#c051). |
| [REQ-RUN-001.3](../catalogo-requisitos.md#req-run-0013) | ET-03 | G3-02.a | E5/E7 · Mantener resultado técnico, veredicto, cleanup y evidencia separados ante 201/rollback y falla de limpieza. | AV-08 |
| [REQ-RUN-001.4](../catalogo-requisitos.md#req-run-0014) | ET-03 | G1-02.a | E3/E5 · Interrupción entre despacho y respuesta, reconciliación durable y cero duplicación. | AC01-16.04: G3/E3/E5 Cruce MCP-PRO-01 [C03.3](#c033). |
| [REQ-RUN-001.5](../catalogo-requisitos.md#req-run-0015) | ET-03 | G3-03.a; G0-04.a, G1-02.a | E3/E5/E7 · Revocar en vuelo, admitir según recursos/autoridad y conservar trabajo independiente. | AC01-19.04: G3/E5,G6/E8 Cruce MCP-PRO-01 [C03.3](#c033). |
| [REQ-RUN-001.6](../catalogo-requisitos.md#req-run-0016) | ET-03 | G3-04.a | E5/E6/E7 · Cortar publicación, recuperar exactamente cada intento confirmado y detectar media ajena o alterada. | AV-08 |
| [REQ-DAT-001.1](../catalogo-requisitos.md#req-dat-0011) | ET-01 | G3-01.a | E5 · Etiquetar sintéticos por intento y vencimiento, acreditar ausencia de PII no autorizada. | AC01-15.01: G2/E4,G3/E5; AC01-20.01: G2/E4,G3/E5 |
| [REQ-DAT-001.2](../catalogo-requisitos.md#req-dat-0012) | ET-01 | G3-01.a | E5/E8 · Preparar DAG UI/conector, comprobar efecto/reconciliación y limpiar en orden inverso con trazabilidad. | AC01-15.01: G2/E4,G3/E5; AC01-20.01: G2/E4,G3/E5; AC01-21.03: G3/EXP-05b/E5,G5/E2; AC01-22.02: G3/E5,G6/E8 |
| [REQ-DAT-001.3](../catalogo-requisitos.md#req-dat-0013) | ET-01 | G3-01.a; G0-07.a, G3-01.d | E2/E5/E8 · Denegar escritura en producción o fuera de QA, incluso aparente lectura; mantener lectura acreditada. | AV-08 |
| [REQ-DAT-001.4](../catalogo-requisitos.md#req-dat-0014) | ET-01 | G3-01.b | E5 · Eliminar lo propio, ejecutar dos limpiezas idempotentes y preservar terceros; probar compensación/confinamiento autorizado por separado. | AC01-20.01: G2/E4,G3/E5 |
| [REQ-CAM-001.1](../catalogo-requisitos.md#req-cam-0011) | ET-01 | G4-01.a; G1-04.b, G3-01.c | E3/E4/E5/E8 · Recorrido autónomo desde intención y autorización hasta aprendizaje/regresión con efecto y evidencia, sin editar código o infraestructura del AUT. | AV-08 |
| [REQ-CAM-001.2](../catalogo-requisitos.md#req-cam-0012) | ET-01 | G4-01.a | E3/E5 · Bloqueo de rama por permiso o dependencia sin detener hermanas independientes. | AV-08 |
| [REQ-CAM-001.3](../catalogo-requisitos.md#req-cam-0013) | ET-01 | G4-01.a | E3/E5 · Agotar presupuesto, materializar parcial, conservar obligaciones y punto reanudable con brechas. | AV-08 |
| [REQ-CAM-001.4](../catalogo-requisitos.md#req-cam-0014) | ET-01 | G1-02.a | E2/E3 · Terminar árbol HOST y ejecutor por separado, reclamar lease/generación y rechazar segundo escritor. | AV-08 |
| [REQ-CAM-001.5](../catalogo-requisitos.md#req-cam-0015) | ET-01 | G4-01.a; G2-04.b, G3-05.b | E3/E4/E5 · Cambiar exploración/regresión/investigación preservando campaña, revisiones y estado. | AV-08 |
| [REQ-REP-001.1](../catalogo-requisitos.md#req-rep-0011) | ET-05 | G3-05.a; G3-04.a, G1-03.a, G1-06.b, G5-03.a | E5/E6/E7 · Publicar por ambos canales manifiesto verificado y evidencia saneada por intento/paso/rol con disponibilidad independiente. | AC01-06.02: G1/E1,G3/E5/E6,G5/E7; AC01-17.02: G1/E1/E7,G5/E7 |
| [REQ-REP-001.2](../catalogo-requisitos.md#req-rep-0012) | ET-05 | G3-05.a; G3-05.b, G1-01.a, G1-06.b, G5-03.a, G5-03.b | E6/E7 · Comparar ejecuciones tras poda, abrir export offline y conservar hashes, anclas, estados y veredictos. | AC01-11.02: G1/E2,G5/E6/E7; AC01-12.06: G3/E6,G5/E7 Cruce MCP-PRO-01 [C05.3](#c053). |
| [REQ-REP-001.3](../catalogo-requisitos.md#req-rep-0013) | ET-05 | G3-05.b | E5 · Deduplicar firma por ámbito y producir paquete reproducible; distinguir error de entorno/datos/sesión/automatización y defecto probado. | AC01-01.01: G2/E4,G6/E8; AC01-13.01: G3/E5/E6,G5/E7; AC01-13.02: G3/E6,G5/E2/E6; AC01-14.01: G3/E5,G5/E7; AC01-14.02: G3/E5; AC01-14.03: G5/E7 |
| [REQ-REP-001.4](../catalogo-requisitos.md#req-rep-0014) | ET-05 | G3-05.b | E5 · Reproducir, no reproducir, bloquear y verificar corrección mediante nuevos intentos, con fallo original conservado. | AC01-13.01: G3/E5/E6,G5/E7; AC01-14.01: G3/E5,G5/E7 |
| [REQ-REG-001.1](../catalogo-requisitos.md#req-reg-0011) | ET-01 | G4-01.b | E4/E5 · Sembrar drift DOM/API/configuración y validar selección explicada por dependencia y riesgo. | AC01-14.03: G5/E7; AC01-16.02: G2/E4,G4 |
| [REQ-REG-001.2](../catalogo-requisitos.md#req-reg-0012) | ET-01 | G3-05.b | E5 · Alternar resultados misma revisión/snapshot y detectar inestabilidad preservando serie. | AC01-16.03: G3/E5; AC01-16.06: G3/EXP-03,G5/E7 |
| [REQ-REG-001.3](../catalogo-requisitos.md#req-reg-0013) | ET-01 | G2-04.b | E4/E5 · Reparar selector con revisión posterior, mismo oráculo y evidencia histórica intacta. | AC01-08.01: G2/E4,G3/E5; AC01-16.05: G2/E4,G3/E5 |
| [REQ-SEG-001.1](../catalogo-requisitos.md#req-seg-0011) | ET-06 | G0-04.b; G0-02.b, G1-01.a, G1-03.a, G3-05.c, G5-03.a | E1/E2/E5/E7 · Denegación por defecto en canales/auxiliares; demostrar independencia ocho autoridades operativas y cuatro multimedia. | AC01-10.01: G1/E2,G5/E7; AC01-17.01: G1/E7/EXP-07,G5/E7; AC01-18.02: G1/E1,G3/E5/E6,G5/E7 Cruce MCP-PRO-01 [C03.2](#c032). |
| [REQ-SEG-001.2](../catalogo-requisitos.md#req-seg-0012) | ET-06 | G0-02.b | E2/E5 · Cambiar origen/identidad/tenant durante operación y bloquear transición; probar redirección por semántica/autoridad efectiva. | AC01-03.02: G1/E2,G5/E7; AC01-10.01: G1/E2,G5/E7; AC01-17.01: G1/E7/EXP-07,G5/E7; AC01-19.07: G0/E1,G3/E6,G5/E7 |
| [REQ-SEG-001.3](../catalogo-requisitos.md#req-seg-0013) | ET-06 | G0-04.a; G1-02.a, G3-04.a | E2/E5/E6 · Revocación desde otro proceso y en vuelo, persistente al reconectar y confinada al grant; reconciliar solo con autoridad propia. | AC01-17.01: G1/E7/EXP-07,G5/E7 |
| [REQ-SEG-002.1](../catalogo-requisitos.md#req-seg-0021) | ET-06 | G0-04.a; G5-03.a | E2/E6/E7 · Alta usuario local y CI sin TTY con referencias opacas y canarios ausentes de canales, backups aplicables y artefactos. | AC01-17.01: G1/E7/EXP-07,G5/E7 |
| [REQ-SEG-002.2](../catalogo-requisitos.md#req-seg-0022) | ET-06 | G2-01.a; G1-03.a, G3-05.c, G5-03.a | E2/E4/E5 · Pérdida de sesión requerida detiene rama sin identidad sustituta ni fallback anónimo. | AC01-18.02: G1/E1,G3/E5/E6,G5/E7; AC01-19.07: G0/E1,G3/E6,G5/E7 |
| [REQ-INT-001.1](../catalogo-requisitos.md#req-int-0011) | ET-07 | G5-03.a; G1-03.a, G1-06.b | E1/E7 · Ejecutar snapshot equivalente por MCP/CLI con mismos permisos, memoria, casos, datos, veredictos, reportes y códigos previstos. | AC01-17.01: G1/E7/EXP-07,G5/E7; AC01-17.02: G1/E1/E7,G5/E7 Cruce MCP-PRO-01 [C05.1](#c051), [C09.1](#c091). |
| [REQ-INT-001.2](../catalogo-requisitos.md#req-int-0012) | ET-07 | G5-01.b; G1-06.a | E1/E7 · Instalar paquete limpio en Windows/macOS/Linux, doctor, navegador a demanda y compuerta de tipos. | AV-08 Cruce MCP-PRO-01 [C01.1](#c011), [C05.1](#c051). |
| [REQ-INT-001.3](../catalogo-requisitos.md#req-int-0013) | ET-07 | G1-01.a | E1/E2/E7 · Cambiar adaptador por puerto de contrato sin tocar dominio; comprobar extensibilidad a persistencia compartida diferida. | AV-08 Cruce MCP-PRO-01 [C05.1](#c051). |
| [REQ-INT-001.4](../catalogo-requisitos.md#req-int-0014) | ET-07 | G0-07.a; G1-03.a, G1-06.b, G3-01.a, G3-05.c, G5-03.a | E1/E5/E7 · Registrar/revocar conectores, OpenAPI y UTCP autorizados y versiones incompatibles, con única autoridad. | AC01-18.01: G1/E1,G3/E5,G5/E7; AC01-18.02: G1/E1,G3/E5/E6,G5/E7; AC01-21.01: G0/EXP-05a,G3/EXP-05b/E5; AC01-23.01: G3/E5,G5/E7; AC01-24.01: G5/E7 Cruce MCP-PRO-01 [C05.1](#c051), [C05.7](#c057). |
| [REQ-XINST-001](../catalogo-requisitos.md#req-xinst-001) | ET-07 | G3-01.d; G0-07.a, G2-01.b, G3-01.a | E2/E4/E5/E8 · Lectura cross-instancia por identidades separadas, testigo de cero efectos, mínimo transferido, procedencia y control de redirección/egress. | AC01-22.03: G3/E5,G6/E8 |
| [REQ-QA-001](../catalogo-requisitos.md#req-qa-001) | ET-03 | G3-06.b; G1-04.d, G5-03.c | E4/E5/E8 · Locales y cambio de idioma en ejecución; traducción ausente/truncamiento, fecha/moneda/decimal/zona y replay sin inferencia. | AV-08 |
| [REQ-QA-002](../catalogo-requisitos.md#req-qa-002) | ET-03 | G3-01.a | E4/E5/E8 · Validar contrato API sano/incompatible por operación/revisión. Verificar efecto con testigo suficiente cuando se ejerce, uso autorizado por caso. | AC01-21.01: G0/EXP-05a,G3/EXP-05b/E5; AC01-24.01: G5/E7 |
| [REQ-QA-003](../catalogo-requisitos.md#req-qa-003) | ET-03 | G3-06.b | E6/E7/E8 · Separar capacidad AUT y producto QAP, estados dinámicos, controles sanos/mutantes y revisión manual bajo CV08-09. | AC01-19.06: G3/E5/E6,G5/E7,G6/E8 |
| [REQ-AGT-001](../catalogo-requisitos.md#req-agt-001) | ET-07 | G4-02.b; G0-06.a, G4-02.b, G5-03.a | E3/E7/E8 · Cuatro HOST reales y otros clientes representativos, rutas, finalización autónoma, tokens y suites legítimas sin bloqueo. | AV-08 Cruce MCP-PRO-01 [C03.1](#c031). |
| [REQ-AUTREP-001](../catalogo-requisitos.md#req-autrep-001) | ET-05 | G3-02.b; G2-02.a, G6-01.a | E4/E5/E8 · D11 por clase: flujos de filtros/fechas/agrupación, bytes de PDF/Excel, filas/celdas/multihoja/multipágina, tres planos, totales, discrepancias, abstención fundada. | AV-08 |
| [REQ-RUN-002.1](../catalogo-requisitos.md#req-run-0021) | ET-03 | G2-01.a; G1-04.a, G1-06.b, G5-01.b | E4/E6/E7/E8 · 1a preferencias conversacionales persistentes por proyecto (modo, navegador, grabación y recursos). 1b paridad en modos visibles/headless de CSS/JS/imágenes/fuentes e hidratación; registrar degradación, sin opción de desactivar fidelidad. | AC01-19.05: G3/E5,G5/E7,G6/E8 |
| [REQ-SEG-002.3](../catalogo-requisitos.md#req-seg-0023) | ET-06 | G3-04.a; G0-05.a, G3-04.b | E2/E5/E6/E8 · Separar captura, acceso, conservación y export. Renovar/revocar ≤30d, acreditar primera escritura y supresión previa; verificar export privado excepcional y denegación predeterminada. | AC01-10.02: G1/E2,G3/E6; AC01-12.06: G3/E6,G5/E7 |
| [POL-CAP-001](../catalogo-requisitos.md#políticas-adicionales-de-captura-y-retención) | ET-05 | G3-04.a; G0-05.a, G3-04.b | E2/E5/E6/E8 · Ejercer tres modos, cuatro grants y transición revocada; demostrar custodia de temporales y supresión preventiva en matriz, acceso/export autorizados por política. | AC01-10.02: G1/E2,G3/E6 |
| [POL-RET-001](../catalogo-requisitos.md#políticas-adicionales-de-captura-y-retención) | ET-02 | G2-03.a; G3-04.b, G5-02.a | E2/E6/E7 · Probar 90d detalle, resumen persistente, export/manual, archivo opcional, activos/fallos protegidos, eventos y plazos autorizados. Probar export sin traza física por todos los formatos exigidos. | AC01-13.02: G3/E6,G5/E2/E6 |
| [REQ-AGT-002](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-07 | G4-02.a | E3/E7 · Desde otro chat/HOST una consulta acotada recupera cobertura, permisos, IDs, próxima acción y omisiones; negar otro ámbito y medir tokens. | AV-08 Cruce MCP-PRO-01 [C03.2](#c032). |
| [REQ-ONB-001](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-01 | G1-06.a; G1-04.d, G5-03.c | E1/E6/E7 · Tres SO, instalación y doctor idempotentes sin depender del AUT, descarga gestionada, proxy/CA y fixture loopback con medios autorizados y cero procesos residuales. | AV-08 |
| [REQ-OPT-001](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-03 | G3-03.a; G5-03.b | E3/E5/E7/E8 · Probar W=1/2/4 y admisión según conflictos/presión/reserva; alternar tres, cuatro o más apps con límites y cero navegador o locks propios en reposo; medir hardware. | AC01-16.06: G3/EXP-03,G5/E7 |
| [REQ-OPT-002](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-03 | G4-02.b; G2-03.a | E2/E4 · Comparar bytes, tokens y cobertura al compactar contexto/snapshots; preservar procedencia, estado, omisiones y evidencia activa. Dry-run sin escribir ni retener handles. | AC01-16.06: G3/EXP-03,G5/E7 Cruce MCP-PRO-01 [C08.2](#c082). |
| [REQ-E2E-001](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-03 | G3-01.a; G3-01.c, G3-02.a, G6-01.a | E3/E4/E5/E8 · Tres módulos, dos roles, variables tipadas, efecto confirmado y corte; recuperar sin duplicación. Replay sin inferencia con evidencia por paso. | AV-08 |
| [UTCP/OpenAPI](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-07 | G3-01.a; G0-07.a, G3-01.c | E1/E4/E5 · Preparar prerrequisitos por ambas descripciones desde puerto común. Perder respuesta, reconciliar y limpiar con referencia acreditada inmutable. | AV-08 |
| [M1](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-01 | G1-05.a; G3-05.a | E6/E7 · Mismo DTO y IDs en visor HTTP, HTML MCP/CLI/flujo y resumen Markdown, controles accesibles, CSS/iconos/fuentes locales. | AV-08 |
| [M2](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-01 | G3-04.a | E6 · Export trasladado a ruta con espacios/acentos sin red ni server. PNG de viewport/elemento/página completa con escala/fallback, anclas y medios autorizados. | AV-08 |
| [M3](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-01 | G3-04.a | E6 · WebM auténtico con geometría y offsets por paso, hash y códec. Decodificar desde primer cuadro; canarios sensibles, revocación y descarte verificado tras reinicio. | AV-08 |
| [M4](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-01 | G3-04.a | E6/E7 · Acceso autenticado por catálogo, GET/HEAD, rango 206/416 y MIME, seek/fullscreen, revocación en reproducción, reinicio y export portátil. | AV-08 |
| [M5](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | ET-01 | G5-03.b; G6-01.a | E6/E8 · Paquete y export trasladado en navegador real con baseline visual fijado, teclado, canarios y diagnóstico por evidencia faltante. | AV-08 |
| [REQ-STR-001.1](../catalogo-requisitos.md#req-str-0011) | ET-04 | G2-04.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-02.01: G2/E4,G4; AC01-02.02: G2/E4,G4 |
| [REQ-STR-001.2](../catalogo-requisitos.md#req-str-0012) | ET-04 | G2-04.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-01.03: G2/E4,G5/E7,G6/E8 |
| [REQ-STR-001.3](../catalogo-requisitos.md#req-str-0013) | ET-04 | G3-05.a; G1-01.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-03.01: G3/E5,G5/E7; AC01-03.02: G1/E2,G5/E7 |
| [REQ-CAS-002.1](../catalogo-requisitos.md#req-cas-0021) | ET-04 | G2-04.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-04.01: G1/E2,G4 |
| [REQ-CAS-002.2](../catalogo-requisitos.md#req-cas-0022) | ET-04 | G2-04.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-04.02: G1/E2,G4 |
| [REQ-HUM-001.1](../catalogo-requisitos.md#req-hum-0011) | ET-04 | G1-04.a; G1-04.b, G1-06.b, G3-05.b, G5-03.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-05.01: G1/E2/E7,G5/E7 Cruce MCP-PRO-01 [C05.4](#c054). |
| [REQ-HUM-001.2](../catalogo-requisitos.md#req-hum-0012) | ET-04 | G1-04.b; G0-04.b, G3-06.b, G5-03.c | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-05.03: G0/EXP-08,G1/E2/E7,G3/E6,G5/E7; AC01-05.04: G0/EXP-08,G1/E1/E2,G5/E6/E7; AC01-19.06: G3/E5/E6,G5/E7,G6/E8 Cruce MCP-PRO-01 [C05.4](#c054). |
| [REQ-HUM-001.3](../catalogo-requisitos.md#req-hum-0013) | ET-04 | G3-01.c; G3-06.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-06.01: G1/E1,G3/E3/E5 |
| [REQ-HUM-001.4](../catalogo-requisitos.md#req-hum-0014) | ET-04 | G1-04.b; G1-04.b, G3-06.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-07.01: G1/E2,G3/E3/E5 |
| [REQ-CAM-002.1](../catalogo-requisitos.md#req-cam-0021) | ET-04 | G2-04.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-09.01: G2/E4,G3/E3 |
| [REQ-REP-002.1](../catalogo-requisitos.md#req-rep-0021) | ET-05 | G3-05.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-12.02: G1/E2,G3/E6,G5/E7 |
| [REQ-REP-002.2](../catalogo-requisitos.md#req-rep-0022) | ET-05 | G3-05.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-12.03: G2/E4,G5/E7,G6/E8 |
| [REQ-REP-002.3](../catalogo-requisitos.md#req-rep-0023) | ET-05 | G3-05.a; G3-05.b, G5-03.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-12.04: G3/E6,G5/E7 |
| [REQ-REP-002.4](../catalogo-requisitos.md#req-rep-0024) | ET-05 | G3-05.a; G3-05.b, G5-03.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-12.05: G3/E6,G5/E7 |
| [REQ-REP-002.5](../catalogo-requisitos.md#req-rep-0025) | ET-05 | G3-05.a; G5-03.b | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-12.07: G3/E6,G5/E6/E7; AC01-12.08: G3/E6,G5/E6/E7 |
| [REQ-CAS-002.3](../catalogo-requisitos.md#req-cas-0023) | ET-04 | G4-01.a; G2-04.a, G3-01.c | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-15.02: G2/E4,G3/E5 |
| [REQ-QA-004.1](../catalogo-requisitos.md#req-qa-0041) | ET-03 | G3-05.c | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-19.01: G2/E4,G3/E5; AC01-19.02: G3/E5,G6/E8; AC01-19.04: G3/E5,G6/E8; AC01-19.05: G3/E5,G5/E7,G6/E8 |
| [REQ-QA-004.2](../catalogo-requisitos.md#req-qa-0042) | ET-03 | G3-06.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-19.03: G3/E5,G6/E8 |
| [REQ-DAT-002.1](../catalogo-requisitos.md#req-dat-0021) | ET-01 | G3-02.a; G2-04.a, G3-06.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-20.02: G3/E5,G6/E8; AC01-20.03: G2/E4,G3/E5 |
| [REQ-DAT-002.2](../catalogo-requisitos.md#req-dat-0022) | ET-01 | G3-01.b; G1-01.a, G5-02.a | [Matriz integrada](matriz-aceptacion-ac01.md) y cláusulas de la última columna | AC01-21.02: G1/E1/E2,G3/EXP-05b/E5; AC01-21.03: G3/EXP-05b/E5,G5/E2 |

## 65 cláusulas

Los enlaces remiten al grupo exacto del delta. Se aplican el propietario normativo, el positivo y el negativo completos del renglón de origen. La columna final reproduce las salidas textuales del delta.

| Cláusula | ET primario original | Subtarea principal y cruces | Salidas normativas |
| --- | --- | --- | --- |
| [AC01-01.01](catalogo-delta-ac01.md#delta-ac01-01--base-de-pruebas-y-cobertura) | ET-04 | G2-04.a | G2/E4,G6/E8 |
| [AC01-01.02](catalogo-delta-ac01.md#delta-ac01-01--base-de-pruebas-y-cobertura) | ET-04 | G2-04.a | G2/E4 |
| [AC01-01.03](catalogo-delta-ac01.md#delta-ac01-01--base-de-pruebas-y-cobertura) | ET-04 | G2-04.a; G4-01.b, G5-03.a, G6-01.a | G2/E4,G5/E7,G6/E8 |
| [AC01-02.01](catalogo-delta-ac01.md#delta-ac01-02--estrategia-y-riesgo) | ET-04 | G2-04.a; G4-01.a | G2/E4,G4 |
| [AC01-02.02](catalogo-delta-ac01.md#delta-ac01-02--estrategia-y-riesgo) | ET-04 | G2-04.a; G4-01.a | G2/E4,G4 |
| [AC01-03.01](catalogo-delta-ac01.md#delta-ac01-03--entrega-y-auditoría) | ET-04 | G3-05.a | G3/E5,G5/E7 |
| [AC01-03.02](catalogo-delta-ac01.md#delta-ac01-03--entrega-y-auditoría) | ET-04 | G3-05.b; G1-01.a, G5-03.a | G1/E2,G5/E7 |
| [AC01-04.01](catalogo-delta-ac01.md#delta-ac01-04--sets-y-asignación) | ET-04 | G2-04.b; G1-04.b, G4-01.a | G1/E2,G4 |
| [AC01-04.02](catalogo-delta-ac01.md#delta-ac01-04--sets-y-asignación) | ET-04 | G2-04.b; G1-04.b, G4-01.a | G1/E2,G4 |
| [AC01-05.01](catalogo-delta-ac01.md#delta-ac01-05--operación-sin-ia-e-interfaz) | ET-04 | G1-04.a; G1-04.b, G1-06.b, G5-03.a | G1/E2/E7,G5/E7 Cruce MCP-PRO-01 [C05.4](#c054). |
| [AC01-05.02](catalogo-delta-ac01.md#delta-ac01-05--operación-sin-ia-e-interfaz) | ET-04 | G1-04.b | G1/E2,G2/E4 Cruce MCP-PRO-01 [C05.4](#c054). |
| [AC01-05.03](catalogo-delta-ac01.md#delta-ac01-05--operación-sin-ia-e-interfaz) | ET-04 | G1-04.a; G0-04.b, G3-06.b, G5-03.c | G0/EXP-08,G1/E2/E7,G3/E6,G5/E7 Cruce MCP-PRO-01 [C05.4](#c054). |
| [AC01-05.04](catalogo-delta-ac01.md#delta-ac01-05--operación-sin-ia-e-interfaz) | ET-04 | G0-04.b; G1-06.b, G3-04.a, G5-03.b | G0/EXP-08,G1/E1/E2,G5/E6/E7 Cruce MCP-PRO-01 [C05.4](#c054). |
| [AC01-06.01](catalogo-delta-ac01.md#delta-ac01-06--manual-y-testigo) | ET-04 | G1-04.b; G3-06.b | G1/E1,G3/E3/E5 |
| [AC01-06.02](catalogo-delta-ac01.md#delta-ac01-06--manual-y-testigo) | ET-04 | G1-04.b; G3-02.a, G3-04.a, G5-03.a | G1/E1,G3/E5/E6,G5/E7 |
| [AC01-07.01](catalogo-delta-ac01.md#delta-ac01-07--híbrida) | ET-03 | G3-01.c; G1-04.b, G3-06.b | G1/E2,G3/E3/E5 |
| [AC01-08.01](catalogo-delta-ac01.md#delta-ac01-08--identidad-de-casos) | ET-01 | G2-04.b; G3-01.c | G2/E4,G3/E5 |
| [AC01-09.01](catalogo-delta-ac01.md#delta-ac01-09--exploración) | ET-04 | G2-04.b; G3-06.b | G2/E4,G3/E3 |
| [AC01-10.01](catalogo-delta-ac01.md#delta-ac01-10--identidad-y-adjuntos) | ET-06 | G0-02.b; G1-04.b, G3-01.b | G1/E2,G5/E7 |
| [AC01-10.02](catalogo-delta-ac01.md#delta-ac01-10--identidad-y-adjuntos) | ET-06 | G3-04.a; G1-04.b | G1/E2,G3/E6 |
| [AC01-11.01](catalogo-delta-ac01.md#delta-ac01-11--intercambio) | ET-07 | G1-01.a; G1-04.b, G1-06.b, G1-07.a, G2-03.c, G5-03.a, G5-05.a | G1/E2,G5/E7 Cruce MCP-PRO-01 [C05.5](#c055). |
| [AC01-11.02](catalogo-delta-ac01.md#delta-ac01-11--intercambio) | ET-07 | G1-01.a; G1-04.b, G1-06.b, G1-07.a, G2-03.c, G5-03.a, G5-03.b, G5-05.a | G1/E2,G5/E6/E7 Cruce MCP-PRO-01 [C05.5](#c055). |
| [AC01-12.01](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G1-01.a | G1/E1/E2 |
| [AC01-12.02](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G1-01.a, G5-03.a | G1/E2,G3/E6,G5/E7 |
| [AC01-12.03](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G2-04.a, G5-03.a, G6-01.a | G2/E4,G5/E7,G6/E8 |
| [AC01-12.04](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G3-07.a, G5-03.b, G5-05.a | G3/E6,G5/E7 Cruce MCP-PRO-01 [C05.8](#c058). |
| [AC01-12.05](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G3-07.a, G5-03.b, G5-05.a | G3/E6,G5/E7 Cruce MCP-PRO-01 [C05.8](#c058). |
| [AC01-12.06](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G3-07.a, G5-03.b, G5-05.a | G3/E6,G5/E7 Cruce MCP-PRO-01 [C05.8](#c058). |
| [AC01-12.07](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G3-07.a, G5-03.b, G5-05.a | G3/E6,G5/E6/E7 Cruce MCP-PRO-01 [C05.8](#c058). |
| [AC01-12.08](catalogo-delta-ac01.md#delta-ac01-12--consultaspublicacionesexport) | ET-05 | G3-05.a; G3-07.a, G5-03.b, G5-05.a | G3/E6,G5/E6/E7 Cruce MCP-PRO-01 [C05.8](#c058). |
| [AC01-13.01](catalogo-delta-ac01.md#delta-ac01-13--recetas) | ET-02 | G3-05.b | G3/E5/E6,G5/E7 |
| [AC01-13.02](catalogo-delta-ac01.md#delta-ac01-13--recetas) | ET-02 | G3-05.b; G2-03.a | G3/E6,G5/E2/E6 |
| [AC01-14.01](catalogo-delta-ac01.md#delta-ac01-14--defectos) | ET-02 | G3-05.b | G3/E5,G5/E7 |
| [AC01-14.02](catalogo-delta-ac01.md#delta-ac01-14--defectos) | ET-02 | G3-05.b | G3/E5 |
| [AC01-14.03](catalogo-delta-ac01.md#delta-ac01-14--defectos) | ET-02 | G3-05.b | G5/E7 |
| [AC01-15.01](catalogo-delta-ac01.md#delta-ac01-15--automatización-reusable) | ET-01 | G4-01.a; G2-04.a, G3-01.a | G2/E4,G3/E5 |
| [AC01-15.02](catalogo-delta-ac01.md#delta-ac01-15--automatización-reusable) | ET-01 | G4-01.a; G2-04.a, G3-01.c | G2/E4,G3/E5 |
| [AC01-16.01](catalogo-delta-ac01.md#delta-ac01-16--mantenibilidad) | ET-03 | G2-03.a; G3-01.d | G2/E4,G3/E5 |
| [AC01-16.02](catalogo-delta-ac01.md#delta-ac01-16--mantenibilidad) | ET-03 | G4-01.b | G2/E4,G4 |
| [AC01-16.03](catalogo-delta-ac01.md#delta-ac01-16--mantenibilidad) | ET-03 | G4-01.a | G3/E5 |
| [AC01-16.04](catalogo-delta-ac01.md#delta-ac01-16--mantenibilidad) | ET-03 | G3-02.a; G2-01.a, G3-01.b | G3/E3/E5 |
| [AC01-16.05](catalogo-delta-ac01.md#delta-ac01-16--mantenibilidad) | ET-03 | G2-04.b | G2/E4,G3/E5 |
| [AC01-16.06](catalogo-delta-ac01.md#delta-ac01-16--mantenibilidad) | ET-03 | G3-05.a; G3-03.a, G5-03.b | G3/EXP-03,G5/E7 |
| [AC01-17.01](catalogo-delta-ac01.md#delta-ac01-17--ci) | ET-07 | G1-03.a; G5-03.a | G1/E7/EXP-07,G5/E7 |
| [AC01-17.02](catalogo-delta-ac01.md#delta-ac01-17--ci) | ET-07 | G1-03.a; G1-06.b, G1-07.a, G5-03.a, G5-05.a | G1/E1/E7,G5/E7 Cruce MCP-PRO-01 [C05.6](#c056). |
| [AC01-18.01](catalogo-delta-ac01.md#delta-ac01-18--integraciones-externas) | ET-07 | G1-03.a; G1-06.b, G1-07.a, G3-05.c, G3-07.a, G5-03.a, G5-05.a | G1/E1,G3/E5,G5/E7 Cruce MCP-PRO-01 [C05.7](#c057). |
| [AC01-18.02](catalogo-delta-ac01.md#delta-ac01-18--integraciones-externas) | ET-07 | G1-03.a; G1-06.b, G1-07.a, G3-05.c, G3-07.a, G5-03.a, G5-05.a | G1/E1,G3/E5/E6,G5/E7 Cruce MCP-PRO-01 [C05.7](#c057). |
| [AC01-19.01](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.a; G2-04.a | G2/E4,G3/E5 |
| [AC01-19.02](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.a | G3/E5,G6/E8 |
| [AC01-19.03](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.a | G3/E5,G6/E8 |
| [AC01-19.04](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.a | G3/E5,G6/E8 |
| [AC01-19.05](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.a | G3/E5,G5/E7,G6/E8 |
| [AC01-19.06](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.b; G5-03.c, G6-01.a | G3/E5/E6,G5/E7,G6/E8 |
| [AC01-19.07](catalogo-delta-ac01.md#delta-ac01-19--calidad-no-funcional) | ET-03 | G3-06.a | G0/E1,G3/E6,G5/E7 |
| [AC01-20.01](catalogo-delta-ac01.md#delta-ac01-20--datos) | ET-02 | G3-01.a; G2-04.a | G2/E4,G3/E5 |
| [AC01-20.02](catalogo-delta-ac01.md#delta-ac01-20--datos) | ET-02 | G3-02.a | G3/E5,G6/E8 |
| [AC01-20.03](catalogo-delta-ac01.md#delta-ac01-20--datos) | ET-02 | G3-01.b; G2-04.a | G2/E4,G3/E5 |
| [AC01-21.01](catalogo-delta-ac01.md#delta-ac01-21--api-negativa-y-concurrencia) | ET-03 | G3-01.a; G0-07.a, G3-01.c | G0/EXP-05a,G3/EXP-05b/E5 |
| [AC01-21.02](catalogo-delta-ac01.md#delta-ac01-21--api-negativa-y-concurrencia) | ET-03 | G3-01.b; G1-01.a | G1/E1/E2,G3/EXP-05b/E5 |
| [AC01-21.03](catalogo-delta-ac01.md#delta-ac01-21--api-negativa-y-concurrencia) | ET-03 | G3-01.b; G5-02.a | G3/EXP-05b/E5,G5/E2 |
| [AC01-22.01](catalogo-delta-ac01.md#delta-ac01-22--procesos-empresariales) | ET-03 | G3-01.b | G3/E5,G6/E8 |
| [AC01-22.02](catalogo-delta-ac01.md#delta-ac01-22--procesos-empresariales) | ET-03 | G3-01.b | G3/E5,G6/E8 |
| [AC01-22.03](catalogo-delta-ac01.md#delta-ac01-22--procesos-empresariales) | ET-03 | G3-01.d; G2-01.b, G6-01.a | G3/E5,G6/E8 |
| [AC01-23.01](catalogo-delta-ac01.md#delta-ac01-23--dependencias) | ET-07 | G3-01.a | G3/E5,G5/E7 |
| [AC01-24.01](catalogo-delta-ac01.md#delta-ac01-24--contratos-externos) | ET-07 | G3-05.c; G5-03.a | G5/E7 |

## 57 AR

Se preserva el estado fuente. El enlace abre el registro correspondiente. [Matriz consolidada de evidencia y salida](matriz-consolidada-ar.md).

| AR | Estado fuente | Subtarea principal y cruces |
| --- | --- | --- |
| [AR-01](registro-maestro.md#ar-01) | VALIDADA | P-02.a |
| [AR-02](registro-maestro.md#ar-02) | VALIDADA | P-02.a |
| [AR-03](registro-maestro.md#ar-03) | VALIDADA | P-02.a |
| [AR-04](registro-maestro.md#ar-04) | VALIDADA | G0-02.b |
| [AR-55](registro-maestro.md#ar-55) | VALIDADA | P-02.a |
| [AR-56](registro-maestro.md#ar-56) | VALIDADA | P-02.a |
| [AR-07](registro-maestro.md#ar-07) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G0-04.a |
| [AR-14](registro-maestro.md#ar-14) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G0-02.b |
| [AR-24](registro-maestro.md#ar-24) | BLOQUEANTE | G0-03.a; G0-04.b, G1-05.a, G3-04.a Cruce MCP-PRO-01 [C05.2](#c052), [C07.1](#c071). |
| [AR-25](registro-maestro.md#ar-25) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G2-03.a |
| [AR-27](registro-maestro.md#ar-27) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G0-05.a; G3-04.a, G5-03.b |
| [AR-28](registro-maestro.md#ar-28) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G0-04.b Cruce MCP-PRO-01 [C07.1](#c071). |
| [AR-31](registro-maestro.md#ar-31) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G0-07.a |
| [AR-32](registro-maestro.md#ar-32) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G3-04.a |
| [AR-40](registro-maestro.md#ar-40) | BLOQUEANTE | G0-03.b; G0-09.a Cruce MCP-PRO-01 [C07.1](#c071). |
| [AR-47](registro-maestro.md#ar-47) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G2-01.a |
| [AR-05](registro-maestro.md#ar-05) | PENDIENTE | G4-01.a |
| [AR-11](registro-maestro.md#ar-11) | PENDIENTE | G4-01.a |
| [AR-12](registro-maestro.md#ar-12) | PENDIENTE | G1-01.a |
| [AR-15](registro-maestro.md#ar-15) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G4-02.b; G0-06.a, G1-06.b, G5-03.a Cruce MCP-PRO-01 [C03.1](#c031). |
| [AR-42](registro-maestro.md#ar-42) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G1-02.a; G5-03.b Cruce MCP-PRO-01 [C03.1](#c031), [C03.3](#c033). |
| [AR-45](registro-maestro.md#ar-45) | PENDIENTE | G4-01.a; G2-01.a, G3-02.a, G4-02.a, G4-03.a, G5-03.c Cruce MCP-PRO-01 [C05.8](#c058). |
| [AR-46](registro-maestro.md#ar-46) | PENDIENTE | G2-03.c |
| [AR-52](registro-maestro.md#ar-52) | PENDIENTE | G0-02.a; G1-03.a, G5-03.a Cruce MCP-PRO-01 [C05.6](#c056). |
| [AR-08](registro-maestro.md#ar-08) | BLOQUEANTE | G0-02.a; G3-02.a, G5-03.a, G6-01.a |
| [AR-09](registro-maestro.md#ar-09) | BLOQUEANTE | G3-02.a; G0-02.a, G6-01.a |
| [AR-10](registro-maestro.md#ar-10) | PENDIENTE | G3-01.b; G4-02.a |
| [AR-43](registro-maestro.md#ar-43) | BLOQUEANTE | G3-01.a; G3-01.c, G3-02.a, G4-01.a, G6-01.a |
| [AR-53](registro-maestro.md#ar-53) | PENDIENTE | G3-02.a |
| [AR-13](registro-maestro.md#ar-13) | PENDIENTE | G2-02.a |
| [AR-17](registro-maestro.md#ar-17) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G0-07.a |
| [AR-18](registro-maestro.md#ar-18) | PENDIENTE | G3-01.d |
| [AR-20](registro-maestro.md#ar-20) | BLOQUEANTE | G2-02.a; G3-02.b, G6-01.a |
| [AR-22](registro-maestro.md#ar-22) | PENDIENTE | G0-07.a |
| [AR-38](registro-maestro.md#ar-38) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G3-02.b |
| [AR-48](registro-maestro.md#ar-48) | PENDIENTE | G3-01.a |
| [AR-50](registro-maestro.md#ar-50) | PENDIENTE | G3-05.a |
| [AR-16](registro-maestro.md#ar-16) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G2-01.a |
| [AR-29](registro-maestro.md#ar-29) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G3-03.a |
| [AR-36](registro-maestro.md#ar-36) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G2-01.a |
| [AR-37](registro-maestro.md#ar-37) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G1-06.a |
| [AR-39](registro-maestro.md#ar-39) | VALIDACIÓN EXPERIMENTAL PENDIENTE | G3-04.a |
| [AR-49](registro-maestro.md#ar-49) | PENDIENTE | G4-02.b Cruce MCP-PRO-01 [C08.2](#c082). |
| [AR-19](registro-maestro.md#ar-19) | PENDIENTE | P-02.a |
| [AR-21](registro-maestro.md#ar-21) | PENDIENTE | G0-01.a Cruce MCP-PRO-01 [C01.1](#c011). |
| [AR-23](registro-maestro.md#ar-23) | PENDIENTE | G0-08.a |
| [AR-26](registro-maestro.md#ar-26) | PENDIENTE | G0-01.a |
| [AR-33](registro-maestro.md#ar-33) | PENDIENTE | G5-01.a |
| [AR-34](registro-maestro.md#ar-34) | PENDIENTE | G0-01.a Cruce MCP-PRO-01 [C01.1](#c011), [C02.1](#c021), [C09.1](#c091). |
| [AR-41](registro-maestro.md#ar-41) | BLOQUEANTE | G5-02.a; CUT-01.a Cruce MCP-PRO-01 [C06.1](#c061). |
| [AR-51](registro-maestro.md#ar-51) | PENDIENTE | G0-08.a; G5-01.a, GA-01.a Cruce MCP-PRO-01 [C01.1](#c011), [C06.1](#c061), [C07.1](#c071). |
| [AR-54](registro-maestro.md#ar-54) | PENDIENTE | G0-01.a Cruce MCP-PRO-01 [C05.2](#c052). |
| [AR-57](registro-maestro.md#ar-57) | PENDIENTE | G0-01.a Cruce MCP-PRO-01 [C05.2](#c052). |
| [AR-06](registro-maestro.md#ar-06) | PENDIENTE | G6-01.a |
| [AR-30](registro-maestro.md#ar-30) | BLOQUEANTE | G65-02.a; G65-01.a, GA-01.a |
| [AR-35](registro-maestro.md#ar-35) | PENDIENTE | G3-06.b |
| [AR-44](registro-maestro.md#ar-44) | PENDIENTE | G5-04.b |

## 22 TEC

Fuente íntegra por ID en [registro de candidatos](registro-candidatos-et.md). La calificación, alternativa condicionada y condición de bloqueo de cada fila fuente forman parte de la aceptación.

| ID | Subtarea principal y cruces |
| --- | --- |
| TEC-01 | G0-01.a |
| TEC-02 | G0-08.a |
| TEC-03 | G0-02.a |
| TEC-04 | G1-01.a |
| TEC-05 | G2-03.a |
| TEC-06 | G2-01.a |
| TEC-07 | G3-03.a |
| TEC-08 | G0-04.b |
| TEC-09 | G3-06.b |
| TEC-10 | G2-02.a |
| TEC-11 | G3-02.b |
| TEC-12 | G3-05.a |
| TEC-13 | G0-05.a |
| TEC-14 | G3-04.a |
| TEC-15 | G1-02.a |
| TEC-16 | G0-04.a |
| TEC-17 | G0-07.a |
| TEC-18 | G5-01.b |
| TEC-19 | G0-06.a |
| TEC-20 | G0-07.a |
| TEC-21 | G5-03.a |
| TEC-22 | G4-02.b |

## 15 XET

Fuente íntegra por ID en [integración tecnológica](integracion-tecnologica-et.md). La calificación, alternativa condicionada y condición de bloqueo de cada fila fuente forman parte de la aceptación.

| ID | Subtarea principal y cruces |
| --- | --- |
| XET-01 | G1-02.a |
| XET-02 | G0-04.b |
| XET-03 | G5-01.b |
| XET-04 | G0-04.a |
| XET-05 | G0-07.a G0-05.a G0-09.a G2-01.a G2-05.a G5-03.b Cruce MCP-PRO-01 [C05.8](#c058). |
| XET-06 | G3-04.a |
| XET-07 | G3-04.b |
| XET-08 | G2-03.a |
| XET-09 | G3-02.b |
| XET-10 | G0-07.a |
| XET-11 | G3-01.b |
| XET-12 | G5-03.a; G1-03.a, G3-05.c Cruce MCP-PRO-01 [C05.7](#c057). |
| XET-13 | G5-01.b |
| XET-14 | G5-02.a |
| XET-15 | G0-08.a; G3-03.a, G5-01.a |

## Decisiones empresariales y C1–C6

[Acta D](../acta-decisiones.md) · [Acta DE](acta-ratificacion-de.md) · [Acta AC-DE](acta-ratificacion-ac01.md) · [C1–C6, fuentes, reservas y compatibilidad](incorporacion-correcciones-et.md).

| Decisión | Subtareas | Obligación conservada |
| --- | --- | --- |
| D01 | G4-01.a G5-05.a G6-02.a | Producto local profesional completo y autonomía acreditable |
| D02 | G1-01.a G5-02.a | SQLite local, puerto futuro preparado Cruce MCP-PRO-01 [C06.1](#c061). |
| D03 | G1-04.b G4-02.a | HOST y DETERMINISTIC, MANAGED diferido |
| D04 | G4-01.a G6-01.a | Ciclo autónomo sin aprobación ordinaria |
| D05 | G2-03.a G4-02.a | Knowledge, memoria y continuidad |
| D06 | G3-01.a G3-01.c G3-02.a G6-01.a | E2E multirol/multimódulo con testigos |
| D07 | G0-02.b G3-01.a | Efectos QA por operación y lectura acreditada fuera de QA |
| D08 | G0-07.a G3-01.a G3-01.c | UTCP/OpenAPI y datos |
| D09 | G3-01.d G6-01.a | Referencia autorizada inmutable |
| D10 | G2-02.a G2-03.c | Ingesta, matrices por formato y clase |
| D11 | G2-02.a G3-02.b G6-01.a | Reportes AUT por clase y tres planos |
| D12 | G0-02.a G3-02.a G5-03.a | Oráculos, veredictos y veracidad |
| D13 | G0-06.a G4-02.b G5-03.a | HOST reales y canales canónicos Cruce MCP-PRO-01 [C03.1](#c031), [C05.3](#c053), [C08.2](#c082), [C04.1–.4](#c0414). |
| D14 | G1-06.a G5-01.b | Sistemas, motores y paquete NPM Cruce MCP-PRO-01 [C07.1](#c071). |
| D15 | G2-01.a G5-01.b | Preferencias y fidelidad por modalidad Cruce MCP-PRO-01 [C07.1](#c071). |
| D16 | G3-03.a G5-03.b | Recursos, aislamiento y concurrencia Cruce MCP-PRO-01 [C08.1](#c081), [C07.1](#c071). |
| D17 | G1-04.d G3-06.b G5-03.c | Idiomas, formatos y replay Cruce MCP-PRO-01 [C07.1](#c071). |
| D18 | G0-05.a G3-04.a | Multimedia auténtica y privada |
| D19 | G2-03.a G3-04.b G5-02.a | Retención/poda y restauración Cruce MCP-PRO-01 [C06.1](#c061). |
| D20 | G0-03.a G0-04.a G0-04.b G3-04.a | Secretos, sesión, autorización y visor |
| D21 | G5-04.b G6-01.a G6-02.a | Aceptación integral independiente |
| DE-01 A | G2-03.a G3-04.b G5-02.a | Retención inteligente |
| DE-02 B | G0-05.a G3-04.a G5-03.b G65-01.a | Elegibilidad de captura privada con grants concretos |
| DE-03 B | G5-05.a G6-01.a G6-02.a G65-02.a | Pisos, estratos y vetos Cruce MCP-PRO-01 [C08.1](#c081). |
| DE-04 A, B respaldo | G65-01.a G65-02.a CUT-01.a GA-01.a | Piloto representativo, corte y GA separados |
| DE-05 B | G3-06.b G5-03.c G6-01.a | Dos matrices de accesibilidad y estados críticos |
| AC-DE-01 B | G0-04.b G1-04.a G1-04.b G3-06.b G5-03.c | Operación local integral sin IA |
| AC-DE-02 A | G2-04.a G4-01.a | Estrategia, riesgo, cobertura, entrega/UAT |
| AC-DE-03 B | G3-05.a G3-05.b G5-03.b | Consulta/publicación, recetas y D11 separado |
| AC-DE-04 A | G3-05.c G4-01.a G5-03.a | Automatización reutilizable, CI e ingesta |
| AC-DE-05 A | G3-06.a G3-06.b | Perfil acotado de no funcional |
| AC-DE-06 A | G3-01.b G3-01.d G3-02.a G6-01.a | Calidad, configuraciones y efecto compuesto |
| AC-DE-07 A | G3-05.a G4-02.a | Flujo IA sin MCP diferido, intercambio y operación sin IA preservados |
| C1 | G0-05.a G3-04.a G3-04.b G5-03.b | Custodia y reproducción |
| C2 | G1-01.a G1-01.b G1-02.a G2-03.a G5-02.a | Escritor, persistencia, recuperación y retiro Cruce MCP-PRO-01 [C05.2](#c052), [C06.1](#c061). |
| C3 | G0-03.a G0-04.a G0-04.b G1-06.b G3-06.b | Frontera humana y secretos Cruce MCP-PRO-01 [C07.1](#c071). |
| C4 | G2-02.a G3-02.b G3-05.a G5-03.b G6-01.a | Documentos, Excel y publicaciones |
| C5 | G0-01.a G0-08.a G1-06.a G1-06.b G1-07.a G5-01.a G5-01.b G5-04.b G5-05.a GA-01.a | Admisibilidad, seis niveles e identidad instalada Cruce MCP-PRO-01 [C01.1](#c011), [C02.1](#c021), [C07.1](#c071), [C08.1](#c081). |
| C6 | G0-06.a G0-07.a G1-03.a G1-06.b G1-07.a G3-01.a G4-02.b G5-03.a G5-05.a | Interoperabilidad, sobre AR-52, guardia CI, JUnit y paridad Cruce MCP-PRO-01 [C03.1](#c031), [C05.6](#c056), [C09.1](#c091). |

## E1–E8 y EXP-01–08

Usar [DAG y protocolos AV-07](compuertas-av07.md), [E1–E8 históricos compatibles](../plan-maestro.md#e-compuertas-de-aceptación), [precisiones AV-08](enmiendas-av08.md), [fe EXP-06](protocolos-exp-06-ac.md) y [contratos AC-01](contratos-ac01.md), incluido EXP-08. E8 reevalúa lo aplicable de E1–E7; G6.5 tiene su propio manifiesto. Los candidatos ET se califican antes de fijarlos.

| Evidencia | Unidades de producción o repetición | Familia |
| --- | --- | --- |
| E1 | G0-02.a G0-02.b G0-09.a G1-06.b G1-03.a G1-07.a | Contratos, DTO, matriz consumidor/versión, compilación y aciclicidad. Guardia, proyección parcial y contratos externos en G1 En G0, contrato G0-02.a/b y adjudicación G0-09.a. En G1, cotejo instalado G1-06.b y adjudicación G1-07.a. Cruce MCP-PRO-01 [C05.1](#c051), [C05.2](#c052), [C09.1](#c091). |
| E2 | G1-01.a G1-01.b G1-06.b G5-02.a G5-03.b G1-07.a G5-04.b | Alcance, secretos, auditar efectos e histórico, corte ensayado. Intercambio portable/CSV e identidad de ensayo Cruce MCP-PRO-01 [C05.2](#c052), [C05.5](#c055), [C06.1](#c061). |
| E3 | G1-02.a G1-06.b G3-03.a G3-06.b G4-02.a G4-03.a | Autonomía, manual/híbrida, continuidad y presión Continuidad de G1 y presión EXP-03 de G3 con salidas propias. Cruce MCP-PRO-01 [C03.3](#c033), [C03.2](#c032). |
| E4 | G2-01.a G2-02.a G2-05.a G4-01.a G4-03.a G4-02.a | Discovery, ingesta, planificación y vigencia. AR-45 y replay regional AR-45 consume señales G2 acreditadas, con replay G4-02.a y adjudicación G4-03.a. Cruce MCP-PRO-01 [C05.8](#c058). |
| E5 | G3-01.a G3-01.b G3-02.a G3-02.b G3-07.a G5-03.b G3-05.c G4-02.a G4-03.a | Efecto, E2E, testigos, D11 y limpieza. Ingesta externa integrada y contexto efectivo sin reducir las pruebas de efecto Oráculo regional de G3-02.a y adjudicación G3-07.a. Cruce MCP-PRO-01 [C05.8](#c058). |
| E6 | G1-05.a G1-06.b G3-04.a G3-05.a G3-06.b G5-03.b G6-01.a G3-05.c G5-03.a | Custodia, publicación, medios, accesibilidad y portabilidad. Q/P/R, CSV y alcance externo aplicable |
| E7 | G1-03.a G1-06.b G5-03.a G5-03.b G5-03.c G1-07.a G4-02.a G4-03.a G5-05.a | Paridad instalada, adaptadores, CI y distribución. AR-45, guardia CI y actas por identidad La paridad G1 se adjudica en G1-07.a. Las repeticiones G5 alimentan el sello G5-04.b y el acta G5-05.a. Cruce MCP-PRO-01 [C03.3](#c033), [C05.3](#c053), [C03.2](#c032), [C05.2](#c052), [C05.5](#c055), [C09.1](#c091), [C05.8](#c058). |
| E8 | G5-04.a G5-04.b G6-01.a G6-02.a G5-05.a | Ciego, V-01–V-16, conformidad, generalización, adopción y eficiencia. Candidato aprobado, reserva limpia según CV08-05 |
| EXP-01a | G0-06.a G1-06.b G5-03.a | Probes, rutas, bytes y cuatro HOST por build/era Aplicar las cuatro garantías de sondeo y el registro por HOST en cada fase. Cruce MCP-PRO-01 [C03.1](#c031), [C03.3](#c033), [C04.1–.4](#c0414). |
| EXP-01b | G4-02.b G5-03.a | Adopción, reapertura, tokens y paridad G4-02.b entrega a G4-03.a. G5-03.a repite para G5-04.b y G5-05.a. Cruce MCP-PRO-01 [C08.2](#c082). |
| EXP-02 | G2-01.a G2-05.a | Fidelidad y comparación de Discovery. Control efectivo XET-05 por motor |
| EXP-03 | G3-03.a G3-04.b G5-03.b | Presión, coste completo y reserva cleanup G3-03.a produce presión G3, con medición G3-04.b y salida G3-07.a. G5-03.b repite para G5. Cruce MCP-PRO-01 [C08.1](#c081). |
| EXP-04a | G1-06.a G1-07.a | Vertical NPM instalada. Manifiesto común G1 Evidencia G1 de distribución, identidad y aceptación C5. [C02.1](#c021), [C08.1](#c081). Cruce MCP-PRO-01 [C08.1](#c081), [C07.1](#c071). |
| EXP-04b | G5-01.b | Instalación completa por celda Atestación G5-01.b incorporada al sello y conciliada en G5-05.a. [C02.1](#c021), [C08.1](#c081). Cruce MCP-PRO-01 [C08.1](#c081), [C06.1](#c061), [C07.1](#c071). |
| EXP-05a | G0-07.a G0-09.a | Factibilidad contratos/dialecto/broker. XET-05 por motor aplicable |
| EXP-05b | G3-01.a G3-01.b G3-02.a G3-07.a | Efectos, referencia, lote/async/compuesto y reconciliación con DAG fixture |
| EXP-06a | G0-05.a G0-09.a | Prevención y primer byte antes de G1. Superficies y controles XET-05 por motor aplicable |
| EXP-06b | G2-02.a G3-02.b G6-01.a | D11 factibilidad, bytes integrados y ciego por clase |
| EXP-06c | G3-04.a G3-04.b G5-03.b | Entrega protegida, medio utilizable y repetición instalada |
| EXP-07 | G0-04.a G1-06.b | KEK, IPC, principales y CI Cruce MCP-PRO-01 [C07.1](#c071). |
| EXP-08a | G0-04.b G0-09.a | Frontera previa a G1 Cruce MCP-PRO-01 [C07.1](#c071), [C05.4](#c054). |
| EXP-08b | G1-06.b G1-07.a | Vertical humana instalada. Modalidades aplicables separadas y Senior→Executor Cruce MCP-PRO-01 [C07.1](#c071), [C05.4](#c054). |
| EXP-08c | G3-06.b G5-03.b G6-01.a G65-02.a | Integración, instalado y recorrido humano en contextos separados Cruce MCP-PRO-01 [C07.1](#c071), [C05.4](#c054). |

## Integración UX

Los IDs UX-P son de trazabilidad del diseño. Registros, alcance y positivos/negativos en [protocolo UX](aceptacion-ux-plan.md). [Expediente aceptado](../diseno-ux/README.md).

| Familia UX | Subtareas | Recorrido o área |
| --- | --- | --- |
| UX-P01 | G1-04.a G1-04.b G3-05.b G4-01.a G5-03.c G1-06.b G1-07.a G3-06.b G5-04.b | Operación general sin expediente y sin código/IA. Modalidades acumulativas, Senior→Executor y ausencia efectiva de HOST/IA/terminal/edición/expediente Cruce MCP-PRO-01 [C05.4](#c054). |
| UX-P02 | G2-03.b G4-01.b G5-03.c | Grafo empresarial e impacto |
| UX-P03 | G2-01.b G3-01.d G5-03.c G6-01.a | Catálogo autorizado y diferencias entre instancias |
| UX-P04 | G3-01.c G3-02.a G3-06.b G5-03.c | Flujo visual con verificaciones positivas y negativas |
| UX-P05 | G1-04.c G3-05.b G5-03.c G1-06.a G1-07.a G5-04.b | Refinamiento, forense e histórico separado. Recursos empacados y verificados por identidad |
| UX-P06 | G1-04.d G3-06.b G5-03.c G1-06.a G1-07.a G5-04.b | Onboarding, ayuda, localización y accesibilidad. Ayuda/locales empacados y verificados por identidad |
| UX-P07 | G1-02.a G4-02.a G4-02.b G5-03.c | Continuidad y control de recursos/tokens |

## Materialización de pruebas y variantes

Antes de ejecutar cada evaluación, el dueño lógico descompone cada afirmación independientemente falsable mediante una ficha `fuente/ID y precedencia → subobligación → consumidor/condición → celda → productor/subtarea → entregable versionado → verificación → evidencia → adjudicador/compuerta de salida`. Aplicar CC08-01 a cada subobligación, consumidor y celda. La revisión independiente congela la lista y el nivel exigible. Guardar enlaces inversos de artefacto/intento/control a afirmación y fuente, con justificación por cada reutilización. Si hay varias salidas, registrar cada repetición con identidad propia, incluso cuando reutilice fixture. El índice documental fija familias. Versiones instaladas, permisos efectivos, fixtures y muestras quedan para sus manifiestos autorizados, conforme a CC08-01.

| Familia de celdas | Separaciones mínimas además de los casos por ID | Resultado/oráculo |
| --- | --- | --- |
| Artefacto y consumo | Por Windows/macOS/Linux y CPU/libc/ABI aplicables; runtime, paquete/launcher, navegador/renderer/stock/patched, modos visible/headless, GUI/CI, cuatro HOST reales y clientes/versiones, CLI, MCP, CI, UI, visor y offline cuando exija la fuente. Aplicar los seis niveles C5 por artefacto | Instalación limpia y doctor, bytes efectivos, ejecutables, códigos y comportamiento observado. Browser del AUT separado del renderer y del visor |
| Memoria y autoridad | Proyecto, entorno, instancia, tenant y perfil opaco, ámbito/revisión y separación de planos epistémicos. Alta, revocación y rechazo de bypass en GUI/CI y por entrada legacy. Ocho autoridades operativas, cuatro grants de medios y tres modos de captura independientes | Verdad de identidad efectiva, permisos antes de consultas/agregados y efecto, registros y canarios independientes |
| Discovery y configuraciones | Builds/roles/derechos, rutas, estados y transiciones separados, observación y regla acreditada, configuración declarada/observada/efectiva, preferencias 1a y fidelidad 1b. Denominador autorizado por instancia, ámbito y corte | Inventario congelado anotado por custodio, evidencia de cero mutaciones, comparación solo con procedencia y transformación acreditadas |
| Documentos D10/D11 | D10 por formato, clase, estructura, OCR, localizadores, versión y autoridad. D11 por PDF/Excel y clase vinculante, bytes emitidos, filas/celdas, defecto/controles sanos y los tres planos. Publicación QAP separada por formato/destinatario | Verdad documental independiente y regla contable acreditada. Registro TEC de matriz por clase; abstención no acredita AR-20 |
| E2E, UTCP y OpenAPI | Positivo y negativo autorizado por operación, dialecto/versión, control QAP separado de payload negativo AUT, precondición, rol, destino, efecto, testigo y limpieza, ambos mecanismos. Operación manual/híbrida/preparada, referencias y unidad compuesta | Estado antes/después, correlación, ventana, concurrencia real y ausencia de efecto probado; separar recepción, ejecución, compensación, restauración y confinamiento |
| Media M1–M5 y publicaciones | Individualizar las cinco ampliaciones, MIME/range/seek, capturas PNG por modo, WebM y cuadro inicial, superficie prohibida y ruta/export offline; conservar autorización y disponibilidad de evidencia por separado | Bytes, longitud/sello/generación, canarios, controles visuales, evidencia admitida y vigencia incluso tras reinicio/expurgo |
| Semántica y recuperación | Cruces AR-52 por fase, veredicto, cuatro ejes, cleanup/evidencia, código nativo/observado, CI y JUnit; pérdida de HOST, ejecutor o respuesta en ventanas distintas, CAS y cambio de generación | Tabla canónica, journal y testigo causal. Repetición perdida o efecto incierto no se resuelve por reenvío o HTTP |
| UX y accesibilidad | ES/EN y locales que defina el manifiesto, idioma AUT/QAP y cambio durante campaña, formato regional y códigos invariantes; dos matrices separadas AUT/QAP, estados críticos/ayuda, usuario nuevo/experto y alternativas a zoom/arrastre | Éxito por tarea y hechos comprendidos, revisión automática y humana, corpus y límites precongelados. La validación UX no sustituye E8 |

Campos mínimos de cada ficha: revisión/huella, plataformas y consumidor, actor/autoridad/datos y clasificación, política de activación, universo/estrato, oráculo acreditado y nivel causal, positivo, negativo/mutante, resultado esperado según contrato, método de adquisición, testigo/revisor, presupuesto/cleanup, salida alternativa y veto. Estados de celda según fuente: conservar aplicabilidad, motivo y evidencia. Sin instancia/variante definida se registra indeterminación. N/A exige justificación anterior a evaluación. Cambios de permiso, identidad o dependencia obligan a comprobar validez y reabrir descendientes pertinentes. No se fusionan denominadores por reutilizar una prueba o por cruces ET.

### Controles MCP-PRO-01 por obligación, identidad y fase

Para cada criterio, registrar fuente y precedencia, afirmación, consumidor y variante, productor, evidencia versionada, control sano y negativo, testigo y adjudicación por fase. La identidad mínima incluye SHA/build/lock/digest, instalación y caché, launcher y runtime, SO/CPU/libc/ABI, actor/grant y fixture/revisión. Cuando apliquen, añadir build y superficie de HOST, era, motor/modo, locale, modelo y tokenizer. Una evidencia reutilizada requiere resultado y justificación propios por afirmación. Los cruces referencian entregables y rutas de predecesores existentes de WBS-01. La aceptación de una fase se decide con la evidencia exigible disponible en sus entradas y con la identidad de esa fase.

[MCP-PRO-01 v1.2 §5](mcp-pro-01-v1.2.md#5-matriz-temporal-de-evidencias-y-controles) · [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [PM-01 §5](plan-maestro-reconstruccion-et.md#5-aceptación-y-método-de-evidencia) · [WBS-01](wbs-reconstruccion-et.md) · [Índice inverso por subtarea](#índice-inverso-por-subtarea)

«Consume» identifica al receptor técnico o documental por una ruta existente, directa o transitiva. **Sello** designa la salida de custodia G5-04.b. **Adjudicación** identifica la decisión de fase.

#### Filas afectadas por el refrendo

| Criterio/fuente | Fase y naturaleza | Productor y evidencia | Consumidor | Adjudicación |
|---|---|---|---|---|
| <a name="c011"></a> **C01.1 · C5, AR-21/34/51, REQ-INT-001.2** | G0, admisibilidad | G0-08.a · libro por componente, derechos, ABI, SBOM y disposición de cierre. Componente inconsistente queda inadmisible. | G0-06.a, G0-07.a y demás unidades G0 con esa entrada | **G0-09.a**, por salidas G0 |
| C01.1 | G1, vertical instalada | G1-06.a · builds limpios reproducibles, tarball y manifiesto común. G1-06.b · cotejo instalado del árbol, assets y bytes. Rechazar resolución flotante, ABI rival, asset ausente o script indispensable. | Consumidores persistente/`npx`; G1-06.b consume G1-06.a | **G1-07.a**, C5 por variante |
| C01.1 | G5, repetición | G5-01.a · identidad previa. G5-01.b · EXP-04b, atestaciones, cierre transitivo, derechos y avisos del candidato, incluso en npm 12. | G5-04.b consume G5-01.b y demás entradas ratificadas. G5-05.a consume el sello y las repeticiones directas. | **G5-05.a** |
| <a name="c021"></a> **C02.1 · C5, AR-34, RP-C01/02** | G0, preliminar | G0-06.a · resolución y frontera de bootstrap de la ruta candidata dentro de EXP-01a, con sus límites y alternativas. | Expediente preliminar G0 | **G0-09.a**, alcance G0 |
| C02.1 | G1, vertical instalada | G1-06.a · manifiesto, referencia del alta, atestación y origen. G1-06.b · comprobación de vigencia, conflictos, rotación/revocación y proceso efectivo. Observar PATH, árbol local, caché, digest y sustitución. | Launcher, núcleo y broker. Testigo de frontera IPC y observador de carga. | **G1-07.a**, solo evidencia G1 |
| C02.1 | G5, repetición | G5-01.a · identidad y política previas. G5-01.b · atestaciones persistente/`npx` frío/caliente/offline declarado. G5-03.a · repetición de EXP-01a instalada. | G5-04.b concilia esas entradas. G5-05.a consume sello y G5-03.a/b/c. | **G5-05.a** |
| <a name="c031"></a> **C03.1 · D13, AR-15/42, REQ-AGT-001, C6, EXP-01a** | G0 preliminar, G1 instalada, G5 repetición | G0-06.a, G1-06.b y G5-03.a producen, **cada uno en su fase**, catálogo/tráfico, cuatro ceros, operación autorizada y denegación separadas, versión incompatible y contaminación de salida. | Cliente de referencia por era, cuatro HOST observados por build/superficie y testigo independiente | **G0-09.a**, **G1-07.a**, **G5-05.a** con sello G5-04.b, respectivamente |
| <a name="c033"></a> **C03.3 · AR-42, REQ-RUN-001.4/.5, E3/E7, EXP-01a** | G1 instalada, G5 repetición | G1-02.a · journal/fence y continuidad E3. G1-06.b · prueba instalada de dos lotes/diez listos, probes hermanos, cuatro ceros, EOF, ACK perdido, corte de HOST/ejecutor, lease viejo y efecto incierto. G5-03.a/b repiten lo que corresponde a sus expedientes. | Supervisor y HOST receptor. Observador causal de procesos, autoridad y journal. | **G1-07.a** para G1. **G5-05.a** con sello G5-04.b para repeticiones G5. |
| <a name="c051"></a> **C05.1 · E1, REQ-PLN-001.4/.5, REQ-RUN-001.2, REQ-INT-001.1–.4** | G0, contractual | G0-02.a/b · DTO, tabla, contratos de identidad/snapshot, política y proyección. | Unidades G0 por rutas vigentes; QA independiente | **G0-09.a** |
| C05.1 | G1, vertical instalada | G1-01.a/03.a · autoridad y entradas. G1-06.b · vertical de tres SO, DAG y tipos aplicables, matriz consumidor–versión, DTO/errores y negativos de snapshot y escritor paralelo. | G1-06.b coteja contra manifiesto G1 y contratos que integra la vertical. | **G1-07.a** |
| <a name="c053"></a> **C05.3 · D13, REQ-IA-001.5, REQ-REP-001.2, E7** | G1, paridad acreditada | G1-03.a · entradas y sobre. G1-06.b · paridad por afirmación con snapshot común, atestados, mixto/vacío/purgado, clientes previos, proyección y export. | MCP/CLI/GUI/CI aplicables y QA. Oráculo semántico independiente. | **G1-07.a** |
| C05.3 | G5, regresión instalada | G5-03.a/b · repetición E7 con candidato, misma semántica exigible y evidencia propia. | G5-04.b sella y G5-05.a concilia repetición y sello. | **G5-05.a** |
| <a name="c057"></a> **C05.7 · RP-C03, AC01-18.01/.02, REQ-INT-001.4, XET-12** | G1 contractual e instalado | G1-03.a · contratos y fixtures por familia, procedencia y frontera. **G1-06.b** · cotejo instalado con positivos y negativos de build, datos, duplicado, autoridad y presupuesto. | Ingesta y superficie de despacho condicionado, si aplica | **G1-07.a**, E1 |
| C05.7 | G3 integrada y G5 regresión | G3-05.c · ingesta por familia y despacho únicamente si se habilita. G5-03.a · repetición por identidad y nivel de contribución. | G3-07.a consume G3. En G5, G5-04.b y G5-05.a consumen sus entradas G5. | **G3-07.a** y **G5-05.a**, por fase |
| <a name="c058"></a> **C05.8 · RP-C03, AR-45, XET-05, AC01-12.04–.08** | G0/G2, controles por motor | G0-07.a/05.a · EXP-05a/06a. G2-01.a · EXP-02 por Chromium, Firefox y WebKit aplicables. Registrar falta de ruta o control efectivo sin extrapolar CDP. | Unidades de cada fase y sus QA | **G0-09.a** y **G2-05.a**, respectivamente |
| C05.8 | G3, oráculo y reportes | **G3-02.a** · oráculo regional efectivo E5. G3-05.a/Q/P/R · consulta, publicación y render separados con evidencia y negativos propios. | Integración G3. G4-01.a recibe la base regional por salida G3. | **G3-07.a**, evidencia G3 |
| C05.8 | G4, replay | G2-01.a · señales efectivas ya acreditadas. G3-02.a · oráculo regional ya acreditado. G4-01.a · contexto congelado por segmento. **G4-02.a** · replay E4/E5/E7, control sano/deriva, cero inferencias. | G4-02.a usa plan y oráculo, y su evidencia llega por la ruta G4-02.b → G4-03.a. | **G4-03.a** |
| C05.8 | G5, repetición aplicable | G5-03.b · motores y Q/P/R. G5-03.c · localización instalada. | G5-04.b y G5-05.a por sus entradas | **G5-05.a** |
| <a name="c081"></a> **C08.1 · CC08-01, DE-03, D16, EXP-03/04, RP-C01/02** | G1, aceptación instalada | G1-06.a/b · ficha previa, perfil, comparador, EXP-04a y vertical por identidad con reserva. | QA de la vertical | **G1-07.a** |
| C08.1 | G3, presión | **G3-03.a** · EXP-03/E3 con W=0/1/>1 y reserva. G3-04.b · medición integrada del árbol y restauración. | G3-04.b consume presión y G3-07.a consume salidas G3. | **G3-07.a** |
| C08.1 | G5, identidad y aceptación | G5-01.a · ID previo. G5-01.b · instalación. G5-02.a · ensayo. G5-03.a/b/c · repeticiones y UX. G5-04.a · corpus/reserva. G5-04.b · sello posterior. | Custodio G5-04.b con sus seis entradas ratificadas. QA G5-05.a con sello y tres entradas directas de validación. | **G5-05.a** |
| <a name="c082"></a> **C08.2 · D13, REQ-OPT-002, AR-49, EXP-01b** | G4, primera adjudicación | **G4-02.b** · adopción y comparación pareada por HOST/build/modelo/tokenizer y tramo, después de G4-02.a. Contadores, cobertura y negativos de interferencia, omisiones y datos ausentes. | **G4-03.a** consume directamente EXP-01b de G4-02.b. | **G4-03.a** |
| C08.2 | G5, regresión instalada | **G5-03.a** · repetición EXP-01b y paridad en la identidad instalada G5. | G5-04.b y G5-05.a consumen G5-03.a conforme a sus entradas directas. | **G5-05.a** |

En C01.1 y C02.1, los testigos son reconstituidores y consumidores limpios independientes, observadores de carga y de la frontera de autoridad. En C08.1 el negativo incluye denominador cambiado, identidad ajena y ausencia de reserva. En C08.2, estimaciones, datos ausentes y pérdida de cobertura tienen salida explícita. Ninguno acredita ahorro comparable por sí mismo.

#### Criterios conservados de v1.1

| Criterio/fuente | Producción, consumo y salida exigible |
|---|---|
| <a name="c032"></a> **C03.2 · REQ-SEG-001.1, REQ-AGT-002, E3/E7** | G1-02.a/03.a y G4-02.a prueban selección explícita, cero/una/varias roots, A→B→A y reingreso. Journal y auditoría verifican una admisión, recibo de duplicado autorizado, rechazo de revisión, ámbito, digest o revocación inválidos y cero IO de proyecto fuera de alcance. |
| <a name="c0414"></a> **C04.1–.4 · D13, EXP-01a** | G0-06.a, G1-06.b y G5-03.a prueban Antigravity, Codex, Claude Code y Gemini CLI por superficie/build/ámbito, respectivamente en las fases preliminar, instalada y repetida. Alta, segunda alta sin escritura, baja propia, corte, edición rival, precedencia, configuración inválida y preservación de ajenos. Testigo concurrente, recibo propio y lectura HOST efectiva. |
| <a name="c052"></a> **C05.2 · C2, AR-24/54/57, E1/E2/E7** | G1-01.a/03.a/05.a producen escritor, mantenimiento y visor. G1-06.b coteja y G1-07.a adjudica. Repetir lo aplicable en G5-03.a/b. Oráculo de IO/dispatch para `qap run`, visor de lectura y reindex default/`[dir]`/programático, con cero bypasses. |
| <a name="c054"></a> **C05.4 · RP-C04, AC01-05, REQ-HUM-001, UX-P01, EXP-08** | G1-04.a/b y G1-06.b acreditan rutas humanas y operación CLI/CI aplicable. G3-06.b amplía EXP-08c. G5-03.c valida UX instalada y traspaso Senior→Executor. Testigos UX, política y journal por modalidad. HOST ausente, revocación, propuesta obsoleta o modalidad omitida conservan sus negativos. |
| <a name="c055"></a> **C05.5 · RP-C03, AC01-11.01/.02, E2/E7** | G1-01.a/04.b producen intercambio y ruta gráfica. G1-06.b coteja y G1-07.a adjudica A→B→A dos veces y CSV gobernado. G5-03.a/b repiten según consumidor/formato. Manifiestos, recibos y cotejo de estado acreditan fidelidad, dedup y cero promociones indebidas. |
| <a name="c056"></a> **C05.6 · RP-C03, AR-52, AC01-17.02, C6** | G1-03.a produce sobre, guardia y proyección JUnit. G1-06.b observa el consumidor CI real para G1-07.a. G5-03.a repite para G5-04.b/05.a. Oráculo de efecto y comprobación del sobre, la tabla y el código, con cero falsos PASS. |
| <a name="c061"></a> **C06.1 · D02/D19, C2, AR-41/51, E2, EXP-04b** | G1-06.a entrega la composición inicial. G5-01.b y G5-02.a acreditan promoción, baja, rollback y recuperación sobre candidato para G5-04.b/05.a. Journal, observador y conciliación de stores/medios prueban un escritor, despacho cercado, continuidad y revocación preservada. |
| <a name="c071"></a> **C07.1 · D14–D17, C3/C5, AR-24/28/40/51, EXP-04/07/08** | G0-04.a/08.a califican preliminarmente composición y admisibilidad. G1-06.a/b y G5-01.b prueban en imagen limpia instalación, `doctor`, Stdio y recorrido autorizado con navegador bajo demanda. Testigo de dependencias, principal y ausencia de elevación ordinaria. |
| <a name="c091"></a> **C09.1 · C6, AR-34, REQ-INT-001.1, E1/E7** | Referencias corregidas en el expediente de G0-06.a. G1-03.a produce la entrada ordinaria. G1-06.b debe comprobar el recorrido instalado hasta el núcleo y sobre canónico para G1-07.a. Un smoke que termina antes del núcleo es evidencia insuficiente. |

#### Cruces de precedencia y familias

- [RP-C01 y RP-C02](resolucion-rp-01.md#matriz-de-cierre-documental) y C5 se aplican por identidad y salida en [C01.1](#c011), [C02.1](#c021), [C08.1](#c081).
- [RP-C03](resolucion-rp-01.md#matriz-de-cierre-documental) rige las rutas semánticas y temporales de [C05.5](#c055), [C05.6](#c056), [C05.7](#c057), [C05.8](#c058). [RP-C04](resolucion-rp-01.md#matriz-de-cierre-documental) y la familia AC01-05, EXP-08 y UX-P01 se aplican en [C05.4](#c054).
- [CC08-01](segunda-contravalidacion-av08.md#cc08-01--cierre-normativo-por-subobligación-consumidor-y-celda) y [DE-03](acta-ratificacion-de.md) rigen la ficha, el perfil absoluto, los denominadores y los vetos de [C08.1](#c081).

## Rutas semánticas y temporales RP-01

Las entregas Q/P/R son referencias internas a G3-05.a: Q produce la consulta, P la publicación versionada y R el renderizado. Cada una mantiene artefacto, controles y evidencia adjudicables.

| Fuente y obligación | Productor y entregable | Verificación positiva y negativa | Salida exigible |
| --- | --- | --- | --- |
| AC01-11.01 · intercambio portable | G1-01.a: esquema, export/import, identidad/revisión, manifiesto, mapeo y recibo. G1-04.b: ruta gráfica. G2-03.c reutiliza el intercambio para conciliación | G1-06.b: A→B→A dos veces, idempotencia, linaje automatizado y conflicto mismo ID/otro digest sin sobrescritura, secretos, sesiones ni grants. Una firma externa no acredita veracidad ni exclusión global. G5-03.a repite por consumidor instalado | G1-07.a (E2), G5-05.a (E7) Cruce MCP-PRO-01 [C05.5](#c055). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-11.02 · biblioteca QAP y CSV | G1-01.a: validación por fila/tipo, decisión, vista previa/mapeo y recibo. G1-04.b: ruta gráfica | G1-06.b: conservar ID textual, aceptar/rechazar filas explícitamente. Fórmulas/macros/instrucciones inertes y ningún PASS o permiso importado. G5-03.a y G5-03.b repiten por consumidor/formato | G1-07.a (E2), G5-05.a (E6/E7) Cruce MCP-PRO-01 [C05.5](#c055). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-17.02, AR-52 y C6 · CI | G1-03.a: sobre canónico versionado y sellado, código exacto, guardia de campaña y JUnit parcial con pérdidas documentadas y caso QAP_CANONICAL_GATE | G1-06.b y G5-03.a: seis veredictos, cuatro ejes, mapa obligación/intento sin duplicar denominadores y autoridad de sobre terminal funcional con código 0, obligaciones satisfechas, sin veto ni cleanup/evidencia pendiente. ACK/consulta 0, PASS estructural, campaña abierta/vacía, residual, JUnit editado o consumidor que ignore skipped/error/código no acreditan éxito | G1-07.a (E1/E7), G5-05.a (E7) Cruce MCP-PRO-01 [C05.6](#c056). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-18.01 · ingesta externa | G1-03.a: contrato común/perfiles versionados y fixtures por familia. G3-05.c: adaptadores integrados y registro de vínculo al build, alcance, obligación y nivel de contribución | G1-06.b coteja contrato. G3-05.c y G5-03.a contrastan fixture saneado y negativos por familia funcional/contratos, rendimiento/carga y seguridad/escáner. Verificar dedup/conflicto, identidad, dato ausente, resultado firmado insuficiente, autoridad y retiro que conserva histórico | G1-07.a (E1), G3-07.a (E5), G5-05.a (E7) Cruce MCP-PRO-01 [C05.7](#c057). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-18.02 · frontera de ejecución condicionada | G1-03.a: contrato de autoridad, destino/efecto/egress, presupuesto, cancelación, aislamiento y custodia. G3-05.c: calificación solo si se habilita despacho | G1-06.b coteja frontera. G3-05.c y G5-03.a verifican, si aplica, contención por destino/presupuesto y alcance separado para carga/escaneo. Importar no despacha. Código arbitrario y uso de workers QAP como carga quedan excluidos | G1-07.a (E1), G3-07.a (E5/E6), G5-05.a (E7) Cruce MCP-PRO-01 [C05.7](#c057). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AR-45 · [contexto efectivo](enmiendas-av03.md#ar-45) | G2-01.a: señales efectivas E4. G3-02.a: oráculo regional E5. G4-01.a: plan y contexto por segmento con idioma, zona, moneda, calendario, numeración, precisión/redondeo, normalización, versiones y reloj cuando apliquen | G4-02.a: [protocolo E4/E5/E7](protocolos-av03.md#e4e5e7--locale-y-canonicalización) con ES/EN y un locale adicional, cambio previsto en la misma campaña frente a deriva, códigos invariantes y oráculo regional independiente. Replay con cero inferencias, vectores de canonicalización, digests de proyección comparables y atestados separados. G5-03.c repite localización instalada | G4-03.a antes de salir (preservar E4/E5/E7), G5-05.a (repetición instalada) Cruce MCP-PRO-01 [C05.8](#c058). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| XET-05 · [control por motor](integracion-tecnologica-et.md) | G0-07.a/EXP-05a: broker/red/proceso. G0-05.a/EXP-06a: prevención y primera escritura. G2-01.a/EXP-02: Discovery. Matriz de capacidades, builds, superficie, modo y aplicabilidad | Registrar por Chromium, Firefox y WebKit las pruebas aplicables. Comparar admisión/denegación, falta de ruta, canarios y ausencia de efecto según protocolo. CDP no acredita el control de otro motor. G5-03.b repite celdas instaladas aplicables | G0-09.a (05a/06a antes de G1), G2-05.a (02), G5-05.a (instalado) Cruce MCP-PRO-01 [C05.8](#c058). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-12.04 · consulta | G3-05.a/Q: proyección as-of con hecho/registro/revisión/corte/corrección/evidencia disponible y grado de comparabilidad | E6 y G5-03.b: contrastar comparabilidad por estrato y poda. Sin recuperar expirado ni inferir mejora de población incompatible | G3-07.a (E6), G5-05.a (E7) Cruce MCP-PRO-01 [C05.8](#c058). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-12.05/.06 · publicación | G3-05.a/P: plantilla, definición, publicación inmutable, selección/huella/omisiones y perfil con grants independientes | E6 y G5-03.b: nueva publicación sin mutar previa, redacción por destinatario, revocación y grants separados. Publicar no envía y una copia no acredita vigencia | G3-07.a (E6), G5-05.a (E7) Cruce MCP-PRO-01 [C05.8](#c058). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |
| AC01-12.07/.08 · renderizado | G3-05.a/R: PDF/XLSX derivados de selección autorizada. Matriz por formato y cliente | E6 y G5-03.b: PDF paginado y legible con prueba de capas/metadatos prohibidos. XLSX tipado con IDs textuales y precisión, reimportación/apertura aplicables y contenido activo ausente. Verificar bytes independientemente de Q/P | G3-07.a (E6), G5-05.a (E6/E7) Cruce MCP-PRO-01 [C05.8](#c058). [PM-01 §4](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) · [WBS-01](wbs-reconstruccion-et.md). |

Para G1 y G5, cada fila de prueba instalada enlaza al manifiesto, a su identidad efectiva de variante y al acta de salida. Consultar la [regla de identidad, cambio y reserva](plan-maestro-reconstruccion-et.md#identidad-instalada-y-control-del-candidato). El acta G5-05.a es referencia inversa para G6-01.a/G6-02.a, G65-01.a/G65-02.a y GA-01.a. Cada acta conserva el enlace a la precedente y registra el rechazo de identidades incompatibles.

## Índice inverso por subtarea

Incluye unidades de gobierno, adjudicación y preparación con sus salidas de referencia. Cada dictamen de fase consume además la totalidad de controles de los predecesores aplicables en la WBS.

| Subtarea | Entradas, cláusulas, reservas y familias de evidencia |
| --- | --- |
| P-01.a | Actas y fuentes de precedencia |
| P-02.a | AR-01, AR-02, AR-03, AR-55, AR-56, AR-19 |
| P-02.b | RP-01 y acto de aprobación del plan, [Resolución RP-C01–04](resolucion-rp-01.md) |
| G0-01.a | AR-21, AR-26, AR-34, AR-54, AR-57, TEC-01, C5 |
| G0-08.a | AR-23, AR-51, TEC-02, XET-15, C5 G0 · [C01.1](#c011) (productor de admisibilidad y libro C5 por componente), [C07.1](#c071) (productor de calificación preliminar de la composición). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-02.a | REQ-IA-001.1, REQ-ORA-001.1, AR-52, AR-08, AR-09, TEC-03, D12, E1 G0 · [C05.1](#c051) (productor de contrato E1). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-02.b | REQ-MEM-002.2, REQ-IA-001.3, REQ-PLN-001.5, REQ-RUN-001.2, REQ-SEG-001.1, REQ-SEG-001.2, AC01-10.01, AR-04, AR-14, D07, E1 G0 · [C05.1](#c051) (productor de contrato E1). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-03.a | AR-24, D20, C3 |
| G0-03.b | AR-40 |
| G0-04.a | REQ-RUN-001.5, REQ-SEG-001.3, REQ-SEG-002.1, AR-07, TEC-16, XET-04, D20, C3, EXP-07 G0 · [C07.1](#c071) (productor preliminar de composición y fronteras), [C01.1](#c011) (consumidor de admisibilidad). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-04.b | REQ-SEG-001.1, REQ-HUM-001.2, AC01-05.03, AC01-05.04, AR-24, AR-28, TEC-08, XET-02, D20, AC-DE-01 B, C3, EXP-08a |
| G0-05.a | REQ-SEG-002.3, POL-CAP-001, AR-27, TEC-13, D18, DE-02 B, C1, EXP-06a, XET-05 G0 · [C05.8](#c058) (productor EXP-06a). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-06.a | REQ-AGT-001, AR-15, TEC-19, D13, C6, EXP-01a G0 · [C01.1](#c011) (consumidor de admisibilidad), [C02.1](#c021) (productor preliminar de resolución y frontera de bootstrap), [C03.1](#c031) (productor de EXP-01a preliminar), [C04.1–.4](#c0414) (productor del registro preliminar por HOST), [C09.1](#c091) (productor de referencias estáticas). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-07.a | REQ-DAT-001.3, REQ-INT-001.4, REQ-XINST-001, UTCP/OpenAPI, AC01-21.01, AR-31, AR-17, AR-22, TEC-17, TEC-20, XET-05, XET-10, D08, C6, EXP-05a G0 · [C01.1](#c011) (consumidor de admisibilidad), [C05.8](#c058) (productor EXP-05a). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G0-09.a | AR-40, E1, EXP-06a, EXP-08a, XET-05, EXP-05a G0 · [C01.1](#c011) (adjudica admisibilidad C5), [C02.1](#c021) (adjudica alcance preliminar), [C03.1](#c031) (adjudica EXP-01a preliminar), [C05.1](#c051) (adjudica E1 contractual), [C05.8](#c058) (adjudica celdas G0 por motor). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g0--contratos-y-factibilidad). |
| G1-01.a | REQ-MEM-001.1, REQ-MEM-001.3, REQ-MEM-002.1, REQ-MEM-003.6, REQ-SEG-001.1, REQ-INT-001.3, REQ-STR-001.3, REQ-DAT-002.2, AC01-03.02, AC01-12.01, AC01-12.02, AC01-21.02, AR-12, TEC-04, D02, C2, E2, REQ-MEM-002.5, REQ-MEM-003.4, REQ-REP-001.2, AC01-11.01, AC01-11.02 G1 · [C05.1](#c051) (productor de autoridad de la vertical), [C05.2](#c052) (productor del mapa de escritores/reindex), [C05.5](#c055) (productor del contrato de intercambio). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-01.b | C2, E2 |
| G1-02.a | REQ-MEM-002.3, REQ-DIS-001.8, REQ-IA-001.4, REQ-RUN-001.4, REQ-RUN-001.5, REQ-CAM-001.4, REQ-SEG-001.3, AR-42, TEC-15, XET-01, C2, E3, UX-P07 G1 · [C03.2](#c032) (productor de admisión y reingreso), [C03.3](#c033) (productor de continuidad E3 y journal/fence). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-03.a | REQ-PLN-001.5, REQ-INT-001.1, AC01-17.01, AR-52, XET-12, C6, E7, REQ-REP-001.1, REQ-SEG-001.1, REQ-SEG-002.2, REQ-INT-001.4, AC01-17.02, AC01-18.01, AC01-18.02, E1 G1 · [C03.2](#c032) (productor de entradas con selección explícita), [C05.1](#c051) (productor de entradas para E1), [C05.2](#c052) (productor de entradas canónicas), [C05.3](#c053) (productor de entradas y sobre), [C05.6](#c056) (productor AR-52/CI y JUnit), [C05.7](#c057) (productor de contratos y fixtures externos), [C09.1](#c091) (productor de la entrada ordinaria). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-04.a | REQ-RUN-002.1, REQ-HUM-001.1, AC01-05.01, AC01-05.03, AC-DE-01 B, UX-P01 G1 · [C05.4](#c054) (productor de rutas humanas). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-04.b | REQ-CAM-001.1, REQ-HUM-001.1, REQ-HUM-001.2, REQ-HUM-001.4, AC01-04.01, AC01-04.02, AC01-05.01, AC01-05.02, AC01-06.01, AC01-06.02, AC01-07.01, AC01-10.01, AC01-10.02, D03, AC-DE-01 B, UX-P01, AC01-11.01, AC01-11.02 G1 · [C05.4](#c054) (productor de rutas humanas acumulativas), [C05.5](#c055) (productor de la ruta gráfica). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-04.c | UX-P05, RP-C01, recurso del manifiesto G1 |
| G1-04.d | REQ-QA-001, REQ-ONB-001, D17, UX-P06, RP-C01, ayuda/locales del manifiesto G1 |
| G1-05.a | M1, AR-24, E6 G1 · [C05.2](#c052) (productor de visor de lectura y custodia). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-06.a | REQ-INT-001.2, REQ-ONB-001, AR-37, D14, C5, EXP-04a, RP-C01, UX-P05, UX-P06 G1 · [C01.1](#c011) (productor del tarball y manifiesto C5 de la vertical), [C02.1](#c021) (productor de manifiesto, referencia del alta y atestación), [C06.1](#c061) (productor de composición inicial), [C07.1](#c071) (productor de composición instalada), [C08.1](#c081) (productor de ficha y EXP-04a). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-06.b | REQ-RUN-002.1, REQ-HUM-001.1, AC01-05.01, AC01-05.04, AC01-11.01, AC01-11.02, AR-15, C3, E1, E2, E3, E6, E7, EXP-01a, EXP-07, EXP-08b, RP-C01, REQ-MEM-002.5, REQ-MEM-003.4, REQ-REP-001.1, REQ-REP-001.2, REQ-INT-001.1, REQ-INT-001.4, AC01-17.02, AC01-18.01, AC01-18.02, C5, C6, UX-P01 G1 · [C01.1](#c011) (consumidor del tarball y productor del cotejo C5 instalado), [C02.1](#c021) (productor de comprobación de vigencia y autoridad), [C03.1](#c031) (productor de EXP-01a instalado), [C03.3](#c033) (productor de continuidad instalada), [C04.1–.4](#c0414) (productor de registro por HOST instalado), [C05.1](#c051) (productor de cotejo instalado E1), [C05.2](#c052) (productor de cotejo del escritor, visor y mantenimiento), [C05.3](#c053) (productor de paridad instalada), [C05.4](#c054) (productor de evidencia de rutas humanas), [C05.5](#c055) (productor de cotejo de intercambio y CSV), [C05.6](#c056) (productor de observación CI), [C05.7](#c057) (productor de cotejo de contratos externos), [C07.1](#c071) (productor de verificación instalada por variante), [C08.1](#c081) (productor de verificación de la vertical), [C09.1](#c091) (productor de la prueba instalada del recorrido canónico). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G1-07.a | Adjudicación de G1 y matriz vertical, RP-C01, adjudicación de identidad, AC01-11.01, AC01-11.02, AC01-17.02, AC01-18.01, AC01-18.02, C5, C6, E1, E2, E7, EXP-04a, EXP-08b, UX-P01, UX-P05, UX-P06 G1 · [C01.1](#c011) (adjudica C5 G1 por variante), [C02.1](#c021) (adjudica identidad y vigencia en G1), [C03.1](#c031) (adjudica EXP-01a instalado), [C03.3](#c033) (adjudica continuidad G1), [C04.1–.4](#c0414) (adjudica registro por HOST en G1), [C05.1](#c051) (adjudica E1 instalado), [C05.2](#c052) (adjudica escritor y rutas ordinarias), [C05.3](#c053) (adjudica paridad E7 G1), [C05.4](#c054) (adjudica rutas humanas G1), [C05.5](#c055) (adjudica intercambio), [C05.6](#c056) (adjudica CI/AR-52), [C05.7](#c057) (adjudica contratos externos E1), [C08.1](#c081) (adjudica EXP-04a y vertical), [C09.1](#c091) (adjudica el recorrido instalado). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g1--vertical-instalada). |
| G2-01.a | REQ-DIS-001.1, REQ-DIS-001.2, REQ-DIS-001.3, REQ-DIS-001.4, REQ-DIS-001.7, REQ-DIS-001.8, REQ-SEG-002.2, REQ-RUN-002.1, AC01-16.04, AR-47, AR-16, AR-36, TEC-06, D15, E4, EXP-02, XET-05, AR-45 G2 · [C05.8](#c058) (productor EXP-02 y señales efectivas). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g2--discovery-y-fuentes). |
| G2-01.b | REQ-DIS-001.5, REQ-DIS-001.6, REQ-XINST-001, AC01-22.03, UX-P03 |
| G2-02.a | REQ-DOC-001.1, REQ-DOC-001.2, REQ-AUTREP-001, AR-13, AR-20, TEC-10, D10, D11, C4, E4, EXP-06b |
| G2-03.a | REQ-MEM-001.2, REQ-MEM-001.4, REQ-MEM-003.1, REQ-MEM-003.2, REQ-MEM-003.5, POL-RET-001, REQ-OPT-002, AC01-13.02, AC01-16.01, AR-25, TEC-05, XET-08, D05, D19, DE-01 A, C2 |
| G2-03.b | REQ-DIS-001.6, UX-P02 |
| G2-03.c | REQ-MEM-002.5, REQ-MEM-003.4, REQ-DOC-001.3, REQ-DOC-001.4, AC01-11.01, AC01-11.02, AR-46, D10 |
| G2-04.a | REQ-CAS-001.2, REQ-STR-001.1, REQ-STR-001.2, REQ-CAS-002.3, REQ-DAT-002.1, AC01-01.01, AC01-01.02, AC01-01.03, AC01-02.01, AC01-02.02, AC01-12.03, AC01-15.01, AC01-15.02, AC01-19.01, AC01-20.01, AC01-20.03, AC-DE-02 A |
| G2-04.b | REQ-CAS-001.3, REQ-CAS-001.4, REQ-CAS-001.5, REQ-CAM-001.5, REQ-REG-001.3, REQ-CAS-002.1, REQ-CAS-002.2, REQ-CAM-002.1, AC01-04.01, AC01-04.02, AC01-08.01, AC01-09.01, AC01-16.05 |
| G2-05.a | E4, XET-05, EXP-02 G2 · [C05.8](#c058) (adjudica controles por motor G2). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g2--discovery-y-fuentes). |
| G3-01.a | REQ-PLN-001.4, REQ-RUN-001.1, REQ-DAT-001.1, REQ-DAT-001.2, REQ-DAT-001.3, REQ-INT-001.4, REQ-XINST-001, REQ-QA-002, REQ-E2E-001, UTCP/OpenAPI, AC01-15.01, AC01-20.01, AC01-21.01, AC01-23.01, AR-43, AR-48, D06, D07, D08, C6, E5, EXP-05b |
| G3-01.b | REQ-ORA-001.6, REQ-DAT-001.4, REQ-DAT-002.2, AC01-10.01, AC01-16.04, AC01-20.03, AC01-21.02, AC01-21.03, AC01-22.01, AC01-22.02, AR-10, XET-11, AC-DE-06 A, E5, EXP-05b |
| G3-01.c | REQ-PLN-001.4, REQ-CAM-001.1, REQ-E2E-001, UTCP/OpenAPI, REQ-HUM-001.3, REQ-CAS-002.3, AC01-07.01, AC01-08.01, AC01-15.02, AC01-21.01, AR-43, D06, D08, UX-P04 |
| G3-01.d | REQ-DIS-001.5, REQ-CAS-001.4, REQ-DAT-001.3, REQ-XINST-001, AC01-16.01, AC01-22.03, AR-18, D09, AC-DE-06 A, UX-P03 |
| G3-02.a | REQ-CAS-001.2, REQ-ORA-001.1, REQ-ORA-001.2, REQ-ORA-001.3, REQ-ORA-001.4, REQ-ORA-001.5, REQ-ORA-001.7, REQ-RUN-001.3, REQ-E2E-001, REQ-DAT-002.1, AC01-06.02, AC01-16.04, AC01-20.02, AR-08, AR-09, AR-43, AR-53, D06, D12, AC-DE-06 A, E5, EXP-05b, UX-P04, AR-45 G3 · [C05.8](#c058) (productor de oráculo regional E5). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G3-02.b | REQ-AUTREP-001, AR-20, AR-38, TEC-11, XET-09, D11, C4, E5, EXP-06b |
| G3-03.a | REQ-RUN-001.5, REQ-OPT-001, AC01-16.06, AR-29, TEC-07, XET-15, D16, E3, EXP-03 G3 · [C08.1](#c081) (productor de presión EXP-03). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G3-04.a | REQ-RUN-001.6, REQ-REP-001.1, REQ-SEG-001.3, REQ-SEG-002.3, POL-CAP-001, M2, M3, M4, AC01-05.04, AC01-06.02, AC01-10.02, AR-24, AR-27, AR-32, AR-39, TEC-14, XET-06, D18, D20, DE-02 B, C1, E6, EXP-06c |
| G3-04.b | REQ-SEG-002.3, POL-CAP-001, POL-RET-001, XET-07, D19, DE-01 A, C1, EXP-03, EXP-06c G3 · [C08.1](#c081) (consumidor de presión y productor de medición integrada). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G3-05.a | REQ-REP-001.1, REQ-REP-001.2, M1, REQ-STR-001.3, REQ-REP-002.1, REQ-REP-002.2, REQ-REP-002.5, AC01-03.01, AC01-12.02, AC01-12.03, AC01-12.04, AC01-12.05, AC01-12.06, AC01-12.07, AC01-12.08, AC01-16.06, AR-50, TEC-12, AC-DE-03 B, AC-DE-07 A, C4, E6, consulta, publicación y renderizado Q/P/R, REQ-REP-002.3, REQ-REP-002.4 G3 · [C05.8](#c058) (productor de consulta, publicación y render Q/P/R por separado). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G3-05.b | REQ-MEM-003.3, REQ-CAM-001.5, REQ-REP-001.2, REQ-REP-001.3, REQ-REP-001.4, REQ-REG-001.2, REQ-HUM-001.1, REQ-REP-002.3, REQ-REP-002.4, AC01-03.02, AC01-13.01, AC01-13.02, AC01-14.01, AC01-14.02, AC01-14.03, AC-DE-03 B, UX-P01, UX-P05 |
| G3-05.c | REQ-QA-004.1, AC01-18.01, AC01-18.02, AC01-24.01, XET-12, AC-DE-04 A, REQ-SEG-001.1, REQ-SEG-002.2, REQ-INT-001.4, E5, E6 G3 · [C05.7](#c057) (productor de ingesta integrada y calificación condicionada). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G3-06.a | REQ-QA-004.2, REQ-DAT-002.1, AC01-19.01, AC01-19.02, AC01-19.03, AC01-19.04, AC01-19.05, AC01-19.07, AC-DE-05 A |
| G3-06.b | REQ-QA-001, REQ-QA-003, REQ-HUM-001.2, REQ-HUM-001.3, REQ-HUM-001.4, AC01-05.03, AC01-06.01, AC01-07.01, AC01-09.01, AC01-19.06, AR-35, TEC-09, D17, DE-05 B, AC-DE-01 B, AC-DE-05 A, C3, E3, E6, EXP-08c, UX-P04, UX-P06, UX-P01 G3 · [C05.4](#c054) (productor de extensión EXP-08c). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G3-07.a | E5, EXP-05b, AC01-12.04, AC01-12.05, AC01-12.06, AC01-12.07, AC01-12.08, AC01-18.01, AC01-18.02, E6 G3 · [C05.4](#c054) (adjudica extensión G3), [C05.7](#c057) (adjudica integración G3), [C05.8](#c058) (adjudica oráculo regional y Q/P/R), [C08.1](#c081) (adjudica presión G3). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g3--efecto-investigación-y-evidencia). |
| G4-01.a | REQ-IA-001.6, REQ-PLN-001.1, REQ-PLN-001.3, REQ-PLN-001.4, REQ-PLN-001.6, REQ-CAS-001.1, REQ-CAM-001.1, REQ-CAM-001.2, REQ-CAM-001.3, REQ-CAM-001.5, REQ-CAS-002.3, AC01-02.01, AC01-02.02, AC01-04.01, AC01-04.02, AC01-15.01, AC01-15.02, AC01-16.03, AR-05, AR-11, AR-43, D01, D04, AC-DE-02 A, AC-DE-04 A, E4, UX-P01, AR-45 G4 · [C05.8](#c058) (consumidor de salidas G2/G3 y productor del contexto congelado). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g4--planificación-operativa-y-continuidad). |
| G4-01.b | REQ-DIS-001.6, REQ-PLN-001.2, REQ-PLN-001.3, REQ-REG-001.1, AC01-01.03, AC01-16.02, UX-P02 |
| G4-02.a | REQ-MEM-002.4, REQ-IA-001.2, REQ-IA-001.4, REQ-AGT-002, AR-10, D03, D05, AC-DE-07 A, E3, UX-P07, AR-45, E4, E5, E7 G4 · [C03.2](#c032) (productor de reingreso autorizado), [C05.8](#c058) (consumidor de contexto/oráculo y productor de replay regional). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g4--planificación-operativa-y-continuidad). |
| G4-02.b | REQ-AGT-001, REQ-AGT-001, REQ-OPT-002, AR-15, AR-49, TEC-22, D13, C6, EXP-01b, UX-P07 G4 · [C05.8](#c058) (eslabón de la ruta de replay hacia G4-03.a), [C08.2](#c082) (productor de EXP-01b G4). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g4--planificación-operativa-y-continuidad). |
| G4-03.a | E3, E4, AR-45, E5, E7 G4 · [C05.8](#c058) (adjudica replay G4), [C08.2](#c082) (consume y adjudica EXP-01b G4). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g4--planificación-operativa-y-continuidad). |
| G5-01.a | AR-33, AR-51, XET-15, RP-C02, manifiesto previo, C5 G5 · [C01.1](#c011) (productor de identidad previa), [C02.1](#c021) (productor de referencia de ancla y política previas), [C08.1](#c081) (productor de ID y manifiesto previo). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-01.b | REQ-INT-001.2, REQ-RUN-002.1, TEC-18, XET-03, XET-13, D14, D15, C5, EXP-04b, RP-C02, atestaciones por variante G5 · [C01.1](#c011) (productor de EXP-04b, atestaciones y cierre C5 por variante), [C02.1](#c021) (productor de atestación de ambos modos npm), [C06.1](#c061) (productor de evidencia de baja y recuperación), [C07.1](#c071) (productor de evidencia instalada por variante), [C08.1](#c081) (productor de evidencia de instalación G5). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-02.a | POL-RET-001, REQ-DAT-002.2, AC01-21.03, AR-41, XET-14, D02, D19, DE-01 A, C2, E2, RP-C02, ensayo ligado al candidato G5 · [C06.1](#c061) (productor de ensayo de promoción, fence y recuperación), [C08.1](#c081) (productor del ensayo G5). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-03.a | REQ-IA-001.5, REQ-ORA-001.1, REQ-SEG-001.1, REQ-SEG-002.1, REQ-INT-001.1, REQ-AGT-001, REQ-HUM-001.1, AC01-01.03, AC01-03.02, AC01-05.01, AC01-06.02, AC01-11.01, AC01-12.02, AC01-12.03, AC01-17.01, AC01-17.02, AC01-24.01, AR-15, AR-52, AR-08, TEC-21, XET-12, D12, D13, AC-DE-04 A, C6, E7, EXP-01a, EXP-01b, RP-C02, repetición ligada al candidato, REQ-MEM-002.5, REQ-MEM-003.4, REQ-REP-001.1, REQ-REP-001.2, REQ-SEG-002.2, REQ-INT-001.4, AC01-11.02, AC01-18.01, AC01-18.02, E6 G5 · [C02.1](#c021) (productor de repetición de identidad en EXP-01a), [C03.1](#c031) (productor de repetición de EXP-01a), [C03.3](#c033) (productor de repetición aplicable de continuidad), [C04.1–.4](#c0414) (productor de repetición del registro por HOST), [C05.2](#c052) (productor de repetición aplicable de las entradas), [C05.3](#c053) (productor de repetición E7), [C05.5](#c055) (productor de repetición de intercambio), [C05.6](#c056) (productor de repetición CI), [C05.7](#c057) (productor de repetición de contratos externos), [C08.1](#c081) (productor de repetición G5), [C08.2](#c082) (productor de repetición EXP-01b). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-03.b | REQ-OPT-001, M5, AC01-05.04, AC01-16.06, AR-27, AR-42, D16, DE-02 B, AC-DE-03 B, C1, C4, E2, E5, E6, E7, EXP-03, EXP-06c, EXP-08c, RP-C02, repetición Q/P/R ligada al candidato, REQ-MEM-003.4, REQ-REP-001.2, REQ-REP-002.3, REQ-REP-002.4, REQ-REP-002.5, AC01-11.02, AC01-12.04, AC01-12.05, AC01-12.06, AC01-12.07, AC01-12.08, XET-05 G5 · [C03.3](#c033) (productor de repetición aplicable de continuidad), [C05.2](#c052) (productor de repetición aplicable de las entradas), [C05.3](#c053) (productor de repetición E7), [C05.5](#c055) (productor de repetición CSV), [C05.8](#c058) (productor de repetición por motor y Q/P/R), [C08.1](#c081) (productor de repetición de presión y cleanup). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-03.c | REQ-QA-001, REQ-ONB-001, REQ-HUM-001.2, AC01-05.03, AC01-19.06, AR-45, D17, DE-05 B, AC-DE-01 B, E7, UX-P01, UX-P02, UX-P03, UX-P04, UX-P05, UX-P06, UX-P07, RP-C02, RP-C04 G5 · [C05.4](#c054) (productor de UX instalada), [C05.8](#c058) (productor de repetición de localización), [C08.1](#c081) (productor de repetición UX por identidad). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-04.a | E8 G5 · [C08.1](#c081) (productor y custodio del diseño de corpus y reserva). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-04.b | AR-44, D21, E8, RP-C02, CV08-05/CC08-03, actas G5-02.a y G5-03.a/b/c, C5, E2, UX-P01, UX-P05, UX-P06 G5 · [C01.1](#c011) (custodio de atestaciones C5), [C02.1](#c021) (custodio del cotejo de vigencia), [C03.1](#c031) (custodio de EXP-01a), [C03.3](#c033) (custodio de continuidad), [C04.1–.4](#c0414) (custodio de registro por HOST), [C05.3](#c053) (custodio de E7), [C05.6](#c056) (custodio de la repetición CI), [C05.7](#c057) (custodio de contratos por identidad), [C05.8](#c058) (custodio de repeticiones regionales y Q/P/R), [C06.1](#c061) (custodio de atestaciones y ensayo), [C08.1](#c081) (custodio del sello G5 y de sus seis entradas directas), [C08.2](#c082) (custodio de la repetición EXP-01b). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G5-05.a | D01, DE-03 B, C5, RP-C02, conciliación de identidad, AC01-11.01, AC01-11.02, AC01-12.04, AC01-12.05, AC01-12.06, AC01-12.07, AC01-12.08, AC01-17.02, AC01-18.01, AC01-18.02, C6, E7, E8, AR-45 G5 · [C01.1](#c011) (adjudica C5 e identidad instalada G5 por variante), [C02.1](#c021) (adjudica cadena verificada G5), [C03.1](#c031) (adjudica EXP-01a G5), [C03.3](#c033) (adjudica continuidad G5), [C04.1–.4](#c0414) (adjudica registro por HOST G5), [C05.3](#c053) (adjudica paridad repetida), [C05.4](#c054) (adjudica UX instalada), [C05.6](#c056) (adjudica CI/AR-52 G5), [C05.7](#c057) (adjudica conformidad externa G5), [C05.8](#c058) (adjudica repeticiones por motor, Q/P/R y localización), [C06.1](#c061) (adjudica ensayo y recuperación), [C08.1](#c081) (adjudica en el acta la identidad, sello y las tres entradas directas de validación), [C08.2](#c082) (adjudica la repetición EXP-01b G5). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#g5--distribución-corte-ensayado-y-corpus). |
| G6-01.a | REQ-AUTREP-001, REQ-E2E-001, M5, AC01-01.03, AC01-12.03, AC01-19.06, AC01-22.03, AR-08, AR-09, AR-43, AR-20, AR-06, D04, D06, D09, D11, D21, DE-03 B, DE-05 B, AC-DE-06 A, C4, E6, E8, EXP-06b, EXP-08c, UX-P03, RP-C02, CV08-05/CC08-03, acta G5-05.a |
| G6-02.a | D01, D21, DE-03 B, E8, RP-C02, acta G5-05.a |
| G65-01.a | AR-30, DE-02 B, DE-04 A, B respaldo, RP-C02, actas G5-05.a y G6-02.a |
| G65-02.a | AR-30, DE-03 B, DE-04 A, B respaldo, EXP-08c, RP-C02, acta G5-05.a y manifiesto G65-01.a |
| GA-01.a | AR-51, AR-30, DE-04 A, B respaldo, RP-C02, actas G5-05.a, G6-02.a y G65-02.a, C5 GA · [C01.1](#c011) (consumidor de digest, derechos y estado C5 de la identidad liberable), [C08.1](#c081) (consumidor de identidad aprobada, certificada y pilotada). [Entregable o acta WBS-01](wbs-reconstruccion-et.md#ga-y-corte-por-proyecto). |
| CUT-01.a | AR-41, DE-04 A, B respaldo |
