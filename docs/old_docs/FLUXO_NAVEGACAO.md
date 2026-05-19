# Fluxo de Navegação — Pintor Plus Web

Análise detalhada da navegação, páginas, rotas e fluxo de usuário.

---

## 🗺️ Mapa de Páginas

A aplicação é uma **SPA (Single Page Application)** com navegação baseada em **hash routing** e **DOM visibility**.

```
#app (container principal)
├── #topnav (barra superior com steps)
├── #pages (container de páginas)
│   ├── #pg-home (Home - lista de orçamentos)
│   ├── #pg-orcamentos (Tab: Orçamentos)
│   ├── #pg-clientes (Tab: Clientes)
│   ├── #pg-fornecedores (Tab: Fornecedores)
│   ├── #pg-agenda (Tab: Agenda/Eventos)
│   ├── #pg-backup (Tab: Backup/Sincronização)
│   ├── #pg-config (Tab: Configurações)
│   ├── #pg-flash (Tab: Flash - Orçamento rápido)
│   ├── #pg-termos (Termos e Políticas)
│   ├── #pg-s1 (Step 1 - Dados do Cliente)
│   ├── #pg-s2 (Step 2 - Cômodos e Serviços)
│   ├── #pg-s3 (Step 3 - Detalhes e Valor)
│   └── #pg-s4 (Step 4 - Revisão e Ações)
└── Modais (overlay, não pages)
    ├── #draft-confirm-modal
    ├── #del-confirm-modal
    ├── #modal-client-picker
    └── #photo-choice-modal
```

---

## 🎯 Estrutura de Navegação

### 1. **Home (Hub de Navegação)**

**ID:** `pg-home`  
**Rota:** `#home` ou quando nenhuma hash está ativa

**Conteúdo:**
- Cabeçalho com nome da empresa
- Lista de orçamentos recentes (cards com .hoc class)
- Para cada orçamento:
  - Nome e status
  - Total em moeda (verde, destaque)
  - 2 botões de ação: WhatsApp, Editar
  - Menu 3-pontos: Clonar, Editar, Deletar, Detalhes
- FAB (Floating Action Button) — "Novo Orçamento"

**Ações principais:**
```typescript
// Em main.ts e navigation.ts
showPage('pg-home')      // Navega para home
homeTab('orcamentos')    // Abre tab específica na home
go(1)                    // Abre step 1 do wizard
goHome()                 // Volta para home (com confirmação se isDirty)
```

---

### 2. **Tabs da Home (Navegação Lateral)**

Sidebar com links para abas:

| Aba | Página | Função |
|-----|--------|--------|
| Orçamentos | `pg-orcamentos` | Lista filtrada de orçamentos |
| Clientes | `pg-clientes` | CRUD de clientes |
| Fornecedores | `pg-fornecedores` | CRUD de fornecedores |
| Agenda | `pg-agenda` | Calendário de eventos |
| Backup | `pg-backup` | Sincronização Google Drive |
| Config | `pg-config` | Configurações empresa + app |
| Flash | `pg-flash` | Orçamento rápido |
| Termos | `pg-termos` | Termos de uso |

**Navegação entre abas:**
```typescript
// onclick em sidebar
homeTab('clientes')    // → showPage('pg-clientes')
homeTab('agenda')      // → showPage('pg-agenda')
homeTab('config')      // → showPage('pg-config')
```

---

### 3. **Wizard de Orçamento (4 Steps)**

Fluxo linear com progresso visual (step pills no topnav).

```
Step 1: Dados do Cliente
         ↓
         [Voltar] [Próximo]
         
Step 2: Cômodos e Serviços
         ↓
         [Voltar] [Próximo]
         
Step 3: Detalhes do Serviço
         ↓
         [Voltar] [Próximo]
         
Step 4: Revisão e Ações
         ↓
         [Voltar] [Salvar]
```

#### **Step 1: pg-s1 — Dados do Cliente**

**Campos:**
- Nome (obrigatório)
- Apelido
- Telefone (com validação)
- Email
- CPF
- CEP (com busca de endereço)
- Logradouro, Número, Complemento
- Bairro, Cidade

**Botões:**
- "Carregar contato" — abre `pickPhoneContactToFill()` (Web Contacts API)
- "Salvar novo contato" — abre `pickPhoneContactToSave()`
- "Abrir cliente" — abre modal de seleção

**Ações de transição:**
```typescript
go(1)          // Navega para Step 1
go(2)          // Navega para Step 2
buildSteps(1)  // Atualiza visual dos pills
```

#### **Step 2: pg-s2 — Cômodos e Serviços**

**Elementos:**
- Listagem de cômodos (cards .rcard com collapse)
- Para cada cômodo:
  - Nome, Altura, Comprimento
  - Botão expandir/colapsar
  - Lista de items dentro
  - Botão "+ Adicionar item"
  - Botão deletar cômodo
- Botão "+ Adicionar cômodo"

**Serviços padrão:**
- Checkboxes de serviços (Lixamento, Pintura, etc)
- Vêm de `S.DEFAULT_SERVICES` (parseados de `config.servicos`)

**Dados armazenados em:**
```typescript
S.rooms      // Array de Room em edição
S.pgto       // Set de formas de pagamento
S.fmt        // Formato: 'completo' | 'area' | 'simples'
```

#### **Step 3: pg-s3 — Detalhes do Serviço**

**Campos:**
- Tipo de serviço (select)
- Data de início (date picker com calendário)
- Preço adicional por m²
- Observações gerais
- Status do orçamento (select com S.statusArr)
- Validade em dias (15, 30, etc)

**Formas de pagamento:**
- Checkboxes múltiplos (PGT, Dinheiro, Cartão, etc)
- Armazenados em `S.pgto` (Set)

**Formatos de apresentação:**
- 3 cards selcionáveis: Completo, Resumido, Simples
- Armazenado em `S.fmt`

**Pagador diferente:**
- Toggle: "Adicionar pagador"
- Se ativado: Campos para pagador

#### **Step 4: pg-s4 — Revisão e Ações**

**Exibição:**
- Resumo do orçamento
- **Total (grande, moeda, verde)** — calculado por `calcTotal()`
- Distribuição por cômodo

**Botões de ação:**
- "Salvar" (principal, azul) — `saveOrc()`
- "Enviar WhatsApp" — `shareWA()`
- "Baixar PDF" — `exportPDF()`
- "Compartilhar" — `share()` (Web Share API)

**Lógica de salvamento:**
```typescript
function saveOrc() {
  const orc = collectOrc();      // Monta objeto de Orcamento
  if (S.editId) {
    const idx = S.orcs.findIndex(o => o.id === S.editId);
    S.orcs[idx] = orc;
  } else {
    S.orcs.push(orc);
  }
  saveOrcs();                    // localStorage
  S.isDirty = false;
  goHome();
}
```

---

## 🔄 Fluxo de Navegação Completo

### Novo Orçamento

```
Home (FAB ou "Novo")
  ↓
newOrc()
  ├─ S.rooms = [{ name: 'Geral', items: [], ... }]
  ├─ S.isDirty = true
  ├─ Limpa formulário
  └─ go(1)
  ↓
Step 1: Preenche dados cliente [Próximo]
  ↓
Step 2: Adiciona cômodos e itens [Próximo]
  ↓
Step 3: Configura valores, pagamento, status [Próximo]
  ↓
Step 4: Revisa e clica [Salvar]
  ├─ saveOrc() → S.orcs.push(orc)
  ├─ saveOrcs() → localStorage
  ├─ S.isDirty = false
  └─ goHome()
  ↓
Home (atualiza lista)
```

### Editar Orçamento

```
Home (clica em um card)
  ↓
editOrc(i)
  ├─ S.editId = orc.id
  ├─ S.rooms = JSON.parse(JSON.stringify(orc.rooms))
  ├─ S.isDirty = true
  ├─ Popula formulário com dados
  └─ go(1)
  ↓
Steps 1-4 (usuário edita)
  ↓
Step 4 [Salvar]
  ├─ collectOrc() monta novo objeto
  ├─ S.orcs[idx] = orc (substitui)
  ├─ saveOrcs() → localStorage
  ├─ S.isDirty = false
  └─ goHome()
  ↓
Home (lista atualizada)
```

### Navegação com isDirty (Confirmação)

```
Usuário em Step 2 ou 3 (S.isDirty = true)
  ↓
Clica em link da sidebar → goHome()
  ↓
if (S.isDirty) {
  openDraftConfirmModal()
  └─ Exibe: "Descartar" ou "Salvar como rascunho"
}
  ↓
[Descartar] → discardAndExit()
  ├─ S.isDirty = false
  └─ Navega normalmente
  
OU
  
[Salvar como Rascunho] → saveAsDraftAndExit()
  ├─ saveDraft()
  ├─ S.isDirty = false
  └─ Navega
```

---

## 🎨 Sistema de Navegação (Componentes)

### showPage(id, skipHistory)

Ativa uma página e atualiza history.

```typescript
function showPage(id: string, skipHistory = false): void {
  // Desativa todas as páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Ativa a página solicitada
  const pg = document.getElementById(id);
  if (pg) pg.classList.add('active');
  
  // Adiciona ao histórico (back button)
  if (!skipHistory) {
    history.pushState({ page: id }, '', '#' + id);
  }
}
```

**Uso:**
```typescript
showPage('pg-home')     // Navega para home e atualiza hash
showPage('pg-s1', true) // Navega mas não muda hash (usado em popstate)
```

### go(n)

Navega para um step específico do wizard.

```typescript
function go(n: number): void {
  if (n < 1 || n > 4) return;
  
  S.curStep = n;
  showPage('pg-s' + n);        // Mostra página
  buildSteps(n);               // Atualiza visual dos pills
  
  if (n === 4) {
    // Atualiza valores de Step 4
    calcTotal();               // Recalcula total
    refreshWAPreview();        // Atualiza preview WhatsApp
    populateStatusSelect();    // Popula select de status
  }
}
```

### buildSteps(n)

Atualiza o visual dos step pills no topnav.

```typescript
function buildSteps(n: number): void {
  for (let i = 1; i <= 4; i++) {
    const pill = document.getElementById(`pill${i}`);
    pill?.classList.toggle('done', i < n);      // Passos anteriores
    pill?.classList.toggle('active', i === n);  // Step atual
  }
}
```

**Visual:**
```
Step 1 [Done] Step 2 [Done] Step 3 [Done] Step 4 [Active]
────────────── ────────────── ────────────── ──────────
   (completo)     (completo)     (completo)   (em curso)
```

### toggleSidebar()

Abre/fecha sidebar em mobile.

```typescript
function toggleSidebar(): void {
  // Ignorar em desktop (>= 1024px)
  if (window.matchMedia('(min-width:1024px)').matches) return;
  
  document.getElementById('sidebar')?.classList.toggle('active');
  document.getElementById('sidebar-overlay')?.classList.toggle('active');
}
```

---

## 🗂️ Estrutura de Modais

Não são páginas `.page`, mas elementos fixos com `display: none/flex`.

| Modal | ID | Função |
|-------|-----|--------|
| Draft Confirm | `draft-confirm-modal` | Confirmação ao sair com isDirty |
| Delete Confirm | `del-confirm-modal` | Confirmação antes de deletar |
| Client Picker | `modal-client-picker` | Seleção de cliente salvo |
| Photo Choice | `photo-choice-modal` | Câmera ou galeria (Web API) |
| Image Viewer | `img-modal` | Visualizar foto em fullscreen |

---

## 🔗 Fluxo de Hash Routing

A aplicação escuta `popstate` para sincronizar com botão back.

```typescript
window.addEventListener('popstate', (e) => {
  const state = e.state as { page?: string } | null;
  if (state?.page) showPage(state.page, true);  // skipHistory = true
});

// Inicial
history.replaceState({ page: 'pg-home' }, '', location.href);
```

**Navegação com hash:**
```
https://app.com/app.html#pg-home        → Home
https://app.com/app.html#pg-clientes    → Clientes
https://app.com/app.html#pg-s1          → Step 1 do Wizard
```

---

## 📱 Responsividade de Navegação

### Desktop (>= 1024px)
- Sidebar visível permanentemente (esquerda)
- Main content ocupa resto da tela
- Step pills visíveis no topnav

### Mobile (< 1024px)
- Sidebar oculta (overlay)
- Botão hamburger abre sidebar (toggleSidebar)
- Step pills acima do conteúdo
- Muito espaço para teclado (detect com visualViewport)

```typescript
// Detecta teclado aberto em mobile
const THRESHOLD = 0.75;
let baseH = window.innerHeight;

function onResize() {
  const curH = window.visualViewport?.height ?? window.innerHeight;
  const ratio = curH / baseH;
  
  if (ratio < THRESHOLD) {
    document.body.classList.add('kb-open');
    // CSS esconde step pills, reduz padding
  } else {
    document.body.classList.remove('kb-open');
  }
}
```

---

## 🎯 Fluxo de Ações (Button Handlers)

### onclick="showPage('pg-home')"
Navega diretamente para uma página.

### onclick="homeTab('clientes')"
Navega para uma aba da home (abre `pg-clientes`).

### onclick="go(2)"
Navega para Step 2 do wizard.

### onclick="goHome()"
Navega para home com confirmação se isDirty.

### onclick="canNavigateAsync(() => { ... })"
Executa callback apenas se não há mudanças não salvas.

```typescript
function canNavigateAsync(callback: () => void): void {
  if (S.isDirty) {
    openDraftConfirmModal(callback);
    return;
  }
  callback();
}

// Uso em onclick
<button onclick="canNavigateAsync(() => homeTab('fornecedores'))">
  Fornecedores
</button>
```

---

## 🔄 Migração para Android — Mapeamento de Navegação

### TypeScript → Kotlin/Compose

| Web | Android |
|-----|---------|
| `showPage()` | `navController.navigate()` |
| Hash routing (#home, #s1) | Navigation routes |
| Sidebar links | Navigation drawer |
| Step pills (CSS) | Step indicators (Compose) |
| Modal overlays | Dialogs/Sheets |
| `isDirty` flag | ViewModel state |
| `history.pushState` | Navigation stack |

### Implementação Navigation Compose:

```kotlin
@Composable
fun MainNavHost() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") { HomeScreen(navController) }
        composable("clientes") { ClientsScreen(navController) }
        
        // Wizard Steps
        composable("budget/step1") { BudgetStep1(navController) }
        composable("budget/step2") { BudgetStep2(navController) }
        composable("budget/step3") { BudgetStep3(navController) }
        composable("budget/step4") { BudgetStep4(navController) }
    }
}

// Navegação
navController.navigate("budget/step2")
navController.popBackStack()
navController.navigate("home") {
    popUpTo("budget/step1") { inclusive = true }
}
```

---

## 📚 Referências Internas

- **navigation.ts** — Funções de navegação
- **main.ts** — Inicialização e listeners
- **app.html** — Estrutura HTML de páginas
- **app.css** — Estilos de transição e visibility

