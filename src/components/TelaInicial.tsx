import React, { useState } from 'react';
import { Search, Edit2, Trash2, Share2, MoreVertical, MapPin, MessageCircle, FileText, User, Calculator, Users, Calendar, Truck, Package, Mic, Settings } from 'lucide-react';
import { Orcamento, ConfigEmpresa } from '../types';
import { gerarPDF } from '../pdfUtils';

interface Props {
  orcamentos: Orcamento[];
  onNovoOrcamento: () => void;
  onEditarOrcamento: (orc: Orcamento) => void;
  onExcluirOrcamento: (id: number) => void;
  termoPesquisa: string;
  onPesquisar: (termo: string) => void;
  config: ConfigEmpresa | null;
  onNavigate: (tela: 'clientes' | 'agenda' | 'config' | 'orcamentos') => void;
}

const TelaInicial: React.FC<Props> = ({ orcamentos, onNovoOrcamento, onEditarOrcamento, onExcluirOrcamento, termoPesquisa, onPesquisar, config, onNavigate }) => {
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [alertaExclusao, setAlertaExclusao] = useState<{ id: number; tempo: number } | null>(null);
  const [modalDadosPendentes, setModalDadosPendentes] = useState<Orcamento | null>(null);

  const iniciarExclusao = (id: number) => {
    setAlertaExclusao({ id, tempo: 5 });
    const interval = setInterval(() => {
      setAlertaExclusao(prev => {
        if (!prev || prev.id !== id) {
          clearInterval(interval);
          return null;
        }
        if (prev.tempo <= 1) {
          clearInterval(interval);
          return { ...prev, tempo: 0 };
        }
        return { ...prev, tempo: prev.tempo - 1 };
      });
    }, 1000);
  };

  const cancelarExclusao = () => {
    setAlertaExclusao(null);
  };

  const compartilharWhatsApp = (orc: Orcamento) => {
    const texto = gerarTextoWhatsApp(orc, config);
    const telefone = orc.cliente.telefone.replace(/\\D/g, '');
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const gerarTextoWhatsApp = (orc: Orcamento, config: ConfigEmpresa | null): string => {
    let texto = '';
    
    if (config?.mensagemPadrao?.cabecalho) {
      texto += `*${config.nome}*\\n\\n`;
      texto += config.mensagemPadrao.cabecalho.replace('[NOME DO CLIENTE]', orc.cliente.nome) + '\\n\\n';
    }

    texto += `*ORÇAMENTO DE PINTURA*\\n\\n`;
    texto += `*CLIENTE*\\nNome: ${orc.cliente.nome}\\n`;
    
    orc.comodos.forEach((comodo, idx) => {
      texto += `\\n${idx + 1}. *${comodo.nome.toUpperCase()}*\\n`;
      comodo.itens.forEach((item, iIdx) => {
        texto += `   ${iIdx + 1}) ${item.nome}\\n`;
        if (item.descricao) texto += `      ${item.descricao}\\n`;
        if (item.valor) texto += `      Valor: R$ ${parseFloat(item.valor).toFixed(2)}\\n`;
      });
    });

    const valorTotal = orc.comodos.reduce((t, c) => 
      t + c.itens.reduce((t2, i) => t2 + (parseFloat(i.valor) || 0), 0), 0
    );

    if (valorTotal > 0) {
      texto += `\\n*VALOR TOTAL: R$ ${valorTotal.toFixed(2)}*\\n`;
    }

    texto += `\\n*Validade: ${orc.validade} dias*\\n`;

    if (config?.mensagemPadrao?.rodape) {
      texto += `\\n${config.mensagemPadrao.rodape}`;
    }

    return texto;
  };

  const verificarDadosPendentes = (orc: Orcamento): boolean => {
    return (!orc.cliente.telefone || orc.cliente.telefone === '') || 
           (!orc.cliente.endereco || orc.cliente.endereco === '') || 
           (!orc.cliente.bairrosCidadeEstado || orc.cliente.bairrosCidadeEstado === '');
  };

  const abrirMaps = (endereco: string, local: string) => {
    const query = `${endereco}, ${local}`.replace(/\\s/g, '+');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#FFFFFF'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)',
        padding: '20px',
        borderRadius: '0 0 24px 24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              fontSize: '24px', 
              fontWeight: 800, 
              margin: 0,
              letterSpacing: '1px'
            }}>
              PINTOR<span style={{ color: '#3b82f6' }}>PRO</span>
            </h1>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '12px', 
              margin: 0,
              fontWeight: 600
            }}>
              V15.5 INDUSTRIAL
            </p>
          </div>
          <button
            onClick={() => onNavigate('config')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Settings size={20} color="white" />
          </button>
        </div>

        {/* Barra de Busca */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={termoPesquisa}
            onChange={(e) => onPesquisar(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 50px 16px 20px',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              background: 'white',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <Mic size={20} color="#93C5FD" />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '20px' }}>
        {/* Botão Criar Orçamento */}
        <button
          onClick={onNovoOrcamento}
          style={{
            width: '100%',
            padding: '20px',
            background: '#6366F1',
            border: 'none',
            borderRadius: '16px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
          }}
        >
          + CRIAR ORÇAMENTO
        </button>

        {/* Cards de Opções */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px'
        }}>
          {/* Lista de Orçamentos com Dados Pendentes */}
          {orcamentos.filter(orc => verificarDadosPendentes(orc)).length > 0 && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 700, 
                margin: '0 0 16px 0',
                color: '#1E293B'
              }}>
                DADOS PENDENTES
              </h3>
              
              {orcamentos.filter(orc => verificarDadosPendentes(orc)).slice(0, 3).map((orc) => {
                const temDadosPendentes = verificarDadosPendentes(orc);
                return (
                  <div key={orc.id} style={{
                    background: '#FFF3CD',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    border: '2px solid #F59E0B'
                  }} onClick={() => onEditarOrcamento(orc)}>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        margin: 0,
                        color: '#1E293B'
                      }}>
                        {orc.cliente.nome || 'Sem Nome'}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748B',
                        margin: '4px 0 0 0'
                      }}>
                        {new Date(orc.dataCriacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {temDadosPendentes && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalDadosPendentes(orc);
                          }}
                          style={{
                            background: '#F59E0B',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          DADOS PENDENTES
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid de Botões */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {/* Orçamentos */}
            <div
              onClick={() => onNavigate('orcamentos')}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calculator size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                margin: 0,
                color: '#1E293B'
              }}>
                ORÇAMENTOS
              </h3>
            </div>

            {/* Agenda */}
            <div
              onClick={() => onNavigate('agenda')}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                margin: 0,
                color: '#1E293B'
              }}>
                AGENDA
              </h3>
            </div>

            {/* Clientes */}
            <div
              onClick={() => onNavigate('clientes')}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                margin: 0,
                color: '#1E293B'
              }}>
                CLIENTES
              </h3>
            </div>

            {/* Fornecedores */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Truck size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                margin: 0,
                color: '#1E293B'
              }}>
                FORNECEDORES
              </h3>
            </div>

            {/* Serviços */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#EC4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                margin: 0,
                color: '#1E293B'
              }}>
                SERVIÇOS
              </h3>
            </div>

            {/* Materiais */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                margin: 0,
                color: '#1E293B'
              }}>
                MATERIAIS
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dados Pendentes */}
      {modalDadosPendentes && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            width: '100%',
            maxWidth: '500px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Dados Pendentes</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
                Os seguintes dados estão faltando para o cliente <strong>{modalDadosPendentes.cliente.nome}</strong>:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!modalDadosPendentes.cliente.telefone && (
                  <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: '8px', fontSize: '14px' }}>
                    📞 Telefone
                  </div>
                )}
                {!modalDadosPendentes.cliente.endereco && (
                  <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: '8px', fontSize: '14px' }}>
                    📍 Endereço
                  </div>
                )}
                {!modalDadosPendentes.cliente.bairrosCidadeEstado && (
                  <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: '8px', fontSize: '14px' }}>
                    🏘️ Bairro, Cidade e Estado
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setModalDadosPendentes(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F1F5F9',
                  color: '#64748B',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setModalDadosPendentes(null);
                  onEditarOrcamento(modalDadosPendentes);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Corrigir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelaInicial;