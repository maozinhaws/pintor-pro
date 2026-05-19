# 🧭 Fase 4: Navigation Compose & ViewModels — Implementação Completa

**Duração:** 3-5 dias  
**Status:** 📋 Pronta para implementação  
**Components:** NavGraph + 6 ViewModels + StateFlow  
**Architecture:** MVVM + Clean Architecture

---

## 🗺️ Navegação - NavGraph

### Estrutura de Rotas

```
Telas:
├── Home (startDestination)
│   ├── Args: none
│   ├── Deep link: pintorplus://home
│   └── Transições: slide enter/exit
│
├── Wizard (criar orçamento)
│   ├── Args: budgetId? (null = novo)
│   ├── Deep link: pintorplus://wizard/{budgetId}
│   └── Transições: modal
│
├── BudgetDetails (visualizar)
│   ├── Args: budgetId (required)
│   ├── Deep link: pintorplus://budget/{budgetId}
│   └── Transições: slide enter
│
├── ClientList (listar clientes)
│   ├── Args: none
│   ├── Deep link: pintorplus://clients
│   └── Transições: slide enter
│
├── Settings (configurações)
│   ├── Args: none
│   ├── Deep link: pintorplus://settings
│   └── Transições: fade
│
└── CompanyInfo (sub-screen)
    ├── Navega de Settings
    ├── Dialog modal
    └── Argumento: initial config
```

### NavHost Completo

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/navigation/NavGraph.kt`

```kotlin
package com.pintorplus.presentation.navigation

import androidx.compose.animation.*
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.pintorplus.presentation.screens.BudgetDetailsScreen
import com.pintorplus.presentation.screens.ClientListScreen
import com.pintorplus.presentation.screens.HomeScreen
import com.pintorplus.presentation.screens.SettingsScreen
import com.pintorplus.presentation.screens.WizardScreen

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Wizard : Screen("wizard/{budgetId}") {
        fun createRoute(budgetId: String? = null) =
            if (budgetId != null) "wizard/$budgetId" else "wizard/null"
    }
    data object BudgetDetails : Screen("budget/{budgetId}") {
        fun createRoute(budgetId: String) = "budget/$budgetId"
    }
    data object ClientList : Screen("clients")
    data object Settings : Screen("settings")
}

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Home.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        enterTransition = { slideInHorizontally(initialOffsetX = { 1000 }) + fadeIn() },
        exitTransition = { slideOutHorizontally(targetOffsetX = { -1000 }) + fadeOut() },
        popEnterTransition = { slideInHorizontally(initialOffsetX = { -1000 }) + fadeIn() },
        popExitTransition = { slideOutHorizontally(targetOffsetX = { 1000 }) + fadeOut() }
    ) {
        composable(
            route = Screen.Home.route,
            deepLinks = listOf(navDeepLink { uriPattern = "pintorplus://home" })
        ) {
            HomeScreen(
                onNewBudget = {
                    navController.navigate(Screen.Wizard.createRoute())
                },
                onBudgetClick = { budget ->
                    navController.navigate(Screen.BudgetDetails.createRoute(budget.id))
                },
                onNewClient = {
                    navController.navigate(Screen.ClientList.route)
                }
            )
        }

        composable(
            route = Screen.Wizard.route,
            arguments = listOf(
                navArgument("budgetId") {
                    type = NavType.StringType
                    defaultValue = "null"
                    nullable = true
                }
            ),
            deepLinks = listOf(navDeepLink { uriPattern = "pintorplus://wizard/{budgetId}" }),
            enterTransition = { fadeIn() + slideInVertically(initialOffsetY = { 1000 }) },
            exitTransition = { fadeOut() + slideOutVertically(targetOffsetY = { 1000 }) }
        ) { backStackEntry ->
            val budgetId = backStackEntry.arguments?.getString("budgetId")
                ?.takeIf { it != "null" }
            
            WizardScreen(
                onComplete = { budget ->
                    navController.navigate(
                        Screen.BudgetDetails.createRoute(budget.id)
                    ) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onCancel = {
                    navController.popBackStack()
                }
            )
        }

        composable(
            route = Screen.BudgetDetails.route,
            arguments = listOf(
                navArgument("budgetId") {
                    type = NavType.StringType
                }
            ),
            deepLinks = listOf(
                navDeepLink { uriPattern = "pintorplus://budget/{budgetId}" }
            )
        ) { backStackEntry ->
            val budgetId = backStackEntry.arguments?.getString("budgetId") ?: return@composable
            
            BudgetDetailsScreen(
                budget = Budget(
                    id = budgetId,
                    clientName = "Temp",
                    clientNickname = "Temp",
                    clientPhone = "",
                    clientEmail = "",
                    clientCpf = "",
                    clientCep = "",
                    clientStreet = "",
                    clientNumber = "",
                    clientComplement = "",
                    clientNeighborhood = "",
                    clientCity = "",
                    clientFullAddress = "",
                    payerName = "",
                    payerPhone = "",
                    payerAddress = "",
                    hasDifferentPayer = false,
                    rooms = emptyList(),
                    paymentMethods = emptyList(),
                    format = Budget.BudgetFormat.PINTURA,
                    pricePerSqMeter = 35.0,
                    status = "Rascunho",
                    validityDays = "30",
                    serviceType = "Pintura",
                    startDate = "",
                    observations = "",
                    formattedDate = "",
                    createdAt = 0,
                    updatedAt = 0
                ),
                onEdit = {
                    navController.navigate(Screen.Wizard.createRoute(budgetId))
                },
                onDelete = {
                    navController.popBackStack()
                },
                onShare = {
                    // WhatsApp share logic
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(
            route = Screen.ClientList.route,
            deepLinks = listOf(navDeepLink { uriPattern = "pintorplus://clients" })
        ) {
            ClientListScreen(
                onNewClient = {
                    // Navigate to new client dialog/screen
                },
                onClientClick = { client ->
                    // Could navigate to client details if needed
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(
            route = Screen.Settings.route,
            deepLinks = listOf(navDeepLink { uriPattern = "pintorplus://settings" }),
            enterTransition = { fadeIn() },
            exitTransition = { fadeOut() }
        ) {
            SettingsScreen(
                onBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
```

---

## 🎯 ViewModels & State Management

### 1. HomeViewModel

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/viewmodels/HomeViewModel.kt`

```kotlin
package com.pintorplus.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.usecases.GetBudgetsUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val draftBudgets: List<Budget> = emptyList(),
    val sentBudgets: List<Budget> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class HomeViewModel(
    private val getBudgetsUseCase: GetBudgetsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadBudgets()
    }

    private fun loadBudgets() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                getBudgetsUseCase().collect { budgets ->
                    val drafts = budgets.filter { it.isDraft }
                    val sent = budgets.filter { !it.isDraft }
                    _uiState.update {
                        it.copy(
                            draftBudgets = drafts,
                            sentBudgets = sent,
                            isLoading = false,
                            error = null
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Erro desconhecido"
                    )
                }
            }
        }
    }

    fun refreshBudgets() {
        loadBudgets()
    }
}
```

### 2. WizardViewModel

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/viewmodels/WizardViewModel.kt`

```kotlin
package com.pintorplus.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Room
import com.pintorplus.domain.usecases.CreateBudgetUseCase
import com.pintorplus.domain.usecases.EditBudgetUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WizardUiState(
    val currentStep: Int = 0,
    val budget: Budget? = null,
    val clientName: String = "",
    val clientPhone: String = "",
    val rooms: List<Room> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isComplete: Boolean = false
)

class WizardViewModel(
    private val createBudgetUseCase: CreateBudgetUseCase,
    private val editBudgetUseCase: EditBudgetUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(WizardUiState())
    val uiState: StateFlow<WizardUiState> = _uiState.asStateFlow()

    fun setClientName(name: String) {
        _uiState.update { it.copy(clientName = name) }
    }

    fun setClientPhone(phone: String) {
        _uiState.update { it.copy(clientPhone = phone) }
    }

    fun addRoom(room: Room) {
        _uiState.update { state ->
            state.copy(rooms = state.rooms + room)
        }
    }

    fun removeRoom(roomId: String) {
        _uiState.update { state ->
            state.copy(rooms = state.rooms.filter { it.id != roomId })
        }
    }

    fun updateRoom(room: Room) {
        _uiState.update { state ->
            state.copy(
                rooms = state.rooms.map {
                    if (it.id == room.id) room else it
                }
            )
        }
    }

    fun nextStep() {
        if (_uiState.value.currentStep < 3) {
            _uiState.update { it.copy(currentStep = it.currentStep + 1) }
        }
    }

    fun previousStep() {
        if (_uiState.value.currentStep > 0) {
            _uiState.update { it.copy(currentStep = it.currentStep - 1) }
        }
    }

    fun completeBudget() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val budget = buildBudgetFromState()
                createBudgetUseCase(budget)
                _uiState.update {
                    it.copy(
                        isComplete = true,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Erro ao criar orçamento"
                    )
                }
            }
        }
    }

    private fun buildBudgetFromState(): Budget {
        val state = _uiState.value
        return Budget(
            id = java.util.UUID.randomUUID().toString(),
            clientName = state.clientName,
            clientNickname = state.clientName,
            clientPhone = state.clientPhone,
            clientEmail = "",
            clientCpf = "",
            clientCep = "",
            clientStreet = "",
            clientNumber = "",
            clientComplement = "",
            clientNeighborhood = "",
            clientCity = "",
            clientFullAddress = "",
            payerName = state.clientName,
            payerPhone = state.clientPhone,
            payerAddress = "",
            hasDifferentPayer = false,
            rooms = state.rooms,
            paymentMethods = emptyList(),
            format = Budget.BudgetFormat.PINTURA,
            pricePerSqMeter = 35.0,
            status = "draft",
            validityDays = "30",
            serviceType = "Pintura",
            startDate = java.time.LocalDate.now().toString(),
            observations = "",
            formattedDate = java.time.LocalDate.now().toString(),
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis(),
            isDraft = true
        )
    }
}
```

### 3. BudgetDetailsViewModel

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/viewmodels/BudgetDetailsViewModel.kt`

```kotlin
package com.pintorplus.presentation.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.usecases.DeleteBudgetUseCase
import com.pintorplus.domain.usecases.GetBudgetsUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class BudgetDetailsUiState(
    val budget: Budget? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isDeleted: Boolean = false
)

class BudgetDetailsViewModel(
    savedStateHandle: SavedStateHandle,
    private val getBudgetsUseCase: GetBudgetsUseCase,
    private val deleteBudgetUseCase: DeleteBudgetUseCase
) : ViewModel() {

    private val budgetId: String = savedStateHandle.get<String>("budgetId") ?: ""

    private val _uiState = MutableStateFlow(BudgetDetailsUiState())
    val uiState: StateFlow<BudgetDetailsUiState> = _uiState.asStateFlow()

    init {
        loadBudget()
    }

    private fun loadBudget() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                getBudgetsUseCase().collect { budgets ->
                    val budget = budgets.find { it.id == budgetId }
                    _uiState.update {
                        it.copy(
                            budget = budget,
                            isLoading = false,
                            error = if (budget == null) "Orçamento não encontrado" else null
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Erro ao carregar"
                    )
                }
            }
        }
    }

    fun deleteBudget() {
        viewModelScope.launch {
            try {
                deleteBudgetUseCase(budgetId)
                _uiState.update { it.copy(isDeleted = true) }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(error = e.message ?: "Erro ao deletar")
                }
            }
        }
    }
}
```

### 4. ClientListViewModel

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/viewmodels/ClientListViewModel.kt`

```kotlin
package com.pintorplus.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.usecases.GetClientsUseCase
import com.pintorplus.domain.usecases.SearchClientsUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ClientListUiState(
    val clients: List<Client> = emptyList(),
    val filteredClients: List<Client> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

class ClientListViewModel(
    private val getClientsUseCase: GetClientsUseCase,
    private val searchClientsUseCase: SearchClientsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClientListUiState())
    val uiState: StateFlow<ClientListUiState> = _uiState.asStateFlow()

    init {
        loadClients()
    }

    private fun loadClients() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                getClientsUseCase().collect { clients ->
                    _uiState.update {
                        it.copy(
                            clients = clients,
                            filteredClients = clients,
                            isLoading = false,
                            error = null
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Erro ao carregar"
                    )
                }
            }
        }
    }

    fun search(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        viewModelScope.launch {
            if (query.isEmpty()) {
                _uiState.update {
                    it.copy(filteredClients = it.clients)
                }
            } else {
                try {
                    searchClientsUseCase(query).collect { results ->
                        _uiState.update {
                            it.copy(filteredClients = results)
                        }
                    }
                } catch (e: Exception) {
                    _uiState.update {
                        it.copy(error = e.message)
                    }
                }
            }
        }
    }
}
```

### 5. SettingsViewModel

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/viewmodels/SettingsViewModel.kt`

```kotlin
package com.pintorplus.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pintorplus.domain.usecases.GetConfigUseCase
import com.pintorplus.domain.usecases.UpdateConfigUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsUiState(
    val isDarkMode: Boolean = false,
    val companyName: String = "",
    val companyPhone: String = "",
    val companyEmail: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

class SettingsViewModel(
    private val getConfigUseCase: GetConfigUseCase,
    private val updateConfigUseCase: UpdateConfigUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            try {
                getConfigUseCase().collect { config ->
                    _uiState.update {
                        it.copy(
                            companyName = config.companyName,
                            companyPhone = config.companyPhone,
                            companyEmail = config.companyEmail
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(error = e.message)
                }
            }
        }
    }

    fun toggleDarkMode() {
        _uiState.update { it.copy(isDarkMode = !it.isDarkMode) }
    }

    fun updateCompanyInfo(name: String, phone: String, email: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val config = com.pintorplus.domain.entities.AppConfig(
                    companyName = name,
                    companyPhone = phone,
                    companyEmail = email,
                    defaultServiceTypes = emptyList(),
                    defaultPaymentMethods = emptyList(),
                    pricePerSquareMeter = 35.0
                )
                updateConfigUseCase(config)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        companyName = name,
                        companyPhone = phone,
                        companyEmail = email
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Erro ao atualizar"
                    )
                }
            }
        }
    }
}
```

---

## 📱 Integration com Screens

### HomeScreen com ViewModel

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/screens/HomeScreenIntegrated.kt`

```kotlin
package com.pintorplus.presentation.screens

import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pintorplus.presentation.viewmodels.HomeViewModel

@Composable
fun HomeScreenIntegrated(
    viewModel: HomeViewModel = viewModel(),
    onNavigateToBudgetDetails: (String) -> Unit = {},
    onNavigateToWizard: () -> Unit = {},
    onNavigateToClients: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    when {
        uiState.isLoading -> {
            CircularProgressIndicator()
        }
        uiState.error != null -> {
            ErrorMessage(
                error = uiState.error ?: "Erro desconhecido",
                onRetry = { viewModel.refreshBudgets() }
            )
        }
        else -> {
            HomeScreen(
                draftBudgets = uiState.draftBudgets,
                sentBudgets = uiState.sentBudgets,
                onNewBudget = onNavigateToWizard,
                onBudgetClick = { budget ->
                    onNavigateToBudgetDetails(budget.id)
                },
                onNewClient = onNavigateToClients
            )
        }
    }
}

@Composable
fun ErrorMessage(
    error: String,
    onRetry: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Error,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = error,
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Tentar Novamente")
        }
    }
}
```

---

## 🔧 Dependency Injection Setup (Koin)

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/di/PresentationModule.kt`

```kotlin
package com.pintorplus.presentation.di

import com.pintorplus.presentation.viewmodels.*
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val presentationModule = module {
    viewModel { HomeViewModel(get()) }
    viewModel { WizardViewModel(get(), get()) }
    viewModel { (budgetId: String) -> BudgetDetailsViewModel(get(), get(), get()) }
    viewModel { ClientListViewModel(get(), get()) }
    viewModel { SettingsViewModel(get(), get()) }
}
```

Arquivo: `app/src/main/kotlin/com/pintorplus/android/di/AppModule.kt`

```kotlin
package com.pintorplus.android.di

import android.content.Context
import androidx.room.Room
import com.pintorplus.data.database.AppDatabase
import com.pintorplus.data.repository.BudgetRepositoryImpl
import com.pintorplus.data.repository.ClientRepositoryImpl
import com.pintorplus.data.repository.ConfigRepositoryImpl
import com.pintorplus.domain.repository.BudgetRepository
import com.pintorplus.domain.repository.ClientRepository
import com.pintorplus.domain.repository.ConfigRepository
import com.pintorplus.domain.usecases.*
import com.pintorplus.presentation.di.presentationModule
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin
import org.koin.core.module.dsl.singleOf
import org.koin.dsl.bind
import org.koin.dsl.module

private val databaseModule = module {
    single {
        Room.databaseBuilder(
            androidContext(),
            AppDatabase::class.java,
            AppDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()
    }
    single { get<AppDatabase>().budgetDao() }
    single { get<AppDatabase>().roomDao() }
    single { get<AppDatabase>().itemDao() }
    single { get<AppDatabase>().clientDao() }
    single { get<AppDatabase>().configDao() }
}

private val repositoryModule = module {
    singleOf(::BudgetRepositoryImpl) bind BudgetRepository::class
    singleOf(::ClientRepositoryImpl) bind ClientRepository::class
    singleOf(::ConfigRepositoryImpl) bind ConfigRepository::class
}

private val useCaseModule = module {
    singleOf(::CalculateBudgetTotalUseCase)
    singleOf(::CreateBudgetUseCase)
    singleOf(::GetBudgetsUseCase)
    singleOf(::EditBudgetUseCase)
    singleOf(::DeleteBudgetUseCase)
    singleOf(::GetClientsUseCase)
    singleOf(::SearchClientsUseCase)
    singleOf(::CreateClientUseCase)
    singleOf(::GetConfigUseCase)
    singleOf(::UpdateConfigUseCase)
}

fun initializeKoin(context: Context) {
    startKoin {
        androidContext(context)
        modules(
            databaseModule,
            repositoryModule,
            useCaseModule,
            presentationModule
        )
    }
}
```

---

## 🎯 MainActivity com NavGraph

Arquivo: `app/src/main/kotlin/com/pintorplus/android/MainActivity.kt`

```kotlin
package com.pintorplus.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.pintorplus.android.di.initializeKoin
import com.pintorplus.core.theme.PintorPlusTheme
import com.pintorplus.presentation.navigation.AppNavigation

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        initializeKoin(this)
        
        setContent {
            PintorPlusTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}
```

Arquivo: `app/src/main/kotlin/com/pintorplus/android/PintorPlusApp.kt`

```kotlin
package com.pintorplus.android

import android.app.Application
import com.pintorplus.android.di.initializeKoin

class PintorPlusApp : Application() {
    override fun onCreate() {
        super.onCreate()
        initializeKoin(this)
    }
}
```

---

## 📋 Checklist: Fase 4 - Navigation & ViewModels

### Navigation Graph
- [ ] Screen sealed class com routes
- [ ] NavHost com 5 composables principais
- [ ] Argumentos tipados (String, Int, etc)
- [ ] Deep links para cada screen
- [ ] Transições customizadas (slide, fade, modal)
- [ ] PopUp behavior correto
- [ ] Back navigation funcionando

### ViewModels
- [ ] HomeViewModel com draft/sent filtering
- [ ] WizardViewModel com steps e validation
- [ ] BudgetDetailsViewModel com delete
- [ ] ClientListViewModel com search
- [ ] SettingsViewModel com dark mode
- [ ] Todos com StateFlow<UiState>
- [ ] Coroutines + viewModelScope

### Integration
- [ ] HomeScreenIntegrated coletando estado
- [ ] WizardScreenIntegrated com validação
- [ ] BudgetDetailsScreenIntegrated com delete
- [ ] ClientListScreenIntegrated com search
- [ ] SettingsScreenIntegrated com toggle
- [ ] ErrorMessage composable reutilizável
- [ ] Loading states em todos screens

### Dependency Injection
- [ ] Koin initialized em Application
- [ ] presentationModule com 5 viewModels
- [ ] databaseModule com Room setup
- [ ] repositoryModule com 3 repos
- [ ] useCaseModule com 10+ cases
- [ ] Todas dependências injetadas corretamente

### MainActivity
- [ ] Koin inicializado em onCreate
- [ ] PintorPlusTheme aplicado
- [ ] AppNavigation() renderizado
- [ ] AndroidManifest atualizado
- [ ] Deep links configurados (se necessário)

### Testes
- [ ] NavGraph transições testadas
- [ ] ViewModel state updates testados
- [ ] UseCase chamados corretamente
- [ ] Database queries funcionando
- [ ] Mensagens de erro exibidas
- [ ] Loading states visíveis

---

## 🎯 Métricas de Sucesso - Fase 4

| Métrica | Target |
|---------|--------|
| **Rotas Implementadas** | 5/5 (Home, Wizard, Details, Clients, Settings) |
| **ViewModels Criados** | 5/5 com StateFlow |
| **Linhas de Código** | ~2000 linhas |
| **DI Modules** | 4 (DB, Repo, UseCase, Presentation) |
| **Deep Links** | 5 funcionando |
| **Transições** | Customizadas em 3+ rotas |
| **Error Handling** | Em todos ViewModels |
| **Navigation State** | Preservado em back stack |

---

## 🔗 Próxima Fase

**Fase 5: Features & WhatsApp Integration** (7-10 dias)
- WhatsApp intent para compartilhar orçamentos
- Formatação de orçamento para WhatsApp
- Client management avançado
- Offline sync preparação
- Notifications setup

**Data Esperada:** 2026-06-07

---

Fase 4 completa com navegação, ViewModels, DI e integração. Todas as telas conectadas ao estado reativo com Kotlin Flows.

