import {
  LEGACY_LOCAL_STORAGE_KEYS,
  LEGACY_SESSION_STORAGE_KEYS,
  STORAGE_DB_NAME,
  STORAGE_SCHEMA_VERSION,
  STORE_NAMES,
} from './schema';
import { createClientesRepository } from './repositories/clientesRepository';
import { createIndexedDbConfigRepository } from './repositories/configRepository';
import { createEventosRepository } from './repositories/eventosRepository';
import { createFornecedoresRepository } from './repositories/fornecedoresRepository';
import { createIndexedDbRepository } from './repositories/indexedDbRepository';
import { createOrcamentosRepository } from './repositories/orcamentosRepository';
import { createFotosRepository } from './repositories/fotosRepository';
import { createRecibosRepository } from './repositories/recibosRepository';
import type { AppStorage, DomainSnapshot } from './types';

const STORE_LIST = Object.values(STORE_NAMES);

// Helpers para converter Blob ↔ base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function base64ToBlob(dataUrl: string, mimeType: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function ensureId<T extends { id?: string; ts?: number; tel?: string; nome?: string }>(
  record: T,
  prefix: string,
  index: number,
): T & { id: string } {
  const id = record.id || [prefix, record.ts, record.tel, record.nome, index].filter(Boolean).join('-');
  return { ...record, id: id || `${prefix}-${Date.now()}-${index}` };
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this runtime'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_DB_NAME, STORAGE_SCHEMA_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion || 0;

      // Criar stores que não existem
      STORE_LIST.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const keyPath = storeName === STORE_NAMES.config || storeName === STORE_NAMES.meta ? 'key' : 'id';
          const store = db.createObjectStore(storeName, { keyPath });

          // Adicionar índices conforme o tipo de store
          if (storeName === STORE_NAMES.orcamentos) {
            store.createIndex('clienteId', 'clienteId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('criadoEm', 'ts', { unique: false });
            store.createIndex('statusTs', ['status', 'tsEdit'], { unique: false });
          } else if (storeName === STORE_NAMES.clientes) {
            store.createIndex('nome', 'nome', { unique: false });
            store.createIndex('telefone', 'tel', { unique: false });
            store.createIndex('criadoEm', 'ts', { unique: false });
          } else if (storeName === STORE_NAMES.fornecedores) {
            store.createIndex('nome', 'nome', { unique: false });
            store.createIndex('criadoEm', 'ts', { unique: false });
          } else if (storeName === STORE_NAMES.eventos) {
            store.createIndex('data', 'data', { unique: false });
            store.createIndex('orcamentoId', 'orcId', { unique: false });
            store.createIndex('criadoEm', 'ts', { unique: false });
          } else if (storeName === STORE_NAMES.fotos) {
            store.createIndex('orcamentoId', 'orcamentoId', { unique: false });
            store.createIndex('itemId', 'itemId', { unique: false });
            store.createIndex('criadoEm', 'criadoEm', { unique: false });
          } else if (storeName === STORE_NAMES.recibos) {
            store.createIndex('orcamentoId', 'orcamentoId', { unique: false });
            store.createIndex('criadoEm', 'criadoEm', { unique: false });
          }
        }
      });

      // Migrations entre versões
      if (oldVersion < 2) {
        // Migração de v1 → v2: criar stores fotos e recibos
        // Nada especial a fazer, pois os stores vazios são criados acima
        console.log('[Dexie Migration] v1 → v2: fotos e recibos stores criados');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open IndexedDB'));
  });
}

function purgeLegacyBrowserStorage(): void {
  LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
  LEGACY_SESSION_STORAGE_KEYS.forEach((key) => {
    try { sessionStorage.removeItem(key); } catch {}
  });
}

export function createWebDexieStorage(): AppStorage {
  let dbPromise: Promise<IDBDatabase> | null = null;

  const getDb = async () => {
    if (!dbPromise) dbPromise = openDatabase();
    return dbPromise;
  };

  const storage: AppStorage = {
    platform: 'web-dexie',
    async init() {
      await getDb();
    },
    async close() {
      const db = await getDb();
      db.close();
      dbPromise = null;
    },
    async purgeLegacyStorage() {
      purgeLegacyBrowserStorage();
    },
    async exportSnapshot(): Promise<DomainSnapshot> {
      const config = await storage.config.get();
      if (!config) throw new Error('Config not initialized');

      // Convertir fotos de Blob → base64 para exportação
      const fotos = await storage.fotos.getAll();
      const fotosB64 = await Promise.all(
        fotos.map(async (foto) => ({
          id: foto.id,
          orcamentoId: foto.orcamentoId,
          itemId: foto.itemId,
          criadoEm: foto.criadoEm,
          dataB64: await blobToBase64(foto.blob),
        }))
      );

      const recibos = await storage.recibos.getAll();

      return {
        orcamentos: await storage.orcamentos.getAll(),
        clientes: await storage.clientes.getAll(),
        fornecedores: await storage.fornecedores.getAll(),
        eventos: await storage.eventos.getAll(),
        config,
        fotos: fotosB64,
        recibos,
      };
    },
    async importSnapshot(snapshot) {
      await storage.orcamentos.clear();
      await storage.clientes.clear();
      await storage.fornecedores.clear();
      await storage.eventos.clear();
      await storage.fotos.clear();
      await storage.recibos.clear();
      await storage.config.clear();

      await storage.orcamentos.bulkUpsert(snapshot.orcamentos);
      await storage.clientes.bulkUpsert(snapshot.clientes.map((record, index) => ensureId(record, 'cliente', index)));
      await storage.fornecedores.bulkUpsert(snapshot.fornecedores.map((record, index) => ensureId(record, 'fornecedor', index)));
      await storage.eventos.bulkUpsert(snapshot.eventos);

      // Restaurar fotos: base64 → Blob
      if (snapshot.fotos && snapshot.fotos.length > 0) {
        const fotosBlob = await Promise.all(
          snapshot.fotos.map(async (f) => ({
            id: f.id,
            orcamentoId: f.orcamentoId,
            itemId: f.itemId,
            criadoEm: f.criadoEm,
            blob: await base64ToBlob(f.dataB64, 'image/jpeg'),
          }))
        );
        await storage.fotos.bulkUpsert(fotosBlob);
      }

      // Restaurar recibos
      if (snapshot.recibos && snapshot.recibos.length > 0) {
        await storage.recibos.bulkUpsert(snapshot.recibos);
      }

      await storage.config.set(snapshot.config);
    },
    orcamentos: createOrcamentosRepository(getDb),
    clientes: createClientesRepository(getDb),
    fornecedores: createFornecedoresRepository(getDb),
    eventos: createEventosRepository(getDb),
    config: createIndexedDbConfigRepository(getDb, STORE_NAMES.config),
    media: createIndexedDbRepository(getDb, STORE_NAMES.media),
    syncQueue: createIndexedDbRepository(getDb, STORE_NAMES.syncQueue),
    feedback: createIndexedDbRepository(getDb, STORE_NAMES.feedback),
    fotos: createFotosRepository(getDb),
    recibos: createRecibosRepository(getDb),
  };

  return storage;
}
