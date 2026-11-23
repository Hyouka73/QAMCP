# Encargo 1 · Codex High (investigador principal)

**Rol:** arquitecto/investigador del código existente; no ejecutor de reconstrucción productiva.

## Entrada
- Leer `docs/QAP-VISION-AUTONOMIA.md`, este expediente completo y código de la rama de recuperación.
- Inspeccionar `@qap/mcp`, runner, orquestación, knowledge, CLI, auth y smoke scripts en sus **ubicaciones reales**, sin rutas heredadas.
- Comparar la base `d4cfadf` con otras ramas si hay componentes útiles. No fusionar automáticamente cambios.

## Trabajo concreto

1. **Establecer línea base reproducible**: Node/pnpm/Playwright, compilación, tipos MCP, smoke/contratos. Clasificar diagnósticos por causa raíz. No maquillar mediante `skipLibCheck`, `any` o borrado de tests.
2. **Seguir el recorrido de una intención real**: entrada MCP → campaña → caso → runner → evidencia/veredicto. Identificar quién controla cada transición y dónde el modelo del host puede sustituir QAP por scripts improvisados. Separar limitaciones del host de errores del servidor.
3. **Localizar el falso positivo exacto**: ¿qué considera éxito el runner después de un POST? ¿Qué aserciones verifica? Preparar un escenario sano y otro mutante que devuelvan igual HTTP 201 pero difieran en persistencia. Contrato de testigo separado, sin usar el mismo canal/caché.
4. **Diseñar el parche vertical mínimo**, no un nuevo monolito entero: contrato de caso/revisión, oráculo con fuente independiente, eventos y evidencia oficial, replay sin IA. Identificar reutilización real del legado.
5. **Preparar plan de falsación real**: controles E3 negativos, segunda implementación independiente de expectativas, mutantes sin hardcodes, estado de E1 HOST y E5 documental, aislamiento de seguridad.
6. **LENDUS CORE**: registrar solo capacidades de dominio documentadas y fuentes accesibles; mantener reglas específicas en datos/adaptadores, no en núcleo. No afirmar certificación con documentación antigua.

## Entrega obligatoria a Hydrogen

Registrar en `docs/qap-recovery/handoff-codex-high.md`:
- commit inspeccionado, comandos y salidas observadas;
- contratos/rutas exactas del código;
- tabla defecto → causa raíz → cambio mínimo → test negativo;
- lista ordenada de tareas implementables, dependencias y riesgos;
- criterios de aceptación verificables por otro proceso;
- qué conclusiones son hipótesis y cómo falsarlas.

**Stop:** no escribir parches de producción; no inventar resultados; no modificar compuertas para que pasen; no iniciar G1/F1. Conservar secretos fuera de logs y commits. Enviar al coordinador el SHA del commit del handoff y sus bloqueos concretos.
