# Plan: Phase 1 - Setup de Bibliotecas

## Phase Goal
Preparar o app.html para novas dependências (Firebase SDK).

## Plans

### Plan 1.1: Atualizar app.html com Firebase SDK
**Objective:** Adicionar scripts Firebase ao head de app.html

**Steps:**
1. Adicionar 4 scripts Firebase no `<head>` de app.html (após libs existentes):
   - firebase-app-compat.js
   - firebase-auth-compat.js
   - firebase-firestore-compat.js
   - firebase-storage-compat.js

**Files to modify:**
- `app.html` - Adicionar scripts no head

**Verification:**
- Abrir app.html no browser
- Verificar que Firebase SDK carrega sem erros no console

---

### Plan 1.2: Preparar CSP para Firebase
**Objective:** Atualizar configuração de segurança para permitir Firebase

**Steps:**
1. Ler vercel.json atual
2. Adicionar Firebase domains em connect-src e script-src
3. Verificar _headers para Firebase

**Files to modify:**
- `vercel.json`
- `_headers` (se existir)

**Verification:**
- Deploy para staging (ou local)
- Testar que Firebase domains são permitidos
- Nenhum CSP violation no console

---

## Dependencies
- Plan 1.1 → Plan 1.2 (pode ser executado em paralelo pois são arquivos diferentes)

## Acceptance Criteria
- [ ] Firebase SDK (App, Auth, Firestore, Storage) carregado no HTML
- [ ] CSP permite domínios Firebase
- [ ]App continua funcionando após adição das libs
- [ ] Dexie e pdfmake já presentes e funcionando