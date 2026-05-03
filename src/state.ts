import type { Orcamento, Cliente, Fornecedor, Evento, Config, Room, ValueMode } from './types';

const DEFAULT_CONFIG: Config = {
  empresa: '', tel: '', doc: '', emailEmpresa: '', endEmpresa: '',
  msg: 'Olá {cliente}!\nSegue o resumo do seu orçamento:\n\n{detalhes}\n*Valor Total: {total}*\n\nQualquer dúvida estou à disposição.',
  servicos: 'Lixamento, Pintura, Massa corrida, Selador, Textura, Verniz',
  pgto: 'PIX, Dinheiro, Cartão de Crédito, Cartão de Débito, Boleto, Parcelado',
  statusList: 'Pendente, Enviado, Aprovado, Concluído, Recusado',
  logo: '', acessibilidade: false,
  flashNomes: 'Quarto, Sala, Cozinha, Banheiro, Varanda, Fachada, Muro, Teto, Porta, Janela, Corredor, Escada, Garagem, Área de Serviço, Escritório, Quintal',
  flashServicos: 'Lixar, Massa corrida, Selador/Primer, 2 demãos, 3 demãos, Textura, Grafiato, Corrigir trinca, Remover ferragem, Pintura externa, Pintura interna, Fundo preparador, Rejunte',
  flashMateriais: 'Tinta látex, Tinta acrílica, Tinta esmalte, Lixa, Massa corrida, Primer/Selador, Fita crepe, Rolo de lã, Rolo textura, Pincel, Espátula, Solvente',
};

function ppRead<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export const S = {
  orcs: ppRead<Orcamento[]>('pp-orcs', []),
  clientes: ppRead<Cliente[]>('pp-clientes', []),
  fornecedores: ppRead<Fornecedor[]>('pp-fornecedores', []),
  eventos: ppRead<Evento[]>('pp-eventos', []),
  rooms: [] as Room[],
  pgto: new Set<string>(),
  fmt: 'completo' as 'completo' | 'area' | 'simples',
  pagador: false,
  editId: null as string | null,
  curStep: 1,
  config: ppRead<Config>('pp-config', null as unknown as Config) || { ...DEFAULT_CONFIG },
  DEFAULT_SERVICES: [] as string[],
  statusArr: [] as string[],
  isDirty: false,
  tempItem: null as any,
};

// Fix legacy config
if (S.config.logo === 'https://lh3.googleusercontent.com/d/1mwtQDispSbBU3HBvLa0T46vOoHAmWNNN') {
  S.config.logo = '';
  localStorage.setItem('pp-config', JSON.stringify(S.config));
}
if (S.config.msg && !S.config.msg.includes('{total}')) {
  S.config.msg += '\n\n*Valor Total: {total}*';
  localStorage.setItem('pp-config', JSON.stringify(S.config));
}
if (S.config.acessibilidade) document.body.classList.add('acessivel');

S.DEFAULT_SERVICES = (S.config.servicos || DEFAULT_CONFIG.servicos).split(',').map(s => s.trim()).filter(Boolean);
S.statusArr = (S.config.statusList || DEFAULT_CONFIG.statusList).split(',').map(s => s.trim()).filter(Boolean);

export function saveOrcs() {
  const json = JSON.stringify(S.orcs);
  try { localStorage.setItem('pp-orcs', json); }
  catch (e) {
    console.error('_saveOrcs: localStorage cheio', e);
    try { sessionStorage.setItem('pp-orcs-emergency', json); } catch {}
    // @ts-ignore toast will be available globally
    if (typeof toast === 'function') toast('<svg class="ico" aria-hidden="true"><use href="#ico-alert"/></svg> Armazenamento local cheio!');
  }
  try { sessionStorage.setItem('pp-orcs-mirror', json); } catch {}
}
