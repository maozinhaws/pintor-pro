# Deploy — Pintor Plus MVP

PWA estática. Sem build step. Qualquer host de arquivos estáticos funciona.

---

## Opção 1 — Cloudflare Pages (recomendado)

### Deploy via painel web

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create a project** → **Connect to Git** → selecione o repositório `pintor-plus-mvp`
3. Configurações de build:
   - **Build command:** *(deixe vazio)*
   - **Build output directory:** `/` (raiz)
4. Clique em **Save and Deploy**
5. URL gerada: `https://pintor-plus-mvp.pages.dev`

### Deploy via CLI (wrangler)

```bash
npx wrangler pages deploy . --project-name pintor-plus-mvp
```

### Configurar domínio customizado (opcional)

Em **Settings → Custom domains** no painel Cloudflare Pages, adicione seu domínio.

---

## Opção 2 — Vercel

```bash
npx vercel --prod
```

Ou conecte o repositório GitHub no painel [vercel.com](https://vercel.com).
Configuração já presente em `vercel.json`.

---

## Opção 3 — Netlify

```bash
npx netlify deploy --prod --dir .
```

Headers já configurados em `_headers` e redirects em `_redirects`.

---

## Configuração OAuth do Google (se necessário no futuro)

> O MVP atual **não usa OAuth**. Estas instruções são para versões futuras com Google Drive/Calendar.

Após obter o domínio `.pages.dev`:

1. Acesse [Google Cloud Console](https://console.cloud.google.com) → **APIs & Serviços** → **Credenciais**
2. Edite o **OAuth 2.0 Client ID**
3. Em **Origens JavaScript autorizadas**, adicione:
   ```
   https://pintor-plus-mvp.pages.dev
   ```
4. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   https://pintor-plus-mvp.pages.dev/auth/callback
   ```
5. Salve e aguarde propagação (até 5 minutos)

---

## Verificar deploy PWA

Após deploy, verifique:

- [ ] `https://<domínio>/app.html` carrega corretamente
- [ ] Service Worker registrado (DevTools → Application → Service Workers)
- [ ] Manifest válido (DevTools → Application → Manifest)
- [ ] Score PWA no Lighthouse ≥ 90
- [ ] Funciona offline (DevTools → Network → Offline → recarregar)
