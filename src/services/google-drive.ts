/**
 * Google Drive service — OAuth via GIS token client + Drive REST API v3
 *
 * Requires a Google Cloud OAuth 2.0 Client ID (Web Application type).
 * Set VITE_GOOGLE_CLIENT_ID in .env or replace the placeholder below.
 *
 * Authorized JS origins to add in Google Cloud Console:
 *   http://localhost:3000
 *   https://<your-domain>
 */

const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'Pintor Plus';
const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

let _token: string | null = null;
let _tokenExpiry = 0;
let _email = localStorage.getItem('pp-gdrive-email') || '';
let _tokenClient: any = null;
let _gisReady = false;

// ── Load GIS script ──────────────────────────────────────────────────────────

function loadGIS(): Promise<void> {
  if (_gisReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SCRIPT}"]`)) {
      // already loading — wait for it
      const check = setInterval(() => {
        if ((window as any).google?.accounts?.oauth2) {
          _gisReady = true;
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error('GIS timeout')); }, 10_000);
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SCRIPT;
    s.async = true;
    s.onload = () => { _gisReady = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
}

// ── OAuth ────────────────────────────────────────────────────────────────────

function initTokenClient(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID não configurado. Adicione ao .env'));
      return;
    }
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) { reject(new Error(response.error)); return; }
        _token = response.access_token;
        _tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
        resolve(client);
      },
    });
    resolve(client);
  });
}

export async function gSignIn(): Promise<string | null> {
  try {
    await loadGIS();
    if (!_tokenClient) _tokenClient = await initTokenClient();
    return new Promise((resolve) => {
      (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error || !response.access_token) { resolve(null); return; }
          _token = response.access_token;
          _tokenExpiry = Date.now() + (response.expires_in - 60) * 1000;
          // Fetch email via tokeninfo
          try {
            const r = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${_token}`);
            const j = await r.json();
            _email = j.email || '';
            localStorage.setItem('pp-gdrive-email', _email);
            localStorage.setItem('pp-google-email', _email);
            localStorage.setItem('pp-gdrive-lastSync', new Date().toISOString());
            // Atualiza estado global e UI do backup
            const S = (window as any).S;
            if (S) S.googleEmail = _email;
            (window as any).renderGoogleStatus?.();
          } catch {}
          resolve(_token);
        },
      }).requestAccessToken({ prompt: '' });
    });
  } catch (e) {
    console.error('[GDrive] sign-in error:', e);
    return null;
  }
}

export function isGSignedIn(): boolean {
  return !!_token && Date.now() < _tokenExpiry;
}

export function getGEmail(): string { return _email; }

// ── Drive REST helpers ───────────────────────────────────────────────────────

async function driveRequest(path: string, options: RequestInit = {}): Promise<Response> {
  if (!_token) throw new Error('Not authenticated');
  return fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${_token}`,
      ...(options.headers || {}),
    },
  });
}

async function getOrCreateFolder(): Promise<string> {
  const cached = localStorage.getItem('pp-gdrive-folderId');
  if (cached) return cached;

  const q = `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const r = await driveRequest(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const data = await r.json();
  if (data.files?.length) {
    localStorage.setItem('pp-gdrive-folderId', data.files[0].id);
    return data.files[0].id;
  }
  // Create folder
  const cr = await driveRequest('/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const folder = await cr.json();
  localStorage.setItem('pp-gdrive-folderId', folder.id);
  return folder.id;
}

async function uploadFile(name: string, content: string, mimeType: string, existingId?: string): Promise<string> {
  const folderId = await getOrCreateFolder();
  const metadata = { name, parents: existingId ? undefined : [folderId] };
  const boundary = 'boundary_pintorplus';
  const body =
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const r = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${_token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const file = await r.json();
  return file.id;
}

async function uploadBlob(name: string, blob: Blob, mimeType: string): Promise<string> {
  const folderId = await getOrCreateFolder();
  const metadata = { name, parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([blob], { type: mimeType }));

  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${_token}` },
    body: form,
  });
  const file = await r.json();
  return file.id;
}

// ── Public API ───────────────────────────────────────────────────────────────

const AUTO_SYNC_FILE = 'PintorPlus_AutoSync.json';
const AUTO_SYNC_FILE_ID_KEY = 'pp-autosync-fileid';

/** Backup automático — upserta um único arquivo no Drive (não cria novo a cada save). */
export async function backupAutoSync(): Promise<boolean> {
  try {
    const S = (window as any).S;
    if (!S) throw new Error('State not ready');
    const trash = (window as any).getTrash?.() || [];
    const data = {
      versao: 2,
      autoSync: true,
      dataGeracao: new Date().toISOString(),
      config: S.config,
      orcs: S.orcs,
      clientes: S.clientes,
      fornecedores: S.fornecedores,
      eventos: S.eventos,
      trash,
    };
    const json = JSON.stringify(data);
    const existingId = localStorage.getItem(AUTO_SYNC_FILE_ID_KEY) || undefined;
    const fileId = await uploadFile(AUTO_SYNC_FILE, json, 'application/json', existingId);
    localStorage.setItem(AUTO_SYNC_FILE_ID_KEY, fileId);
    localStorage.setItem('pp-gdrive-lastSync', new Date().toISOString());
    return true;
  } catch (e) {
    console.error('[GDrive] auto-sync error:', e);
    return false;
  }
}

export async function backupToDrive(): Promise<boolean> {
  try {
    const S = (window as any).S;
    if (!S) throw new Error('State not ready');
    const data = {
      versao: 2,
      dataGeracao: new Date().toISOString(),
      config: S.config,
      orcs: S.orcs,
      clientes: S.clientes,
      fornecedores: S.fornecedores,
      eventos: S.eventos,
    };
    const json = JSON.stringify(data);
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const name = `PintorPlus_Backup_${date}.json`;
    await uploadFile(name, json, 'application/json');
    localStorage.setItem('pp-gdrive-lastSync', new Date().toISOString());
    return true;
  } catch (e) {
    console.error('[GDrive] backup error:', e);
    return false;
  }
}

export async function listDriveBackups(): Promise<{ id: string; name: string; modifiedTime: string }[]> {
  try {
    const folderId = await getOrCreateFolder();
    const q = `'${folderId}' in parents and name contains 'PintorPlus_Backup' and trashed=false`;
    const r = await driveRequest(`/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=20`);
    const data = await r.json();
    return data.files || [];
  } catch (e) {
    console.error('[GDrive] list backups error:', e);
    return [];
  }
}

export async function downloadFromDrive(fileId: string): Promise<string | null> {
  try {
    const r = await driveRequest(`/files/${fileId}?alt=media`);
    if (!r.ok) return null;
    return r.text();
  } catch (e) {
    console.error('[GDrive] download error:', e);
    return null;
  }
}

export async function uploadBudgetPhotos(orc: any): Promise<number> {
  try {
    const folderId = await getOrCreateFolder();
    let count = 0;
    const photos: string[] = [];
    (orc.rooms || []).forEach((r: any) => {
      (r.photos || r.fotos || []).forEach((p: string) => { if (p) photos.push(p); });
      (r.items || []).forEach((it: any) => {
        (it.photos || it.fotos || []).forEach((p: string) => { if (p) photos.push(p); });
      });
    });
    for (const dataUrl of photos) {
      if (!dataUrl.startsWith('data:')) continue;
      const [header, b64] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const ext = mime.split('/')[1] || 'jpg';
      await uploadBlob(`orc_${orc.id}_${Date.now()}_${count}.${ext}`, blob, mime);
      count++;
    }
    return count;
  } catch (e) {
    console.error('[GDrive] upload photos error:', e);
    return 0;
  }
}

export async function uploadClientList(): Promise<boolean> {
  try {
    const S = (window as any).S;
    const clients = S?.clientes || [];
    const json = JSON.stringify({ versao: 1, clientes: clients, exportadoEm: new Date().toISOString() });
    await uploadFile('PintorPlus_Clientes.json', json, 'application/json');
    return true;
  } catch (e) {
    console.error('[GDrive] upload clients error:', e);
    return false;
  }
}

// ── Register on window ───────────────────────────────────────────────────────

export function registerGDriveOnWindow(): void {
  (window as any).gSignIn = gSignIn;
  (window as any).isGSignedIn = isGSignedIn;
  (window as any).getGEmail = getGEmail;
  (window as any).backupToDrive = backupToDrive;
  (window as any).backupAutoSync = backupAutoSync;
  (window as any).listDriveBackups = listDriveBackups;
  (window as any).downloadFromDrive = downloadFromDrive;
  (window as any).uploadBudgetPhotos = uploadBudgetPhotos;
  (window as any).uploadClientList = uploadClientList;
}
