import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, MapPin, FileText } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '../firebaseService';
import { Usuario } from '../types';

interface Props {
  onLogin: (user: any) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const result = await loginWithEmail(email, password);
        onLogin(result.user);
      } else {
        const userData: Omit<Usuario, 'uid' | 'email'> = {
          nomeCompleto,
          telefone,
          dataNascimento,
          endereco: endereco || undefined,
          cpfCnpj,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        const result = await registerWithEmail(email, password, userData);
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await loginWithGoogle();
      onLogin(result.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px'
          }}>
            🎨 Pintor Pro
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" width="20" height="20" alt="Google" />
          Continuar com Google
        </button>

        <div style={{ textAlign: 'center', margin: '24px 0', color: '#94a3b8', fontSize: '14px' }}>
          ou
        </div>

        <form onSubmit={handleEmailLogin}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px 16px 16px 50px',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.8)'
              }}
            />
          </div>

          <div style={{ position: 'relative', marginBottom: isLogin ? '24px' : '20px' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px 50px 16px 50px',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.8)'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={nomeCompleto}
                  onChange={e => setNomeCompleto(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Phone size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Calendar size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={e => setDataNascimento(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <FileText size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="CPF ou CNPJ"
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>

              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <MapPin size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Endereço (opcional)"
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>
            </>
          )}

          {error && (
            <div style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '12px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '16px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              boxShadow: '0 4px 20px rgba(102,126,234,0.3)'
            }}
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;