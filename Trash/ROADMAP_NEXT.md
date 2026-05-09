# ROADMAP — Pintor Plus · Reescrita Next.js

> Documento de referência para a migração do MVP HTML puro para Next.js 14 + TypeScript + Dexie.js.
> Criado em: 2026-05-05

---

## 1. ESTADO ATUAL (Before)

| Item | Detalhe |
|------|---------|
| Stack | HTML5 + CSS3 + Vanilla JS inline (4 818 linhas, 1 arquivo) |
| Build | Vite (sem uso real — app é o HTML direto) |
| Storage | `localStorage` (~5 MB limit) |
| Auth | Nenhuma (Drive/Supabase OAuth removidos do MVP) |
| PWA | Service Worker + manifest manual |
| Deploy | Vercel (estático) |
| Testes | Nenhum |
| Acessibilidade | Toggle "textos grandes" (rudimentar) |

### Páginas / Seções existentes
- `#pg-home` — Dashboard com mini-cards e eventos do dia
- `#pg-orcamentos` — Lista de orçamentos + busca
- `#pg-orc-form` — Wizard multi-step (cliente → cômodos → itens → resumo)
- `#pg-flash` — Orçamento Flash (visita rápida)
- `#pg-clientes` — CRUD de clientes
- `#pg-fornecedores` — CRUD de fornecedores
- `#pg-agenda` — Agenda local de eventos/lembretes
- `#pg-config` — Configurações da empresa
- `#pg-backup` — Export/Import JSON
- `#pg-termos` — Termos + Política de Privacidade (LGPD)

### Design Tokens (preservar exatamente)
```css
/* Light */
--bl: #7C3AED   /* brand primary */
--bld: #6D28D9  /* brand dark */
--bll: #F5F3FF  /* brand light bg */
--gn: #10B981   /* success */
--rd: #EF4444   /* danger */
--am: #F59E0B   /* warning */
--ink: #0F172A  --ink2: #334155  --ink3: #64748B
--bg: #F8FAFC   --bg2: #F1F5F9  --bdr: #E2E8F0
--bg-input: #ffffff  --bdr-input: #CBD5E1
--bg-card: #F1F5F9   --bg-card-alt: #ffffff
--bg-modal: #ffffff
--sh: 0 4px 12px rgba(15,23,42,.05)

/* Dark */
--bl: #8B5CF6   --bld: #A78BFA   --bll: #4C1D95
--ink: #F8FAFC  --ink2: #E2E8F0  --ink3: #94A3B8
--bg: #0F172A   --bg2: #1E293B   --bdr: #334155
--bg-input: #1E293B  --bdr-input: #475569
--bg-card: #1E293B   --bg-card-alt: #0F172A
--bg-modal: #1E293B
--sh: 0 4px 12px rgba(0,0,0,.4)
```

### Fonte
- `Sora` (400, 600, 700, 800) — manter como primary
- `DM Mono` (400, 500) — manter para valores numéricos

---

## 2. ESTADO ALVO (After)

| Item | Detalhe |
|------|---------|
| Framework | Next.js 14 — App Router |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS + CSS Variables (tokens acima) |
| Storage | Dexie.js (IndexedDB) — sem limite prático |
| Auth | NextAuth.js v5 + Google OAuth |
| PWA | `@ducanh2912/next-pwa` + SW offline |
| Deploy | Vercel (unchanged) |
| Testes | Nenhum no MVP (roadmap futuro) |
| Acessibilidade | 3 modos opcionais: Miopia · Alto Contraste · Daltonismo |

### Estrutura de pastas alvo
```
/
├── app/
│   ├── layout.tsx          ← providers: theme, auth, accessibility
│   ├── page.tsx            ← home dashboard
│   ├── orcamentos/
│   │   ├── page.tsx        ← lista
│   │   └── [id]/page.tsx   ← editor wizard
│   ├── flash/page.tsx
│   ├── clientes/page.tsx
│   ├── fornecedores/page.tsx
│   ├── agenda/page.tsx
│   ├── config/page.tsx
│   ├── backup/page.tsx
│   └── termos/page.tsx
├── components/
│   ├── ui/                 ← Button, Input, Modal, Toast, Card, Select...
│   ├── layout/             ← AppShell, TopNav, Sidebar, BottomNav
│   └── features/           ← OrcamentoCard, ClienteCard, EventoCard...
├── lib/
│   ├── db/                 ← Dexie schema + migrations
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── hooks/              ← useOrcamentos, useClientes, useEventos...
│   ├── types/              ← Orçamento, Cliente, Fornecedor, Evento, Config
│   ├── utils/              ← formatBRL, maskDoc, formatDate, whatsappShare
│   └── accessibility/      ← theme variants, toggle logic
├── public/
│   ├── icons/              ← favicons, manifests
│   └── sw.js               ← gerado pelo next-pwa
├── styles/
│   └── globals.css         ← CSS vars + Tailwind base
├── next.config.ts
├── tailwind.config.ts
└── middleware.ts            ← auth guard
```

---

## 3. STACK TÉCNICO FINAL

| Pacote | Versão | Uso |
|--------|--------|-----|
| next | 14.x | Framework |
| react / react-dom | 18.x | UI |
| typescript | 5.x | Tipagem |
| tailwindcss | 3.x | Estilo |
| dexie / dexie-react-hooks | ^4 | IndexedDB |
| next-auth | v5 (beta) | Google OAuth |
| @ducanh2912/next-pwa | ^10 | PWA + SW |
| next-themes | ^0.3 | Dark mode |
| lucide-react | latest | Ícones SVG |

---

## 4. MODELOS DE DADOS (Dexie)

```typescript
// Orçamento
interface Orcamento {
  id: string
  cliente: ClienteRef
  comodos: Comodo[]
  itens: Item[]
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado'
  total: number
  criadoEm: number
  atualizadoEm: number
  observacoes?: string
}

// Cliente
interface Cliente {
  id: string
  nome: string
  tel?: string
  email?: string
  cpf?: string
  end?: string
  historico: string[]  // ids de orçamentos
}

// Fornecedor
interface Fornecedor {
  id: string
  nome: string
  categoria: string
  tel?: string
  email?: string
  obs?: string
}

// Evento (Agenda local)
interface Evento {
  id: string
  titulo: string
  data: string       // YYYY-MM-DD
  hora?: string
  orcamentoId?: string
  cor: string
  notificacao: boolean
}

// Config da empresa
interface Config {
  nome?: string
  tel?: string
  email?: string
  cnpj?: string
  end?: string
  logo?: string      // base64
  assinatura?: string
}
```

---

## 5. ACESSIBILIDADE — 3 MODOS OPCIONAIS

Configurados em `Configurações → Acessibilidade`. Persistidos no Dexie. Combinações livres (stack de classes no `<html>`).

| Modo | Classe HTML | O que muda |
|------|-------------|------------|
| **Miopia** | `.a11y-myopia` | font-size base +20%, touch targets mínimo 56px, espaçamento +25% |
| **Alto Contraste** | `.a11y-high-contrast` | paleta WCAG AAA, bordas mais espessas, sombras eliminadas |
| **Daltonismo** | `.a11y-colorblind` | troca verde/vermelho por azul/laranja, adiciona ícone/padrão além de cor |

---

## 6. AUTENTICAÇÃO GOOGLE

- NextAuth.js v5 com Google Provider
- Sessão salva em cookie httpOnly (JWT)
- Dados do usuário (nome, email, foto) exibidos em Config
- **Sem Drive** no MVP — auth serve apenas para identificação e personalização
- Offline: app funciona sem sessão (dados no Dexie local)
- Middleware: rotas protegidas opcionais (`/config`, `/backup`) — usuário pode usar sem login mas vê banner sugestivo

---

## 7. SEGURANÇA

- CSP via `next.config.ts` headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: desabilita câmera/mic não usados
- NextAuth: CSRF automático, cookies Secure + SameSite=Lax
- Inputs: sanitização via DOMPurify para campos livres
- Dexie: sem SQL injection (API de objetos)
- LGPD: consentimento antes de ativar Google login

---

## 8. SWARM — 9 AGENTES

### Diagrama de fases

```
FASE 1 (bloqueante)
└── [A1] Foundation ──────────────────────────────────────────┐
                                                               │
FASE 2 (paralela, após A1)                                     ▼
├── [A2] Data Layer ───────────────────────────────────────────┐
└── [A3] Design System ────────────────────────────────────────┤
                                                               │
FASE 3 (paralela, após A2+A3)                                  ▼
├── [A4] Orçamentos ────────────────────────────────────────── │
├── [A5] Clientes + Fornecedores ───────────────────────────── │
├── [A6] Home + Agenda ─────────────────────────────────────── │
├── [A7] Config + Backup + Termos ──────────────────────────── │
├── [A8] Acessibilidade ─────────────────────────────────────── │
└── [A9] Segurança + Auth ──────────────────────────────────── ┘
```

---

### Tabela de agentes

| ID | Nome | Provider | Modelo | Responsabilidade |
|----|------|----------|--------|-----------------|
| **A1** | Foundation | Gemini CLI | `gemini-2.5-flash` | Next.js init · Tailwind config com tokens · `globals.css` · `next.config.ts` · `@ducanh2912/next-pwa` setup · `layout.tsx` com providers · Dexie init vazio · estrutura de pastas |
| **A2** | Data Layer | MIMO | `mimo-v2.5-pro` | Dexie schema completo · todas as TypeScript interfaces · todos os custom hooks (`useOrcamentos`, `useClientes`, `useFornecedores`, `useEventos`, `useConfig`) · funções utilitárias (`formatBRL`, `maskDoc`, `whatsappShare`, `exportBackup`, `importBackup`) |
| **A3** | Design System | Gemini CLI | `gemini-2.5-flash` | Todos componentes base: `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Toast`, `Card`, `Spinner`, `TopNav`, `Sidebar`, `AppShell`, `StepPills`, `Badge`, `EmptyState` · fiel ao visual atual |
| **A4** | Orçamentos | Gemini CLI | `gemini-2.5-flash` | `/orcamentos` lista + busca · `/orcamentos/[id]` wizard multi-step · `/flash` orçamento rápido · WhatsApp share · tela de resumo/recibo |
| **A5** | Clientes + Fornecedores | MIMO | `mimo-v2.5` | `/clientes` CRUD completo · `/fornecedores` CRUD completo · modal de edição · histórico de orçamentos por cliente |
| **A6** | Home + Agenda | Gemini CLI | `gemini-2.5-flash` | `/` dashboard (mini-cards: orçamentos, clientes, eventos do dia) · `/agenda` lista/calendário de eventos · criação/edição de evento · exportar ICS |
| **A7** | Config + Backup + Termos | MIMO | `mimo-v2.5` | `/config` form empresa + logo + assinatura + dark mode toggle · `/backup` export/import JSON · `/termos` texto limpo (sem Drive/OAuth) · LGPD consent modal |
| **A8** | Acessibilidade | Gemini CLI | `gemini-2.5-flash-lite` | Sistema de 3 modos (miopia, alto contraste, daltonismo) · CSS variables por modo · toggles na tela Config · persistência no Dexie · aplicação via classe no `<html>` |
| **A9** | Segurança + Auth | Claude (oauth) | `claude-sonnet-4-6` | NextAuth v5 Google Provider · middleware de auth · CSP headers · `vercel.json` security · sanitização de inputs · LGPD consent flow · auditoria final do código dos outros agentes |

---

## 9. CRITÉRIOS DE CONCLUSÃO POR AGENTE

| Agente | Pronto quando... |
|--------|-----------------|
| A1 | `npm run dev` sobe sem erro · rota `/` renderiza AppShell vazio · Tailwind tokens aplicados |
| A2 | `db.orcamentos.toArray()` funciona · todos os hooks exportados · tipos sem erro TS |
| A3 | Storybook mental: todos componentes renderizam isolados · dark mode funciona em cada um |
| A4 | Criar orçamento completo · ver lista · compartilhar via WhatsApp · Flash mode funcional |
| A5 | CRUD completo clientes e fornecedores · busca funcional |
| A6 | Dashboard mostra dados reais do Dexie · criar/editar/deletar evento · exportar ICS |
| A7 | Config salva no Dexie · backup download/upload JSON · termos sem menção a Drive |
| A8 | Ativar cada modo muda visual corretamente · combinações funcionam · persistem no reload |
| A9 | Login Google funciona · sessão persiste · CSP não quebra app · nenhum XSS encontrado |

---

## 10. O QUE NÃO MUDA

- Visual idêntico ao atual (mesma paleta, fonte Sora, border-radius, sombras)
- Funcionalidade offline (PWA + Dexie funciona sem internet)
- WhatsApp como canal de saída de orçamentos
- Sem backend próprio (Vercel Functions apenas para NextAuth callback)
- Deploy Vercel

---

## 11. O QUE MUDA (resumo)

| Antes | Depois |
|-------|--------|
| 1 arquivo HTML 4 818 linhas | ~50 arquivos TypeScript organizados |
| localStorage 5 MB | IndexedDB via Dexie (sem limite prático) |
| Sem login | Google OAuth via NextAuth (opcional) |
| Acessibilidade: 1 toggle | 3 modos combinados (miopia, contraste, daltonismo) |
| Sem tipagem | TypeScript strict em tudo |
| Vite sem uso real | Next.js 14 App Router com SSG |
| JS imperativo | React declarativo com hooks |

---

## 12. ORDEM DE EXECUÇÃO DO SWARM

```
1. Orchestrator lê este ROADMAP e confirma escopo com usuário
2. Spawn A1 (Foundation) → aguarda idle
3. Spawn A2 + A3 em paralelo → aguarda ambos idle
4. Spawn A4 + A5 + A6 + A7 + A8 + A9 em paralelo → aguarda todos idle
5. Orchestrator faz review final + commit
6. Deploy Vercel
```

---

*Este documento deve ser mantido atualizado durante a execução. Cada agente deve marcar sua seção como ✅ ao concluir.*
