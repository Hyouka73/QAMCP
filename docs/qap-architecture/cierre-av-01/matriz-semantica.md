# AV-01 · Matriz individual de preservación semántica

Las obligaciones y aceptaciones candidatas se mantienen ancladas al catálogo y al acta en el SHA auditado. Las filas de Etapa 3 son fuente secundaria de los 82 originales. La contribución de Neon es una propuesta resumida. La columna de Antigravity aplica su corrección de clase explícita a QA-003 y mantiene las 91 clases restantes para reproducir su reparto. Sus observaciones sobre MEM-002.1 y SEG-002.1 se conservan como cuestiones de modelado y etiquetado.

Cada fila comprueba alcance, condiciones y dependencias contra la fuente enlazada. La aceptación permanece candidata. La marca **ajuste** exige preservar o precisar lo indicado antes de congelar el objetivo. La marca **preservable por referencia** indica que el resumen puede conservar el alcance si remite al contrato completo en la base. Ninguna fila acredita implementación.

## Memoria y conocimiento

### REQ-MEM-001.1

**Origen y obligación.** Original vía Etapa 3. Imponer plano obligatorio en un único almacén canónico para toda entidad. [REQ-MEM-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L13) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L20).

**Dependencias, condiciones y alcance.** SEG 001.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Impedir persistencia sin plano y consultar por separado observación, inferencia, regla acreditada y resultado.

**Propuesta de Neon.** Plano epistémico obligatorio en almacén canónico único. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L52.

**Preservable por referencia.** Conservar los cuatro planos, la obligatoriedad para toda entidad y la capacidad de consultarlos por separado.

### REQ-MEM-001.2

**Origen y obligación.** Original vía Etapa 3. Regla invariante en la capa de dominio/repositorio aplicable a MCP y CLI. [REQ-MEM-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L22) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L21).

**Dependencias, condiciones y alcance.** MEM 001.1, DOC 001.4. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Una observación repetida queda en su plano en ambos canales hasta acreditar autoridad y procedencia.

**Propuesta de Neon.** Invariante de no autopromoción (observación ≠ regla de negocio). **Decisiones citadas.** D05, D12. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L53.

**Preservable por referencia.** La repetición no acredita una regla. Exigir procedencia y autoridad, también en CLI y almacenamiento.

### REQ-MEM-001.3

**Origen y obligación.** Original vía Etapa 3. Versionado inmutable uniforme de entidades de conocimiento y casos en un solo modelo. [REQ-MEM-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L31) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L22).

**Dependencias, condiciones y alcance.** MEM 001.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Revisar una regla y un caso conserva la lectura de versiones previas y rechaza sus mutaciones.

**Propuesta de Neon.** Versionado inmutable uniforme de entidades y casos. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L54.

**Preservable por referencia.** Conservar versiones anteriores legibles e impedir su mutación en casos y conocimiento.

### REQ-MEM-001.4

**Origen y obligación.** Original vía Etapa 3. Máquina de estados de revisión para ediciones manuales disparada por drift/conflicto. [REQ-MEM-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L40) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L23).

**Dependencias, condiciones y alcance.** MEM 001.3, REG 001.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Un cambio incompatible marca una edición protegida para revisión y preserva su contenido y linaje.

**Propuesta de Neon.** Máquina de estados `pending_review` para ediciones manuales ante drift. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L55.

**Preservable por referencia.** El conflicto activa revisión conservando contenido editado y linaje. La reparación automática tiene ese límite.

### REQ-MEM-002.1

**Origen y obligación.** Original vía Etapa 3. Vector de alcance completo `(project, app, instance, env, tenant, role, version, config_rev)` en todo el almacenamiento. **Precisión del catálogo.** Vector de alcance completo `(project, app, instance, env, tenant, role, version, config_rev)` en todo el almacenamiento. D02/D05 explicitan también perfil y configuración, además de las dimensiones históricas. [REQ-MEM-002.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L49) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L24).

**Dependencias, condiciones y alcance.** SEG 001.2. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Ejecutar dos perfiles con variantes divergentes y probar aislamiento en claves, FTS, exportación y reportes.

**Propuesta de Neon.** Vector de alcance completo `(project, app, instance, env, tenant, profile, role, version, config_rev)`. **Decisiones citadas.** D02, D05, D09. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L56.

**Ajuste.** Conservar las ocho dimensiones históricas y añadir perfil y variante visual explícitos. Antigravity pide representación regional para evitar colisiones D17. Distinguir dimensiones de aislamiento de entradas congeladas de reproducción. [AR-04](registro-maestro.md#ar-04).

### REQ-MEM-002.2

**Origen y obligación.** Original vía Etapa 3. Validador único de alcance obligatorio en el núcleo compartido por MCP y CLI. [REQ-MEM-002.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L58) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L25).

**Dependencias, condiciones y alcance.** MEM 002.1, SEG 001.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** MCP y CLI rechazan el mismo alcance ambiguo, requerido e incompleto o cruzado antes de acceder.

**Propuesta de Neon.** Validador único de alcance compartido por MCP y CLI. **Decisiones citadas.** D02, D05, D20. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L57.

**Preservable por referencia.** Ante alcance requerido ambiguo o incompleto, bloquear antes de acceder en ambos canales.

### REQ-MEM-002.3

**Origen y obligación.** Original vía Etapa 3. Persistencia unificada de estado de campaña, frontera, cola determinista y cola de razonamiento. [REQ-MEM-002.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L67) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L26).

**Dependencias, condiciones y alcance.** CAM 001.2, IA 001.4. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Matar y relanzar el ejecutor restaura frontera, tareas listas y razonamiento pendiente sin duplicarlos.

**Propuesta de Neon.** Persistencia de campaña, frontera, cola determinista y cola de razonamiento. **Decisiones citadas.** D03, D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L58.

**Preservable por referencia.** Persistir frontera y ambas colas junto al estado y comprobar reanudación tras corte.

### REQ-MEM-002.4

**Origen y obligación.** Original vía Etapa 3. Servicio de snapshot contextual determinista para re-hidratar cualquier host/modelo. [REQ-MEM-002.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L76) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L27).

**Dependencias, condiciones y alcance.** MEM 002.2–002.3. Fuentes y permisos por alcance. **Ampliaciones.** [REQ-AGT-002](#ampliación-req-agt-002), [REQ-OPT-002](#ampliación-req-opt-002)

**Evidencia de aceptación candidata.** Una consulta autorizada desde otro host recupera cobertura, IDs y siguiente tarea. El alcance revocado se bloquea.

**Propuesta de Neon.** Absorbe `REQ-AGT-002` y `REQ-OPT-002` (snapshot contextual compacto multi-host). **Decisiones citadas.** D03, D05, D13. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L59.

**Preservable por referencia.** AGT-002/OPT-002 conservan permisos, omisiones, próxima acción y continuidad entre hosts con contexto acotado.

### REQ-MEM-002.5

**Origen y obligación.** Original vía Etapa 3. Separación física y lógica estricta entre memoria de conocimiento y almacén efímero de sesiones/caché. [REQ-MEM-002.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L85) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L28).

**Dependencias, condiciones y alcance.** SEG 002.1–002.2. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Un export de Knowledge conserva procedencia y excluye secretos y sesiones. Revocar sesión conserva Knowledge.

**Propuesta de Neon.** Separación física/lógica memoria funcional vs secretos/sesiones/caché. **Decisiones citadas.** D05, D09, D20. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L60.

**Preservable por referencia.** Aplicar separación también a exportaciones y caché. El alcance funcional no transmite sesión ni credenciales.

### REQ-MEM-003.1

**Origen y obligación.** Original vía Etapa 3. Registro único de contradicciones tipadas con estado de resolución y bloqueo de oráculo. [REQ-MEM-003.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L94) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L29).

**Dependencias, condiciones y alcance.** DOC 001.3–001.4. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Una regla en conflicto y la observación asociada conservan localizadores, estado y bloqueo de su oráculo.

**Propuesta de Neon.** Registro único de contradicciones tipadas con bloqueo de oráculo. **Decisiones citadas.** D05, D10. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L61.

**Preservable por referencia.** Tipar, resolver y conservar contradicciones. La expectativa quedará bloqueada mientras su autoridad sea incierta.

### REQ-MEM-003.2

**Origen y obligación.** Original vía Etapa 3. Motor activo de propagación de `stale` por grafo de dependencias conectado al núcleo. [REQ-MEM-003.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L103) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L30).

**Dependencias, condiciones y alcance.** MEM 001.3, REG 001.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Cambiar una fuente invalida las revisiones dependientes y conserva vigentes las independientes.

**Propuesta de Neon.** Motor activo de propagación `stale` por grafo de dependencias. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L62.

**Preservable por referencia.** Propagar obsolescencia a dependientes, preservando revisiones y aislando el cambio.

### REQ-MEM-003.3

**Origen y obligación.** Original vía Etapa 3. Pipeline post-ejecución que alimenta firmas, flakiness y observaciones sin tocar requisitos. [REQ-MEM-003.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L112) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L31).

**Dependencias, condiciones y alcance.** RUN 001.6, REP 001.3. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Repetir fallos registra firma e indicadores de inestabilidad enlazados con sus intentos y deja intacta la regla.

**Propuesta de Neon.** Pipeline post-ejecución de firmas, flakiness y latencias sin tocar reglas. **Decisiones citadas.** D05, D19. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L63.

**Preservable por referencia.** Actualizar señales, firmas, latencias y flakiness. Mantener inmutables las reglas acreditadas.

### REQ-MEM-003.4

**Origen y obligación.** Original vía Etapa 3. Exportador/importador de paquetes portables versionados con filtro estricto anti-secretos. [REQ-MEM-003.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L121) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L32).

**Dependencias, condiciones y alcance.** MEM 001.3, SEG 002.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Exportar e importar un alcance con hashes reproduce entidades y revisiones y excluye secretos y sesiones.

**Propuesta de Neon.** Export/import portable versionado con filtro anti-secretos. **Decisiones citadas.** D05, D19, D20. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L64.

**Preservable por referencia.** Conservar intercambio en ambos sentidos, versión, procedencia y filtro estricto. No limitar la prueba a exportación.

### REQ-MEM-003.5

**Origen y obligación.** Original vía Etapa 3. Motor único de retención y borrado aislado por proyecto usado por MCP y CLI. [REQ-MEM-003.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L130) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L33).

**Dependencias, condiciones y alcance.** RUN 001.6, REP 001.1. Fuentes y permisos por alcance. **Ampliaciones.** [REQ-OPT-002](#ampliación-req-opt-002)

**Evidencia de aceptación candidata.** Simular y aplicar poda por alcance concilia los candidatos y bytes lógicos, protege ejecuciones activas y conserva veredicto y evento.

**Propuesta de Neon.** Absorbe `REQ-OPT-002`; motor único de retención y poda con simulación real. **Decisiones citadas.** D16, D19. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L65.

**Preservable por referencia.** OPT-002 mantiene simulación efectiva. D19 añade protección de actividad y defectos y O-10 exige precedencia privada. [AR-25](registro-maestro.md#ar-25).

### REQ-MEM-003.6

**Origen y obligación.** Original vía Etapa 3. Puerto de persistencia único con adaptador local (SQLite) y contrato listo para adaptador concurrente (PostgreSQL). [REQ-MEM-003.6](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L139) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L34).

**Dependencias, condiciones y alcance.** INT 001.3, SEG 001.1. Fuentes y permisos por alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Ejecutar pruebas de contrato del almacén local y demostrar que el dominio no depende de SQL, driver ni transporte específicos.

**Propuesta de Neon.** Puerto `IQapRepository` con adaptador SQLite local y contrato listo para PostgreSQL. **Decisiones citadas.** D02. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L66.

**Preservable por referencia.** SQLite local desde lanzamiento, contrato preparado para PostgreSQL concurrente posterior. Driver y piso Node requieren cierre separado. [AR-12](registro-maestro.md#ar-12).

## Discovery

### REQ-DIS-001.1

**Origen y obligación.** Original vía Etapa 3. Bucle autónomo de lotes controlado por el orquestador hasta `READY` o presupuesto. [REQ-DIS-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L152) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L40).

**Dependencias, condiciones y alcance.** CAM 001.2–001.3. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Partir de una intención autorizada, continuar lotes sin aprobación ordinaria y registrar READY o agotamiento con brechas.

**Propuesta de Neon.** Bucle autónomo de lotes hasta `READY` o presupuesto. **Decisiones citadas.** D04, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L67.

**Preservable por referencia.** Demostrar progresión de múltiples lotes hasta READY o límite, vinculada a la campaña de punta a punta.

### REQ-DIS-001.2

**Origen y obligación.** Original vía Etapa 3. Modelo uniforme de frontera y cobertura para toda exploración (inicial y focalizada). [REQ-DIS-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L161) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L41).

**Dependencias, condiciones y alcance.** MEM 002.3. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Interrumpir Discovery inicial y focalizado y recuperar frontera, visitados y brechas con la misma semántica.

**Propuesta de Neon.** Modelo uniforme de frontera/cobertura en exploración inicial y focalizada. **Decisiones citadas.** D05, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L68.

**Preservable por referencia.** Usar una frontera común para exploración inicial y focalizada con cobertura y pendientes visibles.

### REQ-DIS-001.3

**Origen y obligación.** Original vía Etapa 3. Extractor DOM profundo para SPAs: etiquetas reales (ARIA/texto), tablas, filtros, paginación, formularios, validaciones y estados. [REQ-DIS-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L170) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L42).

**Dependencias, condiciones y alcance.** SEG 001.2. Identidad y política de lectura. **Ampliaciones.** [REQ-OPT-002](#ampliación-req-opt-002)

**Evidencia de aceptación candidata.** Comparar contra inventario independiente controles, etiquetas, tablas, filtros, páginas y validaciones en SPA.

**Propuesta de Neon.** Absorbe `REQ-OPT-002`; extractor DOM+ARIA profundo para SPAs, tablas, filtros, paginación. **Decisiones citadas.** D15, D16, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L69.

**Preservable por referencia.** Conservar formularios, validaciones, estados e inventario reproducible de SPA. OPT-002 exige conservar procedencia al compactar. [AR-36](registro-maestro.md#ar-36).

### REQ-DIS-001.4

**Origen y obligación.** Original vía Etapa 3. Observador de tráfico de lectura integrado al crawler con correlación vista ↔ endpoint API. [REQ-DIS-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L179) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L43).

**Dependencias, condiciones y alcance.** SEG 001.1–001.2. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Asociar lecturas acreditadas a vista y versión y comprobar que la hidratación funciona bajo la política de lectura.

**Propuesta de Neon.** Observador de tráfico de lectura integrado y correlación vista ↔ endpoint API. **Decisiones citadas.** D15, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L70.

**Preservable por referencia.** Conservar correlación vista, estado y endpoint para lecturas autorizadas. El tráfico observado carece de autoridad de negocio por sí solo.

### REQ-DIS-001.5

**Origen y obligación.** Original vía Etapa 3. Matriz diferencial de visibilidad por rol, tenant y configuración efectiva. [REQ-DIS-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L188) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L44).

**Dependencias, condiciones y alcance.** MEM 002.1, SEG 002.2. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Comparar permisos de dos roles y dos configuraciones y registrar diferencias con procedencia y alcance.

**Propuesta de Neon.** Matriz diferencial de visibilidad por rol, tenant y configuración efectiva. **Decisiones citadas.** D05, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L71.

**Preservable por referencia.** La comparación requiere rol, tenant y configuración efectiva. Preservar diferencias por variante y alcance.

### REQ-DIS-001.6

**Origen y obligación.** Original vía Etapa 3. Grafo dual explícito: aristas de navegación vs dependencias de negocio acreditadas. [REQ-DIS-001.6](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L197) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L45).

**Dependencias, condiciones y alcance.** MEM 001.1–001.2. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Una ruta navegable genera una arista observada y una dependencia de negocio exige fuente acreditada.

**Propuesta de Neon.** Grafo dual explícito: navegación observada vs dependencias de negocio acreditadas. **Decisiones citadas.** D05, D06. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L72.

**Preservable por referencia.** Mantener por separado navegación observada y dependencia acreditada, con autoridad y etiquetas propias.

### REQ-DIS-001.7

**Origen y obligación.** Original vía Etapa 3. Checkpoints por alcance para todo Discovery y refresco incremental guiado por drift. [REQ-DIS-001.7](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L206) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L46).

**Dependencias, condiciones y alcance.** MEM 002.3, REG 001.1. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Reanudar checkpoint del alcance efectivo y ante drift inspeccionar solo la parte invalidada.

**Propuesta de Neon.** Checkpoints por alcance y refresco incremental por drift. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L73.

**Preservable por referencia.** El checkpoint sobrevive a reinicio por alcance. Refrescar la parte afectada y mantener historia.

### REQ-DIS-001.8

**Origen y obligación.** Original vía Etapa 3. Ejecución de lotes desacoplada en worker/orquestador soberano de QAP. [REQ-DIS-001.8](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L215) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L47).

**Dependencias, condiciones y alcance.** CAM 001.4. Identidad y política de lectura. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Terminar el host con lotes de observación listos y comprobar que el ejecutor los completa y conserva pausas que requieren razonamiento.

**Propuesta de Neon.** Ejecución de lotes desacoplada en worker soberano. **Decisiones citadas.** D03. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L74.

**Preservable por referencia.** Probar trabajo y recuperación fuera del proceso del host. Una promesa asíncrona en Stdio carece de esa garantía.

## Ingesta documental

### REQ-DOC-001.1

**Origen y obligación.** Original vía Etapa 3. Pipeline de ingesta estructurada por adaptadores de formato con localizador (sección/página/versión). **Precisión del catálogo.** Pipeline de ingesta estructurada por adaptadores de formato con localizador (sección/página/versión). Incorporar los formatos de D10 y conservar tablas y localizadores de páginas, secciones, hojas y celdas. [REQ-DOC-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L228) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L53).

**Dependencias, condiciones y alcance.** MEM 001.3, INT 001.4. Fuentes acreditadas, alcance y revisión. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Ingerir el corpus mínimo de D10 y recuperar texto y tablas con páginas, celdas/secciones, versión y procedencia.

**Propuesta de Neon.** Pipeline estructurado para PDF, DOCX, Excel, MD, TXT, JSON, YAML, OpenAPI con localizadores. **Decisiones citadas.** D10, D17. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L75.

**Preservable por referencia.** Todos los formatos D10 desde lanzamiento. Conservar tablas y localizadores de hoja/celda/página. La ingesta y D11 tienen aceptaciones distintas. [AR-13](registro-maestro.md#ar-13).

### REQ-DOC-001.2

**Origen y obligación.** Original vía Etapa 3. Registro explícito de cobertura de extracción y fragmentos omitidos/no legibles. [REQ-DOC-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L237) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L54).

**Dependencias, condiciones y alcance.** DOC 001.1. Fuentes acreditadas, alcance y revisión. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Registrar páginas escaneadas, celdas o secciones ilegibles y omisiones con su localizador e impedir el uso de extracción insuficiente.

**Propuesta de Neon.** Cobertura explícita de extracción, OCR/escaneados y omisiones/abstención. **Decisiones citadas.** D10, D11. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L76.

**Preservable por referencia.** Registrar cobertura y fragmento omitido. Para escaneados, acreditar extracción o abstención fundada sin inventar contenido. [AR-13](registro-maestro.md#ar-13).

### REQ-DOC-001.3

**Origen y obligación.** Original vía Etapa 3. Motor de reconciliación bidireccional documento ↔ observación con los 4 estados exactos. [REQ-DOC-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L246) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L55).

**Dependencias, condiciones y alcance.** DOC 001.1–001.2, DIS 001.3. Fuentes acreditadas, alcance y revisión. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Sembrar los cuatro estados de conciliación y distinguir coincidente, documentado no observado, observado no documentado y contradicción real.

**Propuesta de Neon.** Reconciliador bidireccional documento ↔ observación en 4 estados. **Decisiones citadas.** D10. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L77.

**Preservable por referencia.** Conservar los cuatro estados y ambos sentidos de comparación con revisiones y procedencia.

### REQ-DOC-001.4

**Origen y obligación.** Original vía Etapa 3. Regla transversal de autoridad documental aplicada a todo diseño de casos y oráculos. [REQ-DOC-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L255) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L56).

**Dependencias, condiciones y alcance.** MEM 001.2, DOC 001.3. Fuentes acreditadas, alcance y revisión. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Una fuente primaria acreditada prevalece según alcance y vigencia. Una contradicción material sin resolver bloquea el oráculo.

**Propuesta de Neon.** Regla transversal de autoridad documental y bloqueo ante contradicción. **Decisiones citadas.** D05, D10, D12. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L78.

**Preservable por referencia.** Autoridad documental para casos y oráculos, con suspensión ante contradicción o insuficiencia.

## Inteligencia y acreditación

### REQ-IA-001.1

**Origen y obligación.** Original vía Etapa 3. Protocolo limpio de solicitudes/propuestas estructuradas entre núcleo QAP y host. [REQ-IA-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L268) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L62).

**Dependencias, condiciones y alcance.** MEM 002.4, CAM 001.2. Colas, política y formato de propuestas. **Ampliaciones.** [REQ-AGT-002](#ampliación-req-agt-002)

**Evidencia de aceptación candidata.** Emitir solicitud estructurada y aceptar una propuesta de revisión vigente. Rechazar la propuesta caducada y los cambios de autoridad.

**Propuesta de Neon.** Absorbe `REQ-AGT-002`; protocolo estructurado solicitudes/propuestas con HOST. **Decisiones citadas.** D03, D13, D17. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L79.

**Preservable por referencia.** AGT-002 añade contexto acotado para HOST. Conservar el contrato tipado, aceptación por núcleo y portabilidad entre hosts.

### REQ-IA-001.2

**Origen y obligación.** Original vía Etapa 3. Modo `DETERMINISTIC` formal en el orquestador para repetición y regresión autónoma. [REQ-IA-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L277) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L63).

**Dependencias, condiciones y alcance.** PLN 001.5, RUN 001.2. Colas, política y formato de propuestas. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Repetir y ejecutar regresión congelada con cero llamadas de inferencia y conservar el linaje del intento.

**Propuesta de Neon.** Modo `DETERMINISTIC` formal sin inferencia por paso. **Decisiones citadas.** D03, D17. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L80.

**Preservable por referencia.** Mantener replay y regresión autónoma con snapshot y reglas congeladas, sin inferencia por paso.

### REQ-IA-001.3

**Origen y obligación.** Original vía Etapa 3. Validador único de propuestas estructuradas (escenarios, oráculos, diagnósticos, reparaciones). [REQ-IA-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L286) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L64).

**Dependencias, condiciones y alcance.** IA 001.1, SEG 001.1. Colas, política y formato de propuestas. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Rechazar propuestas malformadas, no acreditadas o fuera de alcance en escenarios, diagnóstico, oráculos y reparaciones.

**Propuesta de Neon.** Validador único de propuestas estructuradas (escenarios, oráculos, diagnósticos, reparaciones). **Decisiones citadas.** D03, D04. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L81.

**Preservable por referencia.** Validar propuestas de escenarios, oráculos, diagnóstico y reparación con la misma autoridad y criterios.

### REQ-IA-001.4

**Origen y obligación.** Original vía Etapa 3. Motor de campaña con separación de colas determinista vs razonamiento y handoff multi-host. [REQ-IA-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L295) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L65).

**Dependencias, condiciones y alcance.** MEM 002.3, CAM 001.4. Colas, política y formato de propuestas. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Desconectar HOST, drenar cola elegible y reclamar razonamiento pendiente desde otro host compatible.

**Propuesta de Neon.** Separación de colas determinista vs razonamiento y handoff multi-host. **Decisiones citadas.** D03, D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L82.

**Preservable por referencia.** Probar continuidad de ambos carriles al cambiar host y caída. Mantener separados trabajo determinista y propuestas.

### REQ-IA-001.5

**Origen y obligación.** Original vía Etapa 3. Verificación criptográfica/integridad única de origen de intento en MCP y CLI. [REQ-IA-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L304) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L66).

**Dependencias, condiciones y alcance.** RUN 001.6, REP 001.1. Colas, política y formato de propuestas. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Alterar un byte de un intento y demostrar el mismo rechazo de acreditación en MCP y CLI.

**Propuesta de Neon.** Verificación criptográfica SHA-256 de origen de intento en MCP y CLI. **Decisiones citadas.** D13, D20. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L83.

**Ajuste.** Conflicto: un digest no acredita procedencia. O-04 y el Orquestador exigen frontera verificable, incluida amenaza bajo el mismo usuario. [AR-28](registro-maestro.md#ar-28).

### REQ-IA-001.6

**Origen y obligación.** Original vía Etapa 3. Puerto `IReasoningProvider` opcional (implementable en fase posterior según `DP-06`). [REQ-IA-001.6](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L313) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L67).

**Dependencias, condiciones y alcance.** IA 001.1, INT 001.4. Colas, política y formato de propuestas. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Ejercer el contrato con un doble aislado y completar los modos iniciales con cero dependencia del proveedor MANAGED.

**Propuesta de Neon.** Puerto `IReasoningProvider` opcional para fase posterior (`MANAGED`). **Decisiones citadas.** D03. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L84.

**Preservable por referencia.** Mantener puerto de extensión y aplazamiento autorizado de MANAGED. HOST y DETERMINISTIC siguen exigidos.

## Planificación

### REQ-PLN-001.1

**Origen y obligación.** Original vía Etapa 3. Modelo unificado de 4 entidades: `CampaignPlan`, `ExecutionPlan`, `DataPlan`, `TestCase`. [REQ-PLN-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L326) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L73).

**Dependencias, condiciones y alcance.** MEM 001.3, CAS 001.3. Discovery, reglas, permisos y casos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Vincular campaña, ejecución, datos y caso versionados con un snapshot de revisiones reproducible.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; modelo unificado `CampaignPlan`, `ExecutionPlan`, `DataPlan`, `TestCase`. **Decisiones citadas.** D06, D08. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L85.

**Preservable por referencia.** E2E exige cuatro entidades, transferencias tipadas, dependencias, preparación y evidencia.

### REQ-PLN-001.2

**Origen y obligación.** Original vía Etapa 3. Planificador incremental que genera bloques ejecutables desde `PARTIAL_READY`. [REQ-PLN-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L335) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L74).

**Dependencias, condiciones y alcance.** DIS 001.2, CAS 001.1. Discovery, reglas, permisos y casos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Con cobertura parcial, materializar casos cubiertos y mostrar brechas y ramas bloqueadas.

**Propuesta de Neon.** Planificador incremental desde `PARTIAL_READY`. **Decisiones citadas.** D04. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L86.

**Preservable por referencia.** Habilitar bloques listos parciales e identificar el alcance bloqueado. No equiparar PARTIAL_READY con cobertura completa.

### REQ-PLN-001.3

**Origen y obligación.** Original vía Etapa 3. Motor de priorización por riesgo (criticidad, drift, defectos previos, presupuesto). [REQ-PLN-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L344) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L75).

**Dependencias, condiciones y alcance.** REG 001.1, CAM 001.3. Discovery, reglas, permisos y casos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Con igual presupuesto, priorizar por criticidad, drift e historial y registrar el motivo reproducible.

**Propuesta de Neon.** Motor de priorización por riesgo (criticidad, drift, defectos, presupuesto). **Decisiones citadas.** D04, D16. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L87.

**Preservable por referencia.** Evaluar efecto de criticidad, drift, defectos y presupuesto sobre prioridad, sin diluir obligaciones.

### REQ-PLN-001.4

**Origen y obligación.** Original vía Etapa 3. Resolvedor DAG unificado multi-caso y multi-módulo con bloqueo ante ciclos. [REQ-PLN-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L353) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L76).

**Dependencias, condiciones y alcance.** PLN 001.1, DAT 001.2. Discovery, reglas, permisos y casos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Resolver tres módulos y dos identidades. Bloquear el ciclo antes de ejecutar y transferir variables tipadas.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; resolvedor DAG multi-caso/multi-módulo con detección de ciclos. **Decisiones citadas.** D06. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L88.

**Preservable por referencia.** E2E añade tipos y alcance multirol a lo multicase/multimódulo. Rechazar ciclos antes de ejecutar.

### REQ-PLN-001.5

**Origen y obligación.** Original vía Etapa 3. Congelamiento inmutable de `ExecutionPlan` verificado por el runner en todo canal. [REQ-PLN-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L362) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L77).

**Dependencias, condiciones y alcance.** PLN 001.4, MEM 001.3. Discovery, reglas, permisos y casos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Alterar una revisión, huella o caducidad del snapshot y rechazarlo por ambos canales antes de producir efectos.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; congelamiento inmutable de `ExecutionPlan` en todo canal. **Decisiones citadas.** D03, D06. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L89.

**Preservable por referencia.** Congelar plan con dependencias y comprobar huella desde el runner en ambos canales.

### REQ-PLN-001.6

**Origen y obligación.** Original vía Etapa 3. Reevaluador de grafo de campaña tras fallo de prerrequisito o hallazgo crítico. [REQ-PLN-001.6](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L371) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L78).

**Dependencias, condiciones y alcance.** CAM 001.2, PLN 001.4. Discovery, reglas, permisos y casos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Al fallar un prerrequisito, bloquear sus dependientes y preservar progreso y revisión de ramas independientes.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; reevaluador de grafo ante fallo de prerrequisito. **Decisiones citadas.** D06. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L90.

**Preservable por referencia.** En fallo local, reevaluar dependientes y conservar ramas independientes con motivos.

## Casos y elegibilidad

### REQ-CAS-001.1

**Origen y obligación.** Original vía Etapa 3. Elegibilidad automática basada en política y fuente acreditada (0 aprobaciones humanas por caso en ruta ordinaria). [REQ-CAS-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L384) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L84).

**Dependencias, condiciones y alcance.** SEG 001.1, DOC 001.4. Reglas acreditadas y revisiones. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Ejecutar automáticamente casos ordinarios elegibles y registrar causal y alcance del bloqueo cuando falte fuente o permiso.

**Propuesta de Neon.** Elegibilidad automática por política y fuente acreditada (0 aprobaciones ordinarias). **Decisiones citadas.** D04. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L91.

**Preservable por referencia.** Cero aprobaciones ordinarias con autoridad y política acreditadas. Las excepciones siguen limitadas por D07/D20.

### REQ-CAS-001.2

**Origen y obligación.** Original vía Etapa 3. Generación multi-técnica (positivos, negativos, BVA, estados, RBAC, cálculos) enlazada a oráculos acreditados. [REQ-CAS-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L393) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L85).

**Dependencias, condiciones y alcance.** CAS 001.1, ORA 001.1–001.4. Reglas acreditadas y revisiones. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Generar casos positivos, negativos, límites, estados, RBAC y cálculo con oráculo acreditado para cada efecto.

**Propuesta de Neon.** Generación multi-técnica (positivos, negativos, BVA, estados, RBAC, cálculos) con oráculos. **Decisiones citadas.** D01, D06, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L92.

**Preservable por referencia.** Conservar la batería de positivos, negativos, límites, estados, permisos y cálculo. Un caso estructural no sustituye su oráculo.

### REQ-CAS-001.3

**Origen y obligación.** Original vía Etapa 3. Separación explícita `TestCaseIdentity` (funcional) vs `TestCaseRevision` (ejecutable + adaptador). [REQ-CAS-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L402) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L86).

**Dependencias, condiciones y alcance.** MEM 001.3. Reglas acreditadas y revisiones. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Cambiar un localizador crea revisión ejecutable conservando identidad funcional y expectativa.

**Propuesta de Neon.** Separación `TestCaseIdentity` (funcional) vs `TestCaseRevision` (ejecutable/adaptador). **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L93.

**Preservable por referencia.** Cambiar adaptador crea revisión. Mantener identidad funcional y expectativas previas.

### REQ-CAS-001.4

**Origen y obligación.** Original vía Etapa 3. Evaluador de aplicabilidad condicional sobre casos por `(env, tenant, role, config)`. [REQ-CAS-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L411) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L87).

**Dependencias, condiciones y alcance.** MEM 002.1, CAS 001.3. Reglas acreditadas y revisiones. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Sembrar variantes incompatibles y omitir de forma trazable el caso fuera de entorno, rol o revisión aplicable.

**Propuesta de Neon.** Evaluador de aplicabilidad condicional por `(env, tenant, role, config)`. **Decisiones citadas.** D05, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L94.

**Preservable por referencia.** Evaluar aplicabilidad contra alcance configurado y registrar exclusiones con justificación.

### REQ-CAS-001.5

**Origen y obligación.** Original vía Etapa 3. Deduplicación semántica/estructural y propagación automática de obsolescencia. [REQ-CAS-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L420) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L88).

**Dependencias, condiciones y alcance.** CAS 001.3, MEM 003.2. Reglas acreditadas y revisiones. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Deduplicar equivalentes y marcar obsolescencia de dependientes al retirar una regla sin borrar intentos.

**Propuesta de Neon.** Deduplicación semántica/estructural y propagación de obsolescencia. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L95.

**Preservable por referencia.** Distinguir deduplicación de desaparición. Conservar identidad, revisiones, dependencias y obsolescencia automática.

## Oráculos

### REQ-ORA-001.1

**Origen y obligación.** Original vía Etapa 3. Taxonomía única de 6 veredictos (`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`) en todo el sistema. [REQ-ORA-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L433) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L94).

**Dependencias, condiciones y alcance.** RUN 001.3, REP 001.1. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Publicar los seis estados para fixtures distinguibles y comprobar clasificación idéntica y mapeo CLI.

**Propuesta de Neon.** Taxonomía única de 6 veredictos (`PASS`, `FAIL`, `INDETERMINATE`, `BLOCKED`, `SKIPPED`, `ERROR`). **Decisiones citadas.** D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L96.

**Ajuste.** Conflicto: PASS_STRUCTURAL sería un séptimo veredicto. Mantener el conjunto cerrado y separar alcance, estados y cobertura. [AR-08](registro-maestro.md#ar-08).

### REQ-ORA-001.2

**Origen y obligación.** Original vía Etapa 3. Evaluador de oráculos independiente que rechace señales Nivel 0/1 como prueba de persistencia. [REQ-ORA-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L442) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L95).

**Dependencias, condiciones y alcance.** ORA 001.3, DOC 001.4. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Con éxito HTTP y rollback, el testigo acreditado fuerza FAIL. La falta de testigo suficiente obliga a abstenerse de PASS funcional.

**Propuesta de Neon.** Evaluador independiente que rechaza señales N0/N1 como prueba de persistencia. **Decisiones citadas.** D11, D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L97.

**Preservable por referencia.** N0/N1 tienen alcance estructural. Exigir independencia causal para persistencia y abstención ante testigo insuficiente. [AR-09](registro-maestro.md#ar-09).

### REQ-ORA-001.3

**Origen y obligación.** Original vía Etapa 3. Motor de testigos Nivel 1/2/3 (recarga en contexto limpio, consulta API/vista secundaria, conciliación). [REQ-ORA-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L451) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L96).

**Dependencias, condiciones y alcance.** SEG 001.2, ORA 001.7. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Contrastar recarga en contexto limpio, fuente secundaria y conciliación, registrando independencia, causalidad y dependencia compartida.

**Propuesta de Neon.** Motor de testigos N1/N2/N3 (contexto limpio, fuente secundaria, conciliación). **Decisiones citadas.** D11, D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L98.

**Preservable por referencia.** Acreditar frescura, identidad, correlación e independencia. No imponer acceso a la base del AUT ni acreditar por recarga solamente.

### REQ-ORA-001.4

**Origen y obligación.** Original vía Etapa 3. Evaluador tipado de reglas de negocio, precisión monetaria (decimal exacto), tolerancias y conciliaciones. [REQ-ORA-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L460) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L97).

**Dependencias, condiciones y alcance.** DOC 001.4, ORA 001.3. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Detectar error de un centavo y de conciliación con reglas, decimal exacto y tolerancia versionada.

**Propuesta de Neon.** Evaluador tipado con aritmética decimal exacta, tolerancias y conciliaciones. **Decisiones citadas.** D11, D12, D17. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L99.

**Preservable por referencia.** Validar reglas acreditadas y diferencias monetarias con datos, tolerancia y redondeo explícitos. Separar fórmula de regla contable. [AR-20](registro-maestro.md#ar-20).

### REQ-ORA-001.5

**Origen y obligación.** Original vía Etapa 3. Oráculo de no-mutación (snapshot de estado antes/después de intento denegado). [REQ-ORA-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L469) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L98).

**Dependencias, condiciones y alcance.** SEG 001.1, ORA 001.3. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Una operación denegada se contrasta con estado inicial y final. Una mutación oculta produce FAIL.

**Propuesta de Neon.** Oráculo de no-mutación antes/después de operación denegada. **Decisiones citadas.** D07, D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L100.

**Preservable por referencia.** Un rechazo HTTP no acredita ausencia de efecto. Comparar estado autorizado antes y después. [AR-53](registro-maestro.md#ar-53).

### REQ-ORA-001.6

**Origen y obligación.** Original vía Etapa 3. Oráculo de convergencia asíncrona con ventana temporal y condición de estado final. [REQ-ORA-001.6](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L478) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L99).

**Dependencias, condiciones y alcance.** ORA 001.3, CAM 001.3. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Probar convergencia, expiración y fallo de adquisición con ventana explícita y condiciones de estado verificables.

**Propuesta de Neon.** Oráculo de convergencia asíncrona con ventana temporal y estado final. **Decisiones citadas.** D12. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L101.

**Preservable por referencia.** Verificar ventana, convergencia y estado final, y conservar resultado incierto cuando el testigo no cubra el límite. [AR-09](registro-maestro.md#ar-09).

### REQ-ORA-001.7

**Origen y obligación.** Original vía Etapa 3. Metadato `witness_independence_level` obligatorio en cada evaluación (configurable según `DP-04`). [REQ-ORA-001.7](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L487) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L100).

**Dependencias, condiciones y alcance.** MEM 002.1, DOC 001.4. Criterio, fuentes, alcance y testigo. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Persistir nivel, fuente, alcance y dependencia de testigo en cada evaluación, incluida evidencia conflictiva o insuficiente.

**Propuesta de Neon.** Metadato `witness_independence_level` y procedencia obligatorios por evaluación. **Decisiones citadas.** D11, D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L102.

**Preservable por referencia.** Registrar nivel, procedencia y alcance efectivo en cada evaluación, incluso abstenciones.

## Runner y publicación

### REQ-RUN-001.1

**Origen y obligación.** Original vía Etapa 3. Contexto limpio por caso por defecto; compartición explícita y trazada solo en flujos encadenados. [REQ-RUN-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L500) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L106).

**Dependencias, condiciones y alcance.** SEG 001.2, SEG 002.2. Planes congelados y permisos. **Ampliaciones.** [REQ-OPT-001](#ampliación-req-opt-001), [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Probar independencia de cookies y storage entre casos. Solo continuidad autorizada conserva estado en un flujo con límites de identidad.

**Propuesta de Neon.** Absorbe `REQ-OPT-001`, `REQ-E2E-001`; contexto limpio por caso por defecto. **Decisiones citadas.** D06, D15, D16. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L103.

**Preservable por referencia.** Conservar contexto limpio por defecto y excepción explícita/trazada para flujo encadenado. OPT-001 limita reutilización por aislamiento.

### REQ-RUN-001.2

**Origen y obligación.** Original vía Etapa 3. Verificación de huella de snapshot integrada en el propio motor Runner. [REQ-RUN-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L509) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L107).

**Dependencias, condiciones y alcance.** PLN 001.5, SEG 001.1. Planes congelados y permisos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** El runner rechaza snapshot alterado, vencido o de otro alcance antes de abrir el navegador o invocar el destino.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; verificación de huella de snapshot en el propio Runner. **Decisiones citadas.** D06, D12. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L104.

**Preservable por referencia.** El propio runner acredita huella del plan y registra intento separado. E2E requiere evidencia por paso y reproducibilidad.

### REQ-RUN-001.3

**Origen y obligación.** Original vía Etapa 3. Estructura tripartita obligatoria: `technical_status`, `functional_verdict`, `cleanup_status`. **Precisión del catálogo.** Estructura tripartita obligatoria: `technical_status`, `functional_verdict`, `cleanup_status`. D12 añade disponibilidad e integridad de evidencia como estado independiente. [REQ-RUN-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L518) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L108).

**Dependencias, condiciones y alcance.** ORA 001.1, DAT 001.4. Planes congelados y permisos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Un éxito técnico con rollback y limpieza fallida conserva veredicto, estados técnico y de limpieza y estado de evidencia separados.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; estructura de 4 ejes (`technical_status`, `functional_verdict`, `cleanup_status`, `evidence_health`). **Decisiones citadas.** D06, D12. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L105.

**Ajuste.** D12 agrega eje independiente de evidencia. Conservar cuatro ejes, estados de degradación y salida coherente con limpieza y omisiones. [AR-08](registro-maestro.md#ar-08).

### REQ-RUN-001.4

**Origen y obligación.** Original vía Etapa 3. Política de reintento por idempotencia + protocolo obligatorio de reconciliación previa en mutaciones. [REQ-RUN-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L527) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L109).

**Dependencias, condiciones y alcance.** ORA 001.3, DAT 001.2. Planes congelados y permisos. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Cortar después de enviar la mutación y antes de recibir respuesta. Reconciliar antes del reintento y evitar duplicación.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; reintento por idempotencia + reconciliación previa en mutaciones. **Decisiones citadas.** D06, D12. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L106.

**Preservable por referencia.** Antes de repetir una mutación, reconciliar efecto y acreditar idempotencia. Demostrar corte tras efecto confirmado. [AR-43](registro-maestro.md#ar-43).

### REQ-RUN-001.5

**Origen y obligación.** Original vía Etapa 3. Cancelación activa (`AbortController`) cableada a revocación + pool acotado de workers paralelos aislados. [REQ-RUN-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L536) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L110).

**Dependencias, condiciones y alcance.** SEG 001.3, CAM 001.3. Planes congelados y permisos. **Ampliaciones.** [REQ-OPT-001](#ampliación-req-opt-001)

**Evidencia de aceptación candidata.** Revocar un permiso en vuelo, detener el trabajo afectado y respetar límites y conflictos de recursos sin detener trabajo independiente.

**Propuesta de Neon.** Absorbe `REQ-OPT-001`; cancelación `AbortController` + pool acotado de workers. **Decisiones citadas.** D07, D16. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L107.

**Preservable por referencia.** Conservar revocación, cancelación activa, aislamiento de workers, procesos residuales y límites adaptativos. [AR-29](registro-maestro.md#ar-29).

### REQ-RUN-001.6

**Origen y obligación.** Original vía Etapa 3. Unificar publicación atómica sobre el almacén único eliminando DDL duplicados. [REQ-RUN-001.6](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L545) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L111).

**Dependencias, condiciones y alcance.** MEM 003.6, REP 001.1. Planes congelados y permisos. **Ampliaciones.** [M2](#ampliación-m2), [M3](#ampliación-m3)

**Evidencia de aceptación candidata.** Cortar durante publicación y recuperación. Conservar cada intento confirmado una vez y rechazar media ajena o alterada.

**Propuesta de Neon.** Absorbe `M2`, `M3`; publicación atómica unificada eliminando DDL duplicados. **Decisiones citadas.** D18. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L108.

**Preservable por referencia.** Publicación recuperable y atómica del manifiesto. M2/M3 añaden fallback, medio auténtico, localizadores y custodia desde origen.

## Provisión y limpieza

### REQ-DAT-001.1

**Origen y obligación.** Original vía Etapa 3. Subsistema `TestDataManager` con sintetizadores, etiquetas de ejecución, caducidad y filtro anti-PII. [REQ-DAT-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L558) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L117).

**Dependencias, condiciones y alcance.** SEG 001.1, MEM 002.1. Política, datos sintéticos y testigos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Generar datos sintéticos etiquetados por intento con caducidad y verificar que excluyen PII no autorizada.

**Propuesta de Neon.** TestDataManager`: datos sintéticos etiquetados, caducidad y filtro anti-PII. **Decisiones citadas.** D06, D08, D09. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L109.

**Preservable por referencia.** Conservar etiqueta por ejecución, caducidad y filtro anti-PII. Acreditar creación sintética y destrucción autorizada.

### REQ-DAT-001.2

**Origen y obligación.** Original vía Etapa 3. Ejecutor de `DataPlan` con creación topológica y limpieza inversa idempotente. **Precisión del catálogo.** Ejecutor de `DataPlan` con creación topológica y limpieza inversa idempotente. Incorporar descripción y ejecución autorizada de operaciones mediante UTCP/OpenAPI por el mismo puerto. [REQ-DAT-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L567) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L118).

**Dependencias, condiciones y alcance.** DAT 001.1, RUN 001.4, INT 001.4. Política, datos sintéticos y testigos. **Ampliaciones.** [UTCP/OpenAPI](#ampliación-utcpopenapi)

**Evidencia de aceptación candidata.** Ejecutar un DAG y su limpieza inversa usando UI y conector autorizado según plan. Reconciliar efecto e idempotencia con procedencia.

**Propuesta de Neon.** Absorbe `UTCP/OpenAPI`; ejecutor de `DataPlan` con DAG topológico, APIs autorizadas y limpieza inversa. **Decisiones citadas.** D06, D08. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L110.

**Preservable por referencia.** UTCP/OpenAPI es capacidad de lanzamiento y de uso según caso. CRUD autorizado no sustituye el DAG, limpieza inversa ni reconciliación. [AR-17](registro-maestro.md#ar-17).

### REQ-DAT-001.3

**Origen y obligación.** Original vía Etapa 3. Motor de política por entorno que bloquee producción/no-autorizados (`SKIPPED_BY_POLICY`) y habilite mutaciones controladas en staging/fixtures autorizados. [REQ-DAT-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L576) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L119).

**Dependencias, condiciones y alcance.** SEG 001.1–001.3. Política, datos sintéticos y testigos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Bloquear toda escritura en producción y fuera de QA autorizado, incluso si el método parece de lectura. Dejar continuar lecturas acreditadas.

**Propuesta de Neon.** Política por entorno: producción solo lectura acreditada, mutaciones solo en QA autorizado. **Decisiones citadas.** D07. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L111.

**Preservable por referencia.** Conservar bloqueo de mutación en producción y autorización positiva de QA. Una lectura acreditada sigue permitida según D07/D09.

### REQ-DAT-001.4

**Origen y obligación.** Original vía Etapa 3. Verificador post-limpieza y estrategias configurables (`delete`, `compensate`, `confine_tenant`, según `DP-05`). [REQ-DAT-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L585) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L120).

**Dependencias, condiciones y alcance.** DAT 001.2, ORA 001.3. Política, datos sintéticos y testigos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Probar eliminación, compensación y confinamiento autorizados y publicar verificación posterior y limpieza pendiente.

**Propuesta de Neon.** Verificador post-limpieza y estrategias `delete`, `compensate`, `confine_tenant`. **Decisiones citadas.** D06, D07, D08. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L112.

**Preservable por referencia.** La limpieza se verifica. Estrategias por destino y autorización para operaciones irreversibles requieren ratificación.

## Campañas

### REQ-CAM-001.1

**Origen y obligación.** Original vía Etapa 3. Orquestador de campaña autónomo que encadene A→B→C tras autorización inicial. [REQ-CAM-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L598) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L126).

**Dependencias, condiciones y alcance.** CAS 001.1, PLN 001.1, RUN 001.6. Persistencia, planificación y ejecutor. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Desde lenguaje natural y autorización inicial recorrer Discovery, diseño, datos, ejecución, reporte, regresión y aprendizaje.

**Propuesta de Neon.** Orquestador autónomo A→B→C tras autorización inicial única. **Decisiones citadas.** D01, D04. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L113.

**Preservable por referencia.** Preservar autonomía de discovery, planificación, datos, ejecución, verificación y reporte hasta cierre negociado por política. [AR-05](registro-maestro.md#ar-05).

### REQ-CAM-001.2

**Origen y obligación.** Original vía Etapa 3. Motor de tareas con grafo de estados que aísle bloqueos locales sin detener ramas independientes. [REQ-CAM-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L607) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L127).

**Dependencias, condiciones y alcance.** MEM 002.3, PLN 001.4. Persistencia, planificación y ejecutor. **Ampliaciones.** [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Bloquear una rama por prerrequisito o permiso y comprobar que sus hermanas independientes continúan con bitácora.

**Propuesta de Neon.** Absorbe `REQ-E2E-001`; aislamiento de bloqueos locales sin detener ramas independientes. **Decisiones citadas.** D04, D06. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L114.

**Preservable por referencia.** Bloqueos locales detienen dependientes, preservando ramas independientes y transferencia tipada E2E.

### REQ-CAM-001.3

**Origen y obligación.** Original vía Etapa 3. Controlador central de presupuestos de campaña con cierre `COMPLETADA_PARCIAL`. [REQ-CAM-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L616) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L128).

**Dependencias, condiciones y alcance.** MEM 002.3, SEG 001.1. Persistencia, planificación y ejecutor. **Ampliaciones.** [REQ-OPT-001](#ampliación-req-opt-001), [REQ-E2E-001](#ampliación-req-e2e-001)

**Evidencia de aceptación candidata.** Al agotar un presupuesto declarar COMPLETADA_PARCIAL y persistir el punto reanudable con resultados y brechas.

**Propuesta de Neon.** Absorbe `REQ-OPT-001`, `REQ-E2E-001`; presupuestos globales con cierre `COMPLETADA_PARCIAL`. **Decisiones citadas.** D04, D16. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L115.

**Preservable por referencia.** Presupuesto global y COMPLETADA_PARCIAL conservan auditoría de faltantes. No equivalen a éxito funcional.

### REQ-CAM-001.4

**Origen y obligación.** Original vía Etapa 3. Runtime soberano de campaña desacoplado de la conexión del cliente MCP. [REQ-CAM-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L625) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L129).

**Dependencias, condiciones y alcance.** MEM 002.3, IA 001.4. Persistencia, planificación y ejecutor. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Terminar árbol del host y después el ejecutor. Preservar trabajo determinista, reclamar lease y evitar doble escritor.

**Propuesta de Neon.** Runtime soberano desacoplado de la conexión del cliente MCP. **Decisiones citadas.** D03, D04. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L116.

**Preservable por referencia.** Desacoplar vida de la campaña de Stdio y acreditar reanudación, leases y escritor único tras corte. [AR-42](registro-maestro.md#ar-42).

### REQ-CAM-001.5

**Origen y obligación.** Original vía Etapa 3. Modos de intención como política de prioridad sobre un estado de campaña continuo. [REQ-CAM-001.5](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L634) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L130).

**Dependencias, condiciones y alcance.** CAM 001.2, MEM 002.4. Persistencia, planificación y ejecutor. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Cambiar entre exploración, regresión e investigación de defecto conservando identidad, revisiones y estado de campaña.

**Propuesta de Neon.** Modos de intención como política de prioridad sobre estado continuo. **Decisiones citadas.** D04. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L117.

**Preservable por referencia.** Los modos cambian prioridades sobre un historial continuo. No reinician ni fragmentan la campaña.

## Reportes QAP, evidencia y defectos

### REQ-REP-001.1

**Origen y obligación.** Original vía Etapa 3. Servicio único de evidencias e integridad consumido por MCP y CLI. [REQ-REP-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L647) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L136).

**Dependencias, condiciones y alcance.** RUN 001.6, SEG 002.1. Intentos acreditados, custodia y manifiestos. **Ampliaciones.** [M1](#ampliación-m1), [M2](#ampliación-m2), [M3](#ampliación-m3), [M4](#ampliación-m4), [M5](#ampliación-m5)

**Evidencia de aceptación candidata.** Ambos canales publican manifiesto verificado, disponibilidad separada y evidencia saneada correlacionada por intento, paso y rol.

**Propuesta de Neon.** Absorbe `M1`–`M5`; servicio único de evidencias e integridad para MCP y CLI. **Decisiones citadas.** D12, D18–D20. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L118.

**Preservable por referencia.** M1–M5 mantienen paridad y custodia, reproducción portable, acceso autorizado e integridad de evidencia. [AR-50](registro-maestro.md#ar-50).

### REQ-REP-001.2

**Origen y obligación.** Original vía Etapa 3. Repositorio único de reportes, comparativas entre ejecuciones e historial unificado. [REQ-REP-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L656) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L137).

**Dependencias, condiciones y alcance.** REP 001.1, MEM 003.5. Intentos acreditados, custodia y manifiestos. **Ampliaciones.** [M1](#ampliación-m1), [M2](#ampliación-m2), [M4](#ampliación-m4), [M5](#ampliación-m5)

**Evidencia de aceptación candidata.** Comparar dos ejecuciones tras purgar media y abrir export offline con enlaces, estados y hashes preservados.

**Propuesta de Neon.** Absorbe `M1`, `M2`, `M4`, `M5`; historial unificado, comparativas y export portable. **Decisiones citadas.** D04, D18–D20. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L119.

**Preservable por referencia.** M1/M2/M4/M5 conservan comparativas, fuentes locales, teclado, export trasladado y trato de evidencia faltante. [AR-50](registro-maestro.md#ar-50).

### REQ-REP-001.3

**Origen y obligación.** Original vía Etapa 3. Subsistema `DefectManager` con taxonomía D-014 (`indeterminate`), deduplicación por firma y paquete reproducible. [REQ-REP-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L665) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L138).

**Dependencias, condiciones y alcance.** REP 001.1, ORA 001.1. Intentos acreditados, custodia y manifiestos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Deduplicar una firma repetida sin unir defectos de alcances distintos y producir paquete de reproducción acreditado.

**Propuesta de Neon.** DefectManager` con taxonomía `indeterminate`, deduplicación por firma y paquete reproducible. **Decisiones citadas.** D05, D19. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L120.

**Preservable por referencia.** Conservar paquete reproducible y separación entre defecto, incertidumbre y resultado. Firmas deduplican sin borrar intentos.

### REQ-REP-001.4

**Origen y obligación.** Original vía Etapa 3. Máquina de estados de defecto integrada con modo `INVESTIGAR_BUG` y comparativa de intentos. [REQ-REP-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L674) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L139).

**Dependencias, condiciones y alcance.** REP 001.3, REG 001.1. Intentos acreditados, custodia y manifiestos. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Reproducir, no reproducir, bloquear y verificar corrección en intentos trazables conservando el fallo original.

**Propuesta de Neon.** Máquina de estados de defecto (`REPRODUCIDO`/`NO_REPRODUCIDO`/`BLOQUEADO`/`retest`). **Decisiones citadas.** D05, D19. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L121.

**Preservable por referencia.** Conservar transición y comparación de intentos para INVESTIGAR_BUG/retest con bloqueo visible.

## Regresión

### REQ-REG-001.1

**Origen y obligación.** Original vía Etapa 3. Motor de detección de drift multi-señal + selector de suite de regresión por impacto y riesgo. [REQ-REG-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L687) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L145).

**Dependencias, condiciones y alcance.** MEM 003.2, PLN 001.3. Historial, versiones y grafo de conocimiento. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Sembrar cambios DOM, API y configuración. Seleccionar casos afectados según dependencia y riesgo con razones.

**Propuesta de Neon.** Detección de drift multi-señal (Git/DOM/API/config) + selección por impacto y riesgo. **Decisiones citadas.** D04, D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L122.

**Preservable por referencia.** Conservar señales Git, DOM, API y configuración. Seleccionar impacto/riesgo con evidencia y evitar inferencia innecesaria.

### REQ-REG-001.2

**Origen y obligación.** Original vía Etapa 3. Analizador estadístico de oscilación `PASS`/`FAIL` sobre intentos del mismo snapshot/versión. [REQ-REG-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L696) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L146).

**Dependencias, condiciones y alcance.** MEM 003.3, REP 001.2. Historial, versiones y grafo de conocimiento. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Alternar PASS y FAIL sobre el mismo snapshot y versión y conservar series y criterio de inestabilidad.

**Propuesta de Neon.** Analizador estadístico de `flakiness` sobre mismo snapshot y versión. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L123.

**Preservable por referencia.** Comparar repeticiones bajo mismo snapshot y versión. Evitar mezclar drift con flakiness.

### REQ-REG-001.3

**Origen y obligación.** Original vía Etapa 3. Flujo de reparación acotada que crea `TestCaseRevision N+1` manteniendo inmutable la expectativa y el `FAIL` original. [REQ-REG-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L705) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L147).

**Dependencias, condiciones y alcance.** CAS 001.3, REG 001.1. Historial, versiones y grafo de conocimiento. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Corregir un localizador crea revisión posterior con misma expectativa y preserva el intento original.

**Propuesta de Neon.** Reparación acotada de adaptador `vN+1` preservando expectativa y `FAIL` original. **Decisiones citadas.** D05. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L124.

**Preservable por referencia.** Reparar adaptador creando revisión nueva. La expectativa y el FAIL original permanecen inmutables. [AR-46](registro-maestro.md#ar-46).

## Política, secretos y sesiones

### REQ-SEG-001.1

**Origen y obligación.** Original vía Etapa 3. Motor único de políticas deny-by-default aplicado a MCP, CLI y servidores auxiliares. **Precisión del catálogo.** Motor único de políticas deny-by-default aplicado a MCP, CLI y servidores auxiliares. D07 permite lecturas de producción solo con acreditación y extiende denegación por defecto a visor y conectores. [REQ-SEG-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L718) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L153).

**Dependencias, condiciones y alcance.** MEM 002.1. Autoridad efectiva y alcance. **Ampliaciones.** [M4](#ampliación-m4)

**Evidencia de aceptación candidata.** Aplicar idéntica denegación por defecto en MCP, CLI y auxiliares. Un permiso de lectura no habilita efectos.

**Propuesta de Neon.** Motor único deny-by-default en MCP, CLI, visor y conectores (absorbe `M4`). **Decisiones citadas.** D07, D09, D18, D20. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L125.

**Preservable por referencia.** Mantener política única hasta el límite del destino, incluidos visor y conectores. M4 conserva autorización por evidencia y revocación. [AR-24](registro-maestro.md#ar-24).

### REQ-SEG-001.2

**Origen y obligación.** Original vía Etapa 3. Invariante de alcance en el motor central imposible de alterar desde prompts, DOM o redirecciones. [REQ-SEG-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L727) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L154).

**Dependencias, condiciones y alcance.** MEM 002.1, SEG 001.1. Autoridad efectiva y alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Al cambiar origen, identidad o tenant durante una operación, revalidar y bloquear la transición fuera de alcance.

**Propuesta de Neon.** Invariante de alcance inalterable desde prompts, DOM o redirecciones. **Decisiones citadas.** D02, D07, D09, D20. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L126.

**Preservable por referencia.** El contenido no confiable no amplía alcance. Acreditar autoridad efectiva del destino y rechazo ante discrepancia.

### REQ-SEG-001.3

**Origen y obligación.** Original vía Etapa 3. Bus de eventos de revocación conectado a `AbortController` de Discovery y Runner activos. [REQ-SEG-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L736) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L155).

**Dependencias, condiciones y alcance.** SEG 001.1, RUN 001.5. Autoridad efectiva y alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Revocar desde otro proceso y probar cancelación y persistencia de la revocación al reconectar.

**Propuesta de Neon.** Bus durable de revocación conectado a `AbortController` en vuelo. **Decisiones citadas.** D07, D18, D20. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L127.

**Preservable por referencia.** Revocación durable al Discovery y Runner en vuelo. Probar cierre y preservación del historial sin exposición.

### REQ-SEG-002.1

**Origen y obligación.** Original vía Etapa 3. Canal de captura de secretos multiplataforma 100 % fuera del LLM/chat; eliminación de bypass (sujeto a `DP-03`). **Precisión del catálogo.** Canal de captura de secretos multiplataforma 100 % fuera del LLM/chat; eliminación de bypass (sujeto a `DP-03`). D20 resuelve la prohibición de credenciales en MCP, chat y prompts. El mecanismo fuera de banda sigue abierto. [REQ-SEG-002.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L745) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L156).

**Dependencias, condiciones y alcance.** MEM 002.5, INT 001.2. Autoridad efectiva y alcance. **Ampliaciones.** [M3](#ampliación-m3)

**Evidencia de aceptación candidata.** Dar de alta una referencia opaca en las tres plataformas y CI sin TTY. Verificar ausencia de canarios en canales y artefactos.

**Propuesta de Neon.** Absorbe `M3`; captura de secretos multiplataforma 100 % fuera de MCP/chat/prompts. **Decisiones citadas.** D18, D20. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L128.

**Preservable por referencia.** Prohibición igual en todos los hosts y CI. M3 no sustituye custodia amplia de secretos, sesiones y trazas. [AR-07](registro-maestro.md#ar-07).

### REQ-SEG-002.2

**Origen y obligación.** Original vía Etapa 3. Prohibición uniforme de degradación a anónimo cuando el alcance requiere sesión autenticada. [REQ-SEG-002.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L754) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L157).

**Dependencias, condiciones y alcance.** SEG 001.2–001.3, SEG 002.1. Autoridad efectiva y alcance. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Perder la sesión requerida durante Discovery o ejecución y bloquear el intento de continuar bajo otra identidad.

**Propuesta de Neon.** Prohibición uniforme de degradación a anónimo ante pérdida de sesión requerida. **Decisiones citadas.** D20. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L129.

**Preservable por referencia.** El fallback anónimo es inadmisible si el alcance requiere autenticación, también con resolución implícita.

## Interfaces y extensibilidad

### REQ-INT-001.1

**Origen y obligación.** Original vía Etapa 3. Núcleo de aplicación único (`@qap/core`) con MCP, CLI y CI como adaptadores delgados. [REQ-INT-001.1](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L767) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L163).

**Dependencias, condiciones y alcance.** SEG 001.1, IA 001.5. Núcleo, contratos y empaquetado. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Desde el mismo snapshot, comparar permisos, memoria, ejecución, veredictos, reporte y códigos de salida de ambos adaptadores.

**Propuesta de Neon.** Núcleo único `@qap/core` con paridad estricta entre MCP, CLI y CI. **Decisiones citadas.** D13, D21. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L130.

**Preservable por referencia.** Paridad de política, estados, efectos y salidas para el mismo snapshot, incluida CI sin ruta de escritura paralela. [AR-52](registro-maestro.md#ar-52).

### REQ-INT-001.2

**Origen y obligación.** Original vía Etapa 3. Empaquetado limpio multiplataforma (`npx`-first), cero dependencias exclusivas de `win32` en ruta ordinaria y verificación estricta `tsc` en CI. [REQ-INT-001.2](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L776) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L164).

**Dependencias, condiciones y alcance.** SEG 002.1, RUN 001.1. Núcleo, contratos y empaquetado. **Ampliaciones.** [REQ-ONB-001](#ampliación-req-onb-001), [M5](#ampliación-m5)

**Evidencia de aceptación candidata.** Instalar en Windows, macOS y Linux desde paquete limpio y cumplir diagnóstico, navegador bajo demanda y compuerta de tipos.

**Propuesta de Neon.** Absorbe `REQ-ONB-001`, `M5`; empaquetado `npx`-first multiplataforma y `tsc` estricto. **Decisiones citadas.** D13, D14, D21. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L131.

**Preservable por referencia.** ONB-001/M5 conservan instalación limpia, doctor/setup, tres SO, navegador bajo demanda, fidelidad y typecheck estricto. [AR-33](registro-maestro.md#ar-33).

### REQ-INT-001.3

**Origen y obligación.** Original vía Etapa 3. Abstracción de almacenamiento/colas que permita despliegue self-hosted sin cambiar la lógica del núcleo. [REQ-INT-001.3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L785) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L165).

**Dependencias, condiciones y alcance.** MEM 003.6, CAM 001.4. Núcleo, contratos y empaquetado. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Cambiar el adaptador en pruebas de contrato sin modificar lógica de dominio. La modalidad compartida completa pertenece a fase posterior.

**Propuesta de Neon.** Abstracción de almacenamiento/colas lista para self-hosted concurrente. **Decisiones citadas.** D02. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L132.

**Preservable por referencia.** Demostrar contrato que permite self-hosted futuro sin cambiar el núcleo. No convertir despliegue futuro en dependencia del lanzamiento local.

### REQ-INT-001.4

**Origen y obligación.** Original vía Etapa 3. Sistema formal de registro de conectores/plugins opt-in (interfaz, documentos, bóveda, extensiones de dominio). **Precisión del catálogo.** Sistema formal de registro de conectores/plugins opt-in (interfaz, documentos, bóveda, extensiones de dominio). Incluir el contrato común para conectores UTCP/OpenAPI, además de adaptadores documentales y de bóveda. [REQ-INT-001.4](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L794) · [Etapa 3](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/gemini-neon-etapa-3.md#L166).

**Dependencias, condiciones y alcance.** SEG 001.1, DAT 001.2, DOC 001.1. Núcleo, contratos y empaquetado. **Ampliaciones.** [UTCP/OpenAPI](#ampliación-utcpopenapi)

**Evidencia de aceptación candidata.** Registrar y retirar conectores versionados sin doble autoridad. Probar OpenAPI/UTCP autorizados y rechazo de conectores incompatibles.

**Propuesta de Neon.** Absorbe `UTCP/OpenAPI`; registro formal de conectores/plugins opt-in versionados. **Decisiones citadas.** D08, D10. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L133.

**Preservable por referencia.** Preservar opt-in por conector, versionado, documentos/bóveda y puerto común UTCP/OpenAPI con gobernanza.

## Cinco requisitos nuevos en la línea base

### REQ-XINST-001

**Origen y obligación.** Añadido de la línea base. Consultar otra instancia autorizada solo con identidad distinta y operaciones de lectura acreditadas en destino. Preservar procedencia, tenant, revisión y finalidad. Excluir sesiones, secretos y transferencias masivas de información sensible. D07, D09, D20. Lanzamiento. Destinos concretos por autorización. [REQ-XINST-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L805).

**Dependencias, condiciones y alcance.** SEG 001.1–001.3, MEM 002.1, DAT 001.2. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Fixture con identidades separadas y testigo de cero cambios. Las operaciones sin garantía, incluidas las que aparentan lectura, se bloquean. Verificar redirección, alcance y procedencia.

**Propuesta de Neon.** Consulta cross-instancia estrictamente read-only acreditada en destino, sin transferir credenciales. **Decisiones citadas.** D07, D09, D20. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L134.

**Preservable por referencia.** Identidad distinta, lectura impuesta por destino y procedencia. Bloquear si no se acredita inmutabilidad o usar exportación saneada autorizada. [AR-18](registro-maestro.md#ar-18).

### REQ-QA-001

**Origen y obligación.** Añadido de la línea base. Probar internacionalización mediante idioma, locale, zona horaria, moneda y variante congelados. HOST interpreta instrucciones y conclusiones y propone cambios. El runtime persiste preferencias y repite verificaciones de claves, textos, truncamiento, fechas y montos sin inferencia. Mantener códigos de resultado independientes del idioma. D03, D10, D11, D12, D17, D21. Lanzamiento. Corpus de locales por definir y extensible. [REQ-QA-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L815).

**Dependencias, condiciones y alcance.** DOC 001.1, IA 001.1–001.2, ORA 001.4, PLN 001.5. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Cambiar idioma en dos locales del corpus y detectar traducción ausente y truncamiento con oráculo. Distinguir representaciones equivalentes de divergencias de valor. Repetir el snapshot sin inferencia.

**Propuesta de Neon.** Pruebas i18n: locale, zona horaria, moneda, truncamiento, claves faltantes y replay sin inferencia. **Decisiones citadas.** D03, D11, D17, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L135.

**Preservable por referencia.** Congelar idioma, locale, zona, moneda y variante. También preservar localización de QAP y códigos invariantes. [AR-45](registro-maestro.md#ar-45).

### REQ-QA-002

**Origen y obligación.** Añadido de la línea base. Verificar el contrato de una API autorizada por observación de tráfico y llamada directa. Fijar versión, esquemas de solicitud y respuesta, código y tipo de contenido. Separar conformidad del contrato y verificación de efectos. D07, D08, D12, D21. Capacidad de lanzamiento. Uso por caso opcional y autorizado. [REQ-QA-002](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L825).

**Dependencias, condiciones y alcance.** DAT 001.2, INT 001.4, ORA 001.2–001.3. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Comparar control sano y respuesta incompatible. Rastrear operación y revisión del esquema y exigir testigo acreditado para efectos.

**Propuesta de Neon.** Validación de contrato API (tráfico observado y llamada directa) separada de persistencia. **Decisiones citadas.** D01, D08, D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L136.

**Preservable por referencia.** Probar observación y llamada directa autorizada, con versión, esquema, códigos y contenido. Distinguir conformidad de efectos. [AR-48](registro-maestro.md#ar-48).

### REQ-QA-003

**Origen y obligación.** Añadido de la línea base. Comprobar accesibilidad en estados críticos con motor y reglas versionados. Registrar huella, estado, cobertura, exclusiones y comprobaciones manuales pendientes. D13, D21. Línea base. Cobertura y prioridad de lanzamiento pendientes de ratificación. [REQ-QA-003](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L835).

**Dependencias, condiciones y alcance.** CAS 001.2, REP 001.1–001.2, RUN 001.1. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Detectar un defecto sembrado con huella repetible y consignar comprobaciones de teclado y manuales fuera de la cobertura automatizada. Axe es candidato.

**Propuesta de Neon.** Auditoría de accesibilidad automatizada versionada (axe) + registro de chequeos manuales pendientes. **Decisiones citadas.** D21. **Clase Neon / Antigravity.** RNF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L137.

**Ajuste.** Se trata de capacidad RF. DE-05 ratifica exigencia por campaña o compuerta, conservando estados críticos y chequeos manuales. [AR-35](registro-maestro.md#ar-35).

### REQ-AGT-001

**Origen y obligación.** Añadido de la línea base. Adoptar QAP con instalación idempotente y un registro MCP por host, indicaciones acotadas y opción CLI. Orientar la primera acción QA hacia QAP y reservar la acreditación al runner canónico. Hooks informativos opcionales si se validan. D04, D13, D14, D21. Hosts representativos de lanzamiento. Umbral de enrutamiento pendiente. [REQ-AGT-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L845).

**Dependencias, condiciones y alcance.** IA 001.1, IA 001.5, MEM 002.4, INT 001.1–001.2. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** En sesiones nuevas de Antigravity, Codex, Claude Code, Gemini CLI y otros clientes representativos, medir enrutamiento, desvíos y tokens. Las suites unitarias legítimas siguen ejecutables.

**Propuesta de Neon.** Adopción por agentes (registro MCP único, Skill breve, hooks informativos opt-in sin bloqueos globales). **Decisiones citadas.** D13, D14, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L138.

**Preservable por referencia.** Medir primera acción QA, instalación idempotente, cuatro hosts y CLI con hooks informativos opcionales y sin bloqueo global. [AR-15](registro-maestro.md#ar-15).

## Promociones y políticas propuestas

### REQ-AUTREP-001

**Origen y obligación.** ID propuesto. Validación funcional de reportes emitidos por el AUT D11, D12, D21. Requisito expreso de lanzamiento. ID candidato. [CAND-REP-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L877).

**Dependencias, condiciones y alcance.** DOC 001.1–001.4, ORA 001.2–001.7, RUN 001.6. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** En módulos de reportes configurar fechas, filtros y agrupación, descargar PDF y Excel y comparar filas, columnas, hojas y tablas multipágina con fuentes autorizadas. Detectar duplicados, faltantes, filtros ignorados, cálculos y redondeo. Distinguir fórmula y valor cacheado, abstenerse ante extracción o fuente insuficientes y localizar cada diferencia. Validar tanto registros como totales.

**Propuesta de Neon.** Validación funcional E2E de reportes PDF/Excel generados por el AUT (registro, fórmula/caché, totales). **Decisiones citadas.** D11, D12, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L139.

**Ajuste.** D11 exige conciliación por registros y totales. Separar estados fórmula/caché y fuente de regla contable con tolerancia y abstención. [AR-20](registro-maestro.md#ar-20).

### REQ-RUN-002.1

**Origen y obligación.** ID propuesto. Preferencias de ejecución y fidelidad del AUT D14, D15, D16, D21. Requisito expreso de lanzamiento. ID candidato. [CAND-RUN-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L887).

**Dependencias, condiciones y alcance.** DIS 001.3–001.4, RUN 001.1, INT 001.2, REQ-ONB-001. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Guardar y cambiar desde lenguaje natural preferencias de modo visible/segundo plano, navegador, grabación autorizada y consumo. Confrontar criterios funcionales y recursos permitidos CSS, JS, imágenes y fuentes en ambas modalidades y registrar degradación e hidratación SPA.

**Propuesta de Neon.** Preferencias en lenguaje natural persistidas por proyecto + fidelidad visual/recursos del AUT. **Decisiones citadas.** D14, D15, D16, D21. **Clase Neon / Antigravity.** RF / RF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L140.

**Ajuste.** Separar criterio 1a de preferencias persistentes y criterio 1b de fidelidad obligatoria con degradación explícita. Mantener un ID propuesto. [AR-16](registro-maestro.md#ar-16).

### REQ-SEG-002.3

**Origen y obligación.** ID propuesto. Autorización y custodia del ciclo de evidencia privada D18, D19, D20. Política de producto expresa. ID candidato. Activación condicionada. [CAND-SEG-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L897).

**Dependencias, condiciones y alcance.** SEG 001.1–001.3, SEG 002.1, REP 001.1, RUN 001.6, M2–M5. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Separar autorización de capturar, acceder, conservar y exportar. Probar vigencia de captura ≤30 días, renovación y revocación, custodia desde la primera escritura, catálogo/visor confinado y exportación sin media privada por defecto. Perder garantías en login/MFA/SSO o superficie sensible exige supresión. Verificar eliminación lógica y riesgo residual.

**Propuesta de Neon.** Custodia técnica de evidencia privada: cifrado desde primera escritura, temporales, catálogo y supresión. **Decisiones citadas.** D18, D19, D20. **Clase Neon / Antigravity.** RNF / RNF. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L141.

**Ajuste.** Control técnico con cifrado desde primer byte y supresión si falta garantía. Las ACL por sí solas no bastan. Distinguir captura, persistencia y reproducción. [AR-27](registro-maestro.md#ar-27).

### POL-CAP-001

**Origen y obligación.** ID propuesto. D18/D20. Autorización renovable y revocable hasta 30 días. `VERIFIED_STRICT`, `PRIVATE_AUTHORIZED`, `MANDATORY_SUPPRESSION` con permisos distintos para capturar, acceder, conservar y exportar. [Captura privada controlada](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L911).

**Dependencias, condiciones y alcance.** CAND-SEG-001, M2–M5, AS-01/03/04. CAND-SEG-001 compartido en procedencia con el control técnico. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Probar supresión cuando falle una garantía, revocación en vuelo, custodia desde origen, trazabilidad y exclusión de privada de exportación predeterminada.

**Propuesta de Neon.** Régimen de captura privada controlada: 3 modos, 4 permisos separados, vigencia ≤30 días, riesgo residual. **Decisiones citadas.** D18, D20. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L142.

**Ajuste.** D18 conserva tres modos, cuatro autorizaciones y vigencia de captura hasta 30 días. La conservación tiene vigencia propia y copia exportada tiene límite de revocación. [AR-32](registro-maestro.md#ar-32).

### POL-RET-001

**Origen y obligación.** ID propuesto. D19. Resumen permanente hasta eliminación expresa, detalle 90 días, exportación manual, autoarchivo opcional, Knowledge vigente y casos activos sin caducidad. Propuesta técnica pendiente: multimedia de éxitos hasta 24 h, trazas 72 h, fallos al menos 14 días con las excepciones de D19. Defectos abiertos protegidos con cuotas. Poda cada 24 h mientras activo y al iniciar. [Historial y retención](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L912).

**Dependencias, condiciones y alcance.** REQ-MEM-003.5, REQ-REP-001.1–001.4, M2, CAND-SEG-001. **Ampliaciones.** Sin ampliación de las once inventariadas en esta fila.

**Evidencia de aceptación candidata.** Simular vencimiento, defecto abierto, corrección acreditada y publicación pendiente. Comprobar protección y poda, hashes y manifiesto preservados, mismo veredicto, informe sin `trace.zip` y exportaciones HTML, CSV, JSON/JSONL y manifiesto verificable.

**Propuesta de Neon.** Historial permanente, detalle 90 días, knowledge sin caducidad, poda auditable y TTL operativos ratificables. **Decisiones citadas.** D19. **Clase Neon / Antigravity.** POL / POL. [Neon §2.3](auditoria-neon.md#23-clasificación-individual-de-los-87-ids-base-reconstrucción-analítica-60--20--7--5-elementos-promovidos), L143.

**Ajuste.** D19 distingue historia, detalle y conocimiento de TTL y cuotas pendientes. Revocación privada prevalece y poda no altera veredicto. [AR-25](registro-maestro.md#ar-25).

## Once ampliaciones

### Ampliación REQ-AGT-002

**Mapeo confirmado.** [REQ-MEM-002.4](#req-mem-0024) · [REQ-IA-001.1](#req-ia-0011). **Acta.** D03, D05, D13. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L861).

**Contenido a conservar.** Resumen de contexto limitado a la campaña, cobertura, permisos y próxima acción. Consultar bajo alcance resuelto y devolver las omisiones.

**Aceptación candidata.** Reanudar desde chat y host nuevos en una consulta autorizada y medir tokens por tokenizer. Los valores de 150/200 tokens siguen como hipótesis. **Trazabilidad.** E3, EXP-01.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación REQ-ONB-001

**Mapeo confirmado.** [REQ-INT-001.2](#req-int-0012). **Acta.** D13, D14, D20. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L862).

**Contenido a conservar.** Diagnóstico y aprovisionamiento idempotente sin dependencias del proyecto probado, caché de navegadores, proxy y CA. Dar diagnóstico accionable cuando falten permisos.

**Aceptación candidata.** Instalación limpia en los tres sistemas, navegador bajo demanda, loopback con PNG y WebM donde proceda y cierre de procesos. Medir soporte efectivo por plataforma. **Trazabilidad.** E1/E6/E7, EXP-04.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación REQ-OPT-001

**Mapeo confirmado.** [REQ-RUN-001.1](#req-run-0011) · [REQ-RUN-001.5](#req-run-0015) · [REQ-CAM-001.3](#req-cam-0013). **Acta.** D16, D21. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L863).

**Contenido a conservar.** Control de CPU, RAM, presión de memoria, disco y presupuesto. Concurrencia limitada por dependencias, conflictos de datos, sesiones, roles y permisos. Reutilización bajo aislamiento, reciclaje, cancelación y limpieza.

**Aceptación candidata.** Medir en tres sistemas concurrencia 1/2/4, aislamiento, presupuestos y procesos residuales tras fallo. Publicar hardware mínimo/recomendado por modalidad con medición reproducible. **Trazabilidad.** E3/E5/E7/E8, EXP-03.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación REQ-OPT-002

**Mapeo confirmado.** [REQ-MEM-003.5](#req-mem-0035) · [REQ-DIS-001.3](#req-dis-0013) · [REQ-MEM-002.4](#req-mem-0024). **Acta.** D05, D16, D19. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L864).

**Contenido a conservar.** Compactar contexto y snapshots preservando estado, procedencia y omisiones. Poda común con simulación real y protección de evidencia activa.

**Aceptación candidata.** Comparar bytes y cobertura antes y después, medir tokens y verificar que simulación no escribe ni retiene handles. **Trazabilidad.** E2/E4, EXP-02/03.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación REQ-E2E-001

**Mapeo confirmado.** [REQ-PLN-001.1](#req-pln-0011) · [REQ-PLN-001.4](#req-pln-0014) · [REQ-PLN-001.5](#req-pln-0015) · [REQ-PLN-001.6](#req-pln-0016) · [REQ-RUN-001.1](#req-run-0011) · [REQ-RUN-001.2](#req-run-0012) · [REQ-RUN-001.3](#req-run-0013) · [REQ-RUN-001.4](#req-run-0014) · [REQ-CAM-001.2](#req-cam-0012) · [REQ-CAM-001.3](#req-cam-0013). **Acta.** D04, D06–D08, D12, D21. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L865).

**Contenido a conservar.** DAG multirol y multimódulo con entradas/salidas tipadas, verificaciones, datos, evidencia por paso y recuperación. Los efectos confirmados del AUT se reconcilian y, cuando proceda, se compensan.

**Aceptación candidata.** Tres módulos y dos roles en un flujo. Inyectar fallo tras un efecto confirmado y demostrar continuidad y ausencia de duplicación. Replay congelado sin inferencia por paso. **Trazabilidad.** E3/E4/E5/E8, EXP-05.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación UTCP/OpenAPI

**Mapeo confirmado.** [REQ-DAT-001.2](#req-dat-0012) · [REQ-INT-001.4](#req-int-0014). **Acta.** D07–D09, D12. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L866).

**Contenido a conservar.** Manuales y contratos versionados sobre un puerto común, selección de destino autorizado, validación de esquemas y referencias opacas. Preparación con reconciliación, limpieza e idempotencia donde exista soporte.

**Aceptación candidata.** Preparar cliente, contrato y solicitud con ambas descripciones y verificar efectos y pérdida de respuesta. Las referencias de solo lectura quedan inmutables. **Trazabilidad.** E1/E4/E5, EXP-05.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación M1

**Mapeo confirmado.** [REQ-REP-001.1](#req-rep-0011) · [REQ-REP-001.2](#req-rep-0012). **Acta.** D12, D18–D21. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L867).

**Contenido a conservar.** DTO/manifiesto común. CSS, iconos y fuentes locales, vistas responsivas y navegación accesible por caso, paso y defecto.

**Aceptación candidata.** Verificar visor HTTP, HTML MCP/CLI y de flujo y resumen Markdown con estados accesibles y los mismos IDs. **Trazabilidad.** E6/E7.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación M2

**Mapeo confirmado.** [REQ-REP-001.1](#req-rep-0011) · [REQ-REP-001.2](#req-rep-0012) · [REQ-RUN-001.6](#req-run-0016). **Acta.** D18–D20. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L868).

**Contenido a conservar.** Export HTML relativo y portable. PNG nítido de viewport, elemento o página completa, dimensiones, escala, ampliación, fallback y estados de evidencia.

**Aceptación candidata.** Mover la exportación a una carpeta con espacios y acentos y abrir por file:// sin red ni servidor, con anclas, PNG y WebM autorizados. **Trazabilidad.** E6.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación M3

**Mapeo confirmado.** [REQ-RUN-001.6](#req-run-0016) · [REQ-REP-001.1](#req-rep-0011) · [REQ-SEG-002.1](#req-seg-0021). **Acta.** D15, D18, D20. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L869).

**Contenido a conservar.** WebM auténtico, geometría/códec/duración/tamaño/hash y offsets por paso, origen y página. Guarda preventiva, supresión y descarte lógico conforme a política.

**Aceptación candidata.** Decodificar desde primer cuadro con canarios sintéticos en transiciones sensibles y verificar revocación, custodia de temporales y descarte tras reinicio. **Trazabilidad.** E6, EXP-06, AS-04.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación M4

**Mapeo confirmado.** [REQ-REP-001.1](#req-rep-0011) · [REQ-REP-001.2](#req-rep-0012) · [REQ-SEG-001.1](#req-seg-0011). **Acta.** D18–D20. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L870).

**Contenido a conservar.** Reproducción con catálogo autorizado, rutas confinadas, MIME y rangos HTTP. HTML con controles nativos, seek por paso, pantalla completa y diagnóstico.

**Aceptación candidata.** Probar GET/HEAD, 206/416, ancho de rango, revocación, reinicio y export trasladado con los navegadores acreditados. **Trazabilidad.** E6/E7, AS-01/04.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

### Ampliación M5

**Mapeo confirmado.** [REQ-REP-001.1](#req-rep-0011) · [REQ-REP-001.2](#req-rep-0012) · [REQ-INT-001.2](#req-int-0012). **Acta.** D14, D18, D20–D21. [Ampliación de origen](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L871).

**Contenido a conservar.** Validar en navegador real paquete instalado y export trasladado con baselines visuales, teclado y canarios.

**Aceptación candidata.** Fijar viewport, fuentes y tolerancias. Medir reproducción, salto, fullscreen, ausencia de recursos externos y tratamiento de evidencia faltante. **Trazabilidad.** E6/E8, EXP-04/06.

**Efecto de las propuestas.** Neon mantiene el mapeo en §2.3 y Antigravity lo corrobora en §2.1. La aceptación completa se conserva por referencia y se evalúa con las dependencias indicadas.

## Tres candidatos y dos políticas de origen

- [CAND-REP-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L877) → [REQ-AUTREP-001](#req-autrep-001). Un requisito funcional para reportes emitidos por el AUT. Mantener la comparación por registro, cálculo y total separada de la ingesta y el informe de QAP.

- [CAND-RUN-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L887) → [REQ-RUN-002.1](#req-run-0021). Una promoción funcional con criterios separados para preferencias y fidelidad. Evitar la lectura opcional de esta segunda obligación.

- [CAND-SEG-001](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L897) → [REQ-SEG-002.3](#req-seg-0023), [POL-CAP-001](#pol-cap-001). Separar custodia verificable y gobierno de cuatro concesiones. La división conserva procedencia común y evita doble conteo de la política de captura.

- [Captura privada controlada](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L911) → [POL-CAP-001](#pol-cap-001), [REQ-SEG-002.3](#req-seg-0023). Absorción compartida con CAND-SEG-001. D18 y D20 conservan modos y supresión. DE-02 conserva los puntos sometidos al propietario.

- [Historial y retención](https://github.com/Hyouka73/QAMCP/blob/ea804a5b141659c68cd85305ca4bbaeeb431bc0e/docs/qap-architecture/catalogo-requisitos.md#L912) → [POL-RET-001](#pol-ret-001). La historia durable, detalle y conocimiento conservan su alcance. DE-01 mantiene TTL y cuotas pendientes y se exige precedencia privada.

## Veintiuna áreas de decisión

| Acta | Cobertura base | Propuesta de Neon | Preservación y ajuste de AV-01 | Aceptación candidata base |
| --- | --- | --- | --- | --- |
| [D01](../acta-decisiones.md#d01--producto-listo-para-uso-real) | CAM 001.1, CAS 001.2, ORA 001.1–001.7, E2E, REQ-QA-002 y candidatos de lanzamiento | `REQ-CAM-001.1`, `REQ-CAS-001.2`, `REQ-ORA-001.1–001.7`, `REQ-AUTREP-001`, `REQ-RUN-002.1`, `REQ-QA-001–003` (Neon §4, L171) | Producto autónomo completo. Preservar QA empresarial, regresión y aceptación, con demos como evidencia parcial. [AR-05](registro-maestro.md#ar-05), [AR-44](registro-maestro.md#ar-44) | G4/G6, E3/E4/E5/E8. Evaluación empresarial ciega, flujos, efectos, regresión e historial. |
| [D02](../acta-decisiones.md#d02--modalidad-inicial-local) | MEM 002.1, 003.6, INT 001.3, SEG 001.2 | `REQ-MEM-002.1`, `REQ-MEM-003.6`, `REQ-INT-001.3`, `REQ-SEG-001.2` (Neon §4, L172) | Persistencia local durable, SQLite candidato y vía a PostgreSQL compartido posterior. Fijar alcance y contrato sin adelantar modalidad. [AR-04](registro-maestro.md#ar-04), [AR-12](registro-maestro.md#ar-12), [AR-23](registro-maestro.md#ar-23) | G0/G1/G5, E1/E2. Aislamiento y una autoridad de escritura con contrato portable. |
| [D03](../acta-decisiones.md#d03--modos-de-inteligencia) | MEM 002.3–002.4, IA 001.1–001.6, CAM 001.4, AGT-002 | `REQ-MEM-002.3–002.4`, `REQ-IA-001.1–001.6`, `REQ-CAM-001.4`, `REQ-DIS-001.8` (Neon §4, L173) | HOST/DETERMINISTIC al inicio sin API adicional. Preservar ambas colas y reanudación. MANAGED diferido con alcance autorizado. [AR-11](registro-maestro.md#ar-11), [AR-15](registro-maestro.md#ar-15), [AR-42](registro-maestro.md#ar-42) | G1/G4, E3/E7. Muerte del host, avance determinista, reclamación por otro host y sin API extra. |
| [D04](../acta-decisiones.md#d04--autonomía-integral) | DIS 001.1, CAS 001.1, CAM 001.1–001.5, REP 001.2, REG 001.1 | `REQ-DIS-001.1`, `REQ-CAS-001.1`, `REQ-CAM-001.1–001.5`, `REQ-PLN-001.2–001.3`, `REQ-REG-001.1` (Neon §4, L174) | Preservar el ciclo intención a aprendizaje, autonomía ordinaria y bloqueo explícito por autoridad, incluso en campañas parciales. [AR-05](registro-maestro.md#ar-05), [AR-08](registro-maestro.md#ar-08), [AR-46](registro-maestro.md#ar-46) | G1/G4/G6, E3/E4/E8. Intención a aprendizaje, sin aprobación ordinaria, bloqueos explícitos. |
| [D05](../acta-decisiones.md#d05--memoria-y-continuidad) | MEM 001.1–003.6, DIS 001.2/7, CAS 001.3–001.5, REG 001.1–001.3, AGT-002 | `REQ-MEM-001.1–003.5`, `REQ-DIS-001.2/7`, `REQ-CAS-001.3–001.5`, `REQ-REG-001.1–001.3` (Neon §4, L175) | Conservar conocimiento, variantes, fuentes, resultados y progreso en planos con continuidad entre agentes. [AR-04](registro-maestro.md#ar-04), [AR-42](registro-maestro.md#ar-42), [AR-46](registro-maestro.md#ar-46) | G1/G2/G4/G5, E2/E3/E4/E5. Separación epistémica, fuentes e invalidación con continuidad. |
| [D06](../acta-decisiones.md#d06--pruebas-e2e-completas) | PLN 001.1/4–6, CAS 001.2, RUN 001.1–001.4, DAT 001.1–001.4, CAM 001.2, E2E | `REQ-PLN-001.1/4–6`, `REQ-CAS-001.2`, `REQ-RUN-001.1–001.4`, `REQ-DAT-001.1–001.4`, `REQ-CAM-001.2` (Neon §4, L176) | Flujos multirol y multimódulo, transferencia tipada, reconciliación, evidencia y limpieza verificable. [AR-10](registro-maestro.md#ar-10), [AR-43](registro-maestro.md#ar-43) | G3/G4/G6, E4/E5/E8. Dos roles, tres módulos, transferencia tipada, reconciliación y efectos. |
| [D07](../acta-decisiones.md#d07--escrituras-y-permisos) | SEG 001.1–001.3, DAT 001.3–001.4, ORA 001.5, RUN 001.5 | `REQ-SEG-001.1–001.3`, `REQ-DAT-001.3–001.4`, `REQ-ORA-001.5`, `REQ-RUN-001.5` (Neon §4, L177) | Producción solo lectura acreditada. Mutaciones solo en QA autorizado y bajo autoridad efectiva, incluida revocación. [AR-14](registro-maestro.md#ar-14), [AR-31](registro-maestro.md#ar-31), [AR-47](registro-maestro.md#ar-47) | G1/G3, E2/E4/E5. Producción solo lectura acreditada, QA acotado y revocación en vuelo. |
| [D08](../acta-decisiones.md#d08--utcp-apis-y-preparación-de-datos) | DAT 001.1–001.4, INT 001.4, UTCP/OpenAPI, REQ-QA-002 | `REQ-DAT-001.1–001.4`, `REQ-INT-001.4`, `REQ-QA-002` (Neon §4, L178) | UTCP y OpenAPI de lanzamiento, preparación por contrato y testigos sin exigir acceso directo a BD AUT. [AR-17](registro-maestro.md#ar-17), [AR-48](registro-maestro.md#ar-48) | G0/G3/G4, E1/E4/E5. Provisionar y verificar por contrato con permisos y reconciliación. |
| [D09](../acta-decisiones.md#d09--consultas-entre-instancias) | REQ-XINST-001, MEM 002.1/5, SEG 001.1–001.2 | `REQ-XINST-001`, `REQ-MEM-002.1/5`, `REQ-SEG-001.1–001.2` (Neon §4, L179) | Otra instancia con identidad distinta y lectura impuesta por destino. Procedencia, bloqueo o export saneada autorizada. [AR-18](registro-maestro.md#ar-18), [AR-31](registro-maestro.md#ar-31) | G0/G2/G3, E2/E4/E5. Identidad read-only del destino, procedencia y bloqueo si falta garantía. |
| [D10](../acta-decisiones.md#d10--ingesta-documental-corporativa-y-técnica) | DOC 001.1–001.4, INT 001.4 | `REQ-DOC-001.1–001.4`, `REQ-INT-001.4` (Neon §4, L180) | Preservar todos los formatos desde lanzamiento, localizadores, cobertura y conflicto con autoridad documental. [AR-13](registro-maestro.md#ar-13), [AR-22](registro-maestro.md#ar-22) | G2/G6, E4/E8. Corpus con formatos de lanzamiento, tablas, localizadores y abstención. |
| [D11](../acta-decisiones.md#d11--validación-funcional-de-reportes-pdf-y-excel) | CAND-REP-001, DOC 001.1–001.2, ORA 001.2–001.7, REQ-QA-001 | **`REQ-AUTREP-001`**, `REQ-DOC-001.2`, `REQ-ORA-001.2–001.7`, `REQ-QA-001` (Neon §4, L181) | Validar estructural y funcionalmente reportes PDF y Excel emitidos, por registro y total. Distinguir fórmula y regla contable. [AR-20](registro-maestro.md#ar-20), [AR-38](registro-maestro.md#ar-38) | G2/G3/G4/G6, E4/E5/E8. Comparar PDF y Excel del AUT por registro, fórmula y total. |
| [D12](../acta-decisiones.md#d12--oráculos-y-veracidad-de-resultados) | ORA 001.1–001.7, RUN 001.3–001.4, REP 001.1, M1 | `REQ-ORA-001.1–001.7`, `REQ-RUN-001.3–001.4`, `REQ-REP-001.1` (Neon §4, L182) | Preservar seis veredictos, cuatro ejes, testigos independientes y prohibición de falsos PASS. Resolver agregación y salidas. [AR-08](registro-maestro.md#ar-08), [AR-09](registro-maestro.md#ar-09), [AR-28](registro-maestro.md#ar-28) | G3/G5/G6, E5/E7/E8. Rechazar falsos PASS, distinguir ejes de ejecución y evidencia. |
| [D13](../acta-decisiones.md#d13--compatibilidad-con-agentes) | INT 001.1–001.2, IA 001.1/5, REQ-AGT-001, AGT-002, ONB-001 | `REQ-INT-001.1–001.2`, `REQ-IA-001.1/5`, `REQ-AGT-001`, `REQ-MEM-002.4` (Neon §4, L183) | Paridad MCP/CLI, compatibilidad por host y enrutamiento sin interferir en tareas legítimas. SDK y hooks son propuestas. [AR-15](registro-maestro.md#ar-15), [AR-52](registro-maestro.md#ar-52) | G1/G4/G5/G6, E1/E3/E7/E8. Sesiones limpias, clientes versionados, paridad y suites legítimas. |
| [D14](../acta-decisiones.md#d14--sistemas-operativos-navegadores-e-instalación) | INT 001.2, ONB-001, CAND-RUN-001, M4/M5 | `REQ-INT-001.2`, **`REQ-RUN-002.1`**, `REQ-REP-001.1` (`M4`/`M5`) (Neon §4, L184) | Soportar tres sistemas, descarga bajo demanda y matriz de navegadores/modos acreditados. Cerrar empaquetado y hardware con evidencia. [AR-16](registro-maestro.md#ar-16), [AR-33](registro-maestro.md#ar-33), [AR-37](registro-maestro.md#ar-37) | G1/G3/G5/G6, E1/E6/E7/E8. Tres SO, matriz navegador/modalidad, caché y descarga bajo demanda. |
| [D15](../acta-decisiones.md#d15--ejecución-visible-segundo-plano-y-fidelidad-visual) | CAND-RUN-001, DIS 001.3–001.4, RUN 001.1, M3 | **`REQ-RUN-002.1`**, `REQ-DIS-001.3–001.4`, `REQ-RUN-001.1`, `REQ-REP-001.1` (`M3`) (Neon §4, L185) | Mantener elección visible/segundo plano por lenguaje natural y fidelidad de CSS, JS, imágenes, fuentes e hidratación como invariante. [AR-16](registro-maestro.md#ar-16), [AR-36](registro-maestro.md#ar-36) | G2/G3/G5, E4/E6/E7. Reproducir el AUT hidratado y estilos íntegros, preferencias persistidas. |
| [D16](../acta-decisiones.md#d16--recursos-y-concurrencia) | CAM 001.3, RUN 001.1/5, OPT-001/002 | `REQ-CAM-001.3`, `REQ-RUN-001.1/5`, `REQ-MEM-003.5`, `REQ-DIS-001.3`, **`REQ-RUN-002.1`** (Neon §4, L186) | Concurrencia adaptativa y ahorros medidos bajo presupuesto, aislamiento y estabilidad. Mantener omisiones visibles. [AR-29](registro-maestro.md#ar-29), [AR-49](registro-maestro.md#ar-49) | G3/G4/G6, E3/E5/E7/E8. Medición CPU/RAM/disco/tokens, aislamiento y concurrencia acotada. |
| [D17](../acta-decisiones.md#d17--idiomas-e-internacionalización) | REQ-QA-001, DOC 001.1, IA 001.1–001.2, ORA 001.4 | `REQ-QA-001`, `REQ-DOC-001.1`, `REQ-IA-001.1–001.2`, `REQ-ORA-001.4` (Neon §4, L187) | Preservar i18n de AUT y de QAP, contexto regional y resultados independientes del idioma, con replay determinista. [AR-04](registro-maestro.md#ar-04), [AR-45](registro-maestro.md#ar-45) | G2/G3/G4/G6, E4/E5/E8. Variantes regionales reproducibles, textos y códigos estables. |
| [D18](../acta-decisiones.md#d18--captura-multimedia-privada-controlada) | CAND-SEG-001, SEG 001.1–001.3/002.1, REP 001.1, RUN 001.6, M1–M5, política de captura | **`POL-CAP-001`**, **`REQ-SEG-002.3`**, `REQ-SEG-001.1–001.3/002.1`, `REQ-REP-001.1`, `REQ-RUN-001.6` (Neon §4, L188) | Preservar tres modos, permisos independientes, vigencia y cifrado desde origen. Salvaguardar supresión antes de exponer. [AR-27](registro-maestro.md#ar-27), [AR-32](registro-maestro.md#ar-32), [AR-39](registro-maestro.md#ar-39) | G0/G1/G3/G5/G6, E2/E5/E6/E8. Canarios desde primer cuadro, custodia, supresión y revocación. |
| [D19](../acta-decisiones.md#d19--retención-inteligente-e-historial) | MEM 003.3–003.5, REP 001.1–001.4, OPT-002, M2/M4, política de historial y retención | **`POL-RET-001`**, `REQ-MEM-003.3–003.5`, `REQ-REP-001.1–001.4` (Neon §4, L189) | Mantener resumen y detalle, conocimiento vigente y export. Ratificar TTL y cuotas pendientes bajo precedencia privada. [AR-25](registro-maestro.md#ar-25), [AR-50](registro-maestro.md#ar-50) | G1/G3/G5, E2/E5/E6/E7. Poda auditable, historial durable, export saneado y veredicto inmutable. |
| [D20](../acta-decisiones.md#d20--seguridad-de-sesiones-secretos-y-visor) | SEG 001.1–001.3/002.1–002.2, MEM 002.5, CAND-SEG-001, M4 | `REQ-SEG-001.1–001.3`, `REQ-SEG-002.1–002.2`, **`REQ-SEG-002.3`**, `REQ-MEM-002.5` (Neon §4, L190) | Contrastar secretos fuera de canal, sesión exigida, revocación, visor y autorización del destino con la experiencia normal. [AR-07](registro-maestro.md#ar-07), [AR-24](registro-maestro.md#ar-24), [AR-31](registro-maestro.md#ar-31), [AR-47](registro-maestro.md#ar-47) | G0/G1/G3/G5, E2/E5/E6. Sesión requerida, alta segura, aislamiento, CORS, catálogo y rangos. |
| [D21](../acta-decisiones.md#d21--criterios-de-aceptación-del-producto) | DIS 001.1–001.8, CAS 001.2/4, ORA 001.1–001.7, DAT, E2E, REQ-QA-001/002/003, CAND-REP-001, CAND-RUN-001, INT 001.1–001.2 | Todos los requisitos de lanzamiento + `E1–E8` + `V-01–V-18` (Neon §4, L191) | Cumplimiento obligatorio, corpus ciego, métricas por dimensión y validación operativa previa a GA. Ratificar alcance y umbrales. [AR-06](registro-maestro.md#ar-06), [AR-30](registro-maestro.md#ar-30), [AR-35](registro-maestro.md#ar-35), [AR-44](registro-maestro.md#ar-44) | G6, E1–E8. Custodia y oráculos independientes, métricas separadas, paridad, cero fallas de garantías críticas. |
