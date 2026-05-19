# Plano de Migracao: Android Capacitor + SQLite e PWA iOS + Dexie

Data: 2026-05-12
Projeto: Pintor Plus MVP
Objetivo: evoluir o app atual para uma arquitetura offline-first com persistencia robusta, mantendo velocidade de MVP, compatibilidade Android via Capacitor e execucao como Web App/PWA no iPhone.

## 1. Decisoes Fechadas

| Item | Decisao |
| :--- | :--- |
| Stack principal | Capacitor para Android + PWA para iOS/Safari |
| Android | App Capacitor usando SQLite local |
| iOS | Web App/PWA no Safari usando IndexedDB |
| Controle de versao | Nova branch no repo atual |
| Protocolo de trabalho | Anti-overlap por ownership de arquivos |
| Migracao de dados legados | Nao migrar dados de `localStorage`; MVP pode purgar dados locais |
| Storage web | Dexie.js sobre IndexedDB |
| Storage Android | SQLite local via plugin Capacitor |
| Media | SQLite/local + Google Drive cloud + toggle de galeria estilo WhatsApp |
| Conectividade | 100% offline-first |
| Sincronizacao | Fila de tarefas + backup periodico cloud |
| UI/UX | Manter UI legada, adicionando modulo de feedback |
| Feedback | Auto-logs + email + anexos |
| Objetivo estrategico | Velocidade agora; refactor nativo Kotlin/Swift no roadmap |
| Orquestracao | Hermes como framework de delegacao multiagente |

## 2. Interpretacao Tecnica

O app atual e um Vite + TypeScript + Capacitor com UI em DOM puro, handlers globais em `window` e estado compartilhado em `src/state.ts`. A persistencia esta espalhada em `localStorage`, principalmente em `src/state.ts`, `src/data.ts`, `src/clients.ts`, `src/agenda.ts`, `src/appConfig.ts`, `src/budgets.ts`, `src/ui.ts` e trechos inline em `app.html`.

A migracao nao deve comecar trocando telas. A primeira entrega deve ser uma camada de dados unica, para que o restante do app pare de falar diretamente com `localStorage`.

Hermes, neste plano, significa o framework operacional de delegacao para Claude Code, Codex e Gemini Code. Nao significa o motor JavaScript Hermes do React Native, pois o stack definido nao e React Native.

## 3. Arquitetura Alvo

```txt
UI legada DOM/Vite
  |
  v
App Services
  - OrcamentoService
  - ClienteService
  - FornecedorService
  - EventoService
  - ConfigService
  - MediaService
  - BackupService
  - FeedbackService
  |
  v
Repository Contracts
  - BudgetRepository
  - ClientRepository
  - SupplierRepository
  - EventRepository
  - ConfigRepository
  - MediaRepository
  - SyncQueueRepository
  |
  v
Storage Adapter
  - WebDexieAdapter: IndexedDB/Dexie
  - AndroidSQLiteAdapter: Capacitor SQLite
```

Regra central: nenhum modulo de UI deve chamar `localStorage`, `sessionStorage`, Dexie ou SQLite diretamente. UI chama services; services chamam repositories; repositories chamam adapters.

## 4. Modelo de Dados Inicial

Entidades atuais:

- `orcamentos`
- `clientes`
- `fornecedores`
- `eventos`
- `config`
- `media`
- `sync_queue`
- `feedback_reports`
- `app_meta`

### 4.1 Tabelas / Stores

`orcamentos`

- `id` string primary key
- `nome` string
- `apelido` string
- `tel` string
- `email` string
- `cpf` string
- `endereco_json` string/json
- `rooms_json` string/json
- `pgto_json` string/json
- `fmt` string
- `preco` number
- `status` string
- `valid` string
- `tipoServico` string
- `inicio` string
- `obs` string
- `date` string
- `ts` number
- `tsEdit` number
- `rascunho` boolean
- `isFlashDraft` boolean
- `deletedAt` number nullable
- `syncStatus` string: `local`, `queued`, `synced`, `error`

`clientes`

- `id` string primary key
- `nome` string
- `apelido` string
- `tel` string
- `email` string
- `cpf` string
- `endereco_json` string/json
- `ts` number
- `deletedAt` number nullable
- `syncStatus` string

`fornecedores`

- `id` string primary key
- `nome` string
- `tel` string
- `servico` string
- `obs` string
- `cat` string
- `ts` number
- `deletedAt` number nullable
- `syncStatus` string

`eventos`

- `id` string primary key
- `nome` string
- `data` string
- `hora` string
- `obs` string
- `repeat` string
- `orcId` string nullable
- `alarm` boolean
- `alarmado` boolean
- `ts` number
- `deletedAt` number nullable
- `syncStatus` string

`config`

- `key` string primary key
- `value_json` string/json
- `updatedAt` number

`media`

- `id` string primary key
- `ownerType` string: `orcamento`, `item`, `feedback`, `config`
- `ownerId` string
- `kind` string: `photo`, `pdf`, `signature`, `log`, `attachment`
- `localUri` string
- `thumbUri` string nullable
- `mimeType` string
- `fileName` string
- `size` number
- `width` number nullable
- `height` number nullable
- `driveFileId` string nullable
- `gallerySaved` boolean
- `createdAt` number
- `syncStatus` string

`sync_queue`

- `id` string primary key
- `type` string: `backup`, `media_upload`, `feedback_email`, `drive_metadata`, `delete_remote`
- `payload_json` string/json
- `status` string: `pending`, `running`, `done`, `error`
- `attempts` number
- `lastError` string nullable
- `runAfter` number
- `createdAt` number
- `updatedAt` number

`feedback_reports`

- `id` string primary key
- `message` string
- `email` string nullable
- `logs_json` string/json
- `attachments_json` string/json
- `status` string
- `createdAt` number

`app_meta`

- `key` string primary key
- `value` string

## 5. Storage Strategy

### 5.1 Web/PWA iOS

Usar Dexie.js como API de IndexedDB. O adapter web deve implementar os mesmos contratos do Android. Dados grandes de imagem nao devem ficar como base64 dentro de orcamento. Para MVP, aceitar `Blob` no IndexedDB via Dexie ou `dataUrl` temporario somente durante captura, convertendo para media persistida depois.

### 5.2 Android Capacitor

Usar SQLite local via plugin Capacitor. O adapter Android deve expor a mesma interface do Dexie adapter.

Decisao de compatibilidade: a camada superior nao deve saber se esta rodando em IndexedDB ou SQLite.

### 5.3 Purga de localStorage

Como nao ha migracao legada, a primeira inicializacao da nova versao deve:

- detectar `app_meta.storageVersion`;
- se ausente, inicializar DB novo;
- limpar chaves antigas do Pintor Plus em `localStorage`;
- manter chaves nao criticas de UX somente se forem explicitamente permitidas, como tema e termos aceitos.

Chaves antigas a remover:

- `pp-orcs`
- `pp-clientes`
- `pp-fornecedores`
- `pp-eventos`
- `pp-config`
- `orcamento-pocket-draft`
- espelhos emergenciais de `sessionStorage`

Chaves que podem permanecer, se aprovado:

- `pp-theme`
- aceite de termos/PWA dismiss

## 6. Media Handling

Objetivo: comportamento parecido com WhatsApp.

Fluxo:

1. Usuario captura foto ou escolhe da galeria.
2. App salva localmente em `media`.
3. App gera miniatura.
4. Toggle "Salvar na galeria" decide se tambem exporta para a galeria do Android.
5. Upload para Google Drive entra na `sync_queue`.
6. Se offline, upload fica pendente.
7. Orcamento referencia `media.id`, nao base64.

Regras:

- Base64 deve ser tratado como formato transitorio.
- PDFs gerados entram como media local antes de compartilhar/upload.
- Fotos anexadas ao feedback tambem usam `media`.
- Excluir um item deve desvincular media; apagar fisicamente pode ser tarefa de limpeza posterior.

## 7. Offline-first e Sync

O app deve funcionar sem internet para:

- criar/editar orcamentos;
- gerenciar clientes;
- gerenciar fornecedores;
- gerenciar agenda;
- anexar fotos;
- gerar PDF local;
- exportar backup local;
- criar feedback pendente.

Quando houver rede:

- processar `sync_queue`;
- gerar backup periodico no Google Drive;
- subir fotos/PDFs pendentes;
- enviar feedbacks pendentes;
- atualizar estado de sync.

Politica MVP:

- backup automatico periodico, nao sincronizacao bidirecional completa;
- conflito simples por `updatedAt`/`tsEdit`;
- Drive como cofre de backup, nao banco remoto operacional.

## 8. Feedback Module

Adicionar modulo de feedback sem redesenhar a UI inteira.

Funcionalidades:

- campo de mensagem;
- email opcional do usuario;
- anexar prints/fotos/arquivo;
- incluir log tecnico automaticamente;
- incluir snapshot anonimizado de contadores: quantidade de orcamentos, clientes, eventos, storage engine, plataforma, versao;
- salvar offline em `feedback_reports`;
- tentar envio quando online.

Privacidade:

- nao anexar dados completos de clientes/orcamentos por padrao;
- permitir usuario optar por anexar backup tecnico;
- mascarar CPF/CNPJ e telefone nos logs.

## 9. Branch e Anti-overlap Protocol

Branch sugerida:

```txt
feature/storage-sqlite-dexie-offline
```

Protocolo:

- cada agente recebe ownership explicito de arquivos;
- nenhum agente edita arquivo fora do ownership sem pedir handoff;
- alteracoes em `app.html`, `src/state.ts`, `src/types.ts` e `package.json` exigem coordenacao central;
- agentes devem registrar progresso em `docs/handoffs/`;
- commits pequenos por fase;
- antes de iniciar tarefa, agente deve rodar `git status --short`;
- antes de finalizar, agente deve informar arquivos alterados, testes executados e riscos.

## 10. Fases de Implementacao

### Fase 0 - Preparacao

Entregaveis:

- criar branch nova;
- congelar escopo MVP;
- instalar dependencias Dexie e SQLite;
- documentar contratos;
- criar pasta `src/storage/`.

Criterios de aceite:

- build atual continua passando;
- nenhuma tela alterada visualmente;
- plano de ownership publicado.

### Fase 1 - Contratos e Adapter Web Dexie

Entregaveis:

- `src/storage/types.ts`
- `src/storage/schema.ts`
- `src/storage/db.dexie.ts`
- `src/storage/repositories/*`
- inicializacao do banco;
- purge controlada do localStorage legado.

Criterios de aceite:

- app inicia com DB novo;
- stores criadas;
- operacoes CRUD basicas testadas;
- sem uso novo de `localStorage` para dados de dominio.

### Fase 2 - Adapter Android SQLite

Entregaveis:

- plugin SQLite configurado;
- `src/storage/db.sqlite.ts`;
- migrations SQL;
- selecao automatica de adapter por plataforma;
- smoke test em Android.

Criterios de aceite:

- app abre no Android;
- cria/edita/lista orcamentos persistindo apos reiniciar;
- IndexedDB nao e usado no Android se SQLite estiver disponivel;
- fallback controlado se plugin falhar.

### Fase 3 - Refactor de State e Services

Entregaveis:

- `src/services/orcamentos.ts`
- `src/services/clientes.ts`
- `src/services/fornecedores.ts`
- `src/services/eventos.ts`
- `src/services/config.ts`
- `src/state.ts` vira cache/runtime state, nao fonte de persistencia.

Criterios de aceite:

- telas atuais continuam funcionando;
- salvar orcamento nao usa `localStorage`;
- clientes/fornecedores/eventos persistem no novo storage;
- reload mantem dados.

### Fase 4 - Media Local

Entregaveis:

- `MediaService`;
- tabela/store `media`;
- thumbnails;
- referencias por `media.id`;
- toggle salvar na galeria;
- limpeza de base64 persistente.

Criterios de aceite:

- foto aparece no item apos reload;
- PDF pode ser gerado/compartilhado;
- Android respeita toggle de galeria;
- PWA iOS continua funcional com limitacoes documentadas.

### Fase 5 - Backup e Sync Queue

Entregaveis:

- `SyncQueueService`;
- backup periodico;
- upload Google Drive;
- restore manual de backup;
- retry com backoff.

Criterios de aceite:

- offline cria tarefas pendentes;
- online processa fila;
- falhas ficam visiveis ao usuario;
- backup manual e automatico geram arquivo restauravel.

### Fase 6 - Feedback Module

Entregaveis:

- tela/modal de feedback;
- auto-log;
- anexos;
- fila offline;
- envio por email ou endpoint escolhido.

Criterios de aceite:

- usuario consegue registrar feedback offline;
- feedback envia quando online;
- logs mascaram dados sensiveis;
- anexos seguem politica de media.

### Fase 7 - QA, Hardening e Release

Entregaveis:

- matriz de testes Android/PWA;
- testes de persistencia;
- teste de limpeza de localStorage;
- teste de backup/restore;
- build Android debug;
- checklist de release.

Criterios de aceite:

- `npm run build` passa;
- Android debug abre e persiste dados;
- PWA iOS persiste apos fechar/reabrir;
- nao ha chamadas diretas a `localStorage` para dados de dominio;
- documento de known issues publicado.

## 11. Delegacao Hermes

### Agente A - Arquiteto de Storage

Modelo sugerido: Claude Code ou Codex com alta capacidade de edicao.

Ownership:

- `src/storage/**`
- `src/services/**`
- `src/types.ts`
- docs tecnicos de storage

Prompt:

```txt
Voce e o Agente A no protocolo Hermes. Sua tarefa e criar a camada de storage offline-first do Pintor Plus.

Contexto:
- App Vite + TypeScript + Capacitor.
- UI legada deve ser preservada.
- Web/PWA usa Dexie/IndexedDB.
- Android usa SQLite via Capacitor.
- Nao migrar localStorage legado; apenas purgar dados antigos do dominio.

Ownership:
- Pode editar: src/storage/**, src/services/**, src/types.ts, docs/handoffs/storage.md.
- Nao editar: app.html, src/ui.ts, src/budgets.ts, src/appConfig.ts sem handoff.

Entregue:
- contratos de repository;
- schema inicial;
- Dexie adapter;
- interface para SQLite adapter;
- inicializador que escolhe adapter por plataforma;
- handoff com arquivos alterados, riscos e proximas tarefas.
```

### Agente B - Integrador da UI Legada

Modelo sugerido: Codex.

Ownership:

- `src/state.ts`
- `src/budgets.ts`
- `src/clients.ts`
- `src/agenda.ts`
- `src/appConfig.ts`
- `src/ui.ts`

Prompt:

```txt
Voce e o Agente B no protocolo Hermes. Sua tarefa e remover persistencia direta da UI legada e ligar as telas aos services criados pelo Agente A.

Regras:
- Preserve a UI e os handlers globais existentes.
- Nao redesenhe telas.
- Troque localStorage/sessionStorage de dados de dominio por chamadas aos services.
- Mantenha S como cache/runtime state, nao como storage permanente.
- Qualquer mudanca em app.html exige handoff.

Entregue:
- orcamentos, clientes, fornecedores, eventos e config salvando pelo novo storage;
- reload mantendo dados;
- handoff com locais onde localStorage ainda e permitido ou pendente.
```

### Agente C - Android SQLite e Capacitor

Modelo sugerido: Gemini Code ou Codex.

Ownership:

- `capacitor.config.ts`
- `package.json`
- `android/**`
- `src/storage/db.sqlite.ts`
- docs Android

Prompt:

```txt
Voce e o Agente C no protocolo Hermes. Sua tarefa e configurar SQLite no Android Capacitor e validar persistencia nativa.

Regras:
- Nao alterar UI.
- Nao alterar contratos de storage sem coordenar com Agente A.
- Android deve usar SQLite quando o plugin estiver disponivel.
- Web/PWA deve continuar usando Dexie.

Entregue:
- dependencias Capacitor SQLite instaladas/configuradas;
- migrations SQL;
- smoke test Android;
- instrucoes de build;
- handoff com erros de ambiente, se houver.
```

### Agente D - Media, Galeria e Drive

Modelo sugerido: Claude Code.

Ownership:

- `src/services/media.ts`
- `src/services/backup.ts`
- `src/services/syncQueue.ts`
- partes coordenadas de `src/appConfig.ts` e `src/ui.ts`

Prompt:

```txt
Voce e o Agente D no protocolo Hermes. Sua tarefa e implementar media local, backup e sync queue.

Regras:
- Base64 e transitorio; persistir media como registro local com referencia por id.
- Android deve suportar toggle "Salvar na galeria".
- Google Drive e backup/cofre, nao banco remoto bidirecional no MVP.
- Offline-first: qualquer upload deve virar tarefa pendente se sem rede.

Entregue:
- MediaService;
- SyncQueueService;
- BackupService;
- upload/backup pendente;
- restore manual;
- handoff com limitacoes iOS/PWA.
```

### Agente E - Feedback e QA

Modelo sugerido: Gemini Code ou Claude Code.

Ownership:

- `src/services/feedback.ts`
- UI de feedback coordenada
- `docs/QA_STORAGE_SYNC.md`
- testes manuais

Prompt:

```txt
Voce e o Agente E no protocolo Hermes. Sua tarefa e criar o modulo de feedback e a matriz de QA.

Regras:
- Feedback deve funcionar offline.
- Logs devem mascarar CPF/CNPJ, telefone e dados sensiveis.
- Anexos usam MediaService.
- Nao quebrar UI legada.

Entregue:
- FeedbackService;
- tela/modal simples mantendo estilo atual;
- auto-log;
- fila de envio;
- matriz de testes Android e PWA iOS.
```

## 12. Checks Globais

Antes de merge:

- `npm run build`
- verificar `rg "localStorage|sessionStorage" src app.html`
- confirmar que usos restantes sao permitidos: tema, termos, PWA prompt ou fallback tecnico temporario documentado
- Android debug build
- PWA Safari testado em iPhone
- backup exportado e restaurado
- sync queue testada offline/online
- feedback testado offline/online

## 13. Riscos

| Risco | Impacto | Mitigacao |
| :--- | :--- | :--- |
| Plugin SQLite instavel no Android | Alto | Dexie fallback temporario documentado; smoke test cedo |
| PWA iOS limitar storage em casos extremos | Medio/Alto | backup periodico, aviso de armazenamento e export manual |
| Media em base64 inflar banco | Alto | converter para blob/arquivo local e thumbnails |
| Agentes editarem os mesmos arquivos | Alto | ownership e handoffs |
| Drive virar sync bidirecional complexo | Alto | MVP limita Drive a backup e upload de media |
| UI legada muito acoplada a `S` | Medio | fase de services antes de refactor profundo |

## 14. Perguntas Ainda Pendentes

Estas perguntas nao bloqueiam a Fase 0/Fase 1, mas bloqueiam Fase 5/Fase 6:

1. Qual sera o mecanismo de envio de feedback: email direto, mailto, Google Drive, ou endpoint proprio?
2. O backup automatico no Drive exige login Google obrigatorio ou e recurso opcional?
3. Qual frequencia de backup: diario, a cada abertura, ou apos N alteracoes?
4. O toggle "Salvar na galeria" deve ser global nas configuracoes ou por foto?
5. Qual politica de retencao: manter todos os backups ou limitar aos ultimos N?
6. O usuario podera apagar todos os dados locais pela UI?
7. Havera criptografia local ou apenas armazenamento local padrao do dispositivo?

## 15. Proxima Acao Recomendada

Executar Fase 0:

1. Criar branch `feature/storage-sqlite-dexie-offline`.
2. Criar `docs/handoffs/`.
3. Instalar dependencias.
4. Delegar Agente A para contratos/storage.
5. Delegar Agente C em paralelo para validar SQLite Capacitor no Android.
6. Manter Agente B bloqueado ate contratos minimos do Agente A estarem prontos.

