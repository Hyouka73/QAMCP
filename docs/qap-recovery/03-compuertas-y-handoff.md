# Contrato de coordinación y compuertas

## Responsabilidades
- **Coordinación:** secuencia, alcance, aceptación y custodia de decisiones. No aprobarse a sí mismo.
- **Codex High:** investigación y handoff con código real; no maquillar faltantes históricos.
- **Hydrogen:** implementación aislada y reproducción falsable; no auto-certificarse.
- **Auditor independiente:** revisar código, repetir comandos, inyectar fallos y contradecir falsos PASS. El implementador no custodia las aplicaciones ciegas.
- **Usuario:** únicamente autoriza accesos/destinos/acciones externas y decisiones de alcance irreversibles; no pedirle que invente arquitectura o reglas financieras.

## Secuencia
1. `R0` — rama de recuperación con contexto y evidencia diferenciada (este checkpoint).
2. `R1` — handoff Codex High, hash y línea base medidos.
3. `R2` — laboratorio de Hydrogen con SUT real, testigos separados y mutantes verificables.
4. `R3` — revisión independiente de resultados: determina qué bloqueos siguen.
5. `G0` — **solo por evaluación posterior y autorización expresa**. `G1` no inicia por construir un laboratorio.

## Vetos prioritarios
- Cualquier **PASS funcional falso**, oráculo sin referencia suficientemente independiente o aserción circular.
- Tests faltantes declarados como pasados, mutantes basados en constantes y ejecución simulada presentada como real.
- MCP incompatible/diagnósticos de tipos sin tratamiento, evidencias adulterables o firmas/SHAs no verificables.
- Afirmar descubrimiento ciego E2 sin custodia realmente independiente.
- Afirmar capacidades en Codex App, Antigravity, MANAGED o Core sin demostrarlas.
- Confundir compatibilidad `HOST` con inteligencia autónoma integrada; confundir replay `DETERMINISTIC` con descubrimiento sin modelo.

## Alcance de las métricas heredadas
- **80% por aplicación y 75% para efectos y cambios de estado** en descubrimiento ciego; usar el brazo de inferencia declarado y un protocolo independiente custodiado.
- Pruebas funcionales de escritura/estado exigen al menos testigo `I2` y un mutante emparejado falsable.
- Un PASS requiere caso, revisión, intento, aserciones, efecto verificado y evidencia.
- E3: cero falsos PASS; revisar todos los controles técnicos, no solo los favorables.
- E4: cortes reales y no duplicar efectos; segunda identidad OS si se exige certificar frontera de seguridad.
- E5: consulta pertinente, abstención, fuente primaria, procedencia, vigencia y auditoría.
- Regresión: cero redescubrimiento y cero inferencia cuando el caso ya está fijado.

## Integridad de la entrega
Toda salida debe consignar fecha, rama, commit, árbol, versiones, comandos, entorno, datos sintéticos, scopes, fallos y hashes. No versionar datos sensibles. El siguiente agente debe poder reproducir resultados **sin confiar en la explicación del anterior**.

Este archivo fija criterios de coordinación; no constituye validación de ningún experimento.
