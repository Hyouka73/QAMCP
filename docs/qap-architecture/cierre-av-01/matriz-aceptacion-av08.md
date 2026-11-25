# AV-08 · Matriz normativa para aceptación

Fuente exacta [catálogo en la base f886cab](https://github.com/Hyouka73/QAMCP/blob/f886cab332292220b20987fc8124c7e3cc4c6a83/docs/qap-architecture/catalogo-requisitos.md), [acta D01–D21](../acta-decisiones.md) y [corrección MEM-003.6 de AV-07](decision-orquestador-av07-av08.md#corrección-normativa-de-trazabilidad). Se incluyen 87 IDs base, tres promociones, dos políticas y 11 ampliaciones. La fila REQ-MEM-003.6 desarrolla la independencia del dominio y del escritor. Este cotejo es de trazabilidad y diseño. Las 103 entradas siguen pendientes de acreditación de producto en esta matriz.

Cada enlace normativo incorpora la ficha completa, incluidas enmiendas vigentes. Cada criterio breve señala una prueba principal y exige el desglose en subobligaciones del manifiesto CV08-01. Celdas no cubiertas por la prueba principal requieren su propio caso y evidencia antes de cerrar. Las letras E remiten a compuertas probatorias del [plan](../plan-maestro.md#e-compuertas-de-aceptación) y su [secuencia vigente](compuertas-av07.md). Celdas de instalado, ciego y piloto se resuelven según la [enmienda](enmiendas-av08.md), sin declarar equivalencia por analogía.

## Fichas REQ

| Entrada | Evidencia E | Unidad candidata de prueba y criterio mínimo |
| --- | --- | --- |
| [REQ-MEM-001.1](../catalogo-requisitos.md#req-mem-0011) | E1/E2 | Separar cuatro planos y rechazar entidad sin plano; consulta por plano desde los dos adaptadores. |
| [REQ-MEM-001.2](../catalogo-requisitos.md#req-mem-0012) | E1/E2 | Repetir observación en ambos canales y conservar su clase hasta acreditar fuente/autoridad. |
| [REQ-MEM-001.3](../catalogo-requisitos.md#req-mem-0013) | E2 | Revisar regla y caso, consultar revisiones anteriores y denegar modificación retrospectiva. |
| [REQ-MEM-001.4](../catalogo-requisitos.md#req-mem-0014) | E2/E4 | Introducir drift incompatible y comprobar revisión pendiente con edición manual y linaje intactos. |
| [REQ-MEM-002.1](../catalogo-requisitos.md#req-mem-0021) | E2/E7 | Dos ámbitos divergentes; validar aislamiento en consultas, llaves, FTS, reportes y exportación. |
| [REQ-MEM-002.2](../catalogo-requisitos.md#req-mem-0022) | E1/E2/E7 | Denegar alcance incompleto, ambiguo o cruzado por ambos adaptadores antes de IO. |
| [REQ-MEM-002.3](../catalogo-requisitos.md#req-mem-0023) | E2/E3 | Cortar ejecutor y recuperar frontera, cola lista y razonamiento sin duplicación. |
| [REQ-MEM-002.4](../catalogo-requisitos.md#req-mem-0024) | E2/E3 | Reanudar por otro HOST con consulta autorizada de cobertura y próxima tarea; negar alcance revocado. |
| [REQ-MEM-002.5](../catalogo-requisitos.md#req-mem-0025) | E2/E7 | Exportar conocimiento con procedencia y sin secretos/sesiones; revocar sesión y conservar conocimiento. |
| [REQ-MEM-003.1](../catalogo-requisitos.md#req-mem-0031) | E2/E4 | Sembrar conflicto de autoridad y verificar procedencia, estado y bloqueo del oráculo. |
| [REQ-MEM-003.2](../catalogo-requisitos.md#req-mem-0032) | E2/E4 | Cambiar fuente, invalidar solo dependencias vigentes y preservar revisiones independientes. |
| [REQ-MEM-003.3](../catalogo-requisitos.md#req-mem-0033) | E2/E5 | Repetir firmas de fallo, enlazar intentos, detectar inestabilidad y conservar regla. |
| [REQ-MEM-003.4](../catalogo-requisitos.md#req-mem-0034) | E2/E7 | Conciliar entidades y revisiones tras export/import bajo alcance y hashes; excluir sesiones y secretos. |
| [REQ-MEM-003.5](../catalogo-requisitos.md#req-mem-0035) | E2/E6 | Comparar simulación/aplicación de poda con panel de candidatos y bytes, cero efectos de simulación y protección activa. |
| [REQ-MEM-003.6](../catalogo-requisitos.md#req-mem-0036) | E1/E2/E7 | Ejercer puerto único y adaptador SQLite sin dependencias SQL/driver/transporte en dominio; negar segundo escritor y cruce de alcance. Verificar extensión futura por contrato. |
| [REQ-DIS-001.1](../catalogo-requisitos.md#req-dis-0011) | E3/E4/E8 | Ejercer intención y autorización inicial, continuar lotes autónomos y sellar READY o brechas con razones. |
| [REQ-DIS-001.2](../catalogo-requisitos.md#req-dis-0012) | E3/E4 | Cortar Discovery inicial y focalizado; reconciliar frontera, vistos y brechas en reanudación. |
| [REQ-DIS-001.3](../catalogo-requisitos.md#req-dis-0013) | E4/E8 | Inventario independiente de controles, etiquetas, tablas, filtros, paginación y validaciones en SPA, incluidos estados de URL idéntica. |
| [REQ-DIS-001.4](../catalogo-requisitos.md#req-dis-0014) | E4/E8 | Probar hydration con lecturas acreditadas asociadas a vista/revisión y cero mutaciones en exploración. |
| [REQ-DIS-001.5](../catalogo-requisitos.md#req-dis-0015) | E2/E4/E8 | Comparar dos roles/configuraciones y perfiles de igual rol con derechos distintos; distinguir 403 incierto de restricción de rol probada. |
| [REQ-DIS-001.6](../catalogo-requisitos.md#req-dis-0016) | E4 | Correlacionar navegación observada con grafo y denegar promoción de arista de negocio sin fuente acreditada. |
| [REQ-DIS-001.7](../catalogo-requisitos.md#req-dis-0017) | E3/E4 | Reanudar ámbito efectivo y reabrir solo el fragmento invalidado por drift. |
| [REQ-DIS-001.8](../catalogo-requisitos.md#req-dis-0018) | E3/E4 | Terminar árbol del HOST con lotes listos; completar observación autorizada y conservar pausas por razonamiento. |
| [REQ-DOC-001.1](../catalogo-requisitos.md#req-doc-0011) | E4/E8 | Corpus D10 por formato y clase, con anotación independiente de estructura, texto, tablas, versión y localizadores. |
| [REQ-DOC-001.2](../catalogo-requisitos.md#req-doc-0012) | E4/E8 | Sembrar páginas escaneadas, regiones ilegibles y omisiones; medir por unidad esperada/emitida e impedir uso de insumo insuficiente. |
| [REQ-DOC-001.3](../catalogo-requisitos.md#req-doc-0013) | E4 | Verificar los cuatro estados de conciliación, incluido documentado/no observado que sigue pendiente. |
| [REQ-DOC-001.4](../catalogo-requisitos.md#req-doc-0014) | E4/E5 | Probar vigencia, alcance y primacía de fuente acreditada; bloquear contradicción material de autoridad no resuelta. |
| [REQ-IA-001.1](../catalogo-requisitos.md#req-ia-0011) | E1/E3 | Validar solicitud tipada y propuesta vigente; rechazar revisión vieja y cambios de autoridad. |
| [REQ-IA-001.2](../catalogo-requisitos.md#req-ia-0012) | E3/E5 | Ejecutar replay/regresión congelados con cero inferencia, linaje intacto y cuenta verificable. |
| [REQ-IA-001.3](../catalogo-requisitos.md#req-ia-0013) | E1/E3/E4 | Denegar artefactos inválidos o sin autoridad en escenarios, diagnóstico, oráculos y reparaciones. |
| [REQ-IA-001.4](../catalogo-requisitos.md#req-ia-0014) | E3 | Desconectar HOST, drenar cola y reclamar razonamiento con otro HOST compatible sin repetir trabajo. |
| [REQ-IA-001.5](../catalogo-requisitos.md#req-ia-0015) | E5/E7 | Alterar un byte en copia controlada y comprobar rechazo uniforme en MCP y CLI. |
| [REQ-IA-001.6](../catalogo-requisitos.md#req-ia-0016) | E1/E3 | Dobles de contrato y funcionamiento instalado HOST y DETERMINISTIC sin servicio MANAGED ni proveedor adicional. |
| [REQ-PLN-001.1](../catalogo-requisitos.md#req-pln-0011) | E1/E4 | Vincular revisión de plan, ejecución, datos y caso con snapshot reproducible. |
| [REQ-PLN-001.2](../catalogo-requisitos.md#req-pln-0012) | E4 | Ejercer inventario parcial y mostrar ramas ejecutables y brechas sin inventar reglas. |
| [REQ-PLN-001.3](../catalogo-requisitos.md#req-pln-0013) | E4 | Con presupuesto pareado reproducir prioridad por riesgo, impacto de drift e historial. |
| [REQ-PLN-001.4](../catalogo-requisitos.md#req-pln-0014) | E4/E5/E8 | Ejecutar tres módulos y dos identidades con variables tipadas y rechazar ciclo sin abrir navegador. |
| [REQ-PLN-001.5](../catalogo-requisitos.md#req-pln-0015) | E1/E4/E7 | Rechazar cambio de revisión/huella/caducidad en ambos canales antes de efectos. |
| [REQ-PLN-001.6](../catalogo-requisitos.md#req-pln-0016) | E3/E4/E5 | Bloquear dependientes ante fallo y conservar ramas independientes y sus hechos. |
| [REQ-CAS-001.1](../catalogo-requisitos.md#req-cas-0011) | E3/E4 | Ejecutar casos ordinarios elegibles automáticamente; declarar ámbito y causa de permisos/fuentes ausentes. |
| [REQ-CAS-001.2](../catalogo-requisitos.md#req-cas-0012) | E4/E5 | Cubrir positivos, negativos, límites, estados, RBAC y cálculo con oráculos acreditados. |
| [REQ-CAS-001.3](../catalogo-requisitos.md#req-cas-0013) | E4/E5 | Reparar localizador mediante revisión que preserve identidad, expectativa e intento. |
| [REQ-CAS-001.4](../catalogo-requisitos.md#req-cas-0014) | E4/E5 | Variantes por ámbito, autorización y aplicabilidad acreditada; indeterminar expectativa sin fuente y evitar PASS funcional. |
| [REQ-CAS-001.5](../catalogo-requisitos.md#req-cas-0015) | E4/E5 | Deduplicar equivalentes y marcar dependientes obsoletos al retirar regla, preservando intentos. |
| [REQ-ORA-001.1](../catalogo-requisitos.md#req-ora-0011) | E5/E7 | Reproducir seis veredictos, cuatro ejes, reducciones, fases, códigos y semántica equivalente MCP/CLI. |
| [REQ-ORA-001.2](../catalogo-requisitos.md#req-ora-0012) | E5/E8 | 201 seguido de rollback con testigo suficiente produce FAIL; testigo insuficiente sin PASS funcional. |
| [REQ-ORA-001.3](../catalogo-requisitos.md#req-ora-0013) | E5/E8 | Recarga limpia, observaciones secundarias y conciliación con causalidad e independencia; rechazar canal de causa común. |
| [REQ-ORA-001.4](../catalogo-requisitos.md#req-ora-0014) | E5/E8 | Conciliar centavo y redondeos por regla de negocio exacta, escala y tolerancia acreditadas. |
| [REQ-ORA-001.5](../catalogo-requisitos.md#req-ora-0015) | E5/E8 | Comparar inicial/final de denegación y detectar efecto oculto con testigo independiente. |
| [REQ-ORA-001.6](../catalogo-requisitos.md#req-ora-0016) | E5 | Separar eventualidad, expiración contractual y error de adquisición, con reloj y presupuesto congelados. |
| [REQ-ORA-001.7](../catalogo-requisitos.md#req-ora-0017) | E5/E7 | Persistir por afirmación nivel, fuente, alcance, vigencia y dependencia incluso si hay conflicto o insuficiencia. |
| [REQ-RUN-001.1](../catalogo-requisitos.md#req-run-0011) | E3/E5 | Aislar cookies/storage y permitir continuidad autorizada solo dentro del flujo e identidad acreditados. |
| [REQ-RUN-001.2](../catalogo-requisitos.md#req-run-0012) | E1/E5/E7 | Rechazar snapshot vencido, alterado o de otro contexto antes de iniciar navegador o efecto. |
| [REQ-RUN-001.3](../catalogo-requisitos.md#req-run-0013) | E5/E7 | Mantener resultado técnico, veredicto, cleanup y evidencia separados ante 201/rollback y falla de limpieza. |
| [REQ-RUN-001.4](../catalogo-requisitos.md#req-run-0014) | E3/E5 | Interrupción entre despacho y respuesta, reconciliación durable y cero duplicación. |
| [REQ-RUN-001.5](../catalogo-requisitos.md#req-run-0015) | E3/E5/E7 | Revocar en vuelo, admitir según recursos/autoridad y conservar trabajo independiente. |
| [REQ-RUN-001.6](../catalogo-requisitos.md#req-run-0016) | E5/E6/E7 | Cortar publicación, recuperar exactamente cada intento confirmado y detectar media ajena o alterada. |
| [REQ-DAT-001.1](../catalogo-requisitos.md#req-dat-0011) | E5 | Etiquetar sintéticos por intento y vencimiento, acreditar ausencia de PII no autorizada. |
| [REQ-DAT-001.2](../catalogo-requisitos.md#req-dat-0012) | E5/E8 | Preparar DAG UI/conector, comprobar efecto/reconciliación y limpiar en orden inverso con trazabilidad. |
| [REQ-DAT-001.3](../catalogo-requisitos.md#req-dat-0013) | E2/E5/E8 | Denegar escritura en producción o fuera de QA, incluso aparente lectura; mantener lectura acreditada. |
| [REQ-DAT-001.4](../catalogo-requisitos.md#req-dat-0014) | E5 | Eliminar lo propio, ejecutar dos limpiezas idempotentes y preservar terceros; probar compensación/confinamiento autorizado por separado. |
| [REQ-CAM-001.1](../catalogo-requisitos.md#req-cam-0011) | E3/E4/E5/E8 | Recorrido autónomo desde intención y autorización hasta aprendizaje/regresión con efecto y evidencia, sin editar código o infraestructura del AUT. |
| [REQ-CAM-001.2](../catalogo-requisitos.md#req-cam-0012) | E3/E5 | Bloqueo de rama por permiso o dependencia sin detener hermanas independientes. |
| [REQ-CAM-001.3](../catalogo-requisitos.md#req-cam-0013) | E3/E5 | Agotar presupuesto, materializar parcial, conservar obligaciones y punto reanudable con brechas. |
| [REQ-CAM-001.4](../catalogo-requisitos.md#req-cam-0014) | E2/E3 | Terminar árbol HOST y ejecutor por separado, reclamar lease/generación y rechazar segundo escritor. |
| [REQ-CAM-001.5](../catalogo-requisitos.md#req-cam-0015) | E3/E4/E5 | Cambiar exploración/regresión/investigación preservando campaña, revisiones y estado. |
| [REQ-REP-001.1](../catalogo-requisitos.md#req-rep-0011) | E5/E6/E7 | Publicar por ambos canales manifiesto verificado y evidencia saneada por intento/paso/rol con disponibilidad independiente. |
| [REQ-REP-001.2](../catalogo-requisitos.md#req-rep-0012) | E6/E7 | Comparar ejecuciones tras poda, abrir export offline y conservar hashes, anclas, estados y veredictos. |
| [REQ-REP-001.3](../catalogo-requisitos.md#req-rep-0013) | E5 | Deduplicar firma por ámbito y producir paquete reproducible; distinguir error de entorno/datos/sesión/automatización y defecto probado. |
| [REQ-REP-001.4](../catalogo-requisitos.md#req-rep-0014) | E5 | Reproducir, no reproducir, bloquear y verificar corrección mediante nuevos intentos, con fallo original conservado. |
| [REQ-REG-001.1](../catalogo-requisitos.md#req-reg-0011) | E4/E5 | Sembrar drift DOM/API/configuración y validar selección explicada por dependencia y riesgo. |
| [REQ-REG-001.2](../catalogo-requisitos.md#req-reg-0012) | E5 | Alternar resultados misma revisión/snapshot y detectar inestabilidad preservando serie. |
| [REQ-REG-001.3](../catalogo-requisitos.md#req-reg-0013) | E4/E5 | Reparar selector con revisión posterior, mismo oráculo y evidencia histórica intacta. |
| [REQ-SEG-001.1](../catalogo-requisitos.md#req-seg-0011) | E1/E2/E5/E7 | Denegación por defecto en canales/auxiliares; demostrar independencia ocho autoridades operativas y cuatro multimedia. |
| [REQ-SEG-001.2](../catalogo-requisitos.md#req-seg-0012) | E2/E5 | Cambiar origen/identidad/tenant durante operación y bloquear transición; probar redirección por semántica/autoridad efectiva. |
| [REQ-SEG-001.3](../catalogo-requisitos.md#req-seg-0013) | E2/E5/E6 | Revocación desde otro proceso y en vuelo, persistente al reconectar y confinada al grant; reconciliar solo con autoridad propia. |
| [REQ-SEG-002.1](../catalogo-requisitos.md#req-seg-0021) | E2/E6/E7 | Alta usuario local y CI sin TTY con referencias opacas y canarios ausentes de canales, backups aplicables y artefactos. |
| [REQ-SEG-002.2](../catalogo-requisitos.md#req-seg-0022) | E2/E4/E5 | Pérdida de sesión requerida detiene rama sin identidad sustituta ni fallback anónimo. |
| [REQ-SEG-002.3](../catalogo-requisitos.md#req-seg-0023) | E2/E5/E6/E8 | Separar captura, acceso, conservación y export. Renovar/revocar ≤30d, acreditar primera escritura y supresión previa; verificar export privado excepcional y denegación predeterminada. |
| [REQ-INT-001.1](../catalogo-requisitos.md#req-int-0011) | E1/E7 | Ejecutar snapshot equivalente por MCP/CLI con mismos permisos, memoria, casos, datos, veredictos, reportes y códigos previstos. |
| [REQ-INT-001.2](../catalogo-requisitos.md#req-int-0012) | E1/E7 | Instalar paquete limpio en Windows/macOS/Linux, doctor, navegador a demanda y compuerta de tipos. |
| [REQ-INT-001.3](../catalogo-requisitos.md#req-int-0013) | E1/E2/E7 | Cambiar adaptador por puerto de contrato sin tocar dominio; comprobar extensibilidad a persistencia compartida diferida. |
| [REQ-INT-001.4](../catalogo-requisitos.md#req-int-0014) | E1/E5/E7 | Registrar/revocar conectores, OpenAPI y UTCP autorizados y versiones incompatibles, con única autoridad. |
| [REQ-XINST-001](../catalogo-requisitos.md#req-xinst-001) | E2/E4/E5/E8 | Lectura cross-instancia por identidades separadas, testigo de cero efectos, mínimo transferido, procedencia y control de redirección/egress. |
| [REQ-QA-001](../catalogo-requisitos.md#req-qa-001) | E4/E5/E8 | Locales y cambio de idioma en ejecución; traducción ausente/truncamiento, fecha/moneda/decimal/zona y replay sin inferencia. |
| [REQ-QA-002](../catalogo-requisitos.md#req-qa-002) | E4/E5/E8 | Validar contrato API sano/incompatible por operación/revisión. Verificar efecto con testigo suficiente cuando se ejerce, uso autorizado por caso. |
| [REQ-QA-003](../catalogo-requisitos.md#req-qa-003) | E6/E7/E8 | Separar capacidad AUT y producto QAP, estados dinámicos, controles sanos/mutantes y revisión manual bajo CV08-09. |
| [REQ-AGT-001](../catalogo-requisitos.md#req-agt-001) | E3/E7/E8 | Cuatro HOST reales y otros clientes representativos, rutas, finalización autónoma, tokens y suites legítimas sin bloqueo. |
| [REQ-AUTREP-001](../catalogo-requisitos.md#req-autrep-001) | E4/E5/E8 | D11 por clase: flujos de filtros/fechas/agrupación, bytes de PDF/Excel, filas/celdas/multihoja/multipágina, tres planos, totales, discrepancias, abstención fundada. |
| [REQ-RUN-002.1](../catalogo-requisitos.md#req-run-0021) | E4/E6/E7/E8 | 1a preferencias conversacionales persistentes por proyecto (modo, navegador, grabación y recursos). 1b paridad en modos visibles/headless de CSS/JS/imágenes/fuentes e hidratación; registrar degradación, sin opción de desactivar fidelidad. |

## Políticas

| Entrada | Evidencia E | Unidad candidata de prueba y criterio mínimo |
| --- | --- | --- |
| [POL-CAP-001](../catalogo-requisitos.md#políticas-adicionales-de-captura-y-retención) | E2/E5/E6/E8 | Ejercer tres modos, cuatro grants y transición revocada; demostrar custodia de temporales y supresión preventiva en matriz, acceso/export autorizados por política. |
| [POL-RET-001](../catalogo-requisitos.md#políticas-adicionales-de-captura-y-retención) | E2/E6/E7 | Probar 90d detalle, resumen persistente, export/manual, archivo opcional, activos/fallos protegidos, eventos y plazos autorizados. Probar export sin traza física por todos los formatos exigidos. |

## Ampliaciones

| Entrada | Evidencia E | Unidad candidata de prueba y criterio mínimo |
| --- | --- | --- |
| [REQ-AGT-002](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E3/E7 | Desde otro chat/HOST una consulta acotada recupera cobertura, permisos, IDs, próxima acción y omisiones; negar otro ámbito y medir tokens. |
| [REQ-ONB-001](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E1/E6/E7 | Tres SO, instalación y doctor idempotentes sin depender del AUT, descarga gestionada, proxy/CA y fixture loopback con medios autorizados y cero procesos residuales. |
| [REQ-OPT-001](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E3/E5/E7/E8 | Probar W=1/2/4 y admisión según conflictos/presión/reserva; alternar tres, cuatro o más apps con límites y cero navegador o locks propios en reposo; medir hardware. |
| [REQ-OPT-002](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E2/E4 | Comparar bytes, tokens y cobertura al compactar contexto/snapshots; preservar procedencia, estado, omisiones y evidencia activa. Dry-run sin escribir ni retener handles. |
| [REQ-E2E-001](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E3/E4/E5/E8 | Tres módulos, dos roles, variables tipadas, efecto confirmado y corte; recuperar sin duplicación. Replay sin inferencia con evidencia por paso. |
| [UTCP/OpenAPI](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E1/E4/E5 | Preparar prerrequisitos por ambas descripciones desde puerto común. Perder respuesta, reconciliar y limpiar con referencia acreditada inmutable. |
| [M1](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E6/E7 | Mismo DTO y IDs en visor HTTP, HTML MCP/CLI/flujo y resumen Markdown, controles accesibles, CSS/iconos/fuentes locales. |
| [M2](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E6 | Export trasladado a ruta con espacios/acentos sin red ni server. PNG de viewport/elemento/página completa con escala/fallback, anclas y medios autorizados. |
| [M3](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E6 | WebM auténtico con geometría y offsets por paso, hash y códec. Decodificar desde primer cuadro; canarios sensibles, revocación y descarte verificado tras reinicio. |
| [M4](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E6/E7 | Acceso autenticado por catálogo, GET/HEAD, rango 206/416 y MIME, seek/fullscreen, revocación en reproducción, reinicio y export portátil. |
| [M5](../catalogo-requisitos.md#ampliaciones-de-la-línea-base) | E6/E8 | Paquete y export trasladado en navegador real con baseline visual fijado, teclado, canarios y diagnóstico por evidencia faltante. |

## Obligaciones transversales que deben materializarse en el manifiesto

| Fuente | Proyección mínima en el manifiesto |
| --- | --- |
| AV-01 · D01–D21 | Separar RF/RNF/POL, promociones y ampliaciones sin cambiar fuerza normativa. Agregar a CAS/SEG/CAM pruebas independientes de ocho autoridades, cero edición del AUT/infraestructura, revocación confinada y efecto posterior con su propio permiso. Mantener originales de fuentes y precedencia. [Dictamen](dictamen-av01.md) |
| AV-02 · Custodia y proceso | E2/E6 con cuatro grants, cuenta/dispositivos auxiliares, custodia real y falta de autorización. Revocación durable bidireccional, protección antes de primera escritura y modelo de amenaza de staging/temporales. EXP-06a/c, EXP-07 y remediación AR-24/40. [Decisión](decision-orquestador-av02-encargo-av03.md) · [Fe AR-27](fe-correcciones-ar27.md) |
| AV-03 · Autonomía, memoria y protocolo | Dos lotes y diez casos listos en E3, muerte del árbol HOST y muerte de ejecutor en momentos separados, reclamo por otro HOST de razonamiento, escritor/generación y ausencia de inferencia en replay. Handshake, rutas canónicas y continuidad por host. [Decisión](decision-orquestador-av03-encargo-av04.md) |
| AV-04 · Veracidad, E2E y datos | Tabla AR-52/AV-04 con seis veredictos, cuatro ejes, fases y códigos, prioridad por afirmación, estados mixtos y fallos técnicos. Controles sanos y N0–N3/independencia contra rollback, caché/SW/estado optimista, centavo, falta de efecto y timeout. DataPlan con intención/dedupe/reconciliación y cleanup separado. [Decisión](decision-orquestador-av04-encargo-av05.md) · [Enmiendas](enmiendas-av04.md) |
| AV-05 · D10/D11 y autoridad API | D10 por formato (PDF, DOCX, Excel, Markdown, texto, JSON, YAML y OpenAPI), con clase, localizador, escaneado/OCR y omisiones; cero conversiones manuales como ruta ordinaria. D11 PDF con tablas multipágina, Excel por clase (lectura y recálculo acreditado donde rija) y regla contable independiente, layout/filtros/lotes/roles y hallazgo localizado. Conectores OpenAPI/UTCP, cruces de destino y publicaciones portables con ancla externa. AR-20 bloquea por clase sin suficiencia. [Decisión](decision-orquestador-av05-encargo-av06.md) · [Protocolos](protocolos-av05.md) |
| AV-06 · Fidelidad, recursos y medios | Matriz por SO, arquitectura, canal/engine, modalidad, permiso y superficie. Identificar Chromium Shell, Chromium, Chrome, Edge, Firefox y WebKit, estados de candidato o acreditado por celda, y diferencias de alcance. Acreditar instalación bajo demanda y ambos modos obligatorios, medición pareada/no degradación, prevención en primer cuadro, export offline y accesibilidad. [Decisión](decision-orquestador-av06-encargo-av07.md) · [Matriz](matriz-av06.md) |
| AV-07 · Reconstrucción, licencias y corte | Pruebas de paquete firmado/identificable y procedencia/licencias admisibles, seis clases SQLite/cinco familias, prevención efectiva de autoridad legacy y doble escritor, rollback o recuperación hacia delante sin perder escrituras/revocaciones. G5 ensaya en fixture; G6.5 acredita piloto y el corte se autoriza por proyecto. [Decisión](decision-orquestador-av07-av08.md) · [Compuertas](compuertas-av07.md) |

## Conciliación con el acta del propietario

La cobertura transversal se acredita además por decisión. Los grupos siguientes indexan pruebas y no sustituyen sus filas ni la revisión de la decisión.

| Decisión | Prueba representativa de que se preserva el alcance |
| --- | --- |
| D01 | Candidato instalado completa el ciclo empresarial representativo con efectos y soporte operativo. G6 y G6.5 alimentan una salida explícita. |
| D02 | Ejecución local durable en cuentas y ámbitos aislados, sin infraestructura adicional obligatoria. Puerto para repositorio compartido futuro. |
| D03 | HOST razona, el carril determinista autorizado continúa tras caída y replay produce cero inferencias, con cola pendiente recuperable. |
| D04 | CAM-001.1 de intención a aprendizaje y regresión. Cero aprobaciones ordinarias por caso, con controles que sí exigen bloqueo por autoridad. |
| D05 | MEM/DIS/REG distinguen cuatro planos, revisiones, precedencia, cambios e historia y entregan handoff limitado a alcance. |
| D06 | E2E con DataPlan, roles, módulos, estados y efectos probados, continuidad y cleanup; controles de corte tras efecto. |
| D07 | SEG/DAT comparan autoridad efectiva de QA mutable, producción lectura y destino prohibido. Revocar en vuelo y acreditar ausencia de efecto indebido. |
| D08 | Ejecutar preparación OpenAPI y UTCP, pérdida de respuesta, reconciliación y operaciones fuera de alcance rechazadas. Uso por caso opcional. Sin requerir conexión directa a BD AUT. |
| D09 | Dos identidades efectivas distinguen destino mutable y referencia inmutable. Mínimo transferido con procedencia, sin reusar credenciales. |
| D10 | DOC y EXP-06b por formato/clase, fuente ilegible/obsoleta, localizadores y conciliación de cuatro estados sin elevar hipótesis. |
| D11 | AUTREP valida registros y totales, filtros, cálculo, bytes y población real, con evidencia independiente de oráculos y tres planos Excel. |
| D12 | Cuatro ejes y seis veredictos independientes de ACK. E5 falsifica 201/rollback y falta de testigo, sin certificar estructura como efecto. |
| D13 | Cuatro HOST reales y clientes adicionales representativos, equivalencia CLI, adopción y cero bloqueo de suites legítimas; soporte limitado a builds acreditados. |
| D14 | Windows, macOS y Linux instalados, canales/CPU/modos por matriz, doctor y navegador bajo demanda. Clasificar candidatos por capacidad. |
| D15 | RUN-002.1 conserva preferencia por proyecto y por lenguaje natural sin preguntar de nuevo innecesariamente, fidelidad en ambos modos y aviso de degradación. |
| D16 | REQ-OPT-001, EXP-03 y CV08-06 prueban presión, procesos, alternancia, recursos en reposo y mínimo/recomendado por modalidad con mediciones. |
| D17 | QA-001 verifica instrucciones y resultados en idioma solicitado, cambio y persistencia de locale, códigos invariantes y representaciones equivalentes. Cubrir corpus más allá de asumir solo español e inglés. |
| D18 | POL-CAP, SEG-002.3 y M2–M5 demuestran PNG/WebM auténticos, custodia previa, supresión y cuatro grants. Activación separada por DE-02. |
| D19 | POL-RET verifica detalle 90d, resumen, archivo, poda, historia inmutable y evidencia disponible aparte. TTL pesados sujetos a política. |
| D20 | SEG y M4 prueban altas opacas, ausencia de secretos en canales, revocación duradera, visor autenticado con catálogo y rangos, CORS y almacenamiento protegido. |
| D21 | Manifiesto normativo completo, generalización ciega independiente, pisos ratificados, cero vetos, piloto G6.5 y límites de validez externa. |
