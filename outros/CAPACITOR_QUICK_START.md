# ⚡ QUICK START — Rodar Pintor Plus com Capacitor

**Objetivo:** Rodar app no Android o QUANTO ANTES  
**Tempo:** 15-20 minutos  
**Status:** ✅ Projeto já tem Capacitor configurado

---

## 🚀 Passo 1: Verificar Pré-requisitos (2 min)

```bash
# Terminal
node --version      # Node 18+
npm --version       # NPM 9+
java -version       # JDK 17+
```

Se falta algo, instale agora.

---

## 🔨 Passo 2: Build Web (2 min)

```bash
cd "d:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\MVP"

# Instalar deps (primeira vez)
npm install

# Build web para dist/
npm run build

# Verificar que criou dist/index.html
ls dist/index.html   # Deve existir
```

---

## 📱 Passo 3: Sync com Android (3 min)

```bash
# Sincronizar código web com Android (gera/atualiza pasta android/)
npx cap sync android

# Verificar que criou pasta android/
ls android/app       # Deve existir
```

---

## 📖 Passo 4: Abrir no Android Studio (5 min)

```bash
# Abrir projeto Android no Android Studio
npx cap open android

# Aguarde Android Studio abrir e indexar (1-2 min)
```

**No Android Studio:**
1. File → Sync Now
2. Build → Build Bundle(s) / APK(s) → Build APK

---

## ▶️ Passo 5: Rodar no Emulador (5 min)

**No Android Studio:**
1. Run → Run 'app'
2. Selecione emulador (Pixel 6 API 34, por ex)
3. Aguarde 2-3 minutos

**Ou em Device Físico:**
1. Conecte smartphone via USB
2. Enable USB Debugging
3. Run → Run 'app'
4. Selecione device

---

## ✅ Verificar Que Funciona

Na tela do app, você deve ver:
- ✅ Tela inicial do Pintor Plus
- ✅ Aba "Orçamentos"
- ✅ Botão "+" para novo orçamento
- ✅ Sem crashes

---

## 🎯 Próximos Passos

### Se Tudo Funcionou ✅
1. Teste criar orçamento (wizard 4 steps)
2. Teste salvar cliente
3. Teste WhatsApp share

### Se Deu Erro ❌
Ver seção "Troubleshooting" mais abaixo

---

## 📦 Build para Play Store (10 min)

```bash
# Gerar APK (debug)
npx cap copy android
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Ou gerar AAB (release, para Play Store)
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🆘 Troubleshooting Rápido

### "capacitor not found"
```bash
npm install -g @capacitor/cli
npm install
npx cap sync android
```

### "Gradle sync failed"
```bash
cd android
./gradlew clean
./gradlew sync
```

### "App crashes ao abrir"
```bash
# Limpar dados do app
adb shell pm clear com.pintorplus.app

# Reinstalar
npx cap run android
```

### "WhatsApp não funciona"
- Normal se não tem WhatsApp instalado no emulador
- Teste em device físico com WhatsApp

### "Cannot find Android SDK"
```bash
# Configure Android SDK path
# Android Studio → File → Project Structure → SDK Location
# Ou crie arquivo local.properties
echo "sdk.dir=/caminho/para/Android/Sdk" > android/local.properties
```

---

## 📊 Status do Projeto

| Componente | Status |
|-----------|--------|
| Capacitor | ✅ Instalado e configurado |
| Web build | ✅ Pronto (npm run build) |
| Android sync | ✅ Pronto (npx cap sync android) |
| Android Studio | ✅ Integrado |
| Emulador | ✅ Pode rodar |
| Build AAB | ✅ Pronto para Play Store |

---

## ✨ Features Funcionais

✅ CRUD de orçamentos  
✅ Wizard 4-step  
✅ Lista de clientes  
✅ WhatsApp share  
✅ Persistência local  
✅ Dark mode (se configurado web)

---

## 🎉 Conclusão

Após estes 5 passos, você terá:
- ✅ App rodando no emulador/device
- ✅ Todas features web acessíveis
- ✅ Android build pronto
- ✅ Pronto para Play Store

**Tempo Total: 15-20 minutos**

Boa sorte! 🚀
