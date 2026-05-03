import { S, saveOrcs } from './state';
import { toast, esc, formatNum, money, f1, ptFloat, safeUrl, formatPhone, validateFullName, validatePhone, getStatusBadgeClass, getRoomMeds, normalizeDecimalInput, normalizeMeasureInput, numFromInput, digitsOnly, setFieldError, ico } from './utils';
import type { Cliente, Fornecedor, Evento } from './types';

// ── Defaults ──
const defCfg = { ...S.config };

// ── Google Maps ──
const GMAPS_KEY = '';

function loadGoogleMaps(): void {
  if (!GMAPS_KEY) return;
  if ((window as any).google && (window as any).google.maps) return initAutocomplete();
  if (document.getElementById('gmaps-script')) return;
  const script = document.createElement('script');
  script.id = 'gmaps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places&callback=initAutocomplete`;
  script.async = true;
  script.defer = true;
  (window as any).initAutocomplete = initAutocomplete;
  document.head.appendChild(script);
}

function initAutocomplete(): void {
  const input = document.getElementById('cli-logradouro') as HTMLInputElement;
  if (!input || !(window as any).google) return;
  if ((window as any).autocompleteObj) return;
  (window as any).autocompleteObj = new (window as any).google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'br' },
    fields: ['address_components', 'geometry', 'name'],
  });
  (window as any).autocompleteObj.addListener('place_changed', fillInAddress);
  input.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault(); });
}

function fillInAddress(): void {
  const place = (window as any).autocompleteObj.getPlace();
  if (!place.address_components) return;
  let street = '', number = '', neighborhood = '', city = '', state = '', cep = '';
  for (const component of place.address_components) {
    const type = component.types[0];
    if (type === 'route') street = component.long_name;
    if (type === 'street_number') number = component.long_name;
    if (type === 'sublocality_level_1' || type === 'sublocality') neighborhood = component.long_name;
    if (type === 'administrative_area_level_2') city = component.long_name;
    if (type === 'administrative_area_level_1') state = component.short_name;
    if (type === 'postal_code') cep = component.long_name;
  }
  const v = (id: string, val: string) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val; };
  v('cli-logradouro', street || place.name);
  if (number) v('cli-numero', number);
  if (neighborhood) v('cli-bairro', neighborhood);
  if (city && state) v('cli-cidade', `${city} - ${state}`);
  if (cep) { v('cli-cep', cep); maskCep(document.getElementById('cli-cep') as HTMLInputElement); }
  const endFields = document.getElementById('end-fields');
  const endManual = document.getElementById('end-manual-toggle');
  if (endFields) endFields.style.display = 'block';
  if (endManual) endManual.style.display = 'none';
  S.isDirty = true;
  toast(`${ico('check-circle')} Endereço preenchido!`);
  setTimeout(() => { document.getElementById('cli-numero')?.focus(); }, 100);
}

// ── CEP ──
let _cepTimer: ReturnType<typeof setTimeout>;
function maskCep(input: HTMLInputElement): void {
  const digits = input.value.replace(/\D/g, '').slice(0, 8);
  input.value = digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
  const msg = document.getElementById('cep-msg');
  if (msg) msg.style.display = 'none';
  if (digits.length === 8) { clearTimeout(_cepTimer); _cepTimer = setTimeout(() => fetchCep(digits), 500); }
}

async function fetchCep(cep: string): Promise<void> {
  const cleanCep = cep.replace(/\D/g, '');
  const spin = document.getElementById('cep-spin');
  const msg = document.getElementById('cep-msg');
  if (spin) (spin as HTMLElement).style.opacity = '1';
  if (msg) msg.style.display = 'none';

  function fillAddress(d: any): void {
    if (spin) (spin as HTMLElement).style.opacity = '0';
    const v = (id: string, val: string) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val; };
    v('cli-logradouro', d.street || d.logradouro || '');
    v('cli-bairro', d.neighborhood || d.bairro || '');
    v('cli-cidade', (d.city || d.localidade || '') + ' - ' + (d.state || d.uf || ''));
    v('cli-numero', '');
    const endFields = document.getElementById('end-fields');
    const endManual = document.getElementById('end-manual-toggle');
    if (endFields) endFields.style.display = 'block';
    if (endManual) endManual.style.display = 'none';
    if (msg) { msg.style.display = 'block'; msg.style.color = 'var(--gn)'; msg.innerHTML = `${ico('check-circle')} Endereço encontrado!`; }
    setTimeout(() => { const el = document.getElementById('cli-numero'); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 100);
  }

  function showError(): void {
    if (spin) (spin as HTMLElement).style.opacity = '0';
    if (msg) { msg.style.display = 'block'; msg.style.color = 'var(--rd)'; msg.innerHTML = `${ico('alert')} CEP não encontrado. Preencha manualmente.`; }
  }

  try { const res0 = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`); if (res0.ok) { const d = await res0.json(); if (d && d.cep) { fillAddress(d); return; } } } catch {}
  try { const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`); if (res.ok) { const d = await res.json(); if (!d.erro) { fillAddress(d); return; } } } catch {}
  try { const res2 = await fetch(`https://opencep.com/v1/${cleanCep}`); if (res2.ok) { const d = await res2.json(); if (d && d.cep) { fillAddress(d); return; } } } catch {}
  showError();
}

function toggleManualEnd(): void {
  const endFields = document.getElementById('end-fields');
  const endManual = document.getElementById('end-manual-toggle');
  const msg = document.getElementById('cep-msg');
  if (endFields) endFields.style.display = 'block';
  if (endManual) endManual.style.display = 'none';
  if (msg) msg.style.display = 'none';
  (document.getElementById('cli-logradouro') as HTMLInputElement)?.focus();
}

// ── Collect / Save Orçamento ──
function collectOrc(): any {
  const v = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
  const end = [v('cli-logradouro'), v('cli-numero'), v('cli-comp'), v('cli-bairro'), v('cli-cidade')].filter(Boolean).join(', ');
  return {
    id: S.editId || Date.now().toString(),
    nome: v('cli-nome'), apelido: v('cli-apelido'), tel: v('cli-tel'), email: v('cli-email'),
    cpf: v('cli-cpf'), cep: v('cli-cep'),
    logradouro: v('cli-logradouro'), numero: v('cli-numero'), comp: v('cli-comp'),
    bairro: v('cli-bairro'), cidade: v('cli-cidade'), end,
    pagNome: v('pag-nome'), pagTel: v('pag-tel'), pagEnd: v('pag-end'), pagador: S.pagador,
    rooms: S.rooms.map(r => ({ ...r })),
    pgto: Array.from(S.pgto), fmt: S.fmt,
    preco: parseFloat(v('preco-m2')) || 0,
    status: v('orc-status') || S.statusArr[0],
    valid: v('orc-valid') || '15',
    tipoServico: v('orc-tipo-serv'),
    inicio: v('orc-inicio'), obs: v('orc-obs'),
    date: new Date().toLocaleDateString('pt-BR'),
    ts: S.editId ? S.orcs.find(o => o.id === S.editId)?.ts : Date.now(),
    tsEdit: Date.now(),
  };
}

function extractClient(orc: any): void {
  const tStr = (orc.tel || '').replace(/\D/g, '');
  if (!orc.nome || !tStr) return;
  const idx = S.clientes.findIndex(c => c.tel.replace(/\D/g, '') === tStr);
  if (idx >= 0) {
    S.clientes[idx].nome = orc.nome;
    S.clientes[idx].apelido = orc.apelido || '';
    S.clientes[idx].email = orc.email;
    S.clientes[idx].end = orc.end;
    S.clientes[idx].cpf = orc.cpf;
  } else {
    S.clientes.push({ nome: orc.nome, apelido: orc.apelido || '', tel: orc.tel, email: orc.email, end: orc.end, cpf: orc.cpf, cep: '', logradouro: '', numero: '', comp: '', bairro: '', cidade: '' });
  }
  localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
}

function _saveOrcs(): void {
  const json = JSON.stringify(S.orcs);
  try { localStorage.setItem('pp-orcs', json); }
  catch (e) {
    console.error('_saveOrcs: localStorage cheio', e);
    try { sessionStorage.setItem('pp-orcs-emergency', json); } catch {}
    toast(`${ico('alert')} Armazenamento local cheio!`);
  }
  try { sessionStorage.setItem('pp-orcs-mirror', json); } catch {}
}

function saveOrc(silent = false): boolean {
  const orc = collectOrc();
  const telClean = (orc.tel || '').replace(/\D/g, '');
  if (telClean && telClean.length < 10) { toast(`${ico('alert')} Telefone inválido. Informe o DDD.`); return false; }
  if (!orc.nome.trim()) { toast(`${ico('alert')} Informe o nome do cliente`); return false; }
  if (S.editId) { const i = S.orcs.findIndex(o => o.id === S.editId); if (i >= 0) S.orcs[i] = orc; else S.orcs.unshift(orc); }
  else { S.orcs.unshift(orc); S.editId = orc.id; }
  S.isDirty = false; _saveOrcs(); extractClient(orc);
  if (!silent) { toast(`${ico('check-circle')} Orçamento salvo!`); (window as any).homeTab?.('orcamentos'); }
  return true;
}

function triggerAction(action: string): void {
  const nome = (document.getElementById('cli-nome') as HTMLInputElement)?.value.trim();
  const telStr = (document.getElementById('cli-tel') as HTMLInputElement)?.value.replace(/\D/g, '');
  if (!nome) return toast(`${ico('alert')} Insira o nome do cliente na aba Dados do Cliente!`);
  if (telStr && telStr.length < 10) return toast(`${ico('alert')} Telefone inválido. Inclua o DDD.`);
  const saved = saveOrc(true);
  if (!saved) return;
  if (action === 'save') { toast(`${ico('check-circle')} Salvo com sucesso!`); (window as any).homeTab?.('orcamentos'); }
  else if (action === 'wa') { (window as any).sendWA?.(); setTimeout(() => (window as any).homeTab?.('orcamentos'), 500); }
}

function editOrc(i: number): void {
  (window as any).canNavigateAsync?.(() => {
    const o = S.orcs[i]; if (!o) return;
    toast(`${ico('edit')} Carregando orçamento…`);
    S.isDirty = true; S.editId = o.id;
    S.rooms = JSON.parse(JSON.stringify(o.rooms || []));
    S.pgto = new Set(o.pgto || []); S.fmt = o.fmt || 'completo'; S.pagador = o.pagador || false;
    (window as any).renderPgtoList?.(); (window as any).go?.(1);
    setTimeout(() => {
      const v = (id: string, val: any) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val || ''; };
      v('cli-nome', o.nome); v('cli-apelido', o.apelido || ''); v('cli-tel', o.tel); v('cli-email', o.email);
      v('cli-cpf', o.cpf); v('cli-cep', o.cep); v('cli-logradouro', o.logradouro); v('cli-numero', o.numero);
      v('cli-comp', o.comp); v('cli-bairro', o.bairro); v('cli-cidade', o.cidade);
      if (o.logradouro) document.getElementById('end-fields')!.style.display = 'block';
      v('pag-nome', o.pagNome); v('pag-tel', o.pagTel); v('pag-end', o.pagEnd); v('preco-m2', o.preco);
      v('orc-status', o.status); v('orc-valid', o.valid); v('orc-inicio', o.inicio); v('orc-obs', o.obs);
      if (o.tipoServico) (document.getElementById('orc-tipo-serv') as HTMLSelectElement).value = o.tipoServico;
      document.getElementById('pag-sw')?.classList.toggle('on', o.pagador);
      document.getElementById('pag-fields')?.classList.toggle('show', o.pagador);
      document.querySelectorAll('.fmt-card').forEach(c => {
        const fn = (c as HTMLElement).getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        c.classList.toggle('on', fn === o.fmt);
      });
      (window as any).renderRooms?.();
    }, 50);
  });
}

function newOrc(): void {
  (window as any).canNavigateAsync?.(() => {
    S.isDirty = true;
    S.rooms = [{ id: Date.now().toString(), name: 'Geral', alt: 0, comp: 0, items: [], services: S.DEFAULT_SERVICES.slice(), collapsed: false, preco: 0, precoPerM2: false }];
    S.pgto = new Set(); S.fmt = 'completo'; S.pagador = false; S.editId = null;
    ['cli-nome', 'cli-apelido', 'cli-tel', 'cli-email', 'cli-cpf', 'cli-cep', 'cli-logradouro', 'cli-bairro', 'cli-cidade', 'cli-numero', 'cli-comp'].forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = '';
    });
    const endFields = document.getElementById('end-fields');
    const endManual = document.getElementById('end-manual-toggle');
    const cepMsg = document.getElementById('cep-msg');
    if (endFields) endFields.style.display = 'none';
    if (endManual) endManual.style.display = 'block';
    if (cepMsg) cepMsg.style.display = 'none';
    (window as any).renderPgtoList?.();
    document.querySelectorAll('.chk-item').forEach(el => el.classList.remove('on'));
    ['orc-obs', 'orc-inicio'].forEach(id => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = ''; });
    (document.getElementById('orc-tipo-serv') as HTMLSelectElement).selectedIndex = 2;
    document.querySelectorAll('.fmt-card').forEach((c, i) => c.classList.toggle('on', i === 0));
    document.getElementById('pag-sw')?.classList.remove('on');
    document.getElementById('pag-fields')?.classList.remove('show');
    (window as any).renderRooms?.();
    (window as any).go?.(1);
    setTimeout(() => { (document.getElementById('orc-status') as HTMLSelectElement).value = S.statusArr[0] || 'Pendente'; }, 50);
  });
}

function delOrc(i: number): void {
  S.orcs.splice(i, 1); _saveOrcs();
  (window as any).renderOrcamentosList?.(); (window as any).renderHomeMini?.();
  toast(`${ico('trash')} Removido`);
}

// ── Clientes ──
function _cliMatch(c: Cliente, q: string): boolean {
  return [c.nome, c.tel, c.email, c.cpf, c.end].some(p => p && String(p).toLowerCase().includes(q));
}

function renderClientes(): void {
  const wrap = document.getElementById('clientes-list-full');
  if (!wrap) return;
  if (!S.clientes || !S.clientes.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:24px 16px;background:#fff;border-radius:14px;border:1px solid var(--bdr);"><div style="font-size:32px;margin-bottom:8px;opacity:.3;">${ico('users')}</div><div style="font-size:13px;color:var(--ink3);font-style:italic;">Nenhum contato salvo ainda.</div></div>`;
    return;
  }
  const q = ((document.getElementById('cli-search') as HTMLInputElement)?.value || '').toLowerCase().trim();
  const indexed = S.clientes.map((c, i) => ({ c, i }));
  const filtered = q ? indexed.filter(({ c }) => _cliMatch(c, q)) : indexed;
  if (!filtered.length) { wrap.innerHTML = `<div class="srch-empty">Nenhum contato encontrado para "<strong>${esc(q)}</strong>".</div>`; return; }
  wrap.innerHTML = filtered.map(({ c, i }) => `
    <div class="hoc" style="margin-bottom:12px;">
      <div class="hon">${esc(c.nome)}</div>
      <div class="hos" style="margin-bottom:8px;">${esc(c.tel || 'Sem telefone')}</div>
      ${c.email ? `<div class="hos" style="margin-bottom:4px;">${ico('mail')} ${esc(c.email)}</div>` : ''}
      ${c.end ? `<div class="hos" style="margin-bottom:12px;">${ico('pin')} ${esc(c.end)}</div>` : ''}
      <div style="display:flex; gap:8px; margin-top:14px;">
        ${c.tel ? `<a href="tel:${c.tel.replace(/\D/g, '')}" style="width:44px;height:38px;border-radius:10px;background:var(--gnl);color:var(--gn);border:1.5px solid var(--gn);display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;">${ico('phone')}</a>` : ''}
        <button onclick="editClient(${i})" style="flex:1;height:38px;border-radius:10px;background:var(--bll);color:var(--bl);border:none;font-weight:700;font-size:12px;cursor:pointer;">${ico('edit')} Editar</button>
        <button onclick="askDelete('Deseja excluir este contato?', () => deleteClient(${i}))" style="width:44px;height:38px;border-radius:10px;background:var(--rdl);color:var(--rd);border:none;cursor:pointer;">${ico('trash')}</button>
      </div>
      <button onclick="exportVCF(${i})" style="width:100%;height:38px;border-radius:10px;background:transparent;color:var(--ink2);border:1px solid var(--bdr);font-family:'Sora',sans-serif;font-weight:700;font-size:12px;cursor:pointer;margin-top:8px;">${ico('save')} Salvar na Agenda do Celular</button>
    </div>
  `).join('');
}

function deleteClient(i: number): void {
  S.clientes.splice(i, 1);
  localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
  renderClientes();
  toast(`${ico('trash')} Contato removido!`);
}

function editClient(i: number): void {
  (document.getElementById('edit-cli-idx') as HTMLInputElement)!.value = String(i);
  if (i === -1) {
    document.getElementById('edit-cli-title')!.innerText = 'Novo Contato';
    ['edit-cli-nome', 'edit-cli-tel', 'edit-cli-email', 'edit-cli-end', 'edit-cli-cpf'].forEach(id => {
      (document.getElementById(id) as HTMLInputElement).value = '';
    });
  } else {
    document.getElementById('edit-cli-title')!.innerText = 'Editar Contato';
    const c = S.clientes[i];
    (document.getElementById('edit-cli-nome') as HTMLInputElement).value = c.nome || '';
    (document.getElementById('edit-cli-tel') as HTMLInputElement).value = c.tel || '';
    (document.getElementById('edit-cli-email') as HTMLInputElement).value = c.email || '';
    (document.getElementById('edit-cli-end') as HTMLInputElement).value = c.end || '';
    (document.getElementById('edit-cli-cpf') as HTMLInputElement).value = c.cpf || '';
  }
  document.getElementById('modal-edit-client')!.style.display = 'flex';
}

function saveEditClient(): void {
  const i = parseInt((document.getElementById('edit-cli-idx') as HTMLInputElement).value);
  const data = {
    nome: (document.getElementById('edit-cli-nome') as HTMLInputElement).value,
    tel: (document.getElementById('edit-cli-tel') as HTMLInputElement).value,
    email: (document.getElementById('edit-cli-email') as HTMLInputElement).value,
    end: (document.getElementById('edit-cli-end') as HTMLInputElement).value,
    cpf: (document.getElementById('edit-cli-cpf') as HTMLInputElement).value,
  };
  if (!data.nome) return toast(`${ico('alert')} O nome é obrigatório`);
  if (i === -1) S.clientes.push(data as Cliente);
  else S.clientes[i] = { ...S.clientes[i], ...data };
  localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
  document.getElementById('modal-edit-client')!.style.display = 'none';
  renderClientes();
  toast(`${ico('check-circle')} Contato salvo!`);
}

function exportVCF(i: number): void {
  const c = S.clientes[i];
  const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.nome}\nTEL;TYPE=CELL:${c.tel || ''}\nEND:VCARD`;
  const blob = new Blob([vcf], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${c.nome.replace(/\s+/g, '_')}.vcf`; a.click();
  URL.revokeObjectURL(url);
  toast('Baixando arquivo de contato...');
}

function openClientPicker(): void {
  document.getElementById('client-picker-list')!.innerHTML = S.clientes.map((c, i) =>
    `<div style="padding:16px; border-bottom:1px solid var(--bdr); cursor:pointer;" onclick="selectClientPicker(${i})"><div style="font-weight:700; font-size: 15px; color:var(--ink);">${esc(c.nome)}</div><div style="font-size:13px; color:var(--ink3);">${esc(c.tel || '')}</div></div>`
  ).join('') || '<div style="padding:16px; font-size:13px; color:var(--ink3);">Nenhum contato salvo.</div>';
  document.getElementById('modal-client-picker')!.style.display = 'flex';
}

function selectClientPicker(i: number): void {
  const c = S.clientes[i];
  (document.getElementById('cli-nome') as HTMLInputElement).value = c.nome || '';
  (document.getElementById('cli-tel') as HTMLInputElement).value = c.tel || '';
  (document.getElementById('cli-email') as HTMLInputElement).value = c.email || '';
  (document.getElementById('cli-cpf') as HTMLInputElement).value = c.cpf || '';
  (document.getElementById('cli-logradouro') as HTMLInputElement).value = c.end || '';
  document.getElementById('modal-client-picker')!.style.display = 'none';
  toast(`${ico('check-circle')} Contato selecionado!`);
}

async function pickPhoneContactToFill(): Promise<void> {
  if (!('contacts' in navigator && 'ContactsManager' in window)) return toast(`${ico('alert')} Acesso à agenda não suportado no navegador atual.`);
  try {
    const props = ['name', 'tel', 'email', 'address'];
    const contacts = await (navigator as any).contacts.select(props, { multiple: false });
    if (contacts && contacts.length) {
      const c = contacts[0];
      (document.getElementById('cli-nome') as HTMLInputElement).value = c.name?.[0] || '';
      (document.getElementById('cli-tel') as HTMLInputElement).value = (c.tel?.[0] || '').replace(/\D/g, '');
      if (c.email && c.email.length) (document.getElementById('cli-email') as HTMLInputElement).value = c.email[0];
      if (c.address && c.address.length) {
        const addr = c.address[0];
        const fullAddr = addr.formatted || [addr.street, addr.city, addr.region, addr.postalCode].filter(Boolean).join(', ');
        (document.getElementById('cli-logradouro') as HTMLInputElement).value = fullAddr;
      }
      toast(`${ico('check-circle')} Contato preenchido!`);
    }
  } catch { toast(`${ico('x-circle')} Erro ao acessar agenda do celular.`); }
}

async function pickPhoneContactToSave(): Promise<void> {
  if (!('contacts' in navigator && 'ContactsManager' in window)) return toast(`${ico('alert')} Função não suportada neste aparelho.`);
  try {
    const props = ['name', 'tel', 'email', 'address'];
    const contacts = await (navigator as any).contacts.select(props, { multiple: true });
    if (contacts && contacts.length) {
      contacts.forEach((c: any) => {
        S.clientes.push({
          nome: c.name?.[0] || 'Sem Nome',
          tel: (c.tel?.[0] || '').replace(/\D/g, ''),
          email: c.email?.[0] || '',
          end: c.address?.[0]?.formatted || '',
          apelido: '', cpf: '', cep: '', logradouro: '', numero: '', comp: '', bairro: '', cidade: '',
        });
      });
      localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
      renderClientes();
      toast(`${ico('check-circle')} ${contacts.length} contatos importados!`);
    }
  } catch { toast(`${ico('x-circle')} Falha na importação.`); }
}

// ── Fornecedores ──
function _fornMatch(f: any, q: string): boolean {
  return [f.nome, f.tel, f.cat].some((p: any) => p && String(p).toLowerCase().includes(q));
}

function renderFornecedores(): void {
  const wrap = document.getElementById('fornecedores-list-full');
  if (!wrap) return;
  if (!S.fornecedores || !S.fornecedores.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:24px 16px;background:#fff;border-radius:14px;border:1px solid var(--bdr);"><div style="font-size:32px;margin-bottom:8px;opacity:.3;">${ico('truck')}</div><div style="font-size:13px;color:var(--ink3);font-style:italic;">Nenhum fornecedor cadastrado.</div></div>`;
    return;
  }
  const q = ((document.getElementById('forn-search') as HTMLInputElement)?.value || '').toLowerCase().trim();
  const indexed = S.fornecedores.map((f, i) => ({ f, i }));
  const filtered = q ? indexed.filter(({ f }) => _fornMatch(f, q)) : indexed;
  if (!filtered.length) { wrap.innerHTML = `<div class="srch-empty">Nenhum fornecedor encontrado para "<strong>${esc(q)}</strong>".</div>`; return; }
  wrap.innerHTML = filtered.map(({ f, i }) => `
    <div class="hoc" style="margin-bottom:12px; border-left:4px solid var(--am);">
      <div class="hon">${f.nome}</div>
      <div class="hos" style="margin-bottom:4px;">${f.tel || 'Sem telefone'}</div>
      ${f.cat ? `<div class="hbadge hby" style="margin-bottom:12px;">${f.cat}</div>` : ''}
      <div style="display:flex; gap:8px; margin-top:14px;">
        ${f.tel ? `<a href="tel:${f.tel.replace(/\D/g, '')}" style="width:44px;height:38px;border-radius:10px;background:var(--gnl);color:var(--gn);border:1.5px solid var(--gn);display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;">${ico('phone')}</a>` : ''}
        <button onclick="editFornecedor(${i})" style="flex:1;height:38px;border-radius:10px;background:var(--bg2);color:var(--ink2);border:1px solid var(--bdr);font-weight:700;font-size:12px;cursor:pointer;">${ico('edit')} Editar</button>
        <button onclick="askDelete('Deseja excluir este fornecedor?', () => deleteFornecedor(${i}))" style="width:44px;height:38px;border-radius:10px;background:var(--rdl);color:var(--rd);border:none;cursor:pointer;">${ico('trash')}</button>
      </div>
      <button onclick="askQuoteFornecedor(${i})" style="width:100%;height:38px;border-radius:10px;background:#25D366;color:#fff;border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:12px;cursor:pointer;margin-top:8px;">${ico('send')} Pedir Cotação de Materiais</button>
    </div>
  `).join('');
}

function openEditFornecedor(i: number): void {
  (document.getElementById('edit-forn-idx') as HTMLInputElement)!.value = String(i);
  if (i === -1) {
    document.getElementById('edit-forn-title')!.innerText = 'Novo Fornecedor';
    ['edit-forn-nome', 'edit-forn-tel', 'edit-forn-cat'].forEach(id => (document.getElementById(id) as HTMLInputElement).value = '');
  } else {
    document.getElementById('edit-forn-title')!.innerText = 'Editar Fornecedor';
    const f = S.fornecedores[i] as any;
    (document.getElementById('edit-forn-nome') as HTMLInputElement).value = f.nome || '';
    (document.getElementById('edit-forn-tel') as HTMLInputElement).value = f.tel || '';
    (document.getElementById('edit-forn-cat') as HTMLInputElement).value = f.cat || '';
  }
  document.getElementById('modal-edit-fornecedor')!.style.display = 'flex';
}

function editFornecedor(i: number): void { openEditFornecedor(i); }

function saveEditFornecedor(): void {
  const i = parseInt((document.getElementById('edit-forn-idx') as HTMLInputElement).value);
  const data = {
    nome: (document.getElementById('edit-forn-nome') as HTMLInputElement).value,
    tel: (document.getElementById('edit-forn-tel') as HTMLInputElement).value,
    cat: (document.getElementById('edit-forn-cat') as HTMLInputElement).value,
  };
  if (!data.nome) return toast(`${ico('alert')} O nome é obrigatório`);
  if (i === -1) S.fornecedores.push({ servico: '', obs: '', ...data });
  else S.fornecedores[i] = { ...S.fornecedores[i], ...data };
  localStorage.setItem('pp-fornecedores', JSON.stringify(S.fornecedores));
  document.getElementById('modal-edit-fornecedor')!.style.display = 'none';
  renderFornecedores();
  toast(`${ico('check-circle')} Fornecedor salvo!`);
}

function deleteFornecedor(i: number): void {
  S.fornecedores.splice(i, 1);
  localStorage.setItem('pp-fornecedores', JSON.stringify(S.fornecedores));
  renderFornecedores();
  toast(`${ico('trash')} Fornecedor removido!`);
}

let _quoteFornIdx = -1;
function askQuoteFornecedor(i: number): void {
  const f = S.fornecedores[i] as any;
  if (!f || !f.tel) return toast(`${ico('alert')} Fornecedor sem telefone.`);
  _quoteFornIdx = i;
  const list = document.getElementById('quote-forn-orc-list');
  if (list) {
    if (!S.orcs || !S.orcs.length) {
      list.innerHTML = '<div style="font-size:13px;color:var(--ink3);text-align:center;padding:12px;">Nenhum orçamento cadastrado.</div>';
    } else {
      list.innerHTML = S.orcs.map((o, idx) => `
        <div onclick="_doQuoteForn(${idx})" style="padding:12px;background:var(--bg-card);border:1.5px solid var(--bdr);border-radius:12px;cursor:pointer;transition:border-color .15s;" onmouseenter="this.style.borderColor='var(--bl)'" onmouseleave="this.style.borderColor='var(--bdr)'">
          <div style="font-size:14px;font-weight:700;color:var(--ink);">${esc(o.nome || 'Sem nome')}</div>
          <div style="font-size:11px;color:var(--ink3);margin-top:2px;">R$ ${(window as any).calcOrcTotal?.(o).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · <span class="hbadge ${getStatusBadgeClass(o.status)}">${o.status || 'Pendente'}</span></div>
        </div>`).join('');
    }
  }
  document.getElementById('quote-forn-modal')!.style.display = 'flex';
}

function _doQuoteForn(orcIdx: number): void {
  document.getElementById('quote-forn-modal')!.style.display = 'none';
  const f = S.fornecedores[_quoteFornIdx] as any; if (!f) return;
  const o = S.orcs[orcIdx]; if (!o) return;
  const tel = f.tel.replace(/\D/g, '');
  const msg = `Olá, ${f.nome}! Segue o orçamento de referência para cotação de materiais:\n\n${(window as any).buildWAMsg?.(o)}\n\nPor favor, me envie o valor dos materiais necessários. Obrigado!`;
  window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
}

function _doQuoteFornNoOrc(): void {
  document.getElementById('quote-forn-modal')!.style.display = 'none';
  const f = S.fornecedores[_quoteFornIdx] as any; if (!f) return;
  const tel = f.tel.replace(/\D/g, '');
  const msg = `Olá, ${f.nome}! Gostaria de fazer uma cotação de materiais para pintura. Pode me enviar uma lista de preços?`;
  window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Eventos & Agenda ──
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calSelDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

function calChangeMonth(dir: number): void {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  else if (calMonth < 0) { calMonth = 11; calYear--; }
  (window as any).renderAgenda?.();
}

function selectCalDate(dtStr: string): void {
  calSelDate = dtStr;
  (window as any).renderAgenda?.();
}

function getUnifiedEvents(): Record<string, Array<{ type: string; data: any }>> {
  const map: Record<string, Array<{ type: string; data: any }>> = {};
  S.eventos.forEach(e => {
    if (!(e as any).dat) return;
    if (!map[(e as any).dat]) map[(e as any).dat] = [];
    map[(e as any).dat].push({ type: 'ev', data: e });
  });
  S.orcs.forEach(o => {
    if (o.inicio) {
      if (!map[o.inicio]) map[o.inicio] = [];
      map[o.inicio].push({ type: 'orc', data: o });
    }
  });
  return map;
}

function transformToAlarm(nome: string, inicio: string): void {
  (document.getElementById('ev-titulo') as HTMLInputElement).value = 'Início de Obra: ' + (nome || 'Cliente');
  (document.getElementById('ev-data') as HTMLInputElement).value = inicio;
  (document.getElementById('ev-hora') as HTMLInputElement).value = '08:00';
  document.getElementById('modal-evento')!.style.display = 'flex';
}

function openEventModal(): void {
  (document.getElementById('ev-titulo') as HTMLInputElement).value = '';
  (document.getElementById('ev-data') as HTMLInputElement).value = calSelDate;
  (document.getElementById('ev-hora') as HTMLInputElement).value = '';
  document.getElementById('modal-evento')!.style.display = 'flex';
}

async function salvarEvento(): Promise<void> {
  const tit = (document.getElementById('ev-titulo') as HTMLInputElement).value;
  const dat = (document.getElementById('ev-data') as HTMLInputElement).value;
  const hora = (document.getElementById('ev-hora') as HTMLInputElement).value;
  const avisoVal = (document.getElementById('ev-antes-val') as HTMLInputElement).value;
  const avisoUnid = (document.getElementById('ev-antes-unid') as HTMLSelectElement).value;
  const repete = (document.getElementById('ev-repete') as HTMLSelectElement).value;
  if (!tit || !dat || !hora) return toast(`${ico('alert')} Preencha título, data e hora corretamente.`);
  await (window as any)._requestNotifPermission?.();
  const newEv = { tit, dat, hora, avisoVal, avisoUnid, repete, alarmado: false, id: Date.now() } as any;
  S.eventos.push(newEv as Evento);
  (S.eventos as any[]).sort((a, b) => new Date((a as any).dat + 'T' + (a as any).hora).getTime() - new Date((b as any).dat + 'T' + (b as any).hora).getTime());
  localStorage.setItem('pp-eventos', JSON.stringify(S.eventos));
  document.getElementById('modal-evento')!.style.display = 'none';
  calSelDate = dat;
  [calYear, calMonth] = dat.split('-').map(Number);
  calMonth--;
  (window as any).renderAgenda?.();
  (window as any)._syncAlarmsToSW?.();
  toast(`${ico('bell')} Lembrete salvo!`);
}

function exportICS(id: string | number): void {
  const e = S.eventos.find(x => (x as any).id == id) as any;
  if (!e) return;
  const dt = e.dat.replace(/-/g, '');
  const hr = (e.hora || '09:00').replace(':', '') + '00';
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${e.tit}\nDTSTART:${dt}T${hr}\nDTEND:${dt}T${hr}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `Lembrete_${e.tit.replace(/\s+/g, '_')}.ics`; a.click();
  URL.revokeObjectURL(url);
}

function editOrcByObjId(id: string): void {
  const i = S.orcs.findIndex(x => x.id === id);
  if (i >= 0) editOrc(i);
}

// ── Config ──
function openConfig(): void {
  (window as any).canNavigateAsync?.(() => {
    S.isDirty = false;
    const v = (id: string, val: any) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val || ''; };
    v('cfg-empresa', S.config.empresa); v('cfg-tel', S.config.tel); v('cfg-email-empresa', S.config.emailEmpresa);
    v('cfg-end-empresa', S.config.endEmpresa); v('cfg-doc', S.config.doc);
    v('cfg-msg', S.config.msg || defCfg.msg); v('cfg-servicos', S.config.servicos || defCfg.servicos);
    v('cfg-pgto', S.config.pgto || defCfg.pgto); v('cfg-status', S.config.statusList || defCfg.statusList);
    const fn = document.getElementById('cfg-flash-nomes') as HTMLInputElement; if (fn) fn.value = S.config.flashNomes || defCfg.flashNomes;
    const fs = document.getElementById('cfg-flash-servicos') as HTMLInputElement; if (fs) fs.value = S.config.flashServicos || defCfg.flashServicos;
    const fm = document.getElementById('cfg-flash-materiais') as HTMLInputElement; if (fm) fm.value = S.config.flashMateriais || defCfg.flashMateriais;
    (window as any).renderLogoPreview?.(); (window as any).renderSigPreview?.();
    const accSw = document.getElementById('cfg-acessibilidade-sw');
    if (accSw) accSw.classList.toggle('on', !!S.config.acessibilidade);
    (window as any)._cfgDirty = false;
    (window as any).showPage?.('pg-config');
  });
}

function saveConfig(): void {
  const v = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
  S.config = {
    empresa: v('cfg-empresa'), tel: v('cfg-tel'), emailEmpresa: v('cfg-email-empresa'),
    endEmpresa: v('cfg-end-empresa'), doc: v('cfg-doc'), msg: v('cfg-msg'),
    servicos: v('cfg-servicos'), pgto: v('cfg-pgto'), statusList: v('cfg-status'),
    skipDelConfirm: S.config.skipDelConfirm || false,
    skipDirtyConfirm: S.config.skipDirtyConfirm || false,
    logo: S.config.logo || '', assinatura: S.config.assinatura || '',
    acessibilidade: S.config.acessibilidade || false,
    flashNomes: v('cfg-flash-nomes') || defCfg.flashNomes,
    flashServicos: v('cfg-flash-servicos') || defCfg.flashServicos,
    flashMateriais: v('cfg-flash-materiais') || defCfg.flashMateriais,
  } as any;
  document.body.classList.toggle('acessivel', !!S.config.acessibilidade);
  S.DEFAULT_SERVICES = S.config.servicos.split(',').map(s => s.trim()).filter(Boolean);
  if (!S.DEFAULT_SERVICES.length) S.DEFAULT_SERVICES = defCfg.servicos.split(',').map(s => s.trim());
  S.statusArr = (S.config.statusList || defCfg.statusList).split(',').map(s => s.trim()).filter(Boolean);
  try {
    localStorage.setItem('pp-config', JSON.stringify(S.config));
    (window as any)._cfgDirty = false;
    toast(`${ico('settings')} Configurações salvas!`);
    (window as any).populateStatusSelect?.(); loadGoogleMaps(); (window as any).homeTab?.('home');
  } catch (e) {
    console.error(e);
    toast(`${ico('x-circle')} Erro: Armazenamento cheio!`);
  }
}

// ── Logo & Assinatura ──
function loadLogoCfg(input: HTMLInputElement): void {
  const file = input.files?.[0]; if (!file) return;
  (window as any).compressImage?.(file, (dataUrl: string) => {
    S.config.logo = dataUrl;
    (window as any).renderLogoPreview?.();
    toast(`${ico('camera')} Logo carregado (não esqueça de Salvar)`);
  });
  input.value = '';
}

function clearLogoCfg(): void {
  S.config.logo = '';
  (document.getElementById('cfg-logo-file') as HTMLInputElement).value = '';
  (window as any).renderLogoPreview?.();
}

function loadSigCfg(input: HTMLInputElement): void {
  const file = input.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { S.config.assinatura = e.target?.result as string; (window as any).renderSigPreview?.(); };
  reader.readAsDataURL(file);
  input.value = '';
}

function clearSigCfg(): void {
  S.config.assinatura = '';
  (document.getElementById('cfg-sig-file') as HTMLInputElement).value = '';
  (window as any).renderSigPreview?.();
}

// ── Backup ──
let backupTimerHandle: ReturnType<typeof setInterval> | null = null;
let pendingBackupData: any = null;

function exportBackup(): void {
  const data = { versao: 1, dataGeracao: new Date().toISOString(), config: S.config, orcs: S.orcs, clientes: S.clientes, fornecedores: S.fornecedores, eventos: S.eventos };
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `PintorPlus_Backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast(`${ico('check-circle')} Backup Exportado!`);
}

function handleBackupFile(input: HTMLInputElement): void {
  const file = input.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (!data.orcs || !data.config) throw new Error("Formato inválido");
      pendingBackupData = data;
      openBackupModal();
    } catch { toast(`${ico('x-circle')} Erro no backup`); }
  };
  reader.readAsText(file);
  input.value = '';
}

function openBackupModal(): void {
  document.getElementById('backup-confirm-modal')!.style.display = 'flex';
  const btn = document.getElementById('btn-force-replace')!;
  btn.classList.add('btn-disabled');
  let secs = 3;
  btn.textContent = `Substituir Tudo (${secs}s)`;
  if (backupTimerHandle) clearInterval(backupTimerHandle);
  backupTimerHandle = setInterval(() => {
    secs--;
    if (secs <= 0) { clearInterval(backupTimerHandle!); backupTimerHandle = null; btn.classList.remove('btn-disabled'); btn.textContent = 'Substituir Tudo'; }
    else { btn.textContent = `Substituir Tudo (${secs}s)`; }
  }, 1000);
}

function closeBackupModal(proceed: boolean): void {
  if (backupTimerHandle) { clearInterval(backupTimerHandle); backupTimerHandle = null; }
  document.getElementById('backup-confirm-modal')!.style.display = 'none';
  if (!proceed) pendingBackupData = null;
}

function executeBackupImport(mode: string): void {
  if (!pendingBackupData) return;
  if (mode === 'replace') {
    S.config = pendingBackupData.config; S.orcs = pendingBackupData.orcs;
    S.clientes = pendingBackupData.clientes || []; S.fornecedores = pendingBackupData.fornecedores || [];
    S.eventos = pendingBackupData.eventos || [];
    localStorage.setItem('pp-config', JSON.stringify(S.config)); _saveOrcs();
    localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
    localStorage.setItem('pp-fornecedores', JSON.stringify(S.fornecedores));
    localStorage.setItem('pp-eventos', JSON.stringify(S.eventos));
    toast(`${ico('check-circle')} Backup Restaurado!`);
  } else if (mode === 'merge') {
    const importedOrcs = pendingBackupData.orcs || [];
    let updatedCount = 0, addedCount = 0;
    importedOrcs.forEach((impOrc: any) => {
      const idx = S.orcs.findIndex(o => o.id === impOrc.id);
      if (idx >= 0) { if ((impOrc.tsEdit || 0) > (S.orcs[idx].tsEdit || 0)) { S.orcs[idx] = impOrc; updatedCount++; } }
      else { S.orcs.push(impOrc); addedCount++; }
    });
    S.orcs.sort((a, b) => (b.ts || 0) - (a.ts || 0)); _saveOrcs();
    toast(`${ico('check-circle')} Mesclado: ${addedCount} novos, ${updatedCount} atu.`);
  }
  closeBackupModal(true);
  S.DEFAULT_SERVICES = (S.config.servicos || defCfg.servicos).split(',').map(s => s.trim()).filter(Boolean);
  S.statusArr = (S.config.statusList || defCfg.statusList).split(',').map(s => s.trim()).filter(Boolean);
  (window as any).populateStatusSelect?.(); loadGoogleMaps(); (window as any).homeTab?.('home');
}

// ── Expose on window for inline onclick handlers ──
(window as any).collectOrc = collectOrc;
(window as any).saveOrc = saveOrc;
(window as any).triggerAction = triggerAction;
(window as any).editOrc = editOrc;
(window as any).newOrc = newOrc;
(window as any).delOrc = delOrc;
(window as any).editOrcByObjId = editOrcByObjId;
(window as any).loadGoogleMaps = loadGoogleMaps;
(window as any).maskCep = maskCep;
(window as any).toggleManualEnd = toggleManualEnd;
(window as any).renderClientes = renderClientes;
(window as any).deleteClient = deleteClient;
(window as any).editClient = editClient;
(window as any).saveEditClient = saveEditClient;
(window as any).exportVCF = exportVCF;
(window as any).openClientPicker = openClientPicker;
(window as any).selectClientPicker = selectClientPicker;
(window as any).pickPhoneContactToFill = pickPhoneContactToFill;
(window as any).pickPhoneContactToSave = pickPhoneContactToSave;
(window as any).renderFornecedores = renderFornecedores;
(window as any).editFornecedor = editFornecedor;
(window as any).openEditFornecedor = openEditFornecedor;
(window as any).saveEditFornecedor = saveEditFornecedor;
(window as any).deleteFornecedor = deleteFornecedor;
(window as any).askQuoteFornecedor = askQuoteFornecedor;
(window as any)._doQuoteForn = _doQuoteForn;
(window as any)._doQuoteFornNoOrc = _doQuoteFornNoOrc;
(window as any).calChangeMonth = calChangeMonth;
(window as any).selectCalDate = selectCalDate;
(window as any).getUnifiedEvents = getUnifiedEvents;
(window as any).transformToAlarm = transformToAlarm;
(window as any).openEventModal = openEventModal;
(window as any).salvarEvento = salvarEvento;
(window as any).exportICS = exportICS;
(window as any).openConfig = openConfig;
(window as any).saveConfig = saveConfig;
(window as any).loadLogoCfg = loadLogoCfg;
(window as any).clearLogoCfg = clearLogoCfg;
(window as any).loadSigCfg = loadSigCfg;
(window as any).clearSigCfg = clearSigCfg;
(window as any).exportBackup = exportBackup;
(window as any).handleBackupFile = handleBackupFile;
(window as any).openBackupModal = openBackupModal;
(window as any).closeBackupModal = closeBackupModal;
(window as any).executeBackupImport = executeBackupImport;
