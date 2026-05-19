# Handoff: Storage Dexie

Data: 2026-05-12
Agente: Hermes Storage Dexie
Branch: `feature/storage-sqlite-dexie-offline`

## Resumo

- Atualizacao Codex 2026-05-12: `package.json` agora possui dependencia `dexie`.
- Para nao quebrar build, `src/storage/db.dexie.ts` foi preparado com IndexedDB nativo, mantendo a fabrica `createWebDexieStorage()` e os contratos atuais.
- A troca para Dexie real deve ficar concentrada em `src/storage/db.dexie.ts` e `src/storage/repositories/indexedDbRepository.ts` quando a dependencia for adicionada.
- Nenhum dado de dominio novo usa `localStorage`; os usos restantes neste escopo sao apenas purge de chaves legadas.

## Arquivos alterados

- `src/storage/db.dexie.ts`
- `src/storage/repositories/indexedDbRepository.ts`
- `src/storage/repositories/configRepository.ts`
- `src/storage/repositories/orcamentosRepository.ts`
- `src/storage/repositories/clientesRepository.ts`
- `src/storage/repositories/fornecedoresRepository.ts`
- `src/storage/repositories/eventosRepository.ts`
- `src/storage/repositories/index.ts`
- `src/services/orcamentos.ts`
- `src/services/clientes.ts`
- `src/services/fornecedores.ts`
- `src/services/eventos.ts`
- `src/services/config.ts`
- `src/services/index.ts`
- `docs/handoffs/storage-dexie.md`

## Implementado

- Repositories CRUD para:
  - orcamentos
  - clientes
  - fornecedores
  - eventos
  - config
- Services finos para cada dominio com API async.
- IndexedDB stores criadas na versao `STORAGE_SCHEMA_VERSION`.
- `exportSnapshot()` e `importSnapshot()` para dados de dominio.
- Normalizacao de `id` para clientes e fornecedores sem mudar `src/storage/types.ts`.
- Purge controlada das chaves legadas definidas em `src/storage/schema.ts`.

## Comandos rodados

- `git status --short --branch`
- `Get-Content -Raw package.json`
- `Get-Content -Raw src\\storage\\types.ts`
- `Get-Content -Raw src\\storage\\schema.ts`
- `Get-Content -Raw src\\storage\\db.dexie.ts`
- `Get-Content -Raw src\\storage\\index.ts`
- `Get-Content -Raw src\\services\\index.ts`
- `Get-Content -Raw tsconfig.json`
- `npm run build`
- `rg "localStorage|sessionStorage" src\\storage src\\services -n`

## Resultado de build

- `npm run build` passou.

## Riscos e bloqueios

- Dependencia `dexie` instalada, mas implementacao atual ainda usa IndexedDB nativo para manter build verde.
- Services ainda nao estao conectados na UI legada; o proximo agente precisa trocar writes diretos de `localStorage` por estes services.
- `src/storage/index.ts` seleciona SQLite no Android nativo e usa o adapter web como fallback.
- `src/storage/db.sqlite.ts` parece estar em evolucao por outro agente; nao foi alterado por este handoff.
- Teste de runtime no navegador ainda pendente; foi validado apenas build TypeScript/Vite.

## Proximas tarefas

- Substituir o wrapper IndexedDB nativo por Dexie real ou manter como fallback documentado.
- Integrar UI/estado legado aos services.
- Validar CRUD manual no navegador e persistencia apos reload.
