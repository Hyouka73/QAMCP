# ET-04 · Interfaz gráfica local y experiencia profesional

Base normativa y de código `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Leer y cumplir íntegramente el [encargo común](encargo-evaluacion-tecnologica.md) y [matriz de responsabilidad](matriz-responsables-et.md). Este documento delimita la especialidad, no reemplaza las restricciones comunes. No elegir definitivamente.

## Alcance exclusivo

Comparar interfaz web local autenticada, desktop shell (Electron, Tauri u otros pertinentes) y alternativas híbridas/nativas desde costo total, UX QA, seguridad y distribución real, no seleccionar por tamaño nominal del binario. Evaluar React/Vue/Svelte u otras opciones solo cuando pertinentes; compatibilidad de renderer, WebView por SO, accesibilidad, offline, soporte, actualizaciones y dependencias transitivas. Separar UI operacional de visor AR-24 por frontera efectiva, no directo DB/vault, IPC/origen autenticado, CSRF/replay donde aplique, único escritor; colaborar ET-06. Diseñar flujos mínimos v1 sin IA ni terminal: proyecto/base y reglas, casos/pasos/datasets/plantillas, sets/asignaciones, estrategia/riesgo, manual/híbrida/automática, charters, evidencia/defectos/retest, import/export y reportes, estados abiertos y cuatro ejes. Verificar navegación por teclado, foco, reflow, semántica, contraste, tecnologías de apoyo y estados críticos propios, no confundir AUT. Evaluar tablas grandes/virtualización, formularios/esquemas, filtros, internacionalización, errores y recuperación, reproducción de medios protegida (ET-05), límites de UI frente a CLI/MCP/CI. No diseñador universal, servidor central ni colaboración concurrente v1. Proponer arquitectura de presentación/contratos de comandos y consultas (ET-01/02), perfil de seguridad y UX, costo real y fallback que conserve UI B. EXP-08a/b/c, E1/E2/E3/E6/E7, DE-05, REQ-HUM, CAS-002, STR y REP-002.

## Interdependencias a resolver

ET-01/02/05/06/07: comandos/queries, viewer/Range, autenticación e IPC, packaging y paridad. Declarar contrato, candidato requerido/rango, alternativa, riesgo de incompatibilidad y prueba futura. No asumir que el otro especialista ya decidió. Escalar conflictos al Orquestador.

## Entrega

Informe Markdown completo al Orquestador conforme al encargo común, con SHA exacto, fuentes primarias verificables, inventario real, comparación, recomendación condicionada, respaldo, matriz de garantías y calificación futura. Solo lectura. Cero implementación, instalación, experimentos, WBS o acceso empresarial. Detenerse.
