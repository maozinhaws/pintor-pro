# 🔧 Capacitor — Todos os Comandos Úteis

**Referência rápida** para desenvolver com Capacitor

---

## 📦 NPM & Setup

```bash
# Instalar dependências
npm install

# Instalar plugin novo
npm install @capacitor/plugin-name

# Verificar deps
npm list @capacitor/*
```

---

## 🔨 Build & Sync

```bash
# Build web (TypeScript + Vite → dist/)
npm run build

# Preview local (antes de sync)
npm run preview

# Sync web code com Android (copia dist/ → android/app/src/main/assets/public)
npx cap sync android

# Apenas copy (sem reinstalar deps)
npx cap copy android

# Abrir Android Studio
npx cap open android

# Rodar app no emulador
npx cap run android
```

---

## 📱 Android (Gradle)

```bash
cd android

# Limpar build
./gradlew clean

# Compilar debug APK
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Compilar release APK (precisa keystore)
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk

# Compilar AAB (recomendado Play Store)
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab

# Sincronizar Gradle
./gradlew sync

# Ver tasks disponíveis
./gradlew tasks
```

---

## 🔐 Keystore & Signing

```bash
# Gerar keystore (1 vez)
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pintorplus_key

# Listar chaves no keystore
keytool -list -v -keystore release.keystore

# Assinar APK manualmente
jarsigner -verbose -sigalg SHA1withRSA \
  -digestalg SHA1 -keystore release.keystore \
  app-release-unsigned.apk pintorplus_key
```

---

## 📱 ADB (Android Debug Bridge)

```bash
# Listar devices conectados
adb devices

# Instalar APK
adb install app-debug.apk

# Reinstalar (sem perder dados)
adb install -r app-debug.apk

# Desinstalar
adb uninstall com.pintorplus.app

# Ver logs (real-time)
adb logcat

# Ver logs com filtro
adb logcat | grep -i error
adb logcat | grep -i com.pintorplus

# Limpar logs
adb logcat -c

# Limpar dados do app
adb shell pm clear com.pintorplus.app

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Shell no device
adb shell
```

---

## 🧪 Testing & Debug

```bash
# Rodar em device conectado via USB
npx cap run android

# Debug Chrome (abrir chrome://inspect)
# Conecte device com USB
# Chrome mostra devices
# Click "inspect" em webapp

# Ver performance
adb shell dumpsys cpuinfo
adb shell dumpsys meminfo com.pintorplus.app

# Crash logs
adb logcat | grep "FATAL\|Exception\|ERROR"
```

---

## 🚀 Release Workflow Completo

```bash
# 1. Update version
# Editar: package.json "version": "1.0.1"

# 2. Build web
npm run build

# 3. Sync Android
npx cap sync android

# 4. Build AAB
cd android
./gradlew bundleRelease

# 5. Resultado
# app/build/outputs/bundle/release/app-release.aab

# 6. Upload Google Play Console
# Play Console → Release → Production → Create release → Upload AAB
```

---

## 🔄 Capacitor Update

```bash
# Atualizar Capacitor
npm update @capacitor/core @capacitor/cli

# Verificar versão
npx cap --version

# Sincronizar novo Capacitor com Android
npx cap sync android
```

---

## 🐛 Troubleshooting

```bash
# App não sincroniza com Android
rm -rf android
npx cap create

# Gradle não sincroniza
cd android
./gradlew --refresh-dependencies

# Cache issues
./gradlew clean build

# Port 5173 já em uso (para preview)
npm run dev -- --port 3000

# WhatsApp share não funciona
# Verificar: adb logcat | grep "Intent\|WhatsApp"
# Instalar WhatsApp no device primeiro

# Storage/localStorage não persiste
# Use @capacitor/storage ao invés de localStorage
```

---

## 📊 Verificar Status

```bash
# Setup status
npx cap doctor

# Output mostra:
# ✓ Node.js
# ✓ npm
# ✓ Android SDK
# ✓ Gradle
# ✓ Java
# ✓ Xcode (se em Mac)

# Verificar app instalado
adb shell pm list packages | grep pintorplus

# Verificar versão instalada
adb shell dumpsys package com.pintorplus.app | grep versionName
```

---

## 🎯 Atalhos Úteis

```bash
# Script de build (Windows)
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug

# Script de build (Mac/Linux)
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug

# Ou use: bash scripts/capacitor-build.sh debug
```

---

## 📝 Capacitor Config

Arquivo: `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pintorplus.app',
  appName: 'Pintor Plus',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
```

---

## 📚 Documentação

- **Quick Start:** CAPACITOR_QUICK_START.md
- **Estratégia:** docs/MIGRACAO_CAPACITOR.md
- **Deployment:** docs/CAPACITOR_DEPLOYMENT.md
- **Este Arquivo:** CAPACITOR_COMMANDS.md

---

**Salve este arquivo nos favoritos!** ⭐

