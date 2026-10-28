# QAMCP vNext — Requisitos y decisiones de producto (BORRADOR VIVO)

> Estado: VNEXT-001 cerrada previamente; VNEXT-002 y VNEXT-003 implementadas por autorización expresa del responsable el 2026-10-28. VNEXT-004 y posteriores pendientes de autorización. Continuidad en [STATE.md](STATE.md).
> Rama de trabajo: `feat/qap-vnext-architecture` (creada desde `develop`).
> Este documento registra solo decisiones confirmadas por el responsable del producto y cuestiones abiertas. No autoriza cambios sobre `develop`.

## Decisiones confirmadas

### D-001 — Autonomía máxima
QAMCP debe permitir que un agente investigue, aprenda, planifique, ejecute pruebas, diagnostique y mantenga conocimiento con intervención humana mínima. Solo debe solicitar intervención ante bloqueos que no pueda resolver legítima y seguramente. Las políticas automáticas siguen siendo obligatorias.

### D-002 — QA, no modificación del producto
QAMCP detecta, reproduce, diagnostica, reporta defectos y propone correcciones. **No modifica el código fuente de la aplicación bajo prueba**. Sí puede generar y mantener sus propios recursos de automatización y evidencia.

### D-003 — Políticas por entorno
Operación autónoma completa en entornos de prueba previamente autorizados, con políticas configurables más restrictivas para producción. Las restricciones se aplican técnicamente; los permisos de credenciales por sí solos no implican autorización de operaciones destructivas.

### D-004 — Orquestación híbrida
El agente externo interpreta objetivos, investiga novedades y adapta estrategias. QAMCP proporciona herramientas MCP y puede ejecutar flujos completos, manejar dependencias/prioridades, recuperar fallos y producir reportes sin depender de una llamada LLM por cada paso.

### D-005 — Memoria unificada, despliegues local y self-hosted
Se aprueba como dirección de arquitectura:
- Modelo de conocimiento unificado para agentes y múltiples proyectos.
- Uso local por npm/MCP, con SQLite.
- Despliegue self-hosted opcional para usuarios/proyectos concurrentes, con PostgreSQL.
- Portabilidad, exportación/importación y versionado de conocimiento; Git queda como integración opcional, **no** como fuente operativa principal.
- El detalle de sincronización distribuida/offline, aislamiento multi-tenant y contratos de adaptadores queda pendiente de especificar.

## Alcance de producto adicional confirmado en conversación
- Soportar pruebas E2E completas, regresiones, funcionalidades nuevas, cambios menores, pruebas focalizadas, exploración/búsqueda de bugs y reproducción de defectos.
- Recuperar conocimiento de reglas de negocio, módulos, flujos, dependencias, roles, entornos, configuraciones, prerrequisitos y resultados para planificar por criticidad y poder diferenciar fallos de producto, de entorno y de automatización.
- Memoria dirigida a agentes: no se exige que el almacenamiento canónico sea Markdown/YAML legible por humanos.
- Importación y mantenimiento bidireccional de un manual empresarial: **caso particular futuro**, no característica central que deba implementarse ahora.
- No conservar código solo por costos hundidos: se puede reemplazar cuando exista una ventaja justificada.

## Aislamiento respecto a Diego
- Desarrollo y documentación en esta rama separada; Diego continúa en `develop`.
- Una rama separa historia Git, no espacios de trabajo, caches, bases de datos o infraestructura compartida: usar worktree/clon propio para experimentos.
- Antes de integrar, revisar divergencia de contratos en `engine`, `knowledge`, `mcp`, `cli`, runner y esquemas; alertar si hay que coordinar una ventana de integración.
- No fusionar ni editar `main` / `develop` sin nueva autorización.

## Decisiones adicionales confirmadas y criterios de producto

### D-006 — Conocimiento con estados de certeza y Discovery black-box first
La memoria registra conocimiento observado, inferido, confirmado y pendiente de revisión con procedencia y vigencia. El agente puede descubrir una aplicación sin código fuente ni documentación, comenzando con URL, autorización/política del entorno y acceso a credenciales cuando resulte necesario. Documentos y código son fuentes opcionales de enriquecimiento. La implementación de los niveles de confianza y el modelo de entidades sigue pendiente de diseño.

### D-007 — Instancias, sesión y caché del navegador
El conocimiento de la aplicación no debe mezclarse con credenciales ni estados volátiles de la sesión. Mantener perfiles de entorno persistentes o temporales cuando corresponda. QAP debe permitir contextos de navegador limpios por prueba/flujo y restauración segura de autenticación; no confundir limpieza de caché de navegador con la eliminación de la memoria QAP. Proveedores de credenciales externos, incluido 1Password, son opciones evaluables, no dependencias obligatorias.

### D-008 — Guía interactiva al desarrollador
QAP es además un asesor de QA: ante funcionalidad nueva, módulo nuevo, modificación puntual, incidente o necesidad de regresión, propone estrategias de prueba y puede preguntar por el alcance deseado (funcional, reglas de negocio, seguridad, UI, UX, rendimiento, etc., o cobertura integral). Debe recomendar tipos de prueba aplicables según contexto y riesgos, sin exigir preguntas innecesarias, y ejecutar/diagnosticar lo autorizado.

### D-009 — Distribución npx-first
La experiencia final del usuario es instalar/iniciar/registrar el MCP mediante npx, con configuración y preparación automáticas. No imponer clonación de monorepo, compilación manual ni servicios externos para el modo local. La posibilidad self-hosted es una modalidad opcional futura/avanzada, pero no debe desvirtuar el producto principal ni obligar a distribuirlo como stack separado. Verificar compatibilidad real antes de fijar el diseño de distribución.

### D-010 — Evolución documentada por etapas
Todo cambio de arquitectura o implementación debe contar con motivos, alternativas, impactos, riesgos, prueba de verificación, criterios de aceptación y decisión de conservar/reemplazar. Teamwork actúa primero como arquitecto-coordinador: desglosa iniciativas en unidades acotadas y delegables; no ejecuta una refactorización total en una sola tarea. No eliminar AGENTS.md ni .agents/ sin inventario y propuesta justificada.

### D-011 — Separación Epistemológica en la Representación del Conocimiento
El modelo de conocimiento debe distinguir formalmente cuatro planos epistemológicos independientes:
1. **Observaciones de la aplicación:** Telemetría empírica de lo que la aplicación ejecuta o expone actualmente en tiempo de ejecución (DOM, tráfico XHR/Fetch, mensajes de error, respuestas HTTP).
2. **Inferencias del agente:** Hipótesis preliminares generadas por heurísticas o LLMs con un puntaje de confianza (`confidence_score`) y justificación.
3. **Requisitos esperados:** Especificaciones autoritativas del comportamiento deseado de negocio, provistas por el desarrollador, documentación formal o confirmación humana en entrevista.
4. **Verificaciones de conformidad:** Comparación formal entre la observación actual y el requisito esperado, emitiendo veredictos de `pass`, `fail`, `contradiction` o `indeterminate`.
*Invariante Crítica:* Una sonda activa no destructiva que reproduce el comportamiento actual de la aplicación comprueba únicamente la *consistencia y reproducibilidad observacional*; **NUNCA promueve una regla de negocio a `confirmed`**. Una anomalía en producción puede ser reproducible por una sonda y seguir siendo un defecto frente al requisito esperado.

### D-012 — Gobernanza de Migración y Semántica de `manually_edited`
El atributo histórico `manually_edited: true` del almacenamiento v2.1 indica intervención humana para evitar sobreescritura automática, pero **no debe convertirse automáticamente en certeza absoluta (`confidence: 1.0`) ni en verdad dogmática inmutable**. En la memoria relacional vNext, se migra con procedencia `source: 'legacy_manual_edit'`, precedencia superior a inferencias automatizadas no revisadas, pero sujeto a revisión humana o marcado de `pending_review` ante cambios estructurales o contradicciones empíricas.

### D-013 — Contexto Multidimensional de Entidades de Conocimiento
Toda entidad de conocimiento debe poder asociarse con sus dimensiones contextuales operativas:
- **Aplicación / Subsistema:** Identificador de la aplicación o servicio bajo prueba.
- **Entorno:** Vinculación a entorno específico (`dev`, `staging`, `prod`) y su política de seguridad.
- **Roles y Permisos:** Requisitos de RBAC y capacidades de usuario necesarias para acceder o ejecutar.
- **Prerrequisitos:** Estados previos de datos, precondiciones de sistema y dependencias en grafo DAG.
- **Sesión y Autenticación:** Puntero a perfil o token de sesión, desacoplado de los datos de la entidad.
- **Políticas de Limpieza de Navegador:** Estrategia de aislamiento requerida (`clean_cache`, `fresh_context`, `persist_session`).
- **Evidencias Multimodales:** Referencias a capturas con PII enmascarada, fragmentos de tráfico de red y árboles DOM.

### D-014 — Diagnósticos No Concluyentes y Resultados Indeterminados
El motor de diagnóstico y el QA Advisor tienen estrictamente prohibido emitir clasificaciones conclusivas de defectos basadas únicamente en códigos de estado HTTP (ej. asumir ciegamente que un error 500 es siempre `product_bug` o que un 502/504 es siempre `environment_error`). El sistema debe admitir explícitamente resultados `indeterminate` / `inconclusive` cuando la evidencia técnica sea ambigua o insuficiente, sugiriendo comprobaciones adicionales al desarrollador.

### D-015 — Distinción entre Artefactos de Agente Versionados y Configuración Local
Se establece una separación estricta entre:
- **Artefactos versionados en Git:** Reglas de repositorio (`.agents/rules/`), habilidades canónicas (`.agents/skills/`), esquemas de contratos y prompts de sistema compartidos por el equipo.
- **Configuraciones de ejecución local:** Bases de datos locales SQLite (`.qamcp/`), bóveda de secretos cifrada local, configuraciones de clientes MCP (`claude_desktop_config.json`, etc.) y bitácoras efímeras de sesión. Estos artefactos son privados de cada máquina/entorno y están estrictamente excluidos del control de versiones.

## Requisitos abiertos y verificación empírica previa (no asumir como aprobados)
1. **Verificación de Entorno de Ejecución Node.js:** Validar matriz de compatibilidad de `node:sqlite` (`DatabaseSync`) en versiones LTS (Node 20.x mediante flag/fallback vs Node 22.x nativo) en Windows, Linux y macOS antes de fijar DDL final.
2. **Verificación de Distribución `npx` Zero-Config:** Evaluar tamaño de paquete, arranque sin compilación C++ nativa y estrategia de aprovisionamiento de navegadores Playwright (reutilización de binarios del sistema vs descarga bajo demanda) antes de implementar Hito 5.
3. **Verificación de Bóveda Escalonada de Credenciales:** Probar comportamiento del fallback criptográfico AES-256-GCM + PBKDF2 en contenedores CI/CD desprovistos de servicios de keychain del sistema operativo antes de implementar Hito 1.
4. **Modelo de pruebas por tipo, criticidad y planificación/cobertura de flujos en DAG.**
5. **Criterios operativos empíricos para contradicciones y resolución de conflictos de conocimiento.**
6. **Política de cambios entre ramas y mecanismo de integración cuando evoluciona `develop`.**

## Política del documento
No marcar propuestas como aprobadas. Cada nueva decisión debe anotarse explícitamente antes de diseñar el esquema físico, implementar migraciones o crear el WBS.
