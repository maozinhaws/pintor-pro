import { S } from './state';
import { toast, esc, formatPhone, getStatusBadgeClass } from './utils';
import type { Config } from './types';

// ── Pick phone contact (to fill form) ──
async function pickPhoneContactToFill(): Promise<void> {
  if (!('contacts' in navigator && 'ContactsManager' in window)) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Acesso à agenda não suportado no navegador atual.');
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
      toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Contato preenchido!');
    }
  } catch (e) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-x-circle"/></svg> Erro ao acessar agenda do celular.'); }
}

// ── Pick phone contact (to save) ──
async function pickPhoneContactToSave(): Promise<void> {
  if (!('contacts' in navigator && 'ContactsManager' in window)) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Função não suportada neste aparelho.');
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
          apelido: '', cpf: '', cep: '', logradouro: '', numero: '', comp: '', bairro: '', cidade: ''
        });
      });
      localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
      renderClientes();
      toast(`<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> ${contacts.length} contatos importados!`);
    }
  } catch (e) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-x-circle"/></svg> Falha na importação.'); }
}

// ── Client picker ──
function openClientPicker(): void {
  document.getElementById('client-picker-list')!.innerHTML = S.clientes.map((c: any, i: number) =>
    `<div style="padding:16px; border-bottom:1px solid var(--bdr); cursor:pointer;" onclick="selectClientPicker(${i})"><div style="font-weight:700; font-size:15px; color:var(--ink);">${esc(c.nome)}</div><div style="font-size:13px; color:var(--ink3);">${esc(c.tel || '')}</div></div>`
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
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Contato selecionado!');
}

// ── Client list rendering ──
function _cliMatch(c: any, q: string): boolean {
  return [c.nome, c.tel, c.email, c.cpf, c.end].some(p => p && String(p).toLowerCase().includes(q));
}

function renderClientes(): void {
  const wrap = document.getElementById('clientes-list-full');
  if (!wrap) return;
  if (!S.clientes || !S.clientes.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:24px 16px;background:#fff;border-radius:14px;border:1px solid var(--bdr);"><div style="font-size:32px;margin-bottom:8px;opacity:.3;"><svg class="ico" aria-hidden="true"><use href="#ico-users"/></svg></div><div style="font-size:13px;color:var(--ink3);font-style:italic;">Nenhum contato salvo ainda.</div></div>';
    return;
  }
  const q = ((document.getElementById('cli-search') as HTMLInputElement | null)?.value || '').toLowerCase().trim();
  const indexed = S.clientes.map((c: any, i: number) => ({ c, i }));
  const filtered = q ? indexed.filter(({ c }: any) => _cliMatch(c, q)) : indexed;
  if (!filtered.length) { wrap.innerHTML = `<div class="srch-empty">Nenhum contato encontrado para "<strong>${esc(q)}</strong>".</div>`; return; }
  wrap.innerHTML = filtered.map(({ c, i }: any) => `
    <div class="hoc" style="margin-bottom:12px;">
      <div class="hon">${esc(c.nome)}</div>
      <div class="hos" style="margin-bottom:8px;">${esc(c.tel || 'Sem telefone')}</div>
      ${c.email ? `<div class="hos" style="margin-bottom:4px;"><svg class="ico" aria-hidden="true"><use href="#ico-mail"/></svg> ${esc(c.email)}</div>` : ''}
      ${c.end ? `<div class="hos" style="margin-bottom:12px;"><svg class="ico" aria-hidden="true"><use href="#ico-pin"/></svg> ${esc(c.end)}</div>` : ''}
      <div style="display:flex; gap:8px; margin-top:14px;">
        ${c.tel ? `<a href="tel:${c.tel.replace(/\D/g, '')}" style="width:44px;height:38px;border-radius:10px;background:var(--gnl);color:var(--gn);border:1.5px solid var(--gn);display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;"><svg class="ico" aria-hidden="true"><use href="#ico-phone"/></svg></a>` : ''}
        <button onclick="editClient(${i})" style="flex:1;height:38px;border-radius:10px;background:var(--bll);color:var(--bl);border:none;font-weight:700;font-size:12px;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-edit"/></svg> Editar</button>
        <button onclick="askDelete('Deseja excluir este contato?', () => deleteClient(${i}))" style="width:44px;height:38px;border-radius:10px;background:var(--rdl);color:var(--rd);border:none;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg></button>
      </div>
      <button onclick="exportVCF(${i})" style="width:100%;height:38px;border-radius:10px;background:transparent;color:var(--ink2);border:1px solid var(--bdr);font-family:'Sora',sans-serif;font-weight:700;font-size:12px;cursor:pointer;margin-top:8px;"><svg class="ico" aria-hidden="true"><use href="#ico-save"/></svg> Salvar na Agenda do Celular</button>
    </div>
  `).join('');
}

function deleteClient(i: number): void {
  S.clientes.splice(i, 1);
  localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
  renderClientes();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg> Contato removido!');
}

function editClient(i: number): void {
  (document.getElementById('edit-cli-idx') as HTMLInputElement).value = String(i);
  if (i === -1) {
    document.getElementById('edit-cli-title')!.innerText = 'Novo Contato';
    ['edit-cli-nome', 'edit-cli-tel', 'edit-cli-email', 'edit-cli-end', 'edit-cli-cpf'].forEach(id => (document.getElementById(id) as HTMLInputElement).value = '');
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
    apelido: '', cep: '', logradouro: '', numero: '', comp: '', bairro: '', cidade: ''
  };
  if (!data.nome) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> O nome é obrigatório');
  if (i === -1) S.clientes.push(data); else S.clientes[i] = data;
  localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
  document.getElementById('modal-edit-client')!.style.display = 'none';
  renderClientes();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Contato salvo!');
}

function exportVCF(i: number): void {
  const c = S.clientes[i];
  const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.nome}\nTEL;TYPE=CELL:${c.tel || ''}\nEND:VCARD`;
  const blob = new Blob([vcf], { type: 'text/vcard' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${c.nome.replace(/\s+/g, '_')}.vcf`;
  a.click(); URL.revokeObjectURL(url);
  toast('Baixando arquivo de contato...');
}

// ── FORNECEDORES ──
function _fornMatch(f: any, q: string): boolean {
  return [f.nome, f.tel, f.cat].some(p => p && String(p).toLowerCase().includes(q));
}

function renderFornecedores(): void {
  const wrap = document.getElementById('fornecedores-list-full');
  if (!wrap) return;
  if (!S.fornecedores || !S.fornecedores.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:24px 16px;background:#fff;border-radius:14px;border:1px solid var(--bdr);"><div style="font-size:32px;margin-bottom:8px;opacity:.3;"><svg class="ico" aria-hidden="true"><use href="#ico-truck"/></svg></div><div style="font-size:13px;color:var(--ink3);font-style:italic;">Nenhum fornecedor cadastrado.</div></div>';
    return;
  }
  const q = ((document.getElementById('forn-search') as HTMLInputElement | null)?.value || '').toLowerCase().trim();
  const indexed = S.fornecedores.map((f: any, i: number) => ({ f, i }));
  const filtered = q ? indexed.filter(({ f }: any) => _fornMatch(f, q)) : indexed;
  if (!filtered.length) { wrap.innerHTML = `<div class="srch-empty">Nenhum fornecedor encontrado para "<strong>${esc(q)}</strong>".</div>`; return; }
  wrap.innerHTML = filtered.map(({ f, i }: any) => `
    <div class="hoc" style="margin-bottom:12px; border-left:4px solid var(--am);">
      <div class="hon">${esc(f.nome)}</div>
      <div class="hos" style="margin-bottom:4px;">${esc(f.tel || 'Sem telefone')}</div>
      ${f.cat ? `<div class="hbadge hby" style="margin-bottom:12px;">${esc(f.cat)}</div>` : ''}
      <div style="display:flex; gap:8px; margin-top:14px;">
        ${f.tel ? `<a href="tel:${f.tel.replace(/\D/g, '')}" style="width:44px;height:38px;border-radius:10px;background:var(--gnl);color:var(--gn);border:1.5px solid var(--gn);display:flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;"><svg class="ico" aria-hidden="true"><use href="#ico-phone"/></svg></a>` : ''}
        <button onclick="editFornecedor(${i})" style="flex:1;height:38px;border-radius:10px;background:var(--bg2);color:var(--ink2);border:1px solid var(--bdr);font-weight:700;font-size:12px;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-edit"/></svg> Editar</button>
        <button onclick="askDelete('Deseja excluir este fornecedor?', () => deleteFornecedor(${i}))" style="width:44px;height:38px;border-radius:10px;background:var(--rdl);color:var(--rd);border:none;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg></button>
      </div>
      <button onclick="askQuoteFornecedor(${i})" style="width:100%;height:38px;border-radius:10px;background:#25D366;color:#fff;border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:12px;cursor:pointer;margin-top:8px;"><svg class="ico" aria-hidden="true"><use href="#ico-send"/></svg> Pedir Cotação de Materiais</button>
    </div>
  `).join('');
}

function openEditFornecedor(i: number): void {
  (document.getElementById('edit-forn-idx') as HTMLInputElement).value = String(i);
  if (i === -1) {
    document.getElementById('edit-forn-title')!.innerText = 'Novo Fornecedor';
    ['edit-forn-nome', 'edit-forn-tel', 'edit-forn-cat'].forEach(id => (document.getElementById(id) as HTMLInputElement).value = '');
  } else {
    document.getElementById('edit-forn-title')!.innerText = 'Editar Fornecedor';
    const f = S.fornecedores[i];
    (document.getElementById('edit-forn-nome') as HTMLInputElement).value = f.nome || '';
    (document.getElementById('edit-forn-tel') as HTMLInputElement).value = f.tel || '';
    (document.getElementById('edit-forn-cat') as HTMLInputElement).value = (f as any).cat || '';
  }
  document.getElementById('modal-edit-fornecedor')!.style.display = 'flex';
}

function editFornecedor(i: number): void { openEditFornecedor(i); }

function saveEditFornecedor(): void {
  const i = parseInt((document.getElementById('edit-forn-idx') as HTMLInputElement).value);
  const data = {
    nome: (document.getElementById('edit-forn-nome') as HTMLInputElement).value,
    tel: (document.getElementById('edit-forn-tel') as HTMLInputElement).value,
    servico: '', cat: (document.getElementById('edit-forn-cat') as HTMLInputElement).value, obs: '', ts: Date.now()
  };
  if (!data.nome) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> O nome é obrigatório');
  if (i === -1) S.fornecedores.push(data as any); else S.fornecedores[i] = data as any;
  localStorage.setItem('pp-fornecedores', JSON.stringify(S.fornecedores));
  document.getElementById('modal-edit-fornecedor')!.style.display = 'none';
  renderFornecedores();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Fornecedor salvo!');
}

function deleteFornecedor(i: number): void {
  S.fornecedores.splice(i, 1);
  localStorage.setItem('pp-fornecedores', JSON.stringify(S.fornecedores));
  renderFornecedores();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-trash"/></svg> Fornecedor removido!');
}

// ── Quote from fornecedor ──
let _quoteFornIdx = -1;

function askQuoteFornecedor(i: number): void {
  const f = S.fornecedores[i] as any;
  if (!f || !f.tel) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Fornecedor sem telefone.');
  _quoteFornIdx = i;
  const list = document.getElementById('quote-forn-orc-list');
  if (list) {
    if (!S.orcs || !S.orcs.length) {
      list.innerHTML = '<div style="font-size:13px;color:var(--ink3);text-align:center;padding:12px;">Nenhum orçamento cadastrado.</div>';
    } else {
      list.innerHTML = S.orcs.map((o: any, idx: number) => `
        <div onclick="_doQuoteForn(${idx})" style="padding:12px;background:var(--bg-card);border:1.5px solid var(--bdr);border-radius:12px;cursor:pointer;transition:border-color .15s;" onmouseenter="this.style.borderColor='var(--bl)'" onmouseleave="this.style.borderColor='var(--bdr)'">
          <div style="font-size:14px;font-weight:700;color:var(--ink);">${esc(o.nome || 'Sem nome')}</div>
          <div style="font-size:11px;color:var(--ink3);margin-top:2px;">R$ ${(window as any).calcOrcTotal(o).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · <span class="hbadge ${getStatusBadgeClass(o.status)}">${esc(o.status || 'Pendente')}</span></div>
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
  const msg = `Olá, ${f.nome}! Segue o orçamento de referência para cotação de materiais:\n\n${(window as any).buildWAMsg(o)}\n\nPor favor, me envie o valor dos materiais necessários. Obrigado!`;
  window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
}

function _doQuoteFornNoOrc(): void {
  document.getElementById('quote-forn-modal')!.style.display = 'none';
  const f = S.fornecedores[_quoteFornIdx] as any; if (!f) return;
  const tel = f.tel.replace(/\D/g, '');
  const msg = `Olá, ${f.nome}! Gostaria de fazer uma cotação de materiais para pintura. Pode me enviar uma lista de preços?`;
  window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Expose globals ──
(window as any).pickPhoneContactToFill = pickPhoneContactToFill;
(window as any).pickPhoneContactToSave = pickPhoneContactToSave;
(window as any).openClientPicker = openClientPicker;
(window as any).selectClientPicker = selectClientPicker;
(window as any).renderClientes = renderClientes;
(window as any).deleteClient = deleteClient;
(window as any).editClient = editClient;
(window as any).saveEditClient = saveEditClient;
(window as any).exportVCF = exportVCF;
(window as any).renderFornecedores = renderFornecedores;
(window as any).editFornecedor = editFornecedor;
(window as any).openEditFornecedor = openEditFornecedor;
(window as any).saveEditFornecedor = saveEditFornecedor;
(window as any).deleteFornecedor = deleteFornecedor;
(window as any).askQuoteFornecedor = askQuoteFornecedor;
(window as any)._doQuoteForn = _doQuoteForn;
(window as any)._doQuoteFornNoOrc = _doQuoteFornNoOrc;
