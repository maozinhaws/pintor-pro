#!/bin/bash
# Build APK script for Pintor Plus MVP
# Prerequisites: Java 17+, Android SDK, npm

set -e

echo "🔨 Pintor Plus MVP - APK Builder"
echo "=================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Install JDK 17+: https://jdk.java.net"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | grep version | awk -F'"' '{print $2}' | cut -d. -f1)
echo "✅ Java $JAVA_VERSION found"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Install Node.js: https://nodejs.org"
    exit 1
fi
echo "✅ npm $(npm --version) found"

if [ ! -d "android" ]; then
    echo "❌ No android/ directory found. Run from MVP root."
    exit 1
fi
echo "✅ Android directory found"

# Step 1: Web build
echo ""
echo "🌐 Step 1: Building web app..."
if [ -d "dist" ]; then
    echo "✅ dist/ already built"
else
    echo "📦 Running npm build..."
    npm run build || {
        echo "⚠️  npm build failed, using existing dist"
        if [ ! -d "dist" ]; then
            echo "❌ No dist directory. Cannot proceed."
            exit 1
        fi
    }
fi

# Step 2: Copy web assets to Android
echo ""
echo "📱 Step 2: Copying web assets to Android..."
rm -rf android/app/src/main/assets/public/*
cp -r dist/* android/app/src/main/assets/public/
echo "✅ Assets copied to android/app/src/main/assets/public/"

# Step 3: Set JAVA_HOME if not set
if [ -z "$JAVA_HOME" ]; then
    echo ""
    echo "⚠️  JAVA_HOME not set, detecting..."
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        export JAVA_HOME=$(/usr/libexec/java_home)
        echo "✅ JAVA_HOME=$JAVA_HOME (macOS)"
    elif [ "$(uname)" == "Linux" ]; then
        # Linux
        export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
        echo "✅ JAVA_HOME=$JAVA_HOME (Linux)"
    fi
fi

# Step 4: Build APK
echo ""
echo "⚙️  Step 3: Building APK with Gradle..."
cd android

# Make gradlew executable
chmod +x gradlew

# Run gradle build
echo "Building debug APK (this may take 2-5 minutes)..."
./gradlew assembleDebug -x test --build-cache

echo ""
echo "✅ APK BUILD SUCCESSFUL!"
echo ""
echo "📦 Output:"
echo "   File: app/build/outputs/apk/debug/app-debug.apk"
APK_PATH="$(pwd)/app/build/outputs/apk/debug/app-debug.apk"
echo "   Size: $(du -h $APK_PATH | cut -f1)"
echo ""
echo "📲 Next steps:"
echo "   1. Enable USB debugging on Android device"
echo "   2. Run: adb install -r $APK_PATH"
echo "   3. Or open Android Studio and deploy"
echo ""
echo "✅ Done!"
