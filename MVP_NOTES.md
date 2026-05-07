# MVP_NOTES — Pintor Plus

Registro do escopo do MVP: o que foi incluído, o que foi cortado e o que pertence ao roadmap.

---

## O que está no MVP

| Funcionalidade | Status |
|----------------|--------|
| Orçamentos detalhados (cômodos, itens, m²) | ✅ MVP |
| Orçamento Flash (visita técnica rápida) | ✅ MVP |
| Gestão de Clientes (CRUD + histórico) | ✅ MVP |
| Gestão de Fornecedores | ✅ MVP |
| Recibos simples (compartilhamento via WhatsApp) | ✅ MVP |
| Envio de orçamento via WhatsApp | ✅ MVP |
| Dark Mode | ✅ MVP |
| PWA instalável + Service Worker (offline) | ✅ MVP |
| Configurações da empresa (nome, logo, assinatura) | ✅ MVP |
| Armazenamento local (localStorage) | ✅ MVP |

---

## O que foi cortado do MVP

### Google Drive (Backup em nuvem)

**O que seria:** sincronização automática e manual dos dados do app com a pasta `appDataFolder` do Google Drive do usuário.

**Por que cortado:** requer OAuth 2.0 com Google Identity Services (GSI), fluxo de autenticação, tratamento de tokens, e aprovação da Google no OAuth Consent Screen. Complexidade desproporcional para um MVP.

**Impacto no usuário:** dados ficam apenas no `localStorage`. Se o usuário limpar o navegador ou trocar de dispositivo, os dados são perdidos.

**Roadmap:** Fase 2 — integração com Google Drive (`appDataFolder`), login com conta Google, sync automático ao criar/editar orçamento.

---

### Google Calendar (Agenda de Obras)

**O que seria:** criação e listagem de eventos no Google Calendar vinculados às datas dos orçamentos, com lembretes automáticos.

**Por que cortado:** depende do OAuth Google e da API Calendar. Além disso, requer que o usuário autorize o escopo `calendar.events`. Complexidade e fricção altas para MVP.

**Impacto no usuário:** não há agenda integrada. Datas dos orçamentos existem no app, mas sem notificações ou visualização de calendário.

**Roadmap:** Fase 3 — depois do Drive estar funcionando, adicionar integração com Google Calendar para eventos de início/fim de obra.

---

### Geração de PDF

**O que seria:** exportação de orçamentos e recibos como arquivos PDF formatados com logotipo da empresa, dados do cliente, itemização e assinatura digital.

**Por que cortado:** geração de PDF no browser (via `jsPDF`, `html2canvas` ou `print`) tem inconsistências entre dispositivos móveis, especialmente iOS Safari. Resolver bem exige tempo de QA.

**Impacto no usuário:** compartilhamento de orçamentos acontece via texto formatado no WhatsApp. Recibos são texto simples, não PDF.

**Roadmap:** Fase 4 — implementar geração de PDF usando `jsPDF` + `html2canvas` com template fiel ao layout do app, testado em Android e iOS.

---

### Google Contacts (Importar contatos)

**O que seria:** importação de contatos diretamente da agenda do Google (API People) ao criar um novo orçamento.

**Por que cortado:** requer escopo OAuth adicional (`contacts.readonly`). A API People tem limites de cota e fluxo de aprovação adicional no Google.

**Impacto no usuário:** ao criar orçamento, o usuário digita os dados do cliente manualmente. A opção "📱 Agenda do Celular" (acesso aos contatos nativos do dispositivo via Web Contacts API) pode ser mantida como alternativa sem OAuth.

**Roadmap:** Avaliar junto com Fase 2 (Drive) — se o usuário já tiver conta Google autenticada, o custo de adicionar o escopo Contacts é marginal.

---

## Decisões de design do MVP

- **Sem login obrigatório:** o app funciona imediatamente sem conta. Reduz fricção de onboarding.
- **localStorage como única fonte de verdade:** simples, sem dependências externas, zero latência.
- **WhatsApp como canal de saída:** substitui PDF para o caso de uso principal (enviar orçamento ao cliente).
- **Landing page (index.html) sem promessas falsas:** todas as menções a Drive, Calendar e PDF foram removidas para alinhar expectativas com o que o MVP entrega.

---

## Riscos conhecidos do MVP

| Risco | Impacto | Mitigação atual |
|-------|---------|----------------|
| Perda de dados ao limpar navegador | Alto | Aviso na tela de configurações |
| localStorage limitado (~5 MB por origem) | Médio | Orçamentos de texto são pequenos; monitorar |
| Sem sync entre dispositivos | Alto | Aceito no MVP; Drive resolve no roadmap |
