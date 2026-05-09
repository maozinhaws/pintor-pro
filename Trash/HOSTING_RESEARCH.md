# Pesquisa de Hosting para App Vite PWA

**Data:** 2026-05-02  
**Contexto:** App Vite PWA com TypeScript, sem backend, Google OAuth, usuários no Brasil, ~1k-5k usuários.  
**Opções Avaliadas:** Firebase Hosting, Netlify, Vercel, Cloudflare Pages

---

## Resumo Executivo

Para app Vite PWA com 1k-5k usuários e usuários no Brasil, **recomendação: Cloudflare Pages** por:
- Free tier com **unlimited bandwidth** (crucial para scaling)
- CDN global com presença forte na América Latina
- HTTPS automático e build/deploy integrado
- Deploy zero-config: apenas conectar Git repo
- Melhor custo-benefício para crescimento

Alternativa: **Netlify** se precisar de build avançado e CI/CD mais robusto (Pro plan $20/mês).

---

## Tabela Comparativa

| Aspecto | Firebase Hosting | Netlify | Vercel | Cloudflare Pages |
|---------|------------------|---------|--------|-----------------|
| **Free Tier** | 10GB storage, 10GB/mês transfer | 100GB bandwidth/mês | 100GB bandwidth/mês | Unlimited bandwidth |
| **CDN Brasil** | ✅ Google Cloud (global) | ✅ Netlify CDN (global) | ✅ Vercel Edge (global) | ✅ Cloudflare (mais pontos BR) |
| **HTTPS Automático** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Suporte PWA** | ✅ Explícito | ✅ Total | ✅ Total | ✅ Total |
| **Deploy `dist/`** | ✅ CLI | ✅ Git | ✅ Git | ✅ Git |
| **Build Minutos/Mês** | Unlimited | 300 (free) | 6000 (free) | 500 (free) |
| **Builds Concorrentes** | Unlimited | 1 (free) | 12 (free) | Unlimited |
| **Custom Domain** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Preview Deployments** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| **Edge Functions** | Não (Cloud Functions) | ✅ Edge | ✅ Edge | ✅ Workers |
| **Suporte GA/OAuth** | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |

---

## Análise Detalhada por Plataforma

### 🔥 Firebase Hosting

**Prós:**
- Integração nativa com Firebase Auth (Google OAuth direto)
- Global CDN com boa latência para Brasil
- Deploy via CLI simples: `firebase deploy`
- Suporte oficial para PWA

**Contras:**
- **Free tier limitado:** 10GB/mês transfer (insuficiente para 5k+ usuários)
- Custo escalável: $0.15/GB após 10GB
- Sem suporte a preview deployments na free tier
- CLI-only deployment (não ideal para CI/CD automatizado)
- Pricing modelo pay-as-you-go (menos previsível)

**Melhor para:** Apps pequenos (<1k usuários) com Firebase backend.

---

### 📦 Netlify

**Prós:**
- Free tier generoso: 100GB bandwidth
- Build CI/CD robusto: 300 min/mês free
- Preview deployments automáticos para PRs
- Excelente DX (Developer Experience)
- Integração GitHub/GitLab nativa
- Edge functions disponíveis

**Contras:**
- Free tier: apenas 1 build concorrente (slow para equipes)
- Custo Pro: $20/mês (sem increase no bandwidth)
- Build minutes limitadas na free tier
- Pode desabilitar site se exceder quotas

**Melhor para:** Startups/pequenos times com CI/CD prioritário.

---

### ▲ Vercel

**Prós:**
- Otimizado para Next.js (mas funciona bem com Vite)
- Free tier: 100GB bandwidth + 6000 build minutes
- Edge Functions integradas
- Deploy automático via Git
- Dashboard intuitivo

**Contras:**
- Free tier: pausar deployments ao atingir limite
- Pro plan: $20/mês por pessoa (caro para equipes)
- Menos adequado para PWA puro (mais focado em Next.js)
- Custo escalável com número de membros do time

**Melhor para:** Next.js apps ou when using Vercel as a team.

---

### ☁️ Cloudflare Pages

**Prós:**
- **Free tier com unlimited bandwidth** (game-changer para scaling)
- 500 builds/mês free (suficiente)
- CDN Cloudflare com muitos POPs na América Latina
- Workers integrados para serverless (se necessário)
- Zero overhead: sem card necessário
- Melhor performance global (Anycast routing)

**Contras:**
- Dashboard menos intuitivo que Netlify/Vercel
- Workers (edge functions) requerem aprendizado separado
- Menos integração com GitHub (mas funciona bem)
- Comunidade menor que Vercel/Netlify

**Melhor para:** Apps sem limite de bandwidth com crescimento indefinido.

---

## Recomendação

### 🏆 **Escolha: Cloudflare Pages**

**Justificativa:**

1. **Scaling ilimitado grátis:** Com Cloudflare Pages, bandwidth unlimited na free tier significa zero worries com crescimento de usuários. A partir de 1k até 10k usuários, custo = **$0/mês**.

2. **CDN Brasil forte:** Cloudflare tem presença robusta em São Paulo e Rio de Janeiro, garantindo latência <50ms para usuários brasileiros.

3. **Deploy simples:** Conecta Git repo, detecta Vite automaticamente, deploy em segundos.

4. **PWA-ready:** Service Workers, HTTPS automático, offline-first support nativo.

5. **Crescimento futuro:** Se app crescer para 100k usuários, ainda será cheaper que alternativas com modelo pago.

**Alternativa secundária:** **Netlify** se precisar de CI/CD enterprise (múltiplos builds concorrentes) ou workflows avançados.

---

## Guia de Deploy Passo a Passo

### Opção 1: Cloudflare Pages (Recomendado)

**Pré-requisitos:**
- App Vite pronto com `npm run build` gerando pasta `dist/`
- Código no GitHub/GitLab
- Conta Cloudflare (gratuita)

**Passos:**

1. **Fazer push do código para GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Cloudflare Pages deployment"
   git push origin main
   ```

2. **Acessar Cloudflare Dashboard:**
   - Ir para https://dash.cloudflare.com
   - Login/Sign up (free account)

3. **Criar novo Pages project:**
   - Sidebar: **Workers & Pages** → **Pages** → **Create application** → **Connect to Git**
   - Selecionar repositório do projeto
   - Autorizar Cloudflare no GitHub

4. **Configurar build:**
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** (adicionar se houver, ex: `VITE_API_URL`)

5. **Deploy:**
   - Clicar **Save and Deploy**
   - Aguardar build (2-3 minutos)
   - Link automático gerado: `https://<projeto>.pages.dev`

6. **Configurar domínio customizado (opcional):**
   - Em **Custom domains** → **Set up a custom domain**
   - Adicionar domínio (DNS deve apontar para Cloudflare)
   - HTTPS automático (Let's Encrypt via Cloudflare)

**Redeployment automático:**
- Cada push para `main` dispara novo build/deploy automaticamente

---

### Opção 2: Netlify (Alternativa)

**Pré-requisitos:**
- Mesmos como Cloudflare
- Conta Netlify (gratuita)

**Passos:**

1. **Push código para GitHub** (mesmo que acima)

2. **Acessar Netlify:**
   - Ir para https://app.netlify.com
   - Login/Sign up

3. **Novo site:**
   - **Add new site** → **Import an existing project**
   - Selecionar **GitHub** (autorizar)
   - Escolher repositório

4. **Configurar build:**
   - **Base directory:** (deixar vazio ou `.`)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Environment variables:** (se houver)

5. **Deploy:**
   - Clicar **Deploy site**
   - Aguardar build
   - Link automático: `https://<site-name>.netlify.app`

6. **Domínio customizado:**
   - **Site settings** → **Domain management** → **Add custom domain**

---

### Opção 3: Firebase Hosting

**Pré-requisitos:**
- `npm install -g firebase-tools`
- Conta Google (Firebase Console)

**Passos:**

1. **Inicializar Firebase no projeto:**
   ```bash
   firebase login
   firebase init hosting
   ```
   - Selecionar/criar Firebase project
   - Public directory: `dist`
   - Configure as SPA: `yes`

2. **Build local:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   firebase deploy
   ```

4. **Domínio customizado:**
   - Firebase Console → **Hosting** → **Custom domain**
   - Seguir instruções de DNS

---

### Opção 4: Vercel

**Pré-requisitos:**
- Mesmos como Netlify
- Conta Vercel

**Passos:**

1. **Via Dashboard:**
   - https://vercel.com/new
   - Selecionar repositório GitHub
   - Cloudflare irá auto-detectar Vite
   - Deploy automático

2. **Via CLI:**
   ```bash
   npm install -g vercel
   vercel
   ```
   - Seguir prompts
   - Auto-detecta Vite

---

## Estimativa de Custos Mensais

Cenário: App Vite PWA com ~5-10MB por usuário/mês (PWA cacheia agressivamente).

| Usuários | Bandwidth/mês | Firebase | Netlify | Vercel | Cloudflare |
|----------|---------------|----------|---------|--------|-----------|
| **1,000** | ~5-10GB | $0 | $0 | $0 | **$0** |
| **5,000** | ~25-50GB | $2-6 | $0 | $0 | **$0** |
| **10,000** | ~50-100GB | $6-13 | $0 | $0 | **$0** |

**Notas:**

1. **Firebase:** Após 10GB/mês, $0.15/GB. Escala rapidamente.
   - 1k usuários: $0 (dentro de free tier)
   - 5k usuários: ~$3 (40GB × $0.15 - 10GB free)
   - 10k usuários: ~$13 (100GB × $0.15 - 10GB free)

2. **Netlify:** 100GB free tier na most plans. Pro upgrade se precisar de builds avançadas ($20/mês).
   - 1-10k usuários: $0 (bandwidth covered)
   - Com Pro (advanced CI/CD): $20/mês

3. **Vercel:** 100GB Hobby tier. Pro ($20/seat) se múltiplos membros.
   - 1-10k usuários: $0 (Hobby)
   - Por pessoa: $20/mês se em time Pro

4. **Cloudflare Pages:** Unlimited bandwidth mesmo free tier.
   - 1-10k-100k usuários: **$0/mês**
   - Pro upgrade opcional ($20/mês) para Workers avançado

---

## Cenário de Custos Expandido (Futuro)

Se app crescer para **50k-100k usuários** (~500GB/mês):

| Plataforma | Custo Estimado |
|-----------|---------------|
| Firebase | ~$72/mês (500GB × $0.15 - 10GB free) |
| Netlify | $20/mês (Pro) + possível upgrade |
| Vercel | $20/mês+ (por membro) |
| **Cloudflare** | **$0/mês** (unlimited) |

Cloudflare ganha exponencialmente com scaling.

---

## Checklist Pré-Deploy

- [ ] `npm run build` gera pasta `dist/` sem erros
- [ ] `dist/` contém `index.html`, manifest.json, service worker (se PWA)
- [ ] `package.json` tem scripts: `build`, `dev`
- [ ] TypeScript compila sem erros: `npm run build`
- [ ] Google OAuth configurado (redirect URIs incluem domínio Vercel/Netlify/Cloudflare)
- [ ] `.gitignore` inclui `dist/`, `node_modules`, `.env.local`
- [ ] Repositório Git público (ou privado com permissões)
- [ ] Env vars documentadas (se houver)

---

## Conclusão

**Recomendação Final: Cloudflare Pages**

- ✅ Free tier unlimited bandwidth (melhor valor)
- ✅ CDN global com presença Brasil
- ✅ Deploy automático via Git
- ✅ PWA-ready (service worker, offline, HTTPS)
- ✅ Escalável para 10k-100k+ usuários sem custo adicional
- ✅ Zero cartão de crédito necessário

**Timeline de implementação:** 15-30 minutos (primeiro deploy).

---

## Fontes

- [Vite Deploy Guide](https://vite.dev/guide/static-deploy)
- [Firebase Hosting Pricing](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Netlify Pricing 2025](https://www.netlify.com/pricing/)
- [Vercel Pricing](https://vercel.com/pricing)
- [Cloudflare Pages Pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Vite PWA Deployment Guide](https://vite-pwa-org.netlify.app/deployment/)
- [Cloudflare Pages Deploy Guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Comparison: Vercel vs Netlify vs Cloudflare Pages (2025)](https://www.digitalapplied.com/blog/vercel-vs-netlify-vs-cloudflare-pages-comparison)
- [Comparison: Vercel vs Cloudflare vs Firebase (2026)](https://kuberns.com/blogs/vercel-vs-cloudflare-vs-firebase/)
