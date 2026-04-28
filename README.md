# Pintor Plus — Orçamentos Inteligentes

PWA profissional para pintores: gerencie orçamentos, clientes, fornecedores e agenda, com backup automático no Google Drive.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| PWA | Service Worker, Web App Manifest |
| Storage | LocalStorage (dados), Google Drive (backup) |
| Auth | Google Identity Services (GSI) |
| Integração | Google Drive, Google Calendar, Google Contacts |
| Criptografia | Web Crypto API — AES-GCM (dados sensíveis) |
| Deploy | Vercel |

---

## Estrutura do Projeto

```
/
├── app.html                  ← Aplicação principal (SPA)
├── index.html                ← Landing page
├── sw.js                     ← Service Worker
├── site.webmanifest          ← Manifesto PWA principal (usado por app.html)
├── manifest.json             ← Manifesto alternativo (usado por index.html)
├── privacy-policy.html       ← Política de Privacidade e Termos de Uso
├── vercel.json               ← Configuração de deploy e headers HTTP
├── _headers                  ← Headers para Netlify/Cloudflare
├── _redirects                ← Redirecionamentos
├── .well-known/
│   └── assetlinks.json       ← Android App Links (template)
├── Native_App_Project/       ← Scaffolding Capacitor (app nativo)
│   ├── package.json
│   ├── capacitor.config.json
│   └── README.md
└── *.png, favicon.*          ← Ícones e assets visuais
```

---

## Funcionalidades

1. **Orçamentos**: criação detalhada com cômodos, itens, medidas (m² / linear), serviços, materiais e fotos
2. **Flash**: orçamento rápido para visitas técnicas, com câmera integrada
3. **Clientes**: CRUD com importação do Google Contacts ou agenda do celular
4. **Fornecedores**: cadastro com ações rápidas de contato
5. **Agenda**: agendamentos com lembretes e integração com Google Calendar
6. **PDF**: geração de proposta comercial com fotos e dados da empresa
7. **WhatsApp**: compartilhamento de orçamentos com mensagem personalizada
8. **Backup Drive**: sync automático e manual com Google Drive
9. **Recibos**: geração de comprovantes simples de pagamento
10. **Dark Mode**: tema claro/escuro com variáveis CSS
11. **Modo Convidado**: explorar o app sem conta Google

---

## PWA — Experiência Premium

O manifesto (`site.webmanifest`) está configurado com:

- **Shortcuts**: atalhos na tela inicial para "Novo Orçamento", "Flash", "Agenda" e "Sincronizar"
- **Screenshots**: metadados para exibição na UI de instalação enriquecida do Chrome
- **Share Target**: aceita compartilhamento de texto e URLs de outros apps
- **Protocol Handlers**: suporte a links `web+pintorplus://`
- **Display Override**: suporte a Window Controls Overlay (desktop)

### Deep Linking

URLs com parâmetro `?action=` permitem atalhos diretos:

| URL | Ação |
|-----|------|
| `/app.html?action=new-orc` | Abre novo orçamento |
| `/app.html?action=flash` | Abre modo Flash |
| `/app.html?action=agenda` | Abre a Agenda |
| `/app.html?action=sync` | Dispara sincronização Drive |
| `/app.html?proto=web+pintorplus://orcamento` | Deep link nativo |

### iOS — Otimizações

O `app.html` inclui:
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- 14 `<link rel="apple-touch-startup-image">` cobrindo todos os iPhones e iPads modernos

---

## Política de Privacidade

A política está em `/privacy-policy.html` e acessível em:

```
https://pintorplus.com.br/privacy-policy
```

*(Configurado via rewrite em `vercel.json`)*

### URLs a registrar nos serviços:

| Serviço | Campo | URL |
|---------|-------|-----|
| Google Cloud Console | OAuth Consent Screen → Privacy Policy URL | `https://pintorplus.com.br/privacy-policy` |
| Google Cloud Console | Authorized Domains | `pintorplus.com.br` |
| Google Play Console | App content → Privacy policy | `https://pintorplus.com.br/privacy-policy` |
| App Store Connect | App Information → Privacy Policy URL | `https://pintorplus.com.br/privacy-policy` |

---

## App Nativo (Capacitor)

O diretório `Native_App_Project/` contém o scaffolding para empacotar o PWA como app nativo Android/iOS usando Capacitor.

Consulte [`Native_App_Project/README.md`](./Native_App_Project/README.md) para o guia completo.

---

## Desenvolvimento Local

```bash
# Sem build step necessário — abra diretamente no browser
open app.html
# ou use um servidor local:
npx serve .
```

---

## Deploy

Feito via **Vercel**. Push para `main` dispara deploy automático.

```bash
vercel --prod
```

---

## Segurança

- Todos os dados sensíveis são criptografados com **AES-GCM** (Web Crypto API) antes de salvar no `localStorage` e no Google Drive
- Headers de segurança configurados em `vercel.json` e `_headers`:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
