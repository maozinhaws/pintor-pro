import { AppState } from './state.js';
import { escapeHtml, calcOrcTotal, numFromInput, formatNum } from './utils.js';
import { showToast } from './toast.js';

function _loadHtml2PDF() {
  if (window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function buildPDFHtml(orc) {
  const cfg = AppState.config;
  const total = calcOrcTotal(orc);
  const orcId = String(orc.id || Date.now()).slice(-6);
  const logoHtml = cfg.logo
    ? `<img src="${cfg.logo}" style="max-width:120px;max-height:70px;object-fit:contain;border-radius:6px;">`
    : `<div style="width:64px;height:64px;background:#f1f5f9;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8;font-weight:bold;border-radius:8px;text-align:center;">LOGO</div>`;

  let totalM2 = 0;
  const itemsHtml = (orc.items || []).map(item => {
    const l = numFromInput(item.largura || item.comp || 0);
    const a = numFromInput(item.altura || item.alt || 0);
    const area = l > 0 && a > 0 ? l * a : (l || a);
    if (l > 0 && a > 0) totalM2 += l * a;
    const measureLabel = l > 0 && a > 0
      ? `${formatNum(l * a)} m²`
      : (l || a) ? `${formatNum(l || a)} m` : '';
    const servs = (item.services || []).map(escapeHtml).join(', ');
    const obsHtml = item.obs
      ? `<div style="font-size:11px;color:#64748b;margin-top:4px;font-style:italic;">Obs: ${escapeHtml(item.obs)}</div>`
      : '';
    return `
      <div style="padding:10px 0;border-bottom:1px dashed #e2e8f0;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <span style="color:#0f172a;font-weight:600;">- ${escapeHtml(item.nome || item.name || '')} ${servs ? `<span style="font-size:11px;color:#64748b;font-weight:400;">(${servs})</span>` : ''}</span>
          ${measureLabel ? `<span style="font-size:12px;color:#64748b;font-weight:bold;white-space:nowrap;">${measureLabel}</span>` : ''}
        </div>
        ${obsHtml}
      </div>`;
  }).join('');

  const dataFormatada = orc.date || new Date().toLocaleDateString('pt-BR');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>OC_${orcId}</title>
  <style>
    body{margin:0;padding:0;background:#e2e8f0;font-family:Arial,Helvetica,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .print-btn{display:flex;align-items:center;justify-content:center;width:52px;height:52px;margin:16px auto;background:#7c3aed;color:#fff;border-radius:50%;cursor:pointer;border:none;box-shadow:0 4px 12px rgba(124,58,237,.4);font-size:22px;}
    .page{width:100%;max-width:794px;margin:0 auto 40px;background:#fff;padding:36px;box-sizing:border-box;position:relative;box-shadow:0 10px 30px rgba(0,0,0,0.1);border-radius:8px;}
    @media print{body{background:#fff;}.print-btn{display:none!important;}.page{margin:0;padding:0;box-shadow:none;border-radius:0;max-width:100%;}@page{margin:10mm;size:A4 portrait;}.avoid-break{page-break-inside:avoid;break-inside:avoid;}}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()" title="Imprimir">🖨️</button>
  <div class="page">
    <div class="avoid-break" style="display:flex;justify-content:space-between;border-bottom:2px solid #334155;padding-bottom:20px;margin-bottom:24px;">
      <div style="display:flex;gap:16px;align-items:flex-start;">
        ${logoHtml}
        <div>
          <div style="font-size:22px;font-weight:900;color:#0f172a;margin-bottom:4px;letter-spacing:-0.5px;">${escapeHtml(cfg.empresa || 'Pintor Plus')}</div>
          ${cfg.tel ? `<div style="font-size:13px;color:#334155;margin-bottom:2px;">Tel: <b>${escapeHtml(cfg.tel)}</b></div>` : ''}
          ${cfg.emailEmpresa ? `<div style="font-size:13px;color:#334155;margin-bottom:2px;">${escapeHtml(cfg.emailEmpresa)}</div>` : ''}
          ${cfg.endEmpresa ? `<div style="font-size:13px;color:#334155;margin-bottom:2px;">${escapeHtml(cfg.endEmpresa)}</div>` : ''}
          ${cfg.doc ? `<div style="font-size:13px;color:#334155;">CNPJ/CPF: ${escapeHtml(cfg.doc)}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:24px;font-weight:900;color:#7c3aed;margin-bottom:6px;">ORÇAMENTO</div>
        <div style="font-size:14px;color:#64748b;font-weight:bold;margin-bottom:2px;">Nº #${orcId}</div>
        <div style="font-size:13px;color:#64748b;">Data: ${dataFormatada}</div>
      </div>
    </div>

    <div class="avoid-break" style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:18px;margin-bottom:22px;">
      <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px;">Dados do Cliente</div>
      <div style="display:flex;flex-direction:column;gap:5px;font-size:14px;">
        <div style="display:flex;"><div style="font-weight:bold;width:90px;color:#334155;">Nome:</div><div>${escapeHtml(orc.nome || '—')}</div></div>
        ${orc.tel ? `<div style="display:flex;"><div style="font-weight:bold;width:90px;color:#334155;">Telefone:</div><div>${escapeHtml(orc.tel)}</div></div>` : ''}
        ${orc.email ? `<div style="display:flex;"><div style="font-weight:bold;width:90px;color:#334155;">E-mail:</div><div>${escapeHtml(orc.email)}</div></div>` : ''}
        ${orc.end ? `<div style="display:flex;"><div style="font-weight:bold;width:90px;color:#334155;">Endereço:</div><div>${escapeHtml(orc.end)}</div></div>` : ''}
      </div>
    </div>

    <div style="margin-bottom:22px;">
      <div class="avoid-break" style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;text-transform:uppercase;">Serviços a Realizar</div>
      <div style="font-size:13px;line-height:1.6;">${itemsHtml || '<div style="color:#64748b;">Nenhum item informado.</div>'}</div>
    </div>

    <div class="avoid-break" style="display:flex;justify-content:space-between;margin-top:28px;border-top:2px solid #e2e8f0;padding-top:18px;">
      <div style="font-size:13px;color:#334155;width:60%;padding-right:16px;">
        ${totalM2 > 0 ? `<div style="margin-bottom:5px;"><strong>ÁREA TOTAL APROX.:</strong> ${formatNum(totalM2)} m²</div>` : ''}
        ${orc.valid ? `<div style="margin-bottom:5px;"><strong>VALIDADE:</strong> ${escapeHtml(String(orc.valid))} dias</div>` : ''}
        ${orc.inicio ? `<div style="margin-bottom:5px;"><strong>INÍCIO PREVISTO:</strong> ${escapeHtml(orc.inicio)}</div>` : ''}
        ${orc.obs ? `<div style="margin-top:14px;padding:10px;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;color:#000;"><strong>Observações:</strong><br>${escapeHtml(orc.obs)}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;font-weight:bold;color:#64748b;margin-bottom:5px;text-transform:uppercase;">Total do Orçamento</div>
        <div style="font-size:30px;font-weight:900;color:#15803d;letter-spacing:-1px;">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),500);<\/script>
</body>
</html>`;
}

export async function sharePDF(orc) {
  showToast('Gerando PDF…');
  try {
    await _loadHtml2PDF();
    const orcId = String(orc.id || Date.now()).slice(-6);
    const nomeCli = (orc.nome || 'Orcamento').replace(/[^a-zA-ZÀ-ÿ0-9]/g, '_');
    const fileName = `OC_${nomeCli}_${orcId}.pdf`;

    const fullHtml = buildPDFHtml(orc);
    const styleMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const cssText = styleMatch ? styleMatch[1] : '';
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1] : fullHtml;
    bodyContent = bodyContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<button class="print-btn"[\s\S]*?<\/button>/g, '');

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;background:#fff;z-index:-1;';
    const styleEl = document.createElement('style');
    styleEl.textContent = cssText;
    wrapper.appendChild(styleEl);
    wrapper.insertAdjacentHTML('beforeend', bodyContent);
    document.body.appendChild(wrapper);

    let blob;
    try {
      blob = await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(wrapper).outputPdf('blob');
    } finally {
      document.body.removeChild(wrapper);
    }

    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({ title: `Orçamento — ${orc.nome || ''}`, files: [pdfFile] });
      return;
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    showToast('✅ PDF salvo!');
  } catch (e) {
    if (e?.name === 'AbortError') return;
    console.error('PDF error:', e);
    showToast('⚠️ Erro ao gerar PDF');
  }
}
