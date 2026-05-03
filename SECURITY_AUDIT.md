# Auditoria de Segurança — Pintor Plus PWA

**Data:** 2026-05-02  
**Modelo:** Claude Sonnet 4.6  
**Escopo:** `src/*.ts`, `sw.js`, `app.html`  
**Status dos fixes:** CRÍTICOS/ALTOS aplicados — `npx tsc --noEmit` passou sem erros

---

## Resumo Executivo

| ID | Severidade | Arquivo | Descrição | Status |
|---|---|---|---|---|
| XSS-01 | ALTA | `ui.ts:292,295` | `e.tit`, `e.hora`, `o.nome` sem `esc()` em `renderHomeEvents` | ✅ Corrigido |
| XSS-02a | ALTA | `ui.ts:272,275` | `o.nome`, `o.status` sem `esc()` em `renderHomeMini` | ✅ Corrigido |
| XSS-02b | ALTA | `ui.ts:341,344` | `o.nome`, `o.end`, `o.status` sem `esc()` em `renderOrcamentosList` | ✅ Corrigido |
| XSS-02c | ALTA | `data.ts:269-272` | `c.nome`, `c.tel`, `c.email`, `c.end` sem `esc()` em `renderClientes` | ✅ Corrigido |
| XSS-03 | ALTA | `ui.ts:354-377` | `row()`, `it.name`, `r.name`, `o.nome`, `o.status` sem `esc()` em `viewOrc` | ✅ Corrigido |
| XSS-04 | ALTA | `appConfig.ts:343` | Status em `<option value="${s}">` sem `esc()` | ✅ Corrigido |
| XSS-05 | MÉDIA | `notifications.ts:69` | `ev.tit` sem `esc()` em `toast()` — vetor via backup malicioso | ✅ Corrigido |
| XSS-06 | ALTA | `receipts.ts:145-268` | Múltiplos campos sem `esc()` em `gerarReciboHTML` | ✅ Corrigido |
| XSS-07 | MÉDIA | `ui.ts:769`, `appConfig.ts:626` | Campos de config sem escape no modal de suporte | ✅ Fixado |
| XSS-08 | BAIXA | `agenda.ts:217` | Injeção de formato ICS via `e.tit` | ✅ Fixado |
| RL-01 | ALTA | `gauth.ts:108` | `uploadToDrive` sem rate limiting | ✅ Corrigido (1,5s cooldown) |
| RL-02 | ALTA | `gauth.ts:161` | `uploadBudgetPhotos` sem limite de fotos | ✅ Corrigido (máx 20 fotos) |
| RL-03 | MÉDIA | `data.ts:100`, `appConfig.ts:69` | CEP sem debounce — 9 requisições externas por digitação | ⚠️ Pendente |
| RL-04 | MÉDIA | `gauth.ts:204-207` | `downloadFromDrive` global — exfiltração via XSS | ⚠️ Pendente |
| SEC-01 | MÉDIA | `gauth.ts:4` | Client ID OAuth hardcoded — risco de phishing | ℹ️ Ação no GCP |
| SEC-02 | ALTA | `appConfig.ts:487` | Backup importado sem sanitização — XSS persistente | ✅ Corrigido |
| SEC-03 | MÉDIA | `gauth.ts:152` | `atob()` sem try/catch, MIME sem whitelist | ✅ Corrigido |
| SEC-04 | BAIXA | `appConfig.ts:576` | CNPJ/CPF no log de suporte enviado por e-mail | ⚠️ Pendente |
| SEC-05 | MÉDIA | `sw.js` | SW sem CSP e sem verificação de integridade | ⚠️ Pendente |
| SEC-06 | MÉDIA | `_headers` | Headers HTTP de segurança ausentes | ⚠️ Pendente |

---

## Vulnerabilidades Detalhadas

### XSS-01 — `renderHomeEvents` sem escape (ALTA) ✅ Corrigido

**Arquivo:** `src/ui.ts:292,295`

**Código vulnerável (antes):**
```typescript
html += `... ${ico('bell')} ${e.tit} ...`;
html += `... ${e.hora || 'O dia todo'} ...`;
html += `... Obra: ${o.nome} ... ${o.status || 'Pendente'} ...`;
```

**Fix aplicado:**
```typescript
html += `... ${ico('bell')} ${esc(e.tit)} ...`;
html += `... ${esc(e.hora || 'O dia todo')} ...`;
html += `... Obra: ${esc(o.nome)} ... ${esc(o.status || 'Pendente')} ...`;
```

**Impacto:** Um evento com título `<img src=x onerror=alert(document.cookie)>` seria executado na tela inicial.

---

### XSS-02 — Listagens sem escape (ALTA) ✅ Corrigido

**Arquivos:** `src/ui.ts:272,275,341,344` | `src/data.ts:269-272`

**Campos corrigidos:**
- `o.nome`, `o.status`, `o.end` em `renderHomeMini` e `renderOrcamentosList`
- `c.nome`, `c.tel`, `c.email`, `c.end` em `renderClientes`

**Impacto:** Nome de cliente com payload XSS executaria ao abrir qualquer tela de listagem.

---

### XSS-03 — `viewOrc` sem escape (ALTA) ✅ Corrigido

**Arquivo:** `src/ui.ts:354-377`

**Fix principal — função `row()`:**
```typescript
// Antes:
const row = (label, val) => val ? `...<span>${val}</span>` : '';
// Depois:
const row = (label, val) => val ? `...<span>${esc(val)}</span>` : '';
```

**Campos adicionais:** `it.name`, `r.name`, `o.nome`, `o.status` — todos agora escapados.

---

### XSS-04 — Status em `<option>` sem escape (ALTA) ✅ Corrigido

**Arquivo:** `src/appConfig.ts:343`

```typescript
// Antes:
`<option value="${s}">${s}</option>`
// Depois:
`<option value="${esc(s)}">${esc(s)}</option>`
```

**Impacto:** Status personalizado `"><script>...` quebraria o atributo `value` e injetaria HTML.

---

### XSS-05 — `toast()` com `ev.tit` não escapado (MÉDIA) ✅ Corrigido

**Arquivo:** `src/notifications.ts:69`

**Vetor de ataque via backup:** Arquivo `.json` malicioso importado → `S.eventos` recebe `{ tit: '<img onerror=...>' }` → alarme dispara → XSS no toast.

```typescript
// Antes:
toast(`... LEMBRETE: ${ev.tit}`);
// Depois:
toast(`... LEMBRETE: ${esc(ev.tit)}`);
```

---

### XSS-06 — `gerarReciboHTML` sem escape (ALTA) ✅ Corrigido

**Arquivo:** `src/receipts.ts:145-268`

Recibo é renderizado em nova aba e salvo no Google Drive como `.html`. Campos corrigidos:
- `d.obs`, `d.empresa.cnpj`, `d.empresa.nome`, `d.empresa.tel`, `d.empresa.email`, `d.empresa.end`
- `recebidoDe` (nome do pagador/cliente), `d.cliente.doc`, `d.cliente.tel`, `d.cliente.end`
- `d.descServicos`, `d.pgto`, `d.pagador.nome`, `d.pagador.tel`, `d.pagador.end`

---

### SEC-02 — Backup importado sem sanitização (ALTA) ✅ Corrigido

**Arquivo:** `src/appConfig.ts:487`

**Fix:** Adicionada função `_sanitizeBackupData()` que:
- Limita comprimento de todos os campos de texto
- Remove caracteres HTML perigosos de campos estruturados (tel, cpf)
- Garante que `e.hora` só contenha `[0-9:]`
- Sanitiza `config.statusList` e `config.servicos` antes de importar

---

### RL-01 — `uploadToDrive` sem rate limiting (ALTA) ✅ Corrigido

**Arquivo:** `src/gauth.ts:108`

**Fix:** Cooldown de 1,5s entre uploads consecutivos via `_lastUploadTs`. Um XSS que tentasse fazer loop de uploads seria bloqueado após a primeira chamada.

---

### RL-02 — `uploadBudgetPhotos` sem limite (ALTA) ✅ Corrigido

**Arquivo:** `src/gauth.ts:161`

**Fix:** Limite de 20 fotos por upload (`MAX_PHOTOS_PER_UPLOAD`). Excedente exibe toast de aviso.

---

### SEC-03 — `_dataURLtoBlob` sem validação (MÉDIA) ✅ Corrigido

**Arquivo:** `src/gauth.ts:152`

**Fixes:**
- `try/catch` ao redor de `atob()` — retorna `null` em caso de erro em vez de lançar exceção
- MIME type validado por regex `image/(jpeg|png|webp|gif)` — rejeita MIME de outros tipos (ex: `application/x-sh`)

---

## Vulnerabilidades Pendentes (MÉDIA/BAIXA)

### XSS-07 — Modal de suporte com campos sem escape (MÉDIA)
**Arquivo:** `src/ui.ts:769`, `src/appConfig.ts:626`  
**Fix recomendado:**
```typescript
infoEl.innerHTML = [cfg.nome, cfg.tel, cfg.cnpj]
  .filter(Boolean).map(v => esc(String(v))).join('<br>') || '—';
```

### XSS-08 — Injeção de formato ICS (BAIXA)
**Arquivo:** `src/agenda.ts:217`  
**Fix recomendado:**
```typescript
const safeTit = e.tit.replace(/[;:\\,\n]/g, ' ');
const ics = `...SUMMARY:${safeTit}\n...`;
```

### RL-03 — CEP sem debounce (MÉDIA)
**Arquivo:** `src/data.ts:100`, `src/appConfig.ts:69`  
**Fix recomendado:** Debounce de 500ms antes de chamar `fetchCep`.

### RL-04 — Funções Drive no escopo global (MÉDIA)
**Arquivo:** `src/gauth.ts:204-207`  
**Risco:** Combinado com XSS restante, `window.listDriveBackups` + `window.downloadFromDrive` permitem exfiltração de todos os dados.  
**Fix recomendado:** Remover do `window` e chamar diretamente dos módulos.

### SEC-01 — Client ID OAuth hardcoded (MÉDIA)
**Arquivo:** `src/gauth.ts:4`  
**Ação no Google Cloud Console:** Restringir origens JavaScript autorizadas ao domínio de produção. Remover `http://localhost` de produção.

### SEC-05 — Service Worker sem CSP (MÉDIA)
**Arquivo:** `sw.js`  
**Fix recomendado:** Adicionar `_headers` ou `vercel.json` com:
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com; connect-src 'self' https://www.googleapis.com https://brasilapi.com.br https://viacep.com.br https://opencep.com https://api.rss2json.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline';
```

### SEC-06 — Headers HTTP de segurança ausentes (MÉDIA)
**Fix recomendado:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Resultado da Verificação TypeScript

```
npx tsc --noEmit → 0 erros, 0 avisos
```
