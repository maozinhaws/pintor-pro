# Estrutura de Dados e Estado — Pintor Plus Web

Análise completa da estrutura de dados, tipos, e gerenciamento de estado da aplicação.

---

## 📊 Visão Geral de Dados

```
localStorage
├── pp-orcs          → Orcamento[]         (Orçamentos criados)
├── pp-clientes      → Cliente[]           (Clientes salvos)
├── pp-fornecedores  → Fornecedor[]        (Fornecedores/Prestadores)
├── pp-eventos       → Evento[]            (Eventos/Agenda)
├── pp-config        → Config              (Configurações da empresa)
├── pp-theme         → 'light' | 'dark'    (Tema do usuário)
├── pp-google-email  → string              (Email Google autenticado)
└── pp-orcs-mirror   → Orcamento[]         (Cópia backup em sessionStorage)
```

---

## 🏛️ Entidades de Negócio (Domain Models)

### 1. **Orcamento** (Budget)

```typescript
interface Orcamento {
  // Identificador e timestamps
  id: string;                        // UUID ou Date.now().toString()
  ts: number;                        // Data criação (timestamp)
  tsEdit: number;                    // Data última edição
  
  // Dados do cliente
  nome: string;                      // Nome completo do cliente
  apelido: string;                   // Apelido ou nome comercial
  tel: string;                       // Telefone (sem formatação)
  email: string;                     // Email
  cpf: string;                       // CPF (opcional)
  
  // Endereço
  cep: string;                       // CEP
  logradouro: string;                // Rua/Avenida
  numero: string;                    // Número
  comp: string;                      // Complemento (apt, sala, etc)
  bairro: string;                    // Bairro
  cidade: string;                    // Cidade
  end: string;                       // Endereço completo concatenado
  
  // Dados do pagador (se diferente do cliente)
  pagador: boolean;                  // Se há pagador diferente
  pagNome: string;                   // Nome do pagador
  pagTel: string;                    // Telefone do pagador
  pagEnd: string;                    // Endereço do pagador
  
  // Estrutura de trabalho
  rooms: Room[];                     // Array de cômodos
  items: never;                      // NUNCA - items estão dentro de rooms
  
  // Configuração do serviço
  tipoServico: string;               // Tipo de serviço (pintura, reforma, etc)
  inicio: string;                    // Data de início do trabalho
  
  // Orçamento financeiro
  preco: number;                     // Preço por m² (adicional)
  pgto: string[];                    // Formas de pagamento (Array)
  
  // Validação e formato
  valid: string;                     // Validade do orçamento (dias)
  status: string;                    // Status (Pendente, Enviado, Aprovado, etc)
  fmt: 'completo' | 'area' | 'simples';  // Formato de apresentação
  
  // Metadados
  date: string;                      // Data formatada pt-BR (DD/MM/YYYY)
  obs: string;                       // Observações gerais
  rascunho?: boolean;                // Flag rascunho
  isFlashDraft?: boolean;            // Flag para orçamento "flash" incompleto
}
```

**Cálculo de total:**
```
Total = Σ(room.preco * room.m2) + Σ(item.price * item.m2)
         + (orc.preco * totalM2)
```

### 2. **Room** (Cômodo)

```typescript
interface Room {
  id: string;                        // UUID ou Date.now().toString()
  name: string;                      // Nome do cômodo (Quarto, Sala, etc)
  alt: number;                       // Altura em metros
  comp: number;                      // Comprimento em metros
  
  items: Item[];                     // Itens de serviço dentro do cômodo
  services: string[];                // Array de serviços padrão
  
  preco: number;                     // Preço do cômodo (opcional)
  precoPerM2: boolean;               // Se preço é por m² ou total
  
  collapsed: boolean;                // UI state: cômodo expandido/colapsado
  
  // Calculado
  m2: number;                        // alt × comp (calculado em tempo real)
}
```

### 3. **Item** (Serviço dentro do Cômodo)

```typescript
interface Item {
  name: string;                      // Nome do serviço (2 demãos, lixa, etc)
  alt: number;                       // Altura (m) - usado se comp não existe
  comp: number;                      // Comprimento (m)
  
  services: string[];                // Tags de serviço associadas
  price: number;                     // Preço unitário
  perMeter: boolean;                 // Se preço é por m² ou unidade
  
  obs: string;                       // Observações do item
  photos: string[];                  // Array de URLs de fotos
}
```

### 4. **Cliente** (Contact)

```typescript
interface Cliente {
  // Dados pessoais
  nome: string;                      // Nome completo
  apelido: string;                   // Apelido ou empresa
  tel: string;                       // Telefone (sem formatação)
  email: string;                     // Email
  cpf: string;                       // CPF (opcional)
  
  // Endereço
  cep: string;
  logradouro: string;
  numero: string;
  comp: string;
  bairro: string;
  cidade: string;
  end: string;                       // Endereço completo
  
  ts?: number;                       // Timestamp de criação
}
```

### 5. **Fornecedor** (Supplier/Service Provider)

```typescript
interface Fornecedor {
  nome: string;                      // Nome do fornecedor
  tel: string;                       // Telefone
  servico: string;                   // Serviço oferecido
  obs: string;                       // Observações
  cat?: string;                      // Categoria (opcional)
  ts?: number;                       // Timestamp
}
```

### 6. **Evento** (Calendar Event)

```typescript
interface Evento {
  id: string;                        // UUID
  nome: string;                      // Nome do evento
  data: string;                      // Data (DD/MM/YYYY)
  hora: string;                      // Hora (HH:MM)
  obs: string;                       // Observações
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';  // Recorrência
  orcId?: string;                    // Referência para orçamento
  alarm?: boolean;                   // Notificação ativa
  ts?: number;                       // Timestamp
}
```

### 7. **Config** (Configurações da Empresa)

```typescript
interface Config {
  // Dados da empresa
  empresa: string;                   // Nome da empresa/profissional
  tel: string;                       // Telefone principal
  doc: string;                       // CPF/CNPJ
  emailEmpresa: string;              // Email para contato
  endEmpresa: string;                // Endereço da empresa
  
  // Configurações de orçamento
  msg: string;                       // Template da mensagem WhatsApp
  servicos: string;                  // CSV de serviços padrão
  pgto: string;                      // CSV de formas de pagamento
  statusList: string;                // CSV de status de orçamento
  
  // Imagem e identidade
  logo: string;                      // URL da logo (base64 ou link)
  assinatura?: string;               // Assinatura em imagem (opcional)
  
  // Acessibilidade
  acessibilidade: boolean;           // Modo acessível ativado
  
  // Flash fields (preenchimento rápido)
  flashNomes: string;                // CSV de nomes padrão de cômodos
  flashServicos: string;             // CSV de serviços padrão
  flashMateriais: string;            // CSV de materiais padrão
  
  // Antigos (compatibilidade)
  nome?: string;
  email?: string;
  cnpj?: string;
  end?: string;
  skipDelConfirm?: boolean;          // Skip delete confirmation
  skipDirtyConfirm?: boolean;        // Skip dirty state confirmation
}
```

---

## 🎯 Estado Global (S - State)

Localização: `src/state.ts`

```typescript
export const S = {
  // ── Dados persistidos (localStorage) ──
  orcs: Orcamento[],                 // Lista de orçamentos
  clientes: Cliente[],               // Lista de clientes salvos
  fornecedores: Fornecedor[],        // Lista de fornecedores
  eventos: Evento[],                 // Lista de eventos
  config: Config,                    // Configurações da empresa
  
  // ── Estado de edição (em memória, não persistido) ──
  rooms: Room[],                     // Cômodos do orçamento sendo editado
  editId: string | null,             // ID do orçamento sendo editado
  
  // ── Estado da UI ──
  curStep: number,                   // Step atual do wizard (1-4)
  isDirty: boolean,                  // Se há mudanças não salvas
  tempItem: any,                     // Armazenamento temporário de item
  
  // ── Configuração de formato ──
  fmt: 'completo' | 'area' | 'simples',  // Formato de apresentação
  pgto: Set<string>,                 // Formas de pagamento selecionadas
  pagador: boolean,                  // Se há pagador diferente
  
  // ── Cache de listas ──
  DEFAULT_SERVICES: string[],        // Serviços padrão (parseados de config)
  statusArr: string[],               // Array de status (parseado de config)
  
  // ── Autenticação ──
  googleEmail: string,               // Email do usuário Google autenticado
}
```

**Inicialização:**
```typescript
function ppRead<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

// Carrega do localStorage com fallback
S.orcs = ppRead<Orcamento[]>('pp-orcs', []);
S.clientes = ppRead<Cliente[]>('pp-clientes', []);
S.fornecedores = ppRead<Fornecedor[]>('pp-fornecedores', []);
S.eventos = ppRead<Evento[]>('pp-eventos', []);
S.config = ppRead<Config>('pp-config', null) || { ...DEFAULT_CONFIG };
```

---

## 💾 Operações de Persistência

### saveOrcs()
Salva `S.orcs` em `localStorage['pp-orcs']` e faz backup em `sessionStorage['pp-orcs-mirror']`.

**Tratamento de overflow:**
- Se localStorage está cheio, tenta `sessionStorage['pp-orcs-emergency']`
- Exibe toast de alerta ao usuário

---

## 📐 Cálculos de Negócio

### Cálculo de Área (m²)

```typescript
function getRoomMeds(room: Room) {
  const alt = ptFloat(room.alt);
  const comp = ptFloat(room.comp);
  const m2 = alt * comp;
  return { m2, alt, comp };
}
```

### Cálculo de Total de Orçamento

```typescript
function calcOrcTotal(orc: Orcamento): number {
  let tot = 0;
  let totalM2 = 0;
  
  orc.rooms.forEach(room => {
    const { m2 } = getRoomMeds(room);
    totalM2 += m2;
    
    // Preço da sala
    if (room.preco) {
      tot += room.precoPerM2 ? (room.preco * m2) : room.preco;
    }
    
    // Itens dentro da sala
    room.items.forEach(item => {
      if (item.price) {
        const itemM2 = ptFloat(item.alt) * ptFloat(item.comp) 
                       || ptFloat(item.alt) 
                       || ptFloat(item.comp);
        tot += item.perMeter ? (item.price * itemM2) : item.price;
      }
    });
  });
  
  // Preço adicional por m² do orçamento inteiro
  if (orc.preco && totalM2) {
    tot += orc.preco * totalM2;
  }
  
  return tot;
}
```

---

## 🔄 Fluxo de Dados: Novo Orçamento

```
1. Usuário clica "Novo Orçamento"
   ↓
2. newOrc() limpa S.rooms e reseta flags
   S.rooms = [{ id: ..., name: 'Geral', items: [], ... }]
   ↓
3. Usuário preenche formulário (não salva em S.orcs)
   S.isDirty = true
   ↓
4. Navegação para Step 2, 3, 4
   go(n) → showPage('pg-s' + n)
   ↓
5. Ao salvar (Step 4):
   collectOrc() → monta objeto Orcamento
   S.orcs.push(orc) ou S.orcs[i] = orc (se editando)
   saveOrcs() → localStorage['pp-orcs'] = JSON.stringify(S.orcs)
   S.isDirty = false
```

---

## 🔐 Tipos Auxiliares

```typescript
type ValueMode = 'total' | 'm2' | null;
type MessageFormat = 'completo' | 'area' | 'simples';
```

---

## 🛠️ Validações de Negócio

### Ao criar orçamento:
- ✓ Cliente nome é obrigatório
- ✓ Pelo menos 1 item ou serviço é obrigatório
- ✓ Telefone do cliente (formatação)
- ✓ CEP (busca automática de endereço via Google Places)

### Formas de pagamento:
- Padrão: "PIX, Dinheiro, Cartão de Crédito, Cartão de Débito, Boleto, Parcelado"
- Customizável em config

### Serviços padrão:
- Padrão: "Lixamento, Pintura, Massa corrida, Selador, Textura, Verniz"
- Customizável em config

---

## 📋 Resumo de Campos por Propósito

| Propósito | Campo | Tipo | Obrigatório |
|-----------|-------|------|-------------|
| Identificação | `id`, `ts`, `tsEdit` | string, number | ✓ |
| Cliente | `nome`, `tel`, `email` | string | ✓ Parcial |
| Endereço | `logradouro`, `numero`, `cidade` | string | ✗ |
| Serviço | `rooms[]`, `tipoServico` | Room[], string | ✓ |
| Finanças | `preco`, `pgto`, `status` | number, string[] | ✓ |
| Controle | `isDirty`, `editId`, `rascunho` | boolean, string | ✗ |

---

## 🔄 Migração para Android — Mapeamento de Dados

### TypeScript → Kotlin

| TypeScript | Kotlin | Banco (Room) |
|-----------|--------|--------------|
| `Orcamento` | `BudgetEntity` | `budgets` table |
| `Room` | `RoomEntity` | `rooms` table |
| `Item` | `ItemEntity` | `items` table |
| `Cliente` | `ClientEntity` | `clients` table |
| `Config` | `ConfigEntity` | `config` table (singleton) |
| `S.orcs[]` | `Flow<List<BudgetEntity>>` | Room DAO |
| localStorage | Room Database | SQLite |

### Implementação Room:

```kotlin
@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey val id: String,
    val clientName: String,
    val clientPhone: String,
    val totalValue: Double,
    val status: String,
    val createdAt: Long,
    val updatedAt: Long,
    // ... outros campos
)

@Dao
interface BudgetDao {
    @Query("SELECT * FROM budgets ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<BudgetEntity>>
    
    @Query("SELECT * FROM budgets WHERE id = :id")
    suspend fun getById(id: String): BudgetEntity?
    
    @Upsert
    suspend fun upsert(budget: BudgetEntity)
}
```

---

## 📚 Referências Internas

- **types.ts** — Definições de tipo
- **state.ts** — Estado global e persistência
- **budgets.ts** — Lógica de orçamentos
- **clients.ts** — Lógica de clientes
- **utils.ts** — Funções utilitárias (formatação, cálculos)

