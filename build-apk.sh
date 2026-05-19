#!/bin/bash

# Script para compilar APK do Pintor Plus MVP usando Docker

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📦 Compilando APK Pintor Plus MVP..."
echo "📁 Diretório do projeto: $PROJECT_DIR"

# Usar imagem Docker do Android com Java incluído
docker run --rm \
  -v "$PROJECT_DIR:/workspace" \
  -w /workspace/android \
  -e GRADLE_OPTS="-Xmx2048m" \
  cirrusci/android-sdk:latest \
  bash -c "chmod +x gradlew && ./gradlew build" 2>&1 | tail -100

echo ""
echo "✅ Build finalizado!"
echo "📱 APK gerado em: android/app/build/outputs/apk/"
echo ""

# Listar APKs gerados
if [ -d "$PROJECT_DIR/android/app/build/outputs/apk" ]; then
  echo "📋 APKs disponíveis:"
  find "$PROJECT_DIR/android/app/build/outputs/apk" -name "*.apk" -type f | while read apk; do
    size=$(du -h "$apk" | cut -f1)
    echo "   📦 $(basename "$apk") ($size)"
  done
else
  echo "❌ Diretório de output não encontrado"
fi
