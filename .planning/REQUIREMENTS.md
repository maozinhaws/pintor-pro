# Requirements: Pintor Plus Migration

## Overview
Migrar aplicação de Google Drive sync para Firebase + Dexie (offline-first).

## Core Requirements

### 1. Setup de bibliotecas
- [ ] Incluir Dexie.js v4+ no head de app.html
- [ ] Incluir Firebase App, Auth, Firestore, Storage v10+ no head
- [ ] Incluir pdfmake v0.2+ no head
- [ ] Remover html2pdf.bundle.min.js

### 2. IndexedDB com Dexie
- [ ] Criar instância `db = new Dexie('PintorPlusDB')`
- [ ] Definir stores: orçamentos, fotos, clientes, fornecedores, eventos, config
- [ ] Implementar migração de localStorage para Dexie
- [ ] Remover chaves antigas após migração bem-sucedida

### 3. Autenticação Firebase
- [ ] Substituir Google Drive auth por Firebase Auth
- [ ] Implementar loginGoogle() com signInWithPopup/Redirect
- [ ] Implementar onAuthStateChanged()
- [ ] Sincronizar Firestore → Dexie quando logado
- [ ] Limpar lógica de loop deredirect do old GIS

### 4. Firestore CRUD + Sync
- [ ] Atualizar _saveOrcs() para Offline-first: Dexie primeiro
- [ ] Implementar syncFirestore() em background
- [ ] Usar timestamp para resolução de conflitos (Last Write Wins)
- [ ] Sincronização bidirecional Firestore ↔ Dexie

### 5. Gestão de Imagens
- [ ] Comprimir fotos via Canvas (max 1024px, 0.7 quality)
- [ ] Salvar blob comprimida no Dexie
- [ ] Upload para Firebase Storage
- [ ] Implementar limpeza automática de fotos antigas
- [ ] Manter apenas URL no objeto orçamento

### 6. Motor de PDF (pdfmake)
- [ ] Reescrever _generatePDFBlob()
- [ ] Usar padrão pdfmake (docDefinition)
- [ ] Incluir logo, tabelas de serviços, totais
- [ ] Converter fotos para base64 apenas na geração
- [ ] Retornar Blob via pdfMake.createPdf()

### 7. Limpeza e Segurança
- [ ] Atualizar CSP no vercel.json para Firebase domains
- [ ] Atualizar _headers com connect-src e script-src do Firebase
- [ ] Remover funções obsoletas: _initGis, _initGapi, _fetchUserInfo

## Non-Functional Requirements
- Backward compatibility: dados antigos no localStorage devem migrar sem perda
- Offline-first: app funciona sem internet
- Performance: compressão de fotos para reduzir payload
- Security: CSP adequado para Firebase

## Migration Notes
- Usar _Vault para descriptografar dados antes de salvar no Dexie
- Manter dados locais mesmo quando deslogado (offline access)
- Implementar estratégia de rollback se migração falhar