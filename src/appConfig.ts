import { S, saveOrcs } from './state';
import { toast, esc, getStatusBadgeClass } from './utils';

// ── CHAVE GOOGLE MAPS ──
const GMAPS_KEY = '';

// ── CONFIG: cards colapsáveis + confirmação de saída ──
let _cfgDirty = false;
let _cfgExitCallback: (() => void) | null = null;

function toggleCfgCard(id: string): void {
  const body = document.getElementById(id)!;
  const hdr = body.previousElementSibling!;
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.cfg-card-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.cfg-card-hdr').forEach(h => h.classList.remove('open'));
  if (!isOpen) { body.classList.add('open'); hdr.classList.add('open'); }
}

function _cfgGuardedExit(callback: () => void): void {
  if (_cfgDirty) {
    _cfgExitCallback = callback;
    document.getElementById('cfg-save-modal')!.style.display = 'flex';
  } else {
    callback();
  }
}

function closeCfgSaveModal(save: boolean): void {
  document.getElementById('cfg-save-modal')!.style.display = 'none';
  if (save) saveConfig();
  _cfgDirty = false;
  if (_cfgExitCallback) { _cfgExitCallback(); _cfgExitCallback = null; }
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
    (document.getElementById('cli-logradouro') as HTMLInputElement).value = d.street || d.logradouro || '';
    (document.getElementById('cli-bairro') as HTMLInputElement).value = d.neighborhood || d.bairro || '';
    (document.getElementById('cli-cidade') as HTMLInputElement).value = (d.city || d.localidade || '') + ' - ' + (d.state || d.uf || '');
    (document.getElementById('cli-numero') as HTMLInputElement).value = '';
    document.getElementById('end-fields')!.style.display = 'block';
    document.getElementById('end-manual-toggle')!.style.display = 'none';
    if (msg) { msg.style.display = 'block'; (msg as HTMLElement).style.color = 'var(--gn)'; msg.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Endereço encontrado!'; }
    setTimeout(() => { const el = document.getElementById('cli-numero'); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 100);
  }

  function showError(): void {
    if (spin) (spin as HTMLElement).style.opacity = '0';
    if (msg) { msg.style.display = 'block'; (msg as HTMLElement).style.color = 'var(--rd)'; msg.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> CEP não encontrado. Preencha manualmente.'; }
  }

  try {
    const res0 = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (res0.ok) { const d = await res0.json(); if (d && d.cep) { fillAddress(d); return; } }
  } catch (e) {}

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (res.ok) { const d = await res.json(); if (!d.erro) { fillAddress(d); return; } }
  } catch (e) {}

  try {
    const res2 = await fetch(`https://opencep.com/v1/${cleanCep}`);
    if (res2.ok) { const d = await res2.json(); if (d && d.cep) { fillAddress(d); return; } }
  } catch (e) {}

  showError();
}

function toggleManualEnd(): void {
  document.getElementById('end-fields')!.style.display = 'block';
  document.getElementById('end-manual-toggle')!.style.display = 'none';
  const msg = document.getElementById('cep-msg');
  if (msg) msg.style.display = 'none';
  document.getElementById('cli-logradouro')?.focus();
}

// ── GOOGLE MAPS PLACES AUTOCOMPLETE ──
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
  const input = document.getElementById('cli-logradouro');
  if (!input || !(window as any).google) return;
  if ((window as any).autocompleteObj) return;

  (window as any).autocompleteObj = new (window as any).google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'br' },
    fields: ['address_components', 'geometry', 'name'],
  });

  (window as any).autocompleteObj.addListener('place_changed', fillInAddress);
  input.addEventListener('keydown', function (e: any) { if (e.key === 'Enter') { e.preventDefault(); } });
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

  (document.getElementById('cli-logradouro') as HTMLInputElement).value = street || place.name;
  if (number) (document.getElementById('cli-numero') as HTMLInputElement).value = number;
  if (neighborhood) (document.getElementById('cli-bairro') as HTMLInputElement).value = neighborhood;
  if (city && state) (document.getElementById('cli-cidade') as HTMLInputElement).value = `${city} - ${state}`;
  if (cep) (document.getElementById('cli-cep') as HTMLInputElement).value = cep;
}

// ── CONFIG ──
function openConfig(): void {
  (window as any).canNavigateAsync(() => {
    S.isDirty = false;
    (document.getElementById('cfg-empresa') as HTMLInputElement).value = S.config.empresa || '';
    (document.getElementById('cfg-tel') as HTMLInputElement).value = S.config.tel || '';
    (document.getElementById('cfg-email-empresa') as HTMLInputElement).value = (S.config as any).emailEmpresa || '';
    (document.getElementById('cfg-end-empresa') as HTMLInputElement).value = (S.config as any).endEmpresa || '';
    (document.getElementById('cfg-doc') as HTMLInputElement).value = S.config.doc || '';
    (document.getElementById('cfg-msg') as HTMLTextAreaElement).value = S.config.msg || '';
    (document.getElementById('cfg-servicos') as HTMLInputElement).value = S.config.servicos || '';
    (document.getElementById('cfg-pgto') as HTMLInputElement).value = S.config.pgto || '';
    (document.getElementById('cfg-status') as HTMLInputElement).value = S.config.statusList || '';
    const fn = document.getElementById('cfg-flash-nomes') as HTMLInputElement | null;
    if (fn) fn.value = (S.config as any).flashNomes || '';
    const fs = document.getElementById('cfg-flash-servicos') as HTMLInputElement | null;
    if (fs) fs.value = (S.config as any).flashServicos || '';
    const fm = document.getElementById('cfg-flash-materiais') as HTMLInputElement | null;
    if (fm) fm.value = (S.config as any).flashMateriais || '';
    renderLogoPreview();
    renderSigPreview();
    const accSw = document.getElementById('cfg-acessibilidade-sw');
    if (accSw) accSw.classList.toggle('on', !!(S.config as any).acessibilidade);
    _cfgDirty = false;
    (window as any).showPage('pg-config');
  });
}

function saveConfig(): void {
  S.config = {
    empresa: (document.getElementById('cfg-empresa') as HTMLInputElement).value,
    tel: (document.getElementById('cfg-tel') as HTMLInputElement).value,
    emailEmpresa: (document.getElementById('cfg-email-empresa') as HTMLInputElement).value,
    endEmpresa: (document.getElementById('cfg-end-empresa') as HTMLInputElement).value,
    doc: (document.getElementById('cfg-doc') as HTMLInputElement).value,
    msg: (document.getElementById('cfg-msg') as HTMLTextAreaElement).value,
    servicos: (document.getElementById('cfg-servicos') as HTMLInputElement).value,
    pgto: (document.getElementById('cfg-pgto') as HTMLInputElement).value,
    statusList: (document.getElementById('cfg-status') as HTMLInputElement).value,
    skipDelConfirm: (S.config as any).skipDelConfirm || false,
    skipDirtyConfirm: (S.config as any).skipDirtyConfirm || false,
    logo: (S.config as any).logo || '',
    assinatura: (S.config as any).assinatura || '',
    acessibilidade: (S.config as any).acessibilidade || false,
    flashNomes: ((document.getElementById('cfg-flash-nomes') as HTMLInputElement) || {} as any).value || '',
    flashServicos: ((document.getElementById('cfg-flash-servicos') as HTMLInputElement) || {} as any).value || '',
    flashMateriais: ((document.getElementById('cfg-flash-materiais') as HTMLInputElement) || {} as any).value || '',
  } as any;
  document.body.classList.toggle('acessivel', !!(S.config as any).acessibilidade);
  S.DEFAULT_SERVICES = S.config.servicos.split(',').map((s: string) => s.trim()).filter(Boolean);
  if (!S.DEFAULT_SERVICES.length) S.DEFAULT_SERVICES = (S.config as any).servicos.split(',').map((s: string) => s.trim());
  S.statusArr = (S.config.statusList || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  try {
    localStorage.setItem('pp-config', JSON.stringify(S.config));
    _cfgDirty = false;
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-settings"/></svg> Configurações salvas!');
    populateStatusSelect();
    loadGoogleMaps();
    homeTab('home');
  } catch (e) {
    console.error(e);
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-x-circle"/></svg> Erro: Armazenamento cheio! O logotipo pode ser muito grande, tente usar uma imagem menor.');
  }
}

// ── LOGO ──
function loadLogoCfg(input: HTMLInputElement): void {
  const file = input.files?.[0];
  if (!file) return;
  (window as any).compressImage(file, (dataUrl: string) => {
    (S.config as any).logo = dataUrl;
    renderLogoPreview();
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-camera"/></svg> Logo carregado (não esqueça de Salvar)');
  });
  input.value = '';
}

function clearLogoCfg(): void {
  (S.config as any).logo = '';
  (document.getElementById('cfg-logo-file') as HTMLInputElement).value = '';
  renderLogoPreview();
}

function renderLogoPreview(): void {
  const menuDefaultLogo = 'https://lh3.googleusercontent.com/d/1WJXU6NvZ12GeL3GA4NzzGeGeaZvHpkfn';
  const userLogo = (S.config as any).logo;

  const img = document.getElementById('cfg-logo-preview') as HTMLImageElement | null;
  const txt = document.getElementById('cfg-logo-placeholder');
  const homeImg = document.getElementById('home-logo-img') as HTMLImageElement | null;
  const sideImg = document.getElementById('sidebar-logo-img') as HTMLImageElement | null;
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

// ── ASSINATURA ──
function loadSigCfg(input: HTMLInputElement): void {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { (S.config as any).assinatura = (e.target as any).result; renderSigPreview(); };
  reader.readAsDataURL(file);
  input.value = '';
}

function clearSigCfg(): void {
  (S.config as any).assinatura = '';
  (document.getElementById('cfg-sig-file') as HTMLInputElement).value = '';
  renderSigPreview();
}

function renderSigPreview(): void {
  const img = document.getElementById('cfg-sig-preview') as HTMLImageElement | null;
  const ph = document.getElementById('cfg-sig-placeholder');
  if (!img || !ph) return;
  if ((S.config as any).assinatura) {
    img.src = (S.config as any).assinatura;
    img.style.display = 'block';
    ph.style.display = 'none';
  } else {
    img.src = '';
    img.style.display = 'none';
    ph.style.display = 'block';
  }
}

function sigTab(tab: string): void {
  const isUpload = tab === 'upload';
  document.getElementById('sig-panel-upload')!.style.display = isUpload ? 'block' : 'none';
  document.getElementById('sig-panel-draw')!.style.display = isUpload ? 'none' : 'block';
  const btnU = document.getElementById('sig-tab-upload');
  const btnD = document.getElementById('sig-tab-draw');
  if (btnU) { (btnU as HTMLElement).style.background = isUpload ? 'var(--bl)' : 'transparent'; (btnU as HTMLElement).style.color = isUpload ? '#fff' : 'var(--ink3)'; }
  if (btnD) { (btnD as HTMLElement).style.background = isUpload ? 'transparent' : 'var(--bl)'; (btnD as HTMLElement).style.color = isUpload ? 'var(--ink3)' : '#fff'; }
  if (!isUpload) _sigCanvasInit();
}

let _sigDrawing = false, _sigLastX = 0, _sigLastY = 0, _sigCtx: CanvasRenderingContext2D | null = null;

function _sigCanvasInit(): void {
  const c = document.getElementById('sig-canvas') as HTMLCanvasElement | null;
  if (!c || (c as any)._sigInited) return;
  (c as any)._sigInited = true;
  _sigCtx = c.getContext('2d');
  if (!_sigCtx) return;
  _sigCtx.strokeStyle = '#1e293b';
  _sigCtx.lineWidth = 2.2;
  _sigCtx.lineCap = 'round';
  _sigCtx.lineJoin = 'round';
  const pos = (e: any) => {
    const r = c.getBoundingClientRect();
    const sc = c.width / r.width;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sc, y: (src.clientY - r.top) * sc };
  };
  const start = (e: any) => { e.preventDefault(); _sigDrawing = true; const p = pos(e); _sigLastX = p.x; _sigLastY = p.y; _sigCtx!.beginPath(); _sigCtx!.moveTo(p.x, p.y); };
  const move = (e: any) => { if (!_sigDrawing) return; e.preventDefault(); const p = pos(e); _sigCtx!.lineTo(p.x, p.y); _sigCtx!.stroke(); _sigLastX = p.x; _sigLastY = p.y; };
  const end = () => { _sigDrawing = false; };
  c.addEventListener('mousedown', start); c.addEventListener('mousemove', move); c.addEventListener('mouseup', end); c.addEventListener('mouseleave', end);
  c.addEventListener('touchstart', start, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', end);
}

function sigCanvasClear(): void {
  const c = document.getElementById('sig-canvas') as HTMLCanvasElement | null;
  if (c && _sigCtx) _sigCtx.clearRect(0, 0, c.width, c.height);
}

function sigCanvasSave(): void {
  const c = document.getElementById('sig-canvas') as HTMLCanvasElement | null;
  if (!c) return;
  (S.config as any).assinatura = c.toDataURL('image/png');
  renderSigPreview();
  sigTab('upload');
  _cfgDirty = true;
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Assinatura salva!');
}

// ── UTILS ──
function buildDateLabel(ts: number): string {
  if (!ts) return 'Sem data';
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function populateStatusSelect(): void {
  const sel = document.getElementById('orc-status') as HTMLSelectElement | null;
  if (!sel) return;
  sel.innerHTML = S.statusArr.map((s: string) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
}

// ── HOME ──
function renderHomeMini(): void {
  const sg = document.getElementById('home-saudacao');
  if (sg) sg.textContent = S.config.empresa || 'Sua Empresa';
  renderLogoPreview();

  const wrap = document.getElementById('home-orcs-mini');
  if (!wrap) return;
  if (!S.orcs.length) { wrap.innerHTML = '<div style="text-align:center;padding:16px;background:var(--bg-card);border-radius:12px;border:1px solid var(--bdr);font-size:12px;color:var(--ink3);margin-bottom:8px;">Nenhum orçamento registado ainda.</div>'; return; }
  wrap.innerHTML = S.orcs.slice(0, 3).map((o: any, sliceIdx: number) => {
    const realIdx = sliceIdx;
    let tot = (window as any).calcOrcTotal(o);
    const isR = (o.status || '').includes('Rascunho');
    const badgeHtml = isR ? `<span class="badge-rascunho">Rascunho</span>` : `<span class="hbadge ${getStatusBadgeClass(o.status)}">${esc(o.status || 'Pendente')}</span>`;
    const menuId = `cm-h-${realIdx}`;
    const orcShortId = String(o.id || '').slice(-6);
    return `<div class="hoc${isR ? ' card-rascunho' : ''}" style="margin-bottom:8px;cursor:pointer;" onclick="viewOrc(${realIdx})"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;overflow:hidden;pointer-events:none;"><span class="hon" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(o.nome || '(sem nome)')}</span><span style="font-size:10px;color:var(--ink3);font-weight:400;flex-shrink:0;">#${orcShortId}</span>${badgeHtml}</div><div onclick="event.stopPropagation()">${(window as any)._buildCardMenu(menuId, realIdx, o)}</div></div><div style="display:flex;align-items:center;justify-content:space-between;pointer-events:none;"><span class="hos">${buildDateLabel(o.tsEdit || o.ts || Date.now())}</span><span class="hoov">${tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '—'}</span></div></div>`;
  }).join('');
}

async function renderHomeNews(): Promise<void> {
  const wrap = document.getElementById('home-news-mini');
  if (!wrap) return;

  try {
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.pintorabrapp.com.br%2Ffeed%2F');
    const data = await res.json();

    if (data.status === 'ok' && data.items && data.items.length > 0) {
      const items = data.items.slice(0, 3);
      wrap.innerHTML = items.map((item: any) => {
        let imgUrl = item.thumbnail;
        if (!imgUrl && item.content) {
          const match = item.content.match(/<img[^>]+src="([^">]+)"/);
          if (match) imgUrl = match[1];
        }
        if (!imgUrl) imgUrl = 'https://www.pintorabrapp.com.br/wp-content/uploads/2023/10/logo-abrapp.png';

        const date = new Date(item.pubDate.replace(/-/g, '/')).toLocaleDateString('pt-BR');

        return `
        <div class="news-card" onclick="const _u=_safeUrl('${esc(item.link)}');if(_u)window.open(_u,'_blank')">
          <img src="${imgUrl}" onerror="this.src='https://lh3.googleusercontent.com/d/1mwtQDispSbBU3HBvLa0T46vOoHAmWNNN'">
          <div style="flex:1;">
            <div class="news-title">${esc(item.title)}</div>
            <div class="news-date">${esc(date)}</div>
          </div>
        </div>`;
      }).join('');
    } else {
      throw new Error('Feed vazio');
    }
  } catch (err) {
    wrap.innerHTML = `
      <div class="news-card" onclick="window.open('https://www.pintorabrapp.com.br/revista-pintura-em-movimento', '_blank')">
        <div style="font-size:24px; margin-right:8px;"><svg class="ico" aria-hidden="true"><use href="#ico-newspaper"/></svg></div>
        <div style="flex:1;">
          <div class="news-title">Revista Pintura em Movimento</div>
          <div class="news-date">Não foi possível carregar as notícias. Prima aqui para aceder.</div>
        </div>
      </div>`;
  }
}

// ── HOME TAB ──
function homeTab(tab: string): void {
  if (tab !== 'config' && typeof _cfgDirty !== 'undefined' && _cfgDirty && document.getElementById('pg-config')?.classList.contains('active')) {
    _cfgExitCallback = () => homeTab(tab);
    document.getElementById('cfg-save-modal')!.style.display = 'flex';
    return;
  }
  if (tab === 'config') { openConfig(); return; }
  if (tab === 'flash') { (window as any).canNavigateAsync(() => { S.isDirty = false; (window as any).openFlash(); }); return; }
  (window as any).canNavigateAsync(() => {
    S.isDirty = false;
    ['orc-search', 'cli-search', 'forn-search'].forEach(id => { const el = document.getElementById(id) as HTMLInputElement | null; if (el) el.value = ''; });
    if (tab === 'home') { (window as any).showPage('pg-home'); renderHomeMini(); (window as any).renderHomeEvents(); renderHomeNews(); }
    else if (tab === 'orcamentos') { (window as any).showPage('pg-orcamentos'); (window as any).renderOrcamentosList(); }
    else if (tab === 'clientes') { (window as any).showPage('pg-clientes'); (window as any).renderClientes(); }
    else if (tab === 'fornecedores') { (window as any).showPage('pg-fornecedores'); (window as any).renderFornecedores(); }
    else if (tab === 'agenda') { (window as any).showPage('pg-agenda'); (window as any).renderAgenda(); }
    else if (tab === 'backup') { (window as any).showPage('pg-backup'); }
    else if (tab === 'termos') { (window as any).showPage('pg-termos'); }
  });
}

// ── BACKUP ──
let backupTimerHandle: any;
let pendingBackupData: any = null;

function exportBackup(): void {
  const data = { versao: 1, dataGeracao: new Date().toISOString(), config: S.config, orcs: S.orcs, clientes: S.clientes, fornecedores: S.fornecedores, eventos: S.eventos };
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PintorPlus_Backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Backup Exportado!');
}

function handleBackupFile(input: HTMLInputElement): void {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse((e.target as any).result);
      if (!data.orcs || !data.config) throw new Error("Formato inválido");
      pendingBackupData = data;
      openBackupModal();
    } catch (err) {
      toast('<svg class="ico" aria-hidden="true"><use href="#ico-x-circle"/></svg> Erro no backup');
    }
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
  clearInterval(backupTimerHandle);
  backupTimerHandle = setInterval(() => {
    secs--;
    if (secs <= 0) { clearInterval(backupTimerHandle); btn.classList.remove('btn-disabled'); btn.textContent = 'Substituir Tudo'; }
    else { btn.textContent = `Substituir Tudo (${secs}s)`; }
  }, 1000);
}

function closeBackupModal(proceed: boolean): void {
  clearInterval(backupTimerHandle);
  document.getElementById('backup-confirm-modal')!.style.display = 'none';
  if (!proceed) pendingBackupData = null;
}

function _sanitizeBackupData(data: any): void {
  if (Array.isArray(data.orcs)) {
    data.orcs = data.orcs.map((o: any) => ({
      ...o,
      nome: String(o.nome || '').slice(0, 300),
      apelido: String(o.apelido || '').slice(0, 300),
      tel: String(o.tel || '').replace(/[^0-9\s()\-+]/g, '').slice(0, 20),
      email: String(o.email || '').slice(0, 200),
      cpf: String(o.cpf || '').replace(/\D/g, '').slice(0, 14),
      obs: String(o.obs || '').slice(0, 3000),
      status: String(o.status || '').slice(0, 100),
      tipoServico: String(o.tipoServico || '').slice(0, 200),
    }));
  }
  if (Array.isArray(data.eventos)) {
    data.eventos = data.eventos.map((e: any) => ({
      ...e,
      tit: String(e.tit || '').slice(0, 300),
      hora: String(e.hora || '').replace(/[^0-9:]/g, '').slice(0, 5),
    }));
  }
  if (Array.isArray(data.clientes)) {
    data.clientes = data.clientes.map((c: any) => ({
      ...c,
      nome: String(c.nome || '').slice(0, 300),
      tel: String(c.tel || '').replace(/[^0-9\s()\-+]/g, '').slice(0, 20),
      email: String(c.email || '').slice(0, 200),
    }));
  }
  if (data.config && typeof data.config === 'object') {
    if (data.config.statusList) data.config.statusList = String(data.config.statusList).slice(0, 500);
    if (data.config.servicos) data.config.servicos = String(data.config.servicos).slice(0, 1000);
    if (data.config.empresa) data.config.empresa = String(data.config.empresa).slice(0, 200);
  }
}

function executeBackupImport(mode: string): void {
  if (!pendingBackupData) return;
  _sanitizeBackupData(pendingBackupData);
  if (mode === 'replace') {
    S.config = pendingBackupData.config;
    S.orcs = pendingBackupData.orcs;
    S.clientes = pendingBackupData.clientes || [];
    S.fornecedores = pendingBackupData.fornecedores || [];
    S.eventos = pendingBackupData.eventos || [];
    localStorage.setItem('pp-config', JSON.stringify(S.config));
    saveOrcs();
    localStorage.setItem('pp-clientes', JSON.stringify(S.clientes));
    localStorage.setItem('pp-fornecedores', JSON.stringify(S.fornecedores));
    localStorage.setItem('pp-eventos', JSON.stringify(S.eventos));
    toast('<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Backup Restaurado!');
  } else if (mode === 'merge') {
    const importedOrcs = pendingBackupData.orcs || [];
    let updatedCount = 0;
    let addedCount = 0;
    importedOrcs.forEach((impOrc: any) => {
      const idx = S.orcs.findIndex((o: any) => o.id === impOrc.id);
      if (idx >= 0) {
        if ((impOrc.tsEdit || 0) > (S.orcs[idx].tsEdit || 0)) { S.orcs[idx] = impOrc; updatedCount++; }
      } else { S.orcs.push(impOrc); addedCount++; }
    });
    S.orcs.sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
    saveOrcs();
    toast(`<svg class="ico" aria-hidden="true"><use href="#ico-check-circle"/></svg> Mesclado: ${addedCount} novos, ${updatedCount} atu.`);
  }
  closeBackupModal(true);
  S.DEFAULT_SERVICES = (S.config.servicos || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  S.statusArr = (S.config.statusList || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  populateStatusSelect();
  loadGoogleMaps();
  homeTab('home');
}

// ── TERMOS & PRIVACIDADE — LGPD ──
const TERMS_VERSION = '1';
const TERMS_KEY = 'pp-terms-v' + TERMS_VERSION;

function _hasAcceptedTerms(email: string): boolean {
  try {
    const raw = localStorage.getItem(TERMS_KEY);
    if (!raw) return false;
    const rec = JSON.parse(raw);
    return rec.accepted === true && rec.email === email;
  } catch (e) { return false; }
}

function showTermsModal(): void {
  const modal = document.getElementById('terms-modal');
  if (!modal) return;
  const chk = document.getElementById('terms-agree-chk') as HTMLInputElement | null;
  const btn = document.getElementById('terms-accept-btn') as HTMLButtonElement | null;
  if (chk) chk.checked = false;
  if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed'; }
  const body = document.getElementById('terms-modal-body');
  if (body) body.scrollTop = 0;
  modal.style.display = 'flex';
}

function toggleTermsAccept(checked: boolean): void {
  const btn = document.getElementById('terms-accept-btn') as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = !checked;
  btn.style.opacity = checked ? '1' : '0.4';
  btn.style.cursor = checked ? 'pointer' : 'not-allowed';
}

function acceptTerms(): void {
  const chk = document.getElementById('terms-agree-chk') as HTMLInputElement | null;
  if (!chk || !chk.checked) return;
  localStorage.setItem(TERMS_KEY, JSON.stringify({
    version: TERMS_VERSION, accepted: true,
    ts: Date.now(), email: 'local', ua: navigator.userAgent
  }));
  document.getElementById('terms-modal')!.style.display = 'none';
  (window as any).showPage('pg-home');
  renderHomeMini(); (window as any).renderHomeEvents(); renderHomeNews();
}

function rejectTerms(): void {
  document.getElementById('terms-modal')!.style.display = 'none';
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> É necessário aceitar os Termos para usar o Pintor Plus.');
}

// ── SUPORTE / BUG REPORT ──
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
  const lines = [
    '=== LOG PINTOR PLUS ===',
    'Data/Hora: ' + now,
    'Versão SW:  pintorplus-v13',
    'UA: ' + navigator.userAgent,
    '',
    '--- CADASTRO DO APP ---',
    'Nome empresa: ' + (cfg.nome || '—'),
    'Telefone:     ' + (cfg.tel || '—'),
    'Email app:    ' + (cfg.email || '—'),
    'CNPJ/CPF:     ' + (cfg.cnpj ? _maskDoc(cfg.cnpj) : '—'),
    'Endereço:     ' + (cfg.end || '—'),
    '',
    '--- DADOS ---',
    'Orçamentos:  ' + (S.orcs ? S.orcs.length : 0),
    'Clientes:    ' + (S.clientes ? S.clientes.length : 0),
    'Fornecedores:' + (S.fornecedores ? S.fornecedores.length : 0),
    'Eventos:     ' + (S.eventos ? S.eventos.length : 0),
    '',
    '--- LOCAL STORAGE ---',
    'pp-gdrive-lastSync: ' + (localStorage.getItem('pp-gdrive-lastSync') || '—'),
    'pp-gdrive-email:    ' + (localStorage.getItem('pp-gdrive-email') || '—'),
    '====================='
  ];
  return lines.join('\n');
}

function abrirModalSuporte(): void {
  _supportImages = [];
  const preview = document.getElementById('sp-img-preview');
  if (preview) preview.innerHTML = '';
  const imgInput = document.getElementById('sp-img-input') as HTMLInputElement | null;
  if (imgInput) imgInput.value = '';
  const msg = document.getElementById('sp-msg') as HTMLTextAreaElement | null;
  if (msg) msg.value = '';
  const imgNote = document.getElementById('sp-img-note');
  if (imgNote) imgNote.style.display = 'none';

  const log = _gerarLogSuporte();
  const logEl = document.getElementById('sp-log');
  if (logEl) { logEl.textContent = log; logEl.style.display = 'none'; }

  const session = (() => { try { return JSON.parse(localStorage.getItem('pp-session') || '{}'); } catch (e) { return {}; } })();
  const gUser = (typeof (window as any).GDrive !== 'undefined' && (window as any).GDrive.user) ? (window as any).GDrive.user : session;
  const cfg = S.config || {} as any;
  const infoEl = document.getElementById('sp-user-info');
  if (infoEl) {
    infoEl.innerHTML = [
      gUser.name ? `<strong>${esc(gUser.name)}</strong>` : '',
      gUser.email ? esc(gUser.email) : '',
      cfg.nome ? esc(cfg.nome) : '',
      cfg.tel ? esc(cfg.tel) : '',
      cfg.cnpj ? esc(cfg.cnpj) : ''
    ].filter(Boolean).join('<br>') || '—';
  }

  document.getElementById('modal-suporte')!.style.display = 'flex';
}

function addSupportImages(input: HTMLInputElement): void {
  const files = Array.from(input.files || []);
  _supportImages = _supportImages.concat(files);
  const preview = document.getElementById('sp-img-preview');
  if (!preview) return;
  preview.innerHTML = '';
  _supportImages.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:72px;height:72px;flex-shrink:0;';
    wrap.innerHTML = `<img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--bdr);">
      <button onclick="_removeSupportImage(${idx})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--rd);color:#fff;border:none;font-size:11px;font-weight:800;cursor:pointer;line-height:1;">✕</button>`;
    preview.appendChild(wrap);
  });
  const imgNote = document.getElementById('sp-img-note');
  if (imgNote) imgNote.style.display = _supportImages.length ? 'block' : 'none';
}

function _removeSupportImage(idx: number): void {
  _supportImages.splice(idx, 1);
  const preview = document.getElementById('sp-img-preview');
  if (!preview) return;
  preview.innerHTML = '';
  _supportImages.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:72px;height:72px;flex-shrink:0;';
    wrap.innerHTML = `<img src="${url}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--bdr);">
      <button onclick="_removeSupportImage(${i})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--rd);color:#fff;border:none;font-size:11px;font-weight:800;cursor:pointer;line-height:1;">✕</button>`;
    preview.appendChild(wrap);
  });
  const imgNote = document.getElementById('sp-img-note');
  if (imgNote) imgNote.style.display = _supportImages.length ? 'block' : 'none';
}

function enviarSuporte(): void {
  const msg = ((document.getElementById('sp-msg') as HTMLTextAreaElement | null)?.value || '').trim();
  if (!msg) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Descreva o problema antes de enviar.'); return; }
  const log = document.getElementById('sp-log')?.textContent || _gerarLogSuporte();
  const body = [msg, '', '---', log].join('\n');
  const subject = 'Bug/Suporte — Pintor Plus';
  const mailto = `mailto:suporte@pintorplus.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto);
  document.getElementById('modal-suporte')!.style.display = 'none';
  if (_supportImages.length) {
    setTimeout(() => toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Lembre-se de anexar as imagens ao email!'), 600);
  }
}

// ── PWA Install Prompt ──
const PWA = {
  _prompt: null as any,
  _DISMISSED_KEY: 'pwa_install_dismissed',
  _PREMIUM_DISMISSED_KEY: 'pwa_premium_dismissed',

  isIOS(): boolean { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream; },
  isStandalone(): boolean { return (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches; },
  wasDismissed(): boolean {
    try {
      const t = localStorage.getItem(this._DISMISSED_KEY);
      if (!t) return false;
      if (Date.now() - parseInt(t) > 30 * 24 * 60 * 60 * 1000) { localStorage.removeItem(this._DISMISSED_KEY); return false; }
      return true;
    } catch (e) { return false; }
  },
  wasPremiumDismissed(): boolean {
    try {
      const t = localStorage.getItem(this._PREMIUM_DISMISSED_KEY);
      if (!t) return false;
      if (Date.now() - parseInt(t) > 7 * 24 * 60 * 60 * 1000) { localStorage.removeItem(this._PREMIUM_DISMISSED_KEY); return false; }
      return true;
    } catch (e) { return false; }
  },
  showBar(): void { document.getElementById('pwa-install-bar')?.classList.add('show'); },
  hideBar(): void { document.getElementById('pwa-install-bar')?.classList.remove('show'); },
  showIOSModal(): void { document.getElementById('pwa-ios-modal')?.classList.add('open'); },
  showPremiumCard(): void {
    if (this.isStandalone() || this.wasPremiumDismissed()) return;
    document.getElementById('pwa-premium-card')?.classList.add('show');
  },
  hidePremiumCard(): void { document.getElementById('pwa-premium-card')?.classList.remove('show'); },
};

window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  PWA._prompt = e;
  if (!PWA.isStandalone() && !PWA.wasDismissed()) { setTimeout(() => PWA.showBar(), 5000); }
  if (!PWA.isStandalone() && !PWA.wasPremiumDismissed()) { setTimeout(() => PWA.showPremiumCard(), 2000); }
});

window.addEventListener('appinstalled', () => {
  PWA.hideBar();
  PWA.hidePremiumCard();
  PWA._prompt = null;
  toast('🎉 Pintor Plus instalado com sucesso!');
});

if (PWA.isIOS() && !PWA.isStandalone() && !PWA.wasDismissed()) { setTimeout(() => PWA.showIOSModal(), 5000); }
if (PWA.isIOS() && !PWA.isStandalone() && !PWA.wasPremiumDismissed()) { setTimeout(() => PWA.showPremiumCard(), 2000); }

(window as any).pwaShowInstallUI = async function (): Promise<void> {
  if (PWA.isStandalone()) { toast('✓ App já está instalado neste dispositivo.'); return; }
  if (PWA._prompt) {
    PWA.hideBar(); PWA.hidePremiumCard();
    PWA._prompt.prompt();
    const { outcome } = await PWA._prompt.userChoice;
    PWA._prompt = null;
    if (outcome === 'dismissed') { try { localStorage.setItem(PWA._DISMISSED_KEY, Date.now().toString()); } catch (e) {} }
    return;
  }
  if (PWA.isIOS()) { PWA.showIOSModal(); return; }
  document.getElementById('pwa-ios-sheet')!.innerHTML = `
    <div class="ios-title">Instalar Pintor Plus</div>
    <div class="ios-sub">Para instalar, siga os passos no seu navegador:</div>
    <div class="ios-step"><div class="ios-step-num">1</div><div class="ios-step-text">Abra o site no <b>Chrome</b> ou <b>Edge</b></div></div>
    <div class="ios-step"><div class="ios-step-num">2</div><div class="ios-step-text">Clique no menu <b>⋮</b> (três pontos) no canto superior direito</div></div>
    <div class="ios-step"><div class="ios-step-num">3</div><div class="ios-step-text">Toque em <b>"Adicionar à tela inicial"</b> ou <b>"Instalar app"</b></div></div>
    <button id="pwa-ios-close" onclick="document.getElementById('pwa-ios-modal').classList.remove('open')">Entendi</button>`;
  PWA.showIOSModal();
};

(window as any).pwaTriggerInstall = (window as any).pwaShowInstallUI;

(window as any).pwaDismiss = function (): void {
  PWA.hideBar();
  try { localStorage.setItem(PWA._DISMISSED_KEY, Date.now().toString()); } catch (e) {}
};

(window as any).pwaPremiumDismiss = function (): void {
  PWA.hidePremiumCard();
  try { localStorage.setItem(PWA._PREMIUM_DISMISSED_KEY, Date.now().toString()); } catch (e) {}
};

// ── DEEP LINK: URL parameter routing ──
(function _handleStartupParams() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const proto = params.get('proto');
  if (!action && !proto) return;
  window.addEventListener('pp-ready', () => {
    if (action === 'new-orc') { try { (window as any).newOrc(); } catch (e) {} }
    else if (action === 'flash') { try { homeTab('flash'); } catch (e) {} }
    else if (action === 'agenda') { try { homeTab('agenda'); } catch (e) {} }
    else if (action === 'sync') { try { (window as any).GDrive?.scheduleSync && (window as any).GDrive.scheduleSync(); } catch (e) {} }
    else if (proto) {
      const decoded = decodeURIComponent(proto);
      const match = decoded.match(/^web\+pintorplus:\/\/(.+)/);
      if (match) {
        const cmd = match[1].split('/')[0];
        if (cmd === 'orcamento') { try { (window as any).newOrc(); } catch (e) {} }
        else if (cmd === 'agenda') { try { homeTab('agenda'); } catch (e) {} }
        else if (cmd === 'flash') { try { homeTab('flash'); } catch (e) {} }
      }
    }
  }, { once: true });
})();

// ── CÂMERA DETALHADO — getUserMedia + torch + zoom ──
(function () {
  let _dcStream: MediaStream | null = null, _dcTorchOn = false, _dcTorchSupported = false;

  function _openNativeCameraInput(): void {
    const choiceModal = document.getElementById('photo-choice-modal');
    if (choiceModal) choiceModal.style.display = 'none';
    const cameraInput = document.getElementById('file-camera') as HTMLInputElement | null;
    if (!cameraInput) {
      toast('Camera indisponivel');
      return;
    }
    cameraInput.click();
  }

  async function _setTorchState(enabled: boolean): Promise<boolean> {
    const track = _dcStream?.getVideoTracks?.()[0] as any;
    if (!track || !_dcTorchSupported) return false;
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled }] });
      _dcTorchOn = enabled;
      return true;
    } catch {
      _dcTorchOn = false;
      return false;
    }
  }

  function _renderDCThumbs(): void {
    const el = document.getElementById('detail-cam-thumbs');
    if (!el) return;
    const photos = (S as any).tempItem?.photos || [];
    el.innerHTML = photos.map((p: any) => `<div style="width:44px;height:44px;border-radius:6px;overflow:hidden;flex-shrink:0;border:2px solid #fff;"><img src="${p.url}" style="width:100%;height:100%;object-fit:cover;"></div>`).join('');
  }

  function _closeDC(): void {
    const m = document.getElementById('detail-cam-modal');
    if (m) m.style.display = 'none';
    if (_dcStream) { _dcStream.getTracks().forEach(t => t.stop()); _dcStream = null; }
    _dcTorchOn = false;
    _dcTorchSupported = false;
    const bt = document.getElementById('detail-cam-torch');
    if (bt) { bt.style.display = 'none'; bt.style.background = 'rgba(255,255,255,0.15)'; }
    const zc = document.getElementById('detail-cam-zoom');
    if (zc) zc.style.display = 'none';
  }

  (window as any).openDetailedCamera = async function (): Promise<void> {
    _openNativeCameraInput();
    return;
    document.getElementById('photo-choice-modal')!.style.display = 'none';
    const m = document.getElementById('detail-cam-modal');
    if (!m) return;
    if (!navigator.mediaDevices?.getUserMedia) { (document.getElementById('file-camera') as HTMLInputElement).click(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } as any }, audio: false })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } as any }, audio: false }));
      _dcStream = stream; _dcTorchOn = false;
      (document.getElementById('detail-cam-video') as HTMLVideoElement).srcObject = stream;
      (m as HTMLElement).style.display = 'flex';
      _renderDCThumbs();
      const track = stream.getVideoTracks()[0];
      const caps = (track as any).getCapabilities ? (track as any).getCapabilities() : {};
      const bt = document.getElementById('detail-cam-torch');
      _dcTorchSupported = !!caps.torch;
      if (bt) {
        (bt as HTMLElement).style.display = _dcTorchSupported ? 'flex' : 'none';
        (bt as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
      }
      const zc = document.getElementById('detail-cam-zoom');
      const zs = document.getElementById('detail-cam-zoom-slider') as HTMLInputElement | null;
      if (zc && zs && caps.zoom) {
        (zs as HTMLInputElement).min = caps.zoom.min; (zs as HTMLInputElement).max = caps.zoom.max;
        (zs as HTMLInputElement).step = ((caps.zoom.max - caps.zoom.min) / 20).toString();
        (zs as HTMLInputElement).value = caps.zoom.min;
        (zc as HTMLElement).style.display = 'block';
        (zs as HTMLInputElement).oninput = function () { track.applyConstraints({ advanced: [{ zoom: parseFloat(zs!.value) }] } as any); };
      }
    } catch (e: any) {
      toast('⚠️ ' + (e?.name === 'NotAllowedError' ? 'Permissão negada' : 'Câmera indisponível'));
      (document.getElementById('file-camera') as HTMLInputElement).click();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('detail-cam-close')?.addEventListener('click', _closeDC);
    document.getElementById('detail-cam-torch')?.addEventListener('click', async function () {
      if (!_dcStream || !_dcTorchSupported) return;
      const nextState = !_dcTorchOn;
      const ok = await _setTorchState(nextState);
      if (!ok) { toast('⚠️ Flash indisponível neste modo'); }
      (this as HTMLElement).style.background = _dcTorchOn ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.15)';
    });
    document.getElementById('detail-cam-capture')?.addEventListener('click', function () {
      const v = document.getElementById('detail-cam-video') as HTMLVideoElement;
      if (!v.videoWidth) { toast('⚠️ Aguarde a câmera'); return; }
      const c = document.getElementById('detail-cam-canvas') as HTMLCanvasElement;
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d')!.drawImage(v, 0, 0);
      if (!(S as any).tempItem.photos) (S as any).tempItem.photos = [];
      (S as any).tempItem.photos.push({ url: c.toDataURL('image/jpeg', 0.75), filename: 'Foto_' + Date.now() + '.jpg' });
      _renderDCThumbs();
      toast('📸 Foto capturada!');
      (window as any).renderItemModal();
    });
    document.getElementById('detail-cam-gallery')?.addEventListener('change', function (e: any) {
      Array.from(e.target.files || []).forEach((f: any) => {
        (window as any).compressImage(f, (url: string) => {
          if (!(S as any).tempItem.photos) (S as any).tempItem.photos = [];
          (S as any).tempItem.photos.push({ url, filename: f.name || 'foto.jpg' });
          _renderDCThumbs();
          toast('<svg class="ico" aria-hidden="true"><use href="#ico-camera"/></svg> Foto adicionada!');
          (window as any).renderItemModal();
        });
      });
      e.target.value = '';
    });
  });
})();

// ── APP FLASH ──
(function () {
  (window as any).openFlash = function (): void {
    localStorage.removeItem('orcamento-pocket-draft');
    const iframe = document.getElementById('flash-iframe') as HTMLIFrameElement | null;
    const pg = document.getElementById('pg-flash');
    if (pg) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      pg.classList.add('active');
      pg.style.display = 'flex';
    }
    if (!iframe) return;
    const _rawSrc = iframe.getAttribute('data-srcdoc') || '';
    const _nomes = ((S.config as any).flashNomes || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const _servs = ((S.config as any).flashServicos || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const _mats = ((S.config as any).flashMateriais || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const _flashSrc = _rawSrc
      .replace('%%NOME_SUGESTOES%%', JSON.stringify(_nomes))
      .replace('%%OBS_SERVICOS%%', JSON.stringify(_servs))
      .replace('%%OBS_MATERIAIS%%', JSON.stringify(_mats));
    const ppTheme = sessionStorage.getItem('pp-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    function _onFlashLoad(): void {
      if (!iframe!.srcdoc) return;
      iframe!.removeEventListener('load', _onFlashLoad);
      try {
        iframe!.contentWindow!.postMessage({ type: 'pp-theme', theme: ppTheme }, '*');
        iframe!.contentWindow!.postMessage({ type: 'flash-clear' }, '*');
      } catch (e) {}
    }
    iframe.addEventListener('load', _onFlashLoad);
    iframe.srcdoc = '';
    setTimeout(() => { iframe.srcdoc = _flashSrc; }, 80);
  };

  (window as any).exitFlash = function (): void {
    const flashIframe = document.getElementById('flash-iframe') as HTMLIFrameElement | null;
    try { flashIframe?.contentWindow?.postMessage({ type: 'stop-camera' }, '*'); } catch (e) {}
    const pg = document.getElementById('pg-flash');
    if (pg) { pg.classList.remove('active'); pg.style.display = 'none'; }
    convertFlashDraft();
    homeTab('home');
  };

  function convertFlashDraft(): void {
    const raw = localStorage.getItem('orcamento-pocket-draft');
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (!draft.cliente) return;

      const now = Date.now();
      const valorBase = parseFloat(String(draft.valorTexto || '').replace(',', '.')) || 0;
      const isM2 = draft.valueMode === 'm2';
      const isTotal = draft.valueMode === 'total';

      const rooms = [{
        id: String(now),
        name: 'Geral',
        alt: 0,
        comp: 0,
        items: (draft.items || []).map((it: any) => ({
          name: it.nome || 'Item',
          alt: Number(it.altura || 0),
          comp: Number(it.largura || 0),
          services: it.services || [],
          price: 0,
          perMeter: false,
          obs: it.observacao || it.obs || '',
          photos: (it.fotos || []).map((url: string, i: number) => ({ url, filename: 'Flash_' + (i + 1) + '.jpg' }))
        })),
        preco: isM2 || isTotal ? valorBase : 0,
        precoPerM2: isM2,
        services: (S.DEFAULT_SERVICES || []).slice(),
        collapsed: false
      }];

      const orc = {
        id: String(now),
        nome: draft.cliente || '',
        apelido: draft.apelido || '',
        tel: draft.telefone || '',
        email: '', cpf: '', cep: '', logradouro: '', numero: '',
        comp: '', bairro: '', cidade: '', end: '',
        pagNome: '', pagTel: '', pagEnd: '', pagador: false,
        rooms,
        pgto: [],
        fmt: 'completo' as const,
        preco: 0,
        status: 'Rascunho Flash',
        valid: '15',
        tipoServico: 'Somente Mão de Obra (M.O)',
        inicio: '', obs: '',
        date: new Date().toLocaleDateString('pt-BR'),
        ts: now, tsEdit: now,
        isFlashDraft: true
      };

      const dup = S.orcs.find((o: any) => o.isFlashDraft && o.nome === orc.nome &&
        Math.abs((o.ts || 0) - now) < 10000);
      if (dup) return;

      S.orcs.unshift(orc);
      saveOrcs();
      localStorage.removeItem('orcamento-pocket-draft');
      toast('<svg class="ico" aria-hidden="true"><use href="#ico-zap"/></svg> Rascunho Flash importado!');
    } catch (e) { console.error('Flash draft conversion error', e); }
  }
})();

// Listener: recebe mensagem do App Flash via postMessage
window.addEventListener('message', function (e: MessageEvent) {
  if (e.origin !== window.location.origin && e.origin !== 'null') return;
  if (e.data && e.data.type === 'flash-exit') {
    (window as any).exitFlash();
  }
});

// ── TUTORIAL / FAQ ──
function showTutorial(): void {
  document.getElementById('info-modal-title')!.textContent = 'Tutorial';
  document.getElementById('info-modal-title')!.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#ico-book"/></svg> Tutorial';
  document.getElementById('info-modal-body')!.innerHTML = `<div style="margin-bottom: 16px;"><b>Bem-vindo ao Pintor Plus!</b></div><ul style="margin-left: 18px; display: flex; flex-direction: column; gap: 12px;"><li><b>1. Criação de Orçamento:</b> Na página inicial, toque em "Criar Novo Orçamento". Preencha os dados e avance.</li><li><b>2. Inserindo Medidas:</b> Clique no grande botão laranja "+ Adicionar Novo Item" para abrir o formulário.</li><li><b>3. CRM e Lembretes:</b> Seus clientes são salvos automaticamente. Utilize a aba "Agenda" para gerenciar retornos.</li></ul>`;
  document.getElementById('info-modal')!.style.display = 'flex';
}

function showFaq(): void {
  document.getElementById('info-modal-title')!.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#ico-help"/></svg> FAQ';
  document.getElementById('info-modal-body')!.innerHTML = `<div style="margin-bottom: 16px;"><b>1. Preciso de internet?</b><br>Apenas para buscar o CEP. O resto funciona offline no seu navegador.</div><div style="margin-bottom: 16px;"><b>2. Como calculo por metro quadrado?</b><br>Ao definir o "Preço base do local", selecione a opção "Por m²".</div>`;
  document.getElementById('info-modal')!.style.display = 'flex';
}

// ── App init (window load) ──
window.addEventListener('load', () => {
  try { history.replaceState({ page: 'pg-home' }, '', '#pg-home'); } catch (e) {}
  renderHomeMini(); (window as any).renderHomeEvents(); renderHomeNews(); (window as any).buildSteps(1); (window as any).attachEnterNav(); populateStatusSelect(); loadGoogleMaps();
  navigator.serviceWorker?.ready.then(() => (window as any)._syncAlarmsToSW()).catch(() => {});
});

// ── Expose globals ──
(window as any).toggleCfgCard = toggleCfgCard;
(window as any).closeCfgSaveModal = closeCfgSaveModal;
(window as any).maskCep = maskCep;
(window as any).fetchCep = fetchCep;
(window as any).toggleManualEnd = toggleManualEnd;
(window as any).loadGoogleMaps = loadGoogleMaps;
(window as any).initAutocomplete = initAutocomplete;
(window as any).fillInAddress = fillInAddress;
(window as any).openConfig = openConfig;
(window as any).saveConfig = saveConfig;
(window as any).loadLogoCfg = loadLogoCfg;
(window as any).clearLogoCfg = clearLogoCfg;
(window as any).renderLogoPreview = renderLogoPreview;
(window as any).loadSigCfg = loadSigCfg;
(window as any).clearSigCfg = clearSigCfg;
(window as any).renderSigPreview = renderSigPreview;
(window as any).sigTab = sigTab;
(window as any).sigCanvasClear = sigCanvasClear;
(window as any).sigCanvasSave = sigCanvasSave;
(window as any).buildDateLabel = buildDateLabel;
(window as any).populateStatusSelect = populateStatusSelect;
(window as any).homeTab = homeTab;
(window as any).renderHomeMini = renderHomeMini;
(window as any).renderHomeNews = renderHomeNews;
(window as any).exportBackup = exportBackup;
(window as any).handleBackupFile = handleBackupFile;
(window as any).openBackupModal = openBackupModal;
(window as any).closeBackupModal = closeBackupModal;
(window as any).executeBackupImport = executeBackupImport;
(window as any)._hasAcceptedTerms = _hasAcceptedTerms;
(window as any).showTermsModal = showTermsModal;
(window as any).toggleTermsAccept = toggleTermsAccept;
(window as any).acceptTerms = acceptTerms;
(window as any).rejectTerms = rejectTerms;
(window as any).PWA = PWA;
(window as any)._gerarLogSuporte = _gerarLogSuporte;
(window as any).abrirModalSuporte = abrirModalSuporte;
(window as any).addSupportImages = addSupportImages;
(window as any)._removeSupportImage = _removeSupportImage;
(window as any).enviarSuporte = enviarSuporte;
(window as any).showTutorial = showTutorial;
(window as any).showFaq = showFaq;
