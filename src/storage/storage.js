/**
 * storage.js — Abstração de storage para Pintor Plus
 *
 * Auto-detecta o backend correto:
 *   - Android nativo (Capacitor) → SQLite
 *   - Browser / PWA              → Dexie (IndexedDB)
 *
 * Uso:
 *   import { Storage } from './storage/storage.js';
 *   await Storage.init();
 *   const orcs = await Storage.getOrcs();
 *   await Storage.saveOrcs(orcs);
 */

import { DexieDB } from './db-dexie.js';
import { SQLiteDB } from './db-sqlite.js';

function isNativeAndroid() {
  return !!(window.Capacitor?.isNativePlatform?.());
}

let _backend = null;
let _ready   = false;

export const Storage = {
  /**
   * Inicializa o backend correto e roda migração do localStorage se necessário.
   * Deve ser chamado uma vez no início do app (DOMContentLoaded).
   */
  async init() {
    if (_ready) return;

    if (isNativeAndroid()) {
      const ok = await SQLiteDB.isAvailable();
      _backend = ok ? SQLiteDB : DexieDB;
      console.log('[Storage] Backend: SQLite');
    } else {
      const ok = await DexieDB.isAvailable();
      _backend = ok ? DexieDB : null;
      console.log('[Storage] Backend: Dexie/IndexedDB');
    }

    if (!_backend) {
      console.warn('[Storage] Nenhum backend disponível — usando localStorage como fallback');
      _backend = LocalStorageFallback;
    }

    // Migrar dados existentes do localStorage para o backend selecionado
    await _backend.migrateFromLocalStorage();
    _ready = true;
  },

  // ─── Config ────────────────────────────────────────────────────────────────
  async getConfig()     { return _backend.getConfig(); },
  async saveConfig(cfg) {
    await _backend.saveConfig(cfg);
    _lsWrite('pp-config', cfg); // mantém localStorage em sync para compatibilidade
  },

  // ─── Orçamentos ────────────────────────────────────────────────────────────
  async getOrcs()         { return _backend.getOrcs(); },
  async saveOrcs(orcs)    {
    await _backend.saveOrcs(orcs);
    _lsWrite('pp-orcs', orcs);
  },
  async saveOrc(orc)      { return _backend.saveOrc(orc); },
  async deleteOrc(id)     { return _backend.deleteOrc(id); },

  // ─── Clientes ──────────────────────────────────────────────────────────────
  async getClientes()          { return _backend.getClientes(); },
  async saveClientes(clientes) {
    await _backend.saveClientes(clientes);
    _lsWrite('pp-clientes', clientes);
  },

  // ─── Fornecedores ──────────────────────────────────────────────────────────
  async getFornecedores()              { return _backend.getFornecedores(); },
  async saveFornecedores(fornecedores) {
    await _backend.saveFornecedores(fornecedores);
    _lsWrite('pp-fornecedores', fornecedores);
  },

  // ─── Eventos ───────────────────────────────────────────────────────────────
  async getEventos()         { return _backend.getEventos(); },
  async saveEventos(eventos) {
    await _backend.saveEventos(eventos);
    _lsWrite('pp-eventos', eventos);
  },

  // ─── Fotos (IndexedDB/SQLite — não vai para localStorage) ─────────────────
  async savePhoto(orcId, itemIdx, photoIdx, dataUrl, filename, annotated) {
    return _backend.savePhoto(orcId, itemIdx, photoIdx, dataUrl, filename, annotated);
  },
  async getPhotos(orcId)  { return _backend.getPhotos(orcId); },
  async deletePhotos(orcId) { return _backend.deletePhotos(orcId); },

  // ─── Diagnóstico ───────────────────────────────────────────────────────────
  get backendName() {
    if (_backend === SQLiteDB)           return 'SQLite';
    if (_backend === DexieDB)            return 'Dexie';
    if (_backend === LocalStorageFallback) return 'localStorage';
    return 'não inicializado';
  },
  get isReady() { return _ready; },
};

// ─── localStorage fallback (quando IndexedDB e SQLite falham) ────────────────
const LocalStorageFallback = {
  async getConfig()        { return _lsRead('pp-config', null); },
  async saveConfig(cfg)    { _lsWrite('pp-config', cfg); },
  async getOrcs()          { return _lsRead('pp-orcs', []); },
  async saveOrcs(orcs)     { _lsWrite('pp-orcs', orcs); },
  async saveOrc(orc) {
    const orcs = _lsRead('pp-orcs', []);
    const i = orcs.findIndex(o => o.id === orc.id);
    if (i >= 0) orcs[i] = orc; else orcs.unshift(orc);
    _lsWrite('pp-orcs', orcs);
  },
  async deleteOrc(id) {
    const orcs = _lsRead('pp-orcs', []).filter(o => o.id !== id);
    _lsWrite('pp-orcs', orcs);
  },
  async getClientes()              { return _lsRead('pp-clientes', []); },
  async saveClientes(c)            { _lsWrite('pp-clientes', c); },
  async getFornecedores()          { return _lsRead('pp-fornecedores', []); },
  async saveFornecedores(f)        { _lsWrite('pp-fornecedores', f); },
  async getEventos()               { return _lsRead('pp-eventos', []); },
  async saveEventos(e)             { _lsWrite('pp-eventos', e); },
  async savePhoto()                { return null; },
  async getPhotos()                { return []; },
  async deletePhotos()             {},
  async migrateFromLocalStorage()  {},
  async isAvailable()              { return true; },
};

function _lsRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function _lsWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {
    console.warn('[Storage] localStorage cheio para', key, e.message);
  }
}
