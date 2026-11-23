# Estado comprobado e historia no recuperada

## 1. Hechos verificados en GitHub (23-11-2026)

Repositorio: https://github.com/Hyouka73/QAMCP

- `main` → `fa6a527764f6e96514a1e589411e7f402e059b68`.
- `develop` → `30fb3a2492f9edb4f96b3b0328635ca66401c119`.
- `codex/qap-autonomous-mvp` → `d4cfadfa5bf25591b72001bccab69b7dd1bbb6a7`.
- Se inspeccionaron los **árboles recursivos completos**, sin truncamiento, de las tres ramas. Ninguna contiene `docs/qap-reconstruction/`, `lab-f0/`, `lab-f0/f0r/` ni `13-validacion-f0.md`.
- La rama de recuperación comienza desde `d4cfadf` porque esa es la última versión pública de la rama con la que se había trabajado en las auditorías. No asumir que el entorno local de quien ejecute coincide con el histórico.
- Sí existe `docs/QAP-VISION-AUTONOMIA.md` en la base recuperada; **leerla como dirección del producto**, no como capacidad ya implementada.
- El repo contiene paquetes TypeScript/pnpm de engine, knowledge, auth, cli, mcp, playwright-runner, etc.

## 2. Hallazgos históricos (comunicados por el usuario; NO reproducidos aquí)

### Auditorías Fase 1 / Fase 2
- Flujo autónomo centrado en visibilidad estructural y pruebas incapaces de certificar efectos empresariales.
- Falso `PASS` del runner legado: respuesta HTTP 201 para reserva **no persistida**.
- Divergencias de autoridad entre MCP, CLI, conocimiento, reportes y ejecución.
- Comprobación estricta de tipos MCP: **144 diagnósticos**, reportados tanto sobre `b3ab370` como `d4cfadf`. Volver a ejecutar en nuevo entorno, no asumir vigencia del número.
- LENDUS CORE como dominio de alta complejidad: producto → solicitud → autorización → crédito → desembolso → calendario → pago → cartera → contabilidad; reglas por entidad, rol, tenant y configuración. Los reportes dijeron haber encontrado manuales locales, pero no fueron versionados en GitHub. **No afirmar acceso actual a Core ni reglas internas certificadas.**

### Plan y laboratorio F0
- Diseño candidato: servicio de campaña local por usuario, SQLite y evidencias privadas; HOST aporta razonamiento por defecto; MANAGED optativo; DETERMINISTIC replay sin IA. Infraestructura PostgreSQL/pg-boss/S3 no obligatoria en el piloto local.
- Oráculos de aserción basados en fuentes, configuración, decimal exacto, tiempo/calendario, estados, testigos I0–I3, versión y causalidad; no aceptar `PASS` solo por estado HTTP o visibilidad.
- Laboratorio primitivo reportó 26/26 vectores E3, 100/100 recuperaciones E4 y 10/10 familias de mutantes, **pero la revisión adversarial descubrió** un E1 determinista simulado, 3 mutantes hardcodeados, 3 controles técnicos E3 omitidos y referencias parcialmente circulares. Los números originales **NO** deben heredarse como evidencia válida.
- Vertical posterior `f0r` **reportada, no conservada**: Codex CLI invocó MCP real; Chromium operó sobre fixture; un observador independiente leyó SQLite; sano y mutante devolvieron HTTP 201; runner legado aprobó ambos y evaluador experimental diferenció PASS/FAIL; replay tras reinicio y rechazo de artefacto adulterado.
- Última acta reportada: **G0 = NO-GO; G1 sin iniciar**. E1 parcial HOST; E2 no ejecutado (custodia ciega); E3 fallido (**4 falsos PASS de 12 controles técnicos**); E4 parcial (segunda identidad OS pendiente); E5 parcial (extracción desde fuentes primarias pendiente); V06 parcial (segundo dominio e I3 en cálculos/conciliación pendientes). Además, 144 diagnósticos MCP y reproducción independiente pendientes.
- Umbrales de descubrimiento ciego reportados: **80% por aplicación** y **75% efectos/cambios de estado**, aplicables al modo de inferencia anunciado. DETERMINISTIC **no** debe exigirse como descubridor inteligente de aplicaciones desconocidas; debe acreditar replay sin IA.

## 3. Clasificación obligatoria de fuentes

| Nivel | Significado |
|---|---|
| VERIFICADO_REMOTO | Archivo, árbol o commit inspeccionado directamente en GitHub |
| HISTORICO_REPORTADO | Resultado narrado en los informes anteriores sin script/evidencia original disponible |
| RECONSTRUIDO | Documento creado ahora a partir de informes y principios, no copia del original |
| REPRODUCIDO | Comando/experimento ejecutado nuevamente con evidencia sellada en la rama |
| BLOQUEADO | Sin acceso, permiso o precondición demostrable |
| NO_EJECUTADO | Hay propuesta o protocolo, pero no resultado |

Ningún agente puede promover `HISTORICO_REPORTADO` a `REPRODUCIDO` sin ejecución y pruebas comprobables.

## 4. Pérdidas y límites

Se perdió del remoto el texto exacto del plan 01–13, protocolos E1–E5, `lab-f0` y `f0r`, código experimental, JSON, capturas y hashes. En la conversación subsisten varios **informes** textuales, no sus archivos de evidencia. No recrear manifiestos históricos falsos. Los documentos de este directorio son un **nuevo expediente de continuidad**, no una restauración bit a bit.

Punto de control inicial: recuperar código existente, medir estado actual, preparar reproducción mínima real del falso PASS y validar corrección en sandbox, evitando la reconstrucción especulativa.
