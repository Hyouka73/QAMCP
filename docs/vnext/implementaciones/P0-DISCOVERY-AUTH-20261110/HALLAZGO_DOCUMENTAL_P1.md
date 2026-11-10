# P1 — Hallazgo Documental: Ingesta de Manual Extenso y Desalineación de Fuente de Verdad

**Fecha:** 2026-11-10  
**Severidad:** P1 (Hallazgo registrado para evolución arquitectónica de Ingesta; fuera del alcance de remediación de P0)  
**Workspace de referencia:** `c:\Users\Judirico\Documents\lendus-qap`  
**Aplicación:** Lendus CORE (Sistema de administración y manejo de cartera de créditos)  

---

## 1. Incidente reproducido en aceptación de usuario

Durante la prueba de aceptación real de QAP en `lendus-qap`:
1. El workspace contenía:
   - El PDF original: `MANUAL_LENDUS_CORE.pdf` (69 MB, 464 páginas).
   - La carpeta convertida: `manual_markdown/` (generada por una herramienta de conversión como Docling), conteniendo `README.md`, `indice.md`, `manual_completo.md`, y capítulos desglosados (`00_preliminares.md`, `01_introduccion.md`, `02_arquitectura.md`, `03_sistema.md`, etc.).
2. Al ejecutar `qap_status` en la compuerta de ONBOARDING, el detector heurístico de fuentes de verdad seleccionó y recomendó:
   ```
   (Recommended) manual_markdown/README.md
   ```
3. Al consultar el objetivo con `qap_context_ingest` sobre dicho archivo, el objetivo extraído y propuesto al usuario fue:
   > *"Manual Lendus CORE: Conversión documental del PDF original de 464 páginas; el PDF original no se modifica."*
4. El usuario rechazó de inmediato la propuesta:
   > *«No, eso es solo el manual de toda la plataforma. hay que ajustar, o revisar, investiga que es lendus core. sale?»*

---

## 2. Causa raíz técnica

1. **Confusión entre artefacto de soporte técnico y producto del negocio:**
   - La herramienta de conversión documental generó un `README.md` descriptivo de la *tarea de conversión técnica* (herramienta, opciones de conversión, hashes y advertencia de no modificar el PDF original).
   - El algoritmo heurístico de ranking de documentos en ONBOARDING priorizó el nombre `README.md` en la raíz de `manual_markdown/` con ranking 0 por encima de los capítulos de negocio (`03_sistema.md`, `manual_completo.md`, etc.).
   - La extracción semántica del objetivo tomó la descripción de dicho README técnico en lugar de indagar la procedencia o el contenido funcional del manual.

2. **Ingesta documental monolítica vs manuales extensos:**
   - Documentos de más de 100 páginas (como el manual de 464 páginas de Lendus) no caben en una ventana de contexto estándar ni deben ingerirse como un único bloque sin estructura.
   - El modelo actual de ingesta procesa archivos individuales completos (`docPath` o `docContent`) sin un concepto de índice capitular o árbol de procedencia.

---

## 3. Líneas de investigación para la futura ingesta por capítulos (P1)

Para abordar este hallazgo sin inflar ni alterar el alcance focal del P0 actual, se especifican las siguientes pautas de diseño para el backlog de vNext:

1. **Ingesta jerárquica guiada por índice:**
   - Reconocer estructuras de manuales cuando existan archivos como `indice.md`, `TOC.md` o secciones `# Índice` en Markdown.
   - Extraer la estructura de capítulos y módulos funcionales identificados en el índice antes de intentar resumir el objetivo global del sistema.

2. **Trazabilidad y referencias de procedencia:**
   - Asociar a cada propuesta inferida la referencia explícita del capítulo, sección y página de origen en el documento base (por ejemplo: `fuente: manual_markdown/03_sistema.md#L45`, `procedencia: manual_pdf_pág_32`).
   - Evitar afirmar o fingir que el manual de 464 páginas fue procesado o comprendido en su totalidad si solo se inspeccionó un subconjunto de capítulos.

3. **Filtrado de artefactos de conversión y meta-documentación:**
   - Clasificar metadatos de conversión técnica (p. ej. scripts de conversión, notas de exportación Docling/Pandoc) como artefactos instrumentales, descartándolos como candidatos de "Fuente de verdad del negocio".
   - Si se detecta un `README.md` cuya temática principal es una herramienta de conversión, degradar su ranking y recomendar al usuario el índice o el capítulo de introducción del sistema.

---

## 4. Compromiso de alcance

Conforme al criterio de gobernanza de QAP, este hallazgo se mantiene registrado como P1 sin contaminar el P0 de autorización interactiva de navegación exploratoria.
