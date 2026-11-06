# Verificación física independiente R3 — 2026-11-06

**R3 focal: NO-GO. VNEXT-014 integral: NO-GO.** Las nueve suites autorizadas ejecutaron **102 casos: 101 PASS / 1 FAIL / 0 SKIP / 0 TODO**. Las 38 identidades modernizadas seleccionadas aprobaron y TM-50 conserva un FAIL legacy. No se observó regresión funcional respecto de R1/R2 dentro de esta selección, pero R3 introduce **seis diagnósticos TypeScript** y conserva brechas semánticas. No se autoriza integración, publicación de paquetes ni cierre integral.

## SHA, entorno y preservación

HEAD inicial local: `df6783a7452824ecd19abdec06c95e971cff4195`. HEAD remoto consultado y **SHA ejecutado: `bdafeeb834549fc13c5d952c1f341098c2592468`**, rama feat/qap-vnext-architecture. Se consultó ls-remote, se descargó y comparó la serie de commits, se verificó ancestro (exit 0) y se actualizó mediante merge --ff-only. No hubo divergencia ni necesidad de worktree adicional. Los cambios de packages entre R2 y R3 se limitan a seis archivos de tests/fixture; no cambió código productivo, dependencias ni lockfile.

Windows x64, PowerShell, Node 24.15.0, pnpm 12.3.4, Vitest 4.1.11. Discovery usa Chrome 156.0.8078.80 mediante Playwright; TM-46 usa el Chromium resuelto por PlaywrightRunner. La versión de este segundo binario no se consultó por separado; su ejecución positiva sí está ejercitada. Dependencias ya instaladas. Los tests se ejecutaron con los dist existentes; las fuentes productivas no cambiaron desde R2. Después se ejecutó el build oficial y existen dist/server.js MCP y dist/entrypoint.js CLI.

La única modificación ajena previa/final es la sesión protegida de playwright-runner. **En R3 no se abrió, leyó, calculó hash, restauró, eliminó, escribió ni incorporó a staging/publicación.** No se hizo diff global del worktree. Status solo se utilizó como inventario; diffs/checks/staging se limitaron a rutas explícitas. Los tests utilizan raíces temporales propias; las menciones sintéticas a admin-user en tests son de sus temporales y no del archivo personal protegido.

Se leyeron PENDIENTES, GO_NO_GO, CONTRATOS_VIGENTES, CORRECCIONES, MATRIZ_55, matriz-55.json y las actas R1/R2, además de AGENTS.md y los contratos productivos pertinentes. Se contrastaron las afirmaciones con tests, fixture, DiscoveryHandler, entrevista/cobertura/cierre, server, PlanHandler/TestHandler, SQLite y PlaywrightRunner. No se usaron agentes delegados, no se cambiaron fuentes de producto/tests/fixtures/config, no se repitió MCP integral, Stdio ni E01. Se preservaron versiones, workers y presupuestos de las suites seleccionadas; sin filtros de identidades ni nuevos skip/todo/mocks.

## Ejecución reproducible

Se ejecutó una vez cada suite por separado y en secuencia, fuera del sandbox por el EPERM de caché Vitest ya demostrado en R2. No hubo fallo de infraestructura ni reintentos en R3. El reporter JSON complementa verbose sin alterar selección. Tras las nueve suites se ejecutaron typecheck, ESLint focal y build, también secuencialmente. Horas UTC en el manifiesto; fecha local America/Mexico_City: 6 de noviembre de 2026.

| Suite `.test.ts` | PASS | FAIL | SKIP/TODO | Exit | Tiempo comando s |
|---|---:|---:|---:|---:|---:|
| p3-canonical-discovery | 5 | 0 | 0 | 0 | 18.59 |
| p4-2-canonical-contract | 2 | 0 | 0 | 0 | 7.76 |
| p4-5a-canonical-integrity | 9 | 0 | 0 | 0 | 9.57 |
| p4-5a2-canonical-integrity | 13 | 0 | 0 | 0 | 13.35 |
| server-canonical-discovery | 4 | 0 | 0 | 0 | 8.17 |
| server-canonical-operations | 5 | 0 | 0 | 0 | 10.48 |
| server | 11 | 1 | 0 | 1 | 5.13 |
| plan-handler | 31 | 0 | 0 | 0 | 4.90 |
| test-handler | 21 | 0 | 0 | 0 | 10.28 |
| Total | **101** | **1** | **0** | — | **88.25** |

[run.ps1](evidencia/r3-2026-11-06/run.ps1) conserva el runner con comandos reales; [manifest.json](evidencia/r3-2026-11-06/manifest.json), SHA, exit y duración por comando. Cada suite tiene su JSON y log completos; [all-cases.json](evidencia/r3-2026-11-06/all-cases.json) y [tabla de casos](evidencia/r3-2026-11-06/all-cases.md) contienen fullName, duración, error y clasificación. No todos los 52 tests de handlers lanzan navegador: algunos usan sus dobles preexistentes. TM-46 y los positivos Discovery se auditaron como físicos, sin stubs añadidos.

Único FAIL: **TM-50**, server.test.ts:527, 184.37 ms, `AssertionError: expected true to be falsy` al exigir `res.isError` falso. El [log](evidencia/r3-2026-11-06/server.log) conserva diferencia y ubicación, y [server.json](evidencia/r3-2026-11-06/server.json) conserva la traza íntegra. Su cuerpo instancia createMcpServer sin bindings/autorización canónica y espera success/session_saved/is_auth_view/context.yaml. El contrato actual exige binding y autorización y solo hace Discovery anónimo. La fuente implica bloqueo anterior al login, pero el test no imprime el payload recibido: **no se afirma un código concreto observado**. Clasificación: test/fixture legacy desalineado y capacidad positiva Discovery autenticada ausente; no infraestructura ni regresión nueva demostrada. El mismo fullName fallaba en R1. No se ejecutaron sus aserciones posteriores de sesión guardada.

## Comparación e inventario de las 55 identidades

Comparación por fullName exacto con serial R1: **7 FAIL→PASS** (TM-09, TM-12, TM-46, TM-52..55), **0 PASS→FAIL**, 1 FAIL persistente (TM-50). Los 24 casos R2 fueron ejecutados de nuevo y conservaron PASS. Las cinco sustituciones Server pasan por primera vez en esta campaña; no se les atribuye ejecución R2. Las demás mejoras son aserciones adicionales de identidades existentes.

De las 55 históricas: **39 ejecutadas = 38 PASS + 1 FAIL; 16 NO EJECUTADAS** (cinco lifecycle y once auth). La clasificación semántica es conservadora: 27 PASS suficientes respecto del contrato canónico explícitamente sustituido, 11 PASS parciales respecto de sus garantías/títulos históricos. No es un conteo de equivalencias literales ni de las 43 modernizadas aprobadas en R3. El detalle por identidad y sus límites está en [matriz de 55](evidencia/r3-2026-11-06/matrix-55-r3.md), [JSON](evidencia/r3-2026-11-06/matrix-55-r3.json) y [regression-summary](evidencia/r3-2026-11-06/regression-summary.json).

Inventario estático mediante AST TypeScript de los .test.ts MCP: **los 55 fullNames históricos están declarados exactamente una vez; cero desapariciones, duplicados o modificadores skip/todo/only en esas declaraciones**. Las cinco identidades Server aparecen en operations y ya no en sus cuerpos antiguos. Este inventario no ejecuta suites fuera de alcance ni convierte su presencia en PASS. [identity-inventory.json](evidencia/r3-2026-11-06/identity-inventory.json) incluye archivo/línea de cada identidad y el método aplicado.

## Garantías críticas y límites reales

La [auditoría semántica](evidencia/r3-2026-11-06/semantic-audit.md) documenta el recorrido y las escrituras de cada identidad crítica, con contratos productivos contrastados. Hallazgos principales:

- **TM-09:** prioridades high>medium>low y **desempate real por MCP qap_status** aprobados. Discovery mantiene planned, y solo next explícito abre entrevista; sin promoción automática. Quedan fuera observed legacy y todos completos en WORKING.
- **TM-12:** versión inicial cero e incremento tras proponer aprobados; bloqueo sin host, requisito revisado y continuidad hasta WRAP_UP. No se afirma que review incremente otra vez la versión.
- **TM-33/34:** clasificación formal security distinta del prompt proposito, negativa sin host y persistencia positiva revisada; IDs/módulo/categoría inventada rechazados. El negativo de categoría inválida solo excluye pending_review/confirmed; no valida código exacto.
- **TM-35:** snapshot pending_review y propuesta corta sobreviven cierre/reapertura de stores y servidor, mismo ID, cero requisitos y review insuficiente bloqueado. No se simuló crash del proceso.
- **TM-38:** requisito exacto confirmado/developer_interview, recibo único relacionado y digest correlacionado desde SQL real; especificación pasa incomplete→complete tras seis declaraciones no aplicables revisadas; ejecución sigue not_executed. La brecha positiva de cobertura R2 queda cubierta.
- **TM-41/42/43:** extracción física pasiva/activa, cero requisitos y controles>0 en el caso activo. Producto devuelve limitations/next_safe_action en lugar del aviso literal retirado. No certifican extraccion_vacia histórico; algunas aserciones comprueban solo tipos, y TM-42 no aserta ausencia del campo. Los dos módulos pasivos usan la misma plantilla.
- **TM-44:** positivo Operación/operacion aprobado: plan con acento, binding, Discovery asociado, pregunta/draft y requisito confirmado; requisito leído tras restart con module_key operacion. **No aserta el contenido del draft tras restart**, ni solicita next; Knowledge conserva la conexión abierta. No acredita por sí solo recuperación de entrevista desde una nueva conexión/proceso. Directorio pending_questions legacy retirado explícitamente.
- **TM-48:** negativas por autorización ausente, URL no consentida/traversal, módulo ajeno, credenciales y revisión host incompatible, más recuperación autorizada. **999 frente a revisión real 1 prueba mismatch futuro, no una autorización obsoleta por avance de Environment.** No se actualizaron políticas a revisión 2 para comprobar rechazo de consentimiento revisión 1. Tampoco demuestra todo contexto host incompatible ni el schema module-view antiguo.
- **TM-46:** plan_missing, plan.json/fingerprint/order reales, qap_test autorizado con Chromium y un caso passed persistido; al modificar el caso se bloquea cases_mismatch sin crear ejecución. No hay runner mock/inyección en operations ni en su fixture. El caso YAML se prepara explícitamente como entrada: no se certifica generación automática de casos desde requisitos ni un DAG multinodo en esta identidad.
- **TM-52/54/55:** fases/módulo, adquisición sin mutar lifecycle, onboarding/ingesta/plan y entrevista/revisión/cobertura/cierre canónicos aprobados. **TM-53:** status legacy WORKING derivado y context.yaml sin escritura aprobados; su cuerpo no invoca el validador de schema que anuncia el título.

Los inboxes de revisión son sintéticos e independientes de argumentos MCP. Se comprobó la frontera de autoridad, **no consentimiento humano auténtico**. Get/query de Knowledge leen SQLite; PRAGMA abre conexiones readOnly aparte. Estos hechos no acreditan ACID conjunto entre Knowledge/drafts/closure/filesystem ni tolerancia a crash.

## Compuertas estáticas y defectos

| Compuerta | Resultado | Diferencial |
|---|---|---|
| TypeScript MCP `pnpm --filter @qap/mcp exec tsc --noEmit` | **FAIL, exit 1**, 6.92 s | **134 = 128 heredados + 6 nuevos; cero eliminados** frente a R2 |
| ESLint focal de los seis archivos modificados R3 | **PASS, exit 0**, 17.13 s | **0 errores / 2 warnings heredados**, cero altas; eliminados cuatro warnings P3/A2 |
| Build oficial `pnpm build` | **PASS, exit 0**, 26.73 s | Compiló paquetes del workspace; no equivale a typecheck de tests aprobado |

[static-diff.json](evidencia/r3-2026-11-06/static-diff.json) compara diagnósticos por archivo/código/texto, ignorando desplazamientos línea/columna y preservando multiplicidad. Baseline ESLint: R2 focal para P3/A2/fixture/Discovery, más JSON R1 Server (sin cambios R1→R2); operations es nuevo. No se ejecutó lint global ni se afirma deuda global resuelta. Los dos warnings restantes son directivas eslint-disable sin uso en server.test.ts:1.

**P2 R3-01 — Regresión TypeScript de tests, bloqueo focal.** Reproducir con tsc del manifiesto. Nuevos TS2339:

| Archivo | Línea/columna | Propiedad |
|---|---|---|
| p4-5a2-canonical-integrity.test.ts | 134:320 | limitations |
| p4-5a2-canonical-integrity.test.ts | 134:372 | next_safe_action |
| p4-5a2-canonical-integrity.test.ts | 138:207 | counts |
| p4-5a2-canonical-integrity.test.ts | 138:255 | limitations |
| p4-5a2-canonical-integrity.test.ts | 142:365 | limitations |
| server-canonical-operations.test.ts | 126:19 | persistence |

Causa sustentada: las nuevas aserciones acceden a campos reales que Payload del fixture no declara. Corrección sugerida para ChatGPT: modelar las respuestas correspondientes con tipos/narrowing y campos opcionales reales donde proceda; no usar any, suprimir errores ni quitar aserciones para obtener verde. Los cuatro errores Server eliminados en R2 no reaparecieron. [typecheck.log](evidencia/r3-2026-11-06/typecheck.log) conserva los 134 diagnósticos.

**P2 R3-02 — Evidencia incompleta del objetivo stale Environment en TM-48.** El caso pasa con 999>1. Para demostrar obsolescencia real, persistir una actualización Environment 1→2 y mantener autorización 1; verificar bloqueo y snapshots sin escrituras de adquisición/asociación/requisitos. Luego autorizar 2 y demostrar recuperación. No se ha observado un defecto productivo de revisión: el problema es el alcance del oráculo.

**P2 R3-03 — Recuperación de entrevista acentuada no asertada tras restart en TM-44.** El requisito sí se lee tras restart, pero draft/pregunta solo se comparan antes. Agregar readback de snapshot/next tras reinicio y, si se anuncia reapertura Knowledge, consultar desde otro adapter. No se ha demostrado pérdida de datos ni defecto productivo.

**P1 heredado — Positivos Discovery autenticados ausentes (doce identidades).** TM-50 falla físicamente; las otras once no se ejecutaron. Su prioridad es la decisión de alcance/contrato de host y la conservación de garantías, no implementar auth en esta campaña. TM-13..19, TM-27, TM-30..32 y TM-50 siguen pendientes. Existe AuthManager, registro/verificación de perfiles, SCOPING y sesiones del runner; **no existe su positivo equivalente en Discovery fresh_anonymous_static**. La auditoría semántica incluye tabla individual de capacidades existentes/faltantes y estado R3. No se confunde authentication_not_supported con login correcto.

**P3 — Asunciones históricas todavía demasiado amplias.** Títulos observed/todos completos en T14, validación schema en TM-53 y avisos de extracción no son garantías íntegramente asertadas. TM-22/26 prueban aceptación de brecha durable sin cierre automático; TM-25 combina umbral positivo unitario con negativos de persistencia. Conservar el acta de sustitución y completar solo lo exigible del contrato vigente, sin restaurar YAML ni fabricar aprobación.

No se encontró un nuevo defecto funcional productivo mediante esta selección. Eso no elimina los defectos de tests/evidencia ni certifica capacidades fuera de alcance.

## Dictamen y publicación

**NO-GO focal R3:** los positivos canónicos pasan, pero seis nuevos diagnósticos TS incumplen la ausencia de regresión estática, y los objetivos de obsolescencia Environment/recuperación de entrevista requieren evidencia más precisa. ChatGPT debe corregir R3-01 y completar/reconciliar R3-02/03 antes del próximo lote focal, conservando aserciones y presupuestos. No se recomienda repetir toda la suite para ocultar estos hallazgos.

**NO-GO integral VNEXT-014:** doce identidades de autenticación pendientes, equivalencias parciales, deuda estática global, E01, revisión humana auténtica y recorrido integral/Stdio no certificados. No se ejecutó carga concurrente ni instrumentación causal; los PASS aislados no resuelven E01. La campaña no mide CPU/locks/arranque/apagado ni atribuye causalidad a Chromium. Los resultados globales vigentes siguen siendo R1 históricos: 487/506 serial y 473/506 paralelo.

Documentación y evidencia nuevas, aditivas, sin sobrescribir R1/R2 ni el physical_result histórico de matriz-55.json. Se añaden actas de estado respaldadas por estos resultados. Las rutas locales privadas se sustituyen por marcadores en evidencia nueva; se conserva contenido diagnóstico útil, errores íntegros y tiempos. Commit normal y push exclusivamente a feat/qap-vnext-architecture; SHA documental comunicado en la entrega para evitar autorreferencia. Sin develop/main/staging, npm ni VNEXT-015. El MVP conserva el **20 de noviembre de 2026**.
