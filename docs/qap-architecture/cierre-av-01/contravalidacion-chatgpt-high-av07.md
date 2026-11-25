# **QAP — Contravalidación técnica independiente de AV-07**

**Fecha:** 25 de noviembre de 2026.\
**Responsable:** ChatGPT High, Contravalidador Técnico Independiente, en sustitución temporal de Gemini Neon por instrucción del propietario.\
**Destinatario:** Orquestador Principal de QAP.\
**Investigador principal:** Codex High.\
**Repositorio:** `Hyouka73/QAMCP`.\
**Rama exclusiva:** `develop`.\
**SHA de referencia:** `b22bc9b9d52c8138f9b518ece6b2de89cc2b2559`.\
**Alcance:** AR-19, AR-21, AR-23, AR-26, AR-33, AR-34, AR-41, AR-51, AR-54 y AR-57.\
**Modalidad:** Investigación documental independiente e inspección estática, exclusivamente de lectura.

## **1. Dictamen ejecutivo**

**APROBABLE EN DISEÑO CON ENMIENDAS VINCULANTES, RESERVAS Y BLOQUEANTES CONSERVADOS.**

La estrategia de reconstrucción selectiva propuesta por Codex High es arquitectónicamente defendible y preferible a una reescritura indiscriminada de QAP.

Sin embargo, no recomiendo aprobar íntegramente el expediente en su redacción actual. Existen imprecisiones materiales relacionadas con el inventario, las dependencias efectivas, el alcance de las fronteras de seguridad, la migración y la precedencia entre compuertas.

La aceptación documental debe quedar condicionada a las enmiendas de esta contravalidación.

### **1.1. Conclusiones principales**

1. **QAP contiene diez paquetes, no nueve.** La corrección afecta los inventarios, el perímetro de deuda, las pruebas de reconstrucción y la distribución.
2. **Debe conservarse la reconstrucción selectiva por responsabilidad y garantía**, sin imponer una reescritura completa ni reutilizar código incompatible con los contratos aceptados.
3. El grafo declarado por los manifests no representa necesariamente el grafo de imports, el código incorporado al bundle ni las dependencias utilizadas en producción.
4. Node 24.22.3 con `node:sqlite` constituye un candidato técnicamente razonable. No existe aún una selección acreditada de runtime, driver o distribución.
5. **El escritor único es una autoridad lógica y efectiva**, no una garantía derivada de SQLite, un lockfile o la existencia de un proceso separado.
6. La migración necesita excluir al escritor legado tanto del almacenamiento como de las capacidades de despacho de QAP. Proteger únicamente la nueva base de datos es insuficiente.
7. El ejecutor independiente necesita una solución explícita para navegación visible sin conceder al HOST acceso a las claves, sesiones, bases de datos o medios privados.
8. La distribución ligera y reproducible necesita acreditación sobre paquetes instalados fuera del monorepo, incluidos los componentes nativos y opcionales.
9. La existencia de un digest, una licencia declarada o una versión corregida de una dependencia no constituye por sí sola admisibilidad integral.
10. La planificación debe preservar los 92 elementos normativos y las 11 ampliaciones, sin confundirlos con los 82 identificadores del plan histórico.

**AR-41 debe conservar su estado BLOQUEANTE.** La aceptación de su arquitectura de migración no acredita una migración segura ni autoriza un corte real.

### **1.2. Dictamen por registro**

| Registro | Materia                    | Dictamen de diseño                       | Estado principal conservado |
| -------- | -------------------------- | ---------------------------------------- | --------------------------- |
| AR-19    | Secuencia y compuertas     | Favorable con enmiendas                  | PENDIENTE                   |
| AR-21    | Identidad de dependencias  | Favorable con reservas                   | PENDIENTE                   |
| AR-23    | Runtime y persistencia     | Favorable como selección candidata       | PENDIENTE                   |
| AR-26    | Deuda y regresiones        | Favorable con enmiendas                  | PENDIENTE                   |
| AR-33    | Distribución y ejecutor    | Condicionado a viabilidad por plataforma | PENDIENTE                   |
| AR-34    | Reconstrucción selectiva   | Favorable con enmiendas                  | PENDIENTE                   |
| AR-41    | Migración y escritor único | Contrato corregible; corte bloqueado     | BLOQUEANTE                  |
| AR-51    | Licencias y admisibilidad  | Favorable como protocolo de selección    | PENDIENTE                   |
| AR-54    | Precedencia normativa      | Favorable con enmiendas                  | PENDIENTE                   |
| AR-57    | Inventario y topología     | Favorable con corrección factual         | PENDIENTE                   |

No se propone reclasificar registros por la aceptación de un diseño.

## **2. Identidad, procedencia y alcance de la evidencia**

### **2.1. Verificación del repositorio**

Se utilizó el conector de GitHub para recuperar el encargo vinculante y los seis documentos que integran el expediente AV-07.

| Elemento                                         | Identidad verificada                       |
| ------------------------------------------------ | ------------------------------------------ |
| HEAD de `develop`                                | `b22bc9b9d52c8138f9b518ece6b2de89cc2b2559` |
| Árbol Git de HEAD                                | `ed8f4f371573be98f17972c9252a4d8a3fb60852` |
| Base auditada por Codex                          | `45401c45f91b3cd4944f372491e3c3c9f12ec56d` |
| Publicación de Codex, identificada en el encargo | `05b71da628af350e87549a6b5f04fbc72bfee6fe` |
| Diferencia entre base y referencia actual        | Dos commits posteriores, sin divergencia   |
| Archivos afectados en esa comparación            | Once archivos Markdown                     |
| Árbol recursivo consultado                       | No truncado                                |

**Resultado:** no existen modificaciones de código, dependencias o configuración ejecutable entre la base auditada por Codex y el SHA del encargo, según la comparación recuperada.

Fuente: [comparación exacta de commits](https://github.com/Hyouka73/QAMCP/compare/45401c45f91b3cd4944f372491e3c3c9f12ec56d...b22bc9b9d52c8138f9b518ece6b2de89cc2b2559?utm_source=chatgpt.com).

### **2.2. Expediente sometido a contravalidación**

| Documento                                                                                                                                                                                            | Blob Git recuperado                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Informe AV-07](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/informe-av07.md?utm_source=chatgpt.com)                           | `9cd76c2c7a94fe6d06fc81f719bb7a3015e2c6ea` |
| [Matriz de reconstrucción](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/matriz-reconstruccion-av07.md?utm_source=chatgpt.com)  | `1601b6b63d28c312c94cb109baa0dff63bc77e6b` |
| [Persistencia y migración](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/persistencia-migracion-av07.md?utm_source=chatgpt.com) | `51b8d42520fa68e1881d5c39a842f099b156721a` |
| [Dependencias y licencias](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/dependencias-licencias-av07.md?utm_source=chatgpt.com) | `39805eba2607c4d551d04ef8740b421e817ff7f5` |
| [Compuertas](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/compuertas-av07.md?utm_source=chatgpt.com)                           | `869f063e0df39297a2db16e2fe702cbebc7d02b2` |
| [Precedencia normativa](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/precedencia-av07.md?utm_source=chatgpt.com)               | Consultado en el SHA de referencia         |

También se recuperó íntegramente el [encargo vinculante de contravalidación](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/encargo-contravalidacion-av07.md?utm_source=chatgpt.com).

### **2.3. Niveles de evidencia**

| Nivel      | Interpretación                                                               |
| ---------- | ---------------------------------------------------------------------------- |
| V-CODE     | Verificado directamente en código o manifest fijado por SHA.                 |
| V-GIT      | Verificado mediante árbol, comparación, referencia u objeto Git recuperado.  |
| V-UPSTREAM | Verificado mediante documentación, código o aviso oficial del proveedor.     |
| V-METADATA | Verificado como metadato, versión, licencia declarada o integridad esperada. |
| HIST       | Evidencia histórica con sus limitaciones originales.                         |
| PROP       | Enmienda, contrato o alternativa propuesta.                                  |
| EXP        | Requiere validación experimental futura.                                     |
| IND        | Evidencia insuficiente para concluir.                                        |

Un artefacto puede tener identidad documental verificada sin que se hayan comprobado independientemente sus bytes o funcionamiento instalado.

No se utilizará la coincidencia con el informe de Codex como sustituto de una verificación independiente.

## **3. Resolución general de las ocho objeciones**

| Objeción vinculante             | Registros afectados | Resolución                                                                                        |
| ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| O1. Inventario y reconstrucción | AR-34/57            | Corregir inventario y delimitar mecanismos reutilizables, autoridad y grafo.                      |
| O2. Migración y corte           | AR-41               | Sustituir corte lineal por máquina durable con exclusión efectiva, recuperación y conciliación.   |
| O3. Compuertas                  | AR-19               | Separar precedencia de salidas y dependencias reales de artefactos.                               |
| O4. Runtime e identidad         | AR-21/23            | Calificación independiente de runtime, SDK, Playwright y SQLite; límites explícitos de evidencia. |
| O5. Distribución y supervisor   | AR-33               | Bootstrap reproducible y separación verificable de autoridad, sesión gráfica y ejecutor.          |
| O6. Admisibilidad               | AR-51               | Licencias, avisos, artefactos y capacidades bajo evaluación independiente por modalidad.          |
| O7. Deuda y pruebas             | AR-26               | Baseline reproducible y comparación semántica con multiplicidad.                                  |
| O8. Precedencia y cobertura     | AR-54               | Manifest normativo y trazabilidad exhaustiva por identificador.                                   |

La resolución contractual de una objeción no acredita que las pruebas correspondientes se hayan ejecutado o superado.

## **4. O1 — AR-34 y AR-57: inventario completo y reconstrucción selectiva**

### **4.1. Corrección del inventario**

El repositorio contiene **diez paquetes bajo&#x20;**`packages/`, además del manifest privado de la raíz del monorepo.

La referencia a nueve paquetes en el informe principal y los anexos correspondientes es incorrecta.

| Paquete              | Responsabilidad actual                           | Estrategia propuesta                              |
| -------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `shared`             | Tipos, contratos, esquemas y validación          | Conservar y endurecer                             |
| `engine`             | Contratos de dominio y coordinación de flujos    | Reconstrucción selectiva                          |
| `knowledge`          | Memoria, archivos, SQLite y recuperación         | Adaptar al repositorio canónico                   |
| `auth`               | Autenticación, perfiles, sesiones y credenciales | Reconstruir frontera de autoridad                 |
| `git-adapter`        | Operaciones de consulta Git                      | Endurecer y conservar                             |
| `playwright-adapter` | Navegación, observación y Discovery              | Adaptar detrás del puerto aceptado                |
| `playwright-runner`  | Ejecución y producción de evidencias             | Reconstruir coordinación y publicación            |
| `reporter`           | Persistencia histórica, reportes y servidor HTTP | Separar lectura, publicación y autoridad          |
| `mcp`                | Transporte, herramientas y lógica de aplicación  | Reducir a adaptador y trasladar autoridad         |
| `cli`                | Interfaz de comandos y operaciones directas      | Conservar interfaz; eliminar escrituras paralelas |

La raíz del monorepo no constituye un undécimo paquete funcional bajo `packages/`.

Se verificaron los manifests de los diez paquetes y el [manifest raíz](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/package.json?utm_source=chatgpt.com).

### **4.2. Dependencias internas declaradas**

Para facilitar la lectura, se omite el prefijo `@qap/` en los nombres internos.

| Consumidor           | Dependencias internas relevantes                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `shared`             | Ninguna                                                                                                           |
| `engine`             | `shared`                                                                                                          |
| `knowledge`          | `engine`, `shared`                                                                                                |
| `auth`               | `shared`                                                                                                          |
| `git-adapter`        | `engine`, `knowledge`                                                                                             |
| `playwright-adapter` | `engine`, `shared`                                                                                                |
| `playwright-runner`  | `auth`, `engine`, `knowledge`, `shared`                                                                           |
| `reporter`           | `engine`, `knowledge`, `shared`                                                                                   |
| `mcp`                | `auth`, `engine`, `knowledge`, `playwright-adapter`, `playwright-runner`, `reporter`, `shared`                    |
| `cli`                | Los otros nueve paquetes, declarados como dependencias de desarrollo e incorporados según la estrategia de bundle |

**Hallazgo independiente:** los paquetes internos consumidos por CLI no están simplemente ausentes de su manifest. Se encuentran declarados en `devDependencies`, mientras su configuración de compilación intenta incorporarlos mediante `noExternal`.

Por tanto, la verificación correcta debe distinguir:

1. Grafo de dependencias declaradas.
2. Grafo de imports estáticos.
3. Imports dinámicos y dependencias opcionales.
4. Código efectivamente incorporado al bundle.
5. Dependencias externas del paquete instalado.
6. Componentes realmente alcanzables durante la ejecución.

Confundir estas seis representaciones produciría una evaluación incorrecta de tamaño, licencias, vulnerabilidades y aislamiento.

Fuentes:

- [CLI package.json](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/cli/package.json?utm_source=chatgpt.com).
- [CLI tsup.config.ts](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/cli/tsup.config.ts?utm_source=chatgpt.com).
- [MCP package.json](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/package.json?utm_source=chatgpt.com).
- [MCP tsup.config.ts](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/tsup.config.ts?utm_source=chatgpt.com).

### **4.3. Supuesto ciclo entre engine y knowledge**

El grafo declarado no acredita un ciclo directo entre estos dos paquetes.

`knowledge` depende de `engine`. Por su parte, `engine` declara dependencia de `shared`, y los puertos examinados permiten expresar contratos sin importar directamente la implementación SQLite.

Fuentes:

- [engine/package.json](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/engine/package.json?utm_source=chatgpt.com).
- [knowledge/package.json](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/knowledge/package.json?utm_source=chatgpt.com).
- [engine/src/ports.ts](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/engine/src/ports.ts?utm_source=chatgpt.com).

La conclusión debe limitarse al grafo declarado y las rutas inspeccionadas. No se acredita ausencia global de ciclos indirectos, dinámicos o introducidos por el empaquetado.

La arquitectura objetivo deberá impedir que el dominio dependa de una implementación concreta de SQLite, Playwright, MCP o cualquier framework de distribución.

### **4.4. Hallazgo material adicional: SQLite de coordinación omitido**

El anexo `persistencia-migracion-av07.md` necesita una corrección adicional.

**Existe una base SQLite de coordinación de operaciones denominada&#x20;**`project-operations.sqlite`**.**

Se verificó directamente en:

[packages/mcp/src/project-reset.ts, L75–145](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/src/project-reset.ts?utm_source=chatgpt.com#L75-L145).

El código abre esta base y utiliza una transacción `BEGIN EXCLUSIVE` como mecanismo de exclusión de operaciones.

La coordinación se vincula al host de almacenamiento, no exclusivamente a una fila de proyecto.

Esto afecta directamente AR-41 y AR-57:

- Existe una superficie de persistencia que debe inventariarse durante la migración.
- El mecanismo de exclusión legado tiene alcance potencialmente compartido.
- El corte de un proyecto puede competir con otras operaciones de la instalación.
- El mecanismo actual no constituye por sí mismo el fencing durable y generacional exigido por AV-03.
- La liberación de una conexión o transacción no demuestra resolución de efectos empresariales pendientes.

### **4.5. Conciliación de las seis bases históricas y cinco familias funcionales**

El [informe AV-03, L119](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/informe-av03.md?utm_source=chatgpt.com#L119) identificaba seis bases SQLite.

La clasificación correcta para AV-07 es:

| Familia funcional      | Clase lógica de almacenamiento | Identidad o ubicación                    |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| Aplicación             | Servicio de aplicación         | `app-service.sqlite`                     |
| Conocimiento           | Repositorio de conocimiento    | `knowledge.sqlite`, asociado al proyecto |
| Coordinación           | Exclusión de operaciones       | `project-operations.sqlite`              |
| Trabajo conversacional | Borradores                     | `interview-drafts`                       |
| Trabajo conversacional | Cierres de módulo              | `module-closures`                        |
| Ejecución y reportes   | Runtime histórico              | `qap.sqlite`                             |

**Resultado: cinco familias funcionales si borradores y cierres se agrupan, pero seis clases lógicas de almacenamiento persistente.**

El número de archivos físicos efectivos depende de la instalación, los proyectos y las configuraciones.

No se contabilizarán como bases de negocio independientes:

- Probes SQLite en memoria.
- Archivos auxiliares WAL y SHM.
- Copias de seguridad.
- Variantes de DDL sobre la misma base.
- Archivos temporales de migración.

Sin embargo, todos deben inventariarse cuando puedan afectar custodia, recuperación o exclusión.

### **4.6. Mapa corregido de productores y escritores**

| Componente                    | Evidencia observada                                                        | Condición objetivo                          |
| ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| `application-service.ts`      | Apertura de `app-service.sqlite` compartida y repositorios de conocimiento | Autoridad canónica mediada                  |
| `app-service-store.ts`        | SQLite, migraciones y transacciones                                        | Repositorio durable con generaciones        |
| `sqlite-knowledge-adapter.ts` | SQLite, FTS y configuración de durabilidad                                 | Adaptador detrás de puerto canónico         |
| `project-reset.ts`            | Exclusión SQLite, registros de reset y operaciones destructivas            | Coordinación durable; reset gobernado       |
| `interview-draft-store.ts`    | Escritura independiente de borradores                                      | Borradores sometidos a autoridad común      |
| `module-closure-store.ts`     | Escritura independiente de cierres                                         | Cierres canónicos y revisados               |
| `file-storage.ts`             | Escritura de archivos y locks                                              | Importación autorizada y proyecciones       |
| `evidence-artifacts.ts`       | Escritura de medios, `run.json` y base runtime                             | Publicación mediante custodio y catálogo    |
| `provisional-execution.ts`    | Manifiestos provisionales, reconciliación y persistencia                   | Trabajo durable y publicación transaccional |
| `sqlite-client.ts`            | Persistencia histórica y reconstrucción de reportes                        | Lectura derivada y repositorio autorizado   |
| `reporter/server.ts`          | Apertura de base y operaciones de eliminación                              | Visor sin escritura directa                 |
| `cli`                         | Configuración, limpieza, poda, reindexación y comandos directos            | Adaptador sin autoridad paralela            |
| `mcp/server.ts`               | Rutas de aplicación y ramas históricas                                     | Adaptador al núcleo común                   |
| `qap-provision-host.mjs`      | Apertura de stores y escritura de configuración y secretos                 | Retirar como ruta operativa insegura        |
| `auth/session-store.ts`       | Persistencia y recuperación de sesión                                      | Bóveda y broker autorizado                  |

Fuentes adicionales:

- [application-service.ts, L543 y siguientes](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/src/application/application-service.ts?utm_source=chatgpt.com#L543).
- [evidence-artifacts.ts, L868–960](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/playwright-runner/src/evidence-artifacts.ts?utm_source=chatgpt.com#L868-L960).
- [sqlite-client.ts, L324–347](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/reporter/src/persistence/sqlite-client.ts?utm_source=chatgpt.com#L324-L347).
- [qap-provision-host.mjs](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/scripts/qap-provision-host.mjs?utm_source=chatgpt.com).

### **4.7. Un GET no garantiza ausencia de escritura**

En el servidor HTTP de reporter se identifican rutas de consulta que construyen `QapDatabase` sin seleccionar necesariamente el modo de auditoría de solo lectura.

El constructor distingue ese modo de una apertura normal, que puede preparar almacenamiento y esquema.

Fuentes: [server.ts L114–150](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/reporter/src/server/server.ts?utm_source=chatgpt.com#L114-L150) y [sqlite-client.ts L324–347](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/reporter/src/persistence/sqlite-client.ts?utm_source=chatgpt.com#L324-L347).

**Consecuencia:** no basta clasificar una interfaz como lectura por su verbo HTTP o por su nombre.

Cada entrada deberá acreditar sus efectos reales, incluidas:

- Creación de archivos.
- Inicialización de esquemas.
- Migraciones implícitas.
- Generación de cachés.
- Retención de handles.
- Activación del ejecutor.

### **4.8. Diferenciar código presente y escritor activo**

El inventario deberá mantener cuatro categorías:

| Categoría     | Significado                                                              |
| ------------- | ------------------------------------------------------------------------ |
| ACTIVO        | Entrada alcanzable con escritura efectiva en la configuración examinada. |
| CONDICIONAL   | Escritura alcanzable bajo determinada configuración o autorización.      |
| DESHABILITADO | Código presente cuya entrada está explícitamente bloqueada.              |
| INDETERMINADO | No se ha acreditado completamente su alcanzabilidad.                     |

El [servidor MCP](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/src/server.ts?utm_source=chatgpt.com#L894) contiene bloqueos explícitos de operaciones históricas.

Eso no demuestra que todas las rutas equivalentes de CLI, scripts, imports directos o paquetes antiguos estén igualmente deshabilitadas.

La eliminación futura de un escritor exige una prueba negativa por entrada y no únicamente una búsqueda textual de funciones.

## **5. Arquitectura objetivo y decisiones por módulo**

### **5.1. Alternativas consideradas**

| Alternativa                               | Ventaja                                                                | Limitación                                                         | Dictamen                           |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------- |
| Reescritura integral                      | Libertad arquitectónica                                                | Pérdida de mecanismos y regresiones útiles                         | No recomendada                     |
| Endurecimiento exclusivamente incremental | Menor discontinuidad inicial                                           | Conservación de fronteras y autoridad fragmentadas                 | Insuficiente como estrategia única |
| Reconstrucción selectiva por contratos    | Preserva capacidades acreditables y reemplaza mecanismos incompatibles | Requiere inventario y pruebas de equivalencia                      | Recomendada                        |
| Sustituir QAP por otro framework          | Menor trabajo en ciertas capacidades comunes                           | No satisface por sí mismo autonomía, memoria, autoridad y reportes | No justificada                     |

La recomendación de Codex se acepta bajo reconstrucción selectiva.

**Reconstruir selectivamente no significa conservar obligatoriamente todos los paquetes ni eliminar los diez actuales.** Significa preservar cada obligación y elegir la implementación apropiada.

### **5.2. Grafo lógico objetivo**

\#chatgpt-mermaid-\_r_1rq\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1rq\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1rq\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1rq\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1rq\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1rq\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1rq\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1rq\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1rq\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1rq\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1rq\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1rq\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1rq\_ p{margin:0;}#chatgpt-mermaid-\_r_1rq\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_1rq\_ .label text,#chatgpt-mermaid-\_r_1rq\_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ .node rect,#chatgpt-mermaid-\_r_1rq\_ .node circle,#chatgpt-mermaid-\_r_1rq\_ .node ellipse,#chatgpt-mermaid-\_r_1rq\_ .node polygon,#chatgpt-mermaid-\_r_1rq\_ .node path{fill:rgb(19, 33, 54);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .rough-node .label text,#chatgpt-mermaid-\_r_1rq\_ .node .label text,#chatgpt-mermaid-\_r_1rq\_ .image-shape .label,#chatgpt-mermaid-\_r_1rq\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_1rq\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .rough-node .label,#chatgpt-mermaid-\_r_1rq\_ .node .label,#chatgpt-mermaid-\_r_1rq\_ .image-shape .label,#chatgpt-mermaid-\_r_1rq\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_1rq\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_1rq\_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1rq\_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1rq\_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-\_r_1rq\_ .edgeLabel{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1rq\_ .edgeLabel p{background-color:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1rq\_ .edgeLabel rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1rq\_ .labelBkg{background-color:rgba(14, 14, 14, 0.5);}#chatgpt-mermaid-\_r_1rq\_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_1rq\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1rq\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_1rq\_ .icon-shape,#chatgpt-mermaid-\_r_1rq\_ .image-shape{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1rq\_ .icon-shape p,#chatgpt-mermaid-\_r_1rq\_ .image-shape p{background-color:rgb(14, 14, 14);padding:2px;}#chatgpt-mermaid-\_r_1rq\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_1rq\_ .image-shape .label rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1rq\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_1rq\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_1rq\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1rq\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1rq\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1rq\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1rq\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1rq\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1rq\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1rq\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1rq\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1rq\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_1rq\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_1rq\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .node rect,#chatgpt-mermaid-\_r_1rq\_ .node circle,#chatgpt-mermaid-\_r_1rq\_ .node ellipse,#chatgpt-mermaid-\_r_1rq\_ .node polygon,#chatgpt-mermaid-\_r_1rq\_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_1rq\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_1rq\_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_1rq\_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_1rq\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1rq\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}HOST MCPAdaptador MCPOperador CLIAdaptador CLIIPC autenticadoAutoridad y admisiónServicios de aplicaciónDominio y contratosPuertos semánticosRepositorio y coordinadorNavegación y ejecuciónDocumentos y cálculoUTCP y OpenAPIBóveda y credencialesCustodio multimediaProyecciones autorizadasVisor y exportacionesSupervisor independiente

El diagrama representa relaciones lógicas de ejecución y autoridad. No prescribe imports concretos ni exige que cada bloque sea un paquete npm.

Las implementaciones de adaptadores podrán depender de los contratos de los puertos. El dominio no dependerá de las implementaciones.

### **5.3. Fronteras normativas**

| Frontera     | Responsabilidad                                       |
| ------------ | ----------------------------------------------------- |
| Dominio      | Reglas, estados, contratos e invariantes              |
| Aplicación   | Casos de uso, validación y coordinación               |
| Autoridad    | Identidad, grants, decisiones y revocación            |
| Persistencia | Único escritor efectivo de hechos canónicos           |
| Ejecución    | Admisión, leases, DAG, operaciones y testigos         |
| Adaptadores  | Interacción específica con infraestructura y AUT      |
| Custodia     | Integridad, privacidad y disponibilidad de artefactos |
| Interfaces   | MCP, CLI, visor y comandos autorizados                |
| Supervisor   | Ciclo de vida, aislamiento y recuperación             |

Ningún adaptador deberá otorgarse autorización simplemente por disponer de acceso técnico al recurso.

### **5.4. Matriz de reconstrucción corregida**

| Paquete              | Preservar                                        | Reemplazar o adaptar                                                    | Condición de retirada     |
| -------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------- |
| `shared`             | Contratos útiles y validadores                   | Tipos divergentes, contratos obsoletos y estados incompatibles          | Equivalencia normativa E1 |
| `engine`             | Puertos, lógica pura y conceptos de DAG          | Coordinación dependiente del proceso HOST                               | E1/E3/E4/E5               |
| `knowledge`          | Adaptador SQLite, búsqueda, modelos recuperables | Doble autoridad archivo/DB y escrituras externas                        | E2                        |
| `auth`               | Identidad de perfiles y mecanismos recuperables  | Secretos por entorno, configuración compartida y sesiones sin autoridad | EXP-07/E2                 |
| `git-adapter`        | Consultas y pruebas útiles                       | Shell interpolado y fallback ambiguo                                    | AR-40/E1                  |
| `playwright-adapter` | Navegación y extracción aprovechables            | Perfiles sin semántica suficiente y observaciones no acreditadas        | EXP-02/04                 |
| `playwright-runner`  | Interacción, lifecycle y testigos aprovechables  | Publicación directa, autoridad duplicada y veredictos incorrectos       | E3/E5/E6                  |
| `reporter`           | Formatos y mecanismos de representación          | Escritura directa, HTTP legado y dependencias externas                  | E2/E6/E7                  |
| `mcp`                | Transporte, catálogo y esquemas válidos          | Lógica de aplicación duplicada y entradas bypass                        | EXP-01a/E7                |
| `cli`                | Ergonomía, comandos y salida estructurada        | Acceso directo a stores y escritores independientes                     | E7                        |

### **5.5. Preservación de pruebas frente a preservación de código**

No todas las pruebas deben conservarse sin modificaciones.

Se distinguen:

- Pruebas que acreditan obligaciones vigentes.
- Pruebas que reproducen defectos conocidos.
- Pruebas de comportamiento histórico incompatible.
- Pruebas limitadas a una implementación interna.
- Pruebas de regresión necesarias aunque desaparezca el módulo original.

Una prueba histórica cuyo resultado esperado permite un falso PASS deberá transformarse en una prueba negativa de ese defecto, no mantenerse como criterio de éxito.

El [contrato de pruebas de KnowledgeStore](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/engine/src/__tests__/knowledge-store.contract.test.ts?utm_source=chatgpt.com) utiliza explícitamente un doble en memoria. Es una prueba útil de contrato, pero no sustituye la acreditación de SQLite, durabilidad o recuperación instalada.

### **5.6. Antecedentes archivados recuperables**

Se verificaron las referencias Git de los cinco tags archivados.

| Antecedente  | SHA                                        | Uso autorizado en reconstrucción                            |
| ------------ | ------------------------------------------ | ----------------------------------------------------------- |
| AS-02        | `c5ac3e5e492384651d1335678ffe246bb5f50cac` | Endurecimiento Git y regresiones negativas                  |
| AS-04        | `463b556627b30165fde4f52291879802b9487e87` | Mecanismos multimedia y reproducción de brechas preventivas |
| MVP autónomo | `d4cfadfa5bf25591b72001bccab69b7dd1bbb6a7` | Recorrido canónico MCP                                      |
| Recovery     | `a78322f832fd69ccf58b7cb24f1571c8e1481e75` | Handoff, bloqueos y evidencia de recuperación               |
| Hydrogen R2  | `c57cd886bbda09902afc7d118b54226c1b59e62b` | Testigos independientes y controles contra falsos PASS      |

#### **AS-02**

El [archivo de pruebas del adaptador Git](https://github.com/Hyouka73/QAMCP/blob/c5ac3e5e492384651d1335678ffe246bb5f50cac/packages/git-adapter/src/__tests__/git-adapter.test.ts?utm_source=chatgpt.com) contiene controles relevantes de referencias, nombres Unicode y resolución de referencias predeterminadas.

En la base actual, [git-adapter.ts](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/git-adapter/src/git-adapter.ts?utm_source=chatgpt.com#L28-L33) mantiene llamadas mediante `execSync` y fallback.

Se recomienda recuperar la intención de las pruebas AS-02, no aplicar automáticamente el commit completo.

El fallo de resolución no deberá convertirse silenciosamente en un resultado vacío válido.

#### **AS-04**

El [estado de integración archivado](https://github.com/Hyouka73/QAMCP/blob/463b556627b30165fde4f52291879802b9487e87/docs/qap-architecture/insumos/as04-estado-integracion.md?utm_source=chatgpt.com) conserva evidencia de mecanismos multimedia y una fuga de canario en transición SPA hacia MFA.

La existencia de capturas y videos reproducibles no resuelve AR-27.

Recuperar pruebas de producción de medios y publicación, incorporando como control negativo la fuga preventiva.

#### **MVP autónomo**

El [contrato autónomo archivado](https://github.com/Hyouka73/QAMCP/blob/d4cfadfa5bf25591b72001bccab69b7dd1bbb6a7/docs/qap-autonomous-mvp.md?utm_source=chatgpt.com) proporciona antecedentes del recorrido start → plan → test → report.

Debe recuperarse la propiedad de continuidad e interoperabilidad, no reinstaurar el MVP como alcance final.

#### **Recovery**

El [handoff Recovery](https://github.com/Hyouka73/QAMCP/blob/a78322f832fd69ccf58b7cb24f1571c8e1481e75/docs/qap-recovery/handoff-codex-high.md?utm_source=chatgpt.com) distingue resultados recuperables de información histórica perdida.

Los doce vectores originales y cuatro identidades históricas de falsos PASS que constan como perdidos no podrán presentarse como reconstruidos fielmente.

Una prueba sustituta deberá recibir identidad y procedencia nuevas.

#### **Hydrogen R2**

El [expediente R2](https://github.com/Hyouka73/QAMCP/blob/c57cd886bbda09902afc7d118b54226c1b59e62b/docs/qap-recovery/resultados-hydrogen.md?utm_source=chatgpt.com) aporta controles de efectos empresariales mediante testigos externos.

Debe recuperarse especialmente el caso HTTP 201 con rollback y discrepancia entre la respuesta técnica y el estado real.

No debe trasladarse su aprobación experimental al producto actual.

### **5.7. Enmienda vinculante CV07-01**

> Sustituir toda referencia a nueve paquetes por diez. El inventario distinguirá manifests, imports, bundle, dependencias instaladas y alcanzabilidad. Se reconocerán seis clases lógicas de SQLite agrupables en cinco familias funcionales, incluida `project-operations.sqlite`. La reconstrucción será selectiva por obligación y frontera de autoridad. Los cinco tags se utilizarán exclusivamente como fuentes de mecanismos, pruebas y evidencia histórica, sin merge o cherry-pick indiscriminado. La retirada de módulos exigirá sustitución acreditada de sus obligaciones y pruebas de ausencia de escritores paralelos.

**Dictamen O1:** favorable con enmienda. AR-34 y AR-57 conservan estado PENDIENTE.

## **6. O2 — AR-41: migración, exclusión del escritor legado y recuperación**

### **6.1. Dictamen sobre la propuesta original**

La migración por proyecto propuesta por Codex es razonable como unidad de autoridad, pero necesita distinguirla de la topología física del almacenamiento.

Un proyecto puede compartir:

- Base de servicio.
- Directorio de coordinación.
- Procesos.
- Instalación y runtime.
- Bóveda.
- Recursos empresariales.
- Cachés y catálogo.

Por ello, la exclusión de escritura de un proyecto no puede presumirse a partir de una ACL aplicada a una base compartida.

### **6.2. Autoridad lógica frente a protección física**

El diseño deberá mantener al menos tres identidades independientes.

| Identidad   | Propósito                                                 |
| ----------- | --------------------------------------------------------- |
| Instalación | Coordinar recursos, versiones y procesos compartidos      |
| Proyecto    | Determinar ámbito de autoridad y estado de migración      |
| Operación   | Correlacionar intención, efectos, reservas y recuperación |

La generación de la instalación no sustituye la generación de autoridad del proyecto.

La generación del proyecto tampoco sustituye las barreras por efecto externo.

### **6.3. Contrato de migración corregido**

```
migration_record:
  installation_id: reference
  project_id: reference
  operation_id: unique_reference

  source:
    authority_generation: reference
    schema_versions: []
    source_manifest: reference
    snapshot_reference: reference

  destination:
    target_generation: reference
    schema_version: reference
    import_manifest: reference

  cutover:
    phase: durable_state
    legacy_admission_disabled: evidence_reference
    legacy_dispatch_fenced: evidence_reference
    legacy_handles_reconciled: evidence_reference
    storage_barrier: evidence_reference
    authority_binding: evidence_reference

  safety:
    revocation_watermark: reference
    retention_watermark: reference
    pending_external_effects: []
    recovery_checkpoint: reference
    reconciliation_status: reference
```

Se trata de un contrato semántico. No selecciona tablas, librerías ni una API existente.

### **6.4. Máquina de estados durable**

\#chatgpt-mermaid-\_r_1se\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1se\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1se\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1se\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1se\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1se\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1se\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1se\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1se\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1se\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1se\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1se\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1se\_ p{margin:0;}#chatgpt-mermaid-\_r_1se\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_1se\_ .label text,#chatgpt-mermaid-\_r_1se\_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ .node rect,#chatgpt-mermaid-\_r_1se\_ .node circle,#chatgpt-mermaid-\_r_1se\_ .node ellipse,#chatgpt-mermaid-\_r_1se\_ .node polygon,#chatgpt-mermaid-\_r_1se\_ .node path{fill:rgb(19, 33, 54);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .rough-node .label text,#chatgpt-mermaid-\_r_1se\_ .node .label text,#chatgpt-mermaid-\_r_1se\_ .image-shape .label,#chatgpt-mermaid-\_r_1se\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_1se\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .rough-node .label,#chatgpt-mermaid-\_r_1se\_ .node .label,#chatgpt-mermaid-\_r_1se\_ .image-shape .label,#chatgpt-mermaid-\_r_1se\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_1se\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_1se\_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1se\_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1se\_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-\_r_1se\_ .edgeLabel{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1se\_ .edgeLabel p{background-color:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1se\_ .edgeLabel rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1se\_ .labelBkg{background-color:rgba(14, 14, 14, 0.5);}#chatgpt-mermaid-\_r_1se\_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_1se\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1se\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_1se\_ .icon-shape,#chatgpt-mermaid-\_r_1se\_ .image-shape{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1se\_ .icon-shape p,#chatgpt-mermaid-\_r_1se\_ .image-shape p{background-color:rgb(14, 14, 14);padding:2px;}#chatgpt-mermaid-\_r_1se\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_1se\_ .image-shape .label rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1se\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_1se\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_1se\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1se\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1se\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1se\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1se\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1se\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1se\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1se\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1se\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1se\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_1se\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_1se\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .node rect,#chatgpt-mermaid-\_r_1se\_ .node circle,#chatgpt-mermaid-\_r_1se\_ .node ellipse,#chatgpt-mermaid-\_r_1se\_ .node polygon,#chatgpt-mermaid-\_r_1se\_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_1se\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_1se\_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_1se\_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_1se\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1se\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}LEGACY_ACTIVESHADOW_READ_ONLYCUTOVER_PREPAREDLEGACY_ADMISSION_FROZENLEGACY_DISPATCH_FENCEDSNAPSHOT_SEALEDIMPORT_STAGEDIMPORT_VERIFIEDNEW_AUTHORITY_COMMITTEDNEW_ACTIVERECOVERY_REQUIREDRECONCILE BARRIERSResume forward or remainblocked

Las transiciones representan estados durables y barreras verificadas. No basta registrar el estado deseado antes de comprobar el efecto externo.

### **6.5. Protocolo por transición**

| Estado                    | Obligación                                                      |
| ------------------------- | --------------------------------------------------------------- |
| `LEGACY_ACTIVE`           | Identificar autoridad actual y escritores conocidos             |
| `SHADOW_READ_ONLY`        | Comparar datos sin emitir efectos ni publicar como canónico     |
| `CUTOVER_PREPARED`        | Congelar manifiesto, autorización y perímetro de corte          |
| `LEGACY_ADMISSION_FROZEN` | Impedir nuevas admisiones del proyecto afectado                 |
| `LEGACY_DISPATCH_FENCED`  | Excluir nuevas operaciones legadas y reconciliar las existentes |
| `SNAPSHOT_SEALED`         | Obtener corte coherente de todos los datos aplicables           |
| `IMPORT_STAGED`           | Importar sin activar la nueva autoridad                         |
| `IMPORT_VERIFIED`         | Verificar contenido, relaciones, revisiones y custodia          |
| `NEW_AUTHORITY_COMMITTED` | Publicar binding generacional durable y exclusivo               |
| `NEW_ACTIVE`              | Admitir trabajo únicamente con nueva autoridad                  |
| `RECOVERY_REQUIRED`       | Impedir transiciones inseguras y reconstruir hechos observables |

### **6.6. Snapshot coherente**

Copiar individualmente seis archivos SQLite no acredita una instantánea coherente del proyecto.

Debe establecerse una barrera lógica común que incluya:

- Transacciones confirmadas.
- Estado WAL aplicable.
- Revisiones y manifiestos.
- Sesiones autorizadas cuando proceda.
- Archivos y artefactos asociados.
- Intenciones de efecto.
- Resultados y testigos.
- Revocaciones.
- Tombstones.
- Estado de retención.
- Reservas y reconciliaciones pendientes.

La API de backup de SQLite puede ayudar a obtener una copia consistente de una base individual, pero no proporciona por sí sola una transacción coordinada sobre todos los stores y archivos externos.

### **6.7. Exclusión efectiva del legado**

Este es el principal bloqueante.

El corte debe retirar o invalidar:

| Superficie            | Control exigido                                                     |
| --------------------- | ------------------------------------------------------------------- |
| Entrypoints antiguos  | Desregistro y ausencia de activación automática                     |
| Procesos existentes   | Identificación por proceso y generación, drenaje o corte autorizado |
| Hijos y descendientes | Inventario, supervisión y reconciliación                            |
| Handles abiertos      | Cierre comprobado o contención efectiva                             |
| Escrituras directas   | Denegación sobre recursos canónicos                                 |
| IPC antiguo           | Rechazo de generación obsoleta                                      |
| Grants                | Revocación o invalidación efectiva                                  |
| Sesiones              | Retirada, caducidad o invalidación según autoridad                  |
| Broker de red         | Rechazo de despachos legados                                        |
| Bóveda                | Negación de recuperación de credenciales por autoridad antigua      |
| Rutas alternativas    | Negación de recreación de escritor efectivo                         |

**Una versión antigua capaz de crear otra base de datos y operar nuevamente sobre el AUT representa un fallo del corte**, aunque no pueda modificar la nueva SQLite.

### **6.8. Límite del modelo de amenaza**

Debe distinguirse:

1. HOST no privilegiado que intenta eludir los contratos de QAP.
2. Proceso antiguo que conserva permisos ordinarios.
3. Operador autorizado que administra el sistema.
4. Administrador capaz de modificar ACL, ejecutar binarios privilegiados o acceder directamente al AUT.

No se prometerá que QAP pueda contener universalmente al administrador del equipo.

Asimismo, si existen credenciales empresariales independientes bajo control del usuario, QAP no puede garantizar que ese usuario jamás opere directamente sobre el AUT.

La garantía exigible es impedir que las rutas, identidades y recursos gobernados por QAP eludan su autoridad.

Cuando el perímetro empresarial requiera excluir también credenciales o accesos externos, deberá existir coordinación autorizada con el proveedor de identidad o administrador del destino.

### **6.9. Efectos tardíos**

Cerrar un proceso local no demuestra que una operación externa haya sido cancelada.

Durante el corte deberán preservarse:

- Identidad de la intención.
- Último estado acreditado.
- Correlación del efecto.
- Testigo disponible.
- Barrera durable por subefecto.
- Restricciones de reintento.
- Operación de reconciliación permitida.

La nueva autoridad podrá admitir ramas independientes, pero no repetir una mutación cuya materialización permanezca incierta.

Se conserva íntegramente AV-04.

### **6.10. Migración por clase de dato**

| Clase               | Garantía exigida                                       |
| ------------------- | ------------------------------------------------------ |
| Requisitos y reglas | Identidad, versión, autoridad y procedencia            |
| Knowledge           | Planos semánticos, relaciones y edición manual         |
| Casos y planes      | Intención, revisión y dependencias                     |
| Historial           | Identidad, intento, veredicto histórico y limitaciones |
| Evidencias          | Integridad, manifest, alcance y custodia               |
| Borradores          | Versiones y condición de no acreditación               |
| Revocaciones        | Conservación efectiva y no reactivación                |
| Tombstones          | No resurrección de identidades eliminadas              |
| Preferencias        | Ámbito y revisión                                      |
| Credenciales        | Referencias autorizadas o nuevo aprovisionamiento      |
| Índices FTS         | Reconstrucción a partir de fuentes canónicas           |
| Cachés              | Reutilización solo si se acredita vigencia             |

No se exige migrar secretos en claro ni recuperar contenido que haya sido eliminado legítimamente.

Un elemento activo no importable deberá permanecer registrado como brecha bloqueante de su capacidad. No puede omitirse silenciosamente.

### **6.11. Prevención de rollback de autoridad**

La restauración de un backup antiguo no deberá restaurar automáticamente:

- Grants revocados.
- Sesiones invalidadas.
- Perfiles eliminados.
- Artefactos expirados.
- Generaciones superadas.
- Permisos de captura anteriores.

Se necesita un mecanismo de watermark o journal durable que permita comprobar vigencia respecto de revocaciones y tombstones.

Debe encontrarse protegido frente al mismo fallo o rollback que afecta la copia restaurada. Guardarlo únicamente dentro del backup que puede retroceder sería insuficiente.

Si no es posible reconstruir el estado de revocación vigente, deberá fallarse cerrado y solicitarse una nueva autorización por el canal permitido.

### **6.12. Rollback antes y después de la activación**

| Momento                                 | Alternativa admisible                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Antes del freeze                        | Continuar bajo autoridad original vigente                                                        |
| Después del freeze, antes de activación | Reconciliar barreras; restaurar operación únicamente si conserva seguridad y autoridad           |
| Después de commit de nueva generación   | Recuperación hacia delante                                                                       |
| Después de primeras escrituras nuevas   | Recuperación hacia delante o transformación inversa acreditada, preservando datos y revocaciones |

No se autoriza volver al escritor inseguro únicamente porque el binario antiguo continúa disponible.

El rollback del paquete y el rollback de la autoridad son operaciones diferentes.

### **6.13. Experimentos requeridos**

| ID      | Control                                 | Criterio                                              |
| ------- | --------------------------------------- | ----------------------------------------------------- |
| CV41-01 | Dos procesos de admisión                | Una sola autoridad efectiva                           |
| CV41-02 | Proyecto A/B con base compartida        | Exclusión correcta sin modificar autoridad ajena      |
| CV41-03 | Caída entre freeze y snapshot           | Recuperación durable sin reapertura automática        |
| CV41-04 | Caída entre import y binding            | Destino no activado prematuramente                    |
| CV41-05 | Caída inmediatamente después del commit | Recuperar generación correcta                         |
| CV41-06 | Binario antiguo ejecutado manualmente   | Sin acceso a autoridad canónica ni despacho gobernado |
| CV41-07 | Recreación de base en otra ruta         | No recuperar capacidad de despacho                    |
| CV41-08 | Hijo legado superviviente               | Detectar, contener y reconciliar                      |
| CV41-09 | IPC stale                               | Rechazo de generación                                 |
| CV41-10 | Efecto externo tardío                   | Sin duplicación                                       |
| CV41-11 | Restore de backup previo a revocación   | Revocación conservada                                 |
| CV41-12 | Tombstone anterior al snapshot          | Sin resurrección                                      |
| CV41-13 | Retroceso de reloj                      | Sin extensión indebida de retención o permisos        |
| CV41-14 | Artefacto corrupto                      | Rechazo e informe                                     |
| CV41-15 | Dato activo no importable               | Brecha visible y bloqueo correspondiente              |
| CV41-16 | Escrituras posteriores a activación     | Sin pérdida al recuperar                              |
| CV41-17 | Edición manual protegida                | Contenido, revisión y procedencia preservados         |
| CV41-18 | Proyecto ajeno en ejecución             | Sin terminación ni mutación indebida de sus recursos  |

### **6.14. G6.5 sin circularidad de migración**

La validación empresarial autorizada de G6.5 puede utilizar:

- Una copia consistente.
- Un entorno QA empresarial expresamente autorizado.
- Un workspace y repositorio canónico nuevos.
- Identidades de prueba separadas.

No requiere efectuar previamente el corte irreversible de la instalación histórica.

El corte real será una operación posterior, con autorización específica, manifiesto vigente y pruebas E2/G5 más la aceptación G6/G6.5 que corresponda.

### **6.15. Enmienda vinculante CV07-02**

> La migración utilizará una máquina de estados durable con identidades de instalación, proyecto, operación y generación. La exclusión del legado comprenderá almacenamiento, admisión, despacho, procesos, sesiones, grants, IPC y brokers gobernados. El corte no será válido si el binario anterior conserva capacidad efectiva de operación. Se preservarán revocaciones, tombstones, retención y barreras por efecto externo ante caída y restauración. La migración verificará cada clase de dato y su semántica. El rollback no podrá reactivar autoridad insegura ni descartar escrituras posteriores. G6.5 podrá acreditarse en copia o entorno empresarial autorizado, antes de un corte real expresamente autorizado.

**Dictamen O2:** contrato arquitectónico favorable con enmiendas. **AR-41 permanece BLOQUEANTE.**

## **7. O3 — AR-19: compuertas y eliminación de circularidad**

### **7.1. Hallazgo principal**

La estructura de compuertas propuesta por Codex resulta aceptable como orden de acreditación de resultados.

Sin embargo, no debe interpretarse que todo trabajo de una compuerta posterior necesita esperar a la finalización completa de la anterior.

Se distinguen:

- Precedencia documental.
- Dependencia real de artefactos.
- Selección tecnológica preliminar.
- Integración.
- Acreditación experimental.
- Certificación.
- Activación.

### **7.2. Preservación de EXP-01a en G0**

La [decisión AV-06 y encargo AV-07](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/decision-orquestador-av06-encargo-av07.md?utm_source=chatgpt.com) conserva expresamente EXP-01a antes del cierre de G0.

No puede desplazarse íntegramente a G1 alegando que el producto todavía no está construido.

La prueba de G0 deberá utilizar un artefacto mínimo controlado que permita verificar:

| Propiedad                      | Artefacto mínimo                            |
| ------------------------------ | ------------------------------------------- |
| Negociación                    | Servidor MCP candidato                      |
| Descubrimiento de herramientas | Catálogo mínimo tipado                      |
| Probes                         | Transporte real sin activación de autoridad |
| Handoff                        | Ejecutor mínimo fuera del árbol del HOST    |
| Durabilidad                    | Cola o checkpoint de fixture                |
| Revocación                     | Autoridad sintética y observable            |
| Compatibilidad                 | Los cuatro hosts reales D13                 |
| Terminación                    | Supervisor experimental independiente       |

No se exige construir previamente el núcleo completo de G1.

Tampoco se acepta sustituir el handoff por una respuesta simulada del servidor. El artefacto mínimo deberá ejecutar y demostrar la propiedad técnica bajo el HOST real.

G1 y G5 repetirán estas verificaciones sobre el producto progresivamente integrado e instalado.

### **7.3. Calificaciones tempranas obligatorias**

| Expediente             | G0                                               | Repetición posterior  |
| ---------------------- | ------------------------------------------------ | --------------------- |
| EXP-01a                | Calificación real de hosts y mecanismo candidato | G1/G5                 |
| EXP-05a                | Proveedor, broker y frontera de operaciones      | Integración G3        |
| EXP-06a                | Factibilidad preventiva de captura y custodia    | EXP-06c/E6            |
| EXP-07, componente KEK | Factibilidad de custodia y frontera de principal | E2/G1/G5              |
| Runtime y SQLite       | Calificación de candidatos                       | G1/G5                 |
| E1                     | Contratos y arquitectura verificable             | Integración posterior |

La factibilidad no equivale a certificación de producto.

### **7.4. DAG de dependencias corregido**

\#chatgpt-mermaid-\_r_1sh\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1sh\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1sh\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1sh\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1sh\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1sh\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1sh\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1sh\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1sh\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1sh\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1sh\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1sh\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1sh\_ p{margin:0;}#chatgpt-mermaid-\_r_1sh\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_1sh\_ .label text,#chatgpt-mermaid-\_r_1sh\_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ .node rect,#chatgpt-mermaid-\_r_1sh\_ .node circle,#chatgpt-mermaid-\_r_1sh\_ .node ellipse,#chatgpt-mermaid-\_r_1sh\_ .node polygon,#chatgpt-mermaid-\_r_1sh\_ .node path{fill:rgb(19, 33, 54);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .rough-node .label text,#chatgpt-mermaid-\_r_1sh\_ .node .label text,#chatgpt-mermaid-\_r_1sh\_ .image-shape .label,#chatgpt-mermaid-\_r_1sh\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_1sh\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .rough-node .label,#chatgpt-mermaid-\_r_1sh\_ .node .label,#chatgpt-mermaid-\_r_1sh\_ .image-shape .label,#chatgpt-mermaid-\_r_1sh\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_1sh\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_1sh\_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1sh\_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1sh\_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-\_r_1sh\_ .edgeLabel{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1sh\_ .edgeLabel p{background-color:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1sh\_ .edgeLabel rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1sh\_ .labelBkg{background-color:rgba(14, 14, 14, 0.5);}#chatgpt-mermaid-\_r_1sh\_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_1sh\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1sh\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_1sh\_ .icon-shape,#chatgpt-mermaid-\_r_1sh\_ .image-shape{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1sh\_ .icon-shape p,#chatgpt-mermaid-\_r_1sh\_ .image-shape p{background-color:rgb(14, 14, 14);padding:2px;}#chatgpt-mermaid-\_r_1sh\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_1sh\_ .image-shape .label rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1sh\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_1sh\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_1sh\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1sh\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1sh\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1sh\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1sh\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1sh\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1sh\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1sh\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1sh\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1sh\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_1sh\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_1sh\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .node rect,#chatgpt-mermaid-\_r_1sh\_ .node circle,#chatgpt-mermaid-\_r_1sh\_ .node ellipse,#chatgpt-mermaid-\_r_1sh\_ .node polygon,#chatgpt-mermaid-\_r_1sh\_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_1sh\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_1sh\_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_1sh\_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_1sh\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1sh\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Contratos AV-01 a AV-07aceptadosG0 Calificaciones previasG1 Vertical instaladaG2 Discovery EXP-02G2 Documentos EXP-06bG3 Conectores EXP-05bG3 Medios EXP-06cG3 Concurrencia EXP-03Integración de capacidadesG4 Contexto y adopciónEXP-01bG5 Paquete y matriz instaladaG6 Ciego independiente E8G6.5 Empresarial autorizadoDecisión GA

El grafo no autoriza comenzar ninguna actividad.

Las flechas representan dependencias de resultados acreditados. El diseño o preparación permitida de una rama podrá adelantarse únicamente cuando no presuponga capacidades todavía no verificadas.

### **7.5. Secuencia por salida y decisión**

| Compuerta | Salida exigida                                               | No acredita todavía                    |
| --------- | ------------------------------------------------------------ | -------------------------------------- |
| G0        | Contratos y factibilidad de componentes críticos             | Producto completo                      |
| G1        | Vertical local instalada y gobernada                         | Cobertura completa                     |
| G2        | Discovery y capacidades documentales seleccionadas por clase | Aceptación empresarial                 |
| G3        | Integración funcional, concurrencia, conectores y medios     | Matriz instalada completa              |
| G4        | Contexto, adopción y continuidad evaluables                  | Porcentajes de aceptación              |
| G5        | Distribución instalada y repeticiones por celda              | Corpus ciego aprobado                  |
| G6        | Validación independiente ciega                               | Aceptación empresarial                 |
| G6.5      | Validación empresarial autorizada                            | Autorización automática de lanzamiento |
| GA        | Decisión de liberación del producto                          | Permisos empresariales universales     |

### **7.6. Cardinalidad del corpus ciego**

Existe una diferencia documental entre el plan histórico y la propuesta posterior de Neon.

El plan histórico utiliza tres aplicaciones desconocidas.

La [auditoría de Neon, L387](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/auditoria-neon.md?utm_source=chatgpt.com#L387) propone cuatro aplicaciones, o tres aplicaciones ricas que cubran conjuntamente cuatro perfiles.

No corresponde resolver esta discrepancia mediante una selección unilateral.

La formulación correcta es:

> El corpus de aceptación deberá cubrir todos los perfiles funcionales, tecnológicos y adversariales exigidos. La cardinalidad exacta, distribución del corpus y umbrales quedan sujetos a DE-03 y AV-08.

Los valores históricos 80 % de Discovery y 75 % de verificación de efectos no se convierten en umbrales ratificados por este informe.

Tampoco se adoptan automáticamente los porcentajes superiores propuestos posteriormente.

### **7.7. Contradicción V-01–V-16 frente a V-01–V-18**

La documentación histórica contiene referencias a dieciséis vectores, mientras la [auditoría Neon, L191](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/auditoria-neon.md?utm_source=chatgpt.com#L191) menciona V-01–V-18.

No se ha acreditado en esta revisión una definición independiente y completa de V-17 y V-18.

No deben inventarse sus contenidos.

El registro deberá declarar esta discontinuidad de trazabilidad y exigir identificación de:

- Vector original.
- Obligación correspondiente.
- Evidencia recuperada.
- Sustitución posterior, si existe.
- Procedencia del nuevo vector.
- Condición de aceptación.

La matriz vigente de 92 elementos y 11 ampliaciones no puede depender de que esos dos identificadores históricos sean recuperables.

### **7.8. Enmienda vinculante CV07-03**

> Las compuertas expresarán dependencias de artefactos y resultados acreditados, no una prohibición general de trabajo paralelo. EXP-01a, EXP-05a, EXP-06a y las calificaciones tempranas aceptadas conservarán su posición en G0 mediante artefactos mínimos reales. G1 y G5 repetirán sobre producto instalado. G6 ciego y G6.5 empresarial autorizado permanecerán separados. El corte real no será prerrequisito circular de G6.5. La cardinalidad del corpus, los umbrales y las referencias históricas incompletas se elevarán a DE-03/AV-08 sin ratificación unilateral.

**Dictamen O3:** favorable con enmienda. AR-19 conserva estado PENDIENTE.

## **8. O4 — AR-21 y AR-23: runtime, versiones y compatibilidad**

### **8.1. Identidad del lock**

Se verificó el archivo:

[pnpm-lock.yaml del SHA auditado](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/pnpm-lock.yaml?utm_source=chatgpt.com).

Blob Git: `3520bac21ed8135cf4772917235f735cbee7947d`.

La resolución confirma la coexistencia de varias versiones de Playwright y del SDK MCP.

### **8.2. Versiones relevantes**

| Componente            | Resolución o candidato  | Estado                |
| --------------------- | ----------------------- | --------------------- |
| Playwright Core       | 1.62.1                  | Presente en lock      |
| Playwright Core       | 1.63.0                  | Presente en lock      |
| Playwright Core alpha | 1.63.0-alpha-2026-08-31 | Presente en lock      |
| Playwright alpha      | 1.63.0-alpha-2026-08-31 | Presente en lock      |
| Playwright MCP        | 0.0.80                  | Presente en lock      |
| Playwright Core       | 1.65.1                  | Candidato             |
| MCP SDK               | 1.30.0 y 1.30.1         | Presentes en lock     |
| MCP SDK v1            | 1.32.2                  | Candidato             |
| MCP SDK v2            | 2.4.0                   | Candidato             |
| TypeScript            | 5.5.4                   | Resolución documental |
| Commander             | 15.0.0                  | Presente              |
| Inquirer Prompts      | 8.7.0                   | Presente              |
| Node                  | 24.22.3 y 26.13.1       | Candidatos            |

Las referencias nuevas de SDK y Playwright no se encuentran seleccionadas para QAP por aparecer en esta tabla.

### **8.3. Incompatibilidad del target Node 18**

La configuración de compilación conserva target `node18`.

Sin embargo:

- Playwright Core examinado declara Node ≥20.
- Commander 15.0.0 declara Node ≥22.12.
- Inquirer Prompts 8.7.0 impone restricciones adicionales según rama de Node.
- El almacenamiento utiliza `node:sqlite`.
- Existe una comprobación explícita de FTS5.

El target del compilador no representa el runtime mínimo real.

**Node 18 no debe seguir documentándose como plataforma operativa suficiente.**

### **8.4. Node y SQLite verificados**

Se recuperaron las fuentes versionadas de Node 24.22.3 y 26.13.1.

Ambos árboles consultados declaran SQLite 3.54.1 en el archivo correspondiente de SQLite.

| Runtime      | SQLite declarada en fuente | Identificación    |
| ------------ | -------------------------- | ----------------- |
| Node 24.22.3 | 3.54.1                     | Fuente versionada |
| Node 26.13.1 | 3.54.1                     | Fuente versionada |

Fuentes:

- [Node 24.22.3 — sqlite3.h](https://github.com/nodejs/node/blob/v24.22.3/deps/sqlite/sqlite3.h?utm_source=chatgpt.com).
- [Node 26.13.1 — sqlite3.h](https://github.com/nodejs/node/blob/v26.13.1/deps/sqlite/sqlite3.h?utm_source=chatgpt.com).

El blob de cabecera consultado coincide:

`30d431bc34ae21b25cb1906ca0b88cbb5d2b3ac2`.

La identidad SQLite declarada incluye:

```
2026-10-16 14:45:20
555e07ef33f69a0957d24d8e555b702464a131d6f1607f4c3c1e4551e8e6ca76
```

**Limitación:** esto acredita la fuente incorporada al árbol consultado. No acredita que todos los binarios comerciales, compilaciones personalizadas o distribuciones de esos runtimes incorporen exactamente las mismas opciones.

### **8.5. Corrección WAL**

La selección deberá tener en cuenta la corrección del defecto WAL-reset documentado por SQLite.

Las referencias corregidas incluyen SQLite 3.51.3 y los backports correspondientes de las ramas 3.44.6 y 3.50.7.

No debe implementarse una condición genérica del tipo «versión superior a 3.44.6», porque incluiría versiones de otras ramas que podrían no contener la corrección.

Fuente: [documentación oficial SQLite WAL](https://sqlite.org/wal.html?utm_source=chatgpt.com).

La admisión requerirá comprobar versión efectiva, procedencia y corrección aplicable a la rama real.

### **8.6. Durabilidad real de los stores**

| Store                    | Configuración observada                    |
| ------------------------ | ------------------------------------------ |
| App Service              | WAL y `synchronous=NORMAL`                 |
| Knowledge                | WAL y `synchronous=FULL`                   |
| Interview Draft          | WAL y `synchronous=FULL`                   |
| Module Closure           | WAL y `synchronous=FULL`                   |
| Coordinación de proyecto | Transacción exclusiva según ruta examinada |

Fuentes:

- [app-service-store.ts L549–565](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/src/application/app-service-store.ts?utm_source=chatgpt.com#L549-L565).
- [sqlite-knowledge-adapter.ts L149–156](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts?utm_source=chatgpt.com#L149-L156).
- [interview-draft-store.ts](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/src/handlers/interview-draft-store.ts?utm_source=chatgpt.com).
- [module-closure-store.ts](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/packages/mcp/src/handlers/module-closure-store.ts?utm_source=chatgpt.com).

Se preserva AV-03:

- Autoridad, revocación, intención, publicación y otros hechos no reconstruibles requieren durabilidad acreditada antes del ACK correspondiente.
- Índices y cachés reconstruibles podrán utilizar garantías inferiores cuando su reconstrucción sea demostrable.
- Una terminación de proceso no equivale a una pérdida de energía o un fallo del almacenamiento.

### **8.7. SQLite síncrono y aislamiento de transporte**

La utilización de `DatabaseSync` puede bloquear el hilo que lo ejecuta.

El núcleo deberá evitar que consultas, backups, migraciones o esperas de locks produzcan bloqueo indefinido del transporte Stdio.

Alternativas:

| Alternativa                             | Dictamen                                                   |
| --------------------------------------- | ---------------------------------------------------------- |
| SQLite síncrono dentro del handler MCP  | No recomendado                                             |
| Worker dedicado de persistencia         | Candidato principal                                        |
| Proceso de repositorio separado         | Alternativa válida si beneficia aislamiento o recuperación |
| Driver alternativo, como better-sqlite3 | Comparador sujeto a ABI, distribución y licencia           |

Un worker dedicado no deberá convertirse en una autoridad independiente por cada conexión.

Se conserva una autoridad lógica, incluso cuando existan conexiones de lectura o trabajadores auxiliares.

### **8.8. Doctor de runtime**

El doctor deberá comprobar funcionalmente:

| Capacidad     | Comprobación                                            |
| ------------- | ------------------------------------------------------- |
| Runtime       | Identidad, arquitectura y ruta efectiva del proceso     |
| SQLite        | Versión, source ID y opciones relevantes                |
| FTS5          | Crear, insertar, consultar y validar resultado          |
| Transacciones | Commit, rollback y aislamiento                          |
| Durabilidad   | Configuración efectiva por clase de dato                |
| Recuperación  | Backup, restore y revisión                              |
| Migraciones   | Versiones soportadas y rechazo de futuras incompatibles |
| Disco         | Espacio, escritura y fallo controlado                   |
| Locking       | Competencia, timeout y liberación                       |
| Transporte    | Ausencia de bloqueo indebido de Stdio                   |
| Native addons | ABI, arquitectura y carga real                          |

No basta comprobar que `node:sqlite` puede importarse o que una opción de compilación existe.

### **8.9. Soporte por plataforma**

Las fuentes de compilación de Node distinguen sistemas y arquitecturas con distintos niveles de soporte.

- [BUILDING.md de Node 24.22.3](https://github.com/nodejs/node/blob/v24.22.3/BUILDING.md?utm_source=chatgpt.com).
- [BUILDING.md de Node 26.13.1](https://github.com/nodejs/node/blob/v26.13.1/BUILDING.md?utm_source=chatgpt.com).

Por ejemplo, Linux x64/ARM64 con glibc y distribuciones musl no deben considerarse automáticamente equivalentes.

El soporte operativo de QAP será la intersección de:

\\[ C\_{\text{QAP}}= C\_{\text{Node}}\cap C\_{\text{navegador}}\cap C\_{\text{nativos}}\cap C\_{\text{seguridad}}\cap C\_{\text{host}} \\]

La expresión representa intersección de capacidades verificadas, no una garantía numérica.

La vida de soporte futura deberá verificarse al seleccionar cada versión. No se fijará un runtime únicamente porque su rama tenga etiqueta LTS.

### **8.10. Revisión Playwright**

Se conservan las identidades estables verificadas previamente en AV-06.

| Versión | Chromium/Shell       | Firefox      | WebKit      | FFmpeg |
| ------- | -------------------- | ------------ | ----------- | ------ |
| 1.62.1  | 1234 / 151.0.7922.34 | 1538 / 153.0 | 2336 / 26.5 | 1011   |
| 1.63.0  | 1243 / 153.0.8010.12 | 1543 / 155.0 | 2359 / 26.6 | 1011   |
| 1.65.1  | 1255 / 159.0.8154.6  | 1572 / 159.0 | 2388 / 27.2 | 1013   |

Se recuperó independientemente en esta contravalidación el descriptor:

[Playwright 1.65.1 — browsers.json](https://github.com/microsoft/playwright/blob/v1.65.1/packages/playwright-core/browsers.json?utm_source=chatgpt.com).

Blob Git: `e5d6c38dd60ece377e57518c8b20795a24a91e37`.

Se conserva el override WebKit 2251 para macOS 14 en las configuraciones correspondientes.

El descriptor de navegador no acredita la instalación, arquitectura efectiva, fidelidad o captura.

### **8.11. Resolución de la alpha de AV-06**

El lock confirma:

```
@playwright/mcp@0.0.80
  playwright@1.63.0-alpha-2026-08-31
  playwright-core@1.63.0-alpha-2026-08-31
```

Fuente: [pnpm-lock.yaml L3339–3342](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/pnpm-lock.yaml?utm_source=chatgpt.com#L3339-L3342).

También se recuperó el SRI esperado de Playwright Core alpha desde el lock:

```
sha512-1ek0Lyr12h6jcs/WTcNoVtzZkQp7D/90PsMuBW/Rm6h3AsWAbzpqj0geMv8+8Tzzr9CSUYvg9kznrVZINQMXXw==
```

**Limitación material:** no pude obtener independientemente los bytes del tarball alpha ni su registry y `browsers.json` exactos. La referencia Git consultada tampoco permitió recuperar ese artefacto.

Por tanto:

- Se acredita su presencia e integridad esperada declarada en el lock.
- No se acredita el digest calculado sobre sus bytes.
- No se acredita independientemente su descriptor completo ni sus overrides.
- No se ratifica su instalación o uso efectivo.

#### **Resolución recomendada**

Evaluar la retirada de `@playwright/mcp` como dependencia de producto cuando se compruebe que no es necesaria para las capacidades vigentes.

La retirada no se autoriza ahora.

Deberá cumplir:

1. Inventario completo de imports y cargas dinámicas.
2. Metafile del bundle.
3. Verificación de dependencias instaladas.
4. Pruebas de ausencia de regresión MCP.
5. Matriz de navegadores y modalidades.
6. Conservación de Discovery, ejecución, accesibilidad y evidencia.

Si el puente resulta indispensable, se deberá completar la verificación del artefacto o seleccionar una alternativa estable acreditada.

**La alpha no queda aprobada.** La objeción puede resolverse contractualmente mediante retirada condicionada, sin declarar verificados bytes inaccesibles.

### **8.12. MCP SDK v1 frente a v2**

| Alternativa                          | Ventaja                                       | Riesgo                                       |
| ------------------------------------ | --------------------------------------------- | -------------------------------------------- |
| Mantener v1 actual                   | Menor cambio                                  | Versiones antiguas y avisos aplicables       |
| Actualizar a v1 candidata corregida  | Compatibilidad potencial con hosts existentes | Requiere calificación y pruebas de regresión |
| Migrar a v2                          | Arquitectura y protocolo más recientes        | Cambios de API, negociación y compatibilidad |
| Puerto propio sobre SDK reemplazable | Aísla al dominio de la versión                | Coste de mantenimiento del adaptador         |

No se recomienda adoptar v2 únicamente por ser más reciente.

La selección deberá conservar la negociación de las revisiones de protocolo utilizadas realmente por:

- Antigravity.
- Codex.
- Claude Code.
- Gemini CLI.

Las revisiones modernas y legacy deberán registrarse como configuraciones distintas.

Fuentes:

- [Repositorio oficial TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk?utm_source=chatgpt.com).
- [Releases oficiales](https://github.com/modelcontextprotocol/typescript-sdk/releases?utm_source=chatgpt.com).
- [Especificación MCP 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25?utm_source=chatgpt.com).

### **8.13. EXP-01a corregido**

La matriz por host deberá acreditar:

| Propiedad            | Control                                          |
| -------------------- | ------------------------------------------------ |
| Bootstrap            | Binario y configuración efectiva                 |
| `initialize`         | Revisión negociada                               |
| Descubrimiento       | Catálogo y esquemas                              |
| Probes               | Cero grants, escrituras o activaciones indebidas |
| Operación autorizada | Resultado canónico                               |
| Operación denegada   | Resultado tipado y sin efectos                   |
| Handoff              | Continuidad hacia ejecutor independiente         |
| Reconexión           | Recuperación de estado y revisiones              |
| Terminación HOST     | Supervivencia o recuperación contractual         |
| Salida               | Paridad semántica con CLI                        |

La existencia de CLI alternativa no sustituye la cobertura MCP de ninguno de los cuatro hosts.

No se habilitará transporte HTTP remoto como consecuencia de migrar SDK.

### **8.14. Enmienda vinculante CV07-04**

> El runtime y las dependencias serán seleccionados mediante identidad efectiva, soporte por plataforma, doctor funcional, durabilidad, aislamiento y pruebas de distribución. El target de compilación no acreditará compatibilidad operativa. SQLite utilizará una autoridad lógica común y no bloqueará indebidamente el transporte. Las versiones corregidas por rama deberán verificarse explícitamente. La alpha conservará estado no aprobado hasta verificar sus bytes o acreditar su retirada sin regresión. La selección de SDK MCP preservará los cuatro hosts D13, las eras de protocolo aplicables y EXP-01a en G0, G1 y G5.

**Dictamen O4:** favorable como estrategia de selección. AR-21 y AR-23 permanecen PENDIENTES.

## **9. O5 — AR-33: distribución, bootstrap, supervisor y navegación visible**

### **9.1. Paquetes actualmente declarados publicables**

| Entrada             | Versión declarada | Binario   |
| ------------------- | ----------------- | --------- |
| `@hyouka73/qap-cli` | 2.1.3             | `qap`     |
| `@qap/mcp`          | 2.1.3             | `qap-mcp` |

Los otros ocho paquetes internos permanecen declarados privados.

La raíz también es privada.

No se verificó independientemente la disponibilidad de los dos paquetes públicos como artefactos instalables de registry en esta revisión.

La respuesta 404 consignada por Codex conserva su alcance histórico. No demuestra por sí sola inexistencia global, ni garantiza que otros registries o permisos produzcan el mismo resultado.

### **9.2. Riesgo de distribución MCP**

MCP declara dependencias workspace privadas.

CLI intenta incluir los paquetes internos mediante su configuración de bundle.

Por ello, instalar desde el monorepo y ejecutar satisfactoriamente no acredita que el paquete pueda instalarse en un equipo limpio.

Debe comprobarse el cierre de dependencias de cada artefacto.

### **9.3. Alternativas de distribución**

| Alternativa                                      | Beneficio                                   | Riesgo                                                |
| ------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------- |
| Paquete npm con Node instalado                   | Menor duplicación inicial                   | Runtime no homogéneo                                  |
| Bootstrap con Node seleccionado bajo demanda     | Mayor control y modularidad                 | Aprovisionamiento adicional                           |
| Runtime embebido                                 | Reproducibilidad y experiencia simplificada | Mayor tamaño y responsabilidad de actualización       |
| Paquete nativo por SO                            | Integración con gestores y firma            | Coste de mantenimiento por variante                   |
| Distribución autocontenida con todos los motores | Disponibilidad offline inmediata            | Huella inicial elevada                                |
| Base ligera y capacidades bajo demanda           | Menor instalación inicial potencial         | Requiere catálogo, caché y aprovisionamiento robustos |

Se recomienda evaluar **base ligera con aprovisionamiento por capacidad**, preservando una variante offline preaprovisionada.

No se garantiza que resulte más ligera hasta medir todos los componentes necesarios.

### **9.4. Bootstrap reproducible**

El bootstrap deberá:

1. Resolver plataforma y arquitectura.
2. Seleccionar versión autorizada de QAP.
3. Verificar autenticidad del manifiesto.
4. Verificar integridad de los artefactos.
5. Comprobar dependencias efectivas.
6. Ejecutar únicamente lifecycle scripts admitidos.
7. Preparar el slot candidato.
8. Ejecutar doctor funcional.
9. Promover la referencia activa.
10. Registrar MCP mediante una ruta estable y verificable.

No se recomienda registrar comandos `npx` flotantes que puedan resolver una versión diferente al iniciar una sesión ordinaria.

### **9.5. Identidad de distribución**

```
distribution_manifest:
  qap_release: exact_version
  source_commit: exact_sha
  build_recipe: reference
  build_toolchain: reference

  target:
    operating_system: reference
    architecture: reference
    runtime_identity: reference

  components: []
  native_dependencies: []
  optional_capabilities: []
  artifact_digests: []
  trust_anchor: reference
  sbom_reference: reference
  compatibility_manifest: reference

  activation:
    slot: reference
    generation: reference
    previous_compatible_slot: reference_or_absent
```

La firma o ancla de confianza deberá vincular el manifiesto al distribuidor legítimo.

Un SHA almacenado junto a un archivo descargado de la misma fuente no representa automáticamente una comprobación independiente de autenticidad.

### **9.6. Reproducibilidad y paquete limpio**

La prueba futura deberá generar o inspeccionar el paquete distribuible y verificar su instalación fuera del repositorio.

| Control                         | Resultado exigido                                 |
| ------------------------------- | ------------------------------------------------- |
| Instalación fuera del workspace | Sin dependencia implícita del árbol fuente        |
| Dependencias privadas           | Incluidas o resueltas legítimamente               |
| Imports dinámicos               | Cierre completo por capacidad                     |
| Assets                          | Presencia e identidad                             |
| Binarios                        | Arquitectura y procedencia                        |
| Scripts                         | Inventario y autorización                         |
| Arranque ordinario              | Sin descargas imprevistas                         |
| Sin red                         | Capacidades previamente provisionadas funcionales |
| Proxy y CA                      | Compatibilidad sin desactivar TLS                 |
| Actualización                   | Promoción recuperable                             |
| Rollback                        | Sin downgrade inseguro ni pérdida de autoridad    |

No se ha ejecutado `npm pack`, instalación o build durante esta auditoría.

### **9.7. Lifecycle scripts**

El workspace contempla permisos de compilación para componentes como esbuild y keytar.

Estos componentes deberán formar parte del inventario de aprovisionamiento efectivo.

La admisión de un lifecycle script requiere determinar:

- Procedencia.
- Operaciones esperadas.
- Descargas.
- Binarios producidos.
- Acceso al filesystem.
- Dependencias de compilación.
- Privilegios.
- Alternativa precompilada o verificada.

No se deshabilitarán indiscriminadamente los scripts y luego se declarará instalación funcional sin comprobar las capacidades resultantes.

### **9.8. Actualización por slot**

\#chatgpt-mermaid-\_r_1ub\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_1ub\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1ub\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_1ub\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_1ub\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_1ub\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_1ub\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_1ub\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_1ub\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_1ub\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1ub\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1ub\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-\_r_1ub\_ p{margin:0;}#chatgpt-mermaid-\_r_1ub\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-\_r_1ub\_ .label text,#chatgpt-mermaid-\_r_1ub\_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ .node rect,#chatgpt-mermaid-\_r_1ub\_ .node circle,#chatgpt-mermaid-\_r_1ub\_ .node ellipse,#chatgpt-mermaid-\_r_1ub\_ .node polygon,#chatgpt-mermaid-\_r_1ub\_ .node path{fill:rgb(19, 33, 54);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .rough-node .label text,#chatgpt-mermaid-\_r_1ub\_ .node .label text,#chatgpt-mermaid-\_r_1ub\_ .image-shape .label,#chatgpt-mermaid-\_r_1ub\_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-\_r_1ub\_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .rough-node .label,#chatgpt-mermaid-\_r_1ub\_ .node .label,#chatgpt-mermaid-\_r_1ub\_ .image-shape .label,#chatgpt-mermaid-\_r_1ub\_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-\_r_1ub\_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-\_r_1ub\_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1ub\_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1ub\_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-\_r_1ub\_ .edgeLabel{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1ub\_ .edgeLabel p{background-color:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1ub\_ .edgeLabel rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1ub\_ .labelBkg{background-color:rgba(14, 14, 14, 0.5);}#chatgpt-mermaid-\_r_1ub\_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-\_r_1ub\_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_1ub\_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-\_r_1ub\_ .icon-shape,#chatgpt-mermaid-\_r_1ub\_ .image-shape{background-color:rgb(14, 14, 14);text-align:center;}#chatgpt-mermaid-\_r_1ub\_ .icon-shape p,#chatgpt-mermaid-\_r_1ub\_ .image-shape p{background-color:rgb(14, 14, 14);padding:2px;}#chatgpt-mermaid-\_r_1ub\_ .icon-shape .label rect,#chatgpt-mermaid-\_r_1ub\_ .image-shape .label rect{opacity:0.5;background-color:rgb(14, 14, 14);fill:rgb(14, 14, 14);}#chatgpt-mermaid-\_r_1ub\_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-\_r_1ub\_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-\_r_1ub\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_1ub\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_1ub\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_1ub\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_1ub\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1ub\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_1ub\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_1ub\_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1ub\_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-\_r_1ub\_ .node tspan[font-weight="normal"],#chatgpt-mermaid-\_r_1ub\_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-\_r_1ub\_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .node rect,#chatgpt-mermaid-\_r_1ub\_ .node circle,#chatgpt-mermaid-\_r_1ub\_ .node ellipse,#chatgpt-mermaid-\_r_1ub\_ .node polygon,#chatgpt-mermaid-\_r_1ub\_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-\_r_1ub\_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-\_r_1ub\_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-\_r_1ub\_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-\_r_1ub\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_1ub\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Slot activoAdquirir candidatoVerificar manifiesto yartefactosPreparar slot independienteDoctor y compatibilidadPromoción generacionalNueva versión activaRechazar candidato

Una actualización fallida no deberá alterar:

- Knowledge.
- Autoridad vigente.
- Revocaciones.
- Historial.
- Referencias de evidencia.
- Datos de proyectos ajenos.

El rollback deberá respetar compatibilidad de esquema y seguridad de la versión anterior.

### **9.9. Ejecutor independiente y navegación visible**

La mera separación de procesos no satisface AR-28 ni AR-42.

Se recomienda distinguir:

- Adaptador HOST.
- Broker de autorización.
- Ejecutor.
- Repositorio.
- Bóveda.
- Proceso de navegador.
- Superficie gráfica autorizada.
- Supervisor independiente.

El navegador deberá estar bajo una frontera compatible con su modalidad visible o headless.

### **9.10. Windows**

Un servicio Windows normalmente opera en un contexto diferente de la sesión gráfica interactiva.

Por ello, **ejecutar el navegador como servicio no demuestra que el operador pueda observar su ventana real en el escritorio**.

Alternativas candidatas:

| Arquitectura                                                   | Utilidad                | Reserva                                              |
| -------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| Supervisor bajo principal dedicado y sesión gráfica autorizada | Separación de autoridad | Requiere gestionar sesión interactiva y acceso       |
| Servicio supervisor con componente gráfico controlado          | Supervivencia al HOST   | No conceder acceso general a credenciales o archivos |
| VM local con consola interactiva                               | Separación fuerte       | Huella, edición, hardware y soporte                  |

Job Objects pueden contribuir a la administración de procesos, pero no constituyen por sí mismos aislamiento de filesystem, red, claves o captura.

Fuente: [Microsoft — Interactive Services](https://learn.microsoft.com/en-us/windows/win32/services/interactive-services?utm_source=chatgpt.com).

### **9.11. macOS**

Deben distinguirse:

- Daemon bajo `launchd`.
- Agente vinculado a una sesión gráfica.
- Proceso dedicado.
- Bóveda o broker de credenciales.
- Permisos de interacción y captura.

Un LaunchAgent puede proporcionar integración con la sesión gráfica, pero no garantiza independencia de autoridad respecto de otras aplicaciones del mismo usuario.

La ruta candidata deberá verificar IPC, identidad del proceso, permisos y acceso a los recursos protegidos.

Fuente: [Apple — Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html?utm_source=chatgpt.com).

### **9.12. Linux**

La evaluación deberá distinguir:

- Servicio supervisado.
- Usuario dedicado.
- Namespaces y controles de filesystem.
- Seccomp y cgroups cuando correspondan.
- Sesión X11 o Wayland.
- Broker de credenciales.
- Acceso gráfico autorizado.

No puede presumirse que un proceso con distinto UID pueda acceder de forma segura y funcional a cualquier sesión gráfica.

Tampoco debe otorgarse acceso general a un servidor X11 para resolver la visualización sin examinar sus consecuencias de seguridad.

Una VM local, una sesión gráfica separada o una frontera equivalente son candidatos cuando el escritorio compartido no permite satisfacer los requisitos.

### **9.13. Riesgo residual de la interfaz visible**

Existe una limitación material:

Si el HOST y el operador comparten un principal de escritorio capaz de capturar ventanas ajenas, mostrar contenido sensible en ese escritorio puede exponerlo al HOST.

Por tanto, no se puede prometer simultáneamente aislamiento absoluto de los píxeles y visualización irrestricta en cualquier escritorio compartido.

Las rutas deberán acreditar una separación apropiada, por ejemplo:

- Sesión gráfica dedicada.
- Consola de VM autorizada.
- Principal separado y permisos de presentación controlados.
- Superficie gráfica cuya exposición esté explícitamente incluida en la política.

La navegación visible seguirá siendo una capacidad obligatoria. No se sustituirá por un video grabado.

Si una celda obligatoria no dispone de una vía viable, se conserva su bloqueo y se eleva al propietario.

### **9.14. IPC autenticado**

El puerto local deberá verificar:

- Identidad del cliente.
- Identidad del servidor.
- Generación de autoridad.
- Operación solicitada.
- Scope y principal.
- Vigencia y revocación.
- Tamaño y esquema.
- Correlación.
- Protección frente a replay.
- Derechos sobre handles y recursos transferidos.

La existencia de un socket local, named pipe o nombre aleatorio no demuestra autenticación suficiente.

### **9.15. Credenciales nativas**

El hecho de utilizar un almacén de credenciales del SO no acredita por sí solo separación respecto de otro proceso ejecutado bajo el mismo principal.

Se necesita una frontera que determine quién puede:

- Solicitar una referencia.
- Resolver una sesión.
- Usar una credencial.
- Revocarla.
- Recuperarla después de reinicio.

El HOST no deberá recibir el secreto material como solución de integración.

### **9.16. Experimentos de supervisor**

| ID      | Control                          | Aceptación                               |
| ------- | -------------------------------- | ---------------------------------------- |
| CV33-01 | Terminar HOST                    | Trabajo determinista admitido conservado |
| CV33-02 | Terminar ejecutor                | Recuperación sin duplicación             |
| CV33-03 | Reiniciar supervisor             | Identidad y generación reconciliadas     |
| CV33-04 | Navegación visible               | Ventana real observable bajo autoridad   |
| CV33-05 | Navegación headless              | Funcionalidad y evidencia autorizada     |
| CV33-06 | HOST intenta abrir repositorio   | Denegación                               |
| CV33-07 | HOST intenta obtener secreto     | Denegación                               |
| CV33-08 | IPC servidor falso               | Rechazo                                  |
| CV33-09 | IPC replay                       | Rechazo                                  |
| CV33-10 | Sesión gráfica bloqueada         | Diagnóstico y comportamiento seguro      |
| CV33-11 | Revocación durante ejecución     | Corte y reconciliación                   |
| CV33-12 | Actualización con tareas activas | Conservación de estado                   |
| CV33-13 | Descendiente superviviente       | Supervisión y cleanup                    |
| CV33-14 | Intento sobre recurso ajeno      | Sin terminación ni modificación          |

### **9.17. Enmienda vinculante CV07-05**

> La distribución se calificará mediante paquete reproducible fuera del monorepo y manifiesto autenticado por variante. Se distinguirán dependencias declaradas, incorporadas y efectivas, y se evitarán registros flotantes y descargas ordinarias no previstas. El supervisor deberá conservar la independencia del ejecutor y una frontera verificable de autoridad, almacenamiento, credenciales y despacho. La navegación visible requerirá una superficie gráfica real autorizada y no podrá sustituirse por video. Las limitaciones del escritorio compartido, SO, edición y hardware permanecerán explícitas. La actualización por slots no permitirá rollback inseguro ni pérdida de datos.

**Dictamen O5:** favorable condicionado a la acreditación de alternativas viables por plataforma. AR-33 conserva estado PENDIENTE.

## **10. O6 — AR-51: licencias, vulnerabilidades y procedencia**

### **10.1. Contradicción de licencia propia de QAP**

Se verificó:

- El archivo [LICENSE](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/LICENSE?utm_source=chatgpt.com) declara MIT.
- El [package.json raíz](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/package.json?utm_source=chatgpt.com) declara ISC.

La discrepancia es material para la distribución.

No corresponde seleccionar unilateralmente una de las dos licencias ni inferir titularidad sobre todas las contribuciones.

Debe inventariarse:

- Titularidad.
- Licencia pretendida.
- Archivos y contribuciones.
- Dependencias incorporadas.
- Código heredado.
- Avisos obligatorios.

**Bloqueante:** no promover una distribución cuya licencia propia y obligaciones de redistribución permanezcan contradictorias.

Esto no impide continuar la planificación documental.

### **10.2. Diferenciación de licencias**

Una biblioteca, su paquete distribuido y el binario que descarga pueden tener términos distintos.

Por ejemplo:

- Playwright Core y navegadores.
- FFmpeg y codecs incorporados.
- Tesseract y modelos lingüísticos.
- Tink Java y runtime Java.
- Node y componentes incluidos.
- LibreOffice y componentes distribuidos.
- Chrome/Edge y canales oficiales.

Una licencia declarada en `package.json` no sustituye el inventario de archivos y artefactos redistribuidos.

### **10.3. Matriz de admisibilidad corregida**

Las licencias consignadas corresponden a las referencias públicas de los componentes candidatos o al expediente documental. No constituyen un dictamen jurídico sobre una distribución de QAP todavía inexistente.

| Componente            | Licencia o régimen candidato              | Condición de admisibilidad                            |
| --------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Node                  | MIT y avisos de terceros                  | Identidad y notices de la distribución exacta         |
| SQLite                | Dominio público para el núcleo original   | Verificar componentes adicionales                     |
| Playwright            | Apache-2.0                                | NOTICE, cambios y binarios separados                  |
| Chrome/Edge           | Términos del proveedor                    | Diferenciar descarga oficial de redistribución propia |
| MCP SDK v1            | MIT                                       | Verificar versión y archivos exactos                  |
| MCP SDK v2            | Apache-2.0 y código heredado aplicable    | Inventario de licencias por archivo                   |
| UTCP                  | MPL-2.0 según componente                  | Obligaciones sobre archivos cubiertos                 |
| axe-core              | MPL-2.0                                   | Identidad y obligaciones del artefacto                |
| Ajv                   | MIT                                       | Versión, avisos y transitivas                         |
| YAML                  | ISC                                       | Diferenciar de js-yaml                                |
| js-yaml               | MIT                                       | Revisiones afectadas y corregidas                     |
| Scalar OpenAPI Parser | MIT                                       | Dialecto, transitivas y alcance real                  |
| Mammoth               | BSD-2-Clause                              | Sanitización, sandbox y avisos                        |
| PDF.js                | Apache-2.0                                | Workers, fuentes y recursos auxiliares                |
| Tesseract.js          | Apache-2.0                                | WASM y modelos separados                              |
| ExcelJS               | MIT                                       | Capacidad de lectura frente a cálculo                 |
| SheetJS CE            | Apache-2.0                                | Artefacto oficial y procedencia verificable           |
| decimal.js            | MIT                                       | Reglas decimales y precisión                          |
| HyperFormula          | GPLv3 o comercial                         | Decisión de distribución y obligaciones aplicables    |
| LibreOffice Calc      | MPL-2.0 y componentes adicionales         | Inventario del producto exacto                        |
| keytar                | MIT                                       | Estado de mantenimiento y binarios nativos            |
| Alternativas keyring  | Según paquete y binario                   | Verificación por plataforma                           |
| Tink Java             | Apache-2.0                                | API, versión, JRE y dependencias                      |
| FFmpeg                | Según build, LGPL/GPL u otras condiciones | Flags, codecs y redistribución                        |
| Fuentes tipográficas  | Variable                                  | Licencia individual de redistribución                 |
| VM/sandbox            | Variable                                  | Runtime, imagen y componentes adicionales             |

### **10.4. Vulnerabilidades relevantes contrastadas**

Se contrastaron avisos primarios concretos y su relación con versiones del lock o candidatos. La revisión no equivale a un escaneo exhaustivo del árbol instalado.

| Aviso           | Componente                           | Consecuencia                                                                 |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| CVE-2026-104850 | MCP SDK, cliente OAuth               | Versiones v1 del lock dentro del rango afectado; comprobar alcanzabilidad    |
| CVE-2026-111770 | MCP SDK v2, servidor HTTP compartido | Evitar adopción de versiones afectadas; Stdio tiene alcance distinto         |
| CVE-2026-45366  | `@utcp/http` npm                     | No admitir versiones afectadas; candidato corregido requiere pruebas         |
| CVE-2025-69873  | Ajv                                  | Versiones del lock examinadas fuera de los rangos afectados correspondientes |
| CVE-2026-84375  | js-yaml                              | La resolución 4.3.1 requiere tratamiento frente a correcciones posteriores   |
| CVE-2023-30533  | SheetJS                              | No adoptar artefacto npm antiguo afectado                                    |
| CVE-2024-22363  | SheetJS                              | Verificar release oficial corregida                                          |
| CVE-2025-11849  | Mammoth                              | Evitar versiones afectadas y mantener sandbox                                |

La comprobación de un aviso no determina automáticamente que su ruta sea explotable en QAP.

Se deben distinguir:

- Presencia en lock.
- Presencia instalada.
- Inclusión en bundle.
- Import efectivo.
- Alcanzabilidad de función vulnerable.
- Datos no confiables que pueden llegar a la función.
- Privilegios.
- Mitigación y controles compensatorios.

### **10.5. MCP OAuth**

Las versiones actuales del lock requieren especial revisión frente al aviso relativo al cliente OAuth.

Si QAP opera exclusivamente como servidor Stdio y no consume la ruta de cliente afectada, la exposición puede diferir del rango general del paquete.

No obstante, esa ausencia de alcance debe demostrarse.

Actualizar la dependencia tampoco basta si se conservan registros de autorización históricos sin procedencia suficiente.

Debe contemplarse nueva autorización cuando la identidad del emisor anterior no pueda acreditarse.

### **10.6. js-yaml y dependencias transitivas**

La revisión confirma versiones de js-yaml en la cadena de dependencias y tooling, incluidas 4.3.1 y 5.4.1.

Debe evitarse concluir que una dependencia de compilación es necesariamente irrelevante.

Puede participar en:

- Generación de esquemas.
- Procesamiento de fuentes.
- Configuración de builds.
- Elaboración de artefactos distribuidos.

La mitigación puede consistir en actualización, sustitución o exclusión acreditada de la ruta vulnerable.

### **10.7. UTCP y OpenAPI**

El contrato aceptado de AV-05 no deberá depender de cargar automáticamente plugins con acceso libre a red y secretos.

Alternativas admisibles:

| Ruta                                         | Condición                                       |
| -------------------------------------------- | ----------------------------------------------- |
| SDK UTCP con transporte propio gobernado     | Acreditar control del despacho y redirecciones  |
| Implementación limitada del puerto necesario | Preservar semántica y compatibilidad acreditada |
| Broker que consume descripción UTCP/OpenAPI  | Validar esquema, permisos, versión y efecto     |

No se permite eliminar UTCP para simplificar dependencias.

Tampoco convertir una descripción OpenAPI a otro dialecto de forma que pierda restricciones relevantes de negocio o seguridad.

Se preserva EXP-05a/05b.

### **10.8. Excel y reportes del AUT**

La licencia comercial de una biblioteca no debe convertirse en dependencia obligatoria del producto sin decisión expresa del propietario.

Alternativas candidatas:

| Ruta                     | Capacidad                                                  |
| ------------------------ | ---------------------------------------------------------- |
| ExcelJS                  | Lectura estructural y valores disponibles                  |
| SheetJS CE               | Lectura y representación según formatos acreditados        |
| LibreOffice Calc aislado | Recálculo de clases compatibles                            |
| decimal.js               | Verificación de reglas monetarias o decimales propias      |
| HyperFormula             | Evaluación cuando sus funciones y licencia sean admisibles |

No son alternativas universalmente equivalentes.

Por ejemplo, leer una fórmula y su valor cacheado no acredita recálculo independiente.

Calc tampoco debe presentarse como implementación universal de todas las semánticas Excel.

Se conserva la separación de AV-05:

1. Extracción estructural del documento.
2. Semántica del libro y sus fórmulas.
3. Cálculo independiente de negocio.

Cada clase de D11 requiere una vía acreditada.

### **10.9. Limitación SheetJS**

Codex documentó una respuesta HTTP 403 al intentar obtener el artefacto correspondiente del CDN oficial.

No he verificado independientemente sus bytes en esta revisión.

Por tanto, se mantiene:

- Candidato documental.
- Identidad esperada pendiente de verificación del artefacto.
- Prohibición de sustituirlo silenciosamente por una distribución npm antigua afectada.
- Alternativa legal y técnicamente verificable por clase.

Fuentes: [documentación oficial de instalación SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/?utm_source=chatgpt.com) y [avisos de seguridad SheetJS](https://docs.sheetjs.com/docs/miscellany/security/?utm_source=chatgpt.com).

### **10.10. Custodia criptográfica y Tink**

Se conserva la decisión de AV-02 sobre una construcción criptográfica revisada.

Tink Java permanece candidato para Streaming AEAD y lectura posicionada autenticada cuando su API y formato exactos satisfagan AR-27.

Su evaluación deberá incluir:

- JRE efectivo.
- Tamaño y tiempo de arranque.
- Dependencias.
- Actualizaciones de seguridad.
- Licencias.
- Coste de memoria.
- Proceso broker.
- Búsqueda autenticada.
- Recuperación y rotación.

No se establece que todos los usuarios deban instalar un JRE como parte del bootstrap inicial.

Tampoco se autoriza una implementación criptográfica propia para reducir tamaño.

Si se propone otra biblioteca o runtime, deberá demostrar equivalencia con el contrato completo, incluida lectura posicionada autenticada cuando sea requerida.

### **10.11. FFmpeg y codecs**

Debe distinguirse la revisión FFmpeg incorporada en un descriptor Playwright de la versión de FFmpeg/FFprobe utilizada en AS-04.

La grabación histórica con FFmpeg 9.0.2 no acredita que la distribución actual de Playwright incluya ese mismo binario.

La admisibilidad se resolverá mediante:

- Versión.
- Identidad del build.
- Flags.
- Codecs.
- Dependencias.
- Licencias.
- Condiciones de distribución.

Fuente: [FFmpeg — Legal](https://ffmpeg.org/legal.html?utm_source=chatgpt.com).

### **10.12. SBOM por variante**

La SBOM deberá generarse a partir del artefacto real, no únicamente de una lista de candidatos.

| Nivel       | Contenido                                  |
| ----------- | ------------------------------------------ |
| Fuente      | Dependencias declaradas                    |
| Lock        | Resoluciones e integridad esperada         |
| Build       | Dependencias incorporadas y tooling        |
| Paquete     | Archivos distribuidos                      |
| Instalación | Componentes efectivamente provisionados    |
| Runtime     | Componentes cargados cuando sea observable |
| Capacidad   | Descargas opcionales y binarios asociados  |

Cada componente deberá registrar:

```
component_record:
  name: reference
  version: exact
  artifact_identity: reference
  supplier: reference
  expected_integrity: reference
  verified_integrity: reference_or_indeterminate
  authenticity_evidence: reference_or_indeterminate
  licenses: []
  applicable_notices: []
  distribution_obligations: []
  known_advisories: []
  reachability_status: reference
  mitigation: reference
  admission_status: reference
```

### **10.13. Política de admisión**

| Situación                                  | Decisión                                |
| ------------------------------------------ | --------------------------------------- |
| Procedencia indeterminada                  | No promover                             |
| Licencia incompatible o no resuelta        | Bloquear distribución afectada          |
| Vulnerabilidad alcanzable incompatible     | Corregir, sustituir o bloquear          |
| Vulnerabilidad fuera de alcance acreditado | Documentar evaluación y controles       |
| Dependencia comercial no autorizada        | No convertirla en requisito obligatorio |
| Componente sin alternativa funcional       | Mantener brecha y elevar al propietario |

No se ha comprobado independientemente cada tarball, SRI calculado, archivo de licencia y transitiva de todas las alternativas citadas.

La matriz anterior define la admisibilidad exigida, no una declaración de cumplimiento global.

### **10.14. Enmienda vinculante CV07-06**

> La admisión de dependencias distinguirá identidad documental, bytes verificados, autenticidad, licencia, alcance vulnerable y funcionamiento instalado. La discrepancia MIT/ISC de QAP requerirá resolución autorizada antes de distribuir. Las licencias se evaluarán por artefacto y modalidad, incluidas obligaciones de redistribución. La SBOM corresponderá a variantes reales y capacidades provisionadas. Se conservarán alternativas sin dependencia comercial obligatoria para D11 y sin criptografía propia para AR-27. Los artefactos inaccesibles permanecerán indeterminados hasta obtenerlos o acreditar una sustitución.

**Dictamen O6:** favorable como contrato de admisibilidad; selección y distribución pendientes. AR-51 conserva estado PENDIENTE.

## **11. O7 — AR-26: deuda técnica y preservación de pruebas**

### **11.1. Verificación independiente de la evidencia de 142 diagnósticos**

Se recuperó:

[typescript-r3-final-diff.json](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/.codex-r2-concurrency-evidence/typescript-r3-final-diff.json?utm_source=chatgpt.com).

Blob Git:

`7febab47927115357073f06999fbddb4a6fa34f4`.

La lectura estructurada confirma:

| Magnitud                      | Baseline | Current |
| ----------------------------- | -------- | ------- |
| Identidades agrupadas         | 93       | 93      |
| Suma de ocurrencias           | 142      | 142     |
| Grupos añadidos registrados   | 0        | —       |
| Grupos eliminados registrados | 0        | —       |

Este resultado acredita el contenido del documento JSON.

No representa una nueva ejecución de TypeScript ni demuestra que los diez paquetes actuales produzcan exactamente 142 diagnósticos.

### **11.2. Diferencia con los 144 de R2**

El [freeze R2.0](https://github.com/Hyouka73/QAMCP/blob/c57cd886bbda09902afc7d118b54226c1b59e62b/lab-r2/baseline/r2-0-freeze.json?utm_source=chatgpt.com) registra otro contexto.

| Propiedad                | R2.0                                       |
| ------------------------ | ------------------------------------------ |
| Base                     | `a78322f832fd69ccf58b7cb24f1571c8e1481e75` |
| Árbol                    | `3c6a83bcadcdcf9404a02da0610d7af2a3d2e52c` |
| Node                     | 24.15.0                                    |
| pnpm                     | 12.3.4                                     |
| TypeScript               | 5.5.4                                      |
| SQLite                   | 3.51.3                                     |
| Playwright               | 1.63.0                                     |
| Diagnósticos registrados | 144                                        |

Comando histórico:

```
pnpm --filter @qap/mcp exec tsc --noEmit --pretty false
```

El expediente registra 137 diagnósticos correspondientes a tests y siete de producción.

R2.5 registra una reducción posterior a cero dentro del laboratorio correspondiente.

**No existe fundamento para restar 142 de 144 y declarar una mejora de dos diagnósticos en el producto actual.**

Tampoco procede importar el cero de R2.5 como estado vigente de `develop`.

### **11.3. Cobertura del release-check**

El [script release-check.mjs](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/scripts/release-check.mjs?utm_source=chatgpt.com#L75-L109) ejecuta comprobaciones de determinados paquetes, pruebas de publicación y un script live.

No constituye una verificación integral de TypeScript de los diez paquetes.

Además, deben examinarse los scripts que permiten finalizar satisfactoriamente cuando no se encuentran pruebas.

Un paquete sin pruebas detectadas no puede considerarse certificado por obtener un exit code 0.

### **11.4. Baseline reproducible futuro**

El baseline de G0 deberá congelar:

| Categoría     | Identidad                           |
| ------------- | ----------------------------------- |
| Código        | SHA y árbol                         |
| Dependencias  | Lock exacto                         |
| Gestor        | Versión pnpm                        |
| Runtime       | Node, arquitectura y distribución   |
| Compilador    | TypeScript efectivo                 |
| Configuración | tsconfig y parámetros               |
| Instalación   | Resultado de instalación limpia     |
| Suites        | Comandos y selección                |
| Entorno       | SO, variables relevantes y recursos |
| Resultados    | Logs, exit codes y diagnósticos     |

No se utilizará un baseline generado sobre instalación parcial como referencia suficiente.

### **11.5. Identidad semántica del diagnóstico**

```
diagnostic_identity:
  package: reference
  source_or_test: reference
  compiler_code: reference
  stable_symbol: reference_or_absent
  contract_or_callsite: reference
  normalized_message: reference
  occurrence_count: integer
  source_location: reference
  revision: reference
```

El cambio de línea, renombrado de archivo o división de un módulo no deberá permitir ocultar una regresión.

Se conservarán la identidad y multiplicidad de los diagnósticos.

### **11.6. Clasificación de deuda**

| Clase                           | Tratamiento                                   |
| ------------------------------- | --------------------------------------------- |
| Violación de contrato           | Bloqueante de integración afectada            |
| Error de tipos de producción    | Resolver según alcance y obligación           |
| Error en tests o mocks          | Corregir sin degradar cobertura               |
| Fallo de build                  | Bloqueante de distribución                    |
| Fallo runtime                   | Evaluar capacidad y severidad                 |
| Brecha de autoridad o seguridad | No aceptar como deuda tolerada                |
| Comportamiento obsoleto         | Retirar únicamente con sustitución acreditada |

No toda deuda histórica bloquea la planificación.

Sí bloquea la integración o certificación cuando afecta directamente una obligación requerida.

### **11.7. Preservación de suites**

Toda suite retirada deberá tener uno de estos destinos:

- Traslado equivalente.
- Sustitución por una prueba de contrato superior.
- Consolidación de duplicados acreditados.
- Archivo de comportamiento histórico incompatible.
- Retirada justificada por desaparición de una implementación, preservando la obligación.

No se eliminarán pruebas únicamente para reducir errores de compilación o mejorar ratios de aprobación.

### **11.8. Criterios de no regresión**

| ID      | Control                   | Aceptación                              |
| ------- | ------------------------- | --------------------------------------- |
| CV26-01 | Baseline limpio           | Reproducibilidad de entorno y comandos  |
| CV26-02 | Compilación de producción | Resultado por paquete                   |
| CV26-03 | Compilación de tests      | Resultado separado                      |
| CV26-04 | Renombrado de archivo     | Mantener identidad diagnóstica          |
| CV26-05 | División de paquete       | No ocultar multiplicidad                |
| CV26-06 | Suite retirada            | Justificación y sustitución trazables   |
| CV26-07 | Mock actualizado          | Conservación de semántica probada       |
| CV26-08 | Falso PASS histórico      | Control negativo vigente                |
| CV26-09 | Instalación parcial       | No declarar baseline limpio             |
| CV26-10 | Ausencia de pruebas       | No convertir cero tests en acreditación |

### **11.9. Enmienda vinculante CV07-07**

> Los 93 grupos y 142 diagnósticos se conservarán como contenido verificado de evidencia histórica, no como medición vigente del producto. Los 144 de R2 y su reducción posterior pertenecen a su propio árbol y entorno. G0 establecerá un baseline reproducible de los diez paquetes y distinguirá producción, tests, mocks, build, runtime y contratos. La comparación conservará identidad semántica y multiplicidad. La retirada de módulos o suites exigirá equivalencia trazable. No se tolerarán regresiones de seguridad, autoridad, ejecución, evidencia o certificación.

**Dictamen O7:** favorable con enmienda. AR-26 permanece PENDIENTE.

## **12. O8 — AR-54: precedencia normativa y trazabilidad completa**

### **12.1. Jerarquía de fuentes**

El orden normativo deberá distinguir alcance contractual y autoridad operativa.

| Fuente                              | Función                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| Decisiones expresas del propietario | Definen alcance y restricciones del producto                |
| Catálogo consolidado y ampliaciones | Desarrollan obligaciones identificables                     |
| Contratos AV aceptados              | Precisan invariantes y criterios                            |
| Resoluciones del Orquestador        | Aceptan o corrigen propuestas dentro del alcance autorizado |
| Protocolos experimentales           | Definen cómo verificar                                      |
| Plan histórico                      | Antecedente de secuencia                                    |
| Código y configuración              | Implementación efectiva, no autoridad normativa             |
| AGENTS, skills y README             | Instrucciones subordinadas                                  |
| Evidencia histórica                 | Acreditación limitada a su referencia                       |

Un documento no puede conceder un grant empresarial, aunque describa una operación permitida por diseño.

Una configuración técnica tampoco puede ampliar las decisiones del propietario.

### **12.2. Identificación de contradicciones**

| Fuente o consumidor       | Contradicción o riesgo                                   | Resolución                                                          |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| AGENTS/README             | Runtime histórico incompatible                           | Actualizar a matriz acreditada cuando se autorice                   |
| CLI directo               | Escritura fuera del núcleo                               | Delegación canónica                                                 |
| MCP legacy                | Operaciones antiguas y rutas parcialmente deshabilitadas | Inventario y pruebas negativas                                      |
| Reporter HTTP             | Lectura nominal con posibles escrituras                  | Separación efectiva                                                 |
| `reindex`                 | Reconstrucción con autoridad histórica                   | Proyección desde fuente canónica                                    |
| `clean` y reset           | Operaciones destructivas con mecanismos anteriores       | Autoridad y journal                                                 |
| Scripts de provisión      | Escritura de secretos y configuración                    | Retirada operativa o sustitución gobernada                          |
| TTL legacy                | Retención incompatible                                   | D19 y DE-01                                                         |
| Plan de 82 IDs            | Alcance histórico incompleto                             | Matriz vigente 92 + 11                                              |
| Referencias V-17/V-18     | Definición completa no acreditada                        | Conciliación documental                                             |
| Índice `revision-neon.md` | Redacción histórica de revisión final                    | Conservar procedencia y actualizar referencias sin atribución falsa |

### **12.3. Clasificación verificada del catálogo**

Se verificaron las 90 fichas REQ del [catálogo consolidado](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com), sus dos políticas adicionales y las correspondencias de la [matriz semántica](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/matriz-semantica.md?utm_source=chatgpt.com).

| Grupo                              | Cantidad |
| ---------------------------------- | -------- |
| Identificadores del plan histórico | 82       |
| Incorporaciones adicionales        | 5        |
| Requisitos promovidos              | 3        |
| Políticas adicionales              | 2        |
| **Elementos normativos vigentes**  | **92**   |
| Ampliaciones complementarias       | **11**   |

La clasificación histórica de los 87 elementos anteriores a promociones adicionales era:

- 60 RF.
- 20 RNF.
- 7 POL.

La clasificación objetivo aceptada de los 92 elementos conserva:

| Clase | Cantidad |
| ----- | -------- |
| RF    | 63       |
| RNF   | 19       |
| POL   | 10       |
| Total | 92       |

No se introduce una clasificación nueva.

### **12.4. Reclasificaciones exactas preservadas**

| Identificador | Clase anterior | Clase objetivo |
| ------------- | -------------- | -------------- |
| REQ-MEM-003.5 | RNF            | RF             |
| REQ-DIS-001.8 | RF             | RNF            |
| REQ-CAM-001.3 | RNF            | RF             |
| REQ-SEG-002.2 | RNF            | POL            |

Promociones adicionales:

| Identificador  | Clase |
| -------------- | ----- |
| REQ-AUTREP-001 | RF    |
| REQ-RUN-002.1  | RF    |
| REQ-SEG-002.3  | RNF   |
| POL-CAP-001    | POL   |
| POL-RET-001    | POL   |

Las reclasificaciones no eliminan ni debilitan ninguna obligación.

### **12.5. Corrección de ubicación documental**

Se identifica una discontinuidad semántica en el catálogo: el criterio sobre preferencias y fidelidad de recursos aparece en una ubicación que puede asociarlo a `REQ-SEG-002.3`, aunque su contenido corresponde al alcance de `REQ-RUN-002.1`.

Se recomienda trasladar o referenciar explícitamente ese criterio bajo `REQ-RUN-002.1`, sin alterar su texto normativo ni eliminar su relación con privacidad.

## **13. Matriz de trazabilidad de los 92 elementos**

La siguiente matriz constituye una **propuesta de vinculación por identificador a consumidores y compuertas**, no una nueva formulación de los requisitos.

El texto completo, clases y excepciones se conservan en el catálogo y sus enmiendas aceptadas.

Abreviaturas:

- **AUT:** autoridad.
- **REP:** repositorio canónico.
- **EJE:** ejecutor.
- **DIS:** Discovery.
- **DOC:** ingesta documental.
- **PLA:** planificador.
- **ORA:** oráculos y testigos.
- **MED:** custodio multimedia.
- **INT:** interfaces MCP/CLI.
- **DIST:** distribución y doctor.
- **VIS:** visor y reportes.

Se omite el prefijo `REQ-` en las filas para facilitar la lectura.

### **13.1. Memoria — 15 identificadores**

| ID        | Consumidor principal | Compuerta |
| --------- | -------------------- | --------- |
| MEM-001.1 | REP/AUT              | E1/E2     |
| MEM-001.2 | REP                  | E2        |
| MEM-001.3 | REP/PLA              | E2/E4     |
| MEM-001.4 | REP/AUT              | E2        |
| MEM-001.5 | REP/INT              | E2/E7     |
| MEM-002.1 | REP/DIS              | E2/E4     |
| MEM-002.2 | REP/PLA              | E2/E4     |
| MEM-002.3 | REP/EJE              | E2/E3     |
| MEM-002.4 | REP/INT              | E2/E7     |
| MEM-002.5 | REP/AUT              | E2        |
| MEM-003.1 | REP/DIS              | E2/E4     |
| MEM-003.2 | REP/PLA              | E2/E4     |
| MEM-003.3 | REP/AUT              | E2        |
| MEM-003.4 | REP/EJE              | E2/E3     |
| MEM-003.5 | REP/INT              | E2/E7     |

Los controles correspondientes deberán preservar identidad, persistencia, procedencia, revisiones, aislamiento, búsqueda y reutilización conforme a cada ficha.

### **13.2. Discovery — 8 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| DIS-001.1 | DIS/EJE    | E4        |
| DIS-001.2 | DIS/REP    | E4        |
| DIS-001.3 | DIS/EJE    | E4        |
| DIS-001.4 | DIS/REP    | E2/E4     |
| DIS-001.5 | DIS/AUT    | E4        |
| DIS-001.6 | DIS/PLA    | E4        |
| DIS-001.7 | DIS/ORA    | E4/E5     |
| DIS-001.8 | DIS/EJE    | E4/G5     |

Se conservan CV06-02 y CV06-04, incluidos denominadores, fidelidad, estados, identidad semántica e invalidación.

### **13.3. Documentos — 4 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| DOC-001.1 | DOC/AUT    | E2/E4     |
| DOC-001.2 | DOC/REP    | E4        |
| DOC-001.3 | DOC/PLA    | E4        |
| DOC-001.4 | DOC/ORA    | E4/E5     |

Se preserva la ingesta de documentos corporativos y técnicos bajo autorización, con procedencia y límites de extracción.

### **13.4. Inteligencia y autonomía — 6 identificadores**

| ID       | Consumidor | Compuerta |
| -------- | ---------- | --------- |
| IA-001.1 | INT/PLA    | E1/E4     |
| IA-001.2 | PLA/EJE    | E4        |
| IA-001.3 | PLA/REP    | E4        |
| IA-001.4 | EJE/INT    | E3/E4     |
| IA-001.5 | PLA/ORA    | E4/E5     |
| IA-001.6 | EJE/INT    | E3/E7     |

HOST y DETERMINISTIC se mantienen como modalidades iniciales. No se introduce MANAGED como requisito de infraestructura de lanzamiento.

### **13.5. Planificación — 6 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| PLN-001.1 | PLA/REP    | E4        |
| PLN-001.2 | PLA/ORA    | E4/E5     |
| PLN-001.3 | PLA/AUT    | E4        |
| PLN-001.4 | PLA/EJE    | E3/E4     |
| PLN-001.5 | PLA/REP    | E4        |
| PLN-001.6 | PLA/EJE    | E4/E5     |

El plan deberá conservar revisiones, obligaciones, elegibilidad, efectos y testigos.

### **13.6. Casos — 5 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| CAS-001.1 | REP/PLA    | E2/E4     |
| CAS-001.2 | PLA/EJE    | E4/E5     |
| CAS-001.3 | REP/ORA    | E4/E5     |
| CAS-001.4 | REP/PLA    | E2/E4     |
| CAS-001.5 | EJE/ORA    | E5        |

### **13.7. Oráculos — 7 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| ORA-001.1 | ORA/PLA    | E4/E5     |
| ORA-001.2 | ORA/EJE    | E5        |
| ORA-001.3 | ORA/REP    | E5        |
| ORA-001.4 | ORA/EJE    | E5        |
| ORA-001.5 | ORA/AUT    | E5        |
| ORA-001.6 | ORA/EJE    | E5        |
| ORA-001.7 | ORA/REP    | E5/E7     |

Ninguna optimización de reconstrucción permitirá sustituir testigos funcionales por resultados HTTP o inferencias sin autoridad.

### **13.8. Ejecución — 6 identificadores históricos**

| ID        | Consumidor  | Compuerta |
| --------- | ----------- | --------- |
| RUN-001.1 | EJE         | E3/E5     |
| RUN-001.2 | EJE/AUT     | E3/E5     |
| RUN-001.3 | EJE/ORA     | E5        |
| RUN-001.4 | EJE/REP     | E3/E5     |
| RUN-001.5 | EJE/ORA/MED | E5/E6     |
| RUN-001.6 | EJE/INT     | E3/E7     |

### **13.9. Datos — 4 identificadores**

| ID        | Consumidor             | Compuerta |
| --------- | ---------------------- | --------- |
| DAT-001.1 | EJE/AUT                | E5        |
| DAT-001.2 | Adaptador UTCP/OpenAPI | E4/E5     |
| DAT-001.3 | EJE/ORA                | E5        |
| DAT-001.4 | EJE/REP                | E5        |

Se conservan operaciones autorizadas de preparación, referencias de solo lectura, reconciliación y cleanup.

### **13.10. Campañas — 5 identificadores**

| ID        | Consumidor    | Compuerta |
| --------- | ------------- | --------- |
| CAM-001.1 | PLA/EJE       | E3/E4     |
| CAM-001.2 | EJE/REP       | E3/E4     |
| CAM-001.3 | EJE/scheduler | E3/E5     |
| CAM-001.4 | EJE/ORA       | E5        |
| CAM-001.5 | EJE/VIS       | E5/E7     |

Se mantiene CV06-03. W=1 es referencia y fallback temporal, nunca límite permanente.

### **13.11. Reportes — 4 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| REP-001.1 | VIS/REP    | E6/E7     |
| REP-001.2 | VIS/MED    | E6        |
| REP-001.3 | VIS/ORA    | E5/E6     |
| REP-001.4 | VIS/INT    | E6/E7     |

### **13.12. Regresión — 3 identificadores**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| REG-001.1 | PLA/REP    | E4/E5     |
| REG-001.2 | EJE/ORA    | E5        |
| REG-001.3 | REP/EJE    | E2/E5     |

### **13.13. Seguridad — 5 identificadores históricos**

| ID        | Consumidor | Compuerta |
| --------- | ---------- | --------- |
| SEG-001.1 | AUT        | E1/E2     |
| SEG-001.2 | AUT/EJE    | E2/E5     |
| SEG-001.3 | AUT/REP    | E2        |
| SEG-002.1 | AUT/EJE    | E2/E3     |
| SEG-002.2 | AUT/MED    | E2/E6     |

### **13.14. Interoperabilidad — 4 identificadores**

| ID        | Consumidor             | Compuerta  |
| --------- | ---------------------- | ---------- |
| INT-001.1 | INT/DIST               | E7/EXP-01a |
| INT-001.2 | DIST/INT               | G5/E7      |
| INT-001.3 | INT/EJE                | E7         |
| INT-001.4 | Adaptador UTCP/OpenAPI | E4/E5      |

### **13.15. Cinco incorporaciones**

| ID        | Consumidor                     | Compuerta |
| --------- | ------------------------------ | --------- |
| XINST-001 | AUT/DAT                        | E5        |
| QA-001    | EJE/ORA                        | E5        |
| QA-002    | EJE/ORA                        | E5        |
| QA-003    | Adaptador de accesibilidad/VIS | E6/E8     |
| AGT-001   | INT/EJE                        | E7        |

### **13.16. Tres promociones**

| ID         | Obligación preservada                      | Consumidor | Compuerta    |
| ---------- | ------------------------------------------ | ---------- | ------------ |
| AUTREP-001 | Validación funcional de reportes del AUT   | DOC/ORA    | EXP-06b/E5   |
| RUN-002.1  | Preferencias y fidelidad de ejecución      | EJE/DIS    | EXP-02/03/04 |
| SEG-002.3  | Seguridad y garantías de evidencia privada | AUT/MED    | EXP-06a/c/E6 |

### **13.17. Políticas adicionales**

| ID          | Obligación                                     | Consumidor | Compuerta    |
| ----------- | ---------------------------------------------- | ---------- | ------------ |
| POL-CAP-001 | Captura controlada y supresión preventiva      | AUT/MED    | EXP-06a/c/E6 |
| POL-RET-001 | Historial, detalle y conservación diferenciada | REP/MED    | E2/E6        |

### **13.18. Regla de cobertura**

La matriz deberá reconciliarse automáticamente en la futura implementación con el catálogo exacto.

Los vínculos anteriores son una asignación candidata de consumidores y compuertas, no acreditación experimental individual.

Para cada ID se exigirá:

```
requirement_trace:
  requirement_id: exact
  canonical_document_revision: reference
  accepted_amendments: []
  applicable_decisions: []
  responsible_component: reference
  consuming_interfaces: []
  contract_reference: reference
  verification_controls: []
  experimental_gate: reference
  applicability: reference
  current_evidence: []
  unresolved_gaps: []
```

Criterios:

- Cero IDs normativos sin trazabilidad.
- Cero colisiones de identidad.
- Cero promociones omitidas.
- Cero ampliaciones absorbidas sin procedencia.
- Cero certificaciones basadas únicamente en conteos.
- Cero reducciones unilaterales de alcance.

## **14. Trazabilidad de las 11 ampliaciones**

| Ampliación   | Tratamiento vinculante                                     | Consumidor y compuerta |
| ------------ | ---------------------------------------------------------- | ---------------------- |
| REQ-AGT-002  | Uso y orientación del agente conforme al contrato completo | INT/EJE, E7            |
| REQ-ONB-001  | Onboarding y continuidad autorizada                        | INT/AUT, E7            |
| REQ-OPT-001  | Optimización preservando resultados y obligaciones         | EJE/REP, EXP-01b/02/03 |
| REQ-OPT-002  | Uso eficiente de contexto y recursos según ficha           | REP/PLA, EXP-01b       |
| REQ-E2E-001  | Flujos completos y testigos por efecto                     | PLA/EJE/ORA, E4/E5     |
| UTCP/OpenAPI | Alias REQ-UTCP-001 absorbido en DAT-001.2 e INT-001.4      | Adaptadores, EXP-05a/b |
| M1           | Ampliación multimedia conservada íntegramente              | MED/VIS, E6            |
| M2           | Ampliación multimedia conservada íntegramente              | MED/VIS, E6            |
| M3           | Ampliación multimedia conservada íntegramente              | MED/VIS, E6            |
| M4           | Ampliación multimedia conservada íntegramente              | MED/VIS, E6            |
| M5           | Ampliación multimedia conservada íntegramente              | MED/VIS, E6            |

Las etiquetas M1–M5 remiten al texto exacto del catálogo. No se sustituyen por descripciones reducidas.

La absorción de UTCP/OpenAPI no elimina su obligación.

El conteo de ampliaciones no debe sumarse como si fueran once registros AR nuevos.

## **15. Preservación exacta de AR-52**

### **15.1. Cuatro ejes independientes**

Se conserva el contrato aceptado:

```
technical_status
functional_verdict
cleanup_status
evidence_health
```

Los ejes no se reducen a un único booleano.

### **15.2. Seis veredictos**

Se mantienen exactamente:

```
PASS
FAIL
INDETERMINATE
BLOCKED
SKIPPED
ERROR
```

La condición abierta de una unidad, el cierre histórico y la aceptación operativa actual deben distinguirse.

### **15.3. Tabla de reducción normativa**

La [enmienda AR-52 de AV-04](https://github.com/Hyouka73/QAMCP/blob/b22bc9b9d52c8138f9b518ece6b2de89cc2b2559/docs/qap-architecture/cierre-av-01/enmiendas-av04.md?utm_source=chatgpt.com) conserva precedencia sobre cualquier reducción histórica.

| Condición normativa original | Código |
| ---------------------------- | ------ |
| Unidad abierta               | Nulo   |
| I                            | 18     |
| F junto con T, R, U u O      | 11     |
| F                            | 10     |
| T                            | 12     |
| R                            | 13     |
| U                            | 14     |
| O                            | 15     |
| A                            | 0      |
| S                            | 16     |
| Restantes cierres terminales | 17     |

Las variables corresponden estrictamente a las definiciones de la tabla original. No se redefinen mediante esta contravalidación.

Se conserva además la diferenciación entre:

- Error de invocación.
- Consulta.
- Diagnóstico.
- ACK durable.
- Ejecución.
- Resultado terminal.
- Aceptación operativa.

Un ACK 20 no equivale a una campaña aprobada.

Una consulta exitosa con código 0 tampoco acredita un PASS funcional.

MCP no deberá convertir indiscriminadamente un resultado de negocio negativo en error de transporte.

### **15.4. Criterio de integración CI**

La aceptación por CI deberá verificar el sobre canónico, versión, perfil, identidad, resultado terminal y código correspondiente.

No basta observar exit code 0 aislado de su semántica.

Los wrappers de PowerShell, shell POSIX, gestores CI y clientes MCP deberán conservar las mismas reglas de interpretación.

## **16. Manifest de especificación vigente**

Se recomienda crear posteriormente, bajo autorización del Orquestador, un manifest documental que identifique las fuentes normativas efectivas.

```
specification_manifest:
  schema_version: proposed

  owner_decisions:
    range: D01-D21
    source_revision: reference

  unresolved_decisions:
    - DE-01
    - DE-02
    - DE-03
    - DE-04
    - DE-05

  requirements:
    expected_count: 92
    source: catalogo-requisitos.md
    source_revision: reference

  extensions:
    expected_count: 11
    source_revision: reference

  accepted_contracts:
    - AV-01
    - AV-02
    - AV-03
    - AV-04
    - AV-05
    - AV-06
    - AV-07_if_accepted_by_orchestrator

  legacy_documents:
    normative_authority: false

  traceability:
    required: true
    unresolved_conflicts: []
```

Este manifest no debe convertirse en un mecanismo de concesión de permisos.

Su finalidad es evitar que instrucciones antiguas, documentos locales o implementaciones históricas sustituyan contratos vigentes.

### **16.1. Retirada de interfaces incompatibles**

Cada entrada deberá recibir una de estas decisiones:

| Estado objetivo | Significado                                       |
| --------------- | ------------------------------------------------- |
| CONSERVAR       | Interfaz compatible con el núcleo                 |
| ADAPTAR         | Preservar experiencia mediante delegación         |
| DESHABILITAR    | Bloquear hasta sustituir capacidad                |
| RETIRAR         | Eliminar ruta obsoleta tras demostrar sustitución |
| ARCHIVAR        | Conservar procedencia sin autoridad operativa     |

La retirada deberá comprobarse mediante ejecución negativa futura, no solo borrando documentación.

### **16.2. Enmienda vinculante CV07-08**

> La precedencia conservará D01–D21, catálogo completo, ampliaciones y contratos aceptados AV-01–06. Se mantendrán 92 elementos y 11 ampliaciones, con identificación individual de consumidores, contratos, pruebas y compuertas. No se alterarán clases, promociones ni alcance por una simplificación del plan histórico. AR-52 conservará su tabla y cuatro ejes/seis veredictos originales. Las interfaces históricas incompatibles deberán retirarse o delegar en la autoridad común mediante pruebas negativas. Las discrepancias documentales permanecerán explícitas y no podrán conceder permisos, modificar retención ni atribuir a Neon decisiones emitidas por otro contravalidador.

**Dictamen O8:** favorable con enmienda. AR-54 conserva estado PENDIENTE.

# **17. Protocolos experimentales consolidados**

Los siguientes controles amplían los expedientes existentes. No autorizan ejecutarlos ahora.

## **17.1. EXP-01a — Compatibilidad y supervisor mínimo**

**Fases:** G0, G1 y G5.

Entrada:

- SDK y runtime candidatos.
- Cuatro hosts reales D13.
- Artefacto mínimo de ejecutor independiente.
- Fixture autorizado.
- Contratos vigentes.

Aceptación:

- Negociación correcta.
- Probes sin efectos.
- Handoff real.
- Rechazo de autoridad incorrecta.
- Compatibilidad por host y revisión.
- Cero sustitución de MCP por CLI.

## **17.2. EXP-04 — Distribución y runtime**

**Fases:** calificación previa G0, EXP-04a en G1 y EXP-04b en G5.

Entrada:

- Manifiesto autenticado.
- Runtime.
- Dependencias.
- Variantes de navegador.
- Instalación limpia.
- Artefacto distribuible.

Aceptación:

- Resolución fuera del workspace.
- Doctor funcional.
- SRI y autenticidad diferenciados.
- Cero descarga imprevista.
- Actualización y rollback gobernados.
- Matriz de SO y arquitectura aplicable.
- Navegación visible y headless.
- Costes reales documentados.

## **17.3. EXP-05a/b — Conectores y autoridad externa**

**Fases:** G0/G3.

Se mantienen los contratos AV-05 y se añade:

- Inventario de dependencias realmente utilizadas.
- Prohibición de transporte no gobernado.
- Revocación.
- Control de redirecciones.
- Distinción de referencia y escritura.
- Licencia por artefacto.
- Pruebas de plugin ausente o sustituido.

## **17.4. EXP-06a/c — Captura y custodia**

**Fases:** G0, G3 y G5.

Se conserva la condición de EXP-06a antes del cierre G0.

Añadir:

- Identidad de runtime Java u otra alternativa admitida, si procede.
- SBOM de codecs.
- Principal efectivo de captura.
- Directorios temporales.
- Frontera de sesión gráfica.
- Supervisor.
- Restauración sin reactivar permisos privados.

No se admite aprobar por supresión total de una capacidad obligatoria.

## **17.5. EXP-07 y E2 — Bóveda, persistencia y migración**

Entrada:

- Alternativas KEK y broker.
- Dos principales efectivos.
- Repositorio canónico.
- Fuentes históricas controladas.
- Máquina de corte.

Aceptación:

- Separación de claves.
- Rechazo del HOST.
- Revocaciones durables.
- Snapshot coherente.
- Importación semántica.
- Exclusión del escritor.
- Recuperación ante caída.
- Cero pérdida indebida.

## **17.6. E3 — Autonomía y supervivencia**

Se conserva el contrato del ejecutor independiente.

Añadir pruebas de terminación del HOST, ejecutor, supervisor y navegador como fallos diferentes.

No se presupone que la supervivencia a uno implique recuperación frente a todos.

## **17.7. E7 — Paridad y retirada de legacy**

E7 deberá verificar todas las entradas autorizadas:

- MCP.
- CLI.
- Scripts distribuidos.
- Entrypoints.
- Visor y acciones administrativas.
- Adaptadores de integración.
- Herramientas antiguas cuando formen parte del control negativo.

La paridad incluye resultados, autoridad, revocación, cuatro ejes, recuperación y códigos de salida.

## **17.8. E8 — Aceptación integral**

Se conserva E8 en G6.

Sus denominadores y criterios finales deberán desarrollarse en AV-08 con arreglo a las decisiones pendientes.

No se sustituye por la suma de pruebas unitarias ni por un único fixture histórico.

# **18. Clasificación de bloqueantes por fase**

### **18.1. Matriz consolidada**

| Materia                     | Planificación               | Selección                    | Implementación            | Migración                 | Certificación/activación              |
| --------------------------- | --------------------------- | ---------------------------- | ------------------------- | ------------------------- | ------------------------------------- |
| Inventario de diez paquetes | Corregir ahora              | Grafo efectivo               | Contratos y sustitución   | Escritores identificados  | Equivalencia probada                  |
| Alpha Playwright            | Puede planificarse retirada | Verificar o sustituir        | Pruebas de ausencia       | —                         | Paquete y capacidades                 |
| Node/SQLite                 | Candidatos disponibles      | Doctor y soporte             | Repositorio               | Recuperación y schema     | G1/G5                                 |
| MCP SDK                     | Comparadores definidos      | EXP-01a G0                   | Adaptador canónico        | Registro seguro           | Cuatro hosts acreditados              |
| Supervisor                  | Rutas candidatas            | Factibilidad por SO          | Fronteras verificadas     | Exclusión de legado       | E3/G5                                 |
| Distribución                | Base modular candidata      | Artefactos admitidos         | Slots y bootstrap         | Actualización segura      | EXP-04b                               |
| AR-41                       | Contrato planificable       | Mecanismos de corte          | Journal y fencing         | BLOQUEADO hasta acreditar | Autorización específica               |
| Licencia QAP                | Conflicto identificado      | Aclarar titularidad/licencia | Inventario por componente | —                         | Distribución bloqueada si no resuelta |
| D11                         | Capacidad preservada        | Alternativas por clase       | EXP-06b                   | —                         | Cobertura acreditada                  |
| Captura privada             | C/A preservadas             | EXP-06a                      | EXP-06c                   | Custodia de legado        | DE-02 y E6                            |
| Deuda                       | Protocolo definido          | Baseline G0                  | Cero regresión relevante  | Pruebas de recuperación   | Sin omisiones                         |
| Trazabilidad                | 92+11 preservados           | Manifest                     | Consumidores y pruebas    | Linaje histórico          | Cobertura completa                    |

### **18.2. Bloqueantes de planificación**

El expediente permite formular arquitectura candidata y dependencias.

No existe motivo para exigir que todos los experimentos G1–G6 se hayan ejecutado antes de elaborar una planificación futura.

Sin embargo, antes de congelar definitivamente la estrategia deberán conservarse:

- Corrección del inventario.
- Contrato de autoridad y migración.
- Dependencias entre compuertas.
- Requisitos completos.
- Candidatos tecnológicos y alternativas.
- Riesgos y decisiones abiertas.

Esto no autoriza elaborar ahora el WBS.

### **18.3. Bloqueantes de selección**

Permanecen abiertos:

- Runtime y driver definitivo.
- SDK MCP.
- Playwright y retirada eventual de alpha.
- Supervisor por plataforma.
- Broker y KEK.
- Componentes D11 por clase.
- Codificador y custodia.
- Distribución y licencias.

### **18.4. Bloqueantes de implementación**

No se deberá integrar una capacidad crítica cuando su contrato, frontera o precondición aceptada no estén resueltos.

Especialmente:

- AR-24 y AR-40 en sus compuertas G0.
- EXP-06a antes de G1.
- Autoridad de repositorio.
- Fronteras del ejecutor.
- Protocolo de despacho externo.

### **18.5. Bloqueantes de migración**

AR-41 conserva su estado.

No se autoriza corte sin:

- Inventario efectivo.
- Snapshot coherente.
- Importación verificada.
- Exclusión del escritor antiguo.
- Reconciliación.
- Rollback seguro.
- E2/G5.
- Condiciones G6/G6.5.
- Autorización específica.

### **18.6. Bloqueantes de certificación y activación**

La certificación requiere los resultados experimentales de las capacidades aplicables y la matriz efectiva.

La activación privada conserva requisitos adicionales de DE-02.

El lanzamiento GA requiere la decisión correspondiente después de G6.5.

# **19. Preservación de AV-01 a AV-06**

| Auditoría | Invariantes conservadas                                                               |
| --------- | ------------------------------------------------------------------------------------- |
| AV-01     | Integridad del catálogo, alcance, decisiones y trazabilidad                           |
| AV-02     | Denegación por defecto, secretos, revocación, captura preventiva y custodia           |
| AV-03     | Escritor único, autonomía, ejecutor, IPC, continuidad, contexto y MCP                 |
| AV-04     | Oráculos, cuatro ejes, seis veredictos, AR-52, efectos y cleanup                      |
| AV-05     | Documentos, reportes del AUT, UTCP/OpenAPI, cálculo y referencias                     |
| AV-06     | Fidelidad, navegadores, concurrencia, Discovery, distribución, accesibilidad y tokens |

En particular, CV07-01 a CV07-08 no sustituyen CV06-01 a CV06-08.

Se conservan:

- Primera versión local.
- HOST y DETERMINISTIC.
- Escrituras automáticas bajo autorización efectiva de QA.
- Producción y referencias sujetas a lectura acreditada.
- Windows, macOS y Linux.
- Navegación visible y en segundo plano.
- Instalación bajo demanda.
- Concurrencia adaptativa sin techo permanente W=1.
- Autonomía funcional y memoria persistente.
- Accesibilidad como capacidad de lanzamiento.
- Evidencia multimedia y exportaciones portables.
- Resumen histórico permanente hasta eliminación expresa.
- Detalle durante 90 días.
- Knowledge y casos activos sin caducidad automática.
- Exportación manual y archivo automático configurable.

Los TTL históricos de 7, 14 o 30 días no deberán imponerse sobre D19.

Las propuestas específicas de conservación multimedia, como períodos de 24 horas, 72 horas o 14 días, mantienen su condición no ratificada cuando corresponda a DE-01.

# **20. Riesgos residuales y limitaciones de verificación**

| Riesgo o limitación                               | Tratamiento                                      |
| ------------------------------------------------- | ------------------------------------------------ |
| Inventario de imports dinámicos no exhaustivo     | Verificar mediante grafo, metafile e instalación |
| Bytes alpha inaccesibles                          | Retirada condicionada o recuperación verificable |
| SRI de candidatos no recalculados integralmente   | Completar identidad antes de admisión            |
| Versiones de registry no obtenidas como tarballs  | Mantener diferencia entre metadata y bytes       |
| Disponibilidad npm de QAP indeterminada           | EXP-04                                           |
| Conflicto MIT/ISC                                 | Resolución autorizada previa a distribución      |
| SheetJS CDN no verificado                         | Obtener artefacto o alternativa por clase        |
| Componentes comerciales                           | Decisión del propietario                         |
| Escritores legados no inventariados dinámicamente | E2/E7 y controles adversariales                  |
| Administrador fuera de frontera ordinaria         | Declarar modelo de amenaza                       |
| Sesión gráfica compartida                         | Acreditar aislamiento o bloquear celda           |
| Efectos tardíos                                   | Barreras de reconciliación                       |
| Restore de autoridad obsoleta                     | Journal y watermark protegidos                   |
| Datos históricos perdidos                         | Mantener ausencia y procedencia                  |
| Deuda actual no medida                            | Baseline G0                                      |
| V-17/V-18 incompletos                             | Conciliación documental                          |
| Corpus y umbrales no ratificados                  | DE-03/AV-08                                      |

**Alcance efectivo de esta contravalidación:** se inspeccionaron manifests, lock, fuentes relevantes, rutas de persistencia, scripts, archivos históricos y fuentes primarias seleccionadas. No se realizó análisis dinámico ni exploración exhaustiva de cada import, transitiva, artefacto publicado o licencia por archivo.

Por ello, no corresponde afirmar que toda la cadena de suministro esté independientemente verificada.

Las reservas se mantienen como condiciones explícitas de selección, migración o certificación.

# **21. Transferencias documentales a AV-08**

La siguiente transferencia no constituye inicio de AV-08.

| ID        | Obligación transferida                                                       |
| --------- | ---------------------------------------------------------------------------- |
| T07-08-01 | Utilizar los 92 elementos y 11 ampliaciones como universo normativo completo |
| T07-08-02 | Conciliar trazabilidad histórica V-01–V-16/V-01–V-18                         |
| T07-08-03 | Determinar cardinalidad y perfiles del corpus ciego sin reducir alcance      |
| T07-08-04 | Preservar denominadores independientes de Discovery y efectos                |
| T07-08-05 | Diferenciar ausencia de evidencia, incumplimiento y bloqueo                  |
| T07-08-06 | Incorporar controles negativos de falsos PASS de los antecedentes            |
| T07-08-07 | Incorporar la matriz instalada por SO, arquitectura y host                   |
| T07-08-08 | Incorporar costes medidos, concurrencia y contexto                           |
| T07-08-09 | Conservar D11 por clase, no por mera disponibilidad del parser               |
| T07-08-10 | Separar G6 ciego y G6.5 empresarial                                          |
| T07-08-11 | Preservar AR-41 y condiciones de corte real                                  |
| T07-08-12 | Exigir trazabilidad de revocaciones, retención y recuperación                |
| T07-08-13 | Mantener alcance de accesibilidad y DE-05                                    |
| T07-08-14 | Mantener DE-01–05 pendientes en sus aspectos abiertos                        |
| T07-08-15 | Diferenciar aceptación documental, experimental, empresarial y GA            |

No se proponen porcentajes, hardware mínimo, criterios numéricos finales ni una aprobación empresarial.

# **22. Enmiendas exactas por anexo**

## **22.1.&#x20;**`matriz-reconstruccion-av07.md`

Aplicar CV07-01:

> Sustituir nueve por diez paquetes. Diferenciar el grafo declarado de imports, bundle y dependencias instaladas. Incorporar decisiones por componente, condiciones de retirada, recuperación de tests y preservación del contrato. Los tags archivados permanecerán como fuentes históricas, sin integración indiscriminada.

## **22.2.&#x20;**`persistencia-migracion-av07.md`

Aplicar CV07-01 y CV07-02:

> Incorporar `project-operations.sqlite` y distinguir seis clases lógicas de almacenamiento en cinco familias funcionales. La migración conservará coordinación compartida, autoridad por proyecto y máquina de estados durable. El fencing abarcará almacenamiento, IPC, despacho, credenciales, sesiones y recursos gobernados. No reactivar legado inseguro ni perder escrituras y revocaciones posteriores.

## **22.3.&#x20;**`dependencias-licencias-av07.md`

Aplicar CV07-04, CV07-05 y CV07-06:

> Diferenciar dependencia declarada, artefacto adquirido, bytes comprobados, autenticidad, licencia y funcionamiento instalado. Node 24.22.3/26.13.1, SDK v1/v2 y Playwright permanecerán candidatos. La alpha no se considerará independientemente verificada. Se evaluará su retirada condicionada. Incorporar la contradicción MIT/ISC, SBOM real, supervisión por plataforma y navegación visible bajo autoridad.

## **22.4.&#x20;**`compuertas-av07.md`

Aplicar CV07-03 y CV07-07:

> Representar dependencias reales de artefactos y resultados. Conservar calificaciones previas G0, vertical G1, integración y certificación. El baseline histórico no representa el estado de los diez paquetes actuales. G6 y G6.5 permanecerán separados. No ratificar cardinalidad, porcentajes ni vectores históricos incompletos.

## **22.5.&#x20;**`precedencia-av07.md`

Aplicar CV07-08:

> Distinguir normativa, precedencia documental y autoridad efectiva. Conservar 92 elementos y 11 ampliaciones, clases y promociones exactas, AR-52 y todos los contratos anteriores. Las instrucciones legacy permanecerán subordinadas y las entradas incompatibles se retirarán mediante sustitución y pruebas negativas.

# **23. Bloque de actualización documental del registro maestro**

Nombre propuesto:

`docs/qap-architecture/cierre-av-01/contravalidacion-chatgpt-high-av07.md`

No se ha creado ni publicado ese archivo en GitHub.

```
## Contravalidación independiente AV-07

Fecha: 25 de noviembre de 2026.

Responsable:
ChatGPT High, Contravalidador Técnico Independiente,
en sustitución temporal de Gemini Neon.

Investigador principal:
Codex High.

Referencia:
b22bc9b9d52c8138f9b518ece6b2de89cc2b2559.

Árbol:
ed8f4f371573be98f17972c9252a4d8a3fb60852.

Base auditada por Codex:
45401c45f91b3cd4944f372491e3c3c9f12ec56d.

Dictamen independiente:
APROBABLE EN DISEÑO CON ENMIENDAS VINCULANTES,
RESERVAS Y BLOQUEANTES CONSERVADOS.

Se examinaron los diez registros AR-19, AR-21, AR-23,
AR-26, AR-33, AR-34, AR-41, AR-51, AR-54 y AR-57,
y las ocho objeciones vinculantes del Orquestador.

Se corrige el inventario a diez paquetes.

Se identifican seis clases lógicas de SQLite, agrupables
en cinco familias funcionales, incluida la coordinación
project-operations.sqlite omitida en el inventario
del anexo de migración.

Se conserva reconstrucción selectiva por obligación
y frontera de autoridad.

AR-41 permanece BLOQUEANTE.

Las enmiendas CV07-01 a CV07-08 prevalecerán sobre
los pasajes incompatibles de los anexos de Codex si
el Orquestador decide aceptarlas.

Se preservan los contratos AV-01 a AV-06, D01–D21,
92 elementos normativos, 11 ampliaciones y las
decisiones DE-01–05 no ratificadas.

La alpha Playwright no ha sido independientemente
verificada mediante bytes y descriptor exacto.
Se propone retirada condicionada o verificación completa.

No se certifican runtime, SDK, navegador, distribución,
licencias, supervisor, migración ni aceptación empresarial.

Los 93 grupos y 142 diagnósticos corresponden al JSON
histórico verificado. Los 144 diagnósticos de R2 y su
corrección pertenecen a otro árbol experimental.

Cero experimentos nuevos.

Sin modificación de estados principales.

La decisión de cierre documental corresponde al
Orquestador Principal.
```

## **23.1. Adendas por registro**

```
### AR-19 — Contravalidación AV-07

Aplicar CV07-03.
DAG basado en dependencias reales, calificación G0
mediante artefactos mínimos, G1 vertical instalada,
integraciones posteriores y G6/G6.5 diferenciados.
No imponer precedencias circulares ni ratificar corpus.

### AR-21 — Contravalidación AV-07

Aplicar CV07-04.
Resolver las dependencias efectivas y la cadena de
procedencia. Alpha pendiente de verificación o retirada
acreditada sin regresión. SDK MCP mediante EXP-01a.

### AR-23 — Contravalidación AV-07

Aplicar CV07-04.
Node y SQLite candidatos, versión efectiva, doctor,
FTS, durabilidad, worker y soporte por plataforma.
Preservar escritor único lógico.

### AR-26 — Contravalidación AV-07

Aplicar CV07-07.
Baseline reproducible de diez paquetes, identidad
semántica de diagnósticos y preservación de suites.
No confundir evidencia histórica con medición vigente.

### AR-33 — Contravalidación AV-07

Aplicar CV07-05.
Distribución modular, paquete fuera del workspace,
bootstrap autenticado, actualización por slots,
supervisor independiente y navegación visible real.

### AR-34 — Contravalidación AV-07

Aplicar CV07-01.
Reconstrucción selectiva por obligaciones, matriz de
preservación y retirada, recuperación de antecedentes
sin merge/cherry-pick indiscriminado.

### AR-41 — Contravalidación AV-07

Aplicar CV07-02.
Mantener BLOQUEANTE.
Máquina durable de corte, fencing efectivo de legado,
snapshot coherente, revocación, reconciliación y
recuperación sin pérdida.

### AR-51 — Contravalidación AV-07

Aplicar CV07-06.
Admisibilidad por artefacto y variante. Resolver
licencia MIT/ISC, vulnerabilidades, SBOM, autenticidad
y obligaciones de redistribución.

### AR-54 — Contravalidación AV-07

Aplicar CV07-08.
Precedencia normativa, 92 elementos y 11 ampliaciones,
AR-52 exacto, retirada de interfaces incompatibles
y trazabilidad por contrato, consumidor y prueba.

### AR-57 — Contravalidación AV-07

Aplicar CV07-01.
Diez paquetes y seis clases lógicas SQLite, agrupables
en cinco familias funcionales. Incorporar coordinación,
escritores y recursos compartidos al inventario.
```

## **23.2. Actualización propuesta de índices**

Deberán añadirse referencias a esta contravalidación en:

| Documento                | Actualización                                                |
| ------------------------ | ------------------------------------------------------------ |
| `cierre-av-01/README.md` | Enlace al dictamen independiente                             |
| `registro-maestro.md`    | Adendas a los diez AR existentes                             |
| `informe-av07.md`        | Referencia a enmiendas CV07                                  |
| Cinco anexos AV-07       | Referencia a su resolución vinculante correspondiente        |
| `revision-neon.md`       | Diferenciar revisión histórica de la contravalidación actual |
| Índice de trazabilidad   | Incorporar manifest vigente y transferencia futura           |

Estas modificaciones son propuestas para publicación por el Orquestador, no operaciones realizadas.

## **23.3. Conteo global conservado**

| Estado principal                  | Registros |
| --------------------------------- | --------- |
| Validados                         | 6         |
| Validación experimental pendiente | 17        |
| Pendientes                        | 26        |
| Bloqueantes                       | 8         |
| **Total**                         | **57**    |

No se duplican las diez fichas AV-07.

La mera aceptación de sus contratos no altera los conteos.

# **24. Decisión recomendada al Orquestador**

| Decisión                                                     | Recomendación                       |
| ------------------------------------------------------------ | ----------------------------------- |
| Aprobar el informe original sin cambios                      | No                                  |
| Aceptar reconstrucción selectiva                             | Sí                                  |
| Aceptar CV07-01 a CV07-08                                    | Sí, previa revisión del Orquestador |
| Adoptar los diez paquetes como inventario real               | Sí                                  |
| Reconocer seis clases lógicas SQLite                         | Sí                                  |
| Conservar necesariamente diez paquetes en arquitectura final | No                                  |
| Reutilizar indiscriminadamente código histórico              | No                                  |
| Recuperar mecanismos y pruebas trazables                     | Sí                                  |
| Seleccionar Node definitivamente                             | No todavía                          |
| Seleccionar SQLite driver definitivamente                    | No todavía                          |
| Seleccionar SDK MCP v2 automáticamente                       | No                                  |
| Ratificar alpha Playwright                                   | No                                  |
| Eliminar alpha sin pruebas de equivalencia                   | No                                  |
| Aprobar distribución ligera como hecho demostrado            | No                                  |
| Aprobar supervisor universal por diseño                      | No                                  |
| Autorizar migración real                                     | No                                  |
| Retirar estado BLOQUEANTE de AR-41                           | No                                  |
| Aprobar licencia definitiva de QAP                           | No                                  |
| Reducir alcance D11, D13 o D14                               | No                                  |
| Adoptar cardinalidad y porcentajes de aceptación             | No                                  |
| Ratificar DE-01–05                                           | No                                  |
| Elaborar WBS o iniciar G0/G1                                 | No autorizado                       |
| Iniciar AV-08                                                | No autorizado                       |

# **25. Dictamen final**

**AV-07: APROBABLE EN DISEÑO CON ENMIENDAS VINCULANTES, RESERVAS Y BLOQUEANTES CONSERVADOS.**

La reconstrucción selectiva propuesta por Codex constituye una base razonable para la futura arquitectura de QAP. Sus contratos principales pueden consolidarse sin reabrir las auditorías anteriores ni adoptar una reescritura indiscriminada.

No obstante, se identificaron cinco cuestiones particularmente relevantes:

1. El inventario original de nueve paquetes es incorrecto.
2. La base `project-operations.sqlite` fue omitida del inventario de persistencia.
3. La protección de SQLite no garantiza la exclusión efectiva del escritor legado.
4. La independencia del ejecutor no garantiza por sí sola navegación visible segura.
5. La admisibilidad de dependencias y artefactos no puede declararse completa sin verificar sus identidades, licencias y distribución efectiva.

Las ocho objeciones reciben una resolución contractual mediante CV07-01 a CV07-08. Persisten las reservas documentales y experimentales identificadas, incluida la imposibilidad de verificar independientemente los bytes y descriptor exacto de la dependencia alpha.

**Recomiendo al Orquestador aceptar el diseño enmendado con reservas, si considera suficientes estas resoluciones para el cierre documental, manteniendo AR-41 BLOQUEANTE y los otros nueve registros AV-07 PENDIENTES.**

La presente entrega no constituye certificación tecnológica, autorización de implementación, aprobación de migración ni ratificación de decisiones del propietario.

**Declaración de cumplimiento:** investigación exclusivamente de lectura; cero modificaciones en GitHub, código, dependencias, CI o configuración ejecutable; cero instalaciones; cero experimentos nuevos; sin creación de ramas o worktrees; sin acceso a sistemas empresariales; sin elaboración de WBS; sin inicio de G0/G1 ni AV-08.

**Fin del informe de contravalidación técnica independiente AV-07.**
