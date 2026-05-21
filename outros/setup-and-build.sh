#!/bin/bash

# Script automatizado para compilar APK do Pintor Plus MVP
# Uso: ./setup-and-build.sh [debug|release]

set -e

BUILD_TYPE="${1:-debug}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Pintor Plus MVP - Build Script"
echo "=================================="
echo "📁 Diretório: $PROJECT_DIR"
echo "🔨 Modo: $BUILD_TYPE"
echo ""

# 1. Verificar Java
echo "✓ Verificando Java..."
if ! command -v java &> /dev/null; then
    echo "❌ Java não encontrado. Instale JDK 17+"
    echo "   Linux: sudo apt-get install openjdk-17-jdk"
    echo "   macOS: brew install openjdk@17"
    echo "   Windows: https://adoptium.net/"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "\K[^"]+')
echo "   ✓ Java $JAVA_VERSION"

# 2. Sincronizar web assets com Capacitor
echo ""
echo "✓ Sincronizando assets web..."
if [ -d "$PROJECT_DIR/dist" ]; then
    echo "   ✓ dist/ encontrado"
    cd "$PROJECT_DIR"
    npx cap sync android 2>&1 | grep -E "Synced|Updated|Created" || echo "   ✓ Sincronizado"
else
    echo "❌ dist/ não encontrado. Execute: npm run build"
    exit 1
fi

# 3. Compilar APK
echo ""
echo "✓ Compilando APK ($BUILD_TYPE)..."
cd "$PROJECT_DIR/android"

# Grant permissions
chmod +x ./gradlew

# Build
if [ "$BUILD_TYPE" = "release" ]; then
    if [ ! -f "app/pintor-plus-key.jks" ]; then
        echo "❌ Keystore não encontrado: app/pintor-plus-key.jks"
        echo "   Execute: keytool -genkey -v -keystore app/pintor-plus-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pintor-plus-key"
        exit 1
    fi
    ./gradlew assembleRelease -x lint --build-cache
else
    ./gradlew assembleDebug --build-cache
fi

# 4. Listar APK gerado
echo ""
echo "✅ Build concluído com sucesso!"
echo ""
echo "📦 APK gerado:"
APK_DIR="$PROJECT_DIR/android/app/build/outputs/apk/$BUILD_TYPE"
if [ -d "$APK_DIR" ]; then
    ls -lh "$APK_DIR"/*.apk 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

    # Mostrar comando de instalação
    APK_FILE=$(ls "$APK_DIR"/*.apk 2>/dev/null | head -1)
    if [ -n "$APK_FILE" ]; then
        echo ""
        echo "📲 Para instalar no celular (via USB com debug mode ativado):"
        echo "   adb install -r $APK_FILE"
        echo ""
        echo "   Ou transferir manualmente:"
        echo "   cp $APK_FILE ~/Downloads/"
    fi
else
    echo "❌ APK não encontrado em $APK_DIR"
    exit 1
fi

echo ""
echo "🎉 Pronto para usar!"
