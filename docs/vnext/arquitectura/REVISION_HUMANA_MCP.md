# Revisión humana de reglas y casos en QAP

En la composición estándar de Windows, QAP presenta sus propios diálogos de escritorio para `decide_oracles`, `approve_batch` y la resolución de reglas. El operador puede confirmar, rechazar, aplazar o cancelar. Windows devuelve la decisión al proceso MCP por un canal local privado. El agente solo propone el contenido mediante la herramienta.

El texto de revisión muestra la propuesta, la pregunta, el ámbito, la aserción y la huella del contenido. La revisión del lote presenta las expectativas y los pasos de los casos. Si el contexto del caso cambia mientras se revisa, se solicita una revisión nueva. La confirmación de la regla habilita la revisión de casos. La aprobación del caso requiere otra confirmación y la autorización de ejecución tiene su propia compuerta.

El operador del servidor puede priorizar el formulario MCP con la variable existente `QAP_USE_CLIENT_ELICITATION=1`. El servidor asocia la petición `elicitation/create` a la invocación que requiere revisión. En Windows puede utilizar el diálogo local si el cliente carece de capacidad de formulario. Cerrar o cancelar un diálogo bloquea esa invocación.

| Resultado | Respuesta de `qap_plan` |
| --- | --- |
| Formulario y canal local ausentes | `human_review_gateway_required` |
| Error de transporte o diálogo no disponible | `human_review_unavailable` |
| Formulario enviado sin una decisión válida | `human_review_not_authorized` |
| Diálogo cancelado o llamada interrumpida | `human_review_cancelled` |
| Aplazamiento explícito | `human_review_deferred` |
| Rechazo explícito | `human_review_rejected` |
| Confirmación explícita | `updated` para la regla, `approved` para el caso |

El diagnóstico privado `~/.qap/diagnostics/<pid>-<id>/authorization.jsonl` correlaciona los eventos `human_review_request` y `human_review_result` con `review_id` y `review_request_digest`. Conserva la capacidad de formulario, el canal, la acción MCP o el resultado del diálogo, el código numérico de protocolo si existe y la duración. Los textos de propuesta, las rutas del proyecto y las respuestas completas quedan fuera de estos eventos. Los resultados aprobados conservan su recibo canónico con ID de aprobación, huella de solicitud, huella de contenido, revisor, mecanismo y hora.

## Verificación en un fixture aislado

```powershell
pnpm --filter '@qap/mcp...' build
pnpm --filter @qap/mcp test p0-3a-rule-authority-review -t 'classifies MCP rule review|keeps the preferred Windows review'
```

Para la prueba interactiva en un escritorio Windows, el operador pulsa **Cancelar**, **Confirmar** para la regla y **Confirmar** para el caso. El fixture usa almacenamiento temporal, sin navegación ni credenciales.

```powershell
$env:QAP_MANUAL_RULE_REVIEW='1'
pnpm --filter @qap/mcp test p0-3a-rule-authority-review -t 'accepts the physical Windows'
Remove-Item Env:QAP_MANUAL_RULE_REVIEW
```

En Antigravity, usa un workspace sintético autorizado y comprueba que el proceso Stdio nuevo anuncia la revisión del bundle que quieres validar. Propón un caso pendiente con `qap_plan` y llama a `decide_oracles` con el texto y selector del fixture. Cancela primero y verifica que el caso sigue pendiente. Confirma en una segunda llamada y revisa el recibo de regla. Ejecuta `approve_batch` para el caso y confírmalo por separado. Reúne las respuestas de QAP y los diagnósticos correlacionados, sin llamar a `qap_test`.
