# QAP · expediente de continuidad (2026-11-23)

> **Estado:** recuperación histórica y coordinación, NO prueba de ejecución nueva. **G0: NO-GO. G1: no iniciado.**
>
> **Procedencia:** contexto y reportes proporcionados por el usuario en conversaciones del 20–23 de noviembre de 2026, más inspección del remoto GitHub realizada el 23-11-2026. Los directorios originales `docs/qap-reconstruction/` y `lab-f0/` no están en las ramas remotas comprobadas.

No inventar rutas locales, evidencias, resultados de test, hashes de archivos perdidos ni accesos a LENDUS CORE. Este expediente es un **punto de recuperación** para reconstruir trabajo verificable desde el código que sí existe.

## Orden de operación

1. [00 · Estado y evidencia](00-estado-y-procedencia.md): qué existe en GitHub, qué solo consta en informes históricos y qué falta.
2. [01 · Codex High: investigación principal](01-codex-high-investigacion.md): diagnóstico del código real y especificación ejecutable de la próxima vertical.
3. [02 · Hydrogen: ejecución principal](02-hydrogen-ejecucion.md): laboratorio aislado, correcciones verificables y resultados reproducibles.
4. [03 · Contrato de aceptación](03-compuertas-y-handoff.md): controles, falsación, transferencia entre agentes y GO/NO-GO.

## Política de trabajo

- Partir de la rama `recovery/qap-g0-2026-11-23`, basada en `d4cfadfa5bf25591b72001bccab69b7dd1bbb6a7`. No alterar `main`, `develop` ni los commits históricos.
- **Codex High investiga; Hydrogen implementa solo después del handoff.** No comparten afirmaciones no verificadas como si fueran hechos.
- La IA del HOST o MANAGED razona; **QAP posee** campaña, política, conocimiento, ejecución, evidencias y veredictos; DETERMINISTIC repite artefactos fijados sin inferencia.
- No reconstruir la plataforma completa antes de una vertical real, reproducción independiente y decisión expresa sobre G0.
- Subir al remoto los documentos, scripts y evidencia **sanitizada**; verificar lectura remota después de cada entrega.
- No subir contraseñas, sesiones, cookies, datos personales, bases de datos de clientes ni capturas con información sensible.
