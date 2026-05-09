# 📦 Capacitor Deployment — Do Build ao Play Store

**Objetivo:** Publicar Pintor Plus na Play Store  
**Duração:** 1-2 dias  
**Status:** Step-by-step completo

---

## 📋 Pré-Requisitos

- ✅ App rodando no emulador/device
- ✅ Testes manuais passando
- ✅ Google Play Console conta
- ✅ Google Play Developer account ($25 taxa única)

---

## 🔐 Step 1: Criar Keystore (1 vez)

```bash
# Gerar chave de assinatura
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias pintorplus_key

# Ficará salvo em: release.keystore
# Guarde em local seguro!

# Verificar chave
keytool -list -v -keystore release.keystore
```

**Informações necessárias:**
- Keystore password: (escolha)
- Key password: (escolha, pode ser igual)
- Nome: Wagner (ou seu nome)
- Organização: Pintor Plus
- Localidade: SP, Brasil
- Validade: 10000 dias (27 anos)

---

## 📦 Step 2: Build Release APK/AAB

### Opção A: Usando Script

```bash
cd "d:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\MVP"
bash scripts/capacitor-build.sh release
```

### Opção B: Manual

```bash
# Build web
npm run build

# Sync Android
npx cap sync android
npx cap copy android

# Build AAB (recomendado para Play Store)
cd android
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## 📝 Step 3: Preparar Google Play Console

### 3.1 Criar App

1. Acesse [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Preencha:
   - **App name:** Pintor Plus
   - **Default language:** Portuguese (Brazil)
   - **App or game:** App
   - **Free or paid:** Free

### 3.2 Setup Básico

1. **App info** → Preencha:
   - App name: Pintor Plus
   - Short description: Orçamentos para pintores
   - Full description:
     ```
     Pintor Plus é um aplicativo para gerenciar orçamentos
     de serviços de pintura. Crie, editar e compartilhe
     orçamentos via WhatsApp. Funciona offline!
     
     Funcionalidades:
     - Criar orçamentos com cômodos e itens
     - Gerenciar clientes
     - Compartilhar via WhatsApp
     - Sincronizar offline
     - Dark mode
     ```

2. **App category:** Business

3. **Content rating:**
   - Clique questionnaire
   - Responda perguntas
   - Receba rating (geralmente Everyone)

### 3.3 Upload APK/AAB

1. **Release** → **Production**
2. **Create new release**
3. **Upload APK/AAB:**
   - Drag app-release.aab
   - Aguarde verificação (1-2 min)

### 3.4 App Signing

Google Play assina automaticamente com sua chave:
- ✅ Você fornece AAB unsigned
- ✅ Google Play assina com sua chave
- ✅ Usuários baixam APK assinado

---

## 🖼️ Step 4: Screenshots e Assets

### 4.1 Screenshots (Obrigatório)

Tire screenshots de:
1. **HomeScreen** — Lista de orçamentos
2. **WizardScreen** — Criando orçamento
3. **BudgetDetailsScreen** — Visualizando
4. **ClientListScreen** — Clientes
5. **SettingsScreen** — Configurações

Dimensões: 1080x1920 PNG (para phone)

### 4.2 Feature Graphic

Imagem 1024x500 PNG para loja (capa do app)

### 4.3 App Icon

Icon 512x512 PNG (será redimensionado automaticamente)

---

## 📋 Step 5: Content Rating & Policies

### 5.1 Privacy Policy

Crie em:
```
https://www.privacypolicygenerator.info/
```

Ou copie template:
```
Pintor Plus - Política de Privacidade

1. Dados Coletados:
   - Orçamentos (local, não enviamos)
   - Clientes (local, não enviamos)
   - Configurações (local, não enviamos)

2. Compartilhamento:
   - WhatsApp (você escolhe enviar)
   - Não vendemos dados

3. Contato:
   - wagner.maniatec@gmail.com
```

Link da página e adicione em Play Console

### 5.2 Terms of Service

```
Termos de Serviço - Pintor Plus

1. Uso
   Você concorda em usar este app apenas para
   fins legais e legítimos.

2. Disclaimer
   O app é fornecido "como está". Não somos
   responsáveis por dados perdidos.

3. Modificações
   Podemos modificar o app sem aviso prévio.

Última atualização: [data]
```

---

## 🚀 Step 6: Submeter para Review

### 6.1 Checklist Pré-Submissão

- [ ] Screenshots enviadas (5+)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Privacy policy link validado
- [ ] Terms of service link validado
- [ ] Content rating completo
- [ ] AAB sem erros
- [ ] Versão testada em device
- [ ] App name corrigido (Pintor Plus)
- [ ] Description em PT-BR
- [ ] Contact email válido

### 6.2 Submeter

1. **Release** → **Production**
2. **Review**
3. Click **Submit**
4. Aguarde review (24-48 horas típico)

---

## 📊 Step 7: Após Publicação

### 7.1 Google Play Console

Monitore:
- Downloads
- Crashes (se houver)
- Reviews (responda feedbacks)
- Ratings

### 7.2 Updates

```bash
# Para atualizar app existente:
# 1. Atualize versão em package.json
# 2. Build novo AAB
# 3. Upload Play Console
# 4. Preencha "What's new"
# 5. Submit

# Exemplo:
"version": "1.0.1"  # Incrementar

npm run build
cd android && ./gradlew bundleRelease
# Upload app-release.aab v1.0.1
```

---

## ⚠️ Erros Comuns

### "AppBundle must be signed"
```bash
# Solução: Google Play assina automaticamente
# Você upload unsigned APK/AAB
```

### "Invalid package name"
```bash
# Verificar em capacitor.config.ts
# appId: 'com.pintorplus.app' ✅
```

### "App crashes on startup"
```bash
# Check console logs
# adb logcat | grep error
# Teste em device antes de submeter
```

### "Screenshots rejected"
- Dimensões corretas (1080x1920)
- Mostram funcionalidades do app
- Não incluir logos de terceiros

---

## 📈 Versionamento

```
Version: MAJOR.MINOR.PATCH
         1.0.0
         ↓ ↓ ↓
    Major (rewrite)
        Minor (features)
            Patch (bugfix)

Exemplos:
1.0.0 → MVP inicial
1.0.1 → Bugfix
1.1.0 → Nova feature
2.0.0 → Rewrite completo
```

Atualize em:
- `package.json` → version
- `capacitor.config.ts` → version (se houver)
- Android → build.gradle.kts (versionCode++)

---

## 🎉 Checklist Final

- [ ] App pronto e testado
- [ ] Keystore criada e segura
- [ ] AAB gerada (release)
- [ ] Google Play Console setup
- [ ] Screenshots e assets
- [ ] Privacy policy link
- [ ] Content rating completo
- [ ] App submetido para review
- [ ] Review aprovado
- [ ] App publicado na Play Store
- [ ] Download e teste final

---

## 📱 Resultado Final

Após publicação, usuários podem:
1. Abrir Play Store
2. Buscar "Pintor Plus"
3. Instalar app
4. Começar a usar!

**Tempo desde início até live:** 12-19 dias ✅

---

## 🔗 Links Úteis

- [Google Play Console](https://play.google.com/console)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Deployment Guide](https://developer.android.com/studio/publish)
- [Play Store Guidelines](https://play.google.com/about/developer-content-policy/)

---

**Sucesso! 🚀**

