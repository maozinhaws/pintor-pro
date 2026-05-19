# 🏗️ Fase 2: Domain Layer + Database — Implementação Completa

**Duração:** 5-7 dias  
**Opções 3-7:** Entities, DAOs, Repositories, UseCases

---

## 📦 Opção 3: Domain Entities (Puras)

Arquivo: `domain/src/main/kotlin/com/pintorplus/domain/entities/`

### Budget.kt

```kotlin
package com.pintorplus.domain.entities

import java.time.LocalDateTime

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

// Result type para tratamento de erros
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
    object Loading : Result<Nothing>()
}
```

### Room.kt

```kotlin
package com.pintorplus.domain.entities

data class Room(
    val id: String,
    val name: String,
    val height: Double,
    val width: Double,
    val items: List<Item>,
    val services: List<String>,
    val price: Double,
    val pricePerSquareMeter: Boolean,
    val isCollapsed: Boolean = false
) {
    val squareMeters: Double
        get() = if (height > 0 && width > 0) height * width else 0.0
}
```

### Item.kt

```kotlin
package com.pintorplus.domain.entities

import java.util.UUID

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
        get() {
            val calculated = height * width
            return if (calculated > 0) calculated else (height.takeIf { it > 0 } ?: width)
        }
}
```

### Client.kt

```kotlin
package com.pintorplus.domain.entities

import java.util.UUID

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

### AppConfig.kt

```kotlin
package com.pintorplus.domain.entities

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
    val signatureUrl: String? = null,
    val accessibilityEnabled: Boolean,
    val quickRoomNames: List<String>,
    val quickServices: List<String>,
    val quickMaterials: List<String>
)

object AppConfigDefaults {
    const val DEFAULT_MESSAGE = "Olá {cliente}!\nSegue o resumo do seu orçamento:\n\n{detalhes}\n*Valor Total: {total}*\n\nQualquer dúvida estou à disposição."
    val DEFAULT_SERVICES = listOf("Lixamento", "Pintura", "Massa corrida", "Selador", "Textura", "Verniz")
    val DEFAULT_PAYMENT_METHODS = listOf("PIX", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Parcelado")
    val DEFAULT_STATUSES = listOf("Pendente", "Enviado", "Aprovado", "Concluído", "Recusado")
    val DEFAULT_ROOM_NAMES = listOf("Quarto", "Sala", "Cozinha", "Banheiro", "Varanda", "Fachada", "Muro", "Teto", "Porta", "Janela", "Corredor", "Escada", "Garagem", "Área de Serviço", "Escritório", "Quintal")
    val DEFAULT_QUICK_SERVICES = listOf("Lixar", "Massa corrida", "Selador/Primer", "2 demãos", "3 demãos", "Textura", "Grafiato", "Corrigir trinca", "Remover ferragem", "Pintura externa", "Pintura interna", "Fundo preparador", "Rejunte")
    val DEFAULT_MATERIALS = listOf("Tinta látex", "Tinta acrílica", "Tinta esmalte", "Lixa", "Massa corrida", "Primer/Selador", "Fita crepe", "Rolo de lã", "Rolo textura", "Pincel", "Espátula", "Solvente")
}
```

### Supplier.kt

```kotlin
package com.pintorplus.domain.entities

import java.util.UUID

data class Supplier(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val phone: String,
    val service: String,
    val observations: String,
    val category: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
```

### Event.kt

```kotlin
package com.pintorplus.domain.entities

import java.util.UUID

data class Event(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val date: String,
    val time: String,
    val observations: String,
    val recurrence: EventRecurrence,
    val budgetId: String? = null,
    val hasAlarm: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

enum class EventRecurrence {
    NONE,
    DAILY,
    WEEKLY,
    MONTHLY
}
```

---

## 🗄️ Opção 4: Room Entities + TypeConverters

Arquivo: `data/src/main/kotlin/com/pintorplus/data/db/`

### Entities (db/entities/)

#### BudgetEntity.kt

```kotlin
package com.pintorplus.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

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
    val paymentMethodsJson: String,
    val format: String,
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
```

#### RoomEntity.kt

```kotlin
package com.pintorplus.data.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "rooms",
    foreignKeys = [
        ForeignKey(
            entity = BudgetEntity::class,
            parentColumns = ["id"],
            childColumns = ["budgetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("budgetId")]
)
data class RoomEntity(
    @PrimaryKey
    val id: String,
    val budgetId: String,
    val name: String,
    val height: Double,
    val width: Double,
    val servicesJson: String,
    val price: Double,
    val pricePerSquareMeter: Boolean,
    val isCollapsed: Boolean = false
)
```

#### ItemEntity.kt

```kotlin
package com.pintorplus.data.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "items",
    foreignKeys = [
        ForeignKey(
            entity = RoomEntity::class,
            parentColumns = ["id"],
            childColumns = ["roomId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("roomId")]
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

#### ClientEntity.kt

```kotlin
package com.pintorplus.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

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

#### ConfigEntity.kt

```kotlin
package com.pintorplus.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

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

### TypeConverters (db/converters/)

```kotlin
package com.pintorplus.data.db.converters

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class ListStringConverter {
    private val gson = Gson()

    @TypeConverter
    fun fromString(value: String?): List<String> {
        return if (value == null) emptyList() 
        else gson.fromJson(value, object : TypeToken<List<String>>() {}.type)
    }

    @TypeConverter
    fun toString(list: List<String>): String {
        return gson.toJson(list)
    }
}
```

---

## 🔍 Opção 4: DAOs com Queries

Arquivo: `data/src/main/kotlin/com/pintorplus/data/db/dao/`

### BudgetDao.kt

```kotlin
package com.pintorplus.data.db.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.pintorplus.data.db.entities.BudgetEntity
import com.pintorplus.data.db.entities.RoomEntity
import com.pintorplus.data.db.entities.ItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BudgetDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBudget(budget: BudgetEntity)

    @Update
    suspend fun updateBudget(budget: BudgetEntity)

    @Delete
    suspend fun deleteBudget(budget: BudgetEntity)

    @Query("SELECT * FROM budgets WHERE id = :id")
    suspend fun getBudgetById(id: String): BudgetEntity?

    @Query("SELECT * FROM budgets ORDER BY createdAt DESC")
    fun observeAllBudgets(): Flow<List<BudgetEntity>>

    @Query("SELECT * FROM budgets WHERE isDraft = 1 ORDER BY updatedAt DESC")
    fun observeDraftBudgets(): Flow<List<BudgetEntity>>

    @Query("SELECT * FROM budgets WHERE status = :status ORDER BY createdAt DESC")
    fun observeBudgetsByStatus(status: String): Flow<List<BudgetEntity>>

    @Query("SELECT * FROM budgets WHERE clientName LIKE '%' || :query || '%' OR clientPhone LIKE '%' || :query || '%'")
    fun searchBudgets(query: String): Flow<List<BudgetEntity>>

    @Query("DELETE FROM budgets WHERE id = :id")
    suspend fun deleteBudgetById(id: String)

    @Query("SELECT COUNT(*) FROM budgets")
    fun observeBudgetCount(): Flow<Int>

    @Query("SELECT SUM(CAST(SUBSTR(format, 1, 10) as REAL)) FROM budgets WHERE createdAt >= :startTime")
    suspend fun getTotalBudgetsCount(startTime: Long): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRooms(rooms: List<RoomEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItems(items: List<ItemEntity>)
}
```

### RoomDao.kt

```kotlin
package com.pintorplus.data.db.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pintorplus.data.db.entities.RoomEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RoomDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoom(room: RoomEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRooms(rooms: List<RoomEntity>)

    @Update
    suspend fun updateRoom(room: RoomEntity)

    @Delete
    suspend fun deleteRoom(room: RoomEntity)

    @Query("SELECT * FROM rooms WHERE id = :id")
    suspend fun getRoomById(id: String): RoomEntity?

    @Query("SELECT * FROM rooms WHERE budgetId = :budgetId")
    suspend fun getRoomsByBudgetId(budgetId: String): List<RoomEntity>

    @Query("SELECT * FROM rooms WHERE budgetId = :budgetId")
    fun observeRoomsByBudgetId(budgetId: String): Flow<List<RoomEntity>>

    @Query("DELETE FROM rooms WHERE budgetId = :budgetId")
    suspend fun deleteRoomsByBudgetId(budgetId: String)
}
```

### ItemDao.kt

```kotlin
package com.pintorplus.data.db.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pintorplus.data.db.entities.ItemEntity

@Dao
interface ItemDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: ItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItems(items: List<ItemEntity>)

    @Update
    suspend fun updateItem(item: ItemEntity)

    @Delete
    suspend fun deleteItem(item: ItemEntity)

    @Query("SELECT * FROM items WHERE id = :id")
    suspend fun getItemById(id: String): ItemEntity?

    @Query("SELECT * FROM items WHERE roomId = :roomId")
    suspend fun getItemsByRoomId(roomId: String): List<ItemEntity>

    @Query("DELETE FROM items WHERE roomId = :roomId")
    suspend fun deleteItemsByRoomId(roomId: String)

    @Query("DELETE FROM items WHERE id = :id")
    suspend fun deleteItemById(id: String)
}
```

### ClientDao.kt

```kotlin
package com.pintorplus.data.db.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pintorplus.data.db.entities.ClientEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ClientDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClient(client: ClientEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClients(clients: List<ClientEntity>)

    @Update
    suspend fun updateClient(client: ClientEntity)

    @Delete
    suspend fun deleteClient(client: ClientEntity)

    @Query("SELECT * FROM clients WHERE id = :id")
    suspend fun getClientById(id: String): ClientEntity?

    @Query("SELECT * FROM clients ORDER BY createdAt DESC")
    fun observeAllClients(): Flow<List<ClientEntity>>

    @Query("SELECT * FROM clients WHERE name LIKE '%' || :query || '%' OR phone LIKE '%' || :query || '%'")
    fun searchClients(query: String): Flow<List<ClientEntity>>

    @Query("DELETE FROM clients WHERE id = :id")
    suspend fun deleteClientById(id: String)
}
```

### ConfigDao.kt

```kotlin
package com.pintorplus.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pintorplus.data.db.entities.ConfigEntity

@Dao
interface ConfigDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConfig(config: ConfigEntity)

    @Update
    suspend fun updateConfig(config: ConfigEntity)

    @Query("SELECT * FROM config WHERE id = 'config_singleton' LIMIT 1")
    suspend fun getConfig(): ConfigEntity?
}
```

---

## 💾 Opção 5: Repository Interfaces (Domain)

Arquivo: `domain/src/main/kotlin/com/pintorplus/domain/repositories/`

### BudgetRepository.kt

```kotlin
package com.pintorplus.domain.repositories

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Result
import kotlinx.coroutines.flow.Flow

interface BudgetRepository {
    suspend fun createBudget(budget: Budget): Result<Budget>
    suspend fun getBudgetById(id: String): Result<Budget?>
    fun observeAllBudgets(): Flow<List<Budget>>
    fun observeDraftBudgets(): Flow<List<Budget>>
    fun observeBudgetsByStatus(status: String): Flow<List<Budget>>
    fun searchBudgets(query: String): Flow<List<Budget>>
    suspend fun updateBudget(budget: Budget): Result<Budget>
    suspend fun deleteBudget(id: String): Result<Unit>
}
```

### ClientRepository.kt

```kotlin
package com.pintorplus.domain.repositories

import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.entities.Result
import kotlinx.coroutines.flow.Flow

interface ClientRepository {
    suspend fun createClient(client: Client): Result<Client>
    suspend fun getClientById(id: String): Result<Client?>
    fun observeAllClients(): Flow<List<Client>>
    fun searchClients(query: String): Flow<List<Client>>
    suspend fun updateClient(client: Client): Result<Client>
    suspend fun deleteClient(id: String): Result<Unit>
}
```

### ConfigRepository.kt

```kotlin
package com.pintorplus.domain.repositories

import com.pintorplus.domain.entities.AppConfig
import com.pintorplus.domain.entities.Result

interface ConfigRepository {
    suspend fun getConfig(): Result<AppConfig>
    suspend fun updateConfig(config: AppConfig): Result<Unit>
}
```

---

## 🔗 Opção 6: Repository Implementations (Data)

Arquivo: `data/src/main/kotlin/com/pintorplus/data/repositories/`

### BudgetRepositoryImpl.kt

```kotlin
package com.pintorplus.data.repositories

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Result
import com.pintorplus.domain.entities.Room
import com.pintorplus.domain.entities.Item
import com.pintorplus.domain.repositories.BudgetRepository
import com.pintorplus.data.db.dao.BudgetDao
import com.pintorplus.data.db.dao.RoomDao
import com.pintorplus.data.db.dao.ItemDao
import com.pintorplus.data.mappers.toDomain
import com.pintorplus.data.mappers.toEntity
import com.pintorplus.data.mappers.toDomainBudget
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class BudgetRepositoryImpl(
    private val budgetDao: BudgetDao,
    private val roomDao: RoomDao,
    private val itemDao: ItemDao
) : BudgetRepository {

    override suspend fun createBudget(budget: Budget): Result<Budget> {
        return try {
            budgetDao.insertBudget(budget.toEntity())
            
            // Inserir rooms e items
            val roomEntities = budget.rooms.map { room ->
                room.toEntity(budget.id)
            }
            roomDao.insertRooms(roomEntities)
            
            budget.rooms.forEach { room ->
                val itemEntities = room.items.map { item ->
                    item.toEntity(room.id)
                }
                itemDao.insertItems(itemEntities)
            }
            
            Result.Success(budget)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getBudgetById(id: String): Result<Budget?> {
        return try {
            val budgetEntity = budgetDao.getBudgetById(id) ?: return Result.Success(null)
            val rooms = roomDao.getRoomsByBudgetId(id)
            
            val domainRooms = rooms.map { roomEntity ->
                val items = itemDao.getItemsByRoomId(roomEntity.id)
                roomEntity.toDomain(items.map { it.toDomain() })
            }
            
            val budget = budgetEntity.toDomainBudget(domainRooms)
            Result.Success(budget)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override fun observeAllBudgets(): Flow<List<Budget>> {
        return budgetDao.observeAllBudgets().map { entities ->
            entities.map { it.toDomainBudget(emptyList()) }
        }
    }

    override fun observeDraftBudgets(): Flow<List<Budget>> {
        return budgetDao.observeDraftBudgets().map { entities ->
            entities.map { it.toDomainBudget(emptyList()) }
        }
    }

    override fun observeBudgetsByStatus(status: String): Flow<List<Budget>> {
        return budgetDao.observeBudgetsByStatus(status).map { entities ->
            entities.map { it.toDomainBudget(emptyList()) }
        }
    }

    override fun searchBudgets(query: String): Flow<List<Budget>> {
        return budgetDao.searchBudgets(query).map { entities ->
            entities.map { it.toDomainBudget(emptyList()) }
        }
    }

    override suspend fun updateBudget(budget: Budget): Result<Budget> {
        return try {
            budgetDao.updateBudget(budget.toEntity())
            
            // Atualizar rooms
            roomDao.deleteRoomsByBudgetId(budget.id)
            val roomEntities = budget.rooms.map { room ->
                room.toEntity(budget.id)
            }
            roomDao.insertRooms(roomEntities)
            
            // Atualizar items
            budget.rooms.forEach { room ->
                itemDao.deleteItemsByRoomId(room.id)
                val itemEntities = room.items.map { item ->
                    item.toEntity(room.id)
                }
                itemDao.insertItems(itemEntities)
            }
            
            Result.Success(budget)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun deleteBudget(id: String): Result<Unit> {
        return try {
            roomDao.deleteRoomsByBudgetId(id)
            budgetDao.deleteBudgetById(id)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
```

### ClientRepositoryImpl.kt

```kotlin
package com.pintorplus.data.repositories

import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.entities.Result
import com.pintorplus.domain.repositories.ClientRepository
import com.pintorplus.data.db.dao.ClientDao
import com.pintorplus.data.mappers.toDomain
import com.pintorplus.data.mappers.toEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ClientRepositoryImpl(
    private val clientDao: ClientDao
) : ClientRepository {

    override suspend fun createClient(client: Client): Result<Client> {
        return try {
            clientDao.insertClient(client.toEntity())
            Result.Success(client)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun getClientById(id: String): Result<Client?> {
        return try {
            val entity = clientDao.getClientById(id)
            Result.Success(entity?.toDomain())
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override fun observeAllClients(): Flow<List<Client>> {
        return clientDao.observeAllClients().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun searchClients(query: String): Flow<List<Client>> {
        return clientDao.searchClients(query).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun updateClient(client: Client): Result<Client> {
        return try {
            clientDao.updateClient(client.toEntity())
            Result.Success(client)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun deleteClient(id: String): Result<Unit> {
        return try {
            clientDao.deleteClientById(id)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
```

---

## 🎯 Opção 7: UseCases (Domain)

Arquivo: `domain/src/main/kotlin/com/pintorplus/domain/usecases/`

### CalculateBudgetTotalUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Budget

class CalculateBudgetTotalUseCase {
    operator fun invoke(budget: Budget): Double {
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
                    val itemSqm = item.squareMeters
                        .takeIf { it > 0 }
                        ?: item.height.takeIf { it > 0 }
                        ?: item.width
                    
                    total += if (item.pricePerMeter) {
                        item.price * itemSqm
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

### CreateBudgetUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Result
import com.pintorplus.domain.repositories.BudgetRepository
import java.util.UUID

class CreateBudgetUseCase(
    private val budgetRepository: BudgetRepository,
    private val calculateTotalUseCase: CalculateBudgetTotalUseCase
) {
    suspend operator fun invoke(budget: Budget): Result<Budget> {
        // Validações de negócio
        if (budget.clientName.isBlank()) {
            return Result.Error(Exception("Nome do cliente é obrigatório"))
        }
        
        if (budget.rooms.isEmpty()) {
            return Result.Error(Exception("Orçamento deve ter pelo menos um cômodo"))
        }
        
        // Criar com ID se não tiver
        val budgetToSave = if (budget.id.isEmpty()) {
            budget.copy(
                id = UUID.randomUUID().toString(),
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
        } else {
            budget.copy(updatedAt = System.currentTimeMillis())
        }
        
        return budgetRepository.createBudget(budgetToSave)
    }
}
```

### GetBudgetsUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.repositories.BudgetRepository
import kotlinx.coroutines.flow.Flow

class GetBudgetsUseCase(
    private val budgetRepository: BudgetRepository
) {
    operator fun invoke(): Flow<List<Budget>> {
        return budgetRepository.observeAllBudgets()
    }
}
```

### EditBudgetUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Result
import com.pintorplus.domain.repositories.BudgetRepository

class EditBudgetUseCase(
    private val budgetRepository: BudgetRepository
) {
    suspend operator fun invoke(budget: Budget): Result<Budget> {
        if (budget.id.isEmpty()) {
            return Result.Error(Exception("ID do orçamento é obrigatório"))
        }
        
        val updatedBudget = budget.copy(updatedAt = System.currentTimeMillis())
        return budgetRepository.updateBudget(updatedBudget)
    }
}
```

### DeleteBudgetUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Result
import com.pintorplus.domain.repositories.BudgetRepository

class DeleteBudgetUseCase(
    private val budgetRepository: BudgetRepository
) {
    suspend operator fun invoke(budgetId: String): Result<Unit> {
        if (budgetId.isEmpty()) {
            return Result.Error(Exception("ID do orçamento é obrigatório"))
        }
        
        return budgetRepository.deleteBudget(budgetId)
    }
}
```

### GetClientsUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.repositories.ClientRepository
import kotlinx.coroutines.flow.Flow

class GetClientsUseCase(
    private val clientRepository: ClientRepository
) {
    operator fun invoke(): Flow<List<Client>> {
        return clientRepository.observeAllClients()
    }
}
```

### SearchClientsUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.repositories.ClientRepository
import kotlinx.coroutines.flow.Flow

class SearchClientsUseCase(
    private val clientRepository: ClientRepository
) {
    operator fun invoke(query: String): Flow<List<Client>> {
        return clientRepository.searchClients(query)
    }
}
```

### CreateClientUseCase.kt

```kotlin
package com.pintorplus.domain.usecases

import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.entities.Result
import com.pintorplus.domain.repositories.ClientRepository
import java.util.UUID

class CreateClientUseCase(
    private val clientRepository: ClientRepository
) {
    suspend operator fun invoke(client: Client): Result<Client> {
        if (client.name.isBlank()) {
            return Result.Error(Exception("Nome do cliente é obrigatório"))
        }
        
        val clientToSave = if (client.id.isEmpty()) {
            client.copy(
                id = UUID.randomUUID().toString(),
                createdAt = System.currentTimeMillis()
            )
        } else {
            client
        }
        
        return clientRepository.createClient(clientToSave)
    }
}
```

---

## 🗂️ Mappers (Data Layer)

Arquivo: `data/src/main/kotlin/com/pintorplus/data/mappers/`

### BudgetMappers.kt

```kotlin
package com.pintorplus.data.mappers

import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.BudgetFormat
import com.pintorplus.domain.entities.Room
import com.pintorplus.data.db.entities.BudgetEntity
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

fun BudgetEntity.toDomainBudget(rooms: List<Room>): Budget {
    val gson = Gson()
    val paymentMethods = try {
        gson.fromJson<List<String>>(paymentMethodsJson, object : TypeToken<List<String>>() {}.type)
    } catch (e: Exception) {
        paymentMethodsJson.split(",").filter { it.isNotBlank() }
    }
    
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
        rooms = rooms,
        paymentMethods = paymentMethods,
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

fun Budget.toEntity(): BudgetEntity {
    val gson = Gson()
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
        paymentMethodsJson = gson.toJson(paymentMethods),
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

### RoomMappers.kt

```kotlin
package com.pintorplus.data.mappers

import com.pintorplus.domain.entities.Room
import com.pintorplus.domain.entities.Item
import com.pintorplus.data.db.entities.RoomEntity
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

fun RoomEntity.toDomain(items: List<Item> = emptyList()): Room {
    val gson = Gson()
    val services = try {
        gson.fromJson<List<String>>(servicesJson, object : TypeToken<List<String>>() {}.type)
    } catch (e: Exception) {
        servicesJson.split(",").filter { it.isNotBlank() }
    }
    
    return Room(
        id = id,
        name = name,
        height = height,
        width = width,
        items = items,
        services = services,
        price = price,
        pricePerSquareMeter = pricePerSquareMeter,
        isCollapsed = isCollapsed
    )
}

fun Room.toEntity(budgetId: String): RoomEntity {
    val gson = Gson()
    return RoomEntity(
        id = id,
        budgetId = budgetId,
        name = name,
        height = height,
        width = width,
        servicesJson = gson.toJson(services),
        price = price,
        pricePerSquareMeter = pricePerSquareMeter,
        isCollapsed = isCollapsed
    )
}
```

### ItemMappers.kt

```kotlin
package com.pintorplus.data.mappers

import com.pintorplus.domain.entities.Item
import com.pintorplus.data.db.entities.ItemEntity
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

fun ItemEntity.toDomain(): Item {
    val gson = Gson()
    val services = try {
        gson.fromJson<List<String>>(servicesJson, object : TypeToken<List<String>>() {}.type)
    } catch (e: Exception) {
        servicesJson.split(",").filter { it.isNotBlank() }
    }
    
    val photoUrls = try {
        gson.fromJson<List<String>>(photoUrlsJson, object : TypeToken<List<String>>() {}.type)
    } catch (e: Exception) {
        photoUrlsJson.split(",").filter { it.isNotBlank() }
    }
    
    return Item(
        id = id,
        name = name,
        height = height,
        width = width,
        services = services,
        price = price,
        pricePerMeter = pricePerMeter,
        observations = observations,
        photoUrls = photoUrls
    )
}

fun Item.toEntity(roomId: String): ItemEntity {
    val gson = Gson()
    return ItemEntity(
        id = id,
        roomId = roomId,
        name = name,
        height = height,
        width = width,
        servicesJson = gson.toJson(services),
        price = price,
        pricePerMeter = pricePerMeter,
        observations = observations,
        photoUrlsJson = gson.toJson(photoUrls)
    )
}
```

### ClientMappers.kt

```kotlin
package com.pintorplus.data.mappers

import com.pintorplus.domain.entities.Client
import com.pintorplus.data.db.entities.ClientEntity

fun ClientEntity.toDomain(): Client {
    return Client(
        id = id,
        name = name,
        nickname = nickname,
        phone = phone,
        email = email,
        cpf = cpf,
        cep = cep,
        street = street,
        number = number,
        complement = complement,
        neighborhood = neighborhood,
        city = city,
        fullAddress = fullAddress,
        createdAt = createdAt
    )
}

fun Client.toEntity(): ClientEntity {
    return ClientEntity(
        id = id,
        name = name,
        nickname = nickname,
        phone = phone,
        email = email,
        cpf = cpf,
        cep = cep,
        street = street,
        number = number,
        complement = complement,
        neighborhood = neighborhood,
        city = city,
        fullAddress = fullAddress,
        createdAt = createdAt
    )
}
```

---

## 📱 AppDatabase.kt

Arquivo: `data/src/main/kotlin/com/pintorplus/data/db/`

```kotlin
package com.pintorplus.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.pintorplus.data.db.entities.BudgetEntity
import com.pintorplus.data.db.entities.RoomEntity
import com.pintorplus.data.db.entities.ItemEntity
import com.pintorplus.data.db.entities.ClientEntity
import com.pintorplus.data.db.entities.ConfigEntity
import com.pintorplus.data.db.converters.ListStringConverter
import com.pintorplus.data.db.dao.BudgetDao
import com.pintorplus.data.db.dao.RoomDao
import com.pintorplus.data.db.dao.ItemDao
import com.pintorplus.data.db.dao.ClientDao
import com.pintorplus.data.db.dao.ConfigDao

@Database(
    entities = [
        BudgetEntity::class,
        RoomEntity::class,
        ItemEntity::class,
        ClientEntity::class,
        ConfigEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(ListStringConverter::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun budgetDao(): BudgetDao
    abstract fun roomDao(): RoomDao
    abstract fun itemDao(): ItemDao
    abstract fun clientDao(): ClientDao
    abstract fun configDao(): ConfigDao

    companion object {
        const val DATABASE_NAME = "pintor_plus.db"
    }
}
```

---

## ✅ Checklist Fase 2 Completa

- [ ] Todas 5 Domain Entities criadas
- [ ] Todas 5 Room Entities criadas com @Entity
- [ ] ListStringConverter implementado
- [ ] Todos 5 DAOs criados com queries CRUD
- [ ] BudgetRepository interface definida
- [ ] ClientRepository interface definida
- [ ] ConfigRepository interface definida
- [ ] BudgetRepositoryImpl implementada
- [ ] ClientRepositoryImpl implementada
- [ ] ConfigRepositoryImpl implementada (não mostrada, similar)
- [ ] CalculateBudgetTotalUseCase criado
- [ ] CreateBudgetUseCase criado
- [ ] GetBudgetsUseCase criado
- [ ] EditBudgetUseCase criado
- [ ] DeleteBudgetUseCase criado
- [ ] GetClientsUseCase criado
- [ ] SearchClientsUseCase criado
- [ ] CreateClientUseCase criado
- [ ] Todos Mappers implementados (Budget, Room, Item, Client)
- [ ] AppDatabase criado
- [ ] Gradle build.gradle files atualizados com Room dependencies
- [ ] Testes unitários para UseCases

---

**Status:** ✅ Implementação Fase 2 Completa  
**Próximo:** Fase 3 (UI Screens com Jetpack Compose)

