import type { Cliente } from '../../types';
import { STORE_NAMES } from '../schema';
import type { BaseRepository } from '../types';
import { createIndexedDbRepository } from './indexedDbRepository';

export type PersistedCliente = Cliente & { id: string };

export function createClientesRepository(getDb: () => Promise<IDBDatabase>): BaseRepository<PersistedCliente> {
  return createIndexedDbRepository<PersistedCliente>(getDb, STORE_NAMES.clientes);
}
