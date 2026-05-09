# Plano de Migração: PWA Web → App Android Nativo

**Status**: Análise de Viabilidade  
**Escopo**: Converter Pintor Plus de PWA web para Android nativo com Jetpack Compose  
**Desafio**: Reescrever UI, navigation, e storage em paradigma Android  

---

## 📊 Comparação: Web vs Android

| Aspecto | PWA Web (Atual) | Android Nativo (Proposto) |
|---------|-----------------|--------------------------|
| **Linguagem** | TypeScript/HTML/CSS | Kotlin (Jetpack Compose) |
| **Framework UI** | Vue 3 | Jetpack Compose |
| **Storage** | LocalStorage/IndexedDB | Room Database / DataStore |
| **Navigation** | Vue Router | Navigation Compose |
| **Offline** | Service Worker | WorkManager / Room |
| **Design** | Custom CSS | Material Design 3 |
| **Package** | Progressive Web App | APK/AAB (Google Play) |
| **Entry Point** | index.html | MainActivity.kt |

---

## 🚫 O Que NÃO Será Migrado Diretamente

### ❌ HTML/CSS (Todo será reescrito)
```html
<!-- index.html será DESCARTADO -->
<!-- Componentes Web desaparecem -->
<div class="hero">...</div> <!-- → Compose Column -->
<div class="feat-card">...</div> <!-- → Compose Card -->
```

### ❌ Vue.js (Será substituído por Kotlin)
```typescript
// app.html usa Vue 3
// Será substituído por Jetpack Compose
```

### ❌ Service Worker (Será substituído por WorkManager)
```javascript
// sw.js (PWA offline)
// → WorkManager (Android background tasks)
// → Room Database (local cache)
```

### ❌ Favicons (Será substituído por app icons Android)
```
/public/favicon-*.png → res/drawable/ic_launcher.xml
/public/android-chrome-*.png → res/mipmap-*/ic_launcher.png
```

---

## ✅ O Que Será Reutilizado

### ✓ Lógica de Negócio (Domain Layer)
```kotlin
// domain/entities/Budget.ts → domain/entities/Budget.kt
data class Budget(
    val id: String,
    val clientId: String,
    val title: String,
    val status: BudgetStatus,
    val totalValue: Double
)
```

### ✓ UseCase Pattern
```kotlin
// domain/usecases/CreateBudgetUseCase.ts → Kotlin
class CreateBudgetUseCase(
    private val repository: BudgetRepository
) {
    suspend operator fun invoke(input: CreateBudgetInput): Result<Budget> {
        // Mesma lógica, mas em Kotlin
    }
}
```

### ✓ Repository Interfaces
```kotlin
// domain/repositories/BudgetRepository.ts → Kotlin
interface BudgetRepository {
    suspend fun save(budget: Budget): Result<Unit>
    suspend fun findById(id: String): Result<Budget?>
    suspend fun findAll(): Result<List<Budget>>
}
```

### ✓ Color Scheme & Typography
```kotlin
// Migrar variáveis CSS para Material 3 Color Scheme
// --bl: #7C3AED → primary = Color(0xFF7C3AED)
// --bld: #6D28D9 → onPrimary = Color(0xFF6D28D9)
// Font Sora → Google Sans (Material 3)
```

---

## 🏗️ Estrutura Android Nativa

### Gradle Module Structure
```
pintor-plus-android/
├── app/                          # Android entry point
│   ├── src/main/kotlin/
│   │   ├── MainActivity.kt        # App launch point
│   │   ├── ui/                    # UI Composables
│   │   │   ├── screens/           # Full-screen pages
│   │   │   │   ├── HomeScreen.kt
│   │   │   │   ├── BudgetFormScreen.kt
│   │   │   │   ├── BudgetListScreen.kt
│   │   │   │   └── SettingsScreen.kt
│   │   │   ├── components/        # Reusable components
│   │   │   │   ├── BudgetCard.kt
│   │   │   │   ├── ClientForm.kt
│   │   │   │   └── QuoteButton.kt
│   │   │   └── navigation/        # Navigation graph
│   │   │       └── NavController.kt
│   │   ├── viewmodel/             # State management
│   │   │   ├── BudgetViewModel.kt
│   │   │   ├── ClientViewModel.kt
│   │   │   └── SettingsViewModel.kt
│   │   ├── di/                    # Dependency injection (Koin/Hilt)
│   │   │   └── AppModule.kt
│   │   └── theme/                 # Material 3 theme
│   │       ├── Color.kt
│   │       ├── Typography.kt
│   │       └── Theme.kt
│   ├── src/main/res/
│   │   ├── mipmap/                # App icons
│   │   ├── values/strings.xml     # String resources
│   │   └── values/styles.xml      # (minimal, Compose handles it)
│   └── build.gradle.kts           # Android Gradle
│
├── domain/                         # Pure business logic (reused)
│   └── src/main/kotlin/
│       ├── entities/
│       ├── usecases/
│       └── repositories/
│
├── data/                           # Data layer (reused from web)
│   └── src/main/kotlin/
│       ├── local/                 # Room database
│       │   ├── BudgetDao.kt
│       │   ├── BudgetDatabase.kt
│       │   └── BudgetEntity.kt
│       ├── repository/            # Repository implementations
│       │   └── BudgetRepositoryImpl.kt
│       └── mapper/                # DTO mappers
│           └── BudgetMapper.kt
│
└── build.gradle.kts               # Project root
```

---

## 📱 UI Rewrite: CSS → Jetpack Compose

### 1. Navbar (Hero Section)
**Antes (HTML/CSS):**
```html
<nav class="nav">
  <div class="nav-brand">Pintor<span>+</span></div>
  <button class="nav-cta">Abrir o App</button>
</nav>
```

**Depois (Jetpack Compose):**
```kotlin
@Composable
fun MainAppBar() {
    TopAppBar(
        title = { Text("Pintor Plus") },
        actions = {
            IconButton(onClick = { /* Settings */ }) {
                Icon(Icons.Default.Settings, contentDescription = null)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    )
}
```

### 2. Hero Section (Removed for mobile UX)
**Antes (HTML/CSS):**
```html
<section class="hero">
  <h1 class="hero-title">Orçamentos inteligentes</h1>
  <!-- Mockups phones, texto, botões -->
</section>
```

**Depois**: Simplificado para mobile-first.  
**Novo Home Screen:**
```kotlin
@Composable
fun HomeScreen(viewModel: BudgetViewModel) {
    val budgets by viewModel.budgets.collectAsState(emptyList())
    
    Scaffold(
        topBar = { MainAppBar() },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { /* Navigate to create */ },
                icon = { Icon(Icons.Default.Add, null) },
                text = { Text("Novo Orçamento") }
            )
        }
    ) { innerPadding ->
        LazyColumn(modifier = Modifier.padding(innerPadding)) {
            items(budgets) { budget ->
                BudgetCard(budget = budget)
            }
        }
    }
}
```

### 3. Feature Cards
**Antes:**
```css
.feat-card {
  border: 1.5px solid #E2E8F0;
  border-radius: 20px;
  padding: 28px;
}
```

**Depois:**
```kotlin
@Composable
fun FeatureCard(title: String, description: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

### 4. Navigation Pattern
**Web (Vue Router):**
```typescript
// app.html + router pages
router.push('/budgets')
```

**Android (Navigation Compose):**
```kotlin
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object CreateBudget : Screen("create_budget")
    object BudgetDetail : Screen("budget_detail/{id}") {
        fun createRoute(id: String) = "budget_detail/$id"
    }
    object Settings : Screen("settings")
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    
    NavHost(navController, startDestination = Screen.Home.route) {
        composable(Screen.Home.route) { HomeScreen() }
        composable(Screen.CreateBudget.route) { CreateBudgetScreen() }
        composable(Screen.Settings.route) { SettingsScreen() }
    }
}
```

---

## 💾 Storage: LocalStorage → Room Database

### LocalStorage (Web)
```typescript
localStorage.setItem('budgets', JSON.stringify(budgets));
const budgets = JSON.parse(localStorage.getItem('budgets'));
```

### Room Database (Android)
```kotlin
@Entity(tableName = "budgets")
data class BudgetEntity(
    @PrimaryKey val id: String,
    val clientId: String,
    val title: String,
    val status: String,
    val totalValue: Double,
    val createdAt: Long
)

@Dao
interface BudgetDao {
    @Upsert
    suspend fun upsert(budget: BudgetEntity)

    @Query("SELECT * FROM budgets WHERE id = :id")
    suspend fun getById(id: String): BudgetEntity?

    @Query("SELECT * FROM budgets ORDER BY createdAt DESC")
    fun getAllFlow(): Flow<List<BudgetEntity>>
}

@Database(entities = [BudgetEntity::class], version = 1)
abstract class BudgetDatabase : RoomDatabase() {
    abstract fun budgetDao(): BudgetDao
}
```

---

## 🔄 State Management

### Web (Pinia/Vuex)
```typescript
// Pintor Plus atual usa localStorage
// Possível: Pinia store
```

### Android (ViewModel + StateFlow)
```kotlin
class BudgetViewModel(
    private val createBudgetUseCase: CreateBudgetUseCase,
    private val getBudgetsUseCase: GetBudgetsUseCase
) : ViewModel() {
    
    private val _budgets = MutableStateFlow<List<Budget>>(emptyList())
    val budgets: StateFlow<List<Budget>> = _budgets.asStateFlow()

    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    init {
        loadBudgets()
    }

    private fun loadBudgets() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            val result = getBudgetsUseCase()
            _uiState.value = when {
                result.isSuccess -> UiState.Success(result.getOrNull() ?: emptyList())
                else -> UiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    fun createBudget(budget: Budget) {
        viewModelScope.launch {
            createBudgetUseCase(budget)
        }
    }
}

sealed class UiState {
    object Loading : UiState()
    data class Success(val budgets: List<Budget>) : UiState()
    data class Error(val message: String) : UiState()
}
```

---

## 🎨 Material Design 3 Theme

### Web (CSS Variables)
```css
:root {
    --bl: #7C3AED;      /* Primary */
    --bld: #6D28D9;     /* Primary Dark */
    --gn: #10B981;      /* Green */
    --ink: #0F172A;     /* On Surface */
    --bg: #F8FAFC;      /* Background */
}
```

### Android (Kotlin)
```kotlin
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF7C3AED),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEADDFF),
    onPrimaryContainer = Color(0xFF21005D),
    secondary = Color(0xFF625B71),
    onSecondary = Color.White,
    tertiary = Color(0xFF7D5260),
    onTertiary = Color.White,
    surface = Color(0xFFFFFBFE),
    onSurface = Color(0xFF1C1B1F),
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF8B5CF6),
    onPrimary = Color(0xFF0F172A),
    primaryContainer = Color(0xFF4C1D95),
    // ... mais cores
)

@Composable
fun PintorPlusTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
```

---

## 📥 Android Gradle Dependencies

```kotlin
// build.gradle.kts (app level)
dependencies {
    // Jetpack Compose
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("androidx.compose.material3:material3:1.1.0")
    implementation("androidx.compose.foundation:foundation:1.6.0")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.0")

    // ViewModel & State
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.6.0")

    // Room Database
    implementation("androidx.room:room-runtime:2.5.0")
    implementation("androidx.room:room-ktx:2.5.0")
    kapt("androidx.room:room-compiler:2.5.0")

    // Dependency Injection
    implementation("io.insert-koin:koin-android:3.4.0")
    implementation("io.insert-koin:koin-androidx-compose:3.4.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.0")

    // Testing
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:1.6.0")
    testImplementation("junit:junit:4.13.2")
}
```

---

## 🚀 Migração em Fases

### Fase 1: Setup Android Project
- [ ] Criar novo Android Project com Kotlin
- [ ] Setup Gradle, dependencies
- [ ] Configure tema Material 3

### Fase 2: Core Features
- [ ] Room Database + DAOs
- [ ] Domain Layer (entities, usecases, repositories)
- [ ] Data Layer (repository implementations)

### Fase 3: UI Screens
- [ ] Home Screen (lista de orçamentos)
- [ ] Create Budget Screen
- [ ] Budget Detail Screen
- [ ] Settings Screen

### Fase 4: Navigation & State
- [ ] Navigation Compose graph
- [ ] ViewModels para cada screen
- [ ] State management com StateFlow

### Fase 5: Advanced Features
- [ ] WhatsApp integration
- [ ] Receipt generation
- [ ] Client management
- [ ] Supplier management

### Fase 6: Testing & Polish
- [ ] Unit tests
- [ ] UI tests
- [ ] Performance optimization
- [ ] Release build

---

## 📋 Arquivos que Desaparecem

```
❌ index.html          → Não existe no Android
❌ app.html            → Convertido para Kotlin Composables
❌ sw.js               → WorkManager + Room
❌ app.css             → Material 3 Theme (Kotlin)
❌ vite.config.ts      → Android Gradle
❌ tsconfig.json       → Kotlin compiler
❌ package.json        → build.gradle.kts
❌ /public/*           → /app/src/main/res/
```

---

## 📋 Arquivos que Mudam de Linguagem

| Arquivo | Antes (Web) | Depois (Android) |
|---------|-------------|-----------------|
| domain/entities/* | TypeScript | Kotlin |
| domain/usecases/* | TypeScript | Kotlin |
| data/repositories/* | TypeScript | Kotlin |
| Storage | LocalStorage | Room Database |
| Navigation | Vue Router | Navigation Compose |
| State | Pinia/Ref | ViewModel/StateFlow |
| UI | Vue Components | Composables |
| Theme | CSS + Tailwind | Material 3 |

---

## ⏱️ Estimativa de Esforço

| Fase | Estimativa | Notas |
|------|-----------|-------|
| Setup | 2-3 dias | Project structure, dependencies |
| Core logic | 5-7 dias | Domain, data layers (reutilizável) |
| UI screens | 10-14 dias | 5+ screens, Material 3 design |
| Navigation | 3-5 dias | Nav Compose, deep linking |
| Features | 7-10 dias | WhatsApp, receipts, clients |
| Testing | 5-7 dias | Unit + UI tests |
| **Total** | **~35-45 dias** | ~1.5-2 meses solo |

---

## 💡 Recomendações

### ✅ Fazer Primeiro
1. **Manter PWA como está** — continua servindo web/desktop
2. **Criar novo projeto Android** em paralelo
3. **Reutilizar domain layer** (business logic)
4. **Usar Room Database** para sincronização

### ⚠️ Cuidados
- **Não será 100% feature-parity** no início
- **Material Design 3** é diferente de Web design
- **Testing** é mais crítico em Android (play store compliance)
- **Publishing** exige assinatura digital APK

### 🎯 Abordagem Recomendada
**MVP Android** (2-3 meses):
- Home + Create Budget
- Budget List + Detail
- Settings
- WhatsApp share

**Depois (Phase 2)**:
- Clients management
- Suppliers management
- Advanced reports
- Backup/sync

---

## 🔗 Referências

- [Jetpack Compose Documentation](https://developer.android.com/jetpack/compose)
- [Material Design 3](https://m3.material.io/)
- [Room Database](https://developer.android.com/training/data-storage/room)
- [Navigation Compose](https://developer.android.com/jetpack/compose/navigation)
- [Android ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel)
