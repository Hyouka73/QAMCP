# Ciclo de conocimiento y automatización de QAP

## Límites de los tres ciclos

| Ciclo | Entrada y compuerta | Resultado canónico |
| --- | --- | --- |
| A. Conocimiento | Workspace autorizado y destino de pruebas declarado en la política privada del host. | Inventario con alcance, evidencias, cobertura y checkpoints reanudables. |
| B. Construcción | Vistas inspeccionadas y controles verificables en el mismo alcance. El modelo interpreta la evidencia. | Caso materializado por QAP con procedencia, revisión y elegibilidad automática. Las expectativas sin fuente quedan indeterminadas. |
| C. Ejecución | Snapshot vigente, política activa y sesión válida cuando el entorno la requiere. | Intentos, aserciones, evidencias y reportes canónicos. Los intentos permiten comparar resultados y diagnosticar fallos. |

`qap_start` inicia el ciclo ordinario y continúa el inventario por lotes dentro de los límites del host. Cuando se agota la frontera, entrega las vistas a `qap_plan` para diseñar y materializar. Una pared de login señala una dependencia de acceso. Los historiales y recibos de entrevistas anteriores conservan su trazabilidad.

## Identidad, alcance y evidencia

- Una aplicación identifica el producto compartido. Una instancia identifica un despliegue. Un entorno asocia esa instancia con su origen, política operativa y revisión de configuración. Un tenant, rol y perfil limitan la validez de las observaciones y las sesiones. Versión de producto y variante visual son dimensiones independientes de la revisión de entorno. Las dimensiones desconocidas quedan explícitamente sin acreditar. P0 utiliza las identidades de proyecto, aplicación, entorno, tenant, perfil y rol existentes, junto con la revisión del entorno para el inventario.
- Una vista observada acredita que hubo una inspección con evidencia en ese alcance. Un enlace acredita la presencia de una referencia. Un módulo candidato agrupa rutas por prefijo como hipótesis de navegación. Los controles, estados DOM y formularios son capacidades observables. Las aristas de navegación se registran aparte de las dependencias de negocio. Un enlace de contabilidad a pagos permite proponer una relación. El impacto sobre pagos, desembolsos o gastos requiere una regla o un mapa acreditado.
- Una condición de configuración debe identificar su clave, valor, tipo, fuente, alcance efectivo, fecha y evidencia. Flags, parámetros, activación de módulos, permisos y condiciones de negocio pueden producir aplicabilidad `applicable`, `not_applicable` o `indeterminate`. Una vista ausente no acredita que el módulo esté desactivado. Una respuesta 403 acredita acceso denegado para la sesión observada y no prueba la política completa de roles.
- `observado` describe lo capturado por QAP. `inferido` enlaza evidencias y declara una hipótesis. `acreditado` identifica una expectativa que puede justificarse con una fuente admisible. `evaluado` registra lo que comprobó el runner, junto con fecha, alcance e intento. `INDETERMINATE` conserva una brecha de evidencia y `SKIPPED_BY_POLICY` identifica una acción fuera del alcance.
- Las autorizaciones QAP son independientes de los permisos de la aplicación. La configuración del host delimita la observación, el perfil, la ejecución y las operaciones sintéticas. Las sesiones quedan en el host y permanecen fuera del expediente y del reporte.

## Cobertura inicial y reanudación

| Estado | Criterio operativo |
| --- | --- |
| `BLOCKED` | Falta acceso, autorización o una vista funcional inspeccionada con evidencia. La guía devuelve la dependencia o la acción de Discovery. |
| `PARTIAL_READY` | Hay vistas funcionales acreditadas y existen rutas pendientes, bloqueadas, inaccesibles o vistas limitadas. Mientras quede trabajo autorizado en la frontera, se continúa el inventario antes de pedir alcance. Cuando se agota la frontera autorizada, se puede diseñar dentro de las vistas inspeccionadas. |
| `READY` | Se inspeccionó la frontera de navegación observada y autorizada dentro de los límites y quedaron acreditadas las vistas registradas, sin brechas de adquisición. Las reglas y configuraciones pendientes siguen requiriendo evaluación o confirmación. |

El expediente versionado de Discovery conserva estados de ruta, relaciones DOM y referencias a evidencias del Knowledge Store. Una ruta candidata solo pasa a visitada cuando se obtiene una vista inspeccionada. Los checkpoints separan los alcances y permiten retomar la frontera entre procesos. La deduplicación usa rutas canónicas sin consulta ni fragmento cuando su publicación está permitida. El orden favorece navegación principal y rutas menos profundas. Cada lote tiene límites de páginas, profundidad, tiempo, solicitudes y volumen. Las rutas denegadas conservan su razón. Un resultado parcial permite describir exactamente qué inventario se logró.

P0 navega mediante el crawler de QAP. La ampliación automática exige alcance explícito del host para el origen o URLs exactas autorizadas. Se consideran enlaces visibles de navegación, sin clics, envíos de formularios ni operaciones de mutación. GET tiene semántica definida por la aplicación. Las rutas sensibles o con parámetros quedan fuera de la ampliación automática. Las páginas SPA que necesitan recursos fuera del alcance pueden seguir limitadas. El punto de partida y el permiso del host determinan la cobertura acreditable.

## Contrato de casos reutilizables

En el MVP, el caso estructural enlaza la revisión del inventario, el control observado y la política de su entorno. SQLite conserva la identidad, expectativas y pasos tipados. El archivo YAML es una proyección verificable. `qap_plan` y `qap_test` comprueban la misma elegibilidad y `qap_test` ejecuta el snapshot admitido. Las repeticiones usan el mismo identificador y versión y registran intentos independientes.

El MVP admite lectura y una operación sintética acotada por intento en un fixture aislado. La política fija la vista, el control, el destino `POST`, el cuerpo y la operación de limpieza. El runner activa ese permiso únicamente durante el paso tipado y limpia el fixture antes de publicar el intento. Una interrupción con estado incierto conserva el intento y bloquea otra mutación hasta la recuperación del entorno.

El runner usa pasos y oráculos tipados. Publica intentos, trazas, evidencias y reportes sin consultas a un modelo durante los pasos. Cuando cambia una dependencia o la ejecución falla, el agente recibe evidencia de los intentos y propone diagnóstico sin reescribir casos o reglas aprobados. Los resultados son comparables por alcance y versión.

## Roadmap

| Prioridad | Entrega |
| --- | --- |
| P0 | Frontera de Discovery reanudable. Casos estructurales materializados y admitidos por evidencia y política, con intento, repetición y reporte oficial. |
| P1 | Identidades explícitas de despliegue, versión y variante. Catálogo de configuración efectiva y oráculos condicionales acreditados. Mapa revisable de impactos. Adaptadores de interacción y datos sintéticos con limpieza autorizada. |
| P2 | Suites seleccionadas por aplicabilidad, fixtures con dependencias y clonado seguro de configuraciones. Diagnóstico agrupado por firma de fallo y drift. Recuperación acotada de evidencia y presupuesto de tokens por investigación. |

La migración de P0 añade datos opcionales al expediente existente. Los expedientes históricos siguen disponibles con su alcance y versión, y no acreditan por sí solos un inventario inicial extensivo.
