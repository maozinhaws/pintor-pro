export interface Item {
  name: string;
  alt: number;
  comp: number;
  services: string[];
  price: number;
  perMeter: boolean;
  obs: string;
  photos: string[];
}

export interface Room {
  id: string;
  name: string;
  alt: number;
  comp: number;
  items: Item[];
  services: string[];
  collapsed: boolean;
  preco: number;
  precoPerM2: boolean;
}

export interface Orcamento {
  id: string;
  nome: string;
  apelido: string;
  tel: string;
  email: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  comp: string;
  bairro: string;
  cidade: string;
  end: string;
  pagNome: string;
  pagTel: string;
  pagEnd: string;
  pagador: boolean;
  rooms: Room[];
  pgto: string[];
  fmt: 'completo' | 'area' | 'simples';
  preco: number;
  status: string;
  valid: string;
  tipoServico: string;
  inicio: string;
  obs: string;
  date: string;
  ts: number;
  tsEdit: number;
  rascunho?: boolean;
  isFlashDraft?: boolean;
}

export interface Cliente {
  nome: string;
  apelido: string;
  tel: string;
  email: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  comp: string;
  bairro: string;
  cidade: string;
  end: string;
  ts?: number;
}

export interface Fornecedor {
  nome: string;
  tel: string;
  servico: string;
  obs: string;
  cat?: string;
  ts?: number;
}

export interface Evento {
  id: string;
  nome: string;
  data: string;
  hora: string;
  obs: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  orcId?: string;
  alarm?: boolean;
  ts?: number;
}

export interface Config {
  empresa: string;
  tel: string;
  doc: string;
  emailEmpresa: string;
  endEmpresa: string;
  msg: string;
  servicos: string;
  pgto: string;
  statusList: string;
  logo: string;
  assinatura?: string;
  acessibilidade: boolean;
  flashNomes: string;
  flashServicos: string;
  flashMateriais: string;
  nome?: string;
  email?: string;
  cnpj?: string;
  end?: string;
  skipDelConfirm?: boolean;
  skipDirtyConfirm?: boolean;
}

export type ValueMode = 'total' | 'm2' | null;
export type MessageFormat = 'completo' | 'area' | 'simples';
