// push-output.mjs — lê _panel_output.json e _panel_panes.json, faz POST para panel-server
// Uso: node push-output.mjs
import { readFileSync } from 'fs';
import http from 'http';

const PORT = 3001;
const BASE = process.cwd();

function r(f, d) {
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; }
}

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost', port: PORT, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body, 'utf8') }
    };
    const req = http.request(opts, res => { let b=''; res.on('data', c => b+=c); res.on('end', () => resolve(b)); });
    req.on('error', reject);
    req.write(body, 'utf8');
    req.end();
  });
}

async function main() {
  const reset = process.argv.includes('--reset');
  const output = r(`${BASE}/_panel_output.json`, {});
  const panes = r(`${BASE}/_panel_panes.json`, []);

  await post('/api/panes', panes);
  console.log(`panes: ${panes.length}`);

  const endpoint = reset ? '/api/output/reset' : '/api/output';
  for (const [paneId, data] of Object.entries(output)) {
    await post(endpoint, { paneId, lines: data.lines, ts: data.ts });
    console.log(`${reset ? 'reset' : 'append'}: ${paneId} (${data.lines?.length} lines)`);
  }
  console.log('done');
}

main().catch(console.error);
