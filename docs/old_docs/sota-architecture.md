# Pintor Plus — State of the Art Architecture Document
### React Native + Expo Modular Monolith: Complete Architecture, Data, and Implementation Guide

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Modular Monolith Architecture](#3-modular-monolith-architecture)
4. [Complete Directory Structure](#4-complete-directory-structure)
5. [Data Architecture](#5-data-architecture)
6. [State Management](#6-state-management)
7. [Cross-Module Communication](#7-cross-module-communication)
8. [Key Feature Implementations](#8-key-feature-implementations)
9. [Migration Strategy from Existing Code](#9-migration-strategy-from-existing-code)
10. [Build and Deployment](#10-build-and-deployment)
11. [Development Phases](#11-development-phases)

---

## 1. Executive Summary

This document defines the complete production architecture for Pintor Plus v2 — a ground-up rebuild of the existing Capacitor PWA into a native Android application using React Native and Expo. It is written for the developer who will implement it. Every decision here is final and justified. The goal is not to explore options; it is to hand over a blueprint.

### What This Document Is

This is the single authoritative source for every structural decision about the new Pintor Plus application: what technology runs where, how modules are organized, how data flows, how the database is structured, and in what sequence the build happens. A developer reading this document should be able to begin implementation immediately without needing to revisit trade-offs already settled here.

### Core Philosophy

**Local-first.** The app functions completely without internet access. Data lives on the device. Network calls are optional, bounded, and never block the user. The architecture reflects this unconditionally: there is no global loading state waiting for a server response, no mandatory authentication, no cloud data store. Every feature works offline because there is no online mode to fall back to.

**Modular monolith.** The app is shipped as a single APK. Internally it is organized as six feature modules, each with hard boundaries, private internals, and a public interface. This is not microservices (no inter-process communication, no separate deployments). It is not a flat feature folder structure (no domain logic leaking across module boundaries). It is the discipline of clean architecture applied inside a single binary.

**No broken features at launch.** The existing PWA has all its features working. The React Native rebuild must reach parity on every feature before any production release. A partially working app is not a release candidate. This principle governs every phase decision: each phase produces a working app with a defined feature set, not a skeleton waiting for future PRs.

### Why React Native and Not the Capacitor Approach

All prior context documents correctly advised staying on Capacitor to ship faster. That advice was correct for the immediate term. The decision to use React Native for this rebuild is a deliberate strategic choice made from a position of having validated the product: the domain logic is proven, the user flows are known, and the architectural debt of the current codebase (dual S objects, three orphaned modules, 2,540 lines of inline script that cannot be removed) makes a clean rebuild faster than continuing to patch the existing structure.

The Capacitor approach is limited in three specific ways that matter for this product: the WebView rendering ceiling prevents smooth animations that match native paint app aesthetics, advanced camera features (torch, zoom, burst) require the native camera API rather than getUserMedia, and background alarm delivery requires a notification plugin that already forces a native integration. The sum of those native plugin integrations, combined with the existing architectural debt, means the effort to make the Capacitor app truly native-quality approaches the effort of the React Native rebuild — without the architectural clean break.

React Native with Expo gives native rendering, a full native camera, scheduled notifications that work correctly in the background, and a codebase that can be structured cleanly from the start.

### What Does Not Change

The business logic is correct in the existing codebase and it will be ported, not rewritten. The `calcOrcTotal` function, the `buildWAMsg` WhatsApp message builder, the `valorPorExtenso` currency-to-words converter, the `fetchCep` three-API fallback, the PDF HTML template, and all the domain type definitions map directly from the current TypeScript to the new modules. Ports, not rewrites. This is the fastest path to feature parity.

---

## 2. Technology Stack

Every library listed here has a specific version and a specific reason for that choice over its alternatives. Version pinning is strict — React Native and Expo ecosystems move fast, and architecture decisions are often invalidated by minor version bumps.

| Layer | Library | Version | Purpose | Why This, Not the Alternative |
|---|---|---|---|---|
| Runtime | React Native | 0.76.x (via Expo SDK 52) | Native UI rendering engine | SDK 52 ships with the New Architecture (Fabric + JSI) enabled by default. The New Architecture eliminates the bridge bottleneck in JS-to-native calls — critical for camera, filesystem, and notifications. |
| SDK | Expo SDK | 52 | Managed workflow, OTA updates, EAS services | SDK 52 is the current LTS with stable New Architecture support. Not 51 (predates New Architecture default). Not bare workflow (loses OTA and EAS integration). |
| Routing | Expo Router | 3.x | File-based navigation, deep linking, URL handling | Expo Router v3 is built on React Navigation v7. File-based routing eliminates manual stack definition — the directory structure is the route map. The budget wizard multi-step flow maps to nested route files, not imperative push/pop logic. Not React Navigation standalone because it requires manual route type declarations. |
| Database ORM | Drizzle ORM | 0.38.x | Type-safe SQLite query builder and schema manager | Drizzle generates TypeScript types from schema definitions — column names and types are known at compile time, not inferred at runtime. Not Prisma (no Android support). Not TypeORM (massive bundle, decorator-based, incompatible with strict React Native). Not raw expo-sqlite (no type safety, no migration system). Drizzle's schema-as-code approach means the TypeScript type for a budget row is the source of truth for both the database column and the application type. |
| SQLite driver | expo-sqlite | 15.x | Native SQLite engine on Android | The only SQLite driver with first-party Expo support and New Architecture compatibility. `@capacitor-community/sqlite` is specifically the wrong choice here — it assumes a Capacitor bridge that does not exist in a React Native app. expo-sqlite uses JSI directly in SDK 52, avoiding the async bridge overhead. |
| State | Zustand | 4.x | Per-module reactive state stores | Zustand is the minimal-surface state library: no boilerplate, no action creators, no reducers, no selectors library. A store is a function that returns an object. Compared to Redux Toolkit: RTK adds 15KB and requires three files (slice, actions, selectors) for every piece of state. Compared to Jotai: Jotai is atom-based which creates implicit dependencies between modules — exactly what the modular monolith pattern forbids. Zustand stores can be created per-module without a global provider. |
| State mutation | Immer | 10.x | Immutable state updates with mutable syntax | Immer integrates with Zustand via the `immer` middleware. Writing `state.budgets[0].status = 'Aprovado'` instead of `{ ...state, budgets: state.budgets.map((b, i) => i === 0 ? { ...b, status: 'Aprovado' } : b) }` eliminates an entire category of bugs in nested object mutations. |
| File system | expo-file-system | 18.x | Photo and binary file storage in app Documents dir | First-party Expo library with JSI implementation. Provides `FileSystem.documentDirectory` (persistent, never cleared by OS) and `FileSystem.cacheDirectory` (cleared under storage pressure). The separation between these two directories is the foundation of the photo storage strategy. |
| Camera | expo-camera | 16.x | Native camera viewfinder and capture | expo-camera in SDK 52 uses the new Camera API on Android 13+ and falls back gracefully. It provides torch, zoom, and focus controls as native-level features. Not expo-image-picker alone because image-picker only accesses the gallery or triggers the system camera — it does not provide an embedded viewfinder for the in-app camera experience needed for item photos. |
| Image display | expo-image | 2.x | Optimized image loading with caching and blurhash | expo-image renders images with a native fast path, supports `blurhash` placeholders while loading, and handles `file://` URIs for locally stored photos without any transformation. Not React Native's built-in `<Image>` — it does not cache disk images efficiently and has no placeholder support. |
| Image processing | expo-image-manipulator | 13.x | Compression and thumbnail generation | Provides resize, compress, and crop as native operations. Used immediately after camera capture to compress photos to JPEG quality 82 and to generate thumbnails. Not running canvas-based compression in JS — that would block the JS thread during a slow operation. |
| Notifications | expo-notifications | 0.29.x | Scheduled local notifications for event alarms | expo-notifications schedules future-dated notifications that fire even when the app is in the background or closed. This is the native Android AlarmManager under the hood. The existing agenda.ts polling approach (setInterval every 30 seconds) only works when the app is open. The replacement fires the notification at exact scheduled time regardless of app state. |
| Contacts | expo-contacts | 14.x | Native Android contacts picker | expo-contacts provides a native contact picker UI identical to what users expect from Android. Returns structured contact data (name, phone numbers, email addresses). Replaces the `navigator.contacts.select()` Web Contacts API that is not available in React Native. |
| PDF generation | expo-print | 13.x | Print-to-PDF from HTML string | expo-print takes an HTML string and produces a PDF file. This is the exact integration point for the existing `_buildOrcPDFHtml` function — the template logic is preserved, only the render target changes from `window.print()` to `Print.printToFileAsync({ html })`. |
| Share sheet | expo-sharing | 12.x | Native Android share sheet | expo-sharing triggers the Android share intent with a file path. Used for sharing PDFs and WhatsApp messages. The WhatsApp `wa.me/` URL deep link approach is preserved as a fallback. |
| Build system | EAS Build | current | Cloud APK/AAB builds, signing management | EAS Build manages Android keystore signing without requiring a local Android SDK installation. The `eas build --profile production --platform android` command produces a signed AAB ready for Play Store upload. Not local Gradle builds for the standard developer flow — they require the full Android SDK and are environment-sensitive. |
| Distribution | EAS Submit | current | Automated Play Store submission | EAS Submit uploads AAB files to Google Play and handles API authentication via a service account JSON. Removes manual Play Console interaction from the release process. |
| OTA updates | expo-updates | 0.27.x | Over-the-air JavaScript bundle updates | Critical for a production app: bug fixes and content changes can be pushed without a full Play Store review cycle. The native Android code (camera, notifications, SQLite) requires a full rebuild; JavaScript-layer changes (UI, business logic, templates) go through OTA. |
| Testing | Jest + RNTL | 29.x + 12.x | Unit and component testing | React Native Testing Library provides a testing environment that renders components without a real device. Jest handles pure unit tests (domain logic, formatters, calculators). Not Detox for the first version — end-to-end device tests are phase 4 work. |
| Language | TypeScript | 5.x (strict) | End-to-end type safety | `strict: true` in tsconfig means no implicit any, no unchecked index access, no optional properties accessed without null checks. Every function signature is explicit. Every repository return type is known at compile time. This is not optional — the existing codebase's type holes (everything typed as `any` in budgets.ts) are a direct source of bugs. |

---

## 3. Modular Monolith Architecture

### What It Is and Why It Was Chosen

A modular monolith is an application that ships as a single deployable unit — one APK — but is internally organized into feature modules with enforced boundaries. Each module is a self-contained vertical slice of the application: it owns its domain types, its database operations, its business logic, and its UI components. No other module can reach inside another module's internal implementation.

The three alternatives considered were: flat feature folder structure, monolith-with-shared-state, and microservices (separate apps). Flat feature folders were rejected because they do not enforce boundaries — a developer can import any file from anywhere, and in a six-domain app with significant cross-cutting concerns (budgets reference clients, agenda references budgets), the imports quickly become a web of circular dependencies. Monolith-with-shared-state was the pattern of the existing codebase (the `S` global object) and it failed at scale: the global `S` object became the implicit dependency of every module, making modules impossible to test or reason about independently. Microservices were never relevant for a local-first single-user mobile app.

The modular monolith pattern gives the discipline of separate modules (each module knows only its own internals and the public interfaces of modules it depends on) while avoiding the operational complexity of microservices. One APK. One build. One deployment. Clean internal structure.

### What "Module" Means Here

A module is a directory under `modules/` that contains everything needed to implement one feature domain. It is not a React Native package. It is not a separate npm module. It is a directory with a defined internal layer structure and a public API surface that consists of only:

1. The types it exports from its `domain/` layer (shared with other modules that need to reference them).
2. The store slice it exposes for UI that lives outside the module (rare — usually only for cross-module navigation targets).
3. The events it emits on the EventBus (not direct function calls — more on this below).

Everything else inside a module is private. Another module cannot import a component from inside `modules/budgets/presentation/`. It cannot call a function from inside `modules/budgets/data/`. The only way to interact with a module is through its public surface.

### The Four Internal Layers

Each module follows the same four-layer internal structure, reflecting the Ports and Adapters (Hexagonal Architecture) pattern adapted for React Native:

**Domain layer** (`domain/`): Pure TypeScript. No React. No SQLite. No Expo APIs. Contains the module's types, repository interfaces (contracts), and business logic functions. This is the innermost ring of the architecture and it has zero external dependencies. If you can run it in a Node.js REPL, it belongs here. The budget calculation engine lives here. The WhatsApp message builder lives here. The PDF template function lives here. The repository interfaces (IBudgetRepository) live here as TypeScript interfaces — they define the contract that the data layer must fulfill, but they have no implementation.

**Data layer** (`data/`): The SQLite implementation of the domain layer's repository interfaces. SQLitebudgetRepository implements IBudgetRepository using expo-sqlite through Drizzle ORM. The data layer is the only layer that imports expo-sqlite or Drizzle. Nothing in the application layer or presentation layer knows that SQLite exists — they talk to the repository interface, not the implementation. This is the boundary that allows the SQLite implementation to be swapped (for a different database, for a test mock, for an in-memory store) without touching any other file.

**Application layer** (`application/`): Use cases and the Zustand store slice. A use case is a function that coordinates between the repository and the EventBus to fulfill a user intent. `SaveBudgetUseCase` calls the repository to persist, then emits a `BudgetSaved` event on the EventBus. The Zustand store slice holds the module's in-memory state: the list of budgets, the currently-editing draft, loading flags. The application layer imports from the domain layer (types and interfaces) and the data layer (concrete repository via dependency injection). It does not import React or React Native.

**Presentation layer** (`presentation/`): React Native screens and components specific to this module. They are thin: they read from the Zustand store, dispatch to application layer use cases, and render UI. The presentation layer does not contain business logic. It does not call SQLite. It does not know about the EventBus. It delegates all intent to the application layer.

### Dependency Direction

Dependencies always point inward. The presentation layer depends on the application layer. The application layer depends on the domain layer. The data layer depends on the domain layer (to implement its interfaces). The domain layer depends on nothing.

```
presentation  →  application  →  domain  ←  data
```

Never reverse this. If a domain type needs to know about a screen, something is wrong. If the data layer imports from the presentation layer, something is wrong. TypeScript path aliases enforce this: `~modules/budgets/data/` cannot be imported in `~modules/budgets/domain/`.

### How Modules Communicate

Modules never import from each other's internal layers. If the Budgets module needs to notify the Agenda module that a budget was saved and a new appointment should be created, it does not call a function in the Agenda module directly. It emits a typed event on the EventBus.

The EventBus is not a workaround — it is the intentional coupling mechanism between modules. It makes all cross-module interactions visible in one place: the event definitions file. When you look at `core/events/events.ts`, you can see every cross-module interaction in the system. This is a significant debugging and maintenance advantage over implicit direct imports.

---

## 4. Complete Directory Structure

The following is the complete file tree for the project. Every folder is explained. Every structural decision is deliberate.

```
pintor-plus/
│
├── app/                          Expo Router file-based route tree
│   │                             These files are thin shells. No business logic here.
│   │                             Each file renders a module's presentation screen.
│   │
│   ├── _layout.tsx               Root layout: database init, store hydration, notification setup
│   ├── index.tsx                 Redirects to /(tabs)/orcamentos (the home tab)
│   │
│   ├── (tabs)/                   Bottom tab navigator
│   │   ├── _layout.tsx           Tab bar definition: 5 tabs + icons
│   │   ├── orcamentos.tsx        Budgets list screen shell → OrcamentosListScreen
│   │   ├── clientes.tsx          Clients list screen shell → ClientesListScreen
│   │   ├── agenda.tsx            Calendar screen shell → AgendaScreen
│   │   ├── fornecedores.tsx      Suppliers list screen shell → FornecedoresListScreen
│   │   └── config.tsx            Config screen shell → ConfigScreen
│   │
│   ├── orcamentos/               Budget sub-routes (outside tabs, full-screen flows)
│   │   ├── new.tsx               New budget wizard entry → BudgetWizardScreen (step 1)
│   │   ├── [id]/
│   │   │   ├── edit.tsx          Edit existing budget → BudgetWizardScreen (pre-filled)
│   │   │   ├── view.tsx          Read-only budget view → BudgetViewScreen
│   │   │   └── rooms/
│   │   │       └── [roomId]/
│   │   │           └── item/
│   │   │               └── [itemId].tsx  Item editor → ItemEditorScreen
│   │   └── flash/
│   │       └── new.tsx           Flash quick-budget entry → FlashWizardScreen
│   │
│   ├── clientes/
│   │   ├── new.tsx               New client form → ClienteFormScreen
│   │   └── [id]/
│   │       └── edit.tsx          Edit client form → ClienteFormScreen (pre-filled)
│   │
│   ├── fornecedores/
│   │   ├── new.tsx               New supplier form → FornecedorFormScreen
│   │   └── [id]/
│   │       └── edit.tsx          Edit supplier form
│   │
│   └── agenda/
│       ├── new.tsx               New event form → EventoFormScreen
│       └── [id]/
│           └── edit.tsx          Edit event form
│
├── modules/                      Feature modules — the heart of the architecture
│   │
│   ├── budgets/                  Core domain: budget lifecycle
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts          Orcamento, Room, Item interfaces (ported from existing types.ts)
│   │   │   ├── IBudgetRepository.ts  Repository contract interface
│   │   │   ├── BudgetService.ts  Pure business logic: calcOrcTotal, collectOrc, extractClient
│   │   │   ├── pdfTemplate.ts    _buildOrcPDFHtml ported from existing budgets.ts
│   │   │   ├── whatsappTemplate.ts  buildWAMsg ported from existing budgets.ts
│   │   │   └── validations.ts    validateOrc: name required, phone format, etc.
│   │   │
│   │   ├── data/
│   │   │   ├── SQLiteBudgetRepository.ts   Drizzle-based IBudgetRepository implementation
│   │   │   └── mappers.ts        DB row → domain type transformations
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveBudgetUseCase.ts     Validate → persist → emit BudgetSaved event
│   │   │   │   ├── DeleteBudgetUseCase.ts   Delete budget + associated media
│   │   │   │   ├── GetBudgetsUseCase.ts     List with optional filter/sort
│   │   │   │   ├── GetBudgetByIdUseCase.ts  Single budget with rooms and items
│   │   │   │   ├── SendWhatsAppUseCase.ts   Build message → expo-sharing
│   │   │   │   ├── GeneratePdfUseCase.ts    Build HTML → expo-print → share
│   │   │   │   └── PromoteFlashUseCase.ts   Convert isFlashDraft=true to full budget
│   │   │   │
│   │   │   └── store/
│   │   │       └── budgetsStore.ts    Zustand slice: list, draft, loading, filters
│   │   │
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── OrcamentosListScreen.tsx   Searchable budget list with status badges
│   │       │   ├── BudgetWizardScreen.tsx     Multi-step wizard with draft Zustand state
│   │       │   ├── BudgetViewScreen.tsx       Read-only summary with action buttons
│   │       │   └── ItemEditorScreen.tsx       Room item detail editor with camera
│   │       │
│   │       └── components/
│   │           ├── OrcamentoCard.tsx           List item card with swipe actions
│   │           ├── RoomCard.tsx                Expandable room section
│   │           ├── ItemSummary.tsx             Item row in room list
│   │           ├── PricingModeSelector.tsx     Fixed vs per-m2 toggle
│   │           ├── StatusBadge.tsx             Colored status pill
│   │           ├── PhotoGrid.tsx               Grid of item photos with add button
│   │           ├── CameraModal.tsx             In-app camera viewfinder
│   │           └── WizardStepIndicator.tsx     Step 1/2/3 progress indicator
│   │
│   ├── clients/                  Client and contact management
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts          Cliente interface
│   │   │   ├── IClienteRepository.ts
│   │   │   └── ClienteService.ts   normalizeCliente, mergeFromOrcamento, validateCliente
│   │   │
│   │   ├── data/
│   │   │   ├── SQLiteClienteRepository.ts
│   │   │   └── mappers.ts
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveClienteUseCase.ts
│   │   │   │   ├── DeleteClienteUseCase.ts
│   │   │   │   ├── GetClientesUseCase.ts
│   │   │   │   ├── UpsertClienteFromBudgetUseCase.ts  Called by EventBus on BudgetSaved
│   │   │   │   └── PickContactUseCase.ts     expo-contacts integration
│   │   │   │
│   │   │   └── store/
│   │   │       └── clientesStore.ts
│   │   │
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── ClientesListScreen.tsx
│   │       │   └── ClienteFormScreen.tsx     With CEP lookup integration
│   │       │
│   │       └── components/
│   │           ├── ClienteCard.tsx
│   │           ├── CepLookupField.tsx        CEP input with loading state and auto-fill
│   │           └── ContactPickerButton.tsx
│   │
│   ├── suppliers/                Supplier (fornecedor) management
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts          Fornecedor interface
│   │   │   ├── IFornecedorRepository.ts
│   │   │   └── FornecedorService.ts
│   │   │
│   │   ├── data/
│   │   │   └── SQLiteFornecedorRepository.ts
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveFornecedorUseCase.ts
│   │   │   │   ├── DeleteFornecedorUseCase.ts
│   │   │   │   ├── GetFornecedoresUseCase.ts
│   │   │   │   └── SendWhatsAppQuoteUseCase.ts  WhatsApp message to supplier
│   │   │   │
│   │   │   └── store/
│   │   │       └── fornecedoresStore.ts
│   │   │
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── FornecedoresListScreen.tsx
│   │       │   └── FornecedorFormScreen.tsx
│   │       │
│   │       └── components/
│   │           ├── FornecedorCard.tsx
│   │           └── CategoryFilter.tsx
│   │
│   ├── agenda/                   Calendar, events, and alarm scheduling
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts          Evento interface; RepeatRule enum
│   │   │   ├── IEventoRepository.ts
│   │   │   └── AlarmService.ts   computeAlarmTime, scheduleNotification contract
│   │   │
│   │   ├── data/
│   │   │   └── SQLiteEventoRepository.ts
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveEventoUseCase.ts     Persist + schedule notification
│   │   │   │   ├── DeleteEventoUseCase.ts   Cancel notification + delete
│   │   │   │   ├── GetEventosUseCase.ts
│   │   │   │   ├── CreateEventFromBudgetUseCase.ts  Called by EventBus on OrcamentoIniciado
│   │   │   │   └── RescheduleAllAlarmsUseCase.ts    Called on app startup
│   │   │   │
│   │   │   └── store/
│   │   │       └── agendaStore.ts
│   │   │
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── AgendaScreen.tsx          Month/week calendar view
│   │       │   └── EventoFormScreen.tsx      Event editor with alarm picker
│   │       │
│   │       └── components/
│   │           ├── CalendarGrid.tsx
│   │           ├── EventDot.tsx
│   │           ├── EventCard.tsx
│   │           └── AlarmPicker.tsx           Minutes/hours/days before toggle
│   │
│   ├── config/                   Company settings, backup, and app configuration
│   │   │
│   │   ├── domain/
│   │   │   ├── types.ts          Config interface
│   │   │   ├── IConfigRepository.ts
│   │   │   └── BackupService.ts  serializeBackup, deserializeBackup, validateBackup
│   │   │
│   │   ├── data/
│   │   │   └── SQLiteConfigRepository.ts
│   │   │
│   │   ├── application/
│   │   │   ├── useCases/
│   │   │   │   ├── SaveConfigUseCase.ts
│   │   │   │   ├── GetConfigUseCase.ts
│   │   │   │   ├── ExportBackupUseCase.ts    SQLite dump + media archive → share
│   │   │   │   ├── ImportBackupUseCase.ts    Parse JSON, validate, restore all tables
│   │   │   │   ├── SaveLogoUseCase.ts        Compress → filesystem → media table
│   │   │   │   └── SaveSignatureUseCase.ts
│   │   │   │
│   │   │   └── store/
│   │   │       └── configStore.ts
│   │   │
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── ConfigScreen.tsx
│   │       │
│   │       └── components/
│   │           ├── CompanyInfoCard.tsx
│   │           ├── LogoPicker.tsx
│   │           ├── SignatureCanvas.tsx       Expo-based canvas for signature drawing
│   │           ├── ServicesEditor.tsx        Editable list of available services
│   │           ├── PaymentMethodsEditor.tsx
│   │           ├── StatusListEditor.tsx
│   │           ├── MessageTemplateEditor.tsx
│   │           └── BackupRestoreCard.tsx
│   │
│   └── flash/                    Quick budget mini-flow (3 steps)
│       │
│       ├── domain/
│       │   ├── types.ts          FlashDraft: minimal budget input for quick quote
│       │   └── FlashService.ts   buildFlashDraft, promoteFlashToOrcamento
│       │
│       ├── data/
│       │   └── SQLiteFlashRepository.ts     Flash drafts stored in orcamentos table (isFlashDraft=true)
│       │
│       ├── application/
│       │   ├── useCases/
│       │   │   ├── SaveFlashDraftUseCase.ts
│       │   │   ├── PromoteFlashDraftUseCase.ts    Converts to full Orcamento
│       │   │   └── GetFlashDraftsUseCase.ts
│       │   │
│       │   └── store/
│       │       └── flashStore.ts
│       │
│       └── presentation/
│           ├── screens/
│           │   └── FlashWizardScreen.tsx     3-step: Client → Services → Summary
│           │
│           └── components/
│               ├── FlashStep1.tsx            Client name + phone
│               ├── FlashStep2.tsx            Service type + quick price
│               └── FlashStep3.tsx            Summary + Send WA + Promote
│
├── core/                         Shared infrastructure — imported by all modules
│   │
│   ├── database/
│   │   ├── schema.ts             Drizzle schema: ALL tables defined here
│   │   ├── migrations/           Numbered SQL migration files
│   │   │   ├── 0001_initial.sql  Creates all tables from schema
│   │   │   └── 0002_*.sql        Future migrations (never destructive)
│   │   ├── db.ts                 expo-sqlite + Drizzle singleton; migration runner
│   │   └── index.ts              Re-exports `db` instance for all consumers
│   │
│   ├── storage/
│   │   ├── FileStorage.ts        Abstraction over expo-file-system
│   │   │                         Methods: savePhoto, getPhotoUri, deletePhoto,
│   │   │                                  saveMedia, generateThumbnail
│   │   └── paths.ts              Path constants and builders
│   │                             documentDirectory/photos/{orcId}/{uuid}.jpg
│   │                             cacheDirectory/thumbs/{sha256}.jpg
│   │
│   ├── events/
│   │   ├── EventBus.ts           Typed publish/subscribe implementation
│   │   └── events.ts             All AppEvent type union definitions
│   │
│   ├── notifications/
│   │   ├── NotificationService.ts  Wraps expo-notifications
│   │   │                           Methods: schedule, cancel, cancelAll, requestPermission
│   │   └── alarmComputer.ts      computeTriggerDate(evento: Evento): Date
│   │
│   └── shared/
│       ├── types.ts              Common types used across modules (not module-specific)
│       ├── utils.ts              Ported from existing utils.ts (pure functions only)
│       ├── formatters.ts         money(), formatPhone(), f1(), formatNum() — BRL-specific
│       ├── validators.ts         validatePhone(), validateFullName(), validateCep()
│       └── cep/
│           ├── CepService.ts     fetchCep with 3-API fallback
│           └── providers.ts      BrasilAPI, ViaCEP, OpenCEP fetch functions
│
└── assets/
    ├── fonts/                    Self-hosted Sora + DM Mono (no Google Fonts CDN needed offline)
    ├── icons/                    App icon variants for Expo
    ├── images/                   Static images (splash screen, onboarding)
    └── sounds/                   Notification sound file for alarm delivery
```

---

## 5. Data Architecture

### Design Principles

The data architecture follows three immutable rules:

1. Structured data (entities with relationships, status, timestamps) belongs in SQLite via Drizzle ORM.
2. Binary data (photos, logo, signature) belongs in the device filesystem via expo-file-system. Only the file path is stored in SQLite.
3. Thumbnails and regenerable cache files belong in the cache directory. They are acceptable to lose; the originals are in the documents directory.

No exceptions. No Base64 strings in the database. No binary columns in SQLite for user-generated content.

### SQLite Schema — All Tables

The Drizzle schema is defined once in `core/database/schema.ts`. Drizzle generates TypeScript types automatically from this schema — the database column type and the TypeScript property type are the same declaration. This eliminates a class of bugs where database columns and application types diverge silently.

**Table: orcamentos**

The budget table. Stores the top-level budget entity. Rooms and items are stored in separate tables (see normalization rationale below).

```
id           TEXT PRIMARY KEY   UUID, generated client-side
nome         TEXT NOT NULL       Client full name
apelido      TEXT               Client nickname/alias
tel          TEXT               Client phone, formatted Brazilian mobile
email        TEXT
cpf          TEXT               CPF/CNPJ (taxpayer ID)
cep          TEXT               Brazilian postal code
logradouro   TEXT               Street name
numero       TEXT               Street number
comp         TEXT               Complement (apt, block)
bairro       TEXT               Neighborhood
cidade       TEXT               City
pag_nome     TEXT               Payer name (when different from client)
pag_tel      TEXT               Payer phone
pag_end      TEXT               Payer address
pagador      INTEGER DEFAULT 0   Boolean: 0 = client pays, 1 = third-party payer
fmt          TEXT DEFAULT 'completo'  Message format: 'completo' | 'area' | 'simples'
preco        REAL DEFAULT 0      Global price per m² (optional, supplements room prices)
status       TEXT NOT NULL       Status string from config.statusList
valid        TEXT DEFAULT '15'   Validity period in days
tipo_servico TEXT               Service type label
inicio       TEXT               Estimated start date
obs          TEXT               Internal notes
date         TEXT NOT NULL       Display date, Brazilian format DD/MM/YYYY
ts           INTEGER NOT NULL    Creation timestamp milliseconds
ts_edit      INTEGER NOT NULL    Last edit timestamp milliseconds
rascunho     INTEGER DEFAULT 0   Boolean: is draft
is_flash_draft INTEGER DEFAULT 0  Boolean: came from Flash flow, pending completion
```

**Table: rooms**

Rooms belonging to a budget. One-to-many with orcamentos. Stored separately because querying rooms by budget is a frequent operation, and storing them as JSON blobs inside the budget row would require deserializing the entire budget to access room data.

```
id           TEXT PRIMARY KEY   UUID
orc_id       TEXT NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE
name         TEXT NOT NULL       Room name (e.g., "Sala", "Quarto 1")
alt          REAL DEFAULT 0      Height in meters
comp         REAL DEFAULT 0      Width/length in meters
preco        REAL DEFAULT 0      Base price for this room
preco_per_m2 INTEGER DEFAULT 0   Boolean: price is per m², not fixed
collapsed    INTEGER DEFAULT 0   UI state: whether card is collapsed
sort_order   INTEGER NOT NULL    Display order within budget
```

**Table: items**

Items belonging to a room. One-to-many with rooms. Same rationale as rooms — querying items is frequent enough to warrant a proper table.

```
id           TEXT PRIMARY KEY   UUID
room_id      TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
name         TEXT NOT NULL       Item name (e.g., "Porta", "Janela principal")
alt          REAL DEFAULT 0      Height in meters
comp         REAL DEFAULT 0      Width/length in meters
price        REAL DEFAULT 0      Item price
per_meter    INTEGER DEFAULT 0   Boolean: price is per linear/square meter
obs          TEXT               Item-specific notes
sort_order   INTEGER NOT NULL    Display order within room
```

Note that `services` (the list of services applied to a room or item) is stored as a JSON array text column on both rooms and items. The rationale: services is a simple string array that is always read with the parent entity, never queried independently (no "find all items with service X" requirement exists). Storing it as JSON text avoids a join table with no query benefit. This is a deliberate exception to the normalization principle.

```
services     TEXT DEFAULT '[]'   JSON array of service name strings
```

**Table: clientes**

```
id           TEXT PRIMARY KEY   UUID
nome         TEXT NOT NULL
apelido      TEXT
tel          TEXT NOT NULL       Unique index on digitsOnly(tel)
email        TEXT
cpf          TEXT
cep          TEXT
logradouro   TEXT
numero       TEXT
comp         TEXT
bairro       TEXT
cidade       TEXT
ts           INTEGER NOT NULL    Creation timestamp
ts_edit      INTEGER             Last edit timestamp
```

An index on `tel` (digits only) supports the client deduplication logic in `extractClient`: when a budget is saved, the system checks whether the client phone already exists in the clients table and upserts rather than inserts.

**Table: fornecedores**

```
id           TEXT PRIMARY KEY   UUID
nome         TEXT NOT NULL
tel          TEXT NOT NULL
servico      TEXT               Service description
obs          TEXT               Notes
cat          TEXT               Category (e.g., "Tinta", "Ferramenta")
ts           INTEGER NOT NULL
ts_edit      INTEGER
```

**Table: eventos**

```
id           TEXT PRIMARY KEY   UUID
nome         TEXT NOT NULL       Event title
data         TEXT NOT NULL       Event date, ISO format YYYY-MM-DD
hora         TEXT NOT NULL       Event time, HH:MM format
obs          TEXT
repeat       TEXT DEFAULT 'none'  'none' | 'daily' | 'weekly' | 'monthly'
orc_id       TEXT REFERENCES orcamentos(id)  Optional link to a budget
alarm        INTEGER DEFAULT 0   Boolean: has alarm
alarm_minutes INTEGER            Minutes before event to fire alarm (computed from unit)
alarm_unit   TEXT               'm' | 'h' | 'd'
alarm_val    INTEGER             Number of alarm units
alarmado     INTEGER DEFAULT 0   Boolean: alarm has fired
notification_id INTEGER          expo-notifications identifier, for cancellation
ts           INTEGER NOT NULL
ts_edit      INTEGER
```

The `notification_id` column stores the expo-notifications identifier returned by `Notifications.scheduleNotificationAsync`. This is required to cancel the notification when the event is deleted or the alarm is changed.

**Table: config**

A simple key-value store for the company configuration. Each config key is a row.

```
key          TEXT PRIMARY KEY   Config field name (e.g., 'empresa', 'tel', 'servicos')
value        TEXT NOT NULL       JSON-serialized value
updated_at   INTEGER
```

This design avoids the wide-table problem (a single row with 20+ columns where most are nullable) and makes it trivial to add new config fields without a migration: simply add a new key.

**Table: media**

The central table for all file-backed binary assets: item photos, company logo, signature image.

```
id           TEXT PRIMARY KEY   UUID
entity_id    TEXT NOT NULL       Budget ID, or 'config' for logo/signature
entity_type  TEXT NOT NULL       'item' | 'orcamento' | 'config'
field_name   TEXT               For config: 'logo' | 'assinatura'. For items: null.
local_path   TEXT NOT NULL       Full path in FileSystem.documentDirectory
mime_type    TEXT DEFAULT 'image/jpeg'
file_size    INTEGER             Bytes, recorded after compression
sha256       TEXT               SHA-256 of the compressed file content
thumb_path   TEXT               Path in FileSystem.cacheDirectory (regenerable)
created_at   INTEGER NOT NULL
sync_status  TEXT DEFAULT 'local'  'local' | 'synced' | 'pending_delete'
remote_url   TEXT               Cloud URL if ever synced
deleted_at   INTEGER             Soft delete timestamp; file is deleted after this is set
sort_order   INTEGER DEFAULT 0   Display order within entity
```

The `sha256` column serves two purposes: deduplication (do not save an identical photo twice) and integrity verification when restoring from backup.

### Why Rooms and Items Are Their Own Tables

The alternative — storing rooms and items as JSON blobs inside the orcamentos row — was rejected for three specific reasons.

First, cascade deletes become application-level logic. When a budget is deleted, the application must parse the room/item JSON, extract photo references, delete the files, and then delete the budget. With normalized tables, `ON DELETE CASCADE` on foreign keys handles the relational cleanup automatically, and the application only needs to delete media files before deleting the budget row.

Second, item photo references cannot be joined efficiently. The media table uses `entity_id` pointing to item IDs. If items have no table of their own, there is no stable item ID to reference in the media table. The alternative (storing photo paths inside the item JSON blob inside the room JSON blob inside the budget row) creates a three-level nested structure that must be parsed entirely to access any photo.

Third, future queries become possible. "Which rooms have items?" or "What is the average price per m² across all budgets of type X?" become simple SQL queries with normalized tables. With JSON blobs they require loading all budgets into memory and running JavaScript array operations.

The cost of normalization is two additional joins on budget reads (budget → rooms → items). This is acceptable because Drizzle generates efficient queries and expo-sqlite uses JSI for low-latency calls.

### Drizzle Schema Definition Approach

The schema in `core/database/schema.ts` uses Drizzle's table definition API. Each table definition generates both the SQLite DDL and the TypeScript type for that table's row. This means there is one source of truth:

```typescript
// core/database/schema.ts (illustrative pattern, not production code)
export const orcamentos = sqliteTable('orcamentos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  tel: text('tel'),
  // ... all columns
  ts: integer('ts').notNull(),
  tsEdit: integer('ts_edit').notNull(),
});

// Drizzle generates this TypeScript type automatically:
// type Orcamento = typeof orcamentos.$inferSelect;
// type NewOrcamento = typeof orcamentos.$inferInsert;
```

The domain-layer `Orcamento` interface in `modules/budgets/domain/types.ts` is the application-facing type and may differ slightly from the database row type (for example, the domain type has `rooms: Room[]` while the database row has no rooms column — rooms are joined separately). The `mappers.ts` file in each module's `data/` layer handles conversion between database rows and domain types.

### Migration Strategy

Migrations are SQL files in `core/database/migrations/`, numbered sequentially. The migration runner in `core/database/db.ts` runs outstanding migrations on every app startup using a `schema_migrations` table to track applied migrations.

Migrations are never destructive. Adding a column uses `ALTER TABLE ... ADD COLUMN` with a default value. Renaming a column uses a new column + data migration + old column drop (three separate migrations). The old column drop migration is only applied once no version of the app that reads the old column name is still in production — a process that respects a minimum of two consecutive release cycles.

### Repository Interface Pattern

The `IBudgetRepository` interface in `modules/budgets/domain/IBudgetRepository.ts` defines every database operation the budgets domain needs:

```typescript
// Illustrative interface pattern — exact method signatures
interface IBudgetRepository {
  getAll(filters?: BudgetFilters): Promise<Orcamento[]>;
  getById(id: string): Promise<Orcamento | null>;
  save(budget: Orcamento): Promise<void>;      // upsert
  delete(id: string): Promise<void>;
  getByClienteTel(tel: string): Promise<Orcamento[]>;
  getDrafts(): Promise<Orcamento[]>;
  getFlashDrafts(): Promise<Orcamento[]>;
}
```

The `SQLiteBudgetRepository` in `modules/budgets/data/` implements this interface using Drizzle queries. The use cases in the application layer receive `IBudgetRepository` through constructor injection. This means test code can provide a mock `IBudgetRepository` without touching SQLite at all. It also means that if the SQLite implementation needs to change (for example, to add an index on a column), only the data layer file changes — the domain and application layers are unaffected.

### Photo Storage

Photos captured by the camera are stored in the app's documents directory, which is persistent and never cleared by the Android OS. The path convention is:

```
FileSystem.documentDirectory + 'photos/' + orcId + '/' + uuid + '.jpg'
```

For example: `/data/user/0/com.pintorplus.app/files/photos/1748000000000/a3f7c2d1.jpg`

The path is stored in the `media` table's `local_path` column. The `items` table does not store photo paths — it stores nothing photo-related. Photos are retrieved by joining `media` on `entity_id = item.id AND entity_type = 'item'`.

Thumbnails are stored in the cache directory:

```
FileSystem.cacheDirectory + 'thumbs/' + sha256 + '.jpg'
```

Thumbnails are 200x200 JPEG at quality 60. They are generated after compression and saved to cache. If the cache directory is cleared by the OS or the user (which is acceptable for cache), thumbnails are regenerated on next display by reading the original from the documents directory and running expo-image-manipulator again. This regeneration is triggered lazily when a thumbnail path resolves to a non-existent file.

The `sha256` hash is computed over the compressed photo bytes before writing to disk. This serves as both the thumbnail filename and a deduplication key — if the same photo is added to two items (unlikely but possible), only one file is written.

---

## 6. State Management

### Philosophy

Each module has exactly one Zustand store created via `create<StoreType>()(immer(set => ({ ... })))`. There is no global store. There is no combined root reducer. Modules do not share state through a central object.

The existing codebase's `S` global object was a single flat object holding every piece of application state. This worked for a small codebase but had three structural problems: any module could corrupt any other module's state because everything was mutably shared, testing any module required initializing the entire application state, and the object grew without bound as features were added.

The Zustand per-module approach gives each module a private state object. The budgets store holds budgets state. The clients store holds clients state. There is no mechanism for the budgets store to directly read or write clients store state — communication happens via the EventBus.

### Store Structure Pattern

Every module store follows the same structure: data arrays, current edit state, loading flags, and error state. Actions are plain functions on the store object that call use cases and update state via Immer.

```typescript
// Illustrative store structure pattern
interface BudgetsState {
  // Data
  budgets: Orcamento[];
  currentDraft: Partial<Orcamento> | null;
  selectedBudgetId: string | null;
  
  // Loading
  isLoading: boolean;
  isSaving: boolean;
  
  // Error
  error: string | null;
  
  // Filters
  searchQuery: string;
  statusFilter: string | null;
  
  // Actions
  loadBudgets: () => Promise<void>;
  saveBudget: (budget: Orcamento) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<void>;
  setDraft: (draft: Partial<Orcamento>) => void;
  updateDraftField: <K extends keyof Orcamento>(field: K, value: Orcamento[K]) => void;
  addRoomToDraft: (room: Room) => void;
  updateRoomInDraft: (roomIndex: number, room: Partial<Room>) => void;
  removeRoomFromDraft: (roomIndex: number) => void;
  addItemToRoom: (roomIndex: number, item: Item) => void;
  updateItemInRoom: (roomIndex: number, itemIndex: number, item: Partial<Item>) => void;
  removeItemFromRoom: (roomIndex: number, itemIndex: number) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (status: string | null) => void;
  clearError: () => void;
}
```

### How the Existing S Object Maps to Module Stores

The existing `S` object in `state.ts` is a flat object. Every field maps to a specific module store:

| Existing S field | New location |
|---|---|
| `S.orcs` | `budgetsStore.budgets` |
| `S.rooms` | `budgetsStore.currentDraft.rooms` |
| `S.editId` | `budgetsStore.selectedBudgetId` |
| `S.isDirty` | `budgetsStore.currentDraft !== null` (computed) |
| `S.tempItem` | `budgetsStore` — `pendingItem: Partial<Item> | null` |
| `S.fmt` | `budgetsStore.currentDraft.fmt` |
| `S.pgto` | `budgetsStore.currentDraft.pgto` |
| `S.pagador` | `budgetsStore.currentDraft.pagador` |
| `S.clientes` | `clientesStore.clientes` |
| `S.fornecedores` | `fornecedoresStore.fornecedores` |
| `S.eventos` | `agendaStore.eventos` |
| `S.config` | `configStore.config` |
| `S.googleEmail` | Removed — no Google auth in v1 |
| `S.DEFAULT_SERVICES` | `configStore.config.servicos` (parsed from config) |
| `S.statusArr` | `configStore.config.statusList` (parsed from config) |

### Store Hydration

On app startup, the root `_layout.tsx` calls `await initDatabase()` from `core/database/db.ts`, which runs pending migrations and returns the Drizzle database instance. Then each module store's `loadX()` action is called via parallel `Promise.all`, hydrating all stores from SQLite before the navigation renders any screen. The navigation only renders after hydration completes, ensuring no screen ever renders with empty state.

### Cross-Screen State in the Budget Wizard

The multi-step budget wizard (client data → rooms/items → pricing/summary) maintains shared state through `budgetsStore.currentDraft`. When the user navigates from step 1 to step 2, the store already holds the client data entered in step 1. When the user navigates back, step 1 reads from the same store and shows the data as entered. This is the replacement for the existing approach of reading DOM input values in `collectOrc()`.

---

## 7. Cross-Module Communication

### The EventBus

The EventBus in `core/events/EventBus.ts` is a typed publish/subscribe implementation. Events are defined as discriminated unions in `core/events/events.ts`. Every event has a `type` string literal and a typed payload.

Modules emit events from their application layer (use cases). Modules subscribe to events in their use cases or in the app startup wiring (`_layout.tsx`). The EventBus is a singleton imported by both emitters and subscribers.

### Why EventBus and Not Direct Imports

The alternative to EventBus for cross-module communication is direct function calls: when a budget is saved, the BudgetSaveUseCase directly calls `ClientesUpsertUseCase.execute(...)`. This creates a compile-time dependency from the budgets module to the clients module. When the two modules grow in complexity, circular dependencies become possible (clients module references budget types, budget module calls client use cases). The EventBus breaks this cycle: the budgets module emits a `BudgetSaved` event (defined in the shared `core/events/events.ts`), and the clients module subscribes to `BudgetSaved` without knowing anything about the budgets module's internals.

### All App Events

The following is the complete list of typed events in `core/events/events.ts`:

**BudgetSaved**
```
type: 'BudgetSaved'
payload: { orcamentoId: string; clienteNome: string; clienteTel: string; clienteEmail: string; ... }
```
Emitted by: `SaveBudgetUseCase` in budgets module.
Subscribers:
- Clients module: `UpsertClienteFromBudgetUseCase` — creates or updates client record from budget contact data.
- Agenda module: no automatic action; the user manually creates an agenda event linked to a budget.

**BudgetDeleted**
```
type: 'BudgetDeleted'
payload: { orcamentoId: string }
```
Emitted by: `DeleteBudgetUseCase` in budgets module.
Subscribers:
- Agenda module: removes any `orc_id` references from eventos linked to the deleted budget. Does not delete the events themselves.
- Media: `FileStorage.deleteAllForEntity(orcamentoId)` — deletes all photos associated with the deleted budget's items.

**BudgetStatusChanged**
```
type: 'BudgetStatusChanged'
payload: { orcamentoId: string; oldStatus: string; newStatus: string }
```
Emitted by: `SaveBudgetUseCase` when status field changes.
Subscribers: None initially. Reserved for future analytics or notification logic.

**FlashDraftPromoted**
```
type: 'FlashDraftPromoted'
payload: { flashDraftId: string; newOrcamentoId: string }
```
Emitted by: `PromoteFlashDraftUseCase` in the flash module.
Subscribers:
- Budgets module: refreshes the budget list to show the promoted budget.

**ClienteSaved**
```
type: 'ClienteSaved'
payload: { clienteId: string; nome: string; tel: string }
```
Emitted by: `SaveClienteUseCase` in clients module.
Subscribers: None initially. Reserved for future budget-client sync logic.

**EventoSaved**
```
type: 'EventoSaved'
payload: { eventoId: string; notificationId: number }
```
Emitted by: `SaveEventoUseCase` in agenda module.
Subscribers: None. The notification scheduling happens within the use case before emitting.

**EventoDeleted**
```
type: 'EventoDeleted'
payload: { eventoId: string; notificationId: number | null }
```
Emitted by: `DeleteEventoUseCase`.
Subscribers: `NotificationService.cancel(notificationId)` — cancels the scheduled notification.

**ConfigSaved**
```
type: 'ConfigSaved'
payload: { config: Config }
```
Emitted by: `SaveConfigUseCase`.
Subscribers:
- All module stores reload their config-derived state: `DEFAULT_SERVICES`, `statusArr`, `pgtoList`, etc.

**AppStarted**
```
type: 'AppStarted'
payload: { timestamp: number }
```
Emitted by: `_layout.tsx` after database hydration completes.
Subscribers:
- Agenda module: `RescheduleAllAlarmsUseCase` — verifies all scheduled notifications are still registered and reschedules any that were lost (Android can clear scheduled notifications when the app is force-closed or the device restarts).

---

## 8. Key Feature Implementations

### Budget Wizard (Multi-Step)

The budget wizard is implemented as a nested route flow using Expo Router. The wizard lives at `app/orcamentos/new.tsx` (new) or `app/orcamentos/[id]/edit.tsx` (edit). The screen is `BudgetWizardScreen`, which renders one of three step components based on an internal `step` state variable.

Step 1 shows client data fields: name, phone, email, CPF, CEP with auto-fill. Step 2 shows the rooms and items editor with add/edit/delete controls and the camera integration. Step 3 shows pricing, payment methods, service type, status, notes, and action buttons (Save, Send WhatsApp, Generate PDF).

Shared state persists across steps in `budgetsStore.currentDraft`. Navigating backward does not lose data. The draft is not persisted to SQLite on each step — only on explicit Save in step 3, or on a final "save and go back" action if the user navigates away. A `hasUnsavedChanges` computed value (non-null `currentDraft`) triggers a discard confirmation on back navigation.

When editing an existing budget (`edit.tsx`), the use case loads the full budget from SQLite including rooms, items, and media references, then sets `currentDraft` to the loaded budget. The wizard renders identically to new budget creation.

### Photo Capture and Storage

The photo capture flow in the item editor works as follows:

1. User taps the camera button in `PhotoGrid`. The `CameraModal` component renders using `expo-camera`'s `<CameraView>` component. The camera viewfinder is embedded in the app — not a system camera intent.

2. When the user captures the photo, `Camera.takePictureAsync({ quality: 1, base64: false })` returns a file URI pointing to a temporary cache location.

3. The `SavePhotoUseCase` (in budgets application layer) coordinates the following steps:
   a. Read the temporary file and compute SHA-256 of its bytes.
   b. Resize and compress using `ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.82, format: SaveFormat.JPEG })`. This produces a high-quality compressed JPEG at a maximum 1600px wide.
   c. Write the compressed file to `FileSystem.documentDirectory/photos/{orcId}/{uuid}.jpg` using `FileStorage.savePhoto()`.
   d. Generate thumbnail: `ImageManipulator.manipulateAsync(compressedUri, [{ resize: { width: 200, height: 200 } }], { compress: 0.6, format: SaveFormat.JPEG })`. Write to `FileSystem.cacheDirectory/thumbs/{sha256}.jpg`.
   e. Insert a row into the `media` table with `local_path`, `sha256`, `thumb_path`, `file_size`, `entity_id = item.id`.
   f. The item's media is retrieved by querying `media WHERE entity_id = itemId`.

4. Photos display in `PhotoGrid` using `expo-image`. The `source` prop receives the `local_path` file URI directly — expo-image renders from `file://` paths without any transformation. The `placeholder` prop receives a `blurhash` string for smooth loading. Thumbnails use `thumb_path` for list views; full-resolution uses `local_path` for the photo viewer.

5. Deleting a photo calls `DeletePhotoUseCase`: delete the media row, delete the file from the documents directory, delete the thumbnail from cache (if it exists). The item's photo list is refreshed by re-querying the media table.

### PDF Generation

The existing `_buildOrcPDFHtml` function in `budgets.ts` is a self-contained HTML template engine. It takes a budget object and returns a complete HTML string suitable for rendering in a browser or converting to PDF. It uses the existing `esc()`, `money()`, `f1()`, and `valorPorExtenso()` functions for formatting.

In the new architecture, this function is ported to `modules/budgets/domain/pdfTemplate.ts` with the following signature:

```typescript
buildOrcPDFHtml(orc: Orcamento, config: Config, mediaResolver: (mediaId: string) => string): string
```

The `mediaResolver` parameter replaces the previous approach of embedding Base64 photos directly in the HTML. In the new system, photos are accessed by their filesystem paths. The `mediaResolver` function is provided by the application layer and converts a media ID to a `file://` URI that the WebView inside expo-print can load.

The PDF generation flow: `GeneratePdfUseCase` calls `buildOrcPDFHtml()` with the budget, config, and a resolver function, then calls `Print.printToFileAsync({ html: htmlString })`, which returns a PDF file path. The PDF is then shared via `expo-sharing` — the user can save it locally, share to WhatsApp, or send via email. The "open print dialog" approach from the existing app is replaced by always producing a file and sharing it.

### Alarm System

The existing alarm system uses a `setInterval` loop that runs every 30 seconds and checks whether any eventos have a past-due alarm time. This works only when the app is open and the JS runtime is executing. On Android, the app can be killed or put into deep sleep by the OS battery optimizer, silencing alarms indefinitely.

The new system uses `expo-notifications` to schedule native Android alarms that fire at exact times, regardless of app state.

When an evento is saved with an alarm:
1. `AlarmService.computeTriggerDate(evento)` calculates the exact Date when the notification should fire: `event datetime - (alarmVal * alarmUnit in milliseconds)`.
2. `NotificationService.schedule(title, body, triggerDate, repeat)` calls `Notifications.scheduleNotificationAsync({ content: { title, body, sound: 'alarm.wav' }, trigger: { date: triggerDate } })` and returns the notification identifier.
3. The `notification_id` is stored in the `eventos` row.

When an evento is deleted or its alarm is changed:
- `Notifications.cancelScheduledNotificationAsync(notification_id)` cancels the previous notification before scheduling the new one (or not scheduling if alarm is disabled).

On app startup (`AppStarted` event), `RescheduleAllAlarmsUseCase` runs: it loads all future eventos with alarms, checks each `notification_id` against `Notifications.getAllScheduledNotificationsAsync()`, and reschedules any that are missing. This handles the case where the device restarted (which clears all scheduled notifications on Android).

Repeat rules: for 'daily', 'weekly', and 'monthly' repeats, a new notification is scheduled when the current one fires. The `EventoSaved` listener in the presentation layer handles this by updating the evento's next alarm date and rescheduling.

The `requestPermission` call for notifications is made once, when the user first creates an evento with an alarm enabled. Not on app startup — Android guidelines (and Play Store policy) prohibit requesting notification permission at app launch.

### CEP Lookup

The CEP lookup service in `core/shared/cep/CepService.ts` is a direct port of the existing three-API fallback in `appConfig.ts`:

1. First attempt: `https://brasilapi.com.br/api/cep/v2/{cep}` — returns `{ street, neighborhood, city, state }`.
2. Second attempt: `https://viacep.com.br/ws/{cep}/json/` — returns `{ logradouro, bairro, localidade, uf }`.
3. Third attempt: `https://opencep.com/v1/{cep}` — returns `{ logradouro, bairro, localidade, uf }`.

Each attempt has a 5-second timeout via `AbortController`. If all three fail, the function rejects and the UI shows "CEP not found, fill manually."

The `CepLookupField` component in the clients module handles the UX: debounce input by 500ms, show spinner during lookup, auto-fill address fields on success, show error message on failure. This component is reused in both the client form and the budget wizard step 1.

### WhatsApp Sharing

The `buildWAMsg` function in `modules/budgets/domain/whatsappTemplate.ts` produces a WhatsApp message string for a given budget and format (`completo`, `area`, `simples`). The function is a direct port of the existing implementation.

Two sharing strategies are used:

1. Primary: `expo-sharing` + `Sharing.shareAsync(fileUri)` — if a PDF was generated, share it as a file. The user selects WhatsApp from the Android share sheet. The message text is pre-populated if sharing via URL scheme.

2. Fallback: Deep link via `Linking.openURL('https://wa.me/55' + digitsOnly(tel) + '?text=' + encodeURIComponent(message))` — opens WhatsApp directly to a chat with the client's phone number with the message pre-filled.

### Backup Export and Import

The backup system produces a JSON file containing all data from all modules, plus a manifest of all media file paths.

**Export** (`ExportBackupUseCase`):
1. Load all data from all modules via their respective repositories.
2. Serialize to a JSON object with versioning metadata: `{ version: '2.0', exportedAt: ISO8601, orcamentos, rooms, items, clientes, fornecedores, eventos, config, mediaManifest }`.
3. The `mediaManifest` is an array of `{ mediaId, localPath, sha256 }` objects. The actual media files are not included in the JSON backup — their paths are listed so the user knows which files to manually include if moving to a new device.
4. Write the JSON to `FileSystem.documentDirectory + 'backups/pintor-plus-backup-YYYY-MM-DD.json'`.
5. Share via `expo-sharing`.

**Import** (`ImportBackupUseCase`):
1. User picks a JSON file via `expo-document-picker`.
2. Parse and validate the JSON structure.
3. Begin a SQLite transaction: delete all existing data, insert all records from the backup.
4. Re-hydrate all module stores.
5. Verify that all media paths in `mediaManifest` exist on the filesystem. Warn the user about any missing media files.

A future version will include media file bundling (ZIP archive), but for v1 the JSON export with manifest is sufficient for data safety.

---

## 9. Migration Strategy from Existing Code

This section maps every file in the existing codebase to its fate in the new architecture. The goal is to identify what can be ported directly (domain logic, pure functions) versus what must be rebuilt from scratch (all DOM manipulation, all rendering code, the state model).

### Direct Ports — Copy and Adapt

These files contain business logic that is platform-agnostic. They require minor adaptation (remove DOM-specific imports, adjust function signatures) but not rewriting.

**`src/types.ts` → `core/shared/types.ts` and each module's `domain/types.ts`**

The domain interfaces map directly. The `photos: string[]` field on `Item` becomes a computed relationship — the domain type's photos is populated by joining the media table, not a stored column. The `Orcamento` interface's `rooms: Room[]` is similarly a joined relationship.

Minor additions to the domain types: `id` is added explicitly to `Item` (it was implicit in the existing code where items were array-indexed). `Cliente` and `Fornecedor` get explicit `id` fields. `Evento` gets a `notificationId` field.

**`src/utils.ts` → `core/shared/utils.ts` (pure functions only)**

The following functions port directly without any changes: `f1`, `formatNum`, `money`, `ptFloat`, `esc`, `safeUrl`, `digitsOnly`, `normalizeDecimalInput`, `normalizeMeasureInput`, `numFromInput`, `formatPhone`, `validateFullName`, `validatePhone`, `getStatusBadgeClass`, `getRoomMeds`.

The following functions are removed as they are DOM-specific: `ico` (SVG icon helper), `toast` (DOM toast), `setFieldError` (DOM class manipulation).

**`src/budgets.ts` (business logic functions only) → `modules/budgets/domain/BudgetService.ts`**

The following functions port directly: `calcOrcTotal`, `extractClient` (logic only, not the localStorage write), `saveOrc` (validation logic only, not DOM reads or localStorage).

The `collectOrc` function is not needed — in the new architecture, form state is maintained in Zustand and collected from the store, not from DOM inputs.

**The `_buildOrcPDFHtml` function → `modules/budgets/domain/pdfTemplate.ts`**

This is a large (~200 line) HTML template function. It ports directly with one adaptation: the `photos` rendering section is updated to use `mediaResolver(mediaId)` to get file URIs instead of rendering Base64 data URLs.

**The `buildWAMsg` function → `modules/budgets/domain/whatsappTemplate.ts`**

This function builds WhatsApp message text for three format modes. It is pure — no DOM, no localStorage. Direct port.

**`src/receipts.ts` (the `valorPorExtenso` function and HTML template) → `modules/budgets/domain/receiptTemplate.ts`**

`valorPorExtenso` is pure and ports without changes. The receipt HTML template function ports similarly to the PDF template, with a `mediaResolver` for the signature image.

**`src/appConfig.ts` (the `fetchCep` function) → `core/shared/cep/CepService.ts`**

The three-API fallback with error handling and response normalization ports directly. The DOM manipulation (filling input fields, showing spinner/error messages) is removed — the use case returns a structured address object, and the React Native component handles the display.

### Rebuild from Scratch — Do Not Port

These files are fundamentally DOM-based and have no portable logic:

**`src/main.ts`** — Entry point that registers window functions, initializes the DOM, and manages the dual S objects. In the new architecture, the equivalent is `app/_layout.tsx`. Nothing from main.ts is ported.

**`src/state.ts`** — The global S object backed by localStorage. Replaced by per-module Zustand stores backed by SQLite.

**`src/navigation.ts`** — SPA routing via DOM class toggling. Replaced by Expo Router file-based routes.

**`src/budgets.ts` (UI functions)** — `newOrc`, `editOrc`, `renderRooms`, `renderItemModal`, `addItem`, `editItem`, `removeItem`, and all DOM manipulation. Replaced by React Native screens and components.

**`src/clients.ts`** — All DOM manipulation, the navigator.contacts.select() Web API call. Replaced by the clients module presentation layer and expo-contacts.

**`src/agenda.ts`** — The AudioContext alarm synthesis, the setInterval polling loop, the DOM calendar rendering. The alarm computation logic is ported; everything else is rebuilt.

**`src/ui.ts`** — DOM render orchestrator (900+ lines). Orphaned in the existing codebase. Discarded entirely.

**`src/rooms.ts`** — DOM room/item UI. Orphaned in the existing codebase. Discarded entirely.

**`src/data.ts`** — Duplicate of other modules' functions. Orphaned. Discarded entirely.

**`src/notifications.ts`** — Browser Notification API + Service Worker message passing. Replaced by expo-notifications.

**`src/gauth.ts`** — Google OAuth via Supabase. Removed from v1 entirely.

**`src/supabaseClient.ts`** — Supabase client initialization. Removed from v1 entirely.

**`src/receipt.ts`** (singular, legacy) — Has XSS vulnerabilities. Discarded.

**`app.html`, `app.css`** — SPA shell HTML and all CSS. Replaced by React Native components styled via StyleSheet or a compatible styling library.

---

## 10. Build and Deployment

### EAS Build Configuration

The project uses EAS Build for all Android APK/AAB production. The `eas.json` configuration defines three build profiles:

**development**: Creates a development client build that connects to the Expo Go dev server via LAN. Used for rapid iteration during development. Does not produce a Play Store-ready artifact.

**preview**: Creates a release APK (not AAB) suitable for internal distribution via direct APK install. Used for QA testing on real devices without Play Store infrastructure. Signed with the production keystore.

**production**: Creates a signed AAB for Google Play submission. Runs with `NODE_ENV=production`, OTA updates enabled, no dev tools. The AAB is uploaded to Play Store via EAS Submit.

Android signing: the keystore is stored in Expo's EAS secret storage (not in the git repository, not in CI environment variables). This means signing credentials are managed by EAS and the developer never handles the keystore file directly after initial setup.

### `app.json` Configuration

Key fields that affect the Android build:

```
expo.android.package: "com.pintorplus.app"  — matches the existing Capacitor App ID
expo.android.versionCode: integer incremented on every Play Store submission
expo.version: semantic version string (major.minor.patch)
expo.android.permissions: explicit list of required permissions
expo.android.adaptiveIcon: foreground and background image paths
expo.plugins: list of Expo config plugins for camera, notifications, contacts
```

### Android Permissions

The following permissions are declared in the Expo config and generated into the Android manifest:

- `CAMERA` — for item photo capture
- `POST_NOTIFICATIONS` — for event alarm delivery (Android 13+)
- `SCHEDULE_EXACT_ALARM` — for alarm delivery at precise times
- `RECEIVE_BOOT_COMPLETED` — for rescheduling alarms after device restart
- `READ_CONTACTS` — for native contact picker
- `READ_EXTERNAL_STORAGE` (maxSdkVersion 32) — for backup file import on Android 12 and below
- `WRITE_EXTERNAL_STORAGE` (maxSdkVersion 29) — for backup file export on Android 9 and below

### Versioning Strategy

`versionCode` (Android integer) increments on every Play Store submission: 1, 2, 3... This is managed by EAS and does not need to be manually tracked.

`version` (user-visible string) follows semantic versioning: `1.0.0` at Play Store launch, `1.0.x` for bug fix releases (OTA only when possible), `1.x.0` for minor feature additions, `2.0.0` for major architectural changes.

OTA updates via expo-updates can push JS-layer changes without a full Play Store review. Native changes (new permissions, new Expo modules, Android manifest changes) require a full build and Play Store submission.

### Play Store Submission Path

1. Build AAB via EAS: `eas build --profile production --platform android`
2. First submission: upload AAB to Play Console manually. Configure internal testing track, privacy policy URL, content rating questionnaire, data safety form.
3. Promote from internal testing to closed testing (alpha): requires 5 internal testers to approve.
4. Promote to production: Play Store review (typically 3-7 business days for new apps, 1-3 days for updates).
5. Subsequent submissions: `eas submit --platform android --latest` automates AAB upload via service account JSON stored in EAS secrets.

### LGPD Compliance Notes

The Play Store requires a data safety form declaration. Pintor Plus stores all user data locally on the device and does not transmit user data to any external server (except the optional CEP lookup, which sends only the postal code, not any personal data). The data safety form correctly declares:

- No data collected by the app developer
- Data may be shared with third parties: no
- CEP lookup sends postal code only, not linked to user identity
- Optional backup export is user-initiated and goes to user-controlled device storage

The privacy policy at `privacy-policy.html` is retained and hosted at a stable URL, as required by both Google Play and LGPD.

---

## 11. Development Phases

Each phase produces a complete, testable application. No phase produces a skeleton. The "done" criteria for each phase is a runnable app that passes a defined feature checklist. Play Store submission only happens at the end of Phase 4.

### Phase 0 — Foundation (Duration: 1 week)

The goal of Phase 0 is a working shell with database, navigation, and state infrastructure. No business features are implemented, but all infrastructure is production-grade.

What gets built:
- `expo init` with Expo SDK 52, TypeScript strict, Expo Router v3
- `core/database/schema.ts` — all tables defined in Drizzle
- `core/database/db.ts` — SQLite singleton, migration runner, first migration
- `core/events/EventBus.ts` and `core/events/events.ts` — full event definitions
- `core/notifications/NotificationService.ts` — expo-notifications wrapper
- `core/storage/FileStorage.ts` — expo-file-system wrapper
- `core/shared/utils.ts` — direct port from existing codebase
- `core/shared/formatters.ts` — BRL-specific formatters
- `core/shared/cep/CepService.ts` — CEP lookup with 3-API fallback
- `app/_layout.tsx` — database init, store hydration, navigation shell
- `app/(tabs)/_layout.tsx` — bottom tab bar with 5 tabs
- Placeholder screens for all 5 tabs that render "Coming soon"
- EAS project configuration, `app.json`, `eas.json`

Done when: The app builds locally (`npx expo start`), displays five tabs with placeholder content, and the database initializes without errors on a real Android device connected via USB. All Drizzle migrations run on startup. The EventBus publishes and receives a test event.

### Phase 1 — Config Module (Duration: 1 week)

Config is built first because every other module depends on config data: the services list, the status list, payment methods, and the message template are config values that other modules display.

What gets built:
- `modules/config/` — all four layers
- `ConfigScreen` with all existing configuration sections: company info, logo, signature, services editor, payment methods editor, status list editor, message template, backup/restore
- `SaveLogoUseCase` and `SaveSignatureUseCase` using FileStorage
- `ExportBackupUseCase` (JSON export + expo-sharing)
- `ImportBackupUseCase` (document picker + JSON parse + full restore)
- Config store hydration on startup
- `configStore.config` available to all other modules

Done when: A user can set their company name, phone, and services list. The config persists across app restarts (stored in SQLite). Logo and signature images save to the documents directory and display correctly after app restart. Export backup produces a valid JSON file. Import backup restores all config values.

### Phase 2 — Clients and Suppliers (Duration: 1 week)

Clients and suppliers are simpler CRUD modules with no dependencies on other modules.

What gets built:
- `modules/clients/` — all four layers
- `ClientesListScreen` with search
- `ClienteFormScreen` with all fields: name, phone, email, CPF, CEP lookup, address auto-fill
- `ContactPickerButton` using expo-contacts
- `modules/suppliers/` — all four layers
- `FornecedoresListScreen` with category filter and search
- `FornecedorFormScreen`
- `SendWhatsAppQuoteUseCase` for suppliers
- Client upsert event handler (`BudgetSaved` → `UpsertClienteFromBudgetUseCase`) wired in EventBus subscriptions (handler exists but BudgetSaved cannot be tested yet)

Done when: Full CRUD for clients and suppliers works and persists across restarts. CEP lookup fills address fields correctly. Contact picker imports from the device phone book. Supplier WhatsApp button opens WhatsApp with a pre-filled message.

### Phase 3 — Budgets Module (Duration: 2.5 weeks)

This is the core of the application and the most complex phase. It is split into sub-steps within the week.

Sub-step 3a (3 days): Budget list and view.
- `OrcamentosListScreen` with search, status filter, and sort
- `BudgetViewScreen` (read-only) with full budget details
- `OrcamentoCard` with swipe-to-delete
- `GetBudgetsUseCase`, `GetBudgetByIdUseCase`, `DeleteBudgetUseCase`
- `budgetsStore` hydration and list rendering

Sub-step 3b (4 days): Budget wizard steps 1 and 3 (client data and pricing/summary).
- `BudgetWizardScreen` with step indicator
- Step 1: client fields with CEP lookup, client picker from contacts
- Step 3: pricing (global m², payment methods, format selector, status, dates, notes)
- `SaveBudgetUseCase` with validation
- `SendWhatsAppUseCase` wired to WhatsApp deep link
- `GeneratePdfUseCase` wired to expo-print and expo-sharing
- `BudgetSaved` event emitting and client upsert handler verified end-to-end

Sub-step 3c (5 days): Rooms and items (wizard step 2).
- `RoomCard` with collapse/expand
- `ItemSummary` list within rooms
- `ItemEditorScreen` with all item fields
- `PhotoGrid` with add photo button
- `CameraModal` with expo-camera viewfinder, torch toggle, capture button
- Photo capture → compress → filesystem → media table → display
- `AddRoomUseCase`, `UpdateRoomUseCase`, `DeleteRoomUseCase`
- `AddItemUseCase`, `UpdateItemUseCase`, `DeleteItemUseCase`
- Photo management use cases
- Pricing mode per room (fixed vs per-m²) wired to `calcOrcTotal`

Done when: A user can create a complete budget from scratch with at least two rooms, multiple items per room, photos on items, payment method selection, and generate a PDF that renders correctly. The WhatsApp message sends with the correct text. Saving a budget auto-creates or updates the client record. All data persists across app restarts.

### Phase 4 — Flash Module and Agenda (Duration: 1 week)

Flash and Agenda are the two remaining feature modules.

What gets built:
- `modules/flash/` — all four layers
- `FlashWizardScreen` with 3 steps
- `PromoteFlashDraftUseCase` linking Flash to full budget
- `modules/agenda/` — all four layers
- `AgendaScreen` with month grid view and event dots
- `EventoFormScreen` with alarm configuration picker
- `SaveEventoUseCase` with expo-notifications scheduling
- `DeleteEventoUseCase` with notification cancellation
- `RescheduleAllAlarmsUseCase` wired to `AppStarted` event
- Notification permission request on first alarm creation
- `CreateEventFromBudgetUseCase` (optional: can be triggered manually from BudgetViewScreen)

Done when: Flash wizard creates a draft in 3 steps and the draft can be promoted to a full budget. Events appear on the calendar. Alarms fire at the correct time even when the app is closed. Repeat events reschedule correctly after firing.

### Phase 5 — Polish, Testing, and Play Store (Duration: 1 week)

The final phase before Play Store submission.

What gets built:
- End-to-end feature walkthrough on at least two real Android devices (different API levels)
- Notification permission flow verified on Android 13+
- Camera torch and zoom verified on devices that support it
- CEP lookup verified with real Brazilian postal codes
- PDF rendering verified on Android's native PDF viewer
- WhatsApp integration verified on a device with WhatsApp installed
- Backup export and import round-trip verified (export → delete all data → import → all data restored)
- TypeScript errors: zero (no type assertions except in mappers)
- Jest unit tests for: `BudgetService.calcOrcTotal`, `whatsappTemplate.buildWAMsg`, `pdfTemplate.buildOrcPDFHtml`, `formatters.*`, `validators.*`, `CepService` (mocked)
- Play Store assets: app icon (512px), feature graphic (1024x500px), screenshots from real device
- `eas build --profile production` successful
- Play Store internal track submission and install verification
- Privacy policy URL accessible
- Data safety form completed

Done when: The production AAB installs from the Play Store internal track on a real device, all features work without errors, and the Play Store listing is ready for promotion to production.

---

*This document is complete. All sections are fully specified. Implementation can begin at Phase 0, Section 11.*
