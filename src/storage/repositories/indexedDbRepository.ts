import type { BaseRepository } from '../types';

type GetDb = () => Promise<IDBDatabase>;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
  });
}

export function createIndexedDbRepository<T extends { id: string }>(
  getDb: GetDb,
  storeName: string,
): BaseRepository<T> {
  return {
    async getAll() {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readonly');
      const records = await requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
      await transactionToPromise(transaction);
      return records;
    },

    async getById(id) {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readonly');
      const record = await requestToPromise<T | undefined>(transaction.objectStore(storeName).get(id));
      await transactionToPromise(transaction);
      return record || null;
    },

    async upsert(record) {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(record);
      await transactionToPromise(transaction);
    },

    async bulkUpsert(records) {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      records.forEach((record) => store.put(record));
      await transactionToPromise(transaction);
    },

    async remove(id) {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(id);
      await transactionToPromise(transaction);
    },

    async clear() {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).clear();
      await transactionToPromise(transaction);
    },
  };
}
