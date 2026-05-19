/**
 * db-dexie.js — Camada Dexie/IndexedDB para Pintor Plus
 * Replica as mesmas chaves do localStorage, mas com capacidade muito maior.
 * IndexedDB suporta GB vs 5-10MB do localStorage.
 */

import Dexie from 'dexie';

const db = new Dexie('PintorPlusDB');

db.version(1).stores({
  // Armazena par {key, value} para dados simples (config, eventos, etc.)
  keyval: 'key',
  // Orçamentos: indexados por id, ts, status para queries eficientes
  orcs: 'id, ts, tsEdit, status',
  // Clientes e fornecedores: indexados por nome
  clientes:     '++_id, nome, tel, tsEdit',
  fornecedores: '++_id, nome, tsEdit',
  // Eventos: indexados por data
  eventos: 'id, dat',
  // Fotos separadas (evita carregar base64 desnecessariamente)
  photos: '++id, orcId, itemIdx, photoIdx, annotated',
});

// ─── API pública ──────────────────────────────────────────────────────────────

export const DexieDB = {
  // --- Config ---
  async getConfig() {
    const row = await db.keyval.get('pp-config');
    return row ? row.value : null;
  },
  async saveConfig(cfg) {
    await db.keyval.put({ key: 'pp-config', value: cfg });
  },

  // --- Orçamentos ---
  async getOrcs() {
    return db.orcs.orderBy('ts').reverse().toArray();
  },
  async saveOrcs(orcs) {
    await db.transaction('rw', db.orcs, async () => {
      await db.orcs.clear();
      await db.orcs.bulkAdd(orcs);
    });
  },
  async saveOrc(orc) {
    await db.orcs.put(orc);
  },
  async deleteOrc(id) {
    await db.orcs.delete(id);
  },

  // --- Clientes ---
  async getClientes() {
    return db.clientes.orderBy('nome').toArray();
  },
  async saveClientes(clientes) {
    await db.transaction('rw', db.clientes, async () => {
      await db.clientes.clear();
      await db.clientes.bulkAdd(clientes.map(c => ({ ...c })));
    });
  },

  // --- Fornecedores ---
  async getFornecedores() {
    return db.fornecedores.orderBy('nome').toArray();
  },
  async saveFornecedores(fornecedores) {
    await db.transaction('rw', db.fornecedores, async () => {
      await db.fornecedores.clear();
      await db.fornecedores.bulkAdd(fornecedores.map(f => ({ ...f })));
    });
  },

  // --- Eventos ---
  async getEventos() {
    return db.eventos.toArray();
  },
  async saveEventos(eventos) {
    await db.transaction('rw', db.eventos, async () => {
      await db.eventos.clear();
      await db.eventos.bulkAdd(eventos);
    });
  },

  // --- Fotos (armazenamento eficiente separado do orçamento) ---
  async savePhoto(orcId, itemIdx, photoIdx, dataUrl, filename, annotated) {
    return db.photos.put({ orcId, itemIdx, photoIdx, dataUrl, filename, annotated: !!annotated });
  },
  async getPhotos(orcId) {
    return db.photos.where('orcId').equals(orcId).toArray();
  },
  async deletePhotos(orcId) {
    await db.photos.where('orcId').equals(orcId).delete();
  },

  // --- Migração: importa dados do localStorage para Dexie ---
  async migrateFromLocalStorage() {
    const migKey = 'pp-dexie-migrated-v1';
    if (localStorage.getItem(migKey)) return; // já migrado

    console.log('[DexieDB] Iniciando migração do localStorage...');
    const reads = {
      config:      _lsRead('pp-config', null),
      orcs:        _lsRead('pp-orcs', []),
      clientes:    _lsRead('pp-clientes', []),
      fornecedores:_lsRead('pp-fornecedores', []),
      eventos:     _lsRead('pp-eventos', []),
    };

    await db.transaction('rw', [db.keyval, db.orcs, db.clientes, db.fornecedores, db.eventos], async () => {
      if (reads.config)       await db.keyval.put({ key: 'pp-config', value: reads.config });
      if (reads.orcs.length)  await db.orcs.bulkAdd(reads.orcs);
      if (reads.clientes.length)     await db.clientes.bulkAdd(reads.clientes);
      if (reads.fornecedores.length) await db.fornecedores.bulkAdd(reads.fornecedores);
      if (reads.eventos.length)      await db.eventos.bulkAdd(reads.eventos);
    });

    localStorage.setItem(migKey, '1');
    console.log('[DexieDB] Migração concluída.');
  },

  // --- Verificação de saúde ---
  async isAvailable() {
    try { await db.keyval.get('__test__'); return true; } catch { return false; }
  },

  db, // expõe instância para uso avançado se necessário
};

function _lsRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
