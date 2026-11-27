# Acta operativa G0-01.a — autorización acotada y alineación de identidad

27 de noviembre de 2026 · Hyouka73/QAMCP · develop.

Base documental ratificada: `ede09c1d2d4f39a3c48eb53a476a97678ff87450`.
Acta de ratificación y HEAD remoto comprobado antes de esta publicación: `b09bb3d7f80a9e06e16ac71b28b5483792174235`.

## 1. Decisión expresa del propietario

> Autorizo G0-01.a exclusivamente, incluyendo el inventario técnico y la línea base reproducible en el entorno actual, bajo las precondiciones, presupuesto, controles y límites del expediente ratificado. Delego al Orquestador Principal la aprobación técnica del preflight. No autorizo otras subtareas, modificaciones de código, adopción de tecnologías ni acceso a sistemas empresariales.

## 2. Resolución del Orquestador

P permanece cerrada documentalmente. Se autoriza exclusivamente G0-01.a, condicionada a la aceptación técnica del preflight antes de ejecutar la línea base. No se abre G0 en su totalidad ni se adjudica G0-01.a.

Responsable lógico ET-01; ejecutor Codex High, sujeto a capacidad efectiva; testigo A (QA de arquitectura independiente del ejecutor). P-02.b satisfecho. Obligaciones AR-21/26/34/54/57, TEC-01 y C5 según TR-WBS-01. Rigen PM-01, WBS-01, TR-WBS-01, precedencia normativa y protocolo AR-26.

## 3. Incidencia de identidad y resolución

El ejecutor informó que el checkout existente de develop estaba limpio, situado en la base ratificada `ede09c1d2d4f39a3c48eb53a476a97678ff87450`, mientras que el remoto estaba en `b09bb3d7f80a9e06e16ac71b28b5483792174235`. Su comprobación fue de solo lectura; no informó modificaciones ni commit de entrega. El Orquestador comprobó de nuevo el HEAD remoto antes de publicar esta acta. La comparación documental previa entre ambas identidades mostró exclusivamente cambios en el README del expediente, acta de ratificación y confirmación final RP-01.

Se dispone reutilizar el checkout limpio existente, sin crear otro checkout, ramas ni worktrees. Se autoriza la alineación Git mediante avance rápido exclusivamente, incluyendo esta acta, después de verificar nuevamente URL de origin, rama develop, limpieza del árbol, identidad remota, relación de ancestro y totalidad de cambios intermedios. La identidad objetivo es el commit de publicación de esta acta, que se comunicará al ejecutor y se cotejará con origin/develop. No se autoriza incorporar cambios posteriores no evaluados. Si el remoto difiere, aparecen cambios ajenos, la relación no permite avance rápido o el árbol deja de estar limpio, detenerse y comunicar la discrepancia. No reset destructivo, rebase, stash, merge no fast-forward ni modificación de main. Registrar SHA anterior/posterior, códigos y confirmación de limpieza sin divulgar rutas personales.

## 4. Preflight y punto de detención

Después de alinear, inspeccionar sin modificar código el entorno actual y preparar el protocolo de adquisición reproducible. Identificar SHA/árbol, herramientas efectivas, SO/CPU, capacidad y disponibilidad de memoria/disco, lock y dependencias, configuración saneada, caches, aislamiento, fixtures sintéticos, variantes, IO y destinos, riesgos, admisibilidad aplicable, comandos y controles positivos/negativos por paquete.

Proponer límites medibles de iteraciones, CPU/RSS/IO/disco/tiempo/inferencia y reserva de limpieza/recuperación, con fundamento en capacidad observada. Identificar testigo independiente, método de evidencia y condiciones de detención. No recopilar ni publicar secretos, datos empresariales ni rutas personales.

**Detención obligatoria:** entregar preflight al Orquestador antes de instalación, compilación, ejecución de suites, smokes o pruebas de recuperación. La aprobación técnica del preflight está delegada al Orquestador; no requiere repetir la autorización del propietario si no se amplía el alcance ni se introducen decisiones reservadas. El protocolo deberá respetar los diez paquetes, la comparación reproducible de diagnósticos por identidad y multiplicidad y la separación de antecedentes 93/142, laboratorio 144 y baseline actual.

No se autorizan modificaciones de código, adopción tecnológica, acceso a sistemas empresariales, compras, otras subtareas ni ejecución sin precondiciones satisfechas. El inventario y baseline deberán adjudicarse conforme a WBS-01; el ejecutor no se autoaprueba.

## 5. Estado

G0-01.a: autorizada, en preparación; alineación Git y preflight pendientes de acreditación; línea base no iniciada; sin adjudicación. Todas las demás subtareas operativas permanecen sin autorización.
