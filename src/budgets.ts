import { S, saveOrcs } from './state';
import { toast, esc, f1, ptFloat, money, formatNum, getRoomMeds } from './utils';
import { canNavigateAsync, go, homeTab } from './navigation';
import { buildHistoricoEntries } from './services/orcamentos';
import type { Config } from './types';

const defCfg = S.config;

// ── Cálculo total de um orçamento ──
function calcOrcTotal(orc: any): number {
  let tot = 0; let totalM2 = 0;
  (orc.rooms || []).forEach((r: any) => {
    const meds = getRoomMeds(r);
    const measArea = meds.m2 + meds.ml;
    totalM2 += measArea;
    if (r.preco) tot += r.precoPerM2 ? (r.preco * measArea) : r.preco;
    (r.items || []).forEach((it: any) => {
      if (it.price) tot += it.perMeter
        ? (it.price * ((ptFloat(it.alt) * ptFloat(it.comp)) || ptFloat(it.alt) || ptFloat(it.comp)))
        : it.price;
    });
  });
  if (orc.preco && totalM2) tot += orc.preco * totalM2;
  return tot;
}

function calcTotal(): number {
  return calcOrcTotal({ rooms: S.rooms, preco: parseFloat((document.getElementById('preco-m2') as HTMLInputElement)?.value) || 0 });
}

function setRoomBasePrice(ri: number, rawValue: string): void {
  const r = S.rooms[ri];
  if (!r) return;
  r.preco = ptFloat(rawValue);
  S.isDirty = true;
  calcTotal();
  _updatePrecoBaseDisplay(ri);
  refreshWAPreview();
}

function setRoomBasePriceMode(ri: number, precoPerM2: boolean): void {
  const r = S.rooms[ri];
  if (!r) return;
  r.precoPerM2 = precoPerM2;
  S.isDirty = true;
  calcTotal();
  _updatePrecoBaseDisplay(ri);
  refreshWAPreview();
}

function _hasDraftContent(orc: any): boolean {
  return !!(
    String(orc.nome || '').trim() ||
    String(orc.tel || '').trim() ||
    String(orc.obs || '').trim() ||
    (orc.rooms || []).some((r: any) => (r.preco || 0) > 0 || (r.items || []).length > 0)
  );
}

function saveDraft(): boolean {
  const orc = collectOrc();
  if (!_hasDraftContent(orc)) { S.isDirty = false; return false; }
  orc.status = 'Rascunho';
  orc.isFlashDraft = false;
  if (S.editId) {
    const i = S.orcs.findIndex(o => o.id === S.editId);
    if (i >= 0) S.orcs[i] = orc; else S.orcs.unshift(orc);
  } else {
    S.orcs.unshift(orc);
    S.editId = orc.id;
  }
  S.isDirty = false;
  saveOrcs();
  extractClient(orc);
  (window as any).renderHomeMini?.();
  (window as any).renderOrcamentosList?.();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-save"/></svg> Rascunho salvo');
  return true;
}

// ── Seletro de Modo (3 modos: flash, foto, detalhado) ──
let selectedMode: 'flash' | 'foto' | 'detalhado' = 'detalhado';

function showModeSelector(): void {
  canNavigateAsync(() => {
    const modal = document.getElementById('mode-selector-modal');
    if (modal) modal.style.display = 'flex';
  });
}

function selectMode(mode: 'flash' | 'foto' | 'detalhado'): void {
  selectedMode = mode;
  const modal = document.getElementById('mode-selector-modal');
  if (modal) modal.style.display = 'none';

  if (mode === 'flash') newOrcFlash();
  else if (mode === 'foto') newOrcFoto();
  else newOrcDetalhado();
}

// ── Novo orçamento - Modo Flash (simples, 3 passos) ──
function newOrcFlash(): void {
  canNavigateAsync(() => {
    S.isDirty = true;
    selectedMode = 'flash';
    S.rooms = [{ id: Date.now().toString(), name: 'Geral', alt: 0, comp: 0, items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false }];
    S.pgto = new Set(); S.fmt = 'simples'; S.pagador = false; S.editId = null;
    initializeOrcForm();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-zap"/></svg> Modo Flash: rápido e simples');
    go(1);
  });
}

// ── Novo orçamento - Modo Foto (com câmera) ──
function newOrcFoto(): void {
  canNavigateAsync(() => {
    S.isDirty = true;
    selectedMode = 'foto';
    S.rooms = [{ id: Date.now().toString(), name: 'Geral', alt: 0, comp: 0, items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false }];
    S.pgto = new Set(); S.fmt = 'area'; S.pagador = false; S.editId = null;
    initializeOrcForm();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-camera"/></svg> Modo Foto: capture e organize');
    go(1);
  });
}

// ── Novo orçamento - Modo Detalhado (completo) ──
function newOrcDetalhado(): void {
  canNavigateAsync(() => {
    S.isDirty = true;
    selectedMode = 'detalhado';
    S.rooms = [{ id: Date.now().toString(), name: 'Geral', alt: 0, comp: 0, items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false }];
    S.pgto = new Set(); S.fmt = 'completo'; S.pagador = false; S.editId = null;
    initializeOrcForm();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-list"/></svg> Modo Detalhado: todas as informações');
    go(1);
  });
}

// ── Inicializar formulário comum ──
function initializeOrcForm(): void {
  ['cli-nome','cli-apelido','cli-tel','cli-email','cli-cpf','cli-cep','cli-logradouro','cli-bairro','cli-cidade','cli-numero','cli-comp'].forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = '';
  });
  document.getElementById('end-fields')!.style.display = 'none';
  document.getElementById('end-manual-toggle')!.style.display = 'block';
  document.getElementById('cep-msg')!.style.display = 'none';
  renderPgtoList();
  document.querySelectorAll('.chk-item').forEach(el => el.classList.remove('on'));
  ['orc-obs','orc-inicio'].forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = '';
  });
  const tipoServ = document.getElementById('orc-tipo-serv') as HTMLSelectElement | null;
  if (tipoServ) tipoServ.selectedIndex = 2;
  const fmtCards = document.querySelectorAll('.fmt-card');
  const expectedIndex = S.fmt === 'simples' ? 0 : (S.fmt === 'area' ? 1 : 2);
  fmtCards.forEach((c, i) => c.classList.toggle('on', i === expectedIndex));
  document.getElementById('pag-sw')?.classList.remove('on');
  document.getElementById('pag-fields')?.classList.remove('show');
  renderRooms();
  setTimeout(() => {
    const sel = document.getElementById('orc-status') as HTMLSelectElement | null;
    if (sel) sel.value = S.statusArr[0] || 'Pendente';
  }, 50);
}

// ── Editar orçamento ──
function editOrc(i: number): void {
  canNavigateAsync(() => {
    const o = S.orcs[i]; if (!o) return;
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-edit"/></svg> Carregando orçamento…');
    S.isDirty = true; S.editId = o.id;
    S.rooms = JSON.parse(JSON.stringify(o.rooms || []));
    S.pgto = new Set(o.pgto || []); S.fmt = o.fmt || 'completo'; S.pagador = o.pagador || false;
    selectedMode = (o as any).mode || 'detalhado';
    renderPgtoList(); go(1);
    setTimeout(() => {
      const v = (id: string, val: any) => { const el = document.getElementById(id) as HTMLInputElement | null; if (el) el.value = val || ''; };
      v('cli-nome', o.nome); v('cli-apelido', o.apelido || ''); v('cli-tel', o.tel); v('cli-email', o.email); v('cli-cpf', o.cpf); v('cli-cep', o.cep); v('cli-logradouro', o.logradouro); v('cli-numero', o.numero); v('cli-comp', o.comp); v('cli-bairro', o.bairro); v('cli-cidade', o.cidade);
      if (o.logradouro) document.getElementById('end-fields')!.style.display = 'block';
      v('pag-nome', o.pagNome); v('pag-tel', o.pagTel); v('pag-end', o.pagEnd); v('preco-m2', o.preco); v('orc-status', o.status); v('orc-valid', o.valid); v('orc-inicio', o.inicio); v('orc-obs', o.obs);
      if (o.isFlashDraft) { const sel = document.getElementById('orc-status') as HTMLSelectElement | null; if (sel) sel.value = S.statusArr[0] || 'Pendente'; setTimeout(() => toast('<svg class="ico" aria-hidden="true"><use href="#ico-zap"/></svg> Orçamento Flash — complete os dados para finalizar.'), 100); }
      if (o.tipoServico) (document.getElementById('orc-tipo-serv') as HTMLSelectElement).value = o.tipoServico;
      document.getElementById('pag-sw')?.classList.toggle('on', o.pagador);
      document.getElementById('pag-fields')?.classList.toggle('show', o.pagador);
      document.querySelectorAll('.fmt-card').forEach(c => {
        const fn = c.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        c.classList.toggle('on', fn === o.fmt);
      });
      renderRooms();
    }, 50);
  });
}

// ── Coletar dados do form em objeto ──
function collectOrc(): any {
  const v = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value || '';
  const end = [v('cli-logradouro'), v('cli-numero'), v('cli-comp'), v('cli-bairro'), v('cli-cidade')].filter(Boolean).join(', ');
  return {
    id: S.editId || Date.now().toString(), nome: v('cli-nome'), apelido: v('cli-apelido'), tel: v('cli-tel'), email: v('cli-email'), cpf: v('cli-cpf'), cep: v('cli-cep'),
    logradouro: v('cli-logradouro'), numero: v('cli-numero'), comp: v('cli-comp'), bairro: v('cli-bairro'), cidade: v('cli-cidade'), end,
    pagNome: v('pag-nome'), pagTel: v('pag-tel'), pagEnd: v('pag-end'), pagador: S.pagador, rooms: S.rooms.map(r => ({ ...r })),
    pgto: Array.from(S.pgto), fmt: S.fmt, preco: parseFloat(v('preco-m2')) || 0, status: v('orc-status') || S.statusArr[0], valid: v('orc-valid') || '15',
    tipoServico: v('orc-tipo-serv'),
    inicio: v('orc-inicio'), obs: v('orc-obs'), date: new Date().toLocaleDateString('pt-BR'),
    mode: selectedMode,
    ts: S.editId ? S.orcs.find(o => o.id === S.editId)?.ts : Date.now(), tsEdit: Date.now()
  };
}

// ── Extrair cliente do orçamento ──
function extractClient(orc: any): void {
  const tStr = (orc.tel || '').replace(/\D/g, ''); if (!orc.nome || !tStr) return;
  const idx = S.clientes.findIndex(c => c.tel.replace(/\D/g, '') === tStr);
  if (idx >= 0) {
    S.clientes[idx].nome = orc.nome; S.clientes[idx].apelido = orc.apelido || '';
    S.clientes[idx].email = orc.email; S.clientes[idx].end = orc.end;
    S.clientes[idx].cpf = orc.cpf; S.clientes[idx].ts = Date.now();
    if (orc.apelido) (S.clientes[idx] as any).notas = '[ref: ' + orc.apelido + ']';
  } else {
    S.clientes.push({ nome: orc.nome, apelido: orc.apelido || '', tel: orc.tel, email: orc.email, end: orc.end, cpf: orc.cpf, cep: orc.cep, logradouro: orc.logradouro, numero: orc.numero, comp: orc.comp, bairro: orc.bairro, cidade: orc.cidade, ts: Date.now() });
  }
  localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
}

// ── Salvar orçamento ──
function saveOrc(silent = false): boolean {
  const orc = collectOrc(); const telClean = (orc.tel || '').replace(/\D/g, '');
  if (telClean && telClean.length < 10) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Telefone inválido. Informe o DDD.'); return false; }
  if (!orc.nome.trim()) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Informe o nome do cliente'); return false; }
  if ((orc.status || '').toLowerCase().includes('flash')) { orc.status = S.statusArr[0] || 'Pendente'; }
  orc.isFlashDraft = false;

  // Build history entries for this save
  if (S.editId) {
    const idx = S.orcs.findIndex(o => o.id === S.editId);
    const anterior = idx >= 0 ? S.orcs[idx] : null;
    const novasEntradas = buildHistoricoEntries(anterior, orc);
    if (!orc.historico) orc.historico = [];
    if (anterior?.historico) orc.historico = [...anterior.historico, ...novasEntradas];
    else orc.historico = novasEntradas;
    if (idx >= 0) S.orcs[idx] = orc;
    else S.orcs.unshift(orc);
  } else {
    const novasEntradas = buildHistoricoEntries(null, orc);
    orc.historico = novasEntradas;
    S.orcs.unshift(orc);
    S.editId = orc.id;
  }

  S.isDirty = false; saveOrcs(); extractClient(orc);
  (window as any).renderHomeMini?.();
  if (!silent) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Orçamento salvo!'); homeTab('orcamentos'); setTimeout(() => { (window as any).renderOrcamentosList?.(); }, 100); }
  else { (window as any).renderOrcamentosList?.(); }
  return true;
}

// ── Trigger action (save / WA) ──
function triggerAction(action: string): void {
  const nome = ((document.getElementById('cli-nome') as HTMLInputElement)?.value || '').trim();
  const telStr = ((document.getElementById('cli-tel') as HTMLInputElement)?.value || '').replace(/\D/g, '');
  if (!nome) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Insira o nome do cliente na aba Dados do Cliente!');
  if (telStr && telStr.length < 10) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Telefone inválido. Inclua o DDD.');
  const saved = saveOrc(true); if (!saved) return;
  if (action === 'save') { toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Salvo com sucesso!'); homeTab('orcamentos'); }
  else if (action === 'wa') { sendWA(); setTimeout(() => homeTab('orcamentos'), 500); }
  else if (action === 'pdf') { _doPDFFromOrc(collectOrc()); }
}

// ── Rooms ──
function renderRooms(): void {
  const wrap = document.getElementById('rooms-wrap');
  if (!wrap) return;
  if (!S.rooms.length) S.rooms = [{ id: Date.now().toString(), name: 'Geral', alt: 0, comp: 0, items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false }];
  wrap.innerHTML = '';

  S.rooms.forEach((r: any, ri: number) => {
    if (r.collapsed === undefined) r.collapsed = false;
    if (!r.items) r.items = []; if (!r.services) r.services = S.DEFAULT_SERVICES.slice();
    const meds = getRoomMeds(r); const medTxt: string[] = [];
    if (meds.m2 > 0) medTxt.push(`${f1(meds.m2)} m²`); if (meds.ml > 0) medTxt.push(`${f1(meds.ml)} ml`);
    const medLabel = medTxt.length ? medTxt.join(' + ') : '—';

    const itemsHtml = r.items.map((it: any, ii: number) => {
      const a = ptFloat(it.alt), c = ptFloat(it.comp);
      const badge = (a && c) ? f1(a * c) + ' m²' : (a || c) ? f1(a || c) + ' m' : 'Sem medidas';
      return `<div class="item-summary" onclick="editItem(${ri}, ${ii})"><div style="flex:1; min-width:0;"><div style="font-weight:700; font-size:15px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(it.name || 'Item ' + (ii + 1))}</div><div style="font-size:12px; color:var(--ink3); margin-top:3px;"><svg class="ico" aria-hidden="true"><use href="#ico-ruler"/></svg> ${esc(badge)} • ${(it.services || []).length} serv.</div></div><button class="item-del" onclick="event.stopPropagation();removeItem(${ri},${ii})"><svg class="ico" aria-hidden="true"><use href="#ico-x"/></svg></button></div>`;
    }).join('');

    const card = document.createElement('div'); card.className = 'rcard' + (r.collapsed ? ' collapsed' : ''); card.id = 'rcard' + ri;
    const hasMult = S.rooms.length > 1;
    const headerHtml = hasMult ? `
      <div class="rcard-head" onclick="tCard(${ri})" style="gap:10px;"><span class="rcard-em" style="font-size:26px;"><svg class="ico" aria-hidden="true"><use href="#ico-pin"/></svg></span><div style="flex:1;min-width:0;"><input class="rcard-name" style="border:none;outline:none;background:transparent;font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:var(--ink);width:100%;" value="${r.name.replace(/"/g, '&quot;')}" onclick="event.stopPropagation()" onchange="S.rooms[${ri}].name=this.value;renderRooms();">${medLabel !== '—' ? `<div style="font-size:13px;color:var(--ink3);margin-top:2px;"><svg class="ico" aria-hidden="true"><use href="#ico-ruler"/></svg> ${esc(medLabel)} (Soma)</div>` : `<div style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:#FEF3C7;border:1.5px solid #F59E0B;border-radius:10px;padding:5px 12px;font-size:13px;font-weight:700;color:#92400E;">+ Adicionar itens</div>`}</div><button class="rcard-del" onclick="event.stopPropagation();delRoom(${ri},event)"><svg class="ico" aria-hidden="true"><use href="#ico-x"/></svg></button></div>
    ` : '';

    card.innerHTML = `${headerHtml}
      <div class="rcard-body">
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:800;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;"><svg class="ico" aria-hidden="true"><use href="#ico-banknote"/></svg> ${hasMult ? 'Preço base do local' : 'Preço Total Base'}</div>
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="flex:1;"><div style="position:relative;"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:15px;font-weight:700;color:var(--ink3);">R$</span><input type="text" inputmode="decimal" placeholder="0,00" value="${r.preco ? String(r.preco).replace('.', ',') : ''}" style="width:100%;height:52px;background:var(--bg-input);border:2px solid var(--bdr-input);border-radius:14px;padding:0 14px 0 42px;font-family:'Calibri',sans-serif;font-size:18px;color:var(--gn);outline:none;" onfocus="this.style.borderColor='var(--gn)'; this.select();" onblur="const v=ptFloat(this.value);this.value=v?v.toFixed(2).replace('.',','):'';setRoomBasePrice(${ri},this.value);this.style.borderColor='var(--bdr-input)';" oninput="this.value=this.value.replace('.',',');setRoomBasePrice(${ri},this.value);"></div><div id="preco-base-total-${ri}" style="display:${r.precoPerM2 ? 'block' : 'none'};margin-top:6px;font-size:12px;font-weight:700;color:var(--gn);padding:5px 10px;background:var(--gnl,#d1fae5);border-radius:8px;"></div></div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--ink3);cursor:pointer;white-space:nowrap;"><input type="radio" name="preco-tipo-${ri}" value="fixo" ${!r.precoPerM2 ? 'checked' : ''} onchange="setRoomBasePriceMode(${ri},false);" style="accent-color:var(--bl);width:16px;height:16px;"> Fixo</label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--ink3);cursor:pointer;white-space:nowrap;"><input type="radio" name="preco-tipo-${ri}" value="m2" ${r.precoPerM2 ? 'checked' : ''} onchange="setRoomBasePriceMode(${ri},true);" style="accent-color:var(--bl);width:16px;height:16px;"> Por m²</label>
            </div>
          </div>
        </div>
        <div style="border-top:1.5px solid var(--bdr);padding-top:16px;">
          <div style="font-size:15px;font-weight:700;color:var(--ink);margin-bottom:12px;">Itens</div>
          <div id="items-wrap-${ri}">${itemsHtml}</div>
          <button onclick="addItem(${ri})" class="add-room-btn">＋ Adicionar Novo Item</button>
        </div>
      </div>`;
    wrap.appendChild(card);
  });
}

let curRi: number | null = null;
let curIi: number | null = null;
let isNewItem = false;

function tCard(id: number): void { document.getElementById('rcard' + String(id))?.classList.toggle('collapsed'); }

function delRoom(ri: number, e?: Event): void {
  if (e) e.stopPropagation();
  (window as any).askDelete('Deseja excluir este local e suas medidas?', () => {
    S.rooms.splice(ri, 1); renderRooms();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg> Local Removido');
    S.isDirty = true;
  });
}

function addItem(ri: number): void {
  curRi = ri; S.tempItem = { name: '', alt: '', comp: '', services: [], price: 0, perMeter: false, obs: '', photos: [] };
  isNewItem = true; _detailNomeFirst = true; _detailObsFirst = true;
  S.rooms[ri].collapsed = false;
  document.getElementById('item-modal-form')!.style.display = 'flex';
  renderItemModal();
}

function editItem(ri: number, ii: number): void {
  curRi = ri; curIi = ii;
  S.tempItem = JSON.parse(JSON.stringify(S.rooms[ri].items[ii]));
  isNewItem = false; _detailNomeFirst = false; _detailObsFirst = false;
  document.getElementById('item-modal-form')!.style.display = 'flex';
  renderItemModal();
}

function removeItem(ri: number, ii: number): void {
  (window as any).askDelete('Excluir este item permanentemente?', () => {
    S.rooms[ri].items.splice(ii, 1); renderRooms(); S.isDirty = true;
  });
}

// ── Item modal ──
let _detailNomeFirst = false;
let _detailObsFirst = false;

function _detailGetAreaLabel(comp: string | number, alt: string | number): string | null {
  const c = ptFloat(String(comp)), a = ptFloat(String(alt));
  if (c > 0 && a > 0) return 'Área: ' + (c * a).toFixed(2).replace('.', ',') + ' m²';
  if (c > 0 || a > 0) return 'Linear: ' + (c || a).toFixed(2).replace('.', ',') + ' m';
  return null;
}

function _updateItemPrecoDisplay(): void {
  const el = document.getElementById('item-preco-total-display');
  if (!el) return;
  if (!S.tempItem || !S.tempItem.perMeter || !S.tempItem.price) { el.style.display = 'none'; return; }
  const alt = ptFloat(S.tempItem.alt);
  const comp = ptFloat(S.tempItem.comp);
  const m2 = (alt && comp) ? alt * comp : (alt || comp);
  const total = S.tempItem.price * m2;
  el.style.display = 'block';
  el.textContent = m2 > 0
    ? '= R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' (' + m2.toFixed(2).replace('.', ',') + ' m²)'
    : 'Preencha as medidas do item para calcular o total';
}

function _updatePrecoBaseDisplay(ri: number): void {
  const el = document.getElementById('preco-base-total-' + ri);
  if (!el) return;
  const r = S.rooms[ri];
  if (!r || !r.precoPerM2) { el.style.display = 'none'; return; }
  const meds2 = getRoomMeds(r);
  const area = meds2.m2 + meds2.ml;
  const total = (r.preco || 0) * area;
  const unit = meds2.m2 > 0 ? 'm²' : 'ml';
  el.style.display = 'block';
  el.textContent = area > 0
    ? '= R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' (' + area.toFixed(2).replace('.', ',') + ' ' + unit + ')'
    : 'Adicione itens com medidas para calcular o total';
}

function _detailUpdateArea(): void {
  const el = document.getElementById('item-area-display');
  if (el && S.tempItem) {
    const lbl = _detailGetAreaLabel(S.tempItem.comp, S.tempItem.alt);
    el.style.display = lbl ? 'block' : 'none';
    if (lbl) el.textContent = lbl;
  }
  _updateItemPrecoDisplay();
}

function _detailNomeClick(): void {
  if (_detailNomeFirst) { _detailNomeFirst = false; openDetailNamePick(); }
}

function _detailObsClick(): void {
  if (_detailObsFirst) { _detailObsFirst = false; openServicesModal(); }
}




function renderItemModal(): void {
  const it = S.tempItem;
  const _areaLbl = _detailGetAreaLabel(it.comp, it.alt);
  document.getElementById('item-modal-body')!.innerHTML = `
    <div class="fld">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <label class="flbl" style="margin-bottom:0;">NOME DO ITEM</label>
        <button type="button" onclick="openDetailNamePick()" style="background:#ede9fe;border:none;border-radius:8px;padding:4px 10px;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;color:#7c3aed;cursor:pointer;">☰ Sugestões</button>
      </div>
      <input id="modal-it-name" class="finput item-title-inp" value="${esc(it.name)}" placeholder="Ex: Parede Norte" autocomplete="off" data-form-type="other" autocapitalize="words" autocorrect="off" spellcheck="false">
    </div>
    <div class="dim2-grid">
      <div class="mbox"><div class="mlbl">Largura (m)</div><input id="modal-it-comp" class="minp" type="text" inputmode="decimal" autocomplete="off" data-form-type="other" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="0,00" value="${it.comp ? String(it.comp).replace('.', ',') : ''}"></div>
      <div class="mbox"><div class="mlbl">Altura (m)</div><input id="modal-it-alt" class="minp" type="text" inputmode="decimal" autocomplete="off" data-form-type="other" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="0,00" value="${it.alt ? String(it.alt).replace('.', ',') : ''}"></div>
    </div>
    <div id="item-area-display" style="display:${_areaLbl ? 'block' : 'none'};margin-bottom:14px;font-size:12px;font-weight:700;color:var(--gn);padding:5px 10px;background:var(--gnl,#d1fae5);border-radius:8px;">${_areaLbl || ''}</div>

    <div id="item-photos-section" style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;margin-bottom:8px;">Fotos do Item</div>
    <div style="display:flex;justify-content:center;gap:16px;margin:4px 0 12px;">
      <button type="button" onclick="openDetailedCamera()" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fb923c);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 20px rgba(249,115,22,0.3);"><svg class="ico" aria-hidden="true" style="color:#fff;width:28px;height:28px;"><use href="#ico-camera"/></svg></button>
      <label style="width:60px;height:60px;border-radius:50%;background:var(--bg2);border:1.5px solid var(--bdr-input);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-top:6px;" title="Galeria"><svg class="ico" aria-hidden="true" style="width:24px;height:24px;color:var(--ink3);"><use href="#ico-image"/></svg><input type="file" accept="image/*" style="display:none;" onchange="handlePhotoFile(this,false)"></label>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
      ${(it.photos || []).map((p: any, idx: number) => `
        <div onclick="openPhotoViewer(${idx},'item')"
             style="background:var(--bg2);border:2px solid ${p.annotated ? '#EF4444' : 'var(--bdr)'};border-radius:12px;padding:3px;position:relative;cursor:pointer;">
          <img src="${esc(p.url)}" style="width:100%;height:62px;object-fit:cover;border-radius:9px;display:block;" alt="Foto ${idx + 1}">
          ${p.annotated ? '<span style="position:absolute;bottom:5px;left:3px;right:3px;background:rgba(239,68,68,.85);color:#fff;font-size:7px;font-weight:800;text-align:center;padding:1px 0;border-radius:0 0 6px 6px;letter-spacing:.04em;">ANOTADA</span>' : ''}
        </div>
      `).join('')}
    </div>

    <div style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;margin-bottom:10px;">Preço Adicional (Somente para este item)</div>
    <div class="price-check-row" style="margin-bottom:8px;">
      <input id="modal-it-price" type="text" inputmode="decimal" placeholder="R$ 0,00" value="${it.price ? String(it.price).replace('.', ',') : ''}">
      <label class="pcheck" style="white-space: nowrap;"><input id="modal-it-permeter" type="checkbox" ${it.perMeter ? 'checked' : ''}><span class="info-icon" onclick="event.preventDefault(); event.stopPropagation(); toast('Multiplicar por m².')">?</span> por m²</label>
    </div>
    <div id="item-preco-total-display" style="display:${it.perMeter && it.price ? 'block' : 'none'};margin-bottom:16px;font-size:12px;font-weight:700;color:var(--gn);padding:5px 10px;background:var(--gnl,#d1fae5);border-radius:8px;"></div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <span style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;">Observações</span>
      <button type="button" onclick="openServicesModal()" style="background:#d1fae5;border:none;border-radius:8px;padding:5px 11px;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;color:#059669;cursor:pointer;">☰ Serviços</button>
    </div>
    <textarea id="modal-it-obs" class="item-obs-inp" autocomplete="off" data-form-type="other" autocorrect="off" spellcheck="false" placeholder="Detalhes, estado da parede, cor, serviços...">${it.obs || ''}</textarea>
  `;
  document.getElementById('item-modal-body')!.scrollTop = 0;

  // Bind direct event listeners (avoids inline onclick/oninput global function issues)
  // Note: no auto-focus here — focusing while camera is open triggers Android keyboard unexpectedly
  const nameInp = document.getElementById('modal-it-name') as HTMLInputElement | null;
  const compInp = document.getElementById('modal-it-comp') as HTMLInputElement | null;
  const altInp = document.getElementById('modal-it-alt') as HTMLInputElement | null;
  const priceInp = document.getElementById('modal-it-price') as HTMLInputElement | null;
  const perMeterInp = document.getElementById('modal-it-permeter') as HTMLInputElement | null;
  const obsInp = document.getElementById('modal-it-obs') as HTMLTextAreaElement | null;

  const _next = (el: HTMLElement | null) => { if (el) { el.focus(); el instanceof HTMLInputElement && el.select(); } };

  if (nameInp) {
    nameInp.addEventListener('input', () => { if (S.tempItem) S.tempItem.name = nameInp.value; });
    nameInp.addEventListener('click', () => _detailNomeClick());
    nameInp.addEventListener('focus', () => nameInp.select());
    nameInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(compInp); } });
  }
  if (compInp) {
    compInp.addEventListener('input', () => { compInp.value = compInp.value.replace('.', ','); if (S.tempItem) S.tempItem.comp = compInp.value; _detailUpdateArea(); });
    compInp.addEventListener('blur', () => { if (compInp.value) { const v = ptFloat(compInp.value); compInp.value = v ? v.toFixed(2).replace('.', ',') : ''; if (S.tempItem) S.tempItem.comp = compInp.value; _detailUpdateArea(); } });
    compInp.addEventListener('focus', () => compInp.select());
    compInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(altInp); } });
  }
  if (altInp) {
    altInp.addEventListener('input', () => { altInp.value = altInp.value.replace('.', ','); if (S.tempItem) S.tempItem.alt = altInp.value; _detailUpdateArea(); });
    altInp.addEventListener('blur', () => { if (altInp.value) { const v = ptFloat(altInp.value); altInp.value = v ? v.toFixed(2).replace('.', ',') : ''; if (S.tempItem) S.tempItem.alt = altInp.value; _detailUpdateArea(); } });
    altInp.addEventListener('focus', () => altInp.select());
    altInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(priceInp); } });
  }
  if (priceInp) {
    priceInp.addEventListener('input', () => { priceInp.value = priceInp.value.replace('.', ','); if (S.tempItem) S.tempItem.price = ptFloat(priceInp.value); _updateItemPrecoDisplay(); });
    priceInp.addEventListener('blur', () => {
      if (!S.tempItem) return;
      if (priceInp.value) {
        const v = ptFloat(priceInp.value);
        if (v) { priceInp.value = v.toFixed(2).replace('.', ','); S.tempItem.price = v; }
        else { priceInp.value = ''; S.tempItem.price = 0; }
      } else { S.tempItem.price = 0; }
    });
    priceInp.addEventListener('focus', () => priceInp.select());
    priceInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(obsInp); } });
  }
  if (perMeterInp) {
    perMeterInp.addEventListener('change', () => { if (S.tempItem) S.tempItem.perMeter = perMeterInp.checked; _updateItemPrecoDisplay(); });
  }
  if (obsInp) {
    obsInp.addEventListener('input', () => { if (S.tempItem) S.tempItem.obs = obsInp.value; });
    obsInp.addEventListener('click', () => _detailObsClick());
  }

}

// ── Services modal ──
function openServicesModal(): void {
  if (!S.tempItem) return;
  document.getElementById('services-modal')!.style.display = 'flex';
  _renderItemObsChips();
}

function closeServicesModal(): void {
  document.getElementById('services-modal')!.style.display = 'none';
}

function _renderItemObsChips(): void {
  const sel: string[] = S.tempItem.services || [];
  const srvList = S.DEFAULT_SERVICES;
  const matList = ((S.config as Config).flashMateriais || defCfg.flashMateriais).split(',').map((s: string) => s.trim()).filter(Boolean);
  const chip = (s: string, type: string) => {
    const on = sel.includes(s);
    const bg = on ? (type === 'srv' ? '#7c3aed' : '#059669') : '#f1f5f9';
    const col = on ? '#fff' : (type === 'srv' ? '#7c3aed' : '#059669');
    const bdr = on ? 'transparent' : (type === 'srv' ? '#ddd6fe' : '#d1fae5');
    return `<button type="button" data-srv="${esc(s)}" onclick="toggleItemObsSvc(this.dataset.srv)" style="padding:7px 12px;border-radius:20px;border:1.5px solid ${bdr};background:${bg};font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:${col};cursor:pointer;">${esc(s)}</button>`;
  };
  document.getElementById('services-modal-body')!.innerHTML = srvList.map((s: string) => chip(s, 'srv')).join('');
  document.getElementById('services-modal-mat-body')!.innerHTML = matList.map((s: string) => chip(s, 'mat')).join('');
}

function toggleItemObsSvc(s: string): void {
  if (!S.tempItem.services) S.tempItem.services = [];
  const i = S.tempItem.services.indexOf(s);
  if (i >= 0) S.tempItem.services.splice(i, 1); else S.tempItem.services.push(s);
  S.isDirty = true; _renderItemObsChips();
}

function confirmItemObsPick(): void {
  const ta = document.querySelector('#item-modal-body .item-obs-inp') as HTMLTextAreaElement | null;
  const currentText = (ta ? ta.value : '') || (S.tempItem.obs || '');
  const allKnown = [...(S.DEFAULT_SERVICES || []), ...(((S.config as Config).flashMateriais || defCfg.flashMateriais).split(',').map((s: string) => s.trim()).filter(Boolean))];
  const customParts = currentText.split(',').map((s: string) => s.trim()).filter((s: string) => s && !allKnown.includes(s));
  const selected: string[] = S.tempItem.services || [];
  const merged = [...customParts, ...selected];
  S.tempItem.obs = merged.join(', ');
  if (ta) ta.value = S.tempItem.obs;
  closeServicesModal();
}

// ── Nome pick (detail) ──
function openDetailNamePick(): void {
  if (!S.tempItem) return;
  const nomes = ((S.config as Config).flashNomes || defCfg.flashNomes).split(',').map((s: string) => s.trim()).filter(Boolean);
  document.getElementById('detail-nome-pick-grid')!.innerHTML = nomes.map((n: string) =>
    `<button type="button" data-nm="${esc(n)}" onclick="selectDetailNome(this.dataset.nm)" style="padding:10px 4px;border-radius:10px;border:1.5px solid var(--bdr-input);background:var(--bg2);font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;text-align:center;">${esc(n)}</button>`
  ).join('');
  document.getElementById('detail-nome-pick-modal')!.style.display = 'flex';
}

function closeDetailNamePick(): void { document.getElementById('detail-nome-pick-modal')!.style.display = 'none'; }

function selectDetailNome(n: string): void {
  S.tempItem.name = n;
  const inp = document.querySelector('#item-modal-body .item-title-inp') as HTMLInputElement | null;
  if (inp) inp.value = n;
  closeDetailNamePick();
}


function saveItemModal(): void {
  if (!S.tempItem) { console.error('saveItemModal: S.tempItem is null'); return; }
  if (curRi === null || curRi === undefined) { console.error('saveItemModal: curRi is null'); return; }
  if (!S.tempItem.name || !S.tempItem.name.trim()) S.tempItem.name = 'Item sem nome';
  if (isNewItem) {
    if (!S.rooms[curRi].items) S.rooms[curRi].items = [];
    S.rooms[curRi].items.push(S.tempItem);
  } else {
    if (curIi !== null && curIi !== undefined) S.rooms[curRi].items[curIi] = S.tempItem;
  }
  S.isDirty = true;
  document.getElementById('item-modal-form')!.style.display = 'none';
  (window as any).Keyboard?.hide?.().catch?.(() => {});
  renderRooms();
}

function cancelItemModal(): void {
  document.getElementById('item-modal-form')!.style.display = 'none';
  curRi = null; curIi = null; S.tempItem = null;
}

// ── Photos ──
function openDetailedCamera(): void {
  const openCameraFn = (window as any).openCamera;
  if (typeof openCameraFn !== 'function') {
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Câmera não disponível');
    return;
  }
  openCameraFn((photos: Blob[]) => {
    if (!S.tempItem.photos) S.tempItem.photos = [];
    photos.forEach((blob, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        S.tempItem.photos.push({ url, filename: `Foto_${Date.now()}_${idx}.jpg` });
        if (idx === photos.length - 1) {
          renderItemModal();
          toast(`<svg class="ico" aria-hidden="true"><use href="#ico-camera"/></svg> ${photos.length} foto(s) adicionada(s)!`);
        }
      };
      reader.readAsDataURL(blob);
    });
  });
}

function openPhotoChoice(): void { document.getElementById('photo-choice-modal')!.style.display = 'flex'; }

function triggerPhoto(source: string): void {
  document.getElementById('photo-choice-modal')!.style.display = 'none';
  const el = document.getElementById('file-' + source) as HTMLInputElement | null;
  if (el) el.click();
}

function handlePhotoFile(input: HTMLInputElement, _isCamera?: boolean): void {
  const file = input.files?.[0]; if (!file) return;
  compressImage(file, (dataUrl: string) => {
    if (!S.tempItem.photos) S.tempItem.photos = [];
    const fName = file.name || `Foto_${Date.now()}.jpg`;
    S.tempItem.photos.push({ url: dataUrl, filename: fName });
    renderItemModal();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-camera"/></svg> Foto adicionada!');
  });
  input.value = '';
}

function compressImage(file: File, callback: (url: string) => void): void {
  const reader = new FileReader(); reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image(); img.src = event.target!.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas'); let w = img.width, h = img.height; const MAX = 1280;
      if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; } else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      canvas.width = w; canvas.height = h; canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.75));
    };
  };
}

function compressDataUrl(dataUrl: string, maxPx: number, quality: number): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > h && w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
      else if (h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function delItemPhotoModalIdx(idx: number): void {
  (window as any).askDelete('Remover esta foto?', () => { S.tempItem.photos.splice(idx, 1); renderItemModal(); });
}

function openImg(url: string): void {
  (document.getElementById('img-modal-el') as HTMLImageElement).src = url;
  (document.getElementById('img-modal-dl') as HTMLAnchorElement).href = url;
  (document.getElementById('img-modal-dl') as HTMLAnchorElement).download = `foto_${Date.now()}.jpg`;
  document.getElementById('img-modal')!.style.display = 'flex';
}

// ── Pgto checklist ──
(window as any)._pgtoList = [];

function renderPgtoList(): void {
  (window as any)._pgtoList = (S.config.pgto || defCfg.pgto).split(',').map((s: string) => s.trim()).filter(Boolean);
  const wrap = document.getElementById('pgto-list');
  if (!wrap) return;
  wrap.innerHTML = (window as any)._pgtoList.map((p: string, i: number) => {
    const isOn = S.pgto.has(p);
    return `<div class="chk-item ${isOn ? 'on' : ''}" onclick="tChk(event, ${i}, this)"><div class="chk-box"></div><div class="chk-lbl">${esc(p)}</div></div>`;
  }).join('');
}

function tChk(e: Event, idx: number, el: HTMLElement): void {
  if (e) e.stopPropagation();
  const val = (window as any)._pgtoList[idx];
  if (!val) return;
  el.classList.toggle('on');
  if (el.classList.contains('on')) S.pgto.add(val); else S.pgto.delete(val);
  S.isDirty = true; refreshWAPreview();
}

function togglePagador(): void {
  S.pagador = !S.pagador;
  document.getElementById('pag-sw')?.classList.toggle('on', S.pagador);
  document.getElementById('pag-fields')?.classList.toggle('show', S.pagador);
  S.isDirty = true;
}

function setFmt(fmt: string, el: HTMLElement): void {
  S.fmt = fmt as any;
  document.querySelectorAll('.fmt-card').forEach(c => c.classList.remove('on'));
  el.classList.add('on'); refreshWAPreview(); S.isDirty = true;
}

// ── WA preview ──
function refreshWAPreview(): void {
  const orc = collectOrc(); const el = document.getElementById('wa-preview-inline');
  if (el) el.textContent = buildWAMsg(orc);
}

function buildWAMsg(orc: any): string {
  let m2 = 0; (orc.rooms || []).forEach((r: any) => { const meds = getRoomMeds(r); m2 += meds.m2 + meds.ml; });
  const totalValue = calcOrcTotal(orc);
  let detalhes = '';

  if (orc.fmt === 'area') {
    detalhes += `*Locais e Itens:*\n`;
    (orc.rooms || []).forEach((r: any) => {
      detalhes += `\n📍 *${r.name}*\n`;
      (r.items || []).forEach((it: any) => {
        detalhes += `  - ${it.name}${(it.services && it.services.length) ? ` (${it.services.join(', ')})` : ''}\n`;
        if (it.obs) detalhes += `    _Obs: ${it.obs}_\n`;
      });
    });
    if (m2 > 0) detalhes += `\n*Área total aprox:* ${f1(m2)} m²\n`;
  } else if (orc.fmt === 'completo') {
    detalhes += `*Detalhes:*\n`;
    (orc.rooms || []).forEach((r: any) => {
      detalhes += `\n📍 *${r.name}*\n`;
      (r.items || []).forEach((it: any) => {
        const a = parseFloat(it.alt) || 0, c = parseFloat(it.comp) || 0;
        let med = (a && c) ? f1(a * c) + ' m²' : (a || c) ? f1(a || c) + ' m' : '';
        detalhes += ` - ${it.name}`;
        if (med) detalhes += ` (${med})`;
        if (it.services && it.services.length) detalhes += ` [${it.services.join(', ')}]`;
        detalhes += `\n`;
        if (it.obs) detalhes += `   *Obs:* ${it.obs}\n`;
      });
    });
    if (m2 > 0) detalhes += `\n*Área total aprox:* ${f1(m2)} m²\n`;
  }

  if (orc.tipoServico) detalhes += `\n*Escopo:* ${orc.tipoServico}\n`;
  if (orc.pgto?.length) detalhes += `*Pagamento:* ${orc.pgto.join(', ')}\n`;
  if (orc.valid) detalhes += `*Validade:* ${orc.valid} dias\n`;
  if (orc.obs) detalhes += `*Obs Gerais:* ${orc.obs}\n`;

  const tFmt = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  let finalMsg = (S.config.msg || defCfg.msg).replace(/\\n/g, '\n').replace('{cliente}', orc.nome || 'Cliente').replace('{detalhes}', detalhes).replace('{total}', tFmt);

  if (!finalMsg.includes(tFmt)) finalMsg += `\n*Valor Total: ${tFmt}*`;

  return finalMsg;
}

function sendWA(): void {
  const orc = collectOrc(); const msg = buildWAMsg(orc);
  const tel = (orc.tel || '').replace(/\D/g, '');
  const url = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-send"/></svg> Abrindo WhatsApp…');
}

function sendWAIdx(i: number): void {
  const o = S.orcs[i]; if (!o) return;
  const msg = buildWAMsg(o); const tel = (o.tel || '').replace(/\D/g, '');
  const url = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── View orçamento ──
function viewOrc(i: number): void {
  const o = S.orcs[i]; if (!o) return;
  const tot = calcOrcTotal(o);
  const fmtVal = (v: any) => v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—';
  const fmtDate = (ts: number) => { if (!ts) return '—'; const d = new Date(ts); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
  const row = (label: string, val: string) => val ? `<div style="display:flex;gap:8px;margin-bottom:6px;font-size:13px;"><span style="color:var(--ink3);min-width:110px;flex-shrink:0;">${label}</span><span style="font-weight:600;color:var(--ink);word-break:break-word;">${esc(val)}</span></div>` : '';
  const sec = (title: string, content: string) => `<div style="margin-bottom:16px;"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--ink3);margin-bottom:8px;">${title}</div>${content}</div>`;

  let roomsHtml = '';
  (o.rooms || []).forEach((r: any, ri: number) => {
    const meds = getRoomMeds(r);
    let itemsHtml = (r.items || []).map((it: any) => {
      const a = ptFloat(it.alt), c = ptFloat(it.comp);
      const m2 = a && c ? (a * c).toFixed(2) + ' m²' : (a || c) ? (a || c).toFixed(2) + ' ml' : '';
      const price = it.price ? (it.perMeter ? `R$ ${it.price}/m` : `R$ ${it.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`) : '';
      return `<div style="font-size:12px;padding:5px 8px;background:var(--bg2);border-radius:7px;margin-bottom:4px;display:flex;justify-content:space-between;gap:8px;"><span style="color:var(--ink2);">${esc(it.name || it.serv || '—')}${m2 ? ' · ' + m2 : ''}</span><span style="color:var(--bl);font-weight:700;flex-shrink:0;">${price}</span></div>`;
    }).join('');
    const measArea = meds.m2 + meds.ml;
    const unit = meds.m2 > 0 ? 'm²' : 'ml';
    const rPrice = r.preco ? (r.precoPerM2 ? `R$ ${r.preco}/m² · ${measArea.toFixed(2)}${unit} = ${fmtVal(r.preco * measArea)}` : fmtVal(r.preco)) : '';
    roomsHtml += `<div style="margin-bottom:12px;border:1px solid var(--bdr);border-radius:10px;overflow:hidden;"><div style="padding:8px 12px;background:var(--bg-card);font-size:13px;font-weight:700;color:var(--ink);display:flex;justify-content:space-between;"><span>${esc(r.name || 'Ambiente ' + (ri + 1))}</span>${rPrice ? `<span style="color:var(--bl);">${esc(rPrice)}</span>` : ''}</div>${itemsHtml ? `<div style="padding:8px;">${itemsHtml}</div>` : ''}</div>`;
  });

  const addr = [o.logradouro, o.numero, o.comp, o.bairro, o.cidade].filter(Boolean).join(', ');
  const body = document.getElementById('view-orc-body')!;
  body.innerHTML = `
    ${o.isFlashDraft ? `<div style="background:var(--aml);border:1.5px solid var(--am);border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--am)" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><div style="flex:1;"><div style="font-size:13px;font-weight:800;color:var(--ink);">Rascunho Flash</div><div style="font-size:12px;color:var(--ink2);margin-top:1px;">Complete os dados para finalizar o orçamento.</div></div></div>` : ''}
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:12px;background:var(--bg-card);border-radius:12px;">
      <div style="flex:1;"><div style="font-size:16px;font-weight:800;color:var(--ink);">${esc(o.nome || '(sem nome)')}</div><div style="font-size:12px;color:var(--ink3);margin-top:2px;">${fmtDate(o.tsEdit || o.ts)}</div></div>
      <span class="hbadge ${getStatusBadgeClass(o.status)}" style="font-size:11px;">${esc(o.status || 'Pendente')}</span>
    </div>
    <div style="background:var(--bg-card);border-radius:12px;padding:14px;margin-bottom:16px;">
      <div style="font-size:22px;font-weight:800;color:var(--bl);text-align:center;">R$ ${tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <div style="font-size:11px;color:var(--ink3);text-align:center;margin-top:2px;">Valor total do orçamento</div>
    </div>
    ${sec('Cliente', row('Telefone', o.tel) + row('Email', o.email) + row('CPF', o.cpf) + row('Endereço', addr))}
    ${o.pagador ? sec('Pagador', row('Nome', o.pagNome) + row('Telefone', o.pagTel) + row('Endereço', o.pagEnd)) : ''}
    ${roomsHtml ? sec('Ambientes e Serviços', roomsHtml) : ''}
    ${sec('Detalhes', row('Tipo de Serviço', o.tipoServico) + row('Validade', o.valid ? o.valid + ' dias' : '') + row('Início', o.inicio) + row('Pagamento', [...(o.pgto || [])].join(', ')))}
    ${o.obs ? sec('Observações', `<div style="font-size:13px;color:var(--ink2);line-height:1.6;background:var(--bg2);border-radius:8px;padding:10px;white-space:pre-wrap;">${esc(o.obs)}</div>`) : ''}
  `;
  const tel = (o.tel || '').replace(/\D/g, '');
  document.getElementById('view-orc-actions')!.innerHTML = `
    <button onclick="closeViewOrc();editOrc(${i})" style="flex:1;height:44px;border-radius:12px;background:${o.isFlashDraft ? 'var(--am)' : 'var(--bl)'};color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><svg class="ico" aria-hidden="true"><use href="#ico-edit"/></svg> ${o.isFlashDraft ? 'Continuar no Detalhado' : 'Editar'}</button>
    <button onclick="closeViewOrc();_showSendOptions(${i})" style="height:44px;width:44px;border-radius:12px;background:var(--gnl);border:1.5px solid var(--gn);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--gn);flex-shrink:0;" title="Enviar / PDF"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></button>
  `;
  document.getElementById('view-orc-modal')!.style.display = 'flex';
}

function closeViewOrc(): void { document.getElementById('view-orc-modal')!.style.display = 'none'; }

// ── Orçamento list ──
function buildDateLabel(ts: number): string {
  if (!ts) return 'Sem data'; const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function getStatusBadgeClass(st: string): string {
  const s = (st || '').toLowerCase();
  if (s.includes('aprov') || s.includes('concl')) return 'hbg';
  if (s.includes('envia')) return 'hbb';
  if (s.includes('recus') || s.includes('cancel')) return 'hbr';
  return 'hby';
}

function _orcMatch(o: any, q: string): boolean {
  const tot = calcOrcTotal(o);
  const parts = [o.nome, o.apelido, o.tel, o.email, o.cpf, o.cep, o.logradouro, o.numero, o.comp, o.bairro, o.cidade, o.end, o.status, o.obs, o.date, o.inicio, o.tipoServico, o.pagNome, o.pagTel, o.pagEnd, (o.pgto || []).join(' '), tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '', (o.rooms || []).map((r: any) => [r.nome, r.obs, (r.items || []).map((it: any) => [it.name, it.obs].join(' ')).join(' ')].join(' ')).join(' ')];
  return parts.some(p => p && String(p).toLowerCase().includes(q));
}


function delOrc(i: number): void {
  S.orcs.splice(i, 1); saveOrcs(); (window as any).renderOrcamentosList?.(); (window as any).renderHomeMini?.();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg> Removido');
}

// ── Status picker ──
function _showStatusPicker(i: number): void {
  const o = S.orcs[i]; if (!o) return;
  const list = document.getElementById('status-picker-list')!;
  list.innerHTML = S.statusArr.map(s => {
    const isCur = (o.status || '') === s;
    return `<div onclick="_applyStatus(${i},'${s.replace(/'/g, "\\'")}');document.getElementById('status-picker-modal').style.display='none';"
      style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;cursor:pointer;
      background:${isCur ? 'var(--bll)' : 'var(--bg-card)'};border:1.5px solid ${isCur ? 'var(--bl)' : 'var(--bdr)'};">
      <span style="flex:1;font-size:13px;font-weight:${isCur ? '800' : '600'};color:${isCur ? 'var(--bl)' : 'var(--ink)'};">${esc(s)}</span>
      ${isCur ? '<svg class="ico" aria-hidden="true" style="color:var(--bl);"><use href="#ico-check-circle"/></svg>' : ''}
    </div>`;
  }).join('');
  document.getElementById('status-picker-modal')!.style.display = 'flex';
}

function _applyStatus(i: number, newStatus: string): void {
  const o = S.orcs[i]; if (!o) return;
  o.status = newStatus; o.tsEdit = Date.now(); saveOrcs();
  (window as any).renderOrcamentosList?.(); (window as any).renderHomeMini?.();
  _onStatusChange({ value: newStatus });
}

function _onStatusChange(sel: { value: string }): void {
  const v = (sel.value || '').toLowerCase();
  const msgs: Record<string, string> = {
    'aprovado': '👍 Ótimo! Lembre de salvar e de combinar data de início.',
    'em andamento': '🎨 Obra em andamento! Não esqueça de salvar.',
    'obra iniciada': '🏗️ Obra iniciada! Atualize quando concluir.',
    'obra finalizada': '✅ Obra finalizada! Que tal emitir o recibo?',
    'pagamento iniciado': '💰 Pagamento iniciado. Salve para registrar.',
    'pagamento finalizado': '🎉 Pagamento recebido! Salve o orçamento.',
  };
  const tip = Object.entries(msgs).find(([k]) => v.includes(k));
  if (tip) toast(tip[1]);
  else toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Status alterado. Não esqueça de salvar.');
}


// ── Logo preview (stub — fully implemented in appConfig) ──
function renderLogoPreview(): void {
  const userLogo = S.config.logo;
  const img = document.getElementById('cfg-logo-preview') as HTMLImageElement | null;
  const txt = document.getElementById('cfg-logo-placeholder');
  const homeImg = document.getElementById('home-logo-img') as HTMLImageElement | null;
  const sideImg = document.getElementById('sidebar-logo-img') as HTMLImageElement | null;
  if (sideImg) { sideImg.src = '/apple-touch-icon.png'; sideImg.style.display = 'block'; }
  if (userLogo) {
    if (img) { img.src = userLogo; img.style.display = 'block'; } if (txt) txt.style.display = 'none';
    if (homeImg) { homeImg.src = userLogo; homeImg.style.display = 'block'; }
  } else {
    if (img) { img.src = ''; img.style.display = 'none'; } if (txt) txt.style.display = 'block';
    if (homeImg) { homeImg.src = ''; homeImg.style.display = 'none'; }
  }
}

// ── 3-dot card menu ──
function toggleCardMenu(id: string): void {
  const el = document.getElementById(id); if (!el) return;
  const isOpen = el.style.display !== 'none'; closeCardMenus();
  if (!isOpen) el.style.display = 'block';
}

function closeCardMenus(): void {
  document.querySelectorAll('.card-menu-drop').forEach(el => (el as HTMLElement).style.display = 'none');
}

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.card-menu-wrap')) closeCardMenus();
});

function _canRecibo(o: any): boolean {
  if (o.isFlashDraft) return false;
  const s = (o.status || '').toLowerCase().trim();
  const allowed = ['em andamento', 'aprovado', 'obra iniciada', 'obra finalizada', 'pagamento iniciado', 'pagamento finalizado'];
  return allowed.some(x => s === x || s.includes(x));
}

function _canPDF(o: any): boolean {
  const s = (o.status || '').toLowerCase();
  return !o.isFlashDraft && !!s && s !== 'draft' && !s.includes('rascunho');
}

let _sendOptIdx = -1;
let _sendFmt = 'completo';

function _showSendOptions(realIdx: number): void {
  _sendOptIdx = realIdx; const o = S.orcs[realIdx]; if (!o) return;
  _setSendFmt(o.fmt || 'completo');
  const pr = document.getElementById('send-photos-row');
  if (pr) pr.style.display = 'none';
  document.getElementById('send-opts-modal')!.style.display = 'flex';
}

function _setSendFmt(fmt: string): void {
  _sendFmt = fmt;
  ['completo', 'area', 'simples'].forEach(f => {
    const b = document.getElementById('sfmt-' + f) as HTMLElement | null; if (!b) return;
    if (f === fmt) { b.style.borderColor = 'var(--bl)'; b.style.background = 'var(--bl)'; b.style.color = '#fff'; }
    else { b.style.borderColor = 'var(--bdr-input)'; b.style.background = 'var(--bg2)'; b.style.color = 'var(--ink2)'; }
  });
}

function _rascunhoModalAlterarStatus(): void {
  document.getElementById('rascunho-block-modal')!.style.display = 'none';
  _showStatusPicker(_sendOptIdx);
}

function _doSendWA(): void {
  document.getElementById('send-opts-modal')!.style.display = 'none';
  const o = S.orcs[_sendOptIdx]; if (!o) return;
  const stLow = (o.status || '').toLowerCase();
  if (stLow === 'rascunho' || stLow === 'draft' || !o.status) {
    document.getElementById('rascunho-block-modal')!.style.display = 'flex'; return;
  }
  const prev = o.fmt; o.fmt = _sendFmt as 'completo' | 'area' | 'simples';
  const msg = buildWAMsg(o); const tel = (o.tel || '').replace(/\D/g, '');
  window.open(tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-send"/></svg> Abrindo WhatsApp…');
  o.fmt = prev;
}

function _buildCardMenu(menuId: string, realIdx: number, o: any): string {
  const canR = _canRecibo(o);
  return `<div class="card-menu-wrap">
    <button class="card-menu-btn" onclick="event.stopPropagation();toggleCardMenu('${menuId}')" title="Ações">⋯</button>
    <div id="${menuId}" class="card-menu-drop">
      <div class="cmd-item" onclick="closeCardMenus();editOrc(${realIdx})"><svg class="ico" aria-hidden="true"><use href="#ico-edit"/></svg> Editar</div>
      <div class="cmd-item" onclick="closeCardMenus();_showSendOptions(${realIdx})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Enviar WhatsApp</div>
      ${canR
        ? `<div class="cmd-item" onclick="closeCardMenus();abrirModalRecibo(${realIdx})"><svg class="ico" aria-hidden="true"><use href="#ico-file-text"/></svg> Gerar Recibo</div>`
        : `<div class="cmd-item cmd-disabled"><svg class="ico" aria-hidden="true"><use href="#ico-file-text"/></svg> Recibo indisponível</div>`}
      <div class="cmd-item" onclick="closeCardMenus();_showStatusPicker(${realIdx})"><svg class="ico" aria-hidden="true"><use href="#ico-zap"/></svg> Mudar Status</div>
      <div class="cmd-item cmd-danger" onclick="closeCardMenus();askDelete('Excluir este orçamento?',()=>delOrc(${realIdx}))"><svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg> Excluir</div>
    </div>
  </div>`;
}

// ── Field enter navigation ──
const FIELD_ORDER: Record<string, string[]> = {
  's1': ['cli-nome', 'cli-tel', 'cli-email', 'cli-cpf', 'cli-cep', 'cli-logradouro', 'cli-numero', 'cli-comp', 'cli-bairro', 'cli-cidade'],
};

function nextField(currentId: string, pageKey: string): void {
  const order = FIELD_ORDER[pageKey]; if (!order) return;
  const idx = order.indexOf(currentId); if (idx === -1) return;
  for (let i = idx + 1; i < order.length; i++) {
    const el = document.getElementById(order[i]) as HTMLElement | null;
    if (el && !(el as any).disabled && el.offsetParent !== null) {
      el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
    }
  }
}

function attachEnterNav(): void {
  Object.entries(FIELD_ORDER).forEach(([pageKey, ids]) => {
    ids.forEach((id, i) => {
      const el = document.getElementById(id) as HTMLInputElement | null; if (!el) return;
      el.addEventListener('input', () => { S.isDirty = true; });
      el.setAttribute('enterkeyhint', i === ids.length - 1 ? 'done' : 'next');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && el.tagName !== 'TEXTAREA') { e.preventDefault(); nextField(id, pageKey); }
      });
    });
  });
}

// ── Expose globals ──
(window as any).calcOrcTotal = calcOrcTotal;
(window as any).calcTotal = calcTotal;
(window as any).showModeSelector = showModeSelector;
(window as any).selectMode = selectMode;
(window as any).newOrcFlash = newOrcFlash;
(window as any).newOrcFoto = newOrcFoto;
(window as any).newOrcDetalhado = newOrcDetalhado;
(window as any).newOrc = newOrcDetalhado;
(window as any).editOrc = editOrc;
(window as any).collectOrc = collectOrc;
(window as any).saveOrc = saveOrc;
(window as any).saveDraft = saveDraft;
(window as any).triggerAction = triggerAction;
(window as any).renderRooms = renderRooms;
(window as any).tCard = tCard;
(window as any).delRoom = delRoom;
(window as any).addItem = addItem;
(window as any).editItem = editItem;
(window as any).removeItem = removeItem;
(window as any).renderPgtoList = renderPgtoList;
(window as any).tChk = tChk;
(window as any).togglePagador = togglePagador;
(window as any).setFmt = setFmt;
(window as any).sendWA = sendWA;
(window as any).sendWAIdx = sendWAIdx;
(window as any).buildWAMsg = buildWAMsg;
(window as any).refreshWAPreview = refreshWAPreview;
(window as any).viewOrc = viewOrc;
(window as any).closeViewOrc = closeViewOrc;
(window as any).delOrc = delOrc;
(window as any).renderLogoPreview = renderLogoPreview;
(window as any).renderItemModal = renderItemModal;
(window as any).saveItemModal = saveItemModal;
(window as any).cancelItemModal = cancelItemModal;
(window as any)._updateItemPrecoDisplay = _updateItemPrecoDisplay;
(window as any)._updatePrecoBaseDisplay = _updatePrecoBaseDisplay;
(window as any).setRoomBasePrice = setRoomBasePrice;
(window as any).setRoomBasePriceMode = setRoomBasePriceMode;
(window as any)._detailUpdateArea = _detailUpdateArea;
(window as any)._detailNomeClick = _detailNomeClick;
(window as any)._detailObsClick = _detailObsClick;
(window as any).openDetailedCamera = openDetailedCamera;
(window as any).openPhotoChoice = openPhotoChoice;
(window as any).triggerPhoto = triggerPhoto;
(window as any).handlePhotoFile = handlePhotoFile;
(window as any).compressImage = compressImage;
(window as any).compressDataUrl = compressDataUrl;
(window as any).delItemPhotoModalIdx = delItemPhotoModalIdx;
(window as any).openImg = openImg;
(window as any).openServicesModal = openServicesModal;
(window as any).closeServicesModal = closeServicesModal;
(window as any).toggleItemObsSvc = toggleItemObsSvc;
(window as any).confirmItemObsPick = confirmItemObsPick;
(window as any).openDetailNamePick = openDetailNamePick;
(window as any).closeDetailNamePick = closeDetailNamePick;
(window as any).selectDetailNome = selectDetailNome;
(window as any)._showSendOptions = _showSendOptions;
(window as any)._setSendFmt = _setSendFmt;
(window as any)._doSendWA = _doSendWA;
(window as any)._rascunhoModalAlterarStatus = _rascunhoModalAlterarStatus;
(window as any).toggleCardMenu = toggleCardMenu;
(window as any).closeCardMenus = closeCardMenus;
(window as any)._buildCardMenu = _buildCardMenu;
(window as any)._showStatusPicker = _showStatusPicker;
(window as any)._applyStatus = _applyStatus;
(window as any)._onStatusChange = _onStatusChange;
(window as any).buildDateLabel = buildDateLabel;
(window as any).getStatusBadgeClass = getStatusBadgeClass;
(window as any).attachEnterNav = attachEnterNav;
(window as any).defCfg = defCfg;

// ── PDF Generation ──
function _buildOrcPDFHtml(orc: any, compressedPhotos: Record<string, string> = {}): string {
  const cfg = S.config || defCfg;
  const total = calcOrcTotal(orc);
  const totalFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (ts: number) => { if (!ts) return '—'; const d = new Date(ts); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };
  const addr = [orc.logradouro, orc.numero, orc.comp, orc.bairro, orc.cidade].filter(Boolean).join(', ');

  const logoHtml = cfg.logo
    ? `<img src="${cfg.logo}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;" alt="Logo">`
    : `<div style="width:56px;height:56px;border-radius:10px;background:#EDE9FE;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#7C3AED;">${(cfg.empresa||'P').charAt(0)}</div>`;

  let roomsHtml = '';
  let totalM2 = 0;
  (orc.rooms || []).forEach((r: any, ri: number) => {
    const meds = getRoomMeds(r);
    const measArea = meds.m2 + meds.ml;
    totalM2 += measArea;
    const rTotal = r.precoPerM2 ? r.preco * measArea : (r.preco || 0);
    const rTotalFmt = rTotal > 0 ? rTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
    let itemsHtml = '';
    (r.items || []).forEach((it: any, ii: number) => {
      const a = ptFloat(String(it.alt)), c = ptFloat(String(it.comp));
      const m2str = a && c ? `${f1(a * c)} m²` : (a || c) ? `${f1(a || c)} ml` : '';
      const svcStr = it.services?.length ? ` — ${it.services.join(', ')}` : '';
      const priceStr = it.price ? (it.perMeter ? `R$&nbsp;${it.price}/m` : it.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })) : '';
      const itemPhotos = (it.photos || []).filter((p: any) => p?.url).slice(0, 6);
      const photosHtml = itemPhotos.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:10px;">${itemPhotos.map((p: any, pi: number) => { const src = compressedPhotos[`${ri}_${ii}_${pi}`] || p.url; return `<div style="position:relative;border-radius:6px;overflow:hidden;border:1px solid #E2E8F0;"><img src="${src}" style="height:100px;width:100%;object-fit:cover;display:block;">${p.annotated ? '<div style="position:absolute;top:4px;right:4px;background:#EF4444;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;">✏️ ANOTADA</div>' : ''}</div>`;}).join('')}</div>` : '';
      itemsHtml += `<tr><td style="padding:6px 10px;font-size:12px;color:#334155;">${esc(it.name || '—')}${svcStr ? `<span style="color:#64748B;">${esc(svcStr)}</span>` : ''}${it.obs ? `<br><span style="font-size:11px;color:#94A3B8;font-style:italic;">Obs: ${esc(it.obs)}</span>` : ''}${photosHtml}</td><td style="padding:6px 10px;font-size:12px;color:#64748B;white-space:nowrap;">${m2str}</td><td style="padding:6px 10px;font-size:12px;color:#7C3AED;font-weight:700;text-align:right;white-space:nowrap;">${priceStr}</td></tr>`;
    });
    roomsHtml += `<div style="margin-bottom:14px;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
      <div style="background:#F8FAFC;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E2E8F0;">
        <span style="font-size:13px;font-weight:700;color:#0F172A;">📍 ${esc(r.name || `Ambiente ${ri+1}`)}</span>
        ${rTotalFmt ? `<span style="font-size:13px;font-weight:800;color:#7C3AED;">${rTotalFmt}</span>` : ''}
      </div>
      ${itemsHtml ? `<table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>` : ''}
    </div>`;
  });

  const pgtoStr = Array.isArray(orc.pgto) ? orc.pgto.join(', ') : (orc.pgto || '');
  const sigHtml = cfg.assinatura
    ? `<img src="${cfg.assinatura}" style="max-height:64px;max-width:200px;object-fit:contain;" alt="Assinatura">`
    : `<div style="height:44px;border-bottom:1.5px solid #334155;width:200px;"></div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento — ${esc(orc.nome || 'Cliente')}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#0F172A;padding:32px 40px;}
@media print{body{padding:20px 28px;}@page{margin:12mm 14mm;}
.no-print{display:none!important;}}
</style>
</head>
<body onload="setTimeout(()=>window.print(),400)">
<button class="no-print" onclick="window.print()" style="position:fixed;top:16px;right:16px;padding:10px 20px;background:#7C3AED;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;z-index:999;">🖨️ Imprimir / Salvar PDF</button>

<!-- Watermark -->
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:120px;font-weight:900;color:rgba(124,58,237,0.08);z-index:0;white-space:nowrap;pointer-events:none;width:200%;text-align:center;">${esc(cfg.empresa || 'ORÇAMENTO')}</div>

<div style="max-width:740px;margin:0 auto;position:relative;z-index:1;">
  <!-- Cabeçalho empresa -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #0F172A;margin-bottom:20px;">
    <div style="display:flex;gap:14px;align-items:flex-start;">
      ${logoHtml}
      <div>
        <div style="font-size:17px;font-weight:800;color:#0F172A;">${esc(cfg.empresa || 'Prestador')}</div>
        <div style="font-size:11px;color:#64748B;line-height:1.7;margin-top:3px;">
          ${cfg.doc ? `CPF/CNPJ: ${esc(cfg.doc)} · ` : ''}${cfg.tel ? `Tel: ${esc(cfg.tel)}` : ''}
          ${cfg.emailEmpresa ? `<br>${esc(cfg.emailEmpresa)}` : ''}
          ${cfg.endEmpresa ? `<br>${esc(cfg.endEmpresa)}` : ''}
        </div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:24px;font-weight:900;color:#7C3AED;letter-spacing:-0.5px;">ORÇAMENTO</div>
      <div style="font-family:monospace;font-size:11px;color:#475569;margin-top:3px;">#${esc(String(orc.id || '').slice(-6))}</div>
      <div style="font-size:11px;color:#64748B;margin-top:2px;">Data: ${fmtDate(orc.ts)}</div>
      ${orc.valid ? `<div style="font-size:11px;color:#64748B;">Validade: ${esc(orc.valid)} dias</div>` : ''}
    </div>
  </div>

  <!-- Cliente -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7C3AED;margin-bottom:10px;">Cliente</div>
      <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">${esc(orc.nome || '—')}</div>
      ${orc.tel ? `<div style="font-size:12px;color:#475569;">Tel: ${esc(orc.tel)}</div>` : ''}
      ${orc.email ? `<div style="font-size:12px;color:#475569;">${esc(orc.email)}</div>` : ''}
      ${orc.cpf ? `<div style="font-size:12px;color:#475569;">CPF: ${esc(orc.cpf)}</div>` : ''}
      ${addr ? `<div style="font-size:12px;color:#475569;margin-top:4px;">${esc(addr)}</div>` : ''}
    </div>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7C3AED;margin-bottom:10px;">Detalhes</div>
      ${orc.tipoServico ? `<div style="font-size:12px;color:#334155;margin-bottom:3px;"><strong>Tipo:</strong> ${esc(orc.tipoServico)}</div>` : ''}
      ${orc.inicio ? `<div style="font-size:12px;color:#334155;margin-bottom:3px;"><strong>Início:</strong> ${esc(orc.inicio)}</div>` : ''}
      ${pgtoStr ? `<div style="font-size:12px;color:#334155;margin-bottom:3px;"><strong>Pagamento:</strong> ${esc(pgtoStr)}</div>` : ''}
      ${orc.status ? `<div style="font-size:12px;color:#334155;"><strong>Status:</strong> ${esc(orc.status)}</div>` : ''}
    </div>
  </div>

  <!-- Ambientes -->
  <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7C3AED;margin-bottom:10px;">Ambientes e Serviços</div>
  ${roomsHtml || '<div style="font-size:13px;color:#94A3B8;font-style:italic;margin-bottom:16px;">Nenhum ambiente adicionado.</div>'}

  <!-- Total -->
  <div style="background:linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%);border-radius:12px;padding:16px 20px;margin-top:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#DDD6FE;">Valor Total</div>
      ${totalM2 > 0 ? `<div style="font-size:11px;color:#DDD6FE;margin-top:2px;">Área total aprox: ${f1(totalM2)} m²</div>` : ''}
    </div>
    <div style="font-size:28px;font-weight:900;color:#fff;">${totalFmt}</div>
  </div>

  ${orc.obs ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin-bottom:20px;"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#92400E;margin-bottom:6px;">Observações</div><div style="font-size:13px;color:#1E293B;line-height:1.6;white-space:pre-wrap;">${esc(orc.obs)}</div></div>` : ''}

  <!-- Assinaturas -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:32px;padding-top:20px;border-top:1px solid #E2E8F0;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      ${sigHtml}
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;">Prestador</div>
      <div style="font-size:12px;font-weight:600;color:#334155;">${esc(cfg.empresa || '')}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="height:44px;border-bottom:1.5px solid #334155;width:200px;"></div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94A3B8;">Cliente</div>
      <div style="font-size:12px;font-weight:600;color:#334155;">${esc(orc.nome || '')}</div>
    </div>
  </div>

  <div style="margin-top:20px;text-align:center;font-size:10px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px;">
    Gerado por Pintor Plus · ${new Date().toLocaleDateString('pt-BR')}
  </div>
</div>
</body>
</html>`;
}

function _doPDF(): void {
  document.getElementById('send-opts-modal')!.style.display = 'none';
  const o = S.orcs[_sendOptIdx]; if (!o) return;
  _doPDFFromOrc(o);
}

async function _doPDFFromOrc(orc: any): Promise<void> {
  (window as any).showSpinner?.('Gerando PDF…');
  const compressedPhotos: Record<string, string> = {};
  for (let ri = 0; ri < (orc.rooms || []).length; ri++) {
    for (let ii = 0; ii < (orc.rooms[ri].items || []).length; ii++) {
      const photos = orc.rooms[ri].items[ii].photos || [];
      for (let pi = 0; pi < Math.min(photos.length, 6); pi++) {
        if (photos[pi]?.url) {
          compressedPhotos[`${ri}_${ii}_${pi}`] = await compressDataUrl(photos[pi].url, 800, 0.60).catch(() => photos[pi].url);
        }
      }
    }
  }
  const html = _buildOrcPDFHtml(orc, compressedPhotos);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) { (window as any).hideSpinner?.(); toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Pop-up bloqueado. Permita pop-ups para gerar PDF.'); return; }
  setTimeout(() => { URL.revokeObjectURL(url); (window as any).hideSpinner?.(); }, 1500);
}

// ── Histórico (funções implementadas em app.html) ──
function openHistorico(orcId: string): void {
  // Implementado em app.html via window.openHistorico
  (window as any).openHistorico?.(orcId);
}

function closeHistorico(): void {
  // Implementado em app.html via window.closeHistorico
  (window as any).closeHistorico?.();
}

(window as any)._doPDF = _doPDF;
(window as any)._doPDFFromOrc = _doPDFFromOrc;
(window as any).openHistorico = openHistorico;
(window as any).closeHistorico = closeHistorico;
