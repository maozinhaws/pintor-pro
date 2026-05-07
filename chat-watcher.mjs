// chat-watcher.mjs — tail da sessao Claude JSONL, empurra msgs para painel como pane "chat"
// Uso: node chat-watcher.mjs
import { readFileSync, statSync, readdirSync } from 'fs';
import http from 'http';
import { join } from 'path';

const PORT = 3001;
const PROJ_DIR = 'C:\\Users\\DenisGSJ\\.claude\\projects\\D--Documentos-Projetos-Apps-Or-amento-Pintor-Plus-APK-backup-2026-03-27-FINAL-MVP';
const INTERVAL_MS = 2000;
const MAX_LINES = 200;
const PANE_ID = 'chat';

function post(path, data) {
  return new Promise(resolve => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost', port: PORT, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body, 'utf8') }
    };
    const req = http.request(opts, res => { res.on('data', () => {}); res.on('end', resolve); });
    req.on('error', () => resolve());
    req.write(body, 'utf8'); req.end();
  });
}

function getLatestJsonl() {
  try {
    const files = readdirSync(PROJ_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({ f, mtime: statSync(join(PROJ_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return files.length ? join(PROJ_DIR, files[0].f) : null;
  } catch { return null; }
}

function extractText(content) {
  if (!Array.isArray(content)) return null;
  const parts = content
    .filter(b => b.type === 'text' && typeof b.text === 'string' && b.text.trim())
    .map(b => b.text.trim());
  return parts.length ? parts.join('\n') : null;
}

function parseMessage(line) {
  try {
    const obj = JSON.parse(line);
    // user turn
    if (obj.type === 'user' && obj.message?.role === 'user') {
      const content = obj.message.content;
      if (typeof content === 'string' && content.trim()) return { role: 'user', text: content.trim() };
      if (Array.isArray(content)) {
        const text = extractText(content);
        if (text) return { role: 'user', text };
      }
    }
    // assistant turn
    if (obj.message?.role === 'assistant') {
      const text = extractText(obj.message.content);
      if (text) return { role: 'assistant', text };
    }
  } catch {}
  return null;
}

let currentFile = null;
let fileOffset = 0;
let chatLines = [];

function formatMsg(role, text, ts) {
  const time = new Date(ts || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const prefix = role === 'user' ? `[${time}] > ` : `[${time}] `;
  // truncate long assistant messages to first 3 lines
  const lines = text.split('\n').filter(l => l.trim());
  const shown = role === 'assistant' ? lines.slice(0, 5) : lines;
  return shown.map((l, i) => i === 0 ? prefix + l : '  ' + l).join('\n');
}

async function tick() {
  const latest = getLatestJsonl();
  if (!latest) return;

  // new session file
  if (latest !== currentFile) {
    console.log(`[chat-watcher] watching ${latest}`);
    currentFile = latest;
    fileOffset = 0;
    chatLines = ['── Nova sessao ──'];
  }

  try {
    const content = readFileSync(currentFile, 'utf8');
    const newContent = content.slice(fileOffset);
    if (!newContent) return;
    fileOffset = content.length;

    const lines = newContent.split('\n').filter(l => l.trim());
    let changed = false;
    for (const line of lines) {
      const msg = parseMessage(line);
      if (!msg) continue;
      const formatted = formatMsg(msg.role, msg.text);
      if (formatted) { chatLines.push(...formatted.split('\n')); changed = true; }
    }

    if (changed) {
      const trimmed = chatLines.slice(-MAX_LINES);
      chatLines = trimmed;
      await post('/api/output/reset', { paneId: PANE_ID, lines: trimmed, ts: new Date().toISOString() });
      console.log(`[chat-watcher] pushed ${trimmed.length} lines`);
    }
  } catch (e) { console.error('[chat-watcher]', e.message); }
}

// Register chat pane
async function registerPane() {
  try {
    const resp = await new Promise(resolve => {
      const req = http.request({ hostname: 'localhost', port: PORT, path: '/api/panes', method: 'GET' },
        res => { let b=''; res.on('data', c => b+=c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve([]); } }); });
      req.on('error', () => resolve([]));
      req.end();
    });
    const panes = Array.isArray(resp) ? resp : [];
    if (!panes.find(p => p.id === PANE_ID)) {
      panes.unshift({ id: PANE_ID, label: 'Chat', model: 'claude-sonnet-4-6', status: 'running' });
      await post('/api/panes', panes);
      console.log('[chat-watcher] pane "chat" registrado');
    }
  } catch {}
}

console.log('[chat-watcher] start');
registerPane().then(() => {
  tick();
  setInterval(tick, INTERVAL_MS);
});
