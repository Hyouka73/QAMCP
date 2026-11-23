# Encargo 2 · Hydrogen (ejecutor principal)

**Dependencia:** comenzar al disponer del `handoff-codex-high.md` con contratos reales, criterio de éxito y commit. Hydrogen no debe dar por probados los resultados históricos del expediente.

## Alcance autorizado
- Implementar **solo en laboratorio aislado** y en rama de trabajo derivada de la recuperación, dejando intacto el núcleo de producción.
- Instalar dependencias y motores de prueba necesarios **dentro de límites autorizados**; ejecutar browser/SUT sintético, MCP real y procesos observadores; no producción ni sistemas financieros reales.
- Reutilizar código y contratos reales de QAP siempre que sea posible, sin reemplazarlos con un MCP de juguete cuando la prueba anuncia integración real.

## Orden de ejecución

1. Volver a producir **falso positivo del runner heredado**: sano y mutante devuelven 201; mutante no persiste; registrar evidencia cruda antes de corregir.
2. Reproducir **12 controles técnicos E3** y cuatro clases históricas de falsos PASS que consten en el protocolo recuperable; si no se conservó su definición exacta, crear **nuevas pruebas negativas explícitas**, jamás fingir que son idénticas a las perdidas.
3. Construir evaluador experimental con **referencias de resultado independientes**, origen y nivel de independencia del testigo, límites de decimal/tiempo/configuración y abstención explícita.
4. Vertical: intención natural → host real autorizado → MCP real QAP → caso/revisión fijados → Chromium → escritura real en SUT controlado → SQLite observado desde conexión/proceso independiente → PASS sano, FAIL mutante → reporte oficial.
5. Reiniciar MCP/servicio; recuperar campaña, rechazar artefacto adulterado; ejecutar mismo `RunSpec` sin inferencia ni redescubrimiento, comparar efecto y veredicto.
6. Aplicar parche experimental para diagnósticos MCP y verificar tipos estrictos, build y compatibilidad, sin alterar branch productiva hasta autorización.
7. Ampliar solo si la vertical anterior supera revisión: segundo dominio, I3 cálculo y conciliación, extracción de documentos primarios con fuentes versionadas. Preparar interfaces E2 ciegas, sin mirar fixtures secretos.

## Cómo demostrar cada resultado
Por cada prueba: commit de código, línea base, comandos de reproducción, dataset sintético, log sanitizado, proceso observador, hash calculado **después** de generar el artefacto y comparación sano/mutante.

Prohibido: hardcodear `FAIL`/valores de mutante como si procedieran de SUT, cambiar expectativas tras ver respuestas, usar librerías del evaluador para producir el valor esperado, etiquetar harness toy como MCP real, considerar solo exit code 137 voluntario como SIGKILL externo.

## Entrega
- Archivos de laboratorio y scripts reproducibles versionados en la rama de trabajo.
- `docs/qap-recovery/resultados-hydrogen.md` con demostrados/fallidos/bloqueados/no ejecutados, comandos y evidencia.
- Commit y SHA remoto confirmados, sin secretos.
- Mantener **G0 NO-GO** hasta decisión independiente, **G1 cerrado**.
