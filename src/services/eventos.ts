import { createAppStorage } from '../storage';
import type { AppStorage } from '../storage/types';
import type { Evento } from '../types';

let storagePromise: Promise<AppStorage> | null = null;

async function getStorage(): Promise<AppStorage> {
  if (!storagePromise) {
    storagePromise = createAppStorage();
    const storage = await storagePromise;
    await storage.init();
  }
  return storagePromise;
}

export async function listarEventos(): Promise<Evento[]> {
  return (await getStorage()).eventos.getAll();
}

export async function obterEvento(id: string): Promise<Evento | null> {
  return (await getStorage()).eventos.getById(id);
}

export async function salvarEvento(evento: Evento): Promise<void> {
  await (await getStorage()).eventos.upsert({
    ...evento,
    ts: evento.ts || Date.now(),
  });
}

export async function salvarEventos(eventos: Evento[]): Promise<void> {
  await (await getStorage()).eventos.bulkUpsert(
    eventos.map((evento) => ({ ...evento, ts: evento.ts || Date.now() })),
  );
}

export async function removerEvento(id: string): Promise<void> {
  await (await getStorage()).eventos.remove(id);
}

export async function limparEventos(): Promise<void> {
  await (await getStorage()).eventos.clear();
}

export const eventosService = {
  listar: listarEventos,
  obter: obterEvento,
  salvar: salvarEvento,
  salvarTodos: salvarEventos,
  remover: removerEvento,
  limpar: limparEventos,
};
