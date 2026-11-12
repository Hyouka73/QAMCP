# Restablecer un proyecto QAP vNext

En el MCP, llama a `qap_project_reset` con `targetPath` absoluto y `phase: "preview"`. Revisa el inventario y pasa su `reset_id` con `phase: "confirm"` en la misma conexión. El diálogo local de Windows muestra el workspace, el inventario y su huella. Solo el botón **Eliminar definitivamente** autoriza esa operación. El identificador dura dos minutos y se consume en un intento. Si cambia el inventario, genera otro preview. `qap_clean` sigue bloqueado.

En el CLI, ejecuta `qap clean --preview` desde el workspace para ver el alcance, o `qap clean` para generar un inventario y confirmar en el diálogo local. `--force` y `--yes` ya no están disponibles. El CLI y el MCP deben usar el mismo `QAP_MCP_WORKSPACE_HOST_DIR`, si se configuró uno.

El modo de bootstrap elimina `.qa/`, el Knowledge SQLite que el host asignó exclusivamente al workspace y sus archivos auxiliares. Filtra solo las entradas del workspace de los tres registros compartidos: raíces, Discovery y autorizaciones QA cifradas. Conserva la carpeta del proyecto, el Vault global, los demás workspaces, los archivos externos y los diagnósticos compartidos. La operación elimina archivos y registros; no promete borrado forense de bloques de disco ni de copias externas.

Si una operación QAP o una conexión SQLite mantiene ocupado el almacenamiento, cierra la operación o la conexión y vuelve a generar el inventario. Detén previamente herramientas externas y versiones de QAP que no usen el bloqueo actual. El recibo está en `project-resets/<reset_id>.receipt.json`, dentro del almacenamiento del host. Un resultado parcial bloquea escrituras QAP para ese workspace hasta repetir el restablecimiento con un inventario y autorización nuevos. Después del éxito, `qap_status` informa que el proyecto no está inicializado.

Si aparece `authorization_registry_staging_present`, el host detectó un archivo temporal de un registro compartido. Un operador del host debe reconciliar ese registro antes de reintentar; QAP no elimina un archivo temporal que pueda contener datos de varios proyectos.

Los hosts con manifiesto o adaptadores externos quedan bloqueados: sus asociaciones actuales no acreditan si el mismo Knowledge, borrador, cierre o cola de revisión pertenece también a otro proyecto. No se borran esos datos ni la copia local en ese modo. El diálogo de aprobación se admite en un escritorio interactivo de Windows. No se acepta consentimiento por chat, por elicitation MCP ni por entrada redirigida del CLI.
