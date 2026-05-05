import { S } from './state';
import { supabase } from './supabaseClient';

// ── Constants ──
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER = 'Pintor Plus';

// ── Auth ──

export function initGAuth(): void {
  supabase.auth.getSession().then(({ data }) => {
    S.googleEmail = data.session?.user?.email ?? '';
    (window as any).renderGoogleStatus?.();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    S.googleEmail = session?.user?.email ?? '';
    (window as any).renderGoogleStatus?.();
  });
}

export function isGSignedIn(): boolean {
  return S.googleEmail !== '';
}

export async function gSignIn(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      scopes: 'https://www.googleapis.com/auth/drive.file',
    },
  });
  if (error) return null;
  return S.googleEmail || null;
}

export function gSignOut(): void {
  supabase.auth.signOut();
  S.googleEmail = '';
  localStorage.removeItem('pp-google-email');
  (window as any).renderGoogleStatus?.();
}

// ── Google token helper ──

async function getGoogleToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
}

// ── Drive API helpers ──

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = await getGoogleToken();
  if (!token) throw new Error('Não autenticado no Google');
  return fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
  });
}

async function ensureFolder(name: string, parentId?: string): Promise<string | null> {
  const q = parentId
    ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await driveFetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`);
  if (!res.ok) return null;
  const { files } = await res.json();
  if (files?.length) return files[0].id;

  const meta: any = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) meta.parents = [parentId];
  const createRes = await driveFetch(`${DRIVE_API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  });
  if (!createRes.ok) return null;
  const { id } = await createRes.json();
  return id;
}

async function getAppFolderId(): Promise<string | null> {
  return ensureFolder(APP_FOLDER);
}

async function findFile(name: string, folderId: string): Promise<string | null> {
  const q = `name='${name}' and '${folderId}' in parents and trashed=false`;
  const res = await driveFetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`);
  if (!res.ok) return null;
  const { files } = await res.json();
  return files?.length ? files[0].id : null;
}

// ── Upload genérico ──

export async function uploadToDrive(
  filename: string,
  content: string | Blob,
  mimeType?: string,
  subfolder?: string
): Promise<string | null> {
  try {
    const parentId = subfolder
      ? await ensureFolder(subfolder, await getAppFolderId() ?? undefined) ?? await getAppFolderId()
      : await getAppFolderId();
    if (!parentId) return null;

    const existingId = await findFile(filename, parentId);
    const method = existingId ? 'PATCH' : 'POST';
    const endpoint = existingId
      ? `${DRIVE_UPLOAD}/files/${existingId}?uploadType=multipart`
      : `${DRIVE_UPLOAD}/files?uploadType=multipart`;

    const meta: any = { name: filename, parents: [parentId] };
    if (mimeType) meta.mimeType = mimeType;

    const boundary = 'pp_' + Date.now();
    const body = typeof content === 'string'
      ? `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n${content}\r\n--${boundary}--`
      : await buildMultipartBlob(boundary, meta, content, mimeType);

    const res = await driveFetch(endpoint, {
      method,
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch (e) {
    console.error('uploadToDrive:', e);
    return null;
  }
}

async function buildMultipartBlob(boundary: string, meta: any, blob: Blob, mime?: string): Promise<Blob> {
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: ${mime || blob.type || 'application/octet-stream'}\r\n\r\n`;
  const end = `\r\n--${boundary}--`;
  return new Blob([metaPart, filePart, blob, end]);
}

// ── Listar backups ──

export async function listDriveBackups(): Promise<{ id: string; name: string; modifiedTime: string }[]> {
  try {
    const folderId = await getAppFolderId();
    if (!folderId) return [];
    const q = `'${folderId}' in parents and name contains 'Backup_' and trashed=false`;
    const res = await driveFetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&spaces=drive`);
    if (!res.ok) return [];
    const { files } = await res.json();
    return files ?? [];
  } catch (e) {
    console.error('listDriveBackups:', e);
    return [];
  }
}

// ── Download ──

export async function downloadFromDrive(fileId: string): Promise<string | null> {
  try {
    const res = await driveFetch(`${DRIVE_API}/files/${fileId}?alt=media`);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error('downloadFromDrive:', e);
    return null;
  }
}

// ── Upload fotos do orçamento ──

export async function uploadBudgetPhotos(orc: any): Promise<number> {
  let count = 0;
  try {
    const folderName = (orc.nome || 'Sem Nome').replace(/[/\\:*?"<>|]/g, '_').slice(0, 50);
    const rootId = await getAppFolderId();
    if (!rootId) return 0;
    const orcFolderId = await ensureFolder(folderName, rootId);
    if (!orcFolderId) return 0;
    const fotosFolderId = await ensureFolder('Fotos', orcFolderId) ?? orcFolderId;

    for (const room of (orc.rooms || [])) {
      for (const item of (room.items || [])) {
        for (const photo of (item.photos || [])) {
          const url = typeof photo === 'string' ? photo : photo.url;
          const fname = (typeof photo === 'string' ? null : photo.filename) || `Foto_${Date.now()}.jpg`;
          if (!url || !url.startsWith('data:')) continue;

          const blob = dataUrlToBlob(url);
          const result = await uploadToDrive(fname, blob, blob.type, `${folderName}/Fotos`);
          if (result) count++;
        }
      }
    }
  } catch (e) {
    console.error('uploadBudgetPhotos:', e);
  }
  return count;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── Sync lista de clientes ──

export async function uploadClientList(): Promise<boolean> {
  try {
    const json = JSON.stringify(S.clientes, null, 2);
    const id = await uploadToDrive('clientes.json', json, 'application/json');
    return !!id;
  } catch (e) {
    console.error('uploadClientList:', e);
    return false;
  }
}

// ── Backup completo ──

export async function backupToDrive(): Promise<boolean> {
  try {
    const data = {
      versao: 1,
      dataGeracao: new Date().toISOString(),
      config: S.config,
      orcs: S.orcs,
      clientes: S.clientes,
      fornecedores: S.fornecedores,
      eventos: S.eventos,
    };
    const json = JSON.stringify(data);
    const fname = `Backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    const id = await uploadToDrive(fname, json, 'application/json');
    if (id) {
      // @ts-ignore toast global
      if (typeof toast === 'function') toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Backup salvo no Drive!');
      return true;
    }
    return false;
  } catch (e) {
    console.error('backupToDrive:', e);
    return false;
  }
}

// Globals usados por handlers inline no app.html
(window as any).initGAuth = initGAuth;
(window as any).gSignIn = gSignIn;
(window as any).gSignOut = gSignOut;
(window as any).isGSignedIn = isGSignedIn;
(window as any).uploadToDrive = uploadToDrive;
(window as any).backupToDrive = backupToDrive;
(window as any).uploadBudgetPhotos = uploadBudgetPhotos;
(window as any).uploadClientList = uploadClientList;
(window as any).gDriveUploadPhotos = uploadBudgetPhotos;
(window as any).gDriveSyncClientes = uploadClientList;
// listDriveBackups e downloadFromDrive NÃO expostos no window (RL-04: mitigar exfiltração via XSS)
