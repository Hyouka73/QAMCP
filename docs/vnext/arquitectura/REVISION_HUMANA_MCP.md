# Revisión humana de reglas y casos en QAP

El servidor Stdio pide al cliente MCP que muestre su formulario nativo del IDE mediante `elicitation/create`. La solicitud se asocia a la llamada de `qap_plan` que la originó. El operador puede confirmar, rechazar, aplazar o cancelar desde el IDE. QAP bloquea la invocación si el cliente carece de formularios o si la solicitud falla.

La revisión muestra la propuesta, la pregunta, el ámbito, la aserción y la huella del contenido. El formulario del lote presenta las expectativas y los pasos de los casos. Si cambia el contexto del caso mientras se revisa, se solicita una revisión nueva. Confirmar la regla habilita la revisión del caso. Aprobar el caso requiere una segunda confirmación. La autorización de ejecución tiene su propia compuerta.

| Resultado | Respuesta de `qap_plan` |
| --- | --- |
| Cliente sin capacidad de formularios | `human_review_gateway_required` |
| Error al solicitar el formulario | `human_review_unavailable` |
| Formulario enviado sin una decisión válida | `human_review_not_authorized` |
| Formulario cancelado o llamada interrumpida | `human_review_cancelled` |
| Aplazamiento explícito | `human_review_deferred` |
| Rechazo explícito | `human_review_rejected` |
| Confirmación explícita | `updated` para la regla, `approved` para el caso |

El diagnóstico privado `~/.qap/diagnostics/<pid>-<id>/authorization.jsonl` correlaciona `human_review_request` y `human_review_result` mediante `review_id` y `review_request_digest`. Registra la capacidad de formulario, el canal, la acción reportada por el cliente, el código numérico de protocolo si existe y la duración. Los textos de propuesta, las rutas del proyecto y las respuestas completas quedan fuera de estos eventos. Los recibos conservan el ID de aprobación, la huella de solicitud, la huella del contenido, el revisor, el mecanismo y la hora.

## Verificación

```powershell
pnpm --filter '@qap/mcp...' build
pnpm --filter @qap/mcp test p0-3a-rule-authority-review -t 'classifies MCP rule review'
```

La prueba automatizada verifica el intercambio MCP, incluida la cancelación y la aprobación separada del caso. Para acreditar la interfaz de Antigravity, usa un workspace sintético autorizado, confirma el SHA del proceso Stdio y verifica que el cliente anuncie `elicitation.form`. La revisión se acredita cuando el formulario aparece en el IDE, la cancelación mantiene el caso pendiente y las dos confirmaciones posteriores generan recibos distintos con mecanismo `client_elicitation`. El fixture usa almacenamiento temporal y no requiere navegación, credenciales ni `qap_test`.
