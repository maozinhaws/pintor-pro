# Índice de Documentação Técnica — Pintor Plus MVP

Referência técnica completa para arquitetura, estrutura de dados, navegação e migração da aplicação.

---

## 📚 Documentos Disponíveis

### 1. **README.md**
Visão geral do projeto, tecnologias, funcionalidades e como usar.
- Stack: HTML5, CSS3, Vanilla JS, PWA
- Funcionalidades do MVP
- Como rodar localmente
- Estrutura básica

### 2. **ANALISE_HTML.md**
Análise comparativa entre `index.html` (landing page) e `app.html` (aplicação PWA).
- Diferenciação apropriada entre arquivos
- Reuso correto de assets e manifesto
- Estratégias de CSS e PWA features
- Conclusão: estrutura coerente e bem organizada

### 3. **CLEAN_ARCHITECTURE_WEB.md**
Guia de implementação de Clean Architecture para o projeto TypeScript/PWA.
- Estrutura de pastas recomendada (Domain, Application, Infrastructure, Presentation)
- Padrões Entity, UseCase, Repository, Application Service
- Injeção de dependência (IoC Container)
- Tratamento de erros com Result pattern
- Exemplo completo com BudgetApplicationService

### 4. **ESTRUTURA_DADOS_ESTADO.md** ⭐ NOVO
Análise completa de tipos de dados, entidades de negócio e gerenciamento de estado.

**Seções:**
- **Visão Geral** — localStorage structure (pp-orcs, pp-clientes, pp-config, etc)
- **Entidades de Negócio:**
  - `Orcamento` — dados do orçamento com cliente, endereço, pagador, cômodos
  - `Room` — cômodo com altura, comprimento, items, serviços
  - `Item` — serviço dentro do cômodo com medidas e preço
  - `Cliente` — contato com informações pessoais e endereço
  - `Fornecedor` — prestador de serviço
  - `Evento` — evento de agenda com recorrência
  - `Config` — configurações da empresa (empresa, logo, templates, etc)
- **Estado Global (S)** — variáveis persistidas e de UI
- **Operações de Persistência** — saveOrcs() com fallback
- **Cálculos de Negócio** — fórmulas de área (m²) e total
- **Fluxo de Dados** — novo orçamento → edição → salvamento
- **Tipos Auxiliares** — ValueMode, MessageFormat
- **Validações** — regras de negócio para criação
- **Migração Android** — TypeScript → Kotlin, localStorage → Room Database

### 5. **FLUXO_NAVEGACAO.md** ⭐ NOVO
Análise detalhada de navegação, páginas e arquitetura de rotas.

**Seções:**
- **Mapa de Páginas** — 13 páginas + modais (home, orçamentos, clientes, agenda, etc)
- **Home (Hub)** — lista de orçamentos, FAB, card menu
- **Tabs da Home** — Orçamentos, Clientes, Fornecedores, Agenda, Backup, Config, Flash, Termos
- **Wizard de 4 Steps:**
  - Step 1: Dados do Cliente
  - Step 2: Cômodos e Serviços
  - Step 3: Detalhes do Serviço
  - Step 4: Revisão e Ações
- **Fluxo de Navegação** — novo orçamento, editar, confirmações
- **Sistema de Navegação** — `showPage()`, `go()`, `buildSteps()`, `homeTab()`
- **Hash Routing** — sincronização com history API e popstate
- **Responsividade** — sidebar mobile vs desktop
- **Modais** — draft confirm, delete confirm, client picker, photo choice
- **Fluxos Completos** — novo vs editar vs navegar com isDirty
- **Migração Android** — Navigation Compose, NavController, routes

### 6. **MIGRACAO_ANDROID.md**
Plano detalhado de migração de PWA Web para App Android nativo (Jetpack Compose).

**Seções:**
- **Feature Comparison** — matriz web vs android
- **O Que NÃO Migra** — HTML, CSS, Vue, componentes de UI
- **O Que REUSA** — lógica domain, tipos de domínio, cálculos
- **Estrutura Android:**
  - Gradle com módulos (app, domain, data, presentation, core, design-system)
  - Dependência rules
- **Exemplos Side-by-Side:**
  - CSS Cards → Jetpack Compose Cards
  - Vue Router → Navigation Compose
  - localStorage → Room Database
  - Pinia/Zustand → ViewModel + StateFlow
- **Material Design 3** — color scheme mapping, typography, components
- **Room Database** — entities, DAOs, migrations
- **ViewModel e StateFlow** — reactive state management
- **Dependency Injection** — Koin/Hilt setup
- **Gradle Dependencies** — versões completas
- **Plano de 6 Fases:**
  1. Setup Android Project (2-3 dias)
  2. Core Logic & Domain (5-7 dias)
  3. UI Screens (10-14 dias)
  4. Navigation (3-5 dias)
  5. Features & Polish (7-10 dias)
  6. Testing & Deployment (5-7 dias)
  - **Total estimado:** 35-45 dias para MVP Android

---

## 🎯 Como Usar Esta Documentação

### Para Novo Desenvolvedor:
1. Leia **README.md** — entender o projeto
2. Leia **ESTRUTURA_DADOS_ESTADO.md** — tipos e estado
3. Leia **FLUXO_NAVEGACAO.md** — rotas e UX
4. Explore `src/types.ts` → `src/state.ts` → `app.html`
5. Leia **CLEAN_ARCHITECTURE_WEB.md** — padrões recomendados

### Para Implementar Feature:
1. Defina tipo em `src/types.ts`
2. Adicione estado em `src/state.ts`
3. Implemente lógica em `src/[feature].ts`
4. Adicione navegação em `src/navigation.ts`
5. Crie UI em `app.html`
6. Chame `saveOrcs()` se modificou dados

### Para Migrar para Android:
1. Leia **MIGRACAO_ANDROID.md** completamente
2. Use **ESTRUTURA_DADOS_ESTADO.md** para mapear entidades → Room entities
3. Use **FLUXO_NAVEGACAO.md** para mapear páginas → telas Compose
4. Siga plano 6-fases para execução (35-45 dias)

### Para Refatorar em Clean Architecture:
1. Leia **CLEAN_ARCHITECTURE_WEB.md**
2. Use **ESTRUTURA_DADOS_ESTADO.md** para modelar domain layer
3. Extraia `createBudget()`, `editBudget()` em UseCases
4. Crie repository interfaces em domain
5. Implemente em infrastructure layer

---

## 📊 Estatísticas Consolidadas

| Métrica | Valor |
|---------|-------|
| **Documentos Técnicos** | 6 |
| **Páginas/Telas** | 13 |
| **Entidades de Domínio** | 7 |
| **Modais de UI** | 4 |
| **Steps do Wizard** | 4 |
| **Arquivos TypeScript** | 17 |
| **Linhas de Código TypeScript** | ~3000-4000 |
| **Tamanho CSS** | 380 KB |
| **Tipos/Interfaces** | 30+ |

---

## 🔗 Diagrama de Dependências

```
Index.html (Landing Page)
   ↓
App.html (SPA Principal)
   ↓
main.ts (Inicialização)
   ├── navigation.ts (Roteamento e hash)
   ├── budgets.ts (CRUD de orçamentos)
   ├── clients.ts (CRUD de clientes)
   ├── agenda.ts (Eventos e calendário)
   ├── receipts.ts (Recibos)
   ├── appConfig.ts (Configurações)
   ├── state.ts (Estado global) ←→ types.ts
   ├── utils.ts (Helpers e formatação)
   ├── supabaseClient.ts (Auth Supabase)
   ├── gauth.ts (Google Auth)
   ├── notifications.ts (Toast messages)
   ├── rooms.ts (Lógica de cômodos)
   ├── data.ts (Dados iniciais)
   ├── ui.ts (Funções de UI)
   └── sw.js (Service Worker)

State (localStorage)
   ├── pp-orcs → Orcamento[]
   ├── pp-clientes → Cliente[]
   ├── pp-fornecedores → Fornecedor[]
   ├── pp-eventos → Evento[]
   ├── pp-config → Config
   └── pp-theme → 'light' | 'dark'
```

---

## 🛠️ Stack Atual

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | TypeScript (Vanilla JS) |
| **HTML/CSS** | PWA-ready (Service Worker, manifest, offline) |
| **Storage** | localStorage + sessionStorage (fallback) |
| **Auth** | Supabase + Google OAuth |
| **APIs** | Google Places (endereço), Web Contacts API |
| **Build** | Vite (implicit) |

---

## 📋 Checklist para Novo Dev

- [ ] Ler README.md
- [ ] Ler ANALISE_HTML.md
- [ ] Ler ESTRUTURA_DADOS_ESTADO.md
- [ ] Ler FLUXO_NAVEGACAO.md
- [ ] Ler CLEAN_ARCHITECTURE_WEB.md
- [ ] Explorar src/types.ts
- [ ] Explorar src/state.ts
- [ ] Explorar src/budgets.ts
- [ ] Explorar app.html (estrutura geral)
- [ ] Rodar localmente
- [ ] Testar fluxo completo (novo orçamento → salvar → home)

---

## 🚀 Próximos Passos Recomendados

### Curto Prazo (Semanas 1-2)
1. **Refatoração para Clean Architecture**
   - Criar pasta `src/domain/` com UseCases
   - Criar `src/infrastructure/` com Repository implementations
   - Usar CLEAN_ARCHITECTURE_WEB.md como referência

2. **Testes Unitários**
   - Test domain logic (cálculos, validações)
   - Mock repositories

### Médio Prazo (Meses 1-2)
3. **Features Novas**
   - Sincronização Google Drive
   - PDF export nativo
   - Integração Google Calendar
   - Integração Google Contacts

### Longo Prazo (Trimestre 2)
4. **Migração Android**
   - Seguir MIGRACAO_ANDROID.md
   - 35-45 dias de desenvolvimento
   - Reusar domain logic convertida para Kotlin

---

## 📝 Notas Importantes

1. **Single Source of Truth:** `S` em `state.ts` é o estado global
2. **Persistência:** Sempre chamar `saveOrcs()` após modificar `S.orcs`
3. **isDirty Flag:** Controla se há mudanças não salvas (confirmação ao sair)
4. **localStorage Overflow:** App trata com graceful fallback para sessionStorage
5. **TypeScript:** Compilado em tempo de execução (via Vite)
6. **PWA:** Funciona offline graças a Service Worker e manifest

---

## 👥 Contribuindo

Ao adicionar nova feature:

1. Defina tipos em `src/types.ts`
2. Adicione estado em `src/state.ts` (se necessário)
3. Implemente lógica em novo arquivo `src/[feature].ts`
4. Registre callbacks globais em `main.ts`
5. Adicione UI em `app.html`
6. Atualize `src/navigation.ts` se houver rota nova
7. Atualize documentação nesta pasta

---

## 🔐 Segurança

Headers configurados em `vercel.json` e `_headers`:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`

---

## 📞 Informações de Contato

- **Desenvolvedor Atual:** Wagner Maniatec
- **Email:** wagner.maniatec@gmail.com

---

**Última atualização:** 2026-05-09  
**Versão:** MVP 1.0  
**Status:** Funcional, pronto para refatoração e expansão  
**Próxima Milestone:** Clean Architecture refactoring + Android migration

