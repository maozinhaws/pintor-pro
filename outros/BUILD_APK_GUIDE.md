# Guia Completo para Compilar APK do Pintor Plus MVP

## 📱 Visão Geral

Este guia detalha como compilar um APK **funcional e instalável** no seu celular Android, não como app raiz, mas como aplicativo normal.

## 🛠️ Pré-requisitos

- **Java Development Kit (JDK)** 17 ou superior
- **Android SDK** (compileSdk 34, minSdk 23, targetSdk 34)
- **Gradle** 8.x (incluído no projeto)
- **Node.js** 18+ e npm (já instalado)
- **Git** (opcional, para versionamento)

## 📋 Checklist de Configuração

### 1. Instalação de Java (Linux/Mac)

#### Linux (Debian/Ubuntu):
```bash
apt-get update
apt-get install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

#### macOS:
```bash
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

#### Windows:
Faça download de: https://adoptium.net/temurin/releases/
Instale e defina `JAVA_HOME` nas variáveis de ambiente.

### 2. Verificar Instalação de Java

```bash
java -version
# Saída esperada: openjdk 17.x.x
```

### 3. Sincronizar Assets Web com Capacitor

```bash
cd /path/to/Pintor_Plus_MVP

# Build web (já feito, mas caso necessite atualizar):
npm run build

# Sync com Capacitor (copia dist/ → android/app/src/main/assets/public/)
npx cap sync android
```

## 🔨 Compilar APK em Modo Debug

### Método 1: Linha de Comando (Recomendado)

```bash
cd android

# Grant execution permission
chmod +x gradlew

# Build APK (Debug)
./gradlew assembleDebug

# Saída em:
# android/app/build/outputs/apk/debug/app-debug.apk (≈80MB)
```

### Método 2: Android Studio (GUI)

1. Abra o projeto em **Android Studio**:
   ```bash
   android/app
   ```

2. Menu: **Build → Build Bundle(s)/APK(s) → Build APK(s)**

3. Aguarde: ≈5-10 minutos

4. APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📦 Compilar APK em Modo Release (Assinado)

Para distribuição na Google Play Store ou instalação em produção.

### Criar Keystore de Assinatura

```bash
cd android/app

# Gerar chave (primeira vez apenas):
keytool -genkey -v -keystore pintor-plus-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pintor-plus-key \
  -storepass sua-senha \
  -keypass sua-senha \
  -dname "CN=Seu Nome, OU=Sua Org, O=Sua Empresa, C=BR"

# Armazene a senha com segurança!
```

### Configurar Gradle para Release

Editar `android/app/build.gradle`:

```gradle
android {
    // ... existing config ...

    signingConfigs {
        release {
            storeFile file('pintor-plus-key.jks')
            storePassword System.getenv('KEYSTORE_PASSWORD') ?: 'sua-senha'
            keyAlias 'pintor-plus-key'
            keyPassword System.getenv('KEY_PASSWORD') ?: 'sua-senha'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Compilar Release

```bash
cd android

./gradlew assembleRelease

# Saída em:
# android/app/build/outputs/apk/release/app-release.apk (≈60MB)
```

## 📲 Instalar APK no Celular

### Via ADB (Android Debug Bridge)

```bash
# 1. Conecte o celular via USB (com modo debug ativado)

# 2. Verificar conexão:
adb devices
# Saída esperada: seu-device     device

# 3. Instalar APK:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# -r: reinstala se já existir

# 4. Abrir app:
adb shell am start -n com.pintorplus.app/.MainActivity
```

### Via Transferência Manual

```bash
# 1. Copiar APK para pen drive ou enviar por email
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Downloads/

# 2. No celular:
#    - Conectar pen drive OU baixar arquivo
#    - Abrir gerenciador de arquivos
#    - Tocar no APK
#    - Confirmar instalação
#    - "Instalar" > "Abrir"
```

## ✅ Verificação Pós-Instalação

```bash
# Verificar que app está instalado:
adb shell pm list packages | grep pintorplus
# Saída esperada: com.pintorplus.app

# Verificar versão:
adb shell dumpsys package com.pintorplus.app | grep versionName
# Saída esperada: versionName=1.0

# Ver logs em tempo real:
adb logcat | grep pintorplus
```

## 🐛 Troubleshooting

### "JAVA_HOME is not set"
```bash
export JAVA_HOME=/path/to/jdk17
./gradlew assembleDebug
```

### "SDK Platform not found"
Abra Android Studio → Tools → SDK Manager → Instale compileSdk 34

### "Permission denied: gradlew"
```bash
chmod +x android/gradlew
```

### APK não instala ("App not installed")
- Certifique-se que `applicationId = "com.pintorplus.app"` em `build.gradle`
- Minimo SDK no celular ≥ Android 5.0 (API 23)
- Espaço disponível no celular

### App abrir e fechar imediatamente (Crash)
```bash
adb logcat *:E | grep pintorplus
# Verá o stack trace do erro
```

## 📊 Informações de Build

- **Namespace**: `com.pintorplus.app`
- **Min SDK**: 23 (Android 5.0+)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34
- **Version Code**: 1
- **Version Name**: 1.0

## 🚀 Próximos Passos

1. **Testar no celular**:
   - Criar novo orçamento (Flash, Foto, Detalhado)
   - Capturar fotos com câmera
   - Salvar offline
   - Compartilhar no WhatsApp

2. **Incrementar versão** para próximo release:
   ```gradle
   versionCode 2        // incrementa a cada build
   versionName "1.1"    // semântica: major.minor
   ```

3. **Publicar na Google Play Store**:
   - Criar conta Google Play Developer (US$ 25 one-time)
   - Enviar APK com assinatura Release
   - Preencher metadados (descrição, screenshots, etc)

## 📚 Referências

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android Build System](https://developer.android.com/build)
- [Gradle Documentation](https://docs.gradle.org/)
- [Android SDK Setup](https://developer.android.com/studio/install)

---

**Última atualização**: Maio 2026
**Versão do App**: 1.0.0
**Status**: ✅ Pronto para produção
