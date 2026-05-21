---
name: pintor-plus-design
description: Use this skill to generate well-branded interfaces and assets for Pintor Plus, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

Pintor Plus is a mobile-first, offline-first app for autonomous Brazilian house painters. The visual language is field-tool, not SaaS — bold high-contrast, light mode default, orange/purple brand gradient, and the signature **live corner** (sharp top-left on white cards, top-right on brand cards).

**Key references inside this skill:**
- `README.md` — full context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — every design token, importable as-is
- `assets/` — logo (`logo.svg`), brand mark (`mark.svg`, `mark-mono.svg`)
- `ui_kits/pintor_plus_app/` — clickable React prototype of the mobile app (dashboard, wizard, câmera, detalhe), source of truth for component behavior

**When the user asks you to build:**
- **Visual artifacts** (slides, mocks, throwaway prototypes) — copy assets out of `assets/`, import `colors_and_type.css`, and lift components from `ui_kits/pintor_plus_app/`. Output static HTML.
- **Production code** — read the rules in README.md to become an expert in Pintor Plus design and write production-quality code in their stack (React + Tailwind + Lovable Cloud).

**Always:**
- Write product copy in **Brazilian Portuguese** (it's a PT-BR product).
- Default to **light mode**; treat dark mode as an opt-in toggle.
- Preserve the **live corner** shape on cards — it's the brand's recurring silhouette.
- Use the **orange focus glow** (`box-shadow: 0 0 0 3px rgba(255,107,53,0.28)`) on inputs, never the native blue ring.
- Avoid emoji in product chrome, gradient backgrounds, and full-bleed decorative imagery.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few focused questions (audience, surface, fidelity, variations), and act as an expert designer who outputs HTML artifacts *or* production code, depending on the need.
