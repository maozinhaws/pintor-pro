import type { Foto } from '../../types';
import type { BaseRepository } from '../types';
import { STORE_NAMES } from '../schema';

export function createFotosRepository(
  getDb: () => Promise<IDBDatabase>
): BaseRepository<Foto & { id: string }> {
  return {
    async getAll(): Promise<(Foto & { id: string })[]> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.fotos, 'readonly');
        const store = tx.objectStore(STORE_NAMES.fotos);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as any);
        request.onerror = () => reject(request.error);
      });
    },

    async getById(id: string): Promise<(Foto & { id: string }) | null> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.fotos, 'readonly');
        const store = tx.objectStore(STORE_NAMES.fotos);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    },

    async upsert(record: Foto & { id: string }): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.fotos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.fotos);
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async bulkUpsert(records: (Foto & { id: string })[]): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.fotos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.fotos);
        records.forEach((record) => store.put(record));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    async remove(id: string): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.fotos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.fotos);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async clear(): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.fotos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.fotos);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
  };
}

// Helper: buscar fotos por orcamentoId
export async function getFotosByOrcamentoId(
  getDb: () => Promise<IDBDatabase>,
  orcamentoId: string
): Promise<(Foto & { id: string })[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.fotos, 'readonly');
    const store = tx.objectStore(STORE_NAMES.fotos);
    const index = store.index('orcamentoId');
    const request = index.getAll(orcamentoId);
    request.onsuccess = () => resolve(request.result as any);
    request.onerror = () => reject(request.error);
  });
}

// Helper: buscar fotos por itemId
export async function getFotosByItemId(
  getDb: () => Promise<IDBDatabase>,
  itemId: string
): Promise<(Foto & { id: string })[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.fotos, 'readonly');
    const store = tx.objectStore(STORE_NAMES.fotos);
    const index = store.index('itemId');
    const request = index.getAll(itemId);
    request.onsuccess = () => resolve(request.result as any);
    request.onerror = () => reject(request.error);
  });
}
