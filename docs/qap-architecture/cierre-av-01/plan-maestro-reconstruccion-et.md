# PM-01 · Plan maestro de reconstrucción selectiva de QAP

Versión 1.0 · cierre documental para revisión y ratificación. Base tecnológica corregida `03a4a4ac3e29d9d85bd0102f0b04ae0825f24b8c`, ratificación `f6a476742486afa2ee1b622210a9e7442baa9014`, plan candidato `d053abc8839e6447ff68a104d025bfa31e7d73a4` y expediente UX aceptado para planificación `8f41c3c232c3b0838fd573694150ffe42649e6d1`. [Acta](acta-cierre-tecnologico.md) · [WBS](wbs-reconstruccion-et.md) · [Trazabilidad](trazabilidad-wbs-et.md) · [Dictamen](dictamen-plan-wbs.md).

## 1. Objetivo y límites
QAP v1 es un producto local profesional de caja negra distribuido exclusivamente mediante NPM. HOST + DETERMINISTIC, operación humana gráfica integral sin terminal, código ni IA obligatoria y MCP/CLI/CI delegan en la única autoridad. La operación incluye gestión de proyectos, pruebas, campañas y reportes desde el contexto autorizado de proyecto, con o sin expediente de investigación. Incluye Discovery, memoria, estrategia, casos, datos, ejecución, comparación de configuraciones, evidencias, publicaciones, regresión y defectos. QA admite efectos por operación autorizada. Producción y referencia conservan lectura acreditada por efecto. El código del AUT nunca es precondición. Código de pruebas preparado fuera de la GUI puede consumirse por los contratos gobernados.

| Clasificación | Aplicación práctica |
| --- | --- |
| Ratificado, con validación pendiente | D01–D21, DE/AC-DE, decisiones tecnológicas candidatas C1–C6, cláusulas y celdas vigentes. Operación profesional, E2E/UTCP/OAS autorizados, comparación de configuraciones, fuentes pasivas, accesibilidad, publicación, continuidad y autoridad única. |
| Representación y refinamiento planificados | Mesa visual junto a operación general, mapa progresivo a escala, catálogo completo dentro de fuentes autorizadas y su diff, flujo visual tipado, matrices, forense, ayuda contextual, navegación accesible y métricas deterministas. Validación UX y de rendimiento en paquete instalado. La [base UX](../diseno-ux/README.md) orienta la composición, los estados y los recorridos. |
| Reservado o diferido según fuente | Resolución universal de configuración, inspección general del código AUT, motor gráfico programable, demo AUT distribuida, observabilidad continua, agente embebido, MANAGED, SaaS/servidor colaborativo, persistencia compartida multiusuario, motores universales de carga/escaneo/APM, escrituras externas automáticas, adaptadores especializados fuera de lo ratificado y flujo especializado IA sin MCP. Puertos o ingesta pasiva permanecen donde el contrato los exige. Materializar una ampliación requiere decisión expresa. |

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
| G1 | Vertical instalada, EXP-04a/01a/07/08b, E1/E2/E3/E6 inicial/E7; primera vertical gráfica y al menos dos entradas sobre el mismo fixture. |
| G2 | EXP-02/06b y E4 parcial, Discovery e ingesta por clase; AR-20 conserva bloqueo. |
| G3 | E5/E6/E3 bajo presión, EXP-03/05b/06b/06c/08c; DAG fixture congelado sin depender de G4. |
| G4 | Planner y campaña, E3/E4, EXP-01b; señales G2 y efectos G3 acreditados. |
| G5 | EXP-04b, repeticiones instaladas EXP-01a/b/03/06c/08c aplicables, E2/E5/E6/E7, licencias, ensayo de corte. |
| G6 | E8 ciego independiente, E1–E7 aplicables, pisos y vetos. |
| G6.5 | Piloto representativo con autorización específica, manifiesto y conciliación/restauración. AR-30 bloquea GA sin salida. |
| GA | Acto separado, soporte, licencias, conformidad y cero vetos. |

P→G0→G1→G2→G3→G4→G5→G6→G6.5→GA es precedencia de salida; tareas de diseño pueden ordenarse en paralelo según entradas sin abrir fases. Corte real AR-41 separado tras G6.5 y permiso de proyecto. El piloto y el acto de lanzamiento tienen sus propias entradas. Si falla celda obligatoria, bloquear, calificar respaldo con mismo contrato o elevar propietario. No confundir calificación preliminar, integración, certificación, activación.

## 5. Aceptación y método de evidencia
Aplicar DE-03/CV08/CC08 íntegros: 100% conformidad instalada; precisión Discovery >=95%, recall >=85% por app/estrato; efectos y casos compuestos >=85%; defectos desconocidos >=90%, críticos 100%; E2E normativos 100%; falso PASS 0, falso FAIL <=2% global/estratos y cero determinista normativo; abstención/bloqueo injustificados y unión incumplimientos <=5% bajo denominadores vinculantes; denegaciones legítimas, MCP normativo, paridad y autonomía 100%; adopción inicial/final >=90% por HOST; violaciones autoridad/custodia 0; piloto 100% y cero vetos. Eficiencia medida en perfil absoluto y comparación pareada competente. No compensar veto con promedio, no usar 80/75 históricos. Cuatro apps independientes preferidas, tres solo con suficiencia aprobada; custodio independiente antes de cerrar G5; corpus/reserva, identidad, denominadores, reglas y verdad congelados antes de exposición, no optimizar holdout.

Cada expediente futuro por unidad: ID obligación/celda, SHA/build/digest, SO/CPU/runtime/launcher, actor/grant, fixture/oráculo independiente, sano y negativo/mutante, política/revisión, resultado, evidencia autorizada, cobertura, costos, límites y adjudicador. Seis niveles C5 según el [registro de artefactos](registro-candidatos-et.md#evidencia-por-artefacto-y-variante). La matriz de [familias probatorias](trazabilidad-wbs-et.md#materialización-de-pruebas-y-variantes) incorpora CC08-01 a la ficha de ejecución. Protocolo y criterios UX instalados en [aceptación UX](aceptacion-ux-plan.md), con prueba humana y técnica diferenciadas. CI exige sobre terminal verificado, código AR-52 0, PASS funcional, obligaciones satisfechas, sin veto, cleanup ni evidencia obligatoria faltante. JUnit derivado separa QAP_CANONICAL_GATE. Hash/firma/HTTP/screenshot aislado no prueban afirmación. Cambios de identidad, política, permiso, componente o evidencia reabren celdas y descendientes; holdout nuevo cuando corresponda.

## 6. Seguridad, memoria, migración
C3: principales reales por SO, IPC, presencia humana, broker/visor, firma, KEK, ACL y archivos; loopback/cuenta compartida insuficientes. EXP-07, EXP-08a/b/c. Cuatro grants captura/acceso/conservación/exportación, privado hasta 30 días renovable/revocable según DE-02; export privada excepcional. C1: autenticación de longitud/cierre/generación antes de rango, primer cuadro/primera escritura protegidos, temporales, crash; canario veto aunque eliminado, supresión no acredita captura. DE-01 A: detalle 90 días, resumen permanente hasta eliminación expresa, activos protegidos según grant, medios y excepciones según acta; fixture 120 días no política. Poda reproducible, revocación sin resurrección, backups coordinados por generación stores/medios, sombra, fence DB y dispatch, rollback solo sin restaurar autoridad; recuperar hacia delante si necesario. G5 ensayo, corte separado. Ningún dato empresarial ni credencial en fixtures.

## 7. Gobierno, secuenciación y recursos

**Responsables.** El propietario decide alcance, garantías, riesgo material, licencia propia y los actos que le corresponden. El Orquestador coordina autorizaciones, resuelve dependencias y presenta los expedientes de decisión. Los roles ET/UX son dueños técnicos lógicos, no compromiso de disponibilidad. QA independiente adjudica y el custodio ciego se mantiene separado del equipo de construcción. Negocio, datos y seguridad del destino acreditan autoridad y hechos del piloto. En develop, coordinar escrituras por frontera y revisar deltas pequeños sobre un checkout existente. Los roles lógicos no ordenan crear ramas o worktrees.

| Incremento planificable | Trabajo paralelo seguro, cuando se autorice | Punto de integración |
| --- | --- | --- |
| G0 · contrato y candidatos | Inventario y contrato; positivo/negativo de Git; con identidad y admisibilidad, laboratorio autorizado de fronteras, captura, MCP y UTCP; diseño documental de casos UX y corpus segregado | G0-09.a adjudica E1 y todos los prerrequisitos. No depende de vertical instalada |
| G1 · vertical | Con escritor y DTO estables, GUI y entradas MCP/CLI/CI avanzan junto al supervisor y proyección histórica; diseño visual y ayuda reutilizan el mismo sistema | Un artefacto NPM y una matriz de identidad para G1-06/07 |
| G2 · fuentes | Discovery e ingesta en carriles separados; una vez disponible el puerto, preparar datos ficticios y alternativas textuales sin consumir información oculta | Knowledge concilia fuentes; el mapa no espera por un motor universal. G2-05.a adjudica |
| G3 · efectos | Con el DAG fixture, integrar flujo, catálogos, testigos y presión por artefactos. Custodia y reportes consumen evidencia tipada; el circuito GUI reutiliza política, DTO y registros | G3-07.a exige E3/E5/E6 y todas las salidas EXP aplicables |
| G4 · planificación y continuidad | Planner sobre señales G2 y efectos G3; tablero/impacto y ensayos de adopción pueden avanzar en paralelo con una compilación aceptada | G4-03.a adjudica autonomía, continuidad y selección explicable |
| G5 · paquete y preparación ciega | Corpus privado se diseña con anticipación sin acceso del constructor. En paquete candidato, UX puede evaluarse en paralelo al ensayo de corte. Repeticiones instaladas comparten fixtures/coste medido y se separan si compiten por hardware o contaminan resultados | G5-04.b congela candidato y protocolo antes de exposición. G5-05.a exige todas las salidas |
| G6, G6.5 y entrega | Trabajo técnico fuera del circuito ciego no obtiene el holdout. Revisión de evidencia, disponibilidad de soporte y documentación de permisos pueden prepararse con sus límites | E8, piloto y acto GA secuenciados. Corte real por proyecto tiene permiso propio |

**Preparación de una tanda.** Con la WBS, seleccionar subtareas desbloqueadas y anotar capacidad disponible, nivel de incertidumbre, inventario de celdas, artefacto común, puntos de comprobación y salidas. Estimar tras inventario y línea base por variante con observaciones de paquetes equivalentes y supuestos declarados. Separar tiempo de espera de tiempo activo, reserva y repetición. Registrar intervalos y límites acordados cuando exista soporte para calcularlos. No se fijan horas, precios, disponibilidad, cifras de hardware ni fecha GA en este cierre.

**Presupuesto y reutilización.** Antes de ejecutar, fijar límite de iteraciones, CPU/RSS/IO/disco/tiempo, presupuesto de inferencia y reserva para cleanup. Cerrar admisión si la reserva no alcanza. Reutilizar DTO, políticas, dominio, fixtures funcionales autorizados, catálogo, adaptadores calificados y resultados por identidad exacta. Mantener separados resultados UX, custodia, efectos y corpus ciego. Usar bootstrap, provisionamiento bajo demanda y snapshots compactos. Reducir tokens con consultas tipadas, deltas, IDs y referencias SHA, paginación y omisiones explícitas. Medir por HOST/tokenizer y separar metadatos estimados de tokens observados. EXP-03/04/01b y las pruebas UX instaladas fijan resultados solo cuando se ejecuten.

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

## 9. Revisión, ratificación y autorización

El [dictamen de consistencia](dictamen-plan-wbs.md) registra hallazgos, correcciones, reservas y evidencias documentales. La publicación entrega PM-01, WBS-01 y la trazabilidad para revisión y decisión sobre el plan. La ratificación es separada de cualquier permiso operativo y no abre G0. Cambios que alteren obligación, variante, garantía, costo obligatorio o riesgo aprobado se elevan por impacto. Las refinaciones técnicas dentro de la delegación se resuelven con evidencia y regresión de las celdas afectadas. MIT/ISC, autorización de ejecución, acceso/actos de piloto, corte y liberación permanecen bajo el procedimiento vigente.
