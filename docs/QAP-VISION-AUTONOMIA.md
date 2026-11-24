> **Vigencia documental.** La visión de autonomía se conserva. La definición histórica de salida del MVP queda subordinada al alcance de lanzamiento de D01–D21. [Entrada para Gemini Neon](qap-architecture/revision-neon.md).

# Visión de producto QAP — QA autónomo

> **Autoría:** la visión, los principios de producto y la arquitectura objetivo de QAP pertenecen a su creador. Codex, Antigravity y otros agentes son herramientas de implementación, revisión y operación, no los autores de esta visión.
>
> **Inspiración de producto:** TestSprite. La aspiración es conseguir una experiencia de QA autónomo comparable y mejorar su extensibilidad, costo operativo y reutilización de conocimiento. QAP no pretende copiar código, arquitectura interna ni propiedad intelectual de TestSprite.
>
> **Estado de este documento:** dirección de producto y contrato objetivo, **no una declaración de funcionalidades ya implementadas**. La versión de `develop` anterior a esta decisión todavía contiene compuertas humanas en el ciclo B/C.

## Propósito

Un usuario puede comenzar con **«Quiero probar un sistema»**. QAP guía solo sobre los datos imprescindibles, adquiere conocimiento observable de una aplicación, prioriza escenarios, diseña casos, prepara datos de prueba, ejecuta flujos con un runner determinista, analiza resultados, reintenta o recupera dentro de límites y publica evidencia. El usuario no tiene que dirigir cada módulo, escribir pruebas ni aprobar cada decisión del agente.

El producto debe ser agnóstico a sistema, instancia, tenant, sector, modelo e IDE/cliente MCP. Debe soportar sistemas empresariales configurables como Lendus sin codificar su lógica particular. Una misma funcionalidad puede comportarse de modo diferente por configuración efectiva, rol, permiso, versión, tenant y variante visual.

## Principios innegociables

1. **Autonomía por defecto:** las acciones ordinarias de Discovery, propuesta de escenarios, selección de aserciones sustentadas, materialización, planificación, ejecución, reintentos acotados, diagnóstico y reportes no requieren revisión humana por caso.
2. **Interacción mínima:** la única aprobación inicial obligatoria del flujo de QAP es escoger y autorizar el workspace. Datos indispensables de acceso o política del entorno pueden requerir configuración, pero no deben transformarse en confirmaciones repetitivas. Las credenciales se capturan por un mecanismo seguro del host, nunca en el chat, reportes o prompts.
3. **Autonomía no equivale a acceso ilimitado:** el host configura por adelantado destinos, operaciones y presupuestos permitidos. Una URL, una observación, un prompt o una etiqueta «staging» no amplía esos permisos. Destinos desconocidos, producción y mutaciones sin política expresa permanecen bloqueados; el resto del trabajo continúa.
4. **IA para comprender, no para ejecutar cada paso:** el modelo del cliente interpreta evidencias, formula hipótesis y ayuda a diagnosticar. El runner de QAP ejecuta un snapshot versionado con Playwright, pasos tipados y localizadores verificables, sin invocar un modelo por clic.
5. **No inventar verdad de negocio:** distinguir `observado`, `inferido`, `acreditado por fuente`, `indeterminado` y `evaluado`. Una propiedad visible puede ser un oráculo estructural basado en evidencia; cálculos, permisos o reglas de negocio requieren una fuente suficiente. Si falta, excluir esa aserción con su motivo y seguir con otros casos; no generar aprobaciones ficticias.
6. **Una sola ruta canónica:** QAP no debe escapar a scripts de Playwright escritos por el agente cuando hay un bloqueo. CLI, MCP, planificador y runner comparten elegibilidad, alcance y trazabilidad; todo PASS oficial debe enlazar caso, revisión, intento, aserciones, evidencia y reporte.
7. **Repetibilidad y recuperación:** campañas y fronteras de Discovery persisten, los casos conservan versión y huella, las ejecuciones conservan intentos distintos y la publicación puede reanudarse sin repetir operaciones de negocio.
8. **Uso de suscripciones existentes:** aprovechar la inteligencia disponible en el cliente conectado (Antigravity, Codex, etc.) por sus interfaces legítimas y sus cuotas, sin exigir de entrada un segundo consumo de API de modelos. Esto no presupone llamadas API gratuitas ni cuotas ilimitadas.

## Ciclo de producto objetivo

### A. Conocer

Tras recibir workspace y destino autorizado, observar autenticación, navegación, vistas, enlaces, controles, formularios, estados, roles y configuraciones accesibles. Separar rutas candidatas de vistas realmente inspeccionadas, mantener una frontera reanudable y cobertura `READY` / `PARTIAL_READY` / `BLOCKED`. Continuar automáticamente por lotes mientras queden rutas navegables dentro de la política y el presupuesto. No pedir al usuario que seleccione un módulo para compensar un descubrimiento incompleto. Cuando se agote la frontera permitida, trabajar con el subconjunto acreditado y reportar las brechas.

### B. Diseñar y materializar

El agente usa evidencia y prioridades para producir escenarios de alto valor: accesibilidad básica de vista, estados, filtros, búsqueda, paginación, navegación, formularios, permisos, validaciones, casos negativos, límites y flujos end-to-end según lo realmente descubierto. QAP valida la procedencia del oráculo y la aserción, materializa casos reutilizables y arma un plan ejecutable. La falta de una regla específica de negocio no debe detener toda la campaña: el caso queda indeterminado y se ejecutan los demás.

### C. Ejecutar, diagnosticar y reportar

Un runner oficial ejecuta los casos elegibles mediante sesiones autorizadas y políticas del entorno; usa datos sintéticos y límites explícitos para acciones que modifican estado. Captura capturas, trazas, video cuando corresponda, logs sanitizados, aserciones, intentos y reportes. Distingue `PASS`, `FAIL`, error técnico, `INDETERMINATE` y `SKIPPED_BY_POLICY`. Diagnóstico y reparación acotada de localizadores siempre crean una nueva revisión; nunca cambian silenciosamente el caso ni convierten un fallo en PASS. QAP continúa hacia el siguiente trabajo permitido sin detenerse por decisiones técnicas triviales.

## Definición de terminado — MVP autónomo inmediato

El MVP **no exige paridad completa con TestSprite**; sí debe demostrar, de extremo a extremo, lo siguiente:

- Un usuario inicia con «Quiero probar un sistema». QAP obtiene/solicita la selección autorizada del workspace, destino permitido y acceso seguro si corresponde; no pregunta de entrada por módulos, tipos de prueba u oráculos triviales.
- Discovery real o sintético usa el MCP actualizado, explora y reanuda automáticamente la frontera permitida, presenta contadores verificados y conserva aislamiento por entorno, tenant y perfil.
- A partir de una vista inspeccionada, la IA propone **al menos un caso con expectativa comprobable desde evidencia**, y QAP lo materializa y planifica **sin `elicitation/create`, `decide_oracles` humano ni `approve_batch` humano** en la ruta ordinaria. Los oráculos sin fuente se excluyen y reportan, no se fabrican.
- El runner oficial ejecuta el caso y lo repite (headless/headed cuando proceda) reutilizando el mismo snapshot, con intentos y evidencias verificables. No hay scripts externos ni instalación improvisada de Playwright Test por el agente.
- Una operación prohibida se bloquea por política antes de ejecutarse; la campaña sigue con trabajo independiente. Para pruebas de mutación, el MVP solo podrá ejecutarlas en fixtures aislados o entornos expresamente autorizados, con datos sintéticos y limpieza. **No se habilitan mutaciones sobre Lendus por defecto.**
- La cancelación automática de formularios MCP en Antigravity no bloquea los pasos ordinarios. Las compuertas de integridad del plan, caso y runner se mantienen o sustituyen por una elegibilidad automática demostrable, nunca por aprobación ficticia.
- Reanudación tras reinicio de MCP, salida de campaña con cobertura y resultados parciales, artefactos sanitizados y prueba negativa de que un `PASS` no puede provenir de ejecución externa.
- Se ejecuta el mismo escenario por conexión Stdio de control y Antigravity, con registros que acrediten herramienta, versión del bundle y resultados. Se documentan fallos heredados por separado.

**Cierre del MVP:** no termina con un `pnpm build` o un smoke aislado; termina con una demostración autónoma A→B→C en una aplicación sintética, seguida de aceptación observacional controlada sobre un staging autorizado, sin afirmar cobertura total.

## Evolución después del MVP — no bloquear el cierre actual

**P1 (profundidad funcional):** oráculos de negocio a partir de fuentes confiables, configuración efectiva (por ejemplo, `es_contable`), mapas de dependencias, RBAC multi-perfil, variaciones de UI, datasets sintéticos, operaciones con escritura permitidas por política y limpieza/reversión segura; pruebas de búsqueda/filtros/paginación y flujos con varios pasos.

**P2 (escala y autoevolución):** suites de regresión por riesgo y cambios, planificación entre módulos, generación/reparación controlada de adaptadores, diagnóstico de drift, ejecución masiva económica, comparación entre instancias, historial de defectos, selección inteligente de reejecuciones y recuperación robusta.

**P3 (producto):** experiencia multiplataforma/cliente, extensibilidad de plugins, comparativas de campañas, paneles y colaboración, controles empresariales.

La deuda técnica global anterior se mantiene visible; no convertir P1/P2 ni limpieza total de esa deuda en condición para declarar MVP.

## Indicadores de aceptación

- Intervenciones humanas por flujo ordinario A→B→C: **0**, una vez autorizado el workspace y configurado el acceso necesario.
- Llamadas a `elicitation/create` en ruta ordinaria: **0**.
- Ejecución oficial sin aprobación de caso humana, pero **nunca** sin alcance/política/autenticación válidos.
- Casos ejecutados sin modelo por paso: **100%**.
- Resultados PASS con ID de caso, revisión, intento y evidencia: **100%**.
- Rutas: separar detectadas, inspeccionadas, reanudables, bloqueadas y fuera de alcance; no presentar un conteo de enlaces como cobertura comprobada.
- Recuperación tras interrupción: sin pérdida de checkpoint ni reejecución silenciosa de mutaciones.
- Coste de modelo: medible por cliente y campaña; preferir reutilización de conocimiento y ejecución determinista frente a reanalizar cada paso.

## Decisión sobre documentación previa

`docs/qap-knowledge-lifecycle.md` describe en parte el **contrato implementado del P0 anterior**, incluidos recibos y aprobaciones humanas. Ese comportamiento **no es la visión de producto vigente**. Durante la implementación del MVP autónomo, Codex debe actualizar los contratos técnicos y las pruebas existentes para reflejar los permisos automáticos basados en política. La migración debe preservar trazabilidad histórica y las garantías de integridad; no basta con borrar comprobaciones.
