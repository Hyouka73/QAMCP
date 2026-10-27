# QAMCP vNext — Requisitos y decisiones de producto (BORRADOR VIVO)

> Estado: requisitos principales definidos; pendiente de arquitectura detallada y WBS. **No es autorización de implementación**.
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

## Requisitos abiertos (no asumir como aprobados)
1. Modelo atómico de entidades, relaciones, evidencias, precedencia y mecanismos para revisar contradicciones.
2. Arquitectura de almacenamiento compartido, privacidad, separación de tenants y migración local/self-hosted sin doble fuente de verdad.
3. Modelo de pruebas por tipo, criticidad y planificación/cobertura de flujos.
4. Criterios operativos para bug real, error de entorno, prueba bloqueada, flakiness y realimentación del sistema.
5. Política de cambios entre ramas y mecanismo de integración cuando evoluciona `develop`.
6. Contrato concreto de npx/registro MCP y los requisitos mínimos de Node/navegador.


## Política del documento
No marcar propuestas como aprobadas. Cada nueva decisión debe anotarse explícitamente antes de diseñar el esquema físico, implementar migraciones o crear el WBS.
