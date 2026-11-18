import { describe, expect, it } from 'vitest';

// Import the public barrel so bundling/type checking can expose ambiguous exports.
import {
  FileSystemStorage,
  generateBvaCases,
  generateRbacNegativeCases,
  SqliteKnowledgeAdapter,
  KnowledgeInferenceEngine,
  analyzeImpact,
  readKnowledgeImpact,
} from '../index.js';

describe('INT-01E public Knowledge capability conservation', () => {
  it.each([
    ['legacy file storage', FileSystemStorage],
    ['develop BVA', generateBvaCases],
    ['develop RBAC', generateRbacNegativeCases],
    ['vNext SQLite', SqliteKnowledgeAdapter],
    ['vNext inference', KnowledgeInferenceEngine],
    ['vNext impact analyzer', analyzeImpact],
    ['vNext Knowledge reader', readKnowledgeImpact],
  ])('exposes %s as a callable API', (_name, api) => {
    expect(typeof api).toBe('function');
  });
});
