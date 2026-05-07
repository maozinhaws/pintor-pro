// auto-refresh.mjs — re-broadcast stored output para SSE clients a cada 2s
// Não lê panes Overclock (isso é responsabilidade do orquestrador).
// Garante que clientes novos/reconectados veem dados atuais rápido.
import { readFileSync } from 'fs';
import http from 'http';

const PORT = 3001;
const BASE = process.cwd();
const INTERVAL_MS = 2000;

function r(f, d) { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } }

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

let lastHash = '';

async function tick() {
  const output = r(`${BASE}/_panel_output.json`, {});
  const hash = JSON.stringify(Object.entries(output).map(([k, v]) => [k, v.ts]));
  if (hash === lastHash) return; // no change, skip broadcast
  lastHash = hash;

  const panes = r(`${BASE}/_panel_panes.json`, []);
  await post('/api/panes', panes);
  for (const [paneId, data] of Object.entries(output)) {
    await post('/api/output/reset', { paneId, lines: data.lines, ts: data.ts });
  }
  console.log(`[auto-refresh] broadcast ${Object.keys(output).length} panes @ ${new Date().toISOString()}`);
}

console.log(`[auto-refresh] start — interval ${INTERVAL_MS}ms`);
setInterval(tick, INTERVAL_MS);
tick(); // immediate first run
