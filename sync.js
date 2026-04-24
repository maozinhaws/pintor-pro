// ============================================
// PINTOR PLUS - SYNCHRONIZATION MODULE
// ============================================

/**
 * Handles synchronization between local storage and Google Drive
 */
const Sync = {
  // Sync status
  _isSyncing: false,
  _lastSync: null,
  _syncInterval: null,
  _autoSyncEnabled: true,

  // Sync configuration
  config: {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    conflictResolution: 'newest_wins' // or 'manual'
  },

  /**
   * Initialize synchronization
   */
  init() {
    console.log('[PP-SYNC] Initializing synchronization module');
    this._loadSyncStatus();

    // Start auto-sync if enabled
    if (this.config.autoSyncEnabled) {
      this.startAutoSync();
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[PP-SYNC] Device went online');
      this.syncIfNeeded();
    });

    window.addEventListener('offline', () => {
      console.log('[PP-SYNC] Device went offline');
    });
  },

  /**
   * Load sync status from localStorage
   */
  _loadSyncStatus() {
    try {
      const syncStatus = localStorage.getItem('pp_sync_status');
      if (syncStatus) {
        const parsed = JSON.parse(syncStatus);
        this._lastSync = parsed.lastSync;
        this._isSyncing = parsed.isSyncing;
      }
    } catch (error) {
      console.error('[PP-SYNC] Error loading sync status:', error);
    }
  },

  /**
   * Save sync status to localStorage
   */
  _saveSyncStatus() {
    try {
      const syncStatus = {
        lastSync: this._lastSync,
        isSyncing: this._isSyncing
      };
      localStorage.setItem('pp_sync_status', JSON.stringify(syncStatus));
    } catch (error) {
      console.error('[PP-SYNC] Error saving sync status:', error);
    }
  },

  /**
   * Start automatic synchronization
   */
  startAutoSync() {
    console.log('[PP-SYNC] Starting auto-sync (interval: ', this.config.autoSyncInterval, 'ms)');

    // Clear any existing interval
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
    }

    // Set new interval
    this._syncInterval = setInterval(() => {
      this.performSync();
    }, this.config.autoSyncInterval);

    // Perform initial sync
    this.performSync();
  },

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    console.log('[PP-SYNC] Stopping auto-sync');
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  },

  /**
   * Perform synchronization
   * @returns {Promise} Resolves when sync completes
   */
  performSync() {
    // Prevent concurrent syncs
    if (this._isSyncing) {
      console.log('[PP-SYNC] Sync already in progress');
      return Promise.resolve();
    }

    // Check if we're online
    if (!navigator.onLine) {
      console.log('[PP-SYNC] Cannot sync - device is offline');
      return Promise.reject(new Error('Device is offline'));
    }

    // Check if user is signed in to Google Drive
    if (typeof GDrive !== 'undefined' && !GDrive.isSignedIn()) {
      console.log('[PP-SYNC] Cannot sync - user not signed in to Google Drive');
      return Promise.resolve(); // Not an error, just skip sync
    }

    console.log('[PP-SYNC] Starting synchronization process');
    this._isSyncing = true;
    this._saveSyncStatus();

    return this._executeSync()
      .then(() => {
        console.log('[PP-SYNC] Synchronization completed successfully');
        this._lastSync = new Date().toISOString();
        this._saveSyncStatus();
        showToast('Sincronização concluída', 'success');
      })
      .catch(error => {
        console.error('[PP-SYNC] Synchronization failed:', error);
        showToast('Falha na sincronização: ' + error.message, 'error');
      })
      .finally(() => {
        this._isSyncing = false;
        this._saveSyncStatus();
      });
  },

  /**
   * Execute the actual synchronization logic
   * @returns {Promise}
   */
  _executeSync() {
    // This is a simplified implementation
    // In a real app, this would:
    // 1. Get all local data that needs syncing
    // 2. Compare with remote data (if any)
    // 3. Resolve conflicts
    // 4. Upload changes to Google Drive
    // 5. Download remote changes if needed

    return new Promise((resolve, reject) => {
      // Simulate sync process
      setTimeout(() => {
        try {
          // Simulate successful sync
          console.log('[PP-SYNC] Simulated sync completed');

          // In a real implementation, you would:
          // 1. Get unsynced local records
          // 2. Upload them to Google Drive
          // 3. Check for remote changes
          // 4. Apply remote changes locally
          // 5. Update sync timestamps

          resolve();
        } catch (error) {
          reject(error);
        }
      }, 2000); // Simulate 2 second sync delay
    });
  },

  /**
   * Sync now (manual trigger)
   * @returns {Promise}
   */
  syncNow() {
    return this.performSync();
  },

  /**
   * Get last sync time
   * @returns {string|null} ISO timestamp or null if never synced
   */
  getLastSyncTime() {
    return this._lastSync;
  },

  /**
   * Check if sync is needed based on time interval
   * @returns {boolean}
   */
  needsSync() {
    if (!this._lastSync) {
      return true; // Never synced before
    }

    const lastSyncTime = new Date(this._lastSync).getTime();
    const now = Date.now();
    const elapsed = now - lastSyncTime;

    return elapsed >= this.config.autoSyncInterval;
  },

  /**
   * Sync if needed (based on time interval)
   * @returns {Promise}
   */
  syncIfNeeded() {
    if (this.needsSync()) {
      return this.performSync();
    }
    return Promise.resolve();
  },

  /**
   * Get pending changes count
   * @returns {number} Number of pending changes
   */
  getPendingChangesCount() {
    // In a real implementation, this would count unsynced local records
    return 0; // Placeholder
  },

  /**
   * Enable/disable auto-sync
   * @param {boolean} enabled
   */
  setAutoSyncEnabled(enabled) {
    this.config.autoSyncEnabled = enabled;
    if (enabled && !this._syncInterval) {
      this.startAutoSync();
    } else if (!enabled && this._syncInterval) {
      this.stopAutoSync();
    }

    // Save preference
    try {
      localStorage.setItem('pp_autosync_enabled', enabled.toString());
    } catch (error) {
      console.error('[PP-SYNC] Error saving autosync preference:', error);
    }
  },

  /**
   * Check if auto-sync is enabled
   * @returns {boolean}
   */
  isAutoSyncEnabled() {
    const saved = localStorage.getItem('pp_autosync_enabled');
    return saved === null ? this.config.autoSyncEnabled : saved === 'true';
  }
};

// Initialize sync when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Sync.init();

  // Restore auto-sync preference
  const autoSyncEnabled = Sync.isAutoSyncEnabled();
  if (!autoSyncEnabled && Sync._syncInterval) {
    Sync.stopAutoSync();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sync;
}