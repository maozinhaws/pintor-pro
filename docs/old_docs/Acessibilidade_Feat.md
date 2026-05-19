# Relatório de Implementação de Acessibilidade para Deficientes Visuais e Idosos no Pintor Plus

**Data:** 12 de Maio de 2026
**Autor:** Gemini Code Assist
**Contexto:** Implementação de funcionalidades de acessibilidade para pessoas com deficiência visual, especialmente idosos, no aplicativo Pintor Plus (PWA no iOS e WebView no Android).

---

## 1. Introdução

O Pintor Plus, sendo um PWA e um WebView no Android, tem a vantagem de poder implementar muitas funcionalidades de acessibilidade usando padrões web, que são amplamente suportados pelas tecnologias assistivas. O documento `DOCUMENTACAO_TECNICA.md` já menciona um "Modo de Acessibilidade" com "Fontes aumentadas (até 18px)", "Botões maiores (64px altura)", "Contraste aumentado" e "Espaçamento ampliado", o que é um excelente ponto de partida. Este relatório expande sobre como aprimorar essas funcionalidades e garantir uma experiência inclusiva.

---

## 2. Princípios Gerais de Acessibilidade Web (WCAG)

A base para qualquer aplicação web acessível são as **Diretrizes de Acessibilidade para Conteúdo Web (WCAG)**. Elas se baseiam em quatro princípios:

*   **Perceptível:** A informação e os componentes da interface do usuário devem ser apresentáveis aos usuários de formas que eles possam perceber. Isso significa fornecer alternativas para conteúdo não textual (como imagens), garantir contraste suficiente e permitir que o conteúdo seja adaptável (redimensionamento de texto).
*   **Operável:** Os componentes da interface do usuário e a navegação devem ser operáveis. Isso inclui garantir que todas as funcionalidades possam ser acessadas via teclado, que os usuários tenham tempo suficiente para interagir e que a navegação seja clara e consistente.
*   **Compreensível:** A informação e a operação da interface do usuário devem ser compreensíveis. Isso envolve tornar o texto legível, a funcionalidade previsível e fornecer assistência para entrada de dados.
*   **Robusto:** O conteúdo deve ser robusto o suficiente para ser interpretado por uma ampla variedade de agentes de usuário, incluindo tecnologias assistivas. Isso geralmente significa usar marcação HTML semântica e seguir os padrões web.

---

## 3. Implementação para PWA (iOS) e WebView (Android)

A maioria das implementações de acessibilidade baseadas em padrões web funcionará bem em ambos os ambientes, pois tanto o Safari (para PWA no iOS) quanto o WebView (no Android) são navegadores modernos que suportam tecnologias assistivas.

### 3.1. Marcação HTML Semântica e ARIA

*   **Uso de Elementos HTML5 Semânticos:** Utilize tags HTML5 como `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, `<section>`, `<article>`, `<button>`, `<input>`, `<label>`, `<ul>`, `<ol>`, `<li>`, `<table>`, etc., para estruturar o conteúdo. Isso ajuda leitores de tela a entender a estrutura e o propósito de cada parte da página.
    *   **Exemplo:** Em vez de `div` para um botão, use `<button>`. Para uma lista de orçamentos, use `<ul>` e `<li>`.
*   **Atributos ARIA (Accessible Rich Internet Applications):** Para componentes customizados ou quando o HTML semântico não é suficiente, use atributos ARIA.
    *   `aria-label`: Fornece um rótulo acessível para elementos que não têm texto visível ou cujo texto visível não é suficiente (ex: um botão de ícone).
    *   `aria-describedby`: Associa um elemento a uma descrição.
    *   `role`: Define o papel de um elemento (ex: `role="alert"`, `role="dialog"`).
    *   `aria-live`: Para regiões de conteúdo que se atualizam dinamicamente (ex: mensagens de sucesso/erro), garantindo que leitores de tela anunciem as mudanças.
*   **Atributo `lang`:** Declare o idioma principal da página no elemento `<html>` para que os leitores de tela possam usar a pronúncia correta.
    *   **Exemplo:** `<html lang="pt-BR">`

### 3.2. Navegação por Teclado e Gerenciamento de Foco

*   **Ordem de Foco Lógica:** Garanta que a navegação via teclado (usando `Tab` e `Shift+Tab`) siga uma ordem lógica e intuitiva. Elementos interativos devem ser focáveis.
*   **Indicador de Foco Visível:** O navegador geralmente fornece um contorno de foco padrão, mas você pode estilizá-lo para ser mais proeminente, especialmente para usuários com baixa visão.
    *   **Exemplo CSS:**
        ```css
        :focus-visible {
          outline: 2px solid var(--bl); /* Cor primária do Pintor Plus */
          outline-offset: 2px;
        }
        ```
*   **Gerenciamento de Foco:** Ao abrir modais, pop-ups ou atualizar conteúdo dinamicamente, o foco deve ser movido para o novo conteúdo e, ao fechar, retornado ao elemento que o ativou.

### 3.3. Redimensionamento de Texto e Elementos

*   **Unidades Relativas:** Use unidades relativas (`rem`, `em`, `vw`, `vh`) para tamanhos de fonte, espaçamento e dimensões de elementos sempre que possível. Isso permite que o conteúdo se adapte às configurações de tamanho de texto do sistema operacional (Dynamic Type no iOS, Font Scaling no Android) e ao seu "Modo de Acessibilidade".
*   **Zoom da Página:** O conteúdo deve ser funcional e legível mesmo com zoom de até 200% sem perda de conteúdo ou funcionalidade.

### 3.4. Contraste de Cores

*   **WCAG AA/AAA:** Garanta que a relação de contraste entre o texto e seu plano de fundo atenda aos padrões WCAG (mínimo 4.5:1 para texto normal, 3:1 para texto grande e componentes de UI).
    *   Seu "Modo de Acessibilidade" já inclui "Contraste aumentado". Verifique se as cores utilizadas nesse modo atendem aos requisitos WCAG.
    *   **Ferramentas:** Use ferramentas como o WebAIM Contrast Checker ou extensões de navegador para verificar o contraste.
*   **Modo Escuro:** Como o Pintor Plus já tem um Dark Mode, certifique-se de que o contraste seja adequado em ambos os temas.

### 3.5. Alternativas para Conteúdo Não Textual

*   **Atributos `alt` para Imagens:** Todas as imagens que transmitem informações devem ter um atributo `alt` descritivo. Imagens puramente decorativas podem ter `alt=""`.
    *   **Exemplo:** `<img src="logo.png" alt="Logotipo Pintor Plus">`
*   **Transcrições/Legendas:** Se houver conteúdo de áudio ou vídeo (menos provável para o Pintor Plus, mas bom ter em mente), forneça transcrições ou legendas.

### 3.6. Formulários Acessíveis

*   **Rótulos Associados:** Use a tag `<label>` associada aos campos de formulário (`<input>`, `<textarea>`, `<select>`) usando o atributo `for` e o `id` correspondente.
    *   **Exemplo:**
        ```html
        <label for="nomeCliente">Nome do Cliente:</label>
        <input type="text" id="nomeCliente">
        ```
*   **Mensagens de Erro:** As mensagens de erro devem ser claras, descritivas e associadas ao campo que causou o erro. Leitores de tela devem ser notificados sobre esses erros (usando `aria-live="assertive"` ou `aria-describedby`).
*   **Instruções Claras:** Forneça instruções claras para preencher formulários, especialmente para campos complexos.

### 3.7. Notificações e Feedback

*   **Notificações do Service Worker:** As notificações push devem ser concisas e informativas. Leitores de tela no iOS (VoiceOver) e Android (TalkBack) as lerão.
*   **Feedback Visual e Auditivo:** Além do feedback visual (ex: toast messages), considere feedback auditivo sutil para ações importantes, se apropriado, ou garantir que o feedback visual seja anunciado por leitores de tela.

### 3.8. PDFs Acessíveis

*   **PDFs Tagged:** Para que os PDFs gerados sejam acessíveis (lidos por leitores de tela), eles precisam ser "tagged" (marcados com uma estrutura lógica). `html2pdf.js` por si só pode não gerar PDFs totalmente acessíveis.
    *   **Recomendação:** Investigar se há opções ou bibliotecas adicionais que possam ser integradas para gerar PDFs com tags de acessibilidade. Caso contrário, esta pode ser uma limitação do MVP que precisaria ser abordada em uma fase posterior, ou você pode fornecer uma alternativa (ex: visualização web acessível da proposta).

---

## 4. Considerações Específicas

### 4.1. iOS (PWA)

*   **VoiceOver:** O VoiceOver é o leitor de tela do iOS. Ele se baseia fortemente na semântica HTML e nos atributos ARIA. Teste extensivamente com o VoiceOver ativado.
*   **Dynamic Type:** O Safari e, por extensão, os PWAs, geralmente respeitam as configurações de Dynamic Type do iOS. Usar `rem` e `em` é crucial.
*   **Smart Invert/Classic Invert:** Verifique se o app permanece utilizável quando o usuário inverte as cores.

### 4.2. Android (WebView via Capacitor)

*   **TalkBack:** O TalkBack é o leitor de tela do Android. Assim como o VoiceOver, ele depende da semântica HTML e ARIA. Teste com o TalkBack ativado.
*   **Font Scaling:** O WebView geralmente respeita as configurações de escala de fonte do Android. Novamente, unidades relativas são a chave.
*   **Accessibility Scanner:** Use a ferramenta "Accessibility Scanner" do Google (disponível na Play Store) para identificar problemas comuns de acessibilidade em seu aplicativo Android (incluindo o WebView).
*   **Capacitor Plugins:** Se você usar plugins Capacitor para funcionalidades nativas (ex: câmera, compartilhamento), certifique-se de que a interface nativa desses plugins também seja acessível.

---

## 5. Sugestões de Código e Melhorias (Baseado em `app.html`)

Seu "Modo de Acessibilidade" já é um grande passo. Para aprimorá-lo:

1.  **Integração com Preferências do Sistema:**
    *   **Media Queries:** Use media queries CSS para detectar preferências do usuário, como `prefers-reduced-motion` (para animações) e `prefers-color-scheme` (para modo escuro, embora você já tenha um toggle).
    *   **Exemplo:**
        ```css
        /* Para reduzir animações para usuários com preferência */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        ```
2.  **Melhoria do Toggle de Acessibilidade:**
    *   Em vez de apenas um toggle, considere ter opções mais granulares dentro das configurações de acessibilidade, permitindo que o usuário ative/desative individualmente "Fontes aumentadas", "Contraste aumentado", etc.
    *   Garanta que o estado dessas configurações seja persistido (provavelmente já está via LocalStorage).
3.  **Validação de Contraste:**
    *   Revise todas as combinações de cores no modo normal e no modo de acessibilidade para garantir que atendam aos requisitos WCAG.
    *   Seu `Design System` em `DOCUMENTACAO_TECNICA.md` define cores. Verifique as combinações de `--ink` com `--bg`, `--ink2` com `--bg2`, etc.
4.  **Foco no `app.html`:**
    *   Como o `app.html` é a SPA principal, é onde a maior parte do trabalho de semântica HTML e ARIA será feita.
    *   Revise os elementos interativos (botões, links, campos de formulário) para garantir que sejam acessíveis via teclado e tenham rótulos claros para leitores de tela.

---

## 6. Checklist Rápido para Desenvolvimento

*   [ ] **HTML Semântico:** Usar tags HTML5 apropriadas.
*   [ ] **ARIA:** Aplicar atributos ARIA quando necessário para clareza.
*   [ ] **Teclado:** Testar toda a navegação e funcionalidade apenas com o teclado.
*   [ ] **Foco:** Garantir indicador de foco visível e gerenciamento de foco lógico.
*   [ ] **Texto:** Usar unidades relativas (`rem`, `em`) para tamanhos de fonte.
*   [ ] **Contraste:** Verificar todas as combinações de cores (ferramentas online).
*   [ ] **Imagens:** Atributos `alt` descritivos para todas as imagens informativas.
*   [ ] **Formulários:** Rótulos associados, mensagens de erro claras.
*   [ ] **Leitores de Tela:** Testar com VoiceOver (iOS) e TalkBack (Android).
*   [ ] **Modo de Acessibilidade:** Validar que as configurações personalizadas funcionam bem e se integram com as do sistema.
*   [ ] **PDFs:** Investigar a geração de PDFs acessíveis (tagged PDFs).

---

Ao seguir essas diretrizes, o Pintor Plus pode se tornar uma ferramenta muito mais inclusiva e útil para um público mais amplo, incluindo pessoas com deficiência visual e idosos.