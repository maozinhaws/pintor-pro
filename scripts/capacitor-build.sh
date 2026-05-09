#!/bin/bash

# ⚡ Script para Build e Deploy com Capacitor
# Uso: bash capacitor-build.sh [debug|release]

set -e

BUILD_TYPE=${1:-debug}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Pintor Plus - Capacitor Build"
echo "=================================="
echo "Build Type: $BUILD_TYPE"
echo "Project: $PROJECT_DIR"
echo ""

# Step 1: Web Build
echo "📦 Step 1: Building web..."
cd "$PROJECT_DIR"
npm run build
echo "✅ Web built successfully"
echo ""

# Step 2: Sync Android
echo "📱 Step 2: Syncing Android..."
npx cap sync android
echo "✅ Android synced"
echo ""

# Step 3: Copy files
echo "📋 Step 3: Copying to Android..."
npx cap copy android
echo "✅ Files copied"
echo ""

# Step 4: Build APK/AAB
echo "🔨 Step 4: Building $BUILD_TYPE..."
cd "$PROJECT_DIR/android"

if [ "$BUILD_TYPE" = "release" ]; then
    echo "Building AAB for Play Store..."
    ./gradlew bundleRelease
    OUTPUT="app/build/outputs/bundle/release/app-release.aab"
    echo "✅ AAB built: $OUTPUT"
elif [ "$BUILD_TYPE" = "debug" ]; then
    echo "Building debug APK..."
    ./gradlew assembleDebug
    OUTPUT="app/build/outputs/apk/debug/app-debug.apk"
    echo "✅ APK built: $OUTPUT"
fi

echo ""
echo "🎉 Build complete!"
echo "Output: $OUTPUT"
echo ""
echo "Next steps:"
if [ "$BUILD_TYPE" = "release" ]; then
    echo "1. Sign AAB in Play Console"
    echo "2. Create release"
    echo "3. Submit for review"
else
    echo "1. Install: adb install $OUTPUT"
    echo "2. Run: npx cap run android"
fi
