import http from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PORT = 3001;
const BASE = process.cwd();
const Q = join(BASE, '_panel_queue.json');
const O = join(BASE, '_panel_output.json');
const P = join(BASE, '_panel_panes.json');

const r = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } };
const w = (f, d) => writeFileSync(f, JSON.stringify(d, null, 2), 'utf8');

// SSE clients
const clients = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => { try { c.write(msg); } catch { clients.delete(c); } });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url || '/';
  const json = (d, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(d)); };
  const body = cb => { const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => { try { cb(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { json({ error: 'bad json' }, 400); } }); };

  // SSE stream
  if (url === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.write(`event: init\ndata: ${JSON.stringify({ output: r(O, {}), queue: r(Q, []), panes: r(P, []) })}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (url === '/api/status') { json({ queue: r(Q, []), output: r(O, {}), panes: r(P, []) }); }
  else if (url === '/api/command' && req.method === 'POST') {
    body(data => {
      const q = r(Q, []); q.push({ id: Date.now(), ...data, status: 'pending' }); w(Q, q);
      broadcast('queue', q); json({ ok: true });
    });
  }
  else if (url.startsWith('/api/command/') && req.method === 'DELETE') {
    const id = url.split('/').pop();
    const q = r(Q, []).filter(c => String(c.id) !== id); w(Q, q);
    broadcast('queue', q); json({ ok: true });
  }
  else if (url.startsWith('/api/command/') && req.method === 'PATCH') {
    const id = url.split('/').pop();
    body(data => { const q = r(Q, []).map(c => String(c.id) === id ? { ...c, ...data } : c); w(Q, q); broadcast('queue', q); json({ ok: true }); });
  }
  else if (url === '/api/output' && req.method === 'POST') {
    body(data => {
      const o = r(O, {});
      const ts = new Date().toISOString();
      const MAX = 500;
      // append mode: accumulate history with separator, trim to MAX lines
      const prev = o[data.paneId]?.lines || [];
      const sep = `── ${ts.slice(0,19).replace('T',' ')} ──`;
      const merged = prev.length
        ? [...prev, sep, ...data.lines].slice(-MAX)
        : data.lines.slice(-MAX);
      o[data.paneId] = { lines: merged, ts };
      w(O, o);
      broadcast('output', { paneId: data.paneId, lines: merged, ts });
      json({ ok: true });
    });
  }
  else if (url === '/api/output/reset' && req.method === 'POST') {
    body(data => {
      const o = r(O, {});
      const ts = new Date().toISOString();
      if (data.paneId) { o[data.paneId] = { lines: data.lines || [], ts }; }
      else { Object.keys(o).forEach(k => { o[k] = { lines: [], ts }; }); }
      w(O, o);
      broadcast('output', { paneId: data.paneId || '__all__', lines: o[data.paneId]?.lines || [], ts });
      json({ ok: true });
    });
  }
  else if (url === '/api/panes' && req.method === 'GET') { json(r(P, [])); }
  else if (url === '/api/panes' && req.method === 'POST') {
    body(data => { w(P, data); broadcast('panes', data); json({ ok: true }); });
  }
  else { json({ error: 'not found' }, 404); }
});

server.listen(PORT, () => console.log(`[Panel API + SSE] http://localhost:${PORT}`));
// Heartbeat to keep SSE alive through ngrok
setInterval(() => clients.forEach(c => { try { c.write(': ping\n\n'); } catch { clients.delete(c); } }), 25000);
