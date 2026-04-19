# Context: Phase 1 - Setup de Bibliotecas

## Objetivos da Phase
1. Adicionar Firebase SDK ao head de app.html
2. Verificar que Dexie.js e pdfmake estão corretos
3. Preparar CSP para Firebase domains

## Decisões Tomadas

### libs a Incluir
| Biblioteca | Versão | CDN | Status |
|------------|--------|-----|--------|
| Dexie.js | 4.0.4 | cdn.jsdelivr.net | ✅ Já incluída |
| Firebase (App/Auth/Firestore/Storage) | 10.13.2 | gstatic.com | ⬜ Needs add |
| pdfmake | 0.2.10 | cdn.jsdelivr.net | ✅ Já incluída |
| html2pdf | - | - | ⬜ Remover na Fase 6 |

### Firebase URLs needed
```
https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js
https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js
https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js
https://www.gstatic.com/firebasejs/10.13.2/firebase-storage-compat.js
```

### CSP Domains needed
- `*.firebaseio.com`
- `*.googleapis.com`
- `firebasestorage.googleapis.com`
- `*.cloudfunctions.net`

## Requisitos do Plano
- Adicionar 4 scripts Firebase no head (app.html)
- Atualizar CSP em vercel.json e _headers
- Verificar que Dexie e pdfmake estão funcionando
- Não remover html2pdf (será tratado na Fase 6)