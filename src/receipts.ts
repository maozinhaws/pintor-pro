import { S } from './state';
import { toast, ptFloat, esc } from './utils';

// ── RECIBO ──
let _reciboOrcIdx = -1;

function abrirModalRecibo(i: number): void {
  _reciboOrcIdx = i;
  const o = S.orcs[i];
  if (!o) return;
  const tot = (window as any).calcOrcTotal(o);

  (document.getElementById('rb-cliente-label') as HTMLElement).textContent = o.nome || '(sem nome)';

  const hoje = new Date();
  (document.getElementById('rb-data') as HTMLInputElement).value =
    hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');

  (document.getElementById('rb-total-label') as HTMLElement).textContent =
    tot > 0 ? 'R$ ' + tot.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'R$ 0,00';
  (document.getElementById('rb-valor-auto') as HTMLInputElement).checked = true;
  (document.getElementById('rb-valor-input') as HTMLInputElement).style.display = 'none';
  (document.getElementById('rb-valor-input') as HTMLInputElement).value = '';

  (document.getElementById('rb-pgto') as HTMLInputElement).value = Array.isArray(o.pgto) ? o.pgto.join(', ') : (o.pgto as any) || '';
  (document.getElementById('rb-obs') as HTMLInputElement).value = '';

  document.getElementById('modal-recibo')!.style.display = 'flex';
}

function fecharModalRecibo(): void {
  document.getElementById('modal-recibo')!.style.display = 'none';
  _reciboOrcIdx = -1;
}

function toggleRbValor(): void {
  const custom = (document.getElementById('rb-valor-custom') as HTMLInputElement).checked;
  (document.getElementById('rb-valor-input') as HTMLInputElement).style.display = custom ? '' : 'none';
}

function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(Math.abs(valor));
  const dec = Math.round((Math.abs(valor) - inteiro) * 100);
  const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
    'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const c = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
    'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  function g3(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
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
  if (dec > 0) {
    if (inteiro > 0) r += ' e ';
    r += i2e(dec) + (dec === 1 ? ' centavo' : ' centavos');
  }
  return r || 'zero reais';
}

function _reciboFmtBRL(v: number): string {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function _reciboFmtData(ymd: string): string {
  if (!ymd) return '—';
  const p = ymd.split('-');
  return (p[2] || '??') + '/' + (p[1] || '??') + '/' + (p[0] || '????');
}

function gerarReciboPDF(): void {
  const i = _reciboOrcIdx;
  if (i < 0) return;
  const o = S.orcs[i];
  if (!o) return;

  const tot = (window as any).calcOrcTotal(o);
  const custom = (document.getElementById('rb-valor-custom') as HTMLInputElement).checked;
  let valor = custom
    ? ptFloat((document.getElementById('rb-valor-input') as HTMLInputElement).value)
    : tot;
  if (valor <= 0) { toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Informe um valor válido.'); return; }

  const dataYMD = (document.getElementById('rb-data') as HTMLInputElement).value;
  const pgto = (document.getElementById('rb-pgto') as HTMLInputElement).value.trim() || 'Não informada';
  const obs = (document.getElementById('rb-obs') as HTMLInputElement).value.trim();
  const cfg = S.config || {} as any;

  const servicos: string[] = [];
  (o.rooms || []).forEach((room: any) => {
    (room.items || []).forEach((item: any) => {
      if (item.name) servicos.push(item.name);
    });
  });
  const descServicos = servicos.length
    ? servicos.join(', ')
    : 'Serviços de pintura conforme combinado';

  const data = {
    id: 'REC-' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    dataRecebimento: dataYMD,
    empresa: { nome: cfg.empresa || 'Prestador', cnpj: cfg.doc || '', tel: cfg.tel || '', email: cfg.emailEmpresa || '', end: cfg.endEmpresa || '', logo: cfg.logo || '' },
    cliente: { nome: o.nome || '—', doc: o.cpf || '', tel: o.tel || '', end: o.end || '' },
    pagador: o.pagador ? { nome: o.pagNome || '', tel: o.pagTel || '', end: o.pagEnd || '' } : null,
    descServicos,
    valor,
    pgto,
    obs,
    sigPintor: cfg.assinatura || '',
  };

  fecharModalRecibo();

  (window as any).showSpinner?.('Gerando recibo…');
  const html = gerarReciboHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) { (window as any).hideSpinner?.(); toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Pop-up bloqueado. Permita pop-ups para abrir o recibo.'); return; }
  setTimeout(() => { URL.revokeObjectURL(url); (window as any).hideSpinner?.(); }, 1500);
}

function gerarReciboHTML(d: any): string {
  const extenso = valorPorExtenso(d.valor);
  const valorFmt = _reciboFmtBRL(d.valor);
  const dataFmt = _reciboFmtData(d.dataRecebimento);
  const cidade = esc((d.empresa.end || '').split('—').pop()?.trim() || 'Local');
  const eNome = esc(d.empresa.nome || '');
  const logoHtml = d.empresa.logo
    ? `<img src="${d.empresa.logo}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;" alt="Logo">`
    : `<div style="width:60px;height:60px;border-radius:10px;background:#EDE9FE;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#7C3AED;">${(d.empresa.nome || 'P').charAt(0)}</div>`;
  const sigHtml = d.sigPintor
    ? `<img src="${d.sigPintor}" style="max-height:70px;max-width:220px;object-fit:contain;" alt="Assinatura">`
    : `<div style="height:50px;border-bottom:1.5px solid #334155;width:220px;"></div>`;
  const obsHtml = d.obs ? `<p style="margin-top:18px;font-size:12px;color:#475569;line-height:1.6;"><strong>Observações:</strong> ${esc(d.obs)}</p>` : '';
  const docHtml = d.empresa.cnpj ? `CPF/CNPJ: ${esc(d.empresa.cnpj)} · ` : '';
  const hasPagador = d.pagador && d.pagador.nome;
  const recebidoDe = esc(hasPagador ? d.pagador.nome : d.cliente.nome);
  const recebidoDoc = hasPagador ? '' : (d.cliente.doc ? `, portador(a) do CPF/CNPJ <strong>${esc(d.cliente.doc)}</strong>,` : '');
  const pagadorHtml = hasPagador ? `
    <div class="section">
      <div class="section-title">Dados do Pagador</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-lbl">Nome</span><span class="info-val">${esc(d.pagador.nome)}</span></div>
        ${d.pagador.tel ? `<div class="info-item"><span class="info-lbl">Telefone</span><span class="info-val">${esc(d.pagador.tel)}</span></div>` : ''}
        ${d.pagador.end ? `<div class="info-item" style="grid-column:1/-1"><span class="info-lbl">Endereço</span><span class="info-val">${esc(d.pagador.end)}</span></div>` : ''}
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Recibo ${d.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#0F172A;padding:32px 40px;}
  @media print{body{padding:20px 28px;}@page{margin:12mm 14mm;}}
  .doc{max-width:720px;margin:0 auto;}
  .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #0F172A;margin-bottom:22px;}
  .company-row{display:flex;gap:14px;align-items:flex-start;}
  .company-info .name{font-size:17px;font-weight:800;color:#0F172A;}
  .company-info .detail{font-size:11px;color:#64748B;line-height:1.7;margin-top:4px;}
  .title-block{text-align:right;}
  .rec-title{font-size:26px;font-weight:800;color:#7C3AED;letter-spacing:-0.5px;}
  .rec-id{font-family:monospace;font-size:12px;color:#475569;margin-top:3px;}
  .rec-date{font-size:11px;color:#64748B;margin-top:4px;}
  .legal-text{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:18px 20px;font-size:13.5px;color:#1E293B;line-height:1.85;margin-bottom:22px;}
  .legal-text strong{color:#0F172A;}
  .section{margin-bottom:18px;}
  .section-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7C3AED;margin-bottom:8px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;}
  .info-item{display:flex;flex-direction:column;gap:1px;}
  .info-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#94A3B8;}
  .info-val{font-size:13px;font-weight:600;color:#1E293B;}
  .sig-area{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px;padding-top:18px;border-top:1px solid #E2E8F0;}
  .sig-box{display:flex;flex-direction:column;align-items:center;gap:8px;}
  .sig-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;}
  .sig-name{font-size:12px;font-weight:600;color:#334155;}
  .disclaimer{margin-top:24px;padding:10px 14px;background:#FEF3C7;border-radius:8px;font-size:11px;color:#92400E;text-align:center;line-height:1.5;}
  .footer{margin-top:18px;text-align:center;font-size:10px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px;}
</style>
</head>
<body onload="setTimeout(()=>window.print(),400)">
<div class="doc">
  <div class="head">
    <div class="company-row">
      ${logoHtml}
      <div class="company-info">
        <div class="name">${eNome}</div>
        <div class="detail">${docHtml}${d.empresa.tel ? 'Tel: ' + esc(d.empresa.tel) : ''}${d.empresa.email ? ' · ' + esc(d.empresa.email) : ''}<br>${esc(d.empresa.end || '')}</div>
      </div>
    </div>
    <div class="title-block">
      <div class="rec-title">RECIBO</div>
      <div class="rec-id">${d.id}</div>
      <div class="rec-date">Data: <strong>${dataFmt}</strong></div>
    </div>
  </div>

  <div class="legal-text">
    Recebi(emos) de <strong>${recebidoDe}</strong>${recebidoDoc} a importância de
    <strong>${extenso}</strong> (<strong>${valorFmt}</strong>),
    referente a <strong>${esc(d.descServicos)}</strong>,
    pago mediante <strong>${esc(d.pgto)}</strong>.
    ${cidade ? '<br>' + cidade + ', ' + dataFmt + '.' : ''}
  </div>

  ${pagadorHtml}

  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-lbl">Nome</span><span class="info-val">${esc(d.cliente.nome)}</span></div>
      ${d.cliente.doc ? `<div class="info-item"><span class="info-lbl">CPF / CNPJ</span><span class="info-val">${esc(d.cliente.doc)}</span></div>` : ''}
      ${d.cliente.tel ? `<div class="info-item"><span class="info-lbl">Telefone</span><span class="info-val">${esc(d.cliente.tel)}</span></div>` : ''}
      ${d.cliente.end ? `<div class="info-item" style="grid-column:1/-1"><span class="info-lbl">Endereço</span><span class="info-val">${esc(d.cliente.end)}</span></div>` : ''}
    </div>
  </div>

  ${obsHtml}

  <div class="sig-area">
    <div class="sig-box">
      <div class="sig-lbl">Prestador de Serviço</div>
      ${sigHtml}
      <div class="sig-name">${eNome}</div>
      ${d.empresa.cnpj ? `<div style="font-size:10px;color:#94A3B8;">${esc(d.empresa.cnpj)}</div>` : ''}
    </div>
    <div class="sig-box">
      <div class="sig-lbl">Cliente (opcional)</div>
      <div style="height:50px;border-bottom:1.5px solid #334155;width:220px;"></div>
      <div class="sig-name">${esc(d.cliente.nome)}</div>
    </div>
  </div>

  <div class="disclaimer">
    ⚠️ Este recibo <strong>não tem valor como documento fiscal</strong>.
    Não substitui Nota Fiscal de Serviço (NFS-e). Serve apenas como comprovante de pagamento entre as partes.
  </div>

  <div class="footer">
    Gerado pelo <strong>Pintor Plus</strong> · pintorplus.com.br · ID: ${d.id}
  </div>
</div>
</body>
</html>`;
}

// Mensagem de acompanhamento de PDF (sem {detalhes}, só cabeçalho/rodapé)
function buildPDFShareMsg(orc: any): string {
  const totalValue = (window as any).calcOrcTotal(orc);
  const tFmt = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const msg = (S.config.msg || (window as any).defCfg?.msg || '')
    .replace(/\\n/g, '\n')
    .replace('{cliente}', orc.nome || 'Cliente')
    .replace('{detalhes}', '')
    .replace('{total}', tFmt)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return msg.includes(tFmt) ? msg : msg + '\n\n*Valor Total: ' + tFmt + '*';
}

// ── Expose globals ──
(window as any).abrirModalRecibo = abrirModalRecibo;
(window as any).fecharModalRecibo = fecharModalRecibo;
(window as any).toggleRbValor = toggleRbValor;
(window as any).valorPorExtenso = valorPorExtenso;
(window as any).gerarReciboPDF = gerarReciboPDF;
(window as any).gerarReciboHTML = gerarReciboHTML;
(window as any).buildPDFShareMsg = buildPDFShareMsg;
