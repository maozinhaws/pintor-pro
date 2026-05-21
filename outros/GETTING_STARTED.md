# 🚀 Getting Started - Pintor Plus MVP APK

**Status**: ✅ Ready to Build & Deploy  
**Date**: May 19, 2026  
**Target Device**: Android 12+ (any Pixel/Samsung)

---

## ⚡ Quick Start (5 Minutes)

### 1. Check Prerequisites

```bash
# Java (required)
java -version
# Output should show: openjdk version "17" or higher

# Node.js (required)
node --version
npm --version
```

**Don't have Java?**
- macOS: `brew install java17`
- Ubuntu/Debian: `sudo apt-get install openjdk-17-jdk`
- Windows: Download from https://jdk.java.net/17/
- Set JAVA_HOME: `export JAVA_HOME=/path/to/java`

**Don't have Android SDK?**
- Download Android Studio: https://developer.android.com/studio
- Open → SDK Manager → Install "Android SDK 31-34"
- Set: `export ANDROID_SDK_ROOT=$HOME/Android/Sdk`

### 2. Build APK (30 seconds if all requirements met)

```bash
cd /path/to/MVP
./build-apk-final.sh
```

**What it does:**
- Checks Java & npm
- Copies web assets to Android
- Runs Gradle build
- Creates `app-debug.apk` (~45MB)

**Expected output:**
```
✅ APK BUILD SUCCESSFUL!

📦 Output:
   File: app/build/outputs/apk/debug/app-debug.apk
   Size: 45M
```

### 3. Install on Phone

**Option A: USB Cable + adb**
```bash
# Connect phone via USB
# Enable USB debugging: Settings → Developer options → USB debugging

adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Output: Success
```

**Option B: Android Studio Emulator**
```bash
# Open Android Studio
# Device Manager → Create/Select device
# Wait for emulator to start
# Run → Select emulator → Run app
```

**Option C: Manual Installation**
1. Find APK: `android/app/build/outputs/apk/debug/app-debug.apk`
2. Copy to phone via USB or email
3. Open file manager on phone
4. Tap APK file → Install

### 4. Open & Test

✅ **App should launch in 2 seconds**

Test these features:
- [ ] **Create Budget**: Tap "Nova Orçamento"
- [ ] **Add Item**: Tap environment → Novo Item
- [ ] **Take Photo**: Tap 📷 icon → Allow camera
- [ ] **Edit Photo**: Tap photo → Draw on it
- [ ] **Generate PDF**: Top menu → Gerar PDF
- [ ] **View History**: Budget menu → Histórico
- [ ] **Go Offline**: Airplane mode → Still works!

---

## 📋 Full Build Process (If Automated Script Fails)

### Step 1: Copy Web Assets
```bash
rm -rf android/app/src/main/assets/public/*
cp -r dist/* android/app/src/main/assets/public/
```

### Step 2: Set Environment
```bash
export JAVA_HOME=/path/to/java17
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
```

### Step 3: Build
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

### Step 4: Install
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🆘 Troubleshooting

### Problem: "Java not found"
```bash
# Check if installed
java -version

# If not, install:
brew install java17              # macOS
sudo apt-get install openjdk-17-jdk  # Linux

# Set JAVA_HOME
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
echo $JAVA_HOME
```

### Problem: "Android SDK not found"
```bash
# Set Android SDK path
export ANDROID_SDK_ROOT=$HOME/Android/Sdk

# Verify
ls $ANDROID_SDK_ROOT/build-tools
# Should show: 34.0.0, 33.0.0, etc.
```

### Problem: "Gradle build failed"
```bash
# Clean and try again
cd android
./gradlew clean
./gradlew assembleDebug -x test

# Check log
cat build.log | grep ERROR
```

### Problem: "APK won't install"
```bash
# Check device
adb devices
# Should show device name

# Uninstall old version
adb uninstall com.pintorplus.app

# Reinstall
adb install -r app-debug.apk
```

### Problem: "App crashes on startup"
```bash
# Check logcat
adb logcat -s *:E | head -50

# Check if assets exist
adb shell ls /data/app/com.pintorplus*/*/base/app.html

# Reinstall web assets
rm -rf android/app/src/main/assets/public/*
cp -r dist/* android/app/src/main/assets/public/
```

---

## 📊 What's Included

### Completed Features
- ✅ Budget creation (3 modes)
- ✅ Photo camera & gallery
- ✅ Photo editor (draw, shape, text tools)
- ✅ PDF generation with watermarks
- ✅ History tracking
- ✅ Offline storage (Dexie + SQLite)
- ✅ Dark mode
- ✅ Settings
- ✅ Form validation
- ✅ Auto-save drafts

### Not Included (For Next Phase)
- Cloud backup to server
- Real-time collaboration
- AI photo analysis
- Mobile web view of budgets
- Payment processing
- SMS/Email integration

---

## 💡 Tips & Tricks

### Faster Rebuilds
```bash
# Skip tests (faster)
./gradlew assembleDebug -x test

# Use build cache
./gradlew assembleDebug --build-cache

# Incremental build (if small change)
./gradlew assembleDebug --no-rebuild
```

### Testing on Emulator (Faster Testing)
```bash
# Start emulator first
emulator -avd Pixel_5_API_31 &

# Build & deploy
./gradlew assembleDebug
./gradlew installDebug

# Open logcat
adb logcat
```

### Debug on Device
```bash
# See logs
adb logcat | grep pintorplus

# See app crashes
adb logcat *:E

# Database inspect
adb pull /data/data/com.pintorplus.app/databases/ ./db/
```

### Release Build (Later)
```bash
# Create keystore (one time)
keytool -genkey -v -keystore pintorplus.jks -keyalg RSA -keysize 2048

# Build release
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=pintorplus.jks \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=pintorplus \
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD
```

---

## 📱 Device Requirements

### Minimum
- Android 5.0 (API 21)
- 50MB free storage
- Camera (optional, for photo capture)

### Recommended
- Android 12+ (API 31+)
- 100MB free storage
- USB debugging enabled

### Tested Devices
- ✅ Pixel 5 (Android 12)
- ✅ Samsung S20 (Android 11+)
- ✅ OnePlus 9 (Android 12)
- ✅ Android Studio Emulator

---

## 📞 Getting Help

### Documentation
1. **Quick Start**: This file
2. **Build Guide**: `APK_BUILD_INSTRUCTIONS.md`
3. **Sprint Summary**: `SPRINT_9_FINAL_SUMMARY.md`
4. **Feature Docs**: `SPRINT_8_PHOTO_EDITOR.md`, `SPRINT_7_PDF_MELHORADO.md`

### Common Issues
- Check troubleshooting above
- Check logcat: `adb logcat | grep -i error`
- Delete build cache: `rm -rf android/.gradle`
- Reinstall npm deps: `rm -rf node_modules && npm install`

### Report Bug
1. Collect logcat: `adb logcat > logcat.txt`
2. Describe steps to reproduce
3. Include device info: `adb shell getprop`
4. Attach screenshots

---

## ✅ Verification After Install

```bash
# App should open
adb shell am start -n com.pintorplus.app/.MainActivity

# Check version
adb shell dumpsys package com.pintorplus.app | grep versionName

# Check installed
adb shell pm list packages | grep pintorplus

# View logs
adb logcat | grep pintorplus
```

---

## 📈 Next: What to Test

### Core Workflows
1. **Budget Creation**
   - New → Flash mode → Add room → Add item → Save
   
2. **Photo Workflow**
   - Item → Camera → Take photo → Edit → Save
   
3. **PDF Export**
   - Budget → Menu → PDF → Download

4. **History**
   - Budget → Menu → History → See changes

5. **Offline Mode**
   - Turn on Airplane mode → Create budget → Still works ✅

### Edge Cases
- Edit existing budget
- Delete items
- Change status (Pendente → Aprovado)
- Edit photo (draw, add text)
- Export/import backup
- Dark mode toggle
- Maximum photos (6) per item

---

## 🎉 Success Criteria

APK is working correctly if:

✅ App launches  
✅ Can create budget  
✅ Camera works  
✅ Photos display  
✅ PDF generates  
✅ History shows  
✅ Offline still works  
✅ Data persists  

---

## 🚀 Ready to Build!

```bash
# 1. Navigate to project
cd /path/to/MVP

# 2. Build APK
./build-apk-final.sh

# 3. Install
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 4. Test
# Open app and follow verification above

# 5. Share feedback
# Report any issues with logcat output
```

---

**Status**: ✅ Ready to Deploy  
**Build Time**: 3-5 minutes (first time), 30 seconds (incremental)  
**APK Size**: 45MB  
**All 9 Sprints**: Complete

**Good luck! 🚀**
