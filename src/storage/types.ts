import type { Cliente, Config, Evento, Fornecedor, Orcamento, Foto, Recibo } from '../types';

export type StoragePlatform = 'web-dexie' | 'android-sqlite';

export type SyncStatus = 'local' | 'queued' | 'synced' | 'error';

export interface PersistedMeta {
  key: string;
  value: string;
}

export interface MediaRecord {
  id: string;
  ownerType: 'orcamento' | 'item' | 'feedback' | 'config';
  ownerId: string;
  kind: 'photo' | 'pdf' | 'signature' | 'log' | 'attachment';
  localUri: string;
  thumbUri?: string;
  mimeType: string;
  fileName: string;
  size: number;
  width?: number;
  height?: number;
  driveFileId?: string;
  gallerySaved: boolean;
  createdAt: number;
  syncStatus: SyncStatus;
}

export interface SyncQueueRecord {
  id: string;
  type: 'backup' | 'media_upload' | 'feedback_email' | 'drive_metadata' | 'delete_remote';
  payload: unknown;
  status: 'pending' | 'running' | 'done' | 'error';
  attempts: number;
  lastError?: string;
  runAfter: number;
  createdAt: number;
  updatedAt: number;
}

export interface FeedbackReport {
  id: string;
  message: string;
  email?: string;
  logs: unknown;
  attachments: string[];
  status: SyncQueueRecord['status'];
  createdAt: number;
}

export interface DomainSnapshot {
  orcamentos: Orcamento[];
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  eventos: Evento[];
  config: Config;
  fotos?: Array<Omit<Foto, 'blob'> & { dataB64: string }>; // fotos como base64 no backup
  recibos?: Recibo[];
}

export interface BaseRepository<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  upsert(record: T): Promise<void>;
  bulkUpsert(records: T[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ConfigRepository {
  get(): Promise<Config | null>;
  set(config: Config): Promise<void>;
  clear(): Promise<void>;
}

export interface AppStorage {
  platform: StoragePlatform;
  init(): Promise<void>;
  close(): Promise<void>;
  purgeLegacyStorage(): Promise<void>;
  exportSnapshot(): Promise<DomainSnapshot>;
  importSnapshot(snapshot: DomainSnapshot): Promise<void>;
  orcamentos: BaseRepository<Orcamento & { id: string }>;
  clientes: BaseRepository<Cliente & { id: string }>;
  fornecedores: BaseRepository<Fornecedor & { id: string }>;
  eventos: BaseRepository<Evento & { id: string }>;
  config: ConfigRepository;
  media: BaseRepository<MediaRecord>;
  syncQueue: BaseRepository<SyncQueueRecord>;
  feedback: BaseRepository<FeedbackReport>;
  fotos: BaseRepository<Foto & { id: string }>;
  recibos: BaseRepository<Recibo & { id: string }>;
}

