---
name: minimalist-clean-ui
description: >-
  Guía y estándares de diseño para interfaces web minimalistas, limpias y de alta calidad estética (estilo Obsidian, Graphify, Linear y Vercel).
  Úsala siempre que el usuario solicite diseñar o mejorar la interfaz visual (UI), experiencia de usuario (UX), componentes gráficos o visualizaciones de datos interactivos.
---

# Minimalist & Clean UI Skill

Esta skill define el sistema de diseño, tokens, patrones de micro-interacción y arquitectura visual para interfaces web modernas de alto impacto estético, garantizando un equilibrio perfecto entre **minimalismo funcional** y **excelencia visual**.

---

## 1. Filosofía de Diseño

1. **Jerarquía Visual Inequívoca:** El contenido principal (nodos, gráficos, datos) debe ser el protagonista. Las barras de herramientas, leyendas y controles flotan con ligereza y discreción.
2. **Glassmorphism Funcional:** Superficies oscuras translúcidas con desenfoque de fondo (`backdrop-filter: blur(16px)`), bordes sutiles de 1px (`rgba(255, 255, 255, 0.08)`) y sombras profundas pero suaves.
3. **Colores Semánticos Curados:** Evitar colores primarios estridentes. Utilizar paletas modernas HSL calibradas para alto contraste en modo oscuro:
   - **Fondo base:** `#080a11` / `#0d1117`
   - **Superficie elevada:** `#111827` con transparencias
   - **Acentos de estado:**
     - Verde Esmeralda (Éxito / Tests activos): `#10b981` con resplandor `rgba(16, 185, 129, 0.25)`
     - Ámbar Cálido (Descubierto / Advertencia): `#f59e0b` con resplandor `rgba(245, 158, 11, 0.25)`
     - Rojo Coral (Riesgos críticos / Fallos): `#f43f5e` con resplandor `rgba(244, 63, 94, 0.25)`
     - Cian Neón (Prerrequisitos / Conectores): `#06b6d4`
     - Violeta Eléctrico (Flujos / Procesos): `#8b5cf6`
4. **Micro-interacciones y Vida:**
   - Transiciones suaves (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Efectos de enfoque (*focus dimming*): al seleccionar o interactuar con un elemento, los elementos no relacionados reducen sutilmente su opacidad.
   - Partículas o pulsos sutiles en conexiones de red para dar sensación de dinamismo orgánico.

---

## 2. Tokens de Diseño CSS

```css
:root {
  /* Fondos */
  --bg-canvas: #080a11;
  --bg-surface: rgba(17, 24, 39, 0.75);
  --bg-surface-hover: rgba(31, 41, 55, 0.85);
  --bg-card: #0f172a;
  
  /* Bordes */
  --border-glass: rgba(255, 255, 255, 0.08);
  --border-glass-hover: rgba(255, 255, 255, 0.18);
  --border-focus: rgba(99, 102, 241, 0.5);

  /* Texto */
  --text-main: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  /* Acentos */
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  --accent-cyan: #06b6d4;
  --accent-violet: #8b5cf6;
  --accent-blue: #3b82f6;

  /* Sombras y Luces */
  --shadow-glow-emerald: 0 0 20px rgba(16, 185, 129, 0.3);
  --shadow-glow-rose: 0 0 20px rgba(244, 63, 94, 0.3);
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  
  /* Tipografía */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 3. Patrones de Grafos Interactivos (Graphify / Obsidian Style)

Para renderizar grafos de nodos en Canvas HTML5:

1. **Física Suave (Verlet/Euler con Fricción Viscosa):**
   - Repulsión cuadrática inversa con límite de distancia para evitar aceleraciones infinitas.
   - Amortiguación elástica de Hooke con distancia natural holgada (~140px a 200px).
   - Atracción suave al centro para evitar que los nodos se dispersen indefinidamente.
2. **Estética de Nodos:**
   - Círculos de doble anillo (anillo exterior con halo degradado y núcleo sólido luminoso).
   - Pulso de luz en nodos seleccionados o activos.
   - Tipografía monocromática nítida con sombra suave de texto para legibilidad sobre cualquier fondo.
3. **Estética de Aristas:**
   - Líneas curvas suaves (curvas cuadráticas) o rectas translúcidas con flechas minimalistas dirigidas.
   - Partículas de flujo que viajan a lo largo de la arista para indicar dirección de datos.
4. **Efecto de Aislamiento Visual:**
   - Al posar el ratón o hacer clic en un nodo $N$, todos los nodos no conectados a $N$ bajan su opacidad a `0.15`.
   - Las conexiones directas de $N$ se iluminan intensamente.

---

## 4. Patrones para Paneles de Información (Drawer)

- Despliegue lateral con `transform: translateX()` y `cubic-bezier(0.16, 1, 0.3, 1)`.
- Secciones bien diferenciadas con micro-etiquetas en mayúsculas pequeñas (`font-size: 10px; letter-spacing: 0.08em; color: var(--text-muted)`).
- Badges interactivos con copia al portapapeles de 1 clic para rutas y selectores.
- Indicador visual inmediato de seguridad para selectores PII con iconos protectores (`🛡️ PII Masked`).

---

## 5. Patrones para Reportes y Evidencias

- **Resumen Numérico:** Tarjetas compactas (*stat cards*) en la parte superior con contadores en negrita y etiquetas tenues.
- **Comparador Antes / Después:**
  - Slider interactivo divisor o selector de pestañas para comparar la pantalla sin enmascarar vs la captura con máscara de PII aplicada.
- **Zoom y Pan:** Visor de imágenes en pantalla completa (*lightbox*) con fondo negro translúcido y cierre con tecla Escape o clic fuera.
