# Clean Architecture para PWA Web — Pintor Plus

Adaptação dos princípios de Clean Architecture para projeto TypeScript/PWA.

---

## Visão Geral

Clean Architecture enfatiza:
1. **Independência de frameworks** — lógica de negócio isolada
2. **Testabilidade** — camadas desacopladas
3. **Inversão de dependência** — camadas superiores não dependem das inferiores
4. **Separação de responsabilidades** — cada camada tem um propósito único

Para PWA web: **Domain** → **Application** → **Infrastructure** → **UI**

---

## Estrutura Recomendada para Pintor Plus

```
src/
├── domain/                    # Regras de negócio puras
│   ├── entities/              # Modelos de dados imutáveis
│   │   ├── budget.ts
│   │   ├── client.ts
│   │   └── quote.ts
│   ├── usecases/              # Casos de uso (operações)
│   │   ├── createBudget.ts
│   │   ├── listClients.ts
│   │   └── generateReceipt.ts
│   └── repositories/          # Interfaces (contratos)
│       ├── budgetRepository.ts
│       ├── clientRepository.ts
│       └── quoteRepository.ts
│
├── application/               # Lógica de aplicação
│   ├── services/              # Orquestração de UseCases
│   │   └── budgetService.ts
│   └── dto/                   # Data Transfer Objects
│       ├── budgetDTO.ts
│       └── clientDTO.ts
│
├── infrastructure/            # Implementações concretas
│   ├── persistence/           # LocalStorage, IndexedDB
│   │   ├── localStorage.ts
│   │   └── indexedDB.ts
│   ├── repositories/          # Implementações de Repository
│   │   ├── budgetRepository.ts
│   │   └── clientRepository.ts
│   └── external/              # APIs externas, WhatsApp
│       └── whatsappService.ts
│
└── presentation/              # UI e Controllers
    ├── pages/                 # Componentes de página
    ├── components/            # Componentes reutilizáveis
    ├── stores/                # Estado (Pinia/Zustand)
    │   └── budgetStore.ts
    └── utils/                 # Helpers de UI
```

### Regras de Dependência

```
presentation → application, domain
application → domain
infrastructure → domain (implementa interfaces)
domain → nada (independente)
```

**Crítico**: `domain/` nunca importa de `infrastructure/` ou `presentation/`

---

## Camada Domain

### Entities (Modelos Puros)

Sem framework, apenas tipos e dados:

```typescript
// domain/entities/Budget.ts
export interface Budget {
  id: string;
  clientId: string;
  title: string;
  rooms: Room[];
  items: BudgetItem[];
  status: BudgetStatus;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum BudgetStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Room {
  id: string;
  name: string;
  description: string;
  squareMeters: number;
}

export interface BudgetItem {
  id: string;
  roomId: string;
  description: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
}
```

### UseCases

Uma operação = Um UseCase:

```typescript
// domain/usecases/CreateBudgetUseCase.ts
import { Budget } from '../entities/Budget';
import { BudgetRepository } from '../repositories/BudgetRepository';

export class CreateBudgetUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(input: CreateBudgetInput): Promise<Result<Budget>> {
    // Validações de negócio
    if (!input.clientId) {
      return Result.failure('Client ID is required');
    }

    if (input.items.length === 0) {
      return Result.failure('Budget must have at least one item');
    }

    // Calcular total
    const total = this.calculateTotal(input.items);

    // Criar entidade
    const budget: Budget = {
      id: generateId(),
      clientId: input.clientId,
      title: input.title,
      rooms: input.rooms,
      items: input.items,
      status: BudgetStatus.DRAFT,
      totalValue: total,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Persistir (délega ao repository)
    return this.budgetRepository.save(budget);
  }

  private calculateTotal(items: BudgetItem[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}

export interface CreateBudgetInput {
  clientId: string;
  title: string;
  rooms: Room[];
  items: BudgetItem[];
}

// Result type para tratamento de erros
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### Repository Interfaces

Contrato, sem implementação:

```typescript
// domain/repositories/BudgetRepository.ts
import { Budget } from '../entities/Budget';
import { Result } from '../usecases/CreateBudgetUseCase';

export interface BudgetRepository {
  save(budget: Budget): Promise<Result<Budget>>;
  findById(id: string): Promise<Result<Budget | null>>;
  findAll(): Promise<Result<Budget[]>>;
  update(budget: Budget): Promise<Result<Budget>>;
  delete(id: string): Promise<Result<void>>;
  findByClient(clientId: string): Promise<Result<Budget[]>>;
}
```

---

## Camada Application

Orquestração e DTOs:

```typescript
// application/services/BudgetApplicationService.ts
import { CreateBudgetUseCase } from '../../domain/usecases/CreateBudgetUseCase';
import { BudgetRepository } from '../../domain/repositories/BudgetRepository';
import { CreateBudgetDTO } from '../dto/CreateBudgetDTO';
import { BudgetResponseDTO } from '../dto/BudgetResponseDTO';

export class BudgetApplicationService {
  private createBudgetUseCase: CreateBudgetUseCase;

  constructor(budgetRepository: BudgetRepository) {
    this.createBudgetUseCase = new CreateBudgetUseCase(budgetRepository);
  }

  async createBudget(input: CreateBudgetDTO): Promise<BudgetResponseDTO> {
    const result = await this.createBudgetUseCase.execute({
      clientId: input.clientId,
      title: input.title,
      rooms: input.rooms.map(r => ({ id: r.id, name: r.name, description: r.description, squareMeters: r.squareMeters })),
      items: input.items
    });

    if (!result.success) {
      throw new ApplicationError(result.error);
    }

    return this.mapToDTO(result.data);
  }

  private mapToDTO(budget: Budget): BudgetResponseDTO {
    return {
      id: budget.id,
      clientId: budget.clientId,
      title: budget.title,
      status: budget.status,
      totalValue: budget.totalValue,
      createdAt: budget.createdAt.toISOString(),
      itemCount: budget.items.length
    };
  }
}
```

---

## Camada Infrastructure

Implementações concretas:

```typescript
// infrastructure/repositories/BudgetRepositoryImpl.ts
import { Budget } from '../../domain/entities/Budget';
import { BudgetRepository } from '../../domain/repositories/BudgetRepository';
import { Result } from '../../domain/usecases/CreateBudgetUseCase';
import { LocalStorageDataSource } from '../persistence/LocalStorageDataSource';

export class BudgetRepositoryImpl implements BudgetRepository {
  constructor(private dataSource: LocalStorageDataSource) {}

  async save(budget: Budget): Promise<Result<Budget>> {
    try {
      await this.dataSource.saveBudget(budget);
      return { success: true, data: budget };
    } catch (error) {
      return { success: false, error: `Failed to save budget: ${error}` };
    }
  }

  async findById(id: string): Promise<Result<Budget | null>> {
    try {
      const budget = await this.dataSource.getBudgetById(id);
      return { success: true, data: budget };
    } catch (error) {
      return { success: false, error: `Failed to find budget: ${error}` };
    }
  }

  async findAll(): Promise<Result<Budget[]>> {
    try {
      const budgets = await this.dataSource.getAllBudgets();
      return { success: true, data: budgets };
    } catch (error) {
      return { success: false, error: `Failed to list budgets: ${error}` };
    }
  }

  // ... outros métodos
}

// infrastructure/persistence/LocalStorageDataSource.ts
import { Budget } from '../../domain/entities/Budget';

export class LocalStorageDataSource {
  private readonly BUDGET_KEY = 'pintor_plus_budgets';

  async saveBudget(budget: Budget): Promise<void> {
    const budgets = this.getBudgets();
    const index = budgets.findIndex(b => b.id === budget.id);
    
    if (index >= 0) {
      budgets[index] = budget;
    } else {
      budgets.push(budget);
    }

    localStorage.setItem(this.BUDGET_KEY, JSON.stringify(budgets));
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    const budgets = this.getBudgets();
    return budgets.find(b => b.id === id) || null;
  }

  private getBudgets(): Budget[] {
    const data = localStorage.getItem(this.BUDGET_KEY);
    return data ? JSON.parse(data) : [];
  }
}
```

---

## Camada Presentation (UI)

Componentes usando UseCases:

```typescript
// presentation/pages/BudgetPage.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BudgetApplicationService } from '../../application/services/BudgetApplicationService';
import { BudgetRepositoryImpl } from '../../infrastructure/repositories/BudgetRepositoryImpl';
import { LocalStorageDataSource } from '../../infrastructure/persistence/LocalStorageDataSource';

const dataSource = new LocalStorageDataSource();
const repository = new BudgetRepositoryImpl(dataSource);
const budgetService = new BudgetApplicationService(repository);

const budgets = ref<BudgetResponseDTO[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  await loadBudgets();
});

async function loadBudgets() {
  isLoading.value = true;
  try {
    const result = await repository.findAll();
    if (result.success) {
      budgets.value = result.data;
    } else {
      error.value = result.error;
    }
  } finally {
    isLoading.value = false;
  }
}

async function createNewBudget(input: CreateBudgetDTO) {
  try {
    await budgetService.createBudget(input);
    await loadBudgets();
  } catch (err) {
    error.value = (err as Error).message;
  }
}
</script>

<template>
  <div class="budget-page">
    <h1>Meus Orçamentos</h1>
    
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="isLoading" class="spinner">Carregando...</div>
    
    <div class="budget-list">
      <div v-for="budget in budgets" :key="budget.id" class="budget-card">
        <h2>{{ budget.title }}</h2>
        <p>Status: {{ budget.status }}</p>
        <p>Total: R$ {{ budget.totalValue }}</p>
        <p>Itens: {{ budget.itemCount }}</p>
      </div>
    </div>
  </div>
</template>
```

---

## Injeção de Dependência

Para facilitar testes e desacoplamento:

```typescript
// infrastructure/container.ts (IoC Container simples)
import { BudgetRepository } from '../domain/repositories/BudgetRepository';
import { BudgetRepositoryImpl } from './repositories/BudgetRepositoryImpl';
import { LocalStorageDataSource } from './persistence/LocalStorageDataSource';
import { BudgetApplicationService } from '../application/services/BudgetApplicationService';

export class Container {
  static getInstance() {
    const dataSource = new LocalStorageDataSource();
    const budgetRepository: BudgetRepository = new BudgetRepositoryImpl(dataSource);
    const budgetService = new BudgetApplicationService(budgetRepository);

    return {
      budgetService
    };
  }
}

// Na aplicação:
const { budgetService } = Container.getInstance();
```

---

## Tratamento de Erros

Usar Result pattern ou custom types:

```typescript
// domain/types/Result.ts
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Result = {
  ok: <T>(value: T): Result<T> => ({ ok: true, value }),
  fail: <E>(error: E): Result<any, E> => ({ ok: false, error })
};

// Uso:
const result = await repository.findById(id);
if (result.ok) {
  console.log(result.value); // Tipo seguro!
} else {
  console.error(result.error);
}
```

---

## Benefícios para Pintor Plus

✅ **Testabilidade** — UseCases podem ser testados sem UI  
✅ **Manutenibilidade** — Cada camada tem responsabilidade clara  
✅ **Reutilização** — UseCases podem ser usados por múltiplos UIs  
✅ **Escalabilidade** — Adicionar features sem quebrar código existente  
✅ **Independência de framework** — Trocar Vue por React é apenas mudança de UI  

---

## Comparação: Estrutura Atual vs Clean Architecture

### Atual (Possível)
- Toda lógica no main.ts
- localStorage direto nos componentes
- Sem separação clara de responsabilidades

### Com Clean Architecture
- Domain limpa e testável
- Infrastructure abstraída
- Componentes focados apenas em apresentação
- Fácil trocar LocalStorage por IndexedDB

---

## Referências

- **Clean Architecture** — Robert C. Martin
- **Domain-Driven Design** — Eric Evans
- **Ports & Adapters** — Alistair Cockburn
