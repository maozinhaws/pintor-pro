# 🚀 COMECE AGORA — 3 Comandos para Rodar Pintor Plus

**Você quer rodar o app no Android o quanto antes?**

Aqui estão os **3 comandos únicos** que você precisa rodar.

Tempo total: **15-20 minutos**

---

## ✅ Pré-Requisitos (2 minutos)

Abra terminal e verifique:

```bash
node --version    # Deve ser 18+
npm --version     # Deve ser 9+
java -version     # Deve ser 17+
```

Se algum faltar, instale agora.

---

## 🎯 Comando 1: Build Web

```bash
cd "d:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\MVP"
npm run build
```

**O que faz:** Compila TypeScript + Vue → arquivo `dist/index.html`  
**Tempo:** 2-3 minutos  
**Esperado:** Ver ✓ na saída final

---

## 📱 Comando 2: Sync Android

```bash
npx cap sync android
```

**O que faz:** Copia `dist/` para pasta `android/` e gera APK base  
**Tempo:** 2-3 minutos  
**Esperado:** Pasta `android/` criada/atualizada

---

## ▶️ Comando 3: Abrir no Emulador

```bash
npx cap open android
```

**O que faz:** Abre Android Studio com projeto pronto  
**Tempo:** 1-2 minutos para Android Studio abrir

**No Android Studio:**
1. Aguarde "Gradle sync" terminar
2. Click em **Run** (ou verde ▶)
3. Selecione emulador ou device
4. Aguarde 2-3 minutos

---

## ✨ Resultado

Se deu tudo certo, você verá:

```
✅ App rodando no emulador/device
✅ Tela inicial do Pintor Plus visível
✅ Botão "+" para novo orçamento
✅ Sem crashes
```

---

## ❌ Se Deu Erro?

```bash
# Erro 1: "Cannot find module"
npm install

# Erro 2: "Gradle sync failed"
cd android && ./gradlew clean

# Erro 3: "App crashed"
adb logcat | grep -i error

# Erro 4: Capacitor not found
npm install -g @capacitor/cli
```

Ver detalhes em: `CAPACITOR_QUICK_START.md`

---

## 📖 Próximas Leituras

Depois que app estiver rodando:

1. **Para testar features:** `CAPACITOR_QUICK_START.md`
2. **Para entender estratégia:** `docs/MIGRACAO_CAPACITOR.md`
3. **Para deploy Play Store:** `docs/CAPACITOR_DEPLOYMENT.md`
4. **Para todos comandos:** `CAPACITOR_COMMANDS.md`

---

## 🎯 Checklist Rápido

- [ ] Node 18+ instalado
- [ ] JDK 17+ instalado
- [ ] `npm run build` rodou ✅
- [ ] `npx cap sync android` rodou ✅
- [ ] `npx cap open android` abriu Android Studio
- [ ] Cliquei em Run
- [ ] App apareceu no emulador

---

## 💡 Dica Importante

Se você quiser **build para Play Store** depois:

```bash
# Após app funcionar, fazer release
cd android
./gradlew bundleRelease

# Gera: app/build/outputs/bundle/release/app-release.aab
```

Mas primeiro, **deixa o app rodar!** 🎉

---

## 🆘 Precisa de Ajuda?

Mensagens de erro comuns:

| Erro | Solução |
|------|---------|
| `npm: command not found` | Instalar Node.js |
| `Gradle sync failed` | Rodar `cd android && ./gradlew clean` |
| `AppBundle not found` | Esperar build terminar |
| `App keeps crashing` | Verificar `adb logcat` |
| `Cannot connect emulator` | Reiniciar emulador |

---

## 🚀 Pronto?

Copie e cole **Comando 1** no terminal:

```bash
cd "d:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\MVP"
npm run build
```

**GO!** ⚡

---

*Tempo total: 15-20 minutos até app rodando*

