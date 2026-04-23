'use strict';




    const state = { currentStep: 1, items: [], modalPhotos: [], modalSelectedServices: [], editItemId: null, valueMode: null, theme: 'light', cameraStream: null, torchOn: false };
    const els = {
      step1: document.getElementById('step1'), step2: document.getElementById('step2'), step3: document.getElementById('step3'),
      pill1: document.getElementById('pill1'), pill2: document.getElementById('pill2'), pill3: document.getElementById('pill3'),
      cliente: document.getElementById('cliente'), apelido: document.getElementById('apelido'), telefone: document.getElementById('telefone'), clienteErro: document.getElementById('clienteErro'), telefoneErro: document.getElementById('telefoneErro'),
      btnIrItens: document.getElementById('btnIrItens'), btnLimparCliente: document.getElementById('btnLimparCliente'), btnVoltarCliente: document.getElementById('btnVoltarCliente'), btnVoltarItens: document.getElementById('btnVoltarItens'),
      btnAddItem: document.getElementById('btnAddItem'), btnIrResumo: document.getElementById('btnIrResumo'), btnSalvarRascunho: document.getElementById('btnSalvarRascunho'),
      itemsWrap: document.getElementById('itemsWrap'), summaryText: document.getElementById('summaryText'), areaTotal: document.getElementById('areaTotal'),
      optionValorTotal: document.getElementById('optionValorTotal'), optionValorM2: document.getElementById('optionValorM2'), valorTexto: document.getElementById('valorTexto'),
      itemModal: document.getElementById('itemModal'), btnFecharModal: document.getElementById('btnFecharModal'), btnCancelarItem: document.getElementById('btnCancelarItem'), btnSalvarItem: document.getElementById('btnSalvarItem'),
      modalNome: document.getElementById('modalNome'), modalLargura: document.getElementById('modalLargura'), modalAltura: document.getElementById('modalAltura'), modalArea: document.getElementById('modalArea'), modalObs: document.getElementById('modalObs'),
      btnAbrirCamera: document.getElementById('btnAbrirCamera'), modalFotosGaleria: document.getElementById('modalFotosGaleria'), modalPhotoCards: document.getElementById('modalPhotoCards'), cameraErro: document.getElementById('cameraErro'),
      cameraModal: document.getElementById('cameraModal'), btnFecharCamera: document.getElementById('btnFecharCamera'), btnCapturarFoto: document.getElementById('btnCapturarFoto'), btnEnviarFotos: document.getElementById('btnEnviarFotos'),
      cameraVideo: document.getElementById('cameraVideo'), cameraCanvas: document.getElementById('cameraCanvas'), cameraThumbs: document.getElementById('cameraThumbs'),
      toast: document.getElementById('toast'), hero: document.getElementById('hero'), transitionOverlay: document.getElementById('transitionOverlay'), splashScreen: document.getElementById('splashScreen'), screen: document.getElementById('screen')
    };
    let toastTimer = null;
    function showToast(msg){ els.toast.textContent = msg; els.toast.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove('on'), 2200); }
    function formatNum(v){ return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function money(v){ return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
    function digitsOnly(value){ return String(value || '').replace(/\D/g, ''); }
    function normalizeLeadingZero(value){ const str = String(value || '').trim(); if (!str) return ''; if (!/^\d+(?:[.,]\d+)?$/.test(str)) return str; const normalized = str.replace(',', '.'); const num = Number(normalized); if (!Number.isFinite(num)) return str; return num % 1 === 0 ? String(Math.trunc(num)) : String(num).replace('.', ','); }
    function normalizeDecimalInput(value){ let v = String(value || '').replace(/[^0-9.,]/g, ''); const firstSep = v.search(/[.,]/); if (firstSep !== -1) { const head = v.slice(0, firstSep + 1); const tail = v.slice(firstSep + 1).replace(/[.,]/g, ''); v = head + tail; } return v; }
    function normalizeMeasureInput(value){ let v = normalizeDecimalInput(value).replace(/\./g, ','); if (/^0\d/.test(v) && !v.startsWith('0,')) v = v.replace(/^0+/, ''); return v; }
    function numFromInput(value){ return Number(String(value || '').replace(',', '.')) || 0; }
    function formatPhone(value){ var raw=digitsOnly(value); if(raw.length>11){ if(raw.startsWith('55')) raw=raw.slice(2); } var digits=raw.slice(0,11); if(!digits) return ''; if(digits.length<3) return `(${digits}`; if(digits.length<=6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`; if(digits.length<=10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`; return `(${digits.slice(0,2)}) ${digits.slice(2,3)} ${digits.slice(3,7)}-${digits.slice(7)}`; }
    function validateFullName(value){ const v = String(value || '').trim().replace(/\s+/g, ' '); return /^[A-Za-z\u00C0-\u00FF]+(?:['-]?[A-Za-z\u00C0-\u00FF]+)*\s+[A-Za-z\u00C0-\u00FF]+/.test(v); }
    function validatePhone(value){ const digits = digitsOnly(value); if (digits.length === 11) { return /^[1-9][0-9]$/.test(digits.slice(0,2)) && digits[2] === '9'; } if (digits.length === 10) { return /^[1-9][0-9]$/.test(digits.slice(0,2)) && /^[2-8]$/.test(digits[2]); } return false; }
    function setFieldError(inputEl, errorEl, show){ inputEl.classList.toggle('invalid', !!show); errorEl.classList.toggle('show', !!show); }
    function validateStep1(showErrors){ const nameOk = validateFullName(els.cliente.value); const phoneOk = validatePhone(els.telefone.value); if (showErrors || els.cliente.value.trim()) setFieldError(els.cliente, els.clienteErro, !nameOk); if (showErrors || els.telefone.value.trim()) setFieldError(els.telefone, els.telefoneErro, !phoneOk); return nameOk && phoneOk; }
    function calcItemArea(l, a){ const lv = numFromInput(l); const av = numFromInput(a); return lv > 0 && av > 0 ? lv * av : 0; }
    function getItemMeasureLabel(l, a){ const lv = numFromInput(l); const av = numFromInput(a); if (lv > 0 && av > 0) return `\u00C1rea: ${formatNum(lv * av)} m\u00B2`; if (lv > 0 || av > 0) return `Linear: ${formatNum(lv || av)} m`; return 'Linear: 0,00 m'; }
    function runTransition(){ const o = els.transitionOverlay; o.innerHTML = ''; const line = document.createElement('div'); line.className = 'bolt-line'; o.appendChild(line); [12,24,36,48,60,72,84].forEach((top, idx) => { const bolt = document.createElement('div'); bolt.className = 'bolt-icon'; bolt.textContent = '\u26A1'; bolt.style.top = `${top}%`; bolt.style.right = `${4 + idx * 5}%`; bolt.style.animationDelay = `${idx * 0.05}s`; o.appendChild(bolt); }); o.classList.remove('run'); void o.offsetWidth; o.classList.add('run'); setTimeout(() => { o.classList.remove('run'); o.innerHTML = ''; }, 720); }
    function renderSteps(){ els.step1.classList.toggle('active', state.currentStep === 1); els.step2.classList.toggle('active', state.currentStep === 2); els.step3.classList.toggle('active', state.currentStep === 3); els.pill1.style.width = state.currentStep >= 1 ? '100%' : '0%'; els.pill2.style.width = state.currentStep >= 2 ? '100%' : '0%'; els.pill3.style.width = state.currentStep >= 3 ? '100%' : '0%'; els.hero.classList.toggle('dimmed', state.currentStep !== 1); }
    function goStep(n){ if (n < 1 || n > 3 || n === state.currentStep) return; runTransition(); state.currentStep = n; renderSteps(); updateSummary(); }
    function hideSplash(){ if (!els.splashScreen) return; setTimeout(() => els.splashScreen.classList.add('hide'), 3000); setTimeout(() => els.splashScreen.style.display = 'none', 3800); }
    function clearClient(){ els.cliente.value = ''; if(els.apelido)els.apelido.value=''; els.telefone.value = ''; setFieldError(els.cliente, els.clienteErro, false); setFieldError(els.telefone, els.telefoneErro, false); updateSummary(); showToast('\u21BA Dados do cliente limpos'); }
    function openItemModal(){ document.activeElement?.blur(); document.activeElement?.blur(); state.editItemId = null; state.modalPhotos = []; state.modalSelectedServices = []; _nomePickFirst=true; _obsPickFirst=true; els.modalNome.value = ''; els.modalLargura.value = ''; els.modalAltura.value = ''; els.modalObs.value = ''; els.modalFotosGaleria.value = ''; els.modalArea.textContent = 'Linear: 0,00 m'; els.cameraErro.classList.remove('show'); renderModalPhotos(); els.itemModal.classList.add('open'); }
    function openEditItemModal(id){ document.activeElement?.blur(); document.activeElement?.blur(); var item=state.items.find(function(x){return x.id===id;}); if(!item)return; state.editItemId=id; state.modalPhotos=[...(item.fotos||[])]; state.modalSelectedServices=[...(item.services||[])]; _nomePickFirst=false; _obsPickFirst=false; var lv=item.largura>0?String(item.largura).replace('.',','):''; var av=item.altura>0?String(item.altura).replace('.',','):''; els.modalNome.value=item.nome||''; els.modalLargura.value=lv; els.modalAltura.value=av; els.modalObs.value=item.observacao||''; els.modalFotosGaleria.value=''; updateModalArea(); els.cameraErro.classList.remove('show'); renderModalPhotos(); els.itemModal.classList.add('open'); }
    window.openEditItemModal=openEditItemModal;
    function closeItemModal(){ els.itemModal.classList.remove('open'); closeCameraModal(); }
    function updateModalArea(){ els.modalArea.textContent = getItemMeasureLabel(els.modalLargura.value, els.modalAltura.value); }
    function renderModalPhotos(){ if (!state.modalPhotos.length) { els.modalPhotoCards.innerHTML = ''; els.cameraThumbs.innerHTML = ''; return; } els.modalPhotoCards.innerHTML = state.modalPhotos.map((src, i) => `<div class="photo-card"><button class="photo-remove" type="button" onclick="removeModalPhoto(${i})">\u2715</button><img src="${src}" alt="Foto ${i+1}"></div>`).join(''); els.cameraThumbs.innerHTML = state.modalPhotos.map((src, i) => `<div class="camera-thumb"><img src="${src}" alt="Min ${i+1}"></div>`).join(''); }
    function removeModalPhoto(i){ state.modalPhotos.splice(i, 1); renderModalPhotos(); }
    window.removeModalPhoto = removeModalPhoto;
    function handleModalPhotos(files){ Array.from(files||[]).forEach(f => { const r = new FileReader(); r.onload = e => { state.modalPhotos.push(e.target.result); renderModalPhotos(); }; r.readAsDataURL(f); }); els.modalFotosGaleria.value = ''; }
    async function openCameraModal(){ document.activeElement?.blur(); document.activeElement?.blur(); els.cameraErro.classList.remove('show'); try { if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { els.cameraErro.classList.add('show'); return; } const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); state.cameraStream = stream; state.torchOn = false; els.cameraVideo.srcObject = stream; els.cameraModal.classList.add('open'); renderModalPhotos(); const _track = stream.getVideoTracks()[0]; const _caps = _track.getCapabilities ? _track.getCapabilities() : {}; const _bt = document.getElementById('btnTorch'); const _zc = document.getElementById('zoomControl'); const _zs = document.getElementById('zoomSlider'); if(_bt && _caps.torch){ _bt.style.display='flex'; _bt.onclick=function(){ state.torchOn=!state.torchOn; _track.applyConstraints({advanced:[{torch:state.torchOn}]}); _bt.style.background=state.torchOn?'rgba(251,191,36,0.8)':'rgba(255,255,255,0.15)'; }; } if(_zc && _zs && _caps.zoom){ _zs.min=_caps.zoom.min; _zs.max=_caps.zoom.max; _zs.step=(_caps.zoom.max-_caps.zoom.min)/20; _zs.value=_caps.zoom.min; _zc.style.display='block'; _zs.oninput=function(){ _track.applyConstraints({advanced:[{zoom:parseFloat(_zs.value)}]}); }; } } catch(err) { els.cameraErro.classList.add('show'); showToast(err&&err.name==='NotAllowedError' ? '\u26A0\uFE0F Permiss\u00E3o negada' : '\u26A0\uFE0F C\u00E2mera indispon\u00EDvel'); } }
    function stopCameraStream(){ if (state.cameraStream) { state.cameraStream.getTracks().forEach(t => t.stop()); state.cameraStream = null; } els.cameraVideo.srcObject = null; state.torchOn = false; const _bt=document.getElementById('btnTorch'); if(_bt)_bt.style.display='none'; const _zc=document.getElementById('zoomControl'); if(_zc)_zc.style.display='none'; }
    function closeCameraModal(){ els.cameraModal.classList.remove('open'); stopCameraStream(); }
    function captureCameraPhoto(){ const v = els.cameraVideo; if (!v.videoWidth) { showToast('\u26A0\uFE0F Aguarde a c\u00E2mera'); return; } const c = els.cameraCanvas; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); state.modalPhotos.push(c.toDataURL('image/jpeg', 0.75)); renderModalPhotos(); showToast('\uD83D\uDCF8 Foto capturada'); }
    function submitCameraPhotos(){ if (!state.modalPhotos.length) { showToast('\u26A0\uFE0F Capture ao menos uma foto'); return; } closeCameraModal(); showToast('\u2705 Fotos adicionadas'); }
    function saveItem(){ els.modalLargura.value = normalizeMeasureInput(els.modalLargura.value); els.modalAltura.value = normalizeMeasureInput(els.modalAltura.value); const nome = els.modalNome.value.trim(); if (!nome) { showToast('\u26A0\uFE0F Informe o nome do item'); return; } const newItem = { id: state.editItemId || String(Date.now()+Math.random()), nome, largura: numFromInput(els.modalLargura.value), altura: numFromInput(els.modalAltura.value), area: calcItemArea(els.modalLargura.value, els.modalAltura.value), medidaLabel: getItemMeasureLabel(els.modalLargura.value, els.modalAltura.value), observacao: els.modalObs.value.trim(), services: [...(state.modalSelectedServices||[])], fotos: [...state.modalPhotos] }; if (state.editItemId) { const idx = state.items.findIndex(function(x){ return x.id === state.editItemId; }); if (idx >= 0) state.items[idx] = newItem; state.editItemId = null; } else { state.items.push(newItem); } closeItemModal(); renderItems(); updateSummary(); showToast('\u2705 Item salvo'); }
    function removeItem(id){ state.items = state.items.filter(x => x.id !== id); renderItems(); updateSummary(); }
    window.removeItem = removeItem;
    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function renderItems(){ if (!state.items.length) { els.itemsWrap.innerHTML = '<div class="empty-box">Nenhum item salvo ainda.<br>Toque em <strong>Adicionar Novo Item</strong>.</div>'; return; } els.itemsWrap.innerHTML = state.items.map((x,i) => `<div class="list-card" onclick="openEditItemModal('${x.id}')" style="cursor:pointer;"><div class="list-head"><div style="flex:1;"><div class="list-title">${i+1}. ${escapeHtml(x.nome)}</div><div class="list-measure">${escapeHtml(x.medidaLabel)}</div></div><div style="display:flex;gap:6px;align-items:center;"><span style="font-size:11px;color:#94a3b8;font-weight:600;">\u270F\uFE0F</span><button class="list-del" onclick="event.stopPropagation();removeItem('${x.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div></div>`).join(''); }
    function getTotalArea(){ return state.items.reduce((s,x) => s + Number(x.area||0), 0); }
    function updateSummary(){ const cli = els.cliente.value.trim()||'N\u00E3o informado'; const tel = els.telefone.value.trim()||'N\u00E3o informado'; const ta = getTotalArea(); els.areaTotal.textContent = `${formatNum(ta)} m\u00B2`; let t = `Cliente: ${cli}\nTelefone: ${tel}\n\u00C1rea total: ${formatNum(ta)} m\u00B2`; if (!state.items.length) t += '\n\nItens: nenhum item salvo ainda.'; else { t += '\n\nItens:'; state.items.forEach((x,i) => { t += `\n${i+1}. ${x.nome} | ${x.medidaLabel}`; }); } const vb = numFromInput(els.valorTexto.value); if (state.valueMode==='total'&&vb>0) t += `\n\nValor total: ${money(vb)}`; if (state.valueMode==='m2'&&vb>0) t += `\n\nValor por m\u00B2: ${money(vb)}\nEstimativa: ${money(ta*vb)}`; els.summaryText.textContent = t;  const tc = document.getElementById('flashTotalCalc'); if(tc){ if(state.valueMode==='m2'&&vb>0){ tc.style.display='block'; tc.textContent = ta>0 ? '= R$ '+money(ta*vb)+' ('+formatNum(ta)+' m²)' : 'Adicione itens com medidas para calcular'; }else{ tc.style.display='none'; } } }
    function saveDraft(){ const d = { cliente: els.cliente.value.trim(), apelido: els.apelido ? els.apelido.value.trim() : '', telefone: els.telefone.value.trim(), items: state.items, valueMode: state.valueMode, valorTexto: els.valorTexto.value, atualizadoEm: new Date().toISOString() }; localStorage.setItem('orcamento-pocket-draft', JSON.stringify(d)); showToast('\uD83D\uDCBE Rascunho salvo!'); setTimeout(() => { try { window.parent.postMessage({ type: 'flash-exit' }, '*'); } catch(e) {} }, 800); }
    function setValueMode(mode){ state.valueMode = state.valueMode===mode ? null : mode; const tA=state.valueMode==='total', m2A=state.valueMode==='m2'; els.optionValorTotal.classList.toggle('active',tA); els.optionValorTotal.setAttribute('aria-pressed',tA?'true':'false'); els.optionValorM2.classList.toggle('active',m2A); els.optionValorM2.setAttribute('aria-pressed',m2A?'true':'false'); updateSummary(); }
    function setupSwipe(){ let sx=0,sy=0,cx=0,tk=false; els.screen.addEventListener('touchstart',e=>{ if(els.itemModal.classList.contains('open')||els.cameraModal.classList.contains('open'))return; const t=e.changedTouches[0]; sx=t.clientX; sy=t.clientY; cx=t.clientX; tk=true; },{passive:true}); els.screen.addEventListener('touchmove',e=>{ if(!tk)return; cx=e.changedTouches[0].clientX; },{passive:true}); els.screen.addEventListener('touchend',e=>{ if(!tk||els.itemModal.classList.contains('open')||els.cameraModal.classList.contains('open'))return; const t=e.changedTouches[0]; const dx=(t.clientX||cx)-sx; const dy=Math.abs(t.clientY-sy); tk=false; if(dy>60||Math.abs(dx)<42)return; if(dx<0){if(state.currentStep===1){if(validateStep1(true))goStep(2);}else if(state.currentStep===2)goStep(3);}else{if(state.currentStep===3)goStep(2);else if(state.currentStep===2)goStep(1);} },{passive:true}); }
    // Modal sair com timer
    function openExitModal(){ document.activeElement?.blur(); document.activeElement?.blur(); document.getElementById('exitModal').style.display='flex'; }
    function closeExitModal(proceed){ document.getElementById('exitModal').style.display='none'; if(proceed)notifyParentExit(); }
    function saveDraftAndExit(){ document.getElementById('exitModal').style.display='none'; saveDraft(); }
    function notifyParentExit(){
      // Sai sem salvar
      try{ window.parent.postMessage({type:'flash-exit'}, '*'); }catch(e){}
    }
    els.btnIrItens.addEventListener('click', () => { if (!validateStep1(true)) { if (!validateFullName(els.cliente.value)) els.cliente.focus(); else els.telefone.focus(); return; } goStep(2); });
    els.btnLimparCliente.addEventListener('click', clearClient);
    els.btnVoltarCliente.addEventListener('click', () => goStep(1));
    els.btnVoltarItens.addEventListener('click', () => goStep(2));
    els.btnAddItem.addEventListener('click', openItemModal);
    els.btnIrResumo.addEventListener('click', () => goStep(3));
    els.btnSalvarRascunho.addEventListener('click', saveDraft);
    els.btnFecharModal.addEventListener('click', closeItemModal);
    els.btnCancelarItem.addEventListener('click', closeItemModal);
    els.btnSalvarItem.addEventListener('click', saveItem);
    els.modalLargura.addEventListener('input', () => { els.modalLargura.value = normalizeMeasureInput(els.modalLargura.value); updateModalArea(); });
    els.modalAltura.addEventListener('input', () => { els.modalAltura.value = normalizeMeasureInput(els.modalAltura.value); updateModalArea(); });
    els.btnAbrirCamera.addEventListener('click', openCameraModal);
    els.modalFotosGaleria.addEventListener('change', e => handleModalPhotos(e.target.files));
    document.getElementById('modalFotosGaleriaBtn').addEventListener('change', e => handleModalPhotos(e.target.files));
    els.btnFecharCamera.addEventListener('click', closeCameraModal);
    els.btnCapturarFoto.addEventListener('click', captureCameraPhoto);
    els.btnEnviarFotos.addEventListener('click', submitCameraPhotos);
    els.optionValorTotal.addEventListener('click', () => setValueMode('total'));
    els.optionValorM2.addEventListener('click', () => setValueMode('m2'));
    els.optionValorTotal.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setValueMode('total');} });
    els.optionValorM2.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setValueMode('m2');} });
    els.valorTexto.addEventListener('input', () => { els.valorTexto.value = normalizeDecimalInput(els.valorTexto.value); updateSummary(); });
    els.cliente.addEventListener('input', () => { els.cliente.value = els.cliente.value.replace(/\s+/g,' ').replace(/^\s+/,''); validateStep1(false); updateSummary(); });
    els.telefone.addEventListener('input', function(){ var pos=this.selectionStart; var oldLen=this.value.length; this.value=formatPhone(this.value); var diff=this.value.length-oldLen; try{this.setSelectionRange(pos+diff,pos+diff);}catch(e){} validateStep1(false); updateSummary(); });
    els.telefone.addEventListener('keydown', e => { if(e.key==='Enter'||e.key==='Go'||e.key==='Done'){e.preventDefault();if(!validateStep1(true)){if(!validateFullName(els.cliente.value))els.cliente.focus();else els.telefone.focus();return;}goStep(2);} });
    els.itemModal.addEventListener('click', e => { if(e.target===els.itemModal)closeItemModal(); });
    els.cameraModal.addEventListener('click', e => { if(e.target===els.cameraModal)closeCameraModal(); });
    window.addEventListener('message', function(ev){
  if(!ev.data) return;
  if(ev.data.type === 'pp-theme'){
    applyFlashTheme(ev.data.theme);
    return;
  }
  if(ev.data.type === 'flash-clear'){
    els.cliente.value='';
    if(els.apelido) els.apelido.value='';
    els.telefone.value='';
    state.items=[];
    state.valueMode=null;
    els.valorTexto.value='';
    setFieldError(els.cliente, els.clienteErro, false);
    setFieldError(els.telefone, els.telefoneErro, false);
    renderItems();
    updateSummary();
    goStep(1);
    showToast('↺ Formulário limpo');
    return;
  }
  if(ev.data.type === 'stop-camera'){
    closeCameraModal();
  }
});
    var _nomePickFirst=true, _obsPickFirst=true;
    function _onNomeFieldClick(){ if(_nomePickFirst){_nomePickFirst=false;openNomePick();} }
    function _onObsFieldClick(){ if(_obsPickFirst){_obsPickFirst=false;openObsPick();} }
    const flashData = window.PP_FLASH_DATA || {};
const NOME_SUGESTOES = Array.isArray(flashData.nomes) ? flashData.nomes : [];
const OBS_SERVICOS = Array.isArray(flashData.servicos) ? flashData.servicos : [];
const OBS_MATERIAIS = Array.isArray(flashData.materiais) ? flashData.materiais : [];

function applyFlashTheme(theme){
  document.body.classList.toggle('dark', theme === 'dark');
}

applyFlashTheme(flashData.theme || 'light');
    function openNomePick(){ document.activeElement?.blur(); document.activeElement?.blur(); var g=document.getElementById('nomePickGrid'); g.innerHTML=NOME_SUGESTOES.map(function(n){ return '<button type=\'button\' onclick=\'selectNome(this.dataset.v)\' data-v=\''+n+'\' style=\'padding:10px 4px;border-radius:10px;border:1.5px solid #e2e8f0;background:#f8fafc;font-family:Sora,sans-serif;font-size:12px;font-weight:700;color:#0f172a;cursor:pointer;text-align:center;\'>'+n+'</button>'; }).join(''); document.getElementById('nomePickModal').style.display='flex'; }
    function closeNomePick(){ document.getElementById('nomePickModal').style.display='none'; }
    function selectNome(n){ document.getElementById('modalNome').value=n; closeNomePick(); }
            function _renderObsChips(items,cId,type){ var svcs=state.modalSelectedServices||[]; var c=document.getElementById(cId); c.innerHTML=items.map(function(s){ var sel=svcs.indexOf(s)>=0; var bg=sel?(type==='srv'?'#7c3aed':'#059669'):'#f1f5f9'; var col=sel?'#fff':(type==='srv'?'#7c3aed':'#059669'); var bdr=sel?'transparent':(type==='srv'?'#ddd6fe':'#d1fae5'); return '<button type=\'button\' onclick=\'toggleService(this.dataset.v)\' data-v=\''+s+'\' style=\'padding:7px 12px;border-radius:20px;border:1.5px solid '+bdr+';background:'+bg+';font-family:Sora,sans-serif;font-size:12px;font-weight:700;color:'+col+';cursor:pointer;\'>'+s+'</button>'; }).join(''); }
    function openObsPick(){ document.activeElement?.blur(); document.activeElement?.blur(); _renderObsChips(OBS_SERVICOS,'obsServGrid','srv'); _renderObsChips(OBS_MATERIAIS,'obsMatGrid','mat'); document.getElementById('obsPickModal').style.display='flex'; }
    function closeObsPick(){ document.getElementById('obsPickModal').style.display='none'; }
    function toggleService(s){ var svcs=state.modalSelectedServices||[]; var i=svcs.indexOf(s); if(i>=0) svcs.splice(i,1); else svcs.push(s); state.modalSelectedServices=svcs; _renderObsChips(OBS_SERVICOS,'obsServGrid','srv'); _renderObsChips(OBS_MATERIAIS,'obsMatGrid','mat'); }
    function confirmObsPick(){ var allKnown=OBS_SERVICOS.concat(OBS_MATERIAIS); var current=els.modalObs.value; var customParts=current.split(',').map(function(s){return s.trim();}).filter(function(s){return s&&allKnown.indexOf(s)<0;}); var selected=state.modalSelectedServices||[]; els.modalObs.value=customParts.concat(selected).join(', '); closeObsPick(); }

window.openExitModal = openExitModal;
window.closeExitModal = closeExitModal;
window.saveDraftAndExit = saveDraftAndExit;
window.notifyParentExit = notifyParentExit;
window.openNomePick = openNomePick;
window.closeNomePick = closeNomePick;
window.selectNome = selectNome;
window.openObsPick = openObsPick;
window.closeObsPick = closeObsPick;
window.toggleService = toggleService;
window.confirmObsPick = confirmObsPick;
window._onNomeFieldClick = _onNomeFieldClick;
window._onObsFieldClick = _onObsFieldClick;

    renderSteps(); renderItems(); updateSummary(); setupSwipe(); hideSplash();

