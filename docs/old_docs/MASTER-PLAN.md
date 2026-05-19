# Pintor Plus — Master Plan
### Single source of truth. Everything else is superseded by this document.
### React Native + Expo + Modular Monolith — Local-First Android App

---

## What This Document Is

This is the final, authoritative plan for the Pintor Plus Android rebuild. It was
synthesized from five prior research documents:

- `review.md` — original PWA codebase audit
- `sqlite-storage&file-storage.md` — storage infrastructure directives
- `android-migration-opinion.md` — initial Capacitor migration opinion (superseded)
- `codebase-state-audit.md` — runtime execution model and what is broken
- `sota-architecture.md` — full React Native + Expo + Modular Monolith blueprint

A developer reading only this document has everything needed to begin implementation
immediately. No prior context is required. All trade-offs are settled here.

---

## Part 1 — All Decisions, Final

### 1.1 Strategic Decision: React Native, Not Capacitor

The Capacitor migration path was the first recommendation. It was correct for the
fastest possible delivery. It is not the right answer for a production app without
architectural debt.

**Why React Native wins:**

The existing PWA codebase has three structural problems that Capacitor cannot fix:

1. **Dual S objects.** The inline script creates its own `const S` reading from
   localStorage. The TypeScript module creates a separate `S` in `state.ts` reading
   the same key. They are two objects in memory with no link. TypeScript wins because
   `<script type="module">` is deferred and runs last — overwriting inline window
   functions. But this is a race condition disguised as a working app.

2. **Three orphaned TypeScript modules.** `ui.ts` (900+ lines), `data.ts` (795 lines),
   and `rooms.ts` are never imported by `main.ts`. They never run. The app you see
   working is not running the TypeScript render orchestrator — it is running the
   inline 2,540-line original JavaScript that TypeScript was supposed to replace.
   The refactoring stalled before the final cleanup step.

3. **2,540 lines of duplicate inline JavaScript.** Lines 2267–4807 of `app.html`
   contain the entire original app. It runs on every load, sets up its own state,
   and gets overwritten by TypeScript before any user action. Dead weight that cannot
   be safely deleted until the orphaned modules are resolved.

Wrapping this in Capacitor produces an Android APK containing all three problems plus
the overhead of a WebView bridge. The effort to resolve these issues while simultaneously
adapting to Capacitor plugins approaches the effort of a clean React Native rebuild —
without the clean break.

React Native with Expo gives native rendering, native camera, scheduled background
notifications, and a codebase that is clean from the first commit.

**What does not change:** The business logic is correct. `calcOrcTotal`, `buildWAMsg`,
`valorPorExtenso`, `fetchCep`, `_buildOrcPDFHtml`, `valorPorExtenso`, all domain type
definitions — these are ports, not rewrites. The existing codebase's domain knowledge
survives intact.

---

### 1.2 Architecture Decision: Modular Monolith

**One APK. Six modules. Hard internal boundaries.**

A modular monolith ships as a single deployable unit but organizes its internals into
feature modules, each with enforced layer separation. This is not microservices (no
IPC, no separate deployments). This is not a flat folder structure (no cross-module
internal imports).

Each module owns:
- Its domain types and business logic (pure TypeScript, no framework)
- Its database queries (SQLite via Drizzle ORM)
- Its application state (Zustand store slice)
- Its UI components (React Native)

Modules communicate only through typed EventBus events. No module imports another
module's internal implementation.

The six modules: **budgets**, **clients**, **suppliers**, **agenda**, **config**, **flash**.

---

### 1.3 Storage Decision: SQLite + Filesystem, No Cloud Required

**Rule 1:** Structured data (budgets, clients, suppliers, events, config) → SQLite
via Drizzle ORM + expo-sqlite.

**Rule 2:** Binary data (photos, logo, signature) → device filesystem via
expo-file-system, stored in `FileSystem.documentDirectory` (permanent, never cleared
by the OS). Only the file path is stored in SQLite. No Base64 columns. No BLOB columns
for user-generated content.

**Rule 3:** Thumbnails and regenerable cache → `FileSystem.cacheDirectory`.
Acceptable to lose; regenerated lazily from originals.

**Rule 4:** No cloud storage in v1. Local JSON backup + Android share sheet is
sufficient. Google OAuth and Google Drive are removed entirely. `gauth.ts` and
`supabaseClient.ts` are deleted.

**Why this matters for the existing app:** The current app stores photos as Base64
strings inside Item objects, inside Room arrays, inside Orcamento objects, inside a
localStorage JSON string. One job with 10 photos saturates the 5–10 MB localStorage
quota. The SQLite + filesystem split removes this ceiling entirely.

---

### 1.4 No Broken Features at Launch

Every feature in the existing PWA ships in the Android app before Play Store
submission. Features are not deferred to v2. Each development phase produces a working
app with a defined feature checklist. A phase is not done until its checklist passes
on a real Android device.

---

## Part 2 — Existing Codebase Audit

This section documents what the existing PWA actually is at runtime. This context is
required for anyone porting logic from the old codebase.

### 2.1 Three JavaScript Worlds in app.html

```
app.html (4,816 lines total)
│
├── Line 36     <script type="module" src="/src/main.ts">    ← TypeScript modules
├── Line 1561   <script>...</script>                         ← Flash mini-app (~700 lines)
└── Line 2267   <script>...</script>                         ← Original app (~2,540 lines)
```

**Execution order:**
1. Line 1561 inline script runs first (synchronous, during HTML parse)
2. Line 2267 inline script runs second (synchronous)
3. TypeScript module (deferred) runs last — after DOM is ready

**TypeScript always wins** because `<script type="module">` is deferred. Every
window function set by the inline scripts is overwritten by the TypeScript module
before the user can interact.

**The 2,540-line inline script is dead weight.** It initializes its own state, runs
its own CRUD logic, and is overwritten before any user action calls it.

### 2.2 Orphaned TypeScript Modules

`main.ts` imports these modules:

```
navigation.ts ✓   budgets.ts ✓   clients.ts ✓   agenda.ts ✓
receipts.ts ✓    appConfig.ts ✓  gauth.ts ✓     state.ts ✓   utils.ts ✓
```

These are **never imported and never run:**

| Module | Lines | Status |
|--------|-------|--------|
| `ui.ts` | 900+ | Dead — never imported |
| `data.ts` | 795 | Dead — never imported |
| `rooms.ts` | ~300 | Dead — never imported |

`data.ts` is especially dangerous: it contains duplicate implementations of
`clients.ts`, `agenda.ts`, and `appConfig.ts` functions — the last window assignment
would win. Since it never runs, it causes no active harm, but must be discarded.

### 2.3 The localStorage Key in Use

The active localStorage key for budgets is `pp-orcs` (not `pp-orcamentos` as the
review.md documentation states). Both `state.ts` and the inline script use `pp-orcs`.
Any migration function must read from `pp-orcs`.

### 2.4 What to Port vs What to Discard

**Port directly (pure logic, no DOM):**
- `src/types.ts` → `core/shared/types.ts` + each module's `domain/types.ts`
- `src/utils.ts` → `core/shared/utils.ts` (remove `ico`, `toast`, `setFieldError`)
- `calcOrcTotal` → `modules/budgets/domain/BudgetService.ts`
- `buildWAMsg` → `modules/budgets/domain/whatsappTemplate.ts`
- `_buildOrcPDFHtml` → `modules/budgets/domain/pdfTemplate.ts`
- `valorPorExtenso` → `modules/budgets/domain/receiptTemplate.ts`
- `fetchCep` (3-API fallback) → `core/shared/cep/CepService.ts`
- `extractClient` (logic only) → `modules/clients/domain/ClienteService.ts`

**Discard entirely:**
- `src/main.ts` — entry point, window wiring, DOM init
- `src/state.ts` — global S object, replaced by Zustand stores
- `src/navigation.ts` — SPA routing via DOM classes, replaced by Expo Router
- `src/ui.ts` — DOM render orchestrator, orphaned, never ran
- `src/data.ts` — dead code, duplicate implementations
- `src/rooms.ts` — DOM room UI, orphaned, never ran
- `src/budgets.ts` (UI functions) — all DOM manipulation
- `src/clients.ts` — all DOM manipulation
- `src/agenda.ts` — setInterval polling, AudioContext synthesis, DOM rendering
- `src/notifications.ts` — Browser Notification API, replaced by expo-notifications
- `src/gauth.ts` — Google OAuth, removed from v1
- `src/supabaseClient.ts` — Supabase client, removed from v1
- `src/receipt.ts` (singular, legacy) — XSS-vulnerable, discarded
- `app.html`, `app.css` — SPA shell, replaced by React Native

---

## Part 3 — Technology Stack

Every version is pinned. The React Native / Expo ecosystem moves fast; version
mismatches invalidate architecture decisions.

| Layer | Library | Version | Why This |
|-------|---------|---------|----------|
| Runtime | React Native | 0.76.x (Expo SDK 52) | SDK 52 ships New Architecture (Fabric + JSI) by default — eliminates the JS bridge bottleneck for camera, filesystem, notifications |
| SDK | Expo | 52 | Current LTS with stable New Architecture. Not bare workflow — keep OTA and EAS integration |
| Routing | Expo Router | 3.x | File-based routing; budget wizard multi-step maps to nested route files, not imperative push/pop |
| Database ORM | Drizzle ORM | 0.38.x | Schema-as-code generates TypeScript types from column definitions. Column types and application types share one source of truth. Not Prisma (no Android support). Not TypeORM (decorators incompatible with RN strict) |
| SQLite driver | expo-sqlite | 15.x | First-party Expo, JSI in SDK 52. `@capacitor-community/sqlite` is wrong here — it assumes a Capacitor bridge |
| State | Zustand | 4.x | Per-module stores with no boilerplate. Not Redux Toolkit (15KB overhead, 3 files per state slice). Not Jotai (atom-based, creates implicit cross-module dependencies) |
| State mutation | Immer | 10.x | Via Zustand `immer` middleware. Mutable syntax, immutable semantics |
| File system | expo-file-system | 18.x | First-party, JSI. `documentDirectory` = permanent. `cacheDirectory` = disposable |
| Camera | expo-camera | 16.x | Embedded viewfinder (not system camera intent). Native torch, zoom, focus on Android 13+ |
| Image display | expo-image | 2.x | Handles `file://` URIs natively, blurhash placeholders, disk cache. Not RN built-in Image |
| Image processing | expo-image-manipulator | 13.x | Native compress + resize. Runs off the JS thread |
| Notifications | expo-notifications | 0.29.x | Android AlarmManager under the hood. Fires at exact time regardless of app state |
| Contacts | expo-contacts | 14.x | Native contact picker. Replaces `navigator.contacts.select()` Web API |
| PDF | expo-print | 13.x | `Print.printToFileAsync({ html })` — takes existing `_buildOrcPDFHtml` output directly |
| Sharing | expo-sharing | 12.x | Native Android share intent. Used for PDFs and backup files |
| Build | EAS Build | current | Cloud APK/AAB builds, keystore management. No local Android SDK required |
| OTA updates | expo-updates | 0.27.x | JS-layer bug fixes ship without Play Store review |
| Testing | Jest + RNTL | 29.x + 12.x | Unit tests for domain logic; component tests without a real device |
| Language | TypeScript | 5.x strict | `strict: true` — no implicit any, no unchecked index access |

---

## Part 4 — Modular Monolith Architecture

### 4.1 Layer Model (Applied Per Module)

Every module follows four layers. Dependencies point inward only.

```
presentation  →  application  →  domain  ←  data
```

**Domain layer** (`domain/`): Pure TypeScript. No React. No SQLite. No Expo APIs.
Types, repository interfaces, business logic. Runs in a Node.js REPL. The budget
calculation engine lives here. The PDF template lives here.

**Data layer** (`data/`): SQLite implementation of domain repository interfaces via
Drizzle ORM. The only layer that imports expo-sqlite. Nothing outside the data layer
knows SQLite exists — they talk to the interface.

**Application layer** (`application/`): Use cases + Zustand store slice. A use case
coordinates between the repository and EventBus to fulfill a user intent. No React.

**Presentation layer** (`presentation/`): React Native screens and components.
Reads from store, dispatches to use cases, renders UI. Zero business logic.

### 4.2 Cross-Module Communication via EventBus

Modules never import each other's internal layers. Communication is via typed events.

```typescript
// All cross-module interactions are visible in one file:
// core/events/events.ts

BudgetSaved        → Clients module: upsert client from budget contact data
BudgetDeleted      → Agenda module: clear orc_id references | Media: delete photos
BudgetStatusChanged → (reserved for analytics)
FlashDraftPromoted → Budgets module: refresh list
ClienteSaved       → (reserved)
EventoSaved        → (internal: notification scheduling happens in use case)
EventoDeleted      → NotificationService: cancel scheduled notification
ConfigSaved        → All stores: reload config-derived state (services, statuses)
AppStarted         → Agenda module: reschedule all alarms (lost on device restart)
```

### 4.3 State: S Object → Module Stores

The existing flat `S` global maps to module stores:

| Existing `S` field | New location |
|--------------------|-------------|
| `S.orcs` | `budgetsStore.budgets` |
| `S.rooms` | `budgetsStore.currentDraft.rooms` |
| `S.editId` | `budgetsStore.selectedBudgetId` |
| `S.isDirty` | computed: `currentDraft !== null` |
| `S.tempItem` | `budgetsStore.pendingItem` |
| `S.fmt` | `budgetsStore.currentDraft.fmt` |
| `S.pgto` | `budgetsStore.currentDraft.pgto` |
| `S.pagador` | `budgetsStore.currentDraft.pagador` |
| `S.clientes` | `clientesStore.clientes` |
| `S.fornecedores` | `fornecedoresStore.fornecedores` |
| `S.eventos` | `agendaStore.eventos` |
| `S.config` | `configStore.config` |
| `S.googleEmail` | removed — no Google auth in v1 |
| `S.DEFAULT_SERVICES` | `configStore.config.servicos` (parsed) |
| `S.statusArr` | `configStore.config.statusList` (parsed) |

---

## Part 5 — Complete Directory Structure

```
pintor-plus/
│
├── app/                          Expo Router file-based route tree
│   ├── _layout.tsx               Root: database init, store hydration, notification setup
│   ├── index.tsx                 Redirect → /(tabs)/orcamentos
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx           Bottom tab bar: 5 tabs + icons
│   │   ├── orcamentos.tsx        → OrcamentosListScreen
│   │   ├── clientes.tsx          → ClientesListScreen
│   │   ├── agenda.tsx            → AgendaScreen
│   │   ├── fornecedores.tsx      → FornecedoresListScreen
│   │   └── config.tsx            → ConfigScreen
│   │
│   ├── orcamentos/
│   │   ├── new.tsx               → BudgetWizardScreen (new)
│   │   ├── [id]/
│   │   │   ├── edit.tsx          → BudgetWizardScreen (pre-filled)
│   │   │   ├── view.tsx          → BudgetViewScreen
│   │   │   └── rooms/[roomId]/item/[itemId].tsx → ItemEditorScreen
│   │   └── flash/new.tsx         → FlashWizardScreen
│   │
│   ├── clientes/
│   │   ├── new.tsx               → ClienteFormScreen
│   │   └── [id]/edit.tsx         → ClienteFormScreen (pre-filled)
│   │
│   ├── fornecedores/
│   │   ├── new.tsx               → FornecedorFormScreen
│   │   └── [id]/edit.tsx
│   │
│   └── agenda/
│       ├── new.tsx               → EventoFormScreen
│       └── [id]/edit.tsx
│
├── modules/
│   │
│   ├── budgets/
│   │   ├── domain/
│   │   │   ├── types.ts          Orcamento, Room, Item — ported from existing types.ts
│   │   │   ├── IBudgetRepository.ts
│   │   │   ├── BudgetService.ts  calcOrcTotal, extractClient — direct port
│   │   │   ├── pdfTemplate.ts    _buildOrcPDFHtml — direct port, mediaResolver param added
│   │   │   ├── whatsappTemplate.ts  buildWAMsg — direct port
│   │   │   ├── receiptTemplate.ts   valorPorExtenso + receipt HTML — direct port
│   │   │   └── validations.ts    validateOrc: name + phone required
│   │   │
│   │   ├── data/
│   │   │   ├── SQLiteBudgetRepository.ts
│   │   │   └── mappers.ts        DB row ↔ domain type
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveBudgetUseCase.ts
│   │   │   │   ├── DeleteBudgetUseCase.ts
│   │   │   │   ├── GetBudgetsUseCase.ts
│   │   │   │   ├── GetBudgetByIdUseCase.ts
│   │   │   │   ├── SendWhatsAppUseCase.ts
│   │   │   │   ├── GeneratePdfUseCase.ts
│   │   │   │   └── PromoteFlashUseCase.ts
│   │   │   └── store/budgetsStore.ts
│   │   │
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── OrcamentosListScreen.tsx
│   │       │   ├── BudgetWizardScreen.tsx
│   │       │   ├── BudgetViewScreen.tsx
│   │       │   └── ItemEditorScreen.tsx
│   │       └── components/
│   │           ├── OrcamentoCard.tsx
│   │           ├── RoomCard.tsx
│   │           ├── ItemSummary.tsx
│   │           ├── PricingModeSelector.tsx
│   │           ├── StatusBadge.tsx
│   │           ├── PhotoGrid.tsx
│   │           ├── CameraModal.tsx
│   │           └── WizardStepIndicator.tsx
│   │
│   ├── clients/
│   │   ├── domain/
│   │   │   ├── types.ts          Cliente interface
│   │   │   ├── IClienteRepository.ts
│   │   │   └── ClienteService.ts
│   │   ├── data/SQLiteClienteRepository.ts
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveClienteUseCase.ts
│   │   │   │   ├── DeleteClienteUseCase.ts
│   │   │   │   ├── GetClientesUseCase.ts
│   │   │   │   ├── UpsertClienteFromBudgetUseCase.ts   EventBus: BudgetSaved
│   │   │   │   └── PickContactUseCase.ts               expo-contacts
│   │   │   └── store/clientesStore.ts
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── ClientesListScreen.tsx
│   │       │   └── ClienteFormScreen.tsx
│   │       └── components/
│   │           ├── ClienteCard.tsx
│   │           ├── CepLookupField.tsx
│   │           └── ContactPickerButton.tsx
│   │
│   ├── suppliers/
│   │   ├── domain/
│   │   │   ├── types.ts          Fornecedor interface
│   │   │   ├── IFornecedorRepository.ts
│   │   │   └── FornecedorService.ts
│   │   ├── data/SQLiteFornecedorRepository.ts
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveFornecedorUseCase.ts
│   │   │   │   ├── DeleteFornecedorUseCase.ts
│   │   │   │   ├── GetFornecedoresUseCase.ts
│   │   │   │   └── SendWhatsAppQuoteUseCase.ts
│   │   │   └── store/fornecedoresStore.ts
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── FornecedoresListScreen.tsx
│   │       │   └── FornecedorFormScreen.tsx
│   │       └── components/
│   │           ├── FornecedorCard.tsx
│   │           └── CategoryFilter.tsx
│   │
│   ├── agenda/
│   │   ├── domain/
│   │   │   ├── types.ts          Evento interface; RepeatRule enum
│   │   │   ├── IEventoRepository.ts
│   │   │   └── AlarmService.ts   computeTriggerDate(evento): Date
│   │   ├── data/SQLiteEventoRepository.ts
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveEventoUseCase.ts
│   │   │   │   ├── DeleteEventoUseCase.ts
│   │   │   │   ├── GetEventosUseCase.ts
│   │   │   │   ├── CreateEventFromBudgetUseCase.ts
│   │   │   │   └── RescheduleAllAlarmsUseCase.ts       AppStarted event
│   │   │   └── store/agendaStore.ts
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── AgendaScreen.tsx
│   │       │   └── EventoFormScreen.tsx
│   │       └── components/
│   │           ├── CalendarGrid.tsx
│   │           ├── EventDot.tsx
│   │           ├── EventCard.tsx
│   │           └── AlarmPicker.tsx
│   │
│   ├── config/
│   │   ├── domain/
│   │   │   ├── types.ts          Config interface
│   │   │   ├── IConfigRepository.ts
│   │   │   └── BackupService.ts  serializeBackup, deserializeBackup, validateBackup
│   │   ├── data/SQLiteConfigRepository.ts
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveConfigUseCase.ts
│   │   │   │   ├── GetConfigUseCase.ts
│   │   │   │   ├── ExportBackupUseCase.ts
│   │   │   │   ├── ImportBackupUseCase.ts
│   │   │   │   ├── SaveLogoUseCase.ts
│   │   │   │   └── SaveSignatureUseCase.ts
│   │   │   └── store/configStore.ts
│   │   └── presentation/
│   │       ├── screens/ConfigScreen.tsx
│   │       └── components/
│   │           ├── CompanyInfoCard.tsx
│   │           ├── LogoPicker.tsx
│   │           ├── SignatureCanvas.tsx
│   │           ├── ServicesEditor.tsx
│   │           ├── PaymentMethodsEditor.tsx
│   │           ├── StatusListEditor.tsx
│   │           ├── MessageTemplateEditor.tsx
│   │           └── BackupRestoreCard.tsx
│   │
│   └── flash/
│       ├── domain/
│       │   ├── types.ts          FlashDraft
│       │   └── FlashService.ts   buildFlashDraft, promoteFlashToOrcamento
│       ├── data/SQLiteFlashRepository.ts    uses orcamentos table (isFlashDraft=true)
│       ├── application/
│       │   ├── useCases/
│       │   │   ├── SaveFlashDraftUseCase.ts
│       │   │   ├── PromoteFlashDraftUseCase.ts
│       │   │   └── GetFlashDraftsUseCase.ts
│       │   └── store/flashStore.ts
│       └── presentation/
│           ├── screens/FlashWizardScreen.tsx
│           └── components/
│               ├── FlashStep1.tsx   Client name + phone
│               ├── FlashStep2.tsx   Service type + quick price
│               └── FlashStep3.tsx   Summary + Send WA + Promote
│
├── core/
│   ├── database/
│   │   ├── schema.ts             Drizzle schema — ALL table definitions
│   │   ├── db.ts                 expo-sqlite + Drizzle singleton; migration runner
│   │   ├── index.ts              Re-exports db instance
│   │   └── migrations/
│   │       ├── 0001_initial.sql  Creates all tables
│   │       └── 0002_*.sql        Future — never destructive
│   │
│   ├── storage/
│   │   ├── FileStorage.ts        expo-file-system abstraction
│   │   │                         savePhoto, getPhotoUri, deletePhoto,
│   │   │                         generateThumbnail, deleteAllForEntity
│   │   └── paths.ts              documentDirectory/photos/{orcId}/{uuid}.jpg
│   │                             cacheDirectory/thumbs/{sha256}.jpg
│   │
│   ├── events/
│   │   ├── EventBus.ts           Typed pub/sub singleton
│   │   └── events.ts             All AppEvent discriminated union types
│   │
│   ├── notifications/
│   │   ├── NotificationService.ts  expo-notifications wrapper
│   │   └── alarmComputer.ts      computeTriggerDate(evento: Evento): Date
│   │
│   └── shared/
│       ├── types.ts              Cross-module shared types
│       ├── utils.ts              Port of existing utils.ts (pure functions only)
│       ├── formatters.ts         money(), formatPhone(), f1(), formatNum()
│       ├── validators.ts         validatePhone(), validateFullName(), validateCep()
│       └── cep/
│           ├── CepService.ts     3-API fallback: BrasilAPI → ViaCEP → OpenCEP
│           └── providers.ts      Individual fetch functions per provider
│
└── assets/
    ├── fonts/                    Self-hosted Sora + DM Mono (no Google Fonts CDN)
    ├── icons/                    App icon variants
    ├── images/                   Splash screen, onboarding
    └── sounds/                   alarm.wav for notification sound
```

---

## Part 6 — Database Schema

### Design Rules

1. Structured data → SQLite. No exceptions.
2. Photos, logo, signature → filesystem. Only path stored in SQLite.
3. Thumbnails → cache directory. Regenerable. Acceptable to lose.
4. `services` arrays on rooms/items → JSON text column. Rationale: always read with
   parent entity, never queried independently. Avoids a join table with no benefit.
5. Drizzle schema is the single source of truth. Column type = TypeScript type.

### Tables

**orcamentos**
```
id              TEXT PK         UUID, client-generated
nome            TEXT NOT NULL   Client full name
apelido         TEXT
tel             TEXT
email           TEXT
cpf             TEXT
cep             TEXT
logradouro      TEXT
numero          TEXT
comp            TEXT
bairro          TEXT
cidade          TEXT
pag_nome        TEXT            Payer name (when ≠ client)
pag_tel         TEXT
pag_end         TEXT
pagador         INTEGER 0       Boolean: 1 = third-party payer
fmt             TEXT 'completo' 'completo' | 'area' | 'simples'
preco           REAL 0          Global base price per m²
status          TEXT NOT NULL
valid           TEXT '15'       Validity in days
tipo_servico    TEXT
inicio          TEXT            Estimated start date
obs             TEXT
date            TEXT NOT NULL   DD/MM/YYYY
ts              INTEGER NOT NULL  Creation ms
ts_edit         INTEGER NOT NULL  Last edit ms
rascunho        INTEGER 0
is_flash_draft  INTEGER 0
```

**rooms** (normalized — not JSON inside orcamentos)
```
id              TEXT PK
orc_id          TEXT NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE
name            TEXT NOT NULL
alt             REAL 0          Height meters
comp            REAL 0          Width meters
preco           REAL 0
preco_per_m2    INTEGER 0       Boolean
services        TEXT '[]'       JSON array of service name strings
collapsed       INTEGER 0
sort_order      INTEGER NOT NULL
```

**items** (normalized — not JSON inside rooms)
```
id              TEXT PK
room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
name            TEXT NOT NULL
alt             REAL 0
comp            REAL 0
price           REAL 0
per_meter       INTEGER 0       Boolean
services        TEXT '[]'       JSON array
obs             TEXT
sort_order      INTEGER NOT NULL
```

**clientes**
```
id              TEXT PK         UUID
nome            TEXT NOT NULL
apelido         TEXT
tel             TEXT NOT NULL   Unique index (digits only)
email           TEXT
cpf             TEXT
cep             TEXT
logradouro      TEXT
numero          TEXT
comp            TEXT
bairro          TEXT
cidade          TEXT
ts              INTEGER NOT NULL
ts_edit         INTEGER
```

**fornecedores**
```
id              TEXT PK
nome            TEXT NOT NULL
tel             TEXT NOT NULL
servico         TEXT
obs             TEXT
cat             TEXT            Category (e.g. "Tinta", "Ferramenta")
ts              INTEGER NOT NULL
ts_edit         INTEGER
```

**eventos**
```
id              TEXT PK
nome            TEXT NOT NULL
data            TEXT NOT NULL   YYYY-MM-DD
hora            TEXT NOT NULL   HH:MM
obs             TEXT
repeat          TEXT 'none'     'none' | 'daily' | 'weekly' | 'monthly'
orc_id          TEXT REFERENCES orcamentos(id)
alarm           INTEGER 0       Boolean
alarm_minutes   INTEGER         Minutes before event
alarm_unit      TEXT            'm' | 'h' | 'd'
alarm_val       INTEGER
alarmado        INTEGER 0       Boolean: alarm has fired
notification_id INTEGER         expo-notifications ID — required for cancellation
ts              INTEGER NOT NULL
ts_edit         INTEGER
```

**config** (key-value, one row per setting)
```
key             TEXT PK         e.g. 'empresa', 'tel', 'servicos'
value           TEXT NOT NULL   JSON-serialized
updated_at      INTEGER
```

**media**
```
id              TEXT PK
entity_id       TEXT NOT NULL   Item ID, or 'config' for logo/signature
entity_type     TEXT NOT NULL   'item' | 'orcamento' | 'config'
field_name      TEXT            For config: 'logo' | 'assinatura'
local_path      TEXT NOT NULL   Full path in documentDirectory
mime_type       TEXT 'image/jpeg'
file_size       INTEGER         Bytes after compression
sha256          TEXT            Hash — deduplication key + thumbnail filename
thumb_path      TEXT            cacheDirectory/thumbs/{sha256}.jpg
created_at      INTEGER NOT NULL
sync_status     TEXT 'local'    'local' | 'synced' | 'pending_delete'
remote_url      TEXT            Cloud URL if ever synced (future)
deleted_at      INTEGER         Soft delete; file deleted when set
sort_order      INTEGER 0
```

### Why Rooms and Items Are Their Own Tables

Three reasons, all concrete:

1. **Cascade deletes.** `ON DELETE CASCADE` on foreign keys handles relational cleanup
   automatically. Without it, deleting a budget requires the application to parse nested
   JSON, extract photo references, delete files, and clean up manually.

2. **Photo references.** The media table uses `entity_id = item.id`. If items have no
   table, there is no stable item ID to reference — photo paths live inside a
   three-level nested JSON blob that must be fully parsed to access any photo.

3. **Future queries.** "Average price per m² by service type" becomes a SQL query with
   normalized tables. With JSON blobs it requires loading every budget into memory.

### Migration Strategy

Migrations live in `core/database/migrations/` numbered sequentially. The migration
runner checks a `schema_migrations` tracking table on every startup and applies
outstanding migrations in order. Migrations are never destructive — `ALTER TABLE ADD
COLUMN` with a default value, never `DROP COLUMN` (use soft deprecation across two
release cycles before dropping).

---

## Part 7 — Key Feature Implementations

### Budget Wizard

Three-step flow maintained in `budgetsStore.currentDraft` across steps. Navigation
is Expo Router nested routes. No DOM input reading — form values update the store
directly on change. Draft auto-saves to SQLite on background/blur. Discard
confirmation fires when `currentDraft !== null` on back navigation.

### Photo Capture Flow

1. User taps camera button → `CameraModal` renders with `expo-camera` `<CameraView>`
2. `takePictureAsync()` → temporary file URI
3. `SavePhotoUseCase`:
   - Compute SHA-256 of raw bytes
   - Resize + compress: `ImageManipulator` → max 1600px wide, JPEG quality 0.82
   - Write to `documentDirectory/photos/{orcId}/{uuid}.jpg`
   - Generate thumbnail: 200×200 JPEG quality 0.6 → `cacheDirectory/thumbs/{sha256}.jpg`
   - Insert media table row with `entity_id = item.id`
4. Photos displayed via `expo-image` using `local_path` file URI

Thumbnail cache miss: regenerate lazily from original on next display.

### PDF Generation

`buildOrcPDFHtml(orc, config, mediaResolver)` in `pdfTemplate.ts` — direct port of
existing `_buildOrcPDFHtml`, with `mediaResolver(mediaId) → string` replacing
Base64 embedding. The resolver maps media IDs to `file://` URIs readable by the
WebView inside expo-print.

`GeneratePdfUseCase`: call template → `Print.printToFileAsync({ html })` → share via
`expo-sharing`. User gets a real PDF file to save or share to WhatsApp.

### Alarm System

Old approach: `setInterval` polling every 30s — only works when app is open.

New approach: `expo-notifications` schedules native Android AlarmManager entries.

- `AlarmService.computeTriggerDate(evento)` → exact Date
- `NotificationService.schedule(title, body, triggerDate)` → returns `notificationId`
- `notificationId` stored in `eventos.notification_id`
- Delete/edit → `Notifications.cancelScheduledNotificationAsync(notificationId)` before rescheduling
- On `AppStarted`: `RescheduleAllAlarmsUseCase` verifies all future-dated eventos have
  registered notifications and reschedules missing ones (Android clears notifications on restart)

Permission requested on first alarm creation — not on app startup (Play Store policy).

### CEP Lookup

Direct port of existing three-API fallback chain in `appConfig.ts`:

1. `brasilapi.com.br/api/cep/v2/{cep}` (primary)
2. `viacep.com.br/ws/{cep}/json/` (fallback 1)
3. `opencep.com/v1/{cep}` (fallback 2)

Each attempt has a 5-second `AbortController` timeout. Returns structured address
object on success; rejects on all three failures. `CepLookupField` component handles
UX: debounce 500ms, spinner, auto-fill, error message. Reused in both the client form
and budget wizard step 1.

### WhatsApp Sharing

Two strategies:

1. **PDF share:** `expo-sharing` → Android share sheet → user selects WhatsApp
2. **Text direct:** `Linking.openURL('https://wa.me/55' + digitsOnly(tel) + '?text=' + encoded)`

`buildWAMsg` function ported directly from existing `whatsappTemplate.ts`. Three
format modes (`completo`, `area`, `simples`) preserved.

### Backup Export / Import

**Export:** load all repositories → serialize JSON `{ version: '2.0', exportedAt, orcamentos, rooms, items, clientes, fornecedores, eventos, config, mediaManifest }` → write to `documentDirectory/backups/` → share via `expo-sharing`. Media files listed in manifest but not bundled in v1.

**Import:** `expo-document-picker` → parse JSON → validate schema version → SQLite
transaction (delete all, re-insert all) → re-hydrate all stores → verify media paths.

---

## Part 8 — Build and Deployment

### EAS Configuration

Three build profiles in `eas.json`:

- **development**: Dev client build, connects to Expo dev server via LAN
- **preview**: Signed release APK for direct install on QA devices (not AAB)
- **production**: Signed AAB for Play Store. `NODE_ENV=production`, OTA enabled

Keystore managed by EAS secret storage. Never committed to git.

### app.json Key Fields

```json
"expo.android.package": "com.pintorplus.app"
"expo.android.versionCode": auto-incremented by EAS
"expo.version": "1.0.0" at launch
"expo.plugins": ["expo-camera", "expo-notifications", "expo-contacts"]
```

### Android Permissions

```
CAMERA
POST_NOTIFICATIONS                     Android 13+
SCHEDULE_EXACT_ALARM
RECEIVE_BOOT_COMPLETED                 Reschedule alarms on device restart
READ_CONTACTS
READ_EXTERNAL_STORAGE   maxSdk 32      Backup import on Android 12 and below
WRITE_EXTERNAL_STORAGE  maxSdk 29      Backup export on Android 9 and below
```

### Play Store Submission Path

1. `eas build --profile production --platform android`
2. First upload: Play Console manual upload, internal testing track
3. Configure: privacy policy URL, content rating, data safety form
4. Promote internal → closed testing (5 testers required)
5. Promote → production (3–7 day review for new apps)
6. Subsequent: `eas submit --platform android --latest` via service account

### Data Safety Form Answers (LGPD + Play Store)

- No data collected by app developer
- No data shared with third parties
- CEP lookup sends postal code only — not linked to user identity
- Backup is user-initiated, user-controlled device storage

---

## Part 9 — Development Phases

Each phase ends with a working app. No skeletons. No TODOs blocking a phase sign-off.

### Phase 0 — Foundation (1 week)

Goal: working shell with database, navigation, and all infrastructure.

- `expo init` — SDK 52, TypeScript strict, Expo Router v3
- `core/database/schema.ts` — all Drizzle table definitions
- `core/database/db.ts` — SQLite singleton, migration runner, first migration
- `core/events/EventBus.ts` + `events.ts`
- `core/notifications/NotificationService.ts`
- `core/storage/FileStorage.ts`
- `core/shared/utils.ts` — port from existing
- `core/shared/formatters.ts`, `validators.ts`
- `core/shared/cep/CepService.ts` — 3-API fallback
- `app/_layout.tsx` — init sequence, navigation shell
- `app/(tabs)/_layout.tsx` — 5-tab bar
- Placeholder screens for all tabs
- `eas.json`, `app.json` configured

**Done when:** App builds, displays 5 tabs on real Android device, database initializes
without errors, all migrations run, EventBus test event roundtrips.

---

### Phase 1 — Config Module (1 week)

Goal: company configuration fully functional and persisted.

- `modules/config/` — all four layers
- `ConfigScreen` — company info, logo, signature, services, payment methods, status
  list, message template
- `SaveLogoUseCase`, `SaveSignatureUseCase` — expo-file-system
- `ExportBackupUseCase` — JSON + expo-sharing
- `ImportBackupUseCase` — document picker + restore
- `configStore` hydrated on startup, available to all modules

**Done when:** User sets company name + services. Config persists across restarts.
Logo and signature save to filesystem and display after restart. Export produces valid
JSON. Import restores all config values.

---

### Phase 2 — Clients and Suppliers (1 week)

Goal: full CRUD for contacts.

- `modules/clients/` — all four layers
- `ClientesListScreen` with search
- `ClienteFormScreen` — all fields, CEP lookup, address auto-fill
- `ContactPickerButton` — expo-contacts
- `modules/suppliers/` — all four layers
- `FornecedoresListScreen` — category filter + search
- `FornecedorFormScreen`
- `SendWhatsAppQuoteUseCase`
- `UpsertClienteFromBudgetUseCase` wired to `BudgetSaved` (handler exists, tested
  at end of Phase 3)

**Done when:** Full CRUD for both entities, persists across restarts. CEP auto-fills
correctly. Contact picker imports from device phonebook. Supplier WhatsApp opens with
pre-filled message.

---

### Phase 3 — Budgets Module (2.5 weeks)

The most complex phase. Split into three sub-steps.

**Sub-step 3a (3 days):** Budget list and view.
- `OrcamentosListScreen` — search, status filter, sort
- `BudgetViewScreen` — read-only
- `OrcamentoCard` — swipe-to-delete
- `GetBudgetsUseCase`, `GetBudgetByIdUseCase`, `DeleteBudgetUseCase`

**Sub-step 3b (4 days):** Wizard steps 1 and 3.
- `BudgetWizardScreen` — step indicator
- Step 1: client fields, CEP lookup, client picker
- Step 3: pricing, payment methods, format, status, dates, notes
- `SaveBudgetUseCase` — validation + persist + emit `BudgetSaved`
- `SendWhatsAppUseCase` — buildWAMsg → WhatsApp deep link
- `GeneratePdfUseCase` — buildOrcPDFHtml → expo-print → expo-sharing
- `BudgetSaved` → `UpsertClienteFromBudgetUseCase` verified end-to-end

**Sub-step 3c (5 days):** Rooms and items (wizard step 2).
- `RoomCard` — collapse/expand
- `ItemEditorScreen` — all item fields
- `PhotoGrid` — add/view/delete photos
- `CameraModal` — expo-camera viewfinder, torch, capture
- Full photo capture → compress → filesystem → media table → display
- Add/edit/delete rooms and items via use cases
- Per-room pricing mode (fixed vs per-m²) wired to `calcOrcTotal`

**Done when:** Create full budget from scratch — 2+ rooms, items with photos, payment
selection. PDF renders correctly. WhatsApp message sends with correct text. Saving
auto-upserts client record. All data persists across app restarts.

---

### Phase 4 — Flash and Agenda (1 week)

**Flash:**
- `modules/flash/` — all four layers
- `FlashWizardScreen` — 3 steps
- `PromoteFlashDraftUseCase` linking to full budget

**Agenda:**
- `modules/agenda/` — all four layers
- `AgendaScreen` — month grid, event dots
- `EventoFormScreen` — alarm configuration
- `SaveEventoUseCase` — persist + schedule notification
- `DeleteEventoUseCase` — cancel notification
- `RescheduleAllAlarmsUseCase` — wired to `AppStarted`
- Notification permission on first alarm creation

**Done when:** Flash creates draft in 3 steps, can be promoted to full budget. Events
appear on calendar. Alarms fire at correct time when app is closed. Repeat events
reschedule after firing.

---

### Phase 5 — Polish, Testing, Play Store (1 week)

- End-to-end test on 2+ real Android devices (different API levels)
- Notification permission flow on Android 13+
- Camera torch/zoom on supported devices
- CEP with real Brazilian postal codes
- PDF on Android native PDF viewer
- WhatsApp integration on device with WhatsApp installed
- Backup round-trip: export → delete all → import → verify all data restored
- TypeScript: zero errors, no type assertions except in mappers
- Jest unit tests: `calcOrcTotal`, `buildWAMsg`, `buildOrcPDFHtml`, `formatters.*`,
  `validators.*`, `CepService` (mocked providers)
- Play Store assets: app icon 512px, feature graphic 1024×500px, device screenshots
- `eas build --profile production` successful
- Internal track install + verification
- Privacy policy URL accessible
- Data safety form completed

**Done when:** Production AAB installs from internal Play Store track on real device,
all features work, listing ready for promotion to production.

---

## Part 10 — Full Timeline and Cost

```
Phase 0 — Foundation                      1 week
Phase 1 — Config module                   1 week
Phase 2 — Clients + Suppliers             1 week
Phase 3 — Budgets module                  2.5 weeks
Phase 4 — Flash + Agenda                  1 week
Phase 5 — Polish + Play Store             1 week
─────────────────────────────────────────────────
Total                                     7.5 weeks
Play Store fee                            $25 (one-time)
Cloud infrastructure                      $0
```

---

## Part 11 — npm Install Commands

```bash
# Initialize
npx create-expo-app pintor-plus --template tabs
cd pintor-plus

# Core
npx expo install expo-sqlite expo-file-system expo-image expo-image-manipulator
npx expo install expo-camera expo-notifications expo-contacts expo-print expo-sharing
npx expo install expo-document-picker

# ORM
npm install drizzle-orm
npm install -D drizzle-kit

# State
npm install zustand immer

# Routing (included with Expo Router, verify version)
npx expo install expo-router

# Build tooling (global or project)
npm install -g eas-cli
eas login
eas build:configure
```

---

## Superseded Documents

The following documents are retained for reference only. All decisions in them are
superseded by this document:

| Document | Superseded decision |
|----------|-------------------|
| `android-migration-opinion.md` | Capacitor approach — replaced by React Native |
| `MASTER-PLAN.md` (previous version) | Capacitor + SQLite approach — replaced by this |
| `sota-architecture.md` | Full architecture detail — synthesized into this document |
| `codebase-state-audit.md` | Audit findings — summarized in Part 2 |
| `sqlite-storage&file-storage.md` | Storage directives — incorporated in Part 6 |
| `review.md` | Original PWA audit — referenced in Part 2 |
