# Handoff: Android SQLite

Data: 2026-05-12
Agente: Hermes Android SQLite
Branch: `feature/storage-sqlite-dexie-offline`

## Resumo

- Avaliei a configuracao atual do Capacitor Android sem editar `capacitor.config.ts`, `package.json`, `package-lock.json` ou `android/**`.
- Preparei `src/storage/db.sqlite.ts` com um adapter Android compativel com `AppStorage`.
- O adapter compila sem `@capacitor-community/sqlite` instalado porque usa `registerPlugin('CapacitorSQLite')` via `@capacitor/core`.
- Adicionei migrations SQL iniciais para `orcamentos`, `clientes`, `fornecedores`, `eventos`, `config`, `media`, `sync_queue`, `feedback_reports` e `app_meta`.
- `npm run build` passou.

## Atualizacao Codex 2026-05-12

- Instalei `@capacitor-community/sqlite` em `package.json`/`package-lock.json`.
- Rodei `npx cap sync android`; o sync registrou o modulo `:capacitor-community-sqlite`.
- Conectei `createAndroidSQLiteStorage()` no selector `src/storage/index.ts` para Android nativo, com fallback para web storage se a inicializacao falhar.
- Rodei `.\gradlew.bat assembleDebug` em `android/`; build debug passou.

## Arquivos Alterados

- `src/storage/db.sqlite.ts`
- `src/storage/index.ts`
- `package.json`
- `package-lock.json`
- `android/capacitor.settings.gradle`
- `android/app/capacitor.build.gradle`
- `docs/handoffs/android-sqlite.md`

## Configuracao Android Atual

- `package.json` tem Capacitor 8:
  - `@capacitor/core` `^8.3.1`
  - `@capacitor/android` `^8.3.3`
  - `@capacitor/keyboard` `^8.0.3`
  - `@capacitor/status-bar` `^8.0.2`
- Nao ha dependencia SQLite instalada hoje.
- `capacitor.config.ts` configura apenas `Keyboard`.
- `android/capacitor.settings.gradle` e `android/app/capacitor.build.gradle` incluem apenas:
  - `capacitor-android`
  - `capacitor-keyboard`
  - `capacitor-status-bar`
- Nao rodei `npx cap sync android` porque a tarefa pediu para nao instalar dependencias de rede e `package.json`/Android estao em ownership apenas de analise.

## Adapter SQLite

`createAndroidSQLiteStorage()` agora retorna um `AppStorage` com:

- `platform: 'android-sqlite'`
- `init()` abrindo conexao nativa e executando migrations
- `close()`
- `purgeLegacyStorage()`
- `exportSnapshot()` / `importSnapshot()`
- repositories para:
  - `orcamentos`
  - `clientes`
  - `fornecedores`
  - `eventos`
  - `config`
  - `media`
  - `syncQueue`
  - `feedback`

Observacao: o adapter ainda nao esta conectado no selector `src/storage/index.ts`, pois esse arquivo nao estava no ownership de escrita desta tarefa.

## Migrations SQL Iniciais

As migrations estao exportadas como `SQLITE_MIGRATIONS` em `src/storage/db.sqlite.ts`.

Modelo criado:

- `app_meta(key, value)`
- `orcamentos` com colunas do plano, `record_json` e indices por `syncStatus`/`tsEdit`
- `clientes` com colunas do plano, `record_json` e indice por `nome`
- `fornecedores` com colunas do plano, `record_json` e indice por `nome`
- `eventos` com colunas do plano, `record_json` e indice por `data`
- `config(key, value_json, updatedAt)`
- `media` com colunas do plano, `record_json` e indices por owner/sync
- `sync_queue` com colunas do plano, `record_json` e indice por status/runAfter
- `feedback_reports` com colunas do plano, `record_json` e indice por status

`record_json` preserva compatibilidade com os tipos legados atuais enquanto as colunas normalizadas ficam prontas para queries, sync e migrations futuras.

## Dependencias e Comandos Exatos Pendentes

Quando o ownership permitir instalar dependencias e sincronizar Android:

```powershell
npm install @capacitor-community/sqlite@^8.1.0
npx cap sync android
.\gradlew.bat assembleDebug
```

Comando alternativo a partir da raiz do projeto para build Android:

```powershell
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
```

Nota: para Android nativo nao e necessario instalar `jeep-sqlite`/`sql.js`; esses pacotes sao para uso web do plugin SQLite. O plano deste projeto usa Dexie no Web/PWA.

## Comandos Rodados

```powershell
Get-Content -Path docs/PLANO_MIGRACAO_SQLITE_DEXIE_HERMES.md
Get-Content -Path docs/HERMES_TASK_BOARD.md
Get-Content -Path docs/HERMES_SESSION_MEMORY.md
Get-Content -Path docs/handoffs/orchestrator-start.md
git status --short --branch
Get-ChildItem -Path src/storage -Recurse | Select-Object FullName
Get-Content -Path src/storage/db.sqlite.ts
Get-Content -Path src/storage/types.ts
Get-Content -Path src/storage/schema.ts
Get-Content -Path src/storage/db.dexie.ts
Get-Content -Path package.json
Get-Content -Path capacitor.config.ts
Get-Content -Path android/capacitor.settings.gradle
Get-Content -Path android/app/capacitor.build.gradle
rg "sqlite|capacitor-community|jeep|CapacitorSQLite|@capacitor" package.json package-lock.json capacitor.config.ts android
Get-Content -Path src/types.ts
Get-Content -Path src/storage/index.ts
Get-Content -Path tsconfig.json
rg "createAndroidSQLiteStorage|createWebDexieStorage|AppStorage|storage" src -g "*.ts"
npm run build
npm run build
git diff -- src/storage/db.sqlite.ts
Test-Path docs/handoffs/android-sqlite.md
```

## Resultado de Build

- Primeira execucao de `npm run build`: falhou por erros TypeScript no adapter novo.
- Segunda execucao de `npm run build`: passou.
- Validacao posterior Codex:
  - `npm run build`: passou.
  - `npx cap sync android`: passou.
  - `.\gradlew.bat assembleDebug`: passou.

## Riscos e Bloqueios

- SQLite nativo ainda nao foi validado em device/emulador porque o plugin nao esta instalado.
- SQLite nativo ainda nao foi validado em device/emulador.
- O adapter usa a API direta do plugin (`createConnection`, `open`, `execute`, `run`, `query`, `closeConnection`). Deve ser smoke-tested apos instalar `@capacitor-community/sqlite`.
- `db.dexie.ts` ainda usa IndexedDB nativo, nao Dexie real; persiste no Web/PWA, mas nao usa a dependencia Dexie instalada.
- `package.json`, `package-lock.json` e `android/**` ja tinham mudancas alheias no inicio da tarefa; nao reverti nem editei.
- O workspace tinha muitas delecoes/modificacoes pre-existentes fora do escopo, inclusive `app.html`, `src/ui.ts`, `src/budgets.ts`, `src/appConfig.ts`, Android e assets.

## Proximas Tarefas Recomendadas

1. Fazer smoke test Android: criar orcamento, fechar app, reabrir, listar o mesmo orcamento.
2. Verificar no device/emulador se o plugin aceita `createConnection/open/run/query` na versao 8.1.0 sem ajuste de assinatura.
3. Integrar UI legada aos services para exercitar o SQLite em fluxo real.
