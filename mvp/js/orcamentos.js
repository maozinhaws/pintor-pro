import { DB, STORES } from './db.js';
import { navigate } from './router.js';
import { showToast } from './toast.js';
import { AppState } from './state.js';
import { extractClientFromOrc, getClienteByPhone } from './clientes.js';
import { sharePDF } from './pdf.js';
import {
  formatPhone, validatePhone, validateFullName, escapeHtml,
  calcOrcTotal, money, formatNum, formatDateBR,
  generateId, numFromInput, normalizeMeasureInput, normalizeDecimalInput,
  getItemMeasureLabel, compressImage
} from './utils.js';

const CONTAINER = 'view-orcamentos';
const STATUS_LIST = ['Pendente', 'Enviado', 'Aprovado', 'Concluído', 'Recusado'];
const SERVICE_OPTS = ['Lixar', 'Massa corrida', 'Selador/Primer', '1 demão', '2 demãos', '3 demãos', 'Textura', 'Caulim', 'Verniz', 'Esmalte'];
const NOME_SUGESTOES = ['Quarto', 'Sala', 'Cozinha', 'Banheiro', 'Área de Serviço', 'Varanda', 'Corredor', 'Escritório', 'Garagem', 'Fachada', 'Muro', 'Teto', 'Geral'];

// ── LIST ──────────────────────────────────────────────────────────────────────
let _allOrcs = [];
let _activeStatus = 'Todos';

export async function renderOrcList() {
  const el = document.getElementById(CONTAINER);
  if (!el) return;

  el.innerHTML = `
    <div class="view-header">
      <h1>Orçamentos</h1>
      <button class="btn btn--primary btn--sm" id="btn-novo-orc">+ Novo</button>
    </div>
    <div class="search-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35"/></svg>
      <input class="input" id="orc-search" type="search" placeholder="Buscar orçamento…" autocomplete="off">
      <button class="search-clear" id="orc-search-clear" aria-label="Limpar">✕</button>
    </div>
    <div class="filter-row" id="status-filters"></div>
    <div class="list" id="orc-list"></div>
  `;

  document.getElementById('btn-novo-orc').addEventListener('click', () => {
    AppState.draftItems = [];
    AppState.draftOrc = null;
    AppState.editingOrcId = null;
    navigate('orc/new');
  });

  const searchEl = document.getElementById('orc-search');
  const clearBtn = document.getElementById('orc-search-clear');
  searchEl.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', searchEl.value.length > 0);
    _applyFilters(searchEl.value);
  });
  clearBtn.addEventListener('click', () => {
    searchEl.value = '';
    clearBtn.classList.remove('visible');
    _applyFilters('');
  });

  _renderStatusFilters();
  _allOrcs = await DB.getAll(STORES.ORCAMENTOS);
  _applyFilters('');
}

function _renderStatusFilters() {
  const el = document.getElementById('status-filters');
  if (!el) return;
  const filters = ['Todos', ...STATUS_LIST];
  el.innerHTML = filters.map(s =>
    `<button class="filter-chip${_activeStatus === s ? ' active' : ''}" data-status="${s}">${s}</button>`
  ).join('');
  el.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeStatus = btn.dataset.status;
      _renderStatusFilters();
      _applyFilters(document.getElementById('orc-search')?.value || '');
    });
  });
}

function _applyFilters(query) {
  const listEl = document.getElementById('orc-list');
  if (!listEl) return;
  const q = query.toLowerCase().trim();
  let filtered = _allOrcs;
  if (_activeStatus !== 'Todos') filtered = filtered.filter(o => o.status === _activeStatus);
  if (q) filtered = filtered.filter(o =>
    (o.nome || '').toLowerCase().includes(q) || (o.tel || '').includes(q)
  );
  _renderOrcList(filtered, listEl);
}

function _renderOrcList(orcs, listEl) {
  if (!orcs.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
        <p>Nenhum orçamento encontrado.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = orcs.map(o => {
    const total = calcOrcTotal(o);
    const badge = _statusBadge(o.status);
    const date = o.date || '';
    return `
      <div class="orc-card" data-id="${o.id}">
        <div class="orc-card-body">
          <div class="orc-card-name">${escapeHtml(o.nome || '—')}</div>
          ${o.tel ? `<div class="orc-card-phone">${escapeHtml(o.tel)}</div>` : ''}
          <div class="orc-card-meta">
            ${badge}
            <span class="orc-date">${date}</span>
            <span style="font-size:11px;color:var(--muted);">${o.items?.length || 0} iten${(o.items?.length || 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="orc-card-right">
          <span class="orc-total">${money(total)}</span>
          <button class="ctx-trigger" data-ctx="${o.id}" aria-label="Opções">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.orc-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.ctx-trigger')) return;
      AppState.draftItems = [];
      AppState.draftOrc = null;
      navigate(`orc/edit/${card.dataset.id}`);
    });
  });

  listEl.querySelectorAll('.ctx-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      _openCtxMenu(btn.dataset.ctx, btn);
    });
  });
}

function _statusBadge(status) {
  const cls = (status || 'pendente').toLowerCase().replace(/\s+|í/g, s => s === 'í' ? 'i' : '-').replace(/ú/g, 'u');
  return `<span class="badge badge--${cls}">${escapeHtml(status || 'Pendente')}</span>`;
}

let _activeCtx = null;
function _openCtxMenu(orcId, trigger) {
  _closeCtxMenu();
  const orc = _allOrcs.find(o => String(o.id) === String(orcId));
  if (!orc) return;

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.style.top = (trigger.getBoundingClientRect().bottom + window.scrollY + 4) + 'px';
  menu.innerHTML = `
    <button class="ctx-item" data-action="edit">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
      Editar
    </button>
    <button class="ctx-item" data-action="pdf">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
      Gerar PDF
    </button>
    <button class="ctx-item" data-action="wa">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>
      WhatsApp
    </button>
    <button class="ctx-item danger" data-action="del">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916"/></svg>
      Excluir
    </button>
  `;

  menu.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    _closeCtxMenu();
    if (action === 'edit') { AppState.draftItems = []; AppState.draftOrc = null; navigate(`orc/edit/${orcId}`); }
    else if (action === 'pdf') { await sharePDF(orc); }
    else if (action === 'wa') { _shareWA(orc); }
    else if (action === 'del') { await _deleteOrc(orcId); }
  });

  document.body.appendChild(menu);
  _activeCtx = menu;
  setTimeout(() => document.addEventListener('click', _closeCtxMenu, { once: true }), 0);
}

function _closeCtxMenu() {
  if (_activeCtx) { _activeCtx.remove(); _activeCtx = null; }
}

function _shareWA(orc) {
  const total = calcOrcTotal(orc);
  const items = (orc.items || []).map(it => `- ${it.nome || it.name}`).join('\n');
  const msg = `Olá ${orc.nome || 'Cliente'}!\n\nSegue o orçamento solicitado:\n\n${items ? items + '\n\n' : ''}*Total: ${money(total)}*\n\nValidade: ${orc.valid || 15} dias`;
  const tel = (orc.tel || '').replace(/\D/g, '');
  window.open(tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

async function _deleteOrc(id) {
  if (!confirm('Excluir este orçamento permanentemente?')) return;
  await DB.delete(STORES.ORCAMENTOS, id);
  showToast('Orçamento excluído.');
  _allOrcs = _allOrcs.filter(o => String(o.id) !== String(id));
  _applyFilters('');
}

// ── FORM ──────────────────────────────────────────────────────────────────────
export async function renderOrcForm(id) {
  AppState.editingOrcId = id || null;
  const el = document.getElementById(CONTAINER);
  if (!el) return;

  let orc = null;
  if (id) {
    orc = await DB.getById(STORES.ORCAMENTOS, id);
    if (!orc) { navigate('orcamentos', true); return; }
    // Restore items from saved orc if not already in draft
    if (!AppState.draftItems.length && orc.items) {
      AppState.draftItems = JSON.parse(JSON.stringify(orc.items));
    }
  }

  const todayBR = formatDateBR();

  el.innerHTML = `
    <div class="form-view-header">
      <button class="back-btn" id="orc-back">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>
      </button>
      <h1>${id ? 'Editar Orçamento' : 'Novo Orçamento'}</h1>
    </div>

    <!-- CLIENTE -->
    <div class="form-section">
      <div class="form-section-title">Cliente</div>
      <div class="form-grid">
        <div class="field-group">
          <label for="orc-nome">Nome completo *</label>
          <input class="input" id="orc-nome" type="text" placeholder="Ex: João da Silva" autocapitalize="words" value="${escapeHtml(orc?.nome || '')}">
          <span id="orc-nome-err" style="color:var(--danger);font-size:12px;display:none;">Informe o nome completo</span>
        </div>
        <div class="field-group">
          <label for="orc-tel">Telefone *</label>
          <input class="input" id="orc-tel" type="tel" placeholder="(11) 9 9999-9999" value="${escapeHtml(orc?.tel || '')}">
          <span id="orc-tel-err" style="color:var(--danger);font-size:12px;display:none;">Telefone inválido</span>
        </div>
        <div class="field-group">
          <label for="orc-email">E-mail</label>
          <input class="input" id="orc-email" type="email" placeholder="email@exemplo.com" value="${escapeHtml(orc?.email || '')}">
        </div>
        <div class="field-group">
          <label for="orc-end">Endereço / Local</label>
          <input class="input" id="orc-end" type="text" placeholder="Rua, número, bairro, cidade" value="${escapeHtml(orc?.end || '')}">
        </div>
      </div>
    </div>

    <!-- ITENS -->
    <div class="form-section">
      <div class="form-section-title">Itens / Medidas</div>
      <div id="items-list"></div>
      <button class="btn btn--outline btn--full" id="btn-add-item" style="margin-top:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Adicionar Item
      </button>
    </div>

    <!-- VALOR -->
    <div class="form-section">
      <div class="form-section-title">Valor</div>
      <div class="segmented" id="valor-toggle">
        <button id="btn-total" class="${!orc?.precoM2 ? 'active' : ''}">Valor Total</button>
        <button id="btn-m2" class="${orc?.precoM2 ? 'active' : ''}">Por m²</button>
      </div>
      <div class="field-group" style="margin-top:12px;">
        <label for="orc-preco" id="orc-preco-label">${orc?.precoM2 ? 'Valor por m²' : 'Valor total'}</label>
        <input class="input" id="orc-preco" type="text" inputmode="decimal" placeholder="0,00" value="${escapeHtml(orc?.precoM2 ? String(orc.precoM2).replace('.', ',') : orc?.precoFixo ? String(orc.precoFixo).replace('.', ',') : '')}">
      </div>
      <div id="total-hint" class="total-hint" style="display:none;"></div>
    </div>

    <!-- DETALHES -->
    <div class="form-section">
      <div class="form-section-title">Detalhes</div>
      <div class="form-grid form-grid-2">
        <div class="field-group">
          <label for="orc-status">Status</label>
          <select class="input" id="orc-status">
            ${STATUS_LIST.map(s => `<option value="${s}"${(orc?.status || 'Pendente') === s ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field-group">
          <label for="orc-valid">Validade (dias)</label>
          <input class="input" id="orc-valid" type="number" placeholder="15" value="${escapeHtml(String(orc?.valid || '15'))}">
        </div>
        <div class="field-group">
          <label for="orc-inicio">Início previsto</label>
          <input class="input" id="orc-inicio" type="date" value="${escapeHtml(orc?.inicio || '')}">
        </div>
      </div>
      <div class="field-group" style="margin-top:12px;">
        <label for="orc-obs">Observações</label>
        <textarea class="input" id="orc-obs" placeholder="Condições, materiais inclusos, prazo…" rows="3">${escapeHtml(orc?.obs || '')}</textarea>
      </div>
    </div>

    <div class="form-bottom-bar">
      <button class="btn btn--outline" id="btn-pdf-orc" style="flex:0 0 auto;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        PDF
      </button>
      <button class="btn btn--primary btn--full" id="btn-salvar-orc">Salvar</button>
    </div>

    <!-- ITEM MODAL -->
    <div class="glass-overlay" id="item-modal" style="display:none;">
      <div class="modal-box">
        <div class="modal-header">
          <h2 id="item-modal-title">Novo Item</h2>
          <button class="modal-close" id="item-modal-close">✕</button>
        </div>
        <div class="modal-body" id="item-modal-body"></div>
        <div class="modal-footer">
          <button class="btn btn--outline" id="item-cancel">Cancelar</button>
          <button class="btn btn--primary btn--full" id="item-salvar">Salvar Item</button>
        </div>
      </div>
    </div>

    <!-- CAMERA MODAL -->
    <div id="camera-modal">
      <div class="camera-top-bar">
        <button class="camera-btn" id="btn-camera-close" aria-label="Fechar câmera">✕</button>
        <span style="color:#fff;font-size:13px;font-weight:700;flex:1;text-align:center;" id="camera-count">0 fotos</span>
        <button class="camera-btn" id="btn-torch" style="display:none;" aria-label="Lanterna">🔦</button>
      </div>
      <video id="camera-video" playsinline autoplay muted></video>
      <canvas id="camera-canvas" style="display:none;"></canvas>
      <div class="camera-thumbs" id="camera-thumbs"></div>
      <div class="camera-bottom-bar">
        <button class="camera-shutter" id="btn-capture" aria-label="Capturar foto"></button>
        <button class="camera-confirm-btn" id="btn-camera-ok">Usar fotos</button>
      </div>
    </div>
  `;

  _initOrcForm(orc);
}

function _initOrcForm(orc) {
  document.getElementById('orc-back').addEventListener('click', () => {
    if (AppState.draftItems.length && !confirm('Sair sem salvar? As alterações serão perdidas.')) return;
    AppState.draftItems = [];
    navigate('orcamentos', true);
  });

  // Phone auto-format + client autofill
  const telInput = document.getElementById('orc-tel');
  telInput.addEventListener('input', async function() {
    const pos = this.selectionStart;
    const oldLen = this.value.length;
    this.value = formatPhone(this.value);
    const diff = this.value.length - oldLen;
    try { this.setSelectionRange(pos + diff, pos + diff); } catch {}

    if (validatePhone(this.value)) {
      const found = await getClienteByPhone(this.value);
      if (found) {
        const nomeEl = document.getElementById('orc-nome');
        const emailEl = document.getElementById('orc-email');
        const endEl = document.getElementById('orc-end');
        if (!nomeEl.value) nomeEl.value = found.nome || '';
        if (!emailEl.value) emailEl.value = found.email || '';
        if (!endEl.value) endEl.value = found.end || '';
      }
    }
  });

  // Valor toggle
  let isM2 = !!(orc?.precoM2);
  document.getElementById('btn-total').addEventListener('click', () => { isM2 = false; _setValorMode(false); });
  document.getElementById('btn-m2').addEventListener('click', () => { isM2 = true; _setValorMode(true); });
  _setValorMode(isM2);

  const precoInput = document.getElementById('orc-preco');
  precoInput.addEventListener('input', function() {
    this.value = normalizeDecimalInput(this.value);
    _updateTotalHint();
  });

  // Items
  _renderItemsList();

  document.getElementById('btn-add-item').addEventListener('click', () => _openItemModal(null));

  // Save
  document.getElementById('btn-salvar-orc').addEventListener('click', _saveOrc);

  // PDF
  document.getElementById('btn-pdf-orc').addEventListener('click', async () => {
    const orc = _collectOrc();
    if (!orc) return;
    await sharePDF(orc);
  });

  // Item modal events
  document.getElementById('item-modal-close').addEventListener('click', _closeItemModal);
  document.getElementById('item-cancel').addEventListener('click', _closeItemModal);
  document.getElementById('item-salvar').addEventListener('click', _saveItem);
  document.getElementById('item-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('item-modal')) _closeItemModal();
  });

  // Camera events
  document.getElementById('btn-camera-close').addEventListener('click', _closeCameraModal);
  document.getElementById('btn-capture').addEventListener('click', _capturePhoto);
  document.getElementById('btn-camera-ok').addEventListener('click', _confirmCameraPhotos);
}

function _setValorMode(m2) {
  document.getElementById('btn-total').classList.toggle('active', !m2);
  document.getElementById('btn-m2').classList.toggle('active', m2);
  const lbl = document.getElementById('orc-preco-label');
  if (lbl) lbl.textContent = m2 ? 'Valor por m²' : 'Valor total';
  _updateTotalHint();
}

function _updateTotalHint() {
  const hint = document.getElementById('total-hint');
  if (!hint) return;
  const isM2 = document.getElementById('btn-m2').classList.contains('active');
  if (!isM2) { hint.style.display = 'none'; return; }
  const preco = numFromInput(document.getElementById('orc-preco')?.value || '');
  const totalM2 = AppState.draftItems.reduce((s, it) => {
    const l = numFromInput(it.largura || it.comp || 0);
    const a = numFromInput(it.altura || it.alt || 0);
    return s + (l > 0 && a > 0 ? l * a : 0);
  }, 0);
  if (preco > 0 && totalM2 > 0) {
    hint.style.display = 'block';
    hint.textContent = `= ${money(preco * totalM2)} (${formatNum(totalM2)} m²)`;
  } else {
    hint.style.display = 'none';
  }
}

// ── ITEMS LIST ────────────────────────────────────────────────────────────────
function _renderItemsList() {
  const el = document.getElementById('items-list');
  if (!el) return;
  if (!AppState.draftItems.length) {
    el.innerHTML = `<div style="color:var(--muted);font-size:14px;padding:8px 0;">Nenhum item adicionado.</div>`;
    return;
  }
  el.innerHTML = AppState.draftItems.map((it, i) => {
    const label = getItemMeasureLabel(it.largura || it.comp, it.altura || it.alt);
    const servs = (it.services || []).slice(0, 3).join(', ');
    const photoCount = (it.photos || it.fotos || []).length;
    return `
      <div class="item-card" data-idx="${i}">
        <div class="item-card-body">
          <div class="item-card-name">${i + 1}. ${escapeHtml(it.nome || it.name || 'Item')}</div>
          ${label ? `<div class="item-card-measure">${label}</div>` : ''}
          ${servs ? `<div style="font-size:11px;color:var(--muted);">${escapeHtml(servs)}</div>` : ''}
          ${photoCount ? `<div style="font-size:11px;color:var(--primary);">📷 ${photoCount} foto${photoCount > 1 ? 's' : ''}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="ctx-trigger item-edit-btn" data-idx="${i}" title="Editar" style="color:var(--muted);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/></svg>
          </button>
          <button class="item-del-btn" data-idx="${i}" title="Remover">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.item-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); _openItemModal(parseInt(btn.dataset.idx)); });
  });
  el.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.item-actions')) return;
      _openItemModal(parseInt(card.dataset.idx));
    });
  });
  el.querySelectorAll('.item-del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      AppState.draftItems.splice(parseInt(btn.dataset.idx), 1);
      _renderItemsList();
      _updateTotalHint();
    });
  });
}

// ── ITEM MODAL ────────────────────────────────────────────────────────────────
function _openItemModal(idx) {
  AppState.editingItemId = idx;
  const item = idx !== null ? AppState.draftItems[idx] : null;
  AppState.modalPhotos = item ? [...(item.photos || item.fotos || [])] : [];
  AppState.modalServices = item ? [...(item.services || [])] : [];

  const body = document.getElementById('item-modal-body');
  const title = document.getElementById('item-modal-title');
  if (!body || !title) return;

  title.textContent = idx !== null ? 'Editar Item' : 'Novo Item';

  body.innerHTML = `
    <div class="form-grid" style="gap:12px;">
      <div class="field-group">
        <label>Nome do item *</label>
        <input class="input" id="modal-nome" type="text" placeholder="Ex: Quarto, Sala, Parede…" value="${escapeHtml(item?.nome || item?.name || '')}">
        <div class="chips-wrap" style="margin-top:6px;" id="nome-sugestoes">
          ${NOME_SUGESTOES.map(n => `<button class="chip" data-nome="${n}">${n}</button>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field-group">
          <label>Largura (m)</label>
          <input class="input" id="modal-larg" type="text" inputmode="decimal" placeholder="0,00" value="${escapeHtml(item ? String(item.largura || item.comp || '').replace('.', ',') : '')}">
        </div>
        <div class="field-group">
          <label>Altura (m)</label>
          <input class="input" id="modal-alt" type="text" inputmode="decimal" placeholder="0,00" value="${escapeHtml(item ? String(item.altura || item.alt || '').replace('.', ',') : '')}">
        </div>
      </div>
      <div id="modal-area-badge" style="${(item?.largura || item?.comp) ? '' : 'display:none;'}">
        <span class="area-badge" id="modal-area-label"></span>
      </div>
      <div class="field-group">
        <label>Serviços</label>
        <div class="chips-wrap" id="services-chips">
          ${SERVICE_OPTS.map(s => `<button class="chip${AppState.modalServices.includes(s) ? ' active' : ''}" data-svc="${s}">${s}</button>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">
        <div class="field-group" style="margin:0;">
          <label>Preço do item (opcional)</label>
          <input class="input" id="modal-preco" type="text" inputmode="decimal" placeholder="0,00" value="${escapeHtml(item?.price ? String(item.price).replace('.', ',') : '')}">
        </div>
        <div class="field-group" style="margin:0;margin-top:20px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap;">
            <input type="checkbox" id="modal-perm2" ${item?.perMeter ? 'checked' : ''}> por m²
          </label>
        </div>
      </div>
      <div class="field-group">
        <label>Observações</label>
        <textarea class="input" id="modal-obs" rows="2" placeholder="Estado da parede, cor…">${escapeHtml(item?.obs || '')}</textarea>
      </div>
      <div class="field-group">
        <label>Fotos</label>
        <div style="display:flex;gap:10px;">
          <button class="btn btn--sm btn--outline" id="btn-camera" type="button" style="flex:1;">📷 Câmera</button>
          <label class="btn btn--sm" style="flex:1;justify-content:center;cursor:pointer;">
            🖼️ Galeria
            <input type="file" id="modal-gallery" accept="image/*" multiple style="display:none;">
          </label>
        </div>
        <div id="modal-error-camera" style="color:var(--danger);font-size:12px;display:none;margin-top:4px;">⚠️ Câmera não disponível. Use a galeria.</div>
        <div class="photo-grid" id="modal-photo-grid" style="margin-top:8px;"></div>
      </div>
    </div>
  `;

  _renderModalPhotos();
  _updateModalArea();

  // Nome sugestoes
  body.querySelectorAll('[data-nome]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-nome').value = btn.dataset.nome;
    });
  });

  // Services
  body.querySelectorAll('[data-svc]').forEach(chip => {
    chip.addEventListener('click', () => {
      const s = chip.dataset.svc;
      const idx2 = AppState.modalServices.indexOf(s);
      if (idx2 >= 0) AppState.modalServices.splice(idx2, 1);
      else AppState.modalServices.push(s);
      chip.classList.toggle('active', AppState.modalServices.includes(s));
    });
  });

  // Medidas
  document.getElementById('modal-larg').addEventListener('input', function() {
    this.value = normalizeMeasureInput(this.value);
    _updateModalArea();
  });
  document.getElementById('modal-alt').addEventListener('input', function() {
    this.value = normalizeMeasureInput(this.value);
    _updateModalArea();
  });

  // Camera
  document.getElementById('btn-camera').addEventListener('click', () => _openCameraModal());
  document.getElementById('modal-gallery').addEventListener('change', async function() {
    for (const file of this.files) {
      try {
        const url = await compressImage(file);
        AppState.modalPhotos.push(url);
        _renderModalPhotos();
      } catch {}
    }
    this.value = '';
  });

  document.getElementById('item-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-nome')?.focus(), 100);
}

function _updateModalArea() {
  const badge = document.getElementById('modal-area-badge');
  const label = document.getElementById('modal-area-label');
  const larg = document.getElementById('modal-larg')?.value || '';
  const alt = document.getElementById('modal-alt')?.value || '';
  const txt = getItemMeasureLabel(larg, alt);
  if (badge) badge.style.display = txt ? 'block' : 'none';
  if (label) label.textContent = txt;
  _updateTotalHint();
}

function _renderModalPhotos() {
  const grid = document.getElementById('modal-photo-grid');
  if (!grid) return;
  if (!AppState.modalPhotos.length) { grid.innerHTML = ''; return; }
  grid.innerHTML = AppState.modalPhotos.map((src, i) => `
    <div class="photo-card">
      <button class="photo-remove" data-pi="${i}" type="button">✕</button>
      <img src="${src}" alt="Foto ${i + 1}" loading="lazy">
    </div>`).join('');
  grid.querySelectorAll('.photo-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.modalPhotos.splice(parseInt(btn.dataset.pi), 1);
      _renderModalPhotos();
    });
  });
}

function _closeItemModal() {
  document.getElementById('item-modal').style.display = 'none';
  _closeCameraModal();
}

function _saveItem() {
  const nome = document.getElementById('modal-nome')?.value.trim();
  if (!nome) { showToast('⚠️ Informe o nome do item'); return; }

  const larg = normalizeMeasureInput(document.getElementById('modal-larg')?.value || '');
  const alt = normalizeMeasureInput(document.getElementById('modal-alt')?.value || '');
  const precoRaw = document.getElementById('modal-preco')?.value || '';
  const perMeter = document.getElementById('modal-perm2')?.checked || false;
  const obs = document.getElementById('modal-obs')?.value.trim() || '';

  const item = {
    id: AppState.editingItemId !== null ? (AppState.draftItems[AppState.editingItemId]?.id || generateId()) : generateId(),
    nome,
    largura: numFromInput(larg),
    comp: numFromInput(larg),
    altura: numFromInput(alt),
    alt: numFromInput(alt),
    name: nome,
    services: [...AppState.modalServices],
    price: numFromInput(precoRaw),
    perMeter,
    obs,
    photos: [...AppState.modalPhotos],
    fotos: [...AppState.modalPhotos]
  };

  if (AppState.editingItemId !== null) {
    AppState.draftItems[AppState.editingItemId] = item;
  } else {
    AppState.draftItems.push(item);
  }

  _closeItemModal();
  _renderItemsList();
  _updateTotalHint();
  showToast('✅ Item salvo');
}

// ── CAMERA ────────────────────────────────────────────────────────────────────
async function _openCameraModal() {
  const errEl = document.getElementById('modal-error-camera');
  if (errEl) errEl.style.display = 'none';

  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Not supported');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
    AppState.cameraStream = stream;
    const video = document.getElementById('camera-video');
    video.srcObject = stream;

    const modal = document.getElementById('camera-modal');
    modal.classList.add('open');
    _renderCameraThumbs();

    // Torch support
    const track = stream.getVideoTracks()[0];
    const caps = track.getCapabilities ? track.getCapabilities() : {};
    const torchBtn = document.getElementById('btn-torch');
    if (torchBtn && caps.torch) {
      torchBtn.style.display = 'flex';
      torchBtn.onclick = () => {
        const on = torchBtn.dataset.on === '1';
        track.applyConstraints({ advanced: [{ torch: !on }] });
        torchBtn.dataset.on = on ? '0' : '1';
        torchBtn.textContent = on ? '🔦' : '💡';
      };
    }
  } catch (err) {
    if (errEl) errEl.style.display = 'block';
    showToast(err?.name === 'NotAllowedError' ? '⚠️ Permissão de câmera negada' : '⚠️ Câmera indisponível');
  }
}

function _stopCameraStream() {
  AppState.cameraStream?.getTracks().forEach(t => t.stop());
  AppState.cameraStream = null;
  const video = document.getElementById('camera-video');
  if (video) video.srcObject = null;
  const torchBtn = document.getElementById('btn-torch');
  if (torchBtn) { torchBtn.style.display = 'none'; torchBtn.dataset.on = '0'; torchBtn.textContent = '🔦'; }
}

function _closeCameraModal() {
  document.getElementById('camera-modal')?.classList.remove('open');
  _stopCameraStream();
}

function _capturePhoto() {
  const video = document.getElementById('camera-video');
  if (!video?.videoWidth) { showToast('⚠️ Aguarde a câmera iniciar'); return; }
  const canvas = document.getElementById('camera-canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
  AppState.modalPhotos.push(dataUrl);
  _renderCameraThumbs();
  _updateCameraCount();
  showToast('📸 Foto capturada');
}

function _renderCameraThumbs() {
  const el = document.getElementById('camera-thumbs');
  if (!el) return;
  el.innerHTML = AppState.modalPhotos.map(src =>
    `<div class="camera-thumb"><img src="${src}" alt="thumb"></div>`
  ).join('');
}

function _updateCameraCount() {
  const el = document.getElementById('camera-count');
  if (el) el.textContent = `${AppState.modalPhotos.length} foto${AppState.modalPhotos.length !== 1 ? 's' : ''}`;
}

function _confirmCameraPhotos() {
  if (!AppState.modalPhotos.length) { showToast('⚠️ Capture ao menos uma foto'); return; }
  _closeCameraModal();
  _renderModalPhotos();
  showToast('✅ Fotos adicionadas');
}

// ── SAVE ORC ──────────────────────────────────────────────────────────────────
function _collectOrc() {
  const nome = document.getElementById('orc-nome')?.value.trim() || '';
  const tel = document.getElementById('orc-tel')?.value.trim() || '';

  let valid = true;
  const nomeErr = document.getElementById('orc-nome-err');
  const telErr = document.getElementById('orc-tel-err');
  nomeErr.style.display = validateFullName(nome) ? 'none' : 'block';
  if (!validateFullName(nome)) valid = false;
  telErr.style.display = validatePhone(tel) ? 'none' : 'block';
  if (!validatePhone(tel)) valid = false;
  if (!valid) return null;

  const isM2 = document.getElementById('btn-m2').classList.contains('active');
  const precoVal = numFromInput(document.getElementById('orc-preco')?.value || '');

  return {
    ...(AppState.editingOrcId ? { id: AppState.editingOrcId } : {}),
    nome,
    tel,
    email: document.getElementById('orc-email')?.value.trim() || '',
    end: document.getElementById('orc-end')?.value.trim() || '',
    items: [...AppState.draftItems],
    precoM2: isM2 ? precoVal : 0,
    precoFixo: !isM2 ? precoVal : 0,
    status: document.getElementById('orc-status')?.value || 'Pendente',
    valid: document.getElementById('orc-valid')?.value || '15',
    inicio: document.getElementById('orc-inicio')?.value || '',
    obs: document.getElementById('orc-obs')?.value.trim() || '',
    date: formatDateBR(),
    ts: AppState.editingOrcId ? undefined : Date.now(),
    tsEdit: Date.now()
  };
}

async function _saveOrc() {
  const orc = _collectOrc();
  if (!orc) return;

  const btn = document.getElementById('btn-salvar-orc');
  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    await DB.save(STORES.ORCAMENTOS, orc);
    await extractClientFromOrc(orc);
    AppState.draftItems = [];
    AppState.draftOrc = null;
    AppState.editingOrcId = null;
    showToast('✅ Orçamento salvo!');
    navigate('orcamentos', true);
  } catch (e) {
    console.error(e);
    showToast('⚠️ Erro ao salvar');
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
}
