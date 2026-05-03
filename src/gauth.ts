import { S } from './state';

// Stub: Google Auth e Drive desabilitados. Exporta as mesmas assinaturas para não quebrar imports.

export function initGAuth(): void {
  (S as any).googleEmail = '';
  (window as any).renderGoogleStatus?.();
}

export function isGSignedIn(): boolean { return false; }

export async function gSignIn(): Promise<string | null> { return null; }

export function gSignOut(): void {
  (S as any).googleEmail = '';
  localStorage.removeItem('pp-google-email');
  (window as any).renderGoogleStatus?.();
}

export async function uploadToDrive(
  _filename: string,
  _content: string | Blob,
  _mimeType?: string,
  _subfolder?: string
): Promise<string | null> { return null; }

export async function listDriveBackups(): Promise<{ id: string; name: string; modifiedTime: string }[]> {
  return [];
}

export async function downloadFromDrive(_fileId: string): Promise<string | null> { return null; }

export async function uploadBudgetPhotos(_orc: any): Promise<number> { return 0; }

export async function uploadClientList(): Promise<boolean> { return false; }

export async function backupToDrive(): Promise<boolean> { return false; }

// Globals usados por handlers inline no app.html
(window as any).initGAuth = initGAuth;
(window as any).gSignIn = gSignIn;
(window as any).gSignOut = gSignOut;
(window as any).isGSignedIn = isGSignedIn;
(window as any).uploadToDrive = uploadToDrive;
(window as any).backupToDrive = backupToDrive;
(window as any).uploadBudgetPhotos = uploadBudgetPhotos;
(window as any).uploadClientList = uploadClientList;
// listDriveBackups e downloadFromDrive NÃO expostos no window (RL-04: mitigar exfiltração via XSS)
