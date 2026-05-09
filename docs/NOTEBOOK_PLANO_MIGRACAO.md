A migração do **Pintor Plus** de um PWA para um aplicativo Android nativo representa uma mudança completa de paradigma, saindo de tecnologias web para o ecossistema moderno do Android com **Kotlin** e **Jetpack Compose** 1\. O processo não é uma conversão automática, mas uma reescrita estratégica focada em performance e experiência nativa 2, 3\.  
Abaixo, apresento o resumo e o plano de migração estruturado com base nos documentos técnicos.

### 1\. Mapeamento Tecnológico (Web vs. Android)

A transição exige a substituição de toda a infraestrutura web por equivalentes nativos 2, 4:  
Aspecto,PWA Web (Atual),Android Nativo (Proposto)  
Linguagem,TypeScript,Kotlin  
Interface (UI),Vue 3 / CSS,Jetpack Compose (Material 3\)  
Armazenamento,LocalStorage,Room Database (SQLite)  
Navegação,Hash Routing / Vue Router,Navigation Compose  
Estado,Pinia / Estado Global,ViewModel \+ StateFlow  
Offline,Service Worker,WorkManager \+ Room

### 2\. O Que é Reutilizado vs. Reescrito

* **Reutilizado:** A **lógica de negócio (Domain Layer)**, as fórmulas de cálculos de área e totais, os padrões de casos de uso (**UseCases**) e as interfaces de repositório 3, 5\.  
* **Reescrito:** Toda a camada de interface (HTML/CSS), sistema de rotas, ícones web e gerenciamento de tarefas em segundo plano 5, 6\.

### 3\. Plano de Migração Estruturado (6 Fases)

O esforço total estimado para o lançamento do MVP é de **35 a 45 dias** 7, 8\.

#### Fase 1: Setup do Projeto (2-3 dias)

* Criação do projeto no Android Studio com Kotlin 8, 9\.  
* Configuração do Gradle e módulos (app, domain, data, presentation) 10, 11\.  
* Implementação do tema **Material Design 3** (cores e tipografia) 8, 9\.

#### Fase 2: Lógica Central e Dados (5-7 dias)

* Criação das entidades do **Room Database** mapeadas do LocalStorage 8, 11\.  
* Tradução das entidades TypeScript para **Kotlin Data Classes** 4, 12\.  
* Implementação dos Repositórios e DAOs 9\.

#### Fase 3: Telas de Interface (UI) (10-14 dias)

* Desenvolvimento das telas prioritárias: **Home**, **Criação de Orçamento (Wizard)**, **Detalhes** e **Configurações** 8, 13\.  
* Uso de componentes nativos do Jetpack Compose para substituir os cards CSS 10\.

#### Fase 4: Navegação e Gerenciamento de Estado (3-5 dias)

* Configuração do gráfico de navegação com **Navigation Compose** 8, 14\.  
* Implementação de **ViewModels** para gerenciar o estado reativo de cada tela 4, 9\.

#### Fase 5: Funcionalidades Avançadas (7-10 dias)

* Integração nativa com **WhatsApp** para envio de resumos (prioridade para substituir PDF no início) 8, 15\.  
* Implementação da gestão de clientes e fornecedores 8, 16\.

#### Fase 6: Testes e Polimento (5-7 dias)

* Execução de testes unitários e de UI 7, 8\.  
* Otimização de performance e geração da build de release (AAB) para a Play Store 8, 16\.

### 4\. Escopo do MVP Android

O foco inicial está no "coração" do produto para garantir agilidade na entrega 13, 17:

* **Gestão de Orçamentos:** Lista, criação e detalhes 18, 19\.  
* **WhatsApp:** Canal principal de saída para propostas e recibos 19, 20\.  
* **Armazenamento:** Persistência local robusta via Room 18, 19\.  
* **Design:** Experiência mobile-first com Material 3 18, 21\.

### 5\. Recomendações de Preparação

Antes de iniciar a codificação em Kotlin, é altamente recomendável:

1. **Refatorar a versão Web para Clean Architecture:** Isolar a lógica de domínio da interface atual facilitará a extração e tradução do código para o Android 22, 23\.  
2. **Extrair UseCases:** Operações como createBudget() devem ser UseCases puros em TypeScript para serem mapeados 1:1 em Kotlin 22, 23\.  
3. **Adiar Funcionalidades Complexas:** Backup no Google Drive, relatórios avançados e geração de PDFs devem ser movidos para a **Fase 2 do projeto Android** (Pós-MVP) 23, 24\.

