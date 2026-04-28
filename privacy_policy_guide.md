# Guia de Hospedagem da Política de Privacidade

## Importância da Política de Privacidade

A política de privacidade é um requisito fundamental para:

- Lojas de aplicativos (Google Play Store e Apple App Store)
- Integração com serviços como Google OAuth
- Conformidade com leis de proteção de dados (LGPD no Brasil)
- Transparência com os usuários sobre o tratamento de seus dados

## Localização Ideal

A política de privacidade deve estar disponível em um URL permanente e acessível, por exemplo:

```
https://pintorplus.com.br/privacy-policy
```

## Conteúdo da Política de Privacidade

A política de privacidade do Pintor Plus deve incluir:

### 1. Dados Coletados
- Informações de identificação (nome, email) através da autenticação com Google
- Dados de orçamentos e clientes criados pelo usuário
- Dados de localização (opcional, para cálculo de distâncias)
- Dados de uso do aplicativo (funcionalidades utilizadas)

### 2. Finalidade do Tratamento
- Sincronização com Google Drive
- Armazenamento e recuperação de orçamentos
- Compartilhamento de dados entre dispositivos
- Melhoria da experiência do usuário

### 3. Compartilhamento de Dados
- Dados são sincronizados apenas com a conta Google do usuário
- Nenhum dado é compartilhado com terceiros sem consentimento
- Integração com Google Drive para armazenamento pessoal

### 4. Segurança
- Dados criptografados localmente com AES-GCM
- Uso de tokens OAuth com escopos mínimos
- Conformidade com as políticas de segurança do Google

### 5. Retenção de Dados
- Dados mantidos enquanto a conta do usuário estiver ativa
- Opção de exclusão de dados pelo usuário
- Sincronização opcional com Google Drive

## Implementação Técnica

### 1. Hospedagem
- Servir o arquivo `privacy-policy.html` no servidor raiz
- Garantir que o URL seja estático e permanente
- Configurar cache apropriado

### 2. Atualização do Google Cloud Console
No Console de Identidade do Google (Google Cloud Console):

1. Ir para APIs & Serviços > Credenciais
2. Editar o OAuth 2.0 Client ID
3. Atualizar o campo "Authorized domains" com:
   ```
   pintorplus.com.br
   ```

### 3. Links no Aplicativo
Garantir que os seguintes links apontem para a política de privacidade:

- Link no rodapé do aplicativo
- Link na tela de login/oauth
- Link nas configurações do aplicativo
- Link nas lojas de aplicativos

## Verificação

Após a implementação, verifique:

- [ ] O URL da política de privacidade está acessível publicamente
- [ ] O conteúdo está completo e atualizado
- [ ] Todos os links internos apontam corretamente
- [ ] O Google Cloud Console está atualizado com o domínio
- [ ] As lojas de aplicativos têm o link correto na descrição

## Atualizações

A política de privacidade deve ser revista periodicamente:

- Sempre que houver mudanças nas funcionalidades
- Anualmente para garantir conformidade
- Após qualquer incidente de segurança
- Quando houver alterações em leis de proteção de dados