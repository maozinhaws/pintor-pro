import React, { useState } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2, User, Home } from 'lucide-react';
import { Cliente } from '../types';
import { db } from '../Database';

interface Props {
  clientes: Cliente[];
  onVoltar: () => void;
  onAtualizar: () => void;
}

const ListaClientes: React.FC<Props> = ({ clientes, onVoltar, onAtualizar }) => {
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [alertaExclusao, setAlertaExclusao] = useState<{ id: number; tempo: number } | null>(null);

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

  const salvarCliente = async () => {
    if (editando) {
      await db.salvarCliente(editando);
      setEditando(null);
      onAtualizar();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      paddingBottom: '40px'
    }}>
      {/* Modal de Alerta de Exclusão */}
      {alertaExclusao && (
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
            maxWidth: '400px',
            overflow: 'hidden',
            borderTop: '8px solid #EF4444'
          }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '64px',
                width: '64px',
                borderRadius: '50%',
                background: '#fee2e2'
              }}>
                <span style={{ fontSize: '32px' }}>⚠️</span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>
                EXCLUIR CLIENTE?
              </h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
                Você tem certeza? Esta ação não pode ser desfeita.
              </p>
              
              {alertaExclusao.tempo > 0 && (
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#EF4444', marginBottom: '24px' }}>
                  Aguarde {alertaExclusao.tempo}s
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={cancelarExclusao}
                  style={{
                    padding: '12px 24px',
                    background: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => {
                    if (alertaExclusao.tempo === 0) {
                      db.excluirCliente(alertaExclusao.id).then(onAtualizar);
                      setAlertaExclusao(null);
                    }
                  }}
                  disabled={alertaExclusao.tempo > 0}
                  style={{
                    padding: '12px 24px',
                    background: alertaExclusao.tempo === 0 ? '#EF4444' : '#CBD5E1',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: alertaExclusao.tempo === 0 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    boxShadow: alertaExclusao.tempo === 0 ? '0 4px 12px rgba(239,68,68,0.3)' : 'none'
                  }}
                >
                  {alertaExclusao.tempo === 0 ? 'ENTENDI, EXCLUIR' : 'BLOQUEADO'}
                </button>
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px', textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                Esta ação é irreversível
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)',
        padding: '20px',
        borderRadius: '0 0 24px 24px'
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
            CLIENTES
          </h1>
          <div style={{ width: '100px' }} /> {/* Spacer */}
        </div>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}>

      {editando ? (
        <div style={{ 
          background: '#F0F9FF', 
          padding: '24px', 
          borderRadius: '16px', 
          marginBottom: '20px',
          border: '2px solid #6366F1'
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
            {editando.id ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'}
          </h3>
          {['nome', 'telefone', 'email', 'endereco', 'complemento', 'bairrosCidadeEstado', 'cpfCnpj'].map(field => (
            <div key={field} style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#64748B',
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {field === 'bairrosCidadeEstado' ? 'BAIRRO, CIDADE - ESTADO' : 
                 field === 'cpfCnpj' ? 'CPF OU CNPJ' : field.toUpperCase()}
              </label>
              <input 
                type={field === 'email' ? 'email' : field === 'telefone' ? 'tel' : 'text'} 
                placeholder={
                  field === 'nome' ? 'Nome completo' :
                  field === 'telefone' ? '(11) 99999-9999' :
                  field === 'email' ? 'email@exemplo.com' :
                  field === 'endereco' ? 'Rua, número' :
                  field === 'complemento' ? 'Apto, bloco, etc.' :
                  field === 'bairrosCidadeEstado' ? 'Centro, São Paulo - SP' :
                  field === 'cpfCnpj' ? '000.000.000-00' : ''
                }
                value={(editando as any)[field] || ''} 
                onChange={e => setEditando({...editando, [field]: e.target.value})} 
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  border: '2px solid #E2E8F0', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  boxSizing: 'border-box',
                  background: 'white',
                  transition: 'all 0.3s'
                }}
                onFocus={e => e.currentTarget.style.border = '2px solid #6366F1'}
                onBlur={e => e.currentTarget.style.border = '2px solid #E2E8F0'}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button 
              onClick={salvarCliente} 
              style={{ 
                flex: 1, 
                padding: '16px', 
                background: '#10B981', 
                border: 'none', 
                borderRadius: '12px', 
                color: 'white', 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s'
              }}
            >
              SALVAR
            </button>
            <button 
              onClick={() => setEditando(null)} 
              style={{ 
                flex: 1, 
                padding: '16px', 
                background: 'rgba(255,255,255,0.1)', 
                border: '2px solid #64748B', 
                borderRadius: '12px', 
                color: '#64748B', 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s'
              }}
            >
              CANCELAR
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setEditando({ nome: '', telefone: '', endereco: '', complemento: '', bairrosCidadeEstado: '', cpfCnpj: '' })} 
          style={{ 
            width: '100%', 
            padding: '18px', 
            background: '#10B981', 
            border: 'none', 
            borderRadius: '16px', 
            color: 'white', 
            fontWeight: 700, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px', 
            marginBottom: '24px',
            fontSize: '16px',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s'
          }}
        >
          <Plus size={20} /> NOVO CLIENTE
        </button>
      )}

      {clientes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#94A3B8',
          background: '#F8FAFC',
          borderRadius: '16px',
          border: '2px dashed #E2E8F0'
        }}>
          <User size={48} style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Nenhum cliente cadastrado</p>
        </div>
      ) : (
        clientes.map(c => (
          <div key={c.id} style={{ 
            padding: '20px', 
            background: '#F8FAFC', 
            borderRadius: '16px', 
            marginBottom: '12px',
            border: '2px solid #E2E8F0',
            transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>
                    {c.nome}
                  </h3>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                    📞 {c.telefone}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#94A3B8' }}>
                    📍 {c.bairrosCidadeEstado}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setEditando(c)} 
                    style={{ 
                      padding: '12px', 
                      background: '#6366F1', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: 'white', 
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => iniciarExclusao(c.id!)} 
                    style={{ 
                      padding: '12px', 
                      background: '#EF4444', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: 'white', 
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
        ))
      )}
        </div>
      </div>
    </div>
  );
};

export default ListaClientes;
