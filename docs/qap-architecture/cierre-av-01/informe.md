# AV-01 · Integridad y cobertura de requisitos

**Dictamen: VALIDABLE CON CORRECCIONES CONCRETAS.**
**Base auditada:** `ea804a5b141659c68cd85305ca4bbaeeb431bc0e` de `origin/develop`.
**Fecha:** 24 de noviembre de 2026. **Responsable:** Codex, auditor de trazabilidad documental.

El cotejo confirma 82 IDs históricos recuperados indirectamente, cinco añadidos, 11 ampliaciones, tres candidatos, dos políticas de origen, 92 IDs propuestos y 21 áreas del propietario. Dentro del inventario disponible se conserva la identidad de cada requisito. La propuesta todavía requiere enmiendas de alcance, aceptación y procedencia para que pueda usarse como especificación objetivo congelada.

La corrección de la redacción puede realizarse con el catálogo y D01–D21 para todas las obligaciones identificadas. La ausencia de Entregas 1–2 y Adenda deja una incertidumbre concreta sobre condiciones originales y posibles obligaciones fuera de la matriz. La objeción AR-01 debe resolverse antes de acreditar equivalencia completa con los primarios. No se identificó una obligación vigente del acta que resulte imposible reconstruir con la evidencia disponible. [Discrepancias y fuentes pendientes](discrepancias.md).

## Método y límites

1. Se leyó el árbol del SHA remoto sin usar el contenido divergente del checkout local. Se cotejaron los encabezados del catálogo con las filas de Etapa 3 y con Neon §2.3 por ID, orden y obligación. Se compararon las 11 ampliaciones contra sus referencias en Neon, incluidos los grupos M1–M5.
2. Se examinó la obligación por fila con su dependencia, ámbito, aceptación candidata, revisión original recuperada y delta introducido. Se contrastaron las excepciones e invariantes con el acta y se trazaron las 21 áreas de decisión a ambos informes y a los registros de cierre. La matriz distingue lo preservable por referencia al texto completo de las enmiendas de contrato.
3. Se comprobaron los cinco tags y las rutas históricas disponibles por lectura Git. Se recontaron las identidades y sumas del JSON de diagnósticos de ese SHA. Se conservaron los resultados archivados según su entorno y procedencia.
4. La clasificación histórica 60/20/7 queda como referencia analítica. Neon propone 62 RF, 21 RNF, 9 POL. Antigravity propone 63 RF, 20 RNF, 9 POL al mover QA-003 de RNF a RF. Sus observaciones adicionales sobre el vector de alcance y secretos conservan sus propios criterios. El número final queda abierto a necesidades del contrato.

[Lectura individual, ampliaciones y decisiones](matriz-semantica.md) · [Fuentes y procedencia](README.md#fuentes-y-procedencia).

## Correcciones para cerrar AV-01

| Corrección | Obligación que debe conservarse | Evidencia de cierre |
|---|---|---|
| Baseline y clasificaciones | Vínculo normativo a los 87 IDs, las 11 ampliaciones y las cinco salidas de las promociones. Candidatos y políticas mantienen su procedencia, incluso donde se consolidan. QA-003 es una capacidad y su grado de cobertura de lanzamiento sigue sujeto a DE-05. | Matriz ratificada con clase primaria, etiquetas, alias, autoridad y aceptación completa. [AR-02](registro-maestro.md#ar-02), [AR-03](registro-maestro.md#ar-03), [AR-35](registro-maestro.md#ar-35). |
| Alcance persistente y regional | Mantener proyecto, aplicación, instancia, entorno, tenant, perfil, rol, versión y configuración. Representar variante visual y congelar idioma, locale, zona y moneda donde afectan expectativas, replay o aislamiento. | Contrato con ejemplos donde cambien perfil o dimensión regional y evidencia de separación y replay. [AR-04](registro-maestro.md#ar-04), [AR-45](registro-maestro.md#ar-45). |
| Oráculos y cierre de campaña | Seis veredictos y cuatro ejes. Preservar verificación estructural y testigos causales. Una campaña exclusivamente estructural queda sin acreditación funcional. Omisiones obligatorias y limpieza pendiente quedan visibles en un resultado no exitoso. | Tabla exhaustiva de agregación y paridad para alcance, abstenciones, omisiones y limpieza. [AR-08](registro-maestro.md#ar-08), [AR-09](registro-maestro.md#ar-09). |
| Autenticidad y custodia | Integridad y autenticidad de origen acreditadas por separado bajo un modelo de amenazas explícito. Temporales privados protegidos desde la primera escritura. Permisos independientes y precedencia de revocación privada. | Contratos con fronteras de confianza, evidencia de origen y custodia, reglas de autorización y evidencia necesaria para AV-02. [AR-27](registro-maestro.md#ar-27), [AR-28](registro-maestro.md#ar-28), [AR-32](registro-maestro.md#ar-32). |
| D11 y D15 | Reportes del AUT conciliados por registro y total. Estados de fórmula/caché y cálculo Excel separados de la regla contable acreditada. Fidelidad visual separada de preferencias conversacionales. | Dos criterios D15 independientes, y contrato D11 con fuente, tolerancia, abstención y caso de un centavo. [AR-16](registro-maestro.md#ar-16), [AR-20](registro-maestro.md#ar-20). |
| Aceptación integral | Discovery persistente, transferencia multirol y multimódulo, permisos, regresión, evidencias reales, impacto soportado y validación empresarial autorizada previa al lanzamiento. Promedios de generalización independientes del cumplimiento obligatorio. | Criterios de alcance, denominadores, vetos, acceso ratificado y dependencia de fases explícitos. [AR-05](registro-maestro.md#ar-05), [AR-06](registro-maestro.md#ar-06), [AR-30](registro-maestro.md#ar-30), [AR-43](registro-maestro.md#ar-43). |
| Primarios y procedencia | Indicar origen indirecto y material original pendiente. Separar brechas de alcance de pérdidas de prueba histórica. | Resolución explícita del propietario sobre recuperación o aceptación de la limitación concreta. [AR-01](registro-maestro.md#ar-01), [AR-44](registro-maestro.md#ar-44). |

Se revisaron especialmente AUT completo y Discovery profundo, dependencia/continuidad entre agentes, preparación de datos por contrato, objetivos documentales, formatos y testigos, autenticidad de evidencia, permisos, privacidad, variantes regionales, accesibilidad, uso de recursos, soporte, historial y aprendizaje. La aceptación de cada aspecto está enlazada a la obligación que se preserva. La ubicación de la resolución técnica y de su prueba queda en las AV correspondientes. [Matriz individual](matriz-semantica.md) · [Asignación](asignacion-auditorias.md).

## Cómputo y resultados verificables

| Unidad | Conteo | Resultado |
|---|---:|---|
| IDs originales | 82 | Mapeo uno a uno con la matriz secundaria Etapa 3. |
| IDs añadidos | 5 | Mapas individuales de cross-instancia, i18n, contrato API, accesibilidad y adopción. |
| Ampliaciones | 11 | Integradas en sus padres. UTCP/OpenAPI se conserva en DAT-001.2 e INT-001.4. |
| Promociones y políticas | 3 candidatos y 2 políticas de origen | Cinco destinos normativos. La política de captura se comparte con el desdoblamiento de CAND-SEG-001. |
| Elementos propuestos | 92 | 87 IDs base y cinco nuevos destinos distintos. |
| Áreas de decisión | 21 | D01–D21 conservan autoridad frente a los informes. |
| Registros maestros | 57 | 55 abiertos, una validación documental de inventario y una sustitución de atribución histórica. |
| Deuda TypeScript histórica | 93 grupos / 142 diagnósticos | 93 identidades y 142 diagnósticos en cada grupo baseline/current. Los 144 de Recovery/R2 corresponden a otro alcance y la medición actual sigue pendiente. |

La validación documental [AR-55](registro-maestro.md#ar-55) y la sustitución de procedencia [AR-56](registro-maestro.md#ar-56) se circunscriben al cotejo de esta ronda. El resto conserva su estado de cierre o ratificación.

**Dictamen AV-01: VALIDABLE CON CORRECCIONES CONCRETAS.** La arquitectura, las decisiones empresariales DE-01–DE-05 y los experimentos requieren sus respectivas intervenciones. AV-02–AV-08 se asignan para seguimiento. Esta ronda termina con la entrega del expediente.
