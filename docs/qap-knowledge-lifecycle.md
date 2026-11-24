> **Vigencia documental.** Este documento conserva el contrato operativo anterior. D04 del acta consolidada prevalece sobre la aprobación humana ordinaria por caso. [Entrada para Gemini Neon](qap-architecture/revision-neon.md).

# Ciclo de conocimiento y automatización de QAP

## Límites de los tres ciclos

| Ciclo | Entrada y compuerta | Resultado canónico |
| --- | --- | --- |
| A. Conocimiento | Workspace autorizado, aplicación, entorno y URL. El host concede observación y QAP resuelve el acceso autorizado cuando lo necesita. | Inventario revisable con alcance, evidencia, pendientes y cobertura. Los candidatos a módulo conservan su condición de hipótesis. |
| B. Construcción | Solicitud de QA, inventario utilizable y alcance de prueba explícito. Las reglas y oráculos que requieran confirmación pasan por revisión humana. | Caso ejecutable generado por QAP, con procedencia de su oráculo, revisión, alcance y aprobación vinculada a su contenido. |
| C. Ejecución | Caso vigente, entorno permitido, sesión vigente y autorización de ejecución. | Intentos, aserciones, evidencias y reportes canónicos. Un resultado inesperado abre una investigación. El QA confirma si existe un defecto. |

Los campos de entrevista describen el objetivo y la fuente de verdad. Su transición de lifecycle se conserva para proyectos existentes. En proyectos gestionados desde `qap_start`, la cobertura del ciclo A condiciona la primera selección de alcance aunque la entrevista ya haya avanzado a SCOPING. El agente continúa el inventario salvo que QAP indique una dependencia humana real. Una pared de login es una dependencia de acceso. Se inventaría el login como objeto de prueba cuando la solicitud de QA lo incluye.

## Identidad, alcance y evidencia

- Una aplicación identifica el producto compartido. Una instancia identifica un despliegue. Un entorno asocia esa instancia con su origen, política operativa y revisión de configuración. Un tenant, rol y perfil limitan la validez de las observaciones y las sesiones. Versión de producto y variante visual son dimensiones independientes de la revisión de entorno. Las dimensiones desconocidas quedan explícitamente sin acreditar. P0 utiliza las identidades de proyecto, aplicación, entorno, tenant, perfil y rol existentes, junto con la revisión del entorno para el inventario.
- Una vista observada acredita que hubo una inspección con evidencia en ese alcance. Un enlace acredita la presencia de una referencia. Un módulo candidato agrupa rutas por prefijo como hipótesis de navegación. Los controles, estados DOM y formularios son capacidades observables. Las aristas de navegación se registran aparte de las dependencias de negocio. Un enlace de contabilidad a pagos permite proponer una relación. El impacto sobre pagos, desembolsos o gastos requiere una regla o un mapa acreditado.
- Una condición de configuración debe identificar su clave, valor, tipo, fuente, alcance efectivo, fecha y evidencia. Flags, parámetros, activación de módulos, permisos y condiciones de negocio pueden producir aplicabilidad `applicable`, `not_applicable` o `indeterminate`. Una vista ausente no acredita que el módulo esté desactivado. Una respuesta 403 acredita acceso denegado para la sesión observada y no prueba la política completa de roles.
- `observado` describe lo capturado por QAP. `inferido` enlaza evidencias y declara una hipótesis. `confirmado` exige la autoridad de negocio y la revisión canónica correspondiente. `evaluado` registra el resultado del runner respecto de un oráculo revisado, con fecha, alcance e intento. Los hallazgos de ejecución pueden abrir nuevas observaciones e hipótesis y conservan íntegro el historial de requisitos confirmados.
- Las autorizaciones QAP son independientes de los permisos de la aplicación. El permiso de observación conserva sus límites y revocación. Login, manipulación de credenciales, revisión, ejecución y limpieza conservan sus propias compuertas. Las sesiones quedan en el host y permanecen fuera del expediente y del reporte.

## Cobertura inicial y reanudación

| Estado | Criterio operativo |
| --- | --- |
| `BLOCKED` | Falta acceso, autorización o una vista funcional inspeccionada con evidencia. La guía devuelve la dependencia o la acción de Discovery. |
| `PARTIAL_READY` | Hay vistas funcionales acreditadas y existen rutas pendientes, bloqueadas, inaccesibles o vistas limitadas. Mientras quede trabajo autorizado en la frontera, se continúa el inventario antes de pedir alcance. Cuando se agota la frontera autorizada, se puede diseñar dentro de las vistas inspeccionadas. |
| `READY` | Se inspeccionó la frontera de navegación observada y autorizada dentro de los límites y quedaron acreditadas las vistas registradas, sin brechas de adquisición. Las reglas y configuraciones pendientes siguen requiriendo evaluación o confirmación. |

El expediente versionado de Discovery conserva estados de ruta, relaciones DOM y referencias a evidencias del Knowledge Store. Una ruta candidata solo pasa a visitada cuando se obtiene una vista inspeccionada. Los checkpoints separan los alcances y permiten retomar la frontera entre procesos. La deduplicación usa rutas canónicas sin consulta ni fragmento cuando su publicación está permitida. El orden favorece navegación principal y rutas menos profundas. Cada lote tiene límites de páginas, profundidad, tiempo, solicitudes y volumen. Las rutas denegadas conservan su razón. Un resultado parcial permite describir exactamente qué inventario se logró.

P0 navega mediante el crawler de QAP. La ampliación automática exige alcance explícito del host para el origen o URLs exactas autorizadas. Se consideran enlaces visibles de navegación, sin clics, envíos de formularios ni operaciones de mutación. GET tiene semántica definida por la aplicación. Las rutas sensibles o con parámetros quedan fuera de la ampliación automática. Las páginas SPA que necesitan recursos fuera del alcance pueden seguir limitadas. El punto de partida y el permiso del host determinan la cobertura acreditable.

## Contrato de casos reutilizables

El objetivo funcional, los requisitos versionados y la semántica del oráculo forman la identidad del caso. Los pasos concretos, datos de entrada y localizadores son una revisión ejecutable. Una variante de UI puede aportar adaptadores que traduzcan acciones funcionales a rutas y localizadores de esa UI, con revisión de compatibilidad. P0 conserva el localizador concreto en el caso generado y lo somete a la aprobación vigente. Un cambio material de oráculo o pasos vuelve a revisión. Las repeticiones usan el mismo identificador y versión del caso y conservan ejecuciones independientes.

Todo dataset de prueba tiene ámbito, procedencia, sintetizador, identificador de ejecución y caducidad. Un grafo de dependencias ordena la preparación y limpieza de entidades. La limpieza exige autorización, se restringe a entidades del dataset y debe ser repetible. El clonado de configuraciones usa campos permitidos y valores sintéticos, con redacción, validación y revisión. Se excluye la copia automática de PII de producción. P0 mantiene el smoke en lectura con datos del fixture.

El runner usa pasos y oráculos tipados. Publica intentos, trazas, evidencias y reportes sin consultas a un modelo durante los pasos. Cuando cambia una dependencia o la ejecución falla, el agente recibe evidencia de los intentos y propone diagnóstico sin reescribir casos o reglas aprobados. Los resultados son comparables por alcance y versión.

## Roadmap

| Prioridad | Entrega |
| --- | --- |
| P0 | Frontera de Discovery reanudable, cobertura y guía por alcance. Consolidación de rutas, vistas, controles, relaciones y pendientes. Caso de lectura generado y aprobado por QAP, ejecutado en Chromium en ambos modos, con reporte y repetición. |
| P1 | Identidades explícitas de despliegue, versión y variante. Catálogo de configuración efectiva y oráculos condicionales acreditados. Mapa revisable de impactos. Adaptadores de interacción y datos sintéticos con limpieza autorizada. |
| P2 | Suites seleccionadas por aplicabilidad, fixtures con dependencias y clonado seguro de configuraciones. Diagnóstico agrupado por firma de fallo y drift. Recuperación acotada de evidencia y presupuesto de tokens por investigación. |

La migración de P0 añade datos opcionales al expediente existente. Los expedientes históricos siguen disponibles con su alcance y versión, y no acreditan por sí solos un inventario inicial extensivo.
