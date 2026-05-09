# Pintor Plus — Executive Delivery Plan
### From "almost-working PWA" to "Play Store launch with users"

**Audience:** Co-founders, product, engineering, growth.
**Purpose:** One document a CEO can read end-to-end and a CTO can execute against. Everything else in `context_docs/` is reference material for the decisions explained here.
**Status:** Authoritative. Where this conflicts with any other doc, this wins.
**Companion source-of-truth:** [`MASTER-PLAN.md`](./MASTER-PLAN.md) — the technical blueprint. This document explains the *why*, the *delivery path*, and the *go-to-market* checklist around it.

---

## Part A — The 60-Second Version

**What we are shipping:** An Android app for Brazilian house painters that turns their phone into a complete on-site quoting tool. They walk through a client's home, measure rooms, pick services, and send a professional itemized quote over WhatsApp — with no account, no internet, no friction.

**Where we are today:** A working-but-fragile PWA with ~9,000 lines of mixed code, three competing JavaScript runtimes living in the same HTML file, photos stored as Base64 strings inside the browser's 5-10MB local storage cap. Five photos per job and the user is in trouble. We've patched it for months — the bug-fix-to-feature ratio is now 9-to-1 (last 10 git commits).

**The decision:** Stop patching. Rebuild as a native Android app using **React Native + Expo SDK 52**, ported from the existing TypeScript business logic but freed from the WebView ceiling. The proven domain code (budget math, WhatsApp templates, PDF generation, CEP postal lookup) ports directly. The broken DOM/state plumbing gets discarded.

**Cost:** $25 (one-time Play Store fee). $0/month infrastructure. **7.5 weeks of focused engineering.**

**Result:** A real Android app — native camera with torch, alarms that fire when the app is closed, photos at full quality on the device's filesystem, no ceiling on history, no cloud bill.

---

## Part B — The Product

### B.1 The user

A Brazilian independent house painter or small crew leader. Speaks Portuguese only. Does *visitas técnicas* — visits client homes, measures, quotes on the spot. Uses an Android phone that's always within reach. Doesn't want to log in, doesn't have a Google Workspace, doesn't read English documentation, doesn't trust cloud services he can't see. The product respects all of that.

### B.2 The product, in one sentence

A zero-friction, offline-first Android app that replaces the painter's notebook, calculator, and "I'll get back to you with a price" awkwardness with a polished room-by-room quote sent over WhatsApp before he leaves the client's house.

### B.3 The features (in painter language)

| Feature | What the painter does |
|---|---|
| **Orçamento Detalhado** | Builds a full quote, room by room, with measurements, services and materials, photos of problem areas. |
| **Orçamento Flash** | A 30-second quote when the client wants a number *now*. Three steps, saved as a draft, can be promoted to a full quote later. |
| **Clientes** | Address book of past clients with their full quote history. |
| **Fornecedores** | Material/tool suppliers with one-tap WhatsApp/call. |
| **Recibos** | Payment receipts, formatted, shareable. |
| **Agenda** | Calendar of scheduled jobs with native alarms that fire even when the app is closed. |
| **Configurações** | Company info, logo, signature, custom services list, payment methods, message templates. |
| **Backup local** | One-tap export of everything to a JSON file the painter saves wherever he wants. |

### B.4 What makes this product different

- **No login.** Ever. Install → use.
- **Works offline.** Every feature, all the time. The internet is only used for postal-code lookups (CEP) and the optional WhatsApp deep-link.
- **WhatsApp-native.** The product output is a WhatsApp message, not an email, not a printed PDF. This matches how Brazilian SMB sales actually happen.
- **Sounds like a businessperson, not a kid.** Tone in Portuguese is professional. The product treats the painter as someone running a business, because he is.
- **No subscription.** No paywall. The product is a tool the painter owns.

### B.5 Brand

- **Primary color:** Purple `#7C3AED`. Flash mode uses orange `#F97316`. Money and success are green `#10B981`.
- **Type:** Sora for UI, DM Mono for numeric values — money and measurements look like an official document.
- **Voice:** Direct Portuguese. No anglicisms. No emoji unless the painter types them.

Reference: [`pintor-plus/DESIGN_AND_AUDIO.md`](../pintor-plus/DESIGN_AND_AUDIO.md), [`pintor-plus/site.webmanifest`](../pintor-plus/site.webmanifest), [`pintor-plus/app.css`](../pintor-plus/app.css).

---

## Part C — Where We Are Today (Honest Assessment)

This section is the unvarnished diagnostic. The reasoning behind the rebuild lives here.

### C.1 The codebase, in numbers

- **`pintor-plus/app.html`**: a single HTML file, **4,816 lines, ~383 KB**. It contains the entire UI plus two giant inline `<script>` blocks plus a `<script type="module">` reference to TypeScript modules.
- **`pintor-plus/src/`**: 17 TypeScript files, **6,352 lines** total. The "modern" layer that was supposed to replace the inline scripts.
- **Total app logic**: ~9,000 lines across two paradigms (vanilla JS in HTML + TypeScript modules) with no clean boundary between them.

Reference: [`context_docs/codebase-state-audit.md`](./codebase-state-audit.md), [`context_docs/review.md`](./review.md).

### C.2 The "three JavaScript worlds" problem

Inside `app.html` three separate JavaScript runtimes execute on every page load:

| World | Lines | Where | What it does |
|---|---|---|---|
| **Inline Flash mini-app** | 1561 → 1675 (~115 lines) | inside `app.html` | Standalone Flash quote logic. |
| **Inline original monolith** | 2267 → 4807 (~2,541 lines) | inside `app.html` | The entire original vanilla-JS app. Sets up its own state. Defines `window.toast`, `window.S`, all CRUD logic. |
| **TypeScript modules** | `src/` (~6,352 lines) | loaded as `<script type="module">` | The "refactored" version that runs *last* and overwrites the inline definitions. |

The TypeScript modules win the race because module scripts are deferred — they run after the synchronous inline blocks. So the user sees a working app, but **what runs is the TypeScript layer silently overwriting 2,656 lines of inline JavaScript that has already executed**. Every page load pays the cost of loading and running both. Worse: the inline script and `state.ts` each create their own `S` global object, both reading the same `localStorage` key, then drifting silently from each other.

### C.3 Three TypeScript modules that never run

`main.ts` imports nine modules. **It does not import three more:** `ui.ts` (910 lines), `data.ts` (795 lines), `rooms.ts` (~300 lines). They are pure dead code. `data.ts` is especially dangerous because it duplicates the implementations of `clients.ts`, `agenda.ts`, and `appConfig.ts`; if anyone ever imports it, the last `window.x =` assignment wins and behavior becomes ordering-dependent.

### C.4 Storage is a ticking time bomb

- The app stores **photos as Base64 strings** inside Item objects, inside Room arrays, inside Orcamento objects, inside the `pp-orcs` localStorage key.
- One 1024px JPEG ≈ 150–300 KB once Base64-encoded.
- A budget with 10 photos ≈ 2–3 MB.
- Browser localStorage cap on Android: **5–10 MB**.
- After ~5 jobs with photos the cap is saturated and writes silently fall through to `sessionStorage` (lost on app close).
- At 200 budgets, every save rewrites a 531 KB blob — every status change. By 400 budgets the app is rewriting **a megabyte per touch**.

Reference: [`context_docs/DECISION-storage.md`](./DECISION-storage.md), [`context_docs/sqlite-storage&file-storage.md`](./sqlite-storage&file-storage.md).

### C.5 Other concrete problems

- **Alarms don't work reliably.** The agenda uses `setInterval` polling every 30 seconds inside the WebView. The phone has to have the app open. In real-world usage, scheduled job reminders frequently never fire.
- **A legacy receipt module has an XSS hole.** `src/receipt.ts` (singular, legacy) renders client/company names without HTML-escaping. A maliciously named entry could break or hijack the receipt rendering.
- **Permissions asked at the wrong time.** Notification permission is requested on app launch — a Google Play Store rejection criterion. Should be requested on first alarm creation.
- **Documentation drift.** `pintor-plus/DOCUMENTACAO_TECNICA.md` describes Google Drive sync, AES-GCM encryption, html2pdf, push notifications, periodic background sync. None of that is in the actual MVP code. The doc was aspirational.
- **Scope creep returning.** The 2026-05-02 v0.3.0 changelog re-introduced Google Drive integration, which `MVP_NOTES.md` had explicitly cut. The current PWA is mid-scope-creep.
- **Recent activity is all bug fixes.** 9 of last 10 commits are `fix:`. Recurring regressions in totals, units (m/ml mix-ups), photos, layout. Classic late-stage entropy in a frontend monolith.

Reference: [`context_docs/codebase-state-audit.md`](./codebase-state-audit.md), [`context_docs/review.md`](./review.md), [`pintor-plus/SECURITY_AUDIT.md`](../pintor-plus/SECURITY_AUDIT.md), [`pintor-plus/CHANGELOG.md`](../pintor-plus/CHANGELOG.md).

### C.6 What is *good* about the current code

This is important — we are not throwing it all away.

- **The business logic is correct.** `calcOrcTotal` (the budget math), `buildWAMsg` (WhatsApp message template), `valorPorExtenso` (numbers in Brazilian Portuguese for receipts), `fetchCep` (3-API postal-code fallback), `_buildOrcPDFHtml` (PDF template) — all of these have been tuned by real painter feedback over months. They port directly from TypeScript to TypeScript.
- **The product UX is validated.** The flow, the language, the format of WhatsApp messages — all of this works for the user. We are not changing the product, we are changing what runs underneath.
- **The brand is solid.** Colors, typography, voice — settled.
- **Domain types are clean.** `src/types.ts` is a 120-line interface map of the data model that survives intact.

---

## Part D — The Strategic Decision

### D.1 The path we considered first (and rejected)

Continue on Capacitor (the existing native wrapper for the PWA). Three earlier internal docs argued this — [`android-migration-opinion.md`](./android-migration-opinion.md), [`android-migration-plan.md`](./android-migration-plan.md), [`final-architecture-decision.md`](./final-architecture-decision.md). Their case: 8–10 working days to ship a working Android APK that wraps the existing PWA, fix three integration blockers (notifications, contacts, Google OAuth), move photos to the filesystem.

This is correct for the *fastest possible launch*. It is **not** correct for a product without architectural debt, because:

1. The three coexisting JavaScript worlds in `app.html` ship with you into the APK.
2. The dual `S` object race condition ships with you.
3. The 2,541 lines of dead inline code ship with you.
4. The legacy XSS-vulnerable `receipt.ts` ships with you.
5. WebView animation, advanced camera (torch, zoom, focus), and reliable background alarms hit a real ceiling.

The accumulated cost of fixing these *while also* adapting to Capacitor plugins approaches the cost of a clean rebuild — without the clean break.

### D.2 The path we chose

**React Native + Expo SDK 52, modular monolith, local-first storage.**

| Layer | Choice | Why |
|---|---|---|
| Runtime | React Native 0.76 (Expo SDK 52) | Native rendering. Native camera with torch/zoom. Native alarms via Android AlarmManager. JSI bypasses the old JS-bridge bottleneck. |
| SDK | Expo 52 | OTA updates, EAS cloud builds, no Android Studio required. |
| Database | SQLite via Drizzle ORM + expo-sqlite | Schema-as-code. TypeScript types and DB columns share one source of truth. No more "rewrite the world to save one budget." |
| Storage | expo-file-system | Photos and binary assets on the device's filesystem. Only paths in the database. No more 5MB ceiling. |
| State | Zustand + Immer | Per-module stores. Replaces the leaky global `S`. |
| Routing | Expo Router 3 | File-based routes. Multi-step wizards become folder structures. |
| Notifications | expo-notifications | Schedules native AlarmManager entries. Fires when app is closed. |
| PDF | expo-print | `Print.printToFileAsync({ html })` — takes our existing PDF HTML template directly. Zero rewrite. |

Reference: [`MASTER-PLAN.md`](./MASTER-PLAN.md) Part 3 (full version pinning), [`context_docs/sota-architecture.md`](./sota-architecture.md) (full architecture rationale).

### D.3 Architecture in one paragraph (for non-engineers)

We organize the app as **six independent modules** — Budgets, Clients, Suppliers, Agenda, Config, Flash. Each module owns its types, its database queries, its state, and its screens. Modules talk to each other only through a typed event channel (`BudgetSaved`, `EventoDeleted`, etc.) — never by reaching directly into each other's code. This means a problem in one module is contained to one module, and we can grow the team without people stepping on each other.

### D.4 What ports as-is from the current code

- All domain types (`Orcamento`, `Room`, `Item`, `Cliente`, `Fornecedor`, `Evento`, `Config`).
- The budget math (`calcOrcTotal`).
- The WhatsApp message template (`buildWAMsg`).
- The PDF HTML template (`_buildOrcPDFHtml`).
- Brazilian-Portuguese number-to-words (`valorPorExtenso`).
- The 3-API CEP fallback (`fetchCep`).
- Pure utility functions (`money`, `f1`, `formatPhone`).

### D.5 What gets discarded

- Every DOM manipulation file (`ui.ts`, `data.ts`, `rooms.ts`, half of `budgets.ts`, half of `clients.ts`, half of `agenda.ts`).
- The 2,541-line inline script in `app.html`.
- The legacy `receipt.ts` (XSS).
- Service worker (`sw.js`) — no longer needed.
- Google OAuth (`gauth.ts`) and Supabase client — both removed for v1.
- The old `app.html`, `app.css`, `prototype.html`.

### D.6 Cloud strategy: there is none, and that's a feature

- No backend.
- No mandatory authentication.
- No managed database.
- No file storage service.
- No analytics service.
- No crash-reporting service in v1 (we add Sentry post-launch — see Task Block T7).

The only outbound calls are: CEP postal-code lookup (3 public APIs, no key, read-only) and the WhatsApp deep link (`wa.me/`). Privacy posture for the Play Store Data Safety form is "no data collected" — and it is true.

Reference: [`context_docs/local-storage-strategy.md`](./local-storage-strategy.md), [`pintor-plus/privacy-policy.html`](../pintor-plus/privacy-policy.html).

---

## Part E — Timeline and Cost

### E.1 Engineering timeline

```
Phase 0 — Foundation (database, navigation, infrastructure)     1.0 week
Phase 1 — Config module                                         1.0 week
Phase 2 — Clients + Suppliers                                   1.0 week
Phase 3 — Budgets module (the big one)                          2.5 weeks
Phase 4 — Flash + Agenda                                        1.0 week
Phase 5 — Polish + QA + Play Store submission                   1.0 week
─────────────────────────────────────────────────────────────────────────
Engineering subtotal                                            7.5 weeks
Beta cycle (Task Block T6)                                      2.0 weeks
Marketing readiness (Task Block T7-T8)                          1.0 week (parallel)
─────────────────────────────────────────────────────────────────────────
Total to "users can install from Play Store"                  ~9.5 weeks
```

### E.2 Costs

| Item | Cost |
|---|---|
| Google Play Developer registration | $25 (one-time, lifetime) |
| EAS Build (Expo cloud builds) | Free tier sufficient for our build volume |
| Cloud infrastructure (servers, databases, storage) | $0/month |
| Domain (`pintorplus.com.br`) | already owned |
| Analytics / crash reporting | $0/month (Sentry free tier covers our scale) |
| **Recurring monthly cost** | **$0** |

The $25 Play Store fee is the only mandatory spend. Everything else is free-tier.

### E.3 Why the timeline is realistic

- 100% of business logic ports directly. The risky part — getting the math right, the PDF right, the WhatsApp text right — is already done.
- Expo SDK 52 ships the New Architecture by default; we're not pioneering anything.
- We've already audited the existing code in detail (see `context_docs/codebase-state-audit.md`). No surprises pending.
- The 7.5-week breakdown is by phase with done-criteria; we know what "done" looks like at every checkpoint.

### E.4 Why the timeline is *not* aggressive

It includes a 2-week beta cycle on real painters' phones before Play Store submission. It includes a polish phase. It assumes one full-time engineer at competent React Native level. If two engineers are on it, parallelize Phase 1 with Phase 2 — knock 1 week off.

---

## Part F — Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Painter loses phone, all data gone | Medium | High | One-tap export in Config; nudge after every 5th budget; in v1.1, optional Drive backup. |
| Google Play first-app review delay | Medium | Medium (delays launch, doesn't block) | Internal track first (no review). Submit to closed testing 2 weeks before public launch. |
| User installs, doesn't migrate from PWA | High for existing users | Medium | Phase 5 includes a one-shot migration import — read the JSON the PWA can already export, write to SQLite + filesystem. Tested on real PWA backups. |
| React Native version churn | Low | Medium | Pinned versions; no "^" dependencies that can drift; lockfile committed. |
| Photo storage permissions on Android 13+ | Medium | Medium | We never request external storage write — we use `documentDirectory` (app-private). Only need `READ_EXTERNAL_STORAGE` (maxSdk 32) for backup *import*. |
| WhatsApp deep link breaks | Low | High (it's our distribution!) | We control the format (`wa.me/55{digits}?text={encoded}`). Smoke-tested in beta on multiple WhatsApp versions. |
| Beta painters give up before completing the cycle | Medium | Medium | Recruit 5–8 painters via existing pintorplus.com.br traffic + WhatsApp networks. Compensation: free lifetime use + a R$50 voucher for completing 2 weeks. |
| Marketing assets not ready when build is | Medium | Medium (silent launch) | Marketing readiness tasks (T7–T8) start in Phase 4, in parallel — not after engineering. |

---

## Part G — Reference Documents

This document is the executive summary. The depth lives in:

### Strategy and architecture
- [`MASTER-PLAN.md`](./MASTER-PLAN.md) — **Authoritative technical blueprint.** Read this if you are an engineer about to write code.
- [`sota-architecture.md`](./sota-architecture.md) — Long-form architecture rationale (modular monolith, layer model, ORM and state choices, version pinning).
- [`final-architecture-decision.md`](./final-architecture-decision.md) — Earlier "stay on Capacitor + localStorage" decision; **superseded** by MASTER-PLAN, kept for context.
- [`android-migration-opinion.md`](./android-migration-opinion.md), [`android-migration-plan.md`](./android-migration-plan.md) — Earlier "wrap with Capacitor" plans; **superseded**.

### Storage
- [`DECISION-storage.md`](./DECISION-storage.md) — The SQLite-vs-localStorage decision with the concrete numbers (531 KB per save at 200 budgets, etc).
- [`sqlite-storage&file-storage.md`](./sqlite-storage&file-storage.md) — The architectural directive: structured data → SQLite, binaries → filesystem, never `cacheDir` for permanent data.
- [`STORAGE-MIGRATION-PLAN.md`](./STORAGE-MIGRATION-PLAN.md) — Step-by-step migration plan (was for Capacitor; concepts still apply to RN with library swaps).
- [`local-storage-strategy.md`](./local-storage-strategy.md) — Why we drop Google Drive and Supabase from v1.
- [`addendum-storage-repository.md`](./addendum-storage-repository.md) — Repository pattern + media outbox concept.

### Codebase audit
- [`review.md`](./review.md) — Full PWA architectural reference (every file mapped).
- [`codebase-state-audit.md`](./codebase-state-audit.md) — Forensic "what actually runs at runtime" audit. Source of the dead-code list.
- [`quick-context.md`](./quick-context.md) — Empty placeholder, ignore.

### Existing app artifacts (in `pintor-plus/`)
- [`pintor-plus/README.md`](../pintor-plus/README.md) — Product description in Portuguese.
- [`pintor-plus/DOCUMENTACAO_TECNICA.md`](../pintor-plus/DOCUMENTACAO_TECNICA.md) — **Aspirational** technical doc (does not match the current code).
- [`pintor-plus/MVP_NOTES.md`](../pintor-plus/MVP_NOTES.md) — Authoritative MVP scope cuts (Drive, Calendar, PDF, OAuth, AES all explicitly cut).
- [`pintor-plus/HANDOFF_8082C470F607.md`](../pintor-plus/HANDOFF_8082C470F607.md) — Latest session handoff with confirmed scope.
- [`pintor-plus/CHANGELOG.md`](../pintor-plus/CHANGELOG.md) — Recent activity (mostly bug fixes).
- [`pintor-plus/SECURITY_AUDIT.md`](../pintor-plus/SECURITY_AUDIT.md) — Earlier security pass and findings.
- [`pintor-plus/DESIGN_AND_AUDIO.md`](../pintor-plus/DESIGN_AND_AUDIO.md) — Brand and design language reference.
- [`pintor-plus/privacy-policy.html`](../pintor-plus/privacy-policy.html) — LGPD-aware privacy policy (needs minor copy update for the Android app, see T7.4).
- [`pintor-plus/HOSTING_RESEARCH.md`](../pintor-plus/HOSTING_RESEARCH.md), [`pintor-plus/DEPLOY.md`](../pintor-plus/DEPLOY.md) — Current PWA hosting docs (kept for the PWA which continues to live as a marketing/landing surface).
- [`pintor-plus/src/`](../pintor-plus/src/) — The TypeScript modules from which we port business logic.

---

## Part H — End-to-End Delivery Task List

This is what the user asked for: not "shipped to Play Store" but **"published, debugged, tested, and ready to start marketing for users."** Eight task blocks. Each block has explicit done-criteria. Each task is small enough to land in a single PR.

Notation: `[T<block>.<n>]` for citing tasks elsewhere. `[E]` engineering, `[D]` design, `[QA]` quality, `[M]` marketing/growth, `[O]` operations.

---

### T1 — Build Foundation (Phase 0, 1 week)

Goal: a working app shell on a real Android device, with database, navigation, and shared infrastructure. No features yet.

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T1.1 | `npx create-expo-app pintor-plus-rn --template tabs` (SDK 52, TS strict, Expo Router) | E | Project boots in dev client. |
| T1.2 | Install pinned dependencies per [`MASTER-PLAN.md` Part 11](./MASTER-PLAN.md) | E | `npm ls` clean, lockfile committed. |
| T1.3 | Implement `core/database/schema.ts` — all 8 Drizzle tables (orcamentos, rooms, items, clientes, fornecedores, eventos, config, media) | E | `drizzle-kit generate` produces a clean SQL migration. |
| T1.4 | Implement `core/database/db.ts` — singleton, migration runner, `schema_migrations` tracking table | E | App opens, runs migration, table exists on device. |
| T1.5 | Implement `core/events/EventBus.ts` and `events.ts` — typed pub/sub for the 9 events listed in MASTER-PLAN §4.2 | E | Unit test: subscribe → emit → handler called once. |
| T1.6 | Implement `core/storage/FileStorage.ts` — savePhoto, getPhotoUri, deletePhoto, generateThumbnail, deleteAllForEntity | E | Unit test: save bytes → read URI → delete → read returns null. |
| T1.7 | Implement `core/notifications/NotificationService.ts` — schedule, cancel, list scheduled | E | Manual test: schedule for 1 minute later, lock phone, alarm fires. |
| T1.8 | Port `core/shared/utils.ts` from `pintor-plus/src/utils.ts` (drop DOM helpers) | E | All exported functions have one-line pure-TS replacement. |
| T1.9 | Port `core/shared/formatters.ts` (money, f1, formatPhone, formatNum) and `validators.ts` | E | Jest tests pass for each. |
| T1.10 | Implement `core/shared/cep/CepService.ts` — 3-API fallback chain (BrasilAPI → ViaCEP → OpenCEP) with 5s AbortController timeout | E | Unit test with mocked providers: success/fail/fail returns first. |
| T1.11 | Implement `app/_layout.tsx` — DB init, store hydration, notification setup, AppStarted event | E | Cold start completes <2s on a mid-range device. |
| T1.12 | Implement `app/(tabs)/_layout.tsx` — 5-tab bar with placeholder screens | E | All 5 tabs visible and switchable on real device. |
| T1.13 | Configure `app.json` — package id, permissions, plugins | E | EAS dev build succeeds. |
| T1.14 | Configure `eas.json` — development, preview, production profiles | E | All three profile builds succeed. |
| T1.15 | Set up keystore in EAS secret storage | E/O | Production keystore generated, secrets verified. |

**Phase done-criteria:** App builds via EAS, installs on real Android device, displays 5 tabs, database migrations run, EventBus test event roundtrips. Commit tag: `phase-0-done`.

---

### T2 — Config Module (Phase 1, 1 week)

Goal: company configuration fully functional and persisted. This is also the proving ground for our four-layer architecture before we build the bigger modules.

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T2.1 | `modules/config/domain/` — types, IConfigRepository interface, BackupService (serialize/deserialize/validate) | E | Pure TS, no React, no SQLite imports. Jest tests pass. |
| T2.2 | `modules/config/data/SQLiteConfigRepository.ts` | E | Read + write round-trip works. |
| T2.3 | `modules/config/application/store/configStore.ts` (Zustand + Immer) | E | Hydrate-on-startup wired in `app/_layout.tsx`. |
| T2.4 | Use cases: SaveConfig, GetConfig, ExportBackup, ImportBackup, SaveLogo, SaveSignature | E | All 6 callable from a screen. |
| T2.5 | `ConfigScreen` — company info, logo, signature, services, payment methods, status list, message template editor | D/E | All fields editable, persist across cold-restart. |
| T2.6 | Logo and signature picker → file system save | E | After restart, both display correctly from filesystem. |
| T2.7 | Export backup → JSON file → expo-sharing | E | File written, share sheet opens, valid JSON contents. |
| T2.8 | Import backup → expo-document-picker → restore | E | After import, all config values match exported values. |

**Phase done-criteria:** User can configure company. Config persists across restarts. Logo and signature display after restart. Export → wipe → import → all data restored. Commit tag: `phase-1-done`.

---

### T3 — Clients and Suppliers (Phase 2, 1 week)

Goal: full CRUD for both contact entities.

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T3.1 | `modules/clients/` — all four layers per MASTER-PLAN §5 | E | Pattern matches Phase 1. |
| T3.2 | `ClientesListScreen` — search by name/phone, sort | E | Search returns within 100ms on 1000 mock clients. |
| T3.3 | `ClienteFormScreen` — all fields, CEP lookup, address auto-fill, contact picker | D/E | Phone validation matches existing PWA rules. |
| T3.4 | `ContactPickerButton` — expo-contacts | E | Pulls name + phone from device contacts. Permission asked at the right moment. |
| T3.5 | `modules/suppliers/` — all four layers | E | Same pattern. |
| T3.6 | `FornecedoresListScreen` — category filter + search | D/E | Filter chips visible. |
| T3.7 | `FornecedorFormScreen` | D/E | All fields persist. |
| T3.8 | `SendWhatsAppQuoteUseCase` — opens WhatsApp with pre-filled message to supplier | E | Verified on device with WhatsApp installed. |
| T3.9 | `UpsertClienteFromBudgetUseCase` (handler stub for now; full test in T4) | E | Handler subscribed to `BudgetSaved`; invocation logged. |

**Phase done-criteria:** Full CRUD for both. CEP auto-fills correctly with real Brazilian postal codes. Contact picker works on a real device. Commit tag: `phase-2-done`.

---

### T4 — Budgets Module (Phase 3, 2.5 weeks)

The most complex phase. Split into three sub-blocks per [`MASTER-PLAN.md` §9](./MASTER-PLAN.md).

#### T4a — List + View (3 days)

| ID | Task | Done-criteria |
|---|---|---|
| T4a.1 | `OrcamentosListScreen` — search, status filter, sort by date/value | List loads 500 mock budgets in <300ms. |
| T4a.2 | `OrcamentoCard` — swipe-to-delete with confirm | Delete cascades to rooms/items/media. |
| T4a.3 | `BudgetViewScreen` — read-only render | Matches PWA visual style. |
| T4a.4 | Use cases: GetBudgets, GetBudgetById, DeleteBudget | All three return correct data, emit correct events. |

#### T4b — Wizard Steps 1 & 3 (4 days)

| ID | Task | Done-criteria |
|---|---|---|
| T4b.1 | `BudgetWizardScreen` shell with step indicator | 3-step flow renders. |
| T4b.2 | Step 1: client fields, CEP lookup, "pick existing client" button | Pre-fills from existing client correctly. |
| T4b.3 | Step 3: pricing, payment methods, format (`completo`/`area`/`simples`), status, dates, notes | All fields persist to draft on every change. |
| T4b.4 | Port `calcOrcTotal` from `pintor-plus/src/budgets.ts` to `BudgetService.ts` | **Bit-identical output** to PWA on 20 sample budgets (golden tests). |
| T4b.5 | Port `buildWAMsg` from `pintor-plus/src/budgets.ts` to `whatsappTemplate.ts` | **Bit-identical output** on the 3 format modes. |
| T4b.6 | Port `_buildOrcPDFHtml` and `valorPorExtenso` to `pdfTemplate.ts` and `receiptTemplate.ts` | PDF visual diff vs PWA: identical to within antialiasing. |
| T4b.7 | `SaveBudgetUseCase` — validate, persist, emit `BudgetSaved` | Validation matches existing rules. |
| T4b.8 | `SendWhatsAppUseCase` — `Linking.openURL('https://wa.me/55' + digits + '?text=' + encoded)` | Verified on device. |
| T4b.9 | `GeneratePdfUseCase` — `Print.printToFileAsync({ html })` → expo-sharing | PDF opens in Android viewer; share sheet works. |
| T4b.10 | `BudgetSaved` → `UpsertClienteFromBudgetUseCase` end-to-end | Saving budget creates/updates client record. |

#### T4c — Rooms, Items, Photos (5 days)

| ID | Task | Done-criteria |
|---|---|---|
| T4c.1 | Wizard Step 2 layout — list of rooms, "add room" CTA | Drag-to-reorder rooms. |
| T4c.2 | `RoomCard` — collapse/expand, per-room pricing mode | Per-m² toggle wired to `calcOrcTotal`. |
| T4c.3 | `ItemEditorScreen` — name, dimensions, services list, observations | Persist on blur to draft. |
| T4c.4 | `CameraModal` — expo-camera viewfinder, torch, capture | Torch toggle works on devices that support it; gracefully degrades. |
| T4c.5 | Photo capture pipeline: capture → SHA-256 → resize 1600px / 0.82 → save to documentDirectory → thumbnail to cacheDirectory → media row | Photo persists across restart, displays via expo-image. |
| T4c.6 | `PhotoGrid` — show photos with thumbnails, tap to view full, swipe to delete | Deletion removes file + media row. |
| T4c.7 | Add/edit/delete rooms and items via use cases | All emit correct cascade events. |
| T4c.8 | PDF generation includes photos via mediaResolver returning `file://` URIs | PDF renders photos correctly inside expo-print WebView. |

**Phase done-criteria:** Create a complete budget from scratch with 2+ rooms, items with photos, payment selection. PDF renders correctly. WhatsApp message sends with correct text. Saving auto-upserts client record. All data persists across cold restarts. Commit tag: `phase-3-done`.

---

### T5 — Flash and Agenda (Phase 4, 1 week)

#### Flash

| ID | Task | Done-criteria |
|---|---|---|
| T5.1 | `modules/flash/` — all four layers; reuses orcamentos table with `is_flash_draft = 1` | Flash drafts visible in their own list, not main budgets list. |
| T5.2 | `FlashWizardScreen` — 3 steps (client+phone, service+price, summary+send) | Total time from open to send <30s. |
| T5.3 | `PromoteFlashDraftUseCase` — convert to full budget, set `is_flash_draft = 0` | Promoted draft appears in main budgets list, removed from flash list. |

#### Agenda

| ID | Task | Done-criteria |
|---|---|---|
| T5.4 | `modules/agenda/` — all four layers | Pattern complete. |
| T5.5 | `AgendaScreen` — month grid, event dots, day list view | Month nav smooth; events appear on correct days. |
| T5.6 | `EventoFormScreen` — date, time, alarm config, optional link to budget | Alarm config UI matches existing PWA. |
| T5.7 | `SaveEventoUseCase` — persist + schedule notification, store `notification_id` | Event and notification both created. |
| T5.8 | `DeleteEventoUseCase` — cancel notification before deleting row | Cancellation verified in expo-notifications scheduled list. |
| T5.9 | `RescheduleAllAlarmsUseCase` — wired to `AppStarted` event | After device reboot, future events reschedule on next app open. |
| T5.10 | Notification permission on first alarm creation (not on app launch) | Verified on Android 13+ device. |
| T5.11 | Repeat events (daily/weekly/monthly) reschedule themselves on fire | Manual test over 48h proves it works. |

**Phase done-criteria:** Flash creates draft in 3 steps, can be promoted. Events appear on calendar. Alarms fire at correct time when app is closed. Repeat events keep working. Commit tag: `phase-4-done`.

---

### T6 — QA, Beta, and Real-World Hardening (Phase 5 part 1 + Beta cycle, 2 weeks)

This block is what separates "code complete" from "ready for users." The user's brief was explicit: **fixed errors and bugs tested**.

#### T6.1 — Internal QA (3 days)

| ID | Task | Done-criteria |
|---|---|---|
| T6.1.1 | Test matrix on 2+ real Android devices, ideally one Android 11 and one Android 14+ | Smoke test of every screen passes. |
| T6.1.2 | Notification permission flow verified on Android 13+ | Permission asked only on first alarm. |
| T6.1.3 | Camera torch + zoom + focus tested on supported device | All functional or gracefully disabled. |
| T6.1.4 | CEP lookup tested with 10 real Brazilian postal codes (different states) | All resolve via fallback chain. |
| T6.1.5 | PDF generation tested with 5 different budgets including photos | All render correctly in Android PDF viewer. |
| T6.1.6 | WhatsApp deep link tested with WhatsApp Business and consumer WhatsApp | Both open correctly. |
| T6.1.7 | Backup round-trip — export → uninstall → reinstall → import → verify all data | All data restored, including media files. |
| T6.1.8 | One-shot import from existing PWA `pp-orcs` localStorage JSON | Existing PWA users can bring their data. |
| T6.1.9 | TypeScript strict: zero errors, zero `any` outside DB row mappers | `tsc --noEmit` clean. |
| T6.1.10 | Jest unit tests for `calcOrcTotal`, `buildWAMsg`, `buildOrcPDFHtml`, formatters, validators, CepService | All pass. Coverage on domain layer >85%. |
| T6.1.11 | Cold start <2s, hot navigation <100ms, PDF generation <3s on mid-range device | Performance budget met. |

#### T6.2 — Beta program (10 days)

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T6.2.1 | Recruit 5–8 painters via existing PWA traffic + WhatsApp networks | M | Beta cohort signed up with phone numbers. |
| T6.2.2 | Build internal-track AAB and push to Google Play Internal Testing | E/O | Cohort can install via Play link. |
| T6.2.3 | Set up beta feedback channel — dedicated WhatsApp group or simple Google Form | M | Channel live, painters added. |
| T6.2.4 | Provide a 5-minute video walkthrough in pt-BR, sent via WhatsApp | M/D | Video delivered to all beta painters. |
| T6.2.5 | Free lifetime use + R$50 voucher for completing 2 weeks | O | Vouchers ready to send post-cycle. |
| T6.2.6 | Track issues in a simple bug list (Linear, Trello, or even a shared spreadsheet) | E/QA | Every reported issue triaged within 24h. |
| T6.2.7 | Push hot-fixes via expo-updates OTA without re-building | E | OTA pipeline verified working. |
| T6.2.8 | At end of beta: every "won't fix" issue documented with reason | QA | Triage doc complete. |
| T6.2.9 | Crash-free session rate ≥99% over the beta cycle (baseline before Sentry) | QA | Logged from device reports. |

**Phase done-criteria:** No `severity: high` open bugs. No crashes reported in last 5 beta-days. At least 3 of 5 beta painters say they would tell a friend. Commit tag: `beta-complete`.

---

### T7 — Marketing and Launch Readiness (parallel with Phase 4 onward, 1 week)

This block makes the launch *not silent*. The user's brief: **ready to just start marketing for users**.

#### T7.1 — Play Store listing assets

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T7.1.1 | App icon — 512×512 PNG with rounded mask preview | D | Approved by founders. |
| T7.1.2 | Feature graphic — 1024×500 PNG | D | Approved. |
| T7.1.3 | Phone screenshots — 8 frames covering: list, wizard step 1, wizard step 2 (rooms), camera, PDF preview, WhatsApp send, calendar, settings | D | Real-device screenshots, with optional copy overlays in pt-BR. |
| T7.1.4 | Short description (80 chars) — pt-BR | M | Approved. |
| T7.1.5 | Full description (4000 chars) — pt-BR with feature bullets, FAQ, contact | M | Approved. |
| T7.1.6 | Promo video (optional) — 30s screencast with voiceover in pt-BR | M | Uploaded to YouTube unlisted, linked in listing. |

#### T7.2 — Play Store account + compliance

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T7.2.1 | Pay $25 Play Console developer fee | O | Account active. |
| T7.2.2 | Complete identity verification (D-U-N-S or government ID per latest Play policy) | O | Approved by Google. |
| T7.2.3 | Content rating questionnaire | O | Rating returned (likely "Everyone"). |
| T7.2.4 | Data Safety form — answer truthfully: no data collected, no data shared, CEP sends postal code only | O | Submitted. |
| T7.2.5 | Privacy policy URL — update [`pintor-plus/privacy-policy.html`](../pintor-plus/privacy-policy.html) for the Android version, host at pintorplus.com.br/privacidade | M/E | URL accessible, content reviewed. |
| T7.2.6 | Target API level meets current Play Store requirement (Android 14 / API 34 at time of writing) | E | Verified in `app.json`. |
| T7.2.7 | App signing — confirm Play App Signing enrolled, EAS upload key configured | E/O | First production AAB upload accepted. |
| T7.2.8 | Sensitive permissions justification (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, CAMERA, READ_CONTACTS) — write the in-form justifications | M/E | Submitted. |

#### T7.3 — Brand, web, support

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T7.3.1 | Update `pintorplus.com.br` landing page — hero, screenshots, "Baixar na Play Store" CTA, FAQ | D/M | Page live. |
| T7.3.2 | Set up support email — `suporte@pintorplus.com.br` (forwards to a real inbox monitored daily) | O | Test mail delivered. |
| T7.3.3 | Set up support WhatsApp Business number with auto-greeting and FAQ link | O/M | Number live, listed in app's Config screen. |
| T7.3.4 | "Sobre / Ajuda" section inside the app — version, support links, privacy link, "rate on Play Store" link | D/E | Section visible in Config tab. |
| T7.3.5 | App-store optimization (ASO): Portuguese keyword research — "orçamento pintor", "app pintor", "orçamento obra", "pintor profissional" | M | Keyword list approved. |
| T7.3.6 | First blog/social post drafts in pt-BR ready to publish on launch day | M | 3 drafts approved. |

#### T7.4 — Compliance documents

| ID | Task | Done-criteria |
|---|---|---|
| T7.4.1 | Privacy policy reviewed for the Android-specific app (no Drive in v1, no analytics in v1) | M/Legal-light review. |
| T7.4.2 | Terms of use (Termos de Uso) drafted — short, plain pt-BR, hosted alongside privacy policy | Page live. |
| T7.4.3 | LGPD posture statement on website — "your data lives only on your device" | Page live. |

---

### T8 — Launch and Post-Launch Operations

#### T8.1 — Production submission and launch (1 day)

| ID | Task | Done-criteria |
|---|---|---|
| T8.1.1 | `eas build --profile production --platform android` | AAB built. |
| T8.1.2 | Upload AAB to Play Console internal track first | Internal testers can install final build. |
| T8.1.3 | Promote internal → closed testing (5+ testers) | 5+ testers installed and exercised. |
| T8.1.4 | Promote closed → production (3–7 day review for first-time apps) | App live on Play Store. |
| T8.1.5 | Monitor Play Console for crashes, ANRs, install-failure rates daily for first 2 weeks | Daily check logged. |

#### T8.2 — Day-1 to day-30 operations

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T8.2.1 | Add Sentry (free tier) for crash reporting via expo-sentry; redact any user PII before send | E | Crashes visible in Sentry dashboard. Crash-free session rate ≥99% baseline. |
| T8.2.2 | Add minimal anonymous usage telemetry: `app_open`, `budget_created`, `whatsapp_sent`, `pdf_generated`, `backup_exported`. **No personal data, ever.** | E | Events visible in chosen analytics (Aptabase or self-hosted PostHog free tier). |
| T8.2.3 | Establish weekly bug triage cadence — 1 hour every Monday | O | First triage held. |
| T8.2.4 | OTA hot-fix process documented and tested — `eas update --branch production` | E | One harmless test OTA shipped and verified received. |
| T8.2.5 | Respond to all Play Store reviews within 48h for the first month | M | First 10 reviews responded. |
| T8.2.6 | Track North Star metric: **% of installs that send a WhatsApp budget within 7 days of install** — target >40% | M | Metric instrumented and reportable. |
| T8.2.7 | Day-7 retention metric — target >25% open the app on day 7 | M | Reportable. |

#### T8.3 — First marketing push (day 1 onward)

| ID | Task | Owner | Done-criteria |
|---|---|---|---|
| T8.3.1 | Announce on `pintorplus.com.br` and any owned social | M | Posts live. |
| T8.3.2 | Direct outreach to existing PWA users with "the new app is here, here's how to bring your data" | M | Outreach sent. |
| T8.3.3 | Pintor-focused WhatsApp groups and Facebook groups (manual, organic only) | M | 5+ communities posted in. |
| T8.3.4 | Outreach to 2–3 Brazilian construction-trade YouTubers/Instagrammers for free reviews | M | At least one agreed. |
| T8.3.5 | First retrospective at day-30 — what worked, what didn't, what to fix in v1.1 | All | Doc written. |

---

## Part I — Definition of "Done" for the Whole Project

The project is done when **all** of the following are true:

1. The Android app is live on the Google Play Store production track.
2. The Data Safety form is approved and accurate.
3. The privacy policy and terms of use are published at `pintorplus.com.br`.
4. Crash-free session rate is ≥99% in the first 2 weeks post-launch.
5. The Play Store listing has 8 screenshots, a feature graphic, a 4000-char description, and a working support contact.
6. The North Star metric (% of installs sending a WhatsApp budget within 7 days) is instrumented and reporting.
7. The OTA hot-fix pipeline is verified working.
8. The first marketing push is in flight.
9. Every existing PWA user has a documented, tested path to bring their data into the new app.
10. The 5–8 beta painters have transitioned from beta to production with their data intact.

When all ten are green, **we are not just published — we are ready to grow.**

---

## Appendix — What we are not doing in v1 (and when we revisit)

| Cut feature | When we revisit |
|---|---|
| Google Drive backup | v1.1, after we see how often beta painters actually export. If <30% of active users export within their first month, this becomes priority 1. |
| Google Calendar sync | v1.2 or never. Most painters don't use Google Calendar. Validate first. |
| Multi-device sync | v2.0. Triggered by ≥10% of users explicitly asking. |
| iOS app | v2.0. Android-first because target market is Android-first. |
| AI-assisted quote suggestions | v2.0+. Park as roadmap, not v1. |
| Voice notes (transcribed) | v1.3. Mentioned in current design docs. Validate user demand in beta first. |
| Subscription / paid tier | Not until we have ≥1,000 weekly active users. |

---

*End of executive delivery plan.*
