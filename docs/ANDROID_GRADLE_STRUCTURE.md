# 🏗️ Estrutura Android & Gradle Configuration

Configuração completa de todos os build.gradle.kts files e estrutura de diretórios para o projeto Android.

---

## 📁 Estrutura de Diretórios

```
PintorPlus-Android/
├── .gitignore
├── settings.gradle.kts
├── build.gradle.kts (ROOT)
│
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── kotlin/com/pintorplus/android/
│       │   │   ├── MainActivity.kt
│       │   │   ├── App.kt
│       │   │   └── ...
│       │   └── res/
│       │       ├── values/
│       │       │   ├── strings.xml
│       │       │   ├── colors.xml
│       │       │   ├── themes.xml
│       │       │   └── dimens.xml
│       │       ├── values-night/
│       │       │   └── themes.xml
│       │       ├── drawable/
│       │       ├── mipmap/
│       │       └── ...
│       ├── debug/
│       └── test/
│
├── domain/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/domain/
│       ├── entities/
│       ├── repositories/
│       └── usecases/
│
├── data/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/data/
│       ├── db/
│       │   ├── AppDatabase.kt
│       │   ├── converters/
│       │   ├── dao/
│       │   └── entities/
│       ├── mappers/
│       ├── datasources/
│       └── repositories/
│
├── presentation/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/presentation/
│       ├── screens/
│       │   ├── home/
│       │   ├── budget/
│       │   ├── clients/
│       │   └── settings/
│       ├── components/
│       ├── navigation/
│       └── viewmodels/
│
├── core/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/core/
│       ├── di/
│       ├── utils/
│       ├── extensions/
│       └── base/
│
└── build-logic/
    ├── convention/
    │   └── build.gradle.kts
    └── src/main/kotlin/
        └── convention/
            └── KmpLibraryConventionPlugin.kt
```

---

## 📝 build.gradle.kts (ROOT)

```kotlin
// build.gradle.kts (root)
plugins {
    id("com.android.application") version "8.1.0" apply false
    id("com.android.library") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
    id("org.jetbrains.kotlin.jvm") version "1.9.0" apply false
    id("com.google.dagger.hilt.android") version "2.51" apply false
}

ext {
    // ── Android & Kotlin ──
    set("min_sdk", 29)
    set("target_sdk", 34)
    set("compile_sdk", 34)
    set("kotlin_version", "1.9.0")
    set("jvm_target", "17")

    // ── Versions ──
    set("compose_version", "2024.04.01")
    set("lifecycle_version", "2.7.0")
    set("room_version", "2.6.1")
    set("navigation_version", "2.7.7")
    set("coroutines_version", "1.7.3")
    set("koin_version", "3.5.0")
    set("retrofit_version", "2.9.0")
    set("okhttp_version", "4.11.0")
    set("moshi_version", "1.15.0")
}
```

---

## 🔧 build.gradle.kts (app)

```kotlin
// app/build.gradle.kts
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("com.google.dagger.hilt.android")
}

android {
    namespace = "com.pintorplus.android"
    compileSdk = rootProject.ext.get("compile_sdk") as Int

    defaultConfig {
        applicationId = "com.pintorplus.android"
        minSdk = rootProject.ext.get("min_sdk") as Int
        targetSdk = rootProject.ext.get("target_sdk") as Int
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // String resources
        resValue("string", "app_name", "Pintor Plus")
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }

        getByName("debug") {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-DEBUG"
        }
    }

    flavorDimensions("version")
    productFlavors {
        create("dev") {
            dimension = "version"
            applicationIdSuffix = ".dev"
        }
        create("prod") {
            dimension = "version"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=androidx.compose.foundation.ExperimentalFoundationApi"
        )
    }

    buildFeatures {
        compose = true
        viewBinding = true
        dataBinding = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "DebugProbesKt.bin"
        }
    }
}

dependencies {
    val compose_version = rootProject.ext.get("compose_version") as String
    val lifecycle_version = rootProject.ext.get("lifecycle_version") as String
    val room_version = rootProject.ext.get("room_version") as String
    val navigation_version = rootProject.ext.get("navigation_version") as String
    val coroutines_version = rootProject.ext.get("coroutines_version") as String
    val koin_version = rootProject.ext.get("koin_version") as String

    // ── Project Modules ──
    implementation(project(":domain"))
    implementation(project(":data"))
    implementation(project(":presentation"))
    implementation(project(":core"))

    // ── Core Android ──
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version")
    implementation("androidx.activity:activity-compose:1.8.1")
    implementation("androidx.window:window:1.2.0")

    // ── Compose ──
    implementation("androidx.compose.ui:ui:$compose_version")
    implementation("androidx.compose.ui:ui-graphics:$compose_version")
    implementation("androidx.compose.ui:ui-tooling-preview:$compose_version")
    implementation("androidx.compose.material3:material3:$compose_version")
    implementation("androidx.compose.material:material-icons-extended:$compose_version")
    implementation("androidx.compose.foundation:foundation:$compose_version")
    implementation("androidx.compose.animation:animation:$compose_version")

    // ── Navigation ──
    implementation("androidx.navigation:navigation-compose:$navigation_version")

    // ── Room Database ──
    implementation("androidx.room:room-runtime:$room_version")
    implementation("androidx.room:room-ktx:$room_version")
    kapt("androidx.room:room-compiler:$room_version")

    // ── Lifecycle ──
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycle_version")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:$lifecycle_version")

    // ── Coroutines ──
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutines_version")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

    // ── Dependency Injection (Koin) ──
    implementation("io.insert-koin:koin-android:$koin_version")
    implementation("io.insert-koin:koin-androidx-compose:$koin_version")
    implementation("io.insert-koin:koin-androidx-workmanager:$koin_version")

    // ── JSON Serialization ──
    implementation("com.google.code.gson:gson:2.10.1")

    // ── Network ──
    val retrofit_version = rootProject.ext.get("retrofit_version") as String
    val okhttp_version = rootProject.ext.get("okhttp_version") as String
    implementation("com.squareup.retrofit2:retrofit:$retrofit_version")
    implementation("com.squareup.retrofit2:converter-gson:$retrofit_version")
    implementation("com.squareup.okhttp3:okhttp:$okhttp_version")
    implementation("com.squareup.okhttp3:logging-interceptor:$okhttp_version")

    // ── Image Loading ──
    implementation("io.coil-kt:coil-compose:2.5.0")

    // ── Logging ──
    implementation("com.jakewharton.timber:timber:5.0.1")

    // ── Testing ──
    testImplementation("junit:junit:4.13.2")
    testImplementation("androidx.test.ext:junit:1.1.5")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")

    // ── Compose Testing ──
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:$compose_version")
    debugImplementation("androidx.compose.ui:ui-tooling:$compose_version")
    debugImplementation("androidx.compose.ui:ui-test-manifest:$compose_version")
}
```

---

## 📚 build.gradle.kts (domain)

```kotlin
// domain/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pintorplus.domain"
    compileSdk = rootProject.ext.get("compile_sdk") as Int

    defaultConfig {
        minSdk = rootProject.ext.get("min_sdk") as Int
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val coroutines_version = rootProject.ext.get("coroutines_version") as String

    // ── Coroutines ──
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutines_version")

    // ── Testing ──
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")
}
```

---

## 🗄️ build.gradle.kts (data)

```kotlin
// data/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.pintorplus.data"
    compileSdk = rootProject.ext.get("compile_sdk") as Int

    defaultConfig {
        minSdk = rootProject.ext.get("min_sdk") as Int
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val room_version = rootProject.ext.get("room_version") as String
    val coroutines_version = rootProject.ext.get("coroutines_version") as String
    val koin_version = rootProject.ext.get("koin_version") as String

    // ── Project Modules ──
    implementation(project(":domain"))
    implementation(project(":core"))

    // ── Room Database ──
    implementation("androidx.room:room-runtime:$room_version")
    implementation("androidx.room:room-ktx:$room_version")
    kapt("androidx.room:room-compiler:$room_version")

    // ── Coroutines ──
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

    // ── Dependency Injection ──
    implementation("io.insert-koin:koin-core:$koin_version")

    // ── JSON ──
    implementation("com.google.code.gson:gson:2.10.1")

    // ── Android Core ──
    implementation("androidx.core:core-ktx:1.12.0")

    // ── Testing ──
    testImplementation("junit:junit:4.13.2")
    testImplementation("androidx.room:room-testing:$room_version")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:$coroutines_version")
}
```

---

## 🎨 build.gradle.kts (presentation)

```kotlin
// presentation/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pintorplus.presentation"
    compileSdk = rootProject.ext.get("compile_sdk") as Int

    defaultConfig {
        minSdk = rootProject.ext.get("min_sdk") as Int
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val compose_version = rootProject.ext.get("compose_version") as String
    val lifecycle_version = rootProject.ext.get("lifecycle_version") as String
    val navigation_version = rootProject.ext.get("navigation_version") as String
    val koin_version = rootProject.ext.get("koin_version") as String
    val coroutines_version = rootProject.ext.get("coroutines_version") as String

    // ── Project Modules ──
    implementation(project(":domain"))
    implementation(project(":core"))

    // ── Compose ──
    implementation("androidx.compose.ui:ui:$compose_version")
    implementation("androidx.compose.ui:ui-graphics:$compose_version")
    implementation("androidx.compose.ui:ui-tooling-preview:$compose_version")
    implementation("androidx.compose.material3:material3:$compose_version")
    implementation("androidx.compose.material:material-icons-extended:$compose_version")
    implementation("androidx.compose.animation:animation:$compose_version")

    // ── Navigation ──
    implementation("androidx.navigation:navigation-compose:$navigation_version")

    // ── Lifecycle ──
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycle_version")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:$lifecycle_version")

    // ── Coroutines ──
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:$coroutines_version")

    // ── Dependency Injection ──
    implementation("io.insert-koin:koin-android:$koin_version")
    implementation("io.insert-koin:koin-androidx-compose:$koin_version")

    // ── Android Core ──
    implementation("androidx.core:core-ktx:1.12.0")

    // ── Image Loading ──
    implementation("io.coil-kt:coil-compose:2.5.0")

    // ── Testing ──
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:$compose_version")
    debugImplementation("androidx.compose.ui:ui-tooling:$compose_version")
    debugImplementation("androidx.compose.ui:ui-test-manifest:$compose_version")
}
```

---

## 🔨 build.gradle.kts (core)

```kotlin
// core/build.gradle.kts
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pintorplus.core"
    compileSdk = rootProject.ext.get("compile_sdk") as Int

    defaultConfig {
        minSdk = rootProject.ext.get("min_sdk") as Int
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val koin_version = rootProject.ext.get("koin_version") as String

    // ── Dependency Injection ──
    implementation("io.insert-koin:koin-core:$koin_version")

    // ── Android Core ──
    implementation("androidx.core:core-ktx:1.12.0")

    // ── Logging ──
    implementation("com.jakewharton.timber:timber:5.0.1")

    // ── Testing ──
    testImplementation("junit:junit:4.13.2")
}
```

---

## ⚙️ settings.gradle.kts

```kotlin
// settings.gradle.kts
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven(url = "https://jitpack.io")
    }
}

rootProject.name = "PintorPlus"

include(":app")
include(":domain")
include(":data")
include(":presentation")
include(":core")
```

---

## 📋 .gitignore

```
# Gradle
.gradle/
build/
*.apk
*.aab
*.ap_

# Android Studio
.idea/
*.iml
*.iws
*.ipr
.DS_Store

# Local
local.properties
.settings/
*.jks
*.keystore

# Build variants
.cxx/

# NDK
obj/

# Lint
lint-results*

# Proguard
*.pro

# Misc
*.swp
*.swo
*~
.#*
```

---

## 🔗 Dependency Versioning Strategy

**Versões recomendadas para manter sincronizadas:**

```gradle
# Core Libraries
- androidx.core:core-ktx: 1.12.0+
- androidx.appcompat:appcompat: 1.6.1+

# Compose
- androidx.compose.ui:ui: 2024.04.01+ (monthly releases)
- androidx.compose.material3:material3: latest

# Lifecycle
- androidx.lifecycle:lifecycle-runtime-ktx: 2.7.0+

# Room
- androidx.room:room-runtime: 2.6.1+

# Kotlin
- org.jetbrains.kotlin:kotlin-stdlib: 1.9.0+

# Coroutines
- org.jetbrains.kotlinx:kotlinx-coroutines: 1.7.3+

# Koin
- io.insert-koin:koin-*: 3.5.0+
```

**Política de atualização:**
- ✅ Atualizar monthly (Compose, Material3)
- ✅ Atualizar quarterly (Room, Lifecycle, Coroutines)
- ⚠️ Testar antes de atualizar versões major

---

## ✅ Verificação Final

Após setup completo, executar:

```bash
# Sincronizar Gradle
./gradlew --version

# Validar build
./gradlew clean build

# Verificar dependencies
./gradlew app:dependencies

# Lint check
./gradlew lint
```

---

**Status:** ✅ Pronto para implementação  
**Próximo:** Começar Fase 1 com Android Studio

