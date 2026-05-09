# TUNNEL.md — Reabrir Tunnel ngrok (Pintor Plus MVP)

## Prompt para outra LLM

```
Reabra o tunnel ngrok do projeto Pintor Plus MVP com as seguintes especificações:

**Projeto:** Pintor Plus PWA
**cwd:** D:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\APK_backup_2026-03-27\FINAL\MVP
**Stack:** Vite + TypeScript (PWA)
**Dev server porta:** 5173
**Dev server URL local:** http://localhost:5173/app.html

**ngrok:**
- Versão instalada: 3.39.1-msix-stable
- Executável: C:\Users\DenisGSJ\AppData\Local\Microsoft\WindowsApps\ngrok.exe
- API local (para pegar URL): http://localhost:4040/api/tunnels
- Conta: plano free (domínio aleatório gerado a cada sessão)

**Passos obrigatórios (nesta ordem):**

1. Verificar se o dev server Vite já está rodando na porta 5173:
   netstat -ano | grep ":5173"
   → Se não estiver: iniciar em background com:
   cd "D:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\APK_backup_2026-03-27\FINAL\MVP" && npm run dev -- --port 5173 --host
   → Aguardar ~4s e verificar novamente.

2. Verificar se já existe tunnel ngrok ativo:
   curl -s http://localhost:4040/api/tunnels
   → Se retornar tunnel com public_url: já está ativo, só extrai a URL.
   → Se retornar erro/vazio: iniciar novo tunnel.

3. Iniciar tunnel ngrok (se necessário):
   ngrok http 5173 --log stdout &
   → Aguardar ~3s.
   → Pegar URL via: curl -s http://localhost:4040/api/tunnels

4. Extrair public_url do JSON retornado:
   { "tunnels": [{ "public_url": "https://XXXX.ngrok-free.dev", ... }] }

5. Retornar ao usuário:
   - URL do tunnel: https://XXXX.ngrok-free.dev
   - URL direta do app: https://XXXX.ngrok-free.dev/app.html
   - Inspetor ngrok: http://localhost:4040

**Aviso obrigatório após abrir:**
OAuth Google (login com Drive) falha nesse domínio ngrok a menos que a URL seja
adicionada nas Origens JavaScript autorizadas no Google Cloud Console.
Para testar OAuth: usar http://localhost:5173/app.html em vez do tunnel.
```

---

## Informações obrigatórias que a LLM deve ter

| Info | Valor |
|------|-------|
| cwd do projeto | `D:\Documentos\Projetos Apps\Orçamento_Pintor_Plus\APK_backup_2026-03-27\FINAL\MVP` |
| Porta do dev server | `5173` |
| Comando para subir dev server | `npm run dev -- --port 5173 --host` |
| Executável ngrok | `C:\Users\DenisGSJ\AppData\Local\Microsoft\WindowsApps\ngrok.exe` |
| Versão ngrok | `3.39.1-msix-stable` |
| API local ngrok | `http://localhost:4040/api/tunnels` |
| Entry point do app | `/app.html` |
| Shell padrão | PowerShell (Windows 11) |
| Bash disponível | Sim (via Bash tool do Claude Code) |

## Notas

- Plano free do ngrok gera domínio novo a cada sessão — a URL muda ao reiniciar.
- O Vite config (`vite.config.ts`) já tem `allowedHosts: true` — aceita qualquer host ngrok sem whitelist adicional.
- Se ngrok pedir autenticação (`ERR_NGROK_108`): rodar `ngrok config check` e verificar token em `~/.config/ngrok/ngrok.yml`.
