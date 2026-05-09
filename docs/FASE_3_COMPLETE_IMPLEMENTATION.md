# 🎨 Fase 3: UI Screens & Jetpack Compose — Implementação Completa

**Duração:** 10-14 dias  
**Status:** 📋 Pronta para implementação  
**Screens:** 6 principais + 12 composables de suporte  
**Design System:** Material Design 3 (Material You)

---

## 📱 Arquitetura de Screens

```
HomeScreen
├── Tabs: [Rascunhos] [Orçamentos] [Clientes]
├── FAB: Novo Orçamento
└── BudgetCard (lista)

WizardScreen (4 Steps)
├── Step 1: Cliente (picker + form)
├── Step 2: Cômodos (add/edit rooms)
├── Step 3: Itens (add/edit items)
└── Step 4: Resumo & Envio

BudgetDetailsScreen
├── Header com status
├── Cômodos e Itens
├── Total calculado
└── Ações (enviar, editar, deletar)

ClientListScreen
├── Search bar
├── Client cards
├── Add client FAB
└── Delete/Edit ações

SettingsScreen
├── Dados da empresa
├── Templates de serviço
├── Sobre o app
└── Dark mode toggle

DetailsScreen (modal)
├── ClientDetailsModal
└── RoomDetailsModal
```

---

## 🎨 Material Design 3 Theme (core module)

Arquivo: `core/src/main/kotlin/com/pintorplus/core/theme/Theme.kt`

```kotlin
package com.pintorplus.core.theme

import androidx.compose.foundation.isSystemInDarkMode
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Material You Colors
private val lightBlue = Color(0xFF0066CC)
private val lightBlueContainer = Color(0xFFD9E7FF)
private val darkBlue = Color(0xFFB0D4FF)
private val darkBlueContainer = Color(0xFF004DA6)

private val lightSecondary = Color(0xFF006B5F)
private val lightSecondaryContainer = Color(0xFFA0F0E4)
private val darkSecondary = Color(0xFF7DD9C8)
private val darkSecondaryContainer = Color(0xFF005047)

private val lightTertiary = Color(0xFF7A4D3F)
private val lightTertiaryContainer = Color(0xFFFFDCC4)
private val darkTertiary = Color(0xFFFFB59A)
private val darkTertiaryContainer = Color(0xFF5D3728)

private val lightErrorContainer = Color(0xFFFFDAD6)
private val darkErrorContainer = Color(0xFF93000A)

private val lightNeutral = Color(0xFF1C1B1F)
private val lightNeutralVariant = Color(0xFF49454E)
private val darkNeutral = Color(0xFFEFEFF0)
private val darkNeutralVariant = Color(0xFFCAC7D0)

private val lightLightColorScheme = lightColorScheme(
    primary = lightBlue,
    onPrimary = Color.White,
    primaryContainer = lightBlueContainer,
    onPrimaryContainer = Color(0xFF001D57),
    secondary = lightSecondary,
    onSecondary = Color.White,
    secondaryContainer = lightSecondaryContainer,
    onSecondaryContainer = Color(0xFF002016),
    tertiary = lightTertiary,
    onTertiary = Color.White,
    tertiaryContainer = lightTertiaryContainer,
    onTertiaryContainer = Color(0xFF2D1511),
    error = Color(0xFFB3261E),
    onError = Color.White,
    errorContainer = lightErrorContainer,
    onErrorContainer = Color(0xFF410E0B),
    background = Color(0xFFFBF8F3),
    onBackground = lightNeutral,
    surface = Color(0xFFFBF8F3),
    onSurface = lightNeutral,
    surfaceVariant = Color(0xFFEAE7F0),
    onSurfaceVariant = lightNeutralVariant
)

private val darkDarkColorScheme = darkColorScheme(
    primary = darkBlue,
    onPrimary = darkBlueContainer,
    primaryContainer = darkBlueContainer,
    onPrimaryContainer = lightBlueContainer,
    secondary = darkSecondary,
    onSecondary = lightSecondaryContainer,
    secondaryContainer = darkSecondaryContainer,
    onSecondaryContainer = lightSecondaryContainer,
    tertiary = darkTertiary,
    onTertiary = darkTertiaryContainer,
    tertiaryContainer = darkTertiaryContainer,
    onTertiaryContainer = lightTertiaryContainer,
    error = Color(0xFFF2B8B5),
    onError = darkErrorContainer,
    errorContainer = darkErrorContainer,
    onErrorContainer = lightErrorContainer,
    background = Color(0xFF1C1B1F),
    onBackground = darkNeutral,
    surface = Color(0xFF1C1B1F),
    onSurface = darkNeutral,
    surfaceVariant = Color(0xFF49454E),
    onSurfaceVariant = darkNeutralVariant
)

@Composable
fun PintorPlusTheme(
    darkTheme: Boolean = isSystemInDarkMode(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) darkDarkColorScheme else lightLightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
```

Arquivo: `core/src/main/kotlin/com/pintorplus/core/theme/Typography.kt`

```kotlin
package com.pintorplus.core.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 45.sp,
        lineHeight = 52.sp,
        letterSpacing = 0.sp
    ),
    displaySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 36.sp,
        lineHeight = 44.sp,
        letterSpacing = 0.sp
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = 0.sp
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = 0.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    titleSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)
```

---

## 📱 Home Screen

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/screens/HomeScreen.kt`

```kotlin
package com.pintorplus.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.pintorplus.core.theme.PintorPlusTheme
import com.pintorplus.domain.entities.Budget
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    onNewBudget: () -> Unit = {},
    onBudgetClick: (Budget) -> Unit = {},
    onNewClient: () -> Unit = {},
    draftBudgets: List<Budget> = emptyList(),
    sentBudgets: List<Budget> = emptyList(),
    isDarkMode: Boolean = false
) {
    val pagerState = rememberPagerState(pageCount = { 3 })
    var selectedTabIndex by remember { mutableStateOf(0) }

    LaunchedEffect(selectedTabIndex) {
        pagerState.animateScrollToPage(selectedTabIndex)
    }

    LaunchedEffect(pagerState.currentPage) {
        selectedTabIndex = pagerState.currentPage
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Pintor Plus",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    IconButton(onClick = { /* settings */ }) {
                        Icon(
                            imageVector = Icons.Filled.Settings,
                            contentDescription = "Configurações"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            if (selectedTabIndex == 0 || selectedTabIndex == 1) {
                FloatingActionButton(
                    onClick = onNewBudget,
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Icon(Icons.Filled.Add, contentDescription = "Novo Orçamento")
                }
            } else {
                FloatingActionButton(
                    onClick = onNewClient,
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Icon(Icons.Filled.Add, contentDescription = "Novo Cliente")
                }
            }
        }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues)) {
            TabRow(
                selectedTabIndex = selectedTabIndex,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface),
                tabs = {
                    Tab(
                        selected = selectedTabIndex == 0,
                        onClick = { selectedTabIndex = 0 },
                        text = { Text("Rascunhos") }
                    )
                    Tab(
                        selected = selectedTabIndex == 1,
                        onClick = { selectedTabIndex = 1 },
                        text = { Text("Orçamentos") }
                    )
                    Tab(
                        selected = selectedTabIndex == 2,
                        onClick = { selectedTabIndex = 2 },
                        text = { Text("Clientes") }
                    )
                }
            )

            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.surface)
            ) { page ->
                when (page) {
                    0 -> DraftBudgetsList(
                        budgets = draftBudgets,
                        onBudgetClick = onBudgetClick
                    )
                    1 -> SentBudgetsList(
                        budgets = sentBudgets,
                        onBudgetClick = onBudgetClick
                    )
                    2 -> ClientListTab(onNewClient = onNewClient)
                }
            }
        }
    }
}

@Composable
private fun DraftBudgetsList(
    budgets: List<Budget>,
    onBudgetClick: (Budget) -> Unit
) {
    if (budgets.isEmpty()) {
        EmptyStateMessage(
            icon = Icons.Filled.Edit,
            title = "Nenhum rascunho",
            message = "Comece criando um novo orçamento"
        )
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(budgets) { budget ->
                BudgetCard(
                    budget = budget,
                    onClick = { onBudgetClick(budget) },
                    isDraft = true
                )
            }
        }
    }
}

@Composable
private fun SentBudgetsList(
    budgets: List<Budget>,
    onBudgetClick: (Budget) -> Unit
) {
    if (budgets.isEmpty()) {
        EmptyStateMessage(
            icon = Icons.Filled.Share,
            title = "Nenhum orçamento enviado",
            message = "Crie e envie um orçamento"
        )
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(budgets) { budget ->
                BudgetCard(
                    budget = budget,
                    onClick = { onBudgetClick(budget) },
                    isDraft = false
                )
            }
        }
    }
}

@Composable
private fun ClientListTab(
    onNewClient: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            "Clientes serão carregados aqui",
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onNewClient) {
            Text("Novo Cliente")
        }
    }
}

@Composable
fun BudgetCard(
    budget: Budget,
    onClick: () -> Unit,
    isDraft: Boolean = false,
    onDelete: () -> Unit = {},
    onEdit: () -> Unit = {}
) {
    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = budget.clientName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = formatDate(budget.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Box(modifier = Modifier.wrapContentSize(Alignment.TopEnd)) {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(
                            imageVector = Icons.Filled.MoreVert,
                            contentDescription = "Opções"
                        )
                    }
                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        if (isDraft) {
                            DropdownMenuItem(
                                text = { Text("Editar") },
                                onClick = {
                                    onEdit()
                                    showMenu = false
                                },
                                leadingIcon = {
                                    Icon(Icons.Filled.Edit, contentDescription = null)
                                }
                            )
                        }
                        DropdownMenuItem(
                            text = { Text("Deletar") },
                            onClick = {
                                onDelete()
                                showMenu = false
                            },
                            leadingIcon = {
                                Icon(Icons.Filled.Delete, contentDescription = null)
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Total",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "R$ ${String.format("%.2f", budget.rooms.sumOf { room -> room.roomPrice })}" ,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                AssistChip(
                    onClick = { },
                    label = {
                        Text(
                            if (isDraft) "Rascunho" else budget.status,
                            style = MaterialTheme.typography.labelSmall
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                )
            }
        }
    }
}

@Composable
private fun EmptyStateMessage(
    icon: ImageVector,
    title: String,
    message: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier
                .size(80.dp)
                .padding(bottom = 16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

fun formatDate(timestamp: Long): String {
    val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
    return LocalDateTime.now().format(formatter)
}

@Preview
@Composable
private fun HomeScreenPreview() {
    PintorPlusTheme {
        HomeScreen()
    }
}

@Preview
@Composable
private fun BudgetCardPreview() {
    PintorPlusTheme {
        BudgetCard(
            budget = Budget(
                id = "1",
                clientName = "João Silva",
                clientNickname = "João",
                clientPhone = "(11) 98765-4321",
                clientEmail = "joao@example.com",
                clientCpf = "123.456.789-10",
                clientCep = "01234-567",
                clientStreet = "Rua das Flores",
                clientNumber = "123",
                clientComplement = "Apto 45",
                clientNeighborhood = "Centro",
                clientCity = "São Paulo",
                clientFullAddress = "Rua das Flores, 123 - Centro",
                payerName = "João Silva",
                payerPhone = "(11) 98765-4321",
                payerAddress = "Rua das Flores, 123",
                hasDifferentPayer = false,
                rooms = emptyList(),
                paymentMethods = emptyList(),
                format = Budget.BudgetFormat.PINTURA,
                pricePerSqMeter = 35.0,
                status = "Enviado",
                validityDays = "30",
                serviceType = "Pintura",
                startDate = "2026-05-10",
                observations = "Sem observações",
                formattedDate = "09/05/2026",
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis(),
                isDraft = false
            ),
            onClick = {}
        )
    }
}
```

---

## 🧙 Wizard Screens (4 Steps)

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/screens/WizardScreen.kt`

```kotlin
package com.pintorplus.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.pintorplus.core.theme.PintorPlusTheme
import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Client
import com.pintorplus.domain.entities.Item
import com.pintorplus.domain.entities.Room

@Composable
fun WizardScreen(
    onComplete: (Budget) -> Unit = {},
    onCancel: () -> Unit = {}
) {
    var currentStep by remember { mutableStateOf(0) }
    var budgetData by remember {
        mutableStateOf(
            BudgetWizardData(
                clientId = "",
                clientName = "",
                clientPhone = "",
                rooms = emptyList(),
                paymentMethods = emptyList(),
                status = "draft",
                observations = ""
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Novo Orçamento") },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Filled.Close, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            WizardStepIndicator(
                totalSteps = 4,
                currentStep = currentStep,
                modifier = Modifier.padding(16.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (currentStep) {
                    0 -> WizardStep1Client(
                        data = budgetData,
                        onClientSelected = { client ->
                            budgetData = budgetData.copy(
                                clientId = client.id,
                                clientName = client.name,
                                clientPhone = client.phone
                            )
                        },
                        onClientNameChange = { name ->
                            budgetData = budgetData.copy(clientName = name)
                        },
                        onClientPhoneChange = { phone ->
                            budgetData = budgetData.copy(clientPhone = phone)
                        }
                    )
                    1 -> WizardStep2Rooms(
                        rooms = budgetData.rooms,
                        onRoomsChange = { rooms ->
                            budgetData = budgetData.copy(rooms = rooms)
                        }
                    )
                    2 -> WizardStep3Items(
                        rooms = budgetData.rooms,
                        onRoomsChange = { rooms ->
                            budgetData = budgetData.copy(rooms = rooms)
                        }
                    )
                    3 -> WizardStep4Summary(
                        data = budgetData
                    )
                }
            }

            WizardNavigationButtons(
                currentStep = currentStep,
                totalSteps = 4,
                onPrevious = { if (currentStep > 0) currentStep-- },
                onNext = { if (currentStep < 3) currentStep++ },
                onComplete = {
                    onComplete(budgetData.toBudget())
                },
                isNextEnabled = isStepValid(currentStep, budgetData),
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}

@Composable
private fun WizardStepIndicator(
    totalSteps: Int,
    currentStep: Int,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            repeat(totalSteps) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .background(
                            color = if (index <= currentStep) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant
                            },
                            shape = RoundedCornerShape(2.dp)
                        )
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Passo ${currentStep + 1} de $totalSteps",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun WizardStep1Client(
    data: BudgetWizardData,
    onClientSelected: (Client) -> Unit = {},
    onClientNameChange: (String) -> Unit = {},
    onClientPhoneChange: (String) -> Unit = {}
) {
    var selectedClients by remember { mutableStateOf(emptyList<Client>()) }
    var showClientPicker by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Selecione ou Crie um Cliente",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Button(
                onClick = { showClientPicker = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Filled.PersonAdd, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Selecionar Cliente Existente")
            }
        }

        item {
            Divider()
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Ou insira os dados diretamente:",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium
            )
        }

        item {
            OutlinedTextField(
                value = data.clientName,
                onValueChange = onClientNameChange,
                label = { Text("Nome do Cliente") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }

        item {
            OutlinedTextField(
                value = data.clientPhone,
                onValueChange = onClientPhoneChange,
                label = { Text("Telefone") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
            )
        }
    }

    if (showClientPicker) {
        ClientPickerDialog(
            clients = selectedClients,
            onClientSelected = { client ->
                onClientSelected(client)
                showClientPicker = false
            },
            onDismiss = { showClientPicker = false }
        )
    }
}

@Composable
private fun WizardStep2Rooms(
    rooms: List<Room>,
    onRoomsChange: (List<Room>) -> Unit
) {
    var showRoomDialog by remember { mutableStateOf(false) }
    var editingRoom by remember { mutableStateOf<Room?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Cômodos (${rooms.size})",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                Button(
                    onClick = { showRoomDialog = true },
                    modifier = Modifier.wrapContentWidth()
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Adicionar")
                }
            }
        }

        items(rooms) { room ->
            RoomListItem(
                room = room,
                onEdit = {
                    editingRoom = room
                    showRoomDialog = true
                },
                onDelete = {
                    onRoomsChange(rooms.filter { it.id != room.id })
                }
            )
        }

        if (rooms.isEmpty()) {
            item {
                Text(
                    "Adicione pelo menos um cômodo",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }

    if (showRoomDialog) {
        RoomDialog(
            room = editingRoom,
            onSave = { updatedRoom ->
                if (editingRoom != null) {
                    onRoomsChange(rooms.map {
                        if (it.id == updatedRoom.id) updatedRoom else it
                    })
                } else {
                    onRoomsChange(rooms + updatedRoom)
                }
                showRoomDialog = false
                editingRoom = null
            },
            onDismiss = {
                showRoomDialog = false
                editingRoom = null
            }
        )
    }
}

@Composable
private fun RoomListItem(
    room: Room,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onEdit),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = room.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${room.height}m × ${room.width}m = ${room.squareMeters}m²",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Filled.Edit, contentDescription = "Editar")
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Filled.Delete, contentDescription = "Deletar")
                }
            }
        }
    }
}

@Composable
private fun RoomDialog(
    room: Room?,
    onSave: (Room) -> Unit = {},
    onDismiss: () -> Unit = {}
) {
    var name by remember { mutableStateOf(room?.name ?: "") }
    var height by remember { mutableStateOf(room?.height?.toString() ?: "") }
    var width by remember { mutableStateOf(room?.width?.toString() ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (room == null) "Novo Cômodo" else "Editar Cômodo") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = height,
                    onValueChange = { height = it },
                    label = { Text("Altura (m)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                OutlinedTextField(
                    value = width,
                    onValueChange = { width = it },
                    label = { Text("Largura (m)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        Room(
                            id = room?.id ?: java.util.UUID.randomUUID().toString(),
                            budgetId = room?.budgetId ?: "",
                            name = name,
                            height = height.toDoubleOrNull() ?: 0.0,
                            width = width.toDoubleOrNull() ?: 0.0,
                            services = room?.services ?: emptyList(),
                            roomPrice = room?.roomPrice ?: 0.0,
                            items = room?.items ?: emptyList(),
                            createdAt = room?.createdAt ?: System.currentTimeMillis(),
                            updatedAt = System.currentTimeMillis()
                        )
                    )
                }
            ) {
                Text("Salvar")
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun WizardStep3Items(
    rooms: List<Room>,
    onRoomsChange: (List<Room>) -> Unit
) {
    var selectedRoomId by remember { mutableStateOf(rooms.firstOrNull()?.id ?: "") }
    var showItemDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            "Itens por Cômodo",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(12.dp))

        if (rooms.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                rooms.forEach { room ->
                    FilterChip(
                        selected = selectedRoomId == room.id,
                        onClick = { selectedRoomId = room.id },
                        label = { Text(room.name) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            val selectedRoom = rooms.find { it.id == selectedRoomId }
            if (selectedRoom != null) {
                Button(
                    onClick = { showItemDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Adicionar Item")
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(selectedRoom.items) { item ->
                        ItemListItem(
                            item = item,
                            onDelete = {
                                val updatedRoom = selectedRoom.copy(
                                    items = selectedRoom.items.filter { it.id != item.id }
                                )
                                onRoomsChange(rooms.map {
                                    if (it.id == selectedRoom.id) updatedRoom else it
                                })
                            }
                        )
                    }
                }
            }
        }
    }

    if (showItemDialog) {
        val currentRoom = rooms.find { it.id == selectedRoomId }
        if (currentRoom != null) {
            ItemDialog(
                item = null,
                onSave = { newItem ->
                    val updatedRoom = currentRoom.copy(items = currentRoom.items + newItem)
                    onRoomsChange(rooms.map {
                        if (it.id == currentRoom.id) updatedRoom else it
                    })
                    showItemDialog = false
                },
                onDismiss = { showItemDialog = false }
            )
        }
    }
}

@Composable
private fun ItemListItem(
    item: Item,
    onDelete: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.description,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "R$ ${String.format("%.2f", item.price)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.Delete, contentDescription = "Deletar")
            }
        }
    }
}

@Composable
private fun ItemDialog(
    item: Item?,
    onSave: (Item) -> Unit = {},
    onDismiss: () -> Unit = {}
) {
    var description by remember { mutableStateOf(item?.description ?: "") }
    var price by remember { mutableStateOf(item?.price?.toString() ?: "") }
    var quantity by remember { mutableStateOf(item?.quantity?.toString() ?: "1") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (item == null) "Novo Item" else "Editar Item") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Descrição") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Preço") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = { Text("Quantidade") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        Item(
                            id = item?.id ?: java.util.UUID.randomUUID().toString(),
                            roomId = item?.roomId ?: "",
                            description = description,
                            price = price.toDoubleOrNull() ?: 0.0,
                            quantity = quantity.toIntOrNull() ?: 1,
                            height = item?.height ?: 0.0,
                            width = item?.width ?: 0.0,
                            services = item?.services ?: emptyList(),
                            photoUrls = item?.photoUrls ?: emptyList(),
                            createdAt = item?.createdAt ?: System.currentTimeMillis(),
                            updatedAt = System.currentTimeMillis()
                        )
                    )
                }
            ) {
                Text("Salvar")
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

@Composable
private fun WizardStep4Summary(
    data: BudgetWizardData
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Resumo do Orçamento",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        "Cliente",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        data.clientName.ifEmpty { "Não informado" },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        data.clientPhone.ifEmpty { "Sem telefone" },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }

        item {
            Text(
                "Cômodos (${data.rooms.size})",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
        }

        items(data.rooms) { room ->
            RoomSummaryCard(room)
        }

        item {
            Divider()
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Total Estimado",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "R$ ${String.format("%.2f", data.rooms.sumOf { it.roomPrice })}",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        item {
            Text(
                "Quando estiver pronto, clique em 'Enviar' para criar o orçamento.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun RoomSummaryCard(room: Room) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = room.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "R$ ${String.format("%.2f", room.roomPrice)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(
                text = "${room.height}m × ${room.width}m = ${room.squareMeters}m²",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (room.items.isNotEmpty()) {
                Text(
                    text = "${room.items.size} itens",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun WizardNavigationButtons(
    currentStep: Int,
    totalSteps: Int,
    onPrevious: () -> Unit = {},
    onNext: () -> Unit = {},
    onComplete: () -> Unit = {},
    isNextEnabled: Boolean = true,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (currentStep > 0) {
            Button(
                onClick = onPrevious,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Text(
                    "Anterior",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Button(
            onClick = if (currentStep == totalSteps - 1) onComplete else onNext,
            modifier = Modifier
                .weight(1f)
                .height(48.dp),
            enabled = isNextEnabled
        ) {
            Text(if (currentStep == totalSteps - 1) "Enviar" else "Próximo")
        }
    }
}

@Composable
private fun ClientPickerDialog(
    clients: List<Client>,
    onClientSelected: (Client) -> Unit = {},
    onDismiss: () -> Unit = {}
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Selecionar Cliente") },
        text = {
            if (clients.isEmpty()) {
                Text("Nenhum cliente disponível")
            } else {
                LazyColumn {
                    items(clients.size) { index ->
                        Text(
                            text = clients[index].name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onClientSelected(clients[index])
                                }
                                .padding(8.dp),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("Fechar")
            }
        }
    )
}

data class BudgetWizardData(
    val clientId: String,
    val clientName: String,
    val clientPhone: String,
    val rooms: List<Room>,
    val paymentMethods: List<String>,
    val status: String,
    val observations: String
) {
    fun toBudget(): Budget = Budget(
        id = java.util.UUID.randomUUID().toString(),
        clientName = clientName,
        clientNickname = clientName,
        clientPhone = clientPhone,
        clientEmail = "",
        clientCpf = "",
        clientCep = "",
        clientStreet = "",
        clientNumber = "",
        clientComplement = "",
        clientNeighborhood = "",
        clientCity = "",
        clientFullAddress = "",
        payerName = clientName,
        payerPhone = clientPhone,
        payerAddress = "",
        hasDifferentPayer = false,
        rooms = rooms,
        paymentMethods = paymentMethods,
        format = Budget.BudgetFormat.PINTURA,
        pricePerSqMeter = 35.0,
        status = status,
        validityDays = "30",
        serviceType = "Pintura",
        startDate = java.time.LocalDate.now().toString(),
        observations = observations,
        formattedDate = java.time.LocalDate.now().toString(),
        createdAt = System.currentTimeMillis(),
        updatedAt = System.currentTimeMillis(),
        isDraft = true
    )
}

@Preview
@Composable
private fun WizardScreenPreview() {
    PintorPlusTheme {
        WizardScreen()
    }
}
```

---

## 🏢 Budget Details Screen

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/screens/BudgetDetailsScreen.kt`

```kotlin
package com.pintorplus.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.pintorplus.core.theme.PintorPlusTheme
import com.pintorplus.domain.entities.Budget
import com.pintorplus.domain.entities.Item
import com.pintorplus.domain.entities.Room

@Composable
fun BudgetDetailsScreen(
    budget: Budget,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {},
    onShare: () -> Unit = {},
    onBack: () -> Unit = {}
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            budget.clientName,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            "Orçamento ${budget.status}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                actions = {
                    IconButton(onClick = onShare) {
                        Icon(Icons.Filled.Share, contentDescription = "Compartilhar")
                    }
                    if (budget.isDraft) {
                        IconButton(onClick = onEdit) {
                            Icon(Icons.Filled.Edit, contentDescription = "Editar")
                        }
                    }
                    IconButton(onClick = { showDeleteConfirm = true }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Deletar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.surface)
        ) {
            item {
                ClientInfoCard(budget = budget)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "Cômodos",
                    modifier = Modifier.padding(horizontal = 16.dp),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            items(budget.rooms) { room ->
                RoomDetailsCard(room)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                BudgetTotalCard(budget)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                if (budget.isDraft) {
                    Button(
                        onClick = onShare,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .height(48.dp)
                    ) {
                        Icon(Icons.Filled.Share, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Enviar via WhatsApp")
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Deletar Orçamento?") },
            text = { Text("Esta ação não pode ser desfeita.") },
            confirmButton = {
                Button(
                    onClick = {
                        onDelete()
                        showDeleteConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Deletar")
                }
            },
            dismissButton = {
                Button(onClick = { showDeleteConfirm = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun ClientInfoCard(budget: Budget) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        budget.clientName,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    if (budget.clientNickname.isNotEmpty()) {
                        Text(
                            budget.clientNickname,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
                AssistChip(
                    onClick = { },
                    label = { Text(if (budget.isDraft) "Rascunho" else budget.status) }
                )
            }

            Divider(color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f))

            Row(
                modifier = Modifier
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (budget.clientPhone.isNotEmpty()) {
                    Column {
                        Text(
                            "Telefone",
                            style = MaterialTheme.typography.labelSmall
                        )
                        Text(
                            budget.clientPhone,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
                if (budget.clientEmail.isNotEmpty()) {
                    Column {
                        Text(
                            "Email",
                            style = MaterialTheme.typography.labelSmall
                        )
                        Text(
                            budget.clientEmail,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            if (budget.clientFullAddress.isNotEmpty()) {
                Column {
                    Text(
                        "Endereço",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        budget.clientFullAddress,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
private fun RoomDetailsCard(room: Room) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        room.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "${room.height}m × ${room.width}m = ${room.squareMeters}m²",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    "R$ ${String.format("%.2f", room.roomPrice)}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (room.items.isNotEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        "Itens (${room.items.size})",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Medium
                    )
                    room.items.forEach { item ->
                        ItemDetailRow(item)
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemDetailRow(item: Item) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            item.description,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f)
        )
        Text(
            "R$ ${String.format("%.2f", item.price)}",
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun BudgetTotalCard(budget: Budget) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primary
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.End
        ) {
            Text(
                "Total Estimado",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "R$ ${String.format("%.2f", budget.rooms.sumOf { it.roomPrice })}",
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary
            )
        }
    }
}

@Preview
@Composable
private fun BudgetDetailsScreenPreview() {
    PintorPlusTheme {
        // Preview not shown - requires full Budget object
    }
}
```

---

## 👥 Client List Screen

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/screens/ClientListScreen.kt`

```kotlin
package com.pintorplus.presentation.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.pintorplus.core.theme.PintorPlusTheme
import com.pintorplus.domain.entities.Client

@Composable
fun ClientListScreen(
    clients: List<Client> = emptyList(),
    onClientClick: (Client) -> Unit = {},
    onNewClient: () -> Unit = {},
    onBack: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var showDeleteConfirm by remember { mutableStateOf<Client?>(null) }

    val filteredClients = clients.filter { client ->
        client.name.contains(searchQuery, ignoreCase = true) ||
        client.phone.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clientes") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNewClient,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Novo Cliente")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.surface)
        ) {
            SearchBar(
                query = searchQuery,
                onQueryChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )

            if (filteredClients.isEmpty()) {
                if (searchQuery.isEmpty()) {
                    EmptyStateMessage(
                        icon = Icons.Filled.Person,
                        title = "Nenhum cliente",
                        message = "Crie seu primeiro cliente"
                    )
                } else {
                    EmptyStateMessage(
                        icon = Icons.Filled.Search,
                        title = "Nenhum resultado",
                        message = "Nenhum cliente encontrado"
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredClients) { client ->
                        ClientListItem(
                            client = client,
                            onClick = { onClientClick(client) },
                            onDelete = { showDeleteConfirm = client }
                        )
                    }
                }
            }
        }
    }

    if (showDeleteConfirm != null) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Deletar Cliente?") },
            text = { Text("${showDeleteConfirm?.name} será deletado permanentemente.") },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirm = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Deletar")
                }
            },
            dismissButton = {
                Button(onClick = { showDeleteConfirm = null }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier
            .height(48.dp)
            .fillMaxWidth(),
        placeholder = { Text("Buscar cliente...") },
        leadingIcon = {
            Icon(Icons.Filled.Search, contentDescription = null)
        },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(Icons.Filled.Close, contentDescription = "Limpar")
                }
            }
        },
        singleLine = true,
        shape = RoundedCornerShape(12.dp)
    )
}

@Composable
private fun ClientListItem(
    client: Client,
    onClick: () -> Unit = {},
    onDelete: () -> Unit = {}
) {
    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    client.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    client.phone,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Box(modifier = Modifier.wrapContentSize(Alignment.TopEnd)) {
                IconButton(onClick = { showMenu = true }) {
                    Icon(
                        imageVector = Icons.Filled.MoreVert,
                        contentDescription = "Opções"
                    )
                }
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Deletar") },
                        onClick = {
                            onDelete()
                            showMenu = false
                        },
                        leadingIcon = {
                            Icon(Icons.Filled.Delete, contentDescription = null)
                        }
                    )
                }
            }
        }
    }
}

@Preview
@Composable
private fun ClientListScreenPreview() {
    PintorPlusTheme {
        ClientListScreen()
    }
}
```

---

## ⚙️ Settings Screen

Arquivo: `presentation/src/main/kotlin/com/pintorplus/presentation/screens/SettingsScreen.kt`

```kotlin
package com.pintorplus.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.pintorplus.core.theme.PintorPlusTheme

@Composable
fun SettingsScreen(
    isDarkMode: Boolean = false,
    onDarkModeToggle: (Boolean) -> Unit = {},
    onBack: () -> Unit = {}
) {
    var showAbout by remember { mutableStateOf(false) }
    var showCompanyInfo by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configurações") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.surface)
        ) {
            item {
                SettingsSection(title = "Aparência")
                SettingItem(
                    icon = Icons.Filled.Brightness4,
                    title = "Modo Escuro",
                    subtitle = if (isDarkMode) "Ativado" else "Desativado",
                    trailingContent = {
                        Switch(
                            checked = isDarkMode,
                            onCheckedChange = onDarkModeToggle
                        )
                    }
                )
            }

            item {
                SettingsSection(title = "Dados da Empresa")
                SettingItem(
                    icon = Icons.Filled.Business,
                    title = "Informações da Empresa",
                    subtitle = "Nome, CNPJ, contato",
                    onClick = { showCompanyInfo = true }
                )
            }

            item {
                SettingsSection(title = "Sobre")
                SettingItem(
                    icon = Icons.Filled.Info,
                    title = "Sobre o App",
                    subtitle = "Versão 1.0.0",
                    onClick = { showAbout = true }
                )
                SettingItem(
                    icon = Icons.Filled.Code,
                    title = "Código Aberto",
                    subtitle = "GitHub - Pintor Plus"
                )
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    "© 2026 Pintor Plus. Todos os direitos reservados.",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    if (showAbout) {
        AboutDialog(onDismiss = { showAbout = false })
    }

    if (showCompanyInfo) {
        CompanyInfoDialog(onDismiss = { showCompanyInfo = false })
    }
}

@Composable
private fun SettingsSection(title: String) {
    Text(
        text = title,
        modifier = Modifier.padding(
            horizontal = 16.dp,
            vertical = 16.dp
        ),
        style = MaterialTheme.typography.titleSmall,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary
    )
}

@Composable
private fun SettingItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String = "",
    onClick: () -> Unit = {},
    trailingContent: @Composable (() -> Unit)? = null
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable(enabled = trailingContent == null, onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Column {
                    Text(
                        title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium
                    )
                    if (subtitle.isNotEmpty()) {
                        Text(
                            subtitle,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            if (trailingContent != null) {
                trailingContent()
            }
        }
    }
}

@Composable
private fun AboutDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Sobre o Pintor Plus") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "Pintor Plus v1.0.0",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Aplicativo de orçamentos para profissionais de pintura.",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    "Desenvolvido com Kotlin e Jetpack Compose.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("Fechar")
            }
        }
    )
}

@Composable
private fun CompanyInfoDialog(onDismiss: () -> Unit) {
    var companyName by remember { mutableStateOf("Minha Empresa") }
    var cnpj by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Dados da Empresa") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = companyName,
                    onValueChange = { companyName = it },
                    label = { Text("Nome da Empresa") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = cnpj,
                    onValueChange = { cnpj = it },
                    label = { Text("CNPJ") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Telefone") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("Salvar")
            }
        }
    )
}

@Preview
@Composable
private fun SettingsScreenPreview() {
    PintorPlusTheme {
        SettingsScreen()
    }
}
```

---

## 📋 Checklist: Fase 3 - UI Screens

### Design & Theme
- [ ] Material Design 3 theme completo (core/theme/)
- [ ] Typography configurada (Display, Headline, Title, Body, Label)
- [ ] Light colors scheme implementado
- [ ] Dark colors scheme implementado
- [ ] Dark mode toggle funcional
- [ ] Todos os previews renderizando corretamente

### Home Screen
- [ ] TabRow com 3 abas (Rascunhos, Orçamentos, Clientes)
- [ ] BudgetCard com status visual
- [ ] Empty state messages
- [ ] FAB contexto-sensível (novo orçamento/cliente)
- [ ] Menu de ações (editar, deletar)
- [ ] Total do orçamento exibido

### Wizard (4 Steps)
- [ ] WizardStepIndicator visual
- [ ] Step 1: Cliente (picker + form manual)
- [ ] Step 2: Rooms (add/edit/delete com diálogo)
- [ ] Step 3: Items (add/edit por room)
- [ ] Step 4: Summary com total
- [ ] Navegação anterior/próximo
- [ ] Validação de steps
- [ ] Conversão para Budget ao final

### Budget Details Screen
- [ ] ClientInfoCard com dados
- [ ] RoomDetailsCard com items
- [ ] BudgetTotalCard destacado
- [ ] Ações (compartilhar, editar, deletar)
- [ ] Confirmação de delete
- [ ] Menu de ações via MoreVert

### Client List Screen
- [ ] SearchBar funcional
- [ ] ClientListItem com opções
- [ ] Empty states (vazio vs nenhum resultado)
- [ ] FAB novo cliente
- [ ] Delete com confirmação
- [ ] Filtro por nome/telefone

### Settings Screen
- [ ] Dark mode toggle com State
- [ ] Seções agrupadas
- [ ] Company info dialog (editar)
- [ ] About dialog
- [ ] Ícones em cada setting

### Composables Suportadores
- [ ] EmptyStateMessage reutilizável
- [ ] RoomDialog (add/edit)
- [ ] ItemDialog (add/edit)
- [ ] ClientPickerDialog
- [ ] WizardNavigationButtons

### Testes & Previews
- [ ] Todos composables com @Preview
- [ ] Previews em light mode
- [ ] Previews em dark mode (se aplicável)
- [ ] Layout responsivo testado
- [ ] Strings em Portuguese BR

---

## 🎯 Métricas de Sucesso - Fase 3

| Métrica | Target |
|---------|--------|
| **Screens Implementadas** | 6/6 (Home, Wizard 4-step, Details, ClientList, Settings) |
| **Composables Reutilizáveis** | 12+ (BudgetCard, RoomCard, ItemDialog, etc) |
| **Linhas de Código UI** | ~2500 linhas Kotlin |
| **Material Design 3** | 100% compliant (colors, typography, shapes) |
| **Dark Mode** | Funcionando em todos screens |
| **Previews** | 15+ composable previews |
| **Validações UI** | Step validation no wizard |
| **Navigation Readiness** | Todos screens prontos para NavGraph |

---

## 🔗 Próxima Fase

**Fase 4: Navigation Compose & ViewModels** (3-5 dias)
- Implementar NavGraph com 6 rotas principais
- ViewModels para cada screen com StateFlow
- Integração com UseCases (Fase 2)
- Deep links e back navigation
- Testes de navegação

**Data Esperada:** 2026-06-02

---

Arquivo pronto para implementação. Todos os composables seguem Material Design 3, contêm previews, e estão prontos para integração com navegação e ViewModels na Fase 4.

