# ET-01 · Núcleo, lenguaje, runtime y reconstrucción selectiva

Base normativa y de código `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Leer y cumplir íntegramente el [encargo común](encargo-evaluacion-tecnologica.md) y [matriz de responsabilidad](matriz-responsables-et.md). Este documento delimita la especialidad, no reemplaza las restricciones comunes. No elegir definitivamente.

## Alcance exclusivo

Contrastar TypeScript/Node actual (incluidos Node LTS, SDK, pnpm/tsup y límites ABI) con alternativas razonables de núcleo y componentes (p. ej. Rust, Go, .NET, Python donde aporte valor), sin asumir reescritura completa ni mezclar lenguajes sin costo justificado. Revisar los diez paquetes, dependencias reales, imports dinámicos, interfaces, deuda legacy, grafo y autoridad; reutilizar por garantía, no porcentaje de LOC. Proponer módulos/puertos, DTO versionados, control de efectos, máquina de estados/colas durables, scheduler, límites, DataPlan y TypedRuleOracle sin eval, precisión decimal y tiempo civil/instante, validación de esquemas, trazabilidad y pruebas de contratos/property-based. Separar AUT de pruebas propias. Comparar build, diagnóstico, compatibilidad con ET-02–07, IPC y packaging, consumo/latencia de arranque, esfuerzo y costo de operar. Node LTS/driver/SDK/Playwright previos son candidatos históricos, no selección actual. Examinar AV-03/04/07, AR-26/34/42/52/54/57, E1/E2/E3/E7 y EXP-07/08; fijar límites entre ejecutor soberano, HOST, UI, CLI/MCP/CI y adaptadores. No cambiar D02/D03 ni introducir servicio remoto. Entregar propuesta de composición lógica, lista por paquete conservar/endurecer/adaptar/reemplazar/retirar con evidencia y dependencias, no WBS.

## Interdependencias a resolver

ET-02/03/04/06/07: ABI, IPC, autoridad, scheduler, tipos, distribución, contratos. Declarar contrato, candidato requerido/rango, alternativa, riesgo de incompatibilidad y prueba futura. No asumir que el otro especialista ya decidió. Escalar conflictos al Orquestador.

## Entrega

Informe Markdown completo al Orquestador conforme al encargo común, con SHA exacto, fuentes primarias verificables, inventario real, comparación, recomendación condicionada, respaldo, matriz de garantías y calificación futura. Solo lectura. Cero implementación, instalación, experimentos, WBS o acceso empresarial. Detenerse.
