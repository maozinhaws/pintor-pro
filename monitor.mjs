// monitor.mjs — live TUI monitor de agentes Overclock
// Lê _panel_output.json e _panel_panes.json a cada 2s, exibe animação de status
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE = process.cwd();
const INTERVAL = 2000;
const SPINNER = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let tick = 0;

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[92m',
  yellow: '\x1b[93m',
  red:    '\x1b[91m',
  cyan:   '\x1b[96m',
  white:  '\x1b[97m',
  bgRed:  '\x1b[41m',
  clear:  '\x1b[2J\x1b[H',
};

function r(f, d) {
  try { return JSON.parse(readFileSync(join(BASE, f), 'utf8')); } catch { return d; }
}

function detectStatus(lines = []) {
  const last = lines.slice(-20).join(' ').toUpperCase();
  if (last.includes('PROBLEMA PARA CONTINUAR') || last.includes('ERROR') || last.includes('ERRO')) return 'PROBLEMA';
  if (last.includes('FINALIZADO')) return 'FINALIZADO';
  if (last.includes('AGUARDANDO')) return 'AGUARDANDO';
  // heuristics from pane output patterns
  if (last.includes('TSC --NOEMIT') && last.includes('ZERO ERROS')) return 'FINALIZADO';
  if (last.includes('SALVO EM') || last.includes('SAVED TO') || last.includes('.MD')) return 'FINALIZADO';
  if (last.includes('WORKED FOR') || last.includes('CHURNED FOR') || last.includes('COOKED FOR')) return 'FINALIZADO';
  return 'RODANDO';
}

function statusLine(status, spinner) {
  switch (status) {
    case 'FINALIZADO':
      return `${C.green}${C.bold}● FINALIZADO${C.reset}`;
    case 'AGUARDANDO':
      return `${C.yellow}${C.bold}◌ AGUARDANDO${C.reset}`;
    case 'PROBLEMA':
      return `${C.bgRed}${C.yellow}${C.bold} PROBLEMA PARA CONTINUAR ${C.reset}`;
    default:
      return `${C.cyan}${spinner} RODANDO${C.reset}`;
  }
}

function lastTask(lines = []) {
  const meaningful = lines.filter(l => {
    const t = l.replace(/[\x00-\x1f\x7f]/g, '').trim();
    return t.length > 10 && !t.includes('bypass permissions') && !t.startsWith('─') && !t.startsWith('>');
  });
  const last = meaningful[meaningful.length - 1] || '';
  return last.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 60);
}

function pct(lines = []) {
  // estimate completion from line count — rough heuristic
  const n = lines.length;
  if (n === 0) return 0;
  if (n >= 100) return 100;
  return Math.min(95, Math.round(n / 100 * 100));
}

function bar(pctVal, width = 20) {
  const filled = Math.round(pctVal / 100 * width);
  return `${C.green}${'█'.repeat(filled)}${C.dim}${'░'.repeat(width - filled)}${C.reset}`;
}

function render() {
  const panes = r('_panel_panes.json', []);
  const output = r('_panel_output.json', {});
  const spin = SPINNER[tick % SPINNER.length];
  tick++;

  let out = C.clear;
  out += `${C.bold}${C.cyan}┌─────────────────────────────────────────────────────┐${C.reset}\n`;
  out += `${C.bold}${C.cyan}│  OCk Monitor  ${C.dim}${new Date().toLocaleTimeString('pt-BR')}${C.cyan}${' '.repeat(20)}│${C.reset}\n`;
  out += `${C.bold}${C.cyan}└─────────────────────────────────────────────────────┘${C.reset}\n\n`;

  let done = 0, total = 0;

  for (const pane of panes) {
    if (pane.id === 'chat') continue;
    total++;
    const lines = output[pane.id]?.lines || [];
    const status = detectStatus(lines);
    const task = lastTask(lines);
    const p = status === 'FINALIZADO' ? 100 : pct(lines);
    if (status === 'FINALIZADO') done++;

    out += `${C.bold}${C.white}${(pane.label || pane.id).padEnd(22)}${C.reset} ${statusLine(status, spin)}\n`;
    out += `  ${bar(p)} ${String(p).padStart(3)}%\n`;
    if (task) out += `  ${C.dim}↳ ${task}${C.reset}\n`;
    out += '\n';
  }

  // overall progress
  const overall = total > 0 ? Math.round(done / total * 100) : 0;
  out += `${C.bold}${C.cyan}─────────────────────────────────────────────────────${C.reset}\n`;
  out += `${C.bold}PROGRESSO GERAL  ${bar(overall, 30)} ${overall}%  (${done}/${total})${C.reset}\n`;

  process.stdout.write(out);
}

// hide cursor
process.stdout.write('\x1b[?25l');
process.on('exit', () => process.stdout.write('\x1b[?25h'));
process.on('SIGINT', () => { process.stdout.write('\x1b[?25h'); process.exit(); });

render();
setInterval(render, INTERVAL);
