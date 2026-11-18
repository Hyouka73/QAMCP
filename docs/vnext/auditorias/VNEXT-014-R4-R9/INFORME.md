# Auditoría independiente VNEXT-014-D-R4-R9

2026-11-05, America/Mexico_City. Repositorio Hyouka73/QAMCP. **Dictamen: NO-GO.**

**Código auditado exactamente: 09c9ce276c9c328026de4236dadf0a85d8e94d21.** Worktree detached aislado, sin incorporar código posterior. Publicación exclusivamente documental sobre feat/qap-vnext-architecture. El SHA documental se identifica con git log -1 --format=%H -- docs/vnext/auditorias/VNEXT-014-R4-R9/INFORME.md y se comunica por separado tras verificar remoto; no se atribuye al código probado.

## Resultado prioritario

**R4-R8-A02 queda corregido de forma condicionada:** con rutas absolutas estables y todos los escritores SQLite operando sobre el mismo archivo físico, BEGIN IMMEDIATE bloquea Knowledge durante revalidación y commit de ClosureStore. Se comprobó otra conexión, otro proceso, liberación normal, excepción y terminación física del titular. No hay transacción atómica entre las dos bases. No se acredita vigencia del contexto filesystem ni identidad del archivo si cambia la resolución de una ruta relativa.

## Hallazgos y bloqueos

| ID | Prioridad | Resultado comprobado |
| --- | --- | --- |
| R4-R9-A01 | P1 | Contexto lifecycle/session/plan mutable después de revalidar: las cuatro acciones persisten aprobación para la sesión previa. close/waive solo cotejan moduleRevision en su reCheck. Preexistente ventana FS, no cerrada por R9. |
| R4-R9-A02 | P1 | Ruta relativa aceptada por SqliteKnowledgeAdapter + process.chdir: la segunda conexión bloquea otro archivo. Revisión 1→2 después de revalidar y antes de transacción, declared_non_applicable + 1 aprobación obsoleta. Defecto del nuevo fence en esa configuración; no se demostró chdir en el servidor productivo actual. |
| R4-R9-A03 | P2 | Regresión concurrente: una llamada waived y otra blocked; catch del helper convierte conflicto en resultado y evita retry/relectura del commitFinalClosure. Reintento externo sí idempotente. |
| R4-R9-A04 | P2 / contrato pendiente | expiresAt se comprueba antes del callback y al entrar; no después del último await ni inmediatamente antes del COMMIT físico. Pausa después de callback produce aprobación durable ya vencida en las cuatro ramas. Si consumo se define al callback, delimitarlo expresamente; no afirmar vigencia hasta commit. |
| R4-R9-A05 | P1 preexistente | accept_gaps para una brecha existente bloquea coverage_invariants_violated antes del gateway; la evaluación propuesta exige acceptance_receipt sin decisionId disponible. Reproducido también en servicio R4-R8 exacto. No lo introduce R9. |

[Evidencia y reproducción íntegra](EVIDENCIA_CONCURRENCIA.md), [propuestas concretas de siguiente ronda](SIGUIENTE_BLOQUE_P0.md). No se identificó P0 nuevo probado. Estos P1 y la cadena integrada pendiente impiden GO.

## Matriz física

| Compuerta | Resultado |
| --- | --- |
| Instalación congelada | PASS; 448 paquetes; lockfile idéntico. Offline falló por metadata, online autorizado PASS. |
| Build | Diez paquetes PASS; server.js y entrypoint.js presentes. |
| Node/SQLite/FTS5 | Windows Node 24.15.0, SQLite 3.51.3, CREATE FTS5/INSERT/MATCH reales PASS. |
| Cinco R4-R9-A02 | 5/5 PASS, aislados y en integral. |
| Tres R4-R8-A01 | 3/3 PASS, aislados y en integral. |
| Coverage completo | **44 PASS / 1 FAIL de 45**, mismo Scenario 4 en aislado e integral. |
| Canonical Interview | 44/44 PASS. |
| Discovery | 59/59 PASS aislado e integral. |
| Playwright Runner | 71/71 PASS. |
| MCP completo | **406 PASS / 64 FAIL de 470**; 55 históricos + nueve cambios de resultado nominales. |
| ESLint | Global34 errores/28 warnings, focal5/0; solo baja L01, 62 históricos idénticos, cero altas. Sin --fix. |
| Stdio servidor y CLI | 18 herramientas, qap_init success y ONBOARDING con targetPath absoluto. |
| Sondas externas | Bloqueo real, release/crash, rollback, historia, reutilización, competencia, deriva FS/ruta y expiración documentados. |

## Integridad y límites

Cero cambios en fuentes, tests, expectativas, esquemas, lockfile, credenciales o sesiones protegidas. Las sondas reutilizan fixtures sintéticos externos de servicio; sus requisitos y decisiones son dobles de prueba, **no aprobación humana real ni certificación de recorrido integrado**. En accept_gaps se distingue la brecha existente (bloqueada antes del gateway) de la sonda con ID inexistente que permite instrumentar esa rama pero no demuestra aceptación funcional válida.

Los negativos de gateway/revisión, reutilización y rollback instrumentado conservaron snapshot cifrado, filas de historia, lifecycle y recibos cuando se verificaron. Eso no se extiende a todos los fallos posibles: tras commit de ClosureStore hay una fase independiente de recibo Knowledge y proyección FS. Crash 2/3 de la suite pasan; el nuevo hard-exit externo prueba liberación del fence antes de autorización, no todas las ventanas de crash entre bases.

El nuevo digest invalida solicitudes antiguas **con y sin requisitos pendientes**; terminales closed/waived producidos por servicio R4-R8 conservan aprobación/recibo sin recalcular autoridad, con readback y retry idempotente. No hay migración de hash ni equivalencia de algoritmos. VNEXT-014 permanece NO-GO; VNEXT-015 no iniciado.
