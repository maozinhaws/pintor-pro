import React, { useState, useEffect } from 'react';
import { Settings, Home } from 'lucide-react';
import { db } from './Database';
import { Orcamento, Cliente, ConfigEmpresa } from './types';
import TelaInicial from './components/TelaInicial';
import CriarOrcamento from './components/CriarOrcamento';
import ListaClientes from './components/ListaClientes';
import Agenda from './components/Agenda';
import Configuracoes from './components/Configuracoes';
import Login from './components/Login';

type Tela = 'inicial' | 'novo-orcamento' | 'editar-orcamento' | 'clientes' | 'agenda' | 'config' | 'orcamentos';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se tem usuário salvo e se é válido
    const savedUser = localStorage.getItem('pintorpro_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData && userData.uid) {
          setUser(userData);
        }
      } catch (error) {
        localStorage.removeItem('pintorpro_user');
      }
    }
    setLoading(false);
  }, []);
  const [telaAtual, setTelaAtual] = useState<Tela>('inicial');
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [orcamentoEditando, setOrcamentoEditando] = useState<Orcamento | null>(null);
  const [termoPesquisa, setTermoPesquisa] = useState('');

  useEffect(() => {
    // Detectar status online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (user) {
      carregarDados();
      if (isOnline) {
        sincronizarDados();
      }
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isOnline]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('pintorpro_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pintorpro_user');
  };

  // Se ainda está carregando, mostra loading
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#FFFFFF'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const carregarDados = async () => {
    // Sempre carrega dados locais primeiro (mais rápido)
    const orcs = await db.listarOrcamentos();
    const cls = await db.listarClientes();
    const cfg = await db.buscarConfig('empresa');
    
    setOrcamentos(orcs);
    setClientes(cls);
    setConfig(cfg);
  };

  const sincronizarDados = async () => {
    if (!user || !isOnline) return;
    
    try {
      const { listarOrcamentos: fbListarOrcamentos, salvarOrcamento: fbSalvarOrcamento } = await import('./firebaseService');
      
      // Buscar dados locais pendentes de sincronização
      const orcamentosLocais = await db.listarOrcamentos();
      
      // Enviar dados locais para Firebase
      for (const orc of orcamentosLocais) {
        if (!orc.sincronizado) {
          await fbSalvarOrcamento(user.uid, orc);
          // Marcar como sincronizado
          await db.salvarOrcamento({...orc, sincronizado: true});
        }
      }
      
      console.log('✅ Dados sincronizados com sucesso!');
    } catch (error) {
      console.log('❌ Erro na sincronização:', error);
    }
  };

  const handleNovoOrcamento = () => {
    setOrcamentoEditando(null);
    setTelaAtual('novo-orcamento');
  };

  const handleEditarOrcamento = (orc: Orcamento) => {
    setOrcamentoEditando(orc);
    setTelaAtual('editar-orcamento');
  };

  const handleSalvarOrcamento = async (orc: Orcamento) => {
    // Salva localmente sempre
    const orcamentoComSync = {...orc, sincronizado: isOnline};
    await db.salvarOrcamento(orcamentoComSync);
    
    // Se online, tenta salvar no Firebase também
    if (isOnline && user) {
      try {
        const { salvarOrcamento: fbSalvarOrcamento } = await import('./firebaseService');
        await fbSalvarOrcamento(user.uid, orc);
        // Marca como sincronizado
        await db.salvarOrcamento({...orc, sincronizado: true});
      } catch (error) {
        console.log('Salvo offline, será sincronizado quando voltar online');
      }
    }
    
    await carregarDados();
    setTelaAtual('inicial');
  };

  const handleVoltar = () => {
    setTelaAtual('inicial');
    setOrcamentoEditando(null);
  };

  const renderTela = () => {
    switch (telaAtual) {
      case 'inicial':
        return (
          <TelaInicial
            orcamentos={orcamentos}
            onNovoOrcamento={handleNovoOrcamento}
            onEditarOrcamento={handleEditarOrcamento}
            onExcluirOrcamento={async (id) => {
              await db.excluirOrcamento(id);
              await carregarDados();
            }}
            termoPesquisa={termoPesquisa}
            onPesquisar={setTermoPesquisa}
            config={config}
            onNavigate={setTelaAtual}
          />
        );
      case 'novo-orcamento':
      case 'editar-orcamento':
        return (
          <CriarOrcamento
            orcamento={orcamentoEditando}
            clientes={clientes}
            config={config}
            onSalvar={handleSalvarOrcamento}
            onVoltar={handleVoltar}
          />
        );
      case 'clientes':
        return (
          <ListaClientes
            clientes={clientes}
            onVoltar={handleVoltar}
            onAtualizar={carregarDados}
          />
        );
      case 'agenda':
        return (
          <Agenda
            orcamentos={orcamentos}
            onVoltar={handleVoltar}
          />
        );
      case 'orcamentos':
        const verificarDadosPendentes = (orc: Orcamento): boolean => {
          return (!orc.cliente.telefone || orc.cliente.telefone === '') || 
                 (!orc.cliente.endereco || orc.cliente.endereco === '') || 
                 (!orc.cliente.bairrosCidadeEstado || orc.cliente.bairrosCidadeEstado === '');
        };
        
        return (
          <div style={{ minHeight: '100vh', background: '#FFFFFF', padding: '20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button onClick={handleVoltar} style={{ 
                  padding: '12px 20px', 
                  background: '#6366F1', 
                  border: 'none', 
                  borderRadius: '16px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: 'white', 
                  fontWeight: 600,
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                }}>
                  <Home size={20} /> INÍCIO
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#1E293B' }}>ORÇAMENTOS SALVOS</h1>
              </div>
              
              {orcamentos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                  <h3>Nenhum orçamento salvo</h3>
                  <p>Crie seu primeiro orçamento clicando no botão "+CRIAR ORÇAMENTO"</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orcamentos.map((orc) => {
                    const temDadosPendentes = verificarDadosPendentes(orc);
                    return (
                      <div key={orc.id} style={{
                        background: temDadosPendentes ? '#FFF3CD' : '#FFFFFF',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: temDadosPendentes ? '2px solid #F59E0B' : '2px solid #E2E8F0',
                        cursor: 'pointer'
                      }} onClick={() => handleEditarOrcamento(orc)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1E293B' }}>
                              {orc.cliente.nome || 'Sem Nome'}
                            </h4>
                            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0' }}>
                              {new Date(orc.dataCriacao).toLocaleDateString('pt-BR')} • {orc.comodos.length} cômodo(s)
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {temDadosPendentes && (
                              <div style={{
                                background: '#F59E0B',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700
                              }}>
                                DADOS PENDENTES
                              </div>
                            )}
                            <div style={{
                              background: orc.status === 'APROVADO' ? '#10B981' : '#6366F1',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>
                              {orc.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      case 'config':
        return (
          <Configuracoes
            config={config}
            onSalvar={async (cfg) => {
              await db.salvarConfig('empresa', cfg);
              await carregarDados();
            }}
            onVoltar={handleVoltar}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: '"Nunito", system-ui, sans-serif' }}>
      {/* Conteúdo */}
      <div style={{ padding: '16px' }}>
        {renderTela()}
      </div>
    </div>
  );
};

export default App;
