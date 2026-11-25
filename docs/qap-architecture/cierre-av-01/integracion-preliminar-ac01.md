# AC-01 · Integración preliminar multidisciplinaria y propuesta de alcance

25 de noviembre de 2026. Base `b9ffdcd1ffcb087014f7d8b0759bd41910cfbfd5`. Seis informes recibidos, 91 propuestas originales. Se conservan como copias textuales con saltos normalizados, incluidos residuos de presentación y enlaces originales; no se afirma identidad binaria externa, autoría humana ni verificación independiente de todas las fuentes citadas. Cribado básico sin patrones explícitos de credenciales detectados. Los informes declaran cero experimentos y ninguna modificación. Esta integración **no ratifica requisitos** ni modifica 103 entradas o 57 AR. El dictamen de aptitud de AV-01–08 se mantiene para su alcance original, no se extrapola. No se congela WBS mientras estén abiertos los deltas materiales.

## 1. Principios de integración

La autonomía es una capacidad central, no la única vía de uso. QAP v1 se propone como plataforma local de trabajo profesional y ejecución autónoma; una misma autoridad y repositorio lógico, humanos, HOST, DETERMINISTIC, CLI/CI y futura interfaz operacional autorizada. Manual/híbrida son modalidades de ejecución, no modos de inteligencia. Los cinco dominios son responsabilidades lógicas, no cinco bases. No convertir visor histórico de solo lectura en escritor; superficie operacional separada en autoridad y función, misma vía canónica. Roles profesionales no equivalen automáticamente a cuentas o grants, ni a roles AUT. No SaaS ni colaboración centralizada concurrente inicial. No sustituir estándares ni herramientas especializadas, ni confundir su resultado con veredicto QAP. Sin IA deben funcionar autoría, organización, ejecución manual, automatización preparada, consulta, export y gestión de defectos; generación de nuevas inferencias solo cuando hay fuente/modelo suficiente. Se conserva D01–D21, DE A/B/B/A con respaldo B/B, AR-27 y AR-52 íntegros, D11, autoridad por efecto y vetos. Producción/referencia lectura acreditada, no nuevas operaciones por aceptar alcance. Ninguna política de retención se amplía por copiar ejecución a receta; activos promovidos autorizados, detalle 90d, resumen permanente, TTL de media y revocación prevalecen.

## 2. Matriz de integración (12 grupos, no 12 requisitos)

Se asigna cada uno de los 91 IDs a un grupo primario exactamente una vez para garantizar disposición explícita; las relaciones cruzadas siguen siendo necesarias. Prioridades mixtas se desglosan por capacidad y no elevan automáticamente todo el grupo a obligación. La aceptación candidata aquí es un mínimo, no sustituye el detalle de los seis informes. Contravalidar por cláusula e ID vigente antes de crear/modificar requisitos.

## AC01-I01 · Estrategia, requisitos, riesgo y aceptación del AUT

**Origen:** [QA01-01](informe-ac01-qa01.md), [QA01-02](informe-ac01-qa01.md), [QA01-03](informe-ac01-qa01.md), [QA01-04](informe-ac01-qa01.md), [QA01-06](informe-ac01-qa01.md), [QA01-08](informe-ac01-qa01.md), [QA01-09](informe-ac01-qa01.md), [QA03-14](informe-ac01-qa03.md), [QA04-14](informe-ac01-qa04.md).

**Disposición propuesta:** Ampliación esencial.

**Contrato candidato:** Base de pruebas versionada; revisión estática y ambigüedades, estrategia por entrega, riesgos y criterios objetivos de entrada/salida, cobertura de condiciones por técnica y decisión de entrega separada del veredicto. No QAP autoriza despliegues ni modifica AUT.

**Aceptación candidata:** Revisar requisito ambiguo; generar condición verificable, matriz de obligaciones y evidencia, detectar brecha aun con campaña PASS; decisión empresarial registrada no modifica FAIL.

## AC01-I02 · Biblioteca, operación humana, suites, sets y asignación

**Origen:** [QA01-05](informe-ac01-qa01.md), [QA01-12](informe-ac01-qa01.md), [QA02-01](informe-ac01-qa02.md), [QA02-02](informe-ac01-qa02.md), [QA02-03](informe-ac01-qa02.md), [QA02-04](informe-ac01-qa02.md), [QA02-05](informe-ac01-qa02.md), [QA02-07](informe-ac01-qa02.md), [QA02-09](informe-ac01-qa02.md), [QA02-13](informe-ac01-qa02.md), [QA02-17](informe-ac01-qa02.md), [QA04-03](informe-ac01-qa04.md).

**Disposición propuesta:** Ampliación esencial.

**Contrato candidato:** Interfaz operacional local autenticada, autoría/versionado, agrupación reutilizable, selección congelada, campaña/ciclo y asignación, ejecución manual guiada e híbrida sobre mismo caso y núcleo. No segundo escritor ni aprobación rutinaria de automatizaciones. Roles QAP vs AUT; no identidad por etiqueta.

**Aceptación candidata:** Senior crea set, executor ejecuta sin modelo, pausa/reanuda, deriva automatización preservando identidad/revisión; paso manual incierto no se repite automáticamente ni se acredita sin testigo.

## AC01-I03 · Exploración estructurada

**Origen:** [QA01-07](informe-ac01-qa01.md), [QA02-08](informe-ac01-qa02.md).

**Disposición propuesta:** Ampliación esencial acotada.

**Contrato candidato:** Charter, propósito, timebox, alcance, notas, hallazgos, evidencia, sesión, riesgos y casos derivados; no convertir observación en expectativa ni exploración de lectura en mutación autorizada.

**Aceptación candidata:** Cerrar sesión con hipótesis y cobertura parcial, crear caso candidato con procedencia, impedir salto de autoridad.

## AC01-I04 · Identidad, autoridad, intercambio y evidencia humana

**Origen:** [QA02-06](informe-ac01-qa02.md), [QA02-10](informe-ac01-qa02.md), [QA02-11](informe-ac01-qa02.md), [QA02-12](informe-ac01-qa02.md), [QA02-15](informe-ac01-qa02.md), [QA03-11](informe-ac01-qa03.md), [QA03-12](informe-ac01-qa03.md), [QA04-22](informe-ac01-qa04.md).

**Disposición propuesta:** Ampliación y precisión esencial.

**Contrato candidato:** Identidad declarada vs acreditada, permisos por acción, autoría, revisión, paquetes portables de trabajo y resultados, importación con esquema, mapeo, dedup/conflicto y procedencia; evidencia aportada por humano no prueba origen automático. Sin servidor central, grants/secretos no viajan, no código arbitrario.

**Aceptación candidata:** Dos instalaciones intercambian set congelado y resultado, importación idempotente y conflictos visibles; declaración humana sin testigo no produce PASS; revocación, archivo hostil, tenant incorrecto y duplicado rechazados.

## AC01-I05 · Consulta, reportes, métricas y publicaciones

**Origen:** [QA03-01](informe-ac01-qa03.md), [QA03-02](informe-ac01-qa03.md), [QA03-03](informe-ac01-qa03.md), [QA03-04](informe-ac01-qa03.md), [QA03-05](informe-ac01-qa03.md), [QA03-13](informe-ac01-qa03.md), [QA03-15](informe-ac01-qa03.md).

**Disposición propuesta:** Ampliación esencial + integración.

**Contrato candidato:** Cinco dominios lógicos, repositorio canónico, consulta tipada con filtros/campos/agrupaciones, métricas con denominador, comparabilidad temporal y disponibilidad; plantillas/versiones y publicaciones autorizadas. HTML/MD/CSV/JSON/JSONL vigentes; PDF/XLSX propios propuestos v1, DOCX opcional; envío/sync externos diferidos; export manual gobernada.

**Aceptación candidata:** Generar sin IA reporte filtrado, mismo dataset/definición y revisión, verificar totales y estados tras poda; sin inventar detalles expirados. Export PDF/XLSX saneado y comprobable; no exposición cruzada ni fórmula activa.

## AC01-I06 · Defectos, reproducción y conservación selectiva

**Origen:** [QA02-16](informe-ac01-qa02.md), [QA03-06](informe-ac01-qa03.md), [QA03-07](informe-ac01-qa03.md), [QA03-08](informe-ac01-qa03.md), [QA03-09](informe-ac01-qa03.md), [QA03-10](informe-ac01-qa03.md).

**Disposición propuesta:** Ampliación y precisión esencial.

**Contrato candidato:** Receta versionada humana/ejecutable cuando calificada, distinguir pasos previstos/reales y observación/testigo, precondiciones, datos sintéticos, entorno, permisos requeridos, dependencias y cleanup. Defecto, severidad/prioridad, triage, dedup conservadora, retest y estado actual separados. Promoción autorizada de activo compacto antes de poda; D19/DE-01 intactas.

**Aceptación candidata:** A 120 días recuperar receta protegida y resumen sin video; intentar reproducir en versión nueva sin asegurar recurrencia, declarar insumo ausente. Revocación de conservación prevalece en todas copias; FAIL original no se borra.

## AC01-I07 · Automatización reutilizable, datos parametrizados y mantenibilidad

**Origen:** [QA04-01](informe-ac01-qa04.md), [QA04-02](informe-ac01-qa04.md), [QA04-06](informe-ac01-qa04.md), [QA04-11](informe-ac01-qa04.md), [QA04-12](informe-ac01-qa04.md), [QA04-13](informe-ac01-qa04.md), [QA04-15](informe-ac01-qa04.md), [QA04-20](informe-ac01-qa04.md), [QA04-21](informe-ac01-qa04.md), [QA01-11](informe-ac01-qa01.md), [QA04-10](informe-ac01-qa04.md).

**Disposición propuesta:** Precisión y ampliación esencial.

**Contrato candidato:** Componentes versionados, parámetros/datasets, identidad efectiva build, estabilidad/esperas semánticas, diagnóstico y costos, reparación sin cambio de intención, selección de regresión conservadora, cuarentena gobernada no omite obligaciones. Separar pruebas QAP/AUT.

**Aceptación candidata:** Cambio selector vs cambio semántico; identidad build incierta impide comparación acreditada, cuarentena mantiene fallo y cobertura pendiente, regresión conservadora ante impacto desconocido.

## AC01-I08 · Interoperabilidad externa y CI/CD

**Origen:** [QA01-10](informe-ac01-qa01.md), [QA04-04](informe-ac01-qa04.md), [QA04-05](informe-ac01-qa04.md), [QA04-07](informe-ac01-qa04.md), [QA04-08](informe-ac01-qa04.md), [QA04-09](informe-ac01-qa04.md), [QA04-16](informe-ac01-qa04.md), [QA04-17](informe-ac01-qa04.md), [QA04-19](informe-ac01-qa04.md), [QA05-10](informe-ac01-qa05.md), [QA05-12](informe-ac01-qa05.md), [QA06-10](informe-ac01-qa06.md), [QA06-11](informe-ac01-qa06.md).

**Disposición propuesta:** Esencial mínimo + integración condicionada.

**Contrato candidato:** CLI CI desatendida, código AR-52, JUnit proyección no verdad única; admitir resultados externos con identidad, alcance, nivel, procedencia y limitación, adaptador gobernado, sin importar PASS como canónico. Referencias a desarrollo opcionales; suites externas, mocks/stubs, contratos y seguridad especializada por integración seleccionada, no motor universal ni ejecución de código no confiable. Mantener pruebas unitarias legítimas.

**Aceptación candidata:** Pipeline ejecuta sin IA, consume sobre canónico; resultado externo alterado o build discordante no acredita, fixture simulado no certifica producción, contrato fallido correlacionado. Prueba de admisibilidad y autoridad por adaptador.

## AC01-I09 · Calidad no funcional del AUT

**Origen:** [QA05-01](informe-ac01-qa05.md), [QA05-02](informe-ac01-qa05.md), [QA05-03](informe-ac01-qa05.md), [QA05-05](informe-ac01-qa05.md), [QA05-06](informe-ac01-qa05.md), [QA05-07](informe-ac01-qa05.md), [QA05-08](informe-ac01-qa05.md), [QA05-09](informe-ac01-qa05.md), [QA05-11](informe-ac01-qa05.md).

**Disposición propuesta:** Ampliación y precisión esencial acotada + opcional.

**Contrato candidato:** Perfil de evaluación por atributo, objetivo, métrica, ambiente y testigo; rendimiento sintético acotado (no carga), seguridad funcional, fiabilidad/recuperación, compatibilidad y accesibilidad humana/automática; conservar DE-05 y seguridad adversarial QAP/HOST. Localización ampliada y usabilidad/regresión visual opcionales según proyecto, sin rebajar D17 ni fidelidad vigente.

**Aceptación candidata:** Medir latencia controlada con condiciones y umbral acreditado, demostrar control positivo/negativo de seguridad y recuperación; declarar celdas no evaluadas. No equiparar rendimiento QAP con AUT ni scanner con certificación.

## AC01-I10 · Pruebas de datos y procesos empresariales

**Origen:** [QA06-01](informe-ac01-qa06.md), [QA06-02](informe-ac01-qa06.md), [QA06-03](informe-ac01-qa06.md), [QA06-04](informe-ac01-qa06.md), [QA06-05](informe-ac01-qa06.md), [QA06-06](informe-ac01-qa06.md), [QA06-07](informe-ac01-qa06.md), [QA06-08](informe-ac01-qa06.md), [QA06-09](informe-ac01-qa06.md), [QA06-12](informe-ac01-qa06.md).

**Disposición propuesta:** Ampliación y precisión esencial + opcional/posterior.

**Contrato candidato:** Datasets/fixtures versionados, invariantes y relaciones declarativas, condiciones/estados, concurrencia intencional del AUT acotada con grupos de actores y reserva; efectos asíncronos, negativos API, operaciones masivas parciales, comparación entre configuraciones/versiones. Comparadores de salidas adicionales opcionales, migraciones AUT especializadas posteriores; D11 intacto. No exigir DB AUT ni motor financiero propio.

**Aceptación candidata:** Probar dos actores sobre fixture autorizado, duplicado, efecto tardío y lote parcial; reconciliar por subefecto y no reintentar incierto; comparar población y estado con testigos independientes; diferenciar concurrencia QAP de AUT.

## AC01-I11 · IA externa sin MCP

**Origen:** [QA02-14](informe-ac01-qa02.md).

**Disposición propuesta:** Opcional.

**Contrato candidato:** Paquetes mínimos saneados de contexto y propuestas estructuradas por intercambio explícito, sin exigir suscripción o exponer secretos; no conferir autoridad ni ejecutar texto externo.

**Aceptación candidata:** Importación propuesta válida sin MCP, rechazo de propuesta obsoleta/inyección/grant inventado. Operación humana completa funciona sin esta capacidad.

## AC01-I12 · Escala avanzada y servicios especializados

**Origen:** [QA04-18](informe-ac01-qa04.md), [QA05-04](informe-ac01-qa05.md), [QA05-13](informe-ac01-qa05.md).

**Disposición propuesta:** Integración o posterior.

**Contrato candidato:** Carga/estrés/resistencia y capacidad por herramienta especializada bajo permiso y límites; ejecución distribuida y observabilidad continua posteriores. Mantener concurrencia local adaptativa y pruebas de rendimiento QAP ya obligatorias; no confundir uso de herramienta externa con generación de carga autorizada.

**Aceptación candidata:** Admisión de informe de carga con alcance y límites; sin despacho activo no autorizado; trabajo distribuido no condición de v1. No servicio central ni agente residente de monitorización.

## 3. Resoluciones de conflictos y dependencias

- I01/I02/I03: escenario, caso/revisión, suite y selección congelada, plan y ciclo/campaña deben mapear PLN/CAS/CAM existentes; no duplicar CampaignPlan/ExecutionPlan/DataPlan por nomenclatura comercial. Distinguir cobertura diseñada, ejecutada y acreditada; requisito AUT vs obligación QAP. Estrategia y riesgo no reemplazan autorización ni vetos. UAT y decisión de entrega del AUT son distintas de GA QAP.
- I02/I04/I06: ejecución manual externa no se controla como despacho del runner. Registrar acción declarada, observación, procedencia, autorización y limitación; acción fuera de control no se proclama impedida por QAP. Testigo humano puede ser suficiente cuando oráculo lo permite, no por marcar casilla. Reconciliar efectos y revisiones antes de retomar pasos híbridos. No exigir acreditar criptográficamente hecho humano externo por firmar importación.
- I04/I05/I06: identidad de publicación y destinatario, consultas as-of y datos expirados; no reconstruir evidencia desaparecida, ni convertir reporte publicado en verdad actual, ni perpetuar datos por export; ancla y autorización según AV-05. PDF/XLSX de salida no D11 del AUT. Importación básica de casos mapeada y saneada, no asumir compatibilidad universal de todos los formatos.
- I07/I08/I10: componentes y fixtures son activos versionados, ejecución externa solo tras calificar adaptador/autoridad, no otorgar shell general. Observación de contrato o mock no equivale a efecto real; build/entorno/proveedor/consumidor identificados. CI no depende de IA ni añade un núcleo. Cuarentena no es SKIPPED autorizado automático; conserva fallo y obligación.
- I09/I10/I12: métricas de producto QAP vs AUT separadas; concurrencia de pruebas QAP (scheduler) vs concurrencia intencional de acciones AUT (fixture) vs carga masiva (especializada). Seguridad activa/carga/fault injection solo ámbito específico autorizado con presupuesto, parada y consecuencias; no permisos por política general. Accesibilidad humana complementa automatizada; i18n opcional ampliada no reduce D17.
- Identificar rutas de aceptación instaladas E1–E8 y G6.5; agregar subobligaciones/celdas de nueva capacidad tras ratificación. Sin modificar pisos ratificados ni exigir una prueba especializada en cada campaña. No imponer corpus o hardware adicional sin fundamentar. Preservar EXP y DAG; si se requiere nuevo experimento, justificar garantía no cubierta y fase. No seleccionar tecnología antes de delimitar necesidades.

## 4. Decisiones empresariales agrupadas para ratificación posterior

| ID provisional | Recomendación de Orquestador | Alternativa y consecuencia |
|---|---|---|
| AC-DE-01 | Plataforma local integral, operación humana sin IA, interfaz operacional, manual/híbrida, biblioteca/sets/asignación/charters e intercambio de paquetes gobernado (I02–04) | Mantener herramienta centrada en agente: limita trabajo diario; colaboración centralizada añade complejidad y contradice alcance local inicial. |
| AC-DE-02 | Dirección estratégica por entrega, revisión de requisitos, riesgo y cobertura; criterios de salida, UAT y decisión humana registrada sin despliegue automático (I01/I03) | Solo campaña autónoma: menor alcance, no gestiona riesgo de entrega. No gobierno corporativo universal. |
| AC-DE-03 | Reportes configurables, métricas versionadas, publicaciones y memoria reproductiva promovida selectivamente; PDF/XLSX de salida, DOCX opcional, export manual gobernada (I05/I06) | Solo reportes de corrida/formato actual o recetas temporales: limita recuperación profesional; no conservar toda corrida indefinida. |
| AC-DE-04 | Automatización funcional parametrizada/reutilizable, CI sin modelo y admisión de evidencia externa; adaptadores seleccionados/calificados, referencias a desarrollo opcionales (I07/I08) | Frameworks universales nativos o sync bidireccional obligatorio multiplican alcance; no diferir paridad CI existente. |
| AC-DE-05 | Perfil no funcional y medición sintética acotada, seguridad funcional, resiliencia y compatibilidad, a11y según DE-05; usabilidad/visual/i18n ampliadas opcionales; herramientas especializadas externas (I09/I12) | Motor propio de carga/escaneo o monitorización permanente aumenta riesgo y coste; no incorporar v1. |
| AC-DE-06 | QA de datos declarativo acotado, concurrencia intencional funcional autorizada, async/lotes/API/configuración, comparadores básicos y adaptadores selectivos; migraciones AUT avanzadas posteriores (I10) | Solo casos individuales/D11 deja brecha; plataforma universal de datos innecesaria. |
| AC-DE-07 | IA externa sin MCP opcional, vía intercambio explícito saneado (I11); ninguna dependencia del modelo para trabajo diario | Diferir esta vía preserva operación sin IA y MCP; no asumir IA gratuita con MCP. |

Ninguna opción ratificada por este documento. Mantener políticas DE-01–05; no preguntar al propietario por librerías, estructuras físicas o algoritmos. Contravalidación focalizada de cobertura, dependencias, mínimos obligatorios y riesgos antes de formular el acta de cambios; conservar alternativas no elegidas. Si alguna propuesta exige cambiar DE, elevarlo expresamente. No alterar código, catálogo, estados AR, WBS ni permisos.

## 5. Próximo paso

Contravalidar integración por los 91 IDs y fuentes completas contra base vigente y encargo AC-01. Verificar clasificación nuevo/precisión/cubierto/no aplica; límites de integraciones y mínimos de v1, sin diseñar solución tecnológica. Proponer correcciones y un catálogo delta candidato (sin numeración definitiva) con criterios positivos/negativos y trazabilidad; después ratificar decisiones, integrar especificación y aceptar impacto. No repetir AV-01–08.
