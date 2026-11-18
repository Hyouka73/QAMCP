**Auditoría independiente. Fecha: 2026-11-05, America/Mexico_City. Código probado: `76a338855f342a70acb184da5fbd7256dd980669`. Base correctiva: `e4d7fbc2c6e4525b4e5fab38ec22e0cd365305d6`. Rama: `fix/vnext-014-cierre-controlado`.**

# Dictamen independiente

**La rama no es certificable ni integrable.** Se recuperan siete identidades históricas con SQLite físico, pero CF01 introduce tres regresiones contractuales y abre una ruta de exposición de mensajes internos al cliente MCP. No se reprodujeron los bypass anteriores RES-CODEX-A01/A02 de cierre de sesión/recibos en sus regresiones actuales; C01 también pasa. No se atribuye corrupción, aprobación duplicada ni cierre no autorizado a los tres fallos de Coverage.

| Decisión | Dictamen | Evidencia determinante |
| --- | --- | --- |
| A — Integridad de reparación | NO-GO | CF01 aislado PASS, pero tres regresiones de respuesta, mensaje MCP sin sanitizar y 7.5 no ejecuta la garantía. RES-CODEX-A01/A02 y C01 actuales sí pasan. |
| B — Reconciliación y estabilidad | NO-GO | 63 localizadas: 7 FAIL→PASS, 55 con bloqueo histórico y 1 con defecto diferente; tres PASS→FAIL adicionales. E01 intermitente y un error no manejado. |
| C — Certificación VNEXT-014 | NO-GO | 55 garantías históricas sin equivalencia aprobada, E01, lint y typecheck global pendientes; recorrido con aprobación humana auténtica no ejecutado. |
| D — Integración a develop | NO-GO | A/B/C sin aprobación; no hay autorización específica de integración ni revisión dual del WBS. |

## Snapshot y revisión previa

HEAD remoto consultado mediante git ls-remote: `76a338855f342a70acb184da5fbd7256dd980669`, igual al esperado. Se obtuvo la rama y git merge-base --is-ancestor confirmó base→HEAD (exit 0). El clon de auditoría estaba limpio y fue cambiado exclusivamente a la rama correctiva. El checkout original permaneció en feat/qap-vnext-architecture con su modificación previa de sesión fuera del alcance. La creación de worktree se canceló; se reutilizó el clon de auditoría ya existente, sin reintentar la creación.

El diff base..HEAD contiene 11 archivos, +373/-29: un archivo productivo (CanonicalClosureService), dos tests y ocho documentos. No cambia contratos públicos, dependencias, locks, runner, esquemas ni controles de seguridad; STATE/WBS documentan la excepción autorizada de rama. Se leyeron AGENTS, STATE, WBS 04/08, los seis documentos CIERRE-CONTROLADO y antecedentes CONVERGENCIA, REPARACION-FINAL, RESCATE-CODEX y REPARACION-CODEX. Los antecedentes se usan como trazabilidad, no como PASS actual. Antes de interpretar resultados funcionales se comunicaron las reservas de clasificación CF01, reapertura real y conteo de autoridad previa de 7.4.

## Ejecución comprobada

| Verificación | Resultado |
| --- | --- |
| Instalación congelada / SQLite / navegador | PASS; pnpm install --frozen-lockfile; SQLite 3.51.3, FTS5; Chromium real 151.0.7922.34 / Playwright 1.62.1 |
| Build | PASS, diez paquetes |
| Coverage focal | 63 PASS / 3 FAIL de 66; CF01 nuevo PASS |
| Adversarial focal | 33 PASS / 1 FAIL de 34; siete identidades migradas PASS, 7.5 ERROR de preparación |
| MCP serial | 439 PASS / 59 FAIL de 498 |
| MCP paralelo A | 436 PASS / 62 FAIL de 498 + 1 error no manejado |
| MCP paralelo B | 439 PASS / 59 FAIL de 498; sin errores no manejados reportados |
| Engine / Knowledge / Runner / CLI | 168/168, 260/260, 71/71 y 78/78 PASS |
| ESLint global | FAIL: 34 errores / 28 advertencias; cero infracciones en los tres archivos modificados, tanto base como HEAD |
| TypeScript MCP incluyendo tests | FAIL: 125 diagnósticos, también 125 en la base virtual. Sin altas semánticas demostradas; un mensaje cambia únicamente el orden de la unión impresa. Build de distribución PASS no certifica typecheck de tests. |
| Reapertura y PRAGMA | PASS en nueve checkpoints sintéticos de dos bases cada uno; integridad ok, foreign_key_check vacío, snapshots/recibos iguales y approvals únicos |
| Revisión humana auténtica / E2E autenticado real | NO EJECUTADOS; los gateways y credenciales de fixture no certifican esas compuertas |

Windows 10.0.26200 x64, Node v24.15.0, pnpm 12.3.4. Las corridas MCP utilizaron TEMP/TMP independientes y paralelismo sin modificar. Los cuatro primeros intentos de suites auxiliares con --reporter=json fueron rechazados por el parser de pnpm antes de ejecutar tests; después se ejecutaron correctamente los cuatro comandos originales. No se oculta ese incidente del arnés.

## Ocho identidades migradas

| Caso | Resultado original | Approvals tras reopen | Recibos tras reopen | Evidencia |
| --- | --- | --- | --- | --- |
| 3.1 | PASS | 0 | 0 | WORKING / planned; módulo rev.2 |
| 3.2 | PASS | 0 | 0 | WORKING / planned; módulo inactivo |
| 3.3 | PASS | 1 | 1 | WORKING / waived; reutilización rechazada |
| 5.4 | PASS | 1 | 1 | WRAP_UP; reporte físico |
| 7.2 | PASS | 1 | 1 | WORKING / waived; replay tras reapertura |
| 7.3 | PASS | 2 | 2 | Dos módulos waived, dos conexiones independientes |
| 7.4 | PASS | 2 en total; 1 terminal nueva | 1 | Una autoridad previa de aplicabilidad + un ganador terminal |
| 7.5 | ERROR de preparación (Vitest FAIL) | No llega al intento original | No llega al recibo original | INVALID_DATA por certainty=unconfirmed |

La reapertura es evidencia suplementaria del auditor; no modifica ni sustituye los tests originales. 7.5 sigue ERROR: una sonda aparte con entidad sintética válida demuestra rechazo de procedencia, sin avance de lifecycle y sin atribuir autenticidad al recibo del atacante. Esa sonda conserva un cierre/approval válidamente emitido por el gateway antes de fallar el recibo, estado parcial previsto por el diseño multi-store; no cuenta como PASS del test 7.5 ni como rollback global.

## Reconciliación de identidades

Las 63 identidades de la matriz solicitada están localizadas por archivo+fullName exacto: **7 FAIL→PASS, 55 FAIL→FAIL con el primer bloqueo histórico y 1 FAIL→FAIL con defecto distinto (7.5 INVALID_DATA)**. No hay identidades eliminadas o renombradas. En las 55, conservar el mismo primer error no acredita las garantías posteriores; su equivalencia funcional sigue pendiente. Tres de esas 55 tienen ambigüedad de presentación/contrato explícita.

Fuera de las 63 aparecen tres PASS→FAIL de Coverage. Comparación adicional contra el JSON independiente e71818a (486): 420 PASS conservados, 7 FAIL→PASS, 56 FAIL conservados, 3 PASS→FAIL, 12 altas PASS, cero bajas. Ese baseline histórico se etiqueta por su propio SHA; no se presenta como una nueva suite de la base e4d7fbc. El control base de CF01 es una sonda con overlay en memoria de solo el servicio, claramente separado de las corridas del HEAD.

## Hallazgos priorizados

1. **014-CODEX-001 / P1, confidencialidad:** error interno propagado por CF01 se interpola literalmente en la respuesta MCP. Canary sintético de ruta/token visible en HEAD y ausente en el control base. No se utilizaron ni expusieron secretos reales.
2. **014-CODEX-002 / P2, contrato:** la clasificación ya no reconoce los errores normalizados por los adapters en tres negativos históricos; rollback seguro conservado. Dos writes anidados devuelven UNAVAILABLE y el drift envuelto devuelve write_failed. No restaurar catch-all.
3. **014-CODEX-003 / P2, validez de test:** 7.5 usa certainty=unconfirmed, valor fuera del esquema SQLite; falla antes de sembrar el recibo adversario. El rechazo productivo posterior funciona en la sonda válida.
4. **014-CODEX-004 / P2, E01 histórico:** tres timeouts de 5 s solo en paralelo A y ECOMPROMISED por cleanup con lock activo. El mecanismo de heartbeat tras borrar el root se reprodujo independientemente; la causa exacta de la lentitud bajo carga no está cerrada.

Detalles, identidades exactas, propuestas y regresiones: [HALLAZGOS](HALLAZGOS.md). [Matriz 63](MATRIZ_63.md). [498 identidades y comandos](RESULTADOS_TESTS.md). [Readback y arneses reproducibles](EVIDENCIA_FISICA.md). [Compuertas y lista finita](GO_NO_GO.md).

## Límites y publicación

Solo documentación nueva en este directorio. No se editaron fuentes, pruebas, expectativas, lockfile ni informes originales. No se corrigió, integró, fusionó, rebasó ni publicó npm; VNEXT-015–023 fuera del alcance. Las pruebas de aplicación utilizaron datos sintéticos y loopback consentido por sus fixtures; no se usaron sesiones, credenciales o bases personales.

La publicación documental es hija del snapshot probado; no sustituye el SHA certificado. El commit documental y su existencia remota se verifican después de crear los seis archivos y se comunican al entregar. Los logs originales y bases sintéticas permanecen localmente bajo C:/Users/Judirico/Documents/QAMCP/cierre-evidence; no se publican bases, claves ni sesiones. Los seis documentos incluyen resultados por identidad, evidencia y código de los arneses de auditoría para reproducción.

Objetivos conservados: **16/11/2026 certificación; 19/11 integración únicamente con GO; 20/11 MVP funcional.**
