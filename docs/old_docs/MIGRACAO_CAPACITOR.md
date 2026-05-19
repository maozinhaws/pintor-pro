# 🚀 Migração para Capacitor — Estratégia Alternativa vs Android Nativo

**Data:** 2026-05-09  
**Status:** ✅ Selecionada como estratégia final  
**Tempo:** 12-19 dias (vs 35-45 com Kotlin nativo)  
**Complexidade:** Baixa (reutiliza PWA existente)

---

## 🎯 Por Que Capacitor?

### Comparação: Capacitor vs Android Nativo

| Aspecto | Capacitor | Android Nativo (Kotlin) |
|---------|-----------|------------------------|
| **Duração** | 12-19 dias | 35-45 dias |
| **Reutilização Web** | ✅ 95% | ❌ 0% |
| **Performance** | ✅ Boa | ✅ Excelente |
| **Complexidade** | ✅ Baixa | ⚠️ Alta |
| **Curva Aprendizado** | ✅ Mínima | ⚠️ Steep |
| **Acesso APIs Android** | ✅ Via plugins | ✅ Direto |
| **Build Time** | ✅ 2-5 min | ⚠️ 5-10 min |
| **App Size** | ⚠️ 20-30 MB | ✅ 12-15 MB |
| **Play Store Ready** | ✅ Sim | ✅ Sim |

---

## 📊 Timeline: Capacitor vs Android Nativo

### Capacitor (12-19 dias)
```
Dia 1-2:   Build web e setup Capacitor
Dia 3-5:   Testes e integração plugins
Dia 6-8:   Features (WhatsApp, storage)
Dia 9-10:  Testing e build APK/AAB
Dia 11-12: Play Store submission
Total: 12 dias + Deploy

LAUNCH: 2026-05-21 (muito mais rápido!)
```

### Android Nativo (35-45 dias)
```
Dia 1-3:   Setup Android Studio
Dia 4-10:  Domain layer + Database
Dia 11-24: UI screens (Jetpack Compose)
Dia 25-27: Navigation + ViewModels
Dia 28-37: Features + WhatsApp
Dia 38-42: Testing + Release
Total: 35-45 dias

LAUNCH: 2026-06-24
```

---

## ✅ O Que Reutilizar do PWA

### ✅ 100% Reutilizável

```typescript
// TypeScript/Vue existente → Funciona em Capacitor
src/
├── state.ts           ✅ Estado global (S object)
├── budgets.ts         ✅ Lógica orçamentos
├── clients.ts         ✅ Gerenciamento clientes
├── rooms.ts           ✅ Cômodos
├── navigation.ts      ✅ Rotas (adaptadas)
├── ui.ts              ✅ UI componentes
├── utils.ts           ✅ Helpers
└── types.ts           ✅ Tipos TypeScript
```

### ⚠️ Precisa Adaptar

```typescript
// Coisas que precisam ajuste
- Service Workers → Capacitor plugins
- localStorage → Capacitor Storage
- Notificações web → Local Notifications plugin
- Câmera → Camera plugin
- WhatsApp → Intents (já funciona)
```

---

## 🔌 Plugins Capacitor Necessários

### Já Instalados
- `@capacitor/core` v8.3.1 ✅
- `@capacitor/cli` v8.3.1 ✅

### Instalar Adicionais

```bash
npm install @capacitor/storage          # Armazenamento local
npm install @capacitor/device           # Info do device
npm install @capacitor/app              # Lifecycle do app
npm install @capacitor/splash-screen    # Tela inicial
npm install @capacitor/status-bar       # Status bar
```

### Opcionais (se precisar)

```bash
npm install @capacitor/camera           # Câmera/galeria
npm install @capacitor/share            # Share nativo
npm install @capacitor/local-notifications  # Notificações
```

---

## 📦 Estrutura de Pastas (Capacitor)

```
projeto/
├── src/                    (TypeScript/Web existente)
│   ├── budgets.ts
│   ├── clients.ts
│   ├── state.ts
│   ├── navigation.ts
│   ├── ui.ts
│   ├── main.ts
│   └── ...
├── dist/                   (Build web → app.html)
├── android/                (Gerado por: npx cap sync android)
│   ├── app/
│   ├── gradle/
│   └── build.gradle
├── capacitor.config.ts     (Configuração Capacitor)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 5 Fases Capacitor (12-19 dias)

### Fase 1: Setup & Sync (2 dias)

```bash
# Build web existente
npm run build

# Sync com Android
npx cap sync android

# Resultado: Pasta android/ pronta
```

✅ **Entrega:** App rodando no emulador

### Fase 2: Plugins & Storage (3 dias)

```bash
# Instalar plugins
npm install @capacitor/storage
npm install @capacitor/device
npm install @capacitor/app

# Adaptar src/state.ts para usar Capacitor Storage
// Antes: localStorage.setItem()
// Depois: await Storage.set({ key, value })
```

✅ **Entrega:** Persistência funcional

### Fase 3: UI & Features (4 dias)

- Ajustar responsividade web para mobile
- Testar WhatsApp share (já funciona)
- Testar CRUD completo

✅ **Entrega:** App 100% funcional

### Fase 4: Build & Testing (2 dias)

```bash
# Build web
npm run build

# Copy para android
npx cap copy android

# Build APK (debug)
cd android && ./gradlew assembleDebug

# Build AAB (release)
cd android && ./gradlew bundleRelease
```

✅ **Entrega:** APK/AAB pronta

### Fase 5: Play Store (1 dia)

- Screenshot das telas
- Descrição PT-BR
- Privacy policy
- Upload AAB

✅ **Entrega:** App na Play Store

---

## 📋 Checklist Implementação

### Setup
- [ ] `npm install` (deps)
- [ ] `npm run build` (web)
- [ ] `npx cap sync android` (android/)
- [ ] `npx cap open android` (Android Studio)

### Capacitor Plugins
- [ ] `@capacitor/storage` instalado
- [ ] `@capacitor/device` instalado
- [ ] Storage methods adaptados em state.ts
- [ ] Testes de persistência OK

### Features
- [ ] CRUD orçamentos funcional
- [ ] CRUD clientes funcional
- [ ] WhatsApp share funcional
- [ ] Persistência local OK
- [ ] UI responsiva OK

### Build & Release
- [ ] `npm run build` sem erros
- [ ] `npx cap sync android` sem erros
- [ ] `./gradlew assembleDebug` gera APK
- [ ] `./gradlew bundleRelease` gera AAB
- [ ] AAB assinada
- [ ] Play Store listing pronto

### Testing
- [ ] App roda no emulador
- [ ] App roda em device físico
- [ ] CRUD testes manuais OK
- [ ] WhatsApp funciona
- [ ] Sem crashes críticos
- [ ] Performance OK (< 2s launch)

---

## 🎯 Capacitor vs Web

### Capacitor Oferece
✅ Instalação via Play Store  
✅ Ícone no home screen  
✅ Splash screen customizado  
✅ Status bar nativo  
✅ Acesso a plugins Android  
✅ Offline-first (já tem)  
✅ LocalStorage > Capacitor Storage  

### Web Oferece
✅ PWA (já funciona)  
✅ Acesso via browser  
✅ Cache mais avançado  
✅ Web standards  

---

## 💰 ROI: Capacitor

| Métrica | Capacitor | Android Nativo |
|---------|-----------|----------------|
| **Tempo Implementação** | 12 dias | 42 dias |
| **Código Reescrito** | 10% | 100% |
| **Conhecimento Requerido** | Baixo | Alto |
| **Deploy Speed** | 1 semana | 7 semanas |
| **Manutenção** | 1 repo | 2 repos |
| **Future Scalability** | ⚠️ Média | ✅ Alta |

---

## 🔄 Migração Futura (v2.0)

Se no futuro quiser ir para **Android Nativo** (Kotlin):
1. Toda a lógica web continua válida
2. Reutiliza entities/types (ESTRUTURA_DADOS_ESTADO.md)
3. Só reescreve UI com Compose
4. Gradual, não precisa fazer tudo de uma vez

**Documentação Kotlin já existe** em `FASE_1-6_COMPLETE_IMPLEMENTATION.md`

---

## 🎬 Começar Agora

1. Leia `CAPACITOR_QUICK_START.md`
2. Siga os 5 passos (15-20 min)
3. App rodando em device

---

**Decisão:** ✅ Capacitor é a escolha correta  
**Motivo:** Rápido, eficiente, reutiliza web, baixa complexidade  
**Próximo:** Seguir CAPACITOR_QUICK_START.md

