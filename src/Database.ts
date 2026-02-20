import Dexie, { Table } from 'dexie';
import { Orcamento, Cliente, ConfigEmpresa, EventoAgenda } from './types';

class OrcamentoDB extends Dexie {
  orcamentos!: Table<Orcamento, number>;
  clientes!: Table<Cliente, number>;
  config!: Table<{ key: string; value: any }, string>;
  agenda!: Table<EventoAgenda, number>;

  constructor() {
    super('OrcamentoDB');
    
    this.version(1).stores({
      orcamentos: '++id, cliente.nome, status, dataCriacao, dataPrevisaoInicio',
      clientes: '++id, nome, telefone, email',
      config: 'key',
      agenda: '++id, orcamentoId, dataInicio'
    });
  }

  async salvarOrcamento(orcamento: Orcamento): Promise<number> {
    if (!orcamento.id) {
      orcamento.dataCriacao = new Date().toISOString();
    }
    orcamento.dataModificacao = new Date().toISOString();
    
    if (orcamento.id) {
      await this.orcamentos.update(orcamento.id, orcamento);
      return orcamento.id;
    }
    return await this.orcamentos.add(orcamento);
  }

  async listarOrcamentos(): Promise<Orcamento[]> {
    return await this.orcamentos.reverse().sortBy('dataCriacao');
  }

  async buscarOrcamento(id: number): Promise<Orcamento | undefined> {
    return await this.orcamentos.get(id);
  }

  async excluirOrcamento(id: number): Promise<void> {
    await this.orcamentos.delete(id);
  }

  async pesquisarOrcamentos(termo: string): Promise<Orcamento[]> {
    const todos = await this.orcamentos.toArray();
    const termoLower = termo.toLowerCase();
    
    return todos.filter(orc => 
      orc.cliente.nome.toLowerCase().includes(termoLower) ||
      orc.cliente.bairrosCidadeEstado?.toLowerCase().includes(termoLower) ||
      orc.observacoes?.toLowerCase().includes(termoLower) ||
      orc.comodos.some(c => 
        c.nome.toLowerCase().includes(termoLower) ||
        c.observacoes?.toLowerCase().includes(termoLower)
      )
    );
  }

  async salvarCliente(cliente: Cliente): Promise<number> {
    if (!cliente.dataCriacao) {
      cliente.dataCriacao = new Date().toISOString();
    }
    
    if (cliente.id) {
      await this.clientes.update(cliente.id, cliente);
      return cliente.id;
    }
    return await this.clientes.add(cliente);
  }

  async listarClientes(): Promise<Cliente[]> {
    return await this.clientes.orderBy('nome').toArray();
  }

  async buscarCliente(id: number): Promise<Cliente | undefined> {
    return await this.clientes.get(id);
  }

  async excluirCliente(id: number): Promise<void> {
    await this.clientes.delete(id);
  }

  async salvarConfig(key: string, value: any): Promise<void> {
    await this.config.put({ key, value });
  }

  async buscarConfig(key: string): Promise<any> {
    const result = await this.config.get(key);
    return result?.value;
  }

  async salvarEvento(evento: EventoAgenda): Promise<number> {
    if (evento.id) {
      await this.agenda.update(evento.id, evento);
      return evento.id;
    }
    return await this.agenda.add(evento);
  }

  async listarEventos(): Promise<EventoAgenda[]> {
    return await this.agenda.toArray();
  }

  async excluirEvento(id: number): Promise<void> {
    await this.agenda.delete(id);
  }
}

export const db = new OrcamentoDB();
