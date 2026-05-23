/**
 * Auth service — Google Sign-In com sessão persistente
 *
 * Fluxo:
 *   1. Primeiro acesso: popup Google → salva user no localStorage
 *   2. Reabertura do app: lê localStorage → entra direto (sem popup)
 *   3. Logout manual: limpa localStorage → exibe tela de login
 *
 * Token Google (Drive) é solicitado lazily quando Drive é acessado.
 */

const SESSION_KEY = 'pp-auth-user';
const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  picture: string;
  signedInAt: string;
}

type AuthChangeCallback = (user: AuthUser | null) => void;
const _listeners: AuthChangeCallback[] = [];

// ── Persistência ─────────────────────────────────────────────────────────────

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    if (!u?.uid || !u?.email) return null;
    return u;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

function notifyListeners(user: AuthUser | null): void {
  _listeners.forEach(cb => { try { cb(user); } catch {} });
}

// ── GIS loader ───────────────────────────────────────────────────────────────

function loadGIS(): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SCRIPT}"]`)) {
      const t = setInterval(() => {
        if ((window as any).google?.accounts?.id) { clearInterval(t); resolve(); }
      }, 80);
      setTimeout(() => { clearInterval(t); reject(new Error('GIS timeout')); }, 12_000);
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load GIS'));
    document.head.appendChild(s);
  });
}

// ── Decode JWT (id_token) sem verificar assinatura — só para exibir dados ───
// A verificação real ocorre no servidor; aqui usamos apenas para UX local.
function decodeJWT(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// ── Sign In ───────────────────────────────────────────────────────────────────

export async function signIn(): Promise<AuthUser | null> {
  await loadGIS();
  const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  if (!CLIENT_ID) {
    console.error('[Auth] VITE_GOOGLE_CLIENT_ID não configurado');
    // Modo dev: permite bypass sem Google Client ID
    const devUser: AuthUser = {
      uid: 'dev-local',
      email: 'dev@pintorplus.local',
      name: 'Usuário Local',
      picture: '',
      signedInAt: new Date().toISOString(),
    };
    storeUser(devUser);
    notifyListeners(devUser);
    return devUser;
  }

  return new Promise((resolve) => {
    (window as any).google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response: { credential: string }) => {
        const payload = decodeJWT(response.credential);
        if (!payload?.sub) { resolve(null); return; }
        const user: AuthUser = {
          uid: payload.sub,
          email: payload.email || '',
          name: payload.name || payload.email || 'Usuário',
          picture: payload.picture || '',
          signedInAt: new Date().toISOString(),
        };
        storeUser(user);
        notifyListeners(user);
        resolve(user);
      },
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    // Renderiza o botão no container se existir, senão usa prompt
    const btnEl = document.getElementById('google-signin-btn');
    if (btnEl) {
      btnEl.innerHTML = '';
      (window as any).google.accounts.id.renderButton(btnEl, {
        type: 'standard',
        shape: 'pill',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        logo_alignment: 'center',
        width: 280,
        locale: 'pt-BR',
      });
    } else {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          resolve(null);
        }
      });
    }
  });
}

// ── Sign Out ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const user = getStoredUser();
  clearUser();
  // Revoga sessão Google se GIS estiver disponível
  if (user?.uid && (window as any).google?.accounts?.id) {
    try { (window as any).google.accounts.id.revoke(user.email, () => {}); } catch {}
  }
  // Limpa token OAuth do Drive também
  const driveToken = (window as any)._gDriveToken;
  if (driveToken && (window as any).google?.accounts?.oauth2) {
    try { (window as any).google.accounts.oauth2.revoke(driveToken, () => {}); } catch {}
  }
  notifyListeners(null);
}

// ── Observers ─────────────────────────────────────────────────────────────────

export function onAuthChange(cb: AuthChangeCallback): () => void {
  _listeners.push(cb);
  return () => { const i = _listeners.indexOf(cb); if (i >= 0) _listeners.splice(i, 1); };
}

export function isAuthenticated(): boolean {
  return !!getStoredUser();
}

// ── Handle credential from GIS button click ───────────────────────────────────
// Chamado diretamente pelo callback do GIS (sem re-inicializar)

export function handleCredential(credential: string): AuthUser | null {
  const payload = decodeJWT(credential);
  if (!payload?.sub) return null;
  const user: AuthUser = {
    uid: payload.sub,
    email: payload.email || '',
    name: payload.name || payload.email || 'Usuário',
    picture: payload.picture || '',
    signedInAt: new Date().toISOString(),
  };
  storeUser(user);
  notifyListeners(user);
  return user;
}

// ── Register on window ────────────────────────────────────────────────────────

export function registerAuthOnWindow(): void {
  (window as any).ppSignIn = signIn;
  (window as any).ppSignOut = signOut;
  (window as any).ppIsAuthenticated = isAuthenticated;
  (window as any).ppGetUser = getStoredUser;
  (window as any).ppOnAuthChange = onAuthChange;
  (window as any).ppHandleCredential = handleCredential;
}
