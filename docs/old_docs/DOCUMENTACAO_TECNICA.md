# Pintor Plus — Documentação Técnica Completa

> **Versão:** 1.0.0  
> **Última atualização:** Março de 2026  
> **Domínio:** pintorplus.com.br

---

## Visão Geral

O **Pintor Plus** é um Progressive Web App (PWA) profissional desenvolvido para pintores, permitindo gerenciar orçamentos, clientes, fornecedores e agenda com backup automático no Google Drive.

### Propósito
- Criar orçamentos detalhados e rápidos (modo Flash) para visitas técnicas
- Gerar recibos e propostas comerciais em PDF
- Sincronizar dados com Google Drive para acesso multi-dispositivo
- Funcionar offline com sincronização automática quando conectado

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **PWA** | Service Worker, Web App Manifest |
| **Armazenamento Local** | LocalStorage (dados do usuário) |
| **Armazenamento Nuvem** | Google Drive API (backup) |
| **Autenticação** | Google Identity Services (GSI) - OAuth 2.0 |
| **Criptografia** | Web Crypto API — AES-GCM (dados sensíveis) |
| **Geração de PDF** | html2pdf.js |
| **Integrações** | Google Drive, Google Calendar, Google Contacts |
| **App Nativo** | Capacitor (Android/iOS) |
| **Deploy** | Vercel |

---

## Estrutura do Projeto

```
FINAL/
├── app.html                      # Aplicação principal (SPA)
├── index.html                    # Landing page institucional
├── sw.js                         # Service Worker (cache + notificações)
├── site.webmanifest              # Manifesto PWA principal
├── manifest.json                 # Manifesto alternativo
├── privacy-policy.html           # Política de Privacidade e Termos
├── vercel.json                   # Configuração de deploy e headers
├── _headers                      # Headers para Netlify/Cloudflare
├── _redirects                    # Redirecionamentos
├── config.json                   # Configuração da estrutura Drive
├── .well-known/
│   └── assetlinks.json           # Android App Links
├── Native_App_Project/           # Scaffolding Capacitor
│   ├── package.json
│   ├── capacitor.config.json
│   └── README.md
├── skills/                       # Skills do OpenClaude
├── *.png, favicon.*              # Ícones e assets visuais
└── Python scripts:
    ├── seguranca_app.py          # Módulo de segurança
    ├── google_drive_structure.py # Estrutura de pastas Drive
    ├── utils.py                  # Utilitários
    └── iniciar_estrutura_drive.py# Inicialização da estrutura
```

---

## Funcionalidades Principais

### 1. Orçamentos Detalhados
- **Entrada:** Menu principal → "Orçamento detalhado"
- **Características:**
  - Criação por ambientes/cômodos
  - Itens com medidas (m², linear, unidade)
  - Serviços personalizáveis
  - Preço por m² ou valor fixo
  - Upload de fotos dos itens
  - Preenchimento guiado passo a passo (4 etapas)
  - Sugestões automáticas de serviços
- **Saída:** PDF gerado com proposta comercial completa

### 2. Orçamento Flash
- **Entrada:** Menu principal → Botão "⚡ FLASH"
- **Características:**
  - Versão rápida para visitas técnicas
  - 3 passos simplificados: Cliente → Descrição → Valor
  - Salva como rascunho
  - Conversão posterior em orçamento completo
- **UX:** "Comece agora. Termine depois."

### 3. Gestão de Clientes
- **CRUD completo** de clientes
- **Importação** do Google Contacts
- **Importação** da agenda do celular
- **Histórico** de orçamentos por cliente
- **Busca inteligente** com filtro em tempo real

### 4. Fornecedores
- Cadastro com nome, contato, endereço
- **Ações rápidas:** ligar, WhatsApp, email
- Categorização por tipo de fornecedor

### 5. Agenda de Obras
- Visualização de eventos programados (7 dias)
- **Lembretes** com notificações push via Service Worker
- **Integração** com Google Calendar (opcional)
- **Deep linking** para eventos específicos

### 6. Geração de PDF
- **Tecnologia:** html2pdf.js
- **Tipos de documento:**
  - Proposta comercial completa (orçamentos)
  - Recibos de pagamento
- **Elementos incluídos:**
  - Dados da empresa (logotipo)
  - Dados do cliente
  - Itens e serviços detalhados
  - Fotos dos itens
  - Assinatura digital do pintor
  - Valor total formatado

### 7. Compartilhamento WhatsApp
- **Tecnologia:** API `wa.me` com texto pré-formatado
- **Template personalizável** nas configurações
- **Resumo automático** do orçamento
- **Link** para visualização do PDF

### 8. Backup Google Drive
- **Sincronização automática** ao criar/editar dados
- **Sincronização manual** via botão no menu
- **Escopos utilizados:**
  - `https://www.googleapis.com/auth/drive.appdata`
  - `https://www.googleapis.com/auth/drive.file`
- **Estrutura de pastas criada:**
  ```
  Pintor-Plus/
  ├── Contatos/           (.vcf, .vcs)
  ├── PDFs/
  │   ├── Recibos/
  │   └── Orçamentos/
  ├── Imagens/
  │   ├── Itens/
  │   ├── Assinaturas/
  │   └── Logotipo/
  ├── Planilhas/
  └── Backup/
  ```

### 9. Recibos
- Geração de comprovantes de pagamento
- Campos: cliente, descrição, valor, data, assinaturas
- Exportação PDF e compartilhamento

### 10. Dark Mode
- **Ativação:** Toggle no header principal
- **Implementação:** Variáveis CSS com classe `.dark` no `:root`
- **Persistência:** LocalStorage

### 11. Modo Convidado
- Explorar o app sem login Google
- **Limitação:** Dados salvos apenas localmente
- **Risco:** Perda de dados ao limpar cache/navegador

### 12. Modo de Acessibilidade
- **Ativação:** Configurações → Acessibilidade
- **Características:**
  - Fontes aumentadas (até 18px)
  - Botões maiores (64px altura)
  - Contraste aumentado
  - Espaçamento ampliado

---

## PWA — Recursos Avançados

### Web App Manifest (`site.webmanifest`)

```json
{
  "name": "Pintor Plus - Orçamentos Inteligentes",
  "short_name": "Pintor+",
  "start_url": "/app.html?source=pwa",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
  "theme_color": "#7C3AED",
  "background_color": "#F8FAFC",
  "orientation": "portrait",
  "share_target": {...},
  "protocol_handlers": [{"protocol": "web+pintorplus", "url": "/app.html?proto=%s"}],
  "shortcuts": [
    {"name": "Novo Orçamento", "url": "/app.html?action=new-orc"},
    {"name": "Flash", "url": "/app.html?action=flash"},
    {"name": "Agenda", "url": "/app.html?action=agenda"},
    {"name": "Sincronizar", "url": "/app.html?action=sync"}
  ]
}
```

### Deep Linking

| URL | Ação |
|-----|------|
| `/app.html?action=new-orc` | Abre novo orçamento |
| `/app.html?action=flash` | Abre modo Flash |
| `/app.html?action=agenda` | Abre a Agenda |
| `/app.html?action=sync` | Dispara sincronização Drive |
| `/app.html?proto=web+pintorplus://orcamento` | Deep link nativo |

### Service Worker (`sw.js`)

**Funcionalidades:**
- **Cache estratégico:**
  - Network-first para HTMLs principais
  - Cache-first para assets estáticos e fontes
  - Bypass para APIs externas (Google, OAuth)
- **Notificações em background:**
  - Sistema de alarmes para lembretes da agenda
  - `periodicsync` para verificação a cada 15 minutos
  - Clique na notificação → abre o app na agenda
- **Comunicação com o app:**
  - Mensagem `sync-alarms`: atualiza lista de alarmes
  - Mensagem `show-notification`: exibe notificação imediata

### iOS Optimizations

O `app.html` inclui:
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- 14 `<link rel="apple-touch-startup-image">` para todos os dispositivos iOS modernos

---

## Segurança

### Criptografia de Dados
- **Algoritmo:** AES-GCM (Web Crypto API)
- **Aplicação:** Dados sensíveis antes de salvar no LocalStorage e Google Drive
- **Chave:** Derivada contextualmente, armazenada de forma efêmera

### Headers de Segurança (`vercel.json`)

```json
{
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com..."
}
```

### Módulo Python de Segurança (`seguranca_app.py`)

**Funcionalidades:**
- Verificação de vazamento de dados sensíveis no Drive
- Padrões detectados: CPF, CNPJ, RG, SSN, cartão de crédito, email, IP
- Detecção de acesso não autorizado (compartilhamento público)
- Verificação de integridade de arquivos críticos
- Relatório automático de segurança
- Correções automáticas (remoção de permissões excessivas)

### Padrões Sensíveis Detectados

```python
sensitive_patterns = [
    r'\b\d{3}-?\d{2}-?\d{4}\b',                    # SSN
    r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b',           # CPF
    r'\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b',   # CNPJ
    r'\b[A-Z]{2}\d{7}\b',                          # RG
    r'\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b', # Cartão de crédito
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', # Email
    r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'      # IP
]
```

---

## App Nativo (Capacitor)

### Configuração (`capacitor.config.json`)

```json
{
  "appId": "br.com.pintorplus.app",
  "appName": "Pintor Plus",
  "server": {
    "url": "https://pintorplus.com.br/app.html",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "backgroundColor": "#7C3AED",
      "launchShowDuration": 2000
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#7C3AED"
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

### Plugins Capacitor Instalados

| Plugin | Versão | Finalidade |
|--------|--------|------------|
| `@capacitor/android` | 6.x | Plataforma Android |
| `@capacitor/ios` | 6.x | Plataforma iOS |
| `@capacitor/app` | 6.x | Ciclo de vida do app |
| `@capacitor/push-notifications` | 6.x | Notificações push |
| `@capacitor/share` | 6.x | Compartilhamento nativo |
| `@capacitor/splash-screen` | 6.x | Splash screen nativa |
| `@capacitor/status-bar` | 6.x | Barra de status |
| `@capacitor/keyboard` | 6.x | Controle do teclado |
| `@capacitor/haptics` | 6.x | Feedback tátil |

### Google OAuth Nativo

**Plugin recomendado:** `@codetrix-studio/capacitor-google-auth`

**Configuração:**
```json
{
  "plugins": {
    "GoogleAuth": {
      "scopes": [
        "profile",
        "email",
        "https://www.googleapis.com/auth/drive.appdata",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts.readonly"
      ],
      "serverClientId": "SEU_OAUTH_CLIENT_ID.apps.googleusercontent.com"
    }
  }
}
```

### Deep Linking Nativo

**Android App Links:**
- Arquivo: `/.well-known/assetlinks.json`
- Requer SHA-256 da keystore de release
- Intent filters no `AndroidManifest.xml`

**iOS Universal Links:**
- Arquivo: `/.well-known/apple-app-site-association`
- Associated Domains no Xcode: `applinks:pintorplus.com.br`

---

## Configurações do App

### Dados da Empresa
- Nome da empresa
- Logotipo (upload)
- Assinatura digital (upload)
- Dados de contato

### Mensagem WhatsApp
- Template personalizável
- Variáveis dinâmicas: `{cliente}`, `{valor}`, `{data}`

### Listas Padrão
- Serviços pré-cadastrados
- Materiais comuns
- Cores e acabamentos

### Acessibilidade
- Toggle para modo de fonte aumentada
- Contraste aumentado
- Botões ampliados

---

## Fluxo de Autenticação

1. **Login com Google** (obrigatório para backup)
   - OAuth 2.0 via Google Identity Services
   - Escopos mínimos: perfil, email, Drive appdata
2. **Modo Convidado** (opcional)
   - Acesso limitado
   - Dados apenas locais
   - Alerta de perda de dados

### Dados Coletados no Login
- Nome completo
- Endereço de email
- URL da foto de perfil
- **Não coletado:** E-mails, contatos, calendário sem permissão explícita

---

## Política de Privacidade

**URL:** `https://pintorplus.com.br/privacy-policy`

### Princípios
- **Armazenamento:** Local (localStorage) + Google Drive do usuário
- **Sem servidor próprio:** O app não possui backend de dados
- **Sem compartilhamento:** Dados não são vendidos ou repassados
- **Sem spam:** Email usado apenas para identificação da conta
- **Sem marketing:** Nenhuma comunicação não solicitada

### URLs para Registro nas Lojas

| Serviço | Campo | URL |
|---------|-------|-----|
| Google Play Console | Privacy policy | `https://pintorplus.com.br/privacy-policy` |
| App Store Connect | Privacy Policy URL | `https://pintorplus.com.br/privacy-policy` |
| Google Cloud Console | OAuth Consent → Privacy Policy | `https://pintorplus.com.br/privacy-policy` |
| Google Cloud Console | Authorized domains | `pintorplus.com.br` |

---

## Desenvolvimento Local

```bash
# Sem build step — abrir diretamente no browser
open app.html

# Ou usar servidor local
npx serve .
```

---

## Deploy

**Plataforma:** Vercel

```bash
# Deploy de produção
vercel --prod
```

**Configurações:**
- Push para `main` → deploy automático
- Rewrites configurados em `vercel.json`
- Headers de segurança aplicados globalmente

---

## Variáveis de CSS (Design System)

### Cores (Light Mode)

```css
:root {
  --bl: #7C3AED;      /* Roxo primário */
  --bld: #6D28D9;     /* Roxo escuro */
  --bll: #F5F3FF;     /* Roxo claro (background) */
  --gn: #10B981;      /* Verde (sucesso) */
  --gnl: #ECFDF5;     /* Verde claro */
  --rd: #EF4444;      /* Vermelho (erro/delete) */
  --rdl: #FEF2F2;     /* Vermelho claro */
  --am: #F59E0B;      /* Âmbar (alerta/flash) */
  --aml: #FFFBEB;     /* Âmbar claro */
  --ink: #0F172A;     /* Texto principal */
  --ink2: #334155;    /* Texto secundário */
  --ink3: #64748B;    /* Texto terciário */
  --bg: #F8FAFC;      /* Background geral */
  --bg2: #F1F5F9;     /* Background secundário */
  --bdr: #E2E8F0;     /* Bordas */
}
```

### Dark Mode

Ativado via classe `.dark` no `:root`, com inversão de cores e ajuste de contraste.

---

## Scripts Python (Backend Tools)

### `google_drive_structure.py`
- Cria estrutura de pastas no Drive
- Migração de dados antigos
- Classificação automática de arquivos

### `seguranca_app.py`
- Verificação de dados sensíveis
- Detecção de compartilhamento não autorizado
- Relatório de segurança
- Correções automáticas

### `utils.py`
- Carregamento de `config.json`
- Validação de credenciais
- Classificação de arquivos por tipo

---

## Checklist de Release

### Web
- [ ] Testar sincronização Drive em dispositivo real
- [ ] Verificar notificações em background (Chrome Android)
- [ ] Validar deep links
- [ ] Testar modo offline

### Nativo (Capacitor)
- [ ] Atualizar `version` em `package.json` e `capacitor.config.json`
- [ ] Gerar ícones e splash screens com `@capacitor/assets`
- [ ] Assinar APK/AAB com keystore de release
- [ ] Atualizar `assetlinks.json` com SHA-256 da keystore
- [ ] Testar OAuth em dispositivo físico
- [ ] Testar deep links (Android e iOS)
- [ ] Validar notificações push em modo release

---

## Contato e Suporte

- **Site:** pintorplus.com.br
- **Política de Privacidade:** pintorplus.com.br/privacy-policy
- **Domínio autorizado:** pintorplus.com.br

---

*Documentação gerada com base nos arquivos do projeto em Março de 2026.*
