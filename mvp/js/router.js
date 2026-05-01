import { renderOrcList, renderOrcForm } from './orcamentos.js';
import { renderClienteList, renderClienteForm } from './clientes.js';

const VIEWS = ['orcamentos', 'clientes'];

export function navigate(path, replace = false) {
  const hash = '#' + path;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  _dispatch();
}

export function initRouter() {
  window.addEventListener('hashchange', _dispatch);
}

function _dispatch() {
  const hash = location.hash.replace('#', '') || 'orcamentos';
  const [view, sub, id] = hash.split('/');

  // Update bottom nav active state
  document.querySelectorAll('#bottom-nav button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view || (btn.dataset.view === 'orcamentos' && view === 'orc') || (btn.dataset.view === 'clientes' && view === 'cliente'));
  });

  // Show correct view container
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('view--active', v === view || (v === 'orcamentos' && view === 'orc') || (v === 'clientes' && view === 'cliente'));
  });

  // Save last top-level view
  if (VIEWS.includes(view)) sessionStorage.setItem('pp-mvp-view', view);

  // Route to correct renderer
  if (view === 'orcamentos') {
    renderOrcList();
  } else if (view === 'orc') {
    if (sub === 'new') renderOrcForm(null);
    else if (sub === 'edit' && id) renderOrcForm(id);
  } else if (view === 'clientes') {
    renderClienteList();
  } else if (view === 'cliente') {
    if (sub === 'new') renderClienteForm(null);
    else if (sub === 'edit' && id) renderClienteForm(id);
  }
}
