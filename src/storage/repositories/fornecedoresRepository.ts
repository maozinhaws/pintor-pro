import type { Fornecedor } from '../../types';
import { STORE_NAMES } from '../schema';
import type { BaseRepository } from '../types';
import { createIndexedDbRepository } from './indexedDbRepository';

export type PersistedFornecedor = Fornecedor & { id: string };

export function createFornecedoresRepository(getDb: () => Promise<IDBDatabase>): BaseRepository<PersistedFornecedor> {
  return createIndexedDbRepository<PersistedFornecedor>(getDb, STORE_NAMES.fornecedores);
}
