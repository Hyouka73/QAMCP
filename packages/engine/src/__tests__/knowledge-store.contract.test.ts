import { describe } from 'vitest';

import { knowledgeStoreContract } from './knowledge-store.contract.js';
import { MemoryKnowledgeStore } from './mocks/knowledge-store.mock.js';

describe('IKnowledgeStore contract — memory double only', () => {
  knowledgeStoreContract(async () => new MemoryKnowledgeStore());
});
