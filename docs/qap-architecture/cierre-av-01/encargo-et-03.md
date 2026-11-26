# ET-03 · Navegadores, automatización y ejecución

Base normativa y de código `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Leer y cumplir íntegramente el [encargo común](encargo-evaluacion-tecnologica.md) y [matriz de responsabilidad](matriz-responsables-et.md). Este documento delimita la especialidad, no reemplaza las restricciones comunes. No elegir definitivamente.

## Alcance exclusivo

Comparar Playwright (versions/distribuciones y binarios reales), Puppeteer/CDP, Selenium/WebDriver/BiDi y otras alternativas pertinentes; considerar motor propio solo si evidencia justifica costo, no por preferencia. Distinguir Chromium completo/shell, Chrome/Edge, Firefox parcheado/stock, WebKit/Safari y capacidades por SO/CPU, canal, modalidad visible real/headless, instalación bajo demanda, perfil de navegador y recursos efectivos. Revisar adaptador/runner, Discovery DOM/ARIA/red, iframes, SPA/virtualización, estados, localizadores, drift, esperas, permisos y fidelidad (no degradación JS/CSS/img/font/hidratación), navegación legítima sin ampliar autoridad. Evaluar scheduler local, reserva/pressure, W=1 fallback temporal, W>1 viable, alternancia apps, wizard pin, manual/híbrida y unidad compuesta de concurrencia AUT (solapamiento real, testigo, barrera de efectos y contaminación externa), sin confundir carga masiva. Evaluar testigos y acciones UI/API complementarias, accesibilidad automatizada y humana en coordinación ET-04, preparación/sesiones con ET-06. Captura multimedia se coordina ET-05/06: disponibilidad API, producers, modos, primer byte y primer cuadro, no certificar por delete ni vídeo vacío. Revisar AR-05/09/10/13/16/17/27/29/35/43/53, CV06 y EXP-02/03/04/05b/06a/c. Matriz real de compatibilidad y gaps; costos descargados/instalados/activos por celda, sin confundir benchmarks de terceros con QAP.

## Interdependencias a resolver

ET-01/05/06/07: scheduler, productores y custodia, identidad, auth/network/API. Declarar contrato, candidato requerido/rango, alternativa, riesgo de incompatibilidad y prueba futura. No asumir que el otro especialista ya decidió. Escalar conflictos al Orquestador.

## Entrega

Informe Markdown completo al Orquestador conforme al encargo común, con SHA exacto, fuentes primarias verificables, inventario real, comparación, recomendación condicionada, respaldo, matriz de garantías y calificación futura. Solo lectura. Cero implementación, instalación, experimentos, WBS o acceso empresarial. Detenerse.
