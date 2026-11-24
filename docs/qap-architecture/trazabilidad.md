# Matriz de trazabilidad y compuertas

El [catálogo](catalogo-requisitos.md) enlaza cada fila original, decisiones, dependencias, estado estático y aceptación candidata. Se acorta `REQ-` al indicar una familia o un sufijo. Las referencias de fase son las del [plan maestro](plan-maestro.md) con el alcance de lanzamiento del [acta](acta-decisiones.md). EXP indica prueba propuesta, AS indica antecedente de auditoría y H/H-REV remite a la [revisión independiente](revision-independiente.md). Cada compuerta conserva su condición histórica de diseño. La consolidación no registra aprobaciones de compuerta.

## Decisiones y cobertura

| Acta | Requisitos y ampliaciones | DP | AS, hallazgos y EXP | Compuerta y aceptación candidata |
|---|---|---|---|---|
| D01 | CAM 001.1, CAS 001.2, ORA 001.1–001.7, E2E, REQ-QA-002 y candidatos de lanzamiento | DP-01/02/10 | H03/H06/H07/H11, H-REV-05, Recovery/R2 | G4/G6, E3/E4/E5/E8. Evaluación empresarial ciega, flujos, efectos, regresión e historial. |
| D02 | MEM 002.1, 003.6, INT 001.3, SEG 001.2 | DP-07 | H01/H04, H-REV-03/06 | G0/G1/G5, E1/E2. Aislamiento y una autoridad de escritura con contrato portable. |
| D03 | MEM 002.3–002.4, IA 001.1–001.6, CAM 001.4, AGT-002 | DP-06 | H02, H-REV-06, EXP-01 | G1/G4, E3/E7. Muerte del host, avance determinista, reclamación por otro host y sin API extra. |
| D04 | DIS 001.1, CAS 001.1, CAM 001.1–001.5, REP 001.2, REG 001.1 | DP-01 | H02/H06/H07, EXP-01/02 | G1/G4/G6, E3/E4/E8. Intención a aprendizaje, sin aprobación ordinaria, bloqueos explícitos. |
| D05 | MEM 001.1–003.6, DIS 001.2/7, CAS 001.3–001.5, REG 001.1–001.3, AGT-002 | DP-03/07/09 | H02/H04/H07, H-REV-03/06, EXP-01/02 | G1/G2/G4/G5, E2/E3/E4/E5. Separación epistémica, fuentes e invalidación con continuidad. |
| D06 | PLN 001.1/4–6, CAS 001.2, RUN 001.1–001.4, DAT 001.1–001.4, CAM 001.2, E2E | DP-04/05 | H03/H06/H07, H-REV-05, EXP-05, R2 | G3/G4/G6, E4/E5/E8. Dos roles, tres módulos, transferencia tipada, reconciliación y efectos. |
| D07 | SEG 001.1–001.3, DAT 001.3–001.4, ORA 001.5, RUN 001.5 | DP-03/05/09/14 | AS-01/03, H03/H05, H-REV-02/05, EXP-05 | G1/G3, E2/E4/E5. Producción solo lectura acreditada, QA acotado y revocación en vuelo. |
| D08 | DAT 001.1–001.4, INT 001.4, UTCP/OpenAPI, REQ-QA-002 | DP-05/13 | H03/H06, H-REV-05, EXP-05, R2 | G0/G3/G4, E1/E4/E5. Provisionar y verificar por contrato con permisos y reconciliación. |
| D09 | REQ-XINST-001, MEM 002.1/5, SEG 001.1–001.2 | DP-09/14 | AS-03, H04/H05, EXP-05 | G0/G2/G3, E2/E4/E5. Identidad read-only del destino, procedencia y bloqueo si falta garantía. |
| D10 | DOC 001.1–001.4, INT 001.4 | DP-08 | H06/H07, R2.6/E5 | G2/G6, E4/E8. Corpus con formatos de lanzamiento, tablas, localizadores y abstención. |
| D11 | CAND-REP-001, DOC 001.1–001.2, ORA 001.2–001.7, REQ-QA-001 | DP-04/08/10 | H03/H06, H-REV-05, R2.6/I3 | G2/G3/G4/G6, E4/E5/E8. Comparar PDF y Excel del AUT por registro, fórmula y total. |
| D12 | ORA 001.1–001.7, RUN 001.3–001.4, REP 001.1, M1 | DP-02/04 | H03/H06, H-REV-05, Recovery/R2 | G3/G5/G6, E5/E7/E8. Rechazar falsos PASS, distinguir ejes de ejecución y evidencia. |
| D13 | INT 001.1–001.2, IA 001.1/5, REQ-AGT-001, AGT-002, ONB-001 | DP-11/12/15 | H01/H02, H-REV-06, EXP-01/04 | G1/G4/G5/G6, E1/E3/E7/E8. Sesiones limpias, clientes versionados, paridad y suites legítimas. |
| D14 | INT 001.2, ONB-001, CAND-RUN-001, M4/M5 | DP-12/15 | H08/H09, EXP-03/04/06 | G1/G3/G5/G6, E1/E6/E7/E8. Tres SO, matriz navegador/modalidad, caché y descarga bajo demanda. |
| D15 | CAND-RUN-001, DIS 001.3–001.4, RUN 001.1, M3 | DP-12/15 | H-REV-05, AS-04, EXP-02/03/04/06 | G2/G3/G5, E4/E6/E7. Reproducir el AUT hidratado y estilos íntegros, preferencias persistidas. |
| D16 | CAM 001.3, RUN 001.1/5, OPT-001/002 | DP-12/15 | H02/H03, EXP-02/03/04/06, R7 | G3/G4/G6, E3/E5/E7/E8. Medición CPU/RAM/disco/tokens, aislamiento y concurrencia acotada. |
| D17 | REQ-QA-001, DOC 001.1, IA 001.1–001.2, ORA 001.4 | DP-06/08/10 | H06, EXP-06, R2.6/I3 | G2/G3/G4/G6, E4/E5/E8. Variantes regionales reproducibles, textos y códigos estables. |
| D18 | CAND-SEG-001, SEG 001.1–001.3/002.1, REP 001.1, RUN 001.6, M1–M5, política de captura | DP-03/12/15 | AS-01/03/04, H08–H10, H-REV-04, EXP-06 | G0/G1/G3/G5/G6, E2/E5/E6/E8. Canarios desde primer cuadro, custodia, supresión y revocación. |
| D19 | MEM 003.3–003.5, REP 001.1–001.4, OPT-002, M2/M4, política de historial y retención | DP-07/15 | AS-01/04, H04/H08/H09, H-REV-03/04 | G1/G3/G5, E2/E5/E6/E7. Poda auditable, historial durable, export saneado y veredicto inmutable. |
| D20 | SEG 001.1–001.3/002.1–002.2, MEM 002.5, CAND-SEG-001, M4 | DP-03/09/11/14 | AS-01/03/04, H05/H08–H10, H-REV-01/02/04/05 | G0/G1/G3/G5, E2/E5/E6. Sesión requerida, alta segura, aislamiento, CORS, catálogo y rangos. |
| D21 | DIS 001.1–001.8, CAS 001.2/4, ORA 001.1–001.7, DAT, E2E, REQ-QA-001/002/003, CAND-REP-001, CAND-RUN-001, INT 001.1–001.2 | DP-02/10/12/15 | H03/H06/H11, H-REV-05, EXP-01–06, Recovery/R2 | G6, E1–E8. Custodia y oráculos independientes, métricas separadas, paridad, cero fallas de garantías críticas. |

## Auditorías, hallazgos y experimentos

| Antecedente | Requisitos afectados | Aplicación y alcance |
|---|---|---|
| AS-01, H08/H09, H-REV-01/04 | SEG 001.1/2, REP 001.1/2, M1/M2/M4, CAND-SEG-001 | Visor confinado, CORS, catálogo, reproductor y export offline. G0/G5, E2/E6. |
| AS-02, H-REV-01 | REG 001.1, SEG 001.1, INT 001.2 | Eliminar dependencia de shell para refs, exposición externa aún no acreditada. G0, E1 y regresión defensiva. |
| AS-03, H05, H-REV-02/05 | SEG 001.3/002.1/002.2, MEM 002.5, CAND-SEG-001 | Alta y uso de sesión fuera de banda, revocación y fallback cerrado. G0/G1/G3, E2/E5. |
| AS-04, H10, H-REV-04 | RUN 001.6, REP 001.1, M2–M5, CAND-SEG-001 | Fuga SPA→MFA y provisión de custodia experimental. G3/G5, E5/E6, EXP-06. |
| H01, H04, H-REV-03/06 | MEM 001.1–003.6, INT 001.1/3 | Base efectiva, escritores legados, única autoridad y corte reversible. G0/G1/G5, E1/E2/E7. |
| H02, H-REV-06 | MEM 002.3–002.4, IA 001.4, CAM 001.4 | Separar vida útil del ejecutor y host. G1/G4, E3. |
| H03, H06, H-REV-05, Recovery/R2 | ORA 001.1–001.7, RUN 001.2–001.6, DAT 001.2/4 | Efecto, nomenclatura de estados, rollback, recuperación y publicación. G3/G4, E5. |
| H07, H-REV-05 | DIS 001.1–001.8, PLN 001.1–001.6, CAS 001.1–001.5 | Frontera y estados SPA, planes y oráculos acreditados. G2/G4, E4/E8. |
| H11 | Todas las familias, candidatos y políticas | Secuencia y evaluación independiente. G0–G6 y E1–E8. |
| EXP-01 | REQ-AGT-001, AGT-002, IA 001.1/4/5, INT 001.1 | Versiones de hosts y modos MCP, enrutamiento, latencia/tokens, reanudación y falsas interferencias. E1/E3/E7. |
| EXP-02 | DIS 001.2–001.4/7, OPT-002 | Comparar DOM+ARIA, extractor vigente y alternativas sobre el mismo corpus, midiendo cobertura, latencia y replay. E4. |
| EXP-03 | RUN 001.1/5, CAM 001.3, OPT-001/002, CAND-RUN-001 | Pool y contexto limpio, concurrencia, recursos, fallos y limpieza multiplataforma. E3/E5/E7. |
| EXP-04 | INT 001.2, ONB-001, CAND-RUN-001, M5 | Paquete limpio, binario ligero/completo, proxy/CA, recursos, cierre, PNG/WebM. E1/E6/E7. |
| EXP-05 | DAT 001.2/4, INT 001.4, REQ-XINST-001 y REQ-QA-002 | Comparar contratos y cliente SDK, reconciliación y verificación de no mutación de referencia. E2/E4/E5. |
| EXP-06 | REQ-QA-001/003, REP 001.1, M2–M5, CAND-SEG-001 | Coste de i18n, accesibilidad y media. Evaluar supresión preventiva y export portable, Web Vitals opcional. E5/E6/E8. |

## Compuertas y aceptación

| Compuerta | Contenido del plan y alcance consolidado | Pruebas |
|---|---|---|
| G0 | Contratos y saneamiento base, visor/Git/tipos, persistencia, intención, modos, DataPlan, ubicación de la autoridad, locale y aceptación. | E1 y contratos de E2–E8. |
| G1 | Seguridad, memoria y corte vertical de lectura, ejecutor durable, alta fuera de banda y package limpio con primera evidencia. | E1/E2/E3/E6/E7. |
| G2 | Discovery profundo, recuperación de frontera, roles, escritura denegada en exploración de lectura, formatos de D10 y contrato de extracción D11. | E4, insumos E8. |
| G3 | Runner, casos congelados, oráculos, carga y limpieza de datos, operaciones API autorizadas, ejecución y captura controlada. | E5/E6, datos de recursos para E7. |
| G4 | Integrar productores y campaña multirol/multimódulo, handoff, continuidad y oráculos de reportes del AUT. | E3/E4/E5. |
| G5 | Empaquetado, reportes, historial, defectos, regresión, migración reversible, export y paridad. | E2/E5/E6/E7. |
| G6 | Falsación con evaluador independiente, aceptación formal y eventual corte autorizado. | E1–E8 y V-01–V-16. |

| Criterio | Cobertura vigente propuesta | Condiciones incorporadas |
|---|---|---|
| E1 · Contratos | PLN, RUN 001.2, INT, G0/G1 | Revisiones MCP, contratos DataPlan, alcance, matriz de las tres plataformas y separación de adaptadores. |
| E2 · Memoria, seguridad y corte | MEM, SEG, G1/G5 | Aislamiento, revocación, secretos, catálogo, migración y cero escritores legados en proyecto cortado. |
| E3 · Autonomía | IA, CAM, G1/G4 | Terminar árbol del host y ejecutor, recuperar lease/endpoints, continuar trabajo autorizado, reanudar en otro host y replay sin inferencia. |
| E4 · Discovery y planificación | DIS, DOC, PLN, CAS, G2/G4 | SPA con recursos acreditados, corpus D10, roles, locales, DAG, referencia read-only y reportes del AUT. |
| E5 · Runner, oráculos y evolución | ORA, RUN, DAT, REG, G3/G5 | HTTP 201 sin efecto, si hay testigo suficiente FAIL; sin testigo suficiente abstención. Casos de PDF/Excel con negativos por fila/filtro/fórmula, recuperación y limpieza. |
| E6 · Evidencia y calidad visual | REP, SEG, M1–M5, G1/G3/G5/G6 | Canarios desde origen, SPA del mismo documento, temporales protegidos, supresión, visor, rango, navegación por paso y export portátil. |
| E7 · Paridad y distribución | INT, REP, IA 001.5, ONB, G1/G5 | Paquete limpio, versiones de hosts y navegadores, estados idénticos incluidas ejecuciones purgadas, política y códigos CLI. |
| E8 · Validación independiente | D21 y V-01–V-16, G6 | Aplicaciones y defectos ocultos, pruebas D10–D18, umbrales calibrados por separado y vetos de calidad. |

E1–E5 del laboratorio F0/Recovery/R2 son identificadores históricos y no equivalen por numeración a E1–E5 del plan maestro. El E1 HOST histórico aporta a E3/E7 vigentes. Custodia ciega histórica E2 corresponde a E8. Los controles históricos de veracidad E3 aportan a E5. Recuperación E4 aporta a E3/E5. Extracción primaria E5 aporta a E4/E5. El I2/I3 de R2 acredita independencia dentro de su fixture. Los niveles N1–N3 del plan requieren contrato y validación propios.

## Cobertura y discrepancias

- 82 filas originales con vínculo individual, distribución por familia y mapeo a decisiones y criterios. Los cinco añadidos y tres candidatos tienen dependencias y aceptación propias. Ningún ID recuperado carece de criterio candidato. La validación funcional de reportes, preferencias con fidelidad y custodia privada tenían cobertura fragmentaria y se registran con IDs candidatos.
- D01–D21 figuran en el acta y todos tienen cobertura en la matriz. Los vínculos por familia caracterizan alcance y garantía, con reglas de precedencia en el [registro](cuestiones-abiertas.md).
- Falta el mapeo individual de las categorías 60/20/7 y la corroboración primaria de los documentos listados como pendientes. G6 conserva los denominadores como candidatos. Un agregado alto no sustituye la ausencia de garantías críticas.
- La investigación proponía hooks de bloqueo, límites de tokens tentativos, modo de navegador por defecto y compuerta conjunta de experimentos. Las decisiones expresas, los límites observados y las decisiones restantes se resuelven o registran por separado en [cuestiones abiertas](cuestiones-abiertas.md).
