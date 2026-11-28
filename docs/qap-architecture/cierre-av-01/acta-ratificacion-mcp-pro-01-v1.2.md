# Acta de ratificación del propietario · MCP-PRO-01 v1.2

**28 de noviembre de 2026 · Hyouka73/QAMCP · develop**

## Decisión y alcance

El propietario ratificó expresamente el [expediente MCP-PRO-01 v1.2](mcp-pro-01-v1.2.md) y sus nueve correcciones documentales MCP-C01–C09, con las reservas de calificación experimental. La ratificación alcanza las [enmiendas de §4](mcp-pro-01-v1.2.md#4-enmiendas-normativas-propuestas) y su trazabilidad probatoria por fase. La fuente del acto es el encargo de publicación recibido del propietario, §1. La [entrega íntegra en Codex](codex://threads/01a2234e-ee08-7712-884a-5e4d7e6baba1) conserva la recomendación emitida por el autor antes de esta ratificación. El refrendo independiente corresponde a v1.1. [Refrendo diferencial](codex://threads/01a22349-b7a6-7693-8633-0e23cc4996a5).

El acto autoriza la publicación documental, la actualización controlada de [PM-01 v1.2](plan-maestro-reconstruccion-et.md), [WBS-01 v1.2](wbs-reconstruccion-et.md) y [TR-WBS-01 v1.2](trazabilidad-wbs-et.md) y el ajuste del [índice del expediente](README.md). La implementación, instalaciones, experimentos, aprovisionamiento, acceso a sistemas empresariales y publicación npm quedan fuera del alcance. Las variantes y tecnologías siguen siendo candidatas a calificación.

## Identidad documental y experimental

La [ratificación de planificación v1.1](acta-ratificacion-plan-v1.1.md) fija el SHA `ede09c1d2d4f39a3c48eb53a476a97678ff87450`. Sus textos se conservan en Git. [PM-01 v1.1](https://github.com/Hyouka73/QAMCP/blob/ede09c1d2d4f39a3c48eb53a476a97678ff87450/docs/qap-architecture/cierre-av-01/plan-maestro-reconstruccion-et.md) · [WBS-01 v1.1](https://github.com/Hyouka73/QAMCP/blob/ede09c1d2d4f39a3c48eb53a476a97678ff87450/docs/qap-architecture/cierre-av-01/wbs-reconstruccion-et.md) · [TR-WBS-01 v1.1](https://github.com/Hyouka73/QAMCP/blob/ede09c1d2d4f39a3c48eb53a476a97678ff87450/docs/qap-architecture/cierre-av-01/trazabilidad-wbs-et.md).

El commit que publica esta acta identifica la revisión normativa documental 1.2. El [acta acotada de G0-01.a](https://github.com/Hyouka73/QAMCP/blob/928f3d5504edb412b2c5b4216d607fc0d8ed1adf/docs/qap-architecture/cierre-av-01/acta-autorizacion-g0-01-a.md) mantiene el SHA experimental `928f3d5504edb412b2c5b4216d607fc0d8ed1adf` y el árbol `c5a45094f83925b76ef440531bb0d11e90c1ddb5`. **G0-01.a permanece SIN ADJUDICACIÓN. ENTORNO NO ADMITIDO.**

## Resolución de MCP-C01–C09

La resolución es documental. Las condiciones de la última columna se adjudican con evidencia de la fase y la identidad aplicables, conforme a la [matriz temporal ratificada](trazabilidad-wbs-et.md#controles-mcp-pro-01-por-obligación-identidad-y-fase).

| Corrección | Resolución documental ratificada | Fundamento y calificación pendiente |
| --- | --- | --- |
| **MCP-C01** · Distribución reproducible | **RESUELTA · conservada** | §1.2 y C01.1. Reproducibilidad, grafo efectivo, ABI y redistribución se acreditan por variante en G1/G5, con admisibilidad G0. [C01.1](trazabilidad-wbs-et.md#c011). |
| **MCP-C02** · Identidad previa a la autoridad | **RESUELTA EN DISEÑO** | §1.2, PM-01 §5 y C02.1 especifican arranque independiente, vigencia, rotación, revocación y barrera previa a autoridad. Pendientes alta efectiva, implementación y ensayos por modo y plataforma. [C02.1](trazabilidad-wbs-et.md#c021). |
| **MCP-C03** · Ciclo MCP, sondeos y continuidad | **RESUELTA EN DISEÑO** | §1.3 y C03.1/C03.3 restituyen los cuatro ceros, los oráculos y el rechazo de EXP-01a. Pendiente observación instalada y continuidad por celda. [C03.1](trazabilidad-wbs-et.md#c031), [C03.2](trazabilidad-wbs-et.md#c032), [C03.3](trazabilidad-wbs-et.md#c033). |
| **MCP-C04** · Registro por HOST | **RESUELTA · conservada** | §1.4 y C04.1–.4. Pendiente exclusión efectiva por build, HOST y superficie. [C04.1–.4](trazabilidad-wbs-et.md#c0414). |
| **MCP-C05** · Paridad y adjudicación por fase | **RESUELTA EN DISEÑO** | §1.5 y C05.1/.3/.7/.8 asignan por fase contrato, vertical, paridad, cotejo externo, oráculo regional, replay y repetición. Pendiente resultado instalado, incluido CI y `qap run`. [C05.1](trazabilidad-wbs-et.md#c051), [C05.2](trazabilidad-wbs-et.md#c052), [C05.3](trazabilidad-wbs-et.md#c053), [C05.4](trazabilidad-wbs-et.md#c054), [C05.5](trazabilidad-wbs-et.md#c055), [C05.6](trazabilidad-wbs-et.md#c056), [C05.7](trazabilidad-wbs-et.md#c057), [C05.8](trazabilidad-wbs-et.md#c058). |
| **MCP-C06** · Actualización, baja y recuperación | **RESUELTA · conservada** | §1.6 y C06.1. Pendientes cortes, recuperación, fence y restauración por candidato. [C06.1](trazabilidad-wbs-et.md#c061). |
| **MCP-C07** · Composición por plataforma | **RESUELTA · conservada** | §1.7 y C07.1. Pendiente calificación de composiciones y fronteras por variante. [C07.1](trazabilidad-wbs-et.md#c071). |
| **MCP-C08** · Congelación y asignación temporal de evidencias | **RESUELTA EN DISEÑO** | §1.8, enmiendas y matriz separan productos, consumidores, sello y adjudicaciones. Se conservan grafo, testigos, denominadores y reserva. Pendientes las fichas y mediciones autorizadas, incluida la reducción de tokens. [C08.1](trazabilidad-wbs-et.md#c081), [C08.2](trazabilidad-wbs-et.md#c082). |
| **MCP-C09** · Referencias y recorrido canónico | **RESUELTA · conservada** | Referencias estáticas cotejadas. El defecto funcional de `qap run` conserva su estado abierto hasta el recorrido canónico instalado. [C09.1](trazabilidad-wbs-et.md#c091). |

## Reservas y precedencia

Permanecen pendientes la acreditación de bytes, runtime, fronteras, variantes npm persistente y `npx`, cuatro HOST, exclusión efectiva, paridad, continuidad, recuperación, consumo y ahorro de tokens. El alta, ancla, claves y huellas siguen sujetos a emisión y calificación. El recorrido de `qap run` instalado hasta el resultado canónico permanece abierto. MIT continúa sujeta a verificación de titularidad y compatibilidad, con armonización de metadatos pendiente. El sello G5, certificación, piloto, corte y liberación conservan sus actos y compuertas.

Se conserva la estructura ratificada de 71 subtareas, 44 paquetes y 142 dependencias únicas. Las unidades conservan responsables, predecesores y salidas formales. La [secuencia del Plan Maestro](plan-maestro-reconstruccion-et.md#4-compuertas-y-camino-de-entrega) y el [índice inverso de trazabilidad](trazabilidad-wbs-et.md#índice-inverso-por-subtarea) identifican los productores, consumidores, sellos y adjudicaciones de cada fase.

Nota editorial. La publicación conserva el texto íntegro de la entrega recuperada y actualiza los destinos de dos referencias externas, [`bundleDependencies`](https://docs.npmjs.com/cli/v12/configuring-npm/package-json/#bundledependencies) y [API criptográfica de Node.js](https://nodejs.org/api/crypto.html).
