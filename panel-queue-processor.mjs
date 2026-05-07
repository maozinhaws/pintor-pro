// panel-queue-processor.mjs — lê _panel_queue.json, processa READ_OUTPUT pendentes
// Chamado pelo orquestrador. Não pode ler panes Overclock (isso é responsabilidade do orquestrador).
// O que faz: marca READ_OUTPUT como "processado pelo orquestrador" e limpa da fila.
// Para ler panes reais, o orquestrador deve chamar mcp__overclock__pane_read e depois push-output.mjs.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import http from 'http';

const PORT = 3001;
const BASE = process.cwd();
const Q = `${BASE}/_panel_queue.json`;

function r(f, d) { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return d; } }
function w(f, d) { writeFileSync(f, JSON.stringify(d, null, 2), 'utf8'); }

function post(path, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: 'localhost', port: PORT, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body, 'utf8') }
    };
    const req = http.request(opts, res => { let b=''; res.on('data', c => b+=c); res.on('end', () => resolve(b)); });
    req.on('error', () => resolve(null));
    req.write(body, 'utf8'); req.end();
  });
}

async function main() {
  const queue = r(Q, []);
  const pending = queue.filter(c => c.status === 'pending');
  if (!pending.length) { console.log('queue: empty'); return; }

  const readOutputCmds = pending.filter(c => c.command === 'READ_OUTPUT');
  const otherCmds = pending.filter(c => c.command !== 'READ_OUTPUT');

  console.log(`queue: ${pending.length} pending (${readOutputCmds.length} READ_OUTPUT, ${otherCmds.length} other)`);

  // Report READ_OUTPUT requests to orquestrador via a sentinel output line
  if (readOutputCmds.length) {
    const paneIds = [...new Set(readOutputCmds.map(c => c.paneId))];
    console.log(`READ_OUTPUT requested for panes: ${paneIds.join(', ')}`);
    console.log('ACAO_REQUERIDA: orquestrador deve ler esses panes e rodar push-output.mjs');

    // Remove READ_OUTPUT from queue (processed)
    const newQueue = queue.filter(c => !(c.command === 'READ_OUTPUT' && c.status === 'pending'));
    w(Q, newQueue);
    await post('/api/queue', newQueue);
  }

  // Other commands: leave for orchestrator to handle
  if (otherCmds.length) {
    console.log(`Outros comandos pendentes (para orquestrador executar via pane_write):`);
    otherCmds.forEach(c => console.log(`  [${c.paneId}] ${c.command}`));
  }
}

main().catch(console.error);
