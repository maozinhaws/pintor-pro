import type { Config } from '../../types';
import type { ConfigRepository } from '../types';

type GetDb = () => Promise<IDBDatabase>;

const CONFIG_KEY = 'default';

interface ConfigRecord {
  key: string;
  value: Config;
  updatedAt: number;
}

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

export function createIndexedDbConfigRepository(
  getDb: GetDb,
  storeName: string,
): ConfigRepository {
  return {
    async get() {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readonly');
      const record = await requestToPromise<ConfigRecord | undefined>(
        transaction.objectStore(storeName).get(CONFIG_KEY),
      );
      await transactionToPromise(transaction);
      return record?.value || null;
    },

    async set(config) {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put({
        key: CONFIG_KEY,
        value: config,
        updatedAt: Date.now(),
      } satisfies ConfigRecord);
      await transactionToPromise(transaction);
    },

    async clear() {
      const db = await getDb();
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(CONFIG_KEY);
      await transactionToPromise(transaction);
    },
  };
}
