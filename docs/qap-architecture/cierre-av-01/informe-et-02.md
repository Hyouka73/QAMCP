# **ET-02 — Informe de evaluación tecnológica independiente de QAP**

**Especialidad:** Persistencia, memoria, búsqueda y consultas\
**Destinatario:** Orquestador Principal de QAP\
**Fecha:** 26 de noviembre de 2026\
**Repositorio:** `Hyouka73/QAMCP`\
**Rama exclusiva:** `develop`\
**SHA del encargo:** `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029`\
**Base normativa y de código fijada por los encargos:** `1a81e86c9b17a95a04e40237eff5fb99215bae5a`\
**Naturaleza:** Investigación tecnológica documental independiente.

## **1. Resumen ejecutivo**

Dictamen tecnológico preliminar ET-02

# **CONDICIONADO**

Existe una ruta tecnológica razonable para satisfacer las obligaciones de persistencia, memoria, búsqueda y consultas profesionales de QAP v1. No existe todavía evidencia suficiente para declarar conformidad instalada ni seleccionar definitivamente sus componentes.

**SQLite local**

Conservar la decisión empresarial vigente.

**Capa de persistencia actual**

Reconstrucción selectiva de autoridad, transacciones y contratos.

**FTS5 con aislamiento de visibilidad**

Candidato principal de búsqueda local.

**Escritor canónico único**

Condición arquitectónica no negociable.

### **1.1. Recomendación principal**

| Componente           | Candidato principal                                 | Respaldo                                                       |
| -------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Motor transaccional  | SQLite nativo                                       | SQLite nativo mediante distribución alternativa                |
| Driver               | `node:sqlite` sobre Node 24 LTS calificado          | `better-sqlite3`                                               |
| Persistencia crítica | WAL + FULL                                          | Otro modo SQLite únicamente si acredita garantías equivalentes |
| Consultas            | SQL explícito parametrizado y repositorios tipados  | Query builder tipado                                           |
| Migraciones          | SQL versionado y reconciliación semántica           | Migrador especializado detrás del puerto                       |
| Búsqueda textual     | FTS5 segregado por visibilidad                      | Búsqueda lexical sobre corpus autorizado                       |
| Búsqueda semántica   | Complemento local opcional                          | Búsqueda lexical determinista                                  |
| Memoria histórica    | Modelo relacional versionado                        | Misma semántica mediante otro adaptador SQLite                 |
| Evidencia pesada     | Custodio separado y referencias autenticadas        | Almacenamiento protegido equivalente                           |
| Recuperación         | Backup SQLite consistente y manifiesto generacional | `VACUUM INTO` bajo condiciones calificadas                     |
| PostgreSQL           | Diferido conforme a decisión ratificada             | No constituye sustituto autorizado de v1                       |

La investigación no encuentra una razón documental suficiente para abandonar SQLite, introducir un servidor de bases de datos, exigir un motor vectorial o adoptar una infraestructura de recuperación aumentada por IA como dependencia obligatoria.

Sí identifica motivos suficientes para **no conservar intacta la arquitectura de persistencia actual**: pluralidad de escritores, inconsistencias de durabilidad, acoplamiento al driver, persistencia dual y posibles filtraciones mediante estadísticas de búsqueda.

El problema fundamental de QAP no es la ausencia de una base de datos más avanzada. Es la necesidad de construir una autoridad de datos coherente que preserve identidad, procedencia, permisos, revisiones, efectos, memoria y veracidad entre todos sus consumidores.

## **2. Alcance, fuentes internas y límites de revisión**

### **2.1. Encargos vinculantes**

Se recuperaron y leyeron íntegramente ambos encargos mediante el conector de GitHub, fijados al SHA solicitado:

- [Encargo común de evaluación tecnológica](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com).
- [Encargo especializado ET-02](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-02.md?utm_source=chatgpt.com).

Ambos establecen expresamente que la base de investigación normativa y de código es `1a81e86c9b17a95a04e40237eff5fb99215bae5a`. Se respeta esta distinción respecto al SHA de publicación del encargo.

### **2.2. Expediente consultado**

Las siguientes referencias corresponden al expediente interno de QAP.

| Referencia | Documento                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01        | [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                          |
| Q02        | [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                     |
| Q03        | [Manifiesto normativo consolidado](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com) |
| Q04        | [Manifiesto AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/manifiesto-ac01.md?utm_source=chatgpt.com)                                  |
| Q05        | [Matriz de aceptación AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/matriz-aceptacion-ac01.md?utm_source=chatgpt.com)                 |
| Q06        | [Contratos AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/contratos-ac01.md?utm_source=chatgpt.com)                                    |
| Q07        | [Acta de ratificación DE](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                      |
| Q08        | [Acta de ratificación AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/acta-ratificacion-ac01.md?utm_source=chatgpt.com)                 |
| Q09        | [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                                 |
| Q10        | [Persistencia y migración AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/persistencia-migracion-av07.md?utm_source=chatgpt.com)        |
| Q11        | [Dependencias y licencias AV-07](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/dependencias-licencias-av07.md?utm_source=chatgpt.com)        |
| Q12        | [Enmiendas AV-03](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/enmiendas-av03.md?utm_source=chatgpt.com)                                    |
| Q13        | [Resolución final AC-01](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/docs/qap-architecture/cierre-av-01/resolucion-final-ac01.md?utm_source=chatgpt.com)                      |
| Q14        | [Matriz de responsabilidades ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com)             |

**Límite material de revisión:** aunque se recuperaron documentos extensos y el árbol completo de la base de código, parte del expediente y del código se inspeccionó mediante extractos filtrados. No se declara lectura íntegra de todos los anexos normativos ni una auditoría exhaustiva línea por línea del lockfile, imports y pruebas. Esta limitación impide presentar este informe como cumplimiento íntegro certificado del método común.

Los hallazgos sustentados se mantienen útiles para la integración tecnológica, pero el Orquestador deberá conservar esta reserva documental.

### **2.3. Clasificación utilizada**

| Código | Significado                                          |
| ------ | ---------------------------------------------------- |
| D      | Capacidad documentada por fuente primaria            |
| C      | Viabilidad condicionada a integración o calificación |
| I      | Información insuficiente                             |
| N      | No soportado o incompatible                          |
| X      | Fuera del alcance autorizado                         |

Ninguna de estas clasificaciones equivale a un PASS de producto.

## **3. Restricciones normativas preservadas**

La investigación no propone modificar:

- Las 123 entradas normativas: 110 requisitos, 2 políticas y 11 ampliaciones.
- Las 65 cláusulas AC-01.
- Los 57 registros maestros y sus estados.
- D01–D21.
- DE-01–05: A/B/B/A con B de respaldo/B.
- AC-DE-01–07: B/A/B/A/A/A/A.
- HOST + DETERMINISTIC como únicos modos iniciales.
- Operación profesional sin IA obligatoria.
- Conformidad instalada del 100 % y vetos no compensables.

### **3.1. Filtros eliminatorios tecnológicos**

| Restricción                                   | Consecuencia para ET-02                                     |
| --------------------------------------------- | ----------------------------------------------------------- |
| Producto profesional local                    | No exigir servicios remotos de persistencia                 |
| SQLite v1 ratificado                          | No sustituirlo por PostgreSQL unilateralmente               |
| Escritor canónico                             | No permitir escrituras directas desde consumidores          |
| Producción y referencia de lectura acreditada | Una consulta no puede ampliar autoridad                     |
| Privacidad desde la adquisición               | Índices, cachés y backups también quedan sujetos a custodia |
| Sin IA obligatoria                            | Consultas, búsqueda y memoria deben funcionar sin modelos   |
| Retención ratificada                          | No eliminar evidencia protegida para recuperar espacio      |
| AR-52                                         | Preservar hechos, ejes, veredictos e intentos               |
| Instalación multiplataforma                   | Calificar artefactos reales por SO y CPU                    |
| Sin compra obligatoria                        | Evitar dependencias comerciales indispensables              |
| PostgreSQL posterior                          | Puerto portable, no segundo motor activo                    |

Un candidato que incumpla cualquiera de estos filtros no puede resultar seleccionado por ventajas de rendimiento, ergonomía o popularidad.

## **4. Inventario tecnológico real de QAP**

### **4.1. Persistencia existente**

La inspección estática del árbol de referencia devolvió 1.380 entradas, sin truncamiento del árbol.

El expediente AV-07 y su contravalidación establecen **seis clases lógicas SQLite distribuidas en cinco familias**, no seis archivos físicos universales por instalación.

| Almacén o clase             | Responsabilidad histórica                                       | Disposición recomendada                            |
| --------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `app-service.sqlite`        | Aplicaciones, perfiles, permisos, campañas, tareas y resultados | Reconstruir autoridad y persistencia transaccional |
| `project-operations.sqlite` | Operaciones del proyecto                                        | Integrar bajo autoridad coordinada                 |
| `knowledge.sqlite`          | Conocimiento, revisiones, relaciones y FTS                      | Adaptar mecanismos aprovechables                   |
| `interview.sqlite`          | Borradores y generaciones                                       | Integrar en modelo de razonamiento durable         |
| `closure.sqlite`            | Cierre de módulos y generaciones                                | Integrar en conocimiento versionado                |
| `.qa/runtime/qap.sqlite`    | Ejecuciones y resultados                                        | Migrar historia y sustituir escritura directa      |
| YAML/JSON/JSONL históricos  | Configuración, conocimiento, planes, resultados y eventos       | Importar o regenerar según su naturaleza           |
| Sesiones y secretos         | Credenciales y estado de autenticación                          | Mantener separados, bajo ET-06                     |

La última parte de la tabla incluye soportes no SQLite para explicar la topología completa, sin aumentar el conteo normativo de clases SQLite.

### **4.2. Evidencia directamente inspeccionada**

| Archivo de código                                                                                                                                                                                                    | Evidencia                                                         | Evaluación                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| [knowledge-sqlite-schema.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/src/storage/knowledge-sqlite-schema.ts?utm_source=chatgpt.com#L9-L142)               | Revisiones, scopes, triggers de inmutabilidad, migraciones y FTS5 | Base aprovechable                               |
| [sqlite-knowledge-adapter.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts?utm_source=chatgpt.com#L145-L168)           | Driver nativo, WAL, FULL, claves foráneas                         | Adaptar                                         |
| [sqlite-knowledge-adapter.ts, búsqueda](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/src/storage/sqlite-knowledge-adapter.ts?utm_source=chatgpt.com#L234-L282) | BM25 y filtrado por aplicación                                    | Aislamiento insuficiente para garantía objetivo |
| [knowledge-store.port.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/engine/src/knowledge-store.port.ts?utm_source=chatgpt.com)                                        | Contrato de persistencia de conocimiento                          | Conservar conceptos; ampliar alcance            |
| [app-service-store.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/application/app-service-store.ts?utm_source=chatgpt.com)                                     | Tablas y migraciones propias, conexión SQLite directa             | Reconstrucción selectiva                        |
| [host-composition.ts:413](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/host-composition.ts?utm_source=chatgpt.com#L413)                                          | Composición persistente mediante manifiesto deshabilitada         | No acredita continuidad funcional               |
| [interview-draft-store.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/handlers/interview-draft-store.ts?utm_source=chatgpt.com#L69-L146)                       | Historial por generación y transacciones                          | Reutilización conceptual                        |
| [module-closure-store.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/mcp/src/handlers/module-closure-store.ts?utm_source=chatgpt.com#L126-L256)                        | Versiones, scope y comprobaciones antes de commit                 | Reutilización conceptual                        |
| [sqlite-client.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/reporter/src/persistence/sqlite-client.ts?utm_source=chatgpt.com#L416-L500)                              | Escritura JSON y transacción SQLite posterior                     | Riesgo de divergencia                           |
| [evidence-artifacts.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/playwright-runner/src/evidence-artifacts.ts?utm_source=chatgpt.com#L868-L960)                       | Escritura de resultados y apertura SQLite desde runner            | Retirar autoridad escritora directa             |
| [prune.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/cli/src/commands/prune.ts?utm_source=chatgpt.com)                                                                | Motor de poda específico de CLI                                   | Sustituir por política común                    |
| [history-manager.ts](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/src/history/history-manager.ts?utm_source=chatgpt.com)                                       | Mecanismo histórico de registro de ejecuciones                    | Integrar con hechos canónicos                   |

### **4.3. Dependencias observadas**

El manifiesto de `@qap/knowledge` contiene:

| Dependencia       | Rango declarado | Función                  |
| ----------------- | --------------- | ------------------------ |
| `@qap/shared`     | Workspace       | Tipos compartidos        |
| `@qap/engine`     | Workspace       | Contratos de dominio     |
| `ajv`             | `^8.20.0`       | Validación               |
| `ajv-formats`     | `^3.0.1`        | Formatos                 |
| `proper-lockfile` | `^4.1.2`        | Coordinación de archivos |
| `yaml`            | `^2.9.0`        | Serialización            |
| `@types/node`     | `^26.2.0`       | Tipado de desarrollo     |
| `vitest`          | `^4.1.11`       | Pruebas                  |

Fuente: [packages/knowledge/package.json](https://github.com/Hyouka73/QAMCP/blob/1a81e86c9b17a95a04e40237eff5fb99215bae5a/packages/knowledge/package.json?utm_source=chatgpt.com).

El driver actual es `node:sqlite`. Al formar parte del runtime, su versión efectiva de SQLite no se determina solamente mediante `pnpm-lock.yaml`.

El expediente de dependencias AV-07 identifica `better-sqlite3` como alternativa todavía no incorporada al lockfile de referencia. Los rangos de manifiesto tampoco deben confundirse con versiones resueltas o instaladas.

El árbol incluye pruebas de contrato del almacén, concurrencia WAL, modo auditoría, preflight SQLite adversarial, historial y poda. Su existencia es evidencia de activos reutilizables, **no prueba de que actualmente pasen ni de que cubran las nuevas obligaciones AC-01**.

### **4.4. Hallazgos técnicos principales**

| ID propuesto ET | Hallazgo                                                                | Riesgo  |
| --------------- | ----------------------------------------------------------------------- | ------- |
| ET02-H01        | Escritores distribuidos entre paquetes y superficies                    | Crítico |
| ET02-H02        | Durabilidad desigual entre almacenes                                    | Crítico |
| ET02-H03        | FTS filtrado sobre estadísticas potencialmente compartidas              | Alto    |
| ET02-H04        | Representaciones SQLite y JSON con confirmación separada                | Crítico |
| ET02-H05        | Composición persistente parcialmente deshabilitada                      | Alto    |
| ET02-H06        | Puerto existente limitado al conocimiento, no a toda la autoridad       | Alto    |
| ET02-H07        | Tipado Node 26 frente a candidato Node 24                               | Alto    |
| ET02-H08        | Retención y poda fragmentadas                                           | Alto    |
| ET02-H09        | Ausencia de garantía instalada sobre versión efectiva y opciones SQLite | Alto    |
| ET02-H10        | Necesidad de distinguir revisión inmutable de conservación revocable    | Crítico |

Estos identificadores son referencias del informe tecnológico; no constituyen nuevos registros maestros ni cambian los 57 existentes.

## **5. Evaluación del motor y sus drivers**

### **5.1. SQLite nativo**

**Dictamen: APTO COMO CANDIDATO DE MOTOR.**

SQLite proporciona las primitivas necesarias para construir la persistencia local de QAP:

- Transacciones ACID.
- Restricciones e integridad referencial.
- Índices relacionales.
- WAL.
- FTS5.
- Backup consistente.
- Consultas parametrizadas.
- Transacciones condicionales para CAS.

Su documentación y código distribuible están dedicados al dominio público. No requiere una licencia comercial obligatoria para incorporarlo a QAP.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://sqlite.org\&sz=32)

sqlite.org



Sin embargo, SQLite no proporciona automáticamente:

- Aislamiento semántico entre tenants y perfiles.
- Control de autoridad por efecto empresarial.
- Revocación de operaciones externas en vuelo.
- Promoción epistemológica.
- Retención conforme a grants.
- Inmutabilidad verificable frente a un operador privilegiado.
- Separación de identidades del sistema operativo.
- Recuperación consistente de archivos externos y múltiples bases por generación.

Estas garantías corresponden a QAP y a su composición con ET-01, ET-05 y ET-06.

### **5.2. Comparación de drivers y alternativas**

| Tecnología                                    | Situación                  | Ventajas                                               | Limitaciones                                                              | Dictamen              |
| --------------------------------------------- | -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------- |
| `node:sqlite`                                 | Actual                     | Integrado en Node, elimina addon SQLite externo        | API síncrona, versión SQLite ligada al runtime                            | Candidato principal   |
| `better-sqlite3`                              | Alternativa                | API madura y control independiente del SQLite embebido | Addon nativo, prebuilds, ABI y cadena adicional                           | Respaldo condicionado |
| SQLite C nativo mediante adaptador controlado | Alternativa arquitectónica | Control de compilación, VFS y versión                  | Mayor mantenimiento, integración y superficie de distribución             | Respaldo secundario   |
| `node-sqlite3`                                | Alternativa histórica      | Interfaz asíncrona conocida                            | Proyecto marcado como obsoleto y archivado                                | Descartar             |
| SQLite WASM/OPFS                              | Alternativa de entorno     | Portabilidad en navegador                              | Autoridad ligada al entorno web y restricciones de almacenamiento/locking | No para autoridad v1  |
| PostgreSQL                                    | Posterior                  | Concurrencia multiusuario y servidor transaccional     | Contradice composición local ratificada si se exige en v1                 | Diferido              |

El repositorio oficial de `node-sqlite3` declara su obsolescencia. No resulta conveniente iniciar una reconstrucción profesional dependiendo de este binding.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



SQLite WASM dispone de persistencia OPFS, pero las restricciones de locking y acceso dependen del VFS y del entorno de ejecución. No demuestra equivalencia con una autoridad local independiente de la UI.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://sqlite.org\&sz=32)

sqlite.org



### **5.3. Candidato principal: Node 24 LTS +&#x20;**`node:sqlite`

El expediente AV-07 propone Node 24.22.3 como referencia de evaluación. La publicación oficial confirma que dicha versión fue liberada como actualización de seguridad el 11 de noviembre de 2026.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js 24.22.3 (LTS)



No se declara que sea necesariamente el último parche disponible ni se congela como versión definitiva.

**Rango candidato:** rama Node 24 LTS, con parche vigente y calificado en el momento de selección.

Condiciones:

1. Verificar API real del driver.
2. Verificar FTS5 ejecutando operaciones representativas en la futura calificación.
3. Registrar `sqlite_version()` y `sqlite_source_id()`.
4. Registrar `PRAGMA compile_options`.
5. Verificar operaciones de backup.
6. Alinear `engines`, TypeScript, `@types/node` y código emitido.
7. Mantener las operaciones SQLite síncronas fuera del hilo sensible al transporte MCP y la UI.
8. Evitar el uso accidental de APIs disponibles solamente en Node 26.

La política oficial de Node recomienda ramas LTS para aplicaciones de producción.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://nodejs.org\&sz=32)

Node.js Releases



La documentación específica de la API Node 24.22.3 no fue accesible mediante la consulta pública utilizada. Por ello, no se acredita aquí la disponibilidad exacta de todas sus APIs de mantenimiento y backup.

### **5.4. Respaldo:&#x20;**`better-sqlite3`

**Referencia candidata:** 13.2.0, identificada en AV-07 y publicada en el [repositorio oficial](https://github.com/WiseLibs/better-sqlite3/releases/tag/v13.2.0?utm_source=chatgpt.com).

Ventajas:

- Permite desacoplar la actualización SQLite del ciclo de publicación de Node.
- Ofrece una API apropiada para un escritor dedicado.
- Permite mantener SQL explícito y transacciones controladas.
- Cuenta con licencia MIT.

Desventajas:

- Introduce un componente binario adicional.
- Debe verificarse compatibilidad por ABI, SO y CPU.
- Requiere incorporar avisos de licencia y procedencia.
- Una instalación sin prebuild compatible puede intentar compilar el addon.

El proyecto documenta distribución de binarios precompilados y compilación en instalaciones sin binario compatible. QAP no debe depender silenciosamente de esa compilación en el equipo final.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



**Condición de activación del respaldo:** demostrar una ventaja material o resolver una garantía que `node:sqlite` no pueda acreditar.

No recomiendo distribuir ambos drivers permanentemente como fallback automático. Eso duplicaría las combinaciones que deben calificarse y complicaría el mantenimiento.

### **5.5. Hallazgo de seguridad especialmente relevante: WAL-reset**

SQLite documenta un defecto de corrupción de base de datos relacionado con el reinicio del WAL, identificado el 3 de marzo de 2026.

La documentación sitúa el intervalo probablemente afectado entre SQLite 3.7.0 y 3.51.2, e identifica la corrección en 3.51.3 y determinados backports.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www2.sqlite.org\&sz=32)

www2.sqlite.org+2



Esto tiene una consecuencia directa para QAP:

**No basta con comprobar que SQLite admite WAL y FULL. Debe verificarse también que el código SQLite realmente distribuido contiene las correcciones pertinentes.**

AV-07 identifica SQLite 3.54.1 en el código fuente del candidato Node 24.22.3. Esa identificación documental debe contrastarse con el `source_id` del artefacto instalado y con los avisos vigentes; no prueba por sí sola qué SQLite ejecuta QAP actualmente.

El hallazgo no demuestra que QAP haya sufrido corrupción. Sí justifica incorporar la comprobación del parche y escenarios concurrentes de checkpoint a la calificación de AR-12.

## **6. Arquitectura física y lógica recomendada**

### **6.1. Principio fundamental**

Una autoridad canónica no significa necesariamente un archivo SQLite único para todo el sistema.

Tampoco significa crear una base de datos para cada dominio funcional.

La unidad de separación física debe depender de:

- Frontera efectiva de autoridad.
- Necesidad de atomicidad.
- Dominio de visibilidad.
- Custodia.
- Recuperación.
- Ciclo de vida.
- Costos de almacenamiento y mantenimiento.

### **6.2. Composición candidata**

### **6.3. Alternativas de topología**

| Topología                                      | Beneficio                                      | Riesgo                                           | Recomendación            |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ | ------------------------ |
| Una BD global                                  | Atomicidad sencilla entre entidades            | Contención, backups amplios y radio de impacto   | No preferida por defecto |
| Una BD canónica por autoridad de proyecto      | Aislamiento y recuperación acotada             | Coordinación de datos compartidos                | Principal                |
| Cinco BDs por dominio funcional                | Modularidad aparente                           | Transacciones distribuidas artificiales          | Descartar como regla     |
| BD por tenant/perfil                           | Aislamiento físico reforzado                   | Fragmentación, migraciones y consultas complejas | Condicionada             |
| BD canónica y almacenamiento derivado separado | Permite reconstruir índices sin alterar verdad | Desfase y mayor coordinación                     | Complemento recomendado  |

SQLite documenta limitaciones de atomicidad conjunta entre bases adjuntas cuando se utiliza WAL. Por tanto, no debe diseñarse un commit crítico suponiendo atomicidad entre varios archivos independientes.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.sqlite.org\&sz=32)

sqlite.org



### **6.4. Decisión documental propuesta**

Mantener en una misma frontera transaccional los datos cuya confirmación conjunta sea indispensable:

- Intención de operación.
- Estado de autoridad aplicable.
- Reserva de presupuesto.
- Estado del intento.
- Identidad de deduplicación.
- Recibo durable.
- Referencia a publicación cuando corresponda.

Los registros globales, índices derivados, cachés y objetos protegidos pueden residir en otras fronteras si se acredita un protocolo coherente de coordinación.

El número final de archivos queda condicionado a E2 y EXP-08. No debe determinarse por conveniencia de empaquetado.

## **7. Modelo de memoria profesional**

### **7.1. Cuatro planos epistémicos**

| Plano            | Contenido                                   | Regla                                  |
| ---------------- | ------------------------------------------- | -------------------------------------- |
| Observación      | Información observada, extraída o declarada | No equivale a verdad normativa         |
| Inferencia       | Hipótesis y propuestas derivadas            | Requiere acreditación para promoción   |
| Regla acreditada | Expectativas y restricciones autorizadas    | Versionada y vinculada a fuente        |
| Resultado        | Hechos de ejecución y evaluación            | Vinculados a intento y regla aplicable |

Ejemplo: observar diez veces que una aplicación permite determinado importe no acredita que ese importe sea empresarialmente correcto.

La búsqueda puede recuperar esa observación; la memoria no puede promoverla automáticamente a regla.

### **7.2. Cinco dominios funcionales**

La siguiente agrupación es una propuesta de responsabilidades de persistencia compatible con el contrato AC-01, no una redefinición normativa de los cinco dominios ni una división obligatoria de paquetes.

| Responsabilidad                | Entidades representativas                                     | Garantía                       |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------ |
| Conocimiento y contexto        | Fuentes, observaciones, reglas, dependencias, contradicciones | Procedencia y alcance          |
| Diseño y estrategia            | Casos, revisiones, riesgos, sets y selección                  | Versionado y trazabilidad      |
| Operación y ejecución          | Campañas, asignaciones, tareas, charters e intentos           | Continuidad y estados durables |
| Datos y efectos                | Dataset, fixture, reservas, intención y reconciliación        | Autoridad y no duplicación     |
| Resultados y memoria histórica | Defectos, recetas, métricas, publicaciones y evidencia        | Veracidad y conservación       |

Un defecto puede relacionarse con un resultado, una regla acreditada, un caso y una nueva revisión sin copiar esas entidades como fuentes independientes de verdad.

### **7.3. Revisión inmutable**

Recomiendo conservar el patrón existente de revisiones inmutables, extendiéndolo bajo un modelo común.

Cada revisión debería identificar:

- Entidad estable y revisión concreta.
- Scope efectivo.
- Autor y procedencia.
- Versión de esquema.
- Revisión anterior.
- Estado de acreditación.
- Motivo de cambio.
- Dependencias.
- Política de conservación.

La inmutabilidad se aplica a la historia autorizada. No constituye permiso para conservar indefinidamente payloads cuya conservación haya sido revocada.

**ET02-H10:** la coexistencia de revisiones inmutables y obligaciones de supresión requiere una separación explícita entre metadatos históricos mínimos y contenido protegido eliminable.

No recomiendo resolverlo manteniendo datos revocados en tablas históricas bajo el argumento de que un event log debe ser inmutable.

### **7.4. Temporalidad y consultas&#x20;**`as-of`

Es necesario distinguir, como mínimo:

| Dimensión temporal     | Significado                                 |
| ---------------------- | ------------------------------------------- |
| Tiempo observado       | Cuándo se produjo o adquirió el hecho       |
| Tiempo registrado      | Cuándo fue confirmado por QAP               |
| Vigencia               | Cuándo una regla o revisión aplica          |
| Corte de publicación   | Universo exacto consultado para un reporte  |
| Verificabilidad actual | Qué evidencia sigue disponible y autorizada |

No es indispensable introducir un motor bitemporal generalizado. SQLite puede representar estas dimensiones mediante revisiones, secuencias y relaciones explícitas.

Una consulta histórica puede reproducir el conocimiento conservado a una fecha determinada, pero no debe afirmar que recupera datos eliminados ni que un resultado conserva verificabilidad actual cuando su evidencia indispensable ya no existe.

### **7.5. Regresión, contradicciones y aprendizaje**

La memoria debe soportar aprendizaje longitudinal sin alterar expectativas normativas:

- Agrupar firmas de fallos versionadas.
- Identificar posibles duplicados.
- Registrar inestabilidad y distribuciones de latencia.
- Propagar estado obsoleto a dependencias afectadas.
- Mantener ediciones manuales protegidas.
- Proponer reparaciones y nuevas revisiones.
- Conservar resultados anteriores al retest.

Las relaciones de dependencia pueden representarse mediante tablas de aristas, índices y consultas recursivas acotadas.

No existe evidencia documental suficiente para justificar incorporar Neo4j u otro motor de grafos obligatorio a v1. Introducirlo aumentaría la complejidad de autoridad, consistencia, instalación y recuperación sin resolver una obligación que SQLite no pueda representar.

## **8. Transacciones, durabilidad y recuperación**

### **8.1. Clases de persistencia**

No todos los datos necesitan el mismo costo de sincronización. Su clasificación debe depender de las consecuencias de perderlos.

| Información                               | Durabilidad propuesta        |
| ----------------------------------------- | ---------------------------- |
| Revocaciones                              | FULL antes de confirmación   |
| Concesiones acreditadas                   | FULL                         |
| Intenciones de efectos externos           | FULL antes del despacho      |
| Reservas y deduplicación no reconstruible | FULL                         |
| Revisiones acreditadas                    | FULL                         |
| Resultados confirmados                    | FULL                         |
| Publicaciones confirmadas                 | FULL                         |
| Índices secundarios reconstruibles        | NORMAL evaluable             |
| Caché descartable                         | Persistencia débil o memoria |
| Secretos y sesiones                       | Custodia independiente ET-06 |

SQLite documenta que FULL añade sincronización del WAL al confirmar cada transacción, mientras NORMAL omite esa sincronización por commit. Esto afecta la durabilidad ante pérdida de energía, no solamente el rendimiento.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.sqlite.org\&sz=32)

sqlite.org



**Conclusión:** NORMAL no es aceptable como política general para toda la autoridad de QAP.

### **8.2. Transacciones CAS y concurrencia**

El escritor canónico debe comprobar conjuntamente:

- Identidad efectiva del principal.
- Identidad del objeto.
- Estado esperado.
- Revisión esperada.
- Generación de autoridad.
- Época de instancia y tarea.
- Vigencia de autorización.
- Presupuesto y reservas.

El reclamo de trabajo debe seleccionar una unidad elegible mediante orden estable y confirmar la transición dentro de una transacción breve.

`BEGIN IMMEDIATE`, actualizaciones condicionales y `RETURNING` son mecanismos candidatos de SQLite. Deben usarse verificando cuidadosamente su comportamiento y limitaciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.sqlite.org\&sz=32)

sqlite.org



No se debe mantener una transacción abierta mientras:

- Se espera al HOST.
- Se realiza navegación.
- Se consume una API empresarial.
- Se genera un reporte pesado.
- Se espera intervención humana.
- Se procesa multimedia.

### **8.3. Recuperación de efectos externos**

El fencing de SQLite protege el estado local, pero no cancela automáticamente una solicitud enviada previamente a un sistema empresarial.

Si existe una caída después del despacho y antes de confirmar el resultado, QAP debe preservar la incertidumbre.

El puerto de persistencia no puede convertir una ausencia de recibo en ausencia de efecto.

La repetición solamente será elegible cuando exista idempotencia acreditada para el destino o reconciliación suficiente que permita un nuevo efecto.

### **8.4. Backup y restauración**

| Alternativa                                     | Evaluación                                |
| ----------------------------------------------- | ----------------------------------------- |
| Online Backup API                               | Principal                                 |
| `VACUUM INTO`                                   | Respaldo condicionado                     |
| Copia física con cierre y exclusión verificados | Mantenimiento controlado                  |
| Copia del archivo SQLite activo sin WAL         | Inadmisible                               |
| Copia independiente de varias bases activas     | Insuficiente para coherencia generacional |

SQLite documenta la API de backup consistente y `VACUUM INTO` como mecanismos de copia de una base.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://sqlite.org\&sz=32)

sqlite.org+1



QAP debe añadir un manifiesto que identifique la coherencia entre:

- Base canónica.
- Objetos externos autorizados.
- Esquema y versión.
- Revisiones.
- Generación de autoridad.
- Estado de revocación.
- Integridad del conjunto.

Un backup antiguo puede contener permisos posteriormente revocados. Por ello, restaurar físicamente una base no puede restaurar automáticamente su autoridad operativa.

Si no puede verificarse el estado vigente de las revocaciones, la recuperación debe permanecer cerrada a operaciones afectadas hasta su reconciliación.

## **9. Esquema, consultas y migraciones**

### **9.1. Comparación tecnológica**

| Alternativa                 | Control transaccional           | Tipado             | Dependencias      | Integración                           |
| --------------------------- | ------------------------------- | ------------------ | ----------------- | ------------------------------------- |
| SQL explícito               | Alto                            | Debe construirse   | Mínimas           | Media                                 |
| Kysely                      | Alto, con acceso SQL específico | Alto en TypeScript | Adicionales       | Media                                 |
| Drizzle                     | Alto, según dialecto            | Alto               | Adicionales       | Media                                 |
| ORM generalista             | Variable                        | Alto               | Mayor abstracción | Media-alta                            |
| JSON como almacén principal | Insuficiente para el objetivo   | Variable           | Bajas             | Alto costo de garantizar consistencia |

Kysely documenta dialectos SQLite y PostgreSQL, lo que puede facilitar una futura separación de adaptadores.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://kysely.dev\&sz=32)

Kysely



Drizzle documenta soporte para `node:sqlite`; la guía consultada presenta instalaciones mediante versiones RC, por lo que no debe presumirse estabilidad definitiva de esa composición.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://orm.drizzle.team\&sz=32)

Node SQLite



### **9.2. Recomendación**

Utilizar SQL explícito parametrizado para:

- Autoridad y revocaciones.
- CAS.
- Reclamo de trabajo.
- Migraciones.
- FTS5.
- Recuperación.
- Consultas sensibles a permisos.
- Procesamiento de efectos y publicaciones.

Evaluar Kysely como complemento para consultas relacionales complejas y mantenimiento del tipado, si acredita compatibilidad con el driver elegido y no oculta las garantías anteriores.

Drizzle permanece como alternativa evaluable, condicionada a la estabilidad y compatibilidad de su versión concreta.

No recomiendo adoptar un ORM generalista como centro de la autoridad ni permitir que su modelo de entidades sustituya el contrato de dominio.

### **9.3. Restricciones de esquema**

SQLite dispone de tablas STRICT desde la versión 3.37.0, lo que permite exigir tipos más estrictos donde resulte pertinente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.sqlite.org\&sz=32)

sqlite.org



Recomiendo combinar:

| Mecanismo             | Propósito                     |
| --------------------- | ----------------------------- |
| `STRICT`              | Reducir coerciones indeseadas |
| Claves foráneas       | Integridad referencial        |
| Restricciones `CHECK` | Invariantes estructurales     |
| Índices únicos        | Identidad y deduplicación     |
| Revisiones inmutables | Historia                      |
| Transacciones         | Cambios coordinados           |
| Validadores DTO       | Semántica de entrada          |
| Política de dominio   | Autoridad y acreditación      |

Las restricciones SQL son defensa adicional, no sustituto de la política de dominio.

Para valores sensibles a precisión se debe evitar convertir indiscriminadamente enteros grandes o importes decimales a números JavaScript de punto flotante. ET-05 debe compartir el mismo contrato de representación para XLSX, PDF y otros formatos.

### **9.4. Migraciones**

La estrategia recomendada es:

1. Migraciones explícitas y versionadas.
2. Identificación de esquema y aplicación.
3. Validación antes de abrir almacenes.
4. Rechazo de versiones futuras incompatibles.
5. Backup restaurable.
6. Transformaciones reentrantes.
7. Reconciliación semántica.
8. Recuperación hacia delante cuando un downgrade resulte inseguro.

No utilizar sincronización automática de esquemas durante el arranque normal del producto sin controles de autoridad, compatibilidad y recuperación.

## **10. Búsqueda, recuperación contextual y memoria semántica**

### **10.1. Alternativas evaluadas**

| Tecnología                          | Sin IA            | Local   | Dependencia adicional           | Dictamen                     |
| ----------------------------------- | ----------------- | ------- | ------------------------------- | ---------------------------- |
| FTS5                                | Sí                | Sí      | Integrada en SQLite según build | Principal                    |
| Búsqueda relacional exacta/prefijos | Sí                | Sí      | No                              | Obligatoria como complemento |
| FTS5 trigram                        | Sí                | Sí      | Según build                     | Evaluar por campo            |
| Índice lexical en aplicación        | Sí                | Sí      | Variable                        | Respaldo                     |
| SQLite con extensión vectorial      | No necesariamente | Sí      | Extensión y posiblemente modelo | Opcional                     |
| Motor vectorial independiente       | No necesariamente | Posible | Alta                            | No recomendado para v1       |
| Embeddings mediante API remota      | No                | No      | Servicio externo                | Inadmisible como requisito   |

### **10.2. FTS5**

FTS5 soporta búsqueda de texto completo, clasificación BM25, tokenización y búsqueda mediante trigramas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.sqlite.org\&sz=32)

sqlite.org



Para QAP recomiendo una recuperación combinada:

- Búsqueda exacta de IDs y revisiones.
- Filtros estructurados por dominio y scope.
- Búsqueda lexical.
- Prefijos y coincidencia de identificadores.
- Relaciones acreditadas.
- Orden determinista.
- Paginación consistente.

No todos los campos deben tokenizarse igual.

| Campo                                | Tratamiento propuesto                  |
| ------------------------------------ | -------------------------------------- |
| IDs de casos                         | Coincidencia exacta                    |
| Selectores CSS/XPath                 | Exacta y por fragmentos                |
| Nombres de módulos                   | Lexical y exacta                       |
| Reglas empresariales                 | Lexical con procedencia                |
| Descripciones de defectos            | Lexical                                |
| Firmas de fallo                      | Exacta y estructurada                  |
| Números de cuenta, tokens y secretos | Excluir o proteger según clasificación |

La búsqueda debe ser sensible al idioma y a la configuración visual cuando resulte aplicable.

### **10.3. Riesgo de filtración mediante ranking**

El adaptador actual calcula BM25 sobre FTS5 y filtra resultados por aplicación. El filtro por fila no demuestra aislamiento de las estadísticas de relevancia.

Considérese un escenario hipotético:

| Consulta           | Corpus visible A                          | Corpus no autorizado B            |
| ------------------ | ----------------------------------------- | --------------------------------- |
| Estado inicial     | Sin cambios                               | Sin cambios                       |
| Segundo estado     | Sin cambios                               | Se añaden documentos coincidentes |
| Resultado esperado | Mismos datos, orden y señales autorizadas | Ninguna información observable    |

Si el ranking de A cambia debido a documentos invisibles de B, existe un canal potencial de información.

La recomendación es segregar el corpus por dominio homogéneo de visibilidad o calcular la recuperación sobre una proyección previamente autorizada.

La segregación debe aplicarse antes de:

- Ranking.
- Conteos.
- Snippets.
- Sugerencias.
- Paginación.
- Facetas.
- Exportación.
- Generación de `ContextSnapshot`.

Cuando no sea posible acreditar aislamiento de un índice compartido, utilizar una búsqueda lexical de menor complejidad sobre el corpus autorizado.

El respaldo no puede limitarse a desactivar toda búsqueda profesional exigida.

### **10.4. Búsqueda semántica y embeddings**

La extensión [sqlite-vec](https://github.com/asg017/sqlite-vec?utm_source=chatgpt.com) constituye una alternativa documentalmente identificada para búsqueda vectorial integrada en SQLite.

No obstante, añadir vectores implica decisiones adicionales sobre:

- Modelo y licencia.
- Versión de representación.
- Dimensionalidad.
- Costo de indexación.
- CPU, RAM y almacenamiento.
- Reindexación.
- Custodia de texto y vectores.
- Posible recuperación de información sensible.
- Compatibilidad lingüística.

No se verificó una versión concreta de esta extensión suficientemente como para recomendar su distribución.

**Recomendación:** conservar un contrato extensible de recuperación, pero no incorporar embeddings obligatorios en v1.

La similitud semántica tampoco puede acreditar reglas, fusionar defectos automáticamente ni modificar el estado de un caso.

### **10.5.&#x20;**`ContextSnapshot`**&#x20;y ahorro de tokens**

El contrato candidato debe incluir:

| Campo conceptual        | Función                       |
| ----------------------- | ----------------------------- |
| Versión de esquema      | Compatibilidad                |
| Scope efectivo          | Aislamiento                   |
| Revisión y corte        | Consistencia                  |
| Generación de autoridad | Revocación                    |
| Objetivo vigente        | Continuidad                   |
| Cobertura               | Trabajo realizado y pendiente |
| Próxima acción elegible | Reanudación                   |
| Referencias compactas   | Recuperación selectiva        |
| Límites                 | Control de bytes e ítems      |
| Omisiones               | Transparencia                 |
| Cursor opaco            | Paginación autorizada         |

No debe exportar la totalidad del conocimiento a cada agente.

La estrategia principal consiste en responder primero mediante un resumen determinista y referencias compactas, recuperando detalles solamente cuando la tarea los requiera.

Los objetivos históricos de 150 o 200 tokens no se convierten en garantías arbitrarias. El costo debe medirse por tokenizer, host y tarea equivalente, conservando suficiente información para no degradar autonomía ni veracidad.

## **11. Consultas profesionales, métricas y publicaciones**

### **11.1. Contrato tipado**

QAP debe permitir consultas profesionales sin exigir conocimientos de SQL ni recurrir a un modelo de IA.

El consumidor declara mediante DTO:

- Dominio y tipo de consulta.
- Scope solicitado.
- Universo de análisis.
- Filtros autorizados.
- Dimensiones de agrupación.
- Métrica y revisión.
- Corte temporal.
- Orden.
- Paginación.
- Campos solicitados.
- Finalidad y perfil de publicación.

La autoridad valida y transforma la consulta a una operación parametrizada.

Ni una consulta enviada por un agente ni una expresión importada desde un archivo debe convertirse directamente en SQL ejecutable.

### **11.2. Métricas**

Cada definición de métrica debe conservar:

| Elemento                    | Razón                            |
| --------------------------- | -------------------------------- |
| Numerador                   | Interpretación reproducible      |
| Denominador                 | Evitar manipulación de cobertura |
| Universo y exclusiones      | Comparabilidad                   |
| Revisión de definición      | Control histórico                |
| Ventana temporal            | Contexto                         |
| Scope                       | Aislamiento                      |
| Criterio de equivalencia    | Comparación válida               |
| Disponibilidad de evidencia | Verificabilidad                  |

Un porcentaje de éxito no es comparable automáticamente entre campañas con distintos perfiles, obligaciones, denominadores o criterios.

La agregación debe preservar la semántica AR-52. Una campaña FAIL no puede borrar la existencia de un falso PASS por afirmación.

### **11.3. Publicaciones**

La publicación profesional debe derivarse de una proyección canónica autorizada y congelada.

El registro mínimo conceptual comprende:

- Consulta y versión.
- Universo y corte.
- Revisión de métricas.
- Resultado derivado.
- Destinatario y finalidad.
- Omisiones.
- Disponibilidad.
- Digest y manifiesto.
- Referencias autorizadas.

ET-05 genera PDF, XLSX, HTML, Markdown y otros formatos desde el mismo contrato, sin consultar directamente una base separada ni reinterpretar por su cuenta los resultados.

No se exige identidad binaria entre formatos, pero sí equivalencia semántica en los campos compartidos.

### **11.4. Paginación**

Se recomienda paginación por cursor y orden estable para colecciones de tamaño considerable.

El cursor debe estar vinculado a la consulta, identidad, alcance, generación y revisión correspondiente.

La revocación debe invalidar o impedir continuar una consulta anterior.

Las transacciones de lectura no deben mantenerse indefinidamente abiertas mientras un usuario navega por una tabla. Esto puede impedir el avance de checkpoints y provocar crecimiento del WAL.

## **12. Defectos, recetas y retención**

### **12.1. Recetas profesionales durables**

Una receta de reproducción no equivale a guardar un enlace hacia un video.

Debe conservar suficiente contenido autorizado para reproducir o investigar el defecto:

| Elemento                       | Persistencia                         |
| ------------------------------ | ------------------------------------ |
| Identidad y revisión del caso  | Versionada                           |
| Entorno, build y configuración | Contextual                           |
| Rol y permisos requeridos      | Referencias, no credenciales         |
| Prerrequisitos                 | Explícitos                           |
| Datos                          | Sintéticos o referencias autorizadas |
| Pasos previstos y observados   | Diferenciados                        |
| Expectativa y testigo          | Acreditados                          |
| Resultado original             | Histórico                            |
| Cleanup                        | Estado y estrategia                  |
| Evidencia                      | Referencia y disponibilidad          |
| Omisiones                      | Explícitas                           |

El retest crea otro intento y vuelve a validar autoridad, aplicabilidad e insumos.

No sustituye el resultado histórico.

### **12.2. Política de retención**

De acuerdo con DE-01 A:

| Información               | Política ratificada                           |
| ------------------------- | --------------------------------------------- |
| Detalle estructurado      | 90 días                                       |
| Resumen histórico         | Permanente hasta eliminación expresa          |
| Conocimiento vigente      | Sin caducidad automática                      |
| Casos activos             | Sin caducidad automática                      |
| Video y capturas de éxito | Referencia operativa de hasta 24 horas        |
| Trazas exitosas           | Referencia de 72 horas                        |
| Evidencias de fallos      | Al menos 14 días bajo conservación autorizada |
| Exportación manual        | Disponible y gobernada                        |
| Archivo automático        | Opcional y configurable                       |

Los plazos operativos de multimedia permanecen sujetos a los grants y excepciones acreditadas.

La protección de un defecto abierto no autoriza conservar material cuya conservación haya sido revocada.

### **12.3. Prueba del día 120**

Escenario futuro de calificación, no experimento ejecutadoLa conservación de cualquier contenido sigue condicionada a su autorización. Los medios pueden requerir protección adicional.

La prueba debe comprobar que la receta compacta conserva información suficiente después de la poda legítima, sin extender artificialmente la vida del medio privado.

### **12.4. Cuotas y recolección segura**

La cuota debe considerar el almacenamiento real total:

- Datos canónicos.
- Índices.
- WAL y SHM.
- Evidencias.
- Backups.
- Archivos temporales.
- Staging.
- Espacio necesario para restaurar.
- Reserva para cleanup.

La simulación de poda debe identificar candidatos reales, bytes lógicos recuperables, elementos protegidos y motivos de exclusión, sin modificar estado.

Borrar filas no implica que el archivo SQLite reduzca inmediatamente su tamaño. SQLite documenta el uso de `VACUUM` para recuperar páginas libres.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.sqlite.org\&sz=32)

sqlite.org



Igualmente, `secure_delete` no elimina necesariamente todos los rastros de tablas auxiliares FTS5, backups o dispositivos físicos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://sqlite.org\&sz=32)

sqlite.org+1



Por tanto:

- No prometer borrado físico absoluto.
- Calificar la eliminación lógica y de acceso.
- Controlar réplicas, índices y derivados.
- Reservar espacio para mantenimiento.
- Suspender nuevas admisiones cuando no sea posible conservar las obligaciones existentes.

## **13. Seguridad, privacidad y licencias**

### **13.1. Modelo de amenazas**

| Amenaza                           | Control candidato                               |
| --------------------------------- | ----------------------------------------------- |
| Consumidor con scope ajeno        | Autorización central por operación              |
| UI que intenta abrir SQLite       | Frontera efectiva de acceso                     |
| Propuesta HOST hostil             | Validación DTO, autoridad y CAS                 |
| Inyección SQL                     | Consultas parametrizadas                        |
| Inyección de sintaxis FTS         | Parser o normalización acotada                  |
| Importación maliciosa             | Esquema, límites, aislamiento y saneamiento     |
| Restauración de grants revocados  | Reconciliación de autoridad                     |
| Filtración mediante ranking       | Corpus autorizado                               |
| Robo de respaldo                  | Protección y custodia                           |
| Extensiones SQLite no autorizadas | Deshabilitación y distribución controlada       |
| Escritor legacy                   | Exclusión efectiva de almacenamiento y despacho |
| Consulta costosa                  | Presupuestos y límites                          |
| Manipulación de datos históricos  | Integridad y manifiestos autenticados           |

SQLite recomienda controles defensivos adicionales frente a SQL y bases no confiables.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://sqlite.org\&sz=32)

sqlite.org



Entre las opciones candidatas deben estudiarse `trusted_schema`, configuración defensiva, restricciones de extensiones, límites de consultas y validación de importaciones.

La disponibilidad exacta de estos controles desde cada binding permanece sujeta a verificación.

### **13.2. Cifrado**

SQLite estándar no debe tratarse como una solución completa de cifrado de datos en reposo.

Existen tres estrategias conceptuales:

| Estrategia                                | Beneficio                                   | Limitación                                                         |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| Cifrado del volumen                       | Cobertura amplia del almacenamiento         | No separa por sí mismo autoridades durante una sesión desbloqueada |
| Cifrado de objetos y campos sensibles     | Custodia granular                           | Complejidad de indexación y consulta                               |
| Distribución SQLite con cifrado integrado | Protección del archivo según implementación | Dependencia nativa adicional y gestión de llaves                   |

ET-06 debe seleccionar y calificar una composición compatible con el modelo de amenazas ratificado.

No recomiendo habilitar búsqueda FTS sobre contenido que debería permanecer cifrado y oculto al mismo proceso que mantiene el índice.

Un índice lexical también contiene información derivada del contenido original y debe tratarse conforme a la misma clasificación.

### **13.3. Licencias y mantenimiento**

| Componente      | Evidencia documental                                                                                      | Condición                                              |
| --------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| SQLite          | Dominio público                                                                                           | Verificar componentes adicionales redistribuidos       |
| Node.js         | MIT y avisos de terceros según AV-07                                                                      | Revisar runtime íntegro y dependencias                 |
| better-sqlite3  | MIT                                                                                                       | Verificar código, binarios y notices concretos         |
| Kysely          | [Licencia original](https://github.com/kysely-org/kysely/blob/master/LICENSE?utm_source=chatgpt.com)      | Fijar revisión y comprobar composición                 |
| Drizzle         | [Licencia original](https://github.com/drizzle-team/drizzle-orm/blob/main/LICENSE?utm_source=chatgpt.com) | Fijar revisión y comprobar composición                 |
| sqlite-vec      | Repositorio identificado                                                                                  | Licencia y versión concreta pendientes de calificación |
| Modelos locales | Variable                                                                                                  | Evaluación individual; no obligatorios                 |

La licencia propia MIT/ISC de QAP continúa pendiente de la decisión correspondiente del titular.

No se declara ausencia de vulnerabilidades en ningún candidato. Tampoco se realizó un cotejo exhaustivo de todos los advisories transitivos, CVE, OSV y GHSA del conjunto instalado, que todavía no está seleccionado ni disponible como artefacto calificado.

### **13.4. Actualización y rollback**

El proceso de mantenimiento debe conservar:

- Identidad de build.
- SBOM.
- Hashes y procedencia.
- Versión efectiva SQLite.
- Compatibilidad de esquema.
- Inventario de opciones de compilación.
- Evidencias de regresión.
- Backup restaurable.
- Revocaciones vigentes.

Una regresión del runtime no autoriza reinstalar una versión vulnerable o incompatible para recuperar disponibilidad.

## **14. Compatibilidad multiplataforma**

La portabilidad del código fuente no equivale a portabilidad de los artefactos instalados.

### **14.1. Matriz candidata**

| Plataforma    | `node:sqlite` | `better-sqlite3` | Garantía pendiente                          |
| ------------- | ------------- | ---------------- | ------------------------------------------- |
| Windows x64   | C             | C                | Build, ACL, bloqueo, volumen, recuperación  |
| Windows ARM64 | C             | C                | Artefacto nativo y compatibilidad efectiva  |
| macOS x64     | C             | C                | Soporte del runtime, permisos, distribución |
| macOS ARM64   | C             | C                | Build nativo, permisos y recuperación       |
| Linux x64     | C             | C                | libc, distribución, permisos y VFS          |
| Linux ARM64   | C             | C                | Arquitectura, libc y disponibilidad binaria |

Esta tabla es una matriz de evaluación propuesta; no amplía unilateralmente el universo obligatorio fijado por el manifiesto.

No se verificó de manera exhaustiva la existencia de cada artefacto concreto de `better-sqlite3` para todas las celdas ni la matriz completa del runtime elegido. El documento específico `BUILDING.md` del tag Node consultado tampoco fue accesible mediante la recuperación pública realizada.

Las celdas obligatorias deben conservar su estado pendiente.

### **14.2. Condiciones por plataforma**

**Windows:** considerar rutas largas, junctions, DACL, handles abiertos, identidad del servicio y acceso de procesos legados.

**macOS:** considerar arquitectura Intel/Apple Silicon, propietario, ACL, proceso supervisor, firma y almacenamiento local.

**Linux:** considerar glibc/musl, UID/GID, permisos, servicios y comportamiento del sistema de archivos.

No almacenar la base activa directamente en un directorio sincronizado o montaje remoto solamente porque el workspace empresarial reside allí. La autoridad SQLite debe utilizar un volumen local que acredite los mecanismos requeridos.

## **15. Economía de ingeniería y consumo de recursos**

### **15.1. Comparación relativa**

Los costos siguientes son estimaciones cualitativas de ingeniería, no mediciones de QAP ni presupuestos económicos.

| Composición                      | Integración inicial | Distribución  | Mantenimiento | Riesgo de reconstrucción         |
| -------------------------------- | ------------------- | ------------- | ------------- | -------------------------------- |
| node:sqlite + SQL explícito      | Medio               | Bajo relativo | Medio         | Bajo-medio                       |
| better-sqlite3 + SQL explícito   | Medio               | Medio-alto    | Medio-alto    | Bajo-medio                       |
| node:sqlite + query builder      | Medio               | Bajo-medio    | Medio         | Medio                            |
| ORM generalista                  | Medio-alto          | Variable      | Medio-alto    | Medio-alto                       |
| SQLite + motor vectorial externo | Alto                | Alto          | Alto          | Alto                             |
| PostgreSQL obligatorio           | Alto                | Alto          | Alto          | Incompatible con alcance vigente |

La recomendación no se basa en una suma de puntuaciones. Primero se aplican los invariantes y posteriormente se comparan costos relativos.

### **15.2. Costos inevitables de reconstrucción**

Cambiar de driver no elimina la necesidad de reconstruir:

- La autoridad canónica.
- La semántica de scope.
- La persistencia de efectos.
- El ciclo de publicaciones.
- La memoria longitudinal.
- La retención.
- Las consultas profesionales.
- El proceso de migración.

Por ello, conservar SQLite no significa que el esfuerzo restante sea pequeño.

### **15.3. Modelo de consumo**

El espacio requerido debe considerar:

\\[ S\_{\text{total}} = S\_{\text{datos}} + S\_{\text{índices}} + S\_{\text{WAL}} + S\_{\text{evidencia}} + S\_{\text{backup}} + S\_{\text{staging}} \\]

Para una futura evaluación vectorial, solamente el almacenamiento bruto de vectores podría estimarse mediante:

\\[ S\_{\text{vectores}}=N \times d \times b \\]

donde \\(N\\) es el número de documentos, \\(d\\) la dimensionalidad y \\(b\\) los bytes por dimensión. Esta expresión excluye índices, metadatos, modelos, temporales y duplicación.

No se asignan valores ficticios a estas variables.

### **15.4. Matriz de consumo cualitativo**

| Operación                | Recurso dominante                | Riesgo                  |
| ------------------------ | -------------------------------- | ----------------------- |
| Commit FULL              | Latencia de sincronización e I/O | Contención              |
| Indexación FTS           | CPU, disco e I/O                 | Crecimiento del índice  |
| Consulta agregada amplia | CPU y memoria                    | Saturación              |
| Backup                   | I/O y almacenamiento             | Presión de cuota        |
| `VACUUM`                 | Disco temporal e I/O             | Espacio insuficiente    |
| Consulta contextual      | CPU y serialización              | Tokens excesivos        |
| Embeddings locales       | CPU/GPU, RAM y disco             | Dependencia innecesaria |
| Reconciliación histórica | I/O y CPU                        | Duración prolongada     |

### **15.5. Métricas por calificar**

- Tamaño descargado y tamaño instalado.
- RSS del escritor en reposo.
- CPU en reposo.
- Arranque frío y caliente.
- Latencia p50, p95 y p99 de consultas representativas.
- Tiempo de commit durable.
- Crecimiento del WAL.
- Costo de checkpoint.
- Tiempo de indexación.
- Rendimiento de consultas profesionales.
- Tiempo de backup y restauración.
- Presión de disco.
- Tokens de rehidratación contextual.
- Impacto de concurrencia 1/2/4.

No se dispone de benchmarks externos suficientemente equivalentes a los requisitos, datos y cargas de QAP como para afirmar superioridad cuantitativa de un driver.

Los pisos de hardware y presupuestos deben calibrarse en EXP-03.

## **16. Matriz normativa primaria ET-02**

La matriz de responsables atribuye primariamente a ET-02 los quince requisitos MEM y POL-RET-001.

### **16.1. Requisitos de memoria**

| ID          | Garantía                              | Candidato                     | Estado | Calificación |
| ----------- | ------------------------------------- | ----------------------------- | ------ | ------------ |
| MEM-001.1   | Cuatro planos obligatorios            | Esquema y política de dominio | C      | E1/E2        |
| MEM-001.2   | Promoción acreditada                  | Repositorio canónico          | C      | E1/E2        |
| MEM-001.3   | Revisiones inmutables                 | SQL y modelo versionado       | C      | E2           |
| MEM-001.4   | Edición manual protegida ante drift   | Revisiones y estados          | C      | E2/E4        |
| MEM-002.1   | Scope multidimensional                | Claves y corpus segregado     | C      | E2/E7        |
| MEM-002.2   | Validación uniforme de scope          | Autoridad común               | C      | E1/E2/E7     |
| MEM-002.3   | Colas y recuperación durable          | CAS, intención y estado       | C      | E2/E3        |
| MEM-002.4   | Rehidratación contextual              | ContextSnapshot               | C      | E2/E3        |
| MEM-002.5   | Separación de sesiones y conocimiento | Custodia separada             | C      | E2/E7        |
| MEM-003.1   | Contradicciones con procedencia       | Registro tipado               | C      | E2/E4        |
| MEM-003.2   | Invalidación incremental              | Grafo relacional              | C      | E2/E4        |
| MEM-003.3   | Memoria longitudinal                  | Firmas e intentos             | C      | E2/E5        |
| MEM-003.4   | Intercambio portable                  | Manifiesto y proyección       | C      | E2/E7        |
| MEM-003.5   | Poda uniforme                         | Motor central de retención    | C      | E2/E6        |
| MEM-003.6   | Puerto independiente                  | Adaptador SQLite              | C      | E1/E2/E7     |
| POL-RET-001 | Conservación autorizada               | Política común                | C      | E2/E6/E7     |

El prefijo `REQ-` se omite en las quince entradas MEM por brevedad. No se crean IDs alternativos.

### **16.2. Cláusulas AC-01 primarias**

| Cláusula   | Obligación                            | Ruta candidata                               | Calificación    |
| ---------- | ------------------------------------- | -------------------------------------------- | --------------- |
| AC01-13.01 | Receta versionada                     | Revisiones, referencias y proyección durable | G3/E5/E6, G5/E7 |
| AC01-13.02 | Promoción antes de poda               | Retención selectiva                          | G3/E6, G5/E2/E6 |
| AC01-14.01 | Defecto y retest histórico            | Entidades enlazadas por intento              | G3/E5, G5/E7    |
| AC01-14.02 | Deduplicación conservadora            | Firma versionada y relaciones                | G3/E5           |
| AC01-14.03 | Referencias externas pasivas          | Enlaces tipados                              | G5/E7           |
| AC01-20.01 | Dataset y fixture versionados         | DataPlan y reservas                          | G2/E4, G3/E5    |
| AC01-20.02 | Afirmaciones declarativas de datos    | Consulta tipada y resultado acreditado       | G3/E5, G6/E8    |
| AC01-20.03 | Decisiones y transiciones versionadas | Reglas relacionales acreditadas              | G2/E4, G3/E5    |

Las ocho cláusulas permanecen condicionadas a su calificación. Sus propietarios normativos originales no se reasignan.

### **16.3. Dependencias AC-01 cruzadas**

| Cláusulas          | Interfaz ET-02                                      |
| ------------------ | --------------------------------------------------- |
| AC01-01.01         | Entidades, identidad, procedencia y contradicciones |
| AC01-05.02 y 05.04 | Edición CAS y puerto único                          |
| AC01-06.02         | Hechos humanos, revisiones y testigos               |
| AC01-08.01         | Identidad de casos                                  |
| AC01-11.01 y 11.02 | Intercambio portable y custodia                     |
| AC01-12.01         | Consultas autorizadas y proyección                  |
| AC01-16.01–16.03   | Scope, dependencias y aprendizaje                   |
| AC01-22.03         | Identidad y coherencia de procesos empresariales    |

Se requiere coordinación adicional con los propietarios de las demás cláusulas cuando consuman o produzcan entidades persistentes.

No se declara cotejo semántico exhaustivo de las 123 entradas y 65 cláusulas completas. Se preserva su universo, pero la cobertura detallada del presente informe se concentra en las asignaciones primarias y dependencias identificadas.

### **16.4. Registros maestros prioritarios**

| AR    | Materia                      | Resultado documental                 |
| ----- | ---------------------------- | ------------------------------------ |
| AR-12 | SQLite, autoridad y búsqueda | Ruta condicionada                    |
| AR-25 | Retención y revocación       | Ruta condicionada                    |
| AR-41 | Migración y escritor único   | Bloqueante preservado                |
| AR-46 | Memoria longitudinal         | Ruta condicionada                    |
| AR-54 | Precedencia y legacy         | Contrato vigente preservado          |
| AR-57 | Inventario y reconstrucción  | Reconstrucción selectiva recomendada |
| AR-23 | Runtime/driver               | Dependencia ET-01/06                 |
| AR-24 | Visor de lectura             | Dependencia ET-04/06                 |
| AR-28 | Frontera efectiva            | Dependencia ET-06                    |
| AR-52 | Veracidad                    | Contrato preservado                  |

No se cierra ni reclasifica ningún registro maestro mediante este informe.

## **17. Migración coordinada AR-41**

### **17.1. Estrategia**

La migración debe ejecutarse por autoridad efectiva, no simplemente por archivo encontrado.

La existencia de un `app-service.sqlite` compartido puede impedir un corte independiente de proyecto si el proceso legado conserva permisos de escritura sobre todas sus filas.

Una ACL de archivo no permite cercar solamente determinadas filas frente a un escritor antiguo.

### **17.2. Máquina conceptual de corte**

1. **Inventario y simulación** — Identificar escritores, datos, versiones, permisos y dependencias.
2. **Snapshot coherente** — Capturar fuentes y generación bajo una frontera controlada.
3. **Sombra sin efectos** — Conciliar resultados y consultas sin adquirir autoridad.
4. **Drenaje y exclusión** — Cercar almacenamiento y despacho legacy.
5. **Importación y reconciliación** — Transformar por clase, conservar procedencia y resolver incertidumbres.
6. **Activación cercada** — Confirmar nueva generación y escritor único.
7. **Recuperación controlada** — Preservar nuevas escrituras y revocaciones.

Este es el contrato de migración candidato ya pertinente al expediente AV-07, no un WBS ni una autorización de corte.

### **17.3. Garantías de importación**

| Fuente                     | Regla                        |
| -------------------------- | ---------------------------- |
| Revisiones de conocimiento | Mantener linaje              |
| Resultados históricos      | No elevar autenticidad       |
| Permisos antiguos          | Revalidar                    |
| Revocaciones               | Preservar                    |
| Tombstones                 | Preservar                    |
| Sesiones                   | Excluir material secreto     |
| Ediciones manuales         | Conservar                    |
| Intentos incompletos       | Reconciliar                  |
| Evidencia expirada         | Registrar indisponibilidad   |
| Cachés                     | Regenerar cuando corresponda |

### **17.4. Rollback**

Antes de nuevas escrituras canónicas puede contemplarse una reversión controlada, siempre que permanezca una única autoridad efectiva.

Después de aceptar nuevas escrituras, un rollback físico puede perder historia o revivir permisos.

En ausencia de un transformador inverso probado, la recuperación hacia delante constituye el respaldo preferente.

El corte real sigue condicionado a E2/G5, G6.5 y autorización expresa.

## **18. Contratos e interfaces con los demás especialistas**

Los nombres siguientes representan responsabilidades y contratos conceptuales. No prescriben nombres definitivos de clases, archivos o APIs.

| Especialidad | Contrato                                         | Riesgo de incompatibilidad                          | Calificación |
| ------------ | ------------------------------------------------ | --------------------------------------------------- | ------------ |
| ET-01        | Puerto de persistencia, transacciones, CAS y DTO | Lenguaje o runtime incompatible con driver          | E1/E2        |
| ET-03        | Intentos, reservas, efectos y testigos           | Runner que escriba directamente en SQLite           | E2/E5        |
| ET-04        | Consultas paginadas y comandos de edición        | UI con acceso directo a almacenamiento              | EXP-08       |
| ET-05        | Publicaciones y objetos protegidos               | Reportes que reconstruyan verdad independientemente | E6/E7        |
| ET-06        | Identidad, revocación, llaves y volumen          | Frontera inefectiva o índices expuestos             | E2/EXP-06/08 |
| ET-07        | ContextSnapshot, MCP, CLI e intercambio          | Contratos divergentes entre consumidores            | E3/E7        |

### **18.1. Contrato ET-01: núcleo y runtime**

El puerto no debe exponer `DatabaseSync`, sentencias SQL, objetos específicos de ORM ni handles del almacenamiento a los consumidores.

Debe expresar operaciones de dominio:

- Reclamo.
- Commit condicional.
- Consulta.
- Snapshot.
- Registro de hechos.
- Revocación.
- Publicación.
- Recuperación.

Si ET-01 recomienda conservar Node/TypeScript, la composición principal con `node:sqlite` resulta coherente.

Si ET-01 recomienda otra plataforma de ejecución, deberá evaluarse SQLite nativo mediante un binding apropiado para ese runtime, sin mantener Node como segundo núcleo solamente para conservar el driver.

### **18.2. Contrato ET-04: interfaz operacional**

La UI consume datos mediante comandos y consultas autenticados.

La interfaz puede mantener cachés visuales descartables, pero no una segunda autoridad de casos, permisos o resultados.

El visor histórico AR-24 permanece de solo lectura incluso si comparte componentes de representación con la UI operacional.

### **18.3. Contrato ET-05: evidencia y publicaciones**

ET-05 debe informar al escritor mediante referencias protegidas, manifestaciones de disponibilidad y recibos de custodia.

Un archivo multimedia presente no constituye, por sí solo, evidencia acreditada.

Una publicación tampoco puede confirmarse antes de que sus fuentes y referencias satisfagan el contrato correspondiente.

### **18.4. Contrato ET-06: seguridad**

Debe resolver:

- Identidad del escritor.
- Acceso a directorios y sidecars.
- Custodia y llaves.
- Cifrado de backups.
- Protección de índices.
- Frontera de revocación.
- Procedencia de binarios.
- Recuperación segura.

Un mutex, lockfile o bloqueo SQLite no constituye una frontera suficiente frente a procesos no autorizados.

### **18.5. Contrato ET-07: agentes y consumidores**

MCP, CLI, CI y UI deben recibir una semántica común, aunque sus transportes difieran.

No se permite que MCP use una base de conocimiento mientras CLI consulte únicamente archivos YAML como fuentes paralelas de verdad.

Las representaciones portables deben incluir versión de esquema, identidad, procedencia, autoridad aplicable y omisiones.

### **18.6. PostgreSQL futuro**

El puerto debe diseñarse para admitir una futura implementación PostgreSQL, sin afirmar equivalencia automática.

La migración futura requerirá estudiar nuevamente:

- Aislamiento transaccional.
- Bloqueos.
- Concurrencia.
- Durabilidad.
- Temporalidad.
- Consultas.
- Collation.
- Búsqueda textual.
- Roles y permisos.
- Recuperación.

Una interfaz portable no elimina las diferencias entre motores.

## **19. Calificación experimental futura**

Los experimentos siguientes reutilizan las referencias existentes. No se ejecutaron ni se autorizan mediante este informe.

| Referencia | Incertidumbre ET-02                         | Criterio principal                                  |
| ---------- | ------------------------------------------- | --------------------------------------------------- |
| EXP-01a/b  | ContextSnapshot, consumo y continuidad HOST | Recuperación suficiente y segura entre consumidores |
| EXP-03     | Recursos, cuotas y concurrencia             | Presupuestos acreditados por perfil                 |
| EXP-04a/b  | Driver y distribución                       | Instalación limpia y capacidades reales             |
| EXP-05a/b  | Datos, reservas y efectos                   | Sin duplicación ni contaminación externa            |
| EXP-06a    | Frontera de custodia                        | Protección efectiva desde adquisición               |
| EXP-06c    | Retención y recuperación                    | Recetas, publicación y supresión autorizada         |
| EXP-07     | Secretos y autoridad                        | Separación y recuperación segura                    |
| EXP-08a    | Frontera entre clientes y escritor          | Cero bypass en celdas obligatorias                  |
| EXP-08b    | Vertical instalada                          | Autoridad, edición y continuidad                    |
| EXP-08c    | Consolidación de garantías                  | Paridad y controles negativos                       |
| E1         | Contratos y rutas                           | Resultado y autoridad comunes                       |
| E2         | Persistencia, corte y recuperación          | Integridad y exclusión                              |
| E3         | Continuidad y consumo                       | Sin pérdida de frontera ni exceso injustificado     |
| E4         | Política, scope y conocimiento              | Autoridad y acreditación                            |
| E5         | Efectos y defectos                          | Veracidad y reconciliación                          |
| E6         | Evidencia y retención                       | Conservación conforme                               |
| E7         | Paridad                                     | Equivalencia semántica                              |
| E8         | Generalización                              | Pisos y vetos ratificados                           |
| G6.5       | Representatividad empresarial               | Obligaciones aplicables al 100 %                    |

Las descripciones de esta tabla expresan aportaciones ET-02, no sustituyen los protocolos completos existentes.

### **19.1. Matriz de fixtures y controles**

| Prueba propuesta dentro de protocolos existentes | Control sano                 | Control negativo                         | Criterio                                |
| ------------------------------------------------ | ---------------------------- | ---------------------------------------- | --------------------------------------- |
| Doctor SQLite                                    | Build compatible             | FTS ausente o versión incompatible       | Detectar y bloquear                     |
| CAS concurrente                                  | Un reclamo válido            | Dos consumidores reclaman la misma tarea | Un único reclamo confirmado             |
| Durabilidad                                      | Commit confirmado            | Caída en frontera de commit              | Resultado durable conforme              |
| Revocación                                       | Principal vigente            | Principal revocado durante operación     | No admitir operación posterior indebida |
| Recuperación                                     | Trabajo seguro               | Efecto externo incierto                  | Reconciliar antes de repetir            |
| FTS aislado                                      | Corpus autorizado            | Corpus vecino modificado                 | Cero filtración relevante               |
| Consulta histórica                               | Revisión conservada          | Payload eliminado legítimamente          | Declarar omisión                        |
| Poda                                             | Evidencia elegible           | Defecto activo protegido                 | Respetar política                       |
| Día 120                                          | Receta autorizada suficiente | Medio expirado o insumo ausente          | Recuperar o declarar límite correcto    |
| Backup                                           | Generación coherente         | Sidecars mezclados                       | Rechazar inconsistencia                 |
| Restore                                          | Estado íntegro               | Backup con grants revocados              | No resucitar autoridad                  |
| Corte                                            | Escritor nuevo autorizado    | Binario legado intenta escribir          | Cero escrituras legacy                  |
| Paridad                                          | Misma consulta               | Scope manipulado entre adaptadores       | Respuesta semántica equivalente         |
| Publicación                                      | Proyección acreditada        | Referencia ausente o revocada            | Sin falsa verificabilidad               |

### **19.2. Variables de comparación de drivers**

La futura comparación debe mantener constantes:

- Runtime base cuando sea viable.
- Hardware y sistema de archivos.
- Esquema.
- Datos.
- Número de operaciones.
- Nivel de durabilidad.
- Concurrencia.
- Política de checkpoint.
- Presupuestos de caché.
- Consultas.
- Controles de integridad.

No sería válido comparar `node:sqlite` con FULL contra `better-sqlite3` con NORMAL y atribuir la diferencia de rendimiento exclusivamente al driver.

### **19.3. Criterios de éxito**

Se preservan los umbrales ratificados por DE-03:

- 100 % de conformidad normativa instalada.
- Cero violaciones de autoridad o custodia.
- Cero falsos PASS.
- 100 % de paridad aplicable.
- Cero pérdida indebida de revisiones y revocaciones.
- Cero escritores concurrentes no autorizados.

Los objetivos de rendimiento requieren valores calibrados, no umbrales inventados durante esta revisión.

No se considera necesario crear un nuevo EXP independiente mientras estas incertidumbres puedan incorporarse a los protocolos existentes sin reducir sus garantías. Esa conclusión debe contrastarse con el texto completo de cada protocolo.

## **20. Riesgos prioritarios para integración**

| ID        | Riesgo                                 | Impacto    | Mitigación                             | Residual                    |
| --------- | -------------------------------------- | ---------- | -------------------------------------- | --------------------------- |
| R-ET02-01 | Doble escritor legacy                  | Crítico    | Exclusión efectiva y corte             | Calificación pendiente      |
| R-ET02-02 | Pérdida de commit crítico              | Crítico    | FULL y pruebas de recuperación         | Dependencia de VFS/hardware |
| R-ET02-03 | Restauración de autoridad revocada     | Crítico    | Reconciliación generacional            | Pendiente                   |
| R-ET02-04 | Filtración mediante FTS                | Crítico    | Corpus segregado                       | Pendiente                   |
| R-ET02-05 | Divergencia de publicaciones           | Alto       | Proyección canónica                    | Pendiente                   |
| R-ET02-06 | Crecimiento descontrolado              | Alto       | Cuotas y checkpoint                    | Medición pendiente          |
| R-ET02-07 | Incompatibilidad binaria               | Alto       | Artefactos calificados                 | Celdas pendientes           |
| R-ET02-08 | Bloqueo del transporte/UI              | Alto       | Escritor dedicado y consultas acotadas | Medición pendiente          |
| R-ET02-09 | Migración que eleva autenticidad       | Crítico    | Procedencia histórica explícita        | Pendiente                   |
| R-ET02-10 | Eliminación de evidencia indispensable | Crítico    | Retención común                        | Pendiente                   |
| R-ET02-11 | Tipos o precisión divergentes          | Alto       | Contrato compartido ET-05              | Pendiente                   |
| R-ET02-12 | Dependencia innecesaria de modelos     | Medio-alto | Lexical determinista                   | Control documental          |

## **21. Fuentes primarias tecnológicas**

Fuentes consultadas el 26 de noviembre de 2026. Las páginas de documentación continua no se consideran revisiones congeladas; las versiones exactas deberán fijarse durante la selección y calificación.

| Fuente                                                                                                           | Evidencia utilizada                                        |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [SQLite WAL](https://www.sqlite.org/wal.html?utm_source=chatgpt.com)                                             | Durabilidad, checkpoint, restricciones y defecto WAL-reset |
| [SQLite PRAGMA](https://sqlite.org/pragma.html?utm_source=chatgpt.com)                                           | Configuración, seguridad y mantenimiento                   |
| [SQLite FTS5](https://www.sqlite.org/fts5.html?utm_source=chatgpt.com)                                           | Ranking, tokenización y búsqueda                           |
| [SQLite Backup API](https://sqlite.org/backup.html?utm_source=chatgpt.com)                                       | Backup consistente                                         |
| [SQLite VACUUM](https://www.sqlite.org/lang_vacuum.html?utm_source=chatgpt.com)                                  | Compactación y alternativa de copia                        |
| [SQLite RETURNING](https://www.sqlite.org/lang_returning.html?utm_source=chatgpt.com)                            | Operaciones condicionales                                  |
| [SQLite STRICT Tables](https://www.sqlite.org/stricttables.html?utm_source=chatgpt.com)                          | Tipado estructural                                         |
| [SQLite Security](https://sqlite.org/security.html?utm_source=chatgpt.com)                                       | Defensa ante entradas no confiables                        |
| [SQLite Copyright](https://sqlite.org/copyright.html?utm_source=chatgpt.com)                                     | Condiciones de redistribución                              |
| [SQLite 3.51.3](https://sqlite.org/releaselog/3_51_3.html?utm_source=chatgpt.com)                                | Corrección WAL-reset, 13 de marzo de 2026                  |
| [Historial de releases SQLite](https://sqlite.org/changes.html?utm_source=chatgpt.com)                           | Evolución y correcciones                                   |
| [Node.js Releases](https://nodejs.org/en/about/previous-releases?utm_source=chatgpt.com)                         | Ciclo de mantenimiento                                     |
| [Node.js 24.22.3](https://nodejs.org/en/blog/release/v24.22.3?utm_source=chatgpt.com)                            | Release de seguridad del 11 de noviembre de 2026           |
| [better-sqlite3 releases](https://github.com/WiseLibs/better-sqlite3/releases?utm_source=chatgpt.com)            | Distribución y mantenimiento                               |
| [better-sqlite3 13.2.0](https://github.com/WiseLibs/better-sqlite3/releases/tag/v13.2.0?utm_source=chatgpt.com)  | Referencia candidata                                       |
| [Licencia better-sqlite3](https://github.com/WiseLibs/better-sqlite3/blob/master/LICENSE?utm_source=chatgpt.com) | MIT                                                        |
| [node-sqlite3](https://github.com/TryGhost/node-sqlite3?utm_source=chatgpt.com)                                  | Obsolescencia                                              |
| [SQLite WASM Persistence](https://sqlite.org/wasm/doc/tip/persistence.md?utm_source=chatgpt.com)                 | Restricciones OPFS                                         |
| [Kysely Dialects](https://kysely.dev/docs/dialects?utm_source=chatgpt.com)                                       | Alternativa de consultas tipadas                           |
| [Drizzle Node SQLite](https://orm.drizzle.team/docs/connect-node-sqlite?utm_source=chatgpt.com)                  | Integración del driver                                     |
| [sqlite-vec](https://github.com/asg017/sqlite-vec?utm_source=chatgpt.com)                                        | Alternativa vectorial local                                |

**Reservas bibliográficas:** faltan la verificación exhaustiva de los advisories por versión, el cotejo de cada binario distribuible, la revisión íntegra de determinados anexos internos y la confirmación de las versiones estables concretas de los query builders. No debe interpretarse esta bibliografía como una SBOM ni una certificación de seguridad.

## **22. Registro de recomendaciones tecnológicas candidatas**

| Decisión propuesta           | Principal                             | Respaldo                               | Dictamen                                               |
| ---------------------------- | ------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| ET02-T01: motor              | SQLite                                | Otra distribución SQLite               | APTO COMO CANDIDATO                                    |
| ET02-T02: driver             | node:sqlite                           | better-sqlite3                         | CONDICIONADO                                           |
| ET02-T03: runtime compatible | Node 24 LTS                           | Alternativa coordinada ET-01           | CONDICIONADO                                           |
| ET02-T04: autoridad          | Escritor único por autoridad efectiva | Implementación equivalente             | CONDICIONADO                                           |
| ET02-T05: durabilidad        | WAL FULL                              | Garantía SQLite equivalente calificada | CONDICIONADO                                           |
| ET02-T06: consultas          | SQL explícito tipado                  | Query builder calificado               | APTO COMO CANDIDATO                                    |
| ET02-T07: migraciones        | SQL versionado                        | Migrador especializado                 | CONDICIONADO                                           |
| ET02-T08: recuperación       | Backup API                            | VACUUM INTO                            | CONDICIONADO                                           |
| ET02-T09: búsqueda           | FTS5 segregado                        | Lexical sobre corpus autorizado        | CONDICIONADO                                           |
| ET02-T10: embeddings         | No obligatorios                       | Complemento local calificado           | SIN RUTA DOCUMENTAL SUFICIENTE para selección concreta |
| ET02-T11: conocimiento       | Revisiones relacionales               | Adaptador equivalente                  | CONDICIONADO                                           |
| ET02-T12: retención          | Motor común                           | Estrategia equivalente                 | CONDICIONADO                                           |
| ET02-T13: PostgreSQL         | Diferido                              | Puerto extensible                      | APTO COMO DIRECCIÓN FUTURA                             |

## **23. Dictamen final al Orquestador**

ET-02 · Resolución de investigación

# **APTO COMO CANDIDATO, CON CONDICIONES**



**Motor SQLite local**

Compatible documentalmente con la dirección del producto.



**Reconstrucción selectiva**

Preferible a sustituir indiscriminadamente toda la tecnología existente.



**Driver, aislamiento, custodia y recuperación**

Requieren verificación documental adicional y calificación futura.



**Integridad del encargo común**

Revisión parcial de anexos y universo cruzado; no debe registrarse como investigación íntegramente cerrada.

Sin certificación funcional, selección irreversible ni autorización operativa.

Mi recomendación es conservar SQLite como fundamento de la persistencia profesional de QAP y concentrar la reconstrucción en la autoridad, los contratos, la semántica de memoria, las consultas y la coordinación de escritores.

No encuentro evidencia suficiente que justifique incorporar obligatoriamente una segunda base de datos, motor vectorial, ORM generalista o infraestructura de IA local.

La composición principal propuesta es:

**SQLite local +&#x20;**`node:sqlite`**&#x20;+ escritor canónico + SQL explícito parametrizado + FTS5 segregado + revisiones relacionales + custodia separada + consultas profesionales tipadas.**

El respaldo prioritario del driver es `better-sqlite3`, siempre que demuestre una ventaja material o resuelva una incompatibilidad concreta sin reducir las garantías de distribución, privacidad y mantenimiento.

### **23.1. Disposición para el Orquestador**

Recomiendo incorporar estas decisiones como candidatas condicionadas y contrastarlas con ET-01, ET-04, ET-05, ET-06 y ET-07.

No recomiendo cerrar formalmente ET-02 como investigación exhaustiva completa hasta resolver las limitaciones documentales declaradas y completar el cotejo de fuentes fijadas, dependencias y celdas obligatorias.

No se identifica por ahora una necesidad de reabrir las decisiones empresariales ratificadas.

### **23.2. Declaración de cumplimiento operativo**

Durante esta investigación:

- No se modificó GitHub.
- No se modificó código ni configuración.
- No se instalaron dependencias.
- No se compilaron paquetes.
- No se ejecutaron pruebas ni experimentos.
- No se accedió a sistemas empresariales.
- No se inició G0 ni G1.
- No se elaboró un WBS.
- No se seleccionaron tecnologías irreversiblemente.
- No se alteraron requisitos, políticas ni registros maestros.

**Estado de entrega: informe ET-02 documental con reservas explícitas, remitido al Orquestador Principal para integración y resolución de dependencias.**

**FIN DEL INFORME ET-02.**
