/**
 * Auto-sync service — sincroniza dados com Google Drive automaticamente.
 *
 * - Debounced 15s: aguarda 15s após última mudança antes de subir
 * - Soft delete: itens excluídos ficam na lixeira por 90 dias, depois purgados
 * - Status: 'idle' | 'pending' | 'syncing' | 'ok' | 'error' | 'offline'
 */

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'ok' | 'error' | 'offline';

const SYNC_DELAY_MS = 15_000; // 15 segundos de debounce
const SOFT_DELETE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias em ms
const TRASH_KEY = 'pp-trash';

let _timer: ReturnType<typeof setTimeout> | null = null;
let _syncing = false;
let _queued = false;
let _status: SyncStatus = 'idle';
let _okTimer: ReturnType<typeof setTimeout> | null = null;

function setStatus(s: SyncStatus): void {
  _status = s;
  // Volta para 'idle' 4s depois de 'ok'
  if (_okTimer) { clearTimeout(_okTimer); _okTimer = null; }
  if (s === 'ok') {
    _okTimer = setTimeout(() => { _status = 'idle'; (window as any).renderSyncStatus?.(); }, 4_000);
  }
  try { (window as any).renderSyncStatus?.(); } catch {}
}

export function getSyncStatus(): SyncStatus { return _status; }

// ── Soft delete ───────────────────────────────────────────────────────────────

export interface TrashItem {
  collection: 'orcs' | 'clientes' | 'fornecedores';
  item: any;
  deletedAt: number;
}

function readTrash(): TrashItem[] {
  try { return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]'); } catch { return []; }
}

function writeTrash(items: TrashItem[]): void {
  try { localStorage.setItem(TRASH_KEY, JSON.stringify(items)); } catch {}
}

export function softDelete(collection: TrashItem['collection'], item: any): void {
  const trash = readTrash().filter(t => t.item?.id !== item?.id);
  trash.push({ collection, item, deletedAt: Date.now() });
  writeTrash(trash);
}

export function getTrash(): TrashItem[] { return readTrash(); }

/** Remove da lixeira itens com mais de 90 dias. Chame no startup do app. */
export function purgeExpiredDeleted(): void {
  const cutoff = Date.now() - SOFT_DELETE_TTL_MS;
  writeTrash(readTrash().filter(t => t.deletedAt > cutoff));
}

// ── Sync scheduler ────────────────────────────────────────────────────────────

export function scheduleSync(): void {
  if (_timer) clearTimeout(_timer);
  if (_status !== 'syncing') setStatus('pending');
  _timer = setTimeout(executeSync, SYNC_DELAY_MS);
}

/** Força sync imediato (ex: ao reconectar Drive, ao fechar app). */
export async function executeSync(): Promise<void> {
  _timer = null;
  if (_syncing) { _queued = true; return; }

  // Importação lazy para evitar dependência circular
  const mod = await import('./google-drive');
  if (!mod.isGSignedIn()) { setStatus('offline'); return; }

  _syncing = true;
  setStatus('syncing');

  try {
    const ok = await mod.backupAutoSync();
    setStatus(ok ? 'ok' : 'error');
  } catch {
    setStatus('error');
  } finally {
    _syncing = false;
    if (_queued) { _queued = false; scheduleSync(); }
  }
}

// ── Register on window ────────────────────────────────────────────────────────

export function registerAutoSyncOnWindow(): void {
  (window as any).scheduleSync = scheduleSync;
  (window as any).executeSync = executeSync;
  (window as any).getSyncStatus = getSyncStatus;
  (window as any).softDelete = softDelete;
  (window as any).getTrash = getTrash;
  (window as any).purgeExpiredDeleted = purgeExpiredDeleted;
}
