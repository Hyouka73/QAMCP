# ET-07 · MCP, agentes, APIs, interoperabilidad y CI/CD

Base normativa y de código `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Leer y cumplir íntegramente el [encargo común](encargo-evaluacion-tecnologica.md) y [matriz de responsabilidad](matriz-responsables-et.md). Este documento delimita la especialidad, no reemplaza las restricciones comunes. No elegir definitivamente.

## Alcance exclusivo

Investigar versión/especificación MCP vigente y SDK v1/v2/alternativas, negociación, structuredContent y fallback JSON, herramientas/recursos/prompts y stdio por host (Antigravity, Codex, Claude Code, Gemini CLI; no confundir otros productos), registro/desregistro CAS sin configuración ajena ni secretos, continuidad HOST/DETERMINISTIC y handoff; no API de modelo propia obligatoria ni MANAGED. Evaluar SDK/transportes y contratos UTCP/OpenAPI 3.0/3.1/3.2 por dialecto, refs, validación/schema, auth AND/OR, HTTP y transportes admisibles, operaciones negativas autorizadas (plano control estricto), SSRF/egress y destino efectivos, idempotencia/reconciliación por subefecto con ET-01/03/06; no transportes autónomos/retry/CodeMode arbitrario. Comparar formatos y adaptadores de resultados externos por familias §6.2, contrato consumidor/proveedor y referencias pasivas, paquetes/CSV portables con ET-02/04, CI sin IA/TTY, JUnit parcial §6.1 y guardia, sobre AR-52 exacto, salida y verificación, seguridad PR/env. No convertir informe externo en PASS ni exigir motores/brokers universales. Revisar economía de tokens (adopción canónica inicial/final, ContextSnapshot/paginación, warm/cold, tareas no QA), telemetría real vs estimada; no cuota fija sin evidencia. EXP-01a/b/05a/b/07/08 y E1/E5/E7/E8, cuatro hosts efectivos y compatibilidad instalada. Entregar matriz host/capacidad/versión/transporte, compatibilidad de SDK/runtime, candidatos/limitaciones y pruebas mínimas, sin instalar ni contactar AUT.

## Interdependencias a resolver

ET-01/02/03/04/05/06: ABI, DTO/consulta, testigos, UI parity, JUnit, transporte/secretos. Declarar contrato, candidato requerido/rango, alternativa, riesgo de incompatibilidad y prueba futura. No asumir que el otro especialista ya decidió. Escalar conflictos al Orquestador.

## Entrega

Informe Markdown completo al Orquestador conforme al encargo común, con SHA exacto, fuentes primarias verificables, inventario real, comparación, recomendación condicionada, respaldo, matriz de garantías y calificación futura. Solo lectura. Cero implementación, instalación, experimentos, WBS o acceso empresarial. Detenerse.
