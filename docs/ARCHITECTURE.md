# Architecture & Design Patterns

Detailed architecture, data models, design patterns, and navigation flows.

---

## 🏛️ Architectural Approach

**Current:** Monolithic SPA with inline JavaScript + orphaned TypeScript  
**Recommended:** Clean Architecture (Domain → Application → Infrastructure → Presentation)

### Clean Architecture Principles

1. **Independence of frameworks** — business logic isolated
2. **Testability** — decoupled layers
3. **Dependency inversion** — high-level modules don't depend on low-level
4. **Separation of concerns** — each layer has one responsibility

### Dependency Rules

```
presentation → application, domain
application → domain
infrastructure → domain (implements interfaces)
domain → nothing (independent)
```

**Critical:** Domain never imports from infrastructure or presentation.

---

## 📊 Data Model — 7 Core Entities

### 1. Orcamento (Budget Invoice)

```typescript
interface Orcamento {
  // Identifiers & timestamps
  id: string;               // UUID or Date.now().toString()
  ts: number;               // Creation timestamp
  tsEdit: number;           // Last edit timestamp
  
  // Client data
  nome: string;             // Client full name
  apelido: string;          // Nickname or business name
  tel: string;              // Phone (no formatting)
  email: string;            // Email address
  cpf: string;              // CPF (optional)
  
  // Address
  cep: string;              // ZIP code
  logradouro: string;       // Street name
  numero: string;           // Street number
  comp: string;             // Complement (apt, room, etc)
  bairro: string;           // Neighborhood
  cidade: string;           // City
  end: string;              // Full concatenated address
  
  // Payer (if different from client)
  pagador: boolean;         // Has different payer?
  pagNome: string;          // Payer name
  pagTel: string;           // Payer phone
  pagEnd: string;           // Payer address
  
  // Work structure
  rooms: Room[];            // Array of rooms/spaces
  
  // Service config
  tipoServico: string;      // Service type (painting, renovation, etc)
  inicio: string;           // Work start date
  
  // Pricing
  preco: number;            // Additional price per m²
  pgto: string[];           // Payment methods (array)
  
  // Metadata
  valid: string;            // Quote validity (days)
  status: string;           // Status (Pending, Sent, Approved, etc)
  fmt: 'completo' | 'area' | 'simples';  // Presentation format
  date: string;             // Formatted date (DD/MM/YYYY)
  obs: string;              // General observations
  rascunho?: boolean;       // Draft flag
  isFlashDraft?: boolean;   // Quick budget incomplete flag
}
```

**Total Calculation:**
```
Total = Σ(room.price × room.m²) + Σ(item.price × item.m²) + (orc.price × totalM²)
```

### 2. Room (Cômodo / Space)

```typescript
interface Room {
  id: string;               // UUID
  name: string;             // Room name (Bedroom, Kitchen, etc)
  alt: number;              // Height in meters
  comp: number;             // Length in meters
  
  items: Item[];            // Service items in this room
  services: string[];       // Standard services array
  
  preco: number;            // Room price (optional)
  precoPerM2: boolean;      // Is price per m² or total?
  
  calculoBase?: string;     // Base calculation method
}
```

### 3. Item (Service Line Item)

```typescript
interface Item {
  id: string;               // UUID
  desc: string;             // Description (labor, materials)
  qtd: number;              // Quantity
  unit: string;             // Unit (m², linear m, hours, etc)
  price: number;            // Unit price
  obs?: string;             // Observations
}
```

### 4. Cliente (Client / Person)

```typescript
interface Cliente {
  id: string;               // UUID
  nome: string;             // Full name
  apelido: string;          // Nickname
  tel: string;              // Primary phone
  tel2?: string;            // Secondary phone
  email: string;            // Email
  cpf?: string;             // CPF (optional)
  
  // Address
  cep: string;
  logradouro: string;
  numero: string;
  comp: string;
  bairro: string;
  cidade: string;
  
  // Metadata
  ts: number;               // Creation timestamp
  tsEdit: number;           // Last edit
  obs?: string;             // Notes
}
```

### 5. Fornecedor (Supplier / Vendor)

```typescript
interface Fornecedor {
  id: string;               // UUID
  nome: string;             // Business name
  tel: string;              // Contact phone
  email?: string;           // Email
  endereco?: string;        // Address
  servicos: string[];       // Services provided
  ts: number;               // Creation timestamp
  obs?: string;             // Notes
}
```

### 6. Evento (Event / Appointment)

```typescript
interface Evento {
  id: string;               // UUID
  titulo: string;           // Event title
  data: string;             // Date (YYYY-MM-DD)
  hora?: string;            // Time (HH:mm)
  duracao?: number;         // Duration in minutes
  local?: string;           // Location
  descricao?: string;       // Description
  orcamento_id?: string;    // Reference to budget (if related)
  cliente_id?: string;      // Reference to client
  ts: number;               // Creation timestamp
}
```

### 7. Config (Application Settings)

```typescript
interface Config {
  // Company info
  empresa_nome: string;     // Company name
  empresa_logo?: string;    // Logo (base64 or URL)
  empresa_assinatura?: string;  // Signature image
  empresa_email?: string;   // Company email
  empresa_tel?: string;     // Company phone
  
  // App preferences
  tema: 'light' | 'dark';   // Theme preference
  idioma: string;           // Language (pt-BR, en)
  
  // Metadata
  ts: number;               // Creation timestamp
  tsEdit: number;           // Last edit
}
```

---

## 💾 State Management & Persistence

### localStorage Keys

```typescript
// Main data
localStorage['pp-orcs']           → Orcamento[]
localStorage['pp-clientes']       → Cliente[]
localStorage['pp-fornecedores']   → Fornecedor[]
localStorage['pp-eventos']        → Evento[]
localStorage['pp-config']         → Config

// User preferences
localStorage['pp-theme']          → 'light' | 'dark'
localStorage['pp-google-email']   → string (authenticated user)

// Fallback
localStorage['pp-orcs-mirror']    → Orcamento[] (backup in sessionStorage if quota exceeded)
```

### State Object (in `src/state.ts`)

```typescript
const S = {
  orcs: [],              // Current budgets
  clientes: [],          // Current clients
  fornecedores: [],      // Current suppliers
  eventos: [],           // Current events
  config: {},            // App config
  isDirty: false,        // Unsaved changes?
  currentPage: 'home',   // Current page hash
  currentOrc: null,      // Currently editing budget
  
  // Derived state
  get totalOrcValue() { /* sum all budgets */ },
  get monthlyRevenue() { /* sum this month */ },
};
```

### Persistence Pattern

```typescript
// Every mutation must call saveOrcs()
function createBudget(data) {
  const newBudget = { ...data, id: generateId(), ts: Date.now() };
  S.orcs.push(newBudget);
  S.isDirty = true;
  saveOrcs();  // ← Critical: persist immediately
}

function saveOrcs() {
  try {
    localStorage.setItem('pp-orcs', JSON.stringify(S.orcs));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Fallback to sessionStorage
      sessionStorage.setItem('pp-orcs-mirror', JSON.stringify(S.orcs));
    }
  }
}
```

---

## 🗺️ Navigation Model

### Page Hierarchy

```
Home (Hub)
  ├── Orcamentos (Tab)
  ├── Clientes (Tab)
  ├── Fornecedores (Tab)
  ├── Agenda (Tab)
  ├── Backup (Tab)
  ├── Config (Tab)
  ├── Flash (Tab)
  ├── Termos (Tab)
  └── 4-Step Wizard
      ├── Step 1: Client Data
      ├── Step 2: Rooms & Services
      ├── Step 3: Details & Pricing
      └── Step 4: Review & Actions
```

### Hash-based Routing

```typescript
// Hash → Page mapping
#home          → Home page (list budgets)
#orcamentos    → Tab: Budgets
#clientes      → Tab: Clients
#fornecedores  → Tab: Suppliers
#agenda        → Tab: Calendar
#backup        → Tab: Sync
#config        → Tab: Settings
#flash         → Tab: Quick budget
#termos        → Policies page

#step-1        → Wizard step 1
#step-2        → Wizard step 2
#step-3        → Wizard step 3
#step-4        → Wizard step 4
```

### Modals (Overlay)

```
draft-confirm-modal    → Confirm unsaved changes
del-confirm-modal      → Confirm deletion
modal-client-picker    → Client selection
photo-choice-modal     → Photo capture or upload
```

### Navigation Functions

```typescript
// Core navigation
showPage(pageId)       // Show specific page
homeTab(tabName)       // Show home tab
go(stepNumber)         // Go to wizard step
goHome()               // Return home (with isDirty check)

// Hash change detection
window.addEventListener('hashchange', handleNavigation)
```

---

## 🔄 Recommended Architecture Layers

### Proposed Structure

```
src/
├── domain/                    # Pure business logic
│   ├── entities/
│   │   ├── budget.ts
│   │   ├── client.ts
│   │   ├── supplier.ts
│   │   ├── event.ts
│   │   └── config.ts
│   ├── usecases/
│   │   ├── createBudget.ts
│   │   ├── editBudget.ts
│   │   ├── deleteBudget.ts
│   │   ├── listClients.ts
│   │   ├── generateReceipt.ts
│   │   └── calculateTotal.ts
│   └── repositories/          # Interface contracts
│       ├── IBudgetRepository.ts
│       ├── IClientRepository.ts
│       └── IEventRepository.ts
│
├── application/               # App orchestration
│   ├── services/
│   │   ├── BudgetService.ts   # UseCase orchestration
│   │   ├── ClientService.ts
│   │   └── ExportService.ts
│   └── dto/                   # Data transfer objects
│       ├── BudgetDTO.ts
│       └── ClientDTO.ts
│
├── infrastructure/            # Concrete implementations
│   ├── persistence/
│   │   ├── LocalStorageAdapter.ts
│   │   ├── IndexedDBAdapter.ts
│   │   └── BudgetRepository.ts (implements IBudgetRepository)
│   ├── external/
│   │   ├── WhatsAppService.ts
│   │   ├── GooglePlacesAPI.ts
│   │   └── GoogleContactsAPI.ts
│   └── storage/
│       └── BrowserStorage.ts
│
├── presentation/              # UI layer
│   ├── pages/
│   │   ├── HomePage.ts
│   │   ├── BudgetWizardPage.ts
│   │   └── ClientsPage.ts
│   ├── components/
│   │   ├── BudgetCard.ts
│   │   ├── RoomForm.ts
│   │   └── ItemList.ts
│   ├── store/                 # State management
│   │   └── AppStore.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── helpers.ts
│
├── shared/                    # Shared utilities
│   ├── constants.ts
│   ├── types.ts
│   └── logger.ts
│
└── main.ts                    # Bootstrap
```

---

## 🎯 Design Patterns in Use

### 1. Repository Pattern
Abstracts data access. `BudgetRepository` implements `IBudgetRepository`.

```typescript
// domain/repositories/IBudgetRepository.ts
interface IBudgetRepository {
  save(budget: Orcamento): Promise<void>;
  getById(id: string): Promise<Orcamento>;
  getAll(): Promise<Orcamento[]>;
  delete(id: string): Promise<void>;
}

// infrastructure/persistence/BudgetRepository.ts
class BudgetRepository implements IBudgetRepository {
  async save(budget: Orcamento) {
    const all = await this.getAll();
    const idx = all.findIndex(o => o.id === budget.id);
    if (idx >= 0) all[idx] = budget;
    else all.push(budget);
    localStorage.setItem('pp-orcs', JSON.stringify(all));
  }
  // ...
}
```

### 2. Use Case Pattern
Each operation is a dedicated class with `execute()` method.

```typescript
// domain/usecases/CreateBudget.ts
class CreateBudgetUseCase {
  constructor(private budgetRepository: IBudgetRepository) {}
  
  execute(input: CreateBudgetInput): Result<Orcamento> {
    try {
      const budget = new Orcamento(input);
      budget.validate();
      this.budgetRepository.save(budget);
      return Result.ok(budget);
    } catch (error) {
      return Result.fail(error.message);
    }
  }
}
```

### 3. Service Locator / Dependency Injection
Central place to wire dependencies.

```typescript
// infrastructure/ServiceLocator.ts
class ServiceLocator {
  static getInstance() {
    return {
      budgetRepository: new BudgetRepository(),
      createBudgetUseCase: new CreateBudgetUseCase(
        new BudgetRepository()
      ),
      clientService: new ClientService(
        new ClientRepository()
      ),
    };
  }
}
```

### 4. Result Pattern
Functional error handling without exceptions.

```typescript
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

class Result {
  static ok<T>(value: T): Result<T> {
    return { ok: true, value };
  }
  
  static fail<T>(error: string): Result<T> {
    return { ok: false, error };
  }
}

// Usage
const result = createBudgetUseCase.execute(data);
if (result.ok) {
  console.log('Budget created:', result.value);
} else {
  console.error('Error:', result.error);
}
```

---

## 🔗 Cross-Cutting Concerns

### Logging
```typescript
// shared/logger.ts
class Logger {
  static info(msg: string, data?: any) { console.log(msg, data); }
  static warn(msg: string, data?: any) { console.warn(msg, data); }
  static error(msg: string, error?: Error) { console.error(msg, error); }
}
```

### Error Handling
```typescript
// shared/errors.ts
class ValidationError extends Error {}
class NotFoundError extends Error {}
class StorageQuotaExceededError extends Error {}
```

### Formatting & Utilities
```typescript
// presentation/utils/formatters.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR');
}

export function formatPhone(tel: string): string {
  // (XX) XXXXX-XXXX
  return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}
```

---

## 🚀 Next Steps: React Native

When migrating to React Native + Expo:

1. **Domain layer stays unchanged** — all business logic reusable in Kotlin/Expo
2. **Infrastructure changes** — Room Database replaces localStorage
3. **Presentation changes** — React Native replaces HTML/CSS
4. **Navigation changes** — React Navigation replaces hash routing

See `IMPLEMENTATION.md` for React Native roadmap.

---

**Last updated:** 2026-05-13  
**See also:** `OVERVIEW.md`, `IMPLEMENTATION.md`
