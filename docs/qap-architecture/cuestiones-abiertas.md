# Cuestiones abiertas y resoluciones

D01–D21 prevalecen sobre las alternativas incompatibles. Los DP históricos se conservan por número, con referencia a [DP-01–DP-10 de Neon](gemini-neon-etapa-3.md#122-matriz-de-decisiones-abiertas-dp-01-a-dp-10), el [plan maestro](plan-maestro.md#f-conclusión-y-decisiones-pendientes) y [DP-11–DP-15 de investigación](insumos/gemini-neon-investigacion.md#decisiones-que-requieren-aprobación-explícita-del-propietario).

| DP | Resuelto por el propietario | Cuestión que permanece y tipo |
|---|---|---|
| DP-01 · Elegibilidad | D01/D04 establecen autonomía ordinaria con política y fuentes. | Contrato de elegibilidad, bloqueo parcial y migración de recibos históricos. Decisión técnica. |
| DP-02 · Cobertura y efectos | D21 mantiene 80 % y 75 % como referencias candidatas separadas. | Calibrar denominadores, corpus, umbrales por app y agregados, exclusiones y tratamiento de bloqueos. Validación y ratificación de aceptación. |
| DP-03 · Credenciales | D20 exige entrada fuera de MCP, chat y prompts. | Bóveda y canal interactivo multiplataforma y CI sin TTY. Validar revocación, protección de almacenamiento y ausencia de fuga. Decisión técnica y validación. |
| DP-04 · Oráculos | D12 permite evidencia estructural etiquetada y exige independencia para efectos críticos. | Fijar precedencia de testigos, rúbrica causal, ventanas, taxonomía cuando falte testigo y agregación entre ejes. Decisión técnica. |
| DP-05 · Limpieza | D06–D08 exigen reconciliación y limpieza/compensación autorizadas. | Acreditar estrategias por entorno, incluida política de acciones financieras, contables e irreversibles. Ratificación de política por destino y validación. |
| DP-06 · MANAGED | D03 lo difiere. HOST y DETERMINISTIC son iniciales. | Puerto, límites y condiciones futuras de MANAGED. Decisión técnica posterior al alcance inicial. |
| DP-07 · PostgreSQL y operación compartida | D02 resuelve orden de entrega y preparación de los contratos. | Resolver driver/Node, capacidades de repositorio, transacción, FTS, migración y equivalencia concurrente antes del contrato G1. Decisión técnica. |
| DP-08 · Formatos de documentos | D10 fija formatos del primer lanzamiento y D11 exige validación del reporte emitido. | Elegir parsers, OCR y criterio de abstención por formato, además de corpus, tolerancias y fuentes comparables. Validación y decisión técnica. |
| DP-09 · Identidad de tenant | D02/D05/D07/D09/D20 exigen alcance acreditado y aislamiento. | Precedencia entre perfil, señal del destino y declaración del operador. Bloquear si es obligatorio y falta certeza. Decisión técnica y casos de prueba. |
| DP-10 · Batería ciega | D21 obliga a independencia de aplicaciones y defectos. | Custodio, composición del corpus, método de muestreo, umbrales y garantías de independencia. Validación y ratificación de aceptación. |
| DP-11 · Hooks | D13 descarta bloqueos globales por patrones y exige orientar al runner oficial. | Registro, Skill y hooks informativos opt-in por host son candidatos. Validar adopción y desinstalación por versión con EXP-01. Decisión técnica y validación. |
| DP-12 · Navegadores | D14/D15 fijan tres SO, modos y elección por el usuario. Chromium y Shell son candidatos. | Matriz de arquitecturas, marcas/motores, versiones, modo, media, fidelidad y límites de soporte. Decidir valores por defecto tras EXP-03/04/06. Validación y decisión técnica. |
| DP-13 · UTCP/OpenAPI | D08 incorpora ambos dentro de DAT 001.2 e INT 001.4. Uso por caso es opcional. | Elegir implementación y SDK tras verificar autenticación, contratos, errores y reconciliación con EXP-05. Decisión técnica. |
| DP-14 · Cross-instancia | D09 exige lectura acreditada y prohíbe transferir sesiones/credenciales. | Definir permisos del destino, fuentes habilitadas y exportaciones sanitizadas de referencia. Política por destino y prueba EXP-05. |
| DP-15 · Calendario de experimentos | Esta etapa solo consolida. Los ensayos siguen propuestos. | Acordar dependencias de adopción y DataPlan antes de sus decisiones, y usar los demás antes de fijar cada componente. La evaluación Codex propone ese orden y Neon propuso un único prerrequisito para G0. La secuencia no se ratificó. |

## Cuestiones transversales

| Tipo | Pendiente | Evidencia o decisión de cierre |
|---|---|---|
| Investigación documental | Recuperar clasificación individual 60/20/7, la fuente primaria de la consolidación de 87, las dos Entregas y Adenda y los informes de auditoría originales faltantes. | Comparar con los IDs ya cotejados y actualizar procedencia sin perder contenido ni historial. [Fuentes pendientes](evidencia-archivada.md#material-primario-pendiente). |
| Validación | Cifrado del recurso de almacenamiento realmente usado desde la primera escritura de temporales y perfiles. Probar cambios SPA, iframes, ventanas, caídas y revocación. | E6 y EXP-06, incluidos canarios por cuadro y fallback de supresión. AS-04 demuestra la fuga con guarda solo de red y deja esos alcances sin certificar. |
| Ratificación empresarial | Riesgo residual de captura privada (volúmenes, respaldos, snapshots, crash), ámbitos autorizados, exportación privada excepcional y detalles operativos de retención. | Acta de riesgos y límites. Confirmar TTL 24 h/72 h/14 días, cuotas, excepciones y poda antes de convertirlos en valores operativos. |
| Decisión técnica y validación | Rendimiento, presupuestos, hardware mínimo/recomendado, aislamiento, cierre de procesos y fidelidad por plataforma y modo. | EXP-02/03/04/06 con hardware, versiones, tamaños de muestra y políticas fijadas. Medir tokens y adoptar límites sin degradación silenciosa. |
| Decisión técnica | Localización de interfaz y reportes QAP, representación estructurada, cobertura de accesibilidad y correspondencia con formatos empresariales. | Corpus versionado y matriz de capacidades. Las prioridades históricas no retiran i18n, PDF/Excel funcional ni documentación del lanzamiento. |
| Validación | Contratos de migración, compatibilidad legacy, recuperación de escritor único y deuda de tipos de la base real. | Medición reproducible en el SHA de producto. H-REV-03/06 y E1/E2/E7. |
| Ratificación empresarial | Corpus y umbrales comerciales, cobertura avanzada opcional, operaciones de negocio admitidas y autorización de corte por proyecto. | Evaluación independiente, dictamen del Investigador Principal y del Orquestador y decisión expresa del propietario. |

## Contradicciones resueltas para la revisión

- **Salida MVP y aprobaciones.** Visión histórica y lifecycle anterior admitían un smoke de salida y recibos/aprobaciones. D01/D04/D06/D21 exigen producto funcional, criterio por efecto y autonomía por política. Se conservan los recibos previos como parte de la integridad de datos.
- **88 frente a 87.** La evaluación Codex separaba UTCP. D08 y la línea base indicada absorben ese contenido en DAT 001.2 e INT 001.4. AGT-002, ONB-001, OPT-001/002, E2E y M1–M5 amplían IDs.
- **Documentos postergados.** Las alternativas de DP-08 incluían adaptadores posteriores o conversiones ordinarias. D10 hace obligatorios los formatos listados desde el lanzamiento y D11 agrega evaluación de archivos emitidos.
- **Flujo transaccional.** La propuesta de investigación describía una unidad transaccional. Los efectos confirmados en otra aplicación requieren reconciliación, comprobación y compensación bajo permiso. QAP puede exigir atomicidad de su publicación interna.
- **CPU, RAM y tokens.** Las hipótesis de ahorro, cifras concretas y límites de contexto son mediciones o metas de investigación. D15/D16 exigen garantías funcionales y medición antes de adoptar valores.
- **Éxito técnico y efectos.** Interpretar HTTP, clic, navegación o visibilidad como PASS funcional contradice D12. Recovery/R2 demuestran el riesgo sobre su base experimental. Niveles de testigo y convenciones históricas de estado se trazan por semántica.
- **Producción y referencia.** D07/D09 permiten lecturas acreditadas y acotan toda escritura a QA autorizado. GET, nombres de entorno y una API por sí solos carecen de autoridad probatoria o independencia.
- **Hooks globales.** D13 resuelve el bloqueo por patrones. Las sugerencias informativas y el registro por host siguen sujetos a EXP-01.
- **Grabación y visibilidad.** La guarda de red sola y el cifrado posterior carecen de cobertura preventiva para todos los bytes. D18 prevalece sobre las propuestas de grabación. El modo de captura queda condicionado a protección comprobada, con supresión cuando falte. D15 exige conservar recursos autorizados de la aplicación y registrar degradación.
- **Retención y métricas.** D19 prevalece sobre TTL históricos. Los TTL operativos propuestos conservan su estado pendiente. D21 prevalece sobre umbrales o equivalencias comerciales propuestas. El porcentaje global no revierte falsos PASS ni otros incumplimientos críticos.
- **Baseline y deuda.** R2 demuestra resultados en su historial. Los cambios desde `30fb3a2` al SHA remoto inicial son documentales. Las cifras 142 y 144 tienen procedencias y composiciones distintas. El cero de R2 no representa a develop.
