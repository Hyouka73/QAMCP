import { resolve } from 'node:path';
import { acquireProjectOperation, resetHostDirectory, withProjectOperation, ProjectOperationError,
  type ProjectOperationContext } from '../project-reset.js';
import type { AppServiceSqliteStore } from './app-service-store.js';

const key = 'project_operation_domain:v1';
interface Domain { directory: string; explicit: boolean }
const same = (a: string, b: string) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;

/** The durable app database pins the host gate for every instance/process. */
export class OperationDomain {
  readonly #store: AppServiceSqliteStore;
  constructor(store: AppServiceSqliteStore, directory?: string) {
    this.#store = store;
    if (!this.read()) {
      const initial = resolve(directory ?? resetHostDirectory());
      withProjectOperation(initial, () => store.transaction('IMMEDIATE', () => {
        if (!this.read()) store.run('INSERT INTO host_session_state (key,value,updated_at) VALUES (?,?,?)',
          key, JSON.stringify({ directory: initial, explicit: directory !== undefined }), new Date().toISOString());
      }));
    }
    if (directory !== undefined) this.bind(directory);
  }
  private read(): Domain | undefined {
    const row = this.#store.get<{ value: string }>('SELECT value FROM host_session_state WHERE key = ?', key);
    if (!row) return undefined;
    const domain = JSON.parse(row.value) as Domain;
    if (typeof domain.directory !== 'string' || resolve(domain.directory) !== domain.directory || typeof domain.explicit !== 'boolean') {
      throw new ProjectOperationError('project_operation_domain_invalid');
    }
    return domain;
  }
  get directory(): string { return this.read()!.directory; }
  assertBound(): void {
    if (!this.read()!.explicit) throw new ProjectOperationError('project_operation_domain_required');
  }
  /** First host attachment pins the configured workspace domain. Never silently rebind it. */
  bind(directory: string): void {
    directory = resolve(directory);
    const previous = this.read()!;
    if (previous.explicit && !same(previous.directory, directory)) throw new ProjectOperationError('project_operation_domain_mismatch');
    if (previous.explicit) return;
    const releaseOld = acquireProjectOperation(previous.directory);
    let releaseNew: (() => void) | undefined;
    try {
      if (!same(previous.directory, directory)) releaseNew = acquireProjectOperation(directory);
      this.#store.transaction('IMMEDIATE', () => {
        const current = this.read()!;
        if (current.explicit && !same(current.directory, directory)) throw new ProjectOperationError('project_operation_domain_mismatch');
        this.#store.run('INSERT INTO host_session_state (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
          key, JSON.stringify({ directory, explicit: true }), new Date().toISOString());
      });
    } finally { releaseNew?.(); releaseOld(); }
  }
  run<T>(action: (context: ProjectOperationContext) => T, context?: ProjectOperationContext): T {
    const directory = this.directory;
    return withProjectOperation(directory, owner => {
      if (!same(this.directory, directory)) throw new ProjectOperationError('project_operation_domain_changed');
      return action(owner);
    }, context, 2000);
  }
}
