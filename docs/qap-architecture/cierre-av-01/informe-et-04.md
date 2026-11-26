# **ET-04 — Informe independiente de evaluación tecnológica de QAP**

**Especialidad:** Interfaz gráfica local y experiencia profesional\
**Destinatario:** Orquestador Principal de QAP\
**Fecha:** 26 de noviembre de 2026\
**Repositorio:** `Hyouka73/QAMCP`\
**Rama:** `develop`\
**SHA de referencia:** `38b6d5b0140c94d02677acf6a1f8ceb9f4d94029`\
**Base normativa y de código declarada por los encargos:** `1a81e86c9b17a95a04e40237eff5fb99215bae5a`\
**Naturaleza:** Investigación tecnológica documental independiente.\
**Autorización:** Exclusivamente lectura e investigación documental.

## **1. Resumen ejecutivo**

La interfaz gráfica de QAP v1 no debe concebirse como un panel complementario de resultados. Constituye una superficie operacional obligatoria para el ejercicio profesional de QA, capaz de cubrir el ciclo de trabajo humano y determinista sin depender de un agente de inteligencia artificial ni de una terminal.

La ratificación AC-DE-01 B modifica sustancialmente la importancia arquitectónica de esta interfaz.

Una solución que permita únicamente consultar reportes, visualizar ejecuciones o configurar superficialmente el runner no satisface el alcance ratificado.

### **1.1. Conclusiones arquitectónicas fundamentales**

- QAP debe mantener una sola autoridad operacional y un único escritor canónico, independientemente de la interfaz utilizada.
- La interfaz operacional y el visor histórico AR-24 deben estar separados mediante fronteras de seguridad efectivas.
- La elección entre navegador local, Electron, Tauri o una interfaz nativa no resuelve por sí misma la autorización, la privacidad ni el aislamiento.
- El framework visual debe poder reemplazarse sin reconstruir el dominio, la persistencia, los contratos de ejecución o el sistema de evidencias.
- La operación profesional sin IA debe permanecer disponible incluso cuando los cuatro hosts de inteligencia artificial estén desconectados.
- Una interfaz ligera no es necesariamente la que tiene el instalador más pequeño. Debe evaluarse el consumo completo de QAP, incluyendo navegador de automatización, renderer, núcleo, procesos auxiliares y reproducción multimedia.
- No debe sacrificarse la accesibilidad, la funcionalidad profesional o la seguridad para reducir el consumo de recursos.

La decisión tecnológica debe tomarse en dos niveles: **arquitectura de presentación y frontera operacional**, por una parte, y **framework de representación gráfica y distribución**, por otra.

Seleccionarlos como si constituyeran una única decisión produciría un acoplamiento innecesario.

### **1.2. Restricciones que no pueden negociarse**

| Invariante                          | Tratamiento ET-04           |
| ----------------------------------- | --------------------------- |
| 123 entradas normativas             | Preservación íntegra        |
| 65 cláusulas AC-01                  | Preservación íntegra        |
| 57 registros maestros               | Sin modificación de estados |
| D01–D21                             | Vigentes                    |
| DE-01–05                            | A/B/B/A con B respaldo/B    |
| AC-DE-01–07                         | B/A/B/A/A/A/A               |
| Conformidad instalada               | 100 %                       |
| Falsos PASS                         | Cero                        |
| Violaciones de autoridad y custodia | Cero                        |
| UI operacional sin IA               | Obligatoria                 |
| Visor AR-24                         | Exclusivamente lectura      |
| Windows, macOS y Linux              | Obligatorios                |
| SaaS o suscripción obligatoria      | Excluidos                   |
| Segundo escritor                    | Prohibido                   |

No procede utilizar puntuaciones ponderadas para compensar el incumplimiento de estos invariantes.

## **2. Evidencia normativa e inventario tecnológico actual**

### **2.1. Fuentes internas**

Se recuperaron íntegramente los dos encargos vinculantes mediante el conector de GitHub y se utilizaron sus referencias normativas para delimitar la investigación.

| Documento                                                                                                                                                                                                      | Identificador del blob |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| [Encargo común ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-evaluacion-tecnologica.md?utm_source=chatgpt.com)                | `01a510f9`             |
| [Encargo ET-04](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/encargo-et-04.md?utm_source=chatgpt.com)                                    | `ba5fd0f9`             |
| [Especificación consolidada](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/especificacion-consolidada.md?utm_source=chatgpt.com)                       | `46ff3f65`             |
| [Catálogo de requisitos](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/catalogo-requisitos.md?utm_source=chatgpt.com)                                  | `da529225`             |
| [Manifiesto normativo original](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-normativo-consolidado.md?utm_source=chatgpt.com) | `a0fa1642`             |
| [Manifiesto AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/manifiesto-ac01.md?utm_source=chatgpt.com)                               | `4ee02313`             |
| [Matriz de aceptación AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-aceptacion-ac01.md?utm_source=chatgpt.com)              | `5ce66ac3`             |
| [Catálogo delta AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/catalogo-delta-ac01.md?utm_source=chatgpt.com)                       | `bf99be8c`             |
| [Contratos AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/contratos-ac01.md?utm_source=chatgpt.com)                                 | `35995858`             |
| [Matriz de responsabilidad ET](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/matriz-responsables-et.md?utm_source=chatgpt.com)            | `63864c07`             |
| [Acta DE](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/acta-ratificacion-de.md?utm_source=chatgpt.com)                                   | `4c38ee62`             |
| [Acta AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/acta-ratificacion-ac01.md?utm_source=chatgpt.com)                              | `2c9fe56b`             |
| [Registro maestro](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/registro-maestro.md?utm_source=chatgpt.com)                              | `186ed341`             |
| [Resolución final AC-01](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/docs/qap-architecture/cierre-av-01/resolucion-final-ac01.md?utm_source=chatgpt.com)                   | `d1b2ae0b`             |

**Límite de inspección:** la recuperación de documentos extensos permitió examinar las secciones y obligaciones pertinentes, pero la salida de determinadas consultas fue truncada. No declaro lectura íntegra de las 41 fuentes originales del manifiesto ni de todas las fichas extensas, pruebas e imports del repositorio. Por tanto, el informe presenta una evaluación técnica fundamentada, con reserva de exhaustividad documental. No sustituye el cotejo integral exigido para el cierre definitivo de ET-04.

### **2.2. Inventario real**

El inventario inspeccionado confirma que QAP ya posee una interfaz web histórica, construida alrededor del paquete `@qap/reporter`.

No se identificó una aplicación operacional independiente basada en React, Vue, Svelte, Electron o Tauri en los manifests e importadores del lockfile examinados.

| Componente existente           | Evidencia                                               | Disposición recomendada                                   |
| ------------------------------ | ------------------------------------------------------- | --------------------------------------------------------- |
| HTML, CSS y JavaScript         | `reporter/src/template/index.html`                      | Reconstrucción selectiva                                  |
| Servidor HTTP nativo Node      | `reporter/src/server/server.ts`                         | Sustituir frontera operacional                            |
| Servidor de telemetría         | `reporter/src/api/telemetry-server.ts`                  | Integrar en autoridad común                               |
| Estado visual mediante reducer | `reporter/src/ui/ui-state.ts`                           | Conservar conceptos aprovechables                         |
| Persistencia de reportes       | `reporter/src/persistence/sqlite-client.ts`             | Adaptar al repositorio canónico                           |
| Grafo de conocimiento          | `reporter/src/graph/`                                   | Conservar capacidad de consulta                           |
| Diálogos PowerShell            | `scripts/copy-dialog-assets.mjs`                        | Sustituir progresivamente por experiencia multiplataforma |
| TypeScript                     | `~5.5.4`, resuelto a `5.5.4`                            | Coordinar ET-01                                           |
| pnpm lockfile                  | Formato `9.0`                                           | Preservar reproducibilidad                                |
| tsup                           | `8.5.1` resuelto                                        | Evaluar alcance de build                                  |
| Ajv                            | `8.20.0` resuelto                                       | Aprovechar esquemas                                       |
| Vite                           | `8.2.2` observado en resoluciones transitivas de Vitest | No equivale a frontend instalado o calificado             |

Los blobs de `package.json`, `pnpm-lock.yaml`, plantilla HTML, servidor del reporter y servidor de telemetría coinciden entre el SHA de referencia y la base normativa y de código declarada por los encargos.

Esto permite contrastar esas piezas sin confundir cambios documentales posteriores con una reconstrucción ya implementada.

### **2.3. Hallazgos materiales del código existente**

Crítico

**ET04-H01 — El visor histórico contiene rutas de mutación**

`packages/reporter/src/server/server.ts`, líneas 126–153: la ruta `DELETE` de ejecuciones llama a `db.deleteRun`.

`packages/reporter/src/api/telemetry-server.ts`, líneas 101–149: contiene operaciones de poda, eliminación y modificación de fijación.

Incompatible con AR-24 como visor exclusivamente de lectura.

Crítico

**ET04-H02 — Frontera HTTP insuficiente**

`server.ts`, líneas 54–71: escucha local por defecto, CORS con comodín y métodos de escritura anunciados. La implementación inspeccionada no acredita autenticación efectiva por identidad y alcance.

Loopback no constituye por sí mismo una frontera de autorización.

Crítico

**ET04-H03 — Dependencias externas en la representación gráfica**

`template/index.html`, líneas 13–19: carga Google Fonts, Material Symbols y Tailwind desde recursos externos.

La interfaz actual no acredita autonomía offline, ausencia de egreso no autorizado ni reproducibilidad completa de los assets.

Alto

**ET04-H04 — Renderizado de contenido potencialmente hostil**

La plantilla utiliza `innerHTML`, interpolación de datos y manejadores de eventos en HTML.

Se identifican superficies que requieren revisar escape contextual e inyección. No se afirma explotación comprobada sin pruebas.

Crítico

**ET04-H05 — Acceso y caché de artefactos**

`server.ts`, líneas 250–321: resolución mediante rutas y entrega por streaming; utiliza `Cache-Control: public, max-age=3600`.

No acredita confinamiento mediante handles, ausencia de carreras TOCTOU, custodia revocable ni la prohibición de caché reutilizable.

Alto

**ET04-H06 — Semántica histórica insuficiente**

`sqlite-client.ts` utiliza estados agregados `passed`, `failed` y `partial`. Los contratos compartidos también contienen veredictos históricos como `human_accepted`.

No deben trasladarse directamente al modelo visual AR-52 de cuatro ejes y seis veredictos.

Alto

**ET04-H07 — Experiencia operacional incompleta**

El reducer histórico contempla arquitectura, flujos, telemetría y guardrails. No representa el conjunto profesional ratificado de estrategia, autoría, asignaciones, ejecución manual, charters, defectos, retest e intercambio.

Fuentes directas del código:

- [Servidor del reporter](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/packages/reporter/src/server/server.ts?utm_source=chatgpt.com).
- [Servidor de telemetría](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/packages/reporter/src/api/telemetry-server.ts?utm_source=chatgpt.com).
- [Plantilla de interfaz](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/packages/reporter/src/template/index.html?utm_source=chatgpt.com).
- [Estado visual](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/packages/reporter/src/ui/ui-state.ts?utm_source=chatgpt.com).
- [Persistencia del reporter](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/packages/reporter/src/persistence/sqlite-client.ts?utm_source=chatgpt.com).
- [Contratos compartidos](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/packages/shared/src/domain/application-contracts.ts?utm_source=chatgpt.com).
- [Lockfile](https://github.com/Hyouka73/QAMCP/blob/38b6d5b0140c94d02677acf6a1f8ceb9f4d94029/pnpm-lock.yaml?utm_source=chatgpt.com).

Los hallazgos son documentales. La existencia de una ruta en código no demuestra automáticamente que esté alcanzable en todas las distribuciones instaladas.

### **2.4. Qué merece conservarse**

La reconstrucción de la interfaz no requiere desechar todas las capacidades históricas.

| Elemento                                    | Decisión candidata                              |
| ------------------------------------------- | ----------------------------------------------- |
| Navegación mediante reducer puro            | Conservar como patrón                           |
| Transiciones atómicas de vistas             | Conservar                                       |
| Inspector contextual                        | Adaptar                                         |
| Grafo de módulos y relaciones               | Adaptar a consultas autorizadas                 |
| Sincronización video-paso                   | Conservar intención, recalificar implementación |
| Presentación de telemetría                  | Adaptar                                         |
| Generadores existentes                      | Conservar donde cumplan contrato                |
| Rutas de eliminación del visor              | Retirar                                         |
| Lectura arbitraria de archivos              | Sustituir                                       |
| Acceso directo a SQLite                     | Sustituir                                       |
| CDN y fuentes externas                      | Retirar                                         |
| Agregación legacy de veredictos             | Sustituir                                       |
| HTML monolítico como aplicación operacional | No recomendado                                  |

La recomendación es una **reconstrucción selectiva de la capa de presentación**, no una reescritura general de QAP.

## **3. Mapa de responsabilidad normativa**

Se realizó un cotejo nominal de conjuntos entre la matriz de responsabilidades ET, la matriz de aceptación integrada, el catálogo delta y los encabezados del registro maestro.

| Universo              | Registros encontrados | Diferencias nominales |
| --------------------- | --------------------- | --------------------- |
| Entradas normativas   | 123                   | 0                     |
| Cláusulas AC-01       | 65                    | 0                     |
| Registros maestros AR | 57                    | 0                     |

Este cotejo acredita coincidencia de identificadores, no conformidad funcional ni cobertura semántica instalada.

### **3.1. Requisitos de responsabilidad primaria ET-04**

ET-04 tiene asignados once requisitos normativos.

| Requisito     | Capacidad tecnológica necesaria              | Dependencia principal |
| ------------- | -------------------------------------------- | --------------------- |
| REQ-STR-001.1 | Estrategias, riesgos y criterios versionados | ET-01/02              |
| REQ-STR-001.2 | Trazabilidad y cobertura multidimensional    | ET-02                 |
| REQ-STR-001.3 | Evaluación de entrega y decisión UAT         | ET-01/05              |
| REQ-CAS-002.1 | Sets reutilizables y selección congelada     | ET-01/02              |
| REQ-CAS-002.2 | Asignación y seguimiento profesional         | ET-01/02/06           |
| REQ-HUM-001.1 | Operación integral sin IA                    | ET-01/07              |
| REQ-HUM-001.2 | Interfaz local autenticada y accesible       | ET-01/06              |
| REQ-HUM-001.3 | Ejecución manual guiada                      | ET-01/05              |
| REQ-HUM-001.4 | Ejecución híbrida y continuidad              | ET-01/03              |
| REQ-CAM-002.1 | Exploración estructurada mediante charters   | ET-01/02              |
| REQ-CAS-002.3 | Componentes declarativos reutilizables       | ET-01/03              |

### **3.2. Cláusulas de coordinación primaria**

| Cláusula   | Garantía que debe ofrecer la interfaz                     |
| ---------- | --------------------------------------------------------- |
| AC01-01.01 | Fuentes, revisiones, conflictos y brechas de testabilidad |
| AC01-01.02 | Técnicas de diseño vinculadas a reglas                    |
| AC01-01.03 | Navegación bidireccional y denominadores diferenciados    |
| AC01-02.01 | Estrategia versionada y riesgos residuales                |
| AC01-02.02 | Criterios de entrada y salida congelados                  |
| AC01-03.01 | Recomendación QA y decisión autorizada independiente      |
| AC01-03.02 | Historia de auditoría protegida                           |
| AC01-04.01 | Sets versionados y deduplicación semántica                |
| AC01-04.02 | Asignaciones independientes de permisos                   |
| AC01-05.01 | Flujo profesional completo sin modelo                     |
| AC01-05.02 | Edición humana con revisión y CAS                         |
| AC01-05.03 | Interfaz gráfica operacional integral                     |
| AC01-05.04 | Frontera efectiva respecto del visor                      |
| AC01-06.01 | Ejecución manual reproducible                             |
| AC01-06.02 | Clasificación epistemológica de aportes y testigos        |
| AC01-09.01 | Charters, sesiones y hallazgos exploratorios              |

Son dieciséis cláusulas de coordinación primaria. Además, deben contrastarse directamente:

| Cláusula compartida | Responsabilidad ET-04                                      |
| ------------------- | ---------------------------------------------------------- |
| AC01-07.01          | Representación y control del flujo híbrido                 |
| AC01-15.02          | Autoría de componentes declarativos reutilizables          |
| AC01-19.06          | Accesibilidad propia de QAP y exposición de resultados AUT |

### **3.3. Dependencias de las restantes entradas normativas**

La matriz ET identifica otras 86 entradas en las que ET-04 interviene como especialidad consultada. No deben contarse nuevamente como requisitos de responsabilidad primaria.

| Familia      | IDs comprendidos                                 | Contrato de presentación                    |
| ------------ | ------------------------------------------------ | ------------------------------------------- |
| MEM          | 001.1–4, 002.1–5, 003.1–6                        | Consultas, revisiones, linaje y permisos    |
| DOC          | 001.1–4                                          | Importación, revisión y localización        |
| IA           | 001.1–6                                          | Estado HOST sin dependencia obligatoria     |
| PLN          | 001.1–6                                          | Planes y obligaciones congeladas            |
| CAS          | 001.1–5                                          | Biblioteca y edición versionada             |
| ORA          | 001.1–7                                          | Expectativas, testigos y suficiencia        |
| DAT          | 001.1–4, 002.1–2                                 | Datasets y calidad de datos                 |
| CAM          | 001.1–5                                          | Control de campañas                         |
| REP          | 001.1–4, 002.1–5                                 | Consultas, reportes y publicaciones         |
| REG          | 001.1–3                                          | Regresión y comparación                     |
| SEG          | 001.1–3, 002.1–3                                 | Autorización, revocación y auditoría        |
| INT          | 001.1–4                                          | Paridad de consumidores                     |
| Otros REQ    | XINST-001, AGT-001, AUTREP-001, AGT-002, ONB-001 | Integración y operación profesional         |
| Políticas    | POL-CAP-001, POL-RET-001                         | Custodia y conservación                     |
| Ampliaciones | UTCP/OpenAPI, M1–M5                              | Proyecciones y operaciones correspondientes |

Los requisitos restantes siguen siendo responsabilidad de sus especialidades respectivas. Su ausencia de esta tabla no constituye eliminación de alcance.

## **4. Alternativas tecnológicas de interfaz y distribución**

### **4.1. Universo considerado**

| Candidato | Arquitectura                             | Disposición documental                |
| --------- | ---------------------------------------- | ------------------------------------- |
| A         | Interfaz web histórica adaptada          | Reutilización parcial                 |
| B         | Aplicación web local autenticada moderna | Candidato principal                   |
| C         | Electron                                 | Respaldo principal de distribución    |
| D         | Tauri 2                                  | Candidato alternativo de optimización |
| E         | Qt 6, interfaz nativa                    | Reserva de baja prioridad             |
| F         | Aplicación web remota/SaaS               | Descartada para v1                    |
| G         | CLI más visor de reportes                | Descartada como solución integral     |

### **4.2. Candidato A — Evolucionar el HTML histórico**

Presenta la ventaja de utilizar mecanismos existentes, sin incorporar necesariamente un framework visual.

Sin embargo, la deuda principal no es estética. Es estructural:

- Mezcla representación gráfica y operaciones históricas incompatibles con el visor.
- Utiliza dependencias remotas.
- No representa adecuadamente formularios complejos, revisiones, conflictos y gestión profesional.
- Carece de acreditación de accesibilidad.
- Requiere reconstruir igualmente el transporte y la autoridad.

La reducción inicial del número de dependencias podría trasladar el costo hacia mecanismos propios de formularios, estado, tablas, navegación, validación y componentes accesibles.

**Conclusión:** APTO COMO FUENTE DE REUTILIZACIÓN. No recomendado como implementación integral mediante modificaciones incrementales del archivo HTML monolítico.

### **4.3. Candidato B — Aplicación web local autenticada**

Composición conceptual candidata; no representa una implementación existente.

La interfaz se distribuye como assets estáticos locales y utiliza un navegador compatible, abierto mediante el lanzador gráfico de QAP.

El usuario no necesita iniciar manualmente un servidor ni escribir comandos.

**Ventajas:**

- Reutilización del ecosistema TypeScript.
- Ausencia de obligación de distribuir otro Chromium exclusivamente para la interfaz.
- Separación natural entre presentación y núcleo.
- Actualizaciones del frontend relativamente independientes.
- Posibilidad de probar la misma interfaz en distintos motores.
- Experiencia profesional completa mediante estándares web.

**Riesgos:**

- DNS rebinding, CSRF y ataques desde sitios externos contra servicios loopback.
- Extensiones del navegador con privilegios elevados.
- Diferencias de codecs, accesibilidad y almacenamiento entre navegadores.
- Riesgo de reutilización de perfiles personales.
- Dependencia de un navegador efectivamente disponible y mantenido.
- Cambios de políticas de acceso a red local.

MDN documenta que la consideración de loopback como contexto potencialmente confiable no elimina las amenazas de origen, CSRF o acceso desde sitios hostiles.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.mozilla.org\&sz=32)

MDN+2



**Condición eliminatoria:** la interfaz web no puede aprobarse si el gateway local no acredita la frontera efectiva requerida por EXP-08a.

Un puerto aleatorio, CORS, una cookie o un token por sí solos no son prueba suficiente.

**Conclusión:** APTO COMO CANDIDATO PRINCIPAL, condicionado a la frontera de seguridad.

### **4.4. Candidato C — Electron**

Electron incorpora Chromium y Node.js en una aplicación de escritorio. Su documentación oficial contempla aislamiento de contexto, sandbox de renderer y exposición restringida mediante `contextBridge`.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.electronjs.org\&sz=32)

Electron+3



#### **Estado de versiones consultado**

El calendario oficial muestra:

| Rama        | Publicación estable | Fin de soporte programado |
| ----------- | ------------------- | ------------------------- |
| Electron 45 | 20/10/2026          | 27/04/2027                |
| Electron 44 | 24/08/2026          | 02/03/2027                |
| Electron 43 | 29/06/2026          | 05/01/2027                |
| Electron 42 | 05/05/2026          | Finalizado el 20/10/2026  |

Electron 45 incorpora Chromium M156 y Node.js 24.22.0 según el calendario consultado. El proyecto mantiene las tres ramas mayores estables más recientes; las fechas futuras pueden cambiar.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://releases.electronjs.org\&sz=32)

Electron Releases+1



**Rango candidato:** Electron 45.x, utilizando un parche estable vigente y revisado en el momento de calificación, no una versión congelada por este informe.

**Ventajas:**

- Motor de representación controlado por la distribución.
- Integración de ventanas y escritorio.
- Buena continuidad con TypeScript.
- Menor diversidad de renderer respecto de Tauri.
- Posibilidad de aplicar un perfil de navegador exclusivo de QAP.
- Distribución independiente de un navegador instalado por el usuario.

**Desventajas:**

- Incorpora otro conjunto de Chromium y Node.
- Mayor costo potencial de instalación, almacenamiento y actualización.
- Requiere seguir continuamente el ciclo de parches de Electron.
- Posibles conflictos ABI con módulos nativos.
- El proceso principal y preload constituyen superficies privilegiadas adicionales.

La versión Node incluida en Electron no debe sustituir automáticamente al runtime del núcleo soberano.

**Perfil obligatorio de seguridad candidato:**

| Parámetro            | Condición                               |
| -------------------- | --------------------------------------- |
| `nodeIntegration`    | Desactivado                             |
| `contextIsolation`   | Activado                                |
| `sandbox`            | Activado                                |
| `webSecurity`        | Activado                                |
| Navegación remota    | Denegada por defecto                    |
| Creación de ventanas | Restringida                             |
| IPC                  | Operaciones explícitas y tipadas        |
| `<webview>`          | No requerido; evitar                    |
| Acceso a filesystem  | No disponible para renderer             |
| SQLite y vault       | No disponibles para renderer ni preload |

**Conclusión:** APTO COMO CANDIDATO DE RESPALDO, sujeto a EXP-08, soporte instalado y presupuesto de recursos.

### **4.5. Candidato D — Tauri 2**

Tauri utiliza un shell nativo escrito en Rust y el motor WebView correspondiente al sistema operativo:

| Sistema | Renderer                |
| ------- | ----------------------- |
| Windows | Microsoft Edge WebView2 |
| macOS   | WKWebView               |
| Linux   | WebKitGTK               |

La arquitectura y los prerrequisitos están documentados en las fuentes oficiales.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+2



La versión del núcleo Tauri observada en el registro oficial de publicaciones es `2.12.7`, publicada el 18 de noviembre. No todos sus paquetes auxiliares comparten numeración.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



**Rango candidato:** Tauri 2.12.x o rama estable 2.x mantenida en el momento de calificación.

Tauri ofrece un sistema de capabilities para restringir comandos expuestos a ventanas y WebViews. También permite distribuir binarios auxiliares mediante sidecars.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://v2.tauri.app\&sz=32)

Tauri+1



#### **Ventajas**

- No requiere necesariamente empaquetar un motor Chromium exclusivo.
- Shell nativo relativamente pequeño.
- Permisos de puente declarables.
- Integración con escritorio.
- Compatible con un frontend TypeScript compartido.

#### **Desventajas**

- Introduce Rust y su cadena de dependencias.
- Exige una matriz de WebViews heterogénea.
- En Linux depende de bibliotecas y políticas de distribución del sistema.
- Puede incrementar el costo de soporte de accesibilidad y codecs.
- Mantiene el costo del núcleo QAP si este continúa en Node.
- Un sidecar por arquitectura debe ser supervisado, autenticado y distribuido correctamente.

Microsoft contempla distribución Evergreen de WebView2, instalación offline y distribución Fixed Version. La última traslada al distribuidor mayor responsabilidad de mantenimiento.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://learn.microsoft.com\&sz=32)

Microsoft Learn+1



Por tanto, no debe evaluarse Tauri utilizando únicamente el tamaño de su ejecutable.

**Conclusión:** APTO COMO CANDIDATO ALTERNATIVO. Preferencia condicionada a demostrar un beneficio total de recursos y mantenimiento sin degradar garantías.

No recomiendo migrar el núcleo a Rust únicamente para evitar un sidecar.

### **4.6. Candidato E — Qt 6**

Qt representa una alternativa nativa razonable cuando la integración web no cumple requisitos esenciales.

Las licencias y módulos disponibles incluyen modalidades comerciales, GPL y LGPL según componente. Las obligaciones de redistribución bajo LGPL necesitan analizarse específicamente.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.qt.io\&sz=32)

Qt Open Source Licensing+2



Para QAP implicaría:

- Nueva tecnología de representación.
- Adaptadores adicionales hacia el núcleo.
- Mayor reconstrucción de componentes existentes.
- Nueva matriz de accesibilidad.
- Mayor complejidad de distribución de bibliotecas.
- Revisión de módulos y licencias por artefacto.

No se identificó una necesidad normativa que exija representación nativa mediante Qt.

**Conclusión:** CONDICIONADO, como reserva documental si las alternativas web y shells no consiguen una composición calificable.

No recomiendo incorporarlo al conjunto inicial de candidatos experimentales salvo evidencia de una brecha concreta.

### **4.7. Matriz comparativa de arquitecturas**

| Criterio                         | Web local                 | Electron      | Tauri                         | Qt             |
| -------------------------------- | ------------------------- | ------------- | ----------------------------- | -------------- |
| Reutilización TypeScript         | Alta                      | Alta          | Alta en frontend              | Baja           |
| Control sobre renderer           | Dependiente del navegador | Alto          | Dependiente del SO            | Alto           |
| Runtime gráfico adicional        | Evitable                  | Incluido      | WebView existente o instalado | Bibliotecas Qt |
| Homogeneidad entre SO            | Media                     | Alta relativa | Media-baja                    | Media-alta     |
| Integración con escritorio       | Requiere lanzador         | Amplia        | Amplia                        | Amplia         |
| Costo inicial de integración     | Bajo-medio                | Medio         | Medio-alto                    | Alto           |
| Costo de soporte multiplataforma | Medio                     | Medio         | Medio-alto                    | Alto           |
| Frontera calificable             | Condicionada              | Condicionada  | Condicionada                  | Condicionada   |
| Operación offline                | Factible                  | Factible      | Factible                      | Factible       |
| Accesibilidad propia             | Por calificar             | Por calificar | Por calificar                 | Por calificar  |
| Dependencia IA obligatoria       | No necesaria              | No necesaria  | No necesaria                  | No necesaria   |
| Reutilización entre candidatos   | Alta                      | Alta          | Alta                          | Baja           |

Los costos son estimaciones relativas de ingeniería, no mediciones económicas o de rendimiento. No se dispone de benchmarks comparables ejecutados sobre QAP.

## **5. Framework de representación gráfica**

La selección del framework debe ser independiente del transporte y del shell.

### **5.1. React**

La página oficial de versiones identifica React 19.3 como la rama actual de documentación.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://react.dev\&sz=32)

React



React es un candidato adecuado para:

- Formularios profesionales complejos.
- Tablas y filtros.
- Navegación estructurada.
- Componentes reutilizables.
- Inspectores de evidencias.
- Estado visual y consumo de DTO tipados.
- Bibliotecas de virtualización independientes.

Su principal ventaja en QAP es la posibilidad de construir una interfaz compleja manteniendo dominio y persistencia fuera del renderer.

No debe adoptarse React Server Components, un servidor de renderizado adicional o Next.js por defecto. La aplicación puede funcionar mediante un bundle estático local.

**Rango candidato:** React 19.x estable mantenido.

**Licencia:** MIT en su código principal. Deben evaluarse por separado las bibliotecas complementarias.

### **5.2. Vue**

El registro oficial consultado identifica Vue `3.5.46` como publicación marcada Latest. Vue documenta integración TypeScript y licencia MIT.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



Ofrece una alternativa viable para formularios, componentes, navegación y lógica reactiva.

No existe una incompatibilidad inherente con la arquitectura normativa de QAP.

**Rango candidato:** Vue 3.5.x o rama estable mantenida.

**Disposición:** respaldo principal del framework visual.

### **5.3. Svelte**

El registro oficial consultado identifica `5.59.2` como versión Latest.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Su estrategia de compilación resulta interesante para reducir determinados costos de representación.

Sin embargo, un bundle pequeño no demuestra por sí solo:

- Menor consumo de memoria de QAP.
- Mejor comportamiento con tablas extensas.
- Menor latencia durante reproducción multimedia.
- Mayor accesibilidad instalada.
- Menor costo de mantenimiento.

**Rango candidato:** Svelte 5.x estable mantenido.

**Disposición:** alternativa viable, subordinada a beneficios demostrables frente a React y Vue.

### **5.4. Comparación**

| Criterio                             | React             | Vue                   | Svelte      |
| ------------------------------------ | ----------------- | --------------------- | ----------- |
| Compatibilidad TypeScript            | Documentada       | Documentada           | Documentada |
| Aplicación estática offline          | Factible          | Factible              | Factible    |
| Transporte independiente             | Factible          | Factible              | Factible    |
| Formularios complejos                | Ecosistema amplio | Ecosistema suficiente | Factible    |
| Virtualización                       | Disponible        | Disponible            | Disponible  |
| Accesibilidad automática garantizada | No                | No                    | No          |
| Riesgo de acoplamiento al framework  | Controlable       | Controlable           | Controlable |
| Rendimiento QAP demostrado           | No                | No                    | No          |
| Preferencia documental               | Principal         | Respaldo              | Alternativa |

### **5.5. Componentes adicionales candidatos**

| Función                  | Principal                              | Respaldo                                  |
| ------------------------ | -------------------------------------- | ----------------------------------------- |
| Framework                | React 19.x                             | Vue 3.x                                   |
| Build frontend           | Bundler estático compatible            | esbuild u otro bundler mantenido          |
| Validación               | JSON Schema/Ajv compartido             | Validador compatible con mismos contratos |
| Tablas                   | HTML semántico y consultas paginadas   | TanStack Table                            |
| Virtualización           | TanStack Virtual, cuando sea necesaria | Paginación accesible                      |
| Estado                   | Reducers y estado local controlado     | Store ligero                              |
| Estilos                  | CSS local compilado                    | Tailwind compilado localmente             |
| Internacionalización     | `Intl` y catálogos locales             | Biblioteca i18n mantenida                 |
| Accesibilidad automática | axe-core como instrumento              | Evaluación equivalente calificada         |
| Multimedia               | Elementos HTML y streaming protegido   | Reproductor aislado calificado            |

TanStack Virtual documenta compatibilidad con distintos frameworks. No obstante, su virtualización no proporciona automáticamente una tabla accesible.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tanstack.com\&sz=32)

tanstack.com+1



**Recomendación:** no adoptar un kit empresarial de componentes de pago como dependencia obligatoria.

Las tablas, formularios y componentes avanzados deben poder operar sin suscripciones, servicios externos ni funciones bloqueadas comercialmente.

## **6. Arquitectura de presentación propuesta**

### **6.1. Separación de superficies**

Separación lógica propuesta. La frontera efectiva entre principales requiere calificación; el diagrama no la acredita.

La interfaz operacional no debe ser un administrador directo de SQLite, archivos o secretos.

El núcleo conserva autoridad sobre:

- Identidades.
- Permisos.
- Revisiones.
- Intenciones.
- Ejecución.
- Veredictos.
- Publicación.
- Revocación.
- Conservación.

El frontend representa resultados y solicita operaciones. No decide unilateralmente su validez.

### **6.2. Contrato de comandos**

Propuesta conceptual para coordinación con ET-01 y ET-07:

```
interface CommandRequest {
  contractVersion: string;
  requestId: string;
  command: string;
  projectId: string;
  expectedRevision?: string;
  idempotencyKey: string;
  payload: unknown;
}
```

La identidad efectiva, la autoridad y la época de autorización deben derivarse o comprobarse mediante la sesión autenticada y el núcleo.

No se aceptarán como hechos confiables únicamente porque el renderer los declare en el payload.

La respuesta debe diferenciar:

| Resultado de comando  | Significado                                 |
| --------------------- | ------------------------------------------- |
| Rechazado             | La operación no fue admitida                |
| Conflicto             | La revisión o el estado ya no coinciden     |
| Aceptado durablemente | La intención fue registrada                 |
| En ejecución          | Operación todavía abierta                   |
| Terminal              | Existe resultado final conforme al contrato |

Un ACK no constituye un PASS.

El frontend tampoco asigna el código final de campaña; muestra la proyección canónica correspondiente a su clase de operación.

### **6.3. Contrato de consultas**

```
interface QueryRequest {
  contractVersion: string;
  projectId: string;
  queryType: string;
  filter?: unknown;
  sort?: unknown;
  cursor?: string;
  limit?: number;
  asOf?: string;
}
```

Los tipos concretos se coordinan con ET-02.

Condiciones fundamentales:

- Sin SQL libre.
- Sin rutas arbitrarias.
- Autorización por campo, fila y ámbito.
- Paginación reproducible cuando el universo esté congelado.
- Identificación de consultas obsoletas.
- Límites de tamaño.
- Revocación efectiva.
- Ausencia de resultados cacheados fuera del grant.
- Proyección explícita de disponibilidad histórica.

### **6.4. Estado visual frente a estado durable**

| Estado                 | Responsable                     |
| ---------------------- | ------------------------------- |
| Pestaña seleccionada   | Frontend                        |
| Panel abierto          | Frontend                        |
| Filtro de consulta     | Frontend y contrato de consulta |
| Borrador no confirmado | Frontend bajo política          |
| Revisión vigente       | Núcleo                          |
| Permiso efectivo       | Autoridad                       |
| Ejecución activa       | Ejecutor soberano               |
| Veredicto              | Núcleo canónico                 |
| Evidencia disponible   | Custodio                        |
| Defecto abierto        | Repositorio operacional         |
| Asignación             | Repositorio operacional         |
| Publicación            | Publicador autorizado           |

Cerrar la ventana no debe cancelar implícitamente una ejecución válida ni liberar una barrera durable de efectos.

Reabrir QAP debe permitir recuperar el estado real mediante consultas autorizadas.

## **7. Experiencia profesional obligatoria v1**

La interfaz debe organizarse alrededor del trabajo de QA, no alrededor de la topología interna de los paquetes.

### **7.1. Superficies funcionales**

Distribución conceptual de navegación profesional. No constituye diseño visual definitivo ni implementación autorizada.

| Superficie      | Funcionalidad obligatoria                            |
| --------------- | ---------------------------------------------------- |
| Proyecto        | Identidad, entornos, configuración, alcance y reglas |
| Base de pruebas | Fuentes, requisitos, revisiones, discrepancias       |
| Estrategia      | Riesgos, criterios, cobertura y selección            |
| Biblioteca      | Casos, pasos, plantillas y componentes               |
| Datos           | Datasets autorizados y parametrización               |
| Sets            | Agrupaciones reutilizables                           |
| Asignaciones    | Responsabilidad local y seguimiento                  |
| Campañas        | Ejecución y continuidad                              |
| Exploración     | Charters y sesiones                                  |
| Defectos        | Hallazgos, pruebas, reproducción y retest            |
| Evidencias      | Catálogo, permisos, medios y disponibilidad          |
| Reportes        | Consultas, publicaciones y exportación               |
| Configuración   | Doctor, perfiles y políticas autorizadas             |

### **7.2. Escenario Senior → Executor**

Una experiencia adecuada debe permitir:

1. Registrar y versionar la base de pruebas.
2. Diseñar casos con expectativas acreditables.
3. Agruparlos en sets.
4. Definir riesgos y criterios de aceptación.
5. Congelar revisiones para la campaña.
6. Asignar obligaciones.
7. Ejecutarlas manualmente, automáticamente o de forma híbrida.
8. Registrar observaciones y evidencias.
9. Identificar defectos y bloqueos.
10. Ejecutar retest sin borrar intentos previos.
11. Elaborar y exportar reportes.
12. Registrar la recomendación QA y la decisión autorizada de entrega.

Todo el recorrido debe ser posible con los modelos desconectados.

No implica colaboración concurrente centralizada ni gestión empresarial de identidades obligatoria.

### **7.3. Ejecución manual guiada**

Cada paso debe presentar separadamente:

| Campo              | Tratamiento                   |
| ------------------ | ----------------------------- |
| Instrucción        | Revisión congelada            |
| Precondición       | Explícita                     |
| Datos              | Autorizados                   |
| Expectativa        | Independiente de lo observado |
| Observación humana | Registrada con procedencia    |
| Adjuntos           | Custodia gobernada            |
| Resultado          | Evaluación canónica           |
| Desviación         | Registrada                    |
| Bloqueo            | Causa identificable           |
| Progreso           | Recuperable                   |

Una persona no debería poder convertir una afirmación de efecto persistente en PASS mediante una casilla de confirmación cuando falte el testigo requerido.

La interacción gráfica no altera los niveles N0–N3.

### **7.4. Ejecución híbrida**

La interfaz debe distinguir:

- Pausa solicitada.
- Pausa efectiva.
- Cancelación solicitada.
- Estado abierto.
- Espera humana.
- Efecto pendiente de reconciliación.
- Finalización acreditada.

No debe representar una solicitud de cancelación como garantía de que un efecto externo fue revertido.

## **8. Representación correcta de AR-52**

La interfaz tiene que conservar los cuatro ejes independientes:

| Eje                  | Significado                         |
| -------------------- | ----------------------------------- |
| `technical_status`   | Estado técnico                      |
| `functional_verdict` | Veredicto funcional                 |
| `cleanup_status`     | Estado de limpieza o reconciliación |
| `evidence_health`    | Salud y disponibilidad probatoria   |

Los seis veredictos terminales deben mantenerse exactamente:

PASS

Afirmaciones acreditadas conforme al contrato.

FAIL

Contradicción funcional acreditada.

INDETERMINATE

Insuficiencia de prueba según contrato.

BLOCKED

Impedimento legítimo o incumplimiento de una condición.

SKIPPED

Omisión registrada y evaluada conforme a política.

ERROR

Impedimento técnico conforme a la semántica canónica.

La descripción visual nunca sustituye las tablas normativas exactas de AV-04.

Una ejecución abierta no debe recibir un séptimo veredicto terminal.

### **8.1. Distinciones necesarias**

| Concepto                    | No debe confundirse con            |
| --------------------------- | ---------------------------------- |
| Caso asignado               | Caso ejecutado                     |
| Caso ejecutado              | Caso acreditado                    |
| Caso con evidencia          | Caso funcionalmente correcto       |
| PASS estructural            | PASS funcional                     |
| Defecto corregido           | Defecto verificado                 |
| Retest exitoso              | Eliminación del FAIL histórico     |
| Campaña finalizada          | Campaña conforme                   |
| Evidencia expirada          | Reescritura del resultado original |
| Autorización administrativa | Permiso efectivo de operación      |

### **8.2. Ejemplo de representación**

**CAM-014 · Validación de solicitud**

Ejemplo ficticio de presentación

FAIL

Estado técnico

**Finalizado**

Veredicto funcional

FAIL

Cleanup

Pendiente

Evidencia

**Disponible**

El resultado funcional y la reconciliación pendiente permanecen visibles independientemente. La interfaz no simplifica ambos a un único color.

La representación precedente es conceptual y no define nuevos enums ni modifica el contrato AR-52.

## **9. Seguridad y frontera efectiva**

### **9.1. Principales amenazas**

| Amenaza                          | Web local         | Electron              | Tauri                 |
| -------------------------------- | ----------------- | --------------------- | --------------------- |
| CSRF                             | Material          | Según transporte      | Según transporte      |
| DNS rebinding                    | Material          | Si utiliza HTTP local | Si utiliza HTTP local |
| XSS                              | Material          | Material              | Material              |
| Puente privilegiado comprometido | Gateway           | Preload/IPC           | Commands/plugins      |
| Lectura directa de archivos      | Debe impedirse    | Debe impedirse        | Debe impedirse        |
| Segundo escritor                 | Debe impedirse    | Debe impedirse        | Debe impedirse        |
| Contenido AUT malicioso          | Material          | Material              | Material              |
| Replay                           | Material          | Material              | Material              |
| Extensiones del navegador        | Riesgo específico | Perfil controlable    | Perfil controlable    |
| Dependencia comprometida         | Material          | Material              | Material              |

### **9.2. Perfil candidato para web local**

Se propone evaluar conjuntamente:

- Escucha exclusiva en loopback.
- Validación estricta de Host.
- Orígenes permitidos explícitos.
- Autenticación fuera de banda mediante lanzador/broker.
- Sesiones de corta duración y revocables.
- Protección CSRF independiente de la mera política CORS.
- Validación de identidad y alcance en cada comando.
- Protección contra replay.
- CSP restrictiva.
- Assets exclusivamente locales.
- Ausencia de service worker para medios protegidos.
- Navegación y ventanas externas restringidas.
- Prohibición de credenciales persistentes en `localStorage`.
- Ausencia de secretos en URL, historial, logs o argumentos.

Las políticas SameSite y la separación de origen son defensas complementarias, no sustitutos de autorización. Dos aplicaciones pueden tener orígenes diferentes y compartir condiciones relevantes para cookies y seguridad.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.mozilla.org\&sz=32)

MDN+2



**Reserva importante:** un navegador personal con extensiones de terceros puede resultar inadecuado para visualizar evidencia privada. Debe calificarse un perfil controlado o promoverse un shell aislado si la frontera no resulta suficiente.

### **9.3. Frontera operacional frente al visor**

El visor no debe recibir credenciales que habiliten comandos de escritura.

No se acepta como separación efectiva:

- Dos pestañas de la misma aplicación.
- Una bandera visual `readOnly`.
- Ocultar botones.
- Separar rutas sin autorización.
- Ejecutar dos procesos bajo un mismo principal y asumir aislamiento.
- Confiar exclusivamente en capabilities del framework.

El visor AR-24 conserva su contrato de lectura por IDs opacos, catálogo COMMITTED, validación de alcance, apertura confinada, MIME verificado, rangos acotados y revocación.

Fuente normativa: [Dictamen AV-02, AR-24](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/dictamen-av02.md?utm_source=chatgpt.com#ar-24).

### **9.4. Advisories contemporáneos**

Los registros oficiales consultados contienen vulnerabilidades especialmente pertinentes para el diseño de QAP:

| Tecnología | Advisory                                                                                                                   | Publicación | Relevancia                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------- |
| Tauri      | [GHSA-w28w-mhc8-qvjv](https://github.com/tauri-apps/tauri/security/advisories/GHSA-w28w-mhc8-qvjv?utm_source=chatgpt.com)  | 26/09/2026  | Control de acceso IPC                  |
| Tauri      | [GHSA-7gmj-67g7-phm9](https://github.com/tauri-apps/tauri/security/advisories/GHSA-7gmj-67g7-phm9?utm_source=chatgpt.com)  | 06/05/2026  | Confusión de origen                    |
| Electron   | [GHSA-gr2m-v5gq-v685](https://github.com/electron/electron/security/advisories/GHSA-gr2m-v5gq-v685?utm_source=chatgpt.com) | 29/08/2026  | Restricciones de sandbox en ventanas   |
| Electron   | [GHSA-9qh4-3jw8-366w](https://github.com/electron/electron/security/advisories/GHSA-9qh4-3jw8-366w?utm_source=chatgpt.com) | 29/08/2026  | Integración Node en Web Workers        |
| Electron   | [GHSA-997q-gvvc-jwmx](https://github.com/electron/electron/security/advisories/GHSA-997q-gvvc-jwmx?utm_source=chatgpt.com) | 15/10/2026  | Atribución de origen de `openExternal` |

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+5

Estos registros justifican reducir APIs expuestas y no cargar contenido no confiable en un renderer privilegiado.

No constituyen afirmación de que los candidatos actuales estén necesariamente afectados. La comprobación de rangos vulnerables, parches, artefactos y alcanzabilidad deberá realizarse sobre las versiones exactas finalmente seleccionadas. Esa comprobación no se completó exhaustivamente en esta investigación.

## **10. Multimedia y evidencia protegida**

La interfaz debe reproducir evidencias sin adquirir funciones de custodio.

### **10.1. Contrato propuesto con ET-05**

```
interface EvidenceReference {
  artifactId: string;
  publicationId: string;
  mediaType: string;
  availability: string;
  durationMs?: number;
  stepOffsets?: unknown;
}
```

La referencia no incluye:

- Ruta física arbitraria.
- Clave de cifrado.
- Credencial del AUT.
- Token de exportación reutilizable.
- Permiso implícito de conservación.

### **10.2. Reproducción**

El mecanismo candidato utiliza reproducción HTML y acceso mediado a segmentos autorizados.

HTTP Range cuenta con especificación normativa en RFC 9110. Su soporte no acredita por sí mismo cifrado, revocación ni autenticación de segmentos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.rfc-editor.org\&sz=32)

rfc-editor.org



Debe calificarse:

| Garantía         | Condición                                         |
| ---------------- | ------------------------------------------------- |
| WebM auténtico   | Apertura y reproducción real                      |
| Seek             | Correspondencia con offset del paso               |
| PNG              | Visualización controlada                          |
| Range            | Límites y autenticación                           |
| Revocación       | Denegación de nuevas lecturas y cierre de streams |
| Caché            | Ausencia de copias reutilizables controladas      |
| Confidencialidad | Custodia desde adquisición                        |
| Expiración       | Estado explícito                                  |
| Exportación      | Grant independiente                               |
| Accesibilidad    | Controles operables por teclado                   |

### **10.3. Riesgo particular de Tauri**

La compatibilidad multimedia de WebView2 no acredita automáticamente WKWebView ni WebKitGTK.

En Linux pueden intervenir bibliotecas y plugins multimedia de la distribución.

En macOS pueden existir diferencias entre versiones del motor y codecs disponibles.

Por ello, la elección de Tauri exige calificación por celda real.

El fallback no puede consistir en eliminar video, seek o evidencias exigidas.

Puede considerarse un reproductor separado y calificado, pero debe conservar custodia, permisos, revocación y equivalencia funcional. Su costo se añade al de la composición completa.

## **11. Accesibilidad profesional**

### **11.1. Marco aplicable**

La decisión DE-05 B obliga a separar dos universos:

| Universo              | Obligación                       |
| --------------------- | -------------------------------- |
| Accesibilidad del AUT | Capacidad de evaluación          |
| Accesibilidad de QAP  | Calidad propia de la herramienta |

Se recomienda utilizar WCAG 2.2 como referencia técnica para la interfaz web, junto con WAI-ARIA Authoring Practices.

WCAG 2.2 contempla teclado, foco, contraste, reflow y otras condiciones relevantes.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

w3.org+2



No corresponde afirmar cumplimiento jurídico universal ni certificación WCAG integral de QAP basándose únicamente en estas referencias.

### **11.2. Garantías y pruebas candidatas**

| Capacidad                      | Referencia técnica  | Verificación                   |
| ------------------------------ | ------------------- | ------------------------------ |
| Operación mediante teclado     | WCAG 2.1.1          | Recorrido profesional completo |
| Ausencia de trampas de teclado | WCAG 2.1.2          | Diálogos, tablas y reproductor |
| Orden de foco                  | WCAG 2.4.3          | Navegación coherente           |
| Foco visible                   | WCAG 2.4.7          | Estados interactivos           |
| Foco no oculto                 | WCAG 2.4.11         | Drawers, headers y diálogos    |
| Contraste                      | WCAG 1.4.3 y 1.4.11 | Texto y controles              |
| Reflow                         | WCAG 1.4.10         | Zoom y tamaños reducidos       |
| Etiquetas e instrucciones      | WCAG 3.3.2          | Formularios                    |
| Identificación de errores      | WCAG 3.3.1          | Validación y recuperación      |
| Nombre, rol y valor            | WCAG 4.1.2          | Tecnologías de apoyo           |
| Mensajes de estado             | WCAG 4.1.3          | Progreso, conflictos y errores |

### **11.3. Tecnologías de apoyo representativas**

| Plataforma | Instrumentos candidatos                         |
| ---------- | ----------------------------------------------- |
| Windows    | Narrator y NVDA                                 |
| macOS      | VoiceOver                                       |
| Linux      | Orca y AT-SPI                                   |
| Todas      | Teclado, zoom, contraste y navegación sin mouse |

La composición concreta de navegador, WebView, SO y tecnología de apoyo se congela antes de ejecutar las pruebas.

### **11.4. Tablas y virtualización**

Las tablas interactivas complejas requieren mecanismos explícitos de navegación y gestión de foco. WAI-ARIA APG diferencia tablas de lectura y grids interactivos.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.w3.org\&sz=32)

W3C+1



Se recomienda:

- HTML semántico por defecto.
- Paginación desde el núcleo.
- Foco estable al actualizar resultados.
- Indicadores accesibles de filas y selección.
- Virtualización solo cuando el volumen lo justifique.
- Alternativa accesible cuando la virtualización interfiera con tecnologías de apoyo.

axe-core es un instrumento candidato para comprobaciones automáticas de interfaz web, no una certificación integral.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Los cinco estados de cobertura ratificados se conservan:

`EVALUADA`, `PENDIENTE_MANUAL`, `NO_APLICA`, `NO_EVALUABLE` y `BLOQUEADA`.

No son nuevos veredictos AR-52.

## **12. Rendimiento y consumo de recursos**

### **12.1. Error de comparación que debe evitarse**

Comparar el instalador de Tauri con el instalador de Electron sin incorporar sus dependencias efectivas produce una evaluación incompleta.

La unidad relevante es la instalación profesional completa de QAP.

\\[ R\_{\text{total}} = R\_{\text{núcleo}}+ R\_{\text{UI}}+ R\_{\text{AUT}}+ R\_{\text{custodia}}+ R\_{\text{auxiliares}} \\]

Esta expresión representa categorías de consumo que deben medirse considerando memoria compartida, procesos y uso efectivo. No implica que todos los recursos sean simplemente aditivos.

### **12.2. Costos potenciales por composición**

| Recurso                | Web local                | Electron              | Tauri               |
| ---------------------- | ------------------------ | --------------------- | ------------------- |
| Descarga de shell      | No necesaria             | Necesaria             | Necesaria           |
| Navegador de UI        | Existente o provisionado | Embebido              | WebView del SO      |
| Runtime del núcleo     | Necesario                | Necesario             | Necesario           |
| Navegador AUT          | Necesario según ET-03    | Igual                 | Igual               |
| Dependencias nativas   | Según navegador/SO       | Chromium y auxiliares | WebView/GTK/Rust    |
| Multimedia             | Según motor              | Según motor embebido  | Según WebView       |
| Costo de actualización | UI y navegador           | UI y Electron         | UI, shell y WebView |

No se asignan cifras de RAM, CPU o tamaño de instalación porque no se ejecutaron mediciones.

### **12.3. Escenarios futuros de calificación**

| Escenario                | Variables                                   |
| ------------------------ | ------------------------------------------- |
| Instalación limpia       | Descarga, espacio instalado, dependencias   |
| Arranque frío            | Tiempo hasta operación disponible           |
| Arranque caliente        | Reutilización y latencia                    |
| UI inactiva              | RAM, CPU y procesos                         |
| Biblioteca extensa       | Latencia de consulta, ordenación y filtrado |
| Campaña activa           | Recursos conjuntos del runner y UI          |
| Multimedia               | Decodificación, seek y buffers              |
| UI cerrada               | Liberación de recursos visuales             |
| Revocación               | Cierre de accesos y buffers controlados     |
| Presión de memoria/disco | Recuperación, límites y estabilidad         |

Los perfiles de hardware y volúmenes definitivos deben determinarse conforme a EXP-03 y las decisiones del Orquestador.

### **12.4. Análisis de sensibilidad**

La preferencia documental por web local se mantiene si:

- El navegador disponible satisface seguridad.
- La interfaz funciona offline.
- La accesibilidad es suficiente.
- El costo adicional de provisionamiento es bajo.
- La reproducción multimedia cumple todas las celdas.

Electron adquiere preferencia si el control del renderer evita problemas materiales de seguridad, compatibilidad o soporte.

Tauri adquiere preferencia si demuestra menor costo total y mantiene equivalencia funcional, especialmente en Linux y macOS.

No se recomienda sacrificar una garantía obligatoria para obtener una mejora de recursos.

## **13. Compatibilidad multiplataforma**

Se conservan las celdas relevantes de AV-06 y CV06, incluyendo distinción de arquitecturas y versiones de macOS.

| Celda              | Web local                  | Electron 45.x          | Tauri 2.x                    |
| ------------------ | -------------------------- | ---------------------- | ---------------------------- |
| Windows 11 x64     | Navegador mantenido        | Ruta documentada       | WebView2                     |
| Windows 11 ARM64   | Navegador ARM64 calificado | Ruta ARM64 documentada | WebView2 ARM64 por calificar |
| macOS 14 ARM64     | Navegador compatible       | Ruta documentada       | WKWebView                    |
| macOS 15 x64       | Navegador compatible       | Ruta documentada       | WKWebView                    |
| macOS 15 ARM64     | Navegador compatible       | Ruta documentada       | WKWebView                    |
| Ubuntu 24.04 x64   | Navegador compatible       | Ruta documentada       | WebKitGTK 4.1                |
| Ubuntu 24.04 ARM64 | Navegador compatible       | Ruta documentada       | WebKitGTK 4.1                |
| Debian 13 x64      | Navegador compatible       | Ruta documentada       | WebKitGTK 4.1                |
| Debian 13 ARM64    | Navegador compatible       | Ruta documentada       | WebKitGTK 4.1                |

Electron documenta binarios para x64 y ARM64 en los tres sistemas principales, sujeto a sus versiones soportadas.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub



Tauri documenta compatibilidad con Windows, macOS y Linux, incluyendo WebKitGTK 4.1 para su rama v2.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



Estas rutas documentales no son declaraciones de soporte QAP instalado.

Fuentes internas:

- [Matriz AV-06](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/matriz-av06.md?utm_source=chatgpt.com).
- [Contravalidación CV06](https://github.com/Hyouka73/QAMCP/blob/e12927104051dffba149dd9824ac517863eee421/docs/qap-architecture/cierre-av-01/contravalidacion-chatgpt-high-av06.md?utm_source=chatgpt.com).

### **13.1. Reglas de compatibilidad**

No se considerarán equivalentes:

- x64 nativo y ARM64 emulado.
- Ubuntu y Debian sin verificar dependencias.
- Wayland y X11.
- Navegador del sistema y WebView embebido.
- Chromium de Electron y navegador de automatización AUT.
- Diferentes versiones de WebKit.
- Un binario publicado y un paquete instalado funcionalmente.

No corresponde extender o reducir por este informe el universo obligatorio fijado por CV06. Cualquier otra celda aplicable del expediente conserva su exigibilidad.

## **14. Instalación, licencias y mantenimiento**

### **14.1. Distribución**

La experiencia de instalación debe proporcionar:

- Acceso gráfico a QAP.
- Doctor funcional.
- Comprobación de dependencias.
- Estado de provisión.
- Diagnóstico de incompatibilidades.
- Reparación y actualización gobernadas.
- Operación sin terminal.
- Ausencia de descargas silenciosas no autorizadas.
- Capacidad de recuperación y rollback.

Electron documenta distribución de aplicaciones mediante herramientas como Electron Forge y mecanismos de empaquetado manual. Tauri dispone de su propio bundler y formatos específicos por plataforma.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.electronjs.org\&sz=32)

Electron+1



La elección de empaquetador pertenece a una composición coordinada con ET-06.

### **14.2. Licencias**

| Componente     | Licencia principal identificada       | Reserva                       |
| -------------- | ------------------------------------- | ----------------------------- |
| QAP            | MIT en `LICENSE`, ISC en manifest     | Titular debe resolver         |
| React          | MIT                                   | Dependencias y avisos         |
| Vue            | MIT                                   | Dependencias y avisos         |
| Svelte         | MIT                                   | Dependencias y avisos         |
| Electron       | MIT                                   | Chromium, Node y terceros     |
| Tauri          | MIT/Apache-2.0 según componente       | Crates, plugins y WebViews    |
| TanStack Table | MIT                                   | Versión exacta y dependencias |
| Qt             | LGPL/GPL/comercial según módulo       | Obligaciones específicas      |
| WebView2       | Condiciones de distribución Microsoft | Modalidad y runtime           |

Fuentes: [licencia de Electron](https://github.com/electron/electron/blob/main/LICENSE?utm_source=chatgpt.com), [licencias de Tauri](https://github.com/tauri-apps/tauri?utm_source=chatgpt.com), [licencia de React](https://github.com/react/react/blob/main/LICENSE?utm_source=chatgpt.com), [licencia de Svelte](https://github.com/sveltejs/svelte/blob/main/LICENSE.md?utm_source=chatgpt.com), [licencia de TanStack Table](https://github.com/TanStack/table/blob/main/LICENSE?utm_source=chatgpt.com).&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+4



La licencia MIT de QAP presente en el archivo raíz no resuelve automáticamente el conflicto con ISC declarado en `package.json`.

ET-04 no propone modificar la titularidad ni la licencia del proyecto.

### **14.3. Compra y suscripciones**

Ninguna de las tres composiciones web principales requiere por definición una suscripción de usuario para operar.

No obstante, determinados mecanismos de firma, notarización, certificados y distribución empresarial pueden implicar condiciones o costos adicionales.

No se han presupuestado estos importes ni se presume que una distribución profesional completa esté libre de gastos.

Cualquier dependencia de compra obligatoria requiere revisión conforme a las decisiones ratificadas.

### **14.4. SBOM y procedencia**

La futura calificación debe diferenciar:

| Evidencia          | Alcance                             |
| ------------------ | ----------------------------------- |
| Manifest npm/Cargo | Dependencias declaradas             |
| Lockfile           | Resoluciones previstas              |
| Artefacto de build | Contenido empaquetado               |
| Instalación real   | Componentes efectivamente presentes |
| Procesos activos   | Componentes utilizados              |
| Alcanzabilidad     | Superficies disponibles             |
| SBOM               | Inventario de composición           |
| Avisos             | Obligaciones de redistribución      |
| Calificación       | Garantías efectivamente demostradas |

No se considera suficiente un SBOM del frontend que excluya runtime, WebView, codecs, binarios auxiliares o bibliotecas nativas.

### **14.5. Actualizaciones y rollback**

Electron y Tauri contemplan mecanismos de actualización de aplicaciones.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.electronjs.org\&sz=32)

Electron+1



Para QAP, una actualización debe tratarse como cambio de identidad de build.

Se requiere:

- Procedencia verificable.
- Validación de firma e integridad.
- Compatibilidad de protocolos.
- Instalación atómica cuando sea aplicable.
- Preservación de revocaciones.
- Compatibilidad con el escritor único.
- Recuperación ante actualización interrumpida.
- Prohibición de rollback que resucite permisos o elimine escrituras válidas.

No se propone incorporar obligatoriamente un servicio remoto de actualizaciones.

## **15. Contratos e interdependencias con otras especialidades**

| Especialidad | Contrato compartido                           | Riesgo de incompatibilidad             | Verificación |
| ------------ | --------------------------------------------- | -------------------------------------- | ------------ |
| ET-01        | Comandos, resultados, supervisor y revisiones | Núcleo duplicado en el shell           | E1/E2/E7     |
| ET-02        | Consultas, paginación, CAS, historial         | SQL directo o caché no autorizada      | E2/E6        |
| ET-03        | DAG, modalidad manual/híbrida, progreso       | UI confundida con navegador AUT        | E3/E5        |
| ET-05        | Reportes, medios, Range y custodio            | Codec o streaming incompatible         | EXP-06c/E6   |
| ET-06        | Identidades, IPC, instalación, aislamiento    | Frontera aparente pero no efectiva     | EXP-08a      |
| ET-07        | Paridad MCP/CLI/CI/UI                         | Comando gráfico con semántica distinta | E7           |

### **15.1. ET-01 — Núcleo y runtime**

La interfaz debe ser compatible con la hipótesis TypeScript/Node, pero no depender de que esa hipótesis resulte definitivamente elegida.

Si ET-01 recomienda otra tecnología, la interfaz puede mantenerse siempre que se preserve el contrato de transporte y resultados.

Electron no podrá crear otro núcleo dentro de su proceso principal.

Tauri no podrá sustituir el núcleo por implementaciones Rust parciales con autoridad independiente.

### **15.2. ET-02 — Persistencia y consultas**

La interfaz no podrá importar el driver SQLite, aunque sea técnicamente posible.

Las consultas paginadas, el orden estable, los filtros, los permisos y las revisiones deben resolverse por el puerto autorizado.

La persistencia de borradores locales no puede convertirse en fuente de verdad alternativa.

### **15.3. ET-03 — Automatización**

Los motores que representan la UI propia y los navegadores que ejecutan el AUT tienen funciones diferentes.

No debe:

- Reutilizarse una sesión privilegiada del AUT en la UI.
- Abrirse el AUT arbitrariamente dentro del renderer operacional.
- Acreditarse compatibilidad del AUT porque la interfaz gráfica funciona.
- Sustituirse Firefox o WebKit obligatorios por Chromium de Electron.
- Retenerse recursos del runner durante una espera humana sin necesidad.

### **15.4. ET-05 — Evidencia y reportes**

La interfaz necesita un servicio de lectura autorizada y proyecciones de reportes, no parsers independientes con acceso directo a expedientes.

PDF y XLSX propios deben seguir siendo capacidades obligatorias, independientemente de las funciones de impresión del framework gráfico.

No recomiendo utilizar `window.print()` como único mecanismo de generación de PDF profesional.

### **15.5. ET-06 — Seguridad y distribución**

Es la dependencia decisiva para la recomendación principal.

ET-06 debe establecer:

- Principales efectivos.
- Modelo de amenaza.
- Frontera del gateway.
- Aprovisionamiento de sesión.
- Aislamiento de renderer.
- Custodia de credenciales.
- Supervisor y ciclo de vida.
- Instalación por sistema operativo.
- Política de actualización.
- Alcance de revocación.

Si el modelo de amenaza demuestra que un navegador de propósito general no satisface la frontera, debe promoverse el shell calificado correspondiente.

### **15.6. ET-07 — Paridad de consumidores**

La interfaz gráfica no necesita utilizar MCP como transporte interno obligatorio.

Debe consumir el mismo contrato canónico de autoridad y resultado que MCP y CLI.

Una operación humana propia de la interfaz no tiene que simularse artificialmente en CI. Las operaciones equivalentes sí deben conservar semántica, autoridad y evidencia.

## **16. Calificación experimental futura**

No se propone sustituir los experimentos ratificados. ET-04 incorpora sus candidatos dentro de EXP-08 y los protocolos existentes.

### **16.1. EXP-08a — Factibilidad de frontera**

**Compuerta normativa:** G0, antes de abrir G1.

**Hipótesis:** al menos una composición gráfica permite operación autenticada sin romper AR-24, autoridad ni escritor único.

| Fixture            | Control sano                | Control negativo                 |
| ------------------ | --------------------------- | -------------------------------- |
| Comando autorizado | Escritura canónica admitida | Identidad no autorizada          |
| Visor histórico    | Lectura permitida           | Mutación directa e indirecta     |
| IPC                | Sesión autenticada          | IPC falsificado                  |
| HTTP local         | Origen legítimo             | CSRF y DNS rebinding             |
| Petición durable   | Deduplicación correcta      | Replay                           |
| CAS                | Revisión vigente            | Revisión obsoleta                |
| Proyecto           | Consulta autorizada         | Acceso cruzado                   |
| Revocación         | Acceso mientras vigente     | Operación posterior a revocación |
| Escritor           | Una autoridad efectiva      | Segundo escritor                 |
| Evidencia          | Lectura catalogada          | Ruta arbitraria o escape         |

**Criterio:** positivos válidos, cero mutaciones desde el visor, cero accesos indebidos y cero segundos escritores.

Los negativos no deben pasar simplemente porque el sistema deniegue todas las operaciones.

**Fallback:** cambiar de transporte o shell manteniendo la UI B. Si ninguna alternativa satisface la frontera, bloquear selección.

### **16.2. EXP-08b — Vertical instalada**

**Compuerta:** G1, conforme a autorización posterior.

Fixture de recorrido completo reducido:

- Proyecto.
- Base de pruebas.
- Caso versionado.
- Asignación.
- Ejecución manual.
- Consulta.
- Importación con conflicto.
- Reinicio y recuperación.
- Paridad MCP/CLI/UI aplicable.

Debe funcionar sin credenciales IA, sin inferencias y sin terminal obligatoria.

**Criterio:** una única revisión canónica, conflictos explícitos, recuperación durable, autoridad conservada e identidad de build verificada.

### **16.3. EXP-08c — Integración profesional instalada**

**Compuertas:** G3/G5, según el DAG aprobado.

| Grupo          | Criterio                                       |
| -------------- | ---------------------------------------------- |
| Manual/híbrida | Continuidad y reconciliación correctas         |
| Formularios    | Validación y conflictos sin pérdida silenciosa |
| Evidencia      | Custodia, revocación y medios protegidos       |
| Reportes       | Proyección canónica y exportación              |
| Accesibilidad  | Estados críticos propios acreditados           |
| Tablas         | Operación correcta con volumen representativo  |
| Instalación    | Windows/macOS/Linux y arquitecturas aplicables |
| Seguridad      | Cero bypass y acceso cruzado                   |
| Paridad        | Equivalencia de operaciones correspondientes   |
| Recursos       | Presupuesto absoluto y beneficio medido        |

**Fallback:** misma interfaz en un renderer o shell alternativo calificado, sin eliminar capacidades.

### **16.4. Reutilización de protocolos existentes**

| Protocolo   | Cobertura ET-04                                  |
| ----------- | ------------------------------------------------ |
| EXP-01a/b   | Integración y eficiencia pertinente              |
| EXP-02      | Comparación de capacidades donde proceda         |
| EXP-03      | Recursos y presión operacional                   |
| EXP-04a/b   | Instalación, composición y compatibilidad        |
| EXP-05a/b   | Presentación de efectos y resultados             |
| EXP-06a     | Privacidad desde captura                         |
| EXP-06b     | Testigos y documentos D11                        |
| EXP-06c     | Evidencia, retención y privacidad                |
| EXP-07      | Autoridad e integración                          |
| EXP-08a/b/c | Frontera y operación gráfica                     |
| E1          | Invariantes y contratos                          |
| E2          | Persistencia, revisión y recuperación            |
| E3          | Continuidad operacional                          |
| E4          | Estrategia, planificación y diseño               |
| E5          | Efectos, testigos y cleanup                      |
| E6          | Custodia, seguridad y accesibilidad              |
| E7          | Paridad instalada                                |
| E8          | Evaluación independiente                         |
| G6.5        | Recorrido profesional empresarial representativo |

No se identifica la necesidad de crear un EXP adicional independiente. Las dudas de representación, recursos, seguridad y accesibilidad pueden incorporarse a los protocolos existentes mediante parámetros previamente congelados.

### **16.5. Ciego independiente**

Los recorridos humanos deben incorporarse al universo de evaluación independiente sin confundirse con las métricas de autonomía HOST.

Se preservan:

- Custodio independiente.
- Corpus y reserva limpios.
- Criterios previos.
- Denominadores congelados.
- Estratos obligatorios.
- Cero rescate retrospectivo.
- Cero falsos PASS.
- Cero violaciones de autoridad o custodia.

No debe reutilizarse un escenario conocido de desarrollo como si constituyera evaluación ciega.

## **17. Matriz integrada de capacidades y garantías**

**Clasificación:** documentado = existe mecanismo tecnológico relevante; condicionado = requiere composición o prueba; indeterminado = no se dispone de evidencia suficiente. Ninguna clasificación equivale a PASS de QAP.

| Capacidad                 | Trazabilidad          | Web local     | Electron      | Tauri                     | Calificación    |
| ------------------------- | --------------------- | ------------- | ------------- | ------------------------- | --------------- |
| Interfaz gráfica integral | HUM-001.2, AC01-05.03 | Documentado   | Documentado   | Documentado               | EXP-08b/c       |
| Operación sin IA          | HUM-001.1             | Condicionado  | Condicionado  | Condicionado              | E7              |
| Autoridad efectiva        | AC01-05.04            | Condicionado  | Condicionado  | Condicionado              | EXP-08a         |
| Visor de solo lectura     | AR-24                 | Condicionado  | Condicionado  | Condicionado              | G0/E6           |
| Único escritor            | MEM-003.6             | Condicionado  | Condicionado  | Condicionado              | E2              |
| Edición CAS               | AC01-05.02            | Condicionado  | Condicionado  | Condicionado              | E2              |
| Riesgos y estrategias     | STR-001.1             | Documentado   | Documentado   | Documentado               | E4              |
| Trazabilidad              | STR-001.2             | Condicionado  | Condicionado  | Condicionado              | E4/E7           |
| Entrega/UAT               | STR-001.3             | Condicionado  | Condicionado  | Condicionado              | E5/E7           |
| Sets                      | CAS-002.1             | Documentado   | Documentado   | Documentado               | E2/E4           |
| Asignaciones              | CAS-002.2             | Condicionado  | Condicionado  | Condicionado              | E2              |
| Componentes declarativos  | CAS-002.3             | Condicionado  | Condicionado  | Condicionado              | E4/E5           |
| Manual guiada             | HUM-001.3             | Documentado   | Documentado   | Documentado               | E1/E3/E5        |
| Ejecución híbrida         | HUM-001.4             | Condicionado  | Condicionado  | Condicionado              | E2/E3/E5        |
| Charters                  | CAM-002.1             | Documentado   | Documentado   | Documentado               | E3/E4           |
| Cuatro ejes               | AR-52                 | Condicionado  | Condicionado  | Condicionado              | E1/E7           |
| Evidencia revocable       | AR-24/27              | Condicionado  | Condicionado  | Condicionado              | E6              |
| WebM y seek               | AR-27                 | Condicionado  | Condicionado  | Indeterminado por WebView | EXP-06c         |
| Reportes PDF/XLSX         | REP-002, AR-50        | Condicionado  | Condicionado  | Condicionado              | E6/E7           |
| Accesibilidad propia      | DE-05 B               | Condicionado  | Condicionado  | Condicionado              | E6/E7           |
| Operación offline         | AC-DE-01 B            | Factible      | Factible      | Factible                  | EXP-08c         |
| Tres SO y CPU aplicables  | CV06                  | Condicionado  | Condicionado  | Condicionado              | EXP-04/08       |
| Rendimiento absoluto      | EXP-03                | Indeterminado | Indeterminado | Indeterminado             | Medición futura |
| Paridad consumidores      | AR-52, E7             | Condicionado  | Condicionado  | Condicionado              | E7              |
| Distribución gobernada    | CV07                  | Condicionado  | Condicionado  | Condicionado              | EXP-04          |

La tabla demuestra que la elección del framework no elimina las obligaciones de integración y calificación.

## **18. Registros maestros que requieren especial atención**

| Registro | Implicación ET-04                                   |
| -------- | --------------------------------------------------- |
| AR-24    | Visor exclusivamente de lectura; bloqueo G0         |
| AR-27    | Custodia y reproducción protegidas                  |
| AR-40    | Seguridad de operaciones Git presentadas al usuario |
| AR-52    | Cuatro ejes, seis veredictos y paridad              |
| AR-20    | D11 y contraste con documentos AUT                  |
| AR-30    | Piloto G6.5 obligatorio                             |
| AR-41    | Corte y migración gobernados                        |
| AR-43    | Flujos E2E completos                                |
| AR-50    | Reportes y formatos propios                         |

No se propone modificar ninguno de sus estados principales.

El universo maestro conserva:

| Estado                            | Cantidad |
| --------------------------------- | -------- |
| VALIDADA                          | 6        |
| VALIDACIÓN EXPERIMENTAL PENDIENTE | 17       |
| PENDIENTE                         | 26       |
| BLOQUEANTE                        | 8        |
| **Total**                         | **57**   |

## **19. Registro de riesgos tecnológicos**

| Riesgo                                    | Impacto    | Mitigación candidata                    |
| ----------------------------------------- | ---------- | --------------------------------------- |
| ET04-R01: gateway loopback insuficiente   | Crítico    | EXP-08a y shell alternativo             |
| ET04-R02: renderer accede a autoridad     | Crítico    | Puente mínimo y núcleo separado         |
| ET04-R03: visor conserva mutaciones       | Crítico    | Retirada de rutas incompatibles         |
| ET04-R04: exposición de medios            | Crítico    | Custodio y reproducción revocable       |
| ET04-R05: falso PASS visual               | Crítico    | DTO canónico AR-52                      |
| ET04-R06: segundo escritor                | Crítico    | Autoridad operacional única             |
| ET04-R07: incompatibilidad WebView        | Alto       | Matriz por SO y renderer                |
| ET04-R08: dependencia gráfica externa     | Alto       | Assets locales                          |
| ET04-R09: inaccesibilidad de grids        | Alto       | Semántica, teclado y paginación         |
| ET04-R10: consumo conjunto excesivo       | Alto       | EXP-03 y composición alternativa        |
| ET04-R11: licencia propia contradictoria  | Alto       | Resolución del titular                  |
| ET04-R12: dependencia comprometida        | Alto       | SBOM, advisories y parches              |
| ET04-R13: actualización incompatible      | Alto       | Protocolos versionados y recuperación   |
| ET04-R14: UI dependiente del HOST         | Crítico    | Recorrido completo con cero inferencias |
| ET04-R15: pérdida de revisión por caché   | Alto       | CAS y consulta canónica                 |
| ET04-R16: dependencia comercial posterior | Medio-alto | Componentes libres y reemplazables      |

### **19.1. Objeciones localizadas elevadas al Orquestador**

**OBJ-ET04-01 — Frontera del visor histórico.** El código actual contiene rutas de mutación incompatibles con AR-24. Conservar el servidor histórico sin sustitución de autoridad no es una ruta admisible.

**OBJ-ET04-02 — Autonomía offline.** La plantilla histórica carga recursos externos. Su incorporación directa a la distribución profesional incumpliría las garantías hasta sustituir y verificar esas dependencias.

**OBJ-ET04-03 — Semántica visual.** Los estados legacy no pueden convertirse directamente en la presentación normativa AR-52.

**OBJ-ET04-04 — Heterogeneidad multimedia.** Tauri no debe seleccionarse por tamaño antes de acreditar WebM, seek y protección en cada renderer obligatorio.

**OBJ-ET04-05 — Navegador personal.** La recomendación web local requiere resolver extensiones, perfiles y protección de evidencia privada conforme al modelo de amenaza de ET-06.

Estas objeciones no requieren reducir requisitos ni reabrir la auditoría empresarial. Requieren resolver incompatibilidades tecnológicas concretas.

## **20. Composiciones recomendadas**

### **20.1. Composición principal ET04-P**

## **Aplicación web local autenticada**

Preferencia documental inicial

| Interfaz            | React 19.x + TypeScript              |
| ------------------- | ------------------------------------ |
| Distribución visual | Bundle estático local                |
| Lanzamiento         | Lanzador gráfico supervisado         |
| Renderer            | Navegador compatible y controlado    |
| Transporte          | Gateway loopback autenticado         |
| Núcleo              | Proceso soberano independiente       |
| Persistencia        | Puerto SQLite canónico               |
| Evidencia           | Custodio y visor separados           |
| Tablas              | Paginación; virtualización selectiva |
| Validación          | Contratos JSON Schema compartidos    |

**Justificación:** minimiza inicialmente la incorporación obligatoria de un runtime gráfico adicional, mantiene continuidad con el código TypeScript y permite reutilizar la presentación en otros mecanismos de distribución.

Su condición fundamental es EXP-08a.

### **20.2. Composición de respaldo ET04-R**

## **Electron con renderer aislado**

Respaldo para control de entorno gráfico

| Interfaz     | Mismo frontend React       |
| ------------ | -------------------------- |
| Shell        | Electron estable mantenido |
| Renderer     | Chromium integrado         |
| Puente       | Preload mínimo y tipado    |
| Transporte   | IPC autenticado            |
| Núcleo       | Mismo proceso soberano     |
| Persistencia | Mismo escritor             |
| Evidencia    | Mismo contrato protegido   |

Electron puede convertirse en la composición principal si el navegador local no permite acreditar seguridad, instalación o compatibilidad suficiente.

No implica reconstruir la interfaz ni el dominio.

### **20.3. Composición alternativa ET04-O**

## **Tauri 2 con núcleo independiente**

Alternativa condicionada por optimización y equivalencia

| Interfaz           | Mismo frontend React                         |
| ------------------ | -------------------------------------------- |
| Shell              | Tauri 2.x                                    |
| Renderer           | WebView específico del SO                    |
| Puente             | Capabilities y comandos limitados            |
| Núcleo             | Binario o sidecar supervisado                |
| Condición decisiva | Medios, accesibilidad y recursos calificados |

No se descarta Tauri. Se evita otorgarle preferencia únicamente por una hipótesis de menor tamaño.

### **20.4. Orden documental de preferencia**

# **1**

**Web local autenticada**

Menor acoplamiento inicial

# **2**

**Electron**

Mayor control del renderer

# **3**

**Tauri**

Optimización condicionada a equivalencia

Este orden constituye preferencia documental, no resultado experimental, selección definitiva ni ranking cuantitativo.

## **21. Decisiones documentales y decisiones pendientes**

### **21.1. Puede resolverse documentalmente**

| Decisión                        | Recomendación |
| ------------------------------- | ------------- |
| Separación presentación/dominio | Adoptar       |
| Autoridad única                 | Preservar     |
| Visor separado                  | Preservar     |
| Assets offline                  | Obligatorios  |
| Estado visual independiente     | Adoptar       |
| DTO versionado                  | Adoptar       |
| React como candidato            | Preferente    |
| Vue como respaldo               | Mantener      |
| Web local como candidato        | Preferente    |
| Electron como respaldo          | Mantener      |
| Tauri como optimización         | Mantener      |
| UI sin IA                       | Obligatoria   |
| Acceso directo a DB/vault       | Prohibido     |

### **21.2. Requiere calificación experimental futura**

| Incertidumbre              | Protocolo  |
| -------------------------- | ---------- |
| Frontera loopback          | EXP-08a    |
| Aislamiento IPC            | EXP-08a    |
| Renderers por SO           | EXP-04/08  |
| Accesibilidad real         | EXP-08c/E6 |
| Reproducción WebM          | EXP-06c    |
| Consumo total              | EXP-03     |
| Latencia de tablas         | EXP-03/08c |
| Recuperación de estado     | E2/E3      |
| Revocación                 | E6         |
| Equivalencia UI/MCP/CLI    | E7         |
| Instalación completa       | EXP-04/08c |
| Generalización profesional | E8         |
| Recorrido empresarial      | G6.5       |

### **21.3. Decisiones genuinamente pendientes**

No deben congelarse todavía:

- Versión exacta del framework.
- Renderer por plataforma.
- Transporte definitivo.
- Política de perfiles de navegador.
- Composición de sandbox y supervisor.
- Empaquetador final.
- Biblioteca de tablas y formularios.
- Presupuestos de rendimiento.
- Mecanismo definitivo de actualización.
- Licencia propia MIT/ISC.

La selección debe efectuarse después de disponer de la evidencia correspondiente y conforme a la autorización del propietario.

## **22. Fuentes primarias externas**

Fecha de consulta: **26 de noviembre de 2026**.

| Fuente                                                                                                                                    | Versión o referencia observada     | Aplicación           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------- |
| [Electron Release Schedule](https://releases.electronjs.org/schedule?utm_source=chatgpt.com)                                              | Electron 43–45 estables soportados | Ciclo de vida        |
| [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security?utm_source=chatgpt.com)                                      | Documentación vigente              | Frontera gráfica     |
| [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation?utm_source=chatgpt.com)                    | Documentación vigente              | Aislamiento          |
| [Electron Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox/?utm_source=chatgpt.com)                            | Documentación vigente              | Sandbox              |
| [Electron GitHub](https://github.com/electron/electron?utm_source=chatgpt.com)                                                            | Matriz de plataformas vigente      | Distribución         |
| [Electron Advisories](https://github.com/electron/electron/security/advisories?utm_source=chatgpt.com)                                    | Registros consultados hasta 2026   | Riesgos              |
| [Tauri Releases](https://github.com/tauri-apps/tauri/releases?utm_source=chatgpt.com)                                                     | 2.12.7 observada                   | Versiones            |
| [Tauri Architecture](https://v2.tauri.app/concept/architecture/?utm_source=chatgpt.com)                                                   | v2                                 | Arquitectura         |
| [Tauri Capabilities](https://v2.tauri.app/security/capabilities/?utm_source=chatgpt.com)                                                  | v2                                 | Restricción IPC      |
| [Tauri Sidecar](https://v2.tauri.app/develop/sidecar/?utm_source=chatgpt.com)                                                             | v2                                 | Núcleo independiente |
| [Tauri WebView Versions](https://v2.tauri.app/reference/webview-versions/?utm_source=chatgpt.com)                                         | v2                                 | Compatibilidad       |
| [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/?utm_source=chatgpt.com)                                                   | v2                                 | Dependencias         |
| [Tauri Distribution](https://v2.tauri.app/distribute/?utm_source=chatgpt.com)                                                             | v2                                 | Empaquetado          |
| [Tauri Advisories](https://github.com/tauri-apps/tauri/security/advisories?utm_source=chatgpt.com)                                        | Registros consultados hasta 2026   | Riesgos              |
| [Microsoft WebView2 Distribution](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution?utm_source=chatgpt.com) | Evergreen y Fixed Version          | Distribución Windows |
| [React Versions](https://react.dev/versions?utm_source=chatgpt.com)                                                                       | 19.3                               | Framework            |
| [Vue Releases](https://github.com/vuejs/core/releases?utm_source=chatgpt.com)                                                             | 3.5.46                             | Alternativa          |
| [Svelte Releases](https://github.com/sveltejs/svelte/releases?utm_source=chatgpt.com)                                                     | 5.59.2                             | Alternativa          |
| [TanStack Virtual](https://tanstack.com/virtual/latest?utm_source=chatgpt.com)                                                            | v3                                 | Virtualización       |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)                                                                      | WCAG 2.2                           | Accesibilidad        |
| [WAI-ARIA APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/?utm_source=chatgpt.com)                                                | Documentación vigente              | Tablas interactivas  |
| [WAI Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/?utm_source=chatgpt.com)                            | Documentación vigente              | Teclado y foco       |
| [axe-core](https://github.com/dequelabs/axe-core?utm_source=chatgpt.com)                                                                  | Repositorio oficial                | Instrumentación      |
| [MDN Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy?utm_source=chatgpt.com)        | Documentación vigente              | Seguridad web        |
| [MDN CSRF](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF?utm_source=chatgpt.com)                                     | Documentación vigente              | Seguridad HTTP       |
| [MDN Local Network Access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access?utm_source=chatgpt.com)    | Documentación vigente              | Loopback y red local |
| [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html?utm_source=chatgpt.com)                                                            | Junio de 2022                      | HTTP Range           |
| [Qt Licensing](https://doc.qt.io/qt-6/licensing.html?utm_source=chatgpt.com)                                                              | Qt 6                               | Alternativa nativa   |

Las versiones observadas no constituyen una recomendación de instalar automáticamente `latest`.

## **23. Límites de investigación y reservas de exhaustividad**

Para mantener la integridad del expediente, se declaran las siguientes limitaciones:

| Aspecto                                                       | Estado                    |
| ------------------------------------------------------------- | ------------------------- |
| Lectura íntegra de ambos encargos                             | Realizada                 |
| Contraste de los conjuntos 123/65/57                          | Realizado nominalmente    |
| Inspección del código principal del reporter                  | Realizada                 |
| Verificación de manifests y resoluciones seleccionadas        | Realizada                 |
| Lectura íntegra de todas las fuentes normativas referenciadas | Incompleta                |
| Inventario exhaustivo de todos los imports y pruebas          | Incompleto                |
| SBOM de composiciones candidatas                              | No disponible             |
| Cotejo exhaustivo de rangos afectados por advisories          | Pendiente                 |
| Verificación de binarios instalados                           | No realizada              |
| Benchmarks QAP                                                | No realizados             |
| Certificación de accesibilidad                                | No realizada              |
| Costos monetarios de distribución                             | Indeterminados            |
| Evidencia empresarial                                         | No solicitada ni accedida |

La limitación documental más importante es no haber podido inspeccionar íntegramente todos los expedientes extensos y anexos fijados. Por tanto, no corresponde declarar satisfecho de forma absoluta el mandato de exhaustividad de los encargos.

Los hallazgos sobre el código examinado y las recomendaciones tecnológicas sí poseen fundamento documental suficiente para su consideración preliminar por el Orquestador.

## **24. Dictamen tecnológico independiente ET-04**

| Dominio                                  | Dictamen                                |
| ---------------------------------------- | --------------------------------------- |
| Arquitectura de presentación desacoplada | APTO COMO CANDIDATO                     |
| React y TypeScript                       | APTO COMO CANDIDATO                     |
| Vue como respaldo                        | APTO COMO CANDIDATO                     |
| Aplicación web local                     | CONDICIONADO                            |
| Electron                                 | CONDICIONADO                            |
| Tauri                                    | CONDICIONADO                            |
| Qt                                       | CONDICIONADO, reserva secundaria        |
| Visor histórico sin reconstrucción       | SIN RUTA DOCUMENTAL SUFICIENTE          |
| Frontera efectiva                        | CONDICIONADO A EXP-08a                  |
| Multimedia multiplataforma               | CONDICIONADO A EXP-06c                  |
| Accesibilidad propia                     | CONDICIONADO A CALIFICACIÓN             |
| Rendimiento y recursos                   | SIN RUTA PROBATORIA SUFICIENTE ACTUAL   |
| Operación profesional integral           | FACTIBLE DOCUMENTALMENTE, NO ACREDITADA |

**DICTAMEN GENERAL: APTO COMO CONJUNTO DE CANDIDATOS TECNOLÓGICOS, CON RESERVAS DOCUMENTALES Y CONDICIONES EXPERIMENTALES.**

Recomiendo al Orquestador considerar React/TypeScript y una arquitectura de presentación independiente del shell como fundamento candidato. La aplicación web local autenticada constituye mi primera preferencia; Electron, el respaldo principal; Tauri, una alternativa que puede superar a ambas si acredita sus ventajas en la composición completa.

La decisión con menor riesgo de reconstrucción futura no es apostar irrevocablemente por uno de estos shells. Es mantener el frontend, el transporte y el núcleo desacoplados de manera que la sustitución del mecanismo de distribución no obligue a reconstruir la experiencia profesional, la autoridad, la persistencia ni los contratos normativos.

**No se recomienda cerrar definitivamente ET-04 hasta resolver la reserva de exhaustividad documental y reconciliar las interfaces con ET-01, ET-02, ET-03, ET-05, ET-06 y ET-07.**

## **25. Declaración de cumplimiento de límites**

Durante esta investigación:

- No se modificó GitHub.
- No se modificó código, configuración ni dependencias.
- No se instalaron tecnologías.
- No se compilaron componentes.
- No se ejecutaron pruebas ni experimentos.
- No se accedió a sistemas empresariales.
- No se inició G0/G1.
- No se elaboró una WBS.
- No se seleccionó irreversiblemente ninguna tecnología.
- No se modificaron requisitos, decisiones empresariales ni estados maestros.

**Entrega:** informe ET-04 al Orquestador Principal para integración documental, revisión de reservas y reconciliación tecnológica entre especialidades.

**Fin del informe. Investigación detenida.**
