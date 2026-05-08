import { S, saveOrcs } from './state';
import { toast, esc, f1, ptFloat, getRoomMeds } from './utils';
import type { Orcamento, Room, Item } from './types';

declare function askDelete(msg: string, action: () => void): void;

// ── Constantes de fallback (flash lists) ─────────────────────────
const FLASH_NOMES = 'Quarto, Sala, Cozinha, Banheiro, Varanda, Fachada, Muro, Teto, Porta, Janela, Corredor, Escada, Garagem, Área de Serviço, Escritório, Quintal';
const FLASH_MATERIAIS = 'Tinta látex, Tinta acrílica, Tinta esmalte, Lixa, Massa corrida, Primer/Selador, Fita crepe, Rolo de lã, Rolo textura, Pincel, Espátula, Solvente';

// ── Cálculo de total ─────────────────────────────────────────────
export function calcOrcTotal(orc: { rooms?: Room[]; preco?: number }): number {
  let tot = 0;
  let totalM2 = 0;
  (orc.rooms || []).forEach(r => {
    const meds = getRoomMeds(r);
    const measArea = meds.m2 + meds.ml;
    totalM2 += measArea;
    if (r.preco) tot += r.precoPerM2 ? r.preco * measArea : r.preco;
    (r.items || []).forEach(it => {
      if (it.price) {
        tot += it.perMeter
          ? it.price * ((ptFloat(String(it.alt)) * ptFloat(String(it.comp))) || ptFloat(String(it.alt)) || ptFloat(String(it.comp)))
          : it.price;
      }
    });
  });
  if (orc.preco && totalM2) tot += orc.preco * totalM2;
  return tot;
}

export function calcTotal(): number {
  return calcOrcTotal({ rooms: S.rooms, preco: parseFloat((document.getElementById('preco-m2') as HTMLInputElement)?.value) || 0 });
}

// ── Display helpers ──────────────────────────────────────────────
function _updateItemPrecoDisplay(): void {
  const el = document.getElementById('item-preco-total-display');
  if (!el) return;
  if (!S.tempItem?.perMeter || !S.tempItem.price) { el.style.display = 'none'; return; }
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

// ── Renderização dos cômodos ─────────────────────────────────────
export function renderRooms(): void {
  const wrap = document.getElementById('rooms-wrap');
  if (!wrap) return;
  if (!S.rooms.length) {
    S.rooms = [{ id: Date.now().toString(), name: 'Geral', items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false, alt: 0, comp: 0 }];
  }
  wrap.innerHTML = '';

  S.rooms.forEach((r, ri) => {
    if (r.collapsed === undefined) r.collapsed = false;
    if (!r.items) r.items = [];
    if (!r.services) r.services = S.DEFAULT_SERVICES.slice();
    const meds = getRoomMeds(r);
    const medTxt: string[] = [];
    if (meds.m2 > 0) medTxt.push(`${f1(meds.m2)} m²`);
    if (meds.ml > 0) medTxt.push(`${f1(meds.ml)} ml`);
    const medLabel = medTxt.length ? medTxt.join(' + ') : '—';

    const itemsHtml = r.items.map((it, ii) => {
      const a = ptFloat(String(it.alt)), c = ptFloat(String(it.comp));
      const badge = (a && c) ? f1(a * c) + ' m²' : (a || c) ? f1(a || c) + ' ml' : 'Sem medidas';
      return `<div class="item-summary" onclick="editItem(${ri}, ${ii})"><div style="flex:1; min-width:0;"><div style="font-weight:700; font-size:15px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.name || 'Item ' + (ii + 1)}</div><div style="font-size:12px; color:var(--ink3); margin-top:3px;"><svg class="ico" aria-hidden="true"><use href="#ico-ruler"/></svg> ${badge} • ${(it.services || []).length} serv.</div></div><button class="item-del" onclick="event.stopPropagation();removeItem(${ri},${ii})"><svg class="ico" aria-hidden="true"><use href="#ico-x"/></svg></button></div>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'rcard' + (r.collapsed ? ' collapsed' : '');
    card.id = 'rcard' + ri;
    const hasMult = S.rooms.length > 1;
    const headerHtml = hasMult ? `
      <div class="rcard-head" onclick="tCard(${ri})" style="gap:10px;"><span class="rcard-em" style="font-size:26px;"><svg class="ico" aria-hidden="true"><use href="#ico-pin"/></svg></span><div style="flex:1;min-width:0;"><input class="rcard-name" style="border:none;outline:none;background:transparent;font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:var(--ink);width:100%;" value="${r.name.replace(/"/g, '&quot;')}" onclick="event.stopPropagation()" onchange="S.rooms[${ri}].name=this.value;renderRooms();">${medLabel !== '—' ? `<div style="font-size:13px;color:var(--ink3);margin-top:2px;"><svg class="ico" aria-hidden="true"><use href="#ico-ruler"/></svg> ${medLabel} (Soma)</div>` : `<div style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:#FEF3C7;border:1.5px solid #F59E0B;border-radius:10px;padding:5px 12px;font-size:13px;font-weight:700;color:#92400E;">+ Adicionar itens</div>`}</div><button class="rcard-del" onclick="event.stopPropagation();delRoom(${ri},event)"><svg class="ico" aria-hidden="true"><use href="#ico-x"/></svg></button></div>
    ` : '';

    card.innerHTML = `${headerHtml}
      <div class="rcard-body">
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:800;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;"><svg class="ico" aria-hidden="true"><use href="#ico-banknote"/></svg> ${hasMult ? 'Preço base do local' : 'Preço Total Base'}</div>
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="flex:1;"><div style="position:relative;"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:15px;font-weight:700;color:var(--ink3);">R$</span><input type="text" inputmode="decimal" placeholder="0,00" value="${r.preco ? String(r.preco).replace('.', ',') : ''}" style="width:100%;height:52px;background:var(--bg-input);border:2px solid var(--bdr-input);border-radius:14px;padding:0 14px 0 42px;font-family:'Calibri',sans-serif;font-size:18px;color:var(--gn);outline:none;" onfocus="this.style.borderColor='var(--gn)'; this.select();" onblur="if(this.value){const v=ptFloat(this.value);this.value=v?v.toFixed(2).replace('.',','):'';S.rooms[${ri}].preco=v;}; this.style.borderColor='var(--bdr-input)';" oninput="this.value=this.value.replace('.',',');S.rooms[${ri}].preco=ptFloat(this.value);calcTotal();_updatePrecoBaseDisplay(${ri});"></div><div id="preco-base-total-${ri}" style="display:${r.precoPerM2 ? 'block' : 'none'};margin-top:6px;font-size:12px;font-weight:700;color:var(--gn);padding:5px 10px;background:var(--gnl,#d1fae5);border-radius:8px;"></div></div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--ink3);cursor:pointer;white-space:nowrap;"><input type="radio" name="preco-tipo-${ri}" value="fixo" ${!r.precoPerM2 ? 'checked' : ''} onchange="S.rooms[${ri}].precoPerM2=false;calcTotal();_updatePrecoBaseDisplay(${ri});" style="accent-color:var(--bl);width:16px;height:16px;"> Fixo</label>
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--ink3);cursor:pointer;white-space:nowrap;"><input type="radio" name="preco-tipo-${ri}" value="m2" ${r.precoPerM2 ? 'checked' : ''} onchange="S.rooms[${ri}].precoPerM2=true;calcTotal();_updatePrecoBaseDisplay(${ri});" style="accent-color:var(--bl);width:16px;height:16px;"> Por m²</label>
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

// ── Estado do modal de item ──────────────────────────────────────
let curRi: number | null = null;
let curIi: number | null = null;
let isNewItem = false;
let _detailNomeFirst = false;
let _detailObsFirst = false;

// ── Toggle/Excluir cômodo ────────────────────────────────────────
export function tCard(id: number): void {
  document.getElementById(String(id))?.classList.toggle('collapsed');
}

export function delRoom(ri: number, e?: Event): void {
  if (e) e.stopPropagation();
  askDelete('Deseja excluir este local e suas medidas?', () => {
    S.rooms.splice(ri, 1);
    renderRooms();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg> Local Removido');
    S.isDirty = true;
  });
}

// ── Adicionar/Editar/Remover item ────────────────────────────────
export function addItem(ri: number): void {
  curRi = ri;
  S.tempItem = { name: '', alt: '', comp: '', services: [], price: 0, perMeter: false, obs: '', photos: [] };
  isNewItem = true;
  _detailNomeFirst = true;
  _detailObsFirst = true;
  S.rooms[ri].collapsed = false;
  document.getElementById('item-modal-form')!.style.display = 'flex';
  renderItemModal();
}

export function editItem(ri: number, ii: number): void {
  curRi = ri;
  curIi = ii;
  S.tempItem = JSON.parse(JSON.stringify(S.rooms[ri].items[ii]));
  isNewItem = false;
  _detailNomeFirst = false;
  _detailObsFirst = false;
  document.getElementById('item-modal-form')!.style.display = 'flex';
  renderItemModal();
}

export function removeItem(ri: number, ii: number): void {
  askDelete('Excluir este item permanentemente?', () => {
    S.rooms[ri].items.splice(ii, 1);
    renderRooms();
    S.isDirty = true;
  });
}

// ── Fotos ────────────────────────────────────────────────────────
export function openPhotoChoice(): void {
  document.getElementById('photo-choice-modal')!.style.display = 'flex';
}

export function triggerPhoto(source: string): void {
  document.getElementById('photo-choice-modal')!.style.display = 'none';
  const el = document.getElementById(`file-${source}`) as HTMLInputElement;
  if (el) el.click();
}

export function handlePhotoFile(input: HTMLInputElement, isCamera: boolean): void {
  const file = input.files?.[0];
  if (!file) return;
  compressImage(file, (dataUrl: string) => {
    if (!S.tempItem.photos) S.tempItem.photos = [];
    const fName = file.name || `Foto_${Date.now()}.jpg`;
    S.tempItem.photos.push({ url: dataUrl, filename: fName });
    renderItemModal();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-camera"/></svg> Foto adicionada!');
    if (isCamera) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fName;
      a.click();
      toast('<svg class="ico" aria-hidden="true"><use href="#ico-save"/></svg> Salvando na Galeria...');
    }
  });
  input.value = '';
}

function compressImage(file: File, callback: (dataUrl: string) => void): void {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image();
    img.src = (event.target as FileReader).result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const MAX = 1024;
      if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
      else if (h > MAX) { w *= MAX / h; h = MAX; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.6));
    };
  };
}

export function delItemPhotoModalIdx(idx: number): void {
  askDelete('Remover esta foto?', () => {
    S.tempItem.photos.splice(idx, 1);
    renderItemModal();
  });
}

// ── Renderização do modal de item ────────────────────────────────
export function renderItemModal(): void {
  const it = S.tempItem;
  const _areaLbl = _detailGetAreaLabel(it.comp, it.alt);
  document.getElementById('item-modal-body')!.innerHTML = `
    <div class="fld">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <label class="flbl" style="margin-bottom:0;">NOME DO ITEM</label>
        <button type="button" onclick="openDetailNamePick()" style="background:#ede9fe;border:none;border-radius:8px;padding:4px 10px;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;color:#7c3aed;cursor:pointer;">☰ Sugestões</button>
      </div>
      <input class="finput item-title-inp" value="${it.name.replace(/"/g, '&quot;')}" placeholder="Ex: Parede Norte" autocomplete="off" data-form-type="other" autocapitalize="words" autocorrect="off" spellcheck="false" oninput="S.tempItem.name=this.value" onclick="_detailNomeClick()" onfocus="this.select()">
    </div>
    <div class="dim2-grid">
      <div class="mbox"><div class="mlbl">Largura (m)</div><input class="minp" type="text" inputmode="decimal" autocomplete="off" data-form-type="other" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="0,00" value="${it.comp ? String(it.comp).replace('.', ',') : ''}" oninput="this.value=this.value.replace('.',',');S.tempItem.comp=this.value;_detailUpdateArea();" onblur="if(this.value){const v=ptFloat(this.value);if(v)this.value=v.toFixed(2).replace('.',',');else this.value='';S.tempItem.comp=this.value;_detailUpdateArea();}" onfocus="this.select()"></div>
      <div class="mbox"><div class="mlbl">Altura (m)</div><input class="minp" type="text" inputmode="decimal" autocomplete="off" data-form-type="other" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="0,00" value="${it.alt ? String(it.alt).replace('.', ',') : ''}" oninput="this.value=this.value.replace('.',',');S.tempItem.alt=this.value;_detailUpdateArea();" onblur="if(this.value){const v=ptFloat(this.value);if(v)this.value=v.toFixed(2).replace('.',',');else this.value='';S.tempItem.alt=this.value;_detailUpdateArea();}" onfocus="this.select()"></div>
    </div>
    <div id="item-area-display" style="display:${_areaLbl ? 'block' : 'none'};margin-bottom:14px;font-size:12px;font-weight:700;color:var(--gn);padding:5px 10px;background:var(--gnl,#d1fae5);border-radius:8px;">${_areaLbl || ''}</div>

    <div style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;margin-bottom:8px;">Fotos do Item</div>
    <div style="display:flex;justify-content:center;gap:16px;margin:4px 0 12px;">
      <button type="button" onclick="openDetailedCamera()" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fb923c);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 20px rgba(249,115,22,0.3);"><svg class="ico" aria-hidden="true" style="color:#fff;width:28px;height:28px;"><use href="#ico-camera"/></svg></button>
      <label style="width:60px;height:60px;border-radius:50%;background:var(--bg2);border:1.5px solid var(--bdr-input);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-top:6px;" title="Galeria"><svg class="ico" aria-hidden="true" style="width:24px;height:24px;color:var(--ink3);"><use href="#ico-image"/></svg><input type="file" accept="image/*" style="display:none;" onchange="handlePhotoFile(this,false)"></label>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
      ${(it.photos || []).map((p: any, idx: number) => `
        <div style="background:var(--bg2);border:1.5px solid var(--bdr);border-radius:12px;padding:4px;position:relative;">
          <button onclick="delItemPhotoModalIdx(${idx})" type="button" style="position:absolute;top:3px;right:3px;width:20px;height:20px;border:none;border-radius:6px;background:rgba(239,68,68,0.9);color:#fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;">✕</button>
          <img src="${p.url}" onclick="openImg('${p.url}')" style="width:100%;height:58px;object-fit:cover;border-radius:8px;display:block;cursor:pointer;" alt="Foto ${idx + 1}">
        </div>
      `).join('')}
    </div>

    <div style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;margin-bottom:10px;">Preço Adicional (Somente para este item)</div>
    <div class="price-check-row" style="margin-bottom:8px;">
      <input type="text" inputmode="decimal" placeholder="R$ 0,00" value="${it.price ? String(it.price).replace('.', ',') : ''}" oninput="this.value=this.value.replace('.',',');S.tempItem.price=ptFloat(this.value);_updateItemPrecoDisplay();" onblur="if(this.value){const v=ptFloat(this.value);if(v){this.value=v.toFixed(2).replace('.',',');S.tempItem.price=v;}else{this.value='';S.tempItem.price=0;}}else{S.tempItem.price=0;}" onfocus="this.select()">
      <label class="pcheck" style="white-space: nowrap;"><input type="checkbox" ${it.perMeter ? 'checked' : ''} onchange="S.tempItem.perMeter=this.checked;_updateItemPrecoDisplay();"><span class="info-icon" onclick="event.preventDefault(); event.stopPropagation(); toast('Multiplicar por m².')">?</span> por m²</label>
    </div>
    <div id="item-preco-total-display" style="display:${it.perMeter && it.price ? 'block' : 'none'};margin-bottom:16px;font-size:12px;font-weight:700;color:var(--gn);padding:5px 10px;background:var(--gnl,#d1fae5);border-radius:8px;"></div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <span style="font-size:12px;font-weight:800;color:var(--ink3);text-transform:uppercase;">Observações</span>
      <button type="button" onclick="openServicesModal()" style="background:#d1fae5;border:none;border-radius:8px;padding:5px 11px;font-family:'Sora',sans-serif;font-size:11px;font-weight:700;color:#059669;cursor:pointer;">☰ Serviços</button>
    </div>
    <textarea class="item-obs-inp" autocomplete="off" data-form-type="other" autocorrect="off" spellcheck="false" placeholder="Detalhes, estado da parede, cor, serviços..." oninput="S.tempItem.obs=this.value" onclick="_detailObsClick()">${it.obs || ''}</textarea>
  `;
  document.getElementById('item-modal-body')!.scrollTop = 0;
  setTimeout(() => {
    const inp = document.querySelector<HTMLInputElement>('#item-modal-body .item-title-inp');
    if (inp) inp.focus();
  }, 50);
}

// ── Modal de serviços ────────────────────────────────────────────
export function openServicesModal(): void {
  if (!S.tempItem) return;
  document.getElementById('services-modal')!.style.display = 'flex';
  _renderItemObsChips();
}

export function closeServicesModal(): void {
  document.getElementById('services-modal')!.style.display = 'none';
}

function _renderItemObsChips(): void {
  const sel: string[] = S.tempItem.services || [];
  const srvList = S.DEFAULT_SERVICES;
  const matList = (S.config.flashMateriais || FLASH_MATERIAIS).split(',').map(s => s.trim()).filter(Boolean);
  const chip = (s: string, type: string) => {
    const on = sel.includes(s);
    const bg = on ? (type === 'srv' ? '#7c3aed' : '#059669') : '#f1f5f9';
    const col = on ? '#fff' : (type === 'srv' ? '#7c3aed' : '#059669');
    const bdr = on ? 'transparent' : (type === 'srv' ? '#ddd6fe' : '#d1fae5');
    return `<button type="button" data-srv="${esc(s)}" onclick="toggleItemObsSvc(this.dataset.srv)" style="padding:7px 12px;border-radius:20px;border:1.5px solid ${bdr};background:${bg};font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:${col};cursor:pointer;">${esc(s)}</button>`;
  };
  document.getElementById('services-modal-body')!.innerHTML = srvList.map(s => chip(s, 'srv')).join('');
  document.getElementById('services-modal-mat-body')!.innerHTML = matList.map(s => chip(s, 'mat')).join('');
}

export function toggleItemObsSvc(s: string): void {
  if (!S.tempItem.services) S.tempItem.services = [];
  const i = S.tempItem.services.indexOf(s);
  if (i >= 0) S.tempItem.services.splice(i, 1);
  else S.tempItem.services.push(s);
  S.isDirty = true;
  _renderItemObsChips();
}

export function confirmItemObsPick(): void {
  const ta = document.querySelector<HTMLTextAreaElement>('#item-modal-body .item-obs-inp');
  const currentText: string = (ta ? ta.value : '') || (S.tempItem.obs || '');
  const allKnown = [
    ...(S.DEFAULT_SERVICES || []),
    ...(S.config.flashMateriais || FLASH_MATERIAIS).split(',').map(s => s.trim()).filter(Boolean),
  ];
  const customParts = currentText.split(',').map(s => s.trim()).filter(s => !!s && !allKnown.includes(s));
  const selected: string[] = S.tempItem.services || [];
  S.tempItem.obs = customParts.join(', ');
  if (ta) ta.value = S.tempItem.obs;
  closeServicesModal();
}

// ── Nome pick (modo detalhado) ───────────────────────────────────
export function _detailNomeClick(): void {
  if (_detailNomeFirst) { _detailNomeFirst = false; openDetailNamePick(); }
}

export function _detailObsClick(): void {
  if (_detailObsFirst) { _detailObsFirst = false; openServicesModal(); }
}

function _detailGetAreaLabel(comp: any, alt: any): string | null {
  const c = ptFloat(String(comp)), a = ptFloat(String(alt));
  if (c > 0 && a > 0) return 'Área: ' + (c * a).toFixed(2).replace('.', ',') + ' m²';
  if (c > 0 || a > 0) return 'Linear: ' + (c || a).toFixed(2).replace('.', ',') + ' m';
  return null;
}

export function _detailUpdateArea(): void {
  const el = document.getElementById('item-area-display');
  if (el) {
    const lbl = _detailGetAreaLabel(S.tempItem.comp, S.tempItem.alt);
    el.style.display = lbl ? 'block' : 'none';
    if (lbl) el.textContent = lbl;
  }
  _updateItemPrecoDisplay();
}

export function openDetailNamePick(): void {
  if (!S.tempItem) return;
  const nomes = (S.config.flashNomes || FLASH_NOMES).split(',').map(s => s.trim()).filter(Boolean);
  document.getElementById('detail-nome-pick-grid')!.innerHTML = nomes.map(n =>
    `<button type="button" data-nm="${esc(n)}" onclick="selectDetailNome(this.dataset.nm)" style="padding:10px 4px;border-radius:10px;border:1.5px solid var(--bdr-input);background:var(--bg2);font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;text-align:center;">${esc(n)}</button>`
  ).join('');
  document.getElementById('detail-nome-pick-modal')!.style.display = 'flex';
}

export function closeDetailNamePick(): void {
  document.getElementById('detail-nome-pick-modal')!.style.display = 'none';
}

export function selectDetailNome(n: string): void {
  S.tempItem.name = n;
  const inp = document.querySelector<HTMLInputElement>('#item-modal-body .item-title-inp');
  if (inp) inp.value = n;
  closeDetailNamePick();
}

// ── Salvar/Cancelar item ─────────────────────────────────────────
export function saveItemModal(): void {
  if (!S.tempItem.name.trim()) S.tempItem.name = 'Item sem nome';
  if (isNewItem) {
    if (!S.rooms[curRi!].items) S.rooms[curRi!].items = [];
    S.rooms[curRi!].items.push(S.tempItem);
  } else {
    S.rooms[curRi!].items[curIi!] = S.tempItem;
  }
  S.isDirty = true;
  document.getElementById('item-modal-form')!.style.display = 'none';
  renderRooms();
}

export function cancelItemModal(): void {
  document.getElementById('item-modal-form')!.style.display = 'none';
  curRi = null;
  curIi = null;
  S.tempItem = null;
}

// ── Visualizar imagem ────────────────────────────────────────────
export function openImg(url: string): void {
  (document.getElementById('img-modal-el') as HTMLImageElement).src = url;
  (document.getElementById('img-modal-dl') as HTMLAnchorElement).href = url;
  (document.getElementById('img-modal-dl') as HTMLAnchorElement).download = `foto_${Date.now()}.jpg`;
  document.getElementById('img-modal')!.style.display = 'flex';
}

// ── Expor no window para onclick handlers inline ─────────────────
(window as any).calcTotal = calcTotal;
(window as any).calcOrcTotal = calcOrcTotal;
(window as any).renderRooms = renderRooms;
(window as any).tCard = tCard;
(window as any).delRoom = delRoom;
(window as any).addItem = addItem;
(window as any).editItem = editItem;
(window as any).removeItem = removeItem;
(window as any).openPhotoChoice = openPhotoChoice;
(window as any).triggerPhoto = triggerPhoto;
(window as any).handlePhotoFile = handlePhotoFile;
(window as any).delItemPhotoModalIdx = delItemPhotoModalIdx;
(window as any).renderItemModal = renderItemModal;
(window as any).openServicesModal = openServicesModal;
(window as any).closeServicesModal = closeServicesModal;
(window as any).toggleItemObsSvc = toggleItemObsSvc;
(window as any).confirmItemObsPick = confirmItemObsPick;
(window as any)._detailNomeClick = _detailNomeClick;
(window as any)._detailObsClick = _detailObsClick;
(window as any)._detailUpdateArea = _detailUpdateArea;
(window as any).openDetailNamePick = openDetailNamePick;
(window as any).closeDetailNamePick = closeDetailNamePick;
(window as any).selectDetailNome = selectDetailNome;
(window as any).saveItemModal = saveItemModal;
(window as any).cancelItemModal = cancelItemModal;
(window as any).openImg = openImg;
(window as any)._updateItemPrecoDisplay = _updateItemPrecoDisplay;
(window as any)._updatePrecoBaseDisplay = _updatePrecoBaseDisplay;
