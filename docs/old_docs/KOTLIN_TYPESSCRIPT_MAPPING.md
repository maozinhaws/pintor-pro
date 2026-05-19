# 🔄 Mapeamento TypeScript → Kotlin — Pintor Plus

Guia completo de conversão de tipos, entidades e lógica de TypeScript para Kotlin.

---

## 📋 Tabela de Conversão de Tipos

### Tipos Primitivos

| TypeScript | Kotlin | Notas |
|-----------|--------|-------|
| `string` | `String` | Imutável |
| `number` | `Int` / `Double` | `Int` para inteiros, `Double` para decimais |
| `boolean` | `Boolean` | Capitalizado |
| `Date` | `LocalDateTime` ou `Long` | Usar `java.time.LocalDateTime` ou timestamp |
| `null` | `null` | Precisa de `?` para nullable |
| `undefined` | `null` | Não existe undefined em Kotlin |
| `any` | `Any` | Evitar sempre que possível |
| `Record<string, any>` | `Map<String, Any>` | Dicionário |
| `Array<T>` | `List<T>` | Imutável por padrão |

### Conversão de Arrays e Coleções

```typescript
// TypeScript
const items: Item[] = [];
const itemsSet = new Set<string>(["a", "b", "c"]);
const itemsMap: Record<string, Item> = {};

// Kotlin
val items: List<Item> = emptyList()
val itemsSet: Set<String> = setOf("a", "b", "c")
val itemsMap: Map<String, Item> = emptyMap()
```

---

## 🏛️ Mapeamento de Entidades (Domain Models)

### 1. **Orcamento (Budget)**

#### TypeScript
```typescript
export interface Orcamento {
  id: string;
  nome: string;
  apelido: string;
  tel: string;
  email: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  comp: string;
  bairro: string;
  cidade: string;
  end: string;
  pagNome: string;
  pagTel: string;
  pagEnd: string;
  pagador: boolean;
  rooms: Room[];
  pgto: string[];
  fmt: 'completo' | 'area' | 'simples';
  preco: number;
  status: string;
  valid: string;
  tipoServico: string;
  inicio: string;
  obs: string;
  date: string;
  ts: number;
  tsEdit: number;
  rascunho?: boolean;
  isFlashDraft?: boolean;
}
```

#### Kotlin Domain (Pura)
```kotlin
package com.pintorplus.domain.entities

data class Budget(
    val id: String,
    val clientName: String,
    val clientNickname: String,
    val clientPhone: String,
    val clientEmail: String,
    val clientCpf: String,
    val clientCep: String,
    val clientStreet: String,
    val clientNumber: String,
    val clientComplement: String,
    val clientNeighborhood: String,
    val clientCity: String,
    val clientFullAddress: String,
    val payerName: String,
    val payerPhone: String,
    val payerAddress: String,
    val hasDifferentPayer: Boolean,
    val rooms: List<Room>,
    val paymentMethods: List<String>,
    val format: BudgetFormat,
    val pricePerSqMeter: Double,
    val status: String,
    val validityDays: String,
    val serviceType: String,
    val startDate: String,
    val observations: String,
    val formattedDate: String,
    val createdAt: Long,
    val updatedAt: Long,
    val isDraft: Boolean = false,
    val isFlashDraft: Boolean = false
)

enum class BudgetFormat {
    COMPLETE,    // completo
    AREA,        // area
    SIMPLE       // simples
}
```

#### Room Entity (Persistência)
```kotlin
package com.pintorplus.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.google.gson.Gson

@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey
    val id: String,
    val clientName: String,
    val clientNickname: String,
    val clientPhone: String,
    val clientEmail: String,
    val clientCpf: String,
    val clientCep: String,
    val clientStreet: String,
    val clientNumber: String,
    val clientComplement: String,
    val clientNeighborhood: String,
    val clientCity: String,
    val clientFullAddress: String,
    val payerName: String,
    val payerPhone: String,
    val payerAddress: String,
    val hasDifferentPayer: Boolean,
    val paymentMethodsJson: String, // JSON serializado
    val format: String,              // "COMPLETE", "AREA", "SIMPLE"
    val pricePerSqMeter: Double,
    val status: String,
    val validityDays: String,
    val serviceType: String,
    val startDate: String,
    val observations: String,
    val formattedDate: String,
    val createdAt: Long,
    val updatedAt: Long,
    val isDraft: Boolean = false,
    val isFlashDraft: Boolean = false
)

// Converter para armazenar List<String> como JSON
class StringListConverter {
    @TypeConverter
    fun fromString(value: String?): List<String> {
        return if (value == null) emptyList() else Gson().fromJson(value, Array<String>::class.java).toList()
    }

    @TypeConverter
    fun toString(list: List<String>): String {
        return Gson().toJson(list)
    }
}
```

#### Mappers (Conversão)
```kotlin
package com.pintorplus.data.mappers

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.BudgetFormat
import com.pintorplus.data.db.entities.BudgetEntity

// Room Entity → Domain
fun BudgetEntity.toDomain(): Budget {
    return Budget(
        id = id,
        clientName = clientName,
        clientNickname = clientNickname,
        clientPhone = clientPhone,
        clientEmail = clientEmail,
        clientCpf = clientCpf,
        clientCep = clientCep,
        clientStreet = clientStreet,
        clientNumber = clientNumber,
        clientComplement = clientComplement,
        clientNeighborhood = clientNeighborhood,
        clientCity = clientCity,
        clientFullAddress = clientFullAddress,
        payerName = payerName,
        payerPhone = payerPhone,
        payerAddress = payerAddress,
        hasDifferentPayer = hasDifferentPayer,
        rooms = emptyList(), // Carregado separadamente via JOIN
        paymentMethods = paymentMethodsJson.split(",").filter { it.isNotBlank() },
        format = BudgetFormat.valueOf(format),
        pricePerSqMeter = pricePerSqMeter,
        status = status,
        validityDays = validityDays,
        serviceType = serviceType,
        startDate = startDate,
        observations = observations,
        formattedDate = formattedDate,
        createdAt = createdAt,
        updatedAt = updatedAt,
        isDraft = isDraft,
        isFlashDraft = isFlashDraft
    )
}

// Domain → Room Entity
fun Budget.toEntity(): BudgetEntity {
    return BudgetEntity(
        id = id,
        clientName = clientName,
        clientNickname = clientNickname,
        clientPhone = clientPhone,
        clientEmail = clientEmail,
        clientCpf = clientCpf,
        clientCep = clientCep,
        clientStreet = clientStreet,
        clientNumber = clientNumber,
        clientComplement = clientComplement,
        clientNeighborhood = clientNeighborhood,
        clientCity = clientCity,
        clientFullAddress = clientFullAddress,
        payerName = payerName,
        payerPhone = payerPhone,
        payerAddress = payerAddress,
        hasDifferentPayer = hasDifferentPayer,
        paymentMethodsJson = paymentMethods.joinToString(","),
        format = format.name,
        pricePerSqMeter = pricePerSqMeter,
        status = status,
        validityDays = validityDays,
        serviceType = serviceType,
        startDate = startDate,
        observations = observations,
        formattedDate = formattedDate,
        createdAt = createdAt,
        updatedAt = updatedAt,
        isDraft = isDraft,
        isFlashDraft = isFlashDraft
    )
}
```

---

### 2. **Room (Cômodo)**

#### TypeScript
```typescript
export interface Room {
  id: string;
  name: string;
  alt: number;
  comp: number;
  items: Item[];
  services: string[];
  collapsed: boolean;
  preco: number;
  precoPerM2: boolean;
}
```

#### Kotlin Domain
```kotlin
package com.pintorplus.domain.entities

data class Room(
    val id: String,
    val name: String,
    val height: Double,      // alt
    val width: Double,        // comp
    val items: List<Item>,
    val services: List<String>,
    val price: Double,
    val pricePerSquareMeter: Boolean,
    val isCollapsed: Boolean = false
) {
    val squareMeters: Double
        get() = height * width
}
```

#### Room Entity
```kotlin
@Entity(
    tableName = "rooms",
    foreignKeys = [
        ForeignKey(
            entity = BudgetEntity::class,
            parentColumns = ["id"],
            childColumns = ["budgetId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class RoomEntity(
    @PrimaryKey
    val id: String,
    val budgetId: String,
    val name: String,
    val height: Double,
    val width: Double,
    val servicesJson: String, // JSON serializado
    val price: Double,
    val pricePerSquareMeter: Boolean,
    val isCollapsed: Boolean = false
)
```

#### Mapper
```kotlin
fun RoomEntity.toDomain(items: List<Item> = emptyList()): Room {
    return Room(
        id = id,
        name = name,
        height = height,
        width = width,
        items = items,
        services = servicesJson.split(",").filter { it.isNotBlank() },
        price = price,
        pricePerSquareMeter = pricePerSquareMeter,
        isCollapsed = isCollapsed
    )
}

fun Room.toEntity(budgetId: String): RoomEntity {
    return RoomEntity(
        id = id,
        budgetId = budgetId,
        name = name,
        height = height,
        width = width,
        servicesJson = services.joinToString(","),
        price = price,
        pricePerSquareMeter = pricePerSquareMeter,
        isCollapsed = isCollapsed
    )
}
```

---

### 3. **Item (Serviço)**

#### TypeScript
```typescript
export interface Item {
  name: string;
  alt: number;
  comp: number;
  services: string[];
  price: number;
  perMeter: boolean;
  obs: string;
  photos: string[];
}
```

#### Kotlin Domain
```kotlin
data class Item(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val height: Double,
    val width: Double,
    val services: List<String>,
    val price: Double,
    val pricePerMeter: Boolean,
    val observations: String,
    val photoUrls: List<String>
) {
    val squareMeters: Double
        get() = height * width
}
```

#### Room Entity
```kotlin
@Entity(
    tableName = "items",
    foreignKeys = [
        ForeignKey(
            entity = RoomEntity::class,
            parentColumns = ["id"],
            childColumns = ["roomId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class ItemEntity(
    @PrimaryKey
    val id: String,
    val roomId: String,
    val name: String,
    val height: Double,
    val width: Double,
    val servicesJson: String,
    val price: Double,
    val pricePerMeter: Boolean,
    val observations: String,
    val photoUrlsJson: String
)
```

---

### 4. **Cliente (Client)**

#### TypeScript
```typescript
export interface Cliente {
  nome: string;
  apelido: string;
  tel: string;
  email: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  comp: string;
  bairro: string;
  cidade: string;
  end: string;
  ts?: number;
}
```

#### Kotlin Domain
```kotlin
data class Client(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val nickname: String,
    val phone: String,
    val email: String,
    val cpf: String,
    val cep: String,
    val street: String,
    val number: String,
    val complement: String,
    val neighborhood: String,
    val city: String,
    val fullAddress: String,
    val createdAt: Long = System.currentTimeMillis()
)
```

#### Room Entity
```kotlin
@Entity(tableName = "clients")
data class ClientEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val nickname: String,
    val phone: String,
    val email: String,
    val cpf: String,
    val cep: String,
    val street: String,
    val number: String,
    val complement: String,
    val neighborhood: String,
    val city: String,
    val fullAddress: String,
    val createdAt: Long
)
```

---

### 5. **Config (Configuração)**

#### TypeScript
```typescript
export interface Config {
  empresa: string;
  tel: string;
  doc: string;
  emailEmpresa: string;
  endEmpresa: string;
  msg: string;
  servicos: string;
  pgto: string;
  statusList: string;
  logo: string;
  assinatura?: string;
  acessibilidade: boolean;
  flashNomes: string;
  flashServicos: string;
  flashMateriais: string;
}
```

#### Kotlin Domain
```kotlin
data class AppConfig(
    val id: String = "config_singleton",
    val companyName: String,
    val companyPhone: String,
    val companyDocument: String,
    val companyEmail: String,
    val companyAddress: String,
    val whatsappMessageTemplate: String,
    val defaultServices: List<String>,
    val paymentMethods: List<String>,
    val budgetStatuses: List<String>,
    val logoUrl: String,
    val signatureUrl: String?,
    val accessibilityEnabled: Boolean,
    val quickRoomNames: List<String>,
    val quickServices: List<String>,
    val quickMaterials: List<String>
)
```

#### Room Entity
```kotlin
@Entity(tableName = "config")
data class ConfigEntity(
    @PrimaryKey
    val id: String = "config_singleton",
    val companyName: String,
    val companyPhone: String,
    val companyDocument: String,
    val companyEmail: String,
    val companyAddress: String,
    val whatsappMessageTemplate: String,
    val defaultServicesJson: String,
    val paymentMethodsJson: String,
    val budgetStatusesJson: String,
    val logoUrl: String,
    val signatureUrl: String? = null,
    val accessibilityEnabled: Boolean,
    val quickRoomNamesJson: String,
    val quickServicesJson: String,
    val quickMaterialsJson: String
)
```

---

## 🔧 Conversão de Funções

### Cálculo de Total (TypeScript → Kotlin)

#### TypeScript
```typescript
function calcOrcTotal(orc: any): number {
  let tot = 0;
  let totalM2 = 0;
  
  (orc.rooms || []).forEach((r: any) => {
    const meds = getRoomMeds(r);
    totalM2 += meds.m2;
    
    if (r.preco) {
      tot += r.precoPerM2 ? (r.preco * meds.m2) : r.preco;
    }
    
    (r.items || []).forEach((it: any) => {
      if (it.price) {
        tot += it.perMeter
          ? (it.price * ((ptFloat(it.alt) * ptFloat(it.comp)) || ptFloat(it.alt) || ptFloat(it.comp)))
          : it.price;
      }
    });
  });
  
  if (orc.preco && totalM2) {
    tot += orc.preco * totalM2;
  }
  
  return tot;
}
```

#### Kotlin UseCase
```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.repositories.BudgetRepository

class CalculateBudgetTotalUseCase(
    private val budgetRepository: BudgetRepository
) {
    suspend operator fun invoke(budget: Budget): Double {
        var total = 0.0
        var totalSquareMeters = 0.0
        
        budget.rooms.forEach { room ->
            totalSquareMeters += room.squareMeters
            
            // Preço da sala
            if (room.price > 0) {
                total += if (room.pricePerSquareMeter) {
                    room.price * room.squareMeters
                } else {
                    room.price
                }
            }
            
            // Items dentro da sala
            room.items.forEach { item ->
                if (item.price > 0) {
                    val itemSquareMeters = item.squareMeters
                        .takeIf { it > 0 }
                        ?: item.height.takeIf { it > 0 }
                        ?: item.width
                    
                    total += if (item.pricePerMeter) {
                        item.price * itemSquareMeters
                    } else {
                        item.price
                    }
                }
            }
        }
        
        // Preço adicional por m²
        if (budget.pricePerSqMeter > 0 && totalSquareMeters > 0) {
            total += budget.pricePerSqMeter * totalSquareMeters
        }
        
        return total
    }
}
```

---

## 📦 Estrutura de Pacotes Kotlin

```
com.pintorplus.android/
├── domain/
│   ├── entities/
│   │   ├── Budget.kt
│   │   ├── Room.kt
│   │   ├── Item.kt
│   │   ├── Client.kt
│   │   ├── Config.kt
│   │   ├── Event.kt
│   │   └── Supplier.kt
│   ├── repositories/
│   │   ├── BudgetRepository.kt
│   │   ├── ClientRepository.kt
│   │   ├── ConfigRepository.kt
│   │   └── ...
│   └── usecases/
│       ├── CreateBudgetUseCase.kt
│       ├── GetBudgetsUseCase.kt
│       ├── EditBudgetUseCase.kt
│       ├── DeleteBudgetUseCase.kt
│       ├── CalculateBudgetTotalUseCase.kt
│       └── ...
│
├── data/
│   ├── db/
│   │   ├── AppDatabase.kt
│   │   ├── entities/
│   │   │   ├── BudgetEntity.kt
│   │   │   ├── RoomEntity.kt
│   │   │   └── ...
│   │   ├── dao/
│   │   │   ├── BudgetDao.kt
│   │   │   ├── RoomDao.kt
│   │   │   └── ...
│   │   └── converters/
│   │       ├── StringListConverter.kt
│   │       └── ...
│   ├── mappers/
│   │   ├── BudgetMappers.kt
│   │   ├── RoomMappers.kt
│   │   └── ...
│   └── repositories/
│       ├── BudgetRepositoryImpl.kt
│       ├── ClientRepositoryImpl.kt
│       └── ...
│
├── presentation/
│   ├── screens/
│   │   ├── home/
│   │   │   ├── HomeScreen.kt
│   │   │   └── HomeViewModel.kt
│   │   ├── budget/
│   │   │   ├── BudgetListScreen.kt
│   │   │   ├── BudgetWizardScreen.kt
│   │   │   ├── BudgetDetailsScreen.kt
│   │   │   └── BudgetWizardViewModel.kt
│   │   └── ...
│   └── navigation/
│       └── NavGraph.kt
│
├── core/
│   ├── di/
│   │   └── AppModule.kt
│   └── utils/
│       ├── Extensions.kt
│       └── Constants.kt
│
└── MainActivity.kt
```

---

## ✅ Checklist de Conversão

Para cada entidade, verificar:

- [ ] Interface TypeScript → Data class Kotlin
- [ ] Room Entity criada com @Entity
- [ ] DAO criado com queries CRUD
- [ ] Mappers criados (toDomain, toEntity)
- [ ] Repository interface definida
- [ ] Repository implementation criada
- [ ] UseCase(s) criados para operações
- [ ] Testes unitários adicionados

---

## 🔗 Padrões Kotlin Importantes

### Nullability
```kotlin
// TypeScript optional → Kotlin nullable
val name: String?   // pode ser null
val email: String   // nunca null (obrigatório)

// Safe call operator
val length = name?.length ?: 0

// Non-null assertion (evitar!)
val length = name!!.length
```

### Data Classes
```kotlin
data class Budget(
    val id: String,
    val name: String,
    val value: Double = 0.0  // default values
) {
    // Computed property
    val formattedValue: String
        get() = "R$ ${"%.2f".format(value)}"
}
```

### Extension Functions
```kotlin
// TypeScript helper → Kotlin extension
fun String.sanitizePhone(): String {
    return this.replace(Regex("[^0-9]"), "")
}

// Usage
val phone = "(11) 98765-4321".sanitizePhone() // "11987654321"
```

---

## 🎯 Resumo de Conversão

| Conceito | TypeScript | Kotlin |
|----------|-----------|--------|
| **Interface** | `interface` | `data class` |
| **Implementação** | `class` | `class : Interface` |
| **Readonly** | `readonly prop` | `val prop` |
| **Nullable** | `prop?: Type` | `prop: Type?` |
| **Default** | `prop = value` | `prop: Type = value` |
| **Array** | `Type[]` | `List<Type>` |
| **Object** | `{key: value}` | `mapOf()` ou `data class` |
| **Function** | `(a: T): R => {}` | `(a: T): R {}` |
| **Async** | `async/await` | `suspend` + `coroutines` |

---

**Próximo:** Implementar entities em Kotlin seguindo estes padrões.

