// ============================================
// PINTOR PLUS - DATABASE LAYER
// ============================================

/**
 * Database abstraction layer for Pintor Plus
 * Uses localStorage and IndexedDB for data persistence
 */
const DB = {
  // Database name
  _dbName: 'pintorPlusDB',
  _version: 1,
  _db: null,

  // Store names
  _STORES: {
    ORCAMENTOS: 'orcamentos',
    CLIENTES: 'clientes',
    FORNECEDORES: 'fornecedores',
    PRODUTOS: 'produtos',
    AGENDA: 'agenda',
    CONFIGURACOES: 'configuracoes'
  },

  /**
   * Initialize the database
   * @returns {Promise} Resolves when database is ready
   */
  init() {
    return new Promise((resolve, reject) => {
      try {
        // Try to use IndexedDB
        const request = window.indexedDB.open(this._dbName, this._version);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          console.log('[PP-DB] Creating database schema');

          // Create object stores for each data type
          Object.values(this._STORES).forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
              // Create indexes for common query fields
              store.createIndex('updatedAt', 'updatedAt', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
          });
        };

        request.onsuccess = (event) => {
          this._db = event.target.result;
          console.log('[PP-DB] Database initialized successfully');
          resolve();
        };

        request.onerror = (event) => {
          console.error('[PP-DB] Database initialization error:', event.target.error);
          // Fallback to localStorage if IndexedDB fails
          this._useLocalStorageFallback = true;
          resolve();
        };
      } catch (error) {
        console.error('[PP-DB] Error initializing database:', error);
        // Fallback to localStorage
        this._useLocalStorageFallback = true;
        resolve();
      }
    });
  },

  /**
   * Check if using localStorage fallback
   * @returns {boolean}
   */
  isUsingFallback() {
    return !!this._useLocalStorageFallback;
  },

  /**
   * Save data to a store
   * @param {string} storeName - Name of the store
   * @param {Object} data - Data to save
   * @returns {Promise} Resolves with saved data
   */
  save(storeName, data) {
    // Add timestamps
    const now = new Date().toISOString();
    const dataToSave = {
      ...data,
      updatedAt: now,
      createdAt: data.createdAt || now
    };

    if (this.isUsingFallback()) {
      return this._saveToLocalStorage(storeName, dataToSave);
    } else {
      return this._saveToIndexedDB(storeName, dataToSave);
    }
  },

  /**
   * Get data from a store by ID
   * @param {string} storeName - Name of the store
   * @param {number|string} id - Record ID
   * @returns {Promise} Resolves with the data
   */
  getById(storeName, id) {
    if (this.isUsingFallback()) {
      return this._getFromLocalStorageById(storeName, id);
    } else {
      return this._getFromIndexedDBById(storeName, id);
    }
  },

  /**
   * Get all data from a store
   * @param {string} storeName - Name of the store
   * @param {Object} filters - Optional filters
   * @returns {Promise} Resolves with array of data
   */
  getAll(storeName, filters = {}) {
    if (this.isUsingFallback()) {
      return this._getAllFromLocalStorage(storeName, filters);
    } else {
      return this._getAllFromIndexedDB(storeName, filters);
    }
  },

  /**
   * Delete data from a store by ID
   * @param {string} storeName - Name of the store
   * @param {number|string} id - Record ID
   * @returns {Promise} Resolves when deleted
   */
  delete(storeName, id) {
    if (this.isUsingFallback()) {
      return this._deleteFromLocalStorage(storeName, id);
    } else {
      return this._deleteFromIndexedDB(storeName, id);
    }
  },

  /**
   * Clear all data from a store
   * @param {string} storeName - Name of the store
   * @returns {Promise} Resolves when cleared
   */
  clear(storeName) {
    if (this.isUsingFallback()) {
      return this._clearLocalStorage(storeName);
    } else {
      return this._clearIndexedDB(storeName);
    }
  },

  // LocalStorage fallback methods
  _saveToLocalStorage(storeName, data) {
    return new Promise((resolve, reject) => {
      try {
        let items = JSON.parse(localStorage.getItem(`${this._dbName}_${storeName}`) || '[]');

        if (data.id) {
          // Update existing item
          const index = items.findIndex(item => item.id === data.id);
          if (index !== -1) {
            items[index] = data;
          } else {
            // Add new item with ID
            data.id = Date.now() + Math.floor(Math.random() * 10000);
            items.push(data);
          }
        } else {
          // New item
          data.id = Date.now() + Math.floor(Math.random() * 10000);
          items.push(data);
        }

        localStorage.setItem(`${this._dbName}_${storeName}`, JSON.stringify(items));
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  },

  _getFromLocalStorageById(storeName, id) {
    return new Promise((resolve, reject) => {
      try {
        const items = JSON.parse(localStorage.getItem(`${this._dbName}_${storeName}`) || '[]');
        const item = items.find(item => item.id === Number(id));
        resolve(item || null);
      } catch (error) {
        reject(error);
      }
    });
  },

  _getAllFromLocalStorage(storeName, filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        let items = JSON.parse(localStorage.getItem(`${this._dbName}_${storeName}`) || '[]');

        // Apply filters (basic implementation)
        if (filters) {
          Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
              items = items.filter(item =>
                String(item[key]).toLowerCase().includes(String(filters[key]).toLowerCase())
              );
            }
          });
        }

        // Sort by updatedAt descending
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        resolve(items);
      } catch (error) {
        reject(error);
      }
    });
  },

  _deleteFromLocalStorage(storeName, id) {
    return new Promise((resolve, reject) => {
      try {
        let items = JSON.parse(localStorage.getItem(`${this._dbName}_${storeName}`) || '[]');
        items = items.filter(item => item.id !== Number(id));
        localStorage.setItem(`${this._dbName}_${storeName}`, JSON.stringify(items));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  _clearLocalStorage(storeName) {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem(`${this._dbName}_${storeName}`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // IndexedDB methods (simplified implementations)
  _saveToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this._db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => {
        console.log(`[PP-DB] Data saved to ${storeName}`);
      };
    });
  },

  _getFromIndexedDBById(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this._db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(Number(id));

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  _getAllFromIndexedDB(storeName, filters = {}) {
    return new Promise((resolve, reject) => {
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this._db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let items = request.result || [];

        // Apply filters (basic implementation)
        if (filters) {
          Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
              items = items.filter(item =>
                String(item[key]).toLowerCase().includes(String(filters[key]).toLowerCase())
              );
            }
          });
        }

        // Sort by updatedAt descending
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  },

  _deleteFromIndexedDB(storeName, id) {
    return new Promise((resolve, reject) => {
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this._db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(Number(id));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => {
        console.log(`[PP-DB] Data deleted from ${storeName}`);
      };
    });
  },

  _clearIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this._db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => {
        console.log(`[PP-DB] Store cleared: ${storeName}`);
      };
    });
  }
};

// Initialize database when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  DB.init().catch(error => {
    console.error('[PP-DB] Failed to initialize database:', error);
  });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DB;
}