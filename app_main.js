// ============================================
// PINTOR PLUS - MAIN APPLICATION LOGIC
// ============================================

// Main application class
class PintorPlusApp {
  constructor() {
    this.guestMode = false;
    this._sessionLoaded = false;
    this._restoringSession = false;
    this.currentView = 'dashboard';
    this.init();
  }

  init() {
    console.log('[PP-APP] Initializing Pintor Plus App');
    this.loadEventListeners();
    this.checkSession();
    this.applyTheme();
  }

  applyTheme() {
    try {
      const savedTheme = sessionStorage.getItem('pp-theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');

      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (event) => {
          // Keep user preference if explicitly set.
          if (!sessionStorage.getItem('pp-theme')) {
            document.documentElement.classList.toggle('dark', event.matches);
          }
        });
      }
    } catch (error) {
      console.warn('[PP-APP] Failed to apply theme, continuing with default:', error);
    }
  }

  loadEventListeners() {
    // App initialization listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeUI();
      });
    } else {
      // DOM already ready when app instance bootstraps.
      this.initializeUI();
    }

    // Resize listener for responsive adjustments
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Visibility change listener (for PWA)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.onAppResume();
      }
    });
  }

  initializeUI() {
    console.log('[PP-APP] UI initialized');
    this.renderCurrentView();
  }

  handleResize() {
    // Handle responsive layout changes
    const isMobile = window.innerWidth < 768;
    // Apply mobile-specific adjustments if needed
  }

  onAppResume() {
    // Refresh data when app comes back to foreground
    if (this.guestMode || this._sessionLoaded) {
      this.refreshData();
    }
  }

  checkSession() {
    console.log('[PP-APP] Checking session status');
    // Check for existing session in localStorage.
    // Primary key: pp-session (canonical).
    // Legacy fallback: pp_session (backward compatibility).
    const sessionData = localStorage.getItem('pp-session') || localStorage.getItem('pp_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.token && parsed.expires > Date.now()) {
          this._sessionLoaded = true;
          console.log('[PP-APP] Valid session found');
          this.loadUserData(parsed);
        } else {
          console.log('[PP-APP] Session expired or invalid');
          this.clearSession();
        }
      } catch (error) {
        console.error('[PP-APP] Error parsing session data:', error);
        this.clearSession();
      }
    } else {
      console.log('[PP-APP] No session found');
    }
  }

  loadUserData(sessionData) {
    // Load user data from session
    console.log('[PP-APP] Loading user data');
    // This would typically load user profile, settings, etc.
  }

  clearSession() {
    console.log('[PP-APP] Clearing session');
    localStorage.removeItem('pp-session');
    localStorage.removeItem('pp_session');
    this._sessionLoaded = false;
  }

  setGuestMode(isGuest) {
    this.guestMode = isGuest;
    console.log('[PP-APP] Guest mode set to:', isGuest);
    if (isGuest) {
      this._sessionLoaded = true; // Guest mode is considered "logged in"
      this.initializeGuestData();
    }
    this.renderCurrentView();
  }

  initializeGuestData() {
    // Initialize default data for guest mode
    console.log('[PP-APP] Initializing guest data');
    // Set up default/sample data for guest users
  }

  refreshData() {
    console.log('[PP-APP] Refreshing data');
    // Refresh all data views
  }

  renderCurrentView() {
    console.log('[PP-APP] Rendering view:', this.currentView);
    const appRoot = document.getElementById('app-root');
    if (!appRoot) return;

    // Clear current content
    appRoot.innerHTML = '';

    // Render based on current view
    switch (this.currentView) {
      case 'dashboard':
        appRoot.innerHTML = this.renderDashboard();
        break;
      case 'orcamentos':
        appRoot.innerHTML = this.renderOrcamentos();
        break;
      case 'clientes':
        appRoot.innerHTML = this.renderClientes();
        break;
      case 'fornecedores':
        appRoot.innerHTML = this.renderFornecedores();
        break;
      case 'produtos':
        appRoot.innerHTML = this.renderProdutos();
        break;
      case 'agenda':
        appRoot.innerHTML = this.renderAgenda();
        break;
      case 'configuracoes':
        appRoot.innerHTML = this.renderConfiguracoes();
        break;
      default:
        appRoot.innerHTML = this.renderDashboard();
    }

    // Initialize view-specific components
    this.initViewComponents();
  }

  setView(view) {
    this.currentView = view;
    this.renderCurrentView();
  }

  renderDashboard() {
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <h1>Pintor Plus</h1>
          <div class="dashboard-actions">
            <button onclick="app.setView('orcamentos')" class="btn btn-sm">+ Novo Orçamento</button>
          </div>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <h3>Orçamentos este mês</h3>
            <p class="stat-value">12</p>
          </div>
          <div class="stat-card">
            <h3>Clientes ativos</h3>
            <p class="stat-value">8</p>
          </div>
          <div class="stat-card">
            <h3>Serviços pendentes</h3>
            <p class="stat-value">3</p>
          </div>
          <div class="stat-card">
            <h3>Recebimentos</h3>
            <p class="stat-value">R$ 2.450,00</p>
          </div>
        </div>

        <div class="dashboard-recent">
          <h2>Atividade recente</h2>
          <div class="recent-items">
            <!-- Recent items would be populated dynamically -->
            <p class="text-muted">Nenhuma atividade recente</p>
          </div>
        </div>
      </div>
    `;
  }

  renderOrcamentos() {
    return `
      <div class="orcamentos-view">
        <div class="view-header">
          <h1>Orçamentos</h1>
          <div class="view-actions">
            <button onclick="app.setView('dashboard')" class="btn btn-outline">← Voltar</button>
            <button onclick="app.setView('orcamentos')" class="btn btn-primary">+ Novo Orçamento</button>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" placeholder="Pesquisar orçamentos..." id="orcamentos-search" />
        </div>

        <div class="filters">
          <select id="orcamentos-filter-status">
            <option value="all">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviado">Enviado</option>
            <option value="aprovado">Aprovado</option>
            <option value="finalizado">Finalizado</option>
          </select>

          <select id="orcamentos-filter-date">
            <option value="all">Todos os períodos</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </select>
        </div>

        <div class="orcamentos-list">
          <!-- Orçamentos would be populated dynamically -->
          <div class="empty-state">
            <h3>Nenhum orçamento encontrado</h3>
            <p>Clique em "+ Novo Orçamento" para criar seu primeiro orçamento</p>
          </div>
        </div>
      </div>
    `;
  }

  renderClientes() {
    return `
      <div class="clientes-view">
        <div class="view-header">
          <h1>Clientes</h1>
          <div class="view-actions">
            <button onclick="app.setView('dashboard')" class="btn btn-outline">← Voltar</button>
            <button onclick="app.setView('clientes')" class="btn btn-primary">+ Novo Cliente</button>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" placeholder="Pesquisar clientes..." id="clientes-search" />
        </div>

        <div class="clientes-list">
          <!-- Clientes would be populated dynamically -->
          <div class="empty-state">
            <h3>Nenhum cliente encontrado</h3>
            <p>Clique em "+ Novo Cliente" para adicionar seu primeiro cliente</p>
          </div>
        </div>
      </div>
    `;
  }

  renderFornecedores() {
    return `
      <div class="fornecedores-view">
        <div class="view-header">
          <h1>Fornecedores</h1>
          <div class="view-actions">
            <button onclick="app.setView('dashboard')" class="btn btn-outline">← Voltar</button>
            <button onclick="app.setView('fornecedores')" class="btn btn-primary">+ Novo Fornecedor</button>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" placeholder="Pesquisar fornecedores..." id="fornecedores-search" />
        </div>

        <div class="fornecedores-list">
          <!-- Fornecedores would be populated dynamically -->
          <div class="empty-state">
            <h3>Nenhum fornecedor encontrado</h3>
            <p>Clique em "+ Novo Fornecedor" para adicionar seu primeiro fornecedor</p>
          </div>
        </div>
      </div>
    `;
  }

  renderProdutos() {
    return `
      <div class="produtos-view">
        <div class="view-header">
          <h1>Produtos e Serviços</h1>
          <div class="view-actions">
            <button onclick="app.setView('dashboard')" class="btn btn-outline">← Voltar</button>
            <button onclick="app.setView('produtos')" class="btn btn-primary">+ Novo Produto</button>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" placeholder="Pesquisar produtos..." id="produtos-search" />
        </div>

        <div class="produtos-list">
          <!-- Produtos would be populated dynamically -->
          <div class="empty-state">
            <h3>Nenhum produto encontrado</h3>
            <p>Clique em "+ Novo Produto" para adicionar seu primeiro produto</p>
          </div>
        </div>
      </div>
    `;
  }

  renderAgenda() {
    return `
      <div class="agenda-view">
        <div class="view-header">
          <h1>Agenda</h1>
          <div class="view-actions">
            <button onclick="app.setView('dashboard')" class="btn btn-outline">← Voltar</button>
            <button onclick="app.setView('agenda')" class="btn btn-primary">+ Novo Agendamento</button>
          </div>
        </div>

        <div class="agenda-filters">
          <div class="date-range">
            <input type="date" id="agenda-date-start" />
            <span>a</span>
            <input type="date" id="agenda-date-end" />
          </div>

          <select id="agenda-filter-type">
            <option value="all">Todos os tipos</option>
            <option value="orcamento">Orçamento</option>
            <option value="servico">Serviço</option>
            <option value="reuniao">Reunião</option>
          </select>
        </div>

        <div class="agenda-calendar">
          <!-- Calendar would be implemented with a library or custom code -->
          <div class="calendar-placeholder">
            <h3>Calendário</h3>
            <p>Visualização da agenda em desenvolvimento</p>
          </div>
        </div>

        <div class="agenda-list">
          <!-- Agendamentos would be populated dynamically -->
          <div class="empty-state">
            <h3>Nenhum agendamento encontrado</h3>
            <p>Clique em "+ Novo Agendamento" para criar seu primeiro agendamento</p>
          </div>
        </div>
      </div>
    `;
  }

  renderConfiguracoes() {
    return `
      <div class="configuracoes-view">
        <div class="view-header">
          <h1>Configurações</h1>
        </div>

        <div class="config-section">
          <h3>Dados da Empresa</h3>
          <div class="config-fields">
            <div class="field-group">
              <label>Nome da Empresa</label>
              <input type="text" id="config-company-name" placeholder="Nome da sua empresa" />
            </div>

            <div class="field-group">
              <label>CNPJ</label>
              <input type="text" id="config-cnpj" placeholder="00.000.000/0000-00" />
            </div>

            <div class="field-group">
              <label>Endereço</label>
              <input type="text" id="config-address" placeholder="Rua, número, bairro, cidade" />
            </div>

            <div class="field-group">
              <label>Telefone</label>
              <input type="tel" id="config-phone" placeholder="(00) 0000-0000" />
            </div>

            <div class="field-group">
              <label>Email</label>
              <input type="email" id="config-email" placeholder="contato@suaempresa.com" />
            </div>
          </div>
        </div>

        <div class="config-section">
          <h3>Preferências do Sistema</h3>
          <div class="config-fields">
            <div class="field-group">
              <label>Moeda padrão</label>
              <select id="config-currency">
                <option value="BRL">Real Brasileiro (R$)</option>
                <option value="USD">Dólar Americano ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            <div class="field-group">
              <label>Formato de data</label>
              <select id="config-date-format">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div class="field-group">
              <label>Backup automático</label>
              <div class="toggle-switch">
                <input type="checkbox" id="config-auto-backup" />
                <span class="slider"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <h3>Segurança</h3>
          <div class="config-fields">
            <div class="field-group">
              <button onclick="app.signOut()" class="btn btn-outline btn-danger">Sair da conta</button>
            </div>
          </div>
        </div>

        <div class="config-actions">
          <button onclick="app.saveConfig()" class="btn btn-primary">Salvar alterações</button>
        </div>
      </div>
    `;
  }

  signOut() {
    console.log('[PP-APP] User signed out');
    this.clearSession();
    this.guestMode = false;
    this.setView('dashboard');
    showToast('Você saiu da conta', 'info');
  }

  saveConfig() {
    console.log('[PP-APP] Saving configuration');
    // Save configuration to localStorage
    showToast('Configurações salvas com sucesso', 'success');
  }

  initViewComponents() {
    // Initialize any view-specific components like charts, editors, etc.
    // This would be called after rendering each view
  }
}

// Global app instance
let app = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  app = new PintorPlusApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PintorPlusApp;
}
