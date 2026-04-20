// ╔══════════════════════════════════════════════════════════╗
// ║  DATABASE — Dexie.js (IndexedDB) para Pintor Plus     ║
// ╚══════════════════════════════════════════════════════════╝

// Define the Dexie database
const PP_DB = new Dexie('PintorPlusDB');

PP_DB.version(1).stores({
  orcs: '++id, nome, status, ts, tsEdit, tel',
  clientes: '++id, nome, tel, email, tsEdit',
  fornecedores: '++id, nome, tel, cat, tsEdit',
  eventos: '++id, tit, dat, hora, tsEdit',
  config: 'id' // singleton, id = 'main'
});

// ── Sync S state with IndexedDB ───────────────────────────────
async function dbLoadAll() {
  try {
    const [orcs, clientes, fornecedores, eventos, cfgArr] = await Promise.all([
      PP_DB.orcs.toArray(),
      PP_DB.clientes.toArray(),
      PP_DB.fornecedores.toArray(),
      PP_DB.eventos.toArray(),
      PP_DB.config.where('id').equals('main').toArray()
    ]);

    // Map IndexedDB records to S format
    S.orcs = orcs.map(o => ({
      id: String(o.id),
      nome: o.nome || '',
      apelido: o.apelido || '',
      tel: o.tel || '',
      email: o.email || '',
      cpf: o.cpf || '',
      cep: o.cep || '',
      logradouro: o.logradouro || '',
      numero: o.numero || '',
      comp: o.comp || '',
      bairro: o.bairro || '',
      cidade: o.cidade || '',
      end: o.end || '',
      pagNome: o.pagNome || '',
      pagTel: o.pagTel || '',
      pagEnd: o.pagEnd || '',
      pagador: o.pagador || false,
      rooms: o.rooms || [],
      pgto: o.pgto || [],
      fmt: o.fmt || 'completo',
      preco: o.preco || 0,
      status: o.status || 'Pendente',
      valid: o.valid || '15',
      tipoServico: o.tipoServico || '',
      inicio: o.inicio || '',
      obs: o.obs || '',
      date: o.date || '',
      ts: o.ts || Date.now(),
      tsEdit: o.tsEdit || Date.now()
    }));

    S.clientes = clientes.map(c => ({
      id: c.id,
      nome: c.nome || '',
      apelido: c.apelido || '',
      tel: c.tel || '',
      email: c.email || '',
      end: c.end || '',
      cpf: c.cpf || '',
      tsEdit: c.tsEdit || Date.now(),
      notas: c.notas || ''
    }));

    S.fornecedores = fornecedores.map(f => ({
      id: f.id,
      nome: f.nome || '',
      tel: f.tel || '',
      cat: f.cat || '',
      tsEdit: f.tsEdit || Date.now()
    }));

    S.eventos = eventos.map(e => ({
      id: e.id,
      tit: e.tit || '',
      dat: e.dat || '',
      hora: e.hora || '',
      avisoVal: e.avisoVal || '',
      avisoUnid: e.avisoUnid || '',
      repete: e.repete || '',
      alarmado: e.alarmado || false,
      tsEdit: e.tsEdit || Date.now()
    }));

    if (cfgArr && cfgArr.length > 0) {
      S.config = { ...defCfg, ...cfgArr[0] };
      // Remove the id field from config
      delete S.config.id;
    }

    // Update derived state
    S.DEFAULT_SERVICES = (S.config.servicos || defCfg.servicos).split(',').map(s => s.trim()).filter(Boolean);
    S.statusArr = (S.config.statusList || defCfg.statusList).split(',').map(s => s.trim()).filter(Boolean);

    if (S.config.acessibilidade) document.body.classList.add('acessivel');

    console.log('[DB] Data loaded from IndexedDB:', {
      orcs: S.orcs.length,
      clientes: S.clientes.length,
      fornecedores: S.fornecedores.length,
      eventos: S.eventos.length
    });

    return true;
  } catch (e) {
    console.error('[DB] Error loading data:', e);
    return false;
  }
}

// ── Save functions (async, fire-and-forget with optional await) ──
async function dbSaveOrcs() {
  try {
    // Clear and repopulate
    await PP_DB.orcs.clear();
    const records = S.orcs.map(o => ({
      ...o,
      id: o.id ? parseInt(o.id) : undefined
    }));
    await PP_DB.orcs.bulkPut(records);
    console.log('[DB] Orçamentos salvos:', records.length);
  } catch (e) {
    console.error('[DB] Error saving orcs:', e);
    // Fallback to localStorage
    _saveOrcsLegacy();
  }
}

async function dbSaveClientes() {
  try {
    await PP_DB.clientes.clear();
    const records = S.clientes.map(c => ({
      nome: c.nome || '',
      apelido: c.apelido || '',
      tel: c.tel || '',
      email: c.email || '',
      end: c.end || '',
      cpf: c.cpf || '',
      tsEdit: c.tsEdit || Date.now(),
      notas: c.notas || ''
    }));
    await PP_DB.clientes.bulkPut(records);
  } catch (e) {
    console.error('[DB] Error saving clientes:', e);
    _saveClientesLegacy();
  }
}

async function dbSaveFornecedores() {
  try {
    await PP_DB.fornecedores.clear();
    const records = S.fornecedores.map(f => ({
      nome: f.nome || '',
      tel: f.tel || '',
      cat: f.cat || '',
      tsEdit: f.tsEdit || Date.now()
    }));
    await PP_DB.fornecedores.bulkPut(records);
  } catch (e) {
    console.error('[DB] Error saving fornecedores:', e);
    _saveFornecedoresLegacy();
  }
}

async function dbSaveEventos() {
  try {
    await PP_DB.eventos.clear();
    const records = S.eventos.map(e => ({
      tit: e.tit || '',
      dat: e.dat || '',
      hora: e.hora || '',
      avisoVal: e.avisoVal || '',
      avisoUnid: e.avisoUnid || '',
      repete: e.repete || '',
      alarmado: e.alarmado || false,
      tsEdit: e.tsEdit || Date.now()
    }));
    await PP_DB.eventos.bulkPut(records);
  } catch (e) {
    console.error('[DB] Error saving eventos:', e);
    _saveEventosLegacy();
  }
}

async function dbSaveConfig() {
  try {
    await PP_DB.config.put({ id: 'main', ...S.config });
  } catch (e) {
    console.error('[DB] Error saving config:', e);
    _Vault.save('pp-config', JSON.stringify(S.config));
  }
}

// ── Legacy fallback functions ──
function _saveOrcsLegacy() {
  const json = JSON.stringify(S.orcs);
  try {
    _Vault.save('pp-orcs', json);
  } catch (e) {
    console.error('_saveOrcsLegacy: erro', e);
  }
}

function _saveClientesLegacy() {
  const json = JSON.stringify(S.clientes);
  try {
    _Vault.save('pp-clientes', json);
  } catch (e) {
    console.error('_saveClientesLegacy: erro', e);
  }
}

function _saveFornecedoresLegacy() {
  const json = JSON.stringify(S.fornecedores);
  try {
    _Vault.save('pp-fornecedores', json);
  } catch (e) {
    console.error('_saveFornecedoresLegacy: erro', e);
  }
}

function _saveEventosLegacy() {
  const json = JSON.stringify(S.eventos);
  try {
    _Vault.save('pp-eventos', json);
  } catch (e) {
    console.error('_saveEventosLegacy: erro', e);
  }
}

// ── Data migration from localStorage to IndexedDB ──
async function dbMigrateFromLocalStorage() {
  try {
    const keys = ['pp-orcs', 'pp-clientes', 'pp-fornecedores', 'pp-config', 'pp-eventos'];
    
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      // Try to parse (may be encrypted)
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        // Encrypted data - skip for now, Vault will handle it
        continue;
      }
      
      if (!data || (Array.isArray(data) && data.length === 0)) continue;
      
      console.log('[DB] Migrating:', key, Array.isArray(data) ? data.length : 'object');
      
      switch (key) {
        case 'pp-orcs':
          if (Array.isArray(data) && data.length > 0) {
            const count = await PP_DB.orcs.count();
            if (count === 0) {
              const records = data.map(o => ({ ...o, id: o.id ? parseInt(o.id) : undefined }));
              await PP_DB.orcs.bulkPut(records);
              console.log('[DB] Migrated orcs:', data.length);
            }
          }
          break;
        case 'pp-clientes':
          if (Array.isArray(data) && data.length > 0) {
            const count = await PP_DB.clientes.count();
            if (count === 0) {
              await PP_DB.clientes.bulkPut(data);
              console.log('[DB] Migrated clientes:', data.length);
            }
          }
          break;
        case 'pp-fornecedores':
          if (Array.isArray(data) && data.length > 0) {
            const count = await PP_DB.fornecedores.count();
            if (count === 0) {
              await PP_DB.fornecedores.bulkPut(data);
              console.log('[DB] Migrated fornecedores:', data.length);
            }
          }
          break;
        case 'pp-eventos':
          if (Array.isArray(data) && data.length > 0) {
            const count = await PP_DB.eventos.count();
            if (count === 0) {
              await PP_DB.eventos.bulkPut(data);
              console.log('[DB] Migrated eventos:', data.length);
            }
          }
          break;
        case 'pp-config':
          if (typeof data === 'object' && data !== null) {
            const count = await PP_DB.config.count();
            if (count === 0) {
              await PP_DB.config.put({ id: 'main', ...data });
              console.log('[DB] Migrated config');
            }
          }
          break;
      }
    }
    
    console.log('[DB] Migration complete');
    return true;
  } catch (e) {
    console.error('[DB] Migration failed:', e);
    return false;
  }
}

// ── Export full backup (for Google Drive) ──
async function dbExportBackup() {
  return {
    versao: 2,
    dataGeracao: new Date().toISOString(),
    config: S.config,
    orcs: S.orcs,
    clientes: S.clientes,
    fornecedores: S.fornecedores,
    eventos: S.eventos
  };
}

// ── Import backup (from Google Drive or file) ──
async function dbImportBackup(data, mode = 'replace') {
  try {
    if (mode === 'replace') {
      S.config = data.config || defCfg;
      S.orcs = data.orcs || [];
      S.clientes = data.clientes || [];
      S.fornecedores = data.fornecedores || [];
      S.eventos = data.eventos || [];
      
      // Save to IndexedDB
      await dbSaveConfig();
      await dbSaveOrcs();
      await dbSaveClientes();
      await dbSaveFornecedores();
      await dbSaveEventos();
      
    } else if (mode === 'merge') {
      const importedOrcs = data.orcs || [];
      let updatedCount = 0;
      let addedCount = 0;
      
      importedOrcs.forEach(impOrc => {
        const idx = S.orcs.findIndex(o => o.id === impOrc.id);
        if (idx >= 0) {
          if ((impOrc.tsEdit || 0) > (S.orcs[idx].tsEdit || 0)) {
            S.orcs[idx] = impOrc;
            updatedCount++;
          }
        } else {
          S.orcs.push(impOrc);
          addedCount++;
        }
      });
      
      S.orcs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      
      // Save to IndexedDB
      await dbSaveOrcs();
    }
    
    // Update derived state
    S.DEFAULT_SERVICES = (S.config.servicos || defCfg.servicos).split(',').map(s => s.trim()).filter(Boolean);
    S.statusArr = (S.config.statusList || defCfg.statusList).split(',').map(s => s.trim()).filter(Boolean);
    
    return true;
  } catch (e) {
    console.error('[DB] Import backup failed:', e);
    return false;
  }
}

// ── Initialize database ──
async function dbInit() {
  try {
    await PP_DB.open();
    console.log('[DB] IndexedDB opened successfully');
    
    // Check if we have data
    const orcCount = await PP_DB.orcs.count();
    
    if (orcCount === 0) {
      // Try migration from localStorage
      console.log('[DB] No data in IndexedDB, attempting migration...');
      await dbMigrateFromLocalStorage();
    }
    
    // Load data into S
    await dbLoadAll();
    
    return true;
  } catch (e) {
    console.error('[DB] Initialization failed:', e);
    return false;
  }
}
