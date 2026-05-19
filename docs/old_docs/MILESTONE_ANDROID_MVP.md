# 🚀 Milestone: Android MVP — Migração Pintor Plus

**Status:** ⏱️ In Planning  
**Data de Início:** 2026-05-09  
**Data Estimada de Conclusão:** 2026-06-23 (35-45 dias)  
**Versão Alvo:** Android 10+ (API 29+)  
**Minimum Viable Product (MVP):** Orçamentos + WhatsApp

---

## 📋 Visão Geral

Migrar o Pintor Plus de PWA Web (TypeScript/Vue) para **aplicativo Android nativo** com:
- **Kotlin** + **Jetpack Compose** (Material Design 3)
- **Room Database** (SQLite) para persistência offline
- **Navigation Compose** para roteamento
- **ViewModel + StateFlow** para estado reativo

**Scope MVP:** Gestão de orçamentos (CRUD), integração WhatsApp, tema claro/escuro

---

## 🎯 Objetivos

| Objetivo | Critério de Sucesso |
|----------|-------------------|
| **Performance** | App abre em < 2s, scroll fluido em lista 100+ orçamentos |
| **Offline-first** | Funciona 100% offline, sincroniza ao conectar |
| **Material Design 3** | Todos componentes seguem guidelines MD3 + dynamic colors |
| **Feature Parity** | Todos fluxos principais do web presentes |
| **Play Store Ready** | Build AAB gerada, signed, pronta para publicação |

---

## 📊 Timeline — 6 Fases (35-45 dias)

### **Fase 1: Setup & Project Structure** ⏸️ NEXT
**Duração:** 2-3 dias  
**Data Estimada:** 2026-05-09 a 2026-05-12  
**Status:** Planejada  

**Deliverables:**
- ✅ Android Studio project criado
- ✅ Módulos Gradle estruturados (app, domain, data, presentation, core)
- ✅ Material Design 3 theme configurado
- ✅ Dependencies adicionadas (Room, Compose, Coroutines, Koin)
- ✅ First build executável no emulador

**Arquivos a criar:**
```
android-app/
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── kotlin/com/pintorplus/
│       │   └── MainActivity.kt
│       └── res/
│           ├── values/themes.xml
│           ├── colors.xml
│           └── ...
├── domain/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/domain/
│       ├── entities/
│       ├── repositories/
│       └── usecases/
├── data/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/data/
│       ├── db/
│       ├── datasources/
│       └── repositories/
├── presentation/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/presentation/
│       ├── screens/
│       ├── viewmodels/
│       └── navigation/
├── core/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/core/
│       ├── di/
│       ├── utils/
│       └── base/
└── build-logic/
    └── convention-plugins/
```

**Checklist Fase 1:**
- [ ] Projeto criado no Android Studio
- [ ] Gradle modules configurados (5 módulos)
- [ ] Dependências principais adicionadas
  - [ ] androidx.compose.* (latest)
  - [ ] androidx.room (latest)
  - [ ] androidx.navigation:navigation-compose
  - [ ] kotlinx.coroutines
  - [ ] io.insert-koin:koin-android
- [ ] Theme Material 3 criado em themes.xml
- [ ] Colors.xml com variáveis CSS mapeadas
- [ ] MainActivity com Scaffold básico
- [ ] EmptyState home screen renderizando
- [ ] Build debug executável no emulador

**Notas:**
- Usar Kotlin DSL para build.gradle.kts (não Groovy)
- Seguir Android Modern Architecture (MVVM)
- Convention plugins para reduzir duplicação entre módulos

---

### **Fase 2: Domain Layer & Database** 🔜 PLANNED
**Duração:** 5-7 dias  
**Data Estimada:** 2026-05-12 a 2026-05-19  
**Status:** Não iniciada  

**Deliverables:**
- ✅ Domain entities criadas (Orcamento, Room, Item, Cliente, Config)
- ✅ Repository interfaces definidas
- ✅ Room Database entities e DAOs
- ✅ Database migrations e schema
- ✅ Repositório implementations para local storage

**Arquivos a criar:**
```
domain/src/main/kotlin/com/pintorplus/domain/
├── entities/
│   ├── Budget.kt
│   ├── Room.kt
│   ├── Item.kt
│   ├── Client.kt
│   ├── Supplier.kt
│   ├── Event.kt
│   └── Config.kt
├── repositories/
│   ├── BudgetRepository.kt
│   ├── ClientRepository.kt
│   ├── ConfigRepository.kt
│   └── ...
└── usecases/
    ├── CreateBudgetUseCase.kt
    ├── GetBudgetsUseCase.kt
    ├── EditBudgetUseCase.kt
    ├── DeleteBudgetUseCase.kt
    └── ...

data/src/main/kotlin/com/pintorplus/data/
├── db/
│   ├── AppDatabase.kt
│   ├── migrations/
│   └── ...
├── entities/
│   ├── BudgetEntity.kt
│   ├── RoomEntity.kt
│   └── ...
├── dao/
│   ├── BudgetDao.kt
│   ├── RoomDao.kt
│   └── ...
└── repositories/
    ├── BudgetRepositoryImpl.kt
    └── ...
```

**Checklist Fase 2:**
- [ ] Todos domain entities criados (7 tipos)
- [ ] Todas repository interfaces definidas
- [ ] Room database criado com 5+ tables
- [ ] DAOs com queries para CRUD
- [ ] RepositoryImpl implementations completas
- [ ] Migrations estruturadas (v1, v2, etc)
- [ ] Testes unitários para cálculos de domínio

---

### **Fase 3: UI Screens (Jetpack Compose)** 🔜 PLANNED
**Duração:** 10-14 dias  
**Data Estimada:** 2026-05-19 a 2026-06-02  
**Status:** Não iniciada  

**Screens a desenvolver:**
1. **HomeScreen** — Lista de orçamentos com FAB
2. **BudgetDetailsScreen** — Dados + ações (WhatsApp, deletar)
3. **BudgetWizardScreen** (4 steps)
   - Step 1: Dados do cliente
   - Step 2: Cômodos e itens
   - Step 3: Valores e status
   - Step 4: Revisão
4. **ClientsScreen** — Lista de clientes
5. **SettingsScreen** — Config da empresa
6. **DarkMode Toggle** — Em AppBar

**Material Design 3 Components:**
- Cards, Buttons, FABs
- TextFields, Dialogs, Bottom Sheets
- Lazy lists com sticky headers
- Responsive layouts para tablets

**Checklist Fase 3:**
- [ ] 6 telas principales desenvolvidas
- [ ] Material 3 components em uso
- [ ] Dark mode funcional
- [ ] Previews Compose criadas para cada tela
- [ ] Transições suaves entre telas
- [ ] Loading states implementados

---

### **Fase 4: Navigation & State Management** 🔜 PLANNED
**Duração:** 3-5 dias  
**Data Estimada:** 2026-06-02 a 2026-06-07  
**Status:** Não iniciada  

**Deliverables:**
- ✅ Navigation Compose graph estruturado
- ✅ ViewModels para cada tela
- ✅ StateFlow para estado reativo
- ✅ Back navigation handling

**Checklist Fase 4:**
- [ ] NavGraph criado com todas rotas
- [ ] Deep links configurados
- [ ] 6+ ViewModels implementados
- [ ] StateFlow patterns em uso
- [ ] Back button behavior correto
- [ ] SavedStateHandle para restauração

---

### **Fase 5: Features & Integrations** 🔜 PLANNED
**Duração:** 7-10 dias  
**Data Estimada:** 2026-06-07 a 2026-06-17  
**Status:** Não iniciada  

**Features:**
1. **WhatsApp Integration** — Envio de orçamento resumido
2. **Client Management** — Picker de clientes salvos
3. **Configuration** — Editor de config da empresa
4. **Offline Sync** — Handle connectivity changes
5. **Photo Capture** (opcional para MVP)

**Checklist Fase 5:**
- [ ] WhatsApp intent funcional
- [ ] Client picker implementado
- [ ] Config screen permite editar empresa
- [ ] Offline detection e retry logic
- [ ] Toast/Snackbar notifications

---

### **Fase 6: Testing & Release** 🔜 PLANNED
**Duração:** 5-7 dias  
**Data Estimada:** 2026-06-17 a 2026-06-24  
**Status:** Não iniciada  

**Deliverables:**
- ✅ Testes unitários (domain, repositories)
- ✅ Testes UI (navegação, fluxos críticos)
- ✅ Build release gerada e assinada
- ✅ AAB para Play Store
- ✅ App signing com keystore

**Checklist Fase 6:**
- [ ] 50+ testes unitários passando
- [ ] Testes UI para fluxos principais
- [ ] Code coverage > 60% (domain layer)
- [ ] AAB gerada
- [ ] Release notes redigidas
- [ ] Beta testing com usuários

---

## 🎭 Mapeamento de Entidades (Web → Android)

| Entidade Web | Entity Android | Room Table |
|---|---|---|
| `Orcamento` | `BudgetEntity` | `budgets` |
| `Room` (cômodo) | `RoomEntity` | `rooms` (FK budget_id) |
| `Item` (serviço) | `ItemEntity` | `items` (FK room_id) |
| `Cliente` | `ClientEntity` | `clients` |
| `Fornecedor` | `SupplierEntity` | `suppliers` |
| `Evento` | `EventEntity` | `events` |
| `Config` | `ConfigEntity` | `config` (singleton) |

---

## 🔄 Dependências Entre Fases

```
Fase 1 (Setup)
   ↓
Fase 2 (Domain + DB) ← Depende de Fase 1
   ↓
Fase 3 (UI) ← Depende de Fase 1 + 2
Fase 4 (Nav) ← Depende de Fase 2 + 3 (paralelo)
   ↓
Fase 5 (Features) ← Depende de Fase 4
   ↓
Fase 6 (Testing) ← Depende de todas
```

**Pode paralelizar:** Fase 3 e 4 podem ser feitas em paralelo após Fase 2

---

## 📚 Referências Técnicas

Use estes documentos web como base:

1. **ESTRUTURA_DADOS_ESTADO.md** → Mapear entidades e tipos
2. **FLUXO_NAVEGACAO.md** → Mapear páginas para telas, fluxo para Navigation Compose
3. **CLEAN_ARCHITECTURE_WEB.md** → Padrões de UseCase e Repository
4. **MIGRACAO_ANDROID.md** → Exemplos side-by-side de conversão

---

## 🛠️ Tech Stack Confirmado

| Aspecto | Tecnologia | Versão |
|---------|-----------|--------|
| **Linguagem** | Kotlin | 1.9+ |
| **Build** | Gradle Kotlin DSL | 8.0+ |
| **UI Framework** | Jetpack Compose | Latest |
| **Database** | Room | Latest |
| **Navigation** | Navigation Compose | Latest |
| **State** | ViewModel + StateFlow | Latest |
| **DI** | Koin | Latest |
| **Coroutines** | kotlinx-coroutines | Latest |
| **Min SDK** | Android 10 (API 29) | - |
| **Target SDK** | Android 14 (API 34) | - |

---

## 📞 Responsabilidades

| Fase | Desenvolvedor | Horas Est. |
|-----|---|---|
| Fase 1 | Lead Dev | 16-24h |
| Fase 2 | Lead Dev | 40-56h |
| Fase 3 | UI Dev | 80-112h |
| Fase 4 | Lead Dev | 24-40h |
| Fase 5 | Dev | 56-80h |
| Fase 6 | QA + Lead | 40-56h |
| **TOTAL** | - | **256-368h (6-9 semanas)** |

---

## ⚠️ Riscos & Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---|---|---|
| Room DB migration issues | Média | Alto | Testar migrations cedo (Fase 2) |
| Compose learning curve | Alta | Médio | Usar documentação + exemplos web |
| Performance em lista longa | Baixa | Médio | Usar LazyColumn, pagination |
| WhatsApp integration complexity | Baixa | Médio | Usar native Intent (simples) |

---

## 🎯 Success Metrics (Post-Launch)

- [ ] App baixado 100+ vezes
- [ ] Rating 4.5+ stars
- [ ] Crash rate < 0.1%
- [ ] Performance score (Lighthouse) > 85
- [ ] User retention 7-day > 50%

---

## 📝 Notas Importantes

1. **Não fazer na Fase 1:**
   - ❌ Integração Google Drive
   - ❌ PDF export
   - ❌ Google Calendar
   - ❌ Push notifications

2. **Próximas iterações (Fase 2 do projeto):**
   - Relatórios avançados
   - Sincronização nuvem
   - Analytics
   - A/B testing

3. **Dependência web:**
   - Manter PWA web rodando em paralelo
   - Web é fallback para desktop
   - Compartilhar mesmos tipos TypeScript/Kotlin (via OpenAPI schema?)

---

## 📅 Calendar Marker

| Data | Evento | Status |
|------|--------|--------|
| **2026-05-09** | Milestone criado | ✅ Done |
| **2026-05-12** | Fase 1 concluída | ⏳ Planejada |
| **2026-05-19** | Fase 2 concluída | ⏳ Planejada |
| **2026-06-02** | Fase 3 concluída | ⏳ Planejada |
| **2026-06-07** | Fase 4 concluída | ⏳ Planejada |
| **2026-06-17** | Fase 5 concluída | ⏳ Planejada |
| **2026-06-24** | Fase 6 concluída + MVP ready | ⏳ Planejada |

---

**Milestone Owner:** Wagner Maniatec  
**Last Updated:** 2026-05-09  
**Next Review:** 2026-05-12 (Fase 1 checkpoint)

