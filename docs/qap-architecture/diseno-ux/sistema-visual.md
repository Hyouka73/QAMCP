# Sistema visual propuesto

| Componente | Regla de uso |
|---|---|
| Ventana | Cabecera de ámbito, lateral de expediente, centro y un inspector. Referencia escritorio de 205 px / zona flexible / 270 px, con densidad ajustada al contenido. En ancho menor el acceso al expediente pasa arriba y el inspector se apila. |
| Superficies | Oscuro: marco #14131B, panel #191821, centro #121219. Claro: #F3F0F7, #FCFAFF y #FAF8FC. Grilla de puntos para pertenencia al lienzo, sin gradientes de adorno. Fondo plano para edición, diff y cronología. |
| Tipografía | Segoe UI o sans-serif del sistema sin CDN. Escala de 11/12 px para etiquetas secundarias, 14 px para lectura operativa y 19/23 px para inspector y vista. Cifras tabulares en comparación y cronología. Evitar cajas y encabezados repetidos. |
| Selección | Lila estructural, foco visible y texto. Reserva una acción primaria por inspector. Acción no disponible muestra razón de dominio cuando corresponda. |
| Semántica | Menta para testigo o secuencia verificada del diseño; ámbar con patrón para hipótesis o suficiencia pendiente; rosa y texto para contradicción acreditada; azul neutro para contexto. Veredicto textual obligatorio y semántica de color compartida. |
| Nodos y relaciones | Forma por tipo, etiqueta legible, flecha/verbos en impacto, conexión discontinua e hipótesis explícita. Grafo radial al explorar, columnas y sentido izquierda a derecha para pasos. Lectura textual enlazada a los mismos nodos y aristas. |
| Tablas y matrices | Encabezados semánticos por eje. Fila o celda seleccionable y apertura de detalle. Agrupación, filtros y denominador junto a la matriz. Reservar desplazamiento horizontal local cuando la comparación bidimensional lo requiera. |
| Histórico | Superficie de lectura azul gris, datos de corte, sello y separación de disponibilidad. La identidad visual acompaña la frontera efectiva AR-24 prevista por contrato. |
| Recurso entre variantes | Escala, texto y acciones se mantienen bajo zoom, fuente aumentada y movimiento reducido. Con tecnologías de apoyo, el resultado de seleccionar, filtrar o recuperar foco sigue accesible. |

## Internacionalización y accesibilidad

Etiquetas del producto en catálogo por idioma, fragmentos aportados por el usuario con su idioma y procedencia, números, unidades, zona horaria, fechas y pluralización formateados según configuración autorizada. Pruebas con texto expandido, teclado, zoom, lector de pantalla, reflow y ambos temas. Códigos canónicos e IDs conservan semántica. La maqueta muestra controles principales ES/EN. El contenido completo del caso sigue en español como fixture y el catálogo aún es parcial.

La revisión de teclado concentró los momentos de selección, avance, historial, pausa, contexto y acceso a la publicación. Los controles usan botones nativos y las tablas tienen encabezados. La ruta textual conserva acceso a las aristas. DE-05, contraste formal por variante, lector de pantalla, zoom y auditoría integral permanecen por calificar. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
