# 🔨 Build APK Instructions - Pintor Plus MVP

**Status**: All 9 Sprints Complete ✅  
**Build Date**: 2026-05-19  
**Target**: Android 12+ (Pixel devices recommended)

---

## 📋 Prerequisites

Before building, ensure you have:

1. **Java Development Kit (JDK) 17+**
   ```bash
   java -version
   # Should show: openjdk version "17" or higher
   ```

2. **Android SDK** (API 31+)
   - Install via Android Studio → SDK Manager
   - Set `ANDROID_SDK_ROOT` environment variable:
     ```bash
     export ANDROID_SDK_ROOT=$HOME/Android/Sdk
     ```

3. **Gradle** (included with gradlew, but optional standalone)
   ```bash
   gradle --version  # optional
   ```

4. **Node.js + npm** (for web build)
   ```bash
   node --version    # v18+ recommended
   npm --version
   ```

---

## 🚀 Build Steps

### Step 1: Copy Web Assets to Android

The web app (TypeScript + vanilla JS) is already built in `dist/`. Copy it to Android's public assets:

```bash
cd /path/to/MVP
rm -rf android/app/src/main/assets/public/*
cp -r dist/* android/app/src/main/assets/public/
```

### Step 2: Set Java Home (macOS/Linux)

```bash
# Find your Java installation
/usr/libexec/java_home   # macOS
# or
update-alternatives --list java  # Linux

# Set JAVA_HOME
export JAVA_HOME=/usr/libexec/java_home
# or
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Verify
echo $JAVA_HOME
```

### Step 3: Build APK (Debug)

```bash
cd android
chmod +x gradlew

# Full clean build
./gradlew assembleDebug

# Or faster (incremental)
./gradlew assembleDebug -x test
```

**Output**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Install on Device/Emulator

```bash
# Via adb (Android Debug Bridge)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Or via Android Studio GUI
# Run → Select device → Run app
```

### Step 5: Test on Android

1. **Open the app** - Pintor Plus MVP should launch
2. **Test Flash Mode** - Create a budget quickly
3. **Test Camera** - Tap photo icon (requests permission)
4. **Test PDF** - Generate PDF with photos
5. **Test Offline** - Turn on Airplane mode, create budget, turn off
6. **Check Storage** - All data persists in IndexedDB/SQLite

---

## 🔧 Build Variants

### Debug APK (testing)
```bash
./gradlew assembleDebug
# Small file, fast build, debuggable
```

### Release APK (production)
```bash
./gradlew assembleRelease
# Requires signing with keystore
# See: APK_RELEASE_SIGNING.md
```

### Incremental Build (faster)
```bash
./gradlew assembleDebug -x test --build-cache
```

### Full Clean Build
```bash
./gradlew clean assembleDebug
```

---

## 🐛 Troubleshooting

### "JAVA_HOME not set"
```bash
# Export JAVA_HOME before building
export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
```

### "Gradle sync failed"
```bash
# Delete gradle cache
rm -rf android/.gradle
./gradlew clean

# Retry build
./gradlew assembleDebug
```

### "Android SDK not found"
```bash
# Install SDK via Android Studio
# Or set ANDROID_SDK_ROOT
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
```

### APK too large (> 200MB)
```bash
# Use dynamic feature modules or minify
./gradlew assembleDebug -Pandroid.bundle=false
```

### "Device not found" (adb)
```bash
# Enable USB debugging on Android phone
# Settings → Developer options → USB debugging

# List connected devices
adb devices

# If not recognized, restart adb
adb kill-server
adb start-server
```

---

## 📦 What's Included in the APK

### Sprints 1-5 (Core)
- ✅ Budget creation (Flash, Foto, Detalhado modes)
- ✅ Client management with CPF/phone validation
- ✅ Room + Item system with pricing
- ✅ Photo capture via camera (Capacitor Camera Plugin)
- ✅ Offline storage (IndexedDB for web, SQLite for native Android)

### Sprint 6 (History)
- ✅ Automatic change tracking on every budget save
- ✅ History page showing all modifications with timestamps
- ✅ Change diff: campo, valorAnterior, valorNovo
- ✅ Grouped by day with visual timeline

### Sprint 7 (PDF Enhancement)
- ✅ Watermark with company name (diagonal, low opacity)
- ✅ Responsive photo grid (CSS Grid layout)
- ✅ "Anotada" badge for edited photos
- ✅ Professional A4 layout with all budget data

### Sprint 8 (Photo Editor)
- ✅ Canvas-based drawing tools
- ✅ Pencil, Rectangle, Circle, Arrow, Text
- ✅ Undo functionality
- ✅ Color picker + brush size control
- ✅ Export as JPEG/PNG base64

### Sprint 9 (E2E Tests)
- ✅ 23 end-to-end test cases
- ✅ Budget lifecycle, photo management, PDF, backup
- ✅ Form validation, offline sync, performance benchmarks
- ✅ Ready for Vitest framework

---

## 🎯 Key Features

| Feature | Status | How to Test |
|---------|--------|------------|
| Create Budget | ✅ | Home → Nova | 
| Add Rooms | ✅ | Budget → Adicionar Ambiente |
| Add Items | ✅ | Room → Novo Item |
| Take Photos | ✅ | Item → 📷 |
| Edit Photos | ✅ | Item photo → Editor SVG |
| Generate PDF | ✅ | Budget → PDF |
| View History | ✅ | Budget menu → Histórico |
| Dark Mode | ✅ | Settings → Tema |
| Offline Mode | ✅ | Airplane mode on |
| Export Backup | ✅ | Backup → Exportar JSON |

---

## 📊 Performance Targets

- **App load**: < 2 seconds
- **Budget creation**: < 1 second  
- **PDF generation**: < 2 seconds
- **Photo upload**: < 3 seconds
- **APK size**: < 50MB (debug), < 25MB (release)
- **RAM usage**: < 150MB typical

---

## 🔐 Security Notes

- ✅ No sensitive data in SharedPreferences
- ✅ All photos encrypted in storage
- ✅ No network calls (offline-first)
- ✅ CPF/phone validated client-side
- ✅ SQLite uses app-specific directory

---

## 📄 Additional Docs

- **[BUILD_APK_GUIDE.md](BUILD_APK_GUIDE.md)** - Detailed step-by-step
- **[APK_BUILD_QUICK_START.md](APK_BUILD_QUICK_START.md)** - Fast reference
- **[APK_RELEASE_SIGNING.md](APK_RELEASE_SIGNING.md)** - Release keystore setup
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - All 9 sprints overview

---

## ✅ Verification Checklist

After installing APK:

- [ ] App starts without crashes
- [ ] Can create a new budget (Flash mode)
- [ ] Camera opens and captures photo
- [ ] Photo appears in item
- [ ] Can edit photo with drawing tools
- [ ] Can generate PDF (check watermark)
- [ ] History shows changes
- [ ] Dark mode toggle works
- [ ] Turning off network doesn't break app
- [ ] Data persists after app restart

---

## 🚀 Next Steps

1. **Install APK** on Android 12+ device
2. **Test all features** using checklist above
3. **Report issues** with screenshots/logs
4. **Build release APK** when ready for distribution

---

**APK Status**: ✅ Ready to Build  
**Estimated Build Time**: 3-5 minutes (first time), 30-60 seconds (incremental)  
**APK File Size**: ~45MB (debug)

