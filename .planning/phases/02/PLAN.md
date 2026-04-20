# Fase 2: Configuração Dexie + Migração de Dados

Este plano detalha a transição do armazenamento de dados do `localStorage` para o `IndexedDB` usando a biblioteca `Dexie.js`. Isso garantirá maior performance, estabilidade e capacidade para armazenar fotos e grandes volumes de dados.

## Problemas Identificados
- **Criptografia**: O app usa o sistema `_Vault` para criptografar dados no `localStorage`. A função de migração atual em `db.js` não considera isso.
- **Integração**: O script principal no `app.html` ainda salva dados exclusivamente no `localStorage`.
- **Sincronização Incompleta**: `db.js` é carregado, mas suas funções não são chamadas pelo fluxo principal de persistência.

## Mudanças Propostas

### 1. Banco de Dados e Migração (db.js)
#### [MODIFY] [db.js](file:///d:/Documentos/Projetos%20Apps/Or%C3%A7amento_Pintor_Plus/pintor-plus/db.js)
- Atualizar `dbMigrateFromLocalStorage` para usar `_Vault.read(key)` em vez de `localStorage.getItem(key)`. Isso garante que dados criptografados sejam lidos corretamente antes da migração.
- Adicionar uma flag de controle no próprio IndexedDB para marcar que a migração foi concluída com sucesso, evitando execuções repetidas.
- Refinar as funções `dbSaveOrcs`, `dbSaveClientes`, etc., para garantir que elas usem transações atômicas de escrita.

### 2. Integração com o App (app.html)
#### [MODIFY] [app.html](file:///d:/Documentos/Projetos%20Apps/Or%C3%A7amento_Pintor_Plus/pintor-plus/app.html)
- **Hooks de Salvamento**: Atualizar as funções globais como `_saveOrcs()`, `_saveClientes()`, `_saveFornecedores()` e `_saveEventos()` para chamarem as respectivas funções `dbSaveX()` definidas no `db.js`.
- **Inicialização**: Modificar o ponto de carregamento inicial (onde `S` é populado) para chamar `await dbInit()`. Isso garantirá que o app carregue os dados do IndexedDB se disponíveis.
- **Fallback**: Manter o `localStorage` (via `_Vault`) como um fallback secundário durante esta fase de transição para evitar perda de dados.

## Plano de Verificação

### Testes Manuais (Via Browser)
1. **Verificação de Migração**:
   - Abrir o app com dados pré-existentes no `localStorage`.
   - Verificar no Console do Desenvolvedor se a mensagem `[DB] Migration complete` aparece.
   - Verificar na aba "Application > IndexedDB" se as stores estão populadas.
2. **Verificação de CRUD**:
   - Criar um novo orçamento e verificar se ele é salvo no IndexedDB.
   - Editar um cliente existente e verificar a atualização.
3. **Persistência Offline**:
   - Recarregar a página e garantir que o estado `S` seja populado corretamente a partir do IndexedDB.

## Perguntas Abertas
- **Limpeza do localStorage**: Devemos apagar os dados do `localStorage` após a migração bem-sucedida? 
  - *Recomendação*: Não agora. Vamos mantê-los por 1 ou 2 versões como backup antes de remover completamente.
