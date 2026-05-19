import { S, saveOrcs } from './state';
import { toast, esc, formatNum, money, f1, ptFloat, safeUrl, getStatusBadgeClass, getRoomMeds, normalizeDecimalInput, normalizeMeasureInput, numFromInput, ico } from './utils';

// ── Config helpers ──
const defCfg = { ...S.config };

// ── Compress image ──
function compressImage(file: File, callback: (dataUrl: string) => void): void {
  const reader = new FileReader(); reader.readAsDataURL(file);
  reader.onload = event => {
    const img = new Image(); img.src = event.target!.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas'); let w = img.width, h = img.height; const MAX = 1024;
      if (w > h && w > MAX) { h *= MAX / w; w = MAX; } else if (h > MAX) { w *= MAX / h; h = MAX; }
      canvas.width = w; canvas.height = h; canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.6));
    };
  };
}

// ── Calc totals ──
function calcOrcTotal(orc: any): number {
  let tot = 0, totalM2 = 0;
  (orc.rooms || []).forEach((r: any) => {
    const meds = getRoomMeds(r); totalM2 += meds.m2;
    if (r.preco) tot += r.precoPerM2 ? (r.preco * meds.m2) : r.preco;
    (r.items || []).forEach((it: any) => {
      if (it.price) tot += it.perMeter ? (it.price * ((ptFloat(it.alt) * ptFloat(it.comp)) || ptFloat(it.alt) || ptFloat(it.comp))) : it.price;
    });
  });
  if (orc.preco && totalM2) tot += orc.preco * totalM2;
  return tot;
}

function calcTotal(): number {
  return calcOrcTotal({ rooms: S.rooms, preco: parseFloat((document.getElementById('preco-m2') as HTMLInputElement)?.value) || 0 });
}

// ── Render Rooms ──
function renderRooms(): void {
  const wrap = document.getElementById('rooms-wrap');
  if (!wrap) return;
  if (!S.rooms.length) S.rooms = [{ id: Date.now().toString(), name: 'Geral', alt: 0, comp: 0, items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false }];
  wrap.innerHTML = '';
  S.rooms.forEach((r, ri) => {
    if (r.collapsed === undefined) r.collapsed = false;
    if (!r.items) r.items = [];
    if (!r.services) r.services = S.DEFAULT_SERVICES.slice();
    const meds = getRoomMeds(r); const medTxt: string[] = [];
    if (meds.m2 > 0) medTxt.push(`${f1(meds.m2)} m²`);
    if (meds.ml > 0) medTxt.push(`${f1(meds.ml)} ml`);
    const medLabel = medTxt.length ? medTxt.join(' + ') : '—';
    const itemsHtml = r.items.map((it, ii) => {
      const a = ptFloat(it.alt as any), c = ptFloat(it.comp as any);
      let badge = (a && c) ? f1(a * c) + ' m²' : (a || c) ? f1(a || c) + ' ml' : 'Sem medidas';
      return `<div class="item-summary" onclick="editItem(${ri}, ${ii})"><div style="flex:1; min-width:0;"><div style="font-weight:700; font-size:15px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.name || 'Item ' + (ii + 1)}</div><div style="font-size:12px; color:var(--ink3); margin-top:3px;">${ico('ruler')} ${badge} • ${(it.services || []).length} serv.</div></div><button class="item-del" onclick="event.stopPropagation();removeItem(${ri},${ii})">${ico('x')}</button></div>`;
    }).join('');
    const card = document.createElement('div');
    card.className = 'rcard' + (r.collapsed ? ' collapsed' : '');
    card.id = 'rcard' + ri;
    const hasMult = S.rooms.length > 1;
    const headerHtml = hasMult ? `
      <div class="rcard-head" onclick="tCard(${ri})" style="gap:10px;"><span class="rcard-em" style="font-size:26px;">${ico('pin')}</span><div style="flex:1;min-width:0;"><input class="rcard-name" style="border:none;outline:none;background:transparent;font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:var(--ink);width:100%;" value="${r.name.replace(/"/g, '&quot;')}" onclick="event.stopPropagation()" onchange="S.rooms[${ri}].name=this.value;renderRooms();">${medLabel !== '—' ? `<div style="font-size:13px;color:var(--ink3);margin-top:2px;">${ico('ruler')} ${medLabel} (Soma)</div>` : `<div style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:#FEF3C7;border:1.5px solid #F59E0B;border-radius:10px;padding:5px 12px;font-size:13px;font-weight:700;color:#92400E;">+ Adicionar itens</div>`}</div><button class="rcard-del" onclick="event.stopPropagation();delRoom(${ri},event)">${ico('x')}</button></div>` : '';
    card.innerHTML = `${headerHtml}
      <div class="rcard-body">
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:800;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">${ico('banknote')} ${hasMult ? 'Preço base do local' : 'Preço Total Base'}</div>
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

// ── Item modal ──
let curRi: number | null = null, curIi: number | null = null, isNewItem = false;
let _detailNomeFirst = false, _detailObsFirst = false;

function tCard(id: number): void { document.getElementById('rcard' + id)?.classList.toggle('collapsed'); }
function delRoom(ri: number, e?: Event): void { if (e) e.stopPropagation(); (window as any).askDelete?.('Deseja excluir este local e suas medidas?', () => { S.rooms.splice(ri, 1); renderRooms(); toast(`${ico('trash')} Local Removido`); S.isDirty = true; }); }
function addItem(ri: number): void { curRi = ri; S.tempItem = { name: '', alt: '', comp: '', services: [], price: 0, perMeter: false, obs: '', photos: [] }; isNewItem = true; _detailNomeFirst = true; _detailObsFirst = true; S.rooms[ri].collapsed = false; document.getElementById('item-modal-form')!.style.display = 'flex'; renderItemModal(); }
function editItem(ri: number, ii: number): void { curRi = ri; curIi = ii; S.tempItem = JSON.parse(JSON.stringify(S.rooms[ri].items[ii])); isNewItem = false; _detailNomeFirst = false; _detailObsFirst = false; document.getElementById('item-modal-form')!.style.display = 'flex'; renderItemModal(); }
function removeItem(ri: number, ii: number): void { (window as any).askDelete?.('Excluir este item permanentemente?', () => { S.rooms[ri].items.splice(ii, 1); renderRooms(); S.isDirty = true; }); }

function openPhotoChoice(): void { document.getElementById('photo-choice-modal')!.style.display = 'flex'; }
function triggerPhoto(source: string): void { document.getElementById('photo-choice-modal')!.style.display = 'none'; const id = `file-${source}`; const el = document.getElementById(id) as HTMLInputElement; if (el) el.click(); }

function handlePhotoFile(input: HTMLInputElement, isCamera: boolean): void {
  const file = input.files?.[0]; if (!file) return;
  compressImage(file, dataUrl => {
    if (!S.tempItem.photos) S.tempItem.photos = [];
    const fName = file.name || `Foto_${Date.now()}.jpg`;
    S.tempItem.photos.push({ url: dataUrl, filename: fName });
    renderItemModal(); toast(`${ico('camera')} Foto adicionada!`);
    if (isCamera) { const a = document.createElement('a'); a.href = dataUrl; a.download = fName; a.click(); toast(`${ico('save')} Salvando na Galeria...`); }
  });
  input.value = '';
}

function delItemPhotoModalIdx(idx: number): void {
  (window as any).askDelete?.('Remover esta foto?', () => { S.tempItem.photos.splice(idx, 1); renderItemModal(); });
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
      <label style="width:60px;height:60px;border-radius:50%;background:var(--bg2);border:1.5px solid var(--bdr-input);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-top:6px;" title="Galeria">${ico('image')}<input type="file" accept="image/*" style="display:none;" onchange="handlePhotoFile(this,false)"></label>
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
  setTimeout(() => { const inp = document.getElementById('item-modal-body')!.querySelector('.item-title-inp') as HTMLInputElement; if (inp) inp.focus(); }, 50);
}

function openServicesModal(): void { if (!S.tempItem) return; (document.activeElement as HTMLElement)?.blur(); document.getElementById('services-modal')!.style.display = 'flex'; _renderItemObsChips(); }
function closeServicesModal(): void { document.getElementById('services-modal')!.style.display = 'none'; }

function _renderItemObsChips(): void {
  const sel = S.tempItem.services || [];
  const srvList = S.DEFAULT_SERVICES;
  const matList = (S.config.flashMateriais || defCfg.flashMateriais).split(',').map(s => s.trim()).filter(Boolean);
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

function toggleItemObsSvc(s: string): void {
  if (!S.tempItem.services) S.tempItem.services = [];
  const i = S.tempItem.services.indexOf(s);
  if (i >= 0) S.tempItem.services.splice(i, 1); else S.tempItem.services.push(s);
  S.isDirty = true; _renderItemObsChips();
}

function confirmItemObsPick(): void {
  const ta = document.querySelector('#item-modal-body .item-obs-inp') as HTMLTextAreaElement;
  const currentText = (ta ? ta.value : '') || (S.tempItem.obs || '');
  const allKnown = [...(S.DEFAULT_SERVICES || []), ...(S.config.flashMateriais || defCfg.flashMateriais).split(',').map((s: string) => s.trim()).filter(Boolean)];
  const customParts = currentText.split(',').map((s: string) => s.trim()).filter((s: string) => s && !allKnown.includes(s));
  const selected = S.tempItem.services || [];
  const merged = [...customParts, ...selected];
  S.tempItem.obs = merged.join(', ');
  if (ta) ta.value = S.tempItem.obs;
  closeServicesModal();
}

function _detailNomeClick(): void { if (_detailNomeFirst) { _detailNomeFirst = false; openDetailNamePick(); } }
function _detailObsClick(): void { if (_detailObsFirst) { _detailObsFirst = false; openServicesModal(); } }

function _detailGetAreaLabel(comp: any, alt: any): string | null {
  const c = ptFloat(comp), a = ptFloat(alt);
  if (c > 0 && a > 0) return 'Área: ' + (c * a).toFixed(2).replace('.', ',') + ' m²';
  if (c > 0 || a > 0) return 'Linear: ' + (c || a).toFixed(2).replace('.', ',') + ' m';
  return null;
}
function _detailUpdateArea(): void {
  const el = document.getElementById('item-area-display');
  if (el) { const lbl = _detailGetAreaLabel(S.tempItem.comp, S.tempItem.alt); el.style.display = lbl ? 'block' : 'none'; if (lbl) el.textContent = lbl; }
  _updateItemPrecoDisplay();
}

function openDetailNamePick(): void {
  if (!S.tempItem) return;
  (document.activeElement as HTMLElement)?.blur();
  const nomes = (S.config.flashNomes || defCfg.flashNomes).split(',').map(s => s.trim()).filter(Boolean);
  document.getElementById('detail-nome-pick-grid')!.innerHTML = nomes.map(n =>
    `<button type="button" data-nm="${esc(n)}" onclick="selectDetailNome(this.dataset.nm)" style="padding:10px 4px;border-radius:10px;border:1.5px solid var(--bdr-input);background:var(--bg2);font-family:'Sora',sans-serif;font-size:12px;font-weight:700;color:var(--ink);cursor:pointer;text-align:center;">${esc(n)}</button>`
  ).join('');
  document.getElementById('detail-nome-pick-modal')!.style.display = 'flex';
}
function closeDetailNamePick(): void { document.getElementById('detail-nome-pick-modal')!.style.display = 'none'; }
function selectDetailNome(n: string): void { S.tempItem.name = n; const inp = document.querySelector('#item-modal-body .item-title-inp') as HTMLInputElement; if (inp) inp.value = n; (window as any).Keyboard?.hide?.().catch(() => {}); closeDetailNamePick(); }

function saveItemModal(): void {
  console.log('saveItemModal called', { curRi, curIi, isNewItem, tempItem: S.tempItem });
  if (curRi === null || curRi === undefined) { console.error('curRi is null/undefined'); return; }
  if (!S.tempItem.name.trim()) S.tempItem.name = 'Item sem nome';
  if (isNewItem) { if (!S.rooms[curRi].items) S.rooms[curRi].items = []; S.rooms[curRi].items.push(S.tempItem); }
  else { S.rooms[curRi].items[curIi!] = S.tempItem; }
  S.isDirty = true; document.getElementById('item-modal-form')!.style.display = 'none';
  (window as any).Keyboard?.hide?.().catch(() => {}); renderRooms();
}
function cancelItemModal(): void { document.getElementById('item-modal-form')!.style.display = 'none'; curRi = null; curIi = null; S.tempItem = null; }

function openImg(url: string): void {
  (document.getElementById('img-modal-el') as HTMLImageElement).src = url;
  (document.getElementById('img-modal-dl') as HTMLAnchorElement).href = url;
  (document.getElementById('img-modal-dl') as HTMLAnchorElement).download = `foto_${Date.now()}.jpg`;
  document.getElementById('img-modal')!.style.display = 'flex';
}

function _updateItemPrecoDisplay(): void {
  const el = document.getElementById('item-preco-total-display');
  if (!el) return;
  if (!S.tempItem.perMeter || !S.tempItem.price) { el.style.display = 'none'; return; }
  const alt = ptFloat(S.tempItem.alt), comp = ptFloat(S.tempItem.comp);
  const m2 = (alt && comp) ? alt * comp : (alt || comp);
  const total = S.tempItem.price * m2;
  el.style.display = 'block';
  el.textContent = m2 > 0 ? '= R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' (' + m2.toFixed(2).replace('.', ',') + ' m²)' : 'Preencha as medidas do item para calcular o total';
}

function _updatePrecoBaseDisplay(ri: number): void {
  const el = document.getElementById('preco-base-total-' + ri);
  if (!el) return;
  const r = S.rooms[ri];
  if (!r || !r.precoPerM2) { el.style.display = 'none'; return; }
  const m2 = getRoomMeds(r).m2;
  const total = (r.preco || 0) * m2;
  el.style.display = 'block';
  el.textContent = m2 > 0 ? '= R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' (' + m2.toFixed(2).replace('.', ',') + ' m²)' : 'Adicione itens com medidas para calcular o total';
}

// ── Render Home ──
function buildDateLabel(ts: number): string { if (!ts) return 'Sem data'; const d = new Date(ts); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`; }

function renderHomeMini(): void {
  const sg = document.getElementById('home-saudacao');
  if (sg) sg.textContent = S.config.empresa || 'Sua Empresa';
  (window as any).renderLogoPreview?.();
  const wrap = document.getElementById('home-orcs-mini'); if (!wrap) return;
  if (!S.orcs.length) { wrap.innerHTML = '<div style="text-align:center;padding:16px;background:var(--bg-card);border-radius:12px;border:1px solid var(--bdr);font-size:12px;color:var(--ink3);margin-bottom:8px;">Nenhum orçamento registado ainda.</div>'; return; }
  wrap.innerHTML = S.orcs.slice(0, 3).map((o, sliceIdx) => {
    let tot = calcOrcTotal(o);
    const isR = (o.status || '').includes('Rascunho');
    const badgeHtml = isR ? `<span class="badge-rascunho">Rascunho</span>` : `<span class="hbadge ${getStatusBadgeClass(o.status)}">${esc(o.status || 'Pendente')}</span>`;
    const menuId = `cm-h-${sliceIdx}`;
    const orcShortId = String(o.id || '').slice(-6);
    return `<div class="hoc${isR ? ' card-rascunho' : ''}" style="margin-bottom:8px;cursor:pointer;" onclick="viewOrc(${sliceIdx})"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;overflow:hidden;pointer-events:none;"><span class="hon" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(o.nome || '(sem nome)')}</span><span style="font-size:10px;color:var(--ink3);font-weight:400;flex-shrink:0;">#${orcShortId}</span>${badgeHtml}</div><div onclick="event.stopPropagation()">${(window as any)._buildCardMenu?.(menuId, sliceIdx, o) || ''}</div></div><div style="display:flex;align-items:center;justify-content:space-between;pointer-events:none;"><span class="hos">${buildDateLabel(o.tsEdit || o.ts || Date.now())}</span><span class="hoov">${tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</span></div></div>`;
  }).join('');
}

function renderHomeEvents(): void {
  const wrap = document.getElementById('home-events-mini'); if (!wrap) return;
  const evMap = (window as any).getUnifiedEvents?.() || {};
  const today = new Date(); let html = '', count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dtStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (evMap[dtStr]) {
      const parts = dtStr.split('-'); const dataFormatada = `${parts[2]}/${parts[1]}`;
      evMap[dtStr].forEach((item: any) => {
        count++; if (count > 4) return;
        if (item.type === 'ev') {
          const e = item.data;
          html += `<div class="hoc" style="border-left: 3px solid var(--bl); margin-bottom:8px; padding:12px;"><div class="hot" style="margin-bottom:0;"><div><div class="hon" style="font-size:13px; color:var(--ink);">${ico('bell')} ${esc(e.tit)}</div><div class="hos" style="font-size:11px;">${dataFormatada} - ${esc(e.hora || 'O dia todo')}</div></div></div></div>`;
        } else {
          const o = item.data;
          html += `<div class="hoc" style="border-left: 3px solid var(--gn); margin-bottom:8px; padding:12px; cursor:pointer;" onclick="editOrcByObjId('${o.id}')"><div class="hot" style="margin-bottom:0; width:100%;"><div><div class="hon" style="font-size:13px; color:var(--ink);">${ico('hard-hat')} Obra: ${esc(o.nome)}</div><div class="hos" style="font-size:11px;">Início a ${dataFormatada}</div></div><span class="hbadge ${getStatusBadgeClass(o.status)}" style="margin-left:auto;">${esc(o.status || 'Pendente')}</span></div></div>`;
        }
      });
    }
  }
  wrap.innerHTML = count === 0 ? '<div style="text-align:center;padding:16px;background:var(--bg-card);border-radius:12px;border:1px solid var(--bdr);font-size:12px;color:var(--ink3);margin-bottom:8px;">Nenhum evento nos próximos 7 dias.</div>' : html;
}

async function renderHomeNews(): Promise<void> {
  const wrap = document.getElementById('home-news-mini'); if (!wrap) return;
  try {
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.pintorabrapp.com.br%2Ffeed%2F');
    const data = await res.json();
    if (data.status === 'ok' && data.items && data.items.length > 0) {
      const items = data.items.slice(0, 3);
      wrap.innerHTML = items.map((item: any) => {
        let imgUrl = item.thumbnail;
        if (!imgUrl && item.content) { const match = item.content.match(/<img[^>]+src="([^">]+)"/); if (match) imgUrl = match[1]; }
        if (!imgUrl) imgUrl = 'https://www.pintorabrapp.com.br/wp-content/uploads/2023/10/logo-abrapp.png';
        const date = new Date(item.pubDate.replace(/-/g, '/')).toLocaleDateString('pt-BR');
        return `<div class="news-card" onclick="const _u=_safeUrl('${esc(item.link)}');if(_u)window.open(_u,'_blank')"><img src="${imgUrl}" onerror="this.src='https://lh3.googleusercontent.com/d/1mwtQDispSbBU3HBvLa0T46vOoHAmWNNN'"><div style="flex:1;"><div class="news-title">${item.title}</div><div class="news-date">${date}</div></div></div>`;
      }).join('');
    } else { throw new Error('Feed vazio'); }
  } catch {
    wrap.innerHTML = `<div class="news-card" onclick="window.open('https://www.pintorabrapp.com.br/revista-pintura-em-movimento', '_blank')"><div style="font-size:24px; margin-right:8px;">${ico('newspaper')}</div><div style="flex:1;"><div class="news-title">Revista Pintura em Movimento</div><div class="news-date">Não foi possível carregar as notícias. Prima aqui para aceder.</div></div></div>`;
  }
}

// ── Render Orcamentos List ──
function _orcMatch(o: any, q: string): boolean {
  const tot = calcOrcTotal(o);
  const parts = [o.nome, o.apelido, o.tel, o.email, o.cpf, o.cep, o.logradouro, o.numero, o.comp, o.bairro, o.cidade, o.end, o.status, o.obs, o.date, o.inicio, o.tipoServico, o.pagNome, o.pagTel, o.pagEnd, (o.pgto || []).join(' '), tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '', (o.rooms || []).map((r: any) => [r.nome, r.obs, (r.items || []).map((it: any) => [it.name, it.obs].join(' ')).join(' ')].join(' ')).join(' ')];
  return parts.some(p => p && String(p).toLowerCase().includes(q));
}

function renderOrcamentosList(): void {
  const q = ((document.getElementById('orc-search') as HTMLInputElement)?.value || '').toLowerCase().trim();
  const wrap = document.getElementById('orcamentos-list-full'); if (!wrap) return;
  if (!S.orcs.length) { wrap.innerHTML = `<div style="text-align:center;padding:24px 16px;background:#fff;border-radius:14px;border:1px solid var(--bdr);"><div style="font-size:32px;margin-bottom:8px;opacity:.3;">${ico('clipboard')}</div><div style="font-size:13px;color:var(--ink3);font-style:italic;">Nenhum orçamento ainda</div><button onclick="newOrc()" style="margin-top:12px;padding:9px 20px;border-radius:10px;background:linear-gradient(135deg,var(--bl),var(--bld));border:none;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#fff;cursor:pointer;">＋ Criar primeiro</button></div>`; return; }
  const indexed = S.orcs.map((o, i) => ({ o, i }));
  const filtered = q ? indexed.filter(({ o }) => _orcMatch(o, q)) : indexed;
  if (!filtered.length) { wrap.innerHTML = `<div class="srch-empty">Nenhum orçamento encontrado para "<strong>${esc(q)}</strong>".</div>`; return; }
  wrap.innerHTML = filtered.map(({ o, i }) => {
    let tot = calcOrcTotal(o); const qtdLocais = (o.rooms || []).length;
    const infoTxt = qtdLocais === 1 ? `${o.rooms[0].items?.length || 0} item(ns)` : `${qtdLocais} local(is)`;
    const isRascunho = (o.status || '').includes('Rascunho');
    const isFlash = !!(o as any).isFlashDraft;
    const badgeHtml = isRascunho ? `<span class="badge-rascunho">Rascunho</span>` : `<span class="hbadge ${getStatusBadgeClass(o.status)}">${esc(o.status || 'Pendente')}</span>${isFlash ? `<span class="hbadge hby" style="font-size:9px;">⚡ Flash</span>` : ''}`;
    const orcShortId = String(o.id || '').slice(-6);
    const menuId = `cm-l-${i}`;
    return `<div class="hoc${isRascunho ? ' card-rascunho' : ''}" style="margin-bottom:10px;cursor:pointer;" onclick="viewOrc(${i})"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;overflow:hidden;pointer-events:none;"><span class="hon" style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(o.nome || '(sem nome)')}</span><span style="font-size:10px;color:var(--ink3);font-weight:400;flex-shrink:0;">#${orcShortId}</span><span style="flex-shrink:0;display:flex;gap:3px;">${badgeHtml}</span></div><div onclick="event.stopPropagation()">${(window as any)._buildCardMenu?.(menuId, i, o) || ''}</div></div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;"><span class="hood" style="display:flex;align-items:center;gap:4px;">${ico('pin')}${esc(o.end || '—')} · ${infoTxt}</span><span class="hoov">${tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</span></div><span class="hos">${buildDateLabel(o.tsEdit || o.ts || Date.now())}</span></div>`;
  }).join('');
}

// ── View Orc ──
function viewOrc(i: number): void {
  const o = S.orcs[i]; if (!o) return;
  const tot = calcOrcTotal(o);
  const fmtVal = (v: number) => v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—';
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
    const rPrice = r.preco ? (r.precoPerM2 ? `R$ ${r.preco}/m² · ${meds.m2.toFixed(2)}m² = ${fmtVal(r.preco * meds.m2)}` : fmtVal(r.preco)) : '';
    roomsHtml += `<div style="margin-bottom:12px;border:1px solid var(--bdr);border-radius:10px;overflow:hidden;"><div style="padding:8px 12px;background:var(--bg-card);font-size:13px;font-weight:700;color:var(--ink);display:flex;justify-content:space-between;"><span>${esc(r.name || 'Ambiente ' + (ri + 1))}</span>${rPrice ? `<span style="color:var(--bl);">${rPrice}</span>` : ''}</div>${itemsHtml ? `<div style="padding:8px;">${itemsHtml}</div>` : ''}</div>`;
  });
  const addr = [o.logradouro, o.numero, o.comp, o.bairro, o.cidade].filter(Boolean).join(', ');
  document.getElementById('view-orc-body')!.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:12px;background:var(--bg-card);border-radius:12px;"><div style="flex:1;"><div style="font-size:16px;font-weight:800;color:var(--ink);">${esc(o.nome || '(sem nome)')}</div><div style="font-size:12px;color:var(--ink3);margin-top:2px;">${fmtDate(o.tsEdit || o.ts)}</div></div><span class="hbadge ${getStatusBadgeClass(o.status)}" style="font-size:11px;">${esc(o.status || 'Pendente')}</span></div>
    <div style="background:var(--bg-card);border-radius:12px;padding:14px;margin-bottom:16px;"><div style="font-size:22px;font-weight:800;color:var(--bl);text-align:center;">R$ ${tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><div style="font-size:11px;color:var(--ink3);text-align:center;margin-top:2px;">Valor total do orçamento</div></div>
    ${sec('Cliente', row('Telefone', o.tel) + row('Email', o.email) + row('CPF', o.cpf) + row('Endereço', addr))}
    ${o.pagador ? sec('Pagador', row('Nome', o.pagNome) + row('Telefone', o.pagTel) + row('Endereço', o.pagEnd)) : ''}
    ${roomsHtml ? sec('Ambientes e Serviços', roomsHtml) : ''}
    ${sec('Detalhes', row('Tipo de Serviço', o.tipoServico) + row('Validade', o.valid ? o.valid + ' dias' : '') + row('Início', o.inicio) + row('Pagamento', [...(o.pgto || [])].join(', ')))}
    ${o.obs ? sec('Observações', `<div style="font-size:13px;color:var(--ink2);line-height:1.6;background:var(--bg2);border-radius:8px;padding:10px;white-space:pre-wrap;">${o.obs.replace(/</g, '&lt;')}</div>`) : ''}
  `;
  const tel = (o.tel || '').replace(/\D/g, '');
  const waUrl = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent((window as any).buildWAMsg?.(o) || '')}` : `https://wa.me/?text=${encodeURIComponent((window as any).buildWAMsg?.(o) || '')}`;
  document.getElementById('view-orc-actions')!.innerHTML = `
    <button onclick="closeViewOrc();editOrc(${i})" style="flex:1;height:44px;border-radius:12px;background:var(--bl);color:#fff;border:none;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">${ico('edit')} Editar</button>
    <button onclick="closeViewOrc();_showSendOptions(${i})" style="height:44px;width:44px;border-radius:12px;background:var(--gnl);border:1.5px solid var(--gn);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--gn);flex-shrink:0;" title="Enviar / PDF"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></button>
  `;
  document.getElementById('view-orc-modal')!.style.display = 'flex';
}

function closeViewOrc(): void { document.getElementById('view-orc-modal')!.style.display = 'none'; }

// ── Render Agenda ──
function renderAgenda(): void {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  document.getElementById('cal-month-lbl')!.textContent = `${monthNames[(window as any).calMonth ?? new Date().getMonth()]} ${(window as any).calYear ?? new Date().getFullYear()}`;
  const calM = (window as any).calMonth ?? new Date().getMonth();
  const calY = (window as any).calYear ?? new Date().getFullYear();
  const firstDay = new Date(calY, calM, 1).getDay();
  const daysInMonth = new Date(calY, calM + 1, 0).getDate();
  const evMap = (window as any).getUnifiedEvents?.() || {};
  const grid = document.getElementById('cal-grid-body');
  let html = '';
  const tDate = new Date();
  const todayStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
  const calSel = (window as any).calSelDate || todayStr;
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-cell mute"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dtStr = `${calY}-${String(calM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dtStr === todayStr ? 'today' : '';
    const isSel = dtStr === calSel ? 'sel' : '';
    let dotsHtml = '';
    if (evMap[dtStr]) evMap[dtStr].forEach((item: any) => { dotsHtml += `<div class="cal-dot ${item.type}"></div>`; });
    html += `<div class="cal-cell ${isToday} ${isSel}" onclick="selectCalDate('${dtStr}')">${d}<div class="cal-dots">${dotsHtml}</div></div>`;
  }
  grid!.innerHTML = html;
  const listWrap = document.getElementById('agenda-eventos-list');
  const dayData = evMap[calSel] || [];
  const [y, m, d_str] = calSel.split('-');
  document.getElementById('agenda-day-title')!.textContent = `Agendamentos para ${d_str}/${m}/${y}`;
  if (dayData.length === 0) {
    listWrap!.innerHTML = '<div style="text-align:center;padding:16px;font-size:13px;color:var(--ink3);">Nenhum agendamento para este dia.</div>';
  } else {
    listWrap!.innerHTML = dayData.map((item: any) => {
      if (item.type === 'ev') {
        const e = item.data;
        return `<div class="hoc" style="border-left: 4px solid var(--bl);"><div class="hon">${ico('bell')} ${e.tit}</div><div class="hos">${e.hora || 'O dia todo'} ${e.alarmado ? '<span style="color:var(--rd)">(Tocou)</span>' : ''}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;"><button onclick="exportICS(${e.id})" style="flex:1;height:38px;border-radius:10px;background:var(--bll);color:var(--bl);border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;cursor:pointer;">${ico('bell')} Add Lembrete OS</button><button onclick="S.eventos=S.eventos.filter(x=>x.id!=${e.id});localStorage.setItem('pp-eventos',JSON.stringify(S.eventos));renderAgenda();" style="width:40px;border-radius:10px;background:var(--rdl);color:var(--rd);border:none;cursor:pointer;">${ico('x')}</button></div></div>`;
      } else {
        const o = item.data;
        return `<div class="hoc" style="border-left: 4px solid var(--gn); cursor:pointer;" onclick="editOrcByObjId('${o.id}')"><div class="hon">${ico('hard-hat')} Início: ${o.nome}</div><div class="hos">Status: <span class="hbadge ${getStatusBadgeClass(o.status)}">${o.status || 'Pendente'}</span> • Valor: R$ ${calcOrcTotal(o).toFixed(2)}</div><div style="display:flex;gap:8px;margin-top:12px;"><button onclick="event.stopPropagation(); transformToAlarm('${o.nome}', '${o.inicio}')" style="flex:1;height:38px;border-radius:10px;background:var(--bll);color:var(--bl);border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;cursor:pointer;">${ico('bell')} Criar Alarme de Obra</button></div></div>`;
      }
    }).join('');
  }
}

// ── Render Logo Preview ──
function renderLogoPreview(): void {
  const menuDefaultLogo = 'https://lh3.googleusercontent.com/d/1WJXU6NvZ12GeL3GA4NzzGeGeaZvHpkfn';
  const userLogo = S.config.logo;
  const img = document.getElementById('cfg-logo-preview') as HTMLImageElement;
  const txt = document.getElementById('cfg-logo-placeholder');
  const homeImg = document.getElementById('home-logo-img') as HTMLImageElement;
  const sideImg = document.getElementById('sidebar-logo-img') as HTMLImageElement;
  if (sideImg) { sideImg.src = '/apple-touch-icon.png'; sideImg.style.display = 'block'; }
  if (userLogo) {
    if (img) { img.src = userLogo; img.style.display = 'block'; }
    if (txt) txt.style.display = 'none';
    if (homeImg) { homeImg.src = userLogo; homeImg.style.display = 'block'; }
  } else {
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (txt) txt.style.display = 'block';
    if (homeImg) { homeImg.src = ''; homeImg.style.display = 'none'; }
  }
}

function renderSigPreview(): void {
  const img = document.getElementById('cfg-sig-preview') as HTMLImageElement;
  const ph = document.getElementById('cfg-sig-placeholder');
  if (!img || !ph) return;
  if (S.config.assinatura) { img.src = S.config.assinatura; img.style.display = 'block'; ph.style.display = 'none'; }
  else { img.src = ''; img.style.display = 'none'; ph.style.display = 'block'; }
}

// ── Signature canvas ──
let _sigDrawing = false, _sigLastX = 0, _sigLastY = 0, _sigCtx: CanvasRenderingContext2D | null = null;

function sigTab(tab: string): void {
  const isUpload = tab === 'upload';
  const sigUpload = document.getElementById('sig-panel-upload');
  const sigDraw = document.getElementById('sig-panel-draw');
  if (sigUpload) sigUpload.style.display = isUpload ? 'block' : 'none';
  if (sigDraw) sigDraw.style.display = isUpload ? 'none' : 'block';
  const btnU = document.getElementById('sig-tab-upload');
  const btnD = document.getElementById('sig-tab-draw');
  if (btnU) { btnU.style.background = isUpload ? 'var(--bl)' : 'transparent'; btnU.style.color = isUpload ? '#fff' : 'var(--ink3)'; }
  if (btnD) { btnD.style.background = isUpload ? 'transparent' : 'var(--bl)'; btnD.style.color = isUpload ? 'var(--ink3)' : '#fff'; }
  if (!isUpload) _sigCanvasInit();
}

function _sigCanvasInit(): void {
  const c = document.getElementById('sig-canvas') as HTMLCanvasElement;
  if (!c || (c as any)._sigInited) return;
  (c as any)._sigInited = true;
  _sigCtx = c.getContext('2d')!;
  _sigCtx.strokeStyle = '#1e293b'; _sigCtx.lineWidth = 2.2; _sigCtx.lineCap = 'round'; _sigCtx.lineJoin = 'round';
  const pos = (e: any) => {
    const r = c.getBoundingClientRect(); const sc = c.width / r.width;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sc, y: (src.clientY - r.top) * sc };
  };
  const start = (e: any) => { e.preventDefault(); _sigDrawing = true; const p = pos(e); _sigLastX = p.x; _sigLastY = p.y; _sigCtx!.beginPath(); _sigCtx!.moveTo(p.x, p.y); };
  const move = (e: any) => { if (!_sigDrawing) return; e.preventDefault(); const p = pos(e); _sigCtx!.lineTo(p.x, p.y); _sigCtx!.stroke(); _sigLastX = p.x; _sigLastY = p.y; };
  const end = () => { _sigDrawing = false; };
  c.addEventListener('mousedown', start); c.addEventListener('mousemove', move); c.addEventListener('mouseup', end); c.addEventListener('mouseleave', end);
  c.addEventListener('touchstart', start, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', end);
}

function sigCanvasClear(): void { const c = document.getElementById('sig-canvas') as HTMLCanvasElement; if (c && _sigCtx) _sigCtx.clearRect(0, 0, c.width, c.height); }
function sigCanvasSave(): void {
  const c = document.getElementById('sig-canvas') as HTMLCanvasElement; if (!c) return;
  S.config.assinatura = c.toDataURL('image/png'); renderSigPreview(); sigTab('upload');
  (window as any)._cfgDirty = true;
  toast(`${ico('check-circle')} Assinatura salva!`);
}

// ── Render Pgto List ──
function renderPgtoList(): void {
  (window as any)._pgtoList = (S.config.pgto || defCfg.pgto).split(',').map((s: string) => s.trim()).filter(Boolean);
  const wrap = document.getElementById('pgto-list');
  if (!wrap) return;
  wrap.innerHTML = (window as any)._pgtoList.map((p: string, i: number) => {
    const isOn = S.pgto.has(p);
    return `<div class="chk-item ${isOn ? 'on' : ''}" onclick="tChk(event, ${i}, this)"><div class="chk-box"></div><div class="chk-lbl">${p}</div></div>`;
  }).join('');
}

// ── Recibo ──
let _reciboOrcIdx = -1;

function abrirModalRecibo(i: number): void {
  _reciboOrcIdx = i;
  const o = S.orcs[i]; if (!o) return;
  const tot = calcOrcTotal(o);
  document.getElementById('rb-cliente-label')!.textContent = o.nome || '(sem nome)';
  const hoje = new Date();
  (document.getElementById('rb-data') as HTMLInputElement).value = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
  document.getElementById('rb-total-label')!.textContent = tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'R$ 0,00';
  (document.getElementById('rb-valor-auto') as HTMLInputElement).checked = true;
  (document.getElementById('rb-valor-input') as HTMLInputElement).style.display = 'none';
  (document.getElementById('rb-valor-input') as HTMLInputElement).value = '';
  (document.getElementById('rb-pgto') as HTMLInputElement).value = (o.pgto || []).join(', ');
  (document.getElementById('rb-obs') as HTMLInputElement).value = '';
  document.getElementById('modal-recibo')!.style.display = 'flex';
}

function fecharModalRecibo(): void { document.getElementById('modal-recibo')!.style.display = 'none'; _reciboOrcIdx = -1; }
function toggleRbValor(): void { const custom = (document.getElementById('rb-valor-custom') as HTMLInputElement).checked; (document.getElementById('rb-valor-input') as HTMLInputElement).style.display = custom ? '' : 'none'; }

function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(Math.abs(valor));
  const dec = Math.round((Math.abs(valor) - inteiro) * 100);
  const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const c = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  function g3(n: number): string {
    if (n === 0) return ''; if (n === 100) return 'cem';
    const ct = Math.floor(n / 100), r = n % 100, dz = Math.floor(r / 10), un = r % 10;
    let s = ct > 0 ? c[ct] : '';
    if (ct > 0 && r > 0) s += ' e ';
    if (r > 0 && r < 20) s += u[r];
    else if (dz > 0) { s += d[dz]; if (un > 0) s += ' e ' + u[un]; }
    return s;
  }
  function i2e(n: number): string {
    if (n === 0) return 'zero';
    const mi = Math.floor(n / 1000000), mil = Math.floor((n % 1000000) / 1000), res = n % 1000;
    const p: string[] = [];
    if (mi > 0) p.push(g3(mi) + (mi === 1 ? ' milhão' : ' milhões'));
    if (mil > 0) p.push(g3(mil) + ' mil');
    if (res > 0) p.push(g3(res));
    return p.join(', ');
  }
  let r = '';
  if (inteiro > 0) r += i2e(inteiro) + (inteiro === 1 ? ' real' : ' reais');
  if (dec > 0) { if (inteiro > 0) r += ' e '; r += i2e(dec) + (dec === 1 ? ' centavo' : ' centavos'); }
  return r || 'zero reais';
}

function _reciboFmtBRL(v: number): string { return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function _reciboFmtData(ymd: string): string { if (!ymd) return '—'; const p = ymd.split('-'); return (p[2] || '??') + '/' + (p[1] || '??') + '/' + (p[0] || '????'); }

function gerarReciboPDF(): void {
  const i = _reciboOrcIdx; if (i < 0) return;
  const o = S.orcs[i]; if (!o) return;
  const tot = calcOrcTotal(o);
  const custom = (document.getElementById('rb-valor-custom') as HTMLInputElement).checked;
  let valor = custom ? ptFloat((document.getElementById('rb-valor-input') as HTMLInputElement).value) : tot;
  if (valor <= 0) { toast(`${ico('alert')} Informe um valor válido.`); return; }
  const dataYMD = (document.getElementById('rb-data') as HTMLInputElement).value;
  const pgto = (document.getElementById('rb-pgto') as HTMLInputElement).value.trim() || 'Não informada';
  const obs = (document.getElementById('rb-obs') as HTMLInputElement).value.trim();
  const cfg = S.config || {} as any;
  const servicos: string[] = [];
  (o.rooms || []).forEach((room: any) => { (room.items || []).forEach((item: any) => { if (item.name) servicos.push(item.name); }); });
  const descServicos = servicos.length ? servicos.join(', ') : 'Serviços de pintura conforme combinado';
  const data = {
    id: 'REC-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    dataRecebimento: dataYMD,
    empresa: { nome: cfg.empresa || 'Prestador', cnpj: cfg.doc || '', tel: cfg.tel || '', email: cfg.emailEmpresa || '', end: cfg.endEmpresa || '', logo: cfg.logo || '' },
    cliente: { nome: o.nome || '—', doc: o.cpf || '', tel: o.tel || '', end: o.end || '' },
    descServicos, valor, pgto, obs, sigPintor: cfg.assinatura || '',
  };
  fecharModalRecibo();
  const html = gerarReciboHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) toast(`${ico('alert')} Pop-up bloqueado. Permita pop-ups para abrir o recibo.`);
  else setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function gerarReciboHTML(d: any): string {
  const extenso = valorPorExtenso(d.valor);
  const valorFmt = _reciboFmtBRL(d.valor);
  const dataFmt = _reciboFmtData(d.dataRecebimento);
  const cidade = (d.empresa.end || '').split('—').pop().trim() || 'Local';
  const logoHtml = d.empresa.logo ? `<img src="${d.empresa.logo}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;" alt="Logo">` : `<div style="width:60px;height:60px;border-radius:10px;background:#EDE9FE;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#7C3AED;">${(d.empresa.nome || 'P').charAt(0)}</div>`;
  const sigHtml = d.sigPintor ? `<img src="${d.sigPintor}" style="max-height:70px;max-width:220px;object-fit:contain;" alt="Assinatura">` : `<div style="height:50px;border-bottom:1.5px solid #334155;width:220px;"></div>`;
  const obsHtml = d.obs ? `<p style="margin-top:18px;font-size:12px;color:#475569;line-height:1.6;"><strong>Observações:</strong> ${d.obs}</p>` : '';
  const docHtml = d.empresa.cnpj ? `CPF/CNPJ: ${d.empresa.cnpj} · ` : '';
  const cliDocHtml = d.cliente.doc ? `, portador(a) do CPF/CNPJ <strong>${d.cliente.doc}</strong>,` : '';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo ${d.id}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#0F172A;padding:32px 40px;}@media print{body{padding:20px 28px;}@page{margin:12mm 14mm;}}.doc{max-width:720px;margin:0 auto;}.head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #0F172A;margin-bottom:22px;}.company-row{display:flex;gap:14px;align-items:flex-start;}.company-info .name{font-size:17px;font-weight:800;color:#0F172A;}.company-info .detail{font-size:11px;color:#64748B;line-height:1.7;margin-top:4px;}.title-block{text-align:right;}.rec-title{font-size:26px;font-weight:800;color:#7C3AED;letter-spacing:-0.5px;}.rec-id{font-family:monospace;font-size:12px;color:#475569;margin-top:3px;}.rec-date{font-size:11px;color:#64748B;margin-top:4px;}.legal-text{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:18px 20px;font-size:13.5px;color:#1E293B;line-height:1.85;margin-bottom:22px;}.legal-text strong{color:#0F172A;}.section{margin-bottom:18px;}.section-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7C3AED;margin-bottom:8px;}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;}.info-item{display:flex;flex-direction:column;gap:1px;}.info-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#94A3B8;}.info-val{font-size:13px;font-weight:600;color:#1E293B;}.sig-area{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px;padding-top:18px;border-top:1px solid #E2E8F0;}.sig-box{display:flex;flex-direction:column;align-items:center;gap:8px;}.sig-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;}.sig-name{font-size:12px;font-weight:600;color:#334155;}.disclaimer{margin-top:24px;padding:10px 14px;background:#FEF3C7;border-radius:8px;font-size:11px;color:#92400E;text-align:center;line-height:1.5;}.footer{margin-top:18px;text-align:center;font-size:10px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px;}</style></head><body onload="setTimeout(()=>window.print(),400)"><div class="doc"><div class="head"><div class="company-row">${logoHtml}<div class="company-info"><div class="name">${d.empresa.nome}</div><div class="detail">${docHtml}${d.empresa.tel ? 'Tel: ' + d.empresa.tel : ''}${d.empresa.email ? ' · ' + d.empresa.email : ''}<br>${d.empresa.end || ''}</div></div></div><div class="title-block"><div class="rec-title">RECIBO</div><div class="rec-id">${d.id}</div><div class="rec-date">Data: <strong>${dataFmt}</strong></div></div></div><div class="legal-text">Recebi(emos) de <strong>${d.cliente.nome}</strong>${cliDocHtml} a importância de <strong>${extenso}</strong> (<strong>${valorFmt}</strong>), referente a <strong>${d.descServicos}</strong>, pago mediante <strong>${d.pgto}</strong>.${cidade ? '<br>' + cidade + ', ' + dataFmt + '.' : ''}</div><div class="section"><div class="section-title">Dados do Cliente</div><div class="info-grid"><div class="info-item"><span class="info-lbl">Nome</span><span class="info-val">${d.cliente.nome}</span></div>${d.cliente.doc ? `<div class="info-item"><span class="info-lbl">CPF / CNPJ</span><span class="info-val">${d.cliente.doc}</span></div>` : ''}${d.cliente.tel ? `<div class="info-item"><span class="info-lbl">Telefone</span><span class="info-val">${d.cliente.tel}</span></div>` : ''}${d.cliente.end ? `<div class="info-item" style="grid-column:1/-1"><span class="info-lbl">Endereço</span><span class="info-val">${d.cliente.end}</span></div>` : ''}</div></div>${obsHtml}<div class="sig-area"><div class="sig-box"><div class="sig-lbl">Prestador de Serviço</div>${sigHtml}<div class="sig-name">${d.empresa.nome}</div>${d.empresa.cnpj ? `<div style="font-size:10px;color:#94A3B8;">${d.empresa.cnpj}</div>` : ''}</div><div class="sig-box"><div class="sig-lbl">Cliente (opcional)</div><div style="height:50px;border-bottom:1.5px solid #334155;width:220px;"></div><div class="sig-name">${d.cliente.nome}</div></div></div><div class="disclaimer">⚠️ Este recibo <strong>não tem valor como documento fiscal</strong>. Não substitui Nota Fiscal de Serviço (NFS-e). Serve apenas como comprovante de pagamento entre as partes.</div><div class="footer">Gerado pelo <strong>Pintor Plus</strong> · pintorplus.com.br · ID: ${d.id}</div></div></body></html>`;
}

// ── WA Message ──
function buildWAMsg(orc: any): string {
  let m2 = 0; (orc.rooms || []).forEach((r: any) => { m2 += getRoomMeds(r).m2; });
  const totalValue = calcOrcTotal(orc);
  let detalhes = '';
  if (orc.fmt === 'area') {
    detalhes += `*Locais e Itens:*\n`;
    (orc.rooms || []).forEach((r: any) => {
      detalhes += `\n📍 *${r.name}*\n`;
      (r.items || []).forEach((it: any) => { detalhes += `  - ${it.name}${(it.services && it.services.length) ? ` (${it.services.join(', ')})` : ''}\n`; if (it.obs) detalhes += `    _Obs: ${it.obs}_\n`; });
    });
    if (m2 > 0) detalhes += `\n*Área total aprox:* ${f1(m2)} m²\n`;
  } else if (orc.fmt === 'completo') {
    detalhes += `*Detalhes:*\n`;
    (orc.rooms || []).forEach((r: any) => {
      detalhes += `\n📍 *${r.name}*\n`;
      (r.items || []).forEach((it: any) => {
        const a = parseFloat(it.alt) || 0, c = parseFloat(it.comp) || 0;
        let med = (a && c) ? f1(a * c) + ' m²' : (a || c) ? f1(a || c) + ' ml' : '';
        detalhes += ` - ${it.name}`; if (med) detalhes += ` (${med})`;
        if (it.services && it.services.length) detalhes += ` [${it.services.join(', ')}]`;
        detalhes += `\n`; if (it.obs) detalhes += `   *Obs:* ${it.obs}\n`;
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

function buildPDFShareMsg(orc: any): string {
  const totalValue = calcOrcTotal(orc);
  const tFmt = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const msg = (S.config.msg || defCfg.msg).replace(/\\n/g, '\n').replace('{cliente}', orc.nome || 'Cliente').replace('{detalhes}', '').replace('{total}', tFmt).replace(/\n{3,}/g, '\n\n').trim();
  return msg.includes(tFmt) ? msg : msg + '\n\n*Valor Total: ' + tFmt + '*';
}

function refreshWAPreview(): void { const orc = (window as any).collectOrc?.(); const el = document.getElementById('wa-preview-inline'); if (el && orc) el.textContent = buildWAMsg(orc); }
function sendWA(): void { const orc = (window as any).collectOrc?.(); if (!orc) return; const msg = buildWAMsg(orc); const tel = (orc.tel || '').replace(/\D/g, ''); const url = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`; window.open(url, '_blank'); toast(`${ico('send')} Abrindo WhatsApp…`); }
function sendWAIdx(i: number): void { const o = S.orcs[i]; if (!o) return; const msg = buildWAMsg(o); const tel = (o.tel || '').replace(/\D/g, ''); const url = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`; window.open(url, '_blank'); }

// ── Status picker ──
function _showStatusPicker(i: number): void {
  const o = S.orcs[i]; if (!o) return;
  const list = document.getElementById('status-picker-list');
  list!.innerHTML = S.statusArr.map(s => {
    const isCur = (o.status || '') === s;
    return `<div onclick="_applyStatus(${i},'${s.replace(/'/g, "\\'")}');document.getElementById('status-picker-modal').style.display='none';" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;cursor:pointer;background:${isCur ? 'var(--bll)' : 'var(--bg-card)'};border:1.5px solid ${isCur ? 'var(--bl)' : 'var(--bdr)'};"><span style="flex:1;font-size:13px;font-weight:${isCur ? '800' : '600'};color:${isCur ? 'var(--bl)' : 'var(--ink)'};">${s}</span>${isCur ? `<svg class="ico" aria-hidden="true" style="color:var(--bl);"><use href="#ico-check-circle"/></svg>` : ''}</div>`;
  }).join('');
  document.getElementById('status-picker-modal')!.style.display = 'flex';
}

function _applyStatus(i: number, newStatus: string): void {
  const o = S.orcs[i]; if (!o) return;
  o.status = newStatus; o.tsEdit = Date.now(); saveOrcs();
  renderOrcamentosList(); (window as any).renderHomeMini?.();
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
  else toast(`${ico('check-circle')} Status alterado. Não esqueça de salvar.`);
}

// ── Send options ──
let _sendOptIdx = -1, _sendFmt = 'completo';

function _showSendOptions(realIdx: number): void {
  _sendOptIdx = realIdx;
  const o = S.orcs[realIdx]; if (!o) return;
  _setSendFmt(o.fmt || 'completo');
  const pr = document.getElementById('send-photos-row');
  if (pr) pr.style.display = 'none';
  document.getElementById('send-opts-modal')!.style.display = 'flex';
}

function _setSendFmt(fmt: string): void {
  _sendFmt = fmt;
  ['completo', 'area', 'simples'].forEach(f => {
    const b = document.getElementById('sfmt-' + f); if (!b) return;
    if (f === fmt) { b.style.borderColor = 'var(--bl)'; b.style.background = 'var(--bl)'; b.style.color = '#fff'; }
    else { b.style.borderColor = 'var(--bdr-input)'; b.style.background = 'var(--bg2)'; b.style.color = 'var(--ink2)'; }
  });
}

function _rascunhoModalAlterarStatus(): void { document.getElementById('rascunho-block-modal')!.style.display = 'none'; _showStatusPicker(_sendOptIdx); }

function _doSendWA(): void {
  document.getElementById('send-opts-modal')!.style.display = 'none';
  const o = S.orcs[_sendOptIdx]; if (!o) return;
  const stLow = (o.status || '').toLowerCase();
  if (stLow === 'rascunho' || stLow === 'draft' || !o.status) { document.getElementById('rascunho-block-modal')!.style.display = 'flex'; return; }
  const prev = o.fmt; o.fmt = _sendFmt as any;
  const msg = buildWAMsg(o);
  const tel = (o.tel || '').replace(/\D/g, '');
  window.open(tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  toast(`${ico('send')} Abrindo WhatsApp…`);
  o.fmt = prev;
}

// ── Card menu ──
function _canRecibo(o: any): boolean {
  if ((o as any).isFlashDraft) return false;
  const s = (o.status || '').toLowerCase().trim();
  const allowed = ['em andamento', 'aprovado', 'obra iniciada', 'obra finalizada', 'pagamento iniciado', 'pagamento finalizado'];
  return allowed.some(x => s === x || s.includes(x));
}

function _buildCardMenu(menuId: string, realIdx: number, o: any): string {
  const canR = _canRecibo(o);
  return `<div class="card-menu-wrap"><button class="card-menu-btn" onclick="event.stopPropagation();toggleCardMenu('${menuId}')" title="Ações">⋯</button><div id="${menuId}" class="card-menu-drop"><div class="cmd-item" onclick="closeCardMenus();editOrc(${realIdx})">${ico('edit')} Editar</div><div class="cmd-item" onclick="closeCardMenus();_showSendOptions(${realIdx})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Enviar WhatsApp</div>${canR ? `<div class="cmd-item" onclick="closeCardMenus();abrirModalRecibo(${realIdx})">${ico('file-text')} Gerar Recibo</div>` : `<div class="cmd-item cmd-disabled">${ico('file-text')} Recibo indisponível</div>`}<div class="cmd-item" onclick="closeCardMenus();_showStatusPicker(${realIdx})">${ico('zap')} Mudar Status</div><div class="cmd-item cmd-danger" onclick="closeCardMenus();askDelete('Excluir este orçamento?',()=>delOrc(${realIdx}))">${ico('trash')} Excluir</div></div></div>`;
}

function toggleCardMenu(id: string): void {
  const el = document.getElementById(id); if (!el) return;
  const isOpen = el.style.display !== 'none';
  closeCardMenus();
  if (!isOpen) el.style.display = 'block';
}

function closeCardMenus(): void { document.querySelectorAll('.card-menu-drop').forEach(el => (el as HTMLElement).style.display = 'none'); }

// ── Support / Bug Report ──
let _supportImages: File[] = [];

function _maskDoc(doc: string): string {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 14) return `${clean.slice(0,2)}.***.***/**${clean.slice(10,12)}-**`;
  if (clean.length === 11) return `${clean.slice(0,2)}*.***.***-**`;
  return doc;
}

function _gerarLogSuporte(): string {
  const now = new Date().toLocaleString('pt-BR');
  const cfg = S.config || {} as any;
  return ['=== LOG PINTOR PLUS ===', 'Data/Hora: ' + now, 'Versão SW:  pintorplus-v13', 'UA: ' + navigator.userAgent, '', '--- CADASTRO DO APP ---', 'Nome empresa: ' + (cfg.nome || '—'), 'Telefone:     ' + (cfg.tel || '—'), 'Email app:    ' + (cfg.email || '—'), 'CNPJ/CPF:     ' + (cfg.cnpj ? _maskDoc(cfg.cnpj) : '—'), 'Endereço:     ' + (cfg.end || '—'), '', '--- DADOS ---', 'Orçamentos:  ' + (S.orcs ? S.orcs.length : 0), 'Clientes:    ' + (S.clientes ? S.clientes.length : 0), 'Fornecedores:' + (S.fornecedores ? S.fornecedores.length : 0), 'Eventos:     ' + (S.eventos ? S.eventos.length : 0), '', '--- LOCAL STORAGE ---', 'pp-gdrive-lastSync: ' + (localStorage.getItem('pp-gdrive-lastSync') || '—'), 'pp-gdrive-email:    ' + (localStorage.getItem('pp-gdrive-email') || '—'), '====================='].join('\n');
}

function abrirModalSuporte(): void {
  _supportImages = [];
  const preview = document.getElementById('sp-img-preview'); if (preview) preview.innerHTML = '';
  const imgInput = document.getElementById('sp-img-input') as HTMLInputElement; if (imgInput) imgInput.value = '';
  const msg = document.getElementById('sp-msg') as HTMLTextAreaElement; if (msg) msg.value = '';
  const imgNote = document.getElementById('sp-img-note'); if (imgNote) imgNote.style.display = 'none';
  const log = _gerarLogSuporte();
  const logEl = document.getElementById('sp-log'); if (logEl) { logEl.textContent = log; logEl.style.display = 'none'; }
  const session = (() => { try { return JSON.parse(localStorage.getItem('pp-session') || '{}'); } catch { return {}; } })();
  const cfg = S.config || {} as any;
  const infoEl = document.getElementById('sp-user-info');
  if (infoEl) { infoEl.innerHTML = [esc(cfg.nome || ''), esc(cfg.tel || ''), esc(cfg.cnpj || '')].filter(Boolean).join('<br>') || '—'; }
  document.getElementById('modal-suporte')!.style.display = 'flex';
}

function addSupportImages(input: HTMLInputElement): void {
  const files = Array.from(input.files || []);
  _supportImages = _supportImages.concat(files);
  const preview = document.getElementById('sp-img-preview'); if (!preview) return;
  preview.innerHTML = '';
  _supportImages.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:72px;height:72px;flex-shrink:0;';
    wrap.innerHTML = `<img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--bdr);"><button onclick="_removeSupportImage(${idx})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--rd);color:#fff;border:none;font-size:11px;font-weight:800;cursor:pointer;line-height:1;">✕</button>`;
    preview.appendChild(wrap);
  });
  const imgNote = document.getElementById('sp-img-note');
  if (imgNote) imgNote.style.display = _supportImages.length ? 'block' : 'none';
}

function _removeSupportImage(idx: number): void {
  _supportImages.splice(idx, 1);
  const preview = document.getElementById('sp-img-preview'); if (!preview) return;
  preview.innerHTML = '';
  _supportImages.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:72px;height:72px;flex-shrink:0;';
    wrap.innerHTML = `<img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--bdr);"><button onclick="_removeSupportImage(${i})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--rd);color:#fff;border:none;font-size:11px;font-weight:800;cursor:pointer;line-height:1;">✕</button>`;
    preview.appendChild(wrap);
  });
  const imgNote = document.getElementById('sp-img-note');
  if (imgNote) imgNote.style.display = _supportImages.length ? 'block' : 'none';
}

// ── Expose on window ──
(window as any).compressImage = compressImage;
(window as any).calcOrcTotal = calcOrcTotal;
(window as any).calcTotal = calcTotal;
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
(window as any).saveItemModal = saveItemModal;
(window as any).cancelItemModal = cancelItemModal;
(window as any).openImg = openImg;
(window as any)._updateItemPrecoDisplay = _updateItemPrecoDisplay;
(window as any)._updatePrecoBaseDisplay = _updatePrecoBaseDisplay;
(window as any)._detailNomeClick = _detailNomeClick;
(window as any)._detailObsClick = _detailObsClick;
(window as any)._detailUpdateArea = _detailUpdateArea;
(window as any).openDetailNamePick = openDetailNamePick;
(window as any).closeDetailNamePick = closeDetailNamePick;
(window as any).selectDetailNome = selectDetailNome;
(window as any).openServicesModal = openServicesModal;
(window as any).closeServicesModal = closeServicesModal;
(window as any).toggleItemObsSvc = toggleItemObsSvc;
(window as any).confirmItemObsPick = confirmItemObsPick;
(window as any).renderHomeMini = renderHomeMini;
(window as any).renderHomeEvents = renderHomeEvents;
(window as any).renderHomeNews = renderHomeNews;
(window as any).renderOrcamentosList = renderOrcamentosList;
(window as any).viewOrc = viewOrc;
(window as any).closeViewOrc = closeViewOrc;
(window as any).renderAgenda = renderAgenda;
(window as any).renderLogoPreview = renderLogoPreview;
(window as any).renderSigPreview = renderSigPreview;
(window as any).renderPgtoList = renderPgtoList;
(window as any).sigTab = sigTab;
(window as any).sigCanvasClear = sigCanvasClear;
(window as any).sigCanvasSave = sigCanvasSave;
(window as any).abrirModalRecibo = abrirModalRecibo;
(window as any).fecharModalRecibo = fecharModalRecibo;
(window as any).toggleRbValor = toggleRbValor;
(window as any).gerarReciboPDF = gerarReciboPDF;
(window as any).buildWAMsg = buildWAMsg;
(window as any).buildPDFShareMsg = buildPDFShareMsg;
(window as any).refreshWAPreview = refreshWAPreview;
(window as any).sendWA = sendWA;
(window as any).sendWAIdx = sendWAIdx;
(window as any)._showStatusPicker = _showStatusPicker;
(window as any)._applyStatus = _applyStatus;
(window as any)._onStatusChange = _onStatusChange;
(window as any)._showSendOptions = _showSendOptions;
(window as any)._setSendFmt = _setSendFmt;
(window as any)._rascunhoModalAlterarStatus = _rascunhoModalAlterarStatus;
(window as any)._doSendWA = _doSendWA;
(window as any)._buildCardMenu = _buildCardMenu;
(window as any).toggleCardMenu = toggleCardMenu;
(window as any).closeCardMenus = closeCardMenus;
(window as any).abrirModalSuporte = abrirModalSuporte;
(window as any).addSupportImages = addSupportImages;
(window as any)._removeSupportImage = _removeSupportImage;
(window as any).valorPorExtenso = valorPorExtenso;

// ── Google Drive Status UI ──
export function renderGoogleStatus(): void {
  const email = S.googleEmail || localStorage.getItem('pp-google-email') || '';
  const signedIn = !!email;

  const cfgWrap = document.getElementById('gdrive-cfg-status');
  const bkpWrap = document.getElementById('gdrive-backup-btns');
  const bkpInfo = document.getElementById('gdrive-backup-info');

  if (cfgWrap) {
    if (signedIn) {
      cfgWrap.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4285F4,#34A853);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0;">${(email || 'G').charAt(0).toUpperCase()}</div><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:var(--gn);">✓ Conectado</div><div style="font-size:12px;color:var(--ink3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(email)}</div></div><button onclick="gSignOut()" style="padding:6px 12px;border-radius:8px;background:var(--rdl);border:1.5px solid var(--rd);color:var(--rd);font-family:'Sora',sans-serif;font-size:11px;font-weight:700;cursor:pointer;">Sair</button></div>`;
    } else {
      cfgWrap.innerHTML = `<div style="font-size:12px;color:var(--ink3);margin-bottom:12px;line-height:1.5;">Conecte para salvar backups, PDFs e fotos no seu Google Drive.</div><button onclick="gDriveConnect()" style="width:100%;height:46px;border-radius:12px;background:#fff;border:2px solid #4285F4;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#4285F4;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;"><svg viewBox="0 0 24 24" width="18" height="18" fill="#4285F4"><path d="M4.56 17.38 6.17 20.12a1.73 1.73 0 0 0 1.5.88h8.66a1.73 1.73 0 0 0 1.5-.88l1.61-2.74zM12 3a1.73 1.73 0 0 0-1.5.87L3.57 15.5a1.73 1.73 0 0 0 0 1.75l1.5 2.6 3.42-5.93L12 7.48l3.5 6.44 3.43 5.93 1.5-2.6a1.73 1.73 0 0 0 0-1.75L13.5 3.87A1.73 1.73 0 0 0 12 3zm3.5 10.92L12 7.48l-3.5 6.44z"/></svg> Entrar com Google</button>`;
    }
  }

  if (bkpWrap) {
    if (signedIn) {
      if (bkpInfo) bkpInfo.textContent = `Conectado como ${email}. Seus arquivos ficam em "Pintor Plus" no Drive.`;
      bkpWrap.innerHTML = `
        <button onclick="gDriveBackup()" style="width:100%;height:48px;border-radius:12px;background:var(--bl);border:none;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M4.56 17.38 6.17 20.12a1.73 1.73 0 0 0 1.5.88h8.66a1.73 1.73 0 0 0 1.5-.88l1.61-2.74zM12 3a1.73 1.73 0 0 0-1.5.87L3.57 15.5a1.73 1.73 0 0 0 0 1.75l1.5 2.6 3.42-5.93L12 7.48l3.5 6.44 3.43 5.93 1.5-2.6a1.73 1.73 0 0 0 0-1.75L13.5 3.87A1.73 1.73 0 0 0 12 3zm3.5 10.92L12 7.48l-3.5 6.44z"/></svg> Salvar Backup no Drive</button>
        <button onclick="gDriveRestoreList()" style="width:100%;height:44px;border-radius:12px;background:var(--bg2);border:1.5px solid var(--bdr);font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:var(--ink2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">📂 Restaurar do Drive</button>
        <button onclick="gDriveUploadPhotos()" style="width:100%;height:44px;border-radius:12px;background:var(--bg2);border:1.5px solid var(--bdr);font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:var(--ink2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">🖼️ Upload Fotos dos Orçamentos</button>
        <button onclick="gDriveSyncClientes()" style="width:100%;height:44px;border-radius:12px;background:var(--bg2);border:1.5px solid var(--bdr);font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:var(--ink2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">👥 Sincronizar Lista de Clientes</button>`;
    } else {
      if (bkpInfo) bkpInfo.textContent = 'Salve backups, orçamentos (PDF) e fotos diretamente no seu Google Drive.';
      bkpWrap.innerHTML = `<button onclick="gDriveConnect()" style="width:100%;height:48px;border-radius:12px;background:#fff;border:2px solid #4285F4;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#4285F4;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;"><svg viewBox="0 0 24 24" width="18" height="18" fill="#4285F4"><path d="M4.56 17.38 6.17 20.12a1.73 1.73 0 0 0 1.5.88h8.66a1.73 1.73 0 0 0 1.5-.88l1.61-2.74zM12 3a1.73 1.73 0 0 0-1.5.87L3.57 15.5a1.73 1.73 0 0 0 0 1.75l1.5 2.6 3.42-5.93L12 7.48l3.5 6.44 3.43 5.93 1.5-2.6a1.73 1.73 0 0 0 0-1.75L13.5 3.87A1.73 1.73 0 0 0 12 3zm3.5 10.92L12 7.48l-3.5 6.44z"/></svg> Entrar com Google para habilitar</button>`;
    }
  }
}

(window as any).renderGoogleStatus = function renderLocalBackupStatus(): void {
  const cfgWrap = document.getElementById('gdrive-cfg-status');
  const bkpWrap = document.getElementById('gdrive-backup-btns');
  const bkpInfo = document.getElementById('gdrive-backup-info');

  if (cfgWrap) {
    cfgWrap.innerHTML = `<div style="font-size:12px;color:var(--ink3);line-height:1.6;">Seus dados ficam salvos no dispositivo. Para maior segurança, exporte um arquivo de backup regularmente e guarde em local seguro.</div>`;
  }

  if (bkpInfo) {
    bkpInfo.textContent = 'Exporte um arquivo com seus dados ou restaure um backup salvo anteriormente.';
  }

  if (bkpWrap) {
    bkpWrap.innerHTML = `
      <button onclick="exportBackup()" style="width:100%;height:48px;border-radius:12px;background:var(--bl);border:none;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;"><svg class="ico" aria-hidden="true"><use href="#ico-download"/></svg> Exportar Backup</button>
      <button onclick="document.getElementById('backup-file')?.click()" style="width:100%;height:44px;border-radius:12px;background:var(--bg2);border:1.5px solid var(--bdr);font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:var(--ink2);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">📂 Importar Backup</button>`;
  }
};

// ── Setup event listeners after DOM is ready ──
window.addEventListener('pp-ready', () => {
  const btnSalvar = document.getElementById('btn-salvar-item-modal');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', (e) => {
      e.preventDefault();
      saveItemModal();
    });
  }
});
