import type { Orcamento } from '../../types';
import { STORE_NAMES } from '../schema';
import type { BaseRepository } from '../types';
import { createIndexedDbRepository } from './indexedDbRepository';

export function createOrcamentosRepository(getDb: () => Promise<IDBDatabase>): BaseRepository<Orcamento> {
  return createIndexedDbRepository<Orcamento>(getDb, STORE_NAMES.orcamentos);
}
