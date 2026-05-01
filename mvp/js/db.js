// Adapted from /db.js — ES module, manual init (no auto DOMContentLoaded)
const DB = {
  _dbName: 'pintorPlusDB',
  _version: 1,
  _db: null,
  _useLocalStorageFallback: false,

  _STORES: {
    ORCAMENTOS: 'orcamentos',
    CLIENTES: 'clientes',
    CONFIGURACOES: 'configuracoes'
  },

  init() {
    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this._dbName, this._version);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          // Only create stores that don't exist yet (shared DB with main app)
          ['orcamentos', 'clientes', 'fornecedores', 'produtos', 'agenda', 'configuracoes'].forEach(name => {
            if (!db.objectStoreNames.contains(name)) {
              const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
              store.createIndex('updatedAt', 'updatedAt', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
          });
        };

        request.onsuccess = (event) => {
          this._db = event.target.result;
          resolve();
        };

        request.onerror = () => {
          this._useLocalStorageFallback = true;
          resolve();
        };
      } catch {
        this._useLocalStorageFallback = true;
        resolve();
      }
    });
  },

  isUsingFallback() { return this._useLocalStorageFallback; },

  save(storeName, data) {
    const now = new Date().toISOString();
    const toSave = { ...data, updatedAt: now, createdAt: data.createdAt || now };
    return this.isUsingFallback()
      ? this._saveLS(storeName, toSave)
      : this._saveIDB(storeName, toSave);
  },

  getById(storeName, id) {
    return this.isUsingFallback()
      ? this._getByIdLS(storeName, id)
      : this._getByIdIDB(storeName, id);
  },

  getAll(storeName) {
    return this.isUsingFallback()
      ? this._getAllLS(storeName)
      : this._getAllIDB(storeName);
  },

  delete(storeName, id) {
    return this.isUsingFallback()
      ? this._deleteLS(storeName, id)
      : this._deleteIDB(storeName, id);
  },

  // ── localStorage ──
  _lsKey(store) { return `${this._dbName}_${store}`; },

  _lsRead(store) {
    try { return JSON.parse(localStorage.getItem(this._lsKey(store)) || '[]'); }
    catch { return []; }
  },

  _lsWrite(store, items) {
    localStorage.setItem(this._lsKey(store), JSON.stringify(items));
  },

  _saveLS(store, data) {
    return new Promise((resolve, reject) => {
      try {
        const items = this._lsRead(store);
        if (data.id) {
          const idx = items.findIndex(x => String(x.id) === String(data.id));
          if (idx >= 0) items[idx] = data;
          else { data.id = Date.now() + Math.floor(Math.random() * 10000); items.push(data); }
        } else {
          data.id = Date.now() + Math.floor(Math.random() * 10000);
          items.push(data);
        }
        this._lsWrite(store, items);
        resolve({ ...data });
      } catch (e) { reject(e); }
    });
  },

  _getByIdLS(store, id) {
    return new Promise((resolve) => {
      const items = this._lsRead(store);
      resolve(items.find(x => String(x.id) === String(id)) || null);
    });
  },

  _getAllLS(store) {
    return new Promise((resolve) => {
      const items = this._lsRead(store);
      items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      resolve(items);
    });
  },

  _deleteLS(store, id) {
    return new Promise((resolve, reject) => {
      try {
        const items = this._lsRead(store).filter(x => String(x.id) !== String(id));
        this._lsWrite(store, items);
        resolve();
      } catch (e) { reject(e); }
    });
  },

  // ── IndexedDB ──
  _saveIDB(store, data) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction([store], 'readwrite');
      const req = tx.objectStore(store).put(data);
      req.onsuccess = () => {
        // Resolve with full object including assigned id
        resolve({ ...data, id: req.result });
      };
      req.onerror = () => reject(req.error);
    });
  },

  _getByIdIDB(store, id) {
    return new Promise((resolve, reject) => {
      const req = this._db.transaction([store], 'readonly').objectStore(store).get(Number(id));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  _getAllIDB(store) {
    return new Promise((resolve, reject) => {
      const req = this._db.transaction([store], 'readonly').objectStore(store).getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  },

  _deleteIDB(store, id) {
    return new Promise((resolve, reject) => {
      const req = this._db.transaction([store], 'readwrite').objectStore(store).delete(Number(id));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};

export { DB };
export const STORES = DB._STORES;
