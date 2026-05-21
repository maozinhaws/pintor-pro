# 🚀 Guia Rápido - Compilar APK do Pintor Plus

## ⚡ Resumo em 5 Passos

### 1️⃣ Instalar Java (se não tiver)

**Linux:**
```bash
sudo apt-get update && sudo apt-get install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

**macOS:**
```bash
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

**Windows:**
- Baixe de: https://adoptium.net/temurin/releases/
- Instale e defina `JAVA_HOME` nas variáveis de ambiente

### 2️⃣ Sincronizar Assets Web

```bash
cd /caminho/para/Pintor_Plus_MVP
npx cap sync android
```

### 3️⃣ Compilar APK (Debug)

```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

⏱️ **Tempo**: 5-10 minutos na primeira vez

### 4️⃣ Instalar no Celular

#### Opção A: Via ADB (recomendado)

```bash
# Conecte o celular via USB com Debug ativado
adb devices  # Verificar conexão

# Instalar
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### Opção B: Transferência Manual

```bash
# Copiar APK
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Downloads/

# No celular:
# 1. Conectar pen drive ou baixar arquivo
# 2. Abrir gerenciador de arquivos
# 3. Tocar no APK e instalar
```

### 5️⃣ Abrir App

```bash
# Via ADB
adb shell am start -n com.pintorplus.app/.MainActivity

# Ou toque no ícone no celular
```

---

## ✅ Verificação Rápida

```bash
# App instalado?
adb shell pm list packages | grep pintorplus

# Logs em tempo real:
adb logcat | grep pintorplus

# Desinstalar:
adb uninstall com.pintorplus.app
```

---

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| `JAVA_HOME is not set` | `export JAVA_HOME=/path/to/jdk17` |
| `Permission denied: gradlew` | `chmod +x android/gradlew` |
| `App crashes ao abrir` | `adb logcat *:E` para ver erro |
| `APK não instala` | Mínimo Android 5.0 (API 23) |
| `ADB device offline` | Reconecte USB, ative Debug novamente |

---

## 📊 Specs do APK

| Item | Valor |
|------|-------|
| Package | `com.pintorplus.app` |
| Tamanho | ~80MB (debug), ~60MB (release) |
| Min Android | 5.0 (API 23) |
| Instala como | App normal (não raiz) |
| Permissões | Câmera, Armazenamento, Contatos |

---

## 🎯 Funcionalidades Incluídas

✅ Câmera nativa com 3 modos de zoom  
✅ 3 modos de orçamento (Flash/Foto/Detalhado)  
✅ Design moderno com paleta OKLCH  
✅ Funciona offline com IndexedDB/SQLite  
✅ Compartilhamento via WhatsApp  
✅ Geração de PDF  
✅ Backup e restauração  

---

## 📚 Para Mais Detalhes

Veja: `BUILD_APK_GUIDE.md` (guia completo)

---

**Status**: ✅ Pronto para produção | **Versão**: 1.0.0 | **Atualizado**: Maio 2026
