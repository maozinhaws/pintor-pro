import jsPDF from 'jspdf';
import { Orcamento, ConfigEmpresa } from './types';

export const gerarPDF = (orcamento: Orcamento, config?: ConfigEmpresa): void => {
  try {
    const doc = new jsPDF();
  let y = 20;

  // Logo e cabeçalho da empresa
  if (config?.logo) {
    doc.addImage(config.logo, 'PNG', 15, y, 30, 30);
    y += 35;
  }

  if (config) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(config.nome, 15, y);
    y += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (config.telefone) doc.text(`Tel: ${config.telefone}`, 15, y);
    y += 5;
    if (config.email) doc.text(`Email: ${config.email}`, 15, y);
    y += 5;
    if (config.endereco) doc.text(config.endereco, 15, y);
    y += 5;
    if (config.cnpj) doc.text(`CNPJ: ${config.cnpj}`, 15, y);
    y += 10;
  }

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO DE PINTURA', 105, y, { align: 'center' });
  y += 10;

  // Dados do cliente
  doc.setFontSize(12);
  doc.text('DADOS DO CLIENTE', 15, y);
  y += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${orcamento.cliente.nome}`, 15, y);
  y += 5;
  doc.text(`Telefone: ${orcamento.cliente.telefone}`, 15, y);
  y += 5;
  if (orcamento.cliente.email) {
    doc.text(`Email: ${orcamento.cliente.email}`, 15, y);
    y += 5;
  }
  doc.text(`Endereço: ${orcamento.cliente.endereco}`, 15, y);
  y += 5;
  doc.text(`Local: ${orcamento.cliente.bairrosCidadeEstado}`, 15, y);
  y += 10;

  // Pagador diferente
  if (orcamento.pagadorDiferente && orcamento.pagador) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PAGADOR', 15, y);
    y += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${orcamento.pagador.nome}`, 15, y);
    y += 5;
    doc.text(`Telefone: ${orcamento.pagador.telefone}`, 15, y);
    y += 5;
    doc.text(`Relação: ${orcamento.pagador.relacao}`, 15, y);
    y += 10;
  }

  // Serviços
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVIÇOS', 15, y);
  y += 7;

  let areaTotal = 0;
  let valorTotal = 0;

  orcamento.comodos.forEach((comodo, idx) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}. ${comodo.nome.toUpperCase()}`, 15, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (comodo.observacoes) {
      doc.text(`Obs: ${comodo.observacoes}`, 20, y);
      y += 5;
    }

    comodo.itens.forEach((item, iIdx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.text(`   ${iIdx + 1}) ${item.nome}`, 20, y);
      y += 5;

      if (item.descricao) {
        const lines = doc.splitTextToSize(`      ${item.descricao}`, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5;
      }

      const base = parseFloat(item.base) || 0;
      const altura = parseFloat(item.altura) || 0;
      const area = item.metroLinear ? altura : base * altura;
      
      if (item.incluirNoCalculo !== false) {
        areaTotal += area;
      }

      if (orcamento.formatoOrcamento === 'completo') {
        doc.text(`      Medidas: ${base}m (B) × ${altura}m (A)`, 20, y);
        y += 5;
        doc.text(`      Área: ${area.toFixed(2)}m²`, 20, y);
        y += 5;
      } else if (orcamento.formatoOrcamento === 'm2') {
        doc.text(`      Área: ${area.toFixed(2)}m²`, 20, y);
        y += 5;
      }
      // Para formato 'valor', não mostra medidas nem área

      if (item.servicos?.length > 0) {
        doc.text(`      Serviços: ${item.servicos.join(', ')}`, 20, y);
        y += 5;
      }

      if (item.valor) {
        const valor = parseFloat(item.valor);
        valorTotal += valor;
        doc.text(`      Valor: R$ ${valor.toFixed(2)}`, 20, y);
        y += 5;
      }

      y += 3;
    });

    y += 5;
  });

  // Totais
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  // Mostra área total apenas se formato não for 'valor'
  if (orcamento.formatoOrcamento !== 'valor') {
    doc.text(`ÁREA TOTAL: ${areaTotal.toFixed(2)} m²`, 15, y);
    y += 7;
  }

  if (valorTotal > 0) {
    doc.text(`VALOR TOTAL: R$ ${valorTotal.toFixed(2)}`, 15, y);
    y += 10;
  }

  // Formas de pagamento
  if (orcamento.formasPagamento.length > 0) {
    doc.setFontSize(11);
    doc.text('FORMAS DE PAGAMENTO', 15, y);
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    orcamento.formasPagamento.forEach(forma => {
      doc.text(`• ${forma}`, 20, y);
      y += 5;
    });
    y += 5;
  }

  // Validade
  doc.setFontSize(9);
  doc.text(`Validade do orçamento: ${orcamento.validade} dias`, 15, y);
  y += 10;

  // Observações
  if (orcamento.observacoes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', 15, y);
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(orcamento.observacoes, 180);
    doc.text(obsLines, 15, y);
  }

  // Salvar
  const nomeArquivo = `Orcamento_${orcamento.cliente.nome.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};
