/**
 * Calendar service — gera ICS e adiciona ao calendário do dispositivo
 *
 * Estratégia por plataforma:
 *   Android (Capacitor) → Intent URL  android.provider.CalendarContract
 *   iOS PWA             → data:text/calendar download  (abre no Calendário nativo)
 *   Desktop/Chrome      → webcal:// ou download .ics
 */

export interface CalendarEvent {
  titulo: string;
  descricao?: string;
  local?: string;
  inicio: Date;
  fim?: Date;
  orcamentoId?: string;
}

function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, '0');
}

function toICSDate(d: Date): string {
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    'T',
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join('');
}

function uid(): string {
  return `pintorplus-${Date.now()}-${Math.random().toString(36).slice(2)}@app`;
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pintor Plus//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    const start = ev.inicio;
    const end = ev.fim || new Date(start.getTime() + 60 * 60 * 1000);
    const block: string[] = [
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(ev.titulo)}`,
    ];
    if (ev.descricao) block.push(`DESCRIPTION:${escapeICS(ev.descricao)}`);
    if (ev.local) block.push(`LOCATION:${escapeICS(ev.local)}`);
    block.push('END:VEVENT');
    lines.push(...block);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ── Platform detection ───────────────────────────────────────────────────────

function isCapacitorAndroid(): boolean {
  return !!(window as any).Capacitor?.getPlatform?.() === false
    ? false
    : (window as any).Capacitor?.getPlatform?.() === 'android';
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// ── Add single event to device calendar ─────────────────────────────────────

export function addToCalendar(event: CalendarEvent): void {
  const start = event.inicio;
  const end = event.fim || new Date(start.getTime() + 60 * 60 * 1000);

  if (isCapacitorAndroid()) {
    // Android Intent URL — opens native calendar "Add event" dialog
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    const params = new URLSearchParams({
      action: 'INSERT',
      title: event.titulo,
      description: event.descricao || '',
      eventLocation: event.local || '',
      beginTime: String(start.getTime()),
      endTime: String(end.getTime()),
    });
    window.open(`intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event;${
      Array.from(params.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join(';')
    };end`, '_blank');
    return;
  }

  // iOS / Desktop: download ICS file (iOS opens in Calendar automatically)
  const ics = buildICS([event]);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compromisso_${start.toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Add all events of an orcamento ──────────────────────────────────────────

export function addOrcamentoEventos(orc: any): void {
  const eventos: CalendarEvent[] = (orc.eventos || [])
    .filter((e: any) => e.data)
    .map((e: any) => ({
      titulo: `${e.tipo || 'Visita'} — ${orc.nome || 'Cliente'}`,
      descricao: [e.obs, orc.end].filter(Boolean).join(' | '),
      local: orc.end || '',
      inicio: new Date(e.data),
      orcamentoId: orc.id,
    }));

  if (!eventos.length) return;

  if (eventos.length === 1) {
    addToCalendar(eventos[0]);
    return;
  }

  // Multiple events: download one ICS with all
  const ics = buildICS(eventos);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orc_${orc.id}_eventos.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Register on window ───────────────────────────────────────────────────────

export function registerCalendarOnWindow(): void {
  (window as any).addToCalendar = addToCalendar;
  (window as any).addOrcamentoEventos = addOrcamentoEventos;
  (window as any).buildICS = buildICS;
}
