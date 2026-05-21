# Pintor Plus — Mobile App UI Kit

A high-fidelity recreation of the Pintor Plus mobile app: dashboard, "Tipo de Orçamento" modal, the wizard (Cliente → Ambientes → Pagamento → Revisão), and a sample orçamento detail.

## What's in here

| File | What it is |
|---|---|
| `index.html` | Interactive clickable prototype — open in browser. Mobile-frame layout. |
| `App.jsx` | Top-level state + screen router. |
| `Shell.jsx` | Phone frame, MenuButton, ThemeToggle, PageHeader. |
| `Sidebar.jsx` | Drawer sidebar (Principal / Sistema sections + bottom CTA). |
| `Dashboard.jsx` | Hero CTA, métricas, fluxo recente, próximo evento. |
| `TipoOrcamentoModal.jsx` | Bottom sheet — pick Flash / Foto / Detalhado. |
| `WizardScreen.jsx` | Stepper + Cliente → Ambientes screens. |
| `OrcamentoDetalhe.jsx` | Detail view of a saved orçamento. |
| `Primitives.jsx` | `GlassCard`, `GlassBrand`, `Pill`, `BtnDark`, `Field`, `MetricPill`, etc. |

## Icons

Lucide icons via the CDN script (`https://unpkg.com/lucide@latest`). Initialised once on mount.

## Caveats

This kit was built from the Pintor Plus product spec (text-only — no source repo or Figma was attached). The visuals follow every rule named in the spec: live-corner cards, orange focus glow, Sora+Manrope+JetBrains Mono, light-default with dark toggle. Component implementations are **cosmetic recreations**, not production logic — IndexedDB persistence, autosave, camera permissions, PDF generation, etc. are simulated or stubbed.
