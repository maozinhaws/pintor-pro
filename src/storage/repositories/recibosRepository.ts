import type { Recibo } from '../../types';
import type { BaseRepository } from '../types';
import { STORE_NAMES } from '../schema';

export function createRecibosRepository(
  getDb: () => Promise<IDBDatabase>
): BaseRepository<Recibo & { id: string }> {
  return {
    async getAll(): Promise<(Recibo & { id: string })[]> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.recibos, 'readonly');
        const store = tx.objectStore(STORE_NAMES.recibos);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as any);
        request.onerror = () => reject(request.error);
      });
    },

    async getById(id: string): Promise<(Recibo & { id: string }) | null> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.recibos, 'readonly');
        const store = tx.objectStore(STORE_NAMES.recibos);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    },

    async upsert(record: Recibo & { id: string }): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.recibos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.recibos);
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async bulkUpsert(records: (Recibo & { id: string })[]): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.recibos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.recibos);
        records.forEach((record) => store.put(record));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },

    async remove(id: string): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.recibos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.recibos);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },

    async clear(): Promise<void> {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.recibos, 'readwrite');
        const store = tx.objectStore(STORE_NAMES.recibos);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
  };
}

// Helper: buscar recibos por orcamentoId
export async function getRecibosByOrcamentoId(
  getDb: () => Promise<IDBDatabase>,
  orcamentoId: string
): Promise<(Recibo & { id: string })[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.recibos, 'readonly');
    const store = tx.objectStore(STORE_NAMES.recibos);
    const index = store.index('orcamentoId');
    const request = index.getAll(orcamentoId);
    request.onsuccess = () => resolve(request.result as any);
    request.onerror = () => reject(request.error);
  });
}
