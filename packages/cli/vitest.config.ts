import { defineConfig } from 'vitest/config';

export  default defineConfig({
    test: {
       // Los tests de este paquete manipulan process.cwd() (discover.test.ts
    // usa process.chdir() para simular un proyecto en un directorio temporal).
    // process.cwd() es un estado global del proceso de Node, compartido
    // entre archivos de test que Vitest ejecuta en paralelo por defecto.
    // Se desactiva el paralelismo entre archivos para evitar condiciones
    // de carrera donde un archivo cambia el cwd mientras otro depende de
    // el (ver: fallo intermitente en auth-commands.test.ts).
    fileParallelism: false,
    },
})