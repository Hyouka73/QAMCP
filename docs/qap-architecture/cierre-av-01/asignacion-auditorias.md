# QAP · Matriz de asignación de auditorías específicas

La asignación identifica el expediente responsable, las dependencias que se deben transferir y el contravalidador propuesto por función. Los nombres y la siguiente intervención quedan a decisión del Orquestador. AV-01 cerrada documentalmente y AV-02 contravalidada.

| Expediente | Estado de intervención | Registros principales | Dependencias que reciben o devuelven evidencia |
|---|---|---|---|
| AV-01 · Integridad y cobertura de requisitos | [Cerrada documentalmente](dictamen-av01.md). | AR-01–04, AR-55–56 | AV-02, AV-03, AV-04, AV-05, AV-06 y AV-08 deben preservar alcance y condiciones probatorias. |
| AV-02 · Seguridad, privacidad y autenticidad | [Aceptada en invariantes de diseño con reservas](decision-orquestador-av02-encargo-av03.md). Validación experimental pendiente. | AR-07, AR-14, AR-24–25, AR-27–28, AR-31–32, AR-40, AR-47 | AV-03: frontera de proceso y secretos. AV-04/05: políticas hasta destino. AV-05/06: custodia, exportación y media. AV-07: remediación y corte. AV-08: riesgo y autorizaciones. |
| AV-03 · Autonomía, memoria, persistencia e interoperabilidad MCP/CLI | [Informe principal publicado (Antigravity)](informe-av03.md). Contravalidación Codex y decisión del Orquestador pendientes. | AR-05, AR-11–12, AR-15, AR-42, AR-45–46, AR-52 | AV-01: continuidad y alcance. AV-02: autoridad y sesión. AV-04: paridad y recuperación. AV-06/07: hosts, soporte y versión. AV-08: adopción. |
| AV-04 · Veracidad funcional, oráculos, E2E, datos mutativos y recuperación | Asignada | AR-08–10, AR-43, AR-53 | AV-02: política y procedencia. AV-03: ejecución soberana y salidas. AV-05: reportes y contratos. AV-08: falsos PASS, limpieza, cobertura y métricas. |
| AV-05 · Documentos, reportes PDF/Excel, UTCP, OpenAPI y cross-instancia | Asignada | AR-13, AR-17–18, AR-20, AR-22, AR-38, AR-48, AR-50 | AV-02: parsers y frontera de autoridad. AV-04: oráculos y datos. AV-06: reportes y exportación. AV-07: licencias y versiones. AV-08: aceptación de negocio. |
| AV-06 · Navegadores, fidelidad visual, concurrencia, rendimiento y compatibilidad | Asignada | AR-16, AR-29, AR-36–37, AR-39, AR-49 | AV-02: privacidad por modo y plataforma. AV-03: eficiencia y frontera persistente. AV-05: evidencia portable. AV-07: empaquetado. AV-08: capacidad acreditada. |
| AV-07 · Reconstrucción selectiva, dependencias, licencias y migración | Asignada | AR-19, AR-21, AR-23, AR-26, AR-33–34, AR-41, AR-51, AR-54, AR-57 | AV-02: remediación y separación de autoridad. AV-03: interoperabilidad y escritor único. AV-04/05/06: contratos, dependencias y compuertas de componente. |
| AV-08 · Aceptación del producto, métricas, validación empresarial y lanzamiento | Asignada | AR-06, AR-30, AR-35, AR-44 | AV-01–AV-06: cobertura, procedencia, autorizaciones, veracidad y evidencias de producto. AV-07: distribución y migración. |

El [registro maestro](registro-maestro.md#distribución-por-auditoría) contiene conteos, severidad, contravalidador y dependencias por registro. Los estados de intervención de esta matriz describen auditorías. Los estados de cada recomendación se documentan con evidencia y criterio de cierre en su propia fila.

## Dependencias de experimentos propuestas

| Experimento | Responsable principal | Punto de decisión que condiciona | Registro |
|---|---|---|---|
| EXP-01a · Protocolo de cuatro hosts | AV-03 | Elección de SDK y arranque de ejecutor antes de congelar G1. | [AR-15](registro-maestro.md#ar-15) · [Protocolo AV-03](informe-av03.md#3-verificación-de-exp-01a-y-exp-01b-y-compuertas) |
| EXP-01b · Adopción, continuidad y tokens | AV-03 | Integración G4 y evaluación de adopción. | [AR-15](registro-maestro.md#ar-15) · [Protocolo AV-03](informe-av03.md#3-verificación-de-exp-01a-y-exp-01b-y-compuertas) |
| EXP-02 · Extractor Discovery SPA | AV-06 | Inicio G2 antes de fijar extractor. | [AR-36](registro-maestro.md#ar-36) |
| EXP-03 · Concurrencia y hardware | AV-06 | G3 antes del modo paralelo por defecto, con repetición instalada en G5. | [AR-29](registro-maestro.md#ar-29) |
| EXP-04 · Empaquetado y navegadores | AV-06 | Smoke G1 y validación G5, después de correcciones de empaquetado. | [AR-37](registro-maestro.md#ar-37) |
| EXP-05a · Factibilidad, licencias y contratos | AV-05 | Antes de congelar puerto, propuesta G0. | [AR-17](registro-maestro.md#ar-17) |
| EXP-05b · DataPlan, reconciliación y referencia | AV-05 | Inicio G3 antes de congelar comportamiento integrado. | [AR-17](registro-maestro.md#ar-17) |
| EXP-06a · Prevención, custodia y viabilidad de captura | AV-02 | Cierre G0 y apertura G1 para ejecutar la implementación de captura privada. | [AR-27](registro-maestro.md#ar-27) · [Protocolo corregido](protocolos-exp-06-ac.md#exp-06a--viabilidad-y-selección-cierre-g0-y-apertura-g1) |
| EXP-06b · Extracción PDF/Excel y cálculo | AV-05 | G2 antes del diseño definitivo de ingesta y aceptación tabular. | [AR-38](registro-maestro.md#ar-38) |
| EXP-06c · Evidencia, visor revocable, accesibilidad y export | AV-06, con criterios de privacidad de AV-02 | G3/G5 y E6 sobre suite integrada y distribución final. | [AR-27](registro-maestro.md#ar-27) · [AR-39](registro-maestro.md#ar-39) · [Protocolo corregido](protocolos-exp-06-ac.md#exp-06c--visor-reproducción-revocable-y-paquete-portable-g3g5-y-e6) |
| EXP-07 · Bóveda persistente, alta local y CI sin TTY | AV-02 | Selección de proveedor G0 y habilitación E2/G1. Depende de AR-04/14/47 y AV-03/07. | [AR-07](registro-maestro.md#ar-07) · [Criterios y dependencias](dictamen-av02.md#exp-07--incorporación-propuesta) |

La posición de los ensayos queda registrada como propuesta para revisión. [AR-19](registro-maestro.md#ar-19) conserva el desacuerdo de secuencia y sus prerrequisitos.
