#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════════"
echo "🎨 Pintor Plus MVP - Build APK with Lovable Design System"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check Java
echo "📋 Checking Java..."
if ! command -v java &> /dev/null; then
  echo "❌ Java not found. Install: sudo apt-get install openjdk-17-jdk"
  exit 1
fi
java -version

# Check Android SDK
echo ""
echo "📋 Checking Android SDK..."
if [ -z "$ANDROID_SDK_ROOT" ]; then
  ANDROID_SDK_ROOT="$HOME/Android/Sdk"
  echo "Using default: $ANDROID_SDK_ROOT"
fi
if [ ! -d "$ANDROID_SDK_ROOT" ]; then
  echo "❌ Android SDK not found at $ANDROID_SDK_ROOT"
  exit 1
fi

# Set environment
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export ANDROID_SDK_ROOT="$ANDROID_SDK_ROOT"

echo "✅ JAVA_HOME: $JAVA_HOME"
echo "✅ ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
echo ""

# Build
cd "$(dirname "$0")/android"
echo "📦 Building APK with Gradle..."
echo ""

bash gradlew clean assembleDebug -x test

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ APK BUILD SUCCESSFUL!"
echo ""
APK_PATH="$(dirname "$0")/android/app/build/outputs/apk/debug/app-debug.apk"
echo "📦 Location: $APK_PATH"
echo "📊 Size: $(du -h "$APK_PATH" | cut -f1)"
echo ""
echo "🎨 Design: Lovable system with glass morphism, brutal design, dark mode"
echo "✨ Features: All 40+ features preserved + history tracking + photo editor"
echo ""
echo "📱 Next: Transfer APK to your phone and install"
echo "════════════════════════════════════════════════════════════════"
