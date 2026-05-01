import { DB, STORES } from './db.js';
import { navigate } from './router.js';
import { showToast } from './toast.js';
import { AppState } from './state.js';
import { formatPhone, validatePhone, validateFullName, escapeHtml } from './utils.js';

const CONTAINER = 'view-clientes';

// ── LIST ──────────────────────────────────────────────────────────────────────
export async function renderClienteList() {
  const el = document.getElementById(CONTAINER);
  if (!el) return;

  el.innerHTML = `
    <div class="view-header">
      <h1>Clientes</h1>
      <button class="btn btn--primary btn--sm" id="btn-novo-cli">+ Novo</button>
    </div>
    <div class="search-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35"/></svg>
      <input class="input" id="cli-search" type="search" placeholder="Buscar cliente…" autocomplete="off">
      <button class="search-clear" id="cli-search-clear" aria-label="Limpar busca">✕</button>
    </div>
    <div class="list" id="cli-list"></div>
  `;

  document.getElementById('btn-novo-cli').addEventListener('click', () => navigate('cliente/new'));

  const searchEl = document.getElementById('cli-search');
  const clearBtn = document.getElementById('cli-search-clear');
  searchEl.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', searchEl.value.length > 0);
    _filterClientes(searchEl.value);
  });
  clearBtn.addEventListener('click', () => {
    searchEl.value = '';
    clearBtn.classList.remove('visible');
    _filterClientes('');
  });

  await _renderCliList('');
}

let _allClientes = [];

async function _renderCliList(query) {
  _allClientes = await DB.getAll(STORES.CLIENTES);
  _filterClientes(query);
}

function _filterClientes(query) {
  const listEl = document.getElementById('cli-list');
  if (!listEl) return;

  const q = query.toLowerCase().trim();
  const filtered = q
    ? _allClientes.filter(c =>
        (c.nome || '').toLowerCase().includes(q) ||
        (c.tel || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
    : _allClientes;

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>
        <p>${q ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(c => `
    <div class="cli-card" id="cli-${c.id}">
      <div class="cli-card-body">
        <div class="cli-name">${escapeHtml(c.nome)}</div>
        ${c.tel ? `<div class="cli-phone">${escapeHtml(c.tel)}</div>` : ''}
        ${c.email ? `<div class="cli-phone" style="font-size:12px;">${escapeHtml(c.email)}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
        ${c.tel ? `<a href="tel:${c.tel.replace(/\D/g,'')}" class="btn btn--sm btn--outline" style="padding:6px 10px;" title="Ligar" onclick="event.stopPropagation()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z"/></svg>
        </a>` : ''}
        <button class="btn btn--sm" data-edit="${c.id}" title="Editar" style="padding:6px 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/></svg>
        </button>
        <button class="btn btn--sm btn--danger" data-del="${c.id}" title="Excluir" style="padding:6px 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => navigate(`cliente/edit/${btn.dataset.edit}`));
  });

  listEl.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => _deleteCliente(btn.dataset.del));
  });
}

async function _deleteCliente(id) {
  if (!confirm('Excluir este cliente permanentemente?')) return;
  await DB.delete(STORES.CLIENTES, id);
  showToast('Cliente excluído.');
  _allClientes = _allClientes.filter(c => String(c.id) !== String(id));
  _filterClientes('');
}

// ── FORM ──────────────────────────────────────────────────────────────────────
export async function renderClienteForm(id) {
  AppState.editingClienteId = id || null;
  const el = document.getElementById(CONTAINER);
  if (!el) return;

  let cliente = null;
  if (id) {
    cliente = await DB.getById(STORES.CLIENTES, id);
    if (!cliente) { navigate('clientes', true); return; }
  }

  el.innerHTML = `
    <div class="form-view-header">
      <button class="back-btn" id="cli-back">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>
      </button>
      <h1>${id ? 'Editar Cliente' : 'Novo Cliente'}</h1>
    </div>

    <div class="form-section">
      <div class="form-section-title">Dados de Contato</div>
      <div class="form-grid">
        <div class="field-group">
          <label for="cli-nome">Nome completo *</label>
          <input class="input" id="cli-nome" type="text" placeholder="Ex: João da Silva" autocapitalize="words" value="${escapeHtml(cliente?.nome || '')}">
          <span class="field-error" id="cli-nome-err" style="color:var(--danger);font-size:12px;display:none;">Informe o nome completo</span>
        </div>
        <div class="field-group">
          <label for="cli-tel">Telefone *</label>
          <input class="input" id="cli-tel" type="tel" placeholder="(11) 9 9999-9999" value="${escapeHtml(cliente?.tel || '')}">
          <span class="field-error" id="cli-tel-err" style="color:var(--danger);font-size:12px;display:none;">Telefone inválido</span>
        </div>
        <div class="field-group">
          <label for="cli-email">E-mail</label>
          <input class="input" id="cli-email" type="email" placeholder="email@exemplo.com" value="${escapeHtml(cliente?.email || '')}">
        </div>
        <div class="field-group">
          <label for="cli-end">Endereço</label>
          <input class="input" id="cli-end" type="text" placeholder="Rua, número, bairro, cidade" value="${escapeHtml(cliente?.end || '')}">
        </div>
        <div class="field-group">
          <label for="cli-cpf">CPF / CNPJ</label>
          <input class="input" id="cli-cpf" type="text" placeholder="000.000.000-00" value="${escapeHtml(cliente?.cpf || '')}">
        </div>
        <div class="field-group">
          <label for="cli-apelido">Referência / Apelido</label>
          <input class="input" id="cli-apelido" type="text" placeholder="Ex: Casa da praia" value="${escapeHtml(cliente?.apelido || '')}">
        </div>
      </div>
    </div>

    <div class="form-bottom-bar">
      <button class="btn btn--primary btn--full" id="cli-salvar">Salvar Cliente</button>
    </div>
  `;

  document.getElementById('cli-back').addEventListener('click', () => navigate('clientes', true));

  const telInput = document.getElementById('cli-tel');
  telInput.addEventListener('input', function() {
    const pos = this.selectionStart;
    const oldLen = this.value.length;
    this.value = formatPhone(this.value);
    const diff = this.value.length - oldLen;
    try { this.setSelectionRange(pos + diff, pos + diff); } catch {}
  });

  document.getElementById('cli-salvar').addEventListener('click', _saveCliente);
}

async function _saveCliente() {
  const nome = document.getElementById('cli-nome').value.trim();
  const tel = document.getElementById('cli-tel').value.trim();
  const email = document.getElementById('cli-email').value.trim();
  const end = document.getElementById('cli-end').value.trim();
  const cpf = document.getElementById('cli-cpf').value.trim();
  const apelido = document.getElementById('cli-apelido').value.trim();

  let valid = true;
  const nomeErr = document.getElementById('cli-nome-err');
  const telErr = document.getElementById('cli-tel-err');

  nomeErr.style.display = validateFullName(nome) ? 'none' : 'block';
  if (!validateFullName(nome)) valid = false;

  telErr.style.display = validatePhone(tel) ? 'none' : 'block';
  if (!validatePhone(tel)) valid = false;

  if (!valid) return;

  const data = {
    nome, tel, email, end, cpf, apelido,
    tsEdit: Date.now(),
    ...(AppState.editingClienteId ? { id: AppState.editingClienteId } : {})
  };

  await DB.save(STORES.CLIENTES, data);
  showToast('✅ Cliente salvo!');
  navigate('clientes', true);
}

// ── HELPERS for orcamentos.js ──────────────────────────────────────────────────
export async function getClienteByPhone(tel) {
  const clean = tel.replace(/\D/g, '');
  if (!clean || clean.length < 10) return null;
  const all = await DB.getAll(STORES.CLIENTES);
  return all.find(c => c.tel.replace(/\D/g, '') === clean) || null;
}

export async function extractClientFromOrc(orc) {
  const clean = (orc.tel || '').replace(/\D/g, '');
  if (!orc.nome || !clean) return;
  const all = await DB.getAll(STORES.CLIENTES);
  const existing = all.find(c => c.tel.replace(/\D/g, '') === clean);
  const data = {
    nome: orc.nome,
    tel: orc.tel,
    email: orc.email || '',
    end: orc.end || '',
    apelido: orc.apelido || '',
    tsEdit: Date.now()
  };
  if (existing) await DB.save(STORES.CLIENTES, { ...existing, ...data });
  else await DB.save(STORES.CLIENTES, data);
}
