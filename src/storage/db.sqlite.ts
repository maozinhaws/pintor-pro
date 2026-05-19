import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  LEGACY_LOCAL_STORAGE_KEYS,
  LEGACY_SESSION_STORAGE_KEYS,
  STORAGE_DB_NAME,
  STORAGE_SCHEMA_VERSION,
} from './schema';
import type {
  AppStorage,
  BaseRepository,
  ConfigRepository,
  DomainSnapshot,
  FeedbackReport,
  MediaRecord,
  SyncQueueRecord,
} from './types';
import type { Foto, Recibo } from '../types';

type SQLiteValue = string | number | null;
type SQLiteRow = Record<string, unknown>;

interface SQLiteQueryResult {
  values?: SQLiteRow[];
}

interface CapacitorSQLitePlugin {
  createConnection(options: {
    database: string;
    encrypted: boolean;
    mode: string;
    version: number;
    readonly: boolean;
  }): Promise<void>;
  open(options: { database: string; readonly: boolean }): Promise<void>;
  execute(options: { database: string; statements: string; transaction: boolean }): Promise<void>;
  run(options: {
    database: string;
    statement: string;
    values?: SQLiteValue[];
    transaction: boolean;
  }): Promise<void>;
  query(options: { database: string; statement: string; values?: SQLiteValue[] }): Promise<SQLiteQueryResult>;
  closeConnection(options: { database: string; readonly: boolean }): Promise<void>;
}

interface ColumnMapper<T> {
  name: string;
  value(record: T): SQLiteValue;
}

const CapacitorSQLite = registerPlugin<CapacitorSQLitePlugin>('CapacitorSQLite');

export const SQLITE_MIGRATIONS = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS orcamentos (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL DEFAULT '',
        apelido TEXT NOT NULL DEFAULT '',
        tel TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        cpf TEXT NOT NULL DEFAULT '',
        endereco_json TEXT NOT NULL DEFAULT '{}',
        rooms_json TEXT NOT NULL DEFAULT '[]',
        pgto_json TEXT NOT NULL DEFAULT '[]',
        fmt TEXT NOT NULL DEFAULT '',
        preco REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT '',
        valid TEXT NOT NULL DEFAULT '',
        tipoServico TEXT NOT NULL DEFAULT '',
        inicio TEXT NOT NULL DEFAULT '',
        obs TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL DEFAULT '',
        ts INTEGER NOT NULL DEFAULT 0,
        tsEdit INTEGER NOT NULL DEFAULT 0,
        rascunho INTEGER NOT NULL DEFAULT 0,
        isFlashDraft INTEGER NOT NULL DEFAULT 0,
        deletedAt INTEGER,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL DEFAULT '',
        apelido TEXT NOT NULL DEFAULT '',
        tel TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        cpf TEXT NOT NULL DEFAULT '',
        endereco_json TEXT NOT NULL DEFAULT '{}',
        ts INTEGER NOT NULL DEFAULT 0,
        deletedAt INTEGER,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS fornecedores (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL DEFAULT '',
        tel TEXT NOT NULL DEFAULT '',
        servico TEXT NOT NULL DEFAULT '',
        obs TEXT NOT NULL DEFAULT '',
        cat TEXT NOT NULL DEFAULT '',
        ts INTEGER NOT NULL DEFAULT 0,
        deletedAt INTEGER,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS eventos (
        id TEXT PRIMARY KEY NOT NULL,
        nome TEXT NOT NULL DEFAULT '',
        data TEXT NOT NULL DEFAULT '',
        hora TEXT NOT NULL DEFAULT '',
        obs TEXT NOT NULL DEFAULT '',
        repeat TEXT NOT NULL DEFAULT 'none',
        orcId TEXT,
        alarm INTEGER NOT NULL DEFAULT 0,
        alarmado INTEGER NOT NULL DEFAULT 0,
        ts INTEGER NOT NULL DEFAULT 0,
        deletedAt INTEGER,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY NOT NULL,
        value_json TEXT NOT NULL,
        updatedAt INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY NOT NULL,
        ownerType TEXT NOT NULL,
        ownerId TEXT NOT NULL,
        kind TEXT NOT NULL,
        localUri TEXT NOT NULL,
        thumbUri TEXT,
        mimeType TEXT NOT NULL,
        fileName TEXT NOT NULL,
        size INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        driveFileId TEXT,
        gallerySaved INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT 0,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        lastError TEXT,
        runAfter INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT 0,
        updatedAt INTEGER NOT NULL DEFAULT 0,
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS feedback_reports (
        id TEXT PRIMARY KEY NOT NULL,
        message TEXT NOT NULL,
        email TEXT,
        logs_json TEXT NOT NULL,
        attachments_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt INTEGER NOT NULL DEFAULT 0,
        record_json TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_orcamentos_syncStatus ON orcamentos(syncStatus)`,
      `CREATE INDEX IF NOT EXISTS idx_orcamentos_tsEdit ON orcamentos(tsEdit)`,
      `CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome)`,
      `CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome)`,
      `CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data)`,
      `CREATE INDEX IF NOT EXISTS idx_media_owner ON media(ownerType, ownerId)`,
      `CREATE INDEX IF NOT EXISTS idx_media_syncStatus ON media(syncStatus)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_status_runAfter ON sync_queue(status, runAfter)`,
      `CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_reports(status)`,
      // Tabelas novas v2
      `CREATE TABLE IF NOT EXISTS fotos (
        id TEXT PRIMARY KEY NOT NULL,
        orcamentoId TEXT NOT NULL,
        itemId TEXT,
        blob BLOB NOT NULL,
        criadoEm INTEGER NOT NULL DEFAULT 0,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS recibos (
        id TEXT PRIMARY KEY NOT NULL,
        orcamentoId TEXT NOT NULL,
        valor REAL NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT '',
        formaPagamento TEXT NOT NULL DEFAULT '',
        observacao TEXT,
        pago INTEGER NOT NULL DEFAULT 0,
        criadoEm INTEGER NOT NULL DEFAULT 0,
        deletedAt INTEGER,
        syncStatus TEXT NOT NULL DEFAULT 'local',
        record_json TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_fotos_orcamentoId ON fotos(orcamentoId)`,
      `CREATE INDEX IF NOT EXISTS idx_fotos_itemId ON fotos(itemId)`,
      `CREATE INDEX IF NOT EXISTS idx_recibos_orcamentoId ON recibos(orcamentoId)`,
    ],
  },
] as const;

function stringify(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseRecord<T>(row: SQLiteRow): T {
  const raw = row.record_json;
  if (typeof raw !== 'string') {
    throw new Error('SQLite row is missing record_json');
  }
  return JSON.parse(raw) as T;
}

function boolToInt(value: unknown): number {
  return value ? 1 : 0;
}

function readString(record: object, key: string): string {
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function readNumber(record: object, key: string): number {
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}

function readNullableNumber(record: object, key: string): number | null {
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : null;
}

function readNullableString(record: object, key: string): string | null {
  const value = (record as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function enderecoJson(record: object): string {
  const values = record as Record<string, unknown>;
  return stringify({
    cep: values.cep ?? '',
    logradouro: values.logradouro ?? '',
    numero: values.numero ?? '',
    comp: values.comp ?? '',
    bairro: values.bairro ?? '',
    cidade: values.cidade ?? '',
    end: values.end ?? '',
  });
}

function withId<T extends { id?: string; ts?: number; nome?: string; tel?: string }>(record: T, prefix: string, index: number): T & { id: string } {
  const stable = record.id || [prefix, record.ts, record.tel, record.nome, index].filter(Boolean).join('-');
  return { ...record, id: stable || `${prefix}-${Date.now()}-${index}` };
}

function purgeLegacyBrowserStorage(): void {
  if (typeof localStorage !== 'undefined') {
    LEGACY_LOCAL_STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
  }
  if (typeof sessionStorage !== 'undefined') {
    LEGACY_SESSION_STORAGE_KEYS.forEach(key => {
      try { sessionStorage.removeItem(key); } catch {}
    });
  }
}

class AndroidSQLiteConnection {
  private opened = false;

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Android SQLite storage requires a native Capacitor runtime');
    }

    try {
      await CapacitorSQLite.createConnection({
        database: STORAGE_DB_NAME,
        encrypted: false,
        mode: 'no-encryption',
        version: STORAGE_SCHEMA_VERSION,
        readonly: false,
      });
    } catch {
      // createConnection fails when Capacitor already has an open connection.
    }

    await CapacitorSQLite.open({ database: STORAGE_DB_NAME, readonly: false });
    this.opened = true;
  }

  async close(): Promise<void> {
    if (!this.opened) return;
    await CapacitorSQLite.closeConnection({ database: STORAGE_DB_NAME, readonly: false });
    this.opened = false;
  }

  async execute(statements: string[]): Promise<void> {
    await CapacitorSQLite.execute({
      database: STORAGE_DB_NAME,
      statements: statements.join(';\n'),
      transaction: true,
    });
  }

  async run(statement: string, values: SQLiteValue[] = []): Promise<void> {
    await CapacitorSQLite.run({
      database: STORAGE_DB_NAME,
      statement,
      values,
      transaction: true,
    });
  }

  async query(statement: string, values: SQLiteValue[] = []): Promise<SQLiteRow[]> {
    const result = await CapacitorSQLite.query({ database: STORAGE_DB_NAME, statement, values });
    return result.values ?? [];
  }
}

function createSQLiteRepository<T extends { id: string }>(
  connection: AndroidSQLiteConnection,
  tableName: string,
  mappedColumns: ColumnMapper<T>[] = [],
): BaseRepository<T> {
  const columns = ['id', 'record_json', ...mappedColumns.map(column => column.name)];
  const placeholders = columns.map(() => '?').join(', ');
  const updates = columns
    .filter(column => column !== 'id')
    .map(column => `${column} = excluded.${column}`)
    .join(', ');
  const upsertStatement = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;

  function valuesFor(record: T): SQLiteValue[] {
    return [
      record.id,
      stringify(record),
      ...mappedColumns.map(column => column.value(record)),
    ];
  }

  return {
    async getAll() {
      const rows = await connection.query(`SELECT record_json FROM ${tableName}`);
      return rows.map(row => parseRecord<T>(row));
    },
    async getById(id) {
      const rows = await connection.query(`SELECT record_json FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
      return rows[0] ? parseRecord<T>(rows[0]) : null;
    },
    async upsert(record) {
      await connection.run(upsertStatement, valuesFor(record));
    },
    async bulkUpsert(records) {
      for (const record of records) {
        await connection.run(upsertStatement, valuesFor(record));
      }
    },
    async remove(id) {
      await connection.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    },
    async clear() {
      await connection.run(`DELETE FROM ${tableName}`);
    },
  };
}

function createSQLiteConfigRepository(connection: AndroidSQLiteConnection): ConfigRepository {
  const configKey = 'app';
  return {
    async get() {
      const rows = await connection.query('SELECT value_json FROM config WHERE key = ? LIMIT 1', [configKey]);
      const raw = rows[0]?.value_json;
      return typeof raw === 'string' ? JSON.parse(raw) : null;
    },
    async set(config) {
      await connection.run(
        `INSERT INTO config (key, value_json, updatedAt)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updatedAt = excluded.updatedAt`,
        [configKey, stringify(config), Date.now()],
      );
    },
    async clear() {
      await connection.run('DELETE FROM config WHERE key = ?', [configKey]);
    },
  };
}

async function runMigrations(connection: AndroidSQLiteConnection): Promise<void> {
  for (const migration of SQLITE_MIGRATIONS) {
    await connection.execute([...migration.statements]);
  }
  await connection.run(
    `INSERT INTO app_meta (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ['storageVersion', String(STORAGE_SCHEMA_VERSION)],
  );
}

export async function createAndroidSQLiteStorage(): Promise<AppStorage> {
  const connection = new AndroidSQLiteConnection();

  const storage: AppStorage = {
    platform: 'android-sqlite',
    async init() {
      await connection.init();
      await runMigrations(connection);
    },
    async close() {
      await connection.close();
    },
    async purgeLegacyStorage() {
      purgeLegacyBrowserStorage();
    },
    async exportSnapshot(): Promise<DomainSnapshot> {
      const config = await storage.config.get();
      if (!config) throw new Error('Config not initialized');
      return {
        orcamentos: await storage.orcamentos.getAll(),
        clientes: await storage.clientes.getAll(),
        fornecedores: await storage.fornecedores.getAll(),
        eventos: await storage.eventos.getAll(),
        config,
      };
    },
    async importSnapshot(snapshot) {
      await storage.orcamentos.bulkUpsert(snapshot.orcamentos);
      await storage.clientes.bulkUpsert(snapshot.clientes.map((record, index) => withId(record, 'cliente', index)));
      await storage.fornecedores.bulkUpsert(snapshot.fornecedores.map((record, index) => withId(record, 'fornecedor', index)));
      await storage.eventos.bulkUpsert(snapshot.eventos);
      await storage.config.set(snapshot.config);
    },
    orcamentos: createSQLiteRepository(connection, 'orcamentos', [
      { name: 'nome', value: record => readString(record, 'nome') },
      { name: 'apelido', value: record => readString(record, 'apelido') },
      { name: 'tel', value: record => readString(record, 'tel') },
      { name: 'email', value: record => readString(record, 'email') },
      { name: 'cpf', value: record => readString(record, 'cpf') },
      { name: 'endereco_json', value: record => enderecoJson(record) },
      { name: 'rooms_json', value: record => stringify(record.rooms ?? []) },
      { name: 'pgto_json', value: record => stringify(record.pgto ?? []) },
      { name: 'fmt', value: record => readString(record, 'fmt') },
      { name: 'preco', value: record => readNumber(record, 'preco') },
      { name: 'status', value: record => readString(record, 'status') },
      { name: 'valid', value: record => readString(record, 'valid') },
      { name: 'tipoServico', value: record => readString(record, 'tipoServico') },
      { name: 'inicio', value: record => readString(record, 'inicio') },
      { name: 'obs', value: record => readString(record, 'obs') },
      { name: 'date', value: record => readString(record, 'date') },
      { name: 'ts', value: record => readNumber(record, 'ts') },
      { name: 'tsEdit', value: record => readNumber(record, 'tsEdit') },
      { name: 'rascunho', value: record => boolToInt(record.rascunho) },
      { name: 'isFlashDraft', value: record => boolToInt(record.isFlashDraft) },
      { name: 'deletedAt', value: record => readNullableNumber(record, 'deletedAt') },
      { name: 'syncStatus', value: record => readString(record, 'syncStatus') || 'local' },
    ]),
    clientes: createSQLiteRepository(connection, 'clientes', [
      { name: 'nome', value: record => readString(record, 'nome') },
      { name: 'apelido', value: record => readString(record, 'apelido') },
      { name: 'tel', value: record => readString(record, 'tel') },
      { name: 'email', value: record => readString(record, 'email') },
      { name: 'cpf', value: record => readString(record, 'cpf') },
      { name: 'endereco_json', value: record => enderecoJson(record) },
      { name: 'ts', value: record => readNumber(record, 'ts') },
      { name: 'deletedAt', value: record => readNullableNumber(record, 'deletedAt') },
      { name: 'syncStatus', value: record => readString(record, 'syncStatus') || 'local' },
    ]),
    fornecedores: createSQLiteRepository(connection, 'fornecedores', [
      { name: 'nome', value: record => readString(record, 'nome') },
      { name: 'tel', value: record => readString(record, 'tel') },
      { name: 'servico', value: record => readString(record, 'servico') },
      { name: 'obs', value: record => readString(record, 'obs') },
      { name: 'cat', value: record => readString(record, 'cat') },
      { name: 'ts', value: record => readNumber(record, 'ts') },
      { name: 'deletedAt', value: record => readNullableNumber(record, 'deletedAt') },
      { name: 'syncStatus', value: record => readString(record, 'syncStatus') || 'local' },
    ]),
    eventos: createSQLiteRepository(connection, 'eventos', [
      { name: 'nome', value: record => readString(record, 'nome') },
      { name: 'data', value: record => readString(record, 'data') },
      { name: 'hora', value: record => readString(record, 'hora') },
      { name: 'obs', value: record => readString(record, 'obs') },
      { name: 'repeat', value: record => readString(record, 'repeat') || 'none' },
      { name: 'orcId', value: record => readNullableString(record, 'orcId') },
      { name: 'alarm', value: record => boolToInt(record.alarm) },
      { name: 'alarmado', value: record => boolToInt((record as { alarmado?: boolean }).alarmado) },
      { name: 'ts', value: record => readNumber(record, 'ts') },
      { name: 'deletedAt', value: record => readNullableNumber(record, 'deletedAt') },
      { name: 'syncStatus', value: record => readString(record, 'syncStatus') || 'local' },
    ]),
    config: createSQLiteConfigRepository(connection),
    media: createSQLiteRepository<MediaRecord>(connection, 'media', [
      { name: 'ownerType', value: record => record.ownerType },
      { name: 'ownerId', value: record => record.ownerId },
      { name: 'kind', value: record => record.kind },
      { name: 'localUri', value: record => record.localUri },
      { name: 'thumbUri', value: record => record.thumbUri ?? null },
      { name: 'mimeType', value: record => record.mimeType },
      { name: 'fileName', value: record => record.fileName },
      { name: 'size', value: record => record.size },
      { name: 'width', value: record => record.width ?? null },
      { name: 'height', value: record => record.height ?? null },
      { name: 'driveFileId', value: record => record.driveFileId ?? null },
      { name: 'gallerySaved', value: record => boolToInt(record.gallerySaved) },
      { name: 'createdAt', value: record => record.createdAt },
      { name: 'syncStatus', value: record => record.syncStatus },
    ]),
    syncQueue: createSQLiteRepository<SyncQueueRecord>(connection, 'sync_queue', [
      { name: 'type', value: record => record.type },
      { name: 'payload_json', value: record => stringify(record.payload) },
      { name: 'status', value: record => record.status },
      { name: 'attempts', value: record => record.attempts },
      { name: 'lastError', value: record => record.lastError ?? null },
      { name: 'runAfter', value: record => record.runAfter },
      { name: 'createdAt', value: record => record.createdAt },
      { name: 'updatedAt', value: record => record.updatedAt },
    ]),
    feedback: createSQLiteRepository<FeedbackReport>(connection, 'feedback_reports', [
      { name: 'message', value: record => record.message },
      { name: 'email', value: record => record.email ?? null },
      { name: 'logs_json', value: record => stringify(record.logs) },
      { name: 'attachments_json', value: record => stringify(record.attachments) },
      { name: 'status', value: record => record.status },
      { name: 'createdAt', value: record => record.createdAt },
    ]),
    // Novo: repositórios para fotos e recibos
    // Nota: SQLite não suporta BLOB direto, então usamos record_json
    fotos: createSQLiteRepository<any>(connection, 'fotos', [
      { name: 'orcamentoId', value: record => record.orcamentoId },
      { name: 'itemId', value: record => record.itemId ?? null },
      { name: 'criadoEm', value: record => record.criadoEm },
      { name: 'syncStatus', value: record => record.syncStatus || 'local' },
    ]),
    recibos: createSQLiteRepository<any>(connection, 'recibos', [
      { name: 'orcamentoId', value: record => record.orcamentoId },
      { name: 'valor', value: record => record.valor || 0 },
      { name: 'data', value: record => record.data },
      { name: 'formaPagamento', value: record => record.formaPagamento },
      { name: 'observacao', value: record => record.observacao ?? null },
      { name: 'pago', value: record => boolToInt(record.pago) },
      { name: 'criadoEm', value: record => record.criadoEm },
      { name: 'deletedAt', value: record => record.deletedAt ?? null },
      { name: 'syncStatus', value: record => record.syncStatus || 'local' },
    ]),
  };

  return storage;
}
