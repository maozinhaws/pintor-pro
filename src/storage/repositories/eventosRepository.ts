import type { Evento } from '../../types';
import { STORE_NAMES } from '../schema';
import type { BaseRepository } from '../types';
import { createIndexedDbRepository } from './indexedDbRepository';

export function createEventosRepository(getDb: () => Promise<IDBDatabase>): BaseRepository<Evento> {
  return createIndexedDbRepository<Evento>(getDb, STORE_NAMES.eventos);
}
