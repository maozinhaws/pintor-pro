# Research: Phase 1 - Setup de Bibliotecas

## Objetivo
Identificar versões corretas e URLs de CDN para as bibliotecas necessárias.

## libs Pesquisadas

### 1. Dexie.js
- **Versão:** v4.0.4 (já incluída no app.html)
- **CDN:** `https://cdn.jsdelivr.net/npm/dexie@4.0.4/dist/dexie.min.js`
- **Status:** Já incluída, OK

### 2. Firebase SDK
- **Versão recomendada:** v10+ (compat)
- **CDN:** `https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js`
- **Módulos necessários:**
  - firebase-app-compat.js
  - firebase-auth-compat.js
  - firebase-firestore-compat.js
  - firebase-storage-compat.js
- **Nota:** Usar versão compat para evitar problemas com Service Workers

### 3. pdfmake
- **Versão:** v0.2.10 (já incluída)
- **CDN:** `https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js`
- **Também necessário:** vfs_fonts para fontes
- **Status:** Já incluída, OK

### 4. html2pdf.js
- **Remover:** Script html2pdf.bundle.min.js
- **Status:** Não encontrado no head - usado apenas no código

## CSP Atual (vercel.json)
Precisa adicionar para Firebase:
- `https://*.firebaseio.com`
- `https://*.googleapis.com`
- `https://firebasestorage.googleapis.com`
- `https://*.cloudfunctions.net`

## Conclusão
- Dexie e pdfmake já estão configurados
- Firebase SDK precisa ser adicionado
- html2pdf não está no head, apenas no código (será removido na Fase 6)