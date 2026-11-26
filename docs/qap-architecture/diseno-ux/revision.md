# Revisión, correcciones y reservas

## Primera pasada — interacción, coherencia y utilidad

| Defecto identificado | Corrección y comprobación conceptual |
|---|---|
| La exploración anterior empezaba en una investigación poblada. Faltaba reconocer un proyecto vacío o recuperar trabajo dentro de un ámbito. | Selector con dos contextos, estado inicial vacío, guía opcional y restauración. Comprobado que el contexto vacío deja de mostrar navegación y datos del expediente. |
| Mapa limitado a selección y saltos. Las aristas eran trazos y la prioridad se perdía entre vistas. | Búsqueda por ID/nombre, agrupación de dominios, centrado, filtro de ruta e hipótesis. La lista de relaciones permite abrir la procedencia de una arista. |
| La primera maqueta no cubría preparar, pausar y recuperar un intento. | Mesa determinista, fuente/oráculo, tres modalidades, validación de datos, permiso previo, revisión en conflicto y conciliación. Se recorrieron los positivos y negativos con fixtures. |
| Una instantánea de navegación podía revertir un estado operativo simulado si se reutilizaba el contenedor de estado completo. | El historial guarda solo la vista, selección y filtros. Se comprobó el regreso después de conciliar. El contexto de proyecto maneja su propia restauración. |
| Comparar dos intentos podía sugerir una causa única; el histórico repetía parte de la interfaz de investigación. | Primera divergencia, cuatro ejes, comparación con dos factores concomitantes y publicación en una escena con datos de retención. El visor explica la diferencia entre hecho publicado, evidencia disponible y verificación actual. |
| Sin variantes de tema e idioma; algunas etiquetas de estado mezclaban color y significado. | Temas para todas las regiones, localización parcial ES/EN, color y texto para incertidumbre y FAIL, alternativa textual y foco visible. |

## Segunda pasada — objeciones antes de entregar

Se revisó desde dos tareas completas y con criterios distintos a la primera pasada. Para principiantes, comprobar descubribilidad, error recuperable y comprensión de límites. Para especialistas, comprobar estabilidad de contexto, datos comparables, independencia de la fuente y reconciliación.

- El selector inicial fallaba al abrir una vista sin tabla de equivalencias de entidades. Se protegió esa transición y se repitieron el estado vacío, guía y regreso al expediente.
- El conflicto de revisión mostraba un aviso, pero no permitía entender el riesgo de adoptar una versión. Se añadió la comparación de oráculo y ventana antes de adoptar la base del ejercicio. En producto, la comparación incluirá base, propuesta y revisión vigente por campo.
- El desfase de color del indicador FAIL podía sugerir conformidad. Se asignó rosa a la contradicción y se mantuvo su etiqueta textual.
- El buscador podía seguir ocupando espacio tras saltar desde un acceso distinto a sus resultados. Ahora se cierra al abrir otro foco. El foco vuelve al control o a la selección al salir de búsqueda o histórico.
- Los nodos de flujo quedaban demasiado cerca en anchos intermedios. Se redujo su anchura y se comprobó ausencia de cruce entre rectángulos de nodos a 1440, 1024, 736, 540 y 420 px. Las vistas estrechas ofrecen conexiones en texto.
- La densidad de tablas y flujo usaba un alto mínimo común, lo que dejaba espacio vacío. Las tablas se compactaron y el lienzo espacial conserva altura de lectura. Se eliminaron los gradientes de adorno.

## Evidencia de revisión local

- Navegador Edge local, archivo abierto desde disco. Se recorrieron las seis vistas, proyectos, mesa, guía, conflicto, bloqueo, conciliación, fuentes, receta e histórico. Se comprobaron sin desbordamiento horizontal de página 1440, 1024, 736, 540 y 320 px en las vistas ejercitadas. Las tablas comparativas pueden tener desplazamiento local.
- Segunda comprobación de teclado con Enter en búsqueda, navegación, comparación, visor, conflicto y recuperación. Se verificaron el foco de búsqueda, el regreso del visor, la preservación de estado y las conexiones en texto. Se inspeccionaron las capturas y se recapturó el estado final después de las correcciones.
- Cero errores de JavaScript y cero solicitudes HTTP(S) observadas durante el recorrido local revisado. El HTML incluye política de contenido restrictiva y carece de conectores. Esto describe el artefacto, sin acreditar seguridad del producto.

## Reservas pendientes

- Pruebas con QA principiantes y experimentados, sobre comprensión de impedimento/contradicción y tiempo hasta la primera conclusión justificada. Medir acierto, recuperación de contexto, esfuerzo e interpretaciones erróneas. Los umbrales de UX-01 son candidatos, separados de los pisos ratificados.
- Auditoría DE-05 y variantes instaladas con teclado, tecnologías de apoyo, zoom elevado, contraste formal, foco, reflow y movimiento reducido. Revisión completa de catálogo ES/EN, pluralización, longitud de textos, región, unidades y zona horaria.
- Rendimiento, escala, memoria y volumen de contexto de agentes con corpus autorizado y procedimiento futuro. La muestra usa menos de diez nodos y un número pequeño de celdas. No respalda latencia, límites de despliegue o ahorro de tokens.
- Contratos de autoridad, paridad, aislamiento AR-24, memoria durable, CAS, revocación, custodia, recálculo por clase y causalidad instrumental se califican en sus fases y variantes. Se preservan pisos, vetos, receptor independiente y salvaguardas del corpus ciego.

La revisión usó exclusivamente la maqueta y documentación. Las decisiones reservadas y la asignación futura están en la [propuesta de integración](integracion-pm-wbs.md).
