# QAP · Matriz de asignación de auditorías específicas

La asignación identifica el expediente responsable, las dependencias que se deben transferir y el contravalidador propuesto por función. Los nombres y la siguiente intervención quedan a decisión del Orquestador. AV-01 cerrada documentalmente y AV-02 contravalidada.

| Expediente | Estado de intervención | Registros principales | Dependencias que reciben o devuelven evidencia |
|---|---|---|---|
| AV-01 · Integridad y cobertura de requisitos | [Cerrada documentalmente](dictamen-av01.md). | AR-01–04, AR-55–56 | AV-02, AV-03, AV-04, AV-05, AV-06 y AV-08 deben preservar alcance y condiciones probatorias. |
| AV-02 · Seguridad, privacidad y autenticidad | [Aceptada en invariantes de diseño con reservas](decision-orquestador-av02-encargo-av03.md). Validación experimental pendiente. | AR-07, AR-14, AR-24–25, AR-27–28, AR-31–32, AR-40, AR-47 | AV-03: frontera de proceso y secretos. AV-04/05: políticas hasta destino. AV-05/06: custodia, exportación y media. AV-07: remediación y corte. AV-08: riesgo y autorizaciones. |
| AV-03 · Autonomía, memoria, persistencia e interoperabilidad MCP/CLI | [Aceptada en diseño enmendado con reservas](decision-orquestador-av03-encargo-av04.md). Pruebas pendientes. Tabla AR-52 aceptada en diseño AV-04. [Antecedente de Antigravity](informe-av03.md). | AR-05, AR-11–12, AR-15, AR-42, AR-45–46, AR-52 | AV-01: continuidad y alcance. AV-02: autoridad y sesión. AV-04: paridad y recuperación. AV-06/07: hosts, soporte y versión. AV-08: adopción. |
| AV-04 · Veracidad funcional, oráculos, E2E, datos mutativos y recuperación | [Aceptada en diseño enmendado](decision-orquestador-av04-encargo-av05.md). Pruebas pendientes. | AR-08–10, AR-43, AR-53 | AV-02: política y procedencia. AV-03: ejecución soberana e invariantes de salida. AV-04 entrega [contratos AR-05/52](enmiendas-av04.md#8--integración-y-compuertas). AV-05: reportes y contratos. AV-08: falsos PASS, limpieza, cobertura y métricas. |
| AV-05 · Documentos, reportes PDF/Excel, UTCP, OpenAPI y cross-instancia | [Aceptada en diseño enmendado con reservas](decision-orquestador-av05-encargo-av06.md). AR-20 mantiene bloqueo de selección e integración; pruebas pendientes. | AR-13, AR-17–18, AR-20, AR-22, AR-38, AR-48, AR-50 | AV-02: parsers y frontera de autoridad. AV-04: oráculos y datos. AV-06: portabilidad, recursos, accesibilidad y medios. AV-07: sandbox, versiones, licencias y distribución. AV-08: alcance por clase, corpus y autoridad empresarial. |
| AV-06 · Navegadores, fidelidad visual, concurrencia, rendimiento y compatibilidad | [Informe de Codex publicado](informe-av06.md). [Aceptada en diseño enmendado con reservas](decision-orquestador-av06-encargo-av07.md). [Contravalidación ChatGPT High](contravalidacion-chatgpt-high-av06.md). Pruebas pendientes. | AR-16, AR-29, AR-36–37, AR-39, AR-49 | AV-02: privacidad por modo y plataforma. AV-03: eficiencia y frontera persistente. AV-05: evidencia portable. AV-07: empaquetado. AV-08: capacidad acreditada. |
| AV-07 · Reconstrucción selectiva, dependencias, licencias y migración | [Informe publicado por Codex](informe-av07.md); pendiente de contravalidación ChatGPT High y decisión. [Encargo](decision-orquestador-av06-encargo-av07.md). | AR-19, AR-21, AR-23, AR-26, AR-33–34, AR-41, AR-51, AR-54, AR-57 | AV-02: remediación y separación de autoridad. AV-03: interoperabilidad y escritor único. AV-04/05/06: contratos, dependencias y compuertas de componente. Transferencia documental de instalación y corte para AV-08. |
| AV-08 · Aceptación del producto, métricas, validación empresarial y lanzamiento | Asignada | AR-06, AR-30, AR-35, AR-44 | AV-01–AV-06: cobertura, procedencia, autorizaciones, veracidad y evidencias de producto. AV-07: distribución y migración. |

El [registro maestro](registro-maestro.md#distribución-por-auditoría) contiene conteos, severidad, contravalidador y dependencias por registro. Los estados de intervención de esta matriz describen auditorías. Los estados de cada recomendación se documentan con evidencia y criterio de cierre en su propia fila.

## Responsables vigentes por instrucción del propietario

| Expediente | Principal | Contravalidador |
|---|---|---|
| AV-04 | Neon | Codex |
| AV-05 | Neon | Codex |
| AV-06 | Codex | ChatGPT High (sustitución temporal de Neon) |
| AV-07 | Codex | ChatGPT High mientras Neon no esté disponible |
| AV-08 | Orquestador | Codex y contravalidador temporal ChatGPT High (Neon si vuelve y propietario confirma) |

Antigravity queda temporalmente fuera de la ejecución de auditorías; sus informes históricos y la compatibilidad MCP exigida se preservan. [Decisión y encargo AV-04](decision-orquestador-av03-encargo-av04.md).

## Dependencias de experimentos propuestas

| Experimento | Responsable principal | Punto de decisión que condiciona | Registro |
|---|---|---|---|
| EXP-01a · Protocolo de cuatro hosts | AV-03 | Calificación G0 previa a selección de SDK y arranque; repetición instalada G1/G5. | [AR-15](registro-maestro.md#ar-15) · [Protocolo AV-03](protocolos-av03.md#exp-01a--compatibilidad-mcp) |
| EXP-01b · Adopción, continuidad y tokens | AV-03 | Integración G4 y evaluación de adopción. | [AR-15](registro-maestro.md#ar-15) · [Protocolo AV-03](protocolos-av03.md#exp-01b--adopción-y-tokens) · [Suplemento AV-06](protocolos-av06.md#suplemento-exp-01b--medición-pareada-del-contexto) |
| EXP-02 · Extractor Discovery SPA | AV-06 | Inicio G2 antes de fijar extractor. | [AR-36](registro-maestro.md#ar-36) · [Protocolo](protocolos-av06.md#exp-02--discovery-fidelidad-y-extractores) |
| EXP-03 · Concurrencia y hardware | AV-06 | G3 antes del modo paralelo por defecto, con repetición instalada en G5. | [AR-29](registro-maestro.md#ar-29) · [Protocolo](protocolos-av06.md#exp-03--concurrencia-y-hardware) |
| EXP-04 · Empaquetado y navegadores | AV-06 | EXP-04a G1 y EXP-04b G5, con AV-07 y EXP-01a. | [AR-37](registro-maestro.md#ar-37) · [Protocolo](protocolos-av06.md#exp-04--instalación-canales-y-modos) |
| EXP-05a · Factibilidad, licencias y contratos | AV-05 | Antes de congelar puerto, propuesta G0. | [AR-17](registro-maestro.md#ar-17) · [Protocolo](protocolos-av05.md#exp-05a--factibilidad-de-protocolos-y-selección) |
| EXP-05b · DataPlan, reconciliación y referencia | AV-05 | Inicio G3 antes de congelar comportamiento integrado. | [AR-17/18/48](protocolos-av05.md#exp-05b--dataplan-efecto-y-referencia) |
| EXP-06a · Prevención, custodia y viabilidad de captura | AV-02 | Cierre G0 y apertura G1 para ejecutar la implementación de captura privada. | [AR-27](registro-maestro.md#ar-27) · [Protocolo corregido](protocolos-exp-06-ac.md#exp-06a--viabilidad-y-selección-cierre-g0-y-apertura-g1) |
| EXP-06b · Extracción, aislamiento y reportes emitidos | AV-05 | G2 selección, G3 descarga integrada, G6/E8 certificación. | [AR-13/20/22/38](protocolos-av05.md#exp-06b--extracción-aislamiento-y-reportes-emitidos) |
| EXP-06c · Evidencia, visor revocable, accesibilidad y export | AV-06, con criterios de privacidad de AV-02 | G3/G5 y E6 sobre suite integrada, con E7 para paridad y distribución. | [AR-27](registro-maestro.md#ar-27) · [AR-39](registro-maestro.md#ar-39) · [Protocolo corregido](protocolos-exp-06-ac.md#exp-06c--visor-reproducción-revocable-y-paquete-portable-g3g5-y-e6) · [Ampliación AV-06](protocolos-av06.md#ampliación-compatible-exp-06c--medios-a11y-y-portabilidad) |
| EXP-07 · Bóveda persistente, alta local y CI sin TTY | AV-02 | Selección de proveedor G0 y habilitación E2/G1. Depende de AR-04/14/47 y AV-03/07. | [AR-07](registro-maestro.md#ar-07) · [Criterios y dependencias](dictamen-av02.md#exp-07--incorporación-propuesta) |

Para AV-04, [E1/E7, E3/E4, E5 y E8](protocolos-av04.md) detallan pruebas pendientes, con EXP-05a/b y EXP-06b en su dependencia de AV-05.

[DAG y protocolos de calificación AV-07](compuertas-av07.md) consolidan EXP y E1–E8 sin sustituir las condiciones de los protocolos aceptados. [AR-19](registro-maestro.md#ar-19) conserva su estado principal.
