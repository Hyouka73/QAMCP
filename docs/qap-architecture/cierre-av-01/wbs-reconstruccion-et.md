# WBS-01 · Estructura de desglose del trabajo candidata

Versión 0.1. Base 03a4a4ac3e29d9d85bd0102f0b04ae0825f24b8c. [Plan](plan-maestro-reconstruccion-et.md) · [Matriz](trazabilidad-wbs-et.md). **No ejecutable.** Rangos .. significan todos los IDs intermedios; / indica paquetes de la misma fase, no alternativa. Toda adopción requiere AR-51 previo, aunque el WP de coordinación se liste después. Los responsables son roles propuestos, no disponibilidad. Esfuerzo S/M/L/XL cualitativo, no horas. Cada WP incluye entrega y criterio; se aplican íntegros protocolos, pisos, vetos y celdas fuente.

| ID | Fase | Rol propuesto | Entradas/dependencias | Entregable | Salida verificable | Esfuerzo |
|---|---|---|---|---|---|---|
| P-01 | P | Orquestador | — | Acta y base congelada | Ratificación ET y C1–C6 sin cambio normativo | S |
| P-02 | P | Orquestador + QA independiente | P-01 | Plan, WBS, revisión por obligación/celda | 188 obligaciones, 57 AR, 22 TEC y 15 XET; correcciones y acto G0 separado | XL |
| G0-01 | G0 | ET-01/06 | P-02 + permiso G0 | Baseline AR-26/57: diez paquetes, imports, lock, diagnósticos, rutas y regresiones | Baseline reproducible por paquete, deuda y AR-51 previo | L |
| G0-02 | G0 | ET-01/02/07 | G0-01 | Contratos núcleo, política, seis veredictos, cuatro ejes, AR-52, oráculo N0–N3 | E1 contractual, tabla total, no autoridad lateral | XL |
| G0-03 | G0 | ET-06/04/01 | G0-01 | AR-24/40: visor segregado y Git sin shell, ref/error tipado | Negativos confinados y remediación acreditada | L |
| G0-04 | G0 | ET-06/04 | G0-02/03 | Frontera humana, supervisor, IPC, KEK y firma por SO/CPU/GUI/CI | EXP-07/08a: positivo, replay, revocación, segundo escritor, visor | XL |
| G0-05 | G0 | ET-05/06/03 | G0-04 | Productor C/A y custodia preventiva, crash, staging, primer cuadro/byte | EXP-06a por celda; canario veta; no G1 sin salida | XL |
| G0-06 | G0 | ET-07/01/06 | G0-02/04 | MCP cuatro HOST y dos eras, ESM/CJS, runtime, caché, handoff | EXP-01a y AR-51 previo | L |
| G0-07 | G0 | ET-07/06 | G0-02/04 | UTCP/OAS por dialecto, broker destino/refs/DNS/TLS/redirect/cancel | EXP-05a, advisory y licencia | L |
| G0-08 | G0 | ET-06/01 | G0-01 | Admisibilidad previa, versiones, alternativas, identidad, MIT/ISC elevar | AR-51 y seis niveles C5; condición previa a adopciones, no tarea posterior | L |
| G0-09 | G0 | Orquestador + QA independiente | G0-02..08 | Adjudicar salida G0 | E1, AR-24/40, EXP-01a/05a/06a/07/08a; no G1 sin todas salidas | M |
| G1-01 | G1 | ET-01/02/06 | G0 cerrado | Escritor único, cola, CAS/outbox, stores y ACL; Knowledge segregado | E1/E2, dos entradas mismo fixture, sin escritura lateral | XL |
| G1-02 | G1 | ET-01/03/06 | G1-01 | Ejecutor durable y supervisor, leases/fence, pérdida HOST/ejecutor | E3 inicial: dos lotes/diez casos listos, sin reenvío incierto | XL |
| G1-03 | G1 | ET-07/01 | G1-01/02 | Entradas MCP/CLI/CI delegadas, códigos y resultado canónico | EXP-01a instalado, E1/E7, CI sin IA | L |
| G1-04 | G1 | ET-04/06 | G1-01/02 | Vertical humana sin IA/terminal, autenticación, manual/híbrida inicial | EXP-08b/07, E2, denegaciones y teclado | XL |
| G1-05 | G1 | ET-05/06 | G1-01/04 | Catálogo, evidencia inicial, publicación y lectura separada | E6 inicial/E7, sin captura no calificada | L |
| G1-06 | G1 | ET-06/03/07 | G1-02..05 | Artefacto instalado fuera monorepo, doctor, aprovisionamiento a demanda | EXP-04a, E1/E2/E3/E6/E7, AR-51 | XL |
| G1-07 | G1 | QA independiente | G1-01..06 | Adjudicar vertical | Todas salidas G1, identidad instalada y permiso posterior | M |
| G2-01 | G2 | ET-03/02 | G1 cerrado | Discovery roles/SPA/estados/tablas/filtros/transiciones, DOM/ARIA/red | EXP-02/E4, verdad independiente, cero efecto, checkpoint | XL |
| G2-02 | G2 | ET-05/06 | G1 cerrado | D10 ocho formatos, variantes Excel, OCR, pasividad, matriz D11 | EXP-06b G2 por clase, AR-20 y AR-51 | XL |
| G2-03 | G2 | ET-02/01 | G2-01/02 | Knowledge, FTS, contradicción, ACL, as-of, recuperación/poda | E2/E4, recuperación diferenciada, fixture 120d | XL |
| G2-04 | G2 | ET-04/01 | G2-01..03 | Estrategia/riesgo/cobertura, casos, biblioteca, sets, charters, asignaciones | E4 parcial, AC01, técnicas y testabilidad | XL |
| G2-05 | G2 | QA independiente | G2-01..04 | Adjudicar Discovery/ingesta | EXP-02/06b, E4 parcial, bloqueo por clase | M |
| G3-01 | G3 | ET-01/03/07 | G2 cerrado,G0-07 | DataPlan DAG fixture, RBAC, efectos, 3 módulos/2 roles, API negativos, async/lotes, referencias, unidad compuesta | EXP-05b/E5, AR-43, cleanup y testigo solapamiento | XL |
| G3-02 | G3 | ET-05/01 | G3-01,G2-02 | Oráculos, 201/rollback, D11 bytes AUT/recálculo/regla contable, seis estados, decimal | E5/EXP-06b; AR-09/20; falso PASS cero | XL |
| G3-03 | G3 | ET-03/06 | G3-01 | Presión/concurrencia, árbol completo, W=0/1/>1, admisión, aislamiento | EXP-03, E3 bajo presión, recuperación | XL |
| G3-04 | G3 | ET-05/06 | G0-05,G3-01/02 | Custodia, longitud/cierre/generación, seek/ranges, revocación, export | EXP-06c/E6, AR-27/28, cero canarios | XL |
| G3-05 | G3 | ET-05/02/04 | G3-02/04 | Reportes/defectos/recetas/métricas, dataset común, HTML/MD/CSV/JSON/JSONL/PDF/XLSX, reimportación | E6/E7 por fase, exactitud, saneamiento y autoridad | XL |
| G3-06 | G3 | ET-03/04/06 | G3-01/04 | QA no funcional acotado, dos matrices accesibilidad, manual/híbrido | EXP-08c, E5/E6, AC01-19, controles sanos/negativos | XL |
| G3-07 | G3 | QA independiente | G3-01..06 | Adjudicar efecto y evidencia | E3/E5/E6, EXP-03/05b/06b/06c/08c | M |
| G4-01 | G4 | ET-01/02/03 | G2/G3 cerrados | Compilación DAG, campañas, elegibilidad, regresión, drift, reutilización, autonomía HOST/DETERMINISTIC | E3/E4, no aprobación ordinaria, MANAGED diferido | XL |
| G4-02 | G4 | ET-07/01 | G4-01 | Adopción HOST, Skill/hook, handoff, tokens, locale y códigos | EXP-01b, E3/E4, medir no estimar como hecho | L |
| G4-03 | G4 | QA independiente | G4-01/02 | Adjudicar autonomía | E3/E4, EXP-01b, DE-03 | M |
| G5-01 | G5 | ET-06/01/03/07 | G1–G4 cerrados | Distribución por variante, SBOM/licencia, offline/proxy/CA, soporte, doctor y rollback | EXP-04b, AR-51 final, seis niveles, no compra obligatoria | XL |
| G5-02 | G5 | ET-02/01/06 | G5-01 | Migración sombra, backup generacional stores/medios, fence DB/dispatch legacy, revocación y restore | E2 y corte ensayado; AR-41 real separado | XL |
| G5-03 | G5 | ET-07/03/05/04/06 | G5-01/02 | Repeticiones instaladas EXP-01a/b/03/06c/08c, E2/E5/E6/E7, CI, accesibilidad y publicación | 100% conformidad aplicable y cero vetos por variante | XL |
| G5-04 | G5 | Custodio independiente + QA | Preparación lógica antes de cierre G5 | Corpus ciego, reserva, muestra, estratos y criterios, congelar candidato | Sin exposición previa, método y verdad congelados | L |
| G5-05 | G5 | Orquestador + QA independiente | G5-02..04 | Adjudicar distribución | Todas salidas G5, custodia independiente, no corte real | M |
| G6-01 | G6 | Custodio + QA independiente | G5 cerrado + permiso | E8: E1–E7 aplicables, V-01..16 vigentes, D11, E6 y corpus independiente | DE-03 por app/estrato; cero vetos y sin rescate retrospectivo | XL |
| G6-02 | G6 | Orquestador + QA independiente | G6-01 | Adjudicar, remediar y reevaluar | Nuevo holdout si aplica; incidentes no borrados | L |
| G65-01 | G6.5 | Propietario/organización + QA | G6 cerrado + permisos específicos | Manifiesto de destino representativo y grants, DE-04 A/B | AR-30 si falta destino/permiso; no corte real | L |
| G65-02 | G6.5 | QA independiente + negocio/datos/seguridad | G65-01 | Piloto, testigos, reportes, referencias, restauración/conciliación | 100% manifiesto y cero vetos/residuos desconocidos | XL |
| GA-01 | GA | Propietario + Orquestador | G65-02 aceptado | Acto de lanzamiento, licencia propia/terceros, soporte, alcance | Acto separado, cero vetos, AR-30 | M |
| CUT-01 | Después G6.5 | Propietario/organización + ET-02/06 | G65-02,G5-02 + permiso | Corte real AR-41 si aplica, manifiesto, fence y recuperación | Autorización específica, no doble escritor, no prerrequisito piloto | L |

## Ficha de subtarea a completar en revisión
ID, responsable ejecutor/revisor, fuente exacta y obligación/celda, entradas, cambios permitidos/excluidos, conservar/adaptar/sustituir, control positivo/negativo, oráculo, EXP/E, evidencia y variante, costo y reserva, respaldo y disparador, riesgo/veto, estado y decisión. Partir XL en unidades revisables con criterio individual. No se autoriza ejecución ni se afirma cobertura semántica por presencia de ID. La asignación inicial por especialidad se complementa con salidas normativas exactas en trazabilidad; revisión debe especificar WP/subtarea por obligación y celda antes de aprobación. Todos los paquetes operativos no autorizados.
