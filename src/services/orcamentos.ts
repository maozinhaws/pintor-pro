import { createAppStorage } from '../storage';
import type { AppStorage } from '../storage/types';
import type { Orcamento, HistoricoOrcamentoEntry } from '../types';

let storagePromise: Promise<AppStorage> | null = null;

async function getStorage(): Promise<AppStorage> {
  if (!storagePromise) {
    storagePromise = createAppStorage();
    const storage = await storagePromise;
    await storage.init();
  }
  return storagePromise;
}

export async function listarOrcamentos(): Promise<Orcamento[]> {
  return (await getStorage()).orcamentos.getAll();
}

export async function obterOrcamento(id: string): Promise<Orcamento | null> {
  return (await getStorage()).orcamentos.getById(id);
}

export async function salvarOrcamento(orcamento: Orcamento): Promise<void> {
  await (await getStorage()).orcamentos.upsert(orcamento);
}

export async function salvarOrcamentos(orcamentos: Orcamento[]): Promise<void> {
  await (await getStorage()).orcamentos.bulkUpsert(orcamentos);
}

export async function removerOrcamento(id: string): Promise<void> {
  await (await getStorage()).orcamentos.remove(id);
}

export async function limparOrcamentos(): Promise<void> {
  await (await getStorage()).orcamentos.clear();
}

/**
 * Constrói entradas de histórico comparando versão anterior com nova
 */
export function buildHistoricoEntries(anterior: Orcamento | null, novo: Orcamento): HistoricoOrcamentoEntry[] {
  const entries: HistoricoOrcamentoEntry[] = [];
  const timestamp = Date.now();

  if (!anterior) {
    entries.push({
      timestamp,
      campo: 'criado',
      valorAnterior: null,
      valorNovo: novo.id,
      usuario: 'sistema',
    });
    return entries;
  }

  const simpleFields: (keyof Orcamento)[] = [
    'nome', 'tel', 'email', 'status', 'obs', 'preco',
    'precoAdicionalM2', 'fmt', 'mode',
  ];

  simpleFields.forEach(campo => {
    const antValor = anterior[campo];
    const novoValor = novo[campo];
    if (antValor !== novoValor) {
      entries.push({
        timestamp,
        campo: campo as string,
        valorAnterior: antValor,
        valorNovo: novoValor,
        usuario: 'sistema',
      });
    }
  });

  const antTotal = calcularTotalOrcamento(anterior);
  const novoTotal = calcularTotalOrcamento(novo);
  if (antTotal !== novoTotal) {
    entries.push({
      timestamp,
      campo: 'total',
      valorAnterior: antTotal,
      valorNovo: novoTotal,
      usuario: 'sistema',
    });
  }

  const antRooms = (anterior.rooms || []).length;
  const novoRooms = (novo.rooms || []).length;
  if (antRooms !== novoRooms) {
    entries.push({
      timestamp,
      campo: 'ambientes',
      valorAnterior: antRooms,
      valorNovo: novoRooms,
      usuario: 'sistema',
    });
  }

  const antItens = (anterior.rooms || []).reduce((sum, r) => sum + (r.items || []).length, 0);
  const novoItens = (novo.rooms || []).reduce((sum, r) => sum + (r.items || []).length, 0);
  if (antItens !== novoItens) {
    entries.push({
      timestamp,
      campo: 'itens',
      valorAnterior: antItens,
      valorNovo: novoItens,
      usuario: 'sistema',
    });
  }

  return entries;
}

/**
 * Calcula o total de um orçamento
 */
export function calcularTotalOrcamento(orc: Orcamento): number {
  let tot = 0;
  let totalM2 = 0;

  (orc.rooms || []).forEach(r => {
    const alt = parseFloat(String(r.alt)) || 0;
    const comp = parseFloat(String(r.comp)) || 0;
    const measArea = (alt * comp) + alt + comp;
    totalM2 += measArea;

    if (r.preco) {
      tot += r.precoPerM2 ? (r.preco * measArea) : r.preco;
    }

    (r.items || []).forEach(it => {
      if (it.price) {
        const itemArea = (parseFloat(String(it.alt)) || 0) * (parseFloat(String(it.comp)) || 0) ||
                        parseFloat(String(it.alt)) || parseFloat(String(it.comp));
        tot += it.perMeter ? (it.price * itemArea) : it.price;
      }
    });
  });

  if (orc.preco && totalM2) {
    tot += orc.preco * totalM2;
  }

  return tot;
}

/**
 * Formata entrada de histórico para exibição
 */
export function formatHistoricoEntrada(entrada: HistoricoOrcamentoEntry): string {
  const data = new Date(entrada.timestamp);
  const dataStr = data.toLocaleDateString('pt-BR');
  const horaStr = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const campoLabel = getCampoLabel(entrada.campo);
  const antStr = formatarValorHistorico(entrada.valorAnterior);
  const novoStr = formatarValorHistorico(entrada.valorNovo);

  return `${dataStr} ${horaStr} - ${campoLabel}: ${antStr} → ${novoStr}`;
}

function getCampoLabel(campo: string): string {
  const labels: Record<string, string> = {
    nome: 'Nome',
    tel: 'Telefone',
    email: 'Email',
    status: 'Status',
    obs: 'Observações',
    preco: 'Preço',
    precoAdicionalM2: 'Preço m²',
    fmt: 'Formato',
    mode: 'Modo',
    total: 'Total',
    ambientes: 'Ambientes',
    itens: 'Itens',
    criado: 'Criado',
  };
  return labels[campo] || campo;
}

function formatarValorHistorico(valor: any): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'number' && valor > 100) {
    return `R$ ${valor.toFixed(2)}`;
  }
  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não';
  }
  return String(valor);
}

/**
 * Agrupa entradas de histórico por dia
 */
export function agruparHistoricoPorDia(historico: HistoricoOrcamentoEntry[]): Map<string, HistoricoOrcamentoEntry[]> {
  const grupos = new Map<string, HistoricoOrcamentoEntry[]>();

  historico.forEach(entrada => {
    const data = new Date(entrada.timestamp);
    const dia = data.toLocaleDateString('pt-BR');

    if (!grupos.has(dia)) {
      grupos.set(dia, []);
    }
    grupos.get(dia)!.push(entrada);
  });

  return grupos;
}

/**
 * Obtém últimas N entradas de histórico
 */
export function ultimasEntradasHistorico(historico: HistoricoOrcamentoEntry[], limite: number = 5): HistoricoOrcamentoEntry[] {
  return historico.slice(-limite).reverse();
}

export const orcamentosService = {
  listar: listarOrcamentos,
  obter: obterOrcamento,
  salvar: salvarOrcamento,
  salvarTodos: salvarOrcamentos,
  remover: removerOrcamento,
  limpar: limparOrcamentos,
  buildHistorico: buildHistoricoEntries,
  calcularTotal: calcularTotalOrcamento,
  formatarHistorico: formatHistoricoEntrada,
  agruparPorDia: agruparHistoricoPorDia,
  ultimasEntradas: ultimasEntradasHistorico,
};
