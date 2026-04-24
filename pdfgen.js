// ============================================
// PINTOR PLUS - PDF GENERATION
// ============================================

/**
 * Handles PDF generation for orçamentos and other documents
 */
const PDFGen = {
  // PDF configuration
  config: {
    pageSize: 'A4', // or 'Letter'
    orientation: 'portrait', // or 'landscape'
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    headerHeight: 30,
    footerHeight: 20,
    fontSize: {
      title: 18,
      heading: 14,
      normal: 11,
      small: 9
    },
    colors: {
      primary: '#2563eb', // blue-600
      secondary: '#64748b', // slate-500
      dark: '#1e293b', // slate-800
      light: '#f8fafc' // slate-50
    }
  },

  /**
   * Generate PDF for an orçamento
   * @param {Object} orcamento - The orçamento data
   * @param {Object} options - Optional configuration
   * @returns {Promise} Resolves with PDF blob
   */
  async generateOrcamentoPDF(orcamento, options = {}) {
    console.log('[PP-PDF] Generating PDF for orçamento:', orcamento.id || orcamento._id);

    try {
      // In a real implementation, this would use a PDF library like pdfmake or jsPDF
      // For now, we'll create a simple HTML-based PDF simulation

      const pdfConfig = { ...this.config, ...options };
      const pdfContent = this._createOrcamentoHTML(orcamento, pdfConfig);

      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a blob representing the PDF
      // In reality, this would be actual PDF binary data
      const pdfBlob = new Blob([pdfContent], {
        type: 'application/pdf'
      });

      console.log('[PP-PDF] PDF generated successfully');
      return pdfBlob;
    } catch (error) {
      console.error('[PP-PDF] Error generating PDF:', error);
      throw error;
    }
  },

  /**
   * Create HTML content for orçamento (used as basis for PDF)
   * @param {Object} orcamento - The orçamento data
   * @param {Object} config - PDF configuration
   * @returns {string} HTML content
   */
  _createOrcamentoHTML(orcamento, config) {
    const {
      numero = 'ORC-0001',
      data = new Date().toLocaleDateString('pt-BR'),
      validade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      cliente = { nome: 'Cliente Exemplo', endereco: 'Endereço do Cliente', telefone: '(00) 0000-0000' },
      itens = [],
      descontos = 0,
      acrescimos = 0,
      observacoes = 'Nenhuma observação',
      termos = 'Termos e condições padrão'
    } = orcamento;

    // Calculate totals
    const subtotal = itens.reduce((sum, item) => sum + (item.quantidade * item.unitario), 0);
    const total = subtotal - descontos + acrescimos;

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: ${config.pageSize};
            margin: ${config.margins.top}mm ${config.margins.right}mm ${config.margins.bottom}mm ${config.margins.left}mm;
          }

          body {
            font-family: 'Sora', sans-serif;
            font-size: ${config.fontSize.normal}px;
            color: ${config.colors.dark};
            line-height: 1.4;
          }

          .header {
            text-align: center;
            margin-bottom: ${config.headerHeight}mm;
          }

          .company-info {
            margin-bottom: 10px;
          }

          .company-name {
            font-size: ${config.fontSize.title}px;
            font-weight: 800;
            color: ${config.colors.primary};
            margin-bottom: 5px;
          }

          .company-details {
            font-size: ${config.fontSize.small}px;
            color: ${config.colors.secondary};
          }

          .title {
            font-size: ${config.fontSize.heading}px;
            font-weight: 700;
            text-align: center;
            margin: 20px 0;
            color: ${config.colors.dark};
          }

          .info-section {
            margin-bottom: 20px;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .info-label {
            font-weight: 600;
            color: ${config.colors.secondary};
          }

          .info-value {
            text-align: right;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }

          th {
            background-color: ${config.colors.light};
            font-weight: 600;
          }

          tbody tr:hover {
            background-color: #f5f5f5;
          }

          .total-row {
            font-weight: 700;
            background-color: ${config.colors.light};
          }

          .notes-section, .terms-section {
            margin-top: 25px;
            padding: 15px;
            background-color: ${config.colors.light};
            border-radius: 5px;
          }

          .section-title {
            font-size: ${config.fontSize.small}px;
            font-weight: 600;
            color: ${config.colors.primary};
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .footer {
            text-align: center;
            margin-top: ${config.footerHeight}mm;
            font-size: ${config.fontSize.small}px;
            color: ${config.colors.secondary};
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-name">Pintor Plus</div>
            <div class="company-details">
              Orçamentos Profissionais de Pintura<br>
              (00) 0000-0000 | contato@pintorplus.com
            </div>
          </div>

          <div class="title">ORÇAMENTO</div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Número:</span>
              <span class="info-value">${numero}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Data:</span>
              <span class="info-value">${data}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Validade:</span>
              <span class="info-value">${validade}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Cliente:</span>
              <span class="info-value">${cliente.nome}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Endereço:</span>
              <span class="info-value">${cliente.endereco}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Telefone:</span>
              <span class="info-value">${cliente.telefone}</span>
            </div>
          </div>

          ${itens.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Quantidade</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itens.map(item => `
                <tr>
                  <td>${item.descricao || ''}</td>
                  <td>${item.quantidade || 0}</td>
                  <td>${item.unitario ? parseFloat(item.unitario).toFixed(2) : '0,00'}</td>
                  <td>${(item.quantidade * item.unitario) ? parseFloat(item.quantidade * item.unitario).toFixed(2) : '0,00'}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3">Subtotal</td>
                <td>${parseFloat(subtotal).toFixed(2)}</td>
              </tr>
              ${descontos > 0 ? `
              <tr>
                <td colspan="3">Descontos</td>
                <td>-${parseFloat(descontos).toFixed(2)}</td>
              </tr>
              ` : ''}
              ${acrescimos > 0 ? `
              <tr>
                <td colspan="3">Acréscimos</td>
                <td>+${parseFloat(acrescimos).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>${parseFloat(total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          ` : '<p>Nenhum item adicionado ao orçamento.</p>'}

          ${observacoes && observacoes.trim() !== '' ? `
          <div class="notes-section">
            <div class="section-title">Observações</div>
            <p>${observacoes}</p>
          </div>
          ` : ''}

          ${termos && termos.trim() !== '' ? `
          <div class="terms-section">
            <div class="section-title">Termos e Condições</div>
            <p>${termos}</p>
          </div>
          ` : ''}

          <div class="footer">
            Documento gerado pelo Pintor Plus em ${new Date().toLocaleString('pt-BR')}<br>
            Este orçamento possui validade de 30 dias a partir da data de emissão.
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Generate PDF for a list of clients
   * @param {Array} clientes - Array of client data
   * @returns {Promise} Resolves with PDF blob
   */
  async generateClientesPDF(clientes) {
    console.log('[PP-PDF] Generating PDF for clientes list');
    // Similar implementation to orçamento PDF but for clients list
    return this.generateOrcamentoPDF({}); // Placeholder
  },

  /**
   * Generate PDF for a list of products/services
   * @param {Array} produtos - Array of product data
   * @returns {Promise} Resolves with PDF blob
   */
  async generateProdutosPDF(produtos) {
    console.log('[PP-PDF] Generating PDF for produtos list');
    // Similar implementation to orçamento PDF but for products list
    return this.generateOrcamentoPDF({}); // Placeholder
  },

  /**
   * Save PDF to local storage (for later retrieval)
   * @param {Blob} pdfBlob - The PDF blob
   * @param {string} filename - Filename for the PDF
   */
  savePDF(pdfBlob, filename) {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Get PDF configuration
   * @returns {Object} Current PDF configuration
   */
  getConfig() {
    return { ...this.config };
  },

  /**
   * Set PDF configuration
   * @param {Object} config - New configuration
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFGen;
}