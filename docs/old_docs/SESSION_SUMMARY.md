# Pintor Plus — Resumo da Sessão de Desenvolvimento

> Data: 2026-05-13  
> Branch: `feature/storage-sqlite-dexie-offline`  
> Branch principal: `Reparo`

---

## O Que Foi Feito Nesta Sessão

### Contexto de Partida
O usuário testou APKs e reportou bugs. Esta sessão foi continuação de sessão anterior que já havia iniciado algumas correções.

---

## Bugs Trabalhados

### ✅ Bug: Teclado não avança para próximo campo (Enter)
**Causa**: No Capacitor WebView sem `<form>`, `enterkeyhint="next"` não avança foco sozinho.  
**Fix aplicado** em `src/budgets.ts`: Adicionados handlers `keydown` explícitos em cada input do modal de item:
```typescript
nameInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(compInp); } });
compInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(altInp); } });
altInp.addEventListener('keydown',  (e) => { if (e.key === 'Enter') { e.preventDefault(); _next(priceInp); } });
priceInp.addEventListener('keydown',(e) => { if (e.key === 'Enter') { e.preventDefault(); _next(obsInp); } });
```

---

### ✅ Bug: Botões "Avançar" e "Reset" do Flash voando com teclado
**Causa raiz**: O Capacitor tinha `resize: 'resize'` em `capacitor.config.ts` que sobrescrevia o manifest, redimensionando o WebView quando teclado abria. Os botões `position:sticky;bottom:0` ficavam em posição errada.

**Fixes aplicados**:

1. `capacitor.config.ts` — mudado para `resize: 'none'`:
```typescript
Keyboard: {
  resize: 'none',
  resizeOnFullScreen: false
}
```

2. `android/app/src/main/AndroidManifest.xml`:
```xml
android:windowSoftInputMode="adjustNothing"
```

3. `app.html` — `.step1-actions` e `.footer-nav` do Flash iframe mudados de `position:sticky` para `position:fixed`:
```css
.step1-actions { position:fixed; bottom:0; left:0; right:0; ... }
.footer-nav    { position:fixed; bottom:0; left:0; right:0; ... }
```

4. `app.html` — `.page-scroll` com `padding-bottom: calc(80px + env(safe-area-inset-bottom,0px))` para conteúdo não ficar atrás dos botões fixos.

5. `app.html` — Flash iframe: adicionado `focusin` listener para `scrollIntoView` quando campo recebe foco:
```javascript
document.addEventListener('focusin', function(e){
    var t = e.target;
    if (!['INPUT','TEXTAREA','SELECT'].includes(t.tagName)) return;
    setTimeout(function(){ t.scrollIntoView({behavior:'smooth',block:'center'}); }, 350);
});
```

---

### ⚠️ Bug: Câmera sempre abre câmera nativa (NÃO CORRIGIDO)
**Causa raiz descoberta mas NÃO corrigida**: Existem DUAS definições de `window.openDetailedCamera`:

- `app.html` (script inline) → versão correta com `getUserMedia`
- `appConfig.ts` (módulo TypeScript) → versão com `return;` imediato que chama câmera nativa

Como módulos ES executam DEPOIS dos inline scripts, o `appConfig.ts` sobrescreve a versão correta.

```typescript
// appConfig.ts — PROBLEMA AQUI
(window as any).openDetailedCamera = async function () {
    _openNativeCameraInput();  // abre file input
    return;                    // PARA AQUI — getUserMedia abaixo é código morto
};
```

**Fix necessário (NÃO feito ainda)**:
Remover a atribuição de `window.openDetailedCamera` do `appConfig.ts` (linhas ~887-922). A versão em `app.html` é a correta e deve ser a única.

---

### ⚠️ Bug: Fotos não aparecem no orçamento após câmera
**Causa**: Dependente do bug da câmera nativa acima.  
**Fix parcial aplicado** em `app.html` — `_closeDC()`: após `renderItemModal()`, scroll para seção de fotos:
```javascript
setTimeout(() => {
    const body = document.getElementById('item-modal-body');
    const sec = document.getElementById('item-photos-section');
    if (body && sec) body.scrollTop = sec.offsetTop - 8;
}, 60);
```
E em `src/budgets.ts`: adicionado `id="item-photos-section"` na div do título "Fotos do Item".

---

## Outros Fixes Aplicados

### MainActivity.java — Permissão de câmera no startup
```java
if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
        != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this,
            new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
}
```

### app.html — `capture="environment"` removido do file-camera input
O atributo `capture="environment"` no `<input type="file">` forçava câmera nativa. Foi removido.

### app.html — getUserMedia com triplo fallback
```javascript
navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } })
  .catch(() => getUserMedia({ video: { facingMode: { ideal: 'environment' } } }))
  .catch(() => getUserMedia({ video: true }))
```

### main.ts — postMessage relay removido
O relay de `kb-height` para o Flash iframe foi removido pois causava posicionamento errado dos botões.

---

## Estado dos APKs Gerados

| APK | O que tinha | Status |
|-----|-------------|--------|
| APK anterior à sessão | Bugs originais | ❌ |
| APK #3 (gerado na sessão, 1ª tentativa) | adjustNothing + sticky → botões voando | ❌ |
| APK #4 (adjustResize tentativa) | Botões sobem com teclado | ❌ Comportamento errado |
| **APK atual (último gerado)** | adjustNothing + fixed + resize:none | ✅ Teclado sobrepõe |

---

## O Que Falta Fazer (Próxima Sessão)

### PRIORIDADE 1 — Câmera (bug crítico)
**Arquivo**: `src/appConfig.ts`  
**Ação**: Remover ou comentar as linhas 887-922 (o IIFE inteiro da câmera em appConfig, ou pelo menos a atribuição de `window.openDetailedCamera`).  
A versão correta já existe em `app.html` nas linhas ~4034-4086.

```typescript
// REMOVER ISTO de appConfig.ts:
(window as any).openDetailedCamera = async function (): Promise<void> {
    _openNativeCameraInput();
    return;
    // ... código morto ...
};
```

### PRIORIDADE 2 — Testar APK atual
Instalar o último APK gerado e confirmar:
- [ ] Teclado sobrepõe os botões (não empurra)
- [ ] Campo focado sobe para ficar visível
- [ ] Botões "Avançar" e "Reset" ficam fixos no rodapé

### PRIORIDADE 3 — Câmera personalizada
Após corrigir o bug do `appConfig.ts`, testar:
- [ ] Câmera abre interface personalizada (não a nativa)
- [ ] Foto capturada aparece no modal do item (seção "Fotos do Item")
- [ ] Scroll automático para seção de fotos após fechar câmera

---

## Arquivos Modificados Nesta Sessão

| Arquivo | O que mudou |
|---------|-------------|
| `src/budgets.ts` | Enter key navigation + id="item-photos-section" |
| `src/main.ts` | Removido postMessage relay para Flash iframe |
| `app.html` | position:fixed nos botões Flash, padding-bottom no scroll, focusin handler, _closeDC scroll fix, getUserMedia triple fallback, removido kb-height handler |
| `capacitor.config.ts` | resize: 'none', resizeOnFullScreen: false |
| `android/app/src/main/AndroidManifest.xml` | adjustNothing, permissão CAMERA |
| `android/app/src/main/java/.../MainActivity.java` | Solicita permissão câmera no startup, edge-to-edge |

---

## Ambiente de Desenvolvimento

- **OS**: Windows 11 Pro
- **Shell**: PowerShell (usar PowerShell, não bash, para comandos Gradle)
- **Gradle**: rodar como `.\gradlew assembleDebug` dentro de `/android`
- **Build completo**:
  ```powershell
  cd "d:\Documentos\Projetos_Apps\Orçamento_Pintor_Plus\MVP"
  npm run build
  npx cap sync android
  cd android
  .\gradlew assembleDebug
  ```
- **APK output**: `android/app/build/outputs/apk/debug/app-debug.apk`
