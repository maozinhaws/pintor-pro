# Hermes Session Memory

Data: 2026-05-12

## Contexto

O usuario quer migrar o Pintor Plus MVP mantendo velocidade de entrega:

- Android via Capacitor com SQLite local.
- iPhone como Web App/PWA no Safari.
- Web/PWA usando Dexie.js sobre IndexedDB.
- App 100% offline-first.
- Sem migracao de dados legados do `localStorage`; MVP pode purgar dados antigos.
- UI legada deve ser preservada inicialmente.
- Media local + Google Drive + toggle de galeria estilo WhatsApp.
- Backup periodico em nuvem, estilo WhatsApp.
- Feedback module com auto-logs, email e anexos.
- Futuro roadmap: refactor nativo Kotlin/Swift.
- "Hermes" neste projeto significa framework de orquestracao multiagente, nao o motor Hermes do React Native.

## Documentos Criados

- `docs/PLANO_MIGRACAO_SQLITE_DEXIE_HERMES.md`
- `docs/HERMES_TASK_BOARD.md`
- `docs/HERMES_SESSION_MEMORY.md`

## Decisoes Tecnicas

- Criar branch: `feature/storage-sqlite-dexie-offline`.
- Usar protocolo anti-overlap com ownership de arquivos por agente.
- Criar camada de storage antes de mexer na UI.
- UI nao deve chamar `localStorage`, `sessionStorage`, Dexie ou SQLite diretamente.
- UI chama services; services chamam repositories; repositories chamam adapters.
- `S` deve virar cache/runtime state, nao fonte permanente de dados.
- Base64 para fotos deve ser transitorio; persistencia final deve usar media local referenciada por `media.id`.
- Google Drive sera cofre de backup/upload no MVP, nao banco remoto bidirecional completo.

## Divisao de Agentes

Codex:

- Orquestrador principal.
- Cria branch, skeleton, contratos e handoffs.
- Integra UI legada aos services.
- Revisa diffs e mantem build verde.

Claude Code:

- Dexie, repositories e services de dominio.
- Media local, backup e sync queue.

Gemini Code:

- Android Capacitor, SQLite, Gradle e build.
- Feedback module e matriz QA.

## Proxima Acao

Comecar Fase 0:

1. Criar branch `feature/storage-sqlite-dexie-offline`.
2. Criar `docs/handoffs/`.
3. Criar skeleton `src/storage/` e `src/services/`.
4. Definir contratos minimos.
5. Depois delegar Dexie para Claude e SQLite Android para Gemini.

## Observacoes do Workspace

- O projeto atual e Vite + TypeScript + Capacitor.
- UI usa DOM puro e handlers globais em `window`.
- Persistencia atual esta espalhada em `localStorage`.
- Arquivo central atual de estado: `src/state.ts`.
- Arquivos com persistencia direta conhecidos: `src/state.ts`, `src/data.ts`, `src/clients.ts`, `src/agenda.ts`, `src/appConfig.ts`, `src/budgets.ts`, `src/ui.ts` e trechos em `app.html`.

## Atualizacao 2026-05-13 - Storage/Dexie/SQLite

- `package.json` possui `dexie` e `@capacitor-community/sqlite`.
- `npx cap sync android` passou e detectou `@capacitor-community/sqlite@8.1.0`, `@capacitor/keyboard@8.0.3` e `@capacitor/status-bar@8.0.2`.
- `npm run build` passou.
- O app em runtime importa `Storage` de `src/storage/storage.js` em `src/main.ts`.
- A camada ativa hoje usa Dexie real em `src/storage/db-dexie.js` e SQLite real via `@capacitor-community/sqlite` em `src/storage/db-sqlite.js`.
- Existe uma segunda camada TypeScript nova em `src/storage/index.ts`, `src/storage/db.dexie.ts` e `src/storage/db.sqlite.ts`.
- `src/storage/db.dexie.ts` ainda usa IndexedDB nativo, apesar do nome `createWebDexieStorage`; nao usa Dexie real ainda.
- `src/services/**` usa a camada TypeScript nova via `createAppStorage()`, mas a UI principal ainda nao esta integrada a esses services.
- Conclusao: Dexie e SQLite estao instalados e ha uma implementacao ativa no app, mas a arquitetura ainda tem duas camadas de storage convivendo.
- Proxima acao recomendada: unificar o `main.ts`/UI e os services em uma unica camada de storage antes de continuar media/backup/feedback.
- `.\gradlew.bat assembleDebug` falhou em 2026-05-13 por ambiente JDK/JRE, nao por SQLite: Gradle tentou usar o JRE da extensao RedHat VS Code e nao encontrou `jlink.exe`.
