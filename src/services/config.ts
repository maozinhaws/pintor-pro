import { createAppStorage } from '../storage';
import type { AppStorage } from '../storage/types';
import type { Config } from '../types';

let storagePromise: Promise<AppStorage> | null = null;

async function getStorage(): Promise<AppStorage> {
  if (!storagePromise) {
    storagePromise = createAppStorage();
    const storage = await storagePromise;
    await storage.init();
  }
  return storagePromise;
}

export async function obterConfig(): Promise<Config | null> {
  return (await getStorage()).config.get();
}

export async function salvarConfig(config: Config): Promise<void> {
  await (await getStorage()).config.set(config);
}

export async function limparConfig(): Promise<void> {
  await (await getStorage()).config.clear();
}

export const configService = {
  obter: obterConfig,
  salvar: salvarConfig,
  limpar: limparConfig,
};
