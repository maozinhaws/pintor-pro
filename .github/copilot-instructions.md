# Copilot Instructions for Pintor Plus MVP

- This is a small Capacitor + Vite TypeScript web app built as a mobile/PWA MVP.
- The app is not a framework project: it uses plain DOM manipulation, inline HTML event handlers, and shared state in `src/state.ts`.
- The main runtime entry is `src/main.ts`; navigation is handled in `src/navigation.ts`; UI logic lives mostly in `src/ui.ts` and `src/appConfig.ts`.
- `src/state.ts` holds the application model and localStorage persistence (`pp-orcs`, `pp-clientes`, `pp-fornecedores`, `pp-eventos`, `pp-config`). Do not invent Redux or React abstractions.

## Key patterns

- Event handlers are attached through global functions on `window` and inline `onclick` attributes in `app.html`.
- Page switching is managed by `.page` classes and `showPage(id)` in `src/navigation.ts`.
- Global app state is mutated directly via `S` and mirrored to localStorage with `saveOrcs()`.
- The app uses Capacitor plugin interactions in `src/main.ts` for `Keyboard` and `StatusBar` only.
- Vite build input is `app.html`; the build script copies `dist/app.html` to `dist/index.html` after building.

## Build and run

- `npm run dev` starts Vite and opens `/app.html` in the browser.
- `npm run build` runs `tsc && vite build` and then copies `dist/app.html` to `dist/index.html`.
- `npm run preview` serves the production build.
- Native wrapper config is in `capacitor.config.ts` and Android assets are generated into `android/app/src/main/assets/public`.

## Workflows

- Fix UI or logic in `src/*.ts`; do not edit generated files under `dist/` or Android build outputs.
- When changing HTML structure, update `app.html` and confirm any inline handler names remain in `window` exports in `src/main.ts` or module files.
- Local state uses stringified JSON in localStorage; handle missing data and legacy config fallbacks in `src/state.ts`.

## What to prioritize

- Keep changes compatible with the plain DOM/inline event architecture.
- Preserve existing `S.isDirty` navigation guard behavior in `src/navigation.ts` and `src/main.ts`.
- Use built-in helper utilities from `src/utils.ts` for formatting, numeric parsing, and sanitization.
- For mobile behavior, prefer the existing keyboard handling approach in `src/main.ts` rather than adding new input libraries.

## Important files

- `app.html` - application shell, pages, inline markup, and event hooks.
- `src/main.ts` - app bootstrap, theme, keyboard handling, service worker registration.
- `src/navigation.ts` - page navigation and history state.
- `src/state.ts` - shared state, persistence, default config.
- `src/ui.ts` - form rendering, item/room flows, modal rendering.
- `vite.config.ts` - Vite input/output configuration.
- `capacitor.config.ts` - Capacitor webDir and plugin settings.

## Avoid

- Avoid introducing framework-specific patterns (React/Vue/Svelte).
- Avoid editing `dist/` or `android/` generated assets directly.
- Avoid changing the app shell path from `app.html` without also updating the Vite build and copy step.
