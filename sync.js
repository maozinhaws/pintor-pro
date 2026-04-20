// ╔══════════════════════════════════════════════════════════╗
// ║  PP_SYNC — Firestore Sync Module (Offline-First)       ║
// ╚══════════════════════════════════════════════════════════╝
//
// Depende de: firebase (compat), dbFS (global), PP_DB (Dexie), S (state)
// Estrutura Firestore: /users/{uid}/data/{collection}

const PP_Sync = {
  // ── Estado ──────────────────────────────────────────────
  db: null,           // referência ao Firestore (dbFS)
  uid: null,          // UID do usuário logado
  isSyncing: false,
  lastSync: 0,        // timestamp da última sync completa
  _pendingUploads: 0, // contador de uploads em andamento
  _enabled: false,    // sync só ativa após login

  // ── Coleções mapeadas ──────────────────────────────────
  COLLECTIONS: ['orcs', 'clientes', 'fornecedores', 'eventos', 'config'],

  // ── Inicialização ──────────────────────────────────────
  init(firestoreDb) {
    this.db = firestoreDb;
    console.log('[PP_Sync] Módulo inicializado');
  },

  // ── Gerenciamento de Sessão ────────────────────────────
  setUser(uid) {
    this.uid = uid;
    this._enabled = true;
    this.lastSync = parseInt(localStorage.getItem('pp-sync-last') || '0');
    console.log('[PP_Sync] User set:', uid, '| lastSync:', new Date(this.lastSync).toLocaleString());
  },

  clearUser() {
    this.uid = null;
    this._enabled = false;
    this.isSyncing = false;
    this._pendingUploads = 0;
    console.log('[PP_Sync] User cleared');
  },

  // ── Referência de documento Firestore ──────────────────
  _docRef(collection) {
    if (!this.db || !this.uid) return null;
    return this.db.collection('users').doc(this.uid).collection('data').doc(collection);
  },

  // ══════════════════════════════════════════════════════════
  // UPLOAD — Fire-and-forget após save local
  // ══════════════════════════════════════════════════════════
  async upload(collection, data) {
    if (!this._enabled || !this.uid || !this.db) {
      return false;
    }

    const ref = this._docRef(collection);
    if (!ref) return false;

    this._pendingUploads++;
    this._setStatus('syncing');

    try {
      const payload = {
        tsSync: Date.now()
      };

      if (collection === 'config') {
        // Config é um objeto único, não array
        Object.assign(payload, data);
      } else {
        // Coleções são arrays de itens
        payload.items = Array.isArray(data) ? data : [];
      }

      await ref.set(payload, { merge: true });
      console.log('[PP_Sync] Upload OK:', collection, collection === 'config' ? '(config)' : `(${payload.items.length} items)`);
      return true;
    } catch (e) {
      console.error('[PP_Sync] Upload ERRO:', collection, e.message);
      // Não é fatal — dados estão seguros no Dexie
      return false;
    } finally {
      this._pendingUploads--;
      if (this._pendingUploads <= 0) {
        this._pendingUploads = 0;
        this._setStatus('synced');
      }
    }
  },

  // ══════════════════════════════════════════════════════════
  // SYNC ALL — Bidirecional (chamado no login e manual)
  // ══════════════════════════════════════════════════════════
  async syncAll() {
    if (!this._enabled || !this.uid || !this.db) {
      console.warn('[PP_Sync] syncAll abortado — não autenticado');
      return false;
    }
    if (this.isSyncing) {
      console.warn('[PP_Sync] syncAll já em andamento');
      return false;
    }

    this.isSyncing = true;
    this._setStatus('syncing');
    console.log('[PP_Sync] ══ Iniciando sync completa ══');

    try {
      // 1. Ler todos os docs da nuvem
      const cloudData = {};
      for (const col of this.COLLECTIONS) {
        const ref = this._docRef(col);
        if (!ref) continue;
        try {
          const snap = await ref.get();
          if (snap.exists) {
            cloudData[col] = snap.data();
          }
        } catch (e) {
          console.warn('[PP_Sync] Erro lendo', col, 'da nuvem:', e.message);
        }
      }

      // 2. Merge bidirecional por coleção
      let hasChanges = false;

      // ── Orçamentos ──
      if (cloudData.orcs && cloudData.orcs.items) {
        const merged = this._mergeArrays(S.orcs, cloudData.orcs.items, 'id');
        if (merged.changed) {
          S.orcs = merged.result;
          S.orcs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
          await dbSaveOrcs();
          hasChanges = true;
          console.log('[PP_Sync] Orcs merged:', merged.stats);
        }
      }

      // ── Clientes ──
      if (cloudData.clientes && cloudData.clientes.items) {
        const merged = this._mergeArrays(S.clientes, cloudData.clientes.items, 'id');
        if (merged.changed) {
          S.clientes = merged.result;
          await dbSaveClientes();
          hasChanges = true;
          console.log('[PP_Sync] Clientes merged:', merged.stats);
        }
      }

      // ── Fornecedores ──
      if (cloudData.fornecedores && cloudData.fornecedores.items) {
        const merged = this._mergeArrays(S.fornecedores, cloudData.fornecedores.items, 'id');
        if (merged.changed) {
          S.fornecedores = merged.result;
          await dbSaveFornecedores();
          hasChanges = true;
          console.log('[PP_Sync] Fornecedores merged:', merged.stats);
        }
      }

      // ── Eventos ──
      if (cloudData.eventos && cloudData.eventos.items) {
        const merged = this._mergeArrays(S.eventos, cloudData.eventos.items, 'id');
        if (merged.changed) {
          S.eventos = merged.result;
          await dbSaveEventos();
          hasChanges = true;
          console.log('[PP_Sync] Eventos merged:', merged.stats);
        }
      }

      // ── Config ── (merge simples por tsEdit)
      if (cloudData.config) {
        const cloudCfg = { ...cloudData.config };
        delete cloudCfg.tsSync;
        const localTs = S.config.tsEdit || 0;
        const cloudTs = cloudCfg.tsEdit || 0;
        if (cloudTs > localTs) {
          S.config = { ...S.config, ...cloudCfg };
          await dbSaveConfig();
          // Atualizar estado derivado
          S.DEFAULT_SERVICES = (S.config.servicos || '').split(',').map(s => s.trim()).filter(Boolean);
          S.statusArr = (S.config.statusList || '').split(',').map(s => s.trim()).filter(Boolean);
          hasChanges = true;
          console.log('[PP_Sync] Config merged (cloud mais recente)');
        }
      }

      // 3. Upload do estado local para a nuvem (garante que cloud está atualizado)
      await this._uploadAll();

      // 4. Registrar timestamp de sync
      this.lastSync = Date.now();
      localStorage.setItem('pp-sync-last', String(this.lastSync));

      console.log('[PP_Sync] ══ Sync completa ══', hasChanges ? '(com mudanças)' : '(sem mudanças)');

      // 5. Atualizar UI se houve mudanças
      if (hasChanges && typeof renderHome === 'function') {
        try { renderHome(); } catch (e) { /* ignore */ }
      }

      this._setStatus('synced');
      return true;
    } catch (e) {
      console.error('[PP_Sync] syncAll ERRO:', e);
      this._setStatus('error');
      return false;
    } finally {
      this.isSyncing = false;
    }
  },

  // ══════════════════════════════════════════════════════════
  // DOWNLOAD ALL — Usado no primeiro login (nuvem → local)
  // ══════════════════════════════════════════════════════════
  async downloadAll() {
    if (!this._enabled || !this.uid || !this.db) return false;

    console.log('[PP_Sync] downloadAll — buscando dados da nuvem...');
    this._setStatus('syncing');

    try {
      const hasLocalData = S.orcs.length > 0 || S.clientes.length > 0;

      if (hasLocalData) {
        // Já tem dados locais — fazer sync bidirecional
        return await this.syncAll();
      }

      // Sem dados locais — puxar tudo da nuvem
      for (const col of this.COLLECTIONS) {
        const ref = this._docRef(col);
        if (!ref) continue;

        try {
          const snap = await ref.get();
          if (!snap.exists) continue;
          const data = snap.data();

          switch (col) {
            case 'orcs':
              if (data.items && data.items.length > 0) {
                S.orcs = data.items;
                S.orcs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
                await dbSaveOrcs();
                console.log('[PP_Sync] Downloaded orcs:', data.items.length);
              }
              break;
            case 'clientes':
              if (data.items && data.items.length > 0) {
                S.clientes = data.items;
                await dbSaveClientes();
                console.log('[PP_Sync] Downloaded clientes:', data.items.length);
              }
              break;
            case 'fornecedores':
              if (data.items && data.items.length > 0) {
                S.fornecedores = data.items;
                await dbSaveFornecedores();
                console.log('[PP_Sync] Downloaded fornecedores:', data.items.length);
              }
              break;
            case 'eventos':
              if (data.items && data.items.length > 0) {
                S.eventos = data.items;
                await dbSaveEventos();
                console.log('[PP_Sync] Downloaded eventos:', data.items.length);
              }
              break;
            case 'config':
              const cfgData = { ...data };
              delete cfgData.tsSync;
              if (Object.keys(cfgData).length > 1) {
                S.config = { ...S.config, ...cfgData };
                await dbSaveConfig();
                S.DEFAULT_SERVICES = (S.config.servicos || '').split(',').map(s => s.trim()).filter(Boolean);
                S.statusArr = (S.config.statusList || '').split(',').map(s => s.trim()).filter(Boolean);
                console.log('[PP_Sync] Downloaded config');
              }
              break;
          }
        } catch (e) {
          console.warn('[PP_Sync] Erro download', col, ':', e.message);
        }
      }

      this.lastSync = Date.now();
      localStorage.setItem('pp-sync-last', String(this.lastSync));

      // Atualizar UI
      if (typeof renderHome === 'function') {
        try { renderHome(); } catch (e) { /* ignore */ }
      }

      this._setStatus('synced');
      console.log('[PP_Sync] downloadAll completo');
      return true;
    } catch (e) {
      console.error('[PP_Sync] downloadAll ERRO:', e);
      this._setStatus('error');
      return false;
    }
  },

  // ── Upload completo (local → nuvem) ────────────────────
  async _uploadAll() {
    const promises = [];

    promises.push(this.upload('orcs', S.orcs));
    promises.push(this.upload('clientes', S.clientes));
    promises.push(this.upload('fornecedores', S.fornecedores));
    promises.push(this.upload('eventos', S.eventos));
    promises.push(this.upload('config', S.config));

    await Promise.allSettled(promises);
    console.log('[PP_Sync] _uploadAll completo');
  },

  // ══════════════════════════════════════════════════════════
  // MERGE — Last Write Wins por registro
  // ══════════════════════════════════════════════════════════
  _mergeArrays(localArr, cloudArr, idField) {
    const localMap = new Map();
    const result = [];
    let added = 0, updated = 0;
    let changed = false;

    // Indexar todos os locais
    localArr.forEach(item => {
      const key = String(item[idField] || '');
      if (key) localMap.set(key, item);
    });

    // Processar itens da nuvem
    cloudArr.forEach(cloudItem => {
      const key = String(cloudItem[idField] || '');
      if (!key) return;

      const localItem = localMap.get(key);
      if (!localItem) {
        // Novo item da nuvem — adicionar
        localMap.set(key, cloudItem);
        added++;
        changed = true;
      } else {
        // Existe nos dois — Last Write Wins
        const localTs = localItem.tsEdit || 0;
        const cloudTs = cloudItem.tsEdit || 0;
        if (cloudTs > localTs) {
          localMap.set(key, cloudItem);
          updated++;
          changed = true;
        }
      }
    });

    // Montar resultado (manter ordem)
    localMap.forEach(item => result.push(item));

    return {
      result,
      changed,
      stats: `added=${added}, updated=${updated}, total=${result.length}`
    };
  },

  // ── Status visual ──────────────────────────────────────
  _setStatus(state) {
    // Usa o ícone de sync do header já existente
    const icon = document.getElementById('hdr-sync-icon');
    const btn = document.getElementById('hdr-sync-btn');
    if (!icon || !btn) return;

    switch (state) {
      case 'syncing':
        btn.style.borderColor = 'var(--am)';
        icon.style.animation = 'spin 1s linear infinite';
        icon.style.color = 'var(--am)';
        break;
      case 'synced':
        btn.style.borderColor = 'var(--gn)';
        icon.style.animation = 'none';
        icon.style.color = 'var(--gn)';
        // Reset visual após 3s
        setTimeout(() => {
          if (!this.isSyncing) {
            btn.style.borderColor = '';
            icon.style.color = '';
          }
        }, 3000);
        break;
      case 'error':
        btn.style.borderColor = 'var(--rd)';
        icon.style.animation = 'none';
        icon.style.color = 'var(--rd)';
        break;
      case 'offline':
        btn.style.borderColor = 'var(--ink3)';
        icon.style.animation = 'none';
        icon.style.color = 'var(--ink3)';
        break;
    }
  }
};

// Auto-inicializar se dbFS estiver disponível
if (typeof dbFS !== 'undefined') {
  PP_Sync.init(dbFS);
}
