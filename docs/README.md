# Pintor Plus — MVP

PWA offline para pintores: crie orçamentos, gerencie clientes e fornecedores — tudo salvo localmente no dispositivo, sem cadastro.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| PWA | Service Worker, Web App Manifest |
| Storage | LocalStorage (todos os dados) |
| Deploy | Vercel / qualquer servidor estático |

---

## Estrutura do Projeto

```
/
├── app.html              ← Aplicação principal (SPA)
├── index.html            ← Landing page
├── sw.js                 ← Service Worker (cache offline)
├── site.webmanifest      ← Manifesto PWA (app.html)
├── manifest.json         ← Manifesto alternativo (index.html)
├── privacy-policy.html   ← Política de Privacidade e Termos de Uso
├── vercel.json           ← Configuração de deploy e headers HTTP
├── _headers              ← Headers para Netlify/Cloudflare
└── *.png, favicon.*      ← Ícones e assets visuais
```

---

## Funcionalidades do MVP

1. **Orçamentos detalhados** — cômodos, itens, medidas (m² / linear), serviços e materiais
2. **Orçamento Flash** — modo rápido para visita técnica, salva como rascunho
3. **Clientes** — CRUD com histórico de orçamentos por cliente
4. **Fornecedores** — cadastro com ações rápidas de contato
5. **Recibos** — comprovantes simples de pagamento compartilháveis via WhatsApp
6. **WhatsApp** — envio de resumo do orçamento com mensagem personalizada
7. **Dark Mode** — tema claro/escuro via variáveis CSS
8. **PWA instalável** — adicione à tela inicial, funciona offline

> O que **não** está no MVP: Google Drive, Google Calendar, Google Contacts, geração de PDF.
> Veja `MVP_NOTES.md` para o detalhamento do roadmap.

---

## Como usar

### Opção 1 — Abrir direto no navegador

Abra o arquivo `app.html` no navegador (duplo clique ou arraste para o Chrome/Firefox).

```
app.html
```

### Opção 2 — Servidor local (recomendado para PWA)

```bash
npx serve .
# ou
python -m http.server 8080
```

Acesse `http://localhost:8080/app.html`.

### Opção 3 — Deploy estático

```bash
vercel --prod
```

Push para `main` dispara deploy automático na Vercel.

---

## Primeiros passos no app

1. Abra `app.html`
2. Vá em **Configurações** e preencha os dados da empresa (nome, logotipo, assinatura)
3. Crie seu primeiro orçamento via **Orçamento detalhado** ou **Flash**
4. Compartilhe com o cliente pelo WhatsApp

Os dados ficam no `localStorage` do navegador. Para não perder ao trocar de dispositivo, exporte manualmente pelo menu de backup (roadmap — veja `MVP_NOTES.md`).

---

## Desenvolvimento

Sem build step. Edite os arquivos e recarregue o navegador.

Para forçar atualização do Service Worker durante desenvolvimento:
- Abra DevTools → Application → Service Workers → clique "Update"

---

## Segurança

- Headers de segurança configurados em `vercel.json` e `_headers`:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
