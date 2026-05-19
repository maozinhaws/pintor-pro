# Pintor Plus — Project Overview

PWA offline para pintores: crie orçamentos, gerencie clientes e fornecedores — tudo salvo localmente no dispositivo.

---

## 📊 Current Status

**Date:** 2026-05-13  
**Version:** MVP 1.0  
**Status:** ✅ Funcional e pronto para refatoração  

### What's Complete
- ✅ PWA offline-first com Service Worker
- ✅ CRUD completo: orçamentos, clientes, fornecedores, eventos
- ✅ Orçamento Flash (modo rápido)
- ✅ Dark Mode
- ✅ Integração WhatsApp
- ✅ Recibos de pagamento
- ✅ Configurações da empresa

### What's Missing (Roadmap)
- ❌ Google Drive sync
- ❌ PDF export
- ❌ Google Calendar integration
- ❌ Google Contacts integration
- ❌ Clean Architecture refactoring
- ❌ Comprehensive test coverage

---

## 🛠️ Technology Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla TypeScript |
| **PWA** | Service Worker, Web App Manifest |
| **Storage** | localStorage (99.9% dos casos), sessionStorage (fallback) |
| **Auth** | Supabase + Google OAuth |
| **APIs** | Google Places (endereço), Web Contacts API |
| **Deploy** | Vercel (production), HTTP server (local) |
| **Build** | Vite (implicit), no build step needed |

### Next Tech (Future)
- **React Native + Expo** — Android rebuild (React Native > Capacitor for production quality)
- **SQLite + Dexie.js** — Local database upgrade
- **Modular architecture** — Clean separation of concerns

---

## 📁 Project Structure

```
/
├── app.html              ← Aplicação principal (SPA)
├── index.html            ← Landing page
├── sw.js                 ← Service Worker (cache offline)
├── site.webmanifest      ← Manifesto PWA (app.html)
├── manifest.json         ← Manifesto alternativo (index.html)
├── privacy-policy.html   ← Política de Privacidade e Termos
├── vercel.json           ← Configuração deploy e headers
├── _headers              ← Headers para Netlify/Cloudflare
├── src/                  ← TypeScript modules (currently orphaned)
│   ├── types.ts          ← Type definitions
│   ├── state.ts          ← Global state management
│   ├── main.ts           ← App initialization
│   ├── navigation.ts     ← Router logic
│   ├── budgets.ts        ← Budget CRUD
│   ├── clients.ts        ← Client CRUD
│   ├── suppliers.ts      ← Supplier CRUD
│   ├── events.ts         ← Event/Calendar logic
│   ├── utils.ts          ← Helper functions
│   ├── ui.ts             ← UI orchestration (orphaned)
│   ├── data.ts           ← Initial data (orphaned)
│   └── rooms.ts          ← Room logic (orphaned)
└── docs/                 ← Documentação
```

### ⚠️ Known Issues in Current PWA

1. **Dual S objects** — `const S` in inline script + separate `S` in `state.ts` (race condition)
2. **Orphaned TypeScript modules** — `ui.ts`, `data.ts`, `rooms.ts` never imported/executed
3. **2,540 lines of duplicate inline JavaScript** — original code that shadows TypeScript
4. **App runs on inline JS, not TypeScript** — refactoring stalled mid-way

These issues will be resolved in React Native rebuild.

---

## 🚀 How to Use

### Option 1 — Open in Browser
```
Double-click app.html or drag to Chrome/Firefox
```

### Option 2 — Local Server (Recommended for PWA)
```bash
npx serve .
# or
python -m http.server 8080
# then open http://localhost:8080/app.html
```

### Option 3 — Deploy to Production
```bash
vercel --prod
# or push to main → automatic Vercel deploy
```

---

## 📊 Data Model (7 Core Entities)

1. **Orcamento** (Budget) — Invoice with client data, rooms, items, pricing
2. **Room** (Cômodo) — Room/space with dimensions, items, services
3. **Item** — Service line item (labor, materials)
4. **Cliente** (Client) — Person with contact and address
5. **Fornecedor** (Supplier) — Vendor with contact and services
6. **Evento** (Event) — Calendar event / appointment
7. **Config** — App settings (company name, logo, signature, preferences)

See `ARCHITECTURE.md` for detailed structure.

---

## 🎯 Business Logic Highlights

### Budget Calculation
```
Total = Σ(room.price × room.m²) + Σ(item.price × item.m²) + (orc.price × totalM²)
```

### State Persistence
- All data saved to `localStorage` (key: `pp-*`)
- Automatic sync on every change via `saveOrcs()`
- Fallback to `sessionStorage` if storage quota exceeded

### Navigation Model
- Hash-based routing: `#home`, `#step-1`, `#config`
- 13 pages + 4 modals
- 4-step wizard for budget creation
- Back navigation with dirty-flag confirmation

---

## 🔐 Security

Headers configured in `vercel.json` and `_headers`:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

No server-side API calls — all data stored locally.

---

## 📋 Getting Started Checklist

- [ ] Clone repo
- [ ] Open `app.html` in browser
- [ ] Go to Settings, fill company info
- [ ] Create first budget
- [ ] Share with WhatsApp
- [ ] Read `ARCHITECTURE.md` for deep dive
- [ ] Read `IMPLEMENTATION.md` for roadmap

---

## 🔗 Documentation Index

- **`OVERVIEW.md`** (this file) — Project status, stack, structure
- **`ARCHITECTURE.md`** — Data model, design patterns, navigation flows
- **`IMPLEMENTATION.md`** — Development guide, phase roadmap, deployment

**Archived docs** → `docs/old_docs/` (historical analysis, superseded plans)

---

## 👥 Contact

- **Desenvolvedor:** Wagner Maniatec
- **Email:** wagner.maniatec@gmail.com

---

**Last updated:** 2026-05-13  
**Next milestone:** Clean Architecture refactoring + React Native MVP
