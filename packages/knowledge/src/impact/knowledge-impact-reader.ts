import {
  KnowledgeStoreError, type IKnowledgeStore, type ImpactModule, type ImpactRequest, type ImpactSeed,
  type ImpactResult, type KnowledgePage, type KnowledgeRecord,
} from '@qap/engine';

import { analyzeImpact } from './impact-analyzer.js';

export interface KnowledgeImpactReadOptions {
  /** Integer 1..100; default 100. */
  readonly page_size?: number;
  /** Per attempt, integer 1..10_000; default 1_000. */
  readonly max_pages?: number;
  /** Total attempts (including the first), integer 1..10; default 3. */
  readonly max_attempts?: number;
}

export type KnowledgeImpactReadFailure =
  | 'INVALID_INPUT' | 'APPLICATION_MISMATCH' | 'INVALID_PAGE' | 'INVALID_RECORD'
  | 'DUPLICATE_MODULE_ID' | 'UNORDERED_INVENTORY' | 'REPEATED_CURSOR'
  | 'PAGE_LIMIT' | 'INVALID_CURSOR_EXHAUSTED' | 'STORE_FAILURE';

export interface KnowledgeImpactReadMetadata {
  /** Exhaustion describes pagination only, never an atomic or current snapshot. */
  readonly status: 'exhausted' | 'invalidated' | 'interrupted' | 'rejected';
  readonly snapshot_consistency: 'not_verified';
  readonly attempts: number;
  /** Includes failed queries and discarded attempts. */
  readonly query_count: number;
  readonly invalid_cursor_count: number;
  /** Only the retained, exhausted inventory; always zero on read failure. */
  readonly module_count: number;
}

export type KnowledgeImpactReadResult =
  | {
    readonly reading: KnowledgeImpactReadMetadata & { readonly status: 'exhausted' };
    readonly analysis: ImpactResult;
    readonly failure?: never;
  }
  | {
    readonly reading: KnowledgeImpactReadMetadata & { readonly status: 'invalidated' | 'interrupted' | 'rejected' };
    readonly analysis: null;
    readonly failure: {
      readonly code: KnowledgeImpactReadFailure;
      /** Sanitized code only; never copies adapter error messages or payloads. */
      readonly store_code?: KnowledgeStoreError['code'];
    };
  };

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const bounded = (value: number, maximum: number): boolean => Number.isSafeInteger(value) && value >= 1 && value <= maximum;

/** VNEXT-015-03: queries current modules only, including inactive modules.
 * No writes, history reads, fences, transactions or inferred snapshot guarantees.
 * Only INVALID_CURSOR restarts; each restart discards the entire prior inventory.
 * A failed read returns analysis:null, never a partial analysis marked complete.
 * Request and accepted module values are copied before the next asynchronous call.
 * Graph validation, diagnostics and inactive policy belong solely to analyzeImpact.
 * Bounds limit settled calls, not the duration of an unresponsive store promise.
 */
export async function readKnowledgeImpact(
  store: IKnowledgeStore, applicationId: string, request: ImpactRequest,
  options: KnowledgeImpactReadOptions = {},
): Promise<KnowledgeImpactReadResult> {
  let attempts = 0;
  let queryCount = 0;
  let invalidCursorCount = 0;
  function fail(
    status: 'invalidated' | 'interrupted' | 'rejected', code: KnowledgeImpactReadFailure,
    storeCode?: KnowledgeStoreError['code'],
  ): KnowledgeImpactReadResult {
    return {
      reading: { status, snapshot_consistency: 'not_verified', attempts,
        query_count: queryCount, invalid_cursor_count: invalidCursorCount, module_count: 0 },
      analysis: null, failure: { code, ...(storeCode === undefined ? {} : { store_code: storeCode }) },
    };
  }

  if (!store || store.contract_version !== 1 || !text(applicationId) || !request || !options ||
      request.application_id !== applicationId) return fail('rejected', 'INVALID_INPUT');
  const pageSize = options.page_size ?? 100;
  const maxPages = options.max_pages ?? 1_000;
  const maxAttempts = options.max_attempts ?? 3;
  const changedModules: readonly ImpactSeed[] = request.changed_modules;
  if (!bounded(pageSize, 100) || !bounded(maxPages, 10_000) || !bounded(maxAttempts, 10) ||
      !Array.isArray(request.changed_modules) || [...changedModules].some(seed =>
        !seed || (seed.kind !== 'id' && seed.kind !== 'key') || typeof seed.value !== 'string')) {
    return fail('rejected', 'INVALID_INPUT');
  }
  const input: ImpactRequest = { ...request, changed_modules: changedModules.map(seed => ({ ...seed })) };

  restart: for (attempts = 1; attempts <= maxAttempts; attempts++) {
    const modules: ImpactModule[] = [];
    const ids = new Set<string>();
    const cursors = new Set<string>();
    let cursor: string | undefined;
    let lastId: string | undefined;
    for (let pageNumber = 0; pageNumber < maxPages; pageNumber++) {
      let page: KnowledgePage<KnowledgeRecord<'module'>>;
      try {
        queryCount++;
        page = await store.query(applicationId, 'module', { limit: pageSize, ...(cursor === undefined ? {} : { cursor }) });
      } catch (error) {
        if (error instanceof KnowledgeStoreError && error.code === 'INVALID_CURSOR') {
          invalidCursorCount++;
          if (attempts < maxAttempts) continue restart;
          return fail('invalidated', 'INVALID_CURSOR_EXHAUSTED', error.code);
        }
        return fail('interrupted', 'STORE_FAILURE', error instanceof KnowledgeStoreError ? error.code : undefined);
      }
      if (!page || !Array.isArray(page.items) || page.items.length > pageSize ||
          (page.next_cursor !== undefined && !text(page.next_cursor)) ||
          (page.items.length === 0 && (cursor !== undefined || page.next_cursor !== undefined))) {
        return fail('rejected', 'INVALID_PAGE');
      }
      if (page.next_cursor !== undefined && cursors.has(page.next_cursor)) return fail('rejected', 'REPEATED_CURSOR');
      for (const record of page.items) {
        if (!record || !record.entity || record.kind !== 'module' || !text(record.id) ||
            !Number.isSafeInteger(record.revision) || record.revision < 1 || record.id !== record.entity.id) {
          return fail('rejected', 'INVALID_RECORD');
        }
        const module = record.entity;
        if (record.application_id !== applicationId || module.application_id !== applicationId) {
          return fail('rejected', 'APPLICATION_MISMATCH');
        }
        if (!text(module.key) || typeof module.is_active !== 'boolean' || !Array.isArray(module.dependencies) ||
            [...module.dependencies].some(dependency => !text(dependency))) return fail('rejected', 'INVALID_RECORD');
        if (ids.has(record.id)) return fail('rejected', 'DUPLICATE_MODULE_ID');
        if (lastId !== undefined && record.id < lastId) return fail('rejected', 'UNORDERED_INVENTORY');
        ids.add(record.id);
        lastId = record.id;
        modules.push({ ...module, dependencies: [...module.dependencies] });
      }
      if (page.next_cursor === undefined) {
        return {
          reading: { status: 'exhausted', snapshot_consistency: 'not_verified', attempts,
            query_count: queryCount, invalid_cursor_count: invalidCursorCount, module_count: modules.length },
          analysis: analyzeImpact(input, modules),
        };
      }
      cursors.add(page.next_cursor);
      cursor = page.next_cursor;
    }
    return fail('interrupted', 'PAGE_LIMIT');
  }
  // Every last attempt returns above; retain an explicit fail-closed fallback.
  return fail('invalidated', 'INVALID_CURSOR_EXHAUSTED');
}
