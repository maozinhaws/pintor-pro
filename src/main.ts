// Pintor Plus MVP — TypeScript Entry Point
import './styles-lovable';
import './navigation';
import './budgets';
import './clients';
import './agenda';
import './receipts';
import './appConfig';
import './camera';
import './photo-editor';
import { S, saveOrcs } from './state';
import { toast, formatNum, money, esc, formatPhone, validateFullName, validatePhone, getStatusBadgeClass, getRoomMeds, normalizeDecimalInput, normalizeMeasureInput, numFromInput, digitsOnly, setFieldError, f1, ptFloat, safeUrl, ico } from './utils';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Storage } from './storage/storage';

// ── Keyboard avoidance ──
(function () {
  const root = document.documentElement;

  function setKbHeight(h: number): void {
    root.style.setProperty('--kb-h', h + 'px');
    document.body.classList.toggle('kb-open', h > 0);
  }

  function scrollFocusedIntoView(delay = 120): void {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return;
    const tag = el.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
    setTimeout(() => {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
    }, delay);
  }

  // 1) Native (Capacitor Keyboard plugin) — mais preciso no Android
  Keyboard.addListener('keyboardWillShow', info => {
    setKbHeight(info.keyboardHeight || 0);
  }).catch(() => {});
  Keyboard.addListener('keyboardDidShow', info => {
    setKbHeight(info.keyboardHeight || 0);
    scrollFocusedIntoView(150);
  }).catch(() => {});
  Keyboard.addListener('keyboardWillHide', () => setKbHeight(0)).catch(() => {});
  Keyboard.addListener('keyboardDidHide', () => setKbHeight(0)).catch(() => {});

  // 2) Browser fallback — VisualViewport (DevTools / PWA / Chrome)
  const THRESHOLD = 0.75;
  let baseH = window.innerHeight;
  function onResize(): void {
    const vv = window.visualViewport;
    const curH = vv ? vv.height : window.innerHeight;
    const diff = baseH - curH;
    if (diff / baseH > 1 - THRESHOLD) setKbHeight(diff);
    else setKbHeight(0);
  }
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
  else window.addEventListener('resize', onResize);
  window.addEventListener('load', () => { baseH = window.visualViewport ? window.visualViewport.height : window.innerHeight; });

  // 3) Foco em qualquer campo → scroll into view (cobre casos sem evento de teclado)
  document.addEventListener('focusin', e => {
    const t = e.target as HTMLElement;
    if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA' && t.tagName !== 'SELECT')) return;
    setTimeout(() => { try { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {} }, 400);
  });
})();

// ── Service Worker ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if ('periodicSync' in reg) {
        (reg as any).periodicSync.register('pp-check-alarms', { minInterval: 15 * 60 * 1000 }).catch(() => {});
      }
    }).catch(() => {});
  });
}

// ── Theme ──
function applyStatusBarStyle(isDark: boolean): void {
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
}

function toggleThemeAnim(): void {
  const root = document.documentElement;
  const isDark = root.classList.toggle('dark');
  localStorage.setItem('pp-theme', isDark ? 'dark' : 'light');
  applyStatusBarStyle(isDark);
}

function setTheme(theme: string): void {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  applyStatusBarStyle(isDark);
}

(function () {
  const saved = localStorage.getItem('pp-theme');
  if (saved) { setTheme(saved); return; }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  setTheme(mq.matches ? 'dark' : 'light');
  mq.addEventListener('change', e => setTheme(e.matches ? 'dark' : 'light'));
})();

// ── Auto-save on exit ──
function _autoSaveRascunho(): void {
  if (!S.isDirty) return;
  if (typeof (window as any).saveDraft === 'function') (window as any).saveDraft();
}

window.addEventListener('beforeunload', () => _autoSaveRascunho());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') _autoSaveRascunho(); });
window.addEventListener('pagehide', () => _autoSaveRascunho());

// ── Delete confirmation ──
let pendingDelAction: (() => void) | null = null;

function askDelete(msg: string, action: () => void): void {
  pendingDelAction = action;
  const el = document.getElementById('del-confirm-msg');
  if (el) el.textContent = msg;
  document.getElementById('del-confirm-modal')?.style.setProperty('display', 'flex');
}

function closeDelConfirm(proceed: boolean): void {
  document.getElementById('del-confirm-modal')?.style.setProperty('display', 'none');
  if (proceed && pendingDelAction) { pendingDelAction(); pendingDelAction = null; }
}

// ── Expose globals for inline handlers ──
(window as any).S = S;
(window as any).saveOrcs = saveOrcs;
(window as any).toast = toast;
(window as any).formatNum = formatNum;
(window as any).money = money;
(window as any).esc = esc;
(window as any)._esc = esc;
(window as any)._safeUrl = safeUrl;
(window as any).formatPhone = formatPhone;
(window as any).validateFullName = validateFullName;
(window as any).validatePhone = validatePhone;
(window as any).getStatusBadgeClass = getStatusBadgeClass;
(window as any).getRoomMeds = getRoomMeds;
(window as any).normalizeDecimalInput = normalizeDecimalInput;
(window as any).normalizeMeasureInput = normalizeMeasureInput;
(window as any).numFromInput = numFromInput;
(window as any).digitsOnly = digitsOnly;
(window as any).setFieldError = setFieldError;
(window as any).f1 = f1;
(window as any).ptFloat = ptFloat;
(window as any).ico = ico;
(window as any).toggleThemeAnim = toggleThemeAnim;
(window as any).askDelete = askDelete;
(window as any).closeDelConfirm = closeDelConfirm;
(window as any).defCfg = S.config;

// ── App init ──
window.addEventListener('load', () => {
  try { history.replaceState({ page: 'pg-home' }, '', location.href); } catch {}
  (window as any).renderGoogleStatus?.();

  // Inicializa storage offline (Dexie/IndexedDB ou SQLite nativo)
  Storage.init().then(async () => {
    console.log('[main] Storage pronto:', Storage.backendName);
    (window as any).Storage = Storage;
    // iOS recovery: se localStorage foi limpo pelo SO, restaura do IndexedDB
    if (!S.orcs.length) {
      try {
        const fromStorage = await Storage.getOrcs();
        if (fromStorage?.length) {
          S.orcs = fromStorage;
          localStorage.setItem('pp-orcs', JSON.stringify(S.orcs));
          console.log('[main] Orçamentos restaurados do', Storage.backendName, ':', fromStorage.length, 'registros');
          (window as any).renderOrcamentosList?.();
          (window as any).renderHomeMini?.();
        }
      } catch (e) { console.warn('[main] Falha ao restaurar do storage:', e); }
    }
  }).catch(e => console.warn('[main] Storage init falhou:', e));

  // OAuth callback — após redirect Google/Supabase, o hash contém #access_token
  if (false && location.hash.includes('access_token')) {
    (async () => {
      const client = (window as any).supabaseClient;
      if (client) {
        const { data } = await client.auth.getSession();
        if (data?.session?.user?.email) {
          S.googleEmail = data.session.user.email;
          localStorage.setItem('pp-google-email', S.googleEmail);
          (window as any).renderGoogleStatus?.();
        }
      }
      history.replaceState(null, '', location.pathname + location.search);
    })();
  }

  window.dispatchEvent(new Event('pp-ready'));
});
