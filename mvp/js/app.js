import { DB, STORES } from './db.js';
import { AppState } from './state.js';
import { initRouter, navigate } from './router.js';

async function boot() {
  await DB.init();

  // Load config from DB
  try {
    const configs = await DB.getAll(STORES.CONFIGURACOES);
    if (configs.length) Object.assign(AppState.config, configs[0]);
  } catch {}

  initRouter();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/mvp/sw.js').catch(() => {});
  }

  // Restore last view or default
  const lastView = sessionStorage.getItem('pp-mvp-view') || 'orcamentos';
  const currentHash = location.hash.replace('#', '');
  if (!currentHash) navigate(lastView, true);
  else navigate(currentHash, true);
}

document.addEventListener('DOMContentLoaded', boot);
