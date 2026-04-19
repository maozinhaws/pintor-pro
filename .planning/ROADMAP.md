# Roadmap: Pintor Plus Migration

## Milestone v1.0: Migração Firebase + Dexie

### Phase 1: Setup de Bibliotecas
**Goal:** Preparar o app.html para novas dependências

**Dependencies:** None

**Plans:**
- 1.1: Atualizar app.html head com novas libs
- 1.2: Verificar compatibilidade e CSP inicial

**Deliverables:**
- Dexie.js, Firebase SDK, pdfmake incluídos no HTML
- html2pdf removido
- CSP preparado para Firebase domains

---

### Phase 2: Configuração Dexie + Migração
**Goal:** Implementar IndexedDB com Dexie e migrar dados do localStorage

**Dependencies:** Phase 1

**Plans:**
- 2.1: Configurar instância Dexie com stores
- 2.2: Implementar função de migração localStorage → Dexie
- 2.3: Testar operações CRUD no Dexie

**Deliverables:**
- `db = new Dexie('PintorPlusDB')` funcionando
- Dados migrados do localStorage
- Operações CRUD funcionando

---

### Phase 3: Autenticação Firebase
**Goal:** Substituir Google Drive auth por Firebase Auth

**Dependencies:** Phase 1

**Plans:**
- 3.1: Configurar Firebase Auth no app
- 3.2: Implementar loginGoogle()
- 3.3: Implementar onAuthStateChanged()
- 3.4: Remover lógica antiga de GIS

**Deliverables:**
- Login com Google via Firebase
- Session gerenciada por Firebase Auth
- old GIS loop code removido

---

### Phase 4: Firestore CRUD + Sincronização
**Goal:** Implementar camada de dados com Firestore + sync offline-first

**Dependencies:** Phase 2, Phase 3

**Plans:**
- 4.1: Atualizar _saveOrcs() para Dexie primeiro
- 4.2: Implementar syncFirestore() background
- 4.3: Implementar resolução de conflitos
- 4.4: Testar sync bidirecional

**Deliverables:**
- Dados salvos no Dexie instantaneamente
- Sync com Firestore em background
- Conflitos resolvidos com Last Write Wins

---

### Phase 5: Gestão de Imagens
**Goal:** Comprimir fotos e implementar limpeza automática

**Dependencies:** Phase 4

**Plans:**
- 5.1: Implementar compressão via Canvas
- 5.2: Salvar blobs no Dexie
- 5.3: Upload para Firebase Storage
- 5.4: Implementar limpeza automática de fotos

**Deliverables:**
- Fotos comprimidas (max 1024px, 0.7 quality)
- Upload automático para Storage
- Limpeza de fotos antigas (>30 dias ou concluído)

---

### Phase 6: Motor PDF com pdfmake
**Goal:** Substituir html2pdf por pdfmake

**Dependencies:** Phase 5 (para fotos no PDF)

**Plans:**
- 6.1: Reescrever _generatePDFBlob() com pdfmake
- 6.2: Implementar template para orçamentos
- 6.3: Integrar fotos do Dexie/Storage
- 6.4: Testar geração de PDF

**Deliverables:**
- PDFs gerados com pdfmake
- Template completo com logo, tabelas, totais
- Fotos incluídas no PDF

---

### Phase 7: Limpeza e Segurança
**Goal:** Finalizar CSP e remover código obsoleto

**Dependencies:** Phase 6

**Plans:**
- 7.1: Atualizar vercel.json CSP para Firebase
- 7.2: Atualizar _headers com Firebase domains
- 7.3: Remover funções obsoletas (GIS/GAPI)
- 7.4: Limpeza geral de código

**Deliverables:**
- CSP completo para Firebase
- Código obsoleto removido
- App pronto para produção com Firebase

---

## Summary
- **Total Phases:** 7
- **Estimated Plans:** 18-20
- **Target:** PWA migrado para Firebase + Dexie com offline-first completo