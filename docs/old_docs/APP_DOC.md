# Pintor Plus MVP — Documentação Técnica Completa

> Gerado em: 2026-05-13  
> Versão do app: pintorplus-v13

---

## 1. Visão Geral

**Pintor Plus** é um app para pintores autônomos gerenciarem orçamentos, clientes, agenda e fornecedores.

- **Tipo**: PWA (Progressive Web App) + APK Android via Capacitor 8
- **Motor**: WebView Android — o app inteiro é HTML/CSS/JS rodando dentro de um WebView nativo
- **Não é** React Native, Flutter ou app nativo — é um site empacotado como APK
- **Servidor**: Nenhum. Todo dado fica no dispositivo do usuário
- **Login**: Não existe. O app é 100% local/offline

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | TypeScript 5.7 |
| Bundler | Vite 6 |
| Runtime mobile | Capacitor 8 |
| Armazenamento Android | @capacitor-community/sqlite |
| Armazenamento Web/PWA | Dexie (IndexedDB) |
| Armazenamento primário | localStorage |
| Build Android | Gradle (projeto em `/android`) |
| UI | HTML/CSS puro (sem framework) |

### Dependências principais (package.json)
```json
{
  "@capacitor-community/sqlite": "^8.1.0",
  "@capacitor/android": "^8.3.3",
  "@capacitor/core": "^8.3.1",
  "@capacitor/keyboard": "^8.0.3",
  "@capacitor/status-bar": "^8.0.2",
  "dexie": "^4.4.2"
}
```

---

## 3. Estrutura de Arquivos

```
MVP/
├── app.html                  ← HTML principal (385KB) — TODA a UI do app está aqui
│                               + scripts inline (Flash iframe, câmera, openFlash)
├── src/
│   ├── main.ts               ← Entry point: keyboard avoidance, tema, service worker
│   ├── state.ts              ← Estado global S{} + saveOrcs()
│   ├── types.ts              ← Interfaces TypeScript (Orcamento, Cliente, etc.)
│   ├── budgets.ts            ← Lógica de orçamentos (módulo mais importante)
│   ├── clients.ts            ← CRM de clientes
│   ├── agenda.ts             ← Agenda / eventos
│   ├── receipts.ts           ← Recibos
│   ├── receipt.ts            ← Geração de recibo individual
│   ├── appConfig.ts          ← Config, backup, Flash, câmera, PWA, home, suporte
│   ├── navigation.ts         ← Roteamento entre páginas (showPage, go, homeTab)
│   ├── rooms.ts              ← Cômodos/ambientes dentro do orçamento
│   ├── ui.ts                 ← Helpers de UI
│   ├── utils.ts              ← Utilitários (formatação, validação, máscaras)
│   ├── data.ts               ← Dados estáticos (listas de sugestões, etc.)
│   ├── notifications.ts      ← Notificações locais
│   └── storage/
│       ├── index.ts          ← Fábrica: escolhe SQLite (Android) ou Dexie (web)
│       ├── schema.ts         ← Nomes de stores e schema do banco
│       ├── types.ts          ← Interfaces do storage
│       ├── db.dexie.ts       ← Implementação IndexedDB via Dexie
│       ├── db.sqlite.ts      ← Implementação SQLite via Capacitor
│       └── repositories/     ← CRUD por entidade
│           ├── orcamentosRepository.ts
│           ├── clientesRepository.ts
│           ├── fornecedoresRepository.ts
│           ├── eventosRepository.ts
│           ├── configRepository.ts
│           └── indexedDbRepository.ts
├── capacitor.config.ts       ← Config do Capacitor (keyboard, appId, etc.)
├── vite.config.*             ← Config do Vite
└── android/                  ← Projeto Android nativo
    └── app/src/main/
        ├── AndroidManifest.xml
        └── java/com/pintorplus/app/MainActivity.java
```

---

## 4. Como Buildar o APK

```bash
# 1. Instalar dependências (uma vez)
npm install

# 2. Compilar TypeScript + Vite
npm run build

# 3. Sincronizar com o projeto Android
npx cap sync android

# 4. Gerar APK debug
cd android
.\gradlew assembleDebug

# APK gerado em:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Páginas do App (SPA)

Todas as telas existem no mesmo `app.html`, controladas por `display:none/flex`:

| ID da página | Descrição |
|---|---|
| `pg-home` | Tela inicial — mini-lista de orçamentos, notícias |
| `pg-orcamentos` | Lista completa de orçamentos com busca/filtro |
| `pg-s1` | Wizard passo 1: dados do cliente |
| `pg-s2` | Wizard passo 2: ambientes/cômodos |
| `pg-s3` | Wizard passo 3: pagamento e detalhes |
| `pg-s4` | Wizard passo 4: resumo + envio WhatsApp |
| `pg-clientes` | CRM — lista de clientes |
| `pg-fornecedores` | Lista de fornecedores |
| `pg-agenda` | Agenda / eventos com alarmes |
| `pg-config` | Configurações (empresa, msg WhatsApp, serviços, etc.) |
| `pg-backup` | Exportar/importar JSON |
| `pg-flash` | Modo Flash — orçamento rápido (iframe) |
| `pg-termos` | Termos de uso / LGPD |

### Navegação
```typescript
showPage('pg-home')   // vai para a página
homeTab('config')     // atalhos com lógica de guarda (isDirty check)
go(2)                 // navega entre passos do wizard (1-4)
```

---

## 6. Estado Global (S)

Definido em `src/state.ts`, lido do localStorage na inicialização:

```typescript
export const S = {
  orcs: [],           // Orcamento[] — todos os orçamentos
  clientes: [],       // Cliente[]
  fornecedores: [],   // Fornecedor[]
  eventos: [],        // Evento[]
  rooms: [],          // Room[] — cômodos do orçamento em edição
  config: {},         // Config — configurações do pintor
  tempItem: null,     // Item sendo editado no modal de item
  editId: null,       // ID do orçamento sendo editado
  isDirty: false,     // há mudanças não salvas?
  curStep: 1,         // passo atual do wizard
  googleEmail: '',    // não usado (login desativado)
};
```

### Salvar orçamentos
```typescript
saveOrcs()  // salva S.orcs no localStorage + IndexedDB/SQLite em background
```

---

## 7. Armazenamento — Dupla Camada

### Camada 1 (principal): localStorage
| Chave | Conteúdo |
|---|---|
| `pp-orcs` | Array de orçamentos (JSON) |
| `pp-clientes` | Array de clientes |
| `pp-fornecedores` | Fornecedores |
| `pp-eventos` | Eventos da agenda |
| `pp-config` | Configurações do pintor |
| `pp-theme` | `'dark'` ou `'light'` |
| `pp-terms-v1` | Aceite dos termos LGPD |

### Camada 2 (backup offline): IndexedDB / SQLite
- **Android APK**: `@capacitor-community/sqlite` — banco SQLite nativo
- **PWA/Web**: `Dexie` — IndexedDB do navegador
- Inicializado em `main.ts` via `Storage.init()`
- Usado para recuperar dados se o iOS limpar o localStorage
- `saveOrcs()` dispara `Storage.saveOrcs()` em modo fire-and-forget

### Seleção automática de backend
```typescript
// storage/index.ts
if (Capacitor.isNativePlatform() && platform === 'android') {
  return createAndroidSQLiteStorage();  // SQLite
} else {
  return createWebDexieStorage();       // IndexedDB
}
```

---

## 8. Módulo Flash

O Flash é um **mini-app separado** para orçamento rápido em visita técnica.

### Como funciona
1. O HTML do Flash está embutido em `app.html` no atributo `data-srcdoc` do `#flash-iframe`
2. Ao abrir (`openFlash()`), os placeholders são substituídos e o `srcdoc` é injetado no iframe
3. Placeholders substituídos:
   - `%%NOME_SUGESTOES%%` → nomes de cômodos da config
   - `%%OBS_SERVICOS%%` → serviços da config
   - `%%OBS_MATERIAIS%%` → materiais da config
4. Comunicação Flash ↔ App principal via `window.postMessage`
5. Ao fechar (`exitFlash()`), o draft salvo em `orcamento-pocket-draft` (localStorage) é convertido em um `Orcamento` com `status: 'Rascunho Flash'`

### Mensagens postMessage
| Tipo | Direção | Ação |
|---|---|---|
| `flash-clear` | pai → Flash | Limpa o formulário |
| `pp-theme` | pai → Flash | Aplica tema dark/light |
| `flash-exit` | Flash → pai | Fecha o Flash |
| `stop-camera` | pai → Flash | Para câmera do Flash |

---

## 9. Câmera — ATENÇÃO: BUG CRÍTICO CONHECIDO

### Problema
Existem **duas definições** de `window.openDetailedCamera` no código:

1. **`app.html` (script inline)** — versão correta com `getUserMedia` (câmera personalizada)
2. **`appConfig.ts` (módulo TypeScript)** — versão com `return;` imediato que chama câmera nativa

Como módulos ES (`<script type="module">`) executam **depois** dos scripts inline, o `appConfig.ts` sobrescreve a versão correta. Resultado: a câmera sempre abre a câmera nativa do Android.

```typescript
// appConfig.ts linha ~888 — ISSO É O BUG
(window as any).openDetailedCamera = async function () {
    _openNativeCameraInput();  // chama arquivo file input
    return;                    // ← PARA AQUI. getUserMedia abaixo nunca roda.
    // ... código de câmera personalizada (código morto/inalcançável)
};
```

### Fix necessário
Remover ou corrigir a atribuição `window.openDetailedCamera` em `appConfig.ts`. A versão em `app.html` (linhas ~4034-4086) é a correta.

### Câmera personalizada (detail-cam-modal)
- Modal com `id="detail-cam-modal"`, `z-index: 9999999`
- Usa `navigator.mediaDevices.getUserMedia` com `facingMode: 'environment'`
- Suporta: flash/torch, zoom, captura múltipla, galeria
- Thumbnails das fotos em `_renderDCThumbs()`
- Ao fechar: para a stream, chama `renderItemModal()` + scroll para seção de fotos

---

## 10. Keyboard (Teclado Android)

### Configuração atual
```typescript
// capacitor.config.ts
Keyboard: {
  resize: 'none',          // NÃO redimensiona o WebView
  resizeOnFullScreen: false
}
```
```xml
<!-- AndroidManifest.xml -->
android:windowSoftInputMode="adjustNothing"
```

### Comportamento resultante
- O teclado sobrepõe o app (não empurra nada para cima)
- Os botões do Flash (`position:fixed;bottom:0`) ficam atrás do teclado
- Campos focados sobem via `scrollIntoView` no evento `focusin`
- O plugin Capacitor Keyboard ainda dispara eventos `keyboardWillShow/Hide` para a CSS var `--kb-h`

### CSS var `--kb-h`
Definida em `main.ts`, aplicada em elementos do app principal que precisam se ajustar quando teclado abre.

---

## 11. Tema (Dark/Light)

- Controlado pela classe `dark` no `<html>`
- Salvo em `localStorage['pp-theme']`
- Aplicado na inicialização em `main.ts`
- Sincronizado com a status bar nativa via `@capacitor/status-bar`
- Toggle: `toggleThemeAnim()`

---

## 12. Tipos de Dados Principais

```typescript
interface Orcamento {
  id, nome, apelido, tel, email, cpf, cep,
  logradouro, numero, comp, bairro, cidade, end,
  pagNome, pagTel, pagEnd, pagador,
  rooms: Room[],        // cômodos com itens
  pgto: string[],       // formas de pagamento
  fmt: 'completo'|'area'|'simples',
  preco, status, valid, tipoServico, inicio, obs,
  date, ts, tsEdit,
  rascunho?, isFlashDraft?
}

interface Room {
  id, name, alt, comp,  // dimensões
  items: Item[],
  services: string[],
  preco, precoPerM2, collapsed
}

interface Item {
  name, alt, comp,
  services: string[],
  price, perMeter,
  obs,
  photos: { url, filename }[]  // base64 ou data URL
}

interface Config {
  empresa, tel, doc, emailEmpresa, endEmpresa,
  msg,          // template WhatsApp com {cliente}, {detalhes}, {total}
  servicos,     // lista separada por vírgulas
  pgto,         // formas de pagamento disponíveis
  statusList,   // status possíveis dos orçamentos
  logo,         // base64 da logo
  assinatura,   // base64 da assinatura
  flashNomes, flashServicos, flashMateriais,  // sugestões do Flash
  acessibilidade
}
```

---

## 13. MainActivity.java — Android

```java
// Permissão de câmera solicitada no startup
if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
        != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
            new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
}

// Edge-to-edge: barra de status e navegação transparentes
WindowCompat.setDecorFitsSystemWindows(window, false);
window.setStatusBarColor(Color.TRANSPARENT);
window.setNavigationBarColor(Color.TRANSPARENT);
```

---

## 14. Funcionalidades do App

| Funcionalidade | Módulo | Status |
|---|---|---|
| Criar/editar orçamento (wizard 4 passos) | budgets.ts | ✅ |
| Orçamento rápido Flash | appConfig.ts + Flash iframe | ✅ |
| Câmera personalizada com torch/zoom | appConfig.ts + app.html | ⚠️ Bug (sempre abre nativa) |
| Fotos nos itens | budgets.ts | ⚠️ Depende do fix da câmera |
| CRM de clientes | clients.ts | ✅ |
| Agenda com alarmes | agenda.ts | ✅ |
| Fornecedores | receipts.ts | ✅ |
| Gerar PDF / compartilhar WhatsApp | budgets.ts | ✅ |
| Backup JSON (export/import) | appConfig.ts | ✅ |
| Configurações da empresa | appConfig.ts | ✅ |
| Logo + assinatura | appConfig.ts | ✅ |
| Tema dark/light | main.ts | ✅ |
| PWA installável | appConfig.ts | ✅ |
| Offline-first | storage/ | ✅ |
| Google Login / Supabase | — | ❌ Desativado (código comentado) |
| Google Drive Sync | — | ❌ Removido |

---

## 15. Bugs Conhecidos e Pendentes

### Bug 1 — Câmera sempre nativa (CRÍTICO)
**Causa**: `appConfig.ts` define `window.openDetailedCamera` com `return;` imediato, sobrescrevendo a versão correta de `app.html`.  
**Fix**: Remover a atribuição `(window as any).openDetailedCamera` de `appConfig.ts`.

### Bug 2 — Fotos capturadas não aparecem no orçamento
**Causa**: Dependente do Bug 1. Quando câmera nativa é usada, o fluxo de retorno das fotos para `S.tempItem` não funciona.  
**Fix**: Corrigir Bug 1 primeiro.

### Bug 3 — Enter key no teclado não avança campo
**Status**: Corrigido em `budgets.ts` com handlers `keydown` explícitos.

### Bug 4 — Botões voando com teclado
**Status**: Corrigido. Flash usa `position:fixed;bottom:0` e Capacitor config tem `resize:'none'`.
