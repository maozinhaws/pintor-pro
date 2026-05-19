import { createAppStorage } from '../storage';
import type { AppStorage } from '../storage/types';
import type { Cliente } from '../types';

export type ClientePersistido = Cliente & { id: string };

let storagePromise: Promise<AppStorage> | null = null;

async function getStorage(): Promise<AppStorage> {
  if (!storagePromise) {
    storagePromise = createAppStorage();
    const storage = await storagePromise;
    await storage.init();
  }
  return storagePromise;
}

function novoId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizarCliente(cliente: Cliente | ClientePersistido): ClientePersistido {
  return {
    ...cliente,
    id: 'id' in cliente && cliente.id ? cliente.id : novoId('cliente'),
    ts: cliente.ts || Date.now(),
  };
}

export async function listarClientes(): Promise<ClientePersistido[]> {
  return (await getStorage()).clientes.getAll();
}

export async function obterCliente(id: string): Promise<ClientePersistido | null> {
  return (await getStorage()).clientes.getById(id);
}

export async function salvarCliente(cliente: Cliente | ClientePersistido): Promise<ClientePersistido> {
  const persistido = normalizarCliente(cliente);
  await (await getStorage()).clientes.upsert(persistido);
  return persistido;
}

export async function salvarClientes(clientes: Array<Cliente | ClientePersistido>): Promise<ClientePersistido[]> {
  const persistidos = clientes.map(normalizarCliente);
  await (await getStorage()).clientes.bulkUpsert(persistidos);
  return persistidos;
}

export async function removerCliente(id: string): Promise<void> {
  await (await getStorage()).clientes.remove(id);
}

export async function limparClientes(): Promise<void> {
  await (await getStorage()).clientes.clear();
}

export const clientesService = {
  listar: listarClientes,
  obter: obterCliente,
  salvar: salvarCliente,
  salvarTodos: salvarClientes,
  remover: removerCliente,
  limpar: limparClientes,
};
