# PM-01 · Plan maestro de reconstrucción selectiva de QAP

Versión 0.1 · candidato para revisión independiente, **no ejecutable**. Base técnica y ET corregida 03a4a4ac3e29d9d85bd0102f0b04ae0825f24b8c; ratificación f6a476742486afa2ee1b622210a9e7442baa9014. [Acta](acta-cierre-tecnologico.md). [WBS](wbs-reconstruccion-et.md) · [Trazabilidad](trazabilidad-wbs-et.md).

## 1. Objetivo y límites
Producto local autónomo y profesional v1: HOST + DETERMINISTIC, operación humana integral sin IA ni terminal, MCP/CLI/CI sin autoridad lateral; Discovery, memoria, planeación, campañas, casos, datos, ejecución, evidencias, documentos/reportes, regresión y defectos. QA autorizado con efectos por operación; producción/referencia lectura acreditada por efecto. Diferidos MANAGED, SaaS, colaboración centralizada concurrente, motores universales de carga/escaneo/APM, automatización de escrituras externas y flujo especializado IA sin MCP. Mantener puertos futuros sin convertirlos en obligaciones de lanzamiento.

Precedencia: [manifiesto normativo](manifiesto-normativo-consolidado.md), [AC-01](manifiesto-ac01.md), [DE](acta-ratificacion-de.md), [AC-DE](acta-ratificacion-ac01.md), [AV-08](enmiendas-av08.md), [DAG AV-07](compuertas-av07.md), [ET](integracion-tecnologica-et.md), [reservas](reservas-calificacion-et.md). El plan histórico E1–E8 conserva alcance compatible. No reemplazar fichas por resúmenes. Conflicto material se eleva; no reducir garantías. Preservar 123 entradas, 65 cláusulas, 57 AR, 22 TEC, 15 XET, D01–D21, C1–C6 y todas las decisiones. Autorización actual solo documental.

## 2. Arquitectura objetivo y reconstrucción
Dominio puro y contratos versionados (identidad, alcance, política, seis veredictos, cuatro ejes, AR-52, intenciones, efectos, limpieza); casos de uso mediante puertos; autoridad durable y escritor único con transacciones, outbox, CAS, generaciones, grants y cola; repositorio de Knowledge separado física/lógicamente de sesión/caché, ACL previa a búsqueda/ranking/estadísticas, consultas as-of; custodio separado; supervisor y composición por SO. Clientes UI, MCP, CLI, CI delegan; visor lectura independiente. No import inverso de dominio hacia adaptadores ni juicio funcional a partir de acción/HTTP. Candidatos lógicos no implican partición de paquetes irreversible.

| Base | Conservar/adaptar/sustituir, sujeto a inventario G0 |
|---|---|
| shared/engine | Conservar DTO, validación y puertos útiles, adaptar planner a snapshots, separar política e IO. |
| knowledge | Reusar hash, ciclos, guard CAS y adaptador SQLite candidato; repositorio autoritativo; archivos solo import/export. |
| git-adapter | Remediar AR-40 con argumentos sin shell, ref verificada, error explícito. |
| auth | Perfiles y handoff opacos; sustituir keytar y canales directos por broker KEK, sin fallback anónimo. |
| playwright-adapter/runner | Reusar señales, acciones y ciclo; adaptar a Discovery híbrido y continuidad; retirar escrituras provisionales y juicio HTTP. |
| reporter | Conservar proyecciones útiles; reemplazar escritor SQLite y servidor sin frontera por catálogo/custodio/visor separado. |
| mcp/cli | Extraer casos de uso; transporte/delegación común y códigos; bloquear escritores legacy al sustituir. |
| build/auxiliares | Inventariar diez paquetes actuales, entradas dinámicas, huella y activos; retirar bypass; preservar regresiones sin crédito histórico automático. |

Aplicar [matriz de reconstrucción AV-07](matriz-reconstruccion-av07.md) como antecedente; no cherry-pick automático ni estimar por LOC. Inventario actual y propiedad acreditada deciden conservación.

## 3. Candidatos y admisibilidad
P: TS/Node LTS, SQLite/FTS5, Playwright, React web local, lectores pasivos/OCR, PDFKit/ExcelJS, decimal exacto, supervisor nativo, MCP dual-era, UTCP/OpenAPI gobernados. C1: Tink Java principal, C++ ante impedimento Java/JRE, age Go ante impedimento formato; todos condicionados. R según [22 TEC](registro-candidatos-et.md), nunca por conveniencia: demostrar impedimento, variante, contrato, costo, licencia, evidencia y regresión descendiente; .NET supone reconsideración integral, Electron/Tauri no prueban frontera, Node alternativo no resuelve SQLite común. AR-51 admisibilidad antes de adoptar en G0–G2 y cualquier alta posterior, verificación final G5. MIT/ISC pendiente. No seleccionar irreversible ni prometer consumo no medido.

## 4. Compuertas y camino de entrega
| Nodo | Salida obligatoria |
|---|---|
| P | Plan/WBS revisados y ratificados; permiso separado G0. |
| G0 | Baseline AR-26/57, remediación AR-24/40, E1 contractual, EXP-01a/05a/06a/07/08a y admisibilidad. EXP-06a y EXP-08a preceden G1. |
| G1 | Vertical instalada, EXP-04a/01a/07/08b, E1/E2/E3/E6 inicial/E7; dos entradas, autoridad única. |
| G2 | EXP-02/06b y E4 parcial, Discovery e ingesta por clase; AR-20 conserva bloqueo. |
| G3 | E5/E6/E3 bajo presión, EXP-03/05b/06b/06c/08c; DAG fixture congelado sin depender de G4. |
| G4 | Planner y campaña, E3/E4, EXP-01b; señales G2 y efectos G3 acreditados. |
| G5 | EXP-04b, repeticiones instaladas EXP-01a/b/03/06c/08c aplicables, E2/E5/E6/E7, licencias, ensayo de corte. |
| G6 | E8 ciego independiente, E1–E7 aplicables, pisos y vetos. |
| G6.5 | Piloto representativo con autorización específica, manifiesto y conciliación/restauración. AR-30 bloquea GA sin salida. |
| GA | Acto separado, soporte, licencias, conformidad y cero vetos. |

P→G0→G1→G2→G3→G4→G5→G6→G6.5→GA es precedencia de salida; tareas de diseño pueden ordenarse en paralelo según entradas sin abrir fases. Corte real AR-41 separado tras G6.5 y permiso de proyecto; piloto no depende del corte. Si falla celda obligatoria, bloquear, calificar respaldo con mismo contrato o elevar propietario. No confundir calificación preliminar, integración, certificación, activación.

## 5. Aceptación y método de evidencia
Aplicar DE-03/CV08/CC08 íntegros: 100% conformidad instalada; precisión Discovery >=95%, recall >=85% por app/estrato; efectos y casos compuestos >=85%; defectos desconocidos >=90%, críticos 100%; E2E normativos 100%; falso PASS 0, falso FAIL <=2% global/estratos y cero determinista normativo; abstención/bloqueo injustificados y unión incumplimientos <=5% bajo denominadores vinculantes; denegaciones legítimas, MCP normativo, paridad y autonomía 100%; adopción inicial/final >=90% por HOST; violaciones autoridad/custodia 0; piloto 100% y cero vetos. Eficiencia medida en perfil absoluto y comparación pareada competente. No compensar veto con promedio, no usar 80/75 históricos. Cuatro apps independientes preferidas, tres solo con suficiencia aprobada; custodio independiente antes de cerrar G5; corpus/reserva, identidad, denominadores, reglas y verdad congelados antes de exposición, no optimizar holdout.

Cada expediente futuro por unidad: ID obligación/celda, SHA/build/digest, SO/CPU/runtime/launcher, actor/grant, fixture/oráculo independiente, sano y negativo/mutante, política/revisión, resultado, evidencia autorizada, cobertura, costos, límites y adjudicador. Seis niveles C5. CI exige sobre terminal verificado, código AR-52 0, PASS funcional, obligaciones satisfechas, sin veto, cleanup ni evidencia obligatoria faltante. JUnit derivado separa QAP_CANONICAL_GATE. Hash/firma/HTTP/screenshot aislado no prueban afirmación. Cambios de identidad, política, permiso, componente o evidencia reabren celdas y descendientes; holdout nuevo cuando corresponda.

## 6. Seguridad, memoria, migración
C3: principales reales por SO, IPC, presencia humana, broker/visor, firma, KEK, ACL y archivos; loopback/cuenta compartida insuficientes. EXP-07, EXP-08a/b/c. Cuatro grants captura/acceso/conservación/exportación, privado hasta 30 días renovable/revocable según DE-02; export privada excepcional. C1: autenticación de longitud/cierre/generación antes de rango, primer cuadro/primera escritura protegidos, temporales, crash; canario veto aunque eliminado, supresión no acredita captura. DE-01 A: detalle 90 días, resumen permanente hasta eliminación expresa, activos protegidos según grant, medios y excepciones según acta; fixture 120 días no política. Poda reproducible, revocación sin resurrección, backups coordinados por generación stores/medios, sombra, fence DB y dispatch, rollback solo sin restaurar autoridad; recuperar hacia delante si necesario. G5 ensayo, corte separado. Ningún dato empresarial ni credencial en fixtures.

## 7. Gobierno, recursos y planificación económica
Propietario decide alcance/garantías/riesgo/licencia/actos; Orquestador coordina y adjudica; Codex ejecutor/committer futuro, especialistas ET como dueños técnicos lógicos, QA independiente revisa, custodio ciego separado, responsables negocio/datos/seguridad del destino en piloto. Asignaciones no implican disponibilidad ni autorización actual. Una unidad de ejecución activa sobre cada frontera; commits documentados y pequeños en develop, sin ramas ni worktrees nuevos, main/tags intactos. Ejecutor no se autoaprueba. Esfuerzo S/M/L/XL cualitativo, no calendario ni costo inventado. Antes de autorizar cada fase fijar disponibilidad, capacidad, presupuesto tokens/CPU/RSS/IO/disco, contingencia, límite de iteraciones, fixture permitido y criterio de detención. G0 baseline, G3/G5 mediciones; actualizar estimaciones por variante. Minimizar contexto mediante fuentes versionadas y encargos acotados. No repetir siete ET ni introducir suscripción obligatoria.

## 8. Riesgos y cambios
| Riesgo | Mitigación | Detención |
|---|---|---|
| Falso PASS, escritura lateral | E1/E2/E5/E7, veracidad, autoridad durable | Cualquier veto o segundo escritor |
| Captura/secretos | C1/C3, EXP-06a/07/08a, fronteras SO | Canario, fuga, falta celda obligatoria |
| Excel | D10/D11 por clase y testigo; separar tres planos | AR-20 sin ruta suficiente |
| Compatibilidad y licencias | Seis niveles, EXP-01a/04, AR-51 | Celda obligatoria o licencia no admisible |
| Recursos | EXP-03, reserva cleanup, W=0/1/>1 según evidencia | Reserva insuficiente, suspender admisión |
| Ciego | Custodio, congelación, controles sanos/mutantes | Contaminación; no rescate retrospectivo |
| Piloto y corte | AR-30/41, permisos y conciliación | Sin destino/permiso, residuo desconocido |

Cambio: fuente, impacto D/REQ/AC/AR/TEC/XET/celda, alternativas, costo/riesgo, decisión expresa cuando aplique y regresión. WP: no iniciado/autorizado/en curso/evidencia pendiente/bloqueado/verificado independiente/aceptado. Estado WP no modifica AR. No cerrar fase por porcentaje de tareas.

## 9. Siguiente acto
Revisión independiente focalizada de plan y WBS, completar asignación semántica por obligación y subtarea, variantes, esfuerzo y dependencias; corregir y ratificar. Luego permiso específico G0 con presupuesto, alcance y límites. Hasta entonces ningún WP operativo autorizado. No fecha GA comprometida.
