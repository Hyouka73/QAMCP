# VNEXT-009 — Motor determinista de inferencias

Estado: implementada y verificada con limitaciones explícitas. Autorización exclusiva del
2026-10-30; agente principal único. Base `8a0a2f5f6ac3f19e3f8a5066d6d18fc5532c3817`,
rama `feat/qap-vnext-architecture`. VNEXT-010 no iniciada.

## 1. Arquitectura

`KnowledgeInferenceEngine` vive en `@qap/knowledge`, exportado por su índice público.
Depende únicamente de `IKnowledgeStore` v1, tipos Shared y crypto builtin para identidad.
No navegador, HTTP, LLM, credenciales, handlers MCP, CLI ni nuevas tablas/dependencias.
La secuencia es: contexto → consulta paginada → procedencia y referencias históricas →
selección estructural → reglas → agrupación → puntaje → comparación histórica → CAS
atómico. Ninguna observación se acepta directamente desde un resultado de adquisición.
`calculateInferenceConfidence` es una función pura pública y comprobable por separado.

## 2. API pública

```ts
import { KnowledgeInferenceEngine } from '@qap/knowledge';
const result = await new KnowledgeInferenceEngine(store).run({
  application_id: 'application', environment_id: 'test',
  // Opcional: IDs UUID de observaciones ya persistidas, nunca payloads.
  observation_ids: observationIds,
  limits: { observations: 500, candidates: 24, timeout_ms: 5000 },
});
```

`InferenceEngineInput`, `InferenceEngineResult`, `InferenceDecision`, `InferenceFactors`
son exportados. Resultado `completed`, `abstained` o `rejected`; contiene conteos,
decisiones sanitizadas e hipótesis canónicas con factores, revisión y cambio
`created | recalculated | unchanged`, número de soportes añadidos/eliminados.
Las hipótesis solo se devuelven como persistidas tras éxito del commit; un rechazo limpia
la lista. No hay retries ciegos. El llamador decide si repite una ejecución rechazada.
Una lista de selección vacía equivale a evidencia vacía, no a consultar toda la aplicación.

## 3. Fuentes y frontera de persistencia

- Recon VNEXT-006: `network_traffic`, source `http_reconnaissance`, actor recon,
  evidencia `http_recon_metadata`, metadata.source `bounded_http_get` y resource.
  HTTP 503 usa el estado real **unavailable**, no exists. Stack y TLS no originan
  confirmaciones ni reglas esperadas. Sin identidad estable se evita correlación remota.
- Crawler VNEXT-007: `navigation_route` y `dom_element`, source `blackbox_crawler`,
  actor crawler, evidencia `dom_snippet` con `static_dom_structure` y `metadata.view`.
  **Los links están en la evidencia**; raw_payload DOM no los contiene. Las rutas
  candidate/blocked del resultado global no se persisten como catálogo autónomo.
  `authorized=false` expresa bloqueo de adquisición, nunca rechazo remoto.
- Observer VNEXT-008: `network_traffic`, source `network_traffic_observer`, actor crawler,
  evidencia `http_recon_metadata`, metadata.source `browser_network_gateway`, event y
  endpoint. Consume eventos efectivamente recuperables, no lotes failed/not_attempted.
  Los patrones estructurales pueden existir en endpoint, pero no son identidad suficiente:
  diferentes endpoints concretos pueden compartir un patrón. Esta versión no los usa para
  inventar módulos, rutas o correspondencias entre ejecuciones.

Se verifica app, entorno, actor, source, tipo de evidencia, sesión UUID, IDs UUID,
revision de observación 1 (hecho append-only), evidencia histórica recuperable y coincidencia
con la embebida. Los pins de app y entorno deben coincidir con el contexto actual; se
recuperan las revisiones de observación y entorno utilizadas. Evidencia y observación
mantienen la misma procedencia. Contextos role/auth_profile son rechazados conservadoramente:
los productores autorizados de esta entrega son anónimos. Los metadatos siguen siendo datos,
no instrucciones; procedencia consistente no es una firma criptográfica del productor.

## 4. Catálogo cerrado y extensible

| Regla | Categoría | Evidencia mínima y conclusión limitada |
|---|---|---|
| link | view_topology | Enlace en snapshot; distingue destino capturado, no capturado o fuera de autorización. Nunca acredita recorrido. |
| control | interactive_target | Control estructural con índice, tag de catálogo y atributos booleanos. Papel potencial, sin requisito de negocio. |
| link-chain | flow_hypothesis | Dos links compatibles sobre tres vistas capturadas distintas, profundidad 2; secuencia potencial sin pasos ejecutados. |
| local-cluster | module_boundary | Dos vistas con links recíprocos y formularios en ambas; cluster funcional potencial, límites/propiedad no confirmados. |
| script-dependent | risk_assessment | Snapshot `loading_or_script_dependent`; comportamiento dinámico pendiente. |
| remote-503 / recon-503 | risk_assessment | HTTP 503 real, causa desconocida; nunca defecto automático. |
| gateway-block | risk_assessment | outcome blocked sin HTTP; sin rechazo atribuible al servidor. |
| partial-network | risk_assessment | Ventana pasiva de una vista; inventario parcial, sin conclusiones de inexistencia. |

No se crea `rule_hypothesis`: falta autoridad para reglas de negocio específicas.
No se crean ExpectedRequirement, módulos/vistas confirmadas ni evaluaciones de conformidad.
No se refuta por ausencia. Las reglas futuras deben añadir plantillas cerradas, pruebas y
una nueva política de identidad si cambia su significado.

## 5. Modelo de certeza

Política `heuristic-v1`; representa **fuerza heurística**, no probabilidad calibrada.
Para N unidades relevantes (0..8), I fuentes independientes demostradas (0..3), C
contradicciones relevantes (0..8), Q calidad de evento (0..1):

```
A = min(0.12, max(0, N - 1) * 0.03)
R = min(0.12, max(0, I - 1) * 0.06)
score = N == 0 ? 0 : round3(clamp(0.35 + 0.10 + A + R + 0.10*Q - 0.20*C, 0, 0.72))
```

0.35 base conservadora; 0.10 por procedencia validada; A corroboración estructural
limitada; R reproducibilidad independiente; Q=1 para respuesta remota 503, Q=0.7 para
enlace/control, Q=0.5 para cobertura/bloqueo/script/flujo/cluster. El techo 0.72 expresa
cobertura parcial; los valores son decisiones explícitas iniciales, sin dataset etiquetado.
Bandas: low <0.40; moderate [0.40,0.65); strong >=0.65. Incluso strong es hipótesis.
La función pura acepta contradicciones y reduce el puntaje; el motor se abstiene de
controles contradictorios antes de persistir. No afirma que duplicados sean corroboración.
El desglose incluye N/I/A/R/procedencia/cobertura/Q/C/age_policy/techo/score/banda.
Se conserva en resultado y JSON cerrado de reasoning/trace.reason, sin texto de la app.

## 6. Corroboración, repetición y contexto temporal

Una evidencia adicional de vista destino capturada aumenta fuerza de una hipótesis link:
0.52 con origen solo → 0.55 con origen y destino; no acredita navegación.
Controles: 0.52; cluster recíproco con formularios: 0.53; cadena de tres vistas: 0.56;
503: 0.55; bloqueo/ventana parcial: inicialmente 0.50.
Unidades DOM por sesión/vista; eventos por sesión/endpoint/método/outcome/status.
Solicitudes idénticas de la misma ventana comparten unidad aunque tengan UUID distinto.
Referencias reales adicionales quedan trazadas sin inflar el puntaje.

El motor usa **I=1**: dos registros de una ventana, métodos Fetch/XHR o dos páginas de un
crawler no prueban experimentos independientes. La función pública prueba incremento
cuando un futuro consumidor pueda justificar independencia, pero esta entrega **no afirma
reproducibilidad entre ejecuciones**. HMAC de ruta/endpoints, view_id y sesión se mantienen
acotados a la ejecución; no hay adivinación por URL, texto ni patrón estructural.
Antigüedad: `no_decay`, sin reducción automática por tiempo. Fechas inválidas se rechazan,
revisiones de contexto distintas no se mezclan. Se elige conservadoramente no combinar
ni siquiera ejecuciones con URLs aparentemente similares sin identificador seguro estable.

## 7. Contradicciones y abstenciones

En la misma sesión/vista/índice/tag, discrepancias de required_in_dom o disabled entre
capturas consistentes provocan abstención para ese control, decisión contradictory_evidence.
No se interpreta cambio entre ejecuciones como contradicción: la identidad no es comparable.
No se escribe refuted automáticamente. Las inferencias históricas ya existentes no se
borran ni se actualizan a ciegas al omitir un candidato contradictorio: requieren revisión.

Decisiones tipadas: insufficient_evidence, contradictory_evidence,
uncorrelatable_identity, invalid_reference, incompatible_context, source_not_persisted,
insufficient_coverage, processing_limit, unsupported_source, invalid_cursor, conflict,
store_unavailable. Son conteos sin valores procedentes de la app. La abstención sobre reglas
de negocio se registra como insufficient_evidence incluso si otras categorías se generaron.
Inconclusos no sustentan disponibilidad, defectos o inexistencia. Sí justifican únicamente
advertir que la adquisición pasiva fue parcial. Un 200 no acredita servicio correcto.

## 8. Separación epistemológica

Observed describe capturas/eventos; inferred describe todas las salidas del motor;
expected_requirement requiere autoridad ajena a estas señales; conformity_assessment
requiere una comparación formal que aquí no se ejecuta. Cada AgentInference incluye
confidence y confidence_score idénticos, status inferred y requires_human_confirmation=true.
No se introduce confirmed ni se cambia un requisito por ver un atributo required.

## 9. Persistencia, revisiones y concurrencia

Identidad SHA-256 de versión de política, app, entorno, regla y clave estructural
**incluyendo sesión**. No usa hash de ruta efímero como identidad global. Misma consulta
con igual soporte, puntaje y plantilla no escribe otra revisión. Nueva evidencia comparable
amplía soporte, modifica puntaje/plantilla si corresponde y añade revisión usando CAS.
Reasoning registra soportes añadidos/eliminados (estos últimos 0: no se quita soporte por
una selección parcial). No se reemplaza un conjunto mayor por otro incompleto.
Inferencias revisadas por humano, refutadas o de otra procedencia no se sobrescriben.

Un commit de hasta 32 inferencias, atómico, bajo el máximo v1 de 100 writes. No relaciones
adicionales necesarias: supporting_observation_ids se resuelve por el planner y se guarda
con revisiones 1 inmutables; trace.evidence_refs lleva los pins históricos explícitos.
Una evidencia que evoluciona conserva su revisión previa en las inferencias existentes.
Los conflictos CAS rechazan el lote completo sin sobreescribir al otro escritor.
Cursores invalidados abortan sin persistir páginas mezcladas. Contexto se relee antes de
commit; cambios detectados provocan rechazo. **Limitación v1 heredada:** no hay CAS sobre
lecturas de contexto ni snapshot multi-llamada; existe una ventana entre relectura y commit.
No se promete eliminarla ni se amplía el puerto por conveniencia. El host debe serializar
cambios de política si exige garantía transaccional de contexto durante esa ventana.

## 10. Privacidad y límites

No se copian URLs, HTML, etiquetas, selectores, valores, headers, cuerpos, patrones,
razones libres ni errores del driver a salidas. Solo enums, contadores, plantillas, hashes
de identidad y UUID de soporte. App/entorno deben ser IDs de control 1..128 caracteres
alfanuméricos, guion o underscore; IDs de adquisición deben ser UUID. Se rechazan orígenes
ambiguos, datos de perfiles autenticados y registros fuera de presupuesto estructural.

Defaults/máximos: 500/1000 observaciones; páginas <=100; 24/32 candidatos antes de agrupar;
16 soportes por inferencia (deduplicados; exceso reportado); correlación de links profundidad
2; un lote <=32; cálculo 5/30 segundos. Registros hasta 8192 nodos, profundidad 12,
512 propiedades por objeto/array y strings <=16384; arrays interpretados <=256 elementos.
El presupuesto se comprueba entre operaciones y dentro de loops de links/controles.
Un registro excesivo se omite y no bloquea otros registros. Los límites se aplican después
de materialización del registro: v1 no permite limitar bytes de cada fila en el driver,
cancelar una llamada de store ni interrumpir JSON parse/SQLite síncrono. No hay cota dura
OS de memoria o tiempo de una llamada ajena. Timeout rechaza; no bucle de retries.

El motor **no borra secretos previamente persistidos por otra ingesta**. Los canarios
hostiles se usan para verificar que no se propaguen a inferencias/resultados/errores/logs.
Para comprobar DB/WAL/SHM de salida sin confundirlos con secretos ya presentes en la entrada,
la prueba lee los originales hostiles y envía los writes reales del motor sin alterarlos
a SQLite físico con dependencias sintéticas previamente redactadas. Esto es un arnés de
prueba, no una segunda base en la arquitectura del producto. Se comprueban bytes de los
tres archivos existentes y registros persistidos; no se redaccionan writes de inferencia
para hacer pasar la prueba.

## 11. Pruebas empíricas

Windows, Node 24.15.0, SQLite builtin con FTS5. Fixtures de crawler/observer tipados con
ObservedView/ObservedControl/ObservedNetworkEvent públicos del adapter construido.
20 pruebas nuevas: fórmula y bandas; cinco categorías; soporte real; reapertura; historial;
aislamiento; deduplicación; CAS; nueva evidencia; eventos repetidos; contradicción DOM;
parcialidad/scripts; Fetch 200/XHR 503/bloqueo/inconcluso/patrón seguro; recon unavailable;
fuente no persistida; procedencia; referencia rota; cursor inválido; límites; trigger rollback;
dos conexiones concurrentes; cambio contextual; canarios; pins históricos y selección parcial.
No requiere iniciar Chrome para ejecutar el archivo del motor. La regresión adapter sí
usa sus fixtures de navegador existentes; no se añaden adquisiciones al motor.

Resultados finales y límites de regresión se registran abajo al cerrar la entrega.

## 12. Reproducción

Desde la raíz del repo, con dependencias ya instaladas:

```powershell
New-Item -ItemType Directory -Force node_modules/.tmp-vnext | Out-Null
$env:TEMP = (Resolve-Path node_modules/.tmp-vnext).Path
$env:TMP = $env:TEMP
node packages/knowledge/node_modules/vitest/vitest.mjs run test/inference-engine.test.ts --root packages/knowledge
node packages/knowledge/node_modules/vitest/vitest.mjs run --root packages/knowledge --no-file-parallelism
node packages/shared/node_modules/vitest/vitest.mjs run --root packages/shared --no-file-parallelism
node packages/engine/node_modules/vitest/vitest.mjs run --root packages/engine --no-file-parallelism
node packages/playwright-adapter/node_modules/vitest/vitest.mjs run --root packages/playwright-adapter --no-file-parallelism
node node_modules/typescript/bin/tsc -p packages/knowledge/test/tsconfig.json --noEmit
node node_modules/eslint/bin/eslint.js packages/knowledge/src/inference/knowledge-inference-engine.ts packages/knowledge/test/inference-engine.test.ts packages/knowledge/src/index.ts
```

Build de paquete: desde packages/knowledge ejecutar
`node ../../node_modules/tsup/dist/cli-default.js src/index.ts --format esm --dts`.
El wrapper pnpm 12.3.4 intentó verificación de supply-chain contra registry y falló por DNS
bajo sandbox; se ejecutaron directamente los binarios locales instalados, sin instalar
ni actualizar dependencias. Integraciones HTTP de Knowledge requieren loopback permitido;
en sandbox estricto tres tests HTTP fallaron. TEMP/TMP al workspace evita EPERM de rename
Vite en el temporal aislado. Los logs vnext009-*.log están ignorados y excluidos del commit.

## 13. Limitaciones

Cobertura parcial y snapshots anónimos únicamente. No topología exhaustiva, navegación
verificada, reglas de negocio, defectos autónomos, refutación automática ni promoción.
Los clusters son hipótesis locales muy conservadoras; formularios recíprocos no prueban
módulos reales. Sin correlación/reproducibilidad entre ejecuciones. I=1 en esta versión.
Contradicción explícita inicial limitada a atributos comparables de controles; variación
HTTP no es automáticamente contradicción ni refutación. No borra inferencias históricas
cuando falta evidencia o cambia una captura. Selección limitada no reduce soporte.
Ventana contextual, llamadas síncronas y materialización de filas heredadas del puerto.
No certificación POSIX/otros runtimes ni suite global completa. No se cambian aserciones
legacy ni se ocultan diagnósticos de tests ajenos al alcance.

## 14. Continuidad

La API queda disponible para consumidores futuros autorizados; VNEXT-010 permanece
pendiente de autorización. No se implementan sondas, QA Advisor, nuevas tools MCP, CLI,
npx/npm, PostgreSQL ni integración con develop/main. Detener tras publicar esta tarea.

## Cierre de verificación

Implementación y pruebas: commit `8766632`; documentación/cierre en el commit siguiente de esta rama. Entrega reproducible: `git log --oneline 8a0a2f5..HEAD`.

- Nuevas del motor: **20/20**, ejecución final tras normalizar soporte duplicado.
- Shared: **146/146**; Engine: **168/168**; Knowledge completo: **258/258**;
  Playwright Adapter completo secuencial: **139/139**. Total focalizado: **711/711**.
  Las nuevas están incluidas en Knowledge, no se suman de nuevo.
- Diez builds aprobados (Shared, Engine, Auth, Git Adapter, Knowledge, Playwright Adapter,
  Playwright Runner, Reporter, MCP y CLI) usando tsup local.
- `tsc -p packages/knowledge/test/tsconfig.json --noEmit` y ESLint de los tres archivos
  TypeScript afectados: limpios. Typecheck amplio de Knowledge/src reportó cuatro
  diagnósticos en tests legacy sin cambios: document-detector TS2352 líneas48/49,
  TS18048 línea308; file-storage TS2353 por waived_at línea323.
- Knowledge inicial sandbox: 255 pasan/3 fallan por integración HTTP loopback; repetición
  fuera del sandbox: 258/258. Adapter final fuera del sandbox: 139/139. No se alteraron
  tests legacy. No se ejecutó ni se declara aprobada la suite global del monorepo.
- Logs locales ignorados: vnext009-inference-final.log, vnext009-knowledge-final.log,
  vnext009-shared.log, vnext009-engine.log, vnext009-adapter.log, vnext009-builds.log,
  vnext009-types.log y vnext009-lint.log. Bases de prueba eliminadas por teardown.
- Archivo protegido conservado: hash Git de contenido
  `28e1b8dbec7ccf194440cc4158ec6072c9b9ade4`. Ningún cambio de dependencia/lockfile.
