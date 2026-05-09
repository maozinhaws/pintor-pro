# Changelog — Pintor Plus MVP

## 2026-05-02 v0.1.0

### Fixes
- `src/navigation.ts:25` — `go(n)` faltava `showPage('pg-s'+n)`. Botões "Orçamento detalhado"/"Continuar Detalhado" não abriam formulário. Fix: adicionado chamada showPage dentro go().

### Features

## 2026-05-02 v0.2.0

### Features
- Spinner overlay global para PDF/recibo. CSS `.spinner-ring` blur(3px), HTML `<div id="spinner-overlay">` antes `</body>`, JS `showSpinner(msg?)`/`hideSpinner()` em window. budgets.ts (`_doPDF`, `_doPDFFromOrc`), receipts.ts (`gerarReciboPDF`), app.html. Hide 1.5s (janela aberta) ou instant (bloqueado).

## 2026-05-02 v0.3.0

### Features
- Google Drive integration: auto-upload PDF/recibo após geração se conectado. Funcs `listDriveBackups()`, `downloadFromDrive(fileId)`. UI: card "Google Drive" Config, seção Drive Backup page. `renderGoogleStatus()` atualiza status conectado/desconectado. budgets.ts, receipts.ts, app.html.
- ⚠️ Deploy: OAuth requer HTTPS ou localhost. HTTP IP local (192.168.x.x) falha — usar localhost ou HTTPS.

---
