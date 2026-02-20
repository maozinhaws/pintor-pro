import React, { useState, useEffect, useRef } from 'react';
import { Home, Save, Send, FileText, Camera, Plus, Trash2, ChevronLeft, ChevronRight, Mic, MicOff, Edit2, X } from 'lucide-react';
import { Orcamento, Cliente, ConfigEmpresa, Comodo, ItemOrcamento, Pagador } from '../types';
import { gerarPDF } from '../pdfUtils';
import { db } from '../Database';

interface Props {
  orcamento: Orcamento | null;
  clientes: Cliente[];
  config: ConfigEmpresa | null;
  onSalvar: (orc: Orcamento) => void;
  onVoltar: () => void;
}

const CriarOrcamento: React.FC<Props> = ({ orcamento, clientes, config, onSalvar, onVoltar }) => {
  const [step, setStep] = useState(0);
  const [cliente, setCliente] = useState<Cliente>(orcamento?.cliente || {
    nome: '', telefone: '', email: '', endereco: '', complemento: '', bairrosCidadeEstado: '', cpfCnpj: ''
  });
  const [pagadorDiferente, setPagadorDiferente] = useState(orcamento?.pagadorDiferente || false);
  const [pagador, setPagador] = useState<Pagador>(orcamento?.pagador || { 
    nome: '', telefone: '', email: '', endereco: '', complemento: '', bairrosCidadeEstado: '', cpfCnpj: '', relacao: '' 
  });
  const [comodos, setComodos] = useState<Comodo[]>(orcamento?.comodos || []);
  const [comodoAtual, setComodoAtual] = useState<number | null>(null);
  const [itemAtual, setItemAtual] = useState<number | null>(null);
  const [itemEditado, setItemEditado] = useState<ItemOrcamento | null>(null);
  const [itemTemAlteracoes, setItemTemAlteracoes] = useState(false);
  const [medidaPadrao, setMedidaPadrao] = useState({ base: '', altura: '' });
  const [servicosPadrao, setServicosPadrao] = useState(['Lixamento','Pintura','Massa corrida','Selador','Textura','Verniz']);
  const [formasPagamento, setFormasPagamento] = useState<string[]>(orcamento?.formasPagamento || []);
  const [observacoes, setObservacoes] = useState(orcamento?.observacoes || '');
  const [formatoOrcamento, setFormatoOrcamento] = useState(orcamento?.formatoOrcamento || 'm2');
  const [status, setStatus] = useState(orcamento?.status || 'PENDENTE');
  const [validade, setValidade] = useState(orcamento?.validade || 15);
  const [dataPrevisaoInicio, setDataPrevisaoInicio] = useState(orcamento?.dataPrevisaoInicio || '');
  
  const [modalAberto, setModalAberto] = useState<{tipo: 'confirm' | 'preview' | 'servico', dados?: any} | null>(null);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const itensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.onend = () => setIsRecording(null);
      recognitionRef.current.onerror = () => setIsRecording(null);
    }
  }, []);

  const startRecording = (field: string) => {
    if (!navigator.onLine) {
      alert('Reconhecimento de voz requer conexão com internet');
      return;
    }
    setIsRecording(field);
    if (recognitionRef.current) {
      let finalTranscript = '';
      recognitionRef.current.onresult = (e: any) => {
        let interimTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        if (finalTranscript) {
          handleVoiceInput(field, finalTranscript);
        }
      };
      try { recognitionRef.current.stop(); } catch(e) {}
      setTimeout(() => {
        try { recognitionRef.current.start(); } catch(e) {}
      }, 200);
    }
  };

  const stopRecording = () => {
    setIsRecording(null);
    try { recognitionRef.current?.stop(); } catch(e) {}
  };

  const handleVoiceInput = (field: string, text: string) => {
    const parts = field.split('.');
    if (parts[0] === 'cliente') setCliente({...cliente, [parts[1]]: text});
    else if (parts[0] === 'pagador') setPagador({...pagador, [parts[1]]: text});
    else if (parts[0] === 'comodo' && comodoAtual !== null) {
      const u = [...comodos];
      (u[comodoAtual] as any)[parts[1]] = text;
      setComodos(u);
    } else if (parts[0] === 'item' && itemEditado) {
      setItemEditado({...itemEditado, [parts[1]]: text});
      setItemTemAlteracoes(true);
    } else if (field === 'observacoes') setObservacoes(text);
  };

  const scrollToItens = () => {
    itensRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const adicionarComodo = () => {
    setComodos([...comodos, {
      nome: '', observacoes: '', servicos: [], tipoServico: 'ambos',
      itens: [], fotosAntes: [], fotosDepois: [], medidas: { altura: 0, largura: 0, comprimento: 0 }
    }]);
    setComodoAtual(comodos.length);
    setItemAtual(null);
    setItemEditado(null);
    setStep(3);
    setTimeout(scrollToItens, 100);
  };

  const removerComodo = (idx: number) => {
    if (!window.confirm('Excluir este cômodo?')) return;
    setComodos(comodos.filter((_, i) => i !== idx));
    if (comodoAtual === idx) { setComodoAtual(null); setItemAtual(null); }
  };

  const adicionarItem = () => {
    if (comodoAtual === null) return;
    
    // Usar medidas do cômodo se disponíveis, senão usar medida padrão
    const medidasComodo = comodos[comodoAtual].medidas;
    const usarMedidasComodo = medidasComodo?.largura && medidasComodo?.altura;
    const usarP = !usarMedidasComodo && medidaPadrao.base !== '';
    
    const novo: ItemOrcamento = {
      nome: '', descricao: '',
      base: usarMedidasComodo ? String(medidasComodo.largura) : (usarP ? medidaPadrao.base : ''),
      altura: usarMedidasComodo ? String(medidasComodo.altura) : (usarP ? medidaPadrao.altura : ''),
      usarPadrao: usarP, servicos: [], tipoServico: 'ambos', valor: '',
      fotoAntes: null, fotoDepois: null, incluirNoCalculo: true, metroLinear: false
    };
    const u = [...comodos];
    u[comodoAtual].itens.push(novo);
    setComodos(u);
    setItemAtual(u[comodoAtual].itens.length - 1);
    setItemEditado({...novo});
    setItemTemAlteracoes(false);
    setTimeout(scrollToItens, 100);
  };

  const salvarItem = () => {
    if (comodoAtual === null || itemAtual === null || !itemEditado) return;
    const u = [...comodos];
    u[comodoAtual].itens[itemAtual] = {...itemEditado};
    setComodos(u);
    if (comodoAtual === 0 && itemAtual === 0 && medidaPadrao.altura === '') {
      setMedidaPadrao({ base: itemEditado.base, altura: itemEditado.altura });
    }
    setItemAtual(null);
    setItemEditado(null);
    setItemTemAlteracoes(false);
  };

  const fecharSemSalvar = () => {
    if (itemTemAlteracoes) {
      if (window.confirm('Tem alterações não salvas. Deseja salvar antes de fechar?')) salvarItem();
      else { setItemAtual(null); setItemEditado(null); setItemTemAlteracoes(false); }
    } else { setItemAtual(null); setItemEditado(null); }
  };

  const removerItem = (idx: number) => {
    if (!window.confirm('Excluir este item?')) return;
    if (comodoAtual === null) return;
    const u = [...comodos];
    u[comodoAtual].itens = u[comodoAtual].itens.filter((_, i) => i !== idx);
    setComodos(u);
    if (itemAtual === idx) { setItemAtual(null); setItemEditado(null); }
    else if (itemAtual !== null && itemAtual > idx) setItemAtual(itemAtual - 1);
  };

  const toggleUsarPadrao = () => {
    if (!itemEditado) return;
    setItemEditado({
      ...itemEditado,
      usarPadrao: !itemEditado.usarPadrao,
      ...(itemEditado.usarPadrao ? {} : medidaPadrao)
    });
    setItemTemAlteracoes(true);
  };

  const toggleServico = (s: string) => {
    if (!itemEditado) return;
    const arr = itemEditado.servicos || [];
    setItemEditado({
      ...itemEditado,
      servicos: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]
    });
    setItemTemAlteracoes(true);
  };

  const calcM2 = (item: ItemOrcamento) => {
    const base = parseFloat(item.base) || 0;
    const altura = parseFloat(item.altura) || 0;
    
    // Se apenas uma medida estiver preenchida, é metro linear
    if ((base > 0 && altura === 0) || (base === 0 && altura > 0)) {
      return Math.max(base, altura);
    }
    
    // Se ambas estão preenchidas, é área (base x altura)
    return base * altura;
  };

  const isMetroLinear = (item: ItemOrcamento) => {
    const base = parseFloat(item.base) || 0;
    const altura = parseFloat(item.altura) || 0;
    return (base > 0 && altura === 0) || (base === 0 && altura > 0);
  };

  const areaTotal = () => {
    let total = 0;
    comodos.forEach(c => {
      const m = c.medidas || {};
      const base = parseFloat(String(m.largura || 0)) || 0;
      const altura = parseFloat(String(m.altura || 0)) || 0;
      if (base && altura) total += base * altura;
      c.itens.forEach(i => {
        if (i.incluirNoCalculo !== false) total += calcM2(i);
      });
    });
    return total;
  };

  const valorTotal = () => {
    return comodos.reduce((t, c) => t + c.itens.reduce((t2, i) => t2 + (parseFloat(i.valor) || 0), 0), 0);
  };

  const capturarFoto = (tipo: 'fotoAntes' | 'fotoDepois', nivel: 'comodo' | 'item') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const u = [...comodos];
        if (nivel === 'comodo' && comodoAtual !== null) {
          if (tipo === 'fotoAntes') {
            u[comodoAtual].fotosAntes = [ev.target?.result as string];
          } else {
            u[comodoAtual].fotosDepois = [ev.target?.result as string];
          }
          setComodos(u);
        } else if (nivel === 'item' && itemEditado) {
          setItemEditado({...itemEditado, [tipo]: ev.target?.result as string});
          setItemTemAlteracoes(true);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const enviarWhatsApp = () => {
    const texto = gerarTextoWhatsApp();
    const tel = cliente.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const gerarTextoWhatsApp = () => {
    const cabecalho = config?.mensagemPadrao?.cabecalho || 'Prezado(a) [NOME DO CLIENTE], segue o orçamento do dia [DATA DE ABERTURA].';
    const dataAbertura = orcamento?.dataCriacao ? new Date(orcamento.dataCriacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const msg = cabecalho
      .replace('[NOME DO CLIENTE]', cliente.nome)
      .replace('[NOME DO PROFISSIONAL OU EMPRESA]', config?.nome || '')
      .replace('[DATA DE ABERTURA]', dataAbertura);
    
    let texto = `*${msg}*\n\n*═══════════════════*\n*ORÇAMENTO DE PINTURA*\n*═══════════════════*\n\n`;
    texto += `*CLIENTE*\nNome: ${cliente.nome}\nTelefone: ${cliente.telefone}\nEndereço: ${cliente.endereco}\nLocal: ${cliente.bairrosCidadeEstado}\n\n`;
    
    if (pagadorDiferente && pagador) {
      texto += `*PAGADOR*\nNome: ${pagador.nome}\nTelefone: ${pagador.telefone}\nRelação: ${pagador.relacao}\n\n`;
    }
    
    texto += `*SERVIÇOS*\n`;
    comodos.forEach((c, ci) => {
      texto += `\n*${ci+1}. ${c.nome.toUpperCase()}*\n`;
      if (c.observacoes) texto += `   Obs: ${c.observacoes}\n`;
      
      c.itens.forEach((item, ii) => {
        texto += `\n   ${ii+1}) *${item.nome}*\n`;
        if (item.descricao) texto += `      ${item.descricao}\n`;
        
        if (formatoOrcamento === 'completo') {
          texto += `      Medidas: ${item.base}m × ${item.altura}m\n`;
          texto += `      Área: ${calcM2(item).toFixed(2)}${isMetroLinear(item)?'m':'m²'}\n`;
        } else if (formatoOrcamento === 'm2') {
          texto += `      Área: ${calcM2(item).toFixed(2)}${isMetroLinear(item)?'m':'m²'}\n`;
        }
        
        if (item.servicos?.length) texto += `      Serviços: ${item.servicos.join(', ')}\n`;
        
        // No modo simplificado, não mostra valor individual
        if (formatoOrcamento !== 'valor' && item.valor) {
          texto += `      Valor: R$ ${parseFloat(item.valor).toFixed(2)}\n`;
        }
      });
    });
    
    texto += `\n*ÁREA TOTAL: ${areaTotal().toFixed(2)}m²*\n`;
    if (valorTotal() > 0) texto += `*VALOR TOTAL: R$ ${valorTotal().toFixed(2)}*\n`;
    texto += `\n*VALIDADE:* ${validade} dias\n`;
    
    if (formasPagamento.length) texto += `\n*FORMAS DE PAGAMENTO*\n${formasPagamento.map(f => `• ${f}`).join('\n')}\n`;
    if (observacoes) texto += `\n*OBSERVAÇÕES*\n${observacoes}\n`;
    
    texto += `\n*═══════════════════*\n*${config?.nome || ''}*\n`;
    if (config?.telefone) texto += `📞 ${config.telefone}\n`;
    if (config?.email) texto += `📧 ${config.email}\n`;
    if (config?.cnpj) texto += `CNPJ: ${config.cnpj}\n`;
    
    return texto;
  };

  const handleVoltar = () => {
    if (cliente.nome || comodos.length > 0 || observacoes) {
      if (window.confirm('Você tem alterações não salvas. Deseja salvar antes de sair?')) {
        handleSalvar();
        return;
      }
    }
    onVoltar();
  };
  const handleSalvar = async () => {
    try {
      // Salvar cliente automaticamente se não existir
      const clienteExistente = clientes.find(c => 
        c.nome.toLowerCase().trim() === cliente.nome.toLowerCase().trim()
      );
      
      if (!clienteExistente && cliente.nome.trim()) {
        console.log('Salvando novo cliente:', cliente.nome);
        await db.salvarCliente({
          ...cliente,
          dataCriacao: new Date().toISOString()
        });
      }

      const orc: Orcamento = {
        id: orcamento?.id,
        cliente, pagadorDiferente, pagador, comodos, formasPagamento, observacoes,
        formatoOrcamento, status, validade, dataPrevisaoInicio,
        dataCriacao: orcamento?.dataCriacao || new Date().toISOString(),
        dataModificacao: new Date().toISOString()
      };
      onSalvar(orc);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const steps = ['Dados do Cliente', 'Dados do Pagador', 'Cômodos', 'Detalhes', 'Pagamento', 'Finalizar'];

  return (
    <div ref={topRef} style={{ 
      minHeight: '100vh',
      background: '#FFFFFF',
      paddingBottom: '100px'
    }}>
      {/* Modal Personalizado */}
      {modalAberto && (
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
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden'
          }}>
            {modalAberto.tipo === 'preview' && (
              <>
                <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Prévia da Mensagem</h3>
                </div>
                <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.5', margin: 0, fontFamily: 'inherit' }}>
                    {modalAberto.dados?.texto}
                  </pre>
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setModalAberto(null)}
                    style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      enviarWhatsApp();
                      setModalAberto(null);
                    }}
                    style={{ padding: '10px 20px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Enviar WhatsApp
                  </button>
                </div>
              </>
            )}
            {modalAberto.tipo === 'servico' && (
              <>
                <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Novo Serviço</h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <input
                    type="text"
                    placeholder="Nome do novo serviço"
                    id="novoServico"
                    style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setModalAberto(null)}
                    style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const input = document.getElementById('novoServico') as HTMLInputElement;
                      const novoServico = input?.value.trim();
                      if (novoServico && !servicosPadrao.includes(novoServico)) {
                        setServicosPadrao([...servicosPadrao, novoServico]);
                      }
                      setModalAberto(null);
                    }}
                    style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            )}
            {modalAberto.tipo === 'confirm' && (
              <>
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
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>Excluir Serviço?</h3>
                  <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#666' }}>
                    Tem certeza que deseja excluir "{modalAberto.dados?.servico}"?
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => setModalAberto(null)}
                      style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setServicosPadrao(servicosPadrao.filter(srv => srv !== modalAberto.dados?.servico));
                        setModalAberto(null);
                      }}
                      style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </>
            )}
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
          <h1 style={{ 
            fontSize: '24px', 
            color: 'white', 
            fontWeight: 800, 
            margin: 0,
            textAlign: 'center',
            flex: 1
          }}>
            {orcamento ? 'EDITAR' : 'NOVO'} ORÇAMENTO
          </h1>
          <div style={{ width: '100px' }} /> {/* Spacer */}
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{ 
              flex: 1, 
              height: '6px', 
              borderRadius: '10px', 
              background: i <= step ? '#3b82f6' : 'rgba(255,255,255,0.3)', 
              transition: 'all 0.3s' 
            }} />
          ))}
        </div>
        <p style={{ 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.9)', 
          fontWeight: 600, 
          fontSize: '16px', 
          margin: 0
        }}>
          {steps[step]}
        </p>
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
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          marginBottom: '20px'
        }}>
        {/* STEP 0 - CLIENTE */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#1E293B' }}>IDENTIFICAR CLIENTE</h2>
            {['nome','telefone','email','endereco','complemento','bairrosCidadeEstado','cpfCnpj'].map(k => (
              <div key={k} style={{ position: 'relative', marginBottom: '18px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#64748B', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {k === 'bairrosCidadeEstado' ? 'BAIRRO, CIDADE E ESTADO' : k === 'cpfCnpj' ? 'CPF OU CNPJ' : k.toUpperCase()}
                </label>
                <input
                  type={k==='email'?'email':'text'}
                  value={(cliente as any)[k] || ''}
                  onChange={e => setCliente({...cliente, [k]: e.target.value})}
                  placeholder={k === 'bairrosCidadeEstado' ? 'Ex: Centro, São Paulo - SP' : k === 'cpfCnpj' ? '000.000.000-00 ou 00.000.000/0001-00' : ''}
                  style={{ 
                    width: '100%', 
                    padding: '16px 60px 16px 16px', 
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
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginTop: '14px'
                }}>
                  <button
                    type="button"
                    onMouseDown={() => startRecording(`cliente.${k}`)}
                    onMouseUp={stopRecording}
                    onTouchStart={() => startRecording(`cliente.${k}`)}
                    onTouchEnd={stopRecording}
                    style={{
                      padding: '10px',
                      background: isRecording === `cliente.${k}` ? '#EF4444' : '#93C5FD',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      minWidth: '44px',
                      minHeight: '44px'
                    }}
                  >
                    {isRecording === `cliente.${k}` ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 - PAGADOR */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#1E293B' }}>DADOS DO PAGADOR</h2>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px', 
              background: '#F1F5F9', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              marginBottom: '20px',
              border: '2px solid #E2E8F0'
            }}>
              <input 
                type="checkbox" 
                checked={pagadorDiferente} 
                onChange={e => setPagadorDiferente(e.target.checked)} 
                style={{ width: '22px', height: '22px', accentColor: '#6366F1' }} 
              />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>ADICIONAR PAGADOR (COBRANÇA)</span>
            </label>
            {pagadorDiferente && ['nome','telefone','email','endereco','complemento','bairrosCidadeEstado','cpfCnpj','relacao'].map(k => (
              <div key={k} style={{ position: 'relative', marginBottom: '18px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#64748B', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {k === 'bairrosCidadeEstado' ? 'BAIRRO, CIDADE E ESTADO' : k === 'cpfCnpj' ? 'CPF OU CNPJ' : k === 'relacao' ? 'RELAÇÃO (INQUILINO, LOCATÁRIO...)' : k.toUpperCase()}
                </label>
                <input
                  type={k==='email'?'email':'text'}
                  value={(pagador as any)[k] || ''}
                  onChange={e => setPagador({...pagador, [k]: e.target.value})}
                  placeholder={k === 'bairrosCidadeEstado' ? 'Ex: Centro, São Paulo - SP' : k === 'cpfCnpj' ? '000.000.000-00 ou 00.000.000/0001-00' : ''}
                  style={{ 
                    width: '100%', 
                    padding: '16px 60px 16px 16px', 
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
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginTop: '14px'
                }}>
                  <button
                    type="button"
                    onMouseDown={() => startRecording(`pagador.${k}`)}
                    onMouseUp={stopRecording}
                    onTouchStart={() => startRecording(`pagador.${k}`)}
                    onTouchEnd={stopRecording}
                    style={{
                      padding: '10px',
                      background: isRecording === `pagador.${k}` ? '#EF4444' : '#93C5FD',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      minWidth: '44px',
                      minHeight: '44px'
                    }}
                  >
                    {isRecording === `pagador.${k}` ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2 - LISTA CÔMODOS */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#1E293B' }}>AMBIENTES</h2>
            {comodos.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#94A3B8', 
                fontSize: '16px',
                background: '#F8FAFC',
                borderRadius: '16px',
                border: '2px dashed #E2E8F0'
              }}>
                🏠<br/>Nenhum ambiente adicionado
              </div>
            )}
            {comodos.map((c, i) => (
              <div key={i} style={{ 
                padding: '20px', 
                background: '#F8FAFC', 
                borderRadius: '16px', 
                marginBottom: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                border: '2px solid #E2E8F0'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1E293B' }}>
                    {c.nome || `Ambiente ${i+1}`}
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px', margin: '4px 0 0' }}>
                    {c.itens.length} item{c.itens.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => { setComodoAtual(i); setStep(3); }} 
                    style={{ 
                      padding: '12px 20px', 
                      background: '#6366F1', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: 'white', 
                      cursor: 'pointer', 
                      fontWeight: 700,
                      fontSize: '14px',
                      transition: 'all 0.3s'
                    }}
                  >
                    EDITAR
                  </button>
                  <button 
                    onClick={() => removerComodo(i)} 
                    style={{ 
                      padding: '12px', 
                      background: '#EF4444', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: 'white', 
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={adicionarComodo} 
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
                marginTop: '16px',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s'
              }}
            >
              <Plus size={20} /> ADICIONAR AMBIENTE
            </button>
          </div>
        )}

        {/* STEP 3 - DETALHES CÔMODO */}
        {step === 3 && comodoAtual !== null && (
          <div>
            <button onClick={() => { setComodoAtual(null); setItemAtual(null); setStep(2); }} style={{ marginBottom: '20px', padding: '10px 14px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronLeft size={18} /> Voltar para Cômodos
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Cômodo</h2>

            {/* Nome do Cômodo */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Nome do Cômodo</label>
              <input
                type="text"
                value={comodos[comodoAtual].nome}
                onChange={e => { const u = [...comodos]; u[comodoAtual].nome = e.target.value; setComodos(u); }}
                placeholder="Ex: Sala, Quarto, Cozinha"
                style={{ width: '100%', padding: '14px 60px 14px 14px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onMouseDown={() => startRecording('comodo.nome')}
                onMouseUp={stopRecording}
                onTouchStart={() => startRecording('comodo.nome')}
                onTouchEnd={stopRecording}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '10px',
                  background: isRecording === 'comodo.nome' ? '#EF4444' : '#93C5FD',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {isRecording === 'comodo.nome' ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
              </button>
            </div>

            {/* Medidas do Cômodo */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Medidas do Cômodo (opcional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['largura','altura'].map(m => (
                  <div key={m}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{m === 'largura' ? 'Base' : 'Altura'}</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="m"
                      value={(comodos[comodoAtual].medidas as any)?.[m] || ''}
                      onChange={e => {
                        const u = [...comodos];
                        if (!u[comodoAtual].medidas) u[comodoAtual].medidas = { altura: 0, largura: 0, comprimento: 0 };
                        (u[comodoAtual].medidas as any)[m] = e.target.value;
                        setComodos(u);
                      }}
                      style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Área Calculada do Cômodo */}
              {(comodos[comodoAtual].medidas?.largura || comodos[comodoAtual].medidas?.altura) && (
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: 700 }}>
                    {(() => {
                      const base = parseFloat(String(comodos[comodoAtual].medidas?.largura || 0)) || 0;
                      const altura = parseFloat(String(comodos[comodoAtual].medidas?.altura || 0)) || 0;
                      const isLinear = (base > 0 && altura === 0) || (base === 0 && altura > 0);
                      const area = isLinear ? Math.max(base, altura) : base * altura;
                      return `${isLinear ? '📏' : '⬜'} ${isLinear ? 'Linear' : 'Área'}: ${area.toFixed(2)}${isLinear ? ' m' : ' m²'}`;
                    })()}
                  </span>
                  {comodos[comodoAtual].medidas?.largura && comodos[comodoAtual].medidas?.altura && (
                    <button
                      onClick={() => {
                        setMedidaPadrao({ 
                          base: String(comodos[comodoAtual].medidas!.largura), 
                          altura: String(comodos[comodoAtual].medidas!.altura) 
                        }); 
                        alert('Nova medida padrão definida!');
                      }}
                      style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                    >
                      Definir como padrão
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Valor do Cômodo */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Valor do Cômodo (R$){comodos[comodoAtual].cobrarPorMetro ? ' por metro' : ''}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flex: '0 0 200px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={comodos[comodoAtual].valor || ''}
                    onChange={e => {
                      const u = [...comodos];
                      u[comodoAtual].valor = e.target.value;
                      setComodos(u);
                    }}
                    placeholder="0,00"
                    style={{ width: '100%', padding: '14px 60px 14px 14px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onMouseDown={() => startRecording('comodo.valor')}
                    onMouseUp={stopRecording}
                    onTouchStart={() => startRecording('comodo.valor')}
                    onTouchEnd={stopRecording}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '10px',
                      background: isRecording === 'comodo.valor' ? '#EF4444' : '#93C5FD',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isRecording === 'comodo.valor' ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={comodos[comodoAtual].cobrarPorMetro || false} 
                    onChange={e => {
                      const u = [...comodos];
                      u[comodoAtual].cobrarPorMetro = e.target.checked;
                      setComodos(u);
                    }} 
                    style={{ width: '18px', height: '18px' }} 
                  />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Cobrar por metro</span>
                </label>
                {comodos[comodoAtual].cobrarPorMetro && comodos[comodoAtual].valor && (() => {
                  const base = parseFloat(String(comodos[comodoAtual].medidas?.largura || 0)) || 0;
                  const altura = parseFloat(String(comodos[comodoAtual].medidas?.altura || 0)) || 0;
                  const area = (base > 0 && altura === 0) || (base === 0 && altura > 0) ? Math.max(base, altura) : base * altura;
                  const valorCalculado = area * parseFloat(comodos[comodoAtual].valor || '0');
                  return <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>= R$ {valorCalculado.toFixed(2)}</span>;
                })()}
              </div>
            </div>

            {/* Observações */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Observações</label>
              <textarea
                value={comodos[comodoAtual].observacoes}
                onChange={e => { const u = [...comodos]; u[comodoAtual].observacoes = e.target.value; setComodos(u); }}
                placeholder="Observações específicas deste cômodo..."
                style={{ width: '100%', padding: '12px 60px 12px 12px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '15px', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ position: 'absolute', right: '8px', top: '38px' }}>
                <button
                  type="button"
                  onMouseDown={() => startRecording('comodo.observacoes')}
                  onMouseUp={stopRecording}
                  onTouchStart={() => startRecording('comodo.observacoes')}
                  onTouchEnd={stopRecording}
                  style={{
                    padding: '10px',
                    background: isRecording === 'comodo.observacoes' ? '#ef4444' : '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                >
                  {isRecording === 'comodo.observacoes' ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
                </button>
              </div>
            </div>

            {/* Serviços no Cômodo */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: '#555', fontSize: '14px', fontWeight: 700 }}>Serviços no Cômodo</label>
                <button
                  onClick={() => {
                    const novoServico = prompt('Nome do novo serviço:');
                    if (novoServico && !servicosPadrao.includes(novoServico)) {
                      setServicosPadrao([...servicosPadrao, novoServico]);
                    }
                  }}
                  style={{ padding: '4px 8px', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  + Novo
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {servicosPadrao.map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: comodos[comodoAtual].servicos?.includes(s) ? '#e8f0fe' : 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: comodos[comodoAtual].servicos?.includes(s) ? '2px solid #667eea' : '2px solid #e0e0e0' }}>
                    <input 
                      type="checkbox" 
                      checked={comodos[comodoAtual].servicos?.includes(s) || false} 
                      onChange={() => {
                        const u = [...comodos];
                        const arr = u[comodoAtual].servicos || [];
                        u[comodoAtual].servicos = arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s];
                        setComodos(u);
                      }} 
                      style={{ cursor: 'pointer' }} 
                    />
                    {s}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm(`Excluir serviço "${s}"?`)) {
                          setServicosPadrao(servicosPadrao.filter(srv => srv !== s));
                        }
                      }}
                      style={{ marginLeft: '4px', padding: '2px 4px', background: '#ff4757', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '10px' }}
                    >
                      ×
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* Fotos do Cômodo */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Fotos do Cômodo</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['fotoAntes','fotoDepois'] as const).map(tipo => (
                  <div key={tipo} style={{ flex: 1 }}>
                    <button onClick={() => capturarFoto(tipo, 'comodo')} style={{ width: '100%', padding: '14px', background: (tipo === 'fotoAntes' ? comodos[comodoAtual].fotosAntes?.length : comodos[comodoAtual].fotosDepois?.length) ? '#10b981' : '#667eea', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                      <Camera size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{tipo === 'fotoAntes' ? 'Antes' : 'Depois'}
                    </button>
                    {(tipo === 'fotoAntes' ? comodos[comodoAtual].fotosAntes?.[0] : comodos[comodoAtual].fotosDepois?.[0]) && (
                      <img src={tipo === 'fotoAntes' ? comodos[comodoAtual].fotosAntes![0] : comodos[comodoAtual].fotosDepois![0]} alt={tipo} style={{ width: '100%', marginTop: '8px', borderRadius: '8px', maxHeight: '140px', objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid #f0f0f0', margin: '24px 0' }} />
            <h3 ref={itensRef} style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Itens do Cômodo</h3>

            {/* Lista de Itens */}
            {comodos[comodoAtual].itens.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px', color: '#bbb', background: '#f9f9f9', borderRadius: '12px', marginBottom: '16px' }}>
                Nenhum item adicionado
              </div>
            )}
            {comodos[comodoAtual].itens.map((item, idx) => (
              <div key={idx} style={{ background: '#f9f9f9', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '16px' }}>{item.nome || `Item ${idx+1}`}</strong>
                    {item.descricao && <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>{item.descricao}</p>}
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                      {item.base}m × {item.altura}m — {calcM2(item).toFixed(2)}{isMetroLinear(item)?'m':'m²'}
                    </p>
                    {item.servicos?.length > 0 && <p style={{ margin: '4px 0 0', color: '#667eea', fontSize: '12px' }}>Serviços: {item.servicos.join(', ')}</p>}
                    {item.valor && <p style={{ margin: '4px 0 0', color: '#10b981', fontSize: '14px', fontWeight: 700 }}>R$ {parseFloat(item.valor).toFixed(2)}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                    <button onClick={() => { setItemAtual(idx); setItemEditado({...item}); setItemTemAlteracoes(false); setTimeout(scrollToItens,100); }} style={{ padding: '8px 14px', background: '#667eea', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                      Editar
                    </button>
                    <button onClick={() => removerItem(idx)} style={{ padding: '8px', background: '#ff4757', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Botões Adicionar Item ou Card Edição */}
            {itemAtual === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={adicionarItem} style={{ width: '100%', padding: '15px', background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Plus size={20} /> Adicionar Item
                </button>
                <button onClick={adicionarComodo} style={{ width: '100%', padding: '15px', background: 'white', border: '2px solid #667eea', borderRadius: '12px', color: '#667eea', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  🏠 Adicionar Outro Cômodo
                </button>
              </div>
            ) : itemEditado && (
              <div style={{ background: '#f0f4ff', padding: '20px', borderRadius: '14px', border: '2px solid #667eea', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>✏️ Editar Item</h4>
                </div>

                {/* Nome */}
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Nome do Item</label>
                  <input
                    style={{ width: '100%', padding: '12px 60px 12px 12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '15px', background: 'white', boxSizing: 'border-box' }}
                    value={itemEditado.nome}
                    onChange={e => { setItemEditado({...itemEditado, nome: e.target.value}); setItemTemAlteracoes(true); }}
                    placeholder="Ex: Parede Norte, Teto..."
                  />
                  <button
                    type="button"
                    onMouseDown={() => startRecording('item.nome')}
                    onMouseUp={stopRecording}
                    onTouchStart={() => startRecording('item.nome')}
                    onTouchEnd={stopRecording}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '10px',
                      background: isRecording === 'item.nome' ? '#EF4444' : '#93C5FD',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isRecording === 'item.nome' ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
                  </button>
                </div>

                {/* Descrição */}
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Descrição</label>
                  <textarea
                    style={{ width: '100%', padding: '12px 60px 12px 12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '15px', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical', background: 'white', boxSizing: 'border-box' }}
                    value={itemEditado.descricao}
                    onChange={e => { setItemEditado({...itemEditado, descricao: e.target.value}); setItemTemAlteracoes(true); }}
                    placeholder="Ex: Pintura acrílica premium, 2 demãos"
                  />
                  <div style={{ position: 'absolute', right: '8px', top: '38px' }}>
                    <button
                      type="button"
                      onMouseDown={() => startRecording('item.descricao')}
                      onMouseUp={stopRecording}
                      onTouchStart={() => startRecording('item.descricao')}
                      onTouchEnd={stopRecording}
                      style={{
                        padding: '10px',
                        background: isRecording === 'item.descricao' ? '#ef4444' : '#667eea',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px'
                      }}
                    >
                      {isRecording === 'item.descricao' ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
                    </button>
                  </div>
                </div>

                {/* Usar Padrão */}
                {medidaPadrao.altura && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e0e0e0' }}>
                    <input type="checkbox" checked={itemEditado.usarPadrao} onChange={toggleUsarPadrao} style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Usar medida padrão ({medidaPadrao.base}m × {medidaPadrao.altura}m)</span>
                  </label>
                )}

                {/* Medidas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  {['base','altura'].map(m => (
                    <div key={m}>
                      <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{m}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(itemEditado as any)[m]}
                        onChange={e => { setItemEditado({...itemEditado, [m]: e.target.value}); setItemTemAlteracoes(true); }}
                        disabled={itemEditado.usarPadrao}
                        placeholder="m"
                        style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '14px', opacity: itemEditado.usarPadrao ? 0.5 : 1, background: 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Área Calculada */}
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: 700 }}>
                    {isMetroLinear(itemEditado) ? '📏' : '⬜'} {isMetroLinear(itemEditado) ? 'Linear' : 'Área'}: {calcM2(itemEditado).toFixed(2)}{isMetroLinear(itemEditado)?' m':' m²'}
                  </span>
                  {!itemEditado.usarPadrao && itemEditado.altura && (
                    <button
                      onClick={() => { setMedidaPadrao({ base: itemEditado.base, altura: itemEditado.altura }); alert('Nova medida padrão definida!'); }}
                      style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                    >
                      Definir como padrão
                    </button>
                  )}
                </div>

                {/* Serviços */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ color: '#555', fontSize: '14px', fontWeight: 700 }}>Serviços no Item</label>
                    <button
                      onClick={() => {
                        setModalAberto({tipo: 'servico', dados: {acao: 'criar'}});
                      }}
                      style={{ padding: '4px 8px', background: '#10b981', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                      + Novo
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {servicosPadrao.map(s => (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: itemEditado.servicos?.includes(s) ? '#e8f0fe' : 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: itemEditado.servicos?.includes(s) ? '2px solid #667eea' : '2px solid #e0e0e0', position: 'relative' }}>
                        <input type="checkbox" checked={itemEditado.servicos?.includes(s) || false} onChange={() => toggleServico(s)} style={{ cursor: 'pointer' }} />
                        {s}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setModalAberto({tipo: 'confirm', dados: {acao: 'excluir', servico: s}});
                          }}
                          style={{ marginLeft: '4px', padding: '2px 4px', background: '#ff4757', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '10px' }}
                        >
                          ×
                        </button>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Valor */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Valor (R$){itemEditado.cobrarPorMetro ? ' por metro' : ''}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: '0 0 200px' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={itemEditado.valor}
                        onChange={e => { setItemEditado({...itemEditado, valor: e.target.value}); setItemTemAlteracoes(true); }}
                        placeholder="0,00"
                        style={{ width: '100%', padding: '12px 60px 12px 12px', border: '2px solid #ddd', borderRadius: '8px', fontSize: '16px', background: 'white', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => startRecording('item.valor')}
                        onMouseUp={stopRecording}
                        onTouchStart={() => startRecording('item.valor')}
                        onTouchEnd={stopRecording}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '10px',
                          background: isRecording === 'item.valor' ? '#EF4444' : '#93C5FD',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          minWidth: '44px',
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isRecording === 'item.valor' ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
                      </button>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={itemEditado.cobrarPorMetro || false} 
                        onChange={e => {
                          setItemEditado({...itemEditado, cobrarPorMetro: e.target.checked});
                          setItemTemAlteracoes(true);
                        }} 
                        style={{ width: '18px', height: '18px' }} 
                      />
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Cobrar por metro</span>
                    </label>
                    {itemEditado.cobrarPorMetro && itemEditado.valor && (() => {
                      const area = calcM2(itemEditado);
                      const valorCalculado = area * parseFloat(itemEditado.valor || '0');
                      return <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>= R$ {valorCalculado.toFixed(2)}</span>;
                    })()}
                  </div>
                </div>

                {/* Fotos do Item */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontSize: '14px', fontWeight: 700 }}>Fotos do Item</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['fotoAntes','fotoDepois'] as const).map(tipo => (
                      <div key={tipo} style={{ flex: 1 }}>
                        <button onClick={() => capturarFoto(tipo, 'item')} style={{ width: '100%', padding: '12px', background: itemEditado[tipo] ? '#10b981' : '#667eea', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                          <Camera size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{tipo === 'fotoAntes' ? 'Antes' : 'Depois'}
                        </button>
                        {itemEditado[tipo] && (
                          <img src={itemEditado[tipo]!} alt={tipo} style={{ width: '100%', marginTop: '8px', borderRadius: '6px', maxHeight: '100px', objectFit: 'cover' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botões dentro do card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #dce4ff' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button onClick={salvarItem} style={{ flex: 1, padding: '12px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Save size={16} /> Salvar
                    </button>
                    <button onClick={fecharSemSalvar} style={{ flex: 1, padding: '12px', background: '#ff4757', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <X size={16} /> Fechar
                    </button>
                  </div>
                  <button onClick={adicionarItem} style={{ width: '100%', padding: '14px', background: '#FC6E51', border: 'none', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Plus size={18} /> Salvar e Adicionar Outro Item
                  </button>
                  <button onClick={adicionarComodo} style={{ width: '100%', padding: '14px', background: '#E74C3C', border: 'none', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    🏠 Adicionar Outro Cômodo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 - FINALIZAR */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Formas de Pagamento</h2>
            {['PIX','Dinheiro','Cartão de Crédito','Cartão de Débito','Boleto','Parcelado'].map(forma => (
              <label key={forma} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: formasPagamento.includes(forma) ? '#e8f0fe' : '#f9f9f9', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', border: formasPagamento.includes(forma) ? '2px solid #667eea' : '2px solid transparent' }}>
                <input type="checkbox" checked={formasPagamento.includes(forma)} onChange={e => setFormasPagamento(e.target.checked ? [...formasPagamento, forma] : formasPagamento.filter(f => f !== forma))} style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{forma}</span>
              </label>
            ))}
          </div>
        )}

        {/* STEP 5 - FINALIZAR */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Formato e Observações</h2>
            
            {/* Formato */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Formato da Mensagem</span>
                <button 
                  onClick={() => {
                    const texto = gerarTextoWhatsApp();
                    setModalAberto({tipo: 'preview', dados: {texto}});
                  }} 
                  style={{ padding: '6px 12px', background: '#667eea', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Prévia
                </button>
              </div>
              {[
                { v: 'completo', l: 'Completo', d: 'Todas medidas + área + valor' },
                { v: 'm2', l: 'Área Total', d: 'Área em m² + valor' },
                { v: 'valor', l: 'Simplificado', d: 'Descrição + valor' },
              ].map(f => (
                <label key={f.v} style={{ display: 'block', padding: '15px', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', background: formatoOrcamento === f.v ? '#e8f0fe' : '#f9f9f9', border: formatoOrcamento === f.v ? '2px solid #667eea' : '2px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="radio" checked={formatoOrcamento === f.v} onChange={() => setFormatoOrcamento(f.v as any)} style={{ width: '20px', height: '20px' }} />
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{f.l}</div>
                      <div style={{ fontSize: '13px', color: '#777', marginTop: '2px' }}>{f.d}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Status */}
            <div style={{ marginTop: '24px', marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ABERTO">Em Aberto</option>
                <option value="ENVIADO">Enviado</option>
                <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                <option value="APROVADO">Aprovado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="OBRA_INICIADA">Obra Iniciada</option>
                <option value="OBRA_FINALIZADA">Obra Finalizada</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>

            {/* Validade */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Validade</label>
              <select value={validade} onChange={e => setValidade(Number(e.target.value))} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}>
                {[3,5,10,15,30,45].map(d => <option key={d} value={d}>{d} dias</option>)}
              </select>
            </div>

            {/* Previsão */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Previsão de Início</label>
              <input 
                type="date" 
                value={dataPrevisaoInicio} 
                onChange={e => setDataPrevisaoInicio(e.target.value)} 
                min={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} 
              />
            </div>

            {/* Observações */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>Observações Gerais</label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais..." style={{ width: '100%', padding: '14px 60px 14px 14px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '16px', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <div style={{ position: 'absolute', right: '8px', top: '38px' }}>
                <button
                  type="button"
                  onMouseDown={() => startRecording('observacoes')}
                  onMouseUp={stopRecording}
                  onTouchStart={() => startRecording('observacoes')}
                  onTouchEnd={stopRecording}
                  style={{
                    padding: '10px',
                    background: isRecording === 'observacoes' ? '#ef4444' : '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    minWidth: '44px',
                    minHeight: '44px'
                  }}
                >
                  {isRecording === 'observacoes' ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '2px solid #0ea5e9', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 14px', color: '#0369a1', fontSize: '17px', fontWeight: 700 }}>Resumo</h3>
              <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                <p style={{ margin: 0 }}><strong>Cliente:</strong> {cliente.nome || '—'}</p>
                <p style={{ margin: 0 }}><strong>Endereço:</strong> {cliente.endereco}, {cliente.bairrosCidadeEstado}</p>
                {pagadorDiferente && <p style={{ margin: 0 }}><strong>Pagador:</strong> {pagador.nome} ({pagador.relacao})</p>}
                <p style={{ margin: 0 }}><strong>Cômodos:</strong> {comodos.length} | <strong>Itens:</strong> {comodos.reduce((a,c)=>a+c.itens.length,0)}</p>
                <p style={{ margin: '8px 0 0', fontSize: '15px' }}><strong style={{ color: '#0369a1' }}>🔲 Área Total: {areaTotal().toFixed(2)} m²</strong></p>
                {valorTotal() > 0 && <p style={{ margin: '4px 0 0', fontSize: '16px' }}><strong style={{ color: '#10b981' }}>💰 Valor Total: R$ {valorTotal().toFixed(2)}</strong></p>}
                {formasPagamento.length > 0 && <p style={{ margin: '4px 0 0' }}><strong>Pagamento:</strong> {formasPagamento.join(', ')}</p>}
                <p style={{ margin: '4px 0 0' }}><strong>Status:</strong> {status}</p>
                <p style={{ margin: '4px 0 0' }}><strong>Validade:</strong> {validade} dias</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}><strong>Criado:</strong> {orcamento?.dataCriacao ? new Date(orcamento.dataCriacao).toLocaleDateString('pt-BR') : 'Hoje'}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Botões Finais */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleSalvar} style={{ width: '100%', padding: '16px', background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Save size={20} /> Salvar Orçamento
              </button>
              <button onClick={enviarWhatsApp} style={{ width: '100%', padding: '16px', background: '#25D366', border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={20} /> Enviar pelo WhatsApp
              </button>
              <button onClick={() => gerarPDF({ id: orcamento?.id, cliente, pagadorDiferente, pagador, comodos, formasPagamento, observacoes, formatoOrcamento, status, validade, dataPrevisaoInicio, dataCriacao: orcamento?.dataCriacao || new Date().toISOString(), dataModificacao: new Date().toISOString() }, config || undefined)} style={{ width: '100%', padding: '16px', background: '#667eea', border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FileText size={20} /> Gerar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '20px', 
        right: '20px', 
        display: 'flex', 
        gap: '12px', 
        maxWidth: '800px', 
        margin: '0 auto',
        zIndex: 1000
      }}>
        {step > 0 && (
          <button
            onClick={() => {
              if (step === 3 && comodoAtual !== null) { setComodoAtual(null); setItemAtual(null); setStep(2); }
              else if (step === 4) { setStep(2); } // From payment back to rooms list
              else setStep(step - 1);
            }}
            style={{ 
              flex: 1, 
              padding: '18px', 
              background: 'rgba(255,255,255,0.95)', 
              border: '2px solid #6366F1', 
              borderRadius: '16px', 
              color: '#6366F1', 
              fontSize: '16px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', 
              backdropFilter: 'blur(20px)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <ChevronLeft size={20} /> VOLTAR
          </button>
        )}
        {step < 5 && step !== 3 && (
          <button 
            onClick={() => setStep(step + 1)} 
            style={{ 
              flex: 1, 
              padding: '18px', 
              background: '#6366F1', 
              border: 'none', 
              borderRadius: '16px', 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            PRÓXIMO <ChevronRight size={20} />
          </button>
        )}
        {step === 3 && comodoAtual !== null && (
          <button 
            onClick={() => {
              // Salvar item atual se estiver editando
              if (itemAtual !== null && itemEditado && itemTemAlteracoes) {
                salvarItem();
              }
              setStep(4);
            }} 
            style={{ 
              flex: 1, 
              padding: '18px', 
              background: '#6366F1', 
              border: 'none', 
              borderRadius: '16px', 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            PRÓXIMO <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CriarOrcamento;
