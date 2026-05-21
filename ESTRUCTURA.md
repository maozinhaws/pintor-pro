# Estrutura do Projeto Pintor Plus MVP

## 📁 Diretórios Principais

```
MVP/
├── 📦 APP (Core)
│   ├── app.html          ← SOURCE: App principal (vanilla HTML)
│   ├── app.css           ← SOURCE: Estilos
│   ├── src/              ← SOURCE: JavaScript modules
│   ├── public/           ← PUBLIC: Assets públicos (imagens, ícones)
│   └── dist/             ← BUILD: Output compilado
│       ├── index.html    (app principal compilado)
│       ├── assets/       (recursos minificados)
│       └── site.webmanifest (PWA)
│
├── 📱 ANDROID
│   └── android/          ← Projeto Android (Capacitor)
│       └── app/src/main/assets/public/index.html (sincronizado com dist/)
│
├── 📚 DOCS (Essencial)
│   ├── README.md
│   ├── PROJECT_STATUS.md
│   ├── capacitor.config.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── sync-app.sh       ← Script de sincronização Android
│   └── docs/             ← Documentação do projeto
│
└── 📦 OUTROS (Não-essencial)
    └── outros/
        ├── design-variations.html       (apresentações)
        ├── presentation-apple-glass.html (slide deck)
        ├── screenshot-*.png              (screenshots)
        ├── Obras Rápido/                 (projeto referência)
        ├── Pintor Plus Design System/    (design docs externas)
        ├── SPRINT_*.md                   (histórico sprints)
        ├── APK_BUILD_*.md                (guias antigos)
        ├── CAPACITOR_*.md                (referência)
        ├── build-apk*.sh                 (scripts antigos)
        └── dist-backup/                  (backup antigo)
```

## 🎯 Arquivo de Verdade (Single Source)

**O QUE EDITAR:**
- ✅ `app.html` — Estrutura e markup
- ✅ `app.css` — Estilos CSS
- ✅ `src/` — JavaScript

**NÃO EDITAR:**
- ❌ `dist/index.html` — Gerado automaticamente
- ❌ `android/app/src/main/assets/public/index.html` — Sincronizado via `sync-app.sh`

## 🔄 Fluxo de Trabalho

1. **Edite** `app.html` ou `app.css`
2. **Execute** `npm run build` (se usando Vite) OU `vite build`
3. **Sincronize** `bash sync-app.sh` → atualiza Android assets
4. **Teste** no navegador (`dist/index.html`) ou APK

## 📦 Pasta `outros/` Contém

- Apresentações e design variações (não necessários para o app rodar)
- Screenshots e validações
- Documentação de design (Lovable, Huashu, etc)
- Histórico de sprints
- Projetos de referência (Obras Rápido)
- Scripts antigos de build
- Backups

**Tudo em `outros/` é OPCIONAL e NÃO afeta o build do app.**

---

**Última atualização:** 2026-05-21
