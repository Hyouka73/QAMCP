# Registro maestro de recomendaciones QAP

Unidad de conteo: una obligación, corrección, riesgo o decisión verificable con criterio de cierre propio. Un alias puede remitir a varios registros cuando la fuente agrupa obligaciones independientes. Varias fuentes se consolidan bajo un solo registro cuando demandan la misma evidencia. La validación de una comprobación documental tiene el alcance indicado en su registro.

N = [Neon](auditoria-neon.md). A = [Antigravity](auditoria-antigravity.md). Orq = encargo «Cierre de recomendaciones y auditoría específica AV-01». E = [evidencia archivada](../evidencia-archivada.md). H-REV = [revisión independiente anterior](../revision-independiente.md). D = [acta del propietario](../acta-decisiones.md). El índice de alias contiene localizadores de las entradas numeradas. Las fases son propuestas de resolución, sujetas a autorización.

Las funciones de revisión figuran en cada entrada. Las asignaciones nominativas vigentes constan en la [matriz de auditorías](asignacion-auditorias.md). Severidad crítica implica posible compromiso de veracidad, autoridad, privacidad o integridad. Alta implica brecha material de alcance o contrato. Media implica procedencia, precisión o decisión parcial. BLOQUEANTE bloquea el contrato, capacidad o compuerta indicada en la fila.

**Vigencia posterior:** [Acta DE](acta-ratificacion-de.md), [especificación](../especificacion-consolidada.md) y [matriz consolidada](matriz-consolidada-ar.md). Menciones históricas de elección DE pendiente superadas por políticas A/B/B/A con B respaldo/B; condiciones técnicas, permisos, activación y pruebas pendientes. Las decisiones AV-01–08 resuelven reservas de decisión documental; estados principales conservados.

## Distribución por auditoría

| Principal | Total | Crítica | Alta | Media | Registros | Contravalidador propuesto |
| --- | --- | --- | --- | --- | --- | --- |
| AV-01 · Integridad y cobertura de requisitos | 6 | 0 | 3 | 3 | [AR-01](registro-maestro.md#ar-01), [AR-02](registro-maestro.md#ar-02), [AR-03](registro-maestro.md#ar-03), [AR-04](registro-maestro.md#ar-04), [AR-55](registro-maestro.md#ar-55), [AR-56](registro-maestro.md#ar-56) | Revisor de requisitos independiente, designado por el Orquestador |
| AV-02 · Seguridad, privacidad y autenticidad | 10 | 5 | 5 | 0 | [AR-07](registro-maestro.md#ar-07), [AR-14](registro-maestro.md#ar-14), [AR-24](registro-maestro.md#ar-24), [AR-25](registro-maestro.md#ar-25), [AR-27](registro-maestro.md#ar-27), [AR-28](registro-maestro.md#ar-28), [AR-31](registro-maestro.md#ar-31), [AR-32](registro-maestro.md#ar-32), [AR-40](registro-maestro.md#ar-40), [AR-47](registro-maestro.md#ar-47) | Revisor de seguridad y privacidad independiente |
| AV-03 · Autonomía, memoria, persistencia e interoperabilidad MCP/CLI | 8 | 0 | 6 | 2 | [AR-05](registro-maestro.md#ar-05), [AR-11](registro-maestro.md#ar-11), [AR-12](registro-maestro.md#ar-12), [AR-15](registro-maestro.md#ar-15), [AR-42](registro-maestro.md#ar-42), [AR-45](registro-maestro.md#ar-45), [AR-46](registro-maestro.md#ar-46), [AR-52](registro-maestro.md#ar-52) | Revisor independiente de ejecución y contratos MCP/CLI |
| AV-04 · Veracidad funcional, oráculos, E2E, datos mutativos y recuperación | 5 | 3 | 2 | 0 | [AR-08](registro-maestro.md#ar-08), [AR-09](registro-maestro.md#ar-09), [AR-10](registro-maestro.md#ar-10), [AR-43](registro-maestro.md#ar-43), [AR-53](registro-maestro.md#ar-53) | Revisor independiente de oráculos y datos de prueba |
| AV-05 · Documentos, reportes PDF/Excel, UTCP, OpenAPI y cross-instancia | 8 | 2 | 6 | 0 | [AR-13](registro-maestro.md#ar-13), [AR-17](registro-maestro.md#ar-17), [AR-18](registro-maestro.md#ar-18), [AR-20](registro-maestro.md#ar-20), [AR-22](registro-maestro.md#ar-22), [AR-38](registro-maestro.md#ar-38), [AR-48](registro-maestro.md#ar-48), [AR-50](registro-maestro.md#ar-50) | Revisor independiente de documentos, contabilidad e interoperabilidad |
| AV-06 · Navegadores, fidelidad visual, concurrencia, rendimiento y compatibilidad | 6 | 0 | 5 | 1 | [AR-16](registro-maestro.md#ar-16), [AR-29](registro-maestro.md#ar-29), [AR-36](registro-maestro.md#ar-36), [AR-37](registro-maestro.md#ar-37), [AR-39](registro-maestro.md#ar-39), [AR-49](registro-maestro.md#ar-49) | Revisor independiente de navegadores, recursos y compatibilidad |
| AV-07 · Reconstrucción selectiva, dependencias, licencias y migración | 10 | 1 | 5 | 4 | [AR-19](registro-maestro.md#ar-19), [AR-21](registro-maestro.md#ar-21), [AR-23](registro-maestro.md#ar-23), [AR-26](registro-maestro.md#ar-26), [AR-33](registro-maestro.md#ar-33), [AR-34](registro-maestro.md#ar-34), [AR-41](registro-maestro.md#ar-41), [AR-51](registro-maestro.md#ar-51), [AR-54](registro-maestro.md#ar-54), [AR-57](registro-maestro.md#ar-57) | Revisor independiente de arquitectura, licencias y distribución |
| AV-08 · Aceptación del producto, métricas, validación empresarial y lanzamiento | 4 | 0 | 3 | 1 | [AR-06](registro-maestro.md#ar-06), [AR-30](registro-maestro.md#ar-30), [AR-35](registro-maestro.md#ar-35), [AR-44](registro-maestro.md#ar-44) | Custodio/revisor de aceptación independiente de implementación |
| Total | 57 | 11 | 35 | 11 |  |  |


## Estados vigentes

| Estado principal | Registros |
| --- | --- |
| BLOQUEANTE | 8 |
| PENDIENTE | 26 |
| VALIDACIÓN EXPERIMENTAL PENDIENTE | 17 |
| VALIDADA | 6 |
| Total | 57 |

Los estados principales son excluyentes y se conservan en 57 entradas (6 validadas, 17 validación experimental pendiente, 26 pendientes, 8 bloqueantes; no se alteran estados por mera entrega o aceptación documental). Hay seis cierres documentales de AV-01 y AR-04 añade validación pendiente dentro de ese grupo. En AV-02, el Orquestador aceptó las invariantes de diseño para continuar las auditorías con reservas y diez expedientes experimentales pendientes ([Decisión AV-02 y encargo AV-03](decision-orquestador-av02-encargo-av03.md)); AR-27 conserva `VALIDACIÓN EXPERIMENTAL PENDIENTE` con compuertas específicas ([Fe de correcciones AR-27](fe-correcciones-ar27.md)) y AR-24/40 condicionan G0. En AV-03, Antigravity publicó el [informe principal](informe-av03.md) sobre `e2a7ee95` cubriendo los ocho registros asignados (`AR-05`, `AR-11`, `AR-12`, `AR-15`, `AR-42`, `AR-45`, `AR-46`, `AR-52`); Codex publicó el [dictamen independiente](dictamen-av03.md), las [enmiendas](enmiendas-av03.md) y los [protocolos](protocolos-av03.md). Se contrastaron 5 hallazgos y 8 objeciones en los 8 registros de AV-03. Los estados principales de AV-03 permanecen en 6 pendientes y 2 en validación experimental pendiente. El [Orquestador aceptó el diseño enmendado AV-03 con reservas](decision-orquestador-av03-encargo-av04.md). Siguen pendientes selección, implementación y certificación. DE-01 a DE-05 siguen abiertas en sus aspectos sin ratificar.

En AV-04, [Neon publicó el informe principal](informe-neon-av04.md) y Codex contrastó cinco registros, ocho objeciones y las fronteras AR-05/52 en el [dictamen](dictamen-av04.md), las [enmiendas](enmiendas-av04.md) y los [protocolos](protocolos-av04.md). [Diseño enmendado aceptado por el Orquestador](decision-orquestador-av04-encargo-av05.md) con reservas y pruebas pendientes. Cinco entradas principales conservan tres bloqueantes y dos pendientes. Las pruebas E1/E3/E4/E5/E7/E8 y dependencias de integración siguen abiertas. AR-05/52 permanecen contabilizadas en AV-03.

En AV-05, Codex verificó las afirmaciones de [Neon](informe-neon-av05.md) en el SHA remoto e8a9fc453f0346c4b045a867e54c54c35d2ac3bb. El [dictamen](dictamen-av05.md) resuelve ocho objeciones con [enmiendas](enmiendas-av05.md), [evidencia](evidencia-av05.md) y [protocolos EXP-05a/b y EXP-06b](protocolos-av05.md). Diseño enmendado favorable con reservas, sujeto a decisión del Orquestador. Ocho estados principales permanecen: un bloqueante (AR-20), dos experimentales (AR-17/38) y cinco pendientes. Se mantienen DE-01–05 en sus aspectos abiertos.

En AV-06, Codex publicó el [informe principal](informe-av06.md), la [matriz](matriz-av06.md) y los [protocolos](protocolos-av06.md) sobre la base `7ccb713fea6331ee571010b7a32b90ade43b98f6`. El dictamen propone diseño con reservas, pendiente de contravalidación de Gemini Neon y decisión del Orquestador. Cinco estados experimentales y un pendiente se conservan.

En AV-07 se publica el [informe principal](informe-av07.md) sobre 45401c45f91b3cd4944f372491e3c3c9f12ec56d, con reconstrucción por módulo, mapa de escritores, inventario de dependencias y licencias, precedencia y DAG. Dictamen propuesto aprobable en diseño con reservas, pendiente de contravalidación independiente por ChatGPT High y decisión del Orquestador. Nueve registros pendientes y AR-41 bloqueante. Se mantienen los 57 estados, las condiciones aceptadas AV-01–06 y las decisiones DE-01–05 abiertas en los aspectos no ratificados.

## Expedientes y registros

## AV-01 · Integridad y cobertura de requisitos

### AR-01

**Problema y cierre.** Cotejar Entregas, Adenda y consolidación original con el catálogo vigente.

**Fuente y localizador.** N §2.1–2.3, §12; A §2.1, §2.3; [Fuentes recuperadas](fuentes-recuperadas/README.md). Localizadores por sección en la fuente.

**Requisitos afectados.** Todos los 82 de Etapa 3; 5 añadidos.

**Resolución.** Cinco textos recuperados y nueve obligaciones restauradas con criterios comprobables. [AR-01](dictamen-av01.md#ar-01).

**Criterio acreditado.** Véanse enlaces y verificación del dictamen.

**Responsable principal.** AV-01. **Dependencias.** Sin otra dependencia asignada. **Contravalidador.** Revisor de requisitos independiente, designado por el Orquestador.

**Severidad.** Alta. **Estado.** VALIDADA. **Fase.** Previo al cierre AV-01.

**Riesgo residual.** Identidad externa de las copias textuales sin firma binaria.

**Cierre documental.** Sí. **Experimental.** No aplica.

### AR-02

**Problema y cierre.** Usar criterios explícitos de clase primaria y etiquetas de cumplimiento, conservando toda obligación.

**Fuente y localizador.** N §2.3–2.4; A §2.3 / C-01. [C-01](#alias-c-01)

**Requisitos afectados.** REQ-QA-003, REQ-MEM-002.1, REQ-SEG-002.1.

**Resolución.** Clase por ID trazada y taxonomía objetivo justificada sin cuota. DE-05 abierta. [AR-02](dictamen-av01.md#ar-02).

**Criterio acreditado.** Véanse enlaces y verificación del dictamen.

**Responsable principal.** AV-01. **Dependencias.** AV-08 **Contravalidador.** Revisor de requisitos independiente, designado por el Orquestador.

**Severidad.** Media. **Estado.** VALIDADA. **Fase.** Previo al cierre AV-01.

**Riesgo residual.** La clase podría usarse para degradar cobertura de lanzamiento o duplicar IDs.

**Cierre documental.** Sí. **Experimental.** No aplica.

### AR-03

**Problema y cierre.** Incorporar referencia normativa completa para cada fila y conservar alias y precedencia. Asegurar que los resúmenes no sustituyan obligaciones.

**Fuente y localizador.** N §2.2–2.4, §3, §13.1; A §2.1–2.2. Localizadores por sección en la fuente.

**Requisitos afectados.** 87 IDs, 11 ampliaciones, 3 CAND, 2 políticas y 5 IDs propuestos.

**Resolución.** Las 92 fichas conservan alias, obligación y precedencia. Contratos técnicos sujetos a AV-02–AV-08. [AR-03](dictamen-av01.md#ar-03).

**Criterio acreditado.** Véanse enlaces y verificación del dictamen.

**Responsable principal.** AV-01. **Dependencias.** AV-02, AV-03, AV-04, AV-05, AV-06, AV-08 **Contravalidador.** Revisor de requisitos independiente, designado por el Orquestador.

**Severidad.** Alta. **Estado.** VALIDADA. **Fase.** Previo al cierre AV-01.

**Riesgo residual.** Riesgo de congelar una especificación incompleta o con procedencia insuficiente.

**Cierre documental.** Sí. **Experimental.** No aplica.

### AR-04

**Problema y cierre.** Conservar identidad, perfil opaco y variante. Representar locale, zona y moneda donde afecten aislamiento o replay. Separar configuración regional de clave de aislamiento cuando proceda.

**Fuente y localizador.** N §2.4.2, §6.A, §6.H; A §2.3 / C-01 / HA-04; Orq §6. [HA-04](#alias-ha-04), [C-01](#alias-c-01)

**Requisitos afectados.** REQ-MEM-002.1, REQ-QA-001, REQ-SEG-001.2.

**Resolución.** Sobre de cuatro planos con aislamiento por ProfileBinding cuando cambia autoridad bajo igual rol. [AR-04](dictamen-av01.md#ar-04).

**Criterio acreditado.** Véanse enlaces y verificación del dictamen.

**Responsable principal.** AV-01. **Dependencias.** AV-02, AV-03 **Contravalidador.** Revisor de requisitos independiente, designado por el Orquestador.

**Severidad.** Alta. **Estado.** VALIDADA. **Fase.** Previo al cierre AV-01.

**Riesgo residual.** Colisiones entre tenants, perfiles o replay regional con reglas y montos distintos.

**Cierre documental.** Sí. **Experimental.** Pendiente E2/E4 en G1/G2.

### AR-55

**Problema y cierre.** Reproducir cardinalidades y detectar duplicación por identidad.

**Fuente y localizador.** N §2.2–2.3; A §2.1; catálogo/Etapa 3. Localizadores por sección en la fuente.

**Requisitos afectados.** 82 originales, cinco añadidos, criterios de clase y cinco IDs propuestos.

**Resolución.** 82+5 históricos, 11 ampliaciones, 3 promociones, 2 políticas y D01–D21 comprobados. [AR-55](dictamen-av01.md#ar-55).

**Criterio acreditado.** Véanse enlaces y verificación del dictamen.

**Responsable principal.** AV-01. **Dependencias.** Sin otra dependencia asignada. **Contravalidador.** Revisor de requisitos independiente, designado por el Orquestador.

**Severidad.** Media. **Estado.** VALIDADA. **Fase.** AV-01, cotejo documental.

**Riesgo residual.** El conteo deja por comprobar equivalencia semántica completa y aceptación de producto.

**Cierre documental.** Sí. **Experimental.** No aplica.

### AR-56

**Problema y cierre.** Atribuir el mapeo 60/20/7 por ID a la Fe de erratas recuperada.

**Fuente y localizador.** N §2.1–2.3; A §2.3; [Fuentes recuperadas](fuentes-recuperadas/README.md). Localizadores por sección en la fuente.

**Requisitos afectados.** 87 IDs.

**Resolución.** Fe de erratas recuperada como procedencia del mapeo exacto por ID. [AR-56](dictamen-av01.md#ar-56).

**Criterio acreditado.** Véanse enlaces y verificación del dictamen.

**Responsable principal.** AV-01. **Dependencias.** AV-08 **Contravalidador.** Revisor de requisitos independiente, designado por el Orquestador.

**Severidad.** Media. **Estado.** VALIDADA. **Fase.** AV-01, revisión de taxonomía.

**Riesgo residual.** Identidad externa de las copias textuales sin firma binaria.

**Cierre documental.** Sí. **Experimental.** No aplica.

## AV-02 · Seguridad, privacidad y autenticidad

### AR-07

**Problema y cierre.** Entrada fuera de banda, revocación y vault multiplataforma/CI con paridad. Inventariar y retirar bypass y dependencia legacy según decisión respaldada.

**Fuente y localizador.** N DP-03, HN-04, §6.F; A HN-04, C-02; E AS-03, H-REV-02; D20. [DP-03](#alias-dp-03), [HN-04](#alias-hn-04), [C-02](#alias-c-02), [AS-03](#alias-as-03), [H05](#alias-h05), [H-REV-02](#alias-h-rev-02)

**Requisitos afectados.** REQ-SEG-002.1, REQ-MEM-002.5, REQ-INT-001.2.

**Evidencia disponible y discrepancia.** Neon subestima presencia efectiva de keytar. A cita manifiestos, lockfile y carga dinámica. Alternativas requieren verificación. Referencias: N DP-03, HN-04, §6.F. A HN-04, C-02. E AS-03, H-REV-02.

**Evidencia necesaria.** Inventario por SO, CI sin TTY, pruebas de permisos, ausencia de fuga y rotación sobre la opción seleccionada.

**Responsable principal.** AV-02. **Dependencias.** AV-03, AV-07 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Crítica. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Antes de seleccionar bóveda G0/G1.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-07](dictamen-av02.md#ar-07). Alta fuera de banda y KEK persistente sujeto a EXP-07. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

### AR-14

**Problema y cierre.** Definir evidencia de identidad efectiva y bloquear ante conflicto o falta de tenant requerido. Declaraciones no elevan autoridad.

**Fuente y localizador.** N DP-09, §6.A; A O-09; D02/D05/D07/D09/D20. [DP-09](#alias-dp-09)

**Requisitos afectados.** REQ-MEM-002.1–002.2, REQ-SEG-001.1–001.2, REQ-XINST-001.

**Evidencia disponible y discrepancia.** Neon propone precedencia. Depende de acreditación por destino y prevalencia normativa. Referencias: N DP-09, §6.A. A O-09.

**Evidencia necesaria.** Matriz de identidad, ambigüedad, desacuerdo y redirección con resultados iguales en MCP/CLI.

**Responsable principal.** AV-02. **Dependencias.** AV-03, AV-05 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Contrato de alcance previo a G1.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-14](dictamen-av02.md#ar-14). Identidad y tenant acreditados por destino, derechos efectivos y sesión vinculada. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

### AR-24

**Problema y cierre.** Autorizar operaciones y lecturas del visor por sesión, origen y catálogo, confinar rutas y caché. Conservar capacidad de reproducción autorizada.

**Fuente y localizador.** N HN-07, §6.F, §7; A HN-07, HA-01, C-04, §10.5; E AS-01/H-REV-01. [HN-07](#alias-hn-07), [HA-01](#alias-ha-01), [C-04](#alias-c-04), [AS-01](#alias-as-01), [H08](#alias-h08), [H09](#alias-h09), [H-REV-01](#alias-h-rev-01)

**Requisitos afectados.** REQ-SEG-001.1, REQ-REP-001.1, REQ-SEG-002.3.

**Evidencia disponible y discrepancia.** N destaca caché y confinamiento. A agrega rutas de API y mutaciones del visor; no se acreditó explotación en AV-01. Referencias: N HN-07, §6.F, §7. A HN-07, HA-01, C-04, §10.5. E AS-01/H-REV-01.

**Evidencia necesaria.** Revisión defensiva del contrato, controles de denegación independientes, caché no reutilizable y reproducción autorizada verificada.

**Responsable principal.** AV-02. **Dependencias.** AV-05, AV-06 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Crítica. **Estado.** BLOQUEANTE. **Fase.** Remediación propuesta G0.

**Riesgo residual.** Acceso o alteración de historia/evidencia desde un contexto sin autorización efectiva.

**Contravalidación.** [AR-24](dictamen-av02.md#ar-24). Visor autenticado y de solo lectura, apertura confinada y reproducción revocable. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente. Bloqueante de cierre G0.

### AR-25

**Problema y cierre.** Revocación privada prevalece sobre defectos abiertos y TTL; preservar resumen/veredicto y proteger actividad. Ratificar TTL, cuotas y comportamiento sin espacio.

**Fuente y localizador.** N HN-08, DE-01, §6.G; A HN-08, O-10, DE-01, §10.3; Orq §7; D19. [HN-08](#alias-hn-08), [O-10](#alias-o-10), [DE-01](#alias-de-01)

**Requisitos afectados.** REQ-MEM-003.5, REQ-REP-001.1–001.4, POL-CAP-001, POL-RET-001.

**Evidencia disponible y discrepancia.** Coinciden en precedencia. Continúan abiertas retención efectiva, cuotas y el efecto fuera del control de QAP. Referencias: N HN-08, DE-01, §6.G. A HN-08, O-10, DE-01, §10.3. Orq §7.

**Evidencia necesaria.** Acta DE-01 y escenarios de expiración, revocación, disco lleno, simulación no mutativa y conservación del historial.

**Responsable principal.** AV-02. **Dependencias.** AV-05, AV-07, AV-08 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Contrato antes de cerrar custodia.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-25](dictamen-av02.md#ar-25). Retención histórica y reserva por volumen sin poda por cuota de evidencia protegida. DE-01 abierta. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

### AR-27

**Problema y cierre.** Cifrado desde primera escritura, ACL complementarias, prevención distinguiendo contención y descarte, cobertura de todos los temporales y supresión ante brecha. Reproducción autorizada y recuperación.

**Fuente y localizador.** N HN-02, §6.F, EXP-06; A HN-02, O-01, C-04, §10.3; Orq §7; E AS-04, H-REV-04. [HN-02](#alias-hn-02), [O-01](#alias-o-01), [C-04](#alias-c-04), [AS-04](#alias-as-04), [EXP-06](#alias-exp-06), [EXP-06a](#alias-exp-06a), [H10](#alias-h10), [H-REV-04](#alias-h-rev-04)

**Requisitos afectados.** REQ-SEG-002.3, POL-CAP-001, REQ-RUN-001.6, REQ-REP-001.1.

**Evidencia disponible y discrepancia.** AS-04 reprodujo el canario de MFA en WebM tras una transición SPA sin tráfico de red. La inspección de Playwright 1.62.1 acredita que `screencast.start({ path })` escribe en `artifactsDir` antes de copiar al destino solicitado. El formato AEAD propio queda retirado. [Fuentes y cobertura](fe-correcciones-ar27.md#4-capturadores-y-cobertura).

**Evidencia necesaria.** EXP-06a/c sobre frontera preventiva, custodia desde la primera escritura, contención, recuperación, revocación y controles positivos de video empresarial, búsqueda y fidelidad. [Protocolos corregidos](protocolos-exp-06-ac.md).

**Responsable principal.** AV-02. **Dependencias.** AV-05, AV-06 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Crítica. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** EXP-06a verifica viabilidad y selección al cierre G0/apertura G1. EXP-06c/E6 verifica visor y paquete de producto en G3/G5.

**Riesgo residual.** Información inesperada en superficie admitida, copias ya entregadas y persistencia en RAM, swap, volcados, snapshots o respaldos. Las transiciones prohibidas conocidas sin barrera previa requieren supresión anticipada. DE-02 pendiente.

**Contravalidación.** Invariantes aceptados, con C como candidata del Orquestador y A como respaldo. **Planificación.** Se puede planificar el trabajo con ambas rutas. Sigue bloqueado congelar el diseño definitivo hasta demostrar una vía compatible con la cobertura obligatoria. **Ejecución.** EXP-06a bloquea cierre G0/apertura G1 para la implementación. **Activación privada.** Bloqueada hasta EXP-06a/c, cobertura acreditada y ratificación DE-02. [Dictamen AR-27](dictamen-av02.md#ar-27) · [Fe de correcciones](fe-correcciones-ar27.md) · [Antecedente Antigravity](resolucion-ar27.md).

### AR-28

**Problema y cierre.** Contrato de autenticidad de intento, frontera real contra mismo usuario y rechazo de replay. Mantener digest de integridad como dato complementario.

**Fuente y localizador.** N §2.3 REQ-IA-001.5, §6.A/E; A O-04, C-01, §10.2; Orq §7. [O-04](#alias-o-04), [C-01](#alias-c-01)

**Requisitos afectados.** REQ-IA-001.5, REQ-RUN-001.2, REQ-REP-001.1.

**Evidencia disponible y discrepancia.** SHA-256 solo de N; firma/MAC de A necesita separación de autoridad demostrada en el SO. Referencias: N §2.3 REQ-IA-001.5, §6.A/E. A O-04, C-01, §10.2. Orq §7.

**Evidencia necesaria.** Modelo de amenazas, frontera revisada y evidencia de rechazo de atestaciones no autorizadas y repetidas.

**Responsable principal.** AV-02. **Dependencias.** AV-01, AV-03, AV-04 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Crítica. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Contrato previo a integración de intentos.

**Riesgo residual.** Una atestación puede seguir siendo falsificable por actor con la misma autoridad que el firmante.

**Contravalidación.** [AR-28](dictamen-av02.md#ar-28). Nivel de confianza explícito y frontera independiente del HOST para acreditación fuerte. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

### AR-31

**Problema y cierre.** Imponer política en destino y separar datos AUT no confiables de decisiones. Denegar operaciones sin autoridad efectiva. GET/nombre de entorno no acreditan ausencia de efectos.

**Fuente y localizador.** N §6.D/F, DP-09/14; A O-09; D07/D09/D20. [O-09](#alias-o-09), [H05](#alias-h05)

**Requisitos afectados.** REQ-SEG-001.1–001.3, REQ-DAT-001.3, REQ-ORA-001.5, REQ-XINST-001.

**Evidencia disponible y discrepancia.** Neon y A rechazan permisos implícitos. A exige garantías más allá de URL y método. Referencias: N §6.D/F, DP-09/14. A O-09.

**Evidencia necesaria.** Evidencia de autoridad, aislamiento de instrucciones no confiables y prueba independiente de no mutación de referencia.

**Responsable principal.** AV-02. **Dependencias.** AV-04, AV-05 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Crítica. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Contrato previo a conectores y AUT.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-31](dictamen-av02.md#ar-31). Autoridad y semántica acreditadas por destino, control de egress. DE-04 abierta. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

### AR-32

**Problema y cierre.** Cuatro concesiones independientes y renovación/revocación. Separar vigencia de captura de retención. Ratificar ámbito, exportación excepcional y riesgo de copias/SSD/snapshots.

**Fuente y localizador.** N DE-02, §6.F; A O-10, DE-02, §10.3; Orq §7; D18. [O-10](#alias-o-10), [DE-02](#alias-de-02)

**Requisitos afectados.** POL-CAP-001, POL-RET-001, REQ-SEG-001.3, REQ-SEG-002.3.

**Evidencia disponible y discrepancia.** Ambos separan modos. A detalla retención y límites de copia exportada; el Orquestador exige ratificación. Referencias: N DE-02, §6.F. A O-10, DE-02, §10.3. Orq §7.

**Evidencia necesaria.** Acta DE-02, tabla de autorización y revocación por operación, límites para copias externas y política efectiva.

**Responsable principal.** AV-02. **Dependencias.** AV-05, AV-08 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Antes de habilitar captura privada.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-32](dictamen-av02.md#ar-32). Cuatro permisos independientes y ratificación de riesgo pendiente DE-02. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

### AR-40

**Problema y cierre.** Preservar remediación defensiva de adaptador y propagación de error. Acreditar en la base futura por pruebas negativas confinadas.

**Fuente y localizador.** N §7 Git; A §8, §11.2; E AS-02 / H-REV-01. [AS-02](#alias-as-02), [H-REV-01](#alias-h-rev-01)

**Requisitos afectados.** REQ-SEG-001.1, REQ-INT-001.2, REQ-REG-001.1.

**Evidencia disponible y discrepancia.** Tag aporta diseño y pruebas, acta ausente; consumidor inspeccionado usa referencia por defecto. Referencias: N §7 Git. A §8, §11.2. E AS-02 / H-REV-01.

**Evidencia necesaria.** Evidencia de validación de referencias y ejecución sin shell, error no exitoso y pruebas en el SHA objetivo.

**Responsable principal.** AV-02. **Dependencias.** AV-07 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Alta. **Estado.** BLOQUEANTE. **Fase.** Remediación propuesta G0.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-40](dictamen-av02.md#ar-40). Git sin shell y señal no disponible diferenciada de ausencia de cambios. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente. Bloqueante de cierre G0.

### AR-47

**Problema y cierre.** Impedir degradación a anónimo bajo sesión requerida aun cuando la resolución sea implícita. Revocar también trabajo en vuelo.

**Fuente y localizador.** N DP-03, §6.F; A O-09; H-REV-05; E AS-03. [AS-03](#alias-as-03), [H05](#alias-h05), [H-REV-05](#alias-h-rev-05)

**Requisitos afectados.** REQ-SEG-002.2, REQ-SEG-001.3, REQ-MEM-002.5.

**Evidencia disponible y discrepancia.** Histórico distingue fallo de perfil explícito e implícito. Advertencia no acredita seguridad del segundo. Referencias: N DP-03, §6.F. A O-09. E AS-03.

**Evidencia necesaria.** Matriz de pérdida/revocación por canal, nueva ejecución bloqueada y cierre de la activa.

**Responsable principal.** AV-02. **Dependencias.** AV-03, AV-06 **Contravalidador.** Revisor de seguridad y privacidad independiente.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Contrato y paridad antes de operar.

**Riesgo residual.** El control puede variar con el SO, los permisos efectivos y superficies fuera de custodia de QAP.

**Contravalidación.** [AR-47](dictamen-av02.md#ar-47). Fallo cerrado, revocación durable y reconciliación de efectos previos. **Diseño.** Aceptado en su ámbito, sujeto a decisión del Orquestador. **Experimental.** Pendiente.

## AV-03 · Autonomía, memoria, persistencia e interoperabilidad MCP/CLI

### AR-05

**Problema y cierre.** Campaña autónoma completa con política acreditada, elegibilidad ordinaria sin aprobación por caso y bloqueos locales. Conservar migración de recibos.

**Fuente y localizador.** N DP-01, §6.A; A §7; Orq §6; D01/D04; E MVP. [DP-01](#alias-dp-01), [H07](#alias-h07)

**Requisitos afectados.** REQ-CAM-001.1–001.5, REQ-DIS-001.1, REQ-CAS-001.1, REQ-PLN-001.2.

**Evidencia disponible y discrepancia.** Smoke MVP aislado deja fuera descubrimiento profundo, preparación, cierre y reporte. Referencias: N DP-01, §6.A. A §7. Orq §6. E MVP.

**Evidencia necesaria.** Contrato de elegibilidad y evidencia de campaña con bloqueo local y ramas independientes.

**Responsable principal.** AV-03. **Dependencias.** AV-01, AV-04, AV-08 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Contrato previo al carril de ejecución.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-05](informe-av03.md#ar-05--campaña-autónoma-completa-elegibilidad-ordinaria-bloqueos-locales-y-migración-de-recibos). **Contravalidación Codex.** [Enmienda AR-05](enmiendas-av03.md#ar-05). Política, aplicabilidad, oráculo y acreditación independientes. DAG transitivo con aristas tipadas, pausa/reanudación, presupuesto y recibos sin autoridad nueva. La [entrega AV-04](enmiendas-av04.md#8--integración-y-compuertas) define efectos, reconciliación y tipado de dependencias; pendiente de decisión específica. **Validación experimental.** Pendiente (E3/E4/E5).

### AR-11

**Problema y cierre.** Preservar HOST/DETERMINISTIC y el puerto futuro. Dejar MANAGED diferido por D03.

**Fuente y localizador.** N DP-06, §6.A; A §7; D03. [DP-06](#alias-dp-06)

**Requisitos afectados.** REQ-IA-001.1–001.6, REQ-CAM-001.4.

**Evidencia disponible y discrepancia.** Ninguna divergencia material. Pendiente precisar frontera de extensión compatible. Referencias: N DP-06, §6.A. A §7.

**Evidencia necesaria.** Contrato tipado y casos de replay sin inferencia, sin activar MANAGED.

**Responsable principal.** AV-03. **Dependencias.** AV-01 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Contrato inicial, ejecución MANAGED posterior.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-11](informe-av03.md#ar-11--modos-host-y-deterministic-y-puerto-diferido-managed). **Contravalidación Codex.** [Enmienda AR-11](enmiendas-av03.md#ar-11). HOST + DETERMINISTIC, CAS de nodo requerido, espera durable y ContextSnapshot saneado por perfil. Propuestas sin autoridad, reenvío correlacionado y MANAGED diferido. **Validación experimental.** Pendiente (E1/E3/E7).

### AR-12

**Problema y cierre.** Definir autoridad SQLite, límites de transacción, búsqueda, cola y puerto PostgreSQL futuro. Trazar selección de driver a AR-23.

**Fuente y localizador.** N DP-07, §6.A; A HN-06 y §7; H-REV-06; D02. [DP-07](#alias-dp-07), [H01](#alias-h01), [H-REV-06](#alias-h-rev-06)

**Requisitos afectados.** REQ-MEM-003.6, REQ-INT-001.3, REQ-MEM-001.1.

**Evidencia disponible y discrepancia.** Arquitectura compartida. El piso Node propuesto no coincide entre informes. Referencias: N DP-07, §6.A. A HN-06 y §7.

**Evidencia necesaria.** Contrato local respaldado por migración, corpus y pruebas de escritor único; equivalencia del puerto.

**Responsable principal.** AV-03. **Dependencias.** AV-07 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de congelar repositorio G1.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-12](informe-av03.md#ar-12--autoridad-única-sqlite-límites-de-transacción-búsqueda-fts-cola-y-puerto-postgresql-futuro). **Contravalidación Codex.** [Enmienda AR-12](enmiendas-av03.md#ar-12). Escritor único, clases de durabilidad, restauración y aislamiento de FTS. Los pisos técnicos de Node se aplican por línea oficial y build. AR-23/AV-07 elige runtime mantenido y driver. **Validación experimental.** Pendiente (E1/E2).

### AR-15

**Problema y cierre.** Acreditar cuatro hosts, CLI y compatibilidad de arranque, versión y reconexión. Medir adopción y tokens sin bloquear suites legítimas.

**Fuente y localizador.** N DP-11, HN-03, EXP-01; A HA-05, C-02, C-08, §11.1 EXP-01a/b. [DP-11](#alias-dp-11), [HN-03](#alias-hn-03), [HA-05](#alias-ha-05), [C-02](#alias-c-02), [EXP-01](#alias-exp-01), [EXP-01a](#alias-exp-01a), [EXP-01b](#alias-exp-01b)

**Requisitos afectados.** REQ-AGT-001, REQ-IA-001.1, REQ-MEM-002.4, REQ-INT-001.1–001.2, REQ-CAM-001.4.

**Evidencia disponible y discrepancia.** G1/G4 Neon frente a prueba de protocolo previa a elección y medición posterior de A. Referencias: N DP-11, HN-03, EXP-01. A HA-05, C-02, C-08, §11.1 EXP-01a/b.

**Evidencia necesaria.** EXP-01a handshake y Stdio sin efectos duplicados, EXP-01b sesiones limpias y comparativa versionada con/sin Skill y hooks.

**Responsable principal.** AV-03. **Dependencias.** AV-06, AV-07, AV-08 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Antes de escoger SDK y en integración G4.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-15](informe-av03.md#ar-15--interoperabilidad-con-cuatro-hosts-cli-protocolos-mcp-adopción-y-ahorro-medible-de-tokens). **Contravalidación Codex.** [Enmienda AR-15](enmiendas-av03.md#ar-15). H-AV03-02 verificado. Selección de perfil MCP/SDK condicionada a cuatro hosts. Probes sin inicio de ejecución, registro idempotente y adopción medida sin cifra ratificada. **Validación experimental.** Pendiente (EXP-01a G0 / EXP-01b G4–G5).

### AR-42

**Problema y cierre.** Acreditar vida fuera de Stdio, escritor único, locks/endpoints, reanudación entre agentes y recuperación tras muerte del árbol host.

**Fuente y localizador.** N §6.A, §10.2; A §7, §11.3; H-REV-06; E R2.4. [H02](#alias-h02), [H-REV-06](#alias-h-rev-06)

**Requisitos afectados.** REQ-CAM-001.4, REQ-DIS-001.8, REQ-MEM-002.3–002.4, REQ-IA-001.4.

**Evidencia disponible y discrepancia.** R2 muestra cortes externos en fixture. No demuestra cuatro hosts ni segundo usuario/instalación. Referencias: N §6.A, §10.2. A §7, §11.3. E R2.4.

**Evidencia necesaria.** Evidencia por SO/host con cortes, reapertura, leases y continuidad sin pérdida ni duplicación.

**Responsable principal.** AV-03. **Dependencias.** AV-02, AV-04, AV-07 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Antes de certificar continuidad E3/E7.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-42](informe-av03.md#ar-42--proceso-ejecutor-independiente-escritor-único-locksipc-reanudación-multi-host-y-muerte-del-árbol-host). **Contravalidación Codex.** [Enmienda AR-42](enmiendas-av03.md#ar-42). Instancia exclusiva y recuperación bajo supervisor por SO. IPC autenticado bajo cuenta separada o VM para AR-28. E3/E7 distinguen muerte HOST/ejecutor/equipo. Instalación y navegador con AV-06/07. **Validación experimental.** Pendiente (E3/E7).

### AR-45

**Problema y cierre.** Localización de QAP y AUT, preferencias regionales, mensajes/reportes y códigos invariantes; replay determinista.

**Fuente y localizador.** N §6.A/H, §10.2; A HA-04, C-01; Orq §6; D17. [HA-04](#alias-ha-04)

**Requisitos afectados.** REQ-QA-001, REQ-IA-001.1–001.2, REQ-REP-001.2, REQ-ORA-001.4.

**Evidencia disponible y discrepancia.** N propone localización propia. A alerta de colisiones de contexto regional, tratadas en AR-04. Referencias: N §6.A/H, §10.2. A HA-04, C-01. Orq §6.

**Evidencia necesaria.** Mismos códigos en dos locales, zona/moneda relevantes y congelación de expectativas y textos.

**Responsable principal.** AV-03. **Dependencias.** AV-01, AV-05, AV-06 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Contrato antes de congelar integración G4.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-45](informe-av03.md#ar-45--localización-propia-de-qap-localización-del-aut-preferencias-regionales-y-replay-determinista). **Contravalidación Codex.** [Enmienda AR-45](enmiendas-av03.md#ar-45). Contexto efectivo congelado por segmento/revisión. JCS UTF-16 en claves, proyección semántica y atestación separadas. Presentación, conversación, reporte y AUT con idiomas propios. **Validación experimental.** Pendiente (E4/E5/E7).

### AR-46

**Problema y cierre.** Preservar procedencia, aprendizaje no normativo, comparativa y retest, revisión y reparación acotada. Acreditar selección incremental e inferencia evitada.

**Fuente y localizador.** N §2.3 MEM-003.1–003.5 / REG-001.1–001.3, §10.2; A §7–8; Orq §6. Localizadores por sección en la fuente.

**Requisitos afectados.** REQ-MEM-003.1–003.5, REQ-REG-001.1–001.3, REQ-CAS-001.3–001.5.

**Evidencia disponible y discrepancia.** Neon enumera capacidades. Se requiere prueba longitudinal, no solo resultado de caso nuevo. Referencias: N §2.3 MEM-003.1–003.5 / REG-001.1–001.3, §10.2. A §7–8. Orq §6.

**Evidencia necesaria.** Snapshot previo, cambio acotado de selector/regla, diferencias explicadas y fallo original preservado.

**Responsable principal.** AV-03. **Dependencias.** AV-01, AV-04, AV-07 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de aceptar regresión E2/E4.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-46](informe-av03.md#ar-46--memoria-longitudinal-procedencia-aprendizaje-no-normativo-selección-incremental-y-reparación-acotada). **Contravalidación Codex.** [Enmienda AR-46](enmiendas-av03.md#ar-46). Aprendizaje no normativo, conflicto localizado, flakiness comparable, reparación con testigo y conservación de FAIL. Portabilidad saneada con validación de procedencia/autoridad. **Validación experimental.** Pendiente (E2/E4/E5).

### AR-52

**Problema y cierre.** Delegación MCP/CLI/CI al mismo núcleo. Controles y códigos deterministas con entradas equivalentes y sin paralelo de autoridad.

**Fuente y localizador.** N §6.A/E, §10.2; A O-05, §7; D13/D20. Localizadores por sección en la fuente.

**Requisitos afectados.** REQ-INT-001.1, REQ-AGT-001, REQ-CAM-001.4, REQ-SEG-001.1.

**Evidencia disponible y discrepancia.** Convergencia de arquitectura, falta fixture transversal con credenciales fuera de canal y omisiones/limpieza. Referencias: N §6.A/E, §10.2. A O-05, §7.

**Evidencia necesaria.** E7 con mismo snapshot, permisos, estado, informe y código para MCP/CLI, incluido bypass rechazado.

**Responsable principal.** AV-03. **Dependencias.** AV-01, AV-02, AV-04, AV-07 **Contravalidador.** Revisor independiente de ejecución y contratos MCP/CLI.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de congelar paridad MCP/CLI.

**Riesgo residual.** Persisten diferencias por host, proceso, versión o datos legados hasta acreditar paridad.

**Auditoría principal AV-03.** [AR-52](informe-av03.md#ar-52--delegación-única-mcpclici-al-núcleo-paridad-de-controles-y-códigos-deterministas). **Contravalidación Codex.** [Enmienda AR-52](enmiendas-av03.md#ar-52). Paridad de controles y cuatro ejes, sin éxito funcional de campaña incompleta o estructural. Preservar 2 como uso. La [tabla AV-04](enmiendas-av04.md#1--ar-0852--modelo-y-tabla-total) define precedencias y códigos por clase de comando, con aceptación distinta de consulta/ACK. Pendiente de decisión específica. **Validación experimental.** Pendiente (E1/E7).

## AV-04 · Veracidad funcional, oráculos, E2E, datos mutativos y recuperación

### AR-08

**Problema y cierre.** Seis veredictos coherentes con alcance y cuatro ejes. Campaña solo estructural sin acreditación funcional. Salida interoperable y no exitosa ante caso obligatorio omitido o limpieza pendiente.

**Fuente y localizador.** N §2.3, §2.4.1, §6.E, DP-04; A O-05, C-03, §10.1; Orq §7; D12. [DP-04](#alias-dp-04), [O-05](#alias-o-05), [C-03](#alias-c-03)

**Requisitos afectados.** REQ-ORA-001.1–001.3, REQ-RUN-001.3, REQ-INT-001.1, REQ-CAM-001.3.

**Evidencia disponible y discrepancia.** Neon agrega PASS_STRUCTURAL. A lo elimina pero su tabla admite PASSED estructural y no cubre ciertos SKIPPED y PENDING_CLEANUP. Referencias: N §2.3, §2.4.1, §6.E, DP-04. A O-05, C-03, §10.1. Orq §7.

**Evidencia necesaria.** Tabla total de agregación con casos obligatorios omitidos, limpieza pendiente, evidencia requerida, mezcla de estados y paridad MCP/CLI.

**Responsable principal.** AV-04. **Dependencias.** AV-01, AV-03, AV-08 **Contravalidador.** Revisor independiente de oráculos y datos de prueba.

**Severidad.** Crítica. **Estado.** BLOQUEANTE. **Fase.** Contrato de veredictos previo a ejecución.

**Riesgo residual.** Un éxito estructural, una omisión o limpieza pendiente podría habilitar indebidamente CI.

**AV-04.** [Enmiendas §§1–2](enmiendas-av04.md#1--ar-0852--modelo-y-tabla-total). Función total sobre obligaciones y ejes, con cierre durable y separación de transporte, consulta y ejecución. Preserva defectos, atestados y disponibilidad actual. Diseño favorable con reservas, pendiente de decisión. **Validación experimental.** Pendiente (E1/E5/E7/E8).

### AR-09

**Problema y cierre.** Acreditar independencia causal y precedencia N0–N3, frescura, alcance y correlación. Abstenerse sin evidencia adecuada. Testigos autorizados sin exigir BD del AUT.

**Fuente y localizador.** N DP-04, §6.E; A O-02; H-REV-05; E Recovery/R2. [DP-04](#alias-dp-04), [O-02](#alias-o-02), [H03](#alias-h03), [H06](#alias-h06), [H-REV-05](#alias-h-rev-05)

**Requisitos afectados.** REQ-ORA-001.2–001.7, REQ-CAS-001.2, REQ-AUTREP-001.

**Evidencia disponible y discrepancia.** Rollback R2 prueba falso PASS en fixture legado. N2 por nombre de canal o recarga resulta insuficiente. Referencias: N DP-04, §6.E. A O-02. E Recovery/R2.

**Evidencia necesaria.** Rúbrica causal y positivos/contrapruebas con rollback, permisos, vigencia, 403 con efecto y convergencia.

**Responsable principal.** AV-04. **Dependencias.** AV-01, AV-05, AV-08 **Contravalidador.** Revisor independiente de oráculos y datos de prueba.

**Severidad.** Crítica. **Estado.** BLOQUEANTE. **Fase.** Contrato previo a G3.

**Riesgo residual.** El testigo, el destino y la limpieza pueden dejar cobertura funcional incompleta.

**AV-04.** [Enmienda §3](enmiendas-av04.md#3--ar-09--testigo-y-nivel-por-afirmación). Nivel causal por afirmación, vigencia, autoridad, fuentes comunes y terminalidad. R2 acotado al fixture, incluido el envío de R2.4. Diseño favorable con reservas, pendiente de decisión. **Validación experimental.** Pendiente (E5/E8).

### AR-10

**Problema y cierre.** Ratificar estrategia delete/compensate/confine_tenant por destino y verificar estado residual, límites y recuperación.

**Fuente y localizador.** N DP-05, DE-04, §6.D; A DE-04, O-09; D06–D08. [DP-05](#alias-dp-05), [DE-04](#alias-de-04)

**Requisitos afectados.** REQ-RUN-001.4, REQ-DAT-001.1–001.4, REQ-E2E-001 como ampliación.

**Evidencia disponible y discrepancia.** Soporte arquitectónico no concede autorización por destino. Operaciones irreversibles requieren política explícita. Referencias: N DP-05, DE-04, §6.D. A DE-04, O-09.

**Evidencia necesaria.** Acta y matriz de operaciones permitidas, mutación interrumpida, reconciliación y bitácora de limpieza.

**Responsable principal.** AV-04. **Dependencias.** AV-05, AV-08 **Contravalidador.** Revisor independiente de oráculos y datos de prueba.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de operar por destino.

**Riesgo residual.** El testigo, el destino y la limpieza pueden dejar cobertura funcional incompleta.

**AV-04.** [Enmiendas §§4–5](enmiendas-av04.md#4--ar-10--intención-durable-y-reconciliación). DataPlan por operación, reserva y reconciliación durable; borrar lo propio, restaurar cambio autorizado o compensar/confinar según estrategia. DE-04 por destino. Diseño favorable con reservas, pendiente de decisión. **Validación experimental.** Pendiente (E3/E5/EXP-05a/b).

### AR-43

**Problema y cierre.** Acreditar E2E multirol/multimódulo, dependencia y transferencia tipada, datos, reconciliación y limpieza tras corte.

**Fuente y localizador.** N §6.D/E, §10.1–10.3; A O-02/O-05/O-09, §7; H-REV-05; E R2.1–R2.4. [H03](#alias-h03), [H06](#alias-h06), [H-REV-05](#alias-h-rev-05)

**Requisitos afectados.** REQ-PLN-001.1–001.6, REQ-RUN-001.1–001.6, REQ-CAM-001.2–001.3, REQ-E2E-001 como ampliación.

**Evidencia disponible y discrepancia.** Fixture R2 acredita parte diferencial, con grupos sin cobertura multirol ni empresarial. Ausencia de efecto produce rechazo o abstención según testigo. Referencias: N §6.D/E, §10.1–10.3. A O-02/O-05/O-09, §7. E R2.1–R2.4.

**Evidencia necesaria.** Traza de ≥3 módulos/≥2 roles, fallos localizados y persistencia/reconciliación independientes.

**Responsable principal.** AV-04. **Dependencias.** AV-03, AV-05, AV-08 **Contravalidador.** Revisor independiente de oráculos y datos de prueba.

**Severidad.** Crítica. **Estado.** BLOQUEANTE. **Fase.** Antes de certificar E2E G3/G4.

**Riesgo residual.** El testigo, el destino y la limpieza pueden dejar cobertura funcional incompleta.

**AV-04.** [Enmienda §6](enmiendas-av04.md#6--ar-43--e2e-y-continuidad). DAG con tres tipos de dependencia, sesión explícita por ámbito, perfil verificado, transferencia tipada, conflicto jerárquico, handoff y piso de fixture de tres módulos/dos roles. Diseño favorable con reservas, pendiente de decisión. **Validación experimental.** Pendiente (E3/E4/E5/E8; recursos W>1 en AV-06).

### AR-53

**Problema y cierre.** Acreditar reglas de negocio, RBAC y cálculo junto con aplicabilidad y fuente autorizada. Preservar todos los tipos de casos.

**Fuente y localizador.** N §2.3 CAS/ORA, §6.E, §10; A O-02/O-03/O-05; Orq §6. [H07](#alias-h07)

**Requisitos afectados.** REQ-CAS-001.1–001.5, REQ-ORA-001.4–001.7, REQ-DOC-001.4.

**Evidencia disponible y discrepancia.** Cobertura funcional no se demuestra con existencia de casos, respuestas HTTP ni reglas inferidas. Referencias: N §2.3 CAS/ORA, §6.E, §10. A O-02/O-03/O-05. Orq §6.

**Evidencia necesaria.** Positivos/negativos/BVA, condiciones tenant/rol, efecto antes/después, autoridad por expectativa y mutantes semánticos.

**Responsable principal.** AV-04. **Dependencias.** AV-01, AV-05, AV-08 **Contravalidador.** Revisor independiente de oráculos y datos de prueba.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Contrato de E2E antes de acreditar RBAC y negocio.

**Riesgo residual.** El testigo, el destino y la limpieza pueden dejar cobertura funcional incompleta.

**AV-04.** [Enmienda §7](enmiendas-av04.md#7--ar-53--reglas-cálculos-y-rbac). Autoridad y aplicabilidad independientes de admisión, RBAC positivo y negativo, regla tipada y semántica regional. Portabilidad PDF/Excel en AV-05. Diseño favorable con reservas, pendiente de decisión. **Validación experimental.** Pendiente (E4/E5/E8 y dependencias AV-05).

## AV-05 · Documentos, reportes PDF/Excel, UTCP, OpenAPI y cross-instancia

### AR-13

**Problema y cierre.** Preservar formatos de lanzamiento, localizadores, tablas y autoridades documentales. Elegir parsers/OCR con coberturas y abstenciones explícitas.

**Fuente y localizador.** N DP-08, §6.C; A O-03, §7; D10/D11. [DP-08](#alias-dp-08), [H06](#alias-h06)

**Requisitos afectados.** REQ-DOC-001.1–001.4, REQ-AUTREP-001, REQ-INT-001.4.

**Evidencia disponible y discrepancia.** Instrumentos propuestos carecen de acreditación terminal. D10 y D11 conservan distinta evidencia de aceptación. Referencias: N DP-08, §6.C. A O-03, §7.

**Evidencia necesaria.** Corpus versionado por formato y páginas/hojas, cobertura, conflicto, vigencia y condición de abstención.

**Responsable principal.** AV-05. **Dependencias.** AV-01, AV-02 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de congelar ingesta G2.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** D10 mantiene sus ocho formatos y separa extracción, calidad contra unidades esperadas, inferencia y autoridad. [Enmienda](enmiendas-av05.md#2--ar-13-y-ar-38--ingesta-y-reportes-emitidos). G2 condiciona elegir adaptadores, con OCR y variantes según alcance y corpus.

### AR-17

**Problema y cierre.** Mantener UTCP/OpenAPI en lanzamiento, adopción por caso. Elegir SDK/HTTP gobernado tras factibilidad/licencia y demostrar DataPlan completo.

**Fuente y localizador.** N DP-13, EXP-05, §6.D, §13.4; A C-08, §11.1 EXP-05a/b; D08. [DP-13](#alias-dp-13), [EXP-05](#alias-exp-05), [EXP-05a](#alias-exp-05a), [EXP-05b](#alias-exp-05b)

**Requisitos afectados.** REQ-DAT-001.2, REQ-INT-001.4, REQ-QA-002, REQ-XINST-001.

**Evidencia disponible y discrepancia.** Fases combinadas de Neon frente a contrato temprano y prueba mutativa posterior de A. Referencias: N DP-13, EXP-05, §6.D, §13.4. A C-08, §11.1 EXP-05a/b.

**Evidencia necesaria.** EXP-05a comparación de contratos, licencias y auth; EXP-05b DAG autorizado, reconciliación ante corte y verificación de inmutabilidad de referencia.

**Responsable principal.** AV-05. **Dependencias.** AV-04, AV-07 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** G0 y antes de congelar datos G3.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** D08 conserva UTCP y OpenAPI. SDK con protocolo gobernado y adaptador HTTP con conformidad limitada son brazos independientes. [EXP-05a](protocolos-av05.md#exp-05a--factibilidad-de-protocolos-y-selección) en G0 y [EXP-05b](protocolos-av05.md#exp-05b--dataplan-efecto-y-referencia) en G3.

### AR-18

**Problema y cierre.** Lectura acreditada en destino, identidad separada, procedencia y finalidad. Si falta garantía, bloquear o usar exportación saneada autorizada.

**Fuente y localizador.** N DP-14, DE-04, §6.D; A O-09, DE-04; D09. [DP-14](#alias-dp-14), [DE-04](#alias-de-04)

**Requisitos afectados.** REQ-XINST-001, REQ-DAT-001.3, REQ-SEG-001.1–001.2.

**Evidencia disponible y discrepancia.** GET, patrones o etiqueta de entorno carecen de autoridad suficiente. Política pendiente por instancia. Referencias: N DP-14, DE-04, §6.D. A O-09, DE-04.

**Evidencia necesaria.** Permisos efectivos, catálogo autorizado, inmutabilidad corroborada e inventario de transferencia mínima.

**Responsable principal.** AV-05. **Dependencias.** AV-02, AV-04, AV-08 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Crítica. **Estado.** PENDIENTE. **Fase.** Antes de habilitar referencias por destino.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** Referencia de solo lectura acreditada por destino y operación; separación de identidades incluso en mismo origen, red privada por concesión y transferencia mínima. [Enmienda](enmiendas-av05.md#5--ar-18--dos-autoridades-redes-autorizadas-y-transferencia). Bloqueo por destino sin testigo suficiente o DE-04.

### AR-20

**Problema y cierre.** Distinguir seis estados de celda. Separar recálculo Excel de la regla contable acreditada. Exigir decimal exacto, rounding/tolerancia y abstención justificable.

**Fuente y localizador.** N HN-01, §6.C, §12; A HN-01, O-03, HA-03, C-02, §10.5; Orq §7. [DP-08](#alias-dp-08), [HN-01](#alias-hn-01), [HA-03](#alias-ha-03), [O-03](#alias-o-03), [C-02](#alias-c-02), [H06](#alias-h06)

**Requisitos afectados.** REQ-AUTREP-001, REQ-DOC-001.1–001.2, REQ-ORA-001.4, REQ-DAT-001.2.

**Evidencia disponible y discrepancia.** N propone evaluar fórmulas acotadas y abstenerse sin caché. A exige granularidad y no confiar en JS Number para centavos. Referencias: N HN-01, §6.C, §12. A HN-01, O-03, HA-03, C-02, §10.5. Orq §7.

**Evidencia necesaria.** Corpus PDF/Excel, resultados por celda y total, reglas versionadas, mutante de centavo, extracción insuficiente y fórmulas sin caché.

**Responsable principal.** AV-05. **Dependencias.** AV-01, AV-04, AV-08 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Crítica. **Estado.** BLOQUEANTE. **Fase.** Antes de cerrar contrato D11 y corpus G2/G3.

**Riesgo residual.** Falso PASS por caché obsoleta, extracción parcial o cálculo contable incorrecto.

**AV-05.** Separación entre extracción, recálculo Excel y cálculo independiente contable, con procedencia y seis distinciones ortogonales. El diseño candidato permite estimar calificación. Bloquea contrato definitivo D11 y selección hasta EXP-06b, con certificación G6/E8. [Enmienda](enmiendas-av05.md#1--ar-20--hoja-excel-regla-contable-y-comparación).

### AR-22

**Problema y cierre.** Verificar licencia, advisories, versiones exactas y manejo OpenAPI nullable/ref y 3.0/3.1/3.2. Aislar documentos y resolver referencias por política.

**Fuente y localizador.** N HN-05, §6.C/D; A HN-05, C-02. [HN-05](#alias-hn-05), [C-02](#alias-c-02)

**Requisitos afectados.** REQ-DOC-001.1, REQ-DAT-001.2, REQ-QA-002.

**Evidencia disponible y discrepancia.** Los informes discrepan sobre vigencia de scalar#9694. Mammoth y variantes de contrato quedan por validar con versiones fijadas. Referencias: N HN-05, §6.C/D. A HN-05, C-02.

**Evidencia necesaria.** Avisos primarios, licencia, matriz de fixtures/versiones y comportamiento de rutas/referencias confinadas.

**Responsable principal.** AV-05. **Dependencias.** AV-02, AV-07 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de seleccionar parsers G0–G2.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** Frontera por SO y VM local candidata, broker de referencias separado, límites y custodia desde primera escritura. [Evidencia de HN-05/C-02 y lock](evidencia-av05.md#dependencias-y-licencias). Selección G0–G2 y calificación de release AV-07 pendientes.

### AR-38

**Problema y cierre.** Evaluar extracción multipágina/multihoja y cálculo/abstención con evidencias reproducibles.

**Fuente y localizador.** N EXP-06, §6.C; A §11.1 EXP-06b, O-03. [EXP-06](#alias-exp-06), [EXP-06b](#alias-exp-06b)

**Requisitos afectados.** REQ-AUTREP-001, REQ-DOC-001.1–001.2, REQ-ORA-001.4.

**Evidencia disponible y discrepancia.** A adelanta precisión tabular y decimal antes del diseño definitivo; N lo ubica más tarde. Referencias: N EXP-06, §6.C. A §11.1 EXP-06b, O-03.

**Evidencia necesaria.** EXP-06b con referencia versionada, fórmulas/caché, conciliación autorizada, localizadores y falsos positivos.

**Responsable principal.** AV-05. **Dependencias.** AV-04 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** G2 antes de congelar ingesta y evaluación.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** EXP-06b mide cobertura, fidelidad y resultados de archivos emitidos, con controles sanos, mutantes, causa de abstención y recursos. [Protocolo](protocolos-av05.md#exp-06b--extracción-aislamiento-y-reportes-emitidos), selección G2, integración G3 y certificación G6/E8.

### AR-48

**Problema y cierre.** Validar contrato por tráfico observado y llamada autorizada, conservar esquema/status/tipo/versión y separar de efecto persistido.

**Fuente y localizador.** N §6.D, §10.2; A O-02/O-09; D08/D12. Localizadores por sección en la fuente.

**Requisitos afectados.** REQ-QA-002, REQ-DAT-001.2, REQ-ORA-001.2.

**Evidencia disponible y discrepancia.** Resumen de API puede admitir cobertura solo por observación o equiparar conformidad con efecto. Referencias: N §6.D, §10.2. A O-02/O-09.

**Evidencia necesaria.** Casos estructurales y funcionales separados con versiones, políticas y resultados esperados.

**Responsable principal.** AV-05. **Dependencias.** AV-02, AV-04 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de conectar validadores al runner.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** Observación, validación estructural por dialecto y prueba funcional independientes. Representación por afirmación AV-04 y efecto/no mutación con testigo suficiente. [Enmienda](enmiendas-av05.md#4--ar-17-y-ar-48--contrato-de-operación-y-verificación), EXP-05a/b y E5 pendientes.

### AR-50

**Problema y cierre.** Publicar DTO/manifiesto común por intento, salida HTML/Markdown/CSV/JSON/JSONL según D19, evidencias reales, paquete reproducible y diagnóstico de ausencias.

**Fuente y localizador.** N §6.C/F/G, §7, §10.2; A §7–8, O-10; H-REV-04. [H08](#alias-h08), [H09](#alias-h09), [H-REV-04](#alias-h-rev-04)

**Requisitos afectados.** REQ-REP-001.1–001.4, REQ-RUN-001.6, POL-RET-001, M1–M5.

**Evidencia disponible y discrepancia.** El legado combina CDN y formato histórico. A/Neon proponen conservar partes bajo contrato único. Referencias: N §6.C/F/G, §7, §10.2. A §7–8, O-10.

**Evidencia necesaria.** Misma identidad y veredicto en visor/MCP/CLI, paquete trasladado, datos locales y medios autorizados.

**Responsable principal.** AV-05. **Dependencias.** AV-02, AV-04, AV-06 **Contravalidador.** Revisor independiente de documentos, contabilidad e interoperabilidad.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de validar publicación y reporte.

**Riesgo residual.** Variantes de fuente, contrato o formato quedan fuera del corpus hasta acreditación explícita.

**AV-05.** Sobre AV-04 completo, export derivado firmado con ancla externa, formatos saneados, visor y retención D19. [Enmienda](enmiendas-av05.md#6--ar-50--reporte-propio-custodia-y-portabilidad), G5/EXP-06c/E7 y DE-01/02 donde aplique.

## AV-06 · Navegadores, fidelidad visual, concurrencia, rendimiento y compatibilidad

### AR-16

**Decisión de diseño AV-06.** CV06-01/02: identidad efectiva por celda, perfiles de observación restringida vs fiel y Playwright candidato; EXP-02/04/06c. [Contravalidación](contravalidacion-chatgpt-high-av06.md) · [Decisión](decision-orquestador-av06-encargo-av07.md). Estado principal y pruebas conservados.

**Problema y cierre.** Separar preferencias conversacionales de fidelidad obligatoria. Certificar combinaciones soportadas, detectar degradación e impedir que sea silenciosa.

**Fuente y localizador.** N DP-12, §2.4, §3, §6.B, §10.2; A §2.2, O-06; D14–D16. [DP-12](#alias-dp-12)

**Requisitos afectados.** REQ-RUN-002.1, REQ-RUN-001.1, REQ-DIS-001.3–001.4, REQ-REP-001.1, REQ-INT-001.2.

**Evidencia disponible y discrepancia.** Neon reúne ambas dimensiones; A pide cláusulas 1a/1b. Chromium ligero y otros motores siguen candidatos. Referencias: N DP-12, §2.4, §3, §6.B, §10.2. A §2.2, O-06.

**Evidencia necesaria.** Matriz instalada visible/segundo plano por SO y motor, recursos autorizados, hidratación SPA, media y fallbacks.

**Responsable principal.** AV-06. **Dependencias.** AV-01, AV-02 **Contravalidador.** Revisor independiente de navegadores, recursos y compatibilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** G2–G5 antes de valores predeterminados.

**Expediente AV-06.** Matriz, preflight y comparación de fidelidad por canal/modalidad. EXP-02/04 y EXP-06c condicionan los valores predeterminados. [Informe](informe-av06.md#ar-16) · [Protocolos](protocolos-av06.md).

**Riesgo residual.** Cobertura sujeta a plataforma, configuración, muestras y fidelidad en instalación real.

### AR-29

**Decisión de diseño AV-06.** CV06-03: admisión transaccional, reservas diferenciadas, W=1 referencia/fallback, W>1 seleccionable acreditado y W=0 si no hay reserva. EXP-03 G3/G5, no previo al WBS. [Contravalidación](contravalidacion-chatgpt-high-av06.md) · [Decisión](decision-orquestador-av06-encargo-av07.md). Estado principal y pruebas conservados.

**Problema y cierre.** Perfilar presión y RAM disponible, memoria privada/proporcional y colas. Adaptar concurrencia bajo aislamiento, dependencias y límites con recuperación y limpieza.

**Fuente y localizador.** N §6.B, EXP-03, §13.5; A O-06, C-05, §11.1 EXP-03. [O-06](#alias-o-06), [C-05](#alias-c-05), [EXP-03](#alias-exp-03)

**Requisitos afectados.** REQ-RUN-001.1/5, REQ-CAM-001.3, REQ-RUN-002.1, REQ-OPT-001 como ampliación.

**Evidencia disponible y discrepancia.** Fórmula estática RSS p95 de Neon frente a perfiles dinámicos A; métricas de SO son distintas. Referencias: N §6.B, EXP-03, §13.5. A O-06, C-05, §11.1 EXP-03.

**Evidencia necesaria.** Versiones, muestras p99/máximo, W=1/2/4 por SO, aislamiento, CPU, disco y procesos residuales.

**Responsable principal.** AV-06. **Dependencias.** AV-03, AV-04 **Contravalidador.** Revisor independiente de navegadores, recursos y compatibilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** G3 y paquete G5.

**Expediente AV-06.** Admisión del núcleo, alternancia W=1 y límites por presión observada. EXP-03 G3/G5 condiciona concurrencia y hardware. [Informe](informe-av06.md#ar-29) · [Protocolos](protocolos-av06.md).

**Riesgo residual.** Cobertura sujeta a plataforma, configuración, muestras y fidelidad en instalación real.

### AR-36

**Decisión de diseño AV-06.** CV06-04: híbrido, denominadores, identidad semántica, testigos, checkpoint e invalidación conservadora; EXP-02 G2/E4. [Contravalidación](contravalidacion-chatgpt-high-av06.md) · [Decisión](decision-orquestador-av06-encargo-av07.md). Estado principal y pruebas conservados.

**Problema y cierre.** Comparar extractores sobre misma SPA y ejecutar progresión persistente. Medir tablas, estados, localizadores, etiquetas, filtros, paginación y tokens sin perder comportamiento.

**Fuente y localizador.** N EXP-02, §6.B; A §11.1 EXP-02; H-REV-05; Orq §6. [EXP-02](#alias-exp-02), [H07](#alias-h07), [H-REV-05](#alias-h-rev-05)

**Requisitos afectados.** REQ-DIS-001.1–001.7, REQ-QA-001, REQ-OPT-002 como ampliación.

**Evidencia disponible y discrepancia.** Consenso en fase. La recuperación de controles por sí sola no acredita Discovery persistente ni fidelidad. Referencias: N EXP-02, §6.B. A §11.1 EXP-02. Orq §6.

**Evidencia necesaria.** Corpus de referencia, rendimiento/cobertura reproducibles y recarga con frontera sin pérdida.

**Responsable principal.** AV-06. **Dependencias.** AV-01, AV-03 **Contravalidador.** Revisor independiente de navegadores, recursos y compatibilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** Inicio de G2.

**Expediente AV-06.** Extractor híbrido e invalidación selectiva con corpus y testigo. EXP-02 G2/E4 condiciona selección. [Informe](informe-av06.md#ar-36) · [Protocolos](protocolos-av06.md).

**Riesgo residual.** Cobertura sujeta a plataforma, configuración, muestras y fidelidad en instalación real.

### AR-37

**Decisión de diseño AV-06.** CV06-01/05: provisión por capacidad, manifiesto autenticado, doctor funcional, cache y promoción recuperable; AR-23, EXP-01a G0, EXP-04a G1, 04b G5. [Contravalidación](contravalidacion-chatgpt-high-av06.md) · [Decisión](decision-orquestador-av06-encargo-av07.md). Estado principal y pruebas conservados.

**Problema y cierre.** Acreditar instalación bajo demanda con proxy/CA y publicación instalada. Comparar fidelidad y consumo de modos.

**Fuente y localizador.** N EXP-04, DP-12, §10.2; A §11.1 EXP-04. [EXP-04](#alias-exp-04), [H09](#alias-h09)

**Requisitos afectados.** REQ-INT-001.2, REQ-RUN-002.1, REQ-REP-001.1–001.2, M5.

**Evidencia disponible y discrepancia.** A condiciona primer smoke a empaquetado y piso Node. N y A conservan tres SO. Referencias: N EXP-04, DP-12, §10.2. A §11.1 EXP-04.

**Evidencia necesaria.** Resultados de instalación limpia, caché, recursos autorizados, export portable y condiciones de compatibilidad.

**Responsable principal.** AV-06. **Dependencias.** AV-02, AV-07 **Contravalidador.** Revisor independiente de navegadores, recursos y compatibilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** G1 y G5.

**Expediente AV-06.** Provisión por capacidad y doctor instalado. EXP-04a/b depende de EXP-01a y AV-07; G5/E7 acredita distribución. [Informe](informe-av06.md#ar-37) · [Protocolos](protocolos-av06.md).

**Riesgo residual.** Cobertura sujeta a plataforma, configuración, muestras y fidelidad en instalación real.

### AR-39

**Decisión de diseño AV-06.** CV06-06/07: AR-27 C/A, supresión preventiva anterior a superficie sensible, custodia, portabilidad y accesibilidad por celda; EXP-06a/c, DE-02/05. [Contravalidación](contravalidacion-chatgpt-high-av06.md) · [Decisión](decision-orquestador-av06-encargo-av07.md). Estado principal y pruebas conservados.

**Problema y cierre.** Acreditar media, despliegue offline portátil, accesibilidad y fallbacks bajo autorización. Verificar apertura tras traslado, teclado y ausencia de CDN.

**Fuente y localizador.** N EXP-06, §10.2; A §11.1 EXP-06c; H-REV-04. [AS-04](#alias-as-04), [EXP-06](#alias-exp-06), [EXP-06c](#alias-exp-06c), [H08](#alias-h08), [H-REV-04](#alias-h-rev-04)

**Requisitos afectados.** REQ-REP-001.1–001.2, REQ-RUN-001.6, REQ-QA-003, M1–M5.

**Evidencia disponible y discrepancia.** A conserva una suite posterior y separa viabilidad previa. Poda o supresión no debe cambiar veredicto ya acreditado. Referencias: N EXP-06, §10.2. A §11.1 EXP-06c.

**Evidencia necesaria.** EXP-06c sobre paquete, autoría/huellas, WebM, rangos autorizados y export con validación de accesibilidad.

**Responsable principal.** AV-06. **Dependencias.** AV-02, AV-05, AV-08 **Contravalidador.** Revisor independiente de navegadores, recursos y compatibilidad.

**Severidad.** Alta. **Estado.** VALIDACIÓN EXPERIMENTAL PENDIENTE. **Fase.** G3/G5.

**Expediente AV-06.** EXP-06c amplía evidencia, portabilidad y accesibilidad en G3/G5/E6 y E7. EXP-06a y DE-02 condicionan activación privada. [Informe](informe-av06.md#ar-39) · [Protocolos](protocolos-av06.md).

**Riesgo residual.** Cobertura sujeta a plataforma, configuración, muestras y fidelidad en instalación real.

### AR-49

**Decisión de diseño AV-06.** CV06-08: medición pareada contra baseline competente, obligaciones equivalentes, todos los intentos y telemetría comparable; EXP-01b/02/03, DE-03. [Contravalidación](contravalidacion-chatgpt-high-av06.md) · [Decisión](decision-orquestador-av06-encargo-av07.md). Estado principal y pruebas conservados.

**Problema y cierre.** Medir tokens por tokenizer y compresión preservando procedencia, cobertura, permisos y continuidad. Acreditar costo por modalidad.

**Fuente y localizador.** N §6.A/B, EXP-01/02/03, §13.5; A O-06, §11.3; Orq §6. [H02](#alias-h02)

**Requisitos afectados.** REQ-MEM-002.4, REQ-DIS-001.3, REQ-CAM-001.3, REQ-AGT-001, REQ-OPT-002 como ampliación.

**Evidencia disponible y discrepancia.** Cantidades 150/200 y presupuesto fijo son hipótesis. Conteos de hosts requieren denominadores comparables. Referencias: N §6.A/B, EXP-01/02/03, §13.5. A O-06, §11.3. Orq §6.

**Evidencia necesaria.** Benchmark con snapshots y tareas equivalentes, efecto sobre cobertura, omisiones y hardware mínimo/recomendado.

**Responsable principal.** AV-06. **Dependencias.** AV-03, AV-08 **Contravalidador.** Revisor independiente de navegadores, recursos y compatibilidad.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Antes de fijar presupuestos.

**Expediente AV-06.** Medición pareada EXP-01b/02/03. Confirmar ahorro con telemetría comparable y conservar DE-03/AV-08. [Informe](informe-av06.md#ar-49) · [Protocolos](protocolos-av06.md).

**Riesgo residual.** Cobertura sujeta a plataforma, configuración, muestras y fidelidad en instalación real.

## AV-07 · Reconstrucción selectiva, dependencias, licencias y migración

### AR-19

**Decisión de diseño AV-07.** CV07-03: DAG de resultados, calificaciones tempranas G0, repeticiones G1/G5, G6/G6.5 separados; corpus y vectores históricos a AV-08. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Fijar dependencias de experimentos por contrato. Mantener exploración, interoperabilidad, custodia e ingesta en su orden de dependencia.

**Fuente y localizador.** N DP-15, §9, §13.4; A C-08, §10.6, §11.1. [DP-15](#alias-dp-15), [C-08](#alias-c-08), [H11](#alias-h11)

**Requisitos afectados.** REQ-IA-001.1, REQ-DAT-001.2, REQ-SEG-002.3, REQ-INT-001.2.

**Evidencia disponible y discrepancia.** Neon anticipa parcialmente EXP-01/05; A también anticipa captura y divide EXP-01/05/06. Referencias: N DP-15, §9, §13.4. A C-08, §10.6, §11.1.

**Evidencia necesaria.** Acta de secuencia y criterios por experimento. Los seis ensayos no constituyen una precondición conjunta.

**Responsable principal.** AV-07. **Dependencias.** AV-02, AV-03, AV-05, AV-06 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Previo a fijar secuencia de contratos.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [DAG de calificación y compuertas](compuertas-av07.md). EXP-01a/05a/06a y KEK preceden selección aplicable en G0; G3 usa plan de fixture y G6.5 conserva su propia autorización. Estado principal conservado.

### AR-21

**Decisión de diseño AV-07.** CV07-04: candidatos PW/MCP y resolución efectiva por superficie; alpha sin bytes independientemente verificados, retirada condicionada; EXP-01a/04. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Inventariar resolución Playwright/MCP, tipos Node y paquetes duplicados. Elegir versiones compatibles con EXP-01 y plataforma.

**Fuente y localizador.** N HN-03, §6.A/B, §13.2; A HN-03, HA-04, C-02, §11.2. [HN-03](#alias-hn-03), [HA-04](#alias-ha-04), [C-02](#alias-c-02)

**Requisitos afectados.** REQ-INT-001.2, REQ-AGT-001, REQ-IA-001.1.

**Evidencia disponible y discrepancia.** Tres copias Playwright, dos SDK MCP en lockfile histórico según A. Neon analiza rangos y plantea migración v2 directa. Referencias: N HN-03, §6.A/B, §13.2. A HN-03, HA-04, C-02, §11.2.

**Evidencia necesaria.** Lockfile objetivo, árbol limpio y pruebas de empaquetado/compatibilidad. HN-03 no acredita elección de SDK.

**Responsable principal.** AV-07. **Dependencias.** AV-03, AV-06 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de seleccionar árbol de dependencias G0/G1.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Identidades de dependencia y alpha](dependencias-licencias-av07.md#identidades-resueltas). Resoluciones y browsers.json cotejados. Selección por EXP-01a y paquete instalado, retiro de alpha condicionado al alcance. Estado principal conservado.

### AR-23

**Decisión de diseño AV-07.** CV07-04: Node/SQLite candidatos, doctor funcional, FTS y corrección WAL por rama, garantías durables; AR-12/EXP-04/E2. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Acreditar mínimo Node sin flags para driver seleccionado y alinear engines, target y tipos.

**Fuente y localizador.** N HN-06, DP-07, §13.2; A HN-06, C-02, HA-02, §10.5. [HN-06](#alias-hn-06), [C-02](#alias-c-02)

**Requisitos afectados.** REQ-MEM-003.6, REQ-INT-001.2.

**Evidencia disponible y discrepancia.** Neon propone ≥22.12.0; A corrige a ≥22.13.0. Selección de soporte debe constar por plataforma. Referencias: N HN-06, DP-07, §13.2. A HN-06, C-02, HA-02, §10.5.

**Evidencia necesaria.** Documentación oficial y smoke instalado en versiones límite y SO admitidos.

**Responsable principal.** AV-07. **Dependencias.** AV-03, AV-06 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de declarar piso para empaquetado.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Runtime y SQLite](dependencias-licencias-av07.md#runtime-y-sqlite). Node 24.22.3/builtin es candidato, con driver alternativo y doctor por variante. Estado principal conservado.

### AR-26

**Decisión de diseño AV-07.** CV07-07: baseline de diez paquetes G0, 93/142 histórico vs 144 otro árbol; no regresión por identidad y multiplicidad. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Corregir procedencia de 93 identidades sumadas a 142 diagnósticos del JSON y distinguir 144 en Recovery/R2. Medir deuda vigente por paquete al autorizar G0.

**Fuente y localizador.** N HN-09, §13.3; A HN-09, C-02, §11.3; E Recovery/R2, H-REV-01. [HN-09](#alias-hn-09), [C-02](#alias-c-02), [H-REV-01](#alias-h-rev-01)

**Requisitos afectados.** REQ-INT-001.2, REQ-MEM-001.1.

**Evidencia disponible y discrepancia.** Neon originalmente toma 93 como total. A aclara la unidad y excluye actualización de la deuda vigente. Referencias: N HN-09, §13.3. A HN-09, C-02, §11.3. E Recovery/R2, H-REV-01.

**Evidencia necesaria.** JSON archivado y captura reproducible del typecheck limpio por paquete con huella y tolerancia sin crecimiento.

**Responsable principal.** AV-07. **Dependencias.** AV-03 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Medición propuesta G0.

**Riesgo residual.** Línea de deuda actual desconocida; una reducción aparente podría ampliar defectos.

**Expediente AV-07.** [Línea base histórica y protocolo G0](compuertas-av07.md#baseline-de-deuda-ar-26). 93 identidades/142 ocurrencias verificadas; 144 de R2. Baseline de producto y cero regresiones pendientes. Estado principal conservado.

### AR-33

**Decisión de diseño AV-07.** CV07-05: distribución modular candidata y fronteras por SO/sesión gráfica; bootstrap, rollback y EXP-04a/b. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Resolver dependencias privadas workspace en paquete público, licencia, engines, target y huella. Verificar distribución limpia.

**Fuente y localizador.** N §6.B, EXP-04; A HA-02, §10.5, §11.2. [HA-02](#alias-ha-02)

**Requisitos afectados.** REQ-INT-001.2, REQ-AGT-001, REQ-ONB-001 como ampliación.

**Evidencia disponible y discrepancia.** A incorpora evidencia de manifiestos y tsup que Neon no cubre. Depende de decisión Node y dependencias. Referencias: N §6.B, EXP-04. A HA-02, §10.5, §11.2.

**Evidencia necesaria.** npm pack limpio, resolución publicada reproducible, licencias y smoke en los tres SO.

**Responsable principal.** AV-07. **Dependencias.** AV-03, AV-06 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de empaquetado G1.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Distribución, alcance y supervisor](dependencias-licencias-av07.md#distribución-y-principal-de-confianza). Candidato local versionado con capacidades bajo demanda. EXP-04a/b, E2/E3/E7. Estado principal conservado.

### AR-34

**Decisión de diseño AV-07.** CV07-01: diez paquetes; reconstrucción selectiva por obligación y garantía, pruebas históricas con procedencia. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Inventariar módulos reutilizables de transporte, saneamiento, alcance, linaje, almacenamiento, ciclos, hashes, build y reporter. Justificar conservar/corregir/sustituir por garantía.

**Fuente y localizador.** N §7; A HA-06, §7–8; H-REV-03/06. [HA-06](#alias-ha-06)

**Requisitos afectados.** REQ-INT-001.1, REQ-MEM-001.1–001.4, REQ-DIS-001.4, REQ-SEG-001.1.

**Evidencia disponible y discrepancia.** A amplía rescate de módulos respecto de N. Reuso parcial no acredita integración de producto. Referencias: N §7. A HA-06, §7–8.

**Evidencia necesaria.** Inventario ruta/versión/licencia, pruebas reutilizables, límites del módulo y plan verificable de migración sombra.

**Responsable principal.** AV-07. **Dependencias.** AV-02, AV-03, AV-05, AV-06 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Antes de congelar estrategia de reconstrucción.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Matriz de reconstrucción](matriz-reconstruccion-av07.md). Decisiones por mecanismo, tests y contrato. Remediaciones AR-24/40 siguen en G0. Estado principal conservado.

### AR-41

**Decisión de diseño AV-07.** CV07-02: máquina de corte durable, exclusión de almacenamiento y despacho, revocaciones y efectos tardíos, E2/G5; corte tras G6.5 y autorización. BLOQUEANTE conservado. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Evitar doble escritor. Migración en sombra, conservación de revisiones, ensayar rollback y excluir recreación por binario legado.

**Fuente y localizador.** N §7; A §7–8, §11.2; H-REV-03; E MVP/Recovery. [H01](#alias-h01), [H04](#alias-h04), [H-REV-03](#alias-h-rev-03)

**Requisitos afectados.** REQ-INT-001.1, REQ-MEM-001.1–001.4, REQ-RUN-001.6, REQ-REP-001.2.

**Evidencia disponible y discrepancia.** Un puntero no impide escritura de proceso antiguo. Skills y documentos legacy incluyen persistencia dual. Referencias: N §7. A §7–8, §11.2. E MVP/Recovery.

**Evidencia necesaria.** Mapa de datos y autoridad, corte ensayado, bloqueo de escritor legado y reconciliación de historial.

**Responsable principal.** AV-07. **Dependencias.** AV-02, AV-03, AV-04 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Crítica. **Estado.** BLOQUEANTE. **Fase.** Antes de corte por proyecto.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Mapa de escritores y corte](persistencia-migracion-av07.md). Fencing eficaz, paridad semántica y rollback sin revivir grants ni perder escrituras. E2 G1/G5; corte real después de G6.5 y autorización. Estado principal conservado.

### AR-51

**Decisión de diseño AV-07.** CV07-06: identidad/licencia/advisory/reachability/artefacto instalado separados; MIT/ISC requiere autorización, SBOM real y alternativas. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Inventario legal y seguridad de las dependencias candidatas y artefactos empaquetados. Elección respaldada por capacidades, licencias y aislamiento.

**Fuente y localizador.** N HN-01/HN-05, §6.B/C/D, §7; A HN-01/HN-05, §7–8, EXP-05a. Localizadores por sección en la fuente.

**Requisitos afectados.** REQ-INT-001.2–001.4, REQ-DOC-001.1, REQ-AUTREP-001, REQ-DAT-001.2.

**Evidencia disponible y discrepancia.** Asunciones de licencia, madurez y formatos cambian por versión. AV-01 conserva criterios y citas de origen. Referencias: N HN-01/HN-05, §6.B/C/D, §7. A HN-01/HN-05, §7–8, EXP-05a.

**Evidencia necesaria.** SBOM/versiones fijadas, textos de licencia y políticas de distribución, evidencia de compatibilidad.

**Responsable principal.** AV-07. **Dependencias.** AV-02, AV-05, AV-06 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Antes de adoptar dependencias G0–G2.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Inventario de admisibilidad](dependencias-licencias-av07.md#inventario-de-admisibilidad). Selección, SBOM de cada variante y revisión de redistribución pendientes. Estado principal conservado.

### AR-54

**Decisión de diseño AV-07.** CV07-08: precedencia normativa y exactitud de IDs; corrección MEM-001.5 por MEM-003.6 en decisión, sin alterar catálogo. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Conciliar instrucciones arquitectónicas legacy con D01–D21, incluidos SQLite/JSON, bloqueos y retención. Evitar que definiciones de otra línea se tomen como catálogo.

**Fuente y localizador.** N §7; A §7–8; H-REV-03/06; D02/D12/D19. Localizadores por sección en la fuente.

**Requisitos afectados.** REQ-MEM-001.1, REQ-RUN-001.3, REQ-INT-001.1, POL-RET-001.

**Evidencia disponible y discrepancia.** La habilidad local describe persistencia dual, blocked derivado y otros TTL. La matriz aplica el acta publicada para este encargo. Referencias: N §7. A §7–8.

**Evidencia necesaria.** Tabla de precedencia con consumidores y contratos objetivo ratificados.

**Responsable principal.** AV-07. **Dependencias.** AV-01, AV-02, AV-03, AV-04 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de adoptar objetivos técnicos.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Precedencia normativa](precedencia-av07.md). Trazabilidad a 92 elementos y 11 ampliaciones, tabla AR-52, captura, retención y retiro de rutas incompatibles. Estado principal conservado.

### AR-57

**Decisión de diseño AV-07.** CV07-01: diez paquetes, seis clases SQLite en cinco familias incl. project-operations.sqlite, escritores por ruta, alcance y estado. [Contravalidación](contravalidacion-chatgpt-high-av07.md) · [Decisión](decision-orquestador-av07-av08.md). Estado principal y pruebas conservados.

**Problema y cierre.** Verificar inventario de paquetes, autoridades SQLite y contratos por entrada. Un recuento LOC no decide conservación.

**Fuente y localizador.** A §2, §7–8, §11.3; N §7; H-REV-03. [H-REV-03](#alias-h-rev-03)

**Requisitos afectados.** REQ-MEM-003.6, REQ-INT-001.1–001.3.

**Evidencia disponible y discrepancia.** Las cifras y criterios de composición entre informes no bastan para concluir que un módulo es reutilizable. Referencias: A §2, §7–8, §11.3. N §7.

**Evidencia necesaria.** Manifest de paquetes, almacenes/escritores, contratos y evidencia de compatibilidad.

**Responsable principal.** AV-07. **Dependencias.** AV-03 **Contravalidador.** Revisor independiente de arquitectura, licencias y distribución.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Antes de adoptar inventario y medidas de migración.

**Riesgo residual.** Riesgo de degradación o incompatibilidad al migrar, actualizar o distribuir.

**Expediente AV-07.** [Topología de responsabilidades](matriz-reconstruccion-av07.md#núcleo-objetivo-y-dependencias) y [cinco familias SQLite](persistencia-migracion-av07.md). E1/E2/E7 deben demostrar escritor único y paridad. Estado principal conservado.

## AV-08 · Aceptación del producto, métricas, validación empresarial y lanzamiento

### AR-06

**Decisión de diseño AV-08.** CV08-01–07/12 y CC08-01–04/08: 103 entradas y subobligaciones por celda, precisión/recall, efectos, casos compuestos, incumplimiento conjunto, veto por afirmación y corpus independiente. DE-03 y pruebas pendientes. [Segunda contravalidación](segunda-contravalidacion-av08.md) · [Decisión](decision-orquestador-av08.md). Estado principal conservado.

**Problema y cierre.** Ratificar corpus, custodio, denominadores y umbrales por app. Medir abstención y falsos FAIL. Aceptación obligatoria separada de generalización y con vetos.

**Fuente y localizador.** N DP-02, DP-10, DE-03, §10.1–10.3, §13.5–6; A O-07, C-06, DE-03, §10.4; Orq §7. [DP-02](#alias-dp-02), [DP-10](#alias-dp-10), [O-07](#alias-o-07), [C-06](#alias-c-06), [DE-03](#alias-de-03), [H11](#alias-h11)

**Requisitos afectados.** D21, REQ-DIS-001.1–001.7, REQ-ORA-001.1–001.7.

**Evidencia disponible y discrepancia.** 80/75 candidatos frente a ≥85/85/90 propuestos. Cinco vetos Neon frente a siete de A. Promedios no acreditan obligaciones. Referencias: N DP-02, DP-10, DE-03, §10.1–10.3, §13.5–6. A O-07, C-06, DE-03, §10.4. Orq §7.

**Evidencia necesaria.** Acta DE-03, manifiesto previo sellado, positivos/mutantes, exclusiones auditables y dos informes distintos.

**Responsable principal.** AV-08. **Dependencias.** AV-01, AV-04 **Contravalidador.** Custodio/revisor de aceptación independiente de implementación.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de G5/G6.

**Riesgo residual.** La generalización y la autorización efectiva se limitan al corpus y alcance ratificados.

### AR-30

**Decisión de diseño AV-08.** CV08-08/11/12 y CC08-05/08: G6.5 representativa después de G6 antes GA, permisos específicos, E2E coherente, evidencia de restauración/reconciliación; corte separado AR-41. BLOQUEANTE conservado. [Segunda contravalidación](segunda-contravalidacion-av08.md) · [Decisión](decision-orquestador-av08.md). Estado principal conservado.

**Problema y cierre.** Condicionar lanzamiento a validación empresarial autorizada, con tenant, roles, operaciones, lectura y alcance ratificados.

**Fuente y localizador.** N DE-04, §11–12; A O-08, C-07, DE-04, §10.4; Orq §7. [O-08](#alias-o-08), [C-07](#alias-c-07), [DE-04](#alias-de-04)

**Requisitos afectados.** D01/D07/D09/D21, REQ-XINST-001, REQ-DAT-001.3–001.4.

**Evidencia disponible y discrepancia.** Neon coloca validación operativa después de G6 sin distinguir salida. A propone G6.5 antes de GA. Referencias: N DE-04, §11–12. A O-08, C-07, DE-04, §10.4. Orq §7.

**Evidencia necesaria.** Acta DE-04, alcance autorizado y evidencias previas a GA. Requiere piloto autorizado posterior a esta revisión.

**Responsable principal.** AV-08. **Dependencias.** AV-02, AV-04, AV-05 **Contravalidador.** Custodio/revisor de aceptación independiente de implementación.

**Severidad.** Alta. **Estado.** BLOQUEANTE. **Fase.** Previo al lanzamiento oficial.

**Riesgo residual.** Lanzamiento con compatibilidad empresarial presumida y política de destino sin acreditar.

### AR-35

**Decisión de diseño AV-08.** CV08-09/12 y CC08-06/08: accesibilidad propia y capacidad AUT independientes, tráfico autorizado y reglas/estados/manuales. DE-05 y pruebas pendientes. [Segunda contravalidación](segunda-contravalidacion-av08.md) · [Decisión](decision-orquestador-av08.md). Estado principal conservado.

**Problema y cierre.** Ratificar nivel por campaña/compuerta. Incluir regla versionada, cobertura, exclusiones y chequeos manuales pendientes.

**Fuente y localizador.** N §2.4.4, DE-05; A §2.3, C-01, DE-05; Orq §7. [DE-05](#alias-de-05)

**Requisitos afectados.** REQ-QA-003, D21.

**Evidencia disponible y discrepancia.** N recomienda opt-in. A reclasifica como RF. La decisión de nivel sigue del propietario. Referencias: N §2.4.4, DE-05. A §2.3, C-01, DE-05. Orq §7.

**Evidencia necesaria.** Acta DE-05 y corpus de estados críticos, cobertura y criterio verificable sin certificar WCAG integral por automatización.

**Responsable principal.** AV-08. **Dependencias.** AV-01, AV-06 **Contravalidador.** Custodio/revisor de aceptación independiente de implementación.

**Severidad.** Media. **Estado.** PENDIENTE. **Fase.** Antes de ratificar lanzamiento.

**Riesgo residual.** La generalización y la autorización efectiva se limitan al corpus y alcance ratificados.

### AR-44

**Decisión de diseño AV-08.** CV08-07/10/11 y CC08-03/07: historia no certifica producto, R2 segundo dominio sintético, V-17/18 sin definición localizada, vigencia/identidad/admisibilidad y conservación autorizada. [Segunda contravalidación](segunda-contravalidacion-av08.md) · [Decisión](decision-orquestador-av08.md). Estado principal conservado.

**Problema y cierre.** Excluir F0 histórico y prototipos como pruebas de producto. Registrar reconstrucción, controles históricos y dependencias de autorización.

**Fuente y localizador.** N §12, §10; A §11.3; E F0/Recovery/R2. [H11](#alias-h11)

**Requisitos afectados.** D21, REQ-AGT-001, REQ-XINST-001, REQ-ORA-001.2–001.7.

**Evidencia disponible y discrepancia.** F0 original sin vectores/hashes y R2 de fixture. Corpus ciego, segundo dominio y LENDUS no acreditados. Referencias: N §12, §10. A §11.3. E F0/Recovery/R2.

**Evidencia necesaria.** E1–E8 nuevos con fuente independiente y acta. Primarios históricos solo mejoran procedencia.

**Responsable principal.** AV-08. **Dependencias.** AV-01, AV-02, AV-03, AV-04 **Contravalidador.** Custodio/revisor de aceptación independiente de implementación.

**Severidad.** Alta. **Estado.** PENDIENTE. **Fase.** Antes de aceptar evidencias de lanzamiento.

**Riesgo residual.** La generalización y la autorización efectiva se limitan al corpus y alcance ratificados.

## Índice de identificadores de origen

Los informes preservados conservan la numeración original de sus secciones. L remite a la línea de la copia en este expediente.

#### Alias DP-01

[N](auditoria-neon.md) L350 · [DP base](../cuestiones-abiertas.md) L7. Registros [AR-05](registro-maestro.md#ar-05).

#### Alias DP-02

[N](auditoria-neon.md) L351 · [DP base](../cuestiones-abiertas.md) L8. Registros [AR-06](registro-maestro.md#ar-06).

#### Alias DP-03

[N](auditoria-neon.md) L352 · [DP base](../cuestiones-abiertas.md) L9. Registros [AR-07](registro-maestro.md#ar-07).

#### Alias DP-04

[N](auditoria-neon.md) L353 · [DP base](../cuestiones-abiertas.md) L10. Registros [AR-08](registro-maestro.md#ar-08), [AR-09](registro-maestro.md#ar-09).

#### Alias DP-05

[N](auditoria-neon.md) L354 · [DP base](../cuestiones-abiertas.md) L11. Registros [AR-10](registro-maestro.md#ar-10).

#### Alias DP-06

[N](auditoria-neon.md) L355 · [DP base](../cuestiones-abiertas.md) L12. Registros [AR-11](registro-maestro.md#ar-11).

#### Alias DP-07

[N](auditoria-neon.md) L356 · [DP base](../cuestiones-abiertas.md) L13. Registros [AR-12](registro-maestro.md#ar-12).

#### Alias DP-08

[N](auditoria-neon.md) L357 · [DP base](../cuestiones-abiertas.md) L14. Registros [AR-13](registro-maestro.md#ar-13), [AR-20](registro-maestro.md#ar-20).

#### Alias DP-09

[N](auditoria-neon.md) L358 · [DP base](../cuestiones-abiertas.md) L15. Registros [AR-14](registro-maestro.md#ar-14).

#### Alias DP-10

[N](auditoria-neon.md) L359 · [DP base](../cuestiones-abiertas.md) L16. Registros [AR-06](registro-maestro.md#ar-06).

#### Alias DP-11

[N](auditoria-neon.md) L360 · [DP base](../cuestiones-abiertas.md) L17. Registros [AR-15](registro-maestro.md#ar-15).

#### Alias DP-12

[N](auditoria-neon.md) L361 · [DP base](../cuestiones-abiertas.md) L18. Registros [AR-16](registro-maestro.md#ar-16).

#### Alias DP-13

[N](auditoria-neon.md) L362 · [DP base](../cuestiones-abiertas.md) L19. Registros [AR-17](registro-maestro.md#ar-17).

#### Alias DP-14

[N](auditoria-neon.md) L363 · [DP base](../cuestiones-abiertas.md) L20. Registros [AR-18](registro-maestro.md#ar-18).

#### Alias DP-15

[N](auditoria-neon.md) L364 · [DP base](../cuestiones-abiertas.md) L21. Registros [AR-19](registro-maestro.md#ar-19).

#### Alias HN-01

[N](auditoria-neon.md) L201 · [A](auditoria-antigravity.md) L88. Registros [AR-20](registro-maestro.md#ar-20).

#### Alias HN-02

[N](auditoria-neon.md) L202 · [A](auditoria-antigravity.md) L89. Registros [AR-27](registro-maestro.md#ar-27).

#### Alias HN-03

[N](auditoria-neon.md) L203 · [A](auditoria-antigravity.md) L90. Registros [AR-15](registro-maestro.md#ar-15), [AR-21](registro-maestro.md#ar-21).

#### Alias HN-04

[N](auditoria-neon.md) L204 · [A](auditoria-antigravity.md) L91. Registros [AR-07](registro-maestro.md#ar-07).

#### Alias HN-05

[N](auditoria-neon.md) L205 · [A](auditoria-antigravity.md) L92. Registros [AR-22](registro-maestro.md#ar-22).

#### Alias HN-06

[N](auditoria-neon.md) L206 · [A](auditoria-antigravity.md) L93. Registros [AR-23](registro-maestro.md#ar-23).

#### Alias HN-07

[N](auditoria-neon.md) L207 · [A](auditoria-antigravity.md) L94. Registros [AR-24](registro-maestro.md#ar-24).

#### Alias HN-08

[N](auditoria-neon.md) L208 · [A](auditoria-antigravity.md) L95. Registros [AR-25](registro-maestro.md#ar-25).

#### Alias HN-09

[N](auditoria-neon.md) L209 · [A](auditoria-antigravity.md) L96. Registros [AR-26](registro-maestro.md#ar-26).

#### Alias HA-01

[A](auditoria-antigravity.md) L315. Registros [AR-24](registro-maestro.md#ar-24).

#### Alias HA-02

[A](auditoria-antigravity.md) L316. Registros [AR-33](registro-maestro.md#ar-33).

#### Alias HA-03

[A](auditoria-antigravity.md) L317. Registros [AR-20](registro-maestro.md#ar-20).

#### Alias HA-04

[A](auditoria-antigravity.md) L318. Registros [AR-04](registro-maestro.md#ar-04), [AR-21](registro-maestro.md#ar-21), [AR-45](registro-maestro.md#ar-45).

#### Alias HA-05

[A](auditoria-antigravity.md) L319. Registros [AR-15](registro-maestro.md#ar-15).

#### Alias HA-06

[A](auditoria-antigravity.md) L320. Registros [AR-34](registro-maestro.md#ar-34).

#### Alias O-01

[A](auditoria-antigravity.md) L102. Registros [AR-27](registro-maestro.md#ar-27).

#### Alias O-02

[A](auditoria-antigravity.md) L136. Registros [AR-09](registro-maestro.md#ar-09).

#### Alias O-03

[A](auditoria-antigravity.md) L150. Registros [AR-20](registro-maestro.md#ar-20).

#### Alias O-04

[A](auditoria-antigravity.md) L172. Registros [AR-28](registro-maestro.md#ar-28).

#### Alias O-05

[A](auditoria-antigravity.md) L189. Registros [AR-08](registro-maestro.md#ar-08).

#### Alias O-06

[A](auditoria-antigravity.md) L220. Registros [AR-29](registro-maestro.md#ar-29).

#### Alias O-07

[A](auditoria-antigravity.md) L242. Registros [AR-06](registro-maestro.md#ar-06).

#### Alias O-08

[A](auditoria-antigravity.md) L257. Registros [AR-30](registro-maestro.md#ar-30).

#### Alias O-09

[A](auditoria-antigravity.md) L270. Registros [AR-31](registro-maestro.md#ar-31).

#### Alias O-10

[A](auditoria-antigravity.md) L289. Registros [AR-25](registro-maestro.md#ar-25), [AR-32](registro-maestro.md#ar-32).

#### Alias C-01

[A](auditoria-antigravity.md) L328. Registros [AR-02](registro-maestro.md#ar-02), [AR-04](registro-maestro.md#ar-04), [AR-28](registro-maestro.md#ar-28).

#### Alias C-02

[A](auditoria-antigravity.md) L329. Registros [AR-07](registro-maestro.md#ar-07), [AR-15](registro-maestro.md#ar-15), [AR-20](registro-maestro.md#ar-20), [AR-21](registro-maestro.md#ar-21), [AR-22](registro-maestro.md#ar-22), [AR-23](registro-maestro.md#ar-23), [AR-26](registro-maestro.md#ar-26).

#### Alias C-03

[A](auditoria-antigravity.md) L330. Registros [AR-08](registro-maestro.md#ar-08).

#### Alias C-04

[A](auditoria-antigravity.md) L331. Registros [AR-24](registro-maestro.md#ar-24), [AR-27](registro-maestro.md#ar-27).

#### Alias C-05

[A](auditoria-antigravity.md) L332. Registros [AR-29](registro-maestro.md#ar-29).

#### Alias C-06

[A](auditoria-antigravity.md) L333. Registros [AR-06](registro-maestro.md#ar-06).

#### Alias C-07

[A](auditoria-antigravity.md) L334. Registros [AR-30](registro-maestro.md#ar-30).

#### Alias C-08

[A](auditoria-antigravity.md) L335. Registros [AR-19](registro-maestro.md#ar-19).

#### Alias DE-01

[N](auditoria-neon.md) L425 · [A](auditoria-antigravity.md) L425. Registros [AR-25](registro-maestro.md#ar-25).

#### Alias DE-02

[N](auditoria-neon.md) L426 · [A](auditoria-antigravity.md) L426. Registros [AR-32](registro-maestro.md#ar-32).

#### Alias DE-03

[N](auditoria-neon.md) L427 · [A](auditoria-antigravity.md) L427. Registros [AR-06](registro-maestro.md#ar-06).

#### Alias DE-04

[N](auditoria-neon.md) L428 · [A](auditoria-antigravity.md) L428. Registros [AR-10](registro-maestro.md#ar-10), [AR-18](registro-maestro.md#ar-18), [AR-30](registro-maestro.md#ar-30).

#### Alias DE-05

[N](auditoria-neon.md) L429 · [A](auditoria-antigravity.md) L429. Registros [AR-35](registro-maestro.md#ar-35).

#### Alias AS-01

[E](../evidencia-archivada.md) L13. Registros [AR-24](registro-maestro.md#ar-24).

#### Alias AS-02

[E](../evidencia-archivada.md) L17. Registros [AR-40](registro-maestro.md#ar-40).

#### Alias AS-03

[E](../evidencia-archivada.md) L21. Registros [AR-07](registro-maestro.md#ar-07), [AR-47](registro-maestro.md#ar-47).

#### Alias AS-04

[E](../evidencia-archivada.md) L25. Registros [AR-27](registro-maestro.md#ar-27), [AR-39](registro-maestro.md#ar-39).

#### Alias EXP-01

[N](auditoria-neon.md) L372 · [A](auditoria-antigravity.md) L454. Registros [AR-15](registro-maestro.md#ar-15).

#### Alias EXP-01a

[A](auditoria-antigravity.md) L454. Registros [AR-15](registro-maestro.md#ar-15).

#### Alias EXP-01b

[A](auditoria-antigravity.md) L454. Registros [AR-15](registro-maestro.md#ar-15).

#### Alias EXP-02

[N](auditoria-neon.md) L373 · [A](auditoria-antigravity.md) L455. Registros [AR-36](registro-maestro.md#ar-36).

#### Alias EXP-03

[N](auditoria-neon.md) L374 · [A](auditoria-antigravity.md) L456. Registros [AR-29](registro-maestro.md#ar-29).

#### Alias EXP-04

[N](auditoria-neon.md) L375 · [A](auditoria-antigravity.md) L457. Registros [AR-37](registro-maestro.md#ar-37).

#### Alias EXP-05

[N](auditoria-neon.md) L376 · [A](auditoria-antigravity.md) L458. Registros [AR-17](registro-maestro.md#ar-17).

#### Alias EXP-05a

[A](auditoria-antigravity.md) L458. Registros [AR-17](registro-maestro.md#ar-17).

#### Alias EXP-05b

[A](auditoria-antigravity.md) L458. Registros [AR-17](registro-maestro.md#ar-17).

#### Alias EXP-06

[N](auditoria-neon.md) L377 · [A](auditoria-antigravity.md) L459. Registros [AR-27](registro-maestro.md#ar-27), [AR-38](registro-maestro.md#ar-38), [AR-39](registro-maestro.md#ar-39).

#### Alias EXP-06a

[A](auditoria-antigravity.md) L459. [Protocolo corregido EXP-06a](protocolos-exp-06-ac.md#exp-06a--viabilidad-y-selección-cierre-g0-y-apertura-g1). Registro [AR-27](registro-maestro.md#ar-27).

#### Alias EXP-06b

[A](auditoria-antigravity.md) L459. Registros [AR-38](registro-maestro.md#ar-38).

#### Alias EXP-06c

[A](auditoria-antigravity.md) L459. [Protocolo corregido EXP-06c](protocolos-exp-06-ac.md#exp-06c--visor-reproducción-revocable-y-paquete-portable-g3g5-y-e6). Registros [AR-27](registro-maestro.md#ar-27) y [AR-39](registro-maestro.md#ar-39).

#### Alias H01

[H](../revision-independiente.md) L17. Registros [AR-12](registro-maestro.md#ar-12), [AR-41](registro-maestro.md#ar-41).

#### Alias H02

[H](../revision-independiente.md) L18. Registros [AR-42](registro-maestro.md#ar-42), [AR-49](registro-maestro.md#ar-49).

#### Alias H03

[H](../revision-independiente.md) L19. Registros [AR-09](registro-maestro.md#ar-09), [AR-43](registro-maestro.md#ar-43).

#### Alias H04

[H](../revision-independiente.md) L20. Registros [AR-41](registro-maestro.md#ar-41).

#### Alias H05

[H](../revision-independiente.md) L21. Registros [AR-07](registro-maestro.md#ar-07), [AR-31](registro-maestro.md#ar-31), [AR-47](registro-maestro.md#ar-47).

#### Alias H06

[H](../revision-independiente.md) L22. Registros [AR-09](registro-maestro.md#ar-09), [AR-13](registro-maestro.md#ar-13), [AR-20](registro-maestro.md#ar-20), [AR-43](registro-maestro.md#ar-43).

#### Alias H07

[H](../revision-independiente.md) L23. Registros [AR-05](registro-maestro.md#ar-05), [AR-36](registro-maestro.md#ar-36), [AR-53](registro-maestro.md#ar-53).

#### Alias H08

[H](../revision-independiente.md) L24. Registros [AR-24](registro-maestro.md#ar-24), [AR-39](registro-maestro.md#ar-39), [AR-50](registro-maestro.md#ar-50).

#### Alias H09

[H](../revision-independiente.md) L25. Registros [AR-24](registro-maestro.md#ar-24), [AR-37](registro-maestro.md#ar-37), [AR-50](registro-maestro.md#ar-50).

#### Alias H10

[H](../revision-independiente.md) L26. Registros [AR-27](registro-maestro.md#ar-27).

#### Alias H11

[H](../revision-independiente.md) L27. Registros [AR-06](registro-maestro.md#ar-06), [AR-19](registro-maestro.md#ar-19), [AR-44](registro-maestro.md#ar-44).

#### Alias H-REV-01

[H](../revision-independiente.md) L60. Registros [AR-24](registro-maestro.md#ar-24), [AR-26](registro-maestro.md#ar-26), [AR-40](registro-maestro.md#ar-40).

#### Alias H-REV-02

[H](../revision-independiente.md) L61. Registros [AR-07](registro-maestro.md#ar-07).

#### Alias H-REV-03

[H](../revision-independiente.md) L62. Registros [AR-41](registro-maestro.md#ar-41), [AR-57](registro-maestro.md#ar-57).

#### Alias H-REV-04

[H](../revision-independiente.md) L63. Registros [AR-27](registro-maestro.md#ar-27), [AR-39](registro-maestro.md#ar-39), [AR-50](registro-maestro.md#ar-50).

#### Alias H-REV-05

[H](../revision-independiente.md) L64. Registros [AR-09](registro-maestro.md#ar-09), [AR-36](registro-maestro.md#ar-36), [AR-43](registro-maestro.md#ar-43), [AR-47](registro-maestro.md#ar-47).

#### Alias H-REV-06

[H](../revision-independiente.md) L65. Registros [AR-12](registro-maestro.md#ar-12), [AR-42](registro-maestro.md#ar-42).
