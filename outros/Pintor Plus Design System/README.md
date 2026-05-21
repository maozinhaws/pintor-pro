# Pintor Plus — Design System

Source of truth: [github.com/maozinhaws/pintor-plus@feature/storage-sqlite-dexie-offline](https://github.com/maozinhaws/pintor-plus/tree/feature/storage-sqlite-dexie-offline).

## What this is

Pintor Plus is a mobile-first app for autonomous house painters (pintores autônomos) in Brazil. It lets them run their whole business from a phone in the field: build budgets/quotes (**orçamentos**), manage clients, schedule visits, track suppliers, and generate ready-to-share PDFs and WhatsApp messages.

The product is **offline-first** (Dexie + SQLite via Capacitor), **Portuguese-language**, and tuned for use **outdoors under bright sun** — that's why light mode is the default and the visual language leans on strong contrast, large hit targets, and a saturated orange action color.

This design system codifies the visuals from the live codebase. Where the codebase has two competing layers, the system documents both with notes on which wins.

## Two-layer reality (important)

The shipped app loads **two stylesheets** in order:

1. **`app.css`** — the original styles. Defines `.sec`, `.rcard`, `.hoc`, `.finput`, `.hbadge`, `.fab-add`, etc. — virtually every actual screen. Uses a slate/purple/amber palette out of the box (`--bl: #7C3AED` purple).
2. **`src/styles-lovable.ts`** — a runtime-injected layer (loaded by `main.ts`) that **overrides** the brand color tokens. In light mode it flips `--bl` to **orange `#ff6b35`** and adds `.glass`, `.glass-brand`, `.btn-dark` utilities.

So the **actual rendered UI**:
- Primary action color = **orange `#ff6b35`** (light mode), **purple `#7b5cff`** (dark mode).
- FAB stays **amber `#F59E0B`** — defined directly in `app.css`, not overridden.
- WhatsApp CTA stays **WhatsApp green gradient** — defined directly.
- Logo stays **purple** with paint-roller iconography — it's a separate asset, not theme-driven.
- Status badges use the `.hbadge` system: `hby` (amber), `hbb` (brand orange), `hbg` (green), `hbr` (red).

The `colors_and_type.css` in this folder defines tokens from BOTH layers, preferring the Lovable overrides (orange) since that's what ships.

## Sources

- **Lovable prototype** — [pint-dash.lovable.app](https://pint-dash.lovable.app/). This is the live design direction (orange brand, hero gradient card, Performance Hub naming, `>` eyebrows). The UI kit in this design system matches **this prototype**, not the older shipped `app.css`.
- **GitHub repo** — `maozinhaws/pintor-plus` on branch `feature/storage-sqlite-dexie-offline` (commit `69bb677`). Imported files used as reference:
  - `app.css` (45 KB) — the production stylesheet
  - `src/styles-lovable.ts` — the Lovable design tokens layer
  - `src/main.ts` — confirms `.dark` class toggling (not `data-theme`) and Lovable injection
  - `LOVABLE_DESIGN_INTEGRATION.md` — design intent doc
  - `public/apple-touch-icon.png` / `android-chrome-192x192.png` — the real brand mark
- **Product spec** — the detailed handoff doc pasted at project kickoff (matches the Lovable layer intent).
- **Font file** — `fonts/Sora-VariableFont_wght.ttf` uploaded by the brand owner.

## Brand at a glance

- **Name**: Pintor Plus
- **Logo**: purple stylized "P" with paint-roller motif (see `assets/mark.png`)
- **Primary action**: orange `#ff6b35` (light) / purple `#7b5cff` (dark)
- **Entry to new orçamento**: gradient pill `+ NOVO ORÇAMENTO` at the bottom of the sidebar + the giant hero gradient card on the dashboard. (The amber FAB seen in older `app.css` was dropped in the Lovable prototype.)
- **Tone**: practical, direct, second-person, Portuguese, uppercase eyebrows
- **Audience**: solo painters quoting jobs on-site, often one-handed, often under sun

## Three themes (`data-tema`)

The app ships **three aesthetic modes** the painter can pick under Configurações → Aparência:

| Tema | Description | Behaviour |
|---|---|---|
| **Suave** (default) | Glass & cores — curves, liquid-glass / gelatin animations | Full radius scale, all transitions enabled, `.glass*` surfaces with the live corner |
| **Minimalista** | Sólido & direto — square, no curves, **animations kept** | All `--radius-*` → 0, signature surfaces forced to `border-radius: 2px`. Transitions and animations stay on. |
| **Brutalista** | Acessibilidade · cores objetivas · sem degradê · sem animação | Pure black text (`#000`) on pure white, 2px black borders, **all gradients flattened to solid black** (hero card, CTA pills, step pills, mode avatars all become solid #000), no shadows, all animations disabled, focus ring is solid black. |

Toggle in code: `document.documentElement.dataset.tema = "suave" | "minimalista" | "brutalista"` (or omit for Suave). Tokens cascade automatically.

The three modes are orthogonal to the **light/dark** flip — you can run Brutalista + dark, Minimalista + light, etc.

## Index

| Path | What it is |
|---|---|
| `README.md` | This file — context, content fundamentals, visual foundations, iconography |
| `SKILL.md` | Agent skill manifest (cross-compatible with Claude Code) |
| `colors_and_type.css` | All design tokens — `--bl` / `--am` / `--gn` / `--rd`, ink scale, surfaces, radii, shadows, signature utilities (`.glass`, `.glass-brand`, `.fab-add`, `.btn-brand`, `.btn-wa`, `.hbadge`). Includes backward-compatible aliases (`--card`, `--foreground`, etc.). |
| `fonts/Sora-VariableFont_wght.ttf` | Brand-supplied Sora variable font (100–900 weight axis) |
| `assets/mark.png` | Real brand mark — purple "P" 180×180 (from `public/apple-touch-icon.png`) |
| `assets/mark-large.png` | Same mark at 192×192 for higher density |
| `preview/` | 23 design-system preview cards (visible in the Design System tab) |
| `ui_kits/pintor_plus_app/` | Mobile app UI kit — clickable React prototype matching the production home/wizard/detail screens |
| `ui_kits/pintor_plus_app/index.html` | Run this in a browser to see the interactive prototype |

### Fonts

- **Sora** — variable font (100–900) shipped locally at `fonts/Sora-VariableFont_wght.ttf`. Production uses it for body AND display.
- **Manrope** — loaded from Google Fonts as a Lovable fallback (rarely wins specificity because `app.css` explicitly says `'Sora', sans-serif` on most selectors).
- **DM Mono** — loaded from Google Fonts. Used for numbers, totals, orçamento IDs.
- **Calibri** — referenced for number inputs (`.minp`, `input[type=number]`). System fallback only — no file shipped.

### Theme

- Light is default. Dark toggles via `document.documentElement.classList.toggle('dark')` — **the spec note about `[data-theme="escuro"]` is wrong**, the actual app uses `.dark`.
- Tokens scale automatically inside `:root.dark`. The brand color flips orange → purple in dark mode (deliberate — keeps contrast on dark surfaces).
- The mockups in this kit accept the spec's `escuro` value and translate it to `.dark` for compatibility.

## Content Fundamentals

**Language: Brazilian Portuguese, throughout.** Pintor Plus is built for a Brazilian audience and the UI never mixes English in. When you mock new screens, write in PT-BR ("Novo Orçamento", "Próximo evento", "Toque para iniciar", "Adicionar item", "Rascunho fica salvo").

**Voice: practical, direct, second-person.** Short imperative phrases. No emoji in product chrome.

**Casing rules:**
- **UPPERCASE** for: section eyebrows (`PRINCIPAL`, `SISTEMA`), step labels (`CLIENTE`, `AMBIENTES`), status badges (`ENVIADO`, `APROVADO`), page-level title-bigs (`TIPO DE ORÇAMENTO`).
- **Title case** for: card headings, modal titles, primary CTAs ("Salvar Orçamento", "Adicionar item", "Gerar PDF").
- **Sentence case** for: body copy, helper text, address lines, placeholder text.

**Concrete examples (from the codebase):**
- Modal title: "Tipo de Orçamento" with three modes — Flash, Foto, Detalhado
- Status flow: `rascunho → enviado → aprovado / recusado → finalizado`
- Action buttons: "Salvar", "Enviar pelo WhatsApp", "Gerar PDF"
- Toast example: success ✓ messages render in dark slate pill with white text

**What's avoided:**
- No exclamation marks. No marketing fluff.
- No emoji in interface chrome (may appear in user-typed observations).
- No anglicisms when a PT-BR word exists ("orçamento" not "quote").
- No second-person plural; always singular ("você") or imperative ("toque", "adicione").

## Visual Foundations

**Aesthetic in one line:** field-tool first. Clean white cards on a slate-gray background, an unmissable amber FAB pinned bottom-right, an orange-glow focus ring, and a dedicated WhatsApp-green action for sharing.

### Colors

- **`--bl` (action color)** = orange `#ff6b35` light, purple `#7b5cff` dark. Drives Save buttons, focused input borders, step pills, PDF chip backgrounds, and the WhatsApp count.
- **`--am` (amber `#F59E0B`)** = the **FAB**. Cream-bordered, dark-shadowed, a persistent visual anchor on every list screen. Not theme-shifted.
- **`--gn` (green `#16a34a`)** = "aprovado" status, totals on cards (`.hoov`), and the secondary success color.
- **`--rd` (red `#ef4444`)** = destructive only — delete buttons, "recusado" status, offline-banner errors.
- **`--ink` / `--ink2` / `--ink3`** = three-level text scale. Primary text `#111`, secondary `#374151`, muted `#6b7280`.
- **Surfaces** = `--bg #f4f4f6` / `--bg-card #ffffff` / `--bdr #ececef`. Slate-tinted shadow `0 4px 12px rgba(15,23,42,0.05)`.
- **Imagery vibe**: real phone-camera output — warm, untouched, no filters. The "Foto" mode captures raw walls/surfaces, and the PDF lays them in a grid with an "Anotada" badge if edited.

### Type

- **Sora** (variable, 100–900) for everything in the UI — body labels (.finput), card titles (.hon, .hm-name), section eyebrows. Lovable spec calls Manrope a fallback but it loses specificity in shipped CSS.
- **DM Mono** for numeric runs — totals (`.hoov`, `.orc-total-display`), orçamento IDs.
- **Calibri** for number inputs only (`.minp`, `[type=number]`) — deliberate choice for compact digit width on small screens.
- Scale tight: 10px eyebrow → 11 → 13 → 14 → 15 → 16 → 18 → 24 → 28. Mobile body is 14px (matches `.finput`).

### Backgrounds

- Solid color fills only. **No gradients on page backgrounds**, no patterns, no textures, no full-bleed photography under content.
- The brand gradient is reserved for the `.glass-brand` card (used sparingly — not on every screen) and decorative areas in install banners.
- No grain, no noise overlay.

### Corners

- **Cards (`.sec`, `.hoc`, `.rcard`)** — `border-radius: 14–16px` all four corners. **Not** the dramatic live-corner.
- **Lovable `.glass`** — `0 32px 32px 32px` (live corner top-left). Available but used in only a few new screens.
- **Lovable `.glass-brand`** — `36px 0 36px 36px` (live corner top-right). For brand-hero moments.
- **Inputs (`.finput`, `.field`)** — 12px with 1.5px border.
- **Pills / badges** — fully rounded (`9999px`).
- **FAB** — perfect circle (50%).

### Shadows / elevation

- **Default card (`--sh`)** = `0 4px 12px rgba(15,23,42,0.05)` — slate-tinted, very subtle.
- **FAB** = `0 8px 24px rgba(0,0,0,0.25)` — dark and present, the FAB *should* hover off the page.
- **WhatsApp button** = `0 4px 14px rgba(37,211,102,0.30)` — green-tinted.
- **Save (`--bl`)** = `0 4px 14px rgba(255,107,53,0.30)` — orange-tinted.
- **Brand glass** = `0 20px 50px -15px rgba(123,92,255,0.35)` — purple-tinted.
- **Focus ring** = `0 0 0 3px rgba(255,107,53,0.18)` — orange glow, NEVER native blue.

### Borders

- 1.5px for inputs and section cards. Very light color (`#ececef` / `#e5e7eb`) — borders contain, they don't decorate.
- Active state never thickens the border — it changes the fill (chip becomes `bg-bl`) or border color (input → orange).

### Animation

- **Press feedback** is the primary animation: `active:scale(0.92–0.98)` on cards, FABs, buttons. 150–200ms cubic-bezier.
- **State transitions** (input focus, theme switch) — 150–350ms on `background-color, color, border-color, box-shadow`.
- **Page transitions** = a 220ms slide-in-right (`@keyframes pgIn`). The wizard step changes use this.
- **No bounces, no springs** outside of the toast (`cubic-bezier(.34,1.4,.64,1)`).
- **Hover states** only on desktop sidebar. On mobile, design for press.

### Transparency & blur

- `.glass-overlay` modal backdrop = `rgba(0,0,0,0.45)` + `backdrop-filter: blur(8px)`.
- The amber FAB and dark statusbar buttons use `backdrop-filter: blur(6px)` over photos in some screens.
- No frosted-glass full panels. Modals are solid `bg-modal`.

### Layout rules

- Mobile-only by default. The web build does have a `@media (min-width: 1024px)` rule that adds a permanent left sidebar — used on tablets/desktop.
- Top navigation = white header with title, optional back chevron, optional close X. `padding-top: env(safe-area-inset-top)`.
- FAB position: `bottom: calc(20px + env(safe-area-inset-bottom)); right: 20px`. Always.
- Keyboard avoidance: `--kb-h` CSS var tracks the soft-keyboard height; `body.kb-open` collapses non-essential UI so inputs stay visible.

### Cards

- **`.sec`** — content section: white-alt fill, 14px rounded, 1px subtle border, slate shadow. Used everywhere.
- **`.hoc`** — orçamento card on the home list: same shape + status badge + action button row (WhatsApp / PDF / OK).
- **`.rcard`** — room card in the wizard: same shape but with a collapsible header and delete button.
- **`.glass-brand`** — gradient hero card (live corner top-right). Reserved for hero moments — not on every screen.

### Iconography

- Production uses an inline SVG icon set declared in `src/utils.ts` (the `ico()` helper) with a Lucide-like style. They're stroke-only, 2px line weight, rounded caps. We mirror this via Lucide CDN in the UI kit.
- Default icon size: 24px (`size-6` equivalent). Use 20px inline with body text, 28px+ inside FAB-like buttons.
- Color: inherit from text. FAB icon is `#92400E` on amber; WhatsApp icon is white on green; PDF icon is `--bld` (brand color) on `--bll` (light brand bg).

> **Note on icons:** The Lovable-style line icons we use here are a **substitution** via Lucide CDN. The real codebase ships an inline SVG icon helper (`ico` in `src/utils.ts`) — visually equivalent but not byte-identical. If pixel fidelity matters, lift the helper directly.

**No emoji in product chrome.** Emoji only appears in the WhatsApp message output (user-facing copy with optional 🏠💰📅) and in user-typed observation fields, never in app labels.

**Brand mark:** `assets/mark.png` (180×180). Purple stylized P with paint roller — the only piece of brand identity that doesn't shift with theme.
