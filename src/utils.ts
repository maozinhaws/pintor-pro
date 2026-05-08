export function ico(n: string): string {
  return `<svg class="ico" aria-hidden="true"><use href="#ico-${n}"/></svg>`;
}

let _tt: ReturnType<typeof setTimeout> | null = null;
export function toast(msg: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = msg;
  el.classList.add('on');
  if (_tt) clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('on'), 2200);
}

export function f1(n: number): string {
  return Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatNum(v: number): string {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function money(v: number): string {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ptFloat(v: string): number {
  return Number(String(v || '').replace(',', '.')) || 0;
}

export function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function safeUrl(u: string): string {
  try { const p = new URL(u); return (p.protocol === 'https:' || p.protocol === 'http:') ? u : ''; }
  catch { return ''; }
}

export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeDecimalInput(value: string): string {
  let v = String(value || '').replace(/[^0-9.,]/g, '');
  const firstSep = v.search(/[.,]/);
  if (firstSep !== -1) { const head = v.slice(0, firstSep + 1); const tail = v.slice(firstSep + 1).replace(/[.,]/g, ''); v = head + tail; }
  return v;
}

export function normalizeMeasureInput(value: string): string {
  let v = normalizeDecimalInput(value).replace(/\./g, ',');
  if (/^0\d/.test(v) && !v.startsWith('0,')) v = v.replace(/^0+/, '');
  return v;
}

export function numFromInput(value: string): number {
  return Number(String(value || '').replace(',', '.')) || 0;
}

export function formatPhone(value: string): string {
  let raw = digitsOnly(value);
  if (raw.length > 11 && raw.startsWith('55')) raw = raw.slice(2);
  const digits = raw.slice(0, 11);
  if (!digits) return '';
  if (digits.length < 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function validateFullName(value: string): boolean {
  const v = String(value || '').trim().replace(/\s+/g, ' ');
  return /^[A-Za-zÀ-ÿ]+(?:['-]?[A-Za-zÀ-ÿ]+)*\s+[A-Za-zÀ-ÿ]+/.test(v);
}

export function validatePhone(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 11) { return /^[1-9][0-9]$/.test(digits.slice(0, 2)) && digits[2] === '9'; }
  if (digits.length === 10) { return /^[1-9][0-9]$/.test(digits.slice(0, 2)) && /^[2-8]$/.test(digits[2]); }
  return false;
}

export function getStatusBadgeClass(st: string): string {
  const s = (st || '').toLowerCase();
  if (s === 'aprovado' || s === 'concluído' || s === 'concluido') return 'hbg';
  if (s === 'enviado') return 'hbb';
  if (s === 'recusado') return 'hbr';
  return 'hby';
}

export function getRoomMeds(r: { alt: number; comp: number; items: { alt: number; comp: number }[] }): { m2: number; ml: number } {
  let m2 = 0, ml = 0;
  const rAlt = Number(r.alt) || 0;
  const rComp = Number(r.comp) || 0;
  if (rAlt > 0 && rComp > 0) m2 += rAlt * rComp;
  else if (rAlt > 0 || rComp > 0) ml += rAlt || rComp;
  for (const it of r.items || []) {
    const iAlt = ptFloat(String(it.alt));
    const iComp = ptFloat(String(it.comp));
    if (iAlt > 0 && iComp > 0) m2 += iAlt * iComp;
    else if (iAlt > 0 || iComp > 0) ml += iAlt || iComp;
  }
  return { m2, ml };
}

export function setFieldError(inputEl: HTMLElement, errorEl: HTMLElement, show: boolean): void {
  inputEl.classList.toggle('invalid', !!show);
  errorEl.classList.toggle('show', !!show);
}
