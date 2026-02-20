export type StatusOrcamento = 'PENDENTE' | 'EM_ABERTO' | 'ENVIADO' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'CANCELADO' | 'FINALIZADO' | 'OBRA_INICIADA' | 'OBRA_FINALIZADA';

export type TipoServico = 'ambos' | 'mao_obra' | 'material';

export interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  email?: string;
  endereco: string;
  complemento?: string;
  bairrosCidadeEstado: string;
  cpfCnpj?: string;
  dadosCompletos?: boolean;
  dataCriacao?: string;
}

export interface Pagador {
  nome: string;
  telefone: string;
  email?: string;
  endereco: string;
  complemento?: string;
  bairrosCidadeEstado: string;
  cpfCnpj?: string;
  relacao: string;
}

export interface ItemOrcamento {
  nome: string;
  descricao: string;
  base: string;
  altura: string;
  usarPadrao: boolean;
  servicos: string[];
  tipoServico: TipoServico;
  valor: string;
  cobrarPorMetro?: boolean;
  fotoAntes: string | null;
  fotoDepois: string | null;
  incluirNoCalculo?: boolean;
  metroLinear?: boolean;
}

export interface Comodo {
  nome: string;
  observacoes?: string;
  servicos?: string[];
  tipoServico?: TipoServico;
  valor?: string;
  cobrarPorMetro?: boolean;
  itens: ItemOrcamento[];
  fotosAntes: string[];
  fotosDepois: string[];
  medidas: {
    altura: number;
    largura: number;
    comprimento: number;
  };
}

export interface Orcamento {
  id?: number;
  cliente: Cliente;
  pagadorDiferente: boolean;
  pagador?: Pagador;
  comodos: Comodo[];
  formasPagamento: string[];
  observacoes: string;
  formatoOrcamento: 'completo' | 'm2' | 'valor';
  status: StatusOrcamento;
  validade: number;
  dataPrevisaoInicio?: string;
  dataCriacao: string;
  dataModificacao: string;
  documentos?: Documento[];
  sincronizado?: boolean;
}

export interface Documento {
  id?: string;
  nome: string;
  tipo: 'foto' | 'pdf';
  data: string;
  url: string;
}

export interface Usuario {
  uid: string;
  email: string;
  nomeCompleto: string;
  telefone: string;
  dataNascimento: string;
  endereco?: string;
  cpfCnpj: string;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
}

export interface ConfigEmpresa {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cnpj: string;
  logo?: string;
  redesSociais?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  mensagemPadrao?: {
    cabecalho: string;
    rodape: string;
  };
}

export interface EventoAgenda {
  id?: number;
  orcamentoId: number;
  dataInicio?: string;
  titulo: string;
  bairro: string;
  telefoneCliente: string;
}
