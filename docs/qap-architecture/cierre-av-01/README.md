# QAP · Entrada única para contravalidadores

**Expediente de cierre documental y contravalidación.** Base c1d1680e6531a5132456665ca6851b6cbf5ff528 · origin/develop · 24 de noviembre de 2026.

**AV-01 cerrado documentalmente. AV-02 aceptada por el Orquestador para continuar las auditorías, con reservas y validación experimental pendiente. AV-03 aceptada por el Orquestador en diseño enmendado con reservas y validación experimental pendiente. La tabla de AR-52 se entrega en AV-04 para decisión del Orquestador.** La arquitectura híbrida de AR-27 es candidata. El diseño definitivo de captura privada, la ejecución de su implementación y la activación de `PRIVATE_AUTHORIZED` están sujetos a las compuertas de la [fe de correcciones](fe-correcciones-ar27.md). La arquitectura global sigue pendiente. [Decisión del Orquestador y encargo AV-03](decision-orquestador-av02-encargo-av03.md).

**Gobernanza vigente.** [Decisión AV-03, reasignación Neon/Codex y encargo AV-04](decision-orquestador-av03-encargo-av04.md). Antigravity queda temporalmente fuera de las auditorías, no del alcance de compatibilidad del producto.

**AV-04.** [Dictamen independiente](dictamen-av04.md) favorable al diseño enmendado con reservas, pendiente de decisión del Orquestador y validación experimental. [Enmiendas](enmiendas-av04.md) · [Protocolos](protocolos-av04.md) · [Encargo vinculante](encargo-contravalidacion-av04.md) · [Informe principal de Neon, antecedente](informe-neon-av04.md).

## Revisión del expediente

- [Dictamen independiente AV-01](dictamen-av01.md) y [catálogo vigente](../catalogo-requisitos.md).
- [Dictamen independiente AV-02](dictamen-av02.md), [fe de correcciones AR-27](fe-correcciones-ar27.md) y [protocolos corregidos EXP-06a/c](protocolos-exp-06-ac.md).
- [Dictamen independiente AV-03](dictamen-av03.md), [enmiendas](enmiendas-av03.md) y [protocolos experimentales](protocolos-av03.md).
- [Informe principal AV-03](informe-av03.md) (antecedente de Antigravity) y [encargo vinculante de contravalidación](encargo-contravalidacion-av03.md).
- [Resolución de Antigravity, antecedente AR-27](resolucion-ar27.md), [encargo](encargo-orquestador-av01-av02.md) y [propuesta Neon](contravalidacion-neon-av01-av02.md).
- [Matriz individual](matriz-semantica.md), [registro maestro y estados](registro-maestro.md#estados-vigentes), [asignaciones](asignacion-auditorias.md) y [discrepancias](discrepancias.md).
- [Fuentes recuperadas](fuentes-recuperadas/README.md), [D01–D21](../acta-decisiones.md) y [evidencia archivada](../evidencia-archivada.md).
- [Informe inicial de AV-01](informe.md), antecedente histórico preservado.

## Fuentes y procedencia

| Insumo | Autoría y fecha que constan | Procedencia y tratamiento |
|---|---|---|
| [Auditoría Final de Requisitos y Arquitectura Objetivo](auditoria-neon.md) | Gemini Neon, Investigador Principal y Arquitecto de QAP. 24 de noviembre de 2026. SHA auditado `ea804a5b141659c68cd85305ca4bbaeeb431bc0e`. | Archivo Markdown suministrado por el usuario, preservado byte a byte. SHA-256 `1670b99292985b731fe9331f27622135035e7e247808eaf46725d397abad260c`. |
| [Revisión Técnica Independiente Final de la Arquitectura](auditoria-antigravity.md) | Atribuida a Antigravity por el encargo. El informe se identifica por el rol de Auditor Técnico Independiente bajo el Orquestador. 24 de noviembre de 2026. Mismo SHA auditado. | Texto pegado por el usuario. El informe comienza en la línea 63 del insumo. El preámbulo anterior es una transcripción de actividad, ajena al cuerpo firmado por rol. Se preservaron el cuerpo y su numeración. Se sustituyó un enlace con ruta local personal por el documento relativo. En HA-01 se omitieron dos ejemplos operativos de una línea, con marcadores visibles. Se conservan el diagnóstico y las recomendaciones defensivas. |
| Encargo del Orquestador | «QAP — Cierre de recomendaciones y auditoría específica AV-01», §§1–10, recibido el 24 de noviembre de 2026. | Texto pegado por el propietario. Se usa para alcance de intervención, precedencia y precisiones de §§6–8. Sus recomendaciones conservan contravalidación pendiente. |
| Acta y catálogo base | Propietario y consolidación documental. | [D01–D21](../acta-decisiones.md), [catálogo](../catalogo-requisitos.md), [trazabilidad](../trazabilidad.md) y [evidencia archivada](../evidencia-archivada.md). Las fuentes recuperadas y pendientes se detallan por efecto concreto en [discrepancias](discrepancias.md#fuentes-primarias-y-efecto-concreto). |

Los dos informes archivados conservan sus dictámenes `APROBABLE CON CORRECCIONES`. Sus afirmaciones técnicas y recomendaciones mantienen esa atribución. Los documentos de esta ronda registran los contrastes, no un acto del propietario.
