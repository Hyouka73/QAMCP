# QAMCP vNext — Requisitos y decisiones de producto (BORRADOR VIVO)

> Estado: levantamiento de requisitos, **no** arquitectura ni WBS definitivos.
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

## Requisitos abiertos (no tomar como decisiones)
1. D-006: unidad atómica de conocimiento, relaciones, evidencia y niveles de confianza / vigencia.
2. D-007: separación de conocimientos compartidos frente a datos y configuraciones por entorno.
3. D-008: interoperabilidad entre agentes; import/export y semántica de cambios concurrentes.
4. D-009: catálogo de tipos de prueba y prioridades, definición de un flujo E2E autónomo.
5. D-010: criterio operativo para bug real vs bloqueo/configuración/flakiness y realimentación de memoria.

## Política del documento
No marcar propuestas como aprobadas. Cada nueva decisión debe anotarse explícitamente antes de diseñar el esquema físico, implementar migraciones o crear el WBS.
