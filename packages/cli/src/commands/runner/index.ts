import * as EngineModule from '@qap/engine';

export interface RunOptions {
  profile?: string;
  headed?: boolean;
}

interface EngineLike {
  execute: (options: {
    target?: string;
    profile?: string;
    headed: boolean;
  }) => Promise<{ success?: boolean } | void>;
}

interface EngineConstructor {
  new (): EngineLike;
}

function resolveEngineConstructor(mod: unknown): EngineConstructor {
  const candidate = mod as Record<string, unknown>;
  const ctor = candidate.Engine ?? candidate.QAPEngine ?? candidate.default;

  if (typeof ctor !== 'function') {
    throw new Error('No se encontro una clase de motor exportada por @qap/engine');
  }

  return ctor as EngineConstructor;
}

export async function handleRun(suiteOrFile?: string, options: RunOptions = {}): Promise<void> {
  const EngineClass = resolveEngineConstructor(EngineModule);
  const engine = new EngineClass();

  console.log('Iniciando ejecucion de pruebas...');

  if (suiteOrFile) {
    console.log(`Objetivo de ejecucion: ${suiteOrFile}`);
  } else {
    console.log('Ejecutando todas las suites configuradas');
  }

  if (options.profile) {
    console.log(`Usando perfil de autenticacion: ${options.profile}`);
  }

  try {
    const result = await engine.execute({
      target: suiteOrFile,
      profile: options.profile,
      headed: options.headed ?? false,
    });

    if (result && 'success' in result && result.success === false) {
      console.error('La ejecucion finalizo con fallas.');
      process.exitCode = 1;
    } else {
      console.log('Ejecucion completada exitosamente.');
    }
  } catch (error) {
    console.error('Error durante la ejecucion:', (error as Error).message);
    process.exitCode = 1;
  }
}