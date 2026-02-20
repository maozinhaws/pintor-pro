import React, { useState } from 'react';
import { ChevronLeft, Save, Upload, Home } from 'lucide-react';
import { ConfigEmpresa } from '../types';

interface Props {
  config: ConfigEmpresa | null;
  onSalvar: (config: ConfigEmpresa) => void;
  onVoltar: () => void;
}

const Configuracoes: React.FC<Props> = ({ config, onSalvar, onVoltar }) => {
  const [cfg, setCfg] = useState<ConfigEmpresa>(config || {
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    cnpj: '',
    mensagemPadrao: {
      cabecalho: 'Prezado(a) [NOME DO CLIENTE],\n\nSegue abaixo o orçamento para sua avaliação. Fico à disposição para eventuais dúvidas e alterações.\n\nAtenciosamente,\n[NOME DO PROFISSIONAL OU EMPRESA]',
      rodape: 'Obrigado pela preferência!'
    }
  });

  const uploadLogo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCfg({ ...cfg, logo: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
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
            CONFIGURAÇÕES
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

      <h3 style={{ 
        margin: '0 0 20px', 
        fontSize: '18px', 
        fontWeight: 800, 
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        DADOS DA EMPRESA
      </h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px', 
          fontWeight: 600, 
          fontSize: '14px',
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          LOGO
        </label>
        {cfg.logo && (
          <img 
            src={cfg.logo} 
            alt="Logo" 
            style={{ 
              width: '120px', 
              height: '120px', 
              objectFit: 'contain', 
              marginBottom: '16px', 
              border: '2px solid #E2E8F0', 
              borderRadius: '16px', 
              padding: '12px',
              background: 'white'
            }} 
          />
        )}
        <button 
          onClick={uploadLogo} 
          style={{ 
            padding: '12px 20px', 
            background: '#6366F1', 
            border: 'none', 
            borderRadius: '12px', 
            color: 'white', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s'
          }}
        >
          <Upload size={16} /> {cfg.logo ? 'ALTERAR LOGO' : 'UPLOAD LOGO'}
        </button>
      </div>

      {['nome', 'telefone', 'email', 'endereco', 'cnpj'].map(field => (
        <div key={field} style={{ marginBottom: '18px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#64748B',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {field === 'nome' ? 'NOME DA EMPRESA' :
             field === 'telefone' ? 'TELEFONE' :
             field === 'email' ? 'EMAIL' :
             field === 'endereco' ? 'ENDEREÇO' :
             field === 'cnpj' ? 'CNPJ' : field.toUpperCase()}
          </label>
          <input 
            type={field === 'email' ? 'email' : field === 'telefone' ? 'tel' : 'text'} 
            placeholder={
              field === 'nome' ? 'Nome da sua empresa' :
              field === 'telefone' ? '(11) 99999-9999' :
              field === 'email' ? 'contato@empresa.com' :
              field === 'endereco' ? 'Rua, número, bairro' :
              field === 'cnpj' ? '00.000.000/0001-00' : ''
            }
            value={(cfg as any)[field] || ''} 
            onChange={e => setCfg({...cfg, [field]: e.target.value})} 
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

      <h3 style={{ 
        margin: '32px 0 20px', 
        fontSize: '18px', 
        fontWeight: 800, 
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        MENSAGEM PADRÃO WHATSAPP
      </h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 600, 
          fontSize: '14px',
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          CABEÇALHO
        </label>
        <textarea
          value={cfg.mensagemPadrao?.cabecalho || ''}
          onChange={e => setCfg({...cfg, mensagemPadrao: {cabecalho: e.target.value, rodape: cfg.mensagemPadrao?.rodape || ''}})}
          placeholder="Use [NOME DO CLIENTE] e [NOME DO PROFISSIONAL OU EMPRESA] como variáveis"
          style={{ 
            width: '100%', 
            padding: '16px', 
            border: '2px solid #E2E8F0', 
            borderRadius: '12px', 
            fontSize: '14px', 
            minHeight: '120px', 
            fontFamily: 'inherit', 
            boxSizing: 'border-box',
            background: 'white',
            transition: 'all 0.3s',
            resize: 'vertical'
          }}
          onFocus={e => e.currentTarget.style.border = '2px solid #6366F1'}
          onBlur={e => e.currentTarget.style.border = '2px solid #E2E8F0'}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 600, 
          fontSize: '14px',
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          RODAPÉ
        </label>
        <textarea
          value={cfg.mensagemPadrao?.rodape || ''}
          onChange={e => setCfg({...cfg, mensagemPadrao: {cabecalho: cfg.mensagemPadrao?.cabecalho || '', rodape: e.target.value}})}
          placeholder="Mensagem de fechamento"
          style={{ 
            width: '100%', 
            padding: '16px', 
            border: '2px solid #E2E8F0', 
            borderRadius: '12px', 
            fontSize: '14px', 
            minHeight: '80px', 
            fontFamily: 'inherit', 
            boxSizing: 'border-box',
            background: 'white',
            transition: 'all 0.3s',
            resize: 'vertical'
          }}
          onFocus={e => e.currentTarget.style.border = '2px solid #6366F1'}
          onBlur={e => e.currentTarget.style.border = '2px solid #E2E8F0'}
        />
      </div>

      <button 
        onClick={() => onSalvar(cfg)} 
        style={{ 
          width: '100%', 
          padding: '18px', 
          background: '#10B981', 
          border: 'none', 
          borderRadius: '16px', 
          color: 'white', 
          fontSize: '16px', 
          fontWeight: 700, 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.3s'
        }}
      >
        <Save size={20} /> SALVAR CONFIGURAÇÕES
      </button>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
