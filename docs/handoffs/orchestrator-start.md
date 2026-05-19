# Handoff: Hermes Orchestrator Start

Data: 2026-05-12
Branch: `feature/storage-sqlite-dexie-offline`

## Objetivo

Iniciar o swarm Hermes baseado em `docs/HERMES_TASK_BOARD.md`.

## Estado

- Branch criada.
- Skeleton inicial de storage/services preparado.
- Agentes devem respeitar ownership definido no task board.
- Dependencias `dexie` e `@capacitor-community/sqlite` instaladas.
- `src/storage/index.ts` seleciona SQLite no Android nativo e usa storage web como fallback.
- `npx cap sync android` executado com sucesso e plugin SQLite registrado no projeto Android.
- `npm run build` e `android/gradlew.bat assembleDebug` passaram.

## Regras

- Nao editar `app.html` sem handoff explicito.
- Nao usar `localStorage` para dados de dominio em codigo novo.
- UI legada deve permanecer visualmente igual.
- Dexie e SQLite devem ficar atras dos mesmos contratos.

## Validacao 2026-05-12

- `npm run build`: passou.
- `npx cap sync android`: passou; encontrou `@capacitor-community/sqlite`, `@capacitor/keyboard` e `@capacitor/status-bar`.
- `.\gradlew.bat assembleDebug` em `android/`: passou.

## Pendencias

- `src/storage/db.dexie.ts` ainda usa IndexedDB nativo apesar da dependencia `dexie` estar instalada; trocar para Dexie real em uma tarefa focada.
- UI legada ainda possui writes diretos em `localStorage`/`sessionStorage`; proxima fase deve integrar `src/services/**`.
- Runtime smoke test em dispositivo/emulador Android ainda pendente.
