import { S } from './state';
import { toast, esc } from './utils';

// MOTOR DE ÁUDIO DO ALARME
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
      for(let i=0; i<4; i++) { gain.gain.setValueAtTime(0, ctx.currentTime + i*0.2 + 0.1); gain.gain.setValueAtTime(0.5, ctx.currentTime + i*0.2 + 0.2); }
      osc.start(); osc.stop(ctx.currentTime + 1.0);
    } else {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, ctx.currentTime); osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.8, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.5);
    }
  } catch(e) { console.warn('Audio synth error', e); }
}

// ── Notificações do Sistema ────────────────────────────────────────────
async function _requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function _fireNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // Usa SW para notificação (funciona quando app está em background no celular)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'show-notification', title, body });
  } else {
    try { new Notification(title, { body, icon: '/android-chrome-192x192.png', badge: '/favicon-96x96.png', tag: 'pp-alarm', renotify: true } as any); } catch(e) {}
  }
}

// Sincroniza alarms pendentes com o SW para notificações em background
function _syncAlarmsToSW(): void {
  if (!navigator.serviceWorker?.controller) return;
  const pending = (S.eventos || []).filter((e: any) => !e.alarmado && e.dat && e.hora).map((e: any) => ({
    id: e.id, tit: e.tit, dat: e.dat, hora: e.hora,
    avisoVal: e.avisoVal, avisoUnid: e.avisoUnid
  }));
  navigator.serviceWorker.controller.postMessage({ type: 'sync-alarms', alarms: pending });
}

function checkAlarms(): void {
  if(!S.eventos.length) return;
  const now = new Date(); let modified = false;
  S.eventos.forEach((ev: any) => {
    if(ev.alarmado || !ev.dat || !ev.hora) return;
    const evDate = new Date(`${ev.dat}T${ev.hora}`);
    let alertTime = new Date(evDate.getTime());
    const val = parseInt(ev.avisoVal) || 0;
    if (val > 0) {
      if(ev.avisoUnid === 'm') alertTime.setMinutes(alertTime.getMinutes() - val);
      else if(ev.avisoUnid === 'h') alertTime.setHours(alertTime.getHours() - val);
      else if(ev.avisoUnid === 'd') alertTime.setDate(alertTime.getDate() - val);
    }
    if (now >= alertTime) {
      toast(`<svg class="ico" aria-hidden="true"><use href="#ico-bell"/></svg> LEMBRETE: ${esc(ev.tit)}`);
      _fireNotification('🔔 Pintor Plus — Lembrete', ev.tit);
      ev.alarmado = true; modified = true;
      const rep = parseInt(ev.repete) || 0;
      if (rep > 0) {
        let nData = new Date(evDate.getTime()); nData.setDate(nData.getDate() + rep);
        const y = nData.getFullYear(); const m = String(nData.getMonth()+1).padStart(2,'0'); const d = String(nData.getDate()).padStart(2,'0');
        S.eventos.push({ ...ev, dat: `${y}-${m}-${d}`, alarmado: false, id: Date.now() });
      }
    }
  });
  if(modified) {
    localStorage.setItem('pp-eventos', JSON.stringify(S.eventos));
    if(document.getElementById('pg-agenda')?.classList.contains('active')) (window as any).renderAgenda?.();
  }
}

setInterval(checkAlarms, 30000);

// Expose globals for inline onclick handlers
(window as any).playAlarmSynth = playAlarmSynth;
(window as any)._requestNotifPermission = _requestNotifPermission;
(window as any)._fireNotification = _fireNotification;
(window as any)._syncAlarmsToSW = _syncAlarmsToSW;
(window as any).checkAlarms = checkAlarms;
