/**
 * db-sqlite.js — Camada SQLite nativa via @capacitor-community/sqlite
 * Usado apenas quando rodando como app Android nativo (Capacitor).
 * Requer que o plugin esteja registrado no MainActivity.java.
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let _conn = null;

const DB_NAME    = 'pintorplus';
const DB_VERSION = 1;

// ─── DDL ─────────────────────────────────────────────────────────────────────

const DDL = `
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orcs (
  id      TEXT PRIMARY KEY,
  ts      INTEGER,
  ts_edit INTEGER,
  status  TEXT,
  data    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orcs_ts ON orcs(ts DESC);

CREATE TABLE IF NOT EXISTS clientes (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome    TEXT,
  tel     TEXT,
  ts_edit INTEGER,
  data    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);

CREATE TABLE IF NOT EXISTS fornecedores (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome    TEXT,
  ts_edit INTEGER,
  data    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos (
  id   INTEGER PRIMARY KEY,
  dat  TEXT,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  orc_id    TEXT NOT NULL,
  item_idx  INTEGER NOT NULL,
  photo_idx INTEGER NOT NULL,
  filename  TEXT,
  annotated INTEGER DEFAULT 0,
  data_url  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_orc ON photos(orc_id);
`;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  if (_conn) return _conn;
  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  _conn = isConn
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);

  await _conn.open();
  await _conn.execute(DDL);
  return _conn;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function run(sql, values = []) {
  const c = await init();
  return c.run(sql, values);
}

async function query(sql, values = []) {
  const c = await init();
  const res = await c.query(sql, values);
  return res.values || [];
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const SQLiteDB = {
  // --- Config ---
  async getConfig() {
    const rows = await query('SELECT value FROM config WHERE key = ?', ['pp-config']);
    return rows.length ? JSON.parse(rows[0].value) : null;
  },
  async saveConfig(cfg) {
    await run('INSERT OR REPLACE INTO config(key,value) VALUES(?,?)', ['pp-config', JSON.stringify(cfg)]);
  },

  // --- Orçamentos ---
  async getOrcs() {
    const rows = await query('SELECT data FROM orcs ORDER BY ts DESC');
    return rows.map(r => JSON.parse(r.data));
  },
  async saveOrcs(orcs) {
    const c = await init();
    await c.execute('DELETE FROM orcs');
    for (const o of orcs) {
      await c.run(
        'INSERT OR REPLACE INTO orcs(id,ts,ts_edit,status,data) VALUES(?,?,?,?,?)',
        [o.id, o.ts || 0, o.tsEdit || 0, o.status || '', JSON.stringify(o)]
      );
    }
  },
  async saveOrc(orc) {
    await run(
      'INSERT OR REPLACE INTO orcs(id,ts,ts_edit,status,data) VALUES(?,?,?,?,?)',
      [orc.id, orc.ts || 0, orc.tsEdit || 0, orc.status || '', JSON.stringify(orc)]
    );
  },
  async deleteOrc(id) {
    await run('DELETE FROM orcs WHERE id = ?', [id]);
  },

  // --- Clientes ---
  async getClientes() {
    const rows = await query('SELECT data FROM clientes ORDER BY nome');
    return rows.map(r => JSON.parse(r.data));
  },
  async saveClientes(clientes) {
    const c = await init();
    await c.execute('DELETE FROM clientes');
    for (const cl of clientes) {
      await c.run(
        'INSERT INTO clientes(nome,tel,ts_edit,data) VALUES(?,?,?,?)',
        [cl.nome || '', cl.tel || '', cl.tsEdit || 0, JSON.stringify(cl)]
      );
    }
  },

  // --- Fornecedores ---
  async getFornecedores() {
    const rows = await query('SELECT data FROM fornecedores ORDER BY nome');
    return rows.map(r => JSON.parse(r.data));
  },
  async saveFornecedores(fornecedores) {
    const c = await init();
    await c.execute('DELETE FROM fornecedores');
    for (const f of fornecedores) {
      await c.run(
        'INSERT INTO fornecedores(nome,ts_edit,data) VALUES(?,?,?)',
        [f.nome || '', f.tsEdit || 0, JSON.stringify(f)]
      );
    }
  },

  // --- Eventos ---
  async getEventos() {
    const rows = await query('SELECT data FROM eventos');
    return rows.map(r => JSON.parse(r.data));
  },
  async saveEventos(eventos) {
    const c = await init();
    await c.execute('DELETE FROM eventos');
    for (const ev of eventos) {
      await c.run(
        'INSERT OR REPLACE INTO eventos(id,dat,data) VALUES(?,?,?)',
        [ev.id, ev.dat || '', JSON.stringify(ev)]
      );
    }
  },

  // --- Fotos ---
  async savePhoto(orcId, itemIdx, photoIdx, dataUrl, filename, annotated) {
    const res = await run(
      'INSERT OR REPLACE INTO photos(orc_id,item_idx,photo_idx,data_url,filename,annotated) VALUES(?,?,?,?,?,?)',
      [orcId, itemIdx, photoIdx, dataUrl, filename || '', annotated ? 1 : 0]
    );
    return res.changes?.lastId;
  },
  async getPhotos(orcId) {
    return query('SELECT * FROM photos WHERE orc_id = ? ORDER BY item_idx, photo_idx', [orcId]);
  },
  async deletePhotos(orcId) {
    await run('DELETE FROM photos WHERE orc_id = ?', [orcId]);
  },

  // --- Migração do localStorage ---
  async migrateFromLocalStorage() {
    const rows = await query("SELECT value FROM config WHERE key = 'pp-sqlite-migrated-v1'");
    if (rows.length) return;

    console.log('[SQLiteDB] Iniciando migração do localStorage...');
    const cfg  = _lsRead('pp-config', null);
    const orcs = _lsRead('pp-orcs', []);
    const cls  = _lsRead('pp-clientes', []);
    const forn = _lsRead('pp-fornecedores', []);
    const evts = _lsRead('pp-eventos', []);

    if (cfg)        await SQLiteDB.saveConfig(cfg);
    if (orcs.length) await SQLiteDB.saveOrcs(orcs);
    if (cls.length)  await SQLiteDB.saveClientes(cls);
    if (forn.length) await SQLiteDB.saveFornecedores(forn);
    if (evts.length) await SQLiteDB.saveEventos(evts);

    await run("INSERT OR REPLACE INTO config(key,value) VALUES('pp-sqlite-migrated-v1','1')");
    console.log('[SQLiteDB] Migração concluída.');
  },

  async isAvailable() {
    try {
      const res = await CapacitorSQLite.checkPermissions();
      return res.readPermission === 'granted' || res.readPermission === 'prompt';
    } catch { return false; }
  },

  async close() {
    if (_conn) { await sqlite.closeConnection(DB_NAME, false); _conn = null; }
  },
};

function _lsRead(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
