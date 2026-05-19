import { createAppStorage } from '../storage';
import type { AppStorage } from '../storage/types';
import type { Fornecedor } from '../types';

export type FornecedorPersistido = Fornecedor & { id: string };

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

function normalizarFornecedor(fornecedor: Fornecedor | FornecedorPersistido): FornecedorPersistido {
  return {
    ...fornecedor,
    id: 'id' in fornecedor && fornecedor.id ? fornecedor.id : novoId('fornecedor'),
    ts: fornecedor.ts || Date.now(),
  };
}

export async function listarFornecedores(): Promise<FornecedorPersistido[]> {
  return (await getStorage()).fornecedores.getAll();
}

export async function obterFornecedor(id: string): Promise<FornecedorPersistido | null> {
  return (await getStorage()).fornecedores.getById(id);
}

export async function salvarFornecedor(fornecedor: Fornecedor | FornecedorPersistido): Promise<FornecedorPersistido> {
  const persistido = normalizarFornecedor(fornecedor);
  await (await getStorage()).fornecedores.upsert(persistido);
  return persistido;
}

export async function salvarFornecedores(
  fornecedores: Array<Fornecedor | FornecedorPersistido>,
): Promise<FornecedorPersistido[]> {
  const persistidos = fornecedores.map(normalizarFornecedor);
  await (await getStorage()).fornecedores.bulkUpsert(persistidos);
  return persistidos;
}

export async function removerFornecedor(id: string): Promise<void> {
  await (await getStorage()).fornecedores.remove(id);
}

export async function limparFornecedores(): Promise<void> {
  await (await getStorage()).fornecedores.clear();
}

export const fornecedoresService = {
  listar: listarFornecedores,
  obter: obterFornecedor,
  salvar: salvarFornecedor,
  salvarTodos: salvarFornecedores,
  remover: removerFornecedor,
  limpar: limparFornecedores,
};
