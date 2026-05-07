import { S } from './state';
import { toast } from './utils';

let _navCallback: (() => void) | null = null;

export function showPage(id: string, skipHistory = false): void {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(id);
  if (pg) pg.classList.add('active');
  if (!skipHistory) {
    try { history.pushState({ page: id }, '', '#' + id); } catch {}
  }
}

export function homeTab(tab: string): void {
  const map: Record<string, string> = {
    home: 'pg-home', orcamentos: 'pg-orcamentos', clientes: 'pg-clientes',
    fornecedores: 'pg-fornecedores', agenda: 'pg-agenda', backup: 'pg-backup',
    config: 'pg-config', flash: 'pg-flash', termos: 'pg-termos',
  };
  const pgId = map[tab];
  if (pgId) showPage(pgId);
}

export function go(n: number): void {
  if (n < 1 || n > 4) return;
  S.curStep = n;
  showPage('pg-s' + n);
  buildSteps(n);
}

export function buildSteps(n: number): void {
  for (let i = 1; i <= 4; i++) {
    const pill = document.getElementById(`pill${i}`);
    const lbl = document.getElementById(`step-label${i}`);
    if (pill) {
      pill.classList.toggle('done', i < n);
      pill.classList.toggle('active', i === n);
    }
    if (lbl) lbl.style.fontWeight = String(i === n ? 800 : 400);
  }
}

export function goHome(): void {
  if (S.isDirty) {
    openDraftConfirmModal(() => showPage('pg-home'));
    return;
  }
  showPage('pg-home');
}

export function openDraftConfirmModal(cb: () => void): void {
  _navCallback = cb;
  const modal = document.getElementById('draft-confirm-modal');
  if (modal) modal.style.display = 'flex';
}

export function closeDraftConfirmModal(): void {
  const modal = document.getElementById('draft-confirm-modal');
  if (modal) modal.style.display = 'none';
}

export function saveAsDraftAndExit(): void {
  closeDraftConfirmModal();
  if (typeof (window as any).saveDraft === 'function') (window as any).saveDraft();
  S.isDirty = false;
  _navCallback?.();
  _navCallback = null;
}

export function discardAndExit(): void {
  closeDraftConfirmModal();
  S.isDirty = false;
  _navCallback?.();
  _navCallback = null;
}

export function canNavigateAsync(callback: () => void): void {
  if (S.isDirty) { openDraftConfirmModal(callback); return; }
  callback();
}

export function toggleSidebar(): void {
  if (window.matchMedia('(min-width:1024px)').matches) return;
  document.getElementById('sidebar')?.classList.toggle('active');
  document.getElementById('sidebar-overlay')?.classList.toggle('active');
}

// Popstate handler
window.addEventListener('popstate', (e) => {
  const state = e.state as { page?: string } | null;
  if (state?.page) showPage(state.page, true);
});

// Expose globals for inline onclick handlers
(window as any).showPage = showPage;
(window as any).homeTab = homeTab;
(window as any).go = go;
(window as any).goHome = goHome;
(window as any).toggleSidebar = toggleSidebar;
(window as any).saveAsDraftAndExit = saveAsDraftAndExit;
(window as any).discardAndExit = discardAndExit;
