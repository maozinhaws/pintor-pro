// Pure utility functions — no DOM, no state

export function digitsOnly(v) { return String(v || '').replace(/\D/g, ''); }

export function formatPhone(value) {
  let raw = digitsOnly(value);
  if (raw.length > 11 && raw.startsWith('55')) raw = raw.slice(2);
  const d = raw.slice(0, 11);
  if (!d) return '';
  if (d.length < 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export function validatePhone(value) {
  const d = digitsOnly(value);
  if (d.length === 11) return /^[1-9][0-9]$/.test(d.slice(0, 2)) && d[2] === '9';
  if (d.length === 10) return /^[1-9][0-9]$/.test(d.slice(0, 2)) && /^[2-8]$/.test(d[2]);
  return false;
}

export function validateFullName(value) {
  const v = String(value || '').trim().replace(/\s+/g, ' ');
  return /^[A-Za-zÀ-ÿ]+(?:['-]?[A-Za-zÀ-ÿ]+)*\s+[A-Za-zÀ-ÿ]+/.test(v);
}

export function money(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNum(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function numFromInput(value) {
  return Number(String(value || '').replace(',', '.')) || 0;
}

export function normalizeDecimalInput(value) {
  let v = String(value || '').replace(/[^0-9.,]/g, '');
  const first = v.search(/[.,]/);
  if (first !== -1) {
    const head = v.slice(0, first + 1);
    const tail = v.slice(first + 1).replace(/[.,]/g, '');
    v = head + tail;
  }
  return v;
}

export function normalizeMeasureInput(value) {
  let v = normalizeDecimalInput(value).replace(/\./g, ',');
  if (/^0\d/.test(v) && !v.startsWith('0,')) v = v.replace(/^0+/, '');
  return v;
}

export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateId() {
  return String(Date.now() + Math.floor(Math.random() * 100000));
}

export function formatDateBR(date = new Date()) {
  return date.toLocaleDateString('pt-BR');
}

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });
}

export function getItemMeasureLabel(largura, altura) {
  const l = numFromInput(largura), a = numFromInput(altura);
  if (l > 0 && a > 0) return `Área: ${formatNum(l * a)} m²`;
  if (l > 0 || a > 0) return `Linear: ${formatNum(l || a)} m`;
  return '';
}

export function calcOrcTotal(orc) {
  let total = 0;
  let totalM2 = 0;
  (orc.items || []).forEach(item => {
    const l = numFromInput(item.largura || item.comp || 0);
    const a = numFromInput(item.altura || item.alt || 0);
    const area = l > 0 && a > 0 ? l * a : (l || a);
    totalM2 += (l > 0 && a > 0) ? l * a : 0;
    if (item.price) {
      total += item.perMeter ? item.price * area : item.price;
    }
  });
  if (orc.precoM2 && totalM2 > 0) total += orc.precoM2 * totalM2;
  else if (orc.precoFixo) total += orc.precoFixo;
  return total;
}
