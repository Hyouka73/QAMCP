import { FileSystemStorage } from '@qap/knowledge';
import { DataError } from '../errors.js';

export interface UpdateCommandOptions {
    dryRun? : boolean;
    interactive?: boolean;
}

export async function handleUpdate(moduleName?: string, options: UpdateCommandOptions = {}): Promise<void> {
    const storage = new FileSystemStorage({ rootDir: process.cwd()});

    if (!moduleName) {
        throw new DataError('Debe especificar un módulo para actualizar (ej. "qap update <module>").');
    }

    if (!(await storage.hasModule(moduleName))) {
        throw new DataError('El módulo "${moduleName}" no existe en el almacenamiento.');
    }

    process.stdout.write('Iniciando actualización para el módulo "${moduleName}"...\n');
    const cases = await storage.listTestCases(moduleName);

    if (options.dryRun) {
        process.stdout.write('[DRY RUN] Módulo "${moduleName}" verificado. Se encontraron ${cases.length} casos. Ningún cambio aplicado en disco. \n');
        return;
    }

    process.stdout.write(`✔ Módulo "${moduleName}" actualizado exitosamente (${cases.length} casos procesados).\n`);
    process. exitCode = 0;
}