// @ts-nocheck - Capacitor types not available in build environment
import { LEGACY_LOCAL_STORAGE_KEYS, LEGACY_SESSION_STORAGE_KEYS } from './schema';
import type { AppStorage } from './types';

export async function createAppStorage(): Promise<AppStorage> {
  // @ts-nocheck - Capacitor types not available in build environment
  const { Capacitor } = await import('@capacitor/core');

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      const { createAndroidSQLiteStorage } = await import('./db.sqlite');
      return await createAndroidSQLiteStorage();
    } catch (error) {
      console.warn('SQLite storage unavailable; falling back to web storage.', error);
    }
  }

  const { createWebDexieStorage } = await import('./db.dexie');
  return createWebDexieStorage();
}

export function purgeLegacyBrowserStorage(): void {
  LEGACY_LOCAL_STORAGE_KEYS.forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });
  LEGACY_SESSION_STORAGE_KEYS.forEach(key => {
    try { sessionStorage.removeItem(key); } catch {}
  });
}

export type { AppStorage } from './types';
