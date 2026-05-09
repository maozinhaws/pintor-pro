# 🚀 Fase 1: Setup & Project Structure — Guia de Início Rápido

**Duração:** 2-3 dias  
**Status:** ⏳ Pronta para iniciar  
**Data de Início:** 2026-05-09  

---

## 📋 Pré-requisitos

Antes de começar, certifique-se que você tem:

- ✅ **Android Studio** (2024.1.1+) instalado
- ✅ **Kotlin** 1.9+ (vem com AS)
- ✅ **JDK 17+** (vem com AS)
- ✅ **Git** configurado
- ✅ **Gradle** 8.0+ (vem com AS)
- ✅ Emulador ou dispositivo Android 10+ (API 29+)

**Verificar versões:**
```bash
java -version          # JDK 17+
kotlinc -version       # Kotlin 1.9+
gradle --version       # Gradle 8.0+
```

---

## ✅ Step 1: Criar Projeto (30 min)

### 1.1 Abrir Android Studio

- File → New → New Android Project

### 1.2 Configurar Novo Projeto

| Campo | Valor |
|-------|-------|
| **Name** | PintorPlus |
| **Package name** | com.pintorplus.android |
| **Save location** | `d:\Documentos\Projetos Apps\Pintor_Plus_Android` |
| **Language** | Kotlin |
| **Minimum SDK** | API 29 (Android 10) |
| **Target SDK** | API 34 (Android 14) |
| **Template** | Empty Activity |

### 1.3 Esperar Build Completar

- Deixar Gradle sincronizar (leva ~5 min na primeira vez)
- Se erros: File → Sync Now

---

## ✅ Step 2: Estrutura de Módulos (45 min)

### 2.1 Criar Módulos Adicionais

Android Studio → File → New → New Module (repetir 4x)

```
1. app               (tipo: Android App)
2. domain           (tipo: Android Library)
3. data             (tipo: Android Library)
4. presentation     (tipo: Android Library)
5. core             (tipo: Android Library)
```

**Menu para novo módulo:**
- File → New → New Module
- Selecionar tipo
- Nomear conforme acima
- Finish

### 2.2 Estrutura Final

Após criar, você deve ter:

```
PintorPlus/
├── app/
│   ├── build.gradle.kts
│   └── src/...
├── domain/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/domain/
├── data/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/data/
├── presentation/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/presentation/
├── core/
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/pintorplus/core/
├── build.gradle.kts (root)
├── settings.gradle.kts
└── .gitignore
```

---

## ✅ Step 3: Dependências (60 min)

### 3.1 Versões a Usar

Abra `build.gradle.kts` (root) e adicione:

```kotlin
plugins {
    id("com.android.application") version "8.1.0" apply false
    id("com.android.library") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
}

ext {
    set("compose_version", "2024.04.01")
    set("lifecycle_version", "2.7.0")
    set("room_version", "2.6.1")
    set("navigation_version", "2.7.7")
    set("koin_version", "3.5.0")
}
```

### 3.2 build.gradle.kts (app)

Substitua o arquivo completo:

```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("com.google.dagger.hilt.android") version "2.51" apply false
}

android {
    namespace = "com.pintorplus.android"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pintorplus.android"
        minSdk = 29
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}

dependencies {
    val compose_version = rootProject.ext.get("compose_version") as String
    val lifecycle_version = rootProject.ext.get("lifecycle_version") as String
    val room_version = rootProject.ext.get("room_version") as String
    val navigation_version = rootProject.ext.get("navigation_version") as String
    val koin_version = rootProject.ext.get("koin_version") as String

    // Project modules
    implementation(project(":domain"))
    implementation(project(":data"))
    implementation(project(":presentation"))
    implementation(project(":core"))

    // Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:$lifecycle_version")
    implementation("androidx.activity:activity-compose:1.8.1")

    // Compose
    implementation("androidx.compose.ui:ui:$compose_version")
    implementation("androidx.compose.material3:material3:$compose_version")
    implementation("androidx.compose.ui:ui-graphics:$compose_version")
    implementation("androidx.compose.ui:ui-tooling-preview:$compose_version")

    // Navigation
    implementation("androidx.navigation:navigation-compose:$navigation_version")

    // Room
    implementation("androidx.room:room-runtime:$room_version")
    implementation("androidx.room:room-ktx:$room_version")
    kapt("androidx.room:room-compiler:$room_version")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycle_version")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:$lifecycle_version")

    // Koin
    implementation("io.insert-koin:koin-android:$koin_version")
    implementation("io.insert-koin:koin-androidx-compose:$koin_version")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:$compose_version")
    debugImplementation("androidx.compose.ui:ui-tooling:$compose_version")
    debugImplementation("androidx.compose.ui:ui-test-manifest:$compose_version")
}
```

### 3.3 build.gradle.kts (domain)

```kotlin
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pintorplus.domain"
    compileSdk = 34
    defaultConfig {
        minSdk = 29
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
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
```

### 3.4 build.gradle.kts (data)

```kotlin
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.pintorplus.data"
    compileSdk = 34
    defaultConfig {
        minSdk = 29
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

    implementation(project(":domain"))
    implementation(project(":core"))

    // Room
    implementation("androidx.room:room-runtime:$room_version")
    implementation("androidx.room:room-ktx:$room_version")
    kapt("androidx.room:room-compiler:$room_version")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("androidx.core:core-ktx:1.12.0")
}
```

### 3.5 build.gradle.kts (presentation)

```kotlin
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pintorplus.presentation"
    compileSdk = 34
    defaultConfig {
        minSdk = 29
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

    implementation(project(":domain"))
    implementation(project(":core"))

    // Compose
    implementation("androidx.compose.ui:ui:$compose_version")
    implementation("androidx.compose.material3:material3:$compose_version")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:$navigation_version")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:$lifecycle_version")
    
    // Koin
    implementation("io.insert-koin:koin-android:$koin_version")
    implementation("io.insert-koin:koin-androidx-compose:$koin_version")
}
```

### 3.6 build.gradle.kts (core)

```kotlin
plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.pintorplus.core"
    compileSdk = 34
    defaultConfig {
        minSdk = 29
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
    implementation("androidx.core:core-ktx:1.12.0")
}
```

### 3.7 Sincronizar

- File → Sync Now
- Esperar build completar (~5 min)

---

## ✅ Step 4: Material Design 3 Theme (30 min)

### 4.1 Criar `colors.xml`

`app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Light Mode -->
    <color name="seed">0xFF7C3AED</color> <!-- --bl da web -->
    <color name="md_theme_light_primary">0xFF7C3AED</color>
    <color name="md_theme_light_on_primary">0xFFFFFFFF</color>
    <color name="md_theme_light_primary_container">0xFFF5F3FF</color>
    <color name="md_theme_light_on_primary_container">0xFF21005D</color>
    
    <color name="md_theme_light_surface">0xFFFFFBFE</color>
    <color name="md_theme_light_on_surface">0xFF0F172A</color>
    <color name="md_theme_light_outline">0xFFE2E8F0</color>
    
    <!-- Dark Mode -->
    <color name="md_theme_dark_primary">0xFF8B5CF6</color>
    <color name="md_theme_dark_on_primary">0xFFFFFFFF</color>
    <color name="md_theme_dark_primary_container">0xFF4C1D95</color>
    <color name="md_theme_dark_on_primary_container">0xFFE9D5FF</color>
    
    <color name="md_theme_dark_surface">0xFF0F172A</color>
    <color name="md_theme_dark_on_surface">0xFFF8FAFC</color>
    <color name="md_theme_dark_outline">0xFF334155</color>
</resources>
```

### 4.2 Criar `themes.xml` (Light)

`app/src/main/res/values/themes.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.PintorPlus" parent="android:Theme.Material.Light">
        <item name="colorPrimary">@color/md_theme_light_primary</item>
        <item name="colorOnPrimary">@color/md_theme_light_on_primary</item>
        <item name="colorPrimaryContainer">@color/md_theme_light_primary_container</item>
    </style>
</resources>
```

### 4.3 Criar `themes.xml` (Dark)

`app/src/main/res/values-night/themes.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.PintorPlus" parent="android:Theme.Material.Dark">
        <item name="colorPrimary">@color/md_theme_dark_primary</item>
        <item name="colorOnPrimary">@color/md_theme_dark_on_primary</item>
        <item name="colorPrimaryContainer">@color/md_theme_dark_primary_container</item>
    </style>
</resources>
```

### 4.4 Atualizar `AndroidManifest.xml`

```xml
<application
    android:theme="@style/Theme.PintorPlus"
    ...>
```

---

## ✅ Step 5: Criar MainActivity Básica (30 min)

### 5.1 Criar `MainActivity.kt`

`app/src/main/kotlin/com/pintorplus/android/MainActivity.kt`:

```kotlin
package com.pintorplus.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PintorPlusTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HomeScreen()
                }
            }
        }
    }
}

@Composable
fun PintorPlusTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        content = content
    )
}

@Composable
fun HomeScreen() {
    Text("Bem-vindo ao Pintor Plus!")
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    PintorPlusTheme {
        HomeScreen()
    }
}
```

### 5.2 Sync e Build

- File → Sync Now
- Esperar build completar
- Build → Build Bundle(s)/APK(s) → Build APK

---

## ✅ Step 6: Executar no Emulador (20 min)

### 6.1 Criar/Iniciar Emulador

- Tools → Device Manager
- Create Device
- Selecionar Pixel 4a (ou similar)
- Selecionar Android 14 (API 34)
- Finish
- Launch (▶ button)

### 6.2 Executar App

- Run → Run 'app'
- Selecionar emulador criado
- OK

**Resultado esperado:**
- App abre no emulador
- Exibe "Bem-vindo ao Pintor Plus!"
- Sem erros de crash

---

## ✅ Step 7: Git Setup (15 min)

### 7.1 Criar `.gitignore`

Na raiz do projeto:

```
# Gradle
.gradle/
build/
*.apk
*.aab

# Android Studio
.idea/
*.iml
*.iws

# Local
local.properties
*.jks
```

### 7.2 Commit Inicial

```bash
cd PintorPlus
git init
git add .
git commit -m "chore: Fase 1 - Setup inicial do projeto Android"
```

---

## ✅ Checklist Completo Fase 1

- [ ] Android Studio 2024.1.1+ instalado
- [ ] Projeto criado com package `com.pintorplus.android`
- [ ] 5 módulos criados (app, domain, data, presentation, core)
- [ ] build.gradle.kts (root) com versões definidas
- [ ] build.gradle.kts (app) com todas dependências
- [ ] build.gradle.kts (domain, data, presentation, core) criados
- [ ] Gradle sync bem-sucedido
- [ ] colors.xml criado (light + dark)
- [ ] themes.xml criado (light + dark)
- [ ] MainActivity.kt criado
- [ ] App executa no emulador sem crashes
- [ ] Emulador mostra "Bem-vindo ao Pintor Plus!"
- [ ] .gitignore criado
- [ ] Commit inicial feito

---

## 🎯 Próximos Passos (Fase 2)

Após completar Fase 1:

1. Criar entities do Room (Budget, Room, Item, Client, Config)
2. Criar Database e DAOs
3. Implementar RepositoryImpl para cada entidade
4. Criar UseCases básicos (CreateBudget, GetBudgets, etc)

**Estimar:** 5-7 dias para Fase 2

---

## 🆘 Troubleshooting

### Erro: "Failed to sync"
→ File → Sync Now → OK (repetir se necessário)

### Erro: "Gradle version not compatible"
→ Atualizar Gradle em build.gradle (kts)

### Emulador não inicia
→ Tools → Device Manager → Editar device → desabilitar "Graphics: Hardware" → Launch

### App crashes ao abrir
→ Abre Logcat em Android Studio, verificar erro de crash, compartilhar em problema

---

## 📞 Contato

Se tiver problemas nesta fase, consulte:
- Android Developer Docs: https://developer.android.com/
- Jetpack Compose: https://developer.android.com/jetpack/compose
- Room Database: https://developer.android.com/training/data-storage/room

---

**Status Atual:** ⏳ Pronto para iniciar Fase 1  
**Duração Estimada:** 2-3 dias  
**Próxima Revisão:** 2026-05-12

