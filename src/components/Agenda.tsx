import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, Calendar as CalendarIcon, Home } from 'lucide-react';
import { Orcamento, EventoAgenda } from '../types';
import { db } from '../Database';

interface Props {
  orcamentos: Orcamento[];
  onVoltar: () => void;
}

const Agenda: React.FC<Props> = ({ orcamentos, onVoltar }) => {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date());

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    const evs = await db.listarEventos();
    setEventos(evs);
  };

  const orcamentosComData = orcamentos.filter(o => o.dataPrevisaoInicio);
  const semPrevisao = orcamentos.filter(o => !o.dataPrevisaoInicio && o.status !== 'CANCELADO' && o.status !== 'FINALIZADO');

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias = [];
    
    for (let i = 0; i < primeiroDia.getDay(); i++) {
      dias.push(null);
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia));
    }
    
    return dias;
  };

  const getOrcamentosDoDia = (data: Date) => {
    const dataStr = data.toISOString().split('T')[0];
    return orcamentosComData.filter(o => o.dataPrevisaoInicio === dataStr);
  };

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      paddingBottom: '40px'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px',
        paddingTop: '40px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={onVoltar} style={{ 
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
          <h1 style={{ 
            fontSize: '24px', 
            color: 'white', 
            fontWeight: 800, 
            margin: 0,
            textAlign: 'center',
            flex: 1
          }}>
            AGENDA
          </h1>
          <div style={{ width: '100px' }} /> {/* Spacer */}
        </div>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          backdropFilter: 'blur(20px)'
        }}>

      {/* Controles do calendário */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        background: '#F8FAFC',
        padding: '16px',
        borderRadius: '16px',
        border: '2px solid #E2E8F0'
      }}>
        <button 
          onClick={mesAnterior} 
          style={{ 
            padding: '12px 16px', 
            background: '#6366F1', 
            border: 'none', 
            borderRadius: '12px', 
            color: 'white', 
            cursor: 'pointer', 
            fontWeight: 700,
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s'
          }}
        >
          ←
        </button>
        <h2 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: 800, 
          color: '#1E293B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          onClick={proximoMes} 
          style={{ 
            padding: '12px 16px', 
            background: '#6366F1', 
            border: 'none', 
            borderRadius: '12px', 
            color: 'white', 
            cursor: 'pointer', 
            fontWeight: 700,
            fontSize: '16px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s'
          }}
        >
          →
        </button>
      </div>

      {/* Calendário */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '8px', 
        marginBottom: '32px',
        background: '#F8FAFC',
        padding: '20px',
        borderRadius: '16px',
        border: '2px solid #E2E8F0'
      }}>
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(dia => (
          <div key={dia} style={{ 
            padding: '12px', 
            textAlign: 'center', 
            fontWeight: 700, 
            fontSize: '12px', 
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {dia}
          </div>
        ))}
        {getDiasDoMes().map((data, i) => {
          if (!data) return <div key={i} />;
          const orcs = getOrcamentosDoDia(data);
          const hoje = new Date().toDateString() === data.toDateString();
          
          return (
            <div
              key={i}
              style={{
                padding: '12px',
                background: hoje ? '#6366F1' : orcs.length > 0 ? '#E0E7FF' : 'white',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '14px',
                color: hoje ? 'white' : '#1E293B',
                fontWeight: hoje ? 700 : 600,
                position: 'relative',
                border: orcs.length > 0 && !hoje ? '2px solid #6366F1' : '2px solid transparent',
                transition: 'all 0.3s',
                cursor: orcs.length > 0 ? 'pointer' : 'default'
              }}
            >
              {data.getDate()}
              {orcs.length > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  background: hoje ? 'white' : '#6366F1',
                  borderRadius: '50%'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Obras agendadas */}
      <h3 style={{ 
        margin: '0 0 16px', 
        fontSize: '18px', 
        fontWeight: 800, 
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        OBRAS AGENDADAS
      </h3>
      {orcamentosComData.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px', 
          color: '#94A3B8',
          background: '#F8FAFC',
          borderRadius: '16px',
          border: '2px dashed #E2E8F0',
          marginBottom: '24px'
        }}>
          <CalendarIcon size={48} style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Nenhuma obra agendada</p>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          {orcamentosComData.map(orc => (
            <div key={orc.id} style={{ 
              padding: '20px', 
              background: '#F0F9FF', 
              borderRadius: '16px', 
              marginBottom: '12px',
              border: '2px solid #0EA5E9',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                    {orc.cliente.nome}
                  </h4>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                    📍 {orc.cliente.bairrosCidadeEstado}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#0EA5E9', fontWeight: 700 }}>
                    📅 {new Date(orc.dataPrevisaoInicio!).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const tel = orc.cliente.telefone.replace(/\D/g, '');
                    window.open(`https://wa.me/55${tel}`, '_blank');
                  }}
                  style={{
                    padding: '12px 16px',
                    background: '#25D366',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                    transition: 'all 0.3s'
                  }}
                >
                  <MessageCircle size={16} /> WHATSAPP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sem previsão */}
      <h3 style={{ 
        margin: '0 0 16px', 
        fontSize: '18px', 
        fontWeight: 800, 
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        SEM PREVISÃO DE INÍCIO
      </h3>
      {semPrevisao.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px', 
          color: '#94A3B8',
          background: '#F8FAFC',
          borderRadius: '16px',
          border: '2px dashed #E2E8F0'
        }}>
          <CalendarIcon size={48} style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Nenhuma obra sem previsão</p>
        </div>
      ) : (
        semPrevisao.map(orc => (
          <div key={orc.id} style={{ 
            padding: '20px', 
            background: '#FEF3C7', 
            borderRadius: '16px', 
            marginBottom: '12px',
            border: '2px solid #F59E0B',
            transition: 'all 0.3s'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
              {orc.cliente.nome}
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
              📍 {orc.cliente.bairrosCidadeEstado}
            </p>
          </div>
        ))
      )}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
