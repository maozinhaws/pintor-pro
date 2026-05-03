import { S } from './state';
import { toast, esc, f1, getStatusBadgeClass } from './utils';

// ── Alarm engine ──
function playAlarmSynth(typeCode: string): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (typeCode === '1') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(); osc.stop(ctx.currentTime + 1.5);
    } else if (typeCode === '2') {
      osc.type = 'square'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      for (let i = 0; i < 4; i++) { gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2 + 0.1); gain.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.2 + 0.2); }
      osc.start(); osc.stop(ctx.currentTime + 1.0);
    } else {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.8, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) { console.warn('Audio synth error', e); }
}

// ── Notifications ──
async function _requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function _fireNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'show-notification', title, body });
  } else {
    try { new Notification(title, { body, icon: '/android-chrome-192x192.png', badge: '/favicon-96x96.png', tag: 'pp-alarm', renotify: true } as any); } catch (e) {}
  }
}

function _syncAlarmsToSW(): void {
  if (!navigator.serviceWorker?.controller) return;
  const pending = (S.eventos || []).filter((e: any) => !e.alarmado && e.dat && e.hora).map((e: any) => ({
    id: e.id, tit: e.tit, dat: e.dat, hora: e.hora,
    avisoVal: e.avisoVal, avisoUnid: e.avisoUnid
  }));
  navigator.serviceWorker.controller.postMessage({ type: 'sync-alarms', alarms: pending });
}

setInterval(checkAlarms, 30000);

function checkAlarms(): void {
  if (!S.eventos.length) return;
  const now = new Date(); let modified = false;
  S.eventos.forEach((ev: any) => {
    if (ev.alarmado || !ev.dat || !ev.hora) return;
    const evDate = new Date(`${ev.dat}T${ev.hora}`);
    let alertTime = new Date(evDate.getTime());
    const val = parseInt(ev.avisoVal) || 0;
    if (val > 0) {
      if (ev.avisoUnid === 'm') alertTime.setMinutes(alertTime.getMinutes() - val);
      else if (ev.avisoUnid === 'h') alertTime.setHours(alertTime.getHours() - val);
      else if (ev.avisoUnid === 'd') alertTime.setDate(alertTime.getDate() - val);
    }
    if (now >= alertTime) {
      toast(`<svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> LEMBRETE: ${esc(ev.tit)}`);
      _fireNotification('🔔 Pintor Plus — Lembrete', ev.tit);
      ev.alarmado = true; modified = true;
      const rep = parseInt(ev.repete) || 0;
      if (rep > 0) {
        let nData = new Date(evDate.getTime()); nData.setDate(nData.getDate() + rep);
        const y = nData.getFullYear(); const m = String(nData.getMonth() + 1).padStart(2, '0'); const d = String(nData.getDate()).padStart(2, '0');
        S.eventos.push({ ...ev, dat: `${y}-${m}-${d}`, alarmado: false, id: Date.now() });
      }
    }
  });
  if (modified) {
    localStorage.setItem('pp-eventos', JSON.stringify(S.eventos));
    if (document.getElementById('pg-agenda')?.classList.contains('active')) renderAgenda();
  }
}

// ── Calendar state ──
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calSelDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

function calChangeMonth(dir: number): void {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  else if (calMonth < 0) { calMonth = 11; calYear--; }
  renderAgenda();
}

function selectCalDate(dtStr: string): void {
  calSelDate = dtStr; renderAgenda();
}

function getUnifiedEvents(): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  S.eventos.forEach((e: any) => {
    if (!map[e.dat]) map[e.dat] = [];
    map[e.dat].push({ type: 'ev', data: e });
  });
  S.orcs.forEach((o: any) => {
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

function renderAgenda(): void {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  document.getElementById('cal-month-lbl')!.textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const evMap = getUnifiedEvents();
  const grid = document.getElementById('cal-grid-body')!;
  let html = '';
  const tDate = new Date();
  const todayStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-cell mute"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dtStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dtStr === todayStr ? 'today' : '';
    const isSel = dtStr === calSelDate ? 'sel' : '';
    let dotsHtml = '';
    if (evMap[dtStr]) {
      evMap[dtStr].forEach((item: any) => {
        dotsHtml += `<div class="cal-dot ${item.type}"></div>`;
      });
    }
    html += `<div class="cal-cell ${isToday} ${isSel}" onclick="selectCalDate('${dtStr}')">${d}<div class="cal-dots">${dotsHtml}</div></div>`;
  }
  grid.innerHTML = html;

  const listWrap = document.getElementById('agenda-eventos-list')!;
  const dayData = evMap[calSelDate] || [];
  const [y, m, d_str] = calSelDate.split('-');
  document.getElementById('agenda-day-title')!.textContent = `Agendamentos para ${d_str}/${m}/${y}`;

  if (dayData.length === 0) {
    listWrap.innerHTML = '<div style="text-align:center;padding:16px;font-size:13px;color:var(--ink3);">Nenhum agendamento para este dia.</div>';
  } else {
    listWrap.innerHTML = dayData.map((item: any) => {
      if (item.type === 'ev') {
        const e = item.data;
        return `<div class="hoc" style="border-left: 4px solid var(--bl);"><div class="hon"><svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> ${esc(e.tit)}</div><div class="hos">${esc(e.hora || 'O dia todo')} ${e.alarmado ? '<span style="color:var(--rd)">(Tocou)</span>' : ''}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;"><button onclick="exportICS(${e.id})" style="flex:1;height:38px;border-radius:10px;background:var(--bll);color:var(--bl);border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> Add Lembrete OS</button><button onclick="S.eventos=S.eventos.filter(x=>x.id!=${e.id});localStorage.setItem('pp-eventos',JSON.stringify(S.eventos));renderAgenda();" style="width:40px;border-radius:10px;background:var(--rdl);color:var(--rd);border:none;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-x"/></svg></button></div></div>`;
      } else {
        const o = item.data;
        return `<div class="hoc" style="border-left: 4px solid var(--gn); cursor:pointer;" onclick="editOrcByObjId('${o.id}')">
          <div class="hon"><svg class="ico" aria-hidden="true"><use href="#ico-hard-hat"/></svg> Início: ${esc(o.nome)}</div>
          <div class="hos">Status: <span class="hbadge ${getStatusBadgeClass(o.status)}">${esc(o.status || 'Pendente')}</span> • Valor: R$ ${(window as any).calcOrcTotal(o).toFixed(2)}</div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button onclick="event.stopPropagation(); transformToAlarm('${esc(o.nome)}', '${esc(o.inicio)}')" style="flex:1;height:38px;border-radius:10px;background:var(--bll);color:var(--bl);border:none;font-family:'Sora',sans-serif;font-weight:700;font-size:11px;cursor:pointer;"><svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> Criar Alarme de Obra</button>
          </div>
        </div>`;
      }
    }).join('');
  }
}

function editOrcByObjId(id: string): void {
  const i = S.orcs.findIndex((x: any) => x.id === id);
  if (i >= 0) (window as any).editOrc(i);
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
  if (!tit || !dat || !hora) return toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Preencha título, data e hora corretamente.');
  await _requestNotifPermission();
  const newEv: any = { tit, dat, hora, avisoVal, avisoUnid, repete, alarmado: false, id: Date.now(), tsEdit: Date.now() };
  S.eventos.push(newEv);
  S.eventos.sort((a: any, b: any) => new Date(a.dat + 'T' + a.hora).getTime() - new Date(b.dat + 'T' + b.hora).getTime());
  localStorage.setItem('pp-eventos', JSON.stringify(S.eventos));
  document.getElementById('modal-evento')!.style.display = 'none';
  calSelDate = dat;
  const parts = dat.split('-').map(Number);
  calYear = parts[0]; calMonth = parts[1] - 1;
  renderAgenda();
  _syncAlarmsToSW();
  toast('<svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> Lembrete salvo!');
}

function exportICS(id: number): void {
  const e = S.eventos.find((x: any) => x.id == id) as any; if (!e) return;
  const dt = e.dat.replace(/-/g, ''); const hr = (e.hora || '09:00').replace(':', '') + '00';
  const safeTit = e.tit.replace(/[;:\\,\n]/g, ' ');
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${safeTit}\nDTSTART:${dt}T${hr}\nDTEND:${dt}T${hr}\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `Lembrete_${safeTit.replace(/\s+/g, '_')}.ics`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Home events (next 7 days) ──
function renderHomeEvents(): void {
  const wrap = document.getElementById('home-events-mini');
  if (!wrap) return;
  const evMap = getUnifiedEvents();
  const today = new Date();
  let html = '';
  let count = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dtStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (evMap[dtStr]) {
      const parts = dtStr.split('-');
      const dataFormatada = `${parts[2]}/${parts[1]}`;

      evMap[dtStr].forEach((item: any) => {
        count++;
        if (count > 4) return;
        if (item.type === 'ev') {
          const e = item.data;
          html += `<div class="hoc" style="border-left: 3px solid var(--bl); margin-bottom:8px; padding:12px;"><div class="hot" style="margin-bottom:0;"><div><div class="hon" style="font-size:13px; color:var(--ink);"><svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> ${esc(e.tit)}</div><div class="hos" style="font-size:11px;">${esc(dataFormatada)} - ${esc(e.hora || 'O dia todo')}</div></div></div></div>`;
        } else {
          const o = item.data;
          html += `<div class="hoc" style="border-left: 3px solid var(--gn); margin-bottom:8px; padding:12px; cursor:pointer;" onclick="editOrcByObjId('${esc(o.id)}')"><div class="hot" style="margin-bottom:0; width:100%;"><div><div class="hon" style="font-size:13px; color:var(--ink);"><svg class="ico" aria-hidden="true"><use href="#ico-hard-hat"/></svg> Obra: ${esc(o.nome)}</div><div class="hos" style="font-size:11px;">Início a ${esc(dataFormatada)}</div></div><span class="hbadge ${getStatusBadgeClass(o.status)}" style="margin-left:auto;">${esc(o.status || 'Pendente')}</span></div></div>`;
        }
      });
    }
  }

  if (count === 0) {
    wrap.innerHTML = '<div style="text-align:center;padding:16px;background:var(--bg-card);border-radius:12px;border:1px solid var(--bdr);font-size:12px;color:var(--ink3);margin-bottom:8px;">Nenhum evento nos próximos 7 dias.</div>';
  } else {
    wrap.innerHTML = html;
  }
}

// ── Expose globals ──
(window as any).playAlarmSynth = playAlarmSynth;
(window as any).checkAlarms = checkAlarms;
(window as any).calChangeMonth = calChangeMonth;
(window as any).selectCalDate = selectCalDate;
(window as any).getUnifiedEvents = getUnifiedEvents;
(window as any).transformToAlarm = transformToAlarm;
(window as any).renderAgenda = renderAgenda;
(window as any).editOrcByObjId = editOrcByObjId;
(window as any).openEventModal = openEventModal;
(window as any).salvarEvento = salvarEvento;
(window as any).exportICS = exportICS;
(window as any).renderHomeEvents = renderHomeEvents;
(window as any)._syncAlarmsToSW = _syncAlarmsToSW;
