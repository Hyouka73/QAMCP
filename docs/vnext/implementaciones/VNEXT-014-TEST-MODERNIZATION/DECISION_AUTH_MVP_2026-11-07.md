# VNEXT-014 — decisión de alcance de autenticación para MVP (2026-11-07)

**Estado: PROPUESTA DE DECISIÓN / NO IMPLEMENTADO / NO CERTIFICADO.** Base remota consultada: `c161c0f995a8f9844f2ec09c041354d77a08fea0`, rama `feat/qap-vnext-architecture`. Objetivo MVP: **20 de noviembre de 2026**, sin cambiar tareas DONE ni fechas. [E01-R6-A](../VNEXT-014-E01/INFORME_E01_R6_A_2026-11-07.md) está **BLOCKED ambiental, causalidad C**, y no aporta resultados de tests. Último baseline físico comparable E01-R5: 506 casos, **494 PASS/12 FAIL** serial y **468 PASS/38 FAIL** en ambas paralelas; R4 correctiva permanece PASS. **VNEXT-014 integral: NO-GO.**

## Constatación del código vigente

- `packages/mcp/src/handlers/discovery.handler.ts`: `qap_discover` rechaza argumentos `credentials/profile/profileId/storageState/cookies/session/auth`, `headed` y `lifecycle.session.auth.required`; sólo invoca al crawler con `isolation: 'fresh_anonymous_static'`, autorización host y revisiones exactas. No existe camino de Discovery autenticado; `authentication_not_supported` es un **rechazo seguro**, no una sesión exitosa.
- `packages/mcp/src/server.ts`: conserva AuthManager/SCOPING y comandos legacy; la composición `createMcpServer` no conecta perfiles verificados/sesiones `storageState` al `DiscoveryHandler`.
- `packages/mcp/src/__tests__/p4-4-auth-lifecycle.test.ts`: la suite histórica usa `_requestHandlers`, adaptador legacy y llavero simulado. No sustituir un positivo autenticado por un estado `blocked` ni inferir un contrato a partir del título. Pruebas canónicas exigirían un fixture host con puertos públicos, consentimiento separado y SQLite físico.
- El crawler vigente está limitado a adquisición anónima estática y bloqueo de JS aplicativo; no puede certificar guard SPA autenticado ni detección positiva de login asíncrono sin un diseño explícito.
- `PENDIENTES.md`, matriz de 55 y auditoría R3 clasifican **doce** identidades activas: TM-13..19, TM-27, TM-30..32 y TM-50. Las doce fallan en el serial R5 por expectativas históricas no satisfechas; no son automáticamente doce defectos productivos del contrato vigente.

## Dos decisiones de producto incompatibles

**Opción A — MVP anónimo delimitado.** Mantener `fresh_anonymous_static`, bloqueos de acceso sin filtraciones y negativa explícita a sesiones. Se pueden cerrar sólo garantías negativas realmente compatibles, dejando las positivas autenticadas sin implementar. **Esto NO cierra las doce identidades, NO vuelve verde 506/506 y NO permite declarar VNEXT-014 integral GO**, salvo una decisión formal nueva que modifique alcance/aceptación fuera de esta acta, preservando trazabilidad y sin borrar pruebas históricas. Ventaja: no arriesga seguridad por una implementación improvisada; limitación: no prueba aplicaciones protegidas.

**Opción B — Discovery autenticado autorizado por host.** Definir primero puertos de credenciales/sesiones privilegiados que no reciban secretos del wire MCP, perfil verificado/expiración/revocación, consentimiento exacto de navegación/política/entorno, redacción de resultados y rutas SPA/login. Después implementar en incrementos con positivos reales y negativos sin escritura. Ventaja: permite trabajar con aplicaciones protegidas y buscar equivalencias históricas. Coste/riesgo: integra Auth + Browser + Discovery + redacción + lifecycle; más superficie de seguridad y pruebas físicas necesarias. **No hay autorización previa para afirmar que todo cabe antes del 20-11.**

**Recomendación técnica provisional:** reconocer la opción A como **capacidad parcial disponible** y priorizar el diseño/decisión de la opción B como bloqueo funcional, sin fingir que A equivale a B. No cambiar tests ni compuertas hasta que la decisión de MVP sea explícita; planificar B en etapas verificables si la autenticación forma parte de la promesa del MVP.

## Matriz mínima para decidir sin perder identidades

| Grupo | Identidades | Garantía exigida / decisión |
|---|---|---|
| Acceso denegado y no persistencia | TM-13, TM-18, TM-27 | Negativos de perfil/consentimiento y ausencia de filtración; gate SCOPING independiente |
| Login/redirección/classificación segura | TM-14, TM-15, TM-19, TM-30, TM-31, TM-32 | Definir si `auth_wall`/`page_kind` pertenecen al contrato MVP; distinguir HTTP 302, login estático y SPA JS |
| Sesión real y revocación | TM-16, TM-17, TM-50 | Positivos de perfil verificado, acceso autenticado autorizado, expiración/revocación y sesión persistida; bloqueados sin una composición host de privilegios |

No se cuenta una identidad como PASS sólo por agruparla en un lote. La equivalencia se demuestra por `fullName`, resultado físico, efectos persistidos y límites explícitos.

## Próximo bloque independiente de E01 — auditoría/contrato, no navegador

1. Analizar código real de AuthManager, session-resolver, server/SCOPING, DiscoveryHandler, BlackBoxCrawler y sus test fixtures. Trazar el origen y frontera de cada privilegio, autoridad host, invalidación de Environment y tratamiento de secretos. **No acceder a la sesión personal** `packages/playwright-runner/.qa/cache/sessions/admin-user.json`.
2. Para las doce identidades, registrar: comportamiento histórico exacto, capacidad productiva existente, ausencia real, contrato canónico propuesto, fixture necesario, pruebas negativas, efectos SQLite/FS y decisión A/B. Separar estáticos que pueden comprobarse sin navegador de E2E que necesitan ejecutor.
3. Recomendar un orden de implementación atómico, cada lote con criterio de aceptación y dependencia; mantener la opción B bajo decisión formal hasta aprobación. Ningún test histórico puede eliminarse, renombrarse, saltarse ni marcarse PASS por equivalencia retórica.
4. Conservar sin reabrir R4, E01 y DONE. No hacer merge a `develop` por alcanzar un número de PASS parcial.
5. Auditar en paralelo deuda TypeScript histórica (128) y Stdio únicamente si el entorno puede validarlos sin repetir E01; clasificar riesgos para MVP, no mezclar con autenticación.

## Comp puertas de integración

- E01 requiere ejecutor con reserva demostrable y certificación serial + dos paralelas, cero timeouts adicionales; R6-A no lo satisfizo.
- Auth requiere decisión de producto y pruebas positivas/negativas reales; no basta el rechazo de credenciales.
- Revisión humana auténtica, TS/ESLint global, Stdio, contratos y revisión independiente siguen pendientes.
- Fecha objetivo **20-11-2026** sin modificación. Si falta cualquiera de las compuertas obligatorias, **NO-GO para el cierre integral y merge**; registrar MVP de alcance limitado por separado cuando corresponda.
