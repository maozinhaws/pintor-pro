# Hermes Task Board - Migracao SQLite/Dexie

Data: 2026-05-12
Base: `docs/PLANO_MIGRACAO_SQLITE_DEXIE_HERMES.md`
Branch alvo: `feature/storage-sqlite-dexie-offline`

## Ordem de Execucao

1. Codex Orchestrator cria branch, estrutura de pastas e contratos minimos.
2. Claude Code implementa storage Dexie e repositories.
3. Gemini Code valida SQLite/Capacitor Android.
4. Codex integra UI legada aos services.
5. Claude Code implementa media, backup e sync queue.
6. Gemini Code implementa feedback e matriz QA.
7. Codex faz revisao final, build e merge checklist.

## Codex - Orchestrator / Integrador Principal

Modelo sugerido: GPT-5.3 Codex ou GPT-5.4, reasoning high para integracao.

Responsabilidade:

- manter branch e protocolo anti-overlap;
- criar estrutura inicial;
- revisar handoffs dos outros agentes;
- integrar mudancas conflitantes;
- manter build verde.

Arquivos:

- `docs/HERMES_TASK_BOARD.md`
- `docs/handoffs/**`
- `src/storage/index.ts`
- `src/services/index.ts`
- arquivos compartilhados somente quando necessario: `package.json`, `src/types.ts`, `src/state.ts`

Tarefas:

- criar branch `feature/storage-sqlite-dexie-offline`;
- criar `docs/handoffs/`;
- criar skeleton `src/storage/` e `src/services/`;
- definir interfaces minimas para repositories;
- criar checklist de usos permitidos de `localStorage`;
- coordenar sequencia dos agentes.

Entregavel:

- branch pronta;
- contratos minimos;
- handoff inicial para Claude/Gemini;
- build ainda passando.

## Claude Code - Storage Dexie e Repositories

Modelo sugerido: Claude Sonnet 4.5 para implementacao; Opus se quiser revisao arquitetural mais profunda.

Responsabilidade:

- criar camada Dexie/IndexedDB;
- criar repositories de dominio;
- preparar contrato compativel com SQLite.

Arquivos:

- `src/storage/types.ts`
- `src/storage/schema.ts`
- `src/storage/db.dexie.ts`
- `src/storage/repositories/**`
- `src/services/config.ts`
- `src/services/orcamentos.ts`
- `src/services/clientes.ts`
- `src/services/fornecedores.ts`
- `src/services/eventos.ts`
- `docs/handoffs/storage-dexie.md`

Tarefas:

- instalar/assumir Dexie como dependencia web;
- modelar stores Dexie;
- implementar CRUD para orcamentos, clientes, fornecedores, eventos e config;
- implementar purge de `localStorage` legado;
- criar adapter selector com fallback controlado;
- documentar riscos e lacunas.

Nao editar:

- `app.html`
- `src/ui.ts`
- `src/budgets.ts`
- `android/**`

Aceite:

- CRUD funciona em navegador;
- reload preserva dados no IndexedDB;
- nenhum novo `localStorage` para dominio.

## Gemini Code - Android SQLite / Capacitor

Modelo sugerido: Gemini 2.5 Pro para Android/Gradle/Capacitor.

Responsabilidade:

- configurar SQLite no Android;
- validar build e runtime Android;
- cuidar de detalhes Gradle/Capacitor.

Arquivos:

- `package.json`
- `capacitor.config.ts`
- `android/**`
- `src/storage/db.sqlite.ts`
- `docs/handoffs/android-sqlite.md`

Tarefas:

- escolher e configurar plugin SQLite Capacitor;
- adicionar dependencias;
- criar migrations SQL;
- implementar adapter SQLite com a mesma interface do Dexie;
- validar `npx cap sync android`;
- validar `./gradlew.bat assembleDebug`.

Nao editar:

- UI;
- services de dominio sem alinhamento com Codex/Claude.

Aceite:

- Android usa SQLite quando plugin disponivel;
- app abre e persiste dados apos reiniciar;
- build Android debug conclui.

## Codex - UI Legacy Integration

Modelo sugerido: GPT-5.3 Codex high.

Responsabilidade:

- substituir persistencia direta por services;
- manter UI legada intacta;
- reduzir acoplamento de `S`.

Arquivos:

- `src/state.ts`
- `src/budgets.ts`
- `src/clients.ts`
- `src/agenda.ts`
- `src/appConfig.ts`
- `src/ui.ts`
- `src/main.ts`
- `docs/handoffs/ui-integration.md`

Tarefas:

- carregar estado inicial via services;
- trocar writes de `localStorage` por chamadas async;
- preservar handlers globais em `window`;
- manter `S` como cache runtime;
- atualizar backup/export para ler do repository;
- documentar usos restantes de storage browser.

Aceite:

- orcamentos/clientes/fornecedores/eventos/config persistem no novo storage;
- app continua visualmente igual;
- build passa.

## Claude Code - Media, Backup e Sync Queue

Modelo sugerido: Claude Sonnet 4.5.

Responsabilidade:

- implementar media local;
- implementar fila offline;
- implementar backup Drive/local.

Arquivos:

- `src/services/media.ts`
- `src/services/syncQueue.ts`
- `src/services/backup.ts`
- `src/storage/repositories/mediaRepository.ts`
- `src/storage/repositories/syncQueueRepository.ts`
- `docs/handoffs/media-sync.md`

Tarefas:

- persistir fotos/PDFs como media, nao base64 dentro do orcamento;
- gerar thumbnails;
- criar toggle "salvar na galeria";
- enfileirar uploads quando offline;
- implementar backup periodico estilo WhatsApp;
- manter restore manual.

Aceite:

- foto aparece apos reload;
- PDF entra no fluxo de media;
- offline gera tarefas pendentes;
- online processa fila.

## Gemini Code - Feedback e QA

Modelo sugerido: Gemini 2.5 Pro ou Gemini Code Assist.

Responsabilidade:

- implementar feedback;
- criar matriz de QA;
- validar Android/PWA.

Arquivos:

- `src/services/feedback.ts`
- UI coordenada com Codex em `src/appConfig.ts` ou `src/ui.ts`
- `docs/QA_STORAGE_SYNC.md`
- `docs/handoffs/feedback-qa.md`

Tarefas:

- criar feedback offline-first;
- anexar logs e arquivos via MediaService;
- mascarar dados sensiveis;
- criar fila de envio;
- escrever matriz de testes Android, Chrome e Safari iOS;
- listar known issues.

Aceite:

- feedback pode ser criado offline;
- envio pendente entra na queue;
- logs nao vazam CPF/CNPJ/telefone completo;
- QA documentado.

## Gemini ou Claude - Reviewer

Modelo sugerido:

- Gemini 2.5 Pro para revisar Android/build;
- Claude Opus/Sonnet para revisar arquitetura e regressao;
- Codex para revisar diff real e corrigir.

Tarefas:

- revisar diffs por fase;
- procurar writes diretos a `localStorage`;
- procurar media em base64 persistida;
- validar que UI nao mudou sem necessidade;
- revisar riscos de concorrencia entre adapters.

## Prompt Base para Qualquer Agente

```txt
Voce esta trabalhando no projeto Pintor Plus MVP, branch feature/storage-sqlite-dexie-offline, sob o protocolo Hermes.

Leia primeiro:
- docs/PLANO_MIGRACAO_SQLITE_DEXIE_HERMES.md
- docs/HERMES_TASK_BOARD.md
- .github/copilot-instructions.md

Regras:
- Respeite ownership de arquivos.
- Nao edite arquivos fora da sua area sem registrar handoff.
- Preserve UI legada.
- Nao introduza React/Vue/Svelte.
- Nao use localStorage para dados de dominio.
- Ao finalizar, escreva docs/handoffs/NOME.md com: arquivos alterados, comandos rodados, riscos e proximas tarefas.
```

## Primeiro Lote Recomendado

Executar em paralelo:

- Codex Orchestrator: branch + skeleton + contratos.
- Claude Storage: Dexie repositories, depois que skeleton existir.
- Gemini Android: validar plugin SQLite e build Android.

Bloquear ate contratos existirem:

- UI integration.
- Media/sync.
- Feedback.

